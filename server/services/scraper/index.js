const { scrapeAmazonReviews, scrapeAmazonProductMetadata } = require('./amazonScraper');
const { scrapeFlipkartReviews, scrapeFlipkartProductMetadata } = require('./flipkartScraper');
const { analyzeSentimentWithGemini, detectFakeReviewWithGemini } = require('../geminiService');

/**
 * Orchestrate scraping from multiple sources
 * @param {Object} product - Product information
 * @param {Array} sources - Sources to scrape from
 * @param {Object} options - Scraping options
 * @returns {Promise<Object>} Aggregated results
 */
async function scrapeAllSources(product, sources = ['amazon'], options = {}) {
    const results = {
        product: product.name,
        sources: {},
        totalReviews: 0,
        errors: []
    };

    const scrapingPromises = [];


    // Amazon
    if (sources.includes('amazon') && product.amazonUrl) {
        scrapingPromises.push(
            scrapeAmazonReviews(product.amazonUrl, options.amazon)
                .then(result => {
                    results.sources.amazon = result;
                    if (result.success) {
                        results.totalReviews += result.count;
                    }
                })
                .catch(error => {
                    results.errors.push({ source: 'amazon', error: error.message });
                })
        );
    }

    // Flipkart
    if (sources.includes('flipkart') && product.flipkartUrl) {
        scrapingPromises.push(
            scrapeFlipkartReviews(product.flipkartUrl, options.flipkart)
                .then(result => {
                    results.sources.flipkart = result;
                    if (result.success) {
                        results.totalReviews += result.count;
                    }
                })
                .catch(error => {
                    results.errors.push({ source: 'flipkart', error: error.message });
                })
        );
    }

    // Wait for all scraping to complete
    await Promise.all(scrapingPromises);

    return results;
}

/**
 * Process and enrich scraped reviews with AI analysis
 * @param {Array} reviews - Raw scraped reviews
 * @returns {Promise<Array>} Processed reviews with AI insights
 */
async function processScrapedReviews(reviews) {
    const processed = [];

    for (const review of reviews) {
        try {
            // Analyze sentiment with Gemini
            const sentiment = await analyzeSentimentWithGemini(review.content);

            // Detect fake reviews
            const fakeDetection = await detectFakeReviewWithGemini(review.content, {
                rating: review.rating,
                isVerified: review.isVerified
            });

            processed.push({
                ...review,
                sentimentScore: sentiment.score,
                sentimentLabel: sentiment.label,
                emotions: sentiment.emotions,
                keyPoints: sentiment.keyPoints,
                fakeScore: fakeDetection.fakeScore,
                isSuspicious: fakeDetection.isSuspicious,
                fakeFlags: fakeDetection.flags
            });

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('Error processing review:', error);
            processed.push(review); // Add without AI analysis
        }
    }

    return processed;
}

/**
 * Normalize review data from different sources
 * @param {Array} reviews - Reviews from various sources
 * @returns {Array} Normalized reviews
 */
function normalizeReviews(reviews) {
    return reviews.map(review => ({
        source: review.source,
        externalId: review.externalId || review.id,
        title: review.title || '',
        content: review.content || review.body || review.text || '',
        author: review.author || review.username || 'Anonymous',
        rating: review.rating || estimateRating(review),
        isVerified: review.isVerified || review.verified_purchase || false,
        helpfulCount: review.helpfulCount || review.score || 0,
        createdAt: parseDate(review.createdAt || review.date || review.created_at),
        url: review.url || review.permalink || '',
        metadata: {}
    }));
}

/**
 * Estimate rating from review content if not provided
 * @param {Object} review - Review object
 * @returns {number} Estimated rating (1-5)
 */
function estimateRating(review) {
    return 3; // Default neutral
}

/**
 * Parse date from various formats
 * @param {string|Date|number} dateInput - Date in various formats
 * @returns {Date} Parsed date
 */
function parseDate(dateInput) {
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'number') return new Date(dateInput);
    if (typeof dateInput === 'string') {
        // Try to parse common date formats
        const date = new Date(dateInput);
        return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
}

/**
 * Remove duplicate reviews based on content similarity
 * @param {Array} reviews - Array of reviews
 * @returns {Array} Deduplicated reviews
 */
function deduplicateReviews(reviews) {
    const unique = [];
    const seenContent = new Set();

    for (const review of reviews) {
        // Create a simplified version of content for comparison
        const normalized = review.content
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .trim()
            .substring(0, 100);

        if (!seenContent.has(normalized)) {
            seenContent.add(normalized);
            unique.push(review);
        }
    }

    console.log(`🔍 Removed ${reviews.length - unique.length} duplicate reviews`);
    return unique;
}

module.exports = {
    scrapeAllSources,
    scrapeAmazonProductMetadata,
    scrapeFlipkartProductMetadata,
    processScrapedReviews,
    normalizeReviews,
    deduplicateReviews
};
