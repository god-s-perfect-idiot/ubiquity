/**
 * Image fetching, decoding and quality validation helpers.
 *
 * These run on plain Node (>=18) using the global `fetch`. They are used to
 * decide whether a marketplace thumbnail is "functional" (loads and is a real
 * image) and "high quality" (large enough dimensions).
 */

const DEFAULT_TIMEOUT_MS = 12000;
const MAX_READ_BYTES = 512 * 1024; // enough to read image headers / small icons

export async function fetchBuffer(url, { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = MAX_READ_BYTES } = {}) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			redirect: 'follow',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (compatible; UbiquityMarketplaceBot/1.0; +https://github.com/)',
				Accept: 'image/avif,image/webp,image/*,*/*;q=0.8'
			}
		});
		const contentType = (res.headers.get('content-type') || '').toLowerCase();
		if (!res.ok) {
			return { ok: false, status: res.status, contentType, buffer: null };
		}
		const reader = res.body?.getReader?.();
		if (!reader) {
			const arr = new Uint8Array(await res.arrayBuffer());
			return { ok: true, status: res.status, contentType, buffer: Buffer.from(arr.slice(0, maxBytes)) };
		}
		const chunks = [];
		let received = 0;
		while (received < maxBytes) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(Buffer.from(value));
			received += value.length;
		}
		try {
			await reader.cancel();
		} catch {
			// ignore
		}
		return { ok: true, status: res.status, contentType, buffer: Buffer.concat(chunks) };
	} catch (err) {
		return { ok: false, status: 0, contentType: '', buffer: null, error: err?.message };
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Decode image dimensions from the leading bytes of common formats.
 * Returns { width, height, type } or null if unrecognised.
 */
export function getImageSize(buffer) {
	if (!buffer || buffer.length < 8) return null;

	// PNG
	if (
		buffer[0] === 0x89 &&
		buffer[1] === 0x50 &&
		buffer[2] === 0x4e &&
		buffer[3] === 0x47
	) {
		return { type: 'png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
	}

	// GIF
	if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
		return { type: 'gif', width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
	}

	// BMP
	if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
		return {
			type: 'bmp',
			width: buffer.readInt32LE(18),
			height: Math.abs(buffer.readInt32LE(22))
		};
	}

	// WEBP (RIFF .... WEBP)
	if (
		buffer.length >= 30 &&
		buffer.toString('ascii', 0, 4) === 'RIFF' &&
		buffer.toString('ascii', 8, 12) === 'WEBP'
	) {
		const format = buffer.toString('ascii', 12, 16);
		if (format === 'VP8 ') {
			return {
				type: 'webp',
				width: buffer.readUInt16LE(26) & 0x3fff,
				height: buffer.readUInt16LE(28) & 0x3fff
			};
		}
		if (format === 'VP8L') {
			const b = buffer.readUInt32LE(21);
			return {
				type: 'webp',
				width: (b & 0x3fff) + 1,
				height: ((b >> 14) & 0x3fff) + 1
			};
		}
		if (format === 'VP8X') {
			const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
			const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
			return { type: 'webp', width, height };
		}
	}

	// ICO (take the largest declared entry)
	if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
		const count = buffer.readUInt16LE(4);
		let best = null;
		for (let i = 0; i < count; i++) {
			const off = 6 + i * 16;
			if (off + 1 >= buffer.length) break;
			const w = buffer[off] === 0 ? 256 : buffer[off];
			const h = buffer[off + 1] === 0 ? 256 : buffer[off + 1];
			if (!best || w * h > best.width * best.height) best = { width: w, height: h };
		}
		if (best) return { type: 'ico', ...best };
	}

	// JPEG
	if (buffer[0] === 0xff && buffer[1] === 0xd8) {
		let offset = 2;
		while (offset + 9 < buffer.length) {
			if (buffer[offset] !== 0xff) {
				offset++;
				continue;
			}
			const marker = buffer[offset + 1];
			// SOF markers carry dimensions (skip non-SOF and DHT/DAC/RST)
			if (
				marker >= 0xc0 &&
				marker <= 0xcf &&
				marker !== 0xc4 &&
				marker !== 0xc8 &&
				marker !== 0xcc
			) {
				return {
					type: 'jpeg',
					height: buffer.readUInt16BE(offset + 5),
					width: buffer.readUInt16BE(offset + 7)
				};
			}
			const segLen = buffer.readUInt16BE(offset + 2);
			if (segLen <= 0) break;
			offset += 2 + segLen;
		}
	}

	// SVG (text based, treated as scalable / high quality)
	const head = buffer.toString('utf8', 0, Math.min(buffer.length, 256)).trim().toLowerCase();
	if (head.startsWith('<?xml') || head.startsWith('<svg')) {
		return { type: 'svg', width: Infinity, height: Infinity };
	}

	return null;
}

/**
 * Validate that a thumbnail URL is functional and high quality.
 * @param {string} url
 * @param {object} opts
 * @param {number} opts.minSide minimum acceptable width/height in px (default 128)
 * @returns {Promise<{ok:boolean, hq:boolean, reason?:string, width?:number, height?:number, type?:string}>}
 */
export async function validateThumbnail(url, { minSide = 128, timeoutMs } = {}) {
	if (!url || typeof url !== 'string') {
		return { ok: false, hq: false, reason: 'missing' };
	}
	if (!/^https?:\/\//i.test(url)) {
		return { ok: false, hq: false, reason: 'invalid-url' };
	}

	const res = await fetchBuffer(url, timeoutMs ? { timeoutMs } : {});
	if (!res.ok) {
		return { ok: false, hq: false, reason: res.error ? `fetch-error:${res.error}` : `http-${res.status}` };
	}
	if (res.contentType && !res.contentType.startsWith('image/') && !res.contentType.includes('svg')) {
		return { ok: false, hq: false, reason: `not-image:${res.contentType}` };
	}

	const size = getImageSize(res.buffer);
	if (!size) {
		// Content-type claims image but we could not decode it -> treat as functional but unknown quality
		const looksImage = res.contentType.startsWith('image/');
		return {
			ok: looksImage,
			hq: false,
			reason: looksImage ? 'undecodable' : 'unknown-format',
			type: res.contentType
		};
	}

	const small = Math.min(size.width, size.height);
	return {
		ok: true,
		hq: small >= minSide,
		width: size.width,
		height: size.height,
		type: size.type,
		reason: small >= minSide ? undefined : `low-res:${size.width}x${size.height}`
	};
}
