const express = require('express');
const router = express.Router();
const { Reward, UserReward, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const crypto = require('crypto');

// @route   GET /api/rewards
// @desc    Get all available rewards and user point balance
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const rewards = await Reward.findAll({
            where: { isActive: true },
            order: [['pointsRequired', 'ASC']]
        });

        const user = await User.findByPk(req.user.id, {
            attributes: ['points']
        });

        res.json({
            success: true,
            rewards,
            userPoints: user ? user.points : 0
        });
    } catch (error) {
        console.error('Fetch rewards error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/rewards/my
// @desc    Get user's redeemed coupons
// @access  Private
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const myRewards = await UserReward.findAll({
            where: { userId: req.user.id },
            include: [{ model: Reward, as: 'rewardInfo' }],
            order: [['redeemedAt', 'DESC']]
        });

        res.json({
            success: true,
            myRewards
        });
    } catch (error) {
        console.error('Fetch my rewards error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/rewards/redeem
// @desc    Redeem points for a coupon
// @access  Private
router.post('/redeem', authMiddleware, async (req, res) => {
    try {
        const { rewardId } = req.body;

        const reward = await Reward.findByPk(rewardId);
        if (!reward || !reward.isActive) {
            return res.status(404).json({ success: false, message: 'Reward not found' });
        }

        const user = await User.findByPk(req.user.id);
        if (user.points < reward.pointsRequired) {
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient points. You need ${reward.pointsRequired} points.` 
            });
        }

        // Generate a random coupon code
        const couponCode = 'NP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // Create transaction manual logic or just sequence
        await user.update({ points: user.points - reward.pointsRequired });
        
        const userReward = await UserReward.create({
            userId: user.id,
            rewardId: reward.id,
            couponCode: couponCode,
            redeemedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Points redeemed successfully!',
            coupon: {
                code: couponCode,
                rewardName: reward.name,
                redeemedAt: userReward.redeemedAt
            },
            newBalance: user.points
        });
    } catch (error) {
        console.error('Redeem error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
