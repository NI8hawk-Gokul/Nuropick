const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReviewHelpfulVote = sequelize.define('ReviewHelpfulVote', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    reviewId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'review_id',
        references: {
            model: 'reviews',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'review_helpful_votes',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['review_id', 'user_id'],
            name: 'unique_vote'
        }
    ]
});

module.exports = ReviewHelpfulVote;
