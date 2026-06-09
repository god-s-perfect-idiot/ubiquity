/** Human-readable OS/device label for the current browser environment. */
export async function getDeviceLabel() {
	if (typeof navigator === 'undefined') return 'Generic Device';

	if (navigator.userAgentData?.platform) {
		const { platform, mobile } = navigator.userAgentData;
		return mobile ? `${platform} (mobile)` : platform;
	}

	if (navigator.userAgentData?.getHighEntropyValues) {
		try {
			const { platform } = await navigator.userAgentData.getHighEntropyValues(['platform']);
			if (platform) return platform;
		} catch {
			// Permission denied or unsupported — fall through
		}
	}

	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
	if (/Android/.test(ua)) return 'Android';
	if (/Mac/.test(ua)) return 'macOS';
	if (/Win/.test(ua)) return 'Windows';
	if (/Linux/.test(ua)) return 'Linux';

	const platform = navigator.platform;
	if (platform === 'MacIntel' || platform === 'MacPPC') return 'macOS';
	if (platform?.startsWith('Win')) return 'Windows';
	if (platform?.includes('Linux')) return 'Linux';

	return platform || 'Generic Device';
}
