const express = require('express');
const router = express.Router();
const { Review, Product, User, ReviewHelpfulVote, sequelize } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/auth');
const { analyzeSentiment, extractKeyPhrases } = require('../services/aiAnalysis');
const { detectFakeReview } = require('../services/fakeDetector');

// @route   GET /api/reviews/product/:productId
// @desc    Get all reviews for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            order = 'desc',
            rating
        } = req.query;

        // Map frontend field names to database column names
        const sortMapping = {
            'createdAt': 'created_at',
            'updatedAt': 'updated_at',
            'helpfulCount': 'helpful_count',
            'rating': 'rating'
        };

        const sortField = sortMapping[sortBy] || sortBy;

        const where = {
            productId: req.params.productId,
            moderationStatus: 'approved'
        };

        // Filter by rating if specified
        if (rating) {
            where.rating = parseInt(rating);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: reviews } = await Review.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['username', 'avatar'] }],
            order: [[sequelize.literal(sortField), order]],
            limit: parseInt(limit),
            offset: skip
        });

        res.json({
            success: true,
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
});

// @route   POST /api/reviews
// @desc    Submit a new review
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { product: productId, rating, title, content, images } = req.body;

        // Validation
        if (!productId || !rating || !title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide product, rating, title, and content'
            });
        }

        // Check if product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            where: {
                productId,
                userId: req.user.id
            }
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product. Please edit your existing review.'
            });
        }

        // Get user history for fake detection
        const userReviews = await Review.findAll({ where: { userId: req.user.id } });
        const userHistory = {
            reviewCount: userReviews.length,
            recentReviewCount: userReviews.filter(r =>
                Date.now() - new Date(r.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
            ).length
        };

        // AI Analysis
        const sentimentAnalysis = analyzeSentiment(content);
        const keyPhrases = extractKeyPhrases(content);
        const fakeDetection = detectFakeReview({ content, rating }, userHistory);

        // Create review
        const review = await Review.create({
            productId,
            userId: req.user.id,
            rating,
            title,
            content,
            sentimentScore: sentimentAnalysis.score,
            sentimentLabel: sentimentAnalysis.label,
            emotions: sentimentAnalysis.emotions,
            keyPhrases: keyPhrases,
            fakeScore: fakeDetection.fakeScore,
            isSuspicious: fakeDetection.isSuspicious,
            moderationStatus: fakeDetection.isSuspicious ? 'flagged' : 'approved'
        });

        // Update product statistics
        await updateProductStats(productId);

        // Update user review count and grant 3-5 points
        const user = await User.findByPk(req.user.id);
        if (user) {
            const pointsEarned = Math.floor(Math.random() * (5 - 3 + 1)) + 3;
            await user.update({ 
                reviewCount: user.reviewCount + 1,
                points: user.points + pointsEarned
            });
            // Store pointsEarned in response for frontend animation
            req.pointsEarned = pointsEarned;
        }

        const populatedReview = await Review.findByPk(review.id, {
            include: [
                { model: User, as: 'user', attributes: ['username', 'avatar'] },
                { model: Product, as: 'product', attributes: ['name'] }
            ]
        });

        res.status(201).json({
            success: true,
            message: fakeDetection.isSuspicious
                ? 'Review submitted and flagged for moderation'
                : 'Review submitted successfully',
            review: populatedReview,
            pointsEarned: req.pointsEarned || 0,
            aiAnalysis: {
                sentiment: sentimentAnalysis.label,
                isSuspicious: fakeDetection.isSuspicious,
                flags: fakeDetection.flags
            }
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating review',
            error: error.message
        });
    }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (own review only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns this review
        if (review.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }

        const { rating, title, content, images } = req.body;
        const updateData = {};

        // Re-run AI analysis if content changed
        if (content && content !== review.content) {
            const sentimentAnalysis = analyzeSentiment(content);
            const keyPhrases = extractKeyPhrases(content);

            updateData.sentimentScore = sentimentAnalysis.score;
            updateData.sentimentLabel = sentimentAnalysis.label;
            updateData.emotions = JSON.stringify(sentimentAnalysis.emotions);
            updateData.keyPhrases = JSON.stringify(keyPhrases);
        }

        // Update fields
        if (rating) updateData.rating = rating;
        if (title) updateData.title = title;
        if (content) updateData.content = content;

        await review.update(updateData);

        // Update product statistics
        await updateProductStats(review.productId);

        const updatedReview = await Review.findByPk(review.id, {
            include: [
                { model: User, as: 'user', attributes: ['username', 'avatar'] },
                { model: Product, as: 'product', attributes: ['name'] }
            ]
        });

        res.json({
            success: true,
            message: 'Review updated successfully',
            review: updatedReview
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (own review only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns this review or is admin
        if (review.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        const productId = review.productId;
        const userId = review.userId;

        await review.destroy();

        // Update product statistics
        await updateProductStats(productId);

        // Update user review count
        const user = await User.findByPk(userId);
        if (user) {
            await user.update({ reviewCount: Math.max(0, user.reviewCount - 1) });
        }

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user already voted
        const existingVote = await ReviewHelpfulVote.findOne({
            where: {
                reviewId: req.params.id,
                userId: req.user.id
            }
        });

        let helpfulCount = review.helpfulCount;

        if (existingVote) {
            // Remove vote
            await existingVote.destroy();
            helpfulCount = Math.max(0, helpfulCount - 1);
        } else {
            // Add vote
            await ReviewHelpfulVote.create({
                reviewId: req.params.id,
                userId: req.user.id
            });
            helpfulCount += 1;
        }

        await review.update({ helpfulCount });

        res.json({
            success: true,
            message: existingVote ? 'Vote removed' : 'Marked as helpful',
            helpfulCount
        });
    } catch (error) {
        console.error('Helpful vote error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing vote',
            error: error.message
        });
    }
});

// @route   GET /api/reviews/my
// @desc    Get all reviews written by the authenticated user
// @access  Private
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { userId: req.user.id },
            include: [
                { model: Product, as: 'product', attributes: ['id', 'name', 'imageUrl', 'category'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching your reviews',
            error: error.message
        });
    }
});

// Helper function to update product statistics
async function updateProductStats(productId) {
    try {
        const reviews = await Review.findAll({
            where: {
                productId: productId,
                moderationStatus: 'approved'
            }
        });

        const product = await Product.findByPk(productId);
        if (!product) return;

        if (reviews.length === 0) {
            await product.update({
                averageRating: 0,
                reviewCount: 0,
                sentimentScore: 0
            });
            return;
        }

        const avgRating = reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length;
        const avgSentiment = reviews.reduce((sum, r) => sum + parseFloat(r.sentimentScore || 0), 0) / reviews.length;

        await product.update({
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length,
            sentimentScore: Math.round(avgSentiment * 100) / 100
        });
    } catch (error) {
        console.error('Error updating product stats:', error);
    }
}

module.exports = router;
