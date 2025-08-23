<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let isExiting = false;

	function goHome() {
		isExiting = true;
		setTimeout(() => {
			goto('/');
		}, 200); // Match the animation duration
	}

	function reload() {
		window.location.reload();
	}
</script>

<div class="page-holder">
	<div class="bsod-container page" class:page-exit={isExiting}>
		<!-- BSOD Header -->
		<div class="bsod-header">
			<div class="bsod-title mt-12">
				<h1>:(</h1>
				<span class="text-left text-xl font-[300]">Ubiquity ran into a problem and needs to reload.</span>
			</div>
		</div>
		<!-- Error Details -->
		<div class="error-details text-left">
			<span class="text-left">
				This page doesn't exist, If you think this is an error, please open an issue at <a
					href="https://www.github.com/god-s-perfect-idiot/ubiquity/issues"
					class="text-[#ff00ff]">my github</a
				>
			</span>

			<div class="stop-code">
				<p>Stop code: PAGE_NOT_FOUND</p>
				<p>Error: 0x000000404</p>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-row gap-4 w-full">
			<button class="text-white text-lg font-[300] border-2 border-white px-4 py-1" on:click={goHome}>
				<span class="btn-text">ubiquity home</span>
			</button>
			<button class="text-white text-lg font-[300] border-2 border-white px-4 py-1" on:click={reload}>
				<span class="btn-text">reload</span>
			</button>
		</div>
	</div>
</div>

<style>

    a {
        color: white;
        text-decoration: underline;
    }

	.bsod-container {
		min-height: 100vh;
		background: #ff00ff;
		color: white;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.bsod-header {
		text-align: left;
		margin-bottom: 2rem;
	}


	.bsod-title h1 {
		font-size: 6rem;
		font-weight: 300;
		margin: 0;
		margin-bottom: 1rem;
	}

	.bsod-title h2 {
		font-size: 1.5rem;
		font-weight: 400;
		margin: 0;
		margin-bottom: 0.5rem;
	}

	.bsod-title p {
		font-size: 1rem;
		opacity: 0.9;
		margin: 0;
	}

	.error-details {
		display: flex;
		justify-content: space-between;
		margin: 2rem 0;
		gap: 2rem;
	}

	.stop-code {
		flex: 1;
		text-align: right;
		font-family: 'Consolas', 'Monaco', monospace;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.action-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin: 2rem 0;
	}

	.bsod-btn {
		padding: 0.75rem 1.5rem;
		border: 2px solid white;
		background: transparent;
		color: white;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 4px;
		min-width: 120px;
	}

	.bsod-btn:hover {
		background: white;
		color: #0078d4;
	}

	.bsod-btn.primary {
		background: white;
		color: #0078d4;
	}

	.bsod-btn.primary:hover {
		background: rgba(255, 255, 255, 0.9);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	@keyframes progress {
		0% {
			width: 0%;
		}
		50% {
			width: 100%;
		}
		100% {
			width: 0%;
		}
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.bsod-container {
			padding: 1rem;
		}

		.bsod-title h1 {
			font-size: 4rem;
		}

		.bsod-title h2 {
			font-size: 1.2rem;
		}

		.error-details {
			flex-direction: column;
			text-align: left;
		}

		.stop-code {
			text-align: left;
		}

		.action-buttons {
			flex-direction: column;
			align-items: center;
		}

		.bsod-btn {
			width: 100%;
			max-width: 200px;
		}
	}
</style>
