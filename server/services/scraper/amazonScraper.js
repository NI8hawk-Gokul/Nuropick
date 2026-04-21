const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

/**
 * Scrape Amazon product reviews
 * @param {string} productUrl - Amazon product URL or ASIN
 * @param {Object} options - Scraping options
 * @returns {Promise<Array>} Array of reviews
 */
async function scrapeAmazonReviews(productUrl, options = {}) {
    const { limit = 50, headless = 'new' } = options;

    let browser;
    const reviews = [];

    try {
        console.log('🔍 Starting Amazon scraper...');

        browser = await puppeteer.launch({
            headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Extract ASIN to construct direct reviews URL
        const asin = extractASIN(productUrl);
        let reviewsUrl = productUrl;

        if (asin) {
            const domain = productUrl.includes('amazon.in') ? 'amazon.in' : 'amazon.com';
            reviewsUrl = `https://www.${domain}/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_srt?ie=UTF8&reviewerType=all_reviews&sortBy=recent&pageNumber=1`;
        }

        console.log(`🌐 Navigating to reviews page: ${reviewsUrl}`);

        // Navigate to reviews page with more resilient options
        await page.goto(reviewsUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        }).catch(err => console.warn(`⚠️ Reviews page navigation warning: ${err.message}`));

        // If we didn't land on a reviews page, try to find the "See all reviews" button
        const isReviewsPage = await page.$('[data-hook="review"]') !== null;
        if (!isReviewsPage) {
            try {
                const seeAllLink = await page.$('a[data-hook="see-all-reviews-link-foot"]');
                if (seeAllLink) {
                    await seeAllLink.click();
                    await page.waitForNavigation({ waitUntil: 'networkidle2' });
                }
            } catch (e) {
                console.warn('⚠️ Could not find "See all reviews" button, trying to scrape current page...');
            }
        }

        let currentPage = 1;
        const maxPages = Math.ceil(limit / 10); // Amazon shows ~10 reviews per page

        while (currentPage <= maxPages && reviews.length < limit) {
            console.log(`📄 Scraping page ${currentPage}...`);

            const html = await page.content();
            const $ = cheerio.load(html);

            // Extract reviews from current page
            const reviewElements = $('[data-hook="review"]');
            console.log(`🔎 Found ${reviewElements.length} review elements on page ${currentPage}`);

            if (reviewElements.length === 0) {
                // Try alternative selection if data-hook is missing
                const altElements = $('.review');
                if (altElements.length > 0) {
                    console.log(`🔎 Found ${altElements.length} alternative review elements`);
                    // logic would go here if needed, but usually data-hook is more stable
                }
            }

            reviewElements.each((i, element) => {
                const $review = $(element);

                const review = {
                    source: 'amazon',
                    externalId: $review.attr('id'),
                    title: $review.find('[data-hook="review-title"]').text().trim(),
                    content: $review.find('[data-hook="review-body"]').text().trim(),
                    author: $review.find('.a-profile-name').text().trim(),
                    rating: parseFloat($review.find('[data-hook="review-star-rating"]').text().match(/(\d+\.?\d*)/)?.[1] ||
                        $review.find('.a-icon-star').text().match(/(\d+\.?\d*)/)?.[1] || 0),
                    isVerified: $review.find('[data-hook="avp-badge"]').length > 0 || $review.find('.a-declarative:contains("Verified Purchase")').length > 0,
                    helpfulCount: parseInt($review.find('[data-hook="helpful-vote-statement"]').text().match(/(\d+)/)?.[1] || 0),
                    date: $review.find('[data-hook="review-date"]').text().trim(),
                    url: productUrl
                };

                // Remove "5.0 out of 5 stars" or similar from title if present
                if (review.title.match(/^\d+\.?\d* out of 5 stars/)) {
                    review.title = review.title.replace(/^\d+\.?\d* out of 5 stars\s*/, '');
                }

                if (review.content && review.content.length > 5) {
                    reviews.push(review);
                }
            });

            // Try to go to next page
            if (reviews.length < limit && currentPage < maxPages) {
                try {
                    const nextButton = await page.$('.a-pagination .a-last:not(.a-disabled) a');
                    if (nextButton) {
                        await nextButton.click();
                        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
                        currentPage++;
                    } else {
                        break; // No more pages
                    }
                } catch (e) {
                    console.log('✅ Reached last page or navigation failed');
                    break;
                }
            } else {
                break;
            }

            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`✅ Scraped ${reviews.length} Amazon reviews`);
        return { success: true, reviews, count: reviews.length };

    } catch (error) {
        console.error('❌ Amazon scraping error:', error);
        return { success: false, reviews: [], error: error.message };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Scrape Amazon product metadata (name, price, image, etc.)
 * @param {string} productUrl - Amazon product URL
 * @returns {Promise<Object>} Product metadata
 */
async function scrapeAmazonProductMetadata(productUrl) {
    let browser;
    try {
        console.log('🔍 Scraping Amazon product metadata...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        console.log(`🌐 Navigating to product page: ${productUrl}`);
        await page.goto(productUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        }).catch(err => console.warn(`⚠️ Metadata navigation warning: ${err.message}`));

        // Wait a small bit for JS to render if needed
        await new Promise(resolve => setTimeout(resolve, 2000));

        const html = await page.content();
        const $ = cheerio.load(html);

        const metadata = {
            name: $('#productTitle').text().trim(),
            description: $('#feature-bullets').text().trim() ||
                $('#productDescription').text().trim() ||
                $('#important-information').text().trim() ||
                $('[data-feature-name="productDescription"]').text().trim() ||
                'No description available.',
            brand: $('#bylineInfo').text().trim().replace(/^Visit the | Store$/g, '') ||
                $('#brand').text().trim() ||
                $('.po-brand').text().trim() ||
                'Amazon',
            price: parseFloat($('.a-price-whole').first().text().replace(/[^\d.]/g, '') ||
                $('#priceblock_ourprice').text().replace(/[^\d.]/g, '') ||
                $('#priceblock_dealprice').text().replace(/[^\d.]/g, '') || 0),
            currency: $('.a-price-symbol').first().text().trim() ||
                $('.currency-symbol').first().text().trim() || 'INR',
            imageUrl: $('#landingImage').attr('src') ||
                $('#imgBlkFront').attr('src') ||
                $('#main-image').attr('src') ||
                'https://via.placeholder.com/300?text=No+Image',
            amazonUrl: productUrl,
            category: 'Electronics'
        };

        // Clean up brand
        if (metadata.brand.includes(':')) {
            metadata.brand = metadata.brand.split(':')[1].trim();
        }

        if (!metadata.name) {
            return {
                success: false,
                error: 'Could not find product title. Please ensure this is a valid Amazon product page.'
            };
        }

        console.log('✅ Extracted metadata:', metadata.name.substring(0, 50));
        return { success: true, metadata };
    } catch (error) {
        console.error('❌ Amazon metadata extraction error:', error);
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close();
    }
}

/**
 * Extract product ASIN from Amazon URL
 * @param {string} url - Amazon product URL
 * @returns {string|null} ASIN or null
 */
function extractASIN(url) {
    if (!url) return null;
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|\/product\/([A-Z0-9]{10})|([A-Z0-9]{10})/i);
    // Be careful with the 4th group as it might match other garbage, so prioritize the first three
    if (asinMatch) {
        return asinMatch[1] || asinMatch[2] || asinMatch[3] || (asinMatch[0].length === 10 ? asinMatch[0] : null);
    }
    return null;
}

module.exports = {
    scrapeAmazonReviews,
    scrapeAmazonProductMetadata,
    extractASIN
};
