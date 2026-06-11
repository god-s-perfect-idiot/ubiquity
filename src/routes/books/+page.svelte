<script>
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import BottomControls from '../../components/BottomControls.svelte';
	import LetterGrid from '../../components/LetterGrid.svelte';
	import Loader from '../../components/Loader.svelte';
	import { fetchBooks } from '../../kernel/system-utils';
	import { kernel } from '../../kernel/store';
	import { appInfoStore } from '../../store/appInfo.js';
	import { booksStore } from '../../store/books.js';
	import { addToast } from '../../store/toast';
	import { searchBooks, fetchBookText } from '../../lib/books-api.js';
	import { getGutenbergCoverUrl, getGutenbergUrl, parseGutenbergId } from '../../lib/books-utils.js';
	import {
		READER_FONTS,
		getReaderFontFamily,
		getNextReaderFont
	} from '../../lib/reader-fonts.js';
	import {
		accentColorStore,
		backgroundClassStore,
		textColorClassStore,
		borderColorClassStore
	} from '../../utils/theme';

	let books = [];
	let bookList = {};
	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let showGrid = false;
	let showDiscover = false;
	let showReader = false;

	let searchQuery = '';
	let searchResults = [];
	let isSearching = false;
	let searchError = '';

	let selectedBook = null;
	let readerPages = [];
	let currentPage = 0;
	let isLoadingBook = false;
	let readerError = '';
	let readerNightMode = false;
	let readerFont = 'readerly';

	let touchStartY = 0;
	let touchStartX = 0;
	let touchEndY = 0;
	let touchEndX = 0;
	const TOUCH_THRESHOLD = 10;

	let targetChar = '';

	$: accentColor = $accentColorStore;
	$: bgClass = $backgroundClassStore;
	$: textClass = $textColorClassStore;
	$: borderClass = $borderColorClassStore;
	$: pageCount = readerPages.length;
	$: readerBgClass = readerNightMode ? 'bg-black' : 'bg-[#F5F0E1]';
	$: readerTextClass = readerNightMode ? 'text-white' : 'text-black';
	$: readerMutedClass = readerNightMode ? 'text-white/70' : 'text-black/70';
	$: readerBorderClass = readerNightMode ? 'border-white' : 'border-black';
	$: navbarHeight = isExpanded ? 80 : 40;
	$: readerToolbarBottom = `${navbarHeight}px`;
	$: readerContentPadding = `${navbarHeight + 112}px`;
	$: readerFontFamily = getReaderFontFamily(readerFont);
	$: readerFontLabel = READER_FONTS[readerFont]?.label ?? 'Readerly';

	const handleToggle = () => {
		isExpanded = !isExpanded;
	};

	function getBookInfo(book) {
		const apps = appInfoStore.getState().apps;
		return apps[book.name] || apps[book.content] || {};
	}

	function getProgressKey(book) {
		const info = getBookInfo(book);
		return String(info.gutenbergId || parseGutenbergId(book.content) || book.name);
	}

	function getCoverUrl(book) {
		const info = getBookInfo(book);
		if (info.icon) return info.icon;
		const id = info.gutenbergId || parseGutenbergId(book.content);
		return id ? getGutenbergCoverUrl(id) : null;
	}

	function getAuthor(book) {
		const info = getBookInfo(book);
		return info.author || info.owner || '';
	}

	function initializeBooks() {
		bookList = {};
		books = fetchBooks(kernel.fs.getFiles()).sort((a, b) => a.name.localeCompare(b.name));
		books.forEach((book) => {
			const firstLetter = book.name.charAt(0).toUpperCase();
			if (bookList[firstLetter]) {
				bookList[firstLetter].push(book);
			} else {
				bookList[firstLetter] = [book];
			}
		});
	}

	function buildAppInfo(book) {
		const author = book.authors?.[0]?.name || 'Unknown author';
		return {
			category: 'book',
			gutenbergId: book.id,
			icon: getGutenbergCoverUrl(book.id),
			author,
			description: book.summaries?.[0] || '',
			name: book.title
		};
	}

	function isInLibrary(gutenbergId) {
		return books.some((book) => {
			const info = getBookInfo(book);
			return info.gutenbergId === gutenbergId || parseGutenbergId(book.content) === gutenbergId;
		});
	}

	function addBookToLibrary(book) {
		const url = getGutenbergUrl(book.id);
		const appInfo = buildAppInfo(book);

		kernel.addFile(book.title, url, 'document');
		appInfoStore.setAppInfo(book.title, appInfo);
		appInfoStore.setAppInfo(url, appInfo);
		kernel.updateFS();
		initializeBooks();
		addToast(`${book.title} added to library`);
	}

	function toggleReaderNightMode() {
		readerNightMode = !readerNightMode;
		booksStore.setNightMode(readerNightMode);
	}

	function cycleReaderFont() {
		readerFont = getNextReaderFont(readerFont);
		booksStore.setReaderFont(readerFont);
	}

	async function openBook(book) {
		const gutenbergId = getBookInfo(book).gutenbergId || parseGutenbergId(book.content);

		if (!gutenbergId) {
			window.location.href = book.content;
			return;
		}

		selectedBook = book;
		showReader = true;
		showDiscover = false;
		isExpanded = false;
		isLoadingBook = true;
		readerError = '';
		readerPages = [];
		currentPage = booksStore.getPage(getProgressKey(book));

		try {
			const data = await fetchBookText(gutenbergId);
			readerPages = data.pages || [];
			if (currentPage >= readerPages.length) {
				currentPage = Math.max(0, readerPages.length - 1);
			}
		} catch (error) {
			readerError = error.message || 'Could not load this book';
		} finally {
			isLoadingBook = false;
		}
	}

	function saveReaderProgress() {
		if (selectedBook && readerPages.length) {
			booksStore.setPage(getProgressKey(selectedBook), currentPage);
		}
	}

	function closeReader() {
		saveReaderProgress();
		showReader = false;
		selectedBook = null;
		readerPages = [];
		currentPage = 0;
		readerError = '';
		isExpanded = false;
	}

	function nextPage() {
		if (currentPage < readerPages.length - 1) {
			currentPage += 1;
			if (selectedBook) booksStore.setPage(getProgressKey(selectedBook), currentPage);
		}
	}

	function prevPage() {
		if (currentPage > 0) {
			currentPage -= 1;
			if (selectedBook) booksStore.setPage(getProgressKey(selectedBook), currentPage);
		}
	}

	async function runSearch() {
		if (!searchQuery.trim()) return;

		isSearching = true;
		searchError = '';
		searchResults = [];

		try {
			const data = await searchBooks(searchQuery.trim());
			searchResults = data.results || [];
		} catch (error) {
			searchError = error.message || 'Search failed';
		} finally {
			isSearching = false;
		}
	}

	function closePage() {
		if (showReader) {
			saveReaderProgress();
		} else if (showDiscover) {
			showDiscover = false;
		}

		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200);
			}, 300);
		}, 300);
	}

	function toggleDiscover() {
		showDiscover = !showDiscover;
		showGrid = false;
		isExpanded = false;
		if (!showDiscover) {
			searchQuery = '';
			searchResults = [];
			searchError = '';
		}
	}

	async function scrollToChar(char) {
		await tick();
		const targetElement = document.getElementById(char);
		if (targetElement) {
			targetElement.scrollIntoView({ behavior: 'instant' });
		}
	}

	function handleLetterClick(char) {
		targetChar = char;
		isExiting = true;
		setTimeout(
			() => {
				scrollToChar(char.toUpperCase());
				showGrid = false;
				isExiting = false;
			},
			27 * 10 + 200
		);
		targetChar = '';
	}

	function handleBookTap(book) {
		if (isTap()) openBook(book);
	}

	function handleTouchStart(event) {
		touchStartY = event.touches[0].clientY;
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event) {
		touchEndY = event.changedTouches[0].clientY;
		touchEndX = event.changedTouches[0].clientX;
	}

	function isTap() {
		const deltaY = Math.abs(touchEndY - touchStartY);
		const deltaX = Math.abs(touchEndX - touchStartX);
		return deltaY < TOUCH_THRESHOLD && deltaX < TOUCH_THRESHOLD;
	}

	onMount(() => {
		initializeBooks();
		readerNightMode = booksStore.getNightMode();
		readerFont = booksStore.getReaderFont();
		isExpanded = false;
	});
</script>

<svelte:head>
	<link href="/fonts/reader-fonts.css" rel="stylesheet" />
</svelte:head>

<div class="page-holder">
	{#if showReader && selectedBook}
		<div class="fixed inset-0 {readerBgClass} z-40 flex flex-col h-screen page-holder">
			<div class="relative w-full h-full page overflow-hidden flex flex-col" class:page-exit={isExiting}>
				<div class="px-4 pt-4 pb-2 flex flex-col gap-1 shrink-0">
					<span class="text-2xl font-[300] leading-snug line-clamp-2 {readerTextClass}">
						{selectedBook.name}
					</span>
					{#if !isLoadingBook && getAuthor(selectedBook)}
						<span class="text-sm {readerMutedClass} truncate">{getAuthor(selectedBook)}</span>
					{/if}
				</div>

				<div
					class="flex-1 overflow-y-auto px-4 min-h-0"
					style="padding-bottom: {readerContentPadding};"
				>
					{#if isLoadingBook}
						<div class="flex items-center justify-center h-full">
							<Loader theme={readerNightMode ? 'dark' : 'light'} />
						</div>
					{:else if readerError}
						<p class="text-lg font-[300] {readerMutedClass}">{readerError}</p>
					{:else if readerPages[currentPage]}
						<p
							class="reader-text text-lg whitespace-pre-wrap {readerTextClass}"
							style="font-family: {readerFontFamily};"
						>
							{readerPages[currentPage]}
						</p>
					{/if}
				</div>
			</div>
		</div>
	{:else if showDiscover}
		<div
			class="flex flex-col pt-4 w-full font-[400] h-screen page px-4"
			class:page-exit={isExiting}
		>
			<span class="text-6xl font-[300] h-[10%]"> discover </span>

			<div class="flex flex-row mt-4 mb-4">
				<div class="flex-1 relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="search free books..."
						class="w-full h-12 bg-white text-xl text-black pl-4 pr-12 focus:outline-none"
						on:keydown={(e) => e.key === 'Enter' && runSearch()}
					/>
				</div>
				<button
					class="w-12 h-12 {textClass} flex justify-center items-center shrink-0"
					style="background-color: {accentColor};"
					on:click={runSearch}
				>
					<Icon icon="carbon:search" width="20" height="20" strokeWidth="2" />
				</button>
			</div>

			<div class="flex flex-col gap-4 pb-16 overflow-y-auto">
				{#if isSearching}
					<Loader />
				{:else if searchError}
					<p class="text-lg font-[300] opacity-80">{searchError}</p>
				{:else if searchQuery && searchResults.length === 0}
					<p class="text-lg font-[300] opacity-80">no books found</p>
				{:else}
					{#each searchResults as book (book.id)}
						<div class="flex flex-row gap-4 items-start">
							<div class="w-20 h-28 shrink-0 {bgClass} overflow-hidden">
								<img
									src={getGutenbergCoverUrl(book.id)}
									alt={book.title}
									class="w-full h-full object-cover"
									on:error={(e) => {
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
							<div class="flex flex-col gap-2 flex-1 min-w-0">
								<span class="text-xl font-[300]">{book.title}</span>
								<span class="text-sm opacity-70 truncate">
									{book.authors?.[0]?.name || 'Unknown author'}
								</span>
								<div class="flex flex-row gap-2 mt-1">
									<button
										class="px-3 py-1 border-2 {borderClass} text-sm font-[300]"
										on:click={() => openBook({ name: book.title, content: getGutenbergUrl(book.id) })}
									>
										read
									</button>
									{#if isInLibrary(book.id)}
										<span class="text-sm opacity-70 self-center">in library</span>
									{:else}
										<button
											class="px-3 py-1 border-2 {borderClass} text-sm font-[300]"
											on:click={() => addBookToLibrary(book)}
										>
											add
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{:else if showGrid}
		<LetterGrid
			items={books}
			itemNameKey="name"
			{showGrid}
			{isExiting}
			onLetterClick={handleLetterClick}
		/>
	{:else}
		<div
			class="flex flex-col pt-4 w-full font-[400] h-screen page px-4"
			class:page-exit={isExiting}
		>
			<span class="text-6xl font-[300] h-[10%]"> books </span>
			<div class="flex flex-col gap-8 pb-16 mt-6 overflow-y-auto">
				{#if books.length === 0}
					<p class="text-xl font-[300] opacity-80 mt-4">
						your library is empty. tap discover to find free books.
					</p>
				{/if}
				{#each Object.entries(bookList) as bookEntry}
					<div class="flex flex-col gap-2">
						<button
							class="{textClass} text-3xl lowercase border-2 w-12 h-12 justify-start items-end flex pl-1 pb-2 mb-4 font-[300]"
							style="background-color: {accentColor}; border-color: {accentColor};"
							id={bookEntry[0].toUpperCase()}
							on:click={() => {
								showGrid = true;
							}}
							on:touchstart={handleTouchStart}
							on:touchend={(event) => {
								handleTouchEnd(event);
								if (isTap()) showGrid = true;
							}}
						>
							{bookEntry[0]}
						</button>
						{#each bookEntry[1] as book}
							<button
								class="flex flex-row gap-4 items-start"
								on:click={() => handleBookTap(book)}
								on:touchstart={handleTouchStart}
								on:touchend={(event) => {
									handleTouchEnd(event);
									handleBookTap(book);
								}}
							>
								<span class="flex shrink-0 overflow-hidden">
									{#if getCoverUrl(book)}
										<img
											src={getCoverUrl(book)}
											alt={book.name}
											class="w-20 h-28 object-cover"
											on:error={(e) => {
												e.currentTarget.style.display = 'none';
											}}
										/>
									{:else}
										<div
											class="w-20 h-28 {bgClass} items-end justify-end flex pr-2 pb-2 font-[300]"
										>
											book
										</div>
									{/if}
								</span>
								<div class="flex flex-col gap-1 pt-2 min-w-0 items-start text-left">
									<span class="{textClass} text-2xl font-[300] truncate max-w-64 text-left" title={book.name}>
										{book.name}
									</span>
									{#if getAuthor(book)}
										<span class="text-sm opacity-70 truncate max-w-64 text-left">{getAuthor(book)}</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		{#if !showReader && !showDiscover}
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					on:click={toggleDiscover}
					class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
				>
					<Icon icon="mdi:magnify" width="18" height="18" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">discover</span>
			</div>
		{:else}
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					on:click={toggleDiscover}
					class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
				>
					<Icon icon="mdi:bookshelf" width="18" height="18" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">library</span>
			</div>
		{/if}
		<div
			class="btn-animate flex flex-col gap-2 justify-center items-center"
			class:animate={isExpanded}
		>
			<button
				on:click={closePage}
				class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
			>
				<Icon icon="rivet-icons:close" width="18" height="18" strokeWidth="2" />
			</button>
			<span class="text-xs font-[400]">close</span>
		</div>
	</div>
</BottomControls>

{#if showReader && selectedBook && !isLoadingBook}
	<div
		class="fixed left-0 right-0 z-[60] px-4 py-2 flex flex-row items-center gap-2 {readerBgClass} {readerTextClass} border-t {readerBorderClass}"
		style="bottom: {readerToolbarBottom};"
	>
		{#if pageCount > 0}
			<button
				on:click={prevPage}
				disabled={currentPage === 0}
				class="flex items-center justify-center border-2 {readerBorderClass} rounded-full p-2 disabled:opacity-40 shrink-0"
				aria-label="Previous page"
			>
				<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2" />
			</button>
			<span class="flex-1 text-center text-sm font-[300] {readerMutedClass} truncate">
				page {currentPage + 1} of {pageCount}
			</span>
			<button
				on:click={nextPage}
				disabled={currentPage >= pageCount - 1}
				class="flex items-center justify-center border-2 {readerBorderClass} rounded-full p-2 disabled:opacity-40 shrink-0"
				aria-label="Next page"
			>
				<Icon icon="subway:right-arrow" width="18" height="18" strokeWidth="2" />
			</button>
		{/if}
		<button
			on:click={closeReader}
			class="flex items-center justify-center border-2 {readerBorderClass} rounded-full p-2 shrink-0"
			class:ml-auto={pageCount === 0}
			aria-label="Back to library"
		>
			<Icon icon="mdi:bookshelf" width="18" height="18" strokeWidth="2" />
		</button>
		<button
			on:click={cycleReaderFont}
			class="flex items-center justify-center border-2 {readerBorderClass} rounded-full px-3 py-2 shrink-0 text-xs font-[400]"
			aria-label="Change reader font"
			title={readerFontLabel}
		>
			Aa
		</button>
		<button
			on:click={toggleReaderNightMode}
			class="flex items-center justify-center border-2 {readerBorderClass} rounded-full p-2 shrink-0"
			aria-label="Toggle day/night mode"
		>
			<Icon
				icon={readerNightMode ? 'mdi:weather-sunny' : 'mdi:weather-night'}
				width="18"
				height="18"
				strokeWidth="2"
			/>
		</button>
	</div>
{/if}

<style>
	.reader-text {
		line-height: 2;
	}

	.btn-animate {
		transform: translateY(120%);
		opacity: 0;
	}

	.btn-animate.animate {
		animation: button-overshoot 0.5s ease-out forwards;
		opacity: 1;
	}

	@keyframes button-overshoot {
		0% {
			transform: translateY(120%);
		}
		70% {
			transform: translateY(-20%);
		}
		100% {
			transform: translateY(0);
		}
	}
</style>
