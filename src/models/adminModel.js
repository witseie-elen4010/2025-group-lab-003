const db = require('../config/db');

const logAction = async (userId, actionType, details = null) => {
  try {
    const pool = await db.poolPromise;
    await pool.request()
      .input('userId', db.sql.VarChar, userId)
      .input('actionType', db.sql.VarChar, actionType)
      .input('details', db.sql.NVarChar, details)
      .query(`INSERT INTO ActionLogs (userId, actionType, details) VALUES (@userId, @actionType, @details)`);
  } catch (err) {
    console.error('Failed to log action:', err);
  }
};
//This function has to be reusable across the whole app
module.exports = logAction;
