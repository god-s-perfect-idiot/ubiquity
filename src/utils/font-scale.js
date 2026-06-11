export const FONT_SCALE_MIN = 0.75;
export const FONT_SCALE_MAX = 1.5;
export const FONT_SCALE_STEPS = 8;
export const FONT_SCALE_DEFAULT = 1;

const LEGACY_FONT_SIZE_MAP = {
	small: 0.85,
	medium: 1,
	large: 1.15
};

export function normalizeFontScale(value) {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return clampFontScale(value);
	}

	if (typeof value === 'string' && value in LEGACY_FONT_SIZE_MAP) {
		return LEGACY_FONT_SIZE_MAP[value];
	}

	return FONT_SCALE_DEFAULT;
}

export function clampFontScale(scale) {
	return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
}

export function getFontScaleValues() {
	return Array.from({ length: FONT_SCALE_STEPS }, (_, index) => {
		const t = index / (FONT_SCALE_STEPS - 1);
		return FONT_SCALE_MIN + t * (FONT_SCALE_MAX - FONT_SCALE_MIN);
	});
}

export function scaleToStepIndex(scale) {
	const values = getFontScaleValues();
	const normalized = normalizeFontScale(scale);
	let closest = 0;
	let minDiff = Math.abs(values[0] - normalized);

	for (let i = 1; i < values.length; i++) {
		const diff = Math.abs(values[i] - normalized);
		if (diff < minDiff) {
			minDiff = diff;
			closest = i;
		}
	}

	return closest;
}

export function stepIndexToScale(index) {
	const values = getFontScaleValues();
	const clampedIndex = Math.min(FONT_SCALE_STEPS - 1, Math.max(0, index));
	return values[clampedIndex];
}

export function formatFontScale(scale) {
	return `${Math.round(normalizeFontScale(scale) * 100)}%`;
}

export function applyFontScale(scale) {
	if (typeof document === 'undefined') return;

	const normalizedScale = normalizeFontScale(scale);
	document.documentElement.style.setProperty('--font-scale', String(normalizedScale));
}
