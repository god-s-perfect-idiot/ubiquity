<script>
	import { accentColorStore, textColorClassStore, backgroundThemeStore } from '../../../utils/theme';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: background = $backgroundThemeStore;
</script>

<div class="flex flex-col gap-4 items-start justify-start w-full h-full">
	<span class="text-lg text-left w-full font-semibold {textClass}">LIVE TILES TOOLKIT</span>

	<p class="text-lg {textClass}">
		Create custom interactive tiles for your apps that display dynamic information on your homescreen.
	</p>

	<!-- What are Live Tiles -->
	<div class="flex flex-col w-full mt-2">
		<span class="text-lg font-[400]" style="color: {accentColor};">what are live tiles?</span>
		
		<div class="flex flex-col gap-3 mt-4">
			<p class="text-base font-[300] {textClass}">
				Live Tiles are custom HTML widgets that you can create for any app on your homescreen. They display real-time information like weather, time, notifications, and more.
			</p>
			<p class="text-base font-[300] {textClass}">
				Each tile comes in two sizes: <strong>4x2</strong> (wide format) and <strong>2x2</strong> (square format), giving you flexibility in how you organize your homescreen.
			</p>
		</div>
	</div>

	<!-- How to Use -->
	<div class="flex flex-col w-full mt-6">
		<span class="text-lg font-[400]" style="color: {accentColor};">how to use the toolkit</span>
		
		<div class="flex flex-col gap-4 mt-4">
			<div class="flex items-start gap-2">
				<Icon icon="material-symbols:edit" class="text-xl mt-0.5 flex-shrink-0" style="color: {accentColor};" />
				<div class="flex flex-col gap-2">
					<span class="text-base font-[400] {textClass}"><strong>Create</strong></span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						Select an app and design your tile using HTML and Tailwind CSS. You can use AI assistance or write the code yourself.
					</p>
				</div>
			</div>
			
			<div class="flex items-start gap-2">
				<Icon icon="material-symbols:preview" class="text-xl mt-0.5 flex-shrink-0" style="color: {accentColor};" />
				<div class="flex flex-col gap-2">
					<span class="text-base font-[400] {textClass}"><strong>Preview</strong></span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						See how your tile looks in both 4x2 and 2x2 formats before publishing. Tiles can flip between sizes automatically.
					</p>
				</div>
			</div>
			
			<div class="flex items-start gap-2">
				<Icon icon="material-symbols:publish" class="text-xl mt-0.5 flex-shrink-0" style="color: {accentColor};" />
				<div class="flex flex-col gap-2">
					<span class="text-base font-[400] {textClass}"><strong>Publish</strong></span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						Share your tiles with the community. Published tiles are saved to Firebase and can be discovered by other users.
					</p>
				</div>
			</div>
			
			<div class="flex items-start gap-2">
				<Icon icon="material-symbols:search" class="text-xl mt-0.5 flex-shrink-0" style="color: {accentColor};" />
				<div class="flex flex-col gap-2">
					<span class="text-base font-[400] {textClass}"><strong>Browse</strong></span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						Discover tiles created by others. Browse the community library and download tiles that match your style.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Key Features -->
	<div class="flex flex-col w-full mt-6">
		<span class="text-lg font-[400]" style="color: {accentColor};">key features</span>
		
		<div class="flex flex-col gap-3 mt-4">
			<div class="flex items-start gap-2">
				<p class="text-base font-[300] {textClass}">
					<strong>Tailwind CSS Only:</strong> All styling uses Tailwind utility classes - no custom CSS needed
				</p>
			</div>
			<div class="flex items-start gap-2">
				<p class="text-base font-[300] {textClass}">
					<strong>Dynamic Content:</strong> Tiles can fetch and display real-time data from APIs
				</p>
			</div>
			<div class="flex items-start gap-2">
				<p class="text-base font-[300] {textClass}">
					<strong>Community Sharing:</strong> Share your creations and discover tiles from other users
				</p>
			</div>
			<div class="flex items-start gap-2">
				<p class="text-base font-[300] {textClass}">
					<strong>AI Assistance:</strong> Use AI to help you create your tiles
				</p>
			</div>
		</div>
	</div>

	<!-- Getting Started -->
	<div class="flex flex-col w-full mt-6 pb-24">
		<span class="text-lg font-[400]" style="color: {accentColor};">getting started</span>

        <Icon icon="material-symbols:grid-view" class="text-4xl {textClass} bg-purple-800 p-2 mt-4 mb-2" />
		
		<p class="text-base font-[300] text-[#a1a1a1] ">
			After completing onboarding, you can access the Live Tiles toolkit from the homescreen. Select any app to start creating your first custom tile!
		</p>
	</div>
</div>

