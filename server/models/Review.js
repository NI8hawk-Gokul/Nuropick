const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id',
        references: {
            model: 'products',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [1, 100]
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 5000]
        }
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
    sentimentLabel: {
        type: DataTypes.ENUM('positive', 'negative', 'neutral'),
        defaultValue: 'neutral',
        field: 'sentiment_label'
    },
    keyPhrases: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'key_phrases',
        get() {
            const val = this.getDataValue('keyPhrases');
            return val ? JSON.parse(val) : [];
        },
        set(val) {
            this.setDataValue('keyPhrases', JSON.stringify(val));
        }
    },
    emotions: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const val = this.getDataValue('emotions');
            return val ? JSON.parse(val) : {};
        },
        set(val) {
            this.setDataValue('emotions', JSON.stringify(val));
        }
    },
    fakeScore: {
        type: DataTypes.DECIMAL(4, 3),
        defaultValue: 0,
        validate: {
            min: 0,
            max: 1
        },
        field: 'fake_score'
    },
    isSuspicious: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_suspicious'
    },
    helpfulCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'helpful_count'
    },
    notHelpfulCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'not_helpful_count'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
    },
    verifiedPurchase: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'verified_purchase'
    },
    moderationStatus: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
        defaultValue: 'approved',
        field: 'moderation_status'
    },
    moderationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'moderation_notes'
    },
    sourceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'source_id',
        references: {
            model: 'review_sources',
            key: 'id'
        }
    },
    externalId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'external_id'
    },
    isAiGenerated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_ai_generated'
    }
}, {
    tableName: 'reviews',
    indexes: [
        { fields: ['product_id', 'created_at'] },
        { fields: ['user_id', 'created_at'] },
        { fields: ['rating'] },
        { fields: ['sentiment_score'] },
        { fields: ['helpful_count'] },
        {
            unique: true,
            fields: ['product_id', 'user_id'],
            name: 'unique_user_product'
        }
    ]
});

module.exports = Review;
