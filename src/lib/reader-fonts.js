export const READER_FONTS = {
	readerly: {
		id: 'readerly',
		label: 'Readerly',
		family: "'Readerly', Georgia, serif"
	},
	sourcerer: {
		id: 'sourcerer',
		label: 'Sourcerer',
		family: "'Sourcerer', Georgia, serif"
	},
	cartisse: {
		id: 'cartisse',
		label: 'Cartisse',
		family: "'Cartisse', Georgia, serif"
	}
};

export const READER_FONT_ORDER = ['readerly', 'sourcerer', 'cartisse'];

export function getReaderFontFamily(fontId) {
	return READER_FONTS[fontId]?.family ?? READER_FONTS.readerly.family;
}

export function getNextReaderFont(fontId) {
	const index = READER_FONT_ORDER.indexOf(fontId);
	const next = index === -1 ? 0 : (index + 1) % READER_FONT_ORDER.length;
	return READER_FONT_ORDER[next];
}
