import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI, reviewsAPI, geminiAPI } from '../utils/api';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Advanced Features State
  const [visualAnalysis, setVisualAnalysis] = useState(null);
  const [analyzingVisual, setAnalyzingVisual] = useState(false);
  const [priceVerdict, setPriceVerdict] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = window.speechSynthesis;

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const productResponse = await productsAPI.getById(id);
      setProduct(productResponse.product);

      const reviewsResponse = await reviewsAPI.getByProduct(id);
      setReviews(reviewsResponse.reviews);

      // Trigger Price IQ automatically
      fetchPriceIQ(id);
      
      setError('');
    } catch (err) {
      console.error('Error fetching product data:', err);
      setError('Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceIQ = async (productId) => {
    try {
      const response = await geminiAPI.getPriceIQ(productId);
      if (response.success) setPriceVerdict(response.analysis);
    } catch (err) {
      console.error('Price IQ failed:', err);
    }
  };

  const handleNeroLens = async () => {
    try {
      setAnalyzingVisual(true);
      const response = await geminiAPI.analyzeVisual(id);
      if (response.success) setVisualAnalysis(response.analysis);
    } catch (err) {
      console.error('NeroLens failed:', err);
      setError('Visual analysis failed. Ensure product has a valid image URL.');
    } finally {
      setAnalyzingVisual(false);
    }
  };

  const handleToggleVoice = () => {
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!product.aiSummary) return;

    const textToRead = `Nero Selection Analysis for ${product.name}. ${product.aiSummary}. Pros include: ${product.aiPros.join(', ')}. Cons to consider: ${product.aiCons.join(', ')}. Price Verdict: ${priceVerdict?.verdict || 'Analysis pending'}.`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const handleRefreshAnalysis = async () => {
    try {
      setRefreshing(true);
      setSuccessMessage('');
      const response = await productsAPI.scrape(id);
      setSuccessMessage(response.message || 'Analysis refresh started in background!');
      
      setTimeout(() => setSuccessMessage(''), 5000);
      setTimeout(fetchProductData, 2000);
    } catch (err) {
      console.error('Error refreshing analysis:', err);
      setError('Failed to trigger analysis refresh.');
    } finally {
      setRefreshing(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={`star ${index < Math.round(rating) ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analysis results...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="error-container">
        <p>{error || 'Product not found'}</p>
        <Link to="/products" className="btn btn-primary">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="detail-navigation">
          <Link to="/products" className="back-link">
            ← Back to Products
          </Link>
          
          {product.aiSummary && (
            <button 
              className={`aerovoice-btn ${isSpeaking ? 'playing' : ''}`}
              onClick={handleToggleVoice}
            >
              {isSpeaking ? '🔇 Stop Voice' : '🔊 AeroVoice Assistant'}
            </button>
          )}
        </div>

        {successMessage && (
          <div className="alert alert-success" style={{ margin: '1rem 0' }}>
            {successMessage}
          </div>
        )}

        {/* Main Product Info */}
        <div className="product-main-card glass-card">
          <div className="product-image-section">
            <div className="product-image-container">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} />
              ) : (
                <div className="product-placeholder">📦</div>
              )}
            </div>
            
            <button 
              className={`btn btn-refresh ${analyzingVisual ? 'loading' : ''}`}
              onClick={handleNeroLens}
              disabled={analyzingVisual || !product.imageUrl}
              style={{ marginTop: '1rem', width: '100%', background: 'rgba(0,0,0,0.2)' }}
            >
              {analyzingVisual ? '🔮 Analyzing...' : '🎭 NeroLens Visual Inspect'}
            </button>

            {visualAnalysis && (
              <div className="nerolens-overlay">
                <h4>🛡️ NeroLens Report</h4>
                <p style={{ fontSize: '0.8rem', margin: '0.5rem 0' }}>{visualAnalysis.summary}</p>
                <div className="nerolens-tags">
                  {visualAnalysis.styleTags?.map((tag, i) => (
                    <span key={i} className="nerolens-tag">{tag}</span>
                  ))}
                </div>
                <div className="material-score">
                  <small>Material Premium: {visualAnalysis.materialScore}/10</small>
                </div>
              </div>
            )}
          </div>

          <div className="product-details">
            <span className="badge">{product.category}</span>
            <h1>{product.name}</h1>
            <div className="product-meta">
              <span className="brand-badge">{product.brand}</span>
              <div className="product-rating">
                <div className="rating-stars">
                  {renderStars(parseFloat(product.averageRating) || 0)}
                </div>
                <span className="rating-value">{parseFloat(product.averageRating || 0).toFixed(1)}</span>
                <span className="review-count">({product.reviewCount || 0} reviews)</span>
              </div>
              <span className="price-tag">{product.currency} {product.price}</span>
            </div>
            
            {priceVerdict && (
              <div className="price-iq-verdict">
                <div className="verdict-header">
                  <strong>Price Intelligence IQ</strong>
                  <span className={`verdict-badge ${priceVerdict.verdict.toLowerCase().replace(' ', '-')}`}>
                    {priceVerdict.verdict}
                  </span>
                </div>
                <p className="verdict-reasoning">{priceVerdict.reasoning}</p>
                <small>Value Score: {priceVerdict.valueScore}/100 • {priceVerdict.marketPosition}</small>
              </div>
            )}

            <p className="product-description" style={{ marginTop: '1.5rem' }}>{product.description}</p>

            <div className="action-buttons" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              {product.amazonUrl && (
                <a href={product.amazonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  View on Amazon
                </a>
              )}
              {product.flipkartUrl && (
                <a href={product.flipkartUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  View on Flipkart
                </a>
              )}
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        {product.aiSummary ? (
          <div className="ai-analysis-grid">
            <div className="ai-summary-card glass-card">
              <h2>✨ AI Analysis Summary</h2>
              <p className="summary-text">{product.aiSummary}</p>

              <div className="pros-cons-grid">
                <div className="pros">
                  <h3>🚀 Pros</h3>
                  <ul>
                    {product.aiPros?.map((pro, i) => (
                      <li key={i}>✅ {pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="cons">
                  <h3>⚠️ Cons</h3>
                  <ul>
                    {product.aiCons?.map((con, i) => (
                      <li key={i}>❌ {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="ai-key-phrases glass-card">
              <h3>🔍 Key Phrases</h3>
              <div className="phrase-tags">
                {product.aiKeyPhrases?.map((phrase, i) => (
                  <span key={i} className="phrase-tag">{phrase}</span>
                ))}
              </div>

              {product.sentimentScore !== 0 && (
                <div className="sentiment-analysis" style={{ marginTop: '2rem' }}>
                  <h3>🎭 Overall Sentiment</h3>
                  <div className={`sentiment-badge ${parseFloat(product.sentimentScore) > 0.1 ? 'positive' :
                    parseFloat(product.sentimentScore) < -0.1 ? 'negative' : 'neutral'}`}>
                    {parseFloat(product.sentimentScore) > 0.1 ? '😊 Positive' :
                      parseFloat(product.sentimentScore) < -0.1 ? '😞 Negative' : '😐 Neutral'}
                    {' '} ({(parseFloat(product.sentimentScore) * 100).toFixed(0)}%)
                  </div>
                </div>
              )}

              <button 
                className={`btn btn-refresh ${refreshing ? 'loading' : ''}`}
                onClick={handleRefreshAnalysis}
                disabled={refreshing}
                style={{ marginTop: '2rem', width: '100%' }}
              >
                {refreshing ? '🔄 Refreshing...' : '🔃 Refresh Full Analysis'}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', marginBottom: '3rem' }}>
            <h2>✨ AI Analysis in Progress</h2>
            <p>We are currently gathering and analyzing reviews. Please check back in a few minutes.</p>
            <div className="spinner" style={{ margin: '2rem auto' }}></div>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-section">
          <h2>User Reviews</h2>
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p>No reviews available yet.</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="review-card glass-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <h4>
                        {review.user?.username || review.author || 'Anonymous'}
                        {review.user?.emailVerified && (
                          <span className="identity-badge" title="Identity Verified">
                            <span className="verify-icon">🛡️</span> Verified
                          </span>
                        )}
                      </h4>
                      <div className="rating-stars">
                        {renderStars(review.rating)}
                      </div>
                      <span className="review-date">
                        {new Date(review.created_at || review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="review-meta-badges">
                      <div className={`sentiment-badge ${review.sentimentLabel}`}>
                        {review.sentimentLabel === 'positive' ? '😊 Positive' :
                          review.sentimentLabel === 'negative' ? '😞 Negative' : '😐 Neutral'}
                      </div>
                      {review.isSuspicious && (
                        <div className="badge danger suspicious-badge" title={`Fake probability: ${(review.fakeScore * 100).toFixed(0)}%`}>
                          🚩 Suspicious
                        </div>
                      )}
                      {review.isVerified && <span className="badge success">Verified Purchase</span>}
                      {review.isAiGenerated && (
                        <div className="badge ai-generated-badge" title="This review was generated by NeuroPick AI for analysis">
                          🤖 AI Generated
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="review-title">{review.title}</h4>
                  <p className="review-content">{review.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
