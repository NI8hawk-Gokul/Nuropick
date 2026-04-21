const { ReviewSource } = require('../models');

/**
 * Seed review sources into database
 */
async function seedReviewSources() {
    try {
        const sources = [
            {
                name: 'manual',
                displayName: 'Manual Entry',
                icon: '✍️',
                isActive: true
            },
            {
                name: 'amazon',
                displayName: 'Amazon',
                icon: '📦',
                isActive: true
            },
            {
                name: 'flipkart',
                displayName: 'Flipkart',
                icon: '🛒',
                isActive: true
            }
        ];

        for (const source of sources) {
            await ReviewSource.findOrCreate({
                where: { name: source.name },
                defaults: source
            });
        }

        console.log('✅ Review sources seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding review sources:', error);
    }
}

module.exports = { seedReviewSources };
