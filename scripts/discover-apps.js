#!/usr/bin/env node

/**
 * Scour the web for popular web apps not yet in the marketplace and add them,
 * attributed to the "App Finder Bot".
 *
 * Rotates through multiple Wikipedia lists/categories and advances a saved
 * cursor each run so repeat invocations find new candidates.
 *
 * Usage:
 *   node scripts/discover-apps.js [--limit=N] [--min-side=128] [--dry-run] [--enrich]
 *
 * Note: --enrich calls Microlink per site for titles/descriptions (slow).
 *       Without it, Wikipedia names + favicon/logo services are used instead.
 */
import { ensureFirebaseConfig } from './lib/firebase.js';
import {
	loadMarketplace,
	buildDedupIndex,
	addDiscoveredItem,
	domainOf
} from './lib/marketplace.js';
import { discoverAppsRotating, microlinkMeta, resolveAppThumbnail } from './lib/scrape.js';
import { loadDiscoveryState, saveDiscoveryState } from './lib/discovery-rotation.js';
import { parseArgs, intArg, logHeader, sleep } from './lib/cli.js';

const args = parseArgs();
const limit = intArg(args.limit, 40);
const minSide = intArg(args['min-side'], 128);
const dryRun = Boolean(args['dry-run']);
const enrich = Boolean(args.enrich);

async function enrichCandidate(candidate) {
	if (enrich) {
		const meta = await microlinkMeta(candidate.url).catch(() => null);
		const thumb = await resolveAppThumbnail(candidate.url, { minSide, meta });
		return {
			type: 'app',
			name: meta?.title?.split('|')[0].trim() || candidate.name,
			description:
				meta?.description ||
				`${candidate.name} is a popular website at ${candidate.domain}.`,
			source: candidate.url,
			icon: thumb?.url || '',
			background: '#ffffff',
			category: 'general',
			tags: [
				candidate.name.toLowerCase(),
				candidate.domain,
				domainOf(candidate.url).split('.')[0]
			]
		};
	}

	// Fast path: favicon/logo services only (no Microlink round-trip).
	const thumb = await resolveAppThumbnail(candidate.url, { minSide, fast: true });
	return {
		type: 'app',
		name: candidate.name,
		description: `${candidate.name} — popular website at ${candidate.domain}.`,
		source: candidate.url,
		icon: thumb?.url || '',
		background: '#ffffff',
		category: 'general',
		tags: [
			candidate.name.toLowerCase(),
			candidate.domain,
			domainOf(candidate.url).split('.')[0]
		]
	};
}

async function run() {
	ensureFirebaseConfig();
	logHeader('Discovering apps (App Finder Bot)');
	console.log(
		`Settings: limit=${limit} minSide=${minSide}px enrich=${enrich} dryRun=${dryRun}\n`
	);

	const existing = await loadMarketplace();
	const state = loadDiscoveryState();
	const index = buildDedupIndex(existing, 'app');

	let added = 0;
	let skipped = 0;
	const maxRounds = 15;

	for (let round = 0; round < maxRounds && added < limit; round++) {
		const { candidates, source, offset } = await discoverAppsRotating(state, {
			batchSize: Math.max(limit, 30)
		});
		console.log(`\n  batch from ${source} @ offset ${offset} (${candidates.length} candidates)`);

		let newInBatch = 0;
		for (const candidate of candidates) {
			if (added >= limit) break;

			const stub = { name: candidate.name, source: candidate.url };
			if (index.has(stub) || index.has({ source: `https://www.${candidate.domain}` })) {
				skipped++;
				continue;
			}

			newInBatch++;
			process.stdout.write(`  → ${candidate.domain} ... `);

			const record = await enrichCandidate(candidate);

			if (dryRun) {
				console.log(`would add "${record.name}"`);
			} else {
				const id = await addDiscoveredItem(record);
				console.log(`added "${record.name}" (${id})`);
			}

			index.add(record);
			added++;
			await sleep(150);
		}

		if (!newInBatch) {
			console.log('  (all candidates in this batch already present)');
		}
	}

	if (!dryRun) saveDiscoveryState(state);

	logHeader('Summary');
	console.log(`${dryRun ? 'Would add' : 'Added'}: ${added}`);
	console.log(`Skipped (already present): ${skipped}\n`);
}

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Fatal error:', err);
		process.exit(1);
	});
