<script>
	import {
		accentColorStore,
		textColorClassStore,
		backgroundThemeStore
	} from '../../../utils/theme';
	import Icon from '@iconify/svelte';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: background = $backgroundThemeStore;
</script>

<div class="flex flex-col gap-4 items-start justify-start w-full h-full p-4">
	<span class="text-lg text-left w-full font-semibold {textClass}">ADD NEW RESOURCE</span>

	<p class="text-lg {textClass}">
		There are several ways to add apps, images, music, videos, and other resources to your device.
	</p>

	<!-- Marketplace -->
	<div class="flex flex-col w-full mt-2">
		<span class="text-lg font-[400]" style="color: {accentColor};">marketplace</span>

		<div class="flex flex-col gap-3 mt-4">
			<p class="text-base font-[300] {textClass}">
				Browse and install resources from the community marketplace. Discover apps, music, videos,
				documents, and photos shared by other users.
			</p>
			<div class="flex items-start gap-2 mt-2">
				<Icon
					icon="material-symbols:store"
					class="text-xl mt-0.5 flex-shrink-0"
					style="color: {accentColor};"
				/>
				<div class="flex flex-col gap-1 min-w-0 flex-1">
					<span class="text-base font-[400] {textClass}">Browse Categories</span>
					<p class="text-base font-[300] text-[#a1a1a1]">Apps, Music, Videos, Documents, Photos</p>
				</div>
			</div>
			<div class="flex items-start gap-2 mt-2">
				<Icon
					icon="material-symbols:download"
					class="text-xl mt-0.5 flex-shrink-0"
					style="color: {accentColor};"
				/>
				<div class="flex flex-col gap-1 min-w-0 flex-1">
					<span class="text-base font-[400] {textClass}">One-Click Install</span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						Tap to add any resource directly to your device
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Manual File Creation -->
	<div class="flex flex-col w-full mt-6">
		<span class="text-lg font-[400]" style="color: {accentColor};">manual file creation</span>

		<div class="flex flex-col gap-3 mt-4">
			<p class="text-base font-[300] {textClass}">
				Create files manually by specifying a name and target URL. Perfect for adding custom apps or
				linking to external resources.
			</p>
			<div class="flex items-start gap-2 mt-2">
				<Icon
					icon="material-symbols:add-circle-outline"
					class="text-xl mt-0.5 flex-shrink-0"
					style="color: {accentColor};"
				/>
				<div class="flex flex-col gap-1 min-w-0 flex-1">
					<span class="text-base font-[400] {textClass}">Add File from Apps menu</span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						Create documents, images, music, videos, or apps by holding down on the apps list. This
						will open the context menu with the option to add a new file. You can create any type of
						file you want.
					</p>
				</div>
			</div>
			<div class="flex items-start gap-2 mt-2">
				<Icon
					icon="material-symbols:folder-outline"
					class="text-xl mt-0.5 flex-shrink-0"
					style="color: {accentColor};"
				/>
				<div class="flex flex-col gap-1 min-w-0 flex-1">
					<span class="text-base font-[400] {textClass}">Add Files from Files app</span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						Bottom bar of the Files app has the option to add a new file. You can create any type of
						file you want by tapping on it.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Camera & Upload -->
	<div class="flex flex-col w-full mt-6">
		<span class="text-lg font-[400]" style="color: {accentColor};">camera + upload</span>

		<div class="flex flex-col gap-3 mt-4">
			<p class="text-base font-[300] {textClass}">
				Capture photos directly or upload images using integrated services.
			</p>
			<div class="flex items-start gap-2 mt-2">
				<Icon
					icon="material-symbols:camera"
					class="text-xl mt-0.5 flex-shrink-0"
					style="color: {accentColor};"
				/>
				<div class="flex flex-col gap-1 min-w-0 flex-1">
					<span class="text-base font-[400] {textClass}">Camera</span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						Take photos that are automatically saved to your device
					</p>
				</div>
			</div>
			<div class="flex items-start gap-2 mt-2">
				<Icon
					icon="material-symbols:cloud-upload"
					class="text-xl mt-0.5 flex-shrink-0"
					style="color: {accentColor};"
				/>
				<div class="flex flex-col gap-1 min-w-0 flex-1">
					<span class="text-base font-[400] {textClass}">Image Upload</span>
					<p class="text-base font-[300] text-[#a1a1a1]">
						Upload images using ImgBB or other image hosting services
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Resource Types -->
	<div class="flex flex-col w-full mt-6">
		<span class="text-lg font-[400]" style="color: {accentColor};">resource types</span>

		<div class="flex flex-col gap-2 mt-4">
			<div class="flex items-center gap-2">
				<Icon icon="material-symbols:apps" class="text-lg" style="color: {accentColor};" />
				<span class="text-base font-[300] {textClass}">Apps</span>
			</div>
			<div class="flex items-center gap-2">
				<Icon icon="material-symbols:image" class="text-lg" style="color: {accentColor};" />
				<span class="text-base font-[300] {textClass}">Images</span>
			</div>
			<div class="flex items-center gap-2">
				<Icon icon="material-symbols:music-note" class="text-lg" style="color: {accentColor};" />
				<span class="text-base font-[300] {textClass}">Music</span>
			</div>
			<div class="flex items-center gap-2">
				<Icon icon="material-symbols:video-library" class="text-lg" style="color: {accentColor};" />
				<span class="text-base font-[300] {textClass}">Videos</span>
			</div>
			<div class="flex items-center gap-2">
				<Icon icon="material-symbols:description" class="text-lg" style="color: {accentColor};" />
				<span class="text-base font-[300] {textClass}">Documents</span>
			</div>
		</div>
	</div>

	<!-- Getting Started -->
	<div class="flex flex-col w-full mt-6 pb-24">
		<span class="text-lg font-[400]" style="color: {accentColor};">getting started</span>

		<div class="flex flex-row gap-2 mt-4">
			<Icon
				icon="ic:sharp-store"
                size="48"
				class="text-xl mt-0.5 flex-shrink-0 bg-purple-900 p-2 w-10 h-10"
			/>
			<Icon
				icon="material-symbols:add-circle-outline"
                size="48"
				class="text-xl mt-0.5 flex-shrink-0 bg-green-900 p-2 w-10 h-10"
			/>
			<Icon
				icon="material-symbols:folder-outline"
				size="48"
				class="text-xl mt-0.5 flex-shrink-0 bg-blue-900 p-2 w-10 h-10"
			/>
		</div>
		<p class="text-base font-[300] text-[#a1a1a1] mt-4">
			After onboarding, access the marketplace from the homescreen to discover resources, or use the
			"Add File" option to create custom resources. You can also use the Files app to add files!
		</p>
	</div>
</div>
