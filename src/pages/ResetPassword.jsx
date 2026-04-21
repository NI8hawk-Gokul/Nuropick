import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        const result = await resetPassword(token, formData);

        if (result.success) {
            setMessage(result.message);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    if (!token) {
        return (
            <div className="auth-page">
                <div className="container" style={{textAlign: 'center'}}>
                    <div className="glass-card fade-in" style={{padding: '3rem', maxWidth: '500px', margin: '0 auto'}}>
                        <h2 style={{color: 'var(--danger)'}}>Invalid Reset Link</h2>
                        <p>This password reset link is invalid or has expired.</p>
                        <Link to="/forgot-password" className="btn btn-primary" style={{marginTop: '1.5rem', display: 'inline-block'}}>
                            Request New Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="container login-split-container">
                <div className="auth-card glass-card fade-in split-card">
                    {/* Left Side */}
                    <div className="auth-showcase">
                        <div className="glow-orb"></div>
                        <div className="anime-character-wrapper float-animation">
                            <div className="tech-avatar">
                                <div className="avatar-ring ring-1"></div>
                                <div className="avatar-ring ring-2"></div>
                                <div className="avatar-core">
                                    <span className="avatar-icon">🔑</span>
                                    <div className="avatar-scan-line"></div>
                                </div>
                                <div className="avatar-dot dot-1"></div>
                            </div>
                        </div>
                        <div className="showcase-content">
                            <h3>Key Rotation</h3>
                            <p>Establishing new secure credentials for your account.</p>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="auth-form-container">
                        <div className="auth-header staggered-entry" style={{ '--delay': '1' }}>
                            <h1>New Password</h1>
                            <p>Update your system access credentials</p>
                        </div>

                        {message && (
                            <div className="alert alert-success staggered-entry" style={{ '--delay': '1' }}>
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-error staggered-entry" style={{ '--delay': '1' }}>
                                {error}
                            </div>
                        )}

                        {!message && (
                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="form-group staggered-entry" style={{ '--delay': '2' }}>
                                    <label htmlFor="password" className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="form-input"
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group staggered-entry" style={{ '--delay': '3' }}>
                                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="form-input"
                                        placeholder="Confirm new password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block glowing-btn staggered-entry"
                                    style={{ '--delay': '4' }}
                                    disabled={loading}
                                >
                                    {loading ? <span className="spinner-small"></span> : 'Update Password'}
                                </button>
                            </form>
                        )}

                        <div className="auth-footer staggered-entry" style={{ '--delay': '5' }}>
                            <p>
                                <Link to="/login" className="auth-link">Return to Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
