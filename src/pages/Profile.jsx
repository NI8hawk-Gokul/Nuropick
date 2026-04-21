import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../utils/api';
import sounds from '../utils/sounds';
import './Profile.css';

const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [reviewsCount, setReviewsCount] = useState(0);
    const [currentTheme, setCurrentTheme] = useState(document.documentElement.getAttribute('data-theme') || 'cosmic');

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        email: user?.email || '',
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await reviewsAPI.getMyReviews();
                setReviewsCount(res.reviews?.length || 0);
            } catch (err) {
                console.error('Failed to fetch stats');
            }
        };
        fetchStats();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        sounds.click();
        try {
            // Simulated save
            setTimeout(() => {
                setMessage({ type: 'success', text: 'Profile updated successfully! ✨' });
                setLoading(false);
            }, 800);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
            setLoading(false);
        }
    };

    const handleThemeSwitch = (themeId) => {
        setCurrentTheme(themeId);
        document.documentElement.setAttribute('data-theme', themeId);
        localStorage.setItem('np_theme', themeId);
        sounds.themeSwitch();
    };

    const handleSoundToggle = () => {
        sounds.enabled = !sounds.enabled;
        sounds.click();
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: '👤' },
        { id: 'preferences', label: 'Preferences', icon: '⚙️' },
        { id: 'security', label: 'Security', icon: '🛡️' },
        { id: 'activity', label: 'Activity', icon: '📊' }
    ];

    return (
        <div className="profile-page">
            <div className="container">
                {/* Profile Hero Header */}
                <div className="profile-header-card glass-card fade-in">
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar-large">
                            {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                        </div>
                        <div className="avatar-edit-badge" title="Change Avatar">📸</div>
                    </div>
                    
                    <div className="profile-info-main">
                        <div className="badge badge-success" style={{ marginBottom: '0.5rem' }}>
                            {reviewsCount > 5 ? 'Elite Reviewer' : 'Community Member'}
                        </div>
                        <h1>{formData.firstName} {formData.lastName}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>@{formData.username}</p>
                        
                        <div className="profile-stats-mini">
                            <div className="mini-stat">
                                <span className="mini-stat-val">{reviewsCount}</span>
                                <span className="mini-stat-label">Reviews</span>
                            </div>
                            <div className="mini-stat">
                                <span className="mini-stat-val">
                                    {reviewsCount === 0 ? '0' : '4.8'}
                                </span>
                                <span className="mini-stat-label">Avg. Rating</span>
                            </div>
                            <div className="mini-stat">
                                <span className="mini-stat-val">Active</span>
                                <span className="mini-stat-label">Status</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-dashboard">
                    {/* Sidebar Navigation */}
                    <div className="profile-sidebar">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => { setActiveTab(tab.id); sounds.click(); }}
                            >
                                <span className="tab-icon">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Section */}
                    <div className="profile-content-area glass-card">
                        {activeTab === 'account' && (
                            <div className="fade-in">
                                <h2 className="content-section-title">Account Settings</h2>
                                {message.text && (
                                    <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
                                        {message.text}
                                    </div>
                                )}
                                <form onSubmit={handleSaveProfile} className="auth-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">First Name</label>
                                            <input type="text" name="firstName" className="form-input" value={formData.firstName} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Last Name</label>
                                            <input type="text" name="lastName" className="form-input" value={formData.lastName} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Username</label>
                                        <input type="text" name="username" className="form-input" value={formData.username} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input type="email" name="email" className="form-input" value={formData.email} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                                        {loading ? 'Saving Changes...' : 'Save Profile'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="fade-in">
                                <h2 className="content-section-title">Appearance & Sounds</h2>
                                
                                <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Choose Your Theme</p>
                                <div className="pref-grid">
                                    {[
                                        { id: 'cosmic', name: '🪶 Cosmic', desc: 'Deep Space Purple', orb: '#667eea' },
                                        { id: 'ember', name: '🔥 Ember', desc: 'Volcanic Red', orb: '#f77062' },
                                        { id: 'ocean', name: '🌊 Ocean', desc: 'Midnight Sea', orb: '#0acffe' }
                                    ].map(t => (
                                        <div 
                                            key={t.id} 
                                            className={`theme-tile glass-card ${currentTheme === t.id ? 'active' : ''}`}
                                            onClick={() => handleThemeSwitch(t.id)}
                                        >
                                            <div className="theme-preview" style={{ background: 'var(--bg-tertiary)' }}>
                                                <div className="preview-orb" style={{ background: t.orb, top: '10px', left: '10px' }}></div>
                                                <div className="preview-orb" style={{ background: 'var(--secondary)', bottom: '10px', right: '10px' }}></div>
                                            </div>
                                            <div style={{ fontWeight: 700 }}>{t.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="sound-toggle-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontSize: '2rem' }}>{sounds.enabled ? '🔊' : '🔇'}</div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Interaction Sounds</div>
                                            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>UI clicks, theme switches, and notifications</div>
                                        </div>
                                    </div>
                                    <button 
                                        className={`btn ${sounds.enabled ? 'btn-primary' : 'btn-secondary'}`} 
                                        onClick={handleSoundToggle}
                                    >
                                        {sounds.enabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="fade-in">
                                <h2 className="content-section-title">Security Settings</h2>
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <input type="password" placeholder="••••••••" className="form-input" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <input type="password" placeholder="Min 8 characters" className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Confirm New Password</label>
                                        <input type="password" placeholder="Repeat password" className="form-input" />
                                    </div>
                                </div>
                                <button className="btn btn-outline" style={{ marginTop: '1rem' }}>
                                    Update Password
                                </button>
                                
                                <div style={{ marginTop: '3rem', padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,87,108,0.05)', border: '1px solid rgba(245,87,108,0.2)' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>Danger Zone</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
                                    <button className="btn" style={{ background: 'var(--danger)', color: 'white' }}>Delete Account</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📊</div>
                                <h2>Your Activity</h2>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem' }}>
                                    You have written <strong>{reviewsCount} reviews</strong> and reached <strong>level {reviewsCount > 5 ? '7' : '2'}</strong> in the NeuroPick community.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{reviewsCount}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reviews</div>
                                    </div>
                                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>842</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trust Score</div>
                                    </div>
                                </div>
                                <button className="btn btn-primary" style={{ marginTop: '2.5rem' }} onClick={() => window.location.href='/dashboard'}>
                                    View Full Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
