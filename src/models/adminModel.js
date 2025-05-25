const logAction = async (
  userId,
  actionType,
  details = null,
  gameCode = null
) => {
  try {
    const db = require('../config/db');
    const pool = await db.poolPromise;
    await pool
      .request()
      .input('userId', db.sql.VarChar, userId)
      .input('actionType', db.sql.VarChar, actionType)
      .input('details', db.sql.NVarChar, details)
      .input('gameCode', db.sql.VarChar, gameCode).query(`
        INSERT INTO ActionLogs (userId, actionType, details, gameCode)
        VALUES (@userId, @actionType, @details, @gameCode)`);
  } catch (err) {
    console.error('Failed to log action:', err);
  }
};
//This function has to be reusable across the whole app
module.exports = logAction;
