const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            len: [1, 200]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 2000]
        }
    },
    category: {
        type: DataTypes.ENUM('Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Food', 'Other'),
        allowNull: false
    },
    brand: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: '',
        field: 'image_url'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD'
    },
    averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
        validate: {
            min: 0,
            max: 5
        },
        field: 'average_rating'
    },
    reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'review_count'
    },
    sentimentScore: {
        type: DataTypes.DECIMAL(4, 3),
        defaultValue: 0,
        validate: {
            min: -1,
            max: 1
        },
        field: 'sentiment_score'
    },
    aiSummary: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ai_summary'
    },
    aiPros: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ai_pros',
        get() {
            const val = this.getDataValue('aiPros');
            return val ? JSON.parse(val) : [];
        },
        set(val) {
            this.setDataValue('aiPros', JSON.stringify(val));
        }
    },
    aiCons: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ai_cons',
        get() {
            const val = this.getDataValue('aiCons');
            return val ? JSON.parse(val) : [];
        },
        set(val) {
            this.setDataValue('aiCons', JSON.stringify(val));
        }
    },
    aiKeyPhrases: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ai_key_phrases',
        get() {
            const val = this.getDataValue('aiKeyPhrases');
            return val ? JSON.parse(val) : [];
        },
        set(val) {
            this.setDataValue('aiKeyPhrases', JSON.stringify(val));
        }
    },
    aiLastUpdated: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'ai_last_updated'
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    amazonUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'amazon_url'
    },
    flipkartUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'flipkart_url'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'products',
    indexes: [
        { fields: ['category'] },
        { fields: ['average_rating'] },
        { fields: ['review_count'] },
        { fields: ['created_by'] }
    ]
});

module.exports = Product;
