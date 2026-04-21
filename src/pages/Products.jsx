import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../utils/api';
import './Products.css';

const Products = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    sortBy: 'createdAt',
    order: 'desc',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const categories = [
    'all',
    'Electronics',
    'Clothing',
    'Home & Kitchen',
    'Books',
    'Sports',
    'Beauty',
    'Toys',
    'Food',
    'Other'
  ];

  useEffect(() => {
    const search = searchParams.get('search');
    if (search !== null) {
      if (search.startsWith('http')) {
        handleUrlSearch(search);
      } else if (search !== filters.search) {
        setFilters(prev => ({ ...prev, search }));
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }
  }, [searchParams]);

  const handleUrlSearch = async (url) => {
    if (analyzing) return;
    try {
      setAnalyzing(true);
      setError('');
      const response = await productsAPI.analyzeUrl(url);
      if (response.success) {
        setFilters(prev => ({ ...prev, search: '' }));
        navigate(`/products/${response.product?.id || response.productId}`);
      }
    } catch (err) {
      const msg = err.message || (typeof err === 'string' ? err : 'Failed to analyze product URL');
      if (msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('login') || msg.includes('401')) {
        setError('⚠️ Please log in to add and analyze new products.');
      } else {
        setError(msg);
      }
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };


  useEffect(() => {
    // Don't run a text search if the search value is a URL (handled by handleUrlSearch)
    if (filters.search?.startsWith('http')) return;
    fetchProducts();
  }, [filters, pagination.page]);


  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy,
        order: filters.order
      };

      const response = await productsAPI.getAll(params);
      if (response && response.products) {
        setProducts(response.products);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          pages: response.pagination?.pages || 0
        }));
      } else {
        setProducts([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (filters.search.startsWith('http')) {
      handleUrlSearch(filters.search);
    } else {
      fetchProducts();
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={`star ${index < Math.round(rating) ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <h1>Discover Products</h1>
          <p>Browse our catalog and find the perfect product with AI-powered insights</p>
        </div>

        {/* Filters */}
        <div className="filters-section glass-card">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, or paste an Amazon / Flipkart URL to add a new product..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text').trim();
                if (pasted.startsWith('http')) {
                  e.preventDefault();
                  setFilters(prev => ({ ...prev, search: pasted }));
                  handleUrlSearch(pasted);
                }
              }}
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          <div className="filters-row">
            <div className="filter-group">
              <label>Category</label>
              <select
                className="filter-select"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                className="filter-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="createdAt">Newest</option>
                <option value="averageRating">Rating</option>
                <option value="reviewCount">Most Reviewed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Order</label>
              <select
                className="filter-select"
                value={filters.order}
                onChange={(e) => handleFilterChange('order', e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {analyzing ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Analyzing product... This may take a few moments.</p>
          </div>
        ) : loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchProducts} className="btn btn-primary">Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3>No products found{filters.search ? ` for "${filters.search}"` : ''}</h3>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
              This product isn't in our database yet. Add it by pasting its Amazon or Flipkart URL below.
            </p>
            {analyzing ? (
              <div className="loading-container" style={{ minHeight: 'auto', padding: '1rem' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem' }}>🤖 Analyzing product and generating AI insights...</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const url = e.target.productUrl.value.trim();
                  if (url) handleUrlSearch(url);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '520px', margin: '0 auto' }}
              >
                <input
                  name="productUrl"
                  type="url"
                  className="search-input"
                  placeholder="https://www.amazon.in/... or https://www.flipkart.com/..."
                  defaultValue={filters.search?.startsWith('http') ? filters.search : ''}
                  style={{ width: '100%' }}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  ✨ Analyze & Add Product
                </button>
                <p style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Supports Amazon.in and Flipkart URLs. AI summary will be generated automatically.
                </p>
              </form>
            )}
            {error && <p style={{ color: 'var(--error)', marginTop: '1rem' }}>{error}</p>}
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map(product => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="product-card glass-card"
                >
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="product-placeholder">📦</div>
                    )}
                    <span className="product-category badge">{product.category}</span>
                  </div>

                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">
                      {product.description ? (
                        <>
                          {product.description.substring(0, 100)}
                          {product.description.length > 100 ? '...' : ''}
                        </>
                      ) : 'No description available'}
                    </p>

                    <div className="product-rating">
                      <div className="rating-stars">
                        {renderStars(parseFloat(product.averageRating) || 0)}
                      </div>
                      <span className="rating-value">
                        {parseFloat(product.averageRating || 0).toFixed(1)}
                      </span>
                      <span className="review-count">
                        ({product.reviewCount || 0} reviews)
                      </span>
                    </div>

                    {product.sentimentScore !== 0 && (
                      <div className="sentiment-indicator">
                        <span className={`sentiment-badge ${product.sentimentScore > 0.1 ? 'positive' :
                          product.sentimentScore < -0.1 ? 'negative' : 'neutral'
                          }`}>
                          {product.sentimentScore > 0.1 ? '😊 Positive' :
                            product.sentimentScore < -0.1 ? '😞 Negative' : '😐 Neutral'}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
