// NeroSelection - Advanced AI Features (V3)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection, syncDatabase } = require('./config/database');

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Give some time for logs to flush before exiting
    setTimeout(() => process.exit(1), 1000);
});

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Database connection and sync
const connectDB = async () => {
    try {
        const connected = await testConnection();
        if (connected) {
            // Sync database (create tables if they don't exist)
            // Respect DB_SYNC_ALTER from .env (defaults to false)
            await syncDatabase({ alter: process.env.DB_SYNC_ALTER === 'true' });

            // Seed initial data
            const { seedReviewSources } = require('./database/seeders');
            const { seedRewards } = require('./database/rewardSeeder');
            await seedReviewSources();
            await seedRewards();
        } else {
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        process.exit(1);
    }
};

connectDB();

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to NeuroPick API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            reviews: '/api/reviews',
            scraping: '/api/scraping',
            gemini: '/api/gemini'
        }
    });
});

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/reviews');
const scrapingRoutes = require('./routes/scraping');
const geminiRoutes = require('./routes/gemini');
const rewardsRoutes = require('./routes/rewards');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/rewards', rewardsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}`);
});

module.exports = app;
