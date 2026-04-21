const { Product, Review, User, ReviewSource } = require('../models');

async function seedSampleData() {
    try {
        // Find or create a test user
        const [user] = await User.findOrCreate({
            where: { email: 'test@example.com' },
            defaults: {
                username: 'tester',
                password: 'password123', // In real app, this should be hashed
                email: 'test@example.com',
                role: 'admin'
            }
        });

        // Find manual source
        const source = await ReviewSource.findOne({ where: { name: 'manual' } });

        // Create a sample product
        const [product] = await Product.findOrCreate({
            where: { name: 'Samsung Galaxy S24 Ultra' },
            defaults: {
                description: 'The latest flagship from Samsung with AI features, 200MP camera, and titanium frame.',
                category: 'Electronics',
                brand: 'Samsung',
                price: 1299.99,
                currency: 'USD',
                createdBy: user.id
            }
        });

        // Create some sample reviews
        const reviews = [
            {
                productId: product.id,
                userId: user.id,
                sourceId: source.id,
                rating: 5,
                title: 'Amazing Phone!',
                content: 'I love the new S24 Ultra. The display is fantastic and the AI features are actually useful. Best camera on a phone yet.',
                sentimentScore: 0.9,
                sentimentLabel: 'positive',
                moderationStatus: 'approved'
            },
            {
                productId: product.id,
                userId: user.id,
                sourceId: source.id,
                rating: 3,
                title: 'Too Expensive',
                content: 'The phone is great but the price is just too high. Not much different from the S23 Ultra in terms of daily use.',
                sentimentScore: 0.1,
                sentimentLabel: 'neutral',
                moderationStatus: 'approved'
            },
            {
                productId: product.id,
                userId: user.id,
                sourceId: source.id,
                rating: 2,
                title: 'Battery Issues',
                content: 'Everything is fine except the battery. It drains very fast even on light usage. Disappointed given the price.',
                sentimentScore: -0.6,
                sentimentLabel: 'negative',
                moderationStatus: 'approved'
            }
        ];

        for (const reviewData of reviews) {
            await Review.findOrCreate({
                where: {
                    productId: reviewData.productId,
                    content: reviewData.content
                },
                defaults: reviewData
            });
        }

        console.log('✅ Sample data seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding sample data:', error);
    }
}

if (require.main === module) {
    seedSampleData().then(() => process.exit(0));
}

module.exports = { seedSampleData };
