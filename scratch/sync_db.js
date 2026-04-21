const { sequelize, syncDatabase } = require('../server/config/database');
const { User } = require('../server/models'); // Ensure model is loaded

async function runSync() {
    try {
        console.log('Starting manual sync with alter: true...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized successfully');
    } catch (error) {
        console.error('❌ Sync error:', error);
    } finally {
        await sequelize.close();
    }
}

runSync();
