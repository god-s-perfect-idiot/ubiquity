/**
 * Shared loop for discovery scripts: keep scanning with rotation/pagination
 * until the add limit is met or max rounds are exhausted.
 */
import { buildDedupIndex, addDiscoveredItem } from './marketplace.js';
import { saveDiscoveryState } from './discovery-rotation.js';
import { sleep } from './cli.js';

/**
 * @param {object} opts
 * @param {import('./marketplace.js').MarketplaceItem[]} opts.existing
 * @param {string} opts.type - marketplace type for dedup
 * @param {number} opts.limit - target new items to add
 * @param {boolean} opts.dryRun
 * @param {object} opts.state - mutable discovery state (saved on success)
 * @param {(round: number) => Promise<Array<object>>} opts.fetchBatch - returns candidate records
 * @param {number} [opts.maxRounds=12]
 * @param {number} [opts.delayMs=250]
 */
export async function runDiscoveryLoop({
	existing,
	type,
	limit,
	dryRun,
	state,
	fetchBatch,
	maxRounds = 12,
	delayMs = 250
}) {
	const index = buildDedupIndex(existing, type);
	let added = 0;
	let skipped = 0;
	let examined = 0;

	for (let round = 0; round < maxRounds && added < limit; round++) {
		const batch = await fetchBatch(round);
		if (!batch.length) continue;

		for (const record of batch) {
			if (added >= limit) break;
			examined++;
			if (index.has(record)) {
				skipped++;
				continue;
			}
			if (dryRun) {
				console.log(`+ would add ${record.name}`);
			} else {
				const id = await addDiscoveredItem(record);
				console.log(`+ added ${record.name} -> ${id}`);
			}
			index.add(record);
			added++;
			await sleep(delayMs);
		}
	}

	if (!dryRun) saveDiscoveryState(state);

	return { added, skipped, examined, rounds: Math.min(maxRounds, added < limit ? maxRounds : added) };
}
