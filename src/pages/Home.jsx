import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import sounds from '../utils/sounds';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      sounds.click();
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section - Redesigned */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">✨</span>
              <span>AI-Powered Review Analysis</span>
            </div>

            <h1 className="hero-title">
              Discover the Best Products
              <br />
              <span className="gradient-text">Through AI-Powered</span>
              <br />
              Review Analysis
            </h1>

            <p className="hero-description">
              NeuroPick analyzes thousands of reviews across platforms to help you make informed decisions in seconds
            </p>

            {/* Search Bar in Hero */}
            <form className="hero-search" onSubmit={handleSearch}>
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search product reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="btn btn-primary">
                  Search
                </button>
              </div>
            </form>

            <div className="hero-features">
              <div className="hero-feature">
                <span className="feature-icon">🤖</span>
                <span>AI Analysis</span>
              </div>
              <div className="hero-feature">
                <span className="feature-icon">🛡️</span>
                <span>Fake Detection</span>
              </div>
              <div className="hero-feature">
                <span className="feature-icon">📊</span>
                <span>Smart Recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Products Analyzed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Reviews Processed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5K+</div>
              <div className="stat-label">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful AI Features</h2>
            <p className="section-subtitle">
              Everything you need to make confident purchasing decisions
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🧠</div>
              </div>
              <h3>Sentiment Analysis</h3>
              <p>
                Advanced NLP algorithms detect emotions and provide accurate sentiment scores for every review
              </p>
              <Link to="/products" className="feature-link">
                Try it now →
              </Link>
            </div>

            <div className="feature-card glass-card featured">
              <div className="featured-badge">Popular</div>
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🔍</div>
              </div>
              <h3>Fake Review Detection</h3>
              <p>
                ML models identify suspicious patterns and promotional language to ensure authentic feedback
              </p>
              <Link to="/products" className="feature-link">
                Learn more →
              </Link>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📝</div>
              </div>
              <h3>Smart Summarization</h3>
              <p>
                AI-generated summaries highlight key pros, cons, and common themes from hundreds of reviews
              </p>
              <Link to="/products" className="feature-link">
                See examples →
              </Link>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🎯</div>
              </div>
              <h3>Personalized Recommendations</h3>
              <p>
                Get tailored product suggestions based on your preferences and review history
              </p>
              <Link to="/dashboard" className="feature-link">
                Get started →
              </Link>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">⚡</div>
              </div>
              <h3>Real-Time Analysis</h3>
              <p>
                Every review is analyzed instantly, providing immediate insights and quality scores
              </p>
              <Link to="/products" className="feature-link">
                Explore →
              </Link>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🌐</div>
              </div>
              <h3>Centralized Platform</h3>
              <p>
                Access reviews from multiple sources in one place without jumping between sites
              </p>
              <Link to="/products" className="feature-link">
                View all →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Redesigned */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get started in three simple steps</p>
          </div>

          <div className="steps-container">
            <div className="step-card glass-card">
              <div className="step-number">01</div>
              <div className="step-icon">🔎</div>
              <h3>Browse Products</h3>
              <p>Search and filter through thousands of products with advanced filters</p>
            </div>

            <div className="step-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">→</div>
            </div>

            <div className="step-card glass-card">
              <div className="step-number">02</div>
              <div className="step-icon">🤖</div>
              <h3>Read AI Insights</h3>
              <p>View comprehensive sentiment analysis, summaries, and authenticity scores</p>
            </div>

            <div className="step-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">→</div>
            </div>

            <div className="step-card glass-card">
              <div className="step-number">03</div>
              <div className="step-icon">✅</div>
              <h3>Make Smart Decisions</h3>
              <p>Choose the best product with confidence backed by data-driven insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - New */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-subtitle">Join thousands of satisfied customers</p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card glass-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "NeuroPick helped me avoid buying a product with fake reviews. The AI analysis is spot-on!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍💼</div>
                <div className="author-info">
                  <div className="author-name">John Smith</div>
                  <div className="author-role">Verified Buyer</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card glass-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "The sentiment analysis saves me hours of reading reviews. I can make decisions in minutes now."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💻</div>
                <div className="author-info">
                  <div className="author-name">Sarah Johnson</div>
                  <div className="author-role">Tech Enthusiast</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card glass-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Best product review platform I've used. The AI insights are incredibly accurate and helpful."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍🎓</div>
                <div className="author-info">
                  <div className="author-name">Mike Chen</div>
                  <div className="author-role">Online Shopper</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Redesigned */}
      <section className="cta">
        <div className="container">
          <div className="cta-content glass-card">
            <div className="cta-icon">🚀</div>
            <h2>Ready to Make Smarter Purchases?</h2>
            <p>Join thousands of users who trust NeuroPick for authentic product insights</p>
            <div className="cta-actions">
              {isAuthenticated ? (
                <Link to="/products" className="btn btn-primary btn-lg">
                  <span>Browse Products</span>
                  <span className="btn-arrow">→</span>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    <span>Get Started Free</span>
                    <span className="btn-arrow">→</span>
                  </Link>
                  <Link to="/products" className="btn btn-outline btn-lg">
                    Explore Products
                  </Link>
                </>
              )}
            </div>
            <p className="cta-note">No credit card required • Free forever</p>
            
            <div className="cta-contact">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <a href="mailto:info@neuropick.ai">info@neuropick.ai</a>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <a href="tel:+18886387624">+1 (888) NEURO-AI</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
