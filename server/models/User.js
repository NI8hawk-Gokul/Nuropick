const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 30]
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255]
        }
    },
    firstName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'first_name'
    },
    lastName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'last_name'
    },
    avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: ''
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 500]
        }
    },
    emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'email_notifications'
    },
    reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'review_count'
    },
    helpfulVotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'helpful_votes'
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified'
    },
    otpCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'otp_code'
    },
    otpExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'otp_expiry'
    },
    resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reset_password_token'
    },
    resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reset_password_expire'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'loyalty_points'
    }
}, {
    tableName: 'users'
});

module.exports = User;
