const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ScrapingJob = sequelize.define('ScrapingJob', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'product_id',
        references: {
            model: 'products',
            key: 'id'
        }
    },
    sourceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'source_id',
        references: {
            model: 'review_sources',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    reviewsFound: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'reviews_found'
    },
    reviewsProcessed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'reviews_processed'
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message'
    },
    startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'started_at'
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at'
    },
    options: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Scraping options and parameters'
    }
}, {
    tableName: 'scraping_jobs',
    timestamps: true,
    indexes: [
        { fields: ['product_id'] },
        { fields: ['source_id'] },
        { fields: ['status'] }
    ]
});

module.exports = ScrapingJob;
