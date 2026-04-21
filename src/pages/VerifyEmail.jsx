import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const VerifyEmail = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const { verifyOTP, sendOTP } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await verifyOTP(otp);
            if (result.success) {
                setMessage('Email verified successfully! 🎉');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setError(result.message || 'Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setMessage('');
        try {
            const res = await sendOTP();
            if (res.success) {
                setMessage('A new OTP has been sent to your email. 📬');
            } else {
                setError(res.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        }
    };

    return (
        <div className="auth-page">
            <div className="container">
                <div className="auth-container" style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <div className="auth-card glass-card fade-in">
                        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>📧</div>
                            <h1>Verify Your Email</h1>
                            <p>We've sent a 6-digit code to your inbox</p>
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{
                                padding: '0.8rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem',
                                background: 'rgba(245,87,108,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)'
                            }}>
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="alert alert-success" style={{
                                padding: '0.8rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem',
                                background: 'rgba(0,242,254,0.1)', color: 'var(--success)', border: '1px solid var(--success)'
                            }}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Enter Verification Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ width: '100%', marginTop: '1.5rem' }}>
                                {loading ? 'Verifying...' : 'Verify Now'}
                            </button>
                        </form>

                        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Didn't receive the code?{' '}
                                <button
                                    onClick={handleResend}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Resend OTP
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
