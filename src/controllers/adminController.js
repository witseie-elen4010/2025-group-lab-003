//ADMIN LOG
exports.getActionLogs = async (req, res) => {
  const db = require('../config/db');
  const { gameCode } = req.params;

  if (!gameCode) {
    return res.status(400).json({ error: 'Game code is required' });
  }

  try {
    const pool = await db.poolPromise;
    const result = await pool.request()
      .input('gameCode', db.sql.VarChar, gameCode)
      .query(`SELECT * FROM ActionLogs WHERE gameCode = @gameCode ORDER BY timestamp DESC`);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching action logs:', err);
    res.status(500).json({ error: 'Failed to fetch action logs' });
  }
};
