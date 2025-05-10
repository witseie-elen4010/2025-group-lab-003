const db = require('../config/db');

// Generate a 6-char game code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

exports.createGame = async () => {
  const gameCode = generateCode();
  const query = `
    INSERT INTO GameState (gameCode, round, gameStarted, winner, log)
    VALUES (@gameCode, 1, 0, NULL, '[]')
  `;

  const pool = await db.poolPromise;
  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(query);

  return gameCode;
};

exports.joinGame = async (playerName, gameCode) => {
  const pool = await db.poolPromise;

  const query = `
    INSERT INTO Players (userId, gameCode, role, word, status)
    VALUES (@playerName, @gameCode, NULL, NULL, 'active')
  `;

  await pool.request()
    .input('playerName', db.sql.VarChar, playerName) // used as userId
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(query);
};

exports.getPlayersByGameCode = async (gameCode) => {
    const pool = await db.poolPromise;
    const result = await pool.request()
      .input('gameCode', db.sql.VarChar, gameCode)
      .query(`SELECT userId FROM Players WHERE gameCode = @gameCode`);
    return result.recordset;
};
  