import { RESULT_GROUPS, RESULT_ACTIONS } from './search-types.js';

const MATH_PREFIX = /^=\s*/;
const MATH_CHARS = /^[\d\s+\-*/().%^eE]+$/;

const UNIT_ALIASES = {
	km: 'km',
	kilometer: 'km',
	kilometers: 'km',
	kilometre: 'km',
	kilometres: 'km',
	mi: 'miles',
	mile: 'miles',
	miles: 'miles',
	m: 'meters',
	meter: 'meters',
	meters: 'meters',
	metre: 'meters',
	metres: 'meters',
	ft: 'feet',
	foot: 'feet',
	feet: 'feet',
	c: 'celsius',
	celsius: 'celsius',
	f: 'fahrenheit',
	fahrenheit: 'fahrenheit',
	kg: 'kg',
	kilogram: 'kg',
	kilograms: 'kg',
	lb: 'lbs',
	lbs: 'lbs',
	pound: 'lbs',
	pounds: 'lbs',
	gb: 'gb',
	gigabyte: 'gb',
	gigabytes: 'gb',
	mb: 'mb',
	megabyte: 'mb',
	megabytes: 'mb'
};

const CONVERTERS = {
	'km-miles': (v) => v * 0.621371,
	'miles-km': (v) => v * 1.60934,
	'meters-feet': (v) => v * 3.28084,
	'feet-meters': (v) => v / 3.28084,
	'celsius-fahrenheit': (v) => (v * 9) / 5 + 32,
	'fahrenheit-celsius': (v) => ((v - 32) * 5) / 9,
	'kg-lbs': (v) => v * 2.20462,
	'lbs-kg': (v) => v / 2.20462,
	'gb-mb': (v) => v * 1024,
	'mb-gb': (v) => v / 1024
};

function formatNumber(value) {
	if (!Number.isFinite(value)) return null;
	const rounded = Math.round(value * 1e6) / 1e6;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(4).replace(/\.?0+$/, '');
}

function safeEvaluateMath(expression) {
	const expr = expression.replace(MATH_PREFIX, '').trim();
	if (!expr || !MATH_CHARS.test(expr)) return null;

	try {
		const normalized = expr.replace(/\^/g, '**');
		const result = Function(`"use strict"; return (${normalized})`)();
		if (typeof result !== 'number' || !Number.isFinite(result)) return null;
		return formatNumber(result);
	} catch {
		return null;
	}
}

function tryUnitConversion(query) {
	const match = query.match(
		/^([\d.]+)\s*([a-zA-Z]+)\s+(?:to|in)\s+([a-zA-Z]+)$/i
	);
	if (!match) return null;

	const value = parseFloat(match[1]);
	const from = UNIT_ALIASES[match[2].toLowerCase()];
	const to = UNIT_ALIASES[match[3].toLowerCase()];
	if (!from || !to || from === to) return null;

	const key = `${from}-${to}`;
	const converter = CONVERTERS[key];
	if (!converter) return null;

	const result = converter(value);
	const formatted = formatNumber(result);
	if (!formatted) return null;

	return {
		title: `${formatted} ${match[3]}`,
		description: `${match[1]} ${match[2]} = ${formatted} ${match[3]}`
	};
}

function tryDateTime(query) {
	const lower = query.toLowerCase().trim();
	if (!['now', 'time', 'date', 'today'].includes(lower)) return null;

	const now = new Date();
	const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	const date = now.toLocaleDateString([], {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	return {
		title: time,
		description: date
	};
}

function makeSmartResult({
	title,
	description,
	action = RESULT_ACTIONS.COPY,
	url = '',
	icon = 'mdi:calculator'
}) {
	return {
		id: `smart-${title}`,
		title,
		subtitle: 'Calculator',
		description,
		url,
		action,
		type: RESULT_GROUPS.SMART,
		icon,
		iconify: icon,
		bgClass: 'bg-green-800',
		bgStyle: '',
		category: RESULT_GROUPS.SMART,
		engine: 'Ubiquity',
		score: 1000
	};
}

/**
 * Evaluate calculator, unit conversion, and quick answers.
 * @param {string} query
 * @returns {Array<Object>}
 */
export function evaluateSmartSearch(query) {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const results = [];

	const mathBody = trimmed.replace(MATH_PREFIX, '').trim();
	const looksLikeMath =
		MATH_PREFIX.test(trimmed) || (mathBody.length > 0 && MATH_CHARS.test(mathBody));

	if (looksLikeMath) {
		const mathResult = safeEvaluateMath(trimmed);
		if (mathResult !== null) {
			results.push(
				makeSmartResult({
					title: mathResult,
					description: `${trimmed.replace(MATH_PREFIX, '')} = ${mathResult}`
				})
			);
		}
	}

	const unit = tryUnitConversion(trimmed);
	if (unit) {
		results.push(makeSmartResult(unit));
	}

	const dateTime = tryDateTime(trimmed);
	if (dateTime) {
		results.push(
			makeSmartResult({
				...dateTime,
				icon: 'mdi:clock-outline',
				action: RESULT_ACTIONS.NAVIGATE,
				url: '/clock'
			})
		);
	}

	// "search web for ..." quick action
	const webMatch = trimmed.match(/^search(?:\s+the)?\s+web\s+for\s+(.+)$/i);
	if (webMatch?.[1]) {
		results.push(
			makeSmartResult({
				title: `Search the web for "${webMatch[1]}"`,
				description: 'Run a web search',
				icon: 'mdi:web',
				action: RESULT_ACTIONS.SEARCH_WEB,
				url: webMatch[1].trim()
			})
		);
	}

	return results;
}
