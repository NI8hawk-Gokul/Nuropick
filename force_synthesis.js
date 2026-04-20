const db = require('./server/models');
const { summarizeReviewsWithGemini } = require('./server/services/geminiService');

async function forceSynthesis(productId) {
    try {
        console.log(`🚀 Forcing AI synthesis for Product ID: ${productId}`);
        const product = await db.Product.findByPk(productId);
        if (!product) {
            console.error('❌ Product not found');
            return;
        }

        const reviews = await db.Review.findAll({ where: { productId } });
        console.log(`🔍 Found ${reviews.length} reviews. Running synthesis...`);

        // We use our fallback-enhanced function
        const summary = await summarizeReviewsWithGemini(reviews);

        await product.update({
            aiSummary: summary.summary,
            aiPros: summary.pros,
            aiCons: summary.cons,
            aiKeyPhrases: summary.commonThemes,
            aiLastUpdated: new Date(),
            sentimentScore: summary.sentimentScore
        });

        console.log('✅ Synthesis updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Synthesis failed:', error);
        process.exit(1);
    }
}

// Default to PID 5 (Samsung S24) or from args
const pid = process.argv[2] || 5;
forceSynthesis(pid);
