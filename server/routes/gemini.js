const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
    analyzeSentimentWithGemini,
    summarizeReviewsWithGemini,
    detectFakeReviewWithGemini,
    generateRecommendations,
    answerProductQuestion,
    analyzeImageWithGemini,
    analyzePriceIntelligence
} = require('../services/geminiService');
const { Product, Review, User } = require('../models');

/**
 * @route   POST /api/gemini/analyze
 * @desc    Analyze product reviews with Gemini AI
 * @access  Public
 */
router.post('/analyze', async (req, res) => {
    try {
        const { productId } = req.body;

        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get all reviews for the product
        const reviews = await Review.findAll({
            where: { productId },
            limit: 50,
            order: [['created_at', 'DESC']]
        });

        if (reviews.length === 0) {
            return res.json({
                success: true,
                message: 'No reviews to analyze',
                analysis: null
            });
        }

        // Summarize with Gemini
        const summary = await summarizeReviewsWithGemini(reviews);

        // Update product with AI insights
        await product.update({
            aiSummary: summary.summary,
            aiPros: JSON.stringify(summary.pros),
            aiCons: JSON.stringify(summary.cons),
            aiKeyPhrases: JSON.stringify(summary.commonThemes),
            aiLastUpdated: new Date()
        });

        res.json({
            success: true,
            analysis: summary
        });
    } catch (error) {
        console.error('Gemini analyze error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing product',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/gemini/recommend
 * @desc    Get AI-powered product recommendations
 * @access  Private
 */
router.post('/recommend', authMiddleware, async (req, res) => {
    try {
        const { category, limit = 5 } = req.body;

        // Get user preferences (simplified)
        const userPreferences = {
            userId: req.user.id,
            category: category || 'all'
        };

        // Get products
        const where = category ? { category, isActive: true } : { isActive: true };
        const products = await Product.findAll({
            where,
            limit: 50,
            order: [['averageRating', 'DESC']]
        });

        if (products.length === 0) {
            return res.json({
                success: true,
                recommendations: []
            });
        }

        // Generate recommendations with Gemini
        const recommendations = await generateRecommendations(userPreferences, products);

        // Fetch full product details for recommendations
        const recommendedProducts = [];
        for (const rec of recommendations.slice(0, limit)) {
            const product = products.find(p => p.id === rec.productId);
            if (product) {
                recommendedProducts.push({
                    ...product.toJSON(),
                    recommendationScore: rec.score,
                    reasoning: rec.reasoning
                });
            }
        }

        res.json({
            success: true,
            recommendations: recommendedProducts
        });
    } catch (error) {
        console.error('Gemini recommend error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating recommendations',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/gemini/chat
 * @desc    Chat with AI about products
 * @access  Public
 */
router.post('/chat', async (req, res) => {
    try {
        const { question, productId } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Question is required'
            });
        }

        let productData = null;
        if (productId) {
            const product = await Product.findByPk(productId, {
                include: [{ model: Review, as: 'reviews', limit: 10 }]
            });
            productData = product ? product.toJSON() : null;
        }

        const answer = await answerProductQuestion(question, productData);

        res.json({
            success: true,
            question,
            answer
        });
    } catch (error) {
        console.error('Gemini chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing question',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/gemini/analyze-visual
 * @desc    Analyze product image with NeroLens AI
 * @access  Public
 */
router.post('/analyze-visual', async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findByPk(productId);
        
        if (!product || !product.imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Product or product image not found'
            });
        }

        const visualAnalysis = await analyzeImageWithGemini(product.imageUrl);

        res.json({
            success: true,
            analysis: visualAnalysis
        });
    } catch (error) {
        console.error('NeroLens Route Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing visual analysis',
            error: error.message,
            stack: error.stack
        });
    }
});

/**
 * @route   POST /api/gemini/price-iq
 * @desc    Analyze product value vs price with NeroPrice IQ
 * @access  Public
 */
router.post('/price-iq', async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findByPk(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const priceAnalysis = await analyzePriceIntelligence(product);

        res.json({
            success: true,
            analysis: priceAnalysis
        });
    } catch (error) {
        console.error('NeroPrice IQ Route Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing price analysis',
            error: error.message,
            stack: error.stack
        });
    }
});

/**
 * @route   POST /api/gemini/detect-fake
 * @desc    Detect if a review is fake using Gemini
 * @access  Private
 */
router.post('/detect-fake', authMiddleware, async (req, res) => {
    try {
        const { reviewText, rating } = req.body;

        if (!reviewText) {
            return res.status(400).json({
                success: false,
                message: 'Review text is required'
            });
        }

        const detection = await detectFakeReviewWithGemini(reviewText, { rating });

        res.json({
            success: true,
            detection
        });
    } catch (error) {
        console.error('Gemini fake detection error:', error);
        res.status(500).json({
            success: false,
            message: 'Error detecting fake review',
            error: error.message
        });
    }
});

module.exports = router;
