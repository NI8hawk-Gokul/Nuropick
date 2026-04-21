const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

/**
 * Scrape Flipkart product reviews
 * @param {string} productUrl - Flipkart product URL
 * @param {Object} options - Scraping options
 * @returns {Promise<Array>} Array of reviews
 */
async function scrapeFlipkartReviews(productUrl, options = {}) {
    const { limit = 50, headless = 'new' } = options;

    let browser;
    const reviews = [];

    try {
        console.log('🔍 Starting Flipkart scraper...');

        browser = await puppeteer.launch({
            headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        // Navigate to product page
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Scroll to reviews section
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        let currentPage = 1;
        const maxPages = Math.ceil(limit / 10);

        while (currentPage <= maxPages && reviews.length < limit) {
            console.log(`📄 Scraping Flipkart page ${currentPage}...`);

            const html = await page.content();
            const $ = cheerio.load(html);

            // Flipkart review selectors (may need adjustment based on current site structure)
            $('._27M-vq, .col._2wzgFH').each((i, element) => {
                const $review = $(element);

                const ratingText = $review.find('._3LWZlK, .hGSR34').text().trim();
                const rating = parseFloat(ratingText.match(/(\d+)/)?.[1] || 0);

                const review = {
                    source: 'flipkart',
                    externalId: `flipkart-${Date.now()}-${i}`,
                    title: $review.find('._2-N8zT, .z9E0IG').text().trim(),
                    content: $review.find('.t-ZTKy, ._11pzQk').text().trim(),
                    author: $review.find('._2sc7ZR, ._3LYOAd').text().trim(),
                    rating: rating,
                    isVerified: $review.find('._1lRcqv, ._3Oa-_c').text().includes('Certified Buyer'),
                    helpfulCount: parseInt($review.find('._3c3Px5').text().match(/(\d+)/)?.[1] || 0),
                    date: $review.find('._2mcZGG, .row._3n8db9').text().trim(),
                    url: productUrl
                };

                if (review.content && review.content.length > 20) {
                    reviews.push(review);
                }
            });

            // Try to go to next page
            if (reviews.length < limit && currentPage < maxPages) {
                try {
                    const nextButton = await page.$('._1LKTO3 a:last-child, nav a:last-child');
                    if (nextButton) {
                        const isDisabled = await page.evaluate(el => {
                            return el.classList.contains('_3fVaIS') || el.getAttribute('aria-disabled') === 'true';
                        }, nextButton);

                        if (!isDisabled) {
                            await nextButton.click();
                            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
                            currentPage++;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } catch (e) {
                    console.log('✅ Reached last page or navigation failed');
                    break;
                }
            } else {
                break;
            }

            // Add delay
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`✅ Scraped ${reviews.length} Flipkart reviews`);
        return { success: true, reviews, count: reviews.length };

    } catch (error) {
        console.error('❌ Flipkart scraping error:', error);
        return { success: false, reviews: [], error: error.message };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Scrape Flipkart product metadata (name, price, image, etc.)
 * @param {string} productUrl - Flipkart product URL
 * @returns {Promise<Object>} Product metadata
 */
async function scrapeFlipkartProductMetadata(productUrl) {
    let browser;
    try {

        console.log('🔍 Scraping Flipkart product metadata...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        console.log(`🌐 Navigating to product page: ${productUrl}`);
        await page.goto(productUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        }).catch(err => console.warn(`⚠️ Metadata navigation warning: ${err.message}`));

        // Wait a bit for JS to render and final redirect to settle
        await new Promise(resolve => setTimeout(resolve, 5000));

        const html = await page.content();
        const $ = cheerio.load(html);

        // Log potential title elements for debugging
        console.log('DEBUG: h1 count:', $('h1').length);
        console.log('DEBUG: title tag:', $('title').text());

        const metadata = {
            name: String($('span.B_NuCI').text() ||
                $('.VU-Z7G').text() ||
                $('h1').text() ||
                $('.yhB1nd').text() ||
                $('title').text().split('|')[0] ||
                '').trim(),
            description: $('.pSwwYy').text().trim() || 
                         $('._1mXo7f').text().trim() || 
                         $('.yN7Pyo').text().trim() || 
                         $('.X30m7a').text().trim() ||
                         $('.RmoS19').text().trim() ||
                         'High-quality product with advanced features and premium design.',
            brand: $('.G9uS3y').text().trim() || '',
            price: parseFloat($('._30jeq3._16Jk6d').text().replace(/[^\d.]/g, '') ||
                $('.Nx9XNo').text().replace(/[^\d.]/g, '') ||
                $('.CDe91t').text().replace(/[^\d.]/g, '') || 0),
            currency: 'INR',
            imageUrl: $('._2r_T1I._396cs4').attr('src') || $('.DByo_b img').attr('src') || $('img.oS996i').attr('src') || 'https://via.placeholder.com/300?text=No+Image',
            flipkartUrl: productUrl,
            category: 'Electronics'
        };

        if (!metadata.name) {
            // Try another set of selectors
            metadata.name = $('.yhB1nd').text().trim();
        }

        if (!metadata.name) {
            return {
                success: false,
                error: 'Could not find product title. Please ensure this is a valid Flipkart product page.'
            };
        }

        // Clean up brand if it's empty but name has it
        if (!metadata.brand && metadata.name) {
            metadata.brand = metadata.name.split(' ')[0];
        }

        console.log('✅ Extracted metadata:', metadata.name.substring(0, 50));
        return { success: true, metadata };
    } catch (error) {
        console.error('❌ Flipkart metadata extraction error:', error);
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = {
    scrapeFlipkartReviews,
    scrapeFlipkartProductMetadata
};
