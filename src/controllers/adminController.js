const db = require('../config/db');

//ADMIN LOG
exports.getActionLogs = async (req, res) => {
  // TODO: add real admin check later
  try {
    const pool = await db.poolPromise;
    const result = await pool.request()
      .query(`SELECT * FROM ActionLogs ORDER BY timestamp DESC`);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching action logs:', err);
    res.status(500).json({ error: 'Failed to fetch action logs' });
  }
};