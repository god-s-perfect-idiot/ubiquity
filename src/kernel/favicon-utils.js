// Favicon utility functions for fetching and managing app icons

// App-specific background color overrides
const APP_BG_COLORS = {
  'github.com': 'bg-[#241d20]',
  'www.github.com': 'bg-[#241d20]',
  'linkedin.com': 'bg-[#3673b2]',
  'www.linkedin.com': 'bg-[#3673b2]',
  'twitter.com': 'bg-blue-400',
  'www.twitter.com': 'bg-blue-400',
  'x.com': 'bg-black',
  'www.x.com': 'bg-black',
  "twitter.com": "bg-black",
  "www.twitter.com": "bg-black",
  'youtube.com': 'bg-[#f00035]',
  'www.youtube.com': 'bg-[#f00035]',
  'reddit.com': 'bg-[#f04405]',
  'www.reddit.com': 'bg-[#f04405]',
  'netflix.com': 'bg-white',
  'www.netflix.com': 'bg-white',
  'spotify.com': 'bg-white',
  'open.spotify.com': 'bg-white',
  'discord.com': 'bg-[#5764f2]',
  'www.discord.com': 'bg-[#5764f2]',
  'stackoverflow.com': 'bg-white',
  'www.stackoverflow.com': 'bg-white',
  'google.com': 'bg-white',
  'www.google.com': 'bg-white',
  'facebook.com': 'bg-blue-600',
  'www.facebook.com': 'bg-blue-600',
  'instagram.com': 'bg-gradient-to-br from-purple-600 to-pink-600',
  'www.instagram.com': 'bg-gradient-to-br from-purple-600 to-pink-600',
  'tiktok.com': 'bg-black',
  'www.tiktok.com': 'bg-black',
  'twitch.tv': 'bg-purple-600',
  'www.twitch.tv': 'bg-purple-600',
  'amazon.com': 'bg-orange-500',
  'www.amazon.com': 'bg-orange-500',
  'microsoft.com': 'bg-gray-800',
  'www.microsoft.com': 'bg-gray-800',
  'apple.com': 'bg-gray-900',
  'www.apple.com': 'bg-gray-900'
};

/**
 * Get favicon URL for a given domain using Google's favicon service
 * @param {string} url - The URL of the website
 * @returns {string} - The favicon URL
 */
export function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Use Google's favicon service which is reliable and doesn't have CORS issues
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (error) {
    console.error('Error parsing URL for favicon:', error);
    return null;
  }
}

/**
 * Get background color class for a specific app
 * @param {string} url - The URL of the app
 * @returns {string} - Tailwind CSS background color class
 */
export function getAppBackgroundColor(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    return APP_BG_COLORS[domain] || 'bg-white';
  } catch (error) {
    console.error('Error parsing URL for background color:', error);
    return 'bg-white';
  }
}



/**
 * Get favicon URLs and background colors for a list of apps using Google's service
 * @param {Array} apps - Array of app objects with url property
 * @returns {Object} - Object mapping app names to favicon data
 */
export function getFaviconUrls(apps) {
  const faviconCache = {};
  
  for (const app of apps) {
    if (app.url && !app.isSystemApp) {
      try {
        const faviconUrl = getFaviconUrl(app.url);
        const bgColor = getAppBackgroundColor(app.url);
        if (faviconUrl) {
          faviconCache[app.name] = {
            url: faviconUrl,
            bgColor: bgColor
          };
        }
      } catch (error) {
        console.error(`Error getting favicon data for ${app.name}:`, error);
      }
    }
  }
  
  return faviconCache;
}


