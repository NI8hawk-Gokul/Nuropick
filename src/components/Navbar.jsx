import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import sounds from '../utils/sounds';
import './Navbar.css';

const THEMES = [
  { id: 'cosmic', label: '🪶 Cosmic', tip: 'Purple & Blue' },
  { id: 'ember',  label: '🔥 Ember',  tip: 'Warm Red & Orange' },
  { id: 'ocean',  label: '🌊 Ocean',  tip: 'Teal & Cyan' },
];

const applyTheme = (id) => {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem('np_theme', id);
};

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('np_theme') || 'cosmic');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('np_sound') !== 'off');
  const navigate = useNavigate();

  // Apply saved theme on mount
  useEffect(() => { applyTheme(currentTheme); }, []);

  // Close theme menu on outside click
  useEffect(() => {
    const handle = (e) => { if (!e.target.closest('.theme-picker')) setThemeMenuOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const switchTheme = (id) => {
    setCurrentTheme(id);
    applyTheme(id);
    setThemeMenuOpen(false);
    sounds.themeSwitch();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sounds.enabled = next;
    if (next) sounds.click();
  };

  const handleLogout = () => {
    sounds.click();
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    sounds.click();
    setMobileMenuOpen(false);
  };

  const theme = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={() => sounds.click()}>
            <span className="logo-icon" style={{ filter: 'hue-rotate(330deg) drop-shadow(0 0 10px rgba(255,102,204,0.4))' }}>🧠</span>
            <span className="logo-text" style={{ color: '#ffffff' }}>NeuroPick</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-links">
            <Link to="/products" className="nav-link" onClick={handleNavClick}>Products</Link>
            {isAuthenticated && (
              <>
                <Link to="/write-review" className="nav-link" onClick={handleNavClick}>Write Review</Link>
                <Link to="/dashboard" className="nav-link" onClick={handleNavClick}>Dashboard</Link>
                <Link to="/rewards" className="nav-link" onClick={handleNavClick}>
                  🪙 Rewards
                </Link>
                {(user?.username?.toLowerCase() === 'gokul19' && user?.email?.toLowerCase() === 'gokul68799@gmail.com') && (
                  <Link to="/admin" className="nav-link nav-link-admin" onClick={handleNavClick}>
                    🛡️ Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right-side controls */}
          <div className="navbar-actions">
            {/* Sound Toggle */}
            <button
              className="icon-control-btn"
              onClick={toggleSound}
              title={soundOn ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>

            {/* Theme Picker */}
            <div className="theme-picker">
              <button
                className="icon-control-btn theme-btn"
                onClick={() => { setThemeMenuOpen(p => !p); sounds.click(); }}
                title="Switch theme"
                style={{ color: '#4facfe' }}
              >
                {theme.label.split(' ')[0]}
              </button>
              {themeMenuOpen && (
                <div className="theme-dropdown">
                  <div className="theme-dropdown-title">Theme</div>
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      className={`theme-option ${currentTheme === t.id ? 'active' : ''}`}
                      onClick={() => switchTheme(t.id)}
                    >
                      <span>{t.label}</span>
                      <span className="theme-tip">{t.tip}</span>
                      {currentTheme === t.id && <span className="theme-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="user-menu">
                <Link to="/profile" className="user-info" onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                  <div className="user-avatar" style={{ position: 'relative' }}>
                    {user?.username?.charAt(0).toUpperCase()}
                    {user?.emailVerified && (
                      <span style={{
                        position: 'absolute', bottom: '-2px', right: '-2px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: '#22c55e', border: '2px solid var(--bg-secondary)',
                        display: 'block'
                      }} title="Email Verified" />
                    )}
                  </div>
                  <span className="user-name">{user?.username}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm" onClick={handleNavClick}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={handleNavClick}>Sign Up</Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/products" className="mobile-link" onClick={handleNavClick}>Products</Link>
            {isAuthenticated ? (
              <>
                <Link to="/write-review" className="mobile-link" onClick={handleNavClick}>Write Review</Link>
                <Link to="/dashboard" className="mobile-link" onClick={handleNavClick}>Dashboard</Link>
                <Link to="/rewards" className="mobile-link" onClick={handleNavClick}>🪙 Rewards</Link>
                <button onClick={handleLogout} className="mobile-link">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-link" onClick={handleNavClick}>Login</Link>
                <Link to="/register" className="mobile-link" onClick={handleNavClick}>Sign Up</Link>
              </>
            )}
            {/* Mobile theme row */}
            <div className="mobile-theme-row">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`mobile-theme-btn ${currentTheme === t.id ? 'active' : ''}`}
                  onClick={() => { switchTheme(t.id); setMobileMenuOpen(false); }}
                >
                  {t.label.split(' ')[0]}
                </button>
              ))}
              <button className="mobile-theme-btn" onClick={toggleSound}>{soundOn ? '🔊' : '🔇'}</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};


export default Navbar;
