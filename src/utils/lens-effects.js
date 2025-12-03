/**
 * Apply lens effects to a canvas context or image data
 */

/**
 * Apply grayscale effect to canvas context
 */
export function applyGrayscale(ctx, width, height) {
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		// Calculate grayscale value using luminance formula
		const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
		data[i] = gray;     // R
		data[i + 1] = gray; // G
		data[i + 2] = gray; // B
		// Alpha channel (data[i + 3]) remains unchanged
	}

	ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply pixel art effect to canvas context
 * Creates a very pixelated retro look with large, visible square pixel blocks
 * @param {number} targetResolution - Target width/height to scale down to (smaller = more pixelated)
 */
export function applyPixelArt(ctx, width, height, targetResolution = 75) {
	// Scale down to a very small resolution, then scale back up
	// targetResolution = 20 means scale down to ~20 pixels on longest side
	// Smaller values = more pixelated effect (more chunky pixels)
	const scale = Math.max(width, height);
	const ratio = targetResolution / scale;
	const scaledWidth = Math.max(4, Math.floor(width * ratio));
	const scaledHeight = Math.max(4, Math.floor(height * ratio));

	// Create temporary canvas for the scaled-down version
	const tempCanvas = document.createElement('canvas');
	tempCanvas.width = scaledWidth;
	tempCanvas.height = scaledHeight;
	const tempCtx = tempCanvas.getContext('2d');

	// Disable image smoothing for crisp, blocky pixels
	tempCtx.imageSmoothingEnabled = false;
	tempCtx.imageSmoothingQuality = 'low';
	ctx.imageSmoothingEnabled = false;
	ctx.imageSmoothingQuality = 'low';

	// Scale down to tiny resolution (creates large pixel blocks)
	tempCtx.drawImage(ctx.canvas, 0, 0, scaledWidth, scaledHeight);
	
	// Clear the original canvas
	ctx.clearRect(0, 0, width, height);
	
	// Scale back up with nearest-neighbor interpolation - creates large, visible square pixels
	ctx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, width, height);
	
	// Re-enable smoothing for future operations
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
}

/**
 * Apply a lens effect to a canvas based on the lens configuration
 */
export function applyLensEffect(canvas, lens) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;

	if (!lens || !lens.applyFunction) {
		return; // No effect to apply
	}

	switch (lens.applyFunction) {
		case 'grayscale':
			applyGrayscale(ctx, width, height);
			break;
		case 'pixelart':
			applyPixelArt(ctx, width, height);
			break;
		default:
			// Unknown effect, do nothing
			break;
	}
}

