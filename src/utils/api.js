import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const url = error.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/login') || 
                               url.includes('/auth/register') || 
                               url.includes('/auth/verify-otp') || 
                               url.includes('/auth/send-otp') ||
                               url.includes('/auth/forgot-password') ||
                               url.includes('/auth/reset-password');

        if (error.response?.status === 401 && !isAuthEndpoint) {
            // Unauthorized on a protected route - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Avoid infinite redirect loop if already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        const errData = error.response?.data;
        const message = errData?.message || error.message || 'An error occurred';
        const rejected = new Error(message);
        rejected.status = error.response?.status;
        rejected.data = errData;
        return Promise.reject(rejected);
    }
);

// Auth API
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    sendOtp: () => api.post('/auth/send-otp'),
    verifyOtp: (data) => api.post('/auth/verify-otp', data),
    changePassword: (data) => api.post('/auth/change-password', data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data)
};

// Products API
export const productsAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (productData) => api.post('/products', productData),
    update: (id, productData) => api.put(`/products/${id}`, productData),
    delete: (id) => api.delete(`/products/${id}`),
    getCategories: () => api.get('/products/categories/list'),
    analyzeUrl: (url) => api.post('/products/analyze-url', { url }),
    scrape: (id) => api.post(`/products/${id}/scrape`)
};

// Reviews API
export const reviewsAPI = {
    getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
    getMyReviews: () => api.get('/reviews/my'),
    create: (reviewData) => api.post('/reviews', reviewData),
    update: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
    delete: (id) => api.delete(`/reviews/${id}`),
    markHelpful: (id) => api.post(`/reviews/${id}/helpful`)
};

// Rewards API
export const rewardsAPI = {
    getAll: () => api.get('/rewards'),
    getMyRewards: () => api.get('/rewards/my'),
    redeem: (rewardId) => api.post('/rewards/redeem', { rewardId })
};

// Gemini AI API
export const geminiAPI = {
    analyze: (productId) => api.post('/gemini/analyze', { productId }),
    recommend: (data) => api.post('/gemini/recommend', data),
    chat: (data) => api.post('/gemini/chat', data),
    detectFake: (data) => api.post('/gemini/detect-fake', data),
    analyzeVisual: (productId) => api.post('/gemini/analyze-visual', { productId }),
    getPriceIQ: (productId) => api.post('/gemini/price-iq', { productId })
};

// Admin API
export const adminAPI = {
    getUsers: () => api.get('/auth/admin/users'),
    verifyUser: (id) => api.put(`/auth/admin/verify/${id}`, { verified: true }),
    revokeUser: (id) => api.put(`/auth/admin/verify/${id}`, { verified: false }),
    verifyAll: () => api.put('/auth/admin/verify-all')
};

export default api;
