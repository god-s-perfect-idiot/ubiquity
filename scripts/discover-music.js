#!/usr/bin/env node

/**
 * Scour the web for music tracks not yet in the marketplace and add them,
 * attributed to the "App Finder Bot".
 *
 * Rotates search terms and iTunes chart genres each run (state in
 * scripts/.discovery-state.json).
 *
 * Usage:
 *   node scripts/discover-music.js [--limit=N] [--terms="jazz,lofi"] [--per-term=25] [--dry-run]
 */
import { ensureFirebaseConfig } from './lib/firebase.js';
import { loadMarketplace } from './lib/marketplace.js';
import { discoverMusic, discoverMusicCharts } from './lib/scrape.js';
import {
	loadDiscoveryState,
	rotateTerms,
	rotateIndex,
	MUSIC_TERMS,
	ITUNES_GENRES
} from './lib/discovery-rotation.js';
import { runDiscoveryLoop } from './lib/discover-runner.js';
import { parseArgs, intArg, logHeader } from './lib/cli.js';

const args = parseArgs();
const limit = intArg(args.limit, 40);
const perTerm = intArg(args['per-term'], 25);
const dryRun = Boolean(args['dry-run']);
const termPool = (args.terms ? String(args.terms).split(',') : MUSIC_TERMS)
	.map((t) => t.trim())
	.filter(Boolean);

async function run() {
	ensureFirebaseConfig();
	logHeader('Discovering music (App Finder Bot)');
	console.log(`Settings: limit=${limit} perTerm=${perTerm} dryRun=${dryRun}\n`);

	const existing = await loadMarketplace();
	const state = loadDiscoveryState();
	const terms = rotateTerms(state, 'music', termPool, 4);
	const genreId = ITUNES_GENRES[rotateIndex(state, 'music', 'genreIndex', ITUNES_GENRES.length)];
	console.log(`  terms: [${terms.join(', ')}]  chart genre: ${genreId ?? 'all'}\n`);

	let termIdx = 0;
	let usedChart = false;

	const { added, skipped, examined } = await runDiscoveryLoop({
		existing,
		type: 'music',
		limit,
		dryRun,
		state,
		maxRounds: terms.length + 2,
		fetchBatch: async (round) => {
			if (round === 0 && !usedChart) {
				usedChart = true;
				console.log(`  batch: iTunes top songs chart (genre=${genreId ?? 'all'})`);
				return discoverMusicCharts({ genreId, limit: perTerm });
			}
			const term = terms[termIdx++ % terms.length];
			console.log(`  batch: search "${term}"`);
			return discoverMusic({ term, limit: perTerm });
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
