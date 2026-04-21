import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI, reviewsAPI } from '../utils/api';
import sounds from '../utils/sounds';
import './WriteReview.css';

const RATING_LABELS = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

const WriteReview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-filled when coming from Dashboard Edit
  const editReview = location.state?.editReview || null;

  // Step: 1 = pick product, 2 = fill review
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(editReview ? 2 : 1);

  // ----- Product search state -----
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);

  // URL import state
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(
    editReview
      ? { id: editReview.productId, name: editReview.product?.name, imageUrl: editReview.product?.imageUrl }
      : null
  );

  // ----- Review form state -----
  const [rating, setRating] = useState(editReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(editReview?.title || '');
  const [content, setContent] = useState(editReview?.content || '');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Debounced product search (database)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await productsAPI.getAll({ search: searchQuery, limit: 10 });
        const products = res.products || [];
        setSearchResults(products);
        setDropdownOpen(products.length > 0);
      } catch {
        setSearchResults([]);
        setDropdownOpen(false);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select product from dropdown – use onMouseDown to avoid blur race
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setDropdownOpen(false);
    setSearchQuery('');
    setUrlInput('');
    setUrlError('');
    setError('');
    sounds.select();
    setStep(2);
  };

  // Add product via Amazon/Flipkart URL then auto-select it
  const handleUrlImport = async (e) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith('http')) {
      setUrlError('Please enter a valid URL starting with http(s)://');
      sounds.error();
      return;
    }
    setUrlError('');
    setUrlLoading(true);
    sounds.analyzing();
    try {
      const res = await productsAPI.analyzeUrl(url);
      if (res.success) {
        // Fetch the product we just added/found
        const productId = res.product?.id || res.productId;
        const productRes = await productsAPI.getById(productId);
        const p = productRes.product || { id: productId, name: res.product?.name || 'Product', imageUrl: res.product?.imageUrl };
        handleSelectProduct(p); // plays sounds.select() internally
      } else {
        setUrlError(res.message || 'Could not import product. Try a direct product URL.');
        sounds.error();
      }
    } catch (err) {
      const msg = err.message || (typeof err === 'string' ? err : '');
      sounds.error();
      if (msg.toLowerCase().includes('login') || msg.toLowerCase().includes('auth') || msg.includes('401')) {
        setUrlError('⚠️ You must be logged in to add new products.');
      } else {
        setUrlError(msg || 'Failed to import product. Please check the URL and try again.');
      }
    } finally {
      setUrlLoading(false);
    }
  };

  const handleChangeProduct = () => {
    setSelectedProduct(null);
    setStep(1);
    setError('');
    setUrlError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return setError('Please select a product first.');
    if (!rating) return setError('Please select a star rating.');
    if (!title.trim()) return setError('Please provide a review title.');
    if (content.trim().length < 20) return setError('Review must be at least 20 characters.');

    setError('');
    setSubmitting(true);
    sounds.analyzing();
    try {
      let res;
      if (editReview) {
        res = await reviewsAPI.update(editReview.id, { rating, title, content });
      } else {
        res = await reviewsAPI.create({ product: selectedProduct.id, rating, title, content });
        if (res.pointsEarned) {
          updateUser({ points: (user.points || 0) + res.pointsEarned });
        }
      }
      sounds.success();
      setSuccess({
        sentiment: res.aiAnalysis?.sentiment || res.review?.sentimentLabel || 'neutral',
        isSuspicious: res.aiAnalysis?.isSuspicious || false,
        productId: selectedProduct.id,
        isEdit: !!editReview,
        pointsEarned: res.pointsEarned || 0
      });
    } catch (err) {
      sounds.error();
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sentimentEmoji = (label) => {
    if (!label) return '😐';
    const l = label.toLowerCase();
    if (l.includes('positive')) return '😊';
    if (l.includes('negative')) return '😞';
    return '😐';
  };

  const sentimentClass = (label) => {
    if (!label) return 'neutral';
    const l = label.toLowerCase();
    if (l.includes('positive')) return 'positive';
    if (l.includes('negative')) return 'negative';
    return 'neutral';
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="write-review-page">
        <div className="container">
          <div className="review-form-card">
            <div className="review-success">
              <span className="success-icon">✅</span>
              <h2>{success.isEdit ? 'Review Updated!' : 'Review Submitted!'}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                {success.isSuspicious
                  ? 'Your review has been flagged for moderation and will appear once approved.'
                  : 'Your review is now live and helping other shoppers!'}
              </p>
              <div className={`sentiment-result ${sentimentClass(success.sentiment)}`}>
                {sentimentEmoji(success.sentiment)} AI Sentiment: <strong>{success.sentiment}</strong>
              </div>

              {success.pointsEarned > 0 && (
                <div className="points-earned-card fade-in">
                  <div className="points-icon">🪙</div>
                  <div className="points-text">
                    <strong>+{success.pointsEarned} Loyalty Points</strong>
                    <span>You're getting closer to your 1,000 pts reward!</span>
                  </div>
                </div>
              )}
              <div className="action-buttons-row">
                <Link to={`/products/${success.productId}`} className="btn btn-primary">View Product</Link>
                <Link to="/dashboard" className="btn btn-secondary">My Reviews</Link>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSuccess(null); setStep(1); setSelectedProduct(null);
                    setRating(0); setTitle(''); setContent('');
                  }}
                >
                  Write Another
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────
  return (
    <div className="write-review-page">
      <div className="container">
        <div className="write-review-header">
              <h1>
                <span style={{ color: 'var(--primary-light)', marginRight: '0.8rem' }}>👍</span>
                {editReview ? 'Edit Your Review' : 'Write a Review'}
              </h1>
          <p>Share your honest experience and help others make smarter decisions</p>
        </div>

        {/* Step indicator */}
        {!editReview && (
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
              <span className="step-num">{step > 1 ? '✓' : '1'}</span>
              Choose Product
            </div>
            <div className={`step-connector ${step > 1 ? 'done' : ''}`} />
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-num">2</span>
              Write Review
            </div>
          </div>
        )}

        <div className="review-form-card">
          {user && !user.emailVerified && (
            <div className="verification-required-card">
              <div className="verification-warning-icon">🛡️</div>
              <h2>Account Verification Required</h2>
              <p>To ensure the quality of community feedback, only verified users can write reviews.</p>
              <p>Please verify your identity to unlock this feature.</p>
              <div className="verification-actions">
                <Link to="/verify-email" className="btn btn-primary">Verify My Email</Link>
                <Link to="/profile" className="btn btn-secondary">Go to Profile</Link>
              </div>
            </div>
          )}

          {(!user || user.emailVerified) && error && <div className="review-error">⚠️ {error}</div>}

          {/* ── Step 1: Product Search ── */}
          {(!user || user.emailVerified) && step === 1 && (
            <div>
              {/* --- Database search --- */}
              <div className="form-group">
                    <label className="form-label">
                      <span style={{ color: '#4facfe', marginRight: '0.5rem' }}>🔍</span>
                      Search Products from Database
                    </label>
                <div className="product-search-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="form-input"
                    placeholder="Type a product name to search..."
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Auto-transfer URL to URL import field
                      if (val.startsWith('http')) {
                        setUrlInput(val);
                        setSearchQuery('');
                        setDropdownOpen(false);
                        return;
                      }
                      setSearchQuery(val);
                      setDropdownOpen(true);
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text').trim();
                      if (pasted.startsWith('http')) {
                        e.preventDefault();
                        setUrlInput(pasted);
                        setSearchQuery('');
                        setDropdownOpen(false);
                      }
                    }}
                    onFocus={() => searchResults.length > 0 && setDropdownOpen(true)}
                    autoFocus
                  />
                  <span className="search-icon">{searchLoading ? '⏳' : '🔍'}</span>

                  {/* Dropdown — use onMouseDown + preventDefault to prevent blur before click */}
                  {dropdownOpen && searchResults.length > 0 && (
                    <div className="product-dropdown">
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          className="product-dropdown-item"
                          onMouseDown={(e) => { e.preventDefault(); handleSelectProduct(p); }}
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="product-thumb" />
                          ) : (
                            <div className="product-thumb-placeholder">📦</div>
                          )}
                          <div>
                            <div className="product-dropdown-name">{p.name}</div>
                            <div className="product-dropdown-cat">{p.category}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No results message */}
                  {dropdownOpen && !searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="product-dropdown">
                      <div className="dropdown-loading">No products found for "{searchQuery}"</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="url-divider">
                <span>— or add a new product from Amazon / Flipkart —</span>
              </div>

              {/* --- URL import --- */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      <span style={{ color: '#4facfe', marginRight: '0.5rem' }}>🌐</span>
                      Import by URL (Amazon / Flipkart)
                    </label>
                <form onSubmit={handleUrlImport} className="url-import-form">
                  <input
                    type="url"
                    className="form-input"
                    placeholder="Paste an Amazon.in or Flipkart product URL..."
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text').trim();
                      if (pasted.startsWith('http')) {
                        e.preventDefault();
                        setUrlInput(pasted);
                        setUrlError('');
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={urlLoading || !urlInput.trim()}
                  >
                    {urlLoading ? (
                      <>
                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        Importing…
                      </>
                    ) : '✨ Import & Select'}
                  </button>
                </form>
                {urlError && (
                  <div className="review-error" style={{ marginTop: '0.6rem' }}>⚠️ {urlError}</div>
                )}
                {urlLoading && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginTop: '0.5rem' }}>
                    🤖 Scraping product info — this may take up to 30 seconds…
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Review Form ── */}
          {(!user || user.emailVerified) && step === 2 && (
            <form onSubmit={handleSubmit}>
              {/* Selected product card — more prominent */}
              {selectedProduct && (
                <div className="product-selection-preview glass-card fade-in">
                  <div className="preview-image-wrapper">
                    {selectedProduct.imageUrl ? (
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="product-preview-img" />
                    ) : (
                      <div className="product-preview-placeholder">📦</div>
                    )}
                  </div>
                  <div className="preview-info">
                    <span className="preview-label">Reviewing Product</span>
                    <h3 className="preview-name">{selectedProduct.name}</h3>
                    {!editReview && (
                      <button type="button" className="btn-link-sm" onClick={handleChangeProduct}>
                        🔄 Change Product
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Star Rating */}
              <div className="form-group">
                <label className="form-label">⭐ Your Rating</label>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div className="star-rating-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star-pick ${(hoverRating || rating) >= star ? 'lit' : ''}`}
                        onMouseEnter={() => { setHoverRating(star); sounds.tick(); }}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {(hoverRating || rating) > 0 && (
                    <span className="rating-label">{RATING_LABELS[hoverRating || rating]}</span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="review-title">📝 Review Title</label>
                <input
                  id="review-title"
                  type="text"
                  className="form-input"
                  placeholder="Summarise your experience in one line"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
                <div className="char-counter">{title.length}/120</div>
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="form-label" htmlFor="review-content">💬 Your Review</label>
                <textarea
                  id="review-content"
                  className="form-textarea"
                  placeholder="What did you like or dislike? How does it perform? Would you recommend it?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={3000}
                  rows={6}
                />
                <div className="char-counter">{content.length}/3000</div>
              </div>

              <div className="action-buttons-row">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '160px' }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      Submitting…
                    </>
                  ) : editReview ? '✅ Update Review' : '🚀 Submit Review'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WriteReview;
