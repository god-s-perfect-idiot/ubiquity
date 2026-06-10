#!/usr/bin/env node

/**
 * Find marketplace items (apps, music, videos, photos, documents) whose
 * thumbnail/icon is missing, broken, or low quality, then replace it with a
 * high-quality one.
 *
 * Thumbnail re-resolution strategy by type:
 *   app                 -> Microlink logo / favicon services (resolveAppThumbnail)
 *   music/video/image   -> Microlink og:image of the item source
 *   document            -> Microlink og:image of the source page
 *
 * Usage:
 *   node scripts/fix-thumbnails.js [--type=app] [--min-side=128] [--limit=N] [--dry-run]
 *
 * Flags:
 *   --type       restrict to one type (app|music|image|video|document)
 *   --min-side   minimum px on the short side to count as "HQ" (default 128)
 *   --limit      only process the first N matching items
 *   --dry-run    report what would change without writing to Firestore
 */
import { ensureFirebaseConfig } from './lib/firebase.js';
import { loadMarketplace, updateItemIcon } from './lib/marketplace.js';
import { validateThumbnail } from './lib/images.js';
import { resolveItemThumbnail } from './lib/scrape.js';
import { parseArgs, intArg, logHeader, sleep } from './lib/cli.js';

const args = parseArgs();
const minSide = intArg(args['min-side'], 128);
const dryRun = Boolean(args['dry-run']);
const typeFilter = args.type || null;
const limit = intArg(args.limit, Infinity);

async function run() {
	ensureFirebaseConfig();
	logHeader('Marketplace thumbnail audit');
	console.log(
		`Settings: type=${typeFilter || 'all'} minSide=${minSide}px dryRun=${dryRun} limit=${
			limit === Infinity ? 'all' : limit
		}\n`
	);

	const all = await loadMarketplace();
	const items = (typeFilter ? all.filter((i) => i.type === typeFilter) : all).filter(
		(i) => i.isPublic !== false
	);
	console.log(`Loaded ${all.length} marketplace items (${items.length} in scope).\n`);

	let checked = 0;
	let bad = 0;
	let fixed = 0;
	let unresolved = 0;

	for (const item of items) {
		if (checked >= limit) break;
		checked++;

		const current = await validateThumbnail(item.icon, { minSide });
		if (current.ok && current.hq) continue;

		bad++;
		const dims = current.width ? ` (${current.width}x${current.height})` : '';
		console.log(`✗ ${item.type}/${item.name}: ${current.reason || 'low quality'}${dims}`);

		const replacement = await resolveItemThumbnail(item, { minSide });
		if (!replacement || replacement === item.icon) {
			unresolved++;
			console.log('   → no better thumbnail found');
			await sleep(200);
			continue;
		}

		if (dryRun) {
			console.log(`   → would set: ${replacement}`);
		} else {
			await updateItemIcon(item.id, replacement);
			console.log(`   → updated:   ${replacement}`);
		}
		fixed++;
		await sleep(200);
	}

	logHeader('Summary');
	console.log(`Checked:    ${checked}`);
	console.log(`Bad/low-q:  ${bad}`);
	console.log(`${dryRun ? 'Would fix' : 'Fixed'}:   ${fixed}`);
	console.log(`Unresolved: ${unresolved}\n`);
}

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Fatal error:', err);
		process.exit(1);
	});
