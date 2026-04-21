import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../utils/api';

const RATING_LABELS = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

const renderStars = (rating) =>
  [...Array(5)].map((_, i) => (
    <span
      key={i}
      style={{
        color: i < Math.round(rating) ? '#fbbf24' : 'var(--text-muted)',
        fontSize: '1rem',
        textShadow: i < Math.round(rating) ? '0 0 8px rgba(251,191,36,0.5)' : 'none'
      }}
    >
      ★
    </span>
  ));

const sentimentColor = (label) => {
  if (!label) return { color: 'var(--warning)', bg: 'rgba(254,225,64,0.1)', border: 'var(--warning)' };
  const l = label.toLowerCase();
  if (l.includes('positive')) return { color: 'var(--success)', bg: 'rgba(0,242,254,0.1)', border: 'var(--success)' };
  if (l.includes('negative')) return { color: 'var(--danger)', bg: 'rgba(245,87,108,0.1)', border: 'var(--danger)' };
  return { color: 'var(--warning)', bg: 'rgba(254,225,64,0.1)', border: 'var(--warning)' };
};

const sentimentEmoji = (label) => {
  if (!label) return '😐';
  const l = label.toLowerCase();
  if (l.includes('positive')) return '😊';
  if (l.includes('negative')) return '😞';
  return '😐';
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reviewsAPI.getMyReviews();
      setReviews(res.reviews || []);
    } catch (err) {
      setError('Failed to load your reviews. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(reviewId);
    try {
      await reviewsAPI.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert(err.message || 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (review) => {
    navigate('/write-review', {
      state: {
        editReview: {
          id: review.id,
          productId: review.productId,
          product: review.product,
          rating: review.rating,
          title: review.title,
          content: review.content
        }
      }
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>
          Welcome back, <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{user?.username}</span>!
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
          Manage all the reviews you've written below.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Reviews Written', value: loading ? '…' : reviews.length, emoji: '📝' },
          {
            label: 'Avg Rating Given',
            value: loading || reviews.length === 0 ? '—' : (reviews.reduce((s, r) => s + parseFloat(r.rating || 0), 0) / reviews.length).toFixed(1),
            emoji: '⭐'
          },
          {
            label: 'Positive Reviews',
            value: loading ? '…' : reviews.filter(r => (r.sentimentLabel || '').toLowerCase().includes('positive')).length,
            emoji: '😊'
          },
          {
            label: 'Loyalty Points',
            value: user?.points || 0,
            emoji: '🪙',
            link: '/rewards'
          }
        ].map(({ label, value, emoji, link }) => (
          <div 
            key={label} 
            className="glass-card" 
            style={{ 
              textAlign: 'center', 
              padding: '1.25rem',
              cursor: link ? 'pointer' : 'default',
              transition: 'transform 0.2s'
            }}
            onClick={() => link && navigate(link)}
            onMouseOver={(e) => link && (e.currentTarget.style.transform = 'translateY(-5px)')}
            onMouseOut={(e) => link && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{emoji}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            {link && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.5rem' }}>Redeem →</div>}
          </div>
        ))}
      </div>

      {/* Reviews section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>My Reviews</h2>
        <Link to="/write-review" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}>
          ✍️ Write New Review
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', gap: '1rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your reviews…</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={fetchMyReviews} style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No reviews yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Share your experience with a product to help others make better decisions.
          </p>
          <Link to="/write-review" className="btn btn-primary">✍️ Write Your First Review</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((review) => {
            const sc = sentimentColor(review.sentimentLabel);
            return (
              <div
                key={review.id}
                className="glass-card"
                style={{ padding: '1.5rem', transition: 'all 0.25s', animation: 'fadeIn 0.4s ease-out' }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Product image */}
                  {review.product?.imageUrl ? (
                    <img
                      src={review.product.imageUrl}
                      alt={review.product?.name}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0, background: 'var(--bg-tertiary)' }}
                    />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                      📦
                    </div>
                  )}

                  {/* Main content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Product link */}
                    <Link
                      to={`/products/${review.productId}`}
                      style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}
                    >
                      {review.product?.name || 'Unknown Product'} →
                    </Link>

                    {/* Rating + title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <div>{renderStars(review.rating)}</div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {RATING_LABELS[Math.round(review.rating)]}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      {review.title}
                    </h4>

                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {review.content?.length > 220 ? review.content.substring(0, 220) + '…' : review.content}
                    </p>
                  </div>

                  {/* Meta + actions column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatDate(review.created_at || review.createdAt)}
                    </span>

                    {review.sentimentLabel && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem', fontWeight: 600,
                        color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`
                      }}>
                        {sentimentEmoji(review.sentimentLabel)} {review.sentimentLabel}
                      </span>
                    )}

                    {review.moderationStatus === 'flagged' && (
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem', fontWeight: 600,
                        color: 'var(--warning)', background: 'rgba(254,225,64,0.1)', border: '1px solid var(--warning)'
                      }}>
                        ⚠️ Under Review
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                        onClick={() => handleEdit(review)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn"
                        style={{
                          padding: '0.4rem 0.8rem', fontSize: '0.82rem',
                          background: 'rgba(245,87,108,0.12)', color: 'var(--danger)',
                          border: '1px solid rgba(245,87,108,0.3)'
                        }}
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                      >
                        {deletingId === review.id ? '…' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
