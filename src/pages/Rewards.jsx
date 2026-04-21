import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rewardsAPI } from '../utils/api';
import './Rewards.css';

const Rewards = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [availableRewards, setAvailableRewards] = useState([]);
  const [myCoupons, setMyCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const resAvailable = await rewardsAPI.getAll();
      const resMy = await rewardsAPI.getMyRewards();
      setAvailableRewards(resAvailable.rewards || []);
      setMyCoupons(resMy.myRewards || []);
    } catch (err) {
      setError('Failed to load rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (rewardId) => {
    if (!window.confirm('Are you sure you want to redeem your points for this coupon?')) return;
    
    setRedeeming(true);
    setSuccessMsg('');
    setError('');
    
    try {
      const res = await rewardsAPI.redeem(rewardId);
      setSuccessMsg(`Success! Your coupon code is: ${res.coupon.code}`);
      
      // Refresh local state
      await fetchData();
    } catch (err) {
      setError(err.message || 'Redemption failed. Please check your points.');
    } finally {
      setRedeeming(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBadgeClass = (status) => {
    if (!status) return '';
    if (status.toLowerCase().includes('activating')) return 'badge-activating';
    if (status.toLowerCase().includes('left')) return 'badge-timeLeft';
    if (status.toLowerCase().includes('expired')) return 'badge-expired';
    return '';
  };

  const getRewardIcon = (merchant) => {
    const m = merchant?.toLowerCase() || '';
    if (m.includes('train') || m.includes('confirm')) return '🎫';
    if (m.includes('shop') || m.includes('hegan')) return '🎁';
    if (m.includes('audio') || m.includes('earbuds')) return '🎧';
    if (m.includes('mobile')) return '📱';
    if (m.includes('watch')) return '⌚';
    return '🏷️';
  };

  return (
    <div className="container rewards-container">
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>NeuroPick <span className="gradient-text">Rewards</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Earn points by reviewing products and redeem them for exclusive coupons.</p>
      </div>

      {/* Points Summary Card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem', textAlign: 'center', background: 'var(--primary-gradient)', border: 'none' }}>
        <div style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Your Current Balance</div>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          🪙 {user?.points || 0} Points
        </div>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
          Keep reviewing to earn more! Every review earns you 3-5 points.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => setActiveTab('browse')}
          className={activeTab === 'browse' ? 'tab-active' : ''}
          style={{ 
            padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
            color: activeTab === 'browse' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'browse' ? '2px solid var(--primary)' : 'none',
            fontWeight: 600
          }}
        >
          🎁 Browse Rewards
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ 
            padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : 'none',
            fontWeight: 600
          }}
        >
          🎟️ My Coupons
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : (
        <>
          {error && <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>}
          {successMsg && (
            <div className="glass-card" style={{ border: '2px solid var(--success)', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center', background: 'rgba(0,255,0,0.05)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ color: 'var(--success)' }}>Redemption Successful!</h3>
              <div style={{ margin: '1rem 0', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--success)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '2px' }}>
                {successMsg.split(': ')[1]}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use this code at checkout to claim your discount.</p>
            </div>
          )}

          {activeTab === 'browse' ? (
            <div className="rewards-grid">
              {availableRewards.map(reward => {
                const isExpired = reward.statusBadge?.toLowerCase() === 'expired';
                return (
                  <div key={reward.id} className={`reward-card ${isExpired ? 'expired' : ''}`}>
                    <div className="reward-banner" style={{ borderBottom: `2px solid ${reward.themeColor || '#333'}` }}>
                      {reward.merchantLogo && (
                        <img src={reward.merchantLogo} alt={reward.merchantName} className="merchant-logo" />
                      )}
                      <div className="banner-bg-icon">
                        {getRewardIcon(reward.merchantName || reward.name)}
                      </div>
                      {reward.statusBadge && (
                        <div className={`reward-badge ${getBadgeClass(reward.statusBadge)}`}>
                          {reward.statusBadge}
                        </div>
                      )}
                    </div>
                    
                    <div className="reward-content">
                      <div className="reward-highlight">{reward.highlightText || reward.name}</div>
                      <div className="reward-subtext">{reward.description}</div>
                    </div>

                    <div className="reward-footer">
                      <div className="points-tag">🪙 {reward.pointsRequired}</div>
                      <button 
                        className="redeem-btn-small"
                        disabled={redeeming || isExpired || (user?.points || 0) < reward.pointsRequired}
                        onClick={() => handleRedeem(reward.id)}
                      >
                        {(user?.points || 0) < reward.pointsRequired ? 'Locked' : isExpired ? 'Expired' : 'Redeem'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myCoupons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  You haven't redeemed any coupons yet.
                </div>
              ) : (
                myCoupons.map(coupon => (
                  <div key={coupon.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{coupon.rewardInfo?.name}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Redeemed on {formatDate(coupon.redeemed_at || coupon.redeemedAt)}</div>
                    </div>
                    <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--glass-border)', fontWeight: 700, letterSpacing: '1px' }}>
                      {coupon.couponCode}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Rewards;
