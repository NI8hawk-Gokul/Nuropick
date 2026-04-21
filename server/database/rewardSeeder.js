const { Reward } = require('../models');

const seedRewards = async () => {
    try {
        // Clear existing rewards to ensure clean state with new fields
        await Reward.destroy({ where: {}, cascade: true });
        console.log('Cleared existing rewards.');

        const rewards = [
            {
                name: 'Cashback at Confirmtkt',
                description: 'Get ₹5 - ₹100 cashback on your next train ticket booking.',
                merchantName: 'Confirmtkt',
                merchantLogo: 'https://cdn-icons-png.flaticon.com/512/825/825561.png', // Generic train icon
                highlightText: '₹5 - ₹100',
                statusBadge: 'Activating',
                themeColor: '#4285F4', // Google blue
                pointsRequired: 50,
                discountValue: 100,
                type: 'flat_discount'
            },
            {
                name: 'Heganwalk Offer',
                description: 'Pay ₹299 Only for pack of 2 Innerwear from Heganwalk.',
                merchantName: 'Heganwalk',
                merchantLogo: 'https://cdn-icons-png.flaticon.com/512/3159/3159614.png', // Generic shopping icon
                highlightText: 'Pay ₹299 Only',
                statusBadge: '9d left',
                themeColor: '#EA4335', // Google red
                pointsRequired: 150,
                discountValue: 200,
                type: 'flat_discount'
            },
            {
                name: 'ACWO Earbuds Discount',
                description: 'Flat 15% Off + Up to 75% Off on Smart & Premium TWS Earbuds.',
                merchantName: 'ACWO',
                merchantLogo: 'https://cdn-icons-png.flaticon.com/512/1085/1085957.png', // Generic audio icon
                highlightText: 'Flat 15% Off +',
                statusBadge: '9d left',
                themeColor: '#FBBC05', // Google yellow
                pointsRequired: 100,
                discountValue: 15,
                type: 'percentage_discount'
            },
            {
                name: 'Mobile Recharge Cashback',
                description: '₹1 - ₹30 cashback on mobile recharge.',
                merchantName: 'Mobile Services',
                merchantLogo: 'https://cdn-icons-png.flaticon.com/512/2586/2586614.png', // Generic mobile icon
                highlightText: '₹1 - ₹30',
                statusBadge: 'Expired',
                themeColor: '#34A853', // Google green
                pointsRequired: 30,
                discountValue: 30,
                type: 'flat_discount'
            },
            {
                name: 'Smartwatch Offer',
                description: 'Only at ₹599 Bluetooth Calling Smartwatch Worth ₹4999.',
                merchantName: 'Watch Store',
                merchantLogo: 'https://cdn-icons-png.flaticon.com/512/2972/2972412.png', // Generic watch icon
                highlightText: 'Only at ₹599',
                statusBadge: 'Expired',
                themeColor: '#7B1FA2', // Purple
                pointsRequired: 200,
                discountValue: 4400,
                type: 'flat_discount'
            }
        ];

        await Reward.bulkCreate(rewards);
        console.log('✅ Rewards seeded successfully with new fields');
    } catch (error) {
        console.error('Error seeding rewards:', error);
    }
};

module.exports = { seedRewards };
