const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Additional models with explicit API version
const tests = [
    { model: 'gemini-2.0-flash-exp', opts: {} },
    { model: 'gemini-2.0-flash-thinking-exp', opts: {} },
    { model: 'gemini-exp-1206', opts: {} },
    { model: 'gemini-2.0-flash-lite', opts: {} },
    { model: 'gemini-2.0-flash', opts: {} },
    { model: 'learnlm-1.5-pro-experimental', opts: {} },
];

async function testModel(model, opts) {
    try {
        const m = genAI.getGenerativeModel({ model }, opts);
        const r = await m.generateContent('Say OK');
        console.log(`✅ ${model}: ${r.response.text().substring(0, 20)}`);
        return true;
    } catch (e) {
        const status = e.status || (e.message?.match(/\d{3}/)?.[0]) || '???';
        console.log(`❌ ${model}: HTTP ${status}`);
        return false;
    }
}

(async () => {
    for (const { model, opts } of tests) {
        const ok = await testModel(model, opts);
        if (ok) { console.log(`\n🎯 WORKING MODEL: ${model}`); process.exit(0); }
        await new Promise(r => setTimeout(r, 300));
    }
    console.log('\n⚠️  No models are available right now. Quota exhausted.');
    process.exit(0);
})();
