// Quick test using the Gemini REST API directly
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const model = 'gemini-2.0-flash-lite';

const payload = JSON.stringify({
    contents: [{ parts: [{ text: 'Say OK in one word' }] }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            const json = JSON.parse(data);
            if (json.candidates) {
                console.log('✅ Response:', json.candidates[0].content.parts[0].text);
            } else {
                console.log('❌ Error:', JSON.stringify(json?.error || json, null, 2));
            }
        } catch (e) { console.log('Raw:', data.substring(0, 300)); }
    });
});
req.on('error', e => console.error('Request error:', e.message));
req.write(payload);
req.end();
