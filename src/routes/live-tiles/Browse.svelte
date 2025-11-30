<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { accentColorStore, borderColorClassStore } from '../../utils/theme';
	import Button from '../../components/Button.svelte';
	import Loader from '../../components/Loader.svelte';
	import { addToast } from '../../store/toast';
	import { appInfoStore } from '../../store/appInfo';
	import Icon from '@iconify/svelte';

	export let app = null;
	export let isExiting = false;
	export const onBack = () => {};
	export let onSelect = (tile) => {};

	$: borderClass = $borderColorClassStore;
	$: accentColor = $accentColorStore;

	let isLoading = false;
	let tiles = [];
	let selectedTile = null;

	// Flip animation state for each tile
	let tileFlipStates = {};

	// Get app info for tile back side
	$: appInfo = app
		? appInfoStore.getAppInfo(app.name) ||
			appInfoStore.getAppInfo(app.content) ||
			appInfoStore.getAppInfo(app.url) ||
			{}
		: {};
	$: appBgColor = appInfo?.bgColor || appInfo?.backgroundColor || accentColor;
	$: appIcon = appInfo?.icon || app?.icon || null;

	// Tile dimensions for preview
	const PREVIEW_4X2_HEIGHT = 180;
	const PREVIEW_2X2_WIDTH = 180;
	const PREVIEW_2X2_HEIGHT = 180;

	async function loadTiles() {
		const appUrl = app?.url || app?.content;
		if (!appUrl) return;

		isLoading = true;
		try {
			const response = await fetch(`/api/livetiles?url=${encodeURIComponent(appUrl)}&limit=50`);
			const data = await response.json();

			if (data.success) {
				tiles = data.tiles || [];
				if (tiles.length === 0) {
					addToast('No live tiles found for this app', 'info');
				}
			} else {
				throw new Error(data.error || 'Failed to load live tiles');
			}
		} catch (error) {
			console.error('Error loading live tiles:', error);
			addToast('Failed to load live tiles');
			tiles = [];
		} finally {
			isLoading = false;
		}
	}

	function selectTile(tile) {
		selectedTile = tile;
	}

	async function useTile() {
		if (selectedTile) {
			// Increment download count
			try {
				await fetch(`/api/livetiles/${selectedTile.id}/download`, {
					method: 'POST'
				});
			} catch (error) {
				console.error('Error incrementing download count:', error);
				// Don't fail the operation if download count increment fails
			}

			onSelect(selectedTile);
		}
	}

	// Start flip animation for a tile - flips between 4x2 and 2x2 every 2 seconds
	function startFlipAnimation(tileId) {
		if (!tileFlipStates[tileId]) {
			tileFlipStates[tileId] = {
				showing2x2: false,
				isFlipping: false,
				timer: null
			};
		}

		const state = tileFlipStates[tileId];
		const tile = tiles.find((t) => t.id === tileId);
		if (!tile || !tile.tile4x2) return;

		// Clear existing timer
		if (state.timer) {
			clearTimeout(state.timer);
			state.timer = null;
		}

		// Flip every 2 seconds
		const timer = setTimeout(() => {
			// Only flip if tile has both 4x2 and 2x2
			if (!tile.tile2x2) {
				// No 2x2 tile, don't flip - just restart timer
				startFlipAnimation(tileId);
				return;
			}

			// Start flip animation
			const newShowing2x2 = !state.showing2x2;
			tileFlipStates = {
				...tileFlipStates,
				[tileId]: {
					...state,
					showing2x2: newShowing2x2,
					isFlipping: true
				}
			};

			// After flip animation completes (0.8s), mark as not flipping
			setTimeout(() => {
				const currentState = tileFlipStates[tileId];
				if (!currentState) return;

				tileFlipStates = {
					...tileFlipStates,
					[tileId]: {
						...currentState,
						isFlipping: false
					}
				};

				// Schedule next flip in 2 seconds
				setTimeout(() => {
					startFlipAnimation(tileId);
				}, 1000);
			}, 800); // Flip animation duration
		}, 1000);

		state.timer = timer;
	}

	// Stop flip animation for a tile
	function stopFlipAnimation(tileId) {
		const state = tileFlipStates[tileId];
		if (!state) return;

		if (state.timer) {
			clearTimeout(state.timer);
			state.timer = null;
		}
		state.isFlipping = false;
	}

	// Initialize flip animations for tiles when they load
	$: if (tiles.length > 0) {
		// Initialize and start animations for all tiles with 4x2 content
		tiles.forEach((tile) => {
			if (tile.tile4x2 && !tileFlipStates[tile.id]) {
				// Initialize state only if it doesn't exist
				tileFlipStates = {
					...tileFlipStates,
					[tile.id]: {
						showing2x2: false,
						isFlipping: false,
						timer: null
					}
				};

				// Start animation after a delay
				tick().then(() => {
					setTimeout(() => startFlipAnimation(tile.id), 500);
				});
			}
		});
	}

	onMount(() => {
		loadTiles();
	});

	onDestroy(() => {
		// Clean up all timers
		Object.keys(tileFlipStates).forEach((tileId) => {
			stopFlipAnimation(tileId);
		});
	});
</script>

<div class="page-holder">
	<div class="page pt-4 flex flex-col h-screen overflow-y-auto" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] truncate lowercase pb-8 h-auto px-4"
			>{app?.name || 'Browse Live Tiles'}</span
		>

		<div class="flex flex-col gap-6 flex-1 overflow-y-auto pb-24 px-4">
			{#if isLoading}
				<div class="flex justify-center items-center py-12">
					<Loader />
				</div>
			{:else if tiles.length === 0}
				<div class="flex flex-col gap-4 items-center justify-center py-12">
					<span class="text-base font-[300] text-[#767676]"
						>No live tiles found for this app. Be the first to
						<span style="color: {accentColor};">publish one</span>!</span
					>
				</div>
			{:else}
				<div class="flex flex-col gap-6">
					<span class="text-base font-[300] text-[#767676]"
						>Tap on any live tile you like to use it.</span
					>

					{#each tiles as tile (tile.id)}
						{@const isSelected = selectedTile?.id === tile.id}
						<div class="flex flex-col">
							<button
								type="button"
								class="flex flex-col gap-4 transition-all text-left"
								on:click={() => selectTile(tile)}
								on:keydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										selectTile(tile);
									}
								}}
								aria-pressed={isSelected}
								aria-label={`Select live tile for ${tile.appName || 'this app'}`}
							>
								<div class="flex flex-row gap-4 justify-between items-start">
									<div class="flex flex-col gap-2 h-full">
										<div class="flex flex-row justify-center items-center h-full gap-2 text-base">
											{#if tile.owner}
												<span class="text-lg font-[300] lowercase" style="color: {accentColor};"
													>{tile.owner}</span
												>
											{/if}
											{#if tile.downloads !== undefined}
												<span class="text-lg text-[#767676]">{tile.downloads} uses</span>
											{/if}
										</div>
									</div>
								</div>

								{#if tile.tile4x2}
									{@const flipState = tileFlipStates[tile.id] || {
										showing2x2: false,
										isFlipping: false
									}}
									<div class="flex flex-col gap-2">
										<div
											class="relative overflow-hidden w-full"
											style="height: {PREVIEW_4X2_HEIGHT}px; background: #000000;"
										>
											<div
												class="live-tile-preview-container w-full h-full"
												class:flipped={flipState.showing2x2}
											>
												<!-- Front: 4x2 tile -->
												<div class="live-tile-preview-front absolute inset-0 w-full h-full">
													<div class="w-full h-full custom-live-tile">
														{@html tile.tile4x2}
													</div>
												</div>

												<!-- Back: 2x2 tile left-aligned -->
												{#if tile.tile2x2}
													<div
														class="live-tile-preview-back absolute inset-0 w-full h-full flex items-center justify-start"
														style="background: #000000; padding-left: 0;"
													>
														<div
															class="relative overflow-hidden"
															style="width: {PREVIEW_2X2_WIDTH}px; height: {PREVIEW_2X2_HEIGHT}px; background: #000000;"
														>
															<div class="w-full h-full custom-live-tile">
																{@html tile.tile2x2}
															</div>
														</div>
													</div>
												{:else}
													<!-- Fallback: App icon and name if no 2x2 tile -->
													<div
														class="live-tile-preview-back absolute inset-0 w-full h-full flex flex-col items-center justify-center"
														style="background: {appBgColor};"
													>
														<div class="flex flex-col items-center justify-center gap-2">
															{#if appIcon && (appIcon.startsWith('http://') || appIcon.startsWith('https://'))}
																<img
																	src={appIcon}
																	alt="{app?.name || 'App'} icon"
																	class="w-8 h-8 object-contain"
																	on:error={(e) => {
																		e.target.style.display = 'none';
																		if (e.target.nextElementSibling) {
																			e.target.nextElementSibling.style.display = 'flex';
																		}
																	}}
																/>
																<span
																	class="w-8 h-8 justify-center items-center flex text-white font-[300] hidden"
																	style="background: {appBgColor};">{(app?.name || tile.appName || 'A').charAt(0).toUpperCase()}</span
																>
															{:else if appIcon}
																<Icon icon={appIcon} width="16" height="16" class="text-white" />
															{:else}
																<span
																	class="w-8 h-8 justify-center items-center flex text-white font-[300]"
																	style="background: {appBgColor};">{(app?.name || tile.appName || 'A').charAt(0).toUpperCase()}</span
																>
															{/if}
															<span
																class="text-base font-medium text-white absolute bottom-2 left-2"
																>{app?.name || tile.appName}</span
															>
														</div>
													</div>
												{/if}
											</div>
										</div>
									</div>
								{/if}
							</button>

							<!-- Use button appears right under selected tile -->
							{#if isSelected}
								<div class="use-button-container expanded">
									<div class="use-button-content">
										<Button text="use this tile" onClick={useTile} />
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.live-tile-preview-container {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		-webkit-transform-style: preserve-3d;
		transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: center center;
		transform: rotateX(0deg);
	}

	.live-tile-preview-front,
	.live-tile-preview-back {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		transform-style: preserve-3d;
		-webkit-transform-style: preserve-3d;
	}

	.live-tile-preview-front {
		transform: rotateX(0deg) translateZ(0);
		-webkit-transform: rotateX(0deg) translateZ(0);
	}

	.live-tile-preview-back {
		transform: rotateX(180deg) translateZ(0);
		-webkit-transform: rotateX(180deg) translateZ(0);
	}

	/* Flipped state - showing back (2x2) */
	.live-tile-preview-container.flipped {
		transform: rotateX(180deg);
		-webkit-transform: rotateX(180deg);
	}

	/* Use button container with height animation */
	.use-button-container {
		max-height: 0;
		overflow: hidden;
		transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.use-button-container.expanded {
		max-height: 100px;
	}

	.use-button-content {
		padding-top: 1rem;
		padding-bottom: 0.5rem;
		display: flex;
		justify-content: flex-start;
		animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
