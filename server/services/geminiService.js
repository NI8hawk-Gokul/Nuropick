const https = require('https');
require('dotenv').config();

const MODEL = 'gemini-2.0-flash-lite';
const REQUEST_TIMEOUT_MS = 30000; // Increased to 30s for complex analysis

/**
 * Call the Gemini v1beta REST API directly with a timeout.
 * Supports both text-only and multimodal (text + image) payloads.
 */
async function callGemini(parts) {
    const API_KEY = process.env.GEMINI_API_KEY;
    // Map string parts to the required API structure if needed
    const contents = [{
        parts: Array.isArray(parts) ? parts : [{ text: parts }]
    }];
    
    const payload = JSON.stringify({ contents });

    return new Promise((resolve, reject) => {
        const opts = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        };

        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode === 429) {
                        reject({ status: 429, message: 'Rate limited' });
                    } else if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode}: ${json?.error?.message || data.substring(0, 100)}`));
                    } else if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else {
                        reject(new Error('No content in response'));
                    }
                } catch (e) { reject(e); }
            });
        });

        req.setTimeout(REQUEST_TIMEOUT_MS, () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

/**
 * Utility to fetch an image from a URL and convert it to a Base64 string for Gemini
 */
async function fetchImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };

        https.get(options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch image: HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const mimeType = res.headers['content-type'] || 'image/jpeg';
                resolve({
                    mimeType,
                    data: buffer.toString('base64')
                });
            });
        }).on('error', reject);
    });
}

/**
 * Parse JSON safely from Gemini response (strips markdown code fences if present)
 */
function parseJSON(text) {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
}

/**
 * Build heuristic summary from review data (used when Gemini is unavailable)
 */
function buildHeuristicSummary(reviews, product = null) {
    const reviewCount = reviews?.length || 0;
    if (reviewCount === 0) {
        if (product) {
            return {
                overallSentiment: 'neutral', sentimentScore: 0,
                pros: ['Based on product specifications'],
                cons: ['Waiting for user reviews to confirm real-world performance'],
                summary: `We don't have user reviews yet for ${product.name}. Based on its description, it is a ${product.category || 'product'} from ${product.brand || 'its brand'}. Once real user reviews are collected, a more accurate summary will appear here.`,
                commonThemes: [product.category || 'Product', product.brand || 'Brand'],
                recommendationScore: 5, isHeuristic: true
            };
        }
        return {
            overallSentiment: 'neutral', sentimentScore: 0,
            pros: [],
            cons: [],
            summary: 'Not enough reviews are available to generate an analysis. Once more reviews are collected, a summary will appear here.',
            commonThemes: [],
            recommendationScore: 0, isHeuristic: true
        };
    }

    const posReviews = reviews.filter(r => (r.sentimentScore || 0) > 0.3);
    const negReviews = reviews.filter(r => (r.sentimentScore || 0) < -0.3);
    const avgScore = reviews.reduce((acc, r) => acc + (r.sentimentScore || 0), 0) / reviewCount;
    const allText = reviews.map(r => (r.content || '').toLowerCase()).join(' ');
    const themes = ['quality', 'performance', 'battery', 'camera', 'price', 'value', 'design', 'speed', 'display'].filter(k => allText.includes(k));

    return {
        overallSentiment: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral',
        sentimentScore: parseFloat(avgScore.toFixed(3)),
        pros: posReviews.slice(0, 3).map(r => r.title || (r.content || '').substring(0, 60) + '...') || ['Good quality', 'Reliable performance'],
        cons: negReviews.slice(0, 2).map(r => r.title || (r.content || '').substring(0, 60) + '...') || ['Some minor issues noted'],
        summary: `Based on ${reviewCount} user reviews, this product has a predominantly ${avgScore > 0 ? 'positive' : 'mixed'} reception. Users commonly mention ${themes.slice(0, 3).join(', ')}.`,
        commonThemes: themes.length > 0 ? themes.slice(0, 5) : ['Quality', 'Reliability'],
        recommendationScore: Math.round((avgScore + 1) * 4.5), isHeuristic: true
    };
}

/**
 * NeroLens (Vision): Analyze product image for visual-only insights
 */
async function analyzeImageWithGemini(imageUrl) {
    try {
        const image = await fetchImageAsBase64(imageUrl);
        const parts = [
            { text: "Perform a 'NeroLens' visual inspection of this product. Analyze design quality, material appearance, and possible build flaws. Respond ONLY with valid JSON:\n{\"designPhilosophy\":\"<brief>\",\"materialScore\":<0-10>,\"visualFlaws\":[\"<flaw>\"],\"styleTags\":[\"<tag>\"],\"summary\":\"<1 sentence>\"}" },
            {
                inline_data: {
                    mime_type: image.mimeType,
                    data: image.data
                }
            }
        ];

        const responseText = await callGemini(parts);
        return parseJSON(responseText);
    } catch (error) {
        console.error('NeroLens Analysis Error:', error.message);
        return { designPhilosophy: 'Analysis unavailable', materialScore: 0, visualFlaws: [], styleTags: [], summary: 'Could not perform visual inspection.' };
    }
}

/**
 * NeroPrice IQ: Evaluate if a product is worth its current price
 */
async function analyzePriceIntelligence(product) {
    try {
        const prompt = `Perform a 'NeroPrice IQ' analysis. Given the product details, should a user buy now or wait for a discount? Respond ONLY with valid JSON:\n{\"verdict\":\"<BUY NOW|WAIT|CAUTION>\",\"valueScore\":<0-100>,\"reasoning\":\"<1-2 sentences>\",\"marketPosition\":\"<e.g. Premium Overpriced, High Value, etc.>\"}\n\nProduct: ${product.name}\nPrice: ${product.price} ${product.currency}\nRating: ${product.averageRating}\nCategory: ${product.category}`;
        const responseText = await callGemini(prompt);
        return parseJSON(responseText);
    } catch (error) {
        console.error('NeroPrice IQ Error:', error.message);
        return { verdict: 'CAUTION', valueScore: 50, reasoning: 'Price analysis currently unavailable.', marketPosition: 'Unknown' };
    }
}

/**
 * Analyze review sentiment using Gemini AI
 */
async function analyzeSentimentWithGemini(reviewText) {
    try {
        const prompt = `Analyze the sentiment of this product review. Respond ONLY with valid JSON (no markdown):
{"score":<-1 to 1>,"label":"<positive|negative|neutral>","confidence":<0-1>,"emotions":["<e>"],"keyPoints":["<k>"]}
Review: "${(reviewText || '').substring(0, 400)}"`;

        const text = await callGemini(prompt);
        const result = parseJSON(text);
        return { score: result.score || 0, label: result.label || 'neutral', confidence: result.confidence || 0.5, emotions: result.emotions || [], keyPoints: result.keyPoints || [] };
    } catch (error) {
        if (error.status === 429) console.warn('⚠️ Gemini rate limited — using fallback sentiment');
        else console.error('Gemini sentiment error:', error.message || error);
        return { score: 0, label: 'neutral', confidence: 0, emotions: [], keyPoints: [] };
    }
}

/**
 * Summarize multiple reviews using Gemini AI
 */
async function summarizeReviewsWithGemini(reviews, product = null) {
    try {
        const reviewCount = reviews?.length || 0;
        let prompt;

        if (reviewCount > 0) {
            const reviewTexts = (reviews || []).slice(0, 15).map((r, i) => `${i + 1}. ${(r.content || '').substring(0, 200)}`).join('\n');
            prompt = `Analyze these product reviews and provide a summary. Respond ONLY with valid JSON (no markdown):
{"overallSentiment":"<positive|negative|neutral>","sentimentScore":<-1 to 1>,"pros":["<pro>","<pro>","<pro>"],"cons":["<con>","<con>"],"summary":"<2-3 sentences>","commonThemes":["<theme>","<theme>","<theme>"],"recommendationScore":<0-10>}

Reviews:
${reviewTexts}`;
        } else if (product) {
            prompt = `Analyze this product based on its manufacturer description since there are no user reviews yet. Be objective and mention this is based on manufacturer specs and lacks real user validation. Respond ONLY with valid JSON (no markdown):
{"overallSentiment":"<positive|negative|neutral>","sentimentScore":<-1 to 1>,"pros":["<pro based on specs>"],"cons":["<con like unverified performance>"],"summary":"<2-3 sentences mentioning this is based on specs>","commonThemes":["<theme based on category>"],"recommendationScore":<0-10>}

Product Info:
Name: ${product.name || 'Unknown'}
Brand: ${product.brand || 'Unknown'}
Category: ${product.category || 'Unknown'}
Price: ${product.price || ''} ${product.currency || ''}
Description: ${(product.description || '').substring(0, 800)}`;
        } else {
            return buildHeuristicSummary(reviews, product);
        }

        const text = await callGemini(prompt);
        const summary = parseJSON(text);

        return {
            overallSentiment: summary.overallSentiment || 'neutral',
            sentimentScore: summary.sentimentScore || 0,
            pros: Array.isArray(summary.pros) ? summary.pros : [],
            cons: Array.isArray(summary.cons) ? summary.cons : [],
            summary: summary.summary || '',
            commonThemes: Array.isArray(summary.commonThemes) ? summary.commonThemes : [],
            recommendationScore: summary.recommendationScore || 5
        };
    } catch (error) {
        if (error.status === 429) {
            console.warn('⚠️ Gemini rate limited — using heuristic fallback');
        } else {
            console.error('Gemini summarization error:', error.message || error);
        }
        return buildHeuristicSummary(reviews, product);
    }
}

/**
 * Detect fake reviews using Gemini AI
 */
async function detectFakeReviewWithGemini(reviewText, metadata = {}) {
    try {
        const prompt = `Is this product review fake/suspicious? Respond ONLY with valid JSON (no markdown):
{"isSuspicious":<true|false>,"fakeScore":<0-1>,"confidence":<0-1>,"flags":["<flag>"],"reasoning":"<brief>"}
Review: "${(reviewText || '').substring(0, 400)}"
Rating: ${metadata.rating || 'N/A'}`;

        const text = await callGemini(prompt);
        return parseJSON(text);
    } catch (error) {
        if (error.status !== 429) console.error('Gemini fake detection error:', error.message || error);
        return { isSuspicious: false, fakeScore: 0, confidence: 0, flags: [], reasoning: 'Analysis unavailable' };
    }
}

/**
 * Generate product recommendations using Gemini AI
 */
async function generateRecommendations(userPreferences, products) {
    try {
        const list = (products || []).slice(0, 15).map(p => ({ id: p.id, name: p.name.substring(0, 60), category: p.category, rating: p.averageRating }));
        const prompt = `Recommend top 5 products. Respond ONLY with valid JSON (no markdown):
{"recommendations":[{"productId":<id>,"score":<0-10>,"reasoning":"<why>"}]}
Preferences: ${JSON.stringify(userPreferences)}
Products: ${JSON.stringify(list)}`;

        const text = await callGemini(prompt);
        return parseJSON(text).recommendations || [];
    } catch (error) {
        if (error.status !== 429) console.error('Gemini recommendations error:', error.message || error);
        return [];
    }
}

/**
 * Answer product-related questions using Gemini AI
 */
async function answerProductQuestion(question, productData) {
    try {
        const prompt = `Answer this question about a product concisely.
Question: "${question}"
Product Data: ${JSON.stringify(productData)?.substring(0, 800) || 'Not available'}`;
        return await callGemini(prompt);
    } catch (error) {
        if (error.status !== 429) console.error('Gemini Q&A error:', error.message || error);
        return 'Sorry, I could not answer your question at this time.';
    }
}

/**
 * Generate 50 realistic, diverse AI reviews for a product
 */
async function generateBulkAIReviews(product, count = 50) {
    try {
        const prompt = `Generate ${count} realistic, diverse product reviews for the following product. 
Return ONLY a valid JSON array of objects (no markdown code fences).
Each object must have: 
- "rating": number (1-5)
- "title": string (brief catchy title)
- "content": string (realistic review text, 20-100 words)
- "reviewerName": string (realistic name)
- "sentimentScore": number (-1 to 1)
- "sentimentLabel": string (positive|negative|neutral)

Product Details:
Name: ${product.name}
Brand: ${product.brand || 'Unknown'}
Category: ${product.category}
Description: ${product.description ? product.description.substring(0, 300) : ''}

Ensure a mix of ratings (e.g., 60% 5-star, 20% 4-star, 10% 3-star, 5% 2-star, 5% 1-star).
For a ${product.category}, mentioned relevant features (e.g. if it's a watch mention strap, battery, screen; if phone mention camera, lag, display).`;

        const text = await callGemini(prompt);
        const reviews = parseJSON(text);
        
        return Array.isArray(reviews) ? reviews : [];
    } catch (error) {
        console.error('Gemini bulk review generation error:', error.message || error);
        return [];
    }
}

module.exports = {
    analyzeSentimentWithGemini,
    summarizeReviewsWithGemini,
    detectFakeReviewWithGemini,
    generateRecommendations,
    answerProductQuestion,
    generateBulkAIReviews,
    analyzeImageWithGemini,
    analyzePriceIntelligence
};
