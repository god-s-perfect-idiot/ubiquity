#!/usr/bin/env node

/**
 * Scour the web for photos not yet in the marketplace and add them,
 * attributed to the "App Finder Bot".
 *
 * Rotates search terms and paginates Wikimedia Commons results each run.
 *
 * Usage:
 *   node scripts/discover-photos.js [--limit=N] [--terms="mountain,ocean"] [--per-term=20] [--dry-run]
 */
import { ensureFirebaseConfig } from './lib/firebase.js';
import { loadMarketplace } from './lib/marketplace.js';
import { discoverPhotos } from './lib/scrape.js';
import {
	loadDiscoveryState,
	rotateTerms,
	getOffset,
	advanceOffset,
	PHOTO_TERMS
} from './lib/discovery-rotation.js';
import { runDiscoveryLoop } from './lib/discover-runner.js';
import { parseArgs, intArg, logHeader } from './lib/cli.js';

const args = parseArgs();
const limit = intArg(args.limit, 40);
const perTerm = intArg(args['per-term'], 20);
const dryRun = Boolean(args['dry-run']);
const termPool = (args.terms ? String(args.terms).split(',') : PHOTO_TERMS)
	.map((t) => t.trim())
	.filter(Boolean);

async function run() {
	ensureFirebaseConfig();
	logHeader('Discovering photos (App Finder Bot)');
	console.log(`Settings: limit=${limit} perTerm=${perTerm} dryRun=${dryRun}\n`);

	const existing = await loadMarketplace();
	const state = loadDiscoveryState();
	const terms = rotateTerms(state, 'photo', termPool, 4);

	let termIdx = 0;

	const { added, skipped, examined } = await runDiscoveryLoop({
		existing,
		type: 'image',
		limit,
		dryRun,
		state,
		maxRounds: terms.length * 4,
		fetchBatch: async () => {
			const term = terms[termIdx++ % terms.length];
			const offset = getOffset(state, 'photo', term);
			advanceOffset(state, 'photo', term, perTerm);
			console.log(`  batch: "${term}" offset ${offset}`);
			return discoverPhotos({ term, limit: perTerm, offset });
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
