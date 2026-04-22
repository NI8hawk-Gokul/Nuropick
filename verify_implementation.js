<<<<<<< HEAD
const { extractUrl, cleanUrl } = require('./server/utils/urlHelper');
const { scrapeAmazonProductMetadata, scrapeFlipkartProductMetadata } = require('./server/services/scraper');

async function test() {
    console.log('\n--- Testing Flipkart Metadata Scraping (Short URL) ---');
    const shortUrl = 'https://dl.flipkart.com/s/fYq4xouuuN';
    try {
        const result = await scrapeFlipkartProductMetadata(shortUrl);
        console.log('Short URL Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Short URL Scraping Failed:', e.message);
    }
}

test();
=======
const { extractUrl, cleanUrl } = require('./server/utils/urlHelper');
const { scrapeAmazonProductMetadata, scrapeFlipkartProductMetadata } = require('./server/services/scraper');

async function test() {
    console.log('\n--- Testing Flipkart Metadata Scraping (Short URL) ---');
    const shortUrl = 'https://dl.flipkart.com/s/fYq4xouuuN';
    try {
        const result = await scrapeFlipkartProductMetadata(shortUrl);
        console.log('Short URL Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Short URL Scraping Failed:', e.message);
    }
}

test();

