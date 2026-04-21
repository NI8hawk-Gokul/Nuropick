const { sequelize } = require('../server/config/database');
const { QueryTypes } = require('sequelize');

async function check() {
    try {
        const results = await sequelize.query("DESCRIBE users", { type: QueryTypes.SELECT });
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Error describing users table:', error.message);
    } finally {
        await sequelize.close();
    }
}

check();
