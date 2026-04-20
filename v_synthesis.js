const { summarizeReviewsWithGemini } = require('./server/services/geminiService');
require('dotenv').config();

const sampleReviews = [
    { content: "The Samsung Galaxy S24 is a compact powerhouse. The Snapdragon 8 Gen 3 makes it incredibly fast, and the size is perfect for one-handed use." },
    { content: "I love the 120Hz display, it's so bright even in direct sunlight. The cameras are also top-notch, especially the low-light performance." },
    { content: "Battery life is okay but not great. I'm a heavy user and I often find myself needing a charge by the evening. Also, 25W charging is quite slow these days." },
    { content: "It can get a bit warm during long gaming sessions. Not uncomfortably hot, but definitely noticeable. Wish it had better cooling." },
    { content: "Coming from an S21, this is a huge upgrade. The build quality feels much more premium and the AI features are actually quite useful." }
];

async function runSynthesis() {
    console.log('🤖 Synthesizing reviews with Gemini API...');
    try {
        const result = await summarizeReviewsWithGemini(sampleReviews);
        console.log('\n--- Gemini AI Synthesis Results ---');
        console.log('Overall Sentiment:', result.overallSentiment);
        console.log('Sentiment Score:', result.sentimentScore);
        console.log('\nSummary:');
        console.log(result.summary);
        console.log('\nPros:');
        result.pros.forEach(p => console.log(`- ${p}`));
        console.log('\nCons:');
        result.cons.forEach(c => console.log(`- ${c}`));
        console.log('\nCommon Themes:');
        result.commonThemes.forEach(t => console.log(`- ${t}`));
        console.log('\nRecommendation Score:', result.recommendationScore, '/ 10');
        console.log('------------------------------------\n');
    } catch (error) {
        console.error('Synthesis failed:', error);
    }
}

runSynthesis();
