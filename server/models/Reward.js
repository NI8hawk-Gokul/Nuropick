const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reward = sequelize.define('Reward', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    merchantName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'merchant_name'
    },
    merchantLogo: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'merchant_logo'
    },
    highlightText: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'highlight_text'
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expiry_date'
    },
    statusBadge: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'status_badge'
    },
    bannerImage: {
        type: DataTypes.STRING(512),
        allowNull: true,
        field: 'banner_image'
    },
    themeColor: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'theme_color'
    },
    pointsRequired: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'points_required'
    },
    discountValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'discount_value'
    },
    type: {
        type: DataTypes.ENUM('flat_discount', 'percentage_discount', 'free_shipping'),
        defaultValue: 'flat_discount'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'rewards',
    timestamps: true,
    underscored: true
});

module.exports = Reward;
