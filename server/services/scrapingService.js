const { 
    scrapeAllSources, 
    processScrapedReviews, 
    normalizeReviews, 
    deduplicateReviews 
} = require('./scraper');
const db = require('../models');
const { summarizeReviewsWithGemini } = require('./geminiService');
const { Product, Review, ReviewSource, ScrapingJob } = db;

/**
 * Orchestrate the scraping of product reviews and update the database
 * @param {Object} product - Sequelize Product instance
 * @param {Array} sources - Array of source names (e.g., ['amazon', 'flipkart'])
 * @param {Object} options - Scraping options
 * @param {Array} jobs - Array of Sequelize ScrapingJob instances
 */
async function runProductScraping(product, sources, options = {}, jobs = []) {
    try {
        console.log(`🚀 Starting scraping process for product: ${product.name}`);
        
        for (const job of jobs) {
            await job.update({ status: 'running', startedAt: new Date() });
        }

        const results = await scrapeAllSources(product, sources, options);

        let allReviews = [];
        for (const [sourceName, result] of Object.entries(results.sources)) {
            if (result.success && result.reviews) {
                allReviews = allReviews.concat(result.reviews);
            }
        }

        console.log(`🔍 Found ${allReviews.length} raw reviews across all sources`);

        allReviews = normalizeReviews(allReviews);
        allReviews = deduplicateReviews(allReviews);
        
        console.log(`✨ After normalization and deduplication: ${allReviews.length} reviews`);

        const processedReviews = await processScrapedReviews(allReviews);

        let savedCount = 0;
        for (const review of processedReviews) {
            try {
                const source = await ReviewSource.findOne({ where: { name: review.source } });
                if (!source) {
                    console.warn(`⚠️ Source ${review.source} not found in database`);
                    continue;
                }

                await Review.create({
                    productId: product.id,
                    userId: null, // Scraped reviews don't have a platform user
                    sourceId: source.id,
                    externalId: review.externalId,
                    rating: review.rating,
                    title: review.title,
                    content: review.content,
                    sentimentScore: review.sentimentScore || 0,
                    sentimentLabel: review.sentimentLabel || 'neutral',
                    keyPhrases: review.keyPoints || [],
                    emotions: review.emotions || {},
                    fakeScore: review.fakeScore || 0,
                    isSuspicious: review.isSuspicious || false,
                    isVerified: review.isVerified,
                    helpfulCount: review.helpfulCount || 0,
                    moderationStatus: 'approved'
                });
                savedCount++;
            } catch (err) {
                if (err.name !== 'SequelizeUniqueConstraintError') {
                    console.error('❌ Error saving review:', err.message);
                }
            }
        }

        console.log(`✅ Saved ${savedCount} new reviews to database`);

        // Update product stats
        if (savedCount > 0 || allReviews.length > 0) {
            const allProductReviews = await Review.findAll({ where: { productId: product.id } });
            const avgRating = allProductReviews.length > 0 
                ? allProductReviews.reduce((acc, r) => acc + r.rating, 0) / allProductReviews.length 
                : 0;

            await product.update({
                averageRating: avgRating,
                reviewCount: allProductReviews.length
            });

            // Summarize with AI
            try {
                console.log('🤖 Generating AI summary for product...');
                const summary = await summarizeReviewsWithGemini(processedReviews, product);
                await product.update({
                    aiSummary: summary.summary,
                    aiPros: summary.pros,
                    aiCons: summary.cons,
                    aiKeyPhrases: summary.commonThemes || summary.keyPhrases || [],
                    aiLastUpdated: new Date(),
                    sentimentScore: processedReviews.length > 0 
                        ? processedReviews.reduce((acc, r) => acc + (r.sentimentScore || 0), 0) / processedReviews.length 
                        : 0
                });
                console.log('✨ AI summary updated');
            } catch (summaryErr) {
                console.error('❌ Error generating AI summary:', summaryErr.message);
            }
        }

        for (const job of jobs) {
            await job.update({
                status: 'completed',
                reviewsFound: allReviews.length,
                reviewsProcessed: savedCount,
                completedAt: new Date()
            });
        }
        
        return {
            success: true,
            reviewsFound: allReviews.length,
            reviewsSaved: savedCount
        };

    } catch (error) {
        console.error('❌ Background scraping error:', error);
        for (const job of jobs) {
            await job.update({
                status: 'failed',
                errorMessage: error.message,
                completedAt: new Date()
            });
        }
        throw error;
    }
}

module.exports = {
    runProductScraping
};
