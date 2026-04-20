// Quick direct Gemini test — wait 65s first for rate limit reset
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

function callGeminiDirect(prompt) {
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
    });
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                const json = JSON.parse(d);
                if (res.statusCode === 200) resolve(json.candidates[0].content.parts[0].text);
                else reject({ status: res.statusCode, msg: json?.error?.message?.substring(0, 80) });
            });
        });
        req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function main() {
    console.log('⏳ Waiting 65 seconds for rate limit to reset...');
    await new Promise(r => setTimeout(r, 65000));

    console.log('🤖 Testing Gemini API...');
    try {
        const result = await callGeminiDirect(
            'Summarize the Samsung Galaxy S24 in JSON only (no markdown): {"pros":["..."],"cons":["..."],"summary":"...","sentimentScore":0.9}'
        );
        console.log('\n✅ Gemini is working!');
        console.log('Response:', result.substring(0, 300));
    } catch (e) {
        console.log(`❌ Failed: HTTP ${e.status || '?'} — ${e.msg || e.message}`);
    }
    process.exit(0);
}
main();
