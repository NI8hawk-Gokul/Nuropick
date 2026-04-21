const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { scrapeAllSources, processScrapedReviews, normalizeReviews, deduplicateReviews } = require('../services/scraper');
const { Product, Review, ReviewSource, ScrapingJob } = require('../models');

/**
 * @route   POST /api/scraping/start/:productId
 * @desc    Start scraping reviews for a product
 * @access  Private
 */
router.post('/start/:productId', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const { sources = ['amazon'], options = {} } = req.body;

        // Find product
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Create scraping jobs for each source
        const jobs = [];
        for (const sourceName of sources) {
            const source = await ReviewSource.findOne({ where: { name: sourceName } });
            if (!source) continue;

            const job = await ScrapingJob.create({
                productId: product.id,
                sourceId: source.id,
                status: 'pending',
                options
            });

            jobs.push(job);
        }

        // Start scraping in background (don't await)
        performScraping(product, sources, options, jobs).catch(console.error);

        res.json({
            success: true,
            message: 'Scraping started',
            jobs: jobs.map(j => ({ id: j.id, source: sources[jobs.indexOf(j)], status: j.status }))
        });
    } catch (error) {
        console.error('Start scraping error:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting scraping',
            error: error.message
        });
    }
});

/**
 * Background scraping function
 */
async function performScraping(product, sources, options, jobs) {
    try {
        // Update jobs to running
        for (const job of jobs) {
            await job.update({ status: 'running', startedAt: new Date() });
        }

        // Scrape from all sources
        const results = await scrapeAllSources(product, sources, options);

        // Collect all reviews
        let allReviews = [];
        for (const [sourceName, result] of Object.entries(results.sources)) {
            if (result.success && result.reviews) {
                allReviews = allReviews.concat(result.reviews);
            }
        }

        // Normalize and deduplicate
        allReviews = normalizeReviews(allReviews);
        allReviews = deduplicateReviews(allReviews);

        // Process with AI
        const processedReviews = await processScrapedReviews(allReviews);

        // Save to database
        let savedCount = 0;
        for (const review of processedReviews) {
            try {
                const source = await ReviewSource.findOne({ where: { name: review.source } });

                await Review.create({
                    productId: product.id,
                    userId: null, // Scraped reviews don't have a user
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
                // Skip duplicates
                if (err.name !== 'SequelizeUniqueConstraintError') {
                    console.error('Error saving review:', err);
                }
            }
        }

        // Update jobs to completed
        for (const job of jobs) {
            await job.update({
                status: 'completed',
                reviewsFound: allReviews.length,
                reviewsProcessed: savedCount,
                completedAt: new Date()
            });
        }

        console.log(`✅ Scraping completed: ${savedCount} reviews saved`);
    } catch (error) {
        console.error('Scraping error:', error);

        // Update jobs to failed
        for (const job of jobs) {
            await job.update({
                status: 'failed',
                errorMessage: error.message,
                completedAt: new Date()
            });
        }
    }
}

/**
 * @route   GET /api/scraping/status/:jobId
 * @desc    Get scraping job status
 * @access  Public
 */
router.get('/status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await ScrapingJob.findByPk(jobId, {
            include: [
                { model: ReviewSource, as: 'source' },
                { model: Product, as: 'product' }
            ]
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.json({
            success: true,
            job: {
                id: job.id,
                status: job.status,
                reviewsFound: job.reviewsFound,
                reviewsProcessed: job.reviewsProcessed,
                error: job.errorMessage,
                startedAt: job.startedAt,
                completedAt: job.completedAt,
                source: job.source?.name,
                product: job.product?.name
            }
        });
    } catch (error) {
        console.error('Get job status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching job status',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/scraping/sources
 * @desc    Get available review sources
 * @access  Public
 */
router.get('/sources', async (req, res) => {
    try {
        const sources = await ReviewSource.findAll({
            where: { isActive: true }
        });

        res.json({
            success: true,
            sources
        });
    } catch (error) {
        console.error('Get sources error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sources',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/scraping/jobs/product/:productId
 * @desc    Get all scraping jobs for a product
 * @access  Public
 */
router.get('/jobs/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const jobs = await ScrapingJob.findAll({
            where: { productId },
            include: [{ model: ReviewSource, as: 'source' }],
            order: [['created_at', 'DESC']],
            limit: 20
        });

        res.json({
            success: true,
            jobs
        });
    } catch (error) {
        console.error('Get product jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching jobs',
            error: error.message
        });
    }
});

module.exports = router;
