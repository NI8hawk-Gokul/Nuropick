import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Reusing established auth styles

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        const result = await forgotPassword({ email });

        if (result.success) {
            setMessage(result.message);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="container login-split-container">
                <div className="auth-card glass-card fade-in split-card">
                    {/* Left Side: Consistent Aesthetic */}
                    <div className="auth-showcase">
                        <div className="glow-orb"></div>
                        <div className="anime-character-wrapper float-animation">
                            <div className="tech-avatar">
                                <div className="avatar-ring ring-1"></div>
                                <div className="avatar-ring ring-2"></div>
                                <div className="avatar-core">
                                    <span className="avatar-icon">🔒</span>
                                    <div className="avatar-scan-line"></div>
                                </div>
                                <div className="avatar-dot dot-1"></div>
                                <div className="avatar-dot dot-2"></div>
                            </div>
                        </div>
                        <div className="showcase-content">
                            <h3>Security Core</h3>
                            <p>Recovering access to your neural interface.</p>
                        </div>
                    </div>

                    {/* Right Side: Forgot Password Form */}
                    <div className="auth-form-container">
                        <div className="auth-header staggered-entry" style={{ '--delay': '1' }}>
                            <h1>Reset Password</h1>
                            <p>Enter your email to receive a recovery link</p>
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

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group staggered-entry" style={{ '--delay': '2' }}>
                                <label htmlFor="email" className="form-label">System Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block glowing-btn staggered-entry"
                                style={{ '--delay': '3' }}
                                disabled={loading}
                            >
                                {loading ? <span className="spinner-small"></span> : 'Send Recovery Link'}
                            </button>
                        </form>

                        <div className="auth-footer staggered-entry" style={{ '--delay': '4' }}>
                            <p>
                                Remembered your credentials?{' '}
                                <Link to="/login" className="auth-link">Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
