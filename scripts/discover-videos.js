#!/usr/bin/env node

/**
 * Scour the web for videos not yet in the marketplace and add them,
 * attributed to the "App Finder Bot".
 *
 * Rotates search queries and paginates Internet Archive results each run.
 *
 * Usage:
 *   node scripts/discover-videos.js [--limit=N] [--queries="nasa,film"] [--per-query=10] [--dry-run]
 */
import { ensureFirebaseConfig } from './lib/firebase.js';
import { loadMarketplace } from './lib/marketplace.js';
import { discoverVideos } from './lib/scrape.js';
import {
	loadDiscoveryState,
	rotateTerms,
	getOffset,
	advanceOffset,
	VIDEO_QUERIES
} from './lib/discovery-rotation.js';
import { runDiscoveryLoop } from './lib/discover-runner.js';
import { parseArgs, intArg, logHeader } from './lib/cli.js';

const args = parseArgs();
const limit = intArg(args.limit, 25);
const perQuery = intArg(args['per-query'], 10);
const dryRun = Boolean(args['dry-run']);
const queryPool = (args.queries ? String(args.queries).split(',') : VIDEO_QUERIES)
	.map((q) => q.trim())
	.filter(Boolean);

async function run() {
	ensureFirebaseConfig();
	logHeader('Discovering videos (App Finder Bot)');
	console.log(`Settings: limit=${limit} perQuery=${perQuery} dryRun=${dryRun}\n`);

	const existing = await loadMarketplace();
	const state = loadDiscoveryState();
	const queries = rotateTerms(state, 'video', queryPool, 3);
	console.log(`  queries: [${queries.join(', ')}]\n`);

	let queryIdx = 0;

	const { added, skipped, examined } = await runDiscoveryLoop({
		existing,
		type: 'video',
		limit,
		dryRun,
		state,
		maxRounds: queries.length * 3,
		fetchBatch: async () => {
			const query = queries[queryIdx++ % queries.length];
			const page = getOffset(state, 'video', query) + 1;
			advanceOffset(state, 'video', query, 1);
			console.log(`  batch: "${query}" page ${page}`);
			return discoverVideos({ query, limit: perQuery, page });
		}
	});

	logHeader('Summary');
	console.log(`${dryRun ? 'Would add' : 'Added'}: ${added}`);
	console.log(`Skipped (already present): ${skipped}`);
	console.log(`Examined: ${examined}\n`);
}

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Fatal error:', err);
		process.exit(1);
	});
