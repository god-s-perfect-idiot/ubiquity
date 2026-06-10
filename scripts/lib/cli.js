/**
 * Minimal CLI argument parser shared by the marketplace scripts.
 *
 * Supports:
 *   --flag           -> { flag: true }
 *   --key=value      -> { key: 'value' }
 *   --key value      -> { key: 'value' }
 */
export function parseArgs(argv = process.argv.slice(2)) {
	const args = {};
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (!token.startsWith('--')) continue;
		const body = token.slice(2);
		const eq = body.indexOf('=');
		if (eq !== -1) {
			args[body.slice(0, eq)] = body.slice(eq + 1);
		} else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
			args[body] = argv[++i];
		} else {
			args[body] = true;
		}
	}
	return args;
}

export function intArg(value, fallback) {
	const n = parseInt(value, 10);
	return Number.isFinite(n) ? n : fallback;
}

export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function logHeader(title) {
	console.log(`\n${title}`);
	console.log('-'.repeat(title.length));
}
