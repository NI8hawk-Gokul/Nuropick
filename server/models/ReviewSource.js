const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReviewSource = sequelize.define('ReviewSource', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.ENUM('reddit', 'amazon', 'flipkart', 'manual'),
        allowNull: false,
        unique: true
    },
    displayName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'display_name'
    },
    icon: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'review_sources',
    timestamps: true
});

module.exports = ReviewSource;
