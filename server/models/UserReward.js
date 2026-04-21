const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserReward = sequelize.define('UserReward', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    rewardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'reward_id'
    },
    couponCode: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'coupon_code'
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_used'
    },
    redeemedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'redeemed_at'
    }
}, {
    tableName: 'user_rewards',
    timestamps: true,
    underscored: true
});

module.exports = UserReward;
