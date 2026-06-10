#!/usr/bin/env node

/**
 * Run the full marketplace maintenance pipeline:
 *   1. Fix broken / low-quality thumbnails across all content types
 *   2. Discover and add missing apps, music, videos, photos, documents
 *
 * All discovered items are published as "App Finder Bot".
 *
 * Usage:
 *   node scripts/run-marketplace-bot.js [--dry-run] [--skip-fix] [--skip-discover]
 *
 * Per-step limits (optional):
 *   --fix-limit=N          max items to check for thumbnail fixes (default: all)
 *   --discover-limit=N     max new items per category (default: 25)
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseArgs, intArg, logHeader } from './lib/cli.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs();
const dryRun = Boolean(args['dry-run']);
const skipFix = Boolean(args['skip-fix']);
const skipDiscover = Boolean(args['skip-discover']);
const fixLimit = intArg(args['fix-limit'], Infinity);
const discoverLimit = intArg(args['discover-limit'], 25);

const fixExtra =
	Number.isFinite(fixLimit) && fixLimit !== Infinity ? ['--limit', String(fixLimit)] : [];

const STEPS = [
	{
		name: 'Fix thumbnails (all types)',
		script: 'fix-thumbnails.js',
		skip: skipFix,
		extra: fixExtra
	},
	{ name: 'Discover apps', script: 'discover-apps.js', skip: skipDiscover, extra: ['--limit', String(discoverLimit)] },
	{ name: 'Discover music', script: 'discover-music.js', skip: skipDiscover, extra: ['--limit', String(discoverLimit)] },
	{ name: 'Discover videos', script: 'discover-videos.js', skip: skipDiscover, extra: ['--limit', String(discoverLimit)] },
	{ name: 'Discover photos', script: 'discover-photos.js', skip: skipDiscover, extra: ['--limit', String(discoverLimit)] },
	{ name: 'Discover documents', script: 'discover-documents.js', skip: skipDiscover, extra: ['--limit', String(discoverLimit)] }
];

function runScript(script, extraArgs = []) {
	return new Promise((resolve, reject) => {
		const scriptPath = path.join(__dirname, script);
		const argv = [scriptPath, ...extraArgs];
		if (dryRun) argv.push('--dry-run');

		const child = spawn(process.execPath, argv, { stdio: 'inherit' });
		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${script} exited with code ${code}`));
		});
	});
}

async function run() {
	logHeader('Ubiquity Marketplace Bot');
	console.log(
		`dryRun=${dryRun} skipFix=${skipFix} skipDiscover=${skipDiscover} fixLimit=${fixLimit === Infinity ? 'all' : fixLimit} discoverLimit=${discoverLimit}\n`
	);

	for (const step of STEPS) {
		if (step.skip) {
			console.log(`\n⏭  Skipping: ${step.name}`);
			continue;
		}
		logHeader(step.name);
		await runScript(step.script, step.extra);
	}

	logHeader('Pipeline complete');
}

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Fatal error:', err.message || err);
		process.exit(1);
	});
