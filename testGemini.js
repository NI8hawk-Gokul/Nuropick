<<<<<<< HEAD
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function findWorkingModel() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTry = [
        'gemini-pro',
        'gemini-1.5-flash',
        'models/gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro'
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            const response = await result.response;
            console.log(`✅ Success with ${modelName}: ${response.text()}`);
            return modelName;
        } catch (error) {
            console.log(`❌ Failed with ${modelName}: ${error.message}`);
        }
    }
}

findWorkingModel().then(m => {
    if (m) console.log(`FINAL WINNER: ${m}`);
    process.exit(0);
});
=======
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function findWorkingModel() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTry = [
        'gemini-pro',
        'gemini-1.5-flash',
        'models/gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro'
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            const response = await result.response;
            console.log(`✅ Success with ${modelName}: ${response.text()}`);
            return modelName;
        } catch (error) {
            console.log(`❌ Failed with ${modelName}: ${error.message}`);
        }
    }
}

findWorkingModel().then(m => {
    if (m) console.log(`FINAL WINNER: ${m}`);
    process.exit(0);
});

