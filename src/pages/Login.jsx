import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      if (user?.emailVerified) {
        navigate('/dashboard');
      } else {
        navigate('/verify-email');
      }
    }
  }, [isAuthenticated, user, navigate]);

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
    setLoading(true);

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await login(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="container login-split-container">
        <div className="auth-card glass-card fade-in split-card">
          {/* Left Side: Anime Aesthetic Showcase */}
          <div className="auth-showcase">
            <div className="glow-orb"></div>
            <div className="anime-character-wrapper float-animation">
              {/* Layered CSS-based tech aesthetic illustration */}
              <div className="tech-avatar">
                <div className="avatar-ring ring-1"></div>
                <div className="avatar-ring ring-2"></div>
                <div className="avatar-ring ring-3"></div>
                <div className="avatar-core">
                  <span className="avatar-icon">⬡</span>
                  <div className="avatar-scan-line"></div>
                </div>
                <div className="avatar-data data-1">01001110</div>
                <div className="avatar-data data-2">AI_INIT</div>
                <div className="avatar-data data-3">NEURO::1</div>
                <div className="avatar-dot dot-1"></div>
                <div className="avatar-dot dot-2"></div>
                <div className="avatar-dot dot-3"></div>
              </div>
            </div>
            <div className="showcase-content">
              <h3>NeuroPick System</h3>
              <p>Analyzing reality, one review at a time.</p>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="auth-form-container">
            <div className="auth-header staggered-entry" style={{'--delay': '1'}}>
              <h1>Welcome Back</h1>
              <p>Initialize login sequence for your account</p>
            </div>

            {error && (
              <div className="alert alert-error staggered-entry" style={{'--delay': '1'}}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group staggered-entry" style={{'--delay': '2'}}>
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group staggered-entry" style={{'--delay': '3'}}>
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <div className="form-help">
                  <Link to="/forgot-password" title="Recover your account password" id="forgot-password-link" className="auth-link-alt">Forgot Password?</Link>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block glowing-btn staggered-entry"
                style={{'--delay': '4'}}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-small"></span>
                ) : (
                  'Access System'
                )}
              </button>
            </form>

            <div className="auth-footer staggered-entry" style={{'--delay': '5'}}>
              <p>
                Don't have clearance?{' '}
                <Link to="/register" className="auth-link">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
