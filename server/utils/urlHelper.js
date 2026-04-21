const axios = require('axios');

/**
 * Extract a clean URL from a string that might contain additional text.
 * @param {string} text - Input text containing a URL
 * @returns {string|null} Clean URL or null
 */
function extractUrl(text) {
    if (!text) return null;

    // Regular expression to find URLs - improved to handle trailing punctuation
    const urlRegex = /(https?:\/\/[^\s\),>]+)/g;
    const matches = text.match(urlRegex);

    if (matches && matches.length > 0) {
        // Return the first URL found
        let url = matches[0];
        // Clean trailing common punctuation that might be caught
        if (url.match(/[\.\,\?\!\:\;]$/)) {
            url = url.slice(0, -1);
        }
        return url;
    }

    return null;
}

/**
 * Resolve short URLs or redirects to their final destination
 * @param {string} url - URL to resolve
 * @returns {Promise<string>} Final URL
 */
async function resolveUrl(url) {
    if (!url) return url;

    // Only resolve known shorteners or specific domains that use redirects
    const domainsToResolve = ['amzn.in', 'dl.flipkart.com', 'bit.ly', 't.co', 'tinyurl.com', 'goo.gl'];
    const hasShortDomain = domainsToResolve.some(domain => url.includes(domain));

    if (!hasShortDomain) return url;

    try {
        const response = await axios.get(url, {
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            },
            timeout: 10000,
            validateStatus: (status) => status >= 200 && status < 400
        });
        return response.request.res.responseUrl || response.config.url;
    } catch (e) {
        console.warn(`⚠️ URL resolution failed for ${url}: ${e.message}`);
        return url;
    }
}

/**
 * Clean up a URL (remove query parameters etc if needed)
 * @param {string} url - URL to clean
 * @returns {string} Cleaned URL
 */
function cleanUrl(url) {
    if (!url) return null;
    try {
        const urlObj = new URL(url);

        // Amazon: Keep origin and pathname (usually contains /dp/ASIN)
        if (urlObj.hostname.includes('amazon.')) {
            let cleaned = urlObj.origin + urlObj.pathname;
            if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
            return cleaned;
        }

        // Flipkart: MUST keep 'pid' for specific product identification
        if (urlObj.hostname.includes('flipkart.com')) {
            const pid = urlObj.searchParams.get('pid');
            let cleaned = urlObj.origin + urlObj.pathname;
            if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);

            if (pid) {
                return `${cleaned}?pid=${pid}`;
            }
            return cleaned;
        }

        // Default: Keep origin and pathname
        let cleaned = urlObj.origin + urlObj.pathname;
        if (cleaned.endsWith('/')) {
            cleaned = cleaned.slice(0, -1);
        }
        return cleaned;
    } catch (e) {
        return url;
    }
}

module.exports = {
    extractUrl,
    resolveUrl,
    cleanUrl
};
