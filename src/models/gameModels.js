// Generate a 6-char game code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

exports.createGame = async () => {
    const db = require('../config/db');
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
    const db = require('../config/db');
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
    const db = require('../config/db');
    const pool = await db.poolPromise;
    const result = await pool.request()
        .input('gameCode', db.sql.VarChar, gameCode)
        .query(`SELECT userId FROM Players WHERE gameCode = @gameCode`);
    return result.recordset;
};
  
exports.startGame = async (gameCode) => {
    const db = require('../config/db');
    const pool = await db.poolPromise;
  
    await pool.request()
      .input('gameCode', db.sql.VarChar, gameCode)
      .query(`UPDATE GameState SET gameStarted = 1 WHERE gameCode = @gameCode`);
  };

// Assign roles and words to players
exports.assignRolesAndWords = async (gameCode) => {
    const db = require('../config/db');
    const pool = await db.poolPromise;
  
    const roleOptions = ['undercover', 'civilian', 'civilian'];
    const shuffledRoles = roleOptions.sort(() => Math.random() - 0.5);
  
    const wordSet = {
      undercover: 'Apple',
      civilian: 'Banana'
    };
  
    const result = await pool.request()
      .input('gameCode', db.sql.VarChar, gameCode)
      .query(`SELECT userId FROM Players WHERE gameCode = @gameCode`);
  
    const players = result.recordset;
  
    for (let i = 0; i < players.length; i++) {
      const role = shuffledRoles[i % shuffledRoles.length];
      const word = wordSet[role];
  
      await pool.request()
        .input('userId', db.sql.VarChar, players[i].userId)
        .input('gameCode', db.sql.VarChar, gameCode)
        .input('role', db.sql.VarChar, role)
        .input('word', db.sql.VarChar, word)
        .query(`
          UPDATE Players
          SET role = @role, word = @word
          WHERE userId = @userId AND gameCode = @gameCode
        `);
    }
  };
  
  // Get word and role for a specific player
exports.getPlayerByNameAndGameCode = async (name, gameCode) => {
    const db = require('../config/db');
    const pool = await db.poolPromise;
  
    const result = await pool.request()
      .input('userId', db.sql.VarChar, name)
      .input('gameCode', db.sql.VarChar, gameCode)
      .query(`SELECT word, role FROM Players WHERE userId = @userId AND gameCode = @gameCode`);
  
    return result.recordset[0];
};
  
  