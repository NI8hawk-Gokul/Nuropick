const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/auth');
const { summarizeReviewsWithGemini, generateBulkAIReviews } = require('../services/geminiService');
const { extractUrl, cleanUrl } = require('../utils/urlHelper');
const { scrapeAmazonProductMetadata, scrapeFlipkartProductMetadata, scrapeAllSources, processScrapedReviews, normalizeReviews, deduplicateReviews } = require('../services/scraper');
const { runProductScraping } = require('../services/scrapingService');
const db = require('../models');
const { Product, Review, ReviewSource, ScrapingJob, User, sequelize } = db;

console.log('DEBUG: User model loaded:', !!User);

// @route   GET /api/products
// @desc    Get all products with pagination and filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            search,
            sortBy = 'created_at',
            order = 'desc'
        } = req.query;

        // Map frontend field names to database column names
        const sortMapping = {
            'createdAt': 'created_at',
            'updatedAt': 'updated_at',
            'averageRating': 'average_rating',
            'reviewCount': 'review_count',
            'sentimentScore': 'sentiment_score'
        };

        const sortField = sortMapping[sortBy] || sortBy;

        const where = { isActive: true };

        // Category filter
        if (category && category !== 'all') {
            where.category = category;
        }

        // Search filter (name or description)
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: products } = await Product.findAndCountAll({
            where,
            order: [[sequelize.literal(sortField), order]],
            limit: parseInt(limit),
            offset: skip,
            include: [{ model: User, as: 'creator', attributes: ['username'] }]
        });

        res.json({
            success: true,
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get single product with reviews and AI insights
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: User, as: 'creator', attributes: ['username', 'avatar'] }]
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get reviews for this product
        const reviews = await Review.findAll({
            where: { productId: product.id, moderationStatus: 'approved' },
            include: [{ model: User, as: 'user', attributes: ['username', 'avatar'] }],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        // Generate AI insights if not recently updated
        const shouldUpdateInsights = !product.aiLastUpdated ||
            (Date.now() - new Date(product.aiLastUpdated).getTime() > 24 * 60 * 60 * 1000);

        if (shouldUpdateInsights) {
            try {
                const insights = await summarizeReviewsWithGemini(reviews, product);
                await product.update({
                    aiSummary: insights.summary,
                    aiPros: insights.pros,
                    aiCons: insights.cons,
                    aiKeyPhrases: insights.commonThemes,
                    aiLastUpdated: new Date()
                });
            } catch (aiError) {
                console.error('AI insight generation failed:', aiError);
            }
        }

        res.json({
            success: true,
            product,
            reviews,
            reviewStats: {
                total: product.reviewCount,
                average: product.averageRating,
                sentimentScore: product.sentimentScore
            }
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            brand,
            imageUrl,
            images,
            specifications,
            price,
            currency,
            amazonUrl,
            flipkartUrl
        } = req.body;

        // Validation
        if (!name || !description || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, description, and category'
            });
        }

        const product = await Product.create({
            name,
            description,
            category,
            brand,
            imageUrl,
            price,
            currency,
            amazonUrl,
            flipkartUrl,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user is the creator or admin
        if (product.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        await product.update(req.body);

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

// @route   POST /api/products/analyze-url
// @desc    Analyze a product URL, create it if new, and start scraping
// @access  Private
router.post('/analyze-url', authMiddleware, async (req, res) => {
    try {
        let { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a product URL'
            });
        }

        // Clean and extract URL from potential shared message
        const extractedUrl = extractUrl(url);
        if (!extractedUrl) {
            return res.status(400).json({
                success: false,
                message: 'No valid URL found in the provided text'
            });
        }

        // Resolve short URLs (amzn.in, dl.flipkart.com, etc.) by following redirects
        url = await new Promise((resolve) => {
            try {
                const parsedUrl = new URL(extractedUrl);
                const lib = parsedUrl.protocol === 'https:' ? require('https') : require('http');
                const req = lib.get(extractedUrl, { timeout: 5000 }, (res) => {
                    resolve(res.headers.location || extractedUrl);
                });
                req.on('error', () => resolve(extractedUrl));
                req.on('timeout', () => { req.destroy(); resolve(extractedUrl); });
            } catch { resolve(extractedUrl); }
        });


        // Clean and canonicalize
        url = cleanUrl(url);

        // Normalize Amazon URL and check if it's a product page
        if (url.includes('amazon.in') || url.includes('amazon.com')) {
            const { extractASIN } = require('../services/scraper/amazonScraper');
            const asin = extractASIN(url);
            if (asin) {
                const domain = url.includes('amazon.in') ? 'amazon.in' : 'amazon.com';
                url = `https://www.${domain}/dp/${asin}/`;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'The URL provided does not look like a specific Amazon product page. Please provide a direct product link.'
                });
            }
        }

        // Check if product already exists
        let product = await Product.findOne({
            where: {
                [Op.or]: [
                    { amazonUrl: url },
                    { flipkartUrl: url }
                ]
            }
        });

        if (product) {
            // Trigger a re-scrape if it hasn't been done in 24 hours
            const lastScraped = product.aiLastUpdated;
            const needsUpdate = !lastScraped || (Date.now() - new Date(lastScraped).getTime() > 24 * 60 * 60 * 1000);
            
            if (needsUpdate) {
                console.log(`🔄 Product ${product.id} needs update. Triggering scrape.`);
                const sources = url.includes('amazon.') ? ['amazon'] : ['flipkart', 'amazon'];
                
                const jobs = [];
                for (const sourceName of sources) {
                    const source = await ReviewSource.findOne({ where: { name: sourceName } });
                    if (source) {
                        const job = await ScrapingJob.create({
                            productId: product.id,
                            sourceId: source.id,
                            status: 'pending'
                        });
                        jobs.push(job);
                    }
                }
                performScraping(product, sources, {}, jobs).catch(console.error);
            }

            return res.json({
                success: true,
                message: 'Product already exists' + (needsUpdate ? '. Re-scraping started.' : ''),
                productId: product.id,
                isNew: false
            });
        }

        // Scrape metadata
        let metadataResult;
        let sources = [];
        if (url.includes('amazon.in') || url.includes('amazon.com')) {
            metadataResult = await scrapeAmazonProductMetadata(url);
            sources = ['amazon'];
        } else if (url.includes('flipkart.com')) {
            metadataResult = await scrapeFlipkartProductMetadata(url);
            sources = ['flipkart', 'amazon']; // Try both if possible, but definitely flipkart
        } else {
            return res.status(400).json({
                success: false,
                message: 'Currently only Amazon and Flipkart URLs are supported for automated analysis'
            });
        }

        if (!metadataResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to extract product metadata',
                error: metadataResult.error
            });
        }

        const { metadata } = metadataResult;

        // Ensure mandatory fields for Sequelize
        if (!metadata.description) {
            metadata.description = metadata.name; // Fallback to name if description is missing
        }
        if (metadata.description.length > 2000) {
            metadata.description = metadata.description.substring(0, 1997) + '...';
        }

        // Create product
        product = await Product.create({
            ...metadata,
            createdBy: req.user.id
        });

        // Trigger scraping in background
        const options = {};

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

        // Start background scraping
        performScraping(product, sources, options, jobs).catch(console.error);

        res.status(201).json({
            success: true,
            message: 'Product analyzed and created successfully. Scraping in progress.',
            product,
            isNew: true
        });
    } catch (error) {
        console.error('Analyze URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing product URL',
            error: error.message
        });
    }
});

// Helper function for background scraping
async function performScraping(product, sources, options, jobs) {
    try {
        await runProductScraping(product, sources, options, jobs);
        console.log(`✅ Background scraping completed for product ${product.id}`);
    } catch (error) {
        console.error(`❌ Background scraping failed for product ${product.id}:`, error.message);
    }

    // Always generate 50 AI reviews as per user request
    try {
        console.log(`🤖 Generating 50 AI reviews for product ${product.id}...`);
        const aiReviews = await generateBulkAIReviews(product, 50);
        
        if (aiReviews && aiReviews.length > 0) {
            const reviewsToCreate = aiReviews.map(r => ({
                productId: product.id,
                rating: r.rating,
                title: r.title,
                content: r.content,
                author: r.reviewerName, // Map to author field if it exists, or just leave as is
                sentimentScore: r.sentimentScore,
                sentimentLabel: r.sentimentLabel,
                isAiGenerated: true,
                moderationStatus: 'approved'
            }));
            
            await Review.bulkCreate(reviewsToCreate);
            console.log(`✅ ${reviewsToCreate.length} AI reviews added to product ${product.id}`);
        }
    } catch (aiError) {
        console.error(`❌ AI review generation failed for product ${product.id}:`, aiError.message);
    }

    // Always generate AI synthesis after scraping and AI review generation
    try {
        console.log(`🤖 Generating AI synthesis for product ${product.id}...`);

        // Re-fetch product to include all reviews (scraped + AI generated)
        const freshProduct = await Product.findByPk(product.id, {
            include: [{ model: Review, as: 'reviews', limit: 100, order: [['created_at', 'DESC']] }]
        });

        if (!freshProduct) return;

        const reviews = freshProduct.reviews || [];
        const summary = await summarizeReviewsWithGemini(reviews, freshProduct);

        await freshProduct.update({
            aiSummary: summary.summary,
            aiPros: summary.pros,
            aiCons: summary.cons,
            aiKeyPhrases: summary.commonThemes,
            sentimentScore: summary.sentimentScore,
            aiLastUpdated: new Date()
        });

        console.log(`✅ AI synthesis saved for product ${product.id} (${reviews.length} total reviews)`);
    } catch (synthError) {
        console.error(`❌ AI synthesis failed for product ${product.id}:`, synthError.message);
    }
}

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user is the creator or admin
        if (product.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        // Soft delete
        await product.update({ isActive: false });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
});

// @route   POST /api/products/:id/scrape
// @desc    Manually trigger scraping for a product
// @access  Private
router.post('/:id/scrape', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Determine sources based on stored URLs
        const sources = [];
        if (product.amazonUrl) sources.push('amazon');
        if (product.flipkartUrl) sources.push('flipkart');

        if (sources.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No scraping sources available for this product'
            });
        }

        const jobs = [];
        for (const sourceName of sources) {
            const source = await ReviewSource.findOne({ where: { name: sourceName } });
            if (source) {
                const job = await ScrapingJob.create({
                    productId: product.id,
                    sourceId: source.id,
                    status: 'pending'
                });
                jobs.push(job);
            }
        }

        // Start background scraping
        performScraping(product, sources, { limit: 20 }, jobs).catch(console.error);

        res.json({
            success: true,
            message: 'Scraping and AI analysis started in background',
            jobsCount: jobs.length
        });
    } catch (error) {
        console.error('Trigger scrape error:', error);
        res.status(500).json({
            success: false,
            message: 'Error triggering scrape',
            error: error.message
        });
    }
});

// @route   GET /api/products/categories/list

module.exports = router;
