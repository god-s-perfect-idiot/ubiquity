<script>
	import { onMount } from 'svelte';
	
	let isOnline = true;
	
	onMount(() => {
		// Check online status
		if (typeof window !== 'undefined') {
			isOnline = navigator.onLine;
			
			// Listen for online/offline events
			const handleOnline = () => {
				isOnline = true;
			};
			
			const handleOffline = () => {
				isOnline = false;
			};
			
			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
			
			return () => {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			};
		}
	});
</script>

<svelte:head>
	<title>Offline - Ubiquity</title>
</svelte:head>

<div class="offline-container">
	<div class="offline-content">
		<div class="offline-icon">
			<i class="fas fa-wifi" class:offline={!isOnline}></i>
		</div>
		
		<h1>You're Offline</h1>
		
		{#if isOnline}
			<p>Great! You're back online. The app should work normally now.</p>
			<button 
				class="retry-button" 
				on:click={() => {
					if (typeof window !== 'undefined') {
						window.location.reload();
					}
				}}
			>
				Refresh App
			</button>
		{:else}
			<p>It looks like you're not connected to the internet. Some features may not be available.</p>
			<p>Don't worry - you can still use the app with cached content!</p>
			
			<div class="offline-features">
				<h3>Available offline:</h3>
				<ul>
					<li>✓ Previously viewed pages</li>
					<li>✓ Cached data and settings</li>
					<li>✓ Basic app functionality</li>
				</ul>
			</div>
			
			<button 
				class="retry-button" 
				on:click={() => {
					if (typeof window !== 'undefined') {
						window.location.reload();
					}
				}}
			>
				Try Again
			</button>
		{/if}
	</div>
</div>

<style>
	.offline-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
		color: white;
		padding: 20px;
	}
	
	.offline-content {
		text-align: center;
		max-width: 500px;
		background: rgba(255, 255, 255, 0.05);
		padding: 40px;
		border-radius: 20px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.offline-icon {
		font-size: 4rem;
		margin-bottom: 20px;
		color: #3b82f6;
	}
	
	.offline-icon i.offline {
		color: #ef4444;
	}
	
	h1 {
		font-size: 2.5rem;
		margin-bottom: 20px;
		font-weight: 700;
	}
	
	p {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 20px;
		color: #d1d5db;
	}
	
	.offline-features {
		text-align: left;
		background: rgba(255, 255, 255, 0.05);
		padding: 20px;
		border-radius: 12px;
		margin: 20px 0;
	}
	
	.offline-features h3 {
		margin-bottom: 15px;
		color: #3b82f6;
	}
	
	.offline-features ul {
		list-style: none;
		padding: 0;
	}
	
	.offline-features li {
		padding: 5px 0;
		color: #d1d5db;
	}
	
	.retry-button {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 20px;
	}
	
	.retry-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
	}
	
	@media (max-width: 640px) {
		.offline-content {
			padding: 30px 20px;
		}
		
		h1 {
			font-size: 2rem;
		}
		
		.offline-icon {
			font-size: 3rem;
		}
	}
</style>
