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
        await page.setViewport({ width: 1280, height: 1000 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        console.log(`🌐 Navigating to product page: ${productUrl}`);
        await page.goto(productUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        }).catch(err => console.warn(`⚠️ Metadata navigation warning: ${err.message}`));

        // Close login modal if it appears
        try {
            const closeBtn = await page.$('span._30XB9F, button._2KpZ6l._2doB9z, span:contains("✕")');
            if (closeBtn) await closeBtn.click();
        } catch (e) {}

        // Wait for product title or price
        try {
            await page.waitForSelector('h1, .B_NuCI, ._30jeq3, .VU-Z7G, .Nx9bqj', { timeout: 15000 });
        } catch (e) {
            console.warn('⚠️ Timeout waiting for main selectors');
        }

        // Extra delay to ensure dynamic content is loaded
        await new Promise(resolve => setTimeout(resolve, 4000));

        const html = await page.content();
        const $ = cheerio.load(html);

        // Robust Title Extraction
        let name = $('h1').first().text().trim() || 
                   $('span.B_NuCI').text().trim() ||
                   $('.VU-Z7G').text().trim() ||
                   $('.yhB1nd').text().trim() ||
                   $('.KzDlHZ').text().trim() ||
                   $('title').text().split('|')[0].split('-')[0].trim();

        // Clean name from common garbage
        name = name.replace(/FlipkartSearch|IconSearch|Search Icon|Login|Cart/gi, '').trim();

        // Robust Price Extraction
        let priceContainer = $('.Nx9bqj._4b5DiR').first().text() ||
                              $('.Nx9bqj').first().text() ||
                              $('._30jeq3._16Jk6d').first().text() ||
                              $('div._30jeq3').first().text() ||
                              $('div.Nx9Z0j').first().text() ||
                              $('.Nx9XNo').first().text() ||
                              '0';
        
        // Ensure we only take the first price if multiple are found
        if (priceContainer.includes('₹')) {
            priceContainer = priceContainer.split('₹')[1];
        } else if (priceContainer === '0') {
            // Last resort: search for any element containing the ₹ symbol
            const genericPrice = $('*:contains("₹")').last().text();
            if (genericPrice) priceContainer = genericPrice.split('₹')[1] || genericPrice;
        }
        
        const price = parseFloat(priceContainer.replace(/[^\d.]/g, '')) || 0;

        // Robust Image Extraction
        let imageUrl = $('img.DByo_b').attr('src') ||
                       $('img._396cs4').attr('src') || 
                       $('img.DByoH4').attr('src') ||
                       $('._2r_T1I._396cs4').attr('src') || 
                       $('.DByo_b img').attr('src') || 
                       $('img.oS996i').attr('src') ||
                       $('.j-m89b img').attr('src') ||
                       $('img[src*="rukminim"]').attr('src');

        // If we found an image URL, ensure it's absolute
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = 'https:' + imageUrl;
        }

        const metadata = {
            name: name || 'Unknown Flipkart Product',
            description: $('.pSwwYy').text().trim() || 
                         $('._1mXo7f').text().trim() || 
                         $('.yN7Pyo').text().trim() || 
                         $('.X30m7a').text().trim() ||
                         $('.RmoS19').text().trim() ||
                         'High-quality product with advanced features and premium design.',
            brand: $('.G9uS3y').text().trim() || '',
            price: price,
            currency: 'INR',
            imageUrl: imageUrl || 'https://via.placeholder.com/300?text=No+Image',
            flipkartUrl: productUrl,
            category: 'Electronics'
        };

        // If name is still garbage or very short, try alt selectors
        if (!metadata.name || metadata.name.length < 5 || metadata.name.includes('Buy Products Online')) {
             const altName = $('._4rR01T').first().text().trim() || $('.s1Q9rs').first().text().trim();
             if (altName) metadata.name = altName;
        }

        // Final check to avoid garbage names
        if (metadata.name.includes('Buy Products Online') && metadata.price === 0) {
            return { success: false, error: 'Could not resolve product details. Flipkart might be blocking the request.' };
        }

        // Clean up brand
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

/**
 * Search for products on Flipkart
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object>} Search results
 */
async function searchFlipkartProducts(query, limit = 5) {
    let browser;
    try {
        console.log(`🔍 Searching Flipkart for: ${query}`);
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1000 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Close login modal if it appears
        try {
            const closeBtn = await page.$('span._30XB9F, button._2KpZ6l._2doB9z');
            if (closeBtn) await closeBtn.click();
        } catch (e) {}

        // Wait for any of the result containers
        try {
            await page.waitForSelector('a.k7wcnx, ._1AtVbE, ._4ddWXP, ._1fQ6S9', { timeout: 15000 });
        } catch (e) {
            console.warn('⚠️ Search results timeout');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        const html = await page.content();
        const $ = cheerio.load(html);
        const results = [];

        // Try NEW List Layout (found by subagent)
        $('a.k7wcnx, a._1fQ6S9').each((i, el) => {
            if (results.length >= limit) return;
            const $el = $(el);
            const title = $el.find('div.KzDlHZ, ._4rR01T').first().text().trim();
            const href = $el.attr('href');
            const url = href ? 'https://www.flipkart.com' + href.split('?')[0] : null;
            const priceText = $el.find('.Nx9bqj, ._30jeq3').first().text().trim();
            const price = parseFloat(priceText.replace(/[^\d.]/g, '') || 0);
            const imageUrl = $el.find('img.DByo_b, img.DByoH4, img._396cs4').attr('src');

            if (title && url) {
                results.push({ name: title, flipkartUrl: url, price, imageUrl, source: 'flipkart' });
            }
        });

        // Fallback to List Layout Variant 2
        if (results.length === 0) {
            $('._1AtVbE ._13oc-S, ._7599fX').each((i, el) => {
                if (results.length >= limit) return;
                const $el = $(el);
                const title = $el.find('._4rR01T, .KzYhLc').text().trim();
                const href = $el.find('a').attr('href');
                const url = href ? 'https://www.flipkart.com' + href.split('?')[0] : null;
                const price = parseFloat($el.find('.Nx9bqj, ._30jeq3').text().replace(/[^\d.]/g, '') || 0);
                const imageUrl = $el.find('img._396cs4, img.DByo_b').attr('src');

                if (title && url) {
                    results.push({ name: title, flipkartUrl: url, price, imageUrl, source: 'flipkart' });
                }
            });
        }

        // Try Grid Layout
        if (results.length === 0) {
            $('._4ddWXP, ._1xHGtK, .pIpigb').each((i, el) => {
                if (results.length >= limit) return;
                const $el = $(el);
                const title = $el.find('.s1Q9rs, .IRpwTa, .W_R19z').text().trim();
                const href = $el.find('a').attr('href');
                const url = href ? 'https://www.flipkart.com' + href.split('?')[0] : null;
                const priceText = $el.find('.Nx9bqj, ._30jeq3').text().trim();
                const price = parseFloat(priceText.replace(/[^\d.]/g, '') || 0);
                const imageUrl = $el.find('img._396cs4, img.DByo_b').attr('src');

                if (title && url) {
                    results.push({ name: title, flipkartUrl: url, price, imageUrl, source: 'flipkart' });
                }
            });
        }

        console.log(`✅ Found ${results.length} Flipkart search results`);
        return { success: true, results };
    } catch (error) {
        console.error('❌ Flipkart search error:', error);
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = {
    scrapeFlipkartReviews,
    scrapeFlipkartProductMetadata,
    searchFlipkartProducts
};
