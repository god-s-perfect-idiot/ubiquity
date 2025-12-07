/**
 * Apply lens effects to a canvas context or image data
 */

/**
 * Apply grayscale effect to canvas context
 */
export function applyGrayscale(ctx, width, height) {
	// Note: ctx should already be created with willReadFrequently: true
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
 * Apply tilt shift effect to canvas context
 * Creates a miniature model look by blurring top and bottom edges while keeping center in focus
 * Highly optimized for real-time video performance - uses low resolution processing
 * @param {number} focusHeight - Height of the focused area (0-1, as fraction of image height)
 * @param {number} transitionHeight - Height of the transition zone (0-1, as fraction of image height)
 * @param {number} blurAmount - Amount of blur to apply (pixels)
 */
export function applyTiltShift(ctx, width, height, focusHeight = 0.3, transitionHeight = 0.2, blurAmount = 8) {
	// Process at lower resolution for performance, then scale up
	const processScale = 0.4; // Process at 40% resolution for speed
	const processWidth = Math.max(32, Math.floor(width * processScale));
	const processHeight = Math.max(32, Math.floor(height * processScale));
	
	// Create processing canvas at lower resolution
	const processCanvas = document.createElement('canvas');
	processCanvas.width = processWidth;
	processCanvas.height = processHeight;
	const processCtx = processCanvas.getContext('2d', { willReadFrequently: true });
	processCtx.drawImage(ctx.canvas, 0, 0, processWidth, processHeight);
	
	// Save the original sharp image at processing resolution
	const originalCanvas = document.createElement('canvas');
	originalCanvas.width = processWidth;
	originalCanvas.height = processHeight;
	const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
	originalCtx.drawImage(processCanvas, 0, 0);

	// Apply blur using a faster approach: scale down, blur at tiny resolution, scale up
	// This is much faster than full-resolution blur while still looking smooth
	const blurScale = 0.25; // Scale down to 25% for blur
	const blurWidth = Math.max(16, Math.floor(processWidth * blurScale));
	const blurHeight = Math.max(16, Math.floor(processHeight * blurScale));
	
	const tempCanvas = document.createElement('canvas');
	tempCanvas.width = blurWidth;
	tempCanvas.height = blurHeight;
	const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
	tempCtx.drawImage(processCanvas, 0, 0, blurWidth, blurHeight);
	
	// Apply a small box blur at the tiny resolution (very fast)
	const blurRadius = 2; // Small radius for speed
	const imageData = tempCtx.getImageData(0, 0, blurWidth, blurHeight);
	const data = imageData.data;
	const newData = new Uint8ClampedArray(data.length);
	
	// Single horizontal blur pass only (faster than two-pass)
	for (let y = 0; y < blurHeight; y++) {
		for (let x = 0; x < blurWidth; x++) {
			let r = 0, g = 0, b = 0, a = 0, count = 0;
			
			for (let dx = -blurRadius; dx <= blurRadius; dx++) {
				const nx = x + dx;
				if (nx >= 0 && nx < blurWidth) {
					const idx = (y * blurWidth + nx) * 4;
					r += data[idx];
					g += data[idx + 1];
					b += data[idx + 2];
					a += data[idx + 3];
					count++;
				}
			}
			
			const idx = (y * blurWidth + x) * 4;
			newData[idx] = r / count;
			newData[idx + 1] = g / count;
			newData[idx + 2] = b / count;
			newData[idx + 3] = a / count;
		}
	}
	
	tempCtx.putImageData(new ImageData(newData, blurWidth, blurHeight), 0, 0);
	
	// Scale back up to processing resolution with smoothing (creates smooth blur effect)
	const blurredCanvas = document.createElement('canvas');
	blurredCanvas.width = processWidth;
	blurredCanvas.height = processHeight;
	const blurredCtx = blurredCanvas.getContext('2d', { willReadFrequently: true });
	blurredCtx.imageSmoothingEnabled = true;
	blurredCtx.imageSmoothingQuality = 'high';
	blurredCtx.drawImage(tempCanvas, 0, 0, processWidth, processHeight);

	// Calculate focus and transition zones (at processing resolution)
	const centerY = processHeight / 2;
	const focusSize = processHeight * focusHeight;
	const transitionSize = processHeight * transitionHeight;
	const focusTop = centerY - focusSize / 2;
	const focusBottom = centerY + focusSize / 2;
	const transitionTop = Math.max(0, focusTop - transitionSize);
	const transitionBottom = Math.min(processHeight, focusBottom + transitionSize);

	// Create simple gradient mask (at processing resolution)
	const maskCanvas = document.createElement('canvas');
	maskCanvas.width = processWidth;
	maskCanvas.height = processHeight;
	const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
	
	// Create gradient mask (white = sharp, black = blurred)
	const gradient = maskCtx.createLinearGradient(0, 0, 0, processHeight);
	
	// Top: fully blurred
	gradient.addColorStop(0, 'rgba(0,0,0,1)');
	
	// Top transition
	if (transitionTop > 0) {
		const topStop = transitionTop / processHeight;
		gradient.addColorStop(Math.max(0, topStop - 0.05), 'rgba(0,0,0,1)');
	}
	
	// Focus area: fully sharp
	const focusTopStop = focusTop / processHeight;
	const focusBottomStop = focusBottom / processHeight;
	gradient.addColorStop(focusTopStop, 'rgba(255,255,255,1)');
	gradient.addColorStop(focusBottomStop, 'rgba(255,255,255,1)');
	
	// Bottom transition
	if (transitionBottom < processHeight) {
		const bottomStop = transitionBottom / processHeight;
		gradient.addColorStop(focusBottomStop, 'rgba(255,255,255,1)');
		gradient.addColorStop(Math.min(1, bottomStop + 0.05), 'rgba(0,0,0,1)');
	}
	
	// Bottom: fully blurred
	gradient.addColorStop(1, 'rgba(0,0,0,1)');
	
	// Draw gradient mask
	maskCtx.fillStyle = gradient;
	maskCtx.fillRect(0, 0, processWidth, processHeight);
	
	// Use pixel-based blending for accurate mask application (at low resolution, this is fast)
	// Create result canvas first
	const resultCanvas = document.createElement('canvas');
	resultCanvas.width = processWidth;
	resultCanvas.height = processHeight;
	const resultCtx = resultCanvas.getContext('2d', { willReadFrequently: true });
	
	// Get image data for blending
	const maskData = maskCtx.getImageData(0, 0, processWidth, processHeight);
	const originalData = originalCtx.getImageData(0, 0, processWidth, processHeight);
	const blurredData = blurredCtx.getImageData(0, 0, processWidth, processHeight);
	const resultData = resultCtx.createImageData(processWidth, processHeight);
	
	// Blend based on mask luminance (white = sharp, black = blurred)
	for (let i = 0; i < maskData.data.length; i += 4) {
		// Use red channel as mask value (0-255, where 255 = fully sharp, 0 = fully blurred)
		const maskValue = maskData.data[i] / 255;
		const invMaskValue = 1 - maskValue;
		
		// Blend: sharp * maskValue + blurred * (1 - maskValue)
		resultData.data[i] = Math.round(originalData.data[i] * maskValue + blurredData.data[i] * invMaskValue); // R
		resultData.data[i + 1] = Math.round(originalData.data[i + 1] * maskValue + blurredData.data[i + 1] * invMaskValue); // G
		resultData.data[i + 2] = Math.round(originalData.data[i + 2] * maskValue + blurredData.data[i + 2] * invMaskValue); // B
		resultData.data[i + 3] = originalData.data[i + 3]; // Alpha (keep original)
	}
	
	// Draw the blended result
	resultCtx.putImageData(resultData, 0, 0);
	
	// Scale result back up to full resolution and draw to original canvas
	ctx.clearRect(0, 0, width, height);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'medium';
	ctx.drawImage(resultCanvas, 0, 0, width, height);
}

// Frame counter for expensive effects (like tilt shift)
let frameCounter = 0;

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
		case 'tiltshift':
			// Skip every other frame for tilt shift to improve performance
			frameCounter++;
			if (frameCounter % 2 === 0) {
				applyTiltShift(ctx, width, height);
			}
			break;
		default:
			// Unknown effect, do nothing
			break;
	}
}

