/**
 * Fake review detection service
 * Analyzes review patterns to identify potentially fake or suspicious reviews
 */

/**
 * Calculate fake review probability score
 * @param {object} review - Review object with content, user, and metadata
 * @param {object} userHistory - User's review history
 * @returns {object} Fake detection results
 */
const detectFakeReview = (review, userHistory = {}) => {
    try {
        let suspicionScore = 0;
        const flags = [];

        // 1. Check review length (very short reviews are suspicious)
        if (review.content.length < 30) {
            suspicionScore += 0.2;
            flags.push('Very short review');
        }

        // 2. Check for generic content
        const genericPhrases = [
            'great product',
            'highly recommend',
            'best ever',
            'must buy',
            'five stars',
            'perfect product'
        ];

        const lowerContent = review.content.toLowerCase();
        const genericCount = genericPhrases.filter(phrase => lowerContent.includes(phrase)).length;

        if (genericCount >= 3) {
            suspicionScore += 0.3;
            flags.push('Contains multiple generic phrases');
        }

        // 3. Check for excessive punctuation or caps
        const exclamationCount = (review.content.match(/!/g) || []).length;
        const capsRatio = (review.content.match(/[A-Z]/g) || []).length / review.content.length;

        if (exclamationCount > 5) {
            suspicionScore += 0.15;
            flags.push('Excessive exclamation marks');
        }

        if (capsRatio > 0.3) {
            suspicionScore += 0.15;
            flags.push('Excessive capitalization');
        }

        // 4. Check for promotional language
        const promoWords = ['buy now', 'click here', 'discount', 'coupon', 'promo code', 'link in bio'];
        const promoCount = promoWords.filter(word => lowerContent.includes(word)).length;

        if (promoCount > 0) {
            suspicionScore += 0.4;
            flags.push('Contains promotional language');
        }

        // 5. Check user history patterns
        if (userHistory.reviewCount !== undefined) {
            // New user with only 5-star reviews
            if (userHistory.reviewCount < 3 && review.rating === 5) {
                suspicionScore += 0.2;
                flags.push('New user with perfect rating');
            }

            // User posts many reviews in short time
            if (userHistory.recentReviewCount > 10) {
                suspicionScore += 0.25;
                flags.push('High review frequency');
            }
        }

        // 6. Check for repetitive patterns
        const words = review.content.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        const repetitionRatio = 1 - (uniqueWords.size / words.length);

        if (repetitionRatio > 0.4) {
            suspicionScore += 0.2;
            flags.push('High word repetition');
        }

        // Normalize score to 0-1 range
        const finalScore = Math.min(1, suspicionScore);
        const isSuspicious = finalScore > 0.5;

        return {
            fakeScore: finalScore,
            isSuspicious,
            flags,
            confidence: finalScore > 0.7 ? 'high' : finalScore > 0.4 ? 'medium' : 'low'
        };
    } catch (error) {
        console.error('Fake detection error:', error);
        return {
            fakeScore: 0,
            isSuspicious: false,
            flags: [],
            confidence: 'low'
        };
    }
};

/**
 * Analyze review authenticity based on writing style
 * @param {string} text - Review text
 * @returns {object} Authenticity analysis
 */
const analyzeAuthenticity = (text) => {
    const indicators = {
        hasPersonalExperience: false,
        hasSpecificDetails: false,
        hasBalancedView: false,
        naturalLanguage: false
    };

    const lowerText = text.toLowerCase();

    // Check for personal experience indicators
    const personalWords = ['i ', 'my ', 'me ', 'i\'ve', 'i\'m', 'personally'];
    indicators.hasPersonalExperience = personalWords.some(word => lowerText.includes(word));

    // Check for specific details (numbers, measurements, time references)
    const hasNumbers = /\d+/.test(text);
    const hasTimeRef = /day|week|month|year|hour/.test(lowerText);
    indicators.hasSpecificDetails = hasNumbers || hasTimeRef;

    // Check for balanced view (mentions both positives and negatives)
    const hasPositive = /good|great|excellent|love|perfect|amazing/.test(lowerText);
    const hasNegative = /but|however|although|issue|problem|could be better/.test(lowerText);
    indicators.hasBalancedView = hasPositive && hasNegative;

    // Check for natural language (contractions, varied sentence structure)
    const hasContractions = /n't|'ve|'ll|'re|'m/.test(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = text.length / sentences.length;
    indicators.naturalLanguage = hasContractions && avgSentenceLength > 10 && avgSentenceLength < 100;

    const authenticityScore = Object.values(indicators).filter(Boolean).length / Object.keys(indicators).length;

    return {
        ...indicators,
        authenticityScore,
        isLikelyAuthentic: authenticityScore >= 0.5
    };
};

module.exports = {
    detectFakeReview,
    analyzeAuthenticity
};
