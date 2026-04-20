const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
    try {
        console.log('🔑 Checking API key and models...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Hello');
        console.log('✅ API key is working. Response:', result.response.text());
    } catch (error) {
        console.error('❌ API check failed:', error);
    }
}

checkModels();
