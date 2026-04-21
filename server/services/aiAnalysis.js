const Sentiment = require('sentiment');
const natural = require('natural');
const compromise = require('compromise');

const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();

/**
 * Analyze sentiment of review text
 * @param {string} text - Review text to analyze
 * @returns {object} Sentiment analysis results
 */
const analyzeSentiment = (text) => {
    try {
        // Basic sentiment analysis
        const result = sentiment.analyze(text);

        // Calculate normalized score (-1 to 1)
        const normalizedScore = Math.max(-1, Math.min(1, result.score / 10));

        // Determine sentiment label
        let label = 'neutral';
        if (normalizedScore > 0.1) label = 'positive';
        else if (normalizedScore < -0.1) label = 'negative';

        // Extract emotions (simplified)
        const emotions = detectEmotions(text);

        return {
            score: normalizedScore,
            label,
            comparative: result.comparative,
            positive: result.positive,
            negative: result.negative,
            emotions
        };
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return {
            score: 0,
            label: 'neutral',
            comparative: 0,
            positive: [],
            negative: [],
            emotions: {}
        };
    }
};

/**
 * Detect emotions in text
 * @param {string} text - Text to analyze
 * @returns {object} Emotion scores
 */
const detectEmotions = (text) => {
    const emotions = {
        happy: 0,
        angry: 0,
        disappointed: 0,
        excited: 0,
        frustrated: 0
    };

    const lowerText = text.toLowerCase();

    // Happy indicators
    const happyWords = ['love', 'excellent', 'amazing', 'perfect', 'great', 'wonderful', 'fantastic', 'awesome'];
    emotions.happy = happyWords.filter(word => lowerText.includes(word)).length;

    // Angry indicators
    const angryWords = ['terrible', 'worst', 'horrible', 'awful', 'hate', 'angry', 'furious'];
    emotions.angry = angryWords.filter(word => lowerText.includes(word)).length;

    // Disappointed indicators
    const disappointedWords = ['disappointed', 'expected better', 'not worth', 'waste', 'regret'];
    emotions.disappointed = disappointedWords.filter(word => lowerText.includes(word)).length;

    // Excited indicators
    const excitedWords = ['excited', 'cant wait', 'thrilled', 'impressed', 'exceeded'];
    emotions.excited = excitedWords.filter(word => lowerText.includes(word)).length;

    // Frustrated indicators
    const frustratedWords = ['frustrat', 'annoying', 'difficult', 'complicated', 'confusing'];
    emotions.frustrated = frustratedWords.filter(word => lowerText.includes(word)).length;

    return emotions;
};

/**
 * Extract key phrases from text
 * @param {string} text - Text to analyze
 * @returns {array} Key phrases
 */
const extractKeyPhrases = (text) => {
    try {
        const doc = compromise(text);

        // Extract nouns and noun phrases
        const nouns = doc.nouns().out('array');
        const adjectives = doc.adjectives().out('array');

        // Combine for key phrases
        const phrases = [...new Set([...nouns, ...adjectives])];

        return phrases.slice(0, 10); // Return top 10
    } catch (error) {
        console.error('Key phrase extraction error:', error);
        return [];
    }
};

/**
 * Summarize multiple reviews
 * @param {array} reviews - Array of review objects
 * @returns {object} Summary with pros, cons, and overall sentiment
 */
const summarizeReviews = (reviews) => {
    try {
        if (!reviews || reviews.length === 0) {
            return {
                summary: 'No reviews available',
                pros: [],
                cons: [],
                overallSentiment: 'neutral',
                sentimentScore: 0
            };
        }

        const positiveReviews = reviews.filter(r => r.sentimentScore > 0.1);
        const negativeReviews = reviews.filter(r => r.sentimentScore < -0.1);

        // Extract common positive phrases
        const positivePhrases = [];
        positiveReviews.forEach(review => {
            if (review.keyPhrases) {
                positivePhrases.push(...review.keyPhrases);
            }
        });

        // Extract common negative phrases
        const negativePhrases = [];
        negativeReviews.forEach(review => {
            if (review.keyPhrases) {
                negativePhrases.push(...review.keyPhrases);
            }
        });

        // Count phrase frequency
        const prosCount = {};
        positivePhrases.forEach(phrase => {
            prosCount[phrase] = (prosCount[phrase] || 0) + 1;
        });

        const consCount = {};
        negativePhrases.forEach(phrase => {
            consCount[phrase] = (consCount[phrase] || 0) + 1;
        });

        // Get top pros and cons
        const pros = Object.entries(prosCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([phrase]) => phrase);

        const cons = Object.entries(consCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([phrase]) => phrase);

        // Calculate overall sentiment
        const avgSentiment = reviews.reduce((sum, r) => sum + (r.sentimentScore || 0), 0) / reviews.length;
        let overallSentiment = 'neutral';
        if (avgSentiment > 0.1) overallSentiment = 'positive';
        else if (avgSentiment < -0.1) overallSentiment = 'negative';

        const summary = `Based on ${reviews.length} reviews, this product has a ${overallSentiment} overall sentiment. ` +
            `${positiveReviews.length} customers had positive experiences, while ${negativeReviews.length} had negative experiences.`;

        return {
            summary,
            pros,
            cons,
            overallSentiment,
            sentimentScore: avgSentiment,
            totalReviews: reviews.length,
            positiveCount: positiveReviews.length,
            negativeCount: negativeReviews.length
        };
    } catch (error) {
        console.error('Review summarization error:', error);
        return {
            summary: 'Error generating summary',
            pros: [],
            cons: [],
            overallSentiment: 'neutral',
            sentimentScore: 0
        };
    }
};

module.exports = {
    analyzeSentiment,
    extractKeyPhrases,
    summarizeReviews,
    detectEmotions
};
