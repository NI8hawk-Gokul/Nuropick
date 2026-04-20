const { analyzeImageWithGemini, analyzePriceIntelligence } = require('c:/NeroLink/Program/server/services/geminiService');
require('dotenv').config();

async function test() {
    console.log('--- Testing Price IQ ---');
    try {
        const product = { name: 'Test Watch', price: 299, currency: 'USD', averageRating: 4.5, category: 'Electronics' };
        const priceRes = await analyzePriceIntelligence(product);
        console.log('Price IQ Result:', priceRes);
    } catch (err) {
        console.error('Price IQ Error:', err);
    }

    console.log('\n--- Testing NeroLens (Vision) ---');
    try {
        const imageUrl = 'https://m.media-amazon.com/images/I/71XmTo8-3dL._AC_SL1500_.jpg'; // Apple Watch image
        const visionRes = await analyzeImageWithGemini(imageUrl);
        console.log('Vision Result:', visionRes);
    } catch (err) {
        console.error('Vision Error:', err);
    }
}

test();
