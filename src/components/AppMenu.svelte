<div
	class="animated-div bg-white w-full flex flex-col text-black font-[300] pl-4 pt-4 pb-16 gap-4 z-10 absolute top-1"
>
	<span>add new file</span>
	<span>pin to start</span>
	<span>uninstall</span>
</div>

<style>
	.animated-div {
		animation: expand 1s ease-out forwards;
		overflow: hidden;
		max-height: 0;
	}

	@keyframes expand {
		from {
			max-height: 0;
		}
		to {
			max-height: 200px; /* Adjust this value based on your content */
		}
	}
</style>