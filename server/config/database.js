const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME || 'neuropick',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true, // Use snake_case for automatically added attributes
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    }
);

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to MySQL database:', error.message);
        return false;
    }
};

// Sync database (create tables)
const syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('✅ Database synchronized');
    } catch (error) {
        console.error('❌ Database sync error:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};
