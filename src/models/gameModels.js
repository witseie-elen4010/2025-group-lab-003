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
  
exports.recordVote = async (gameCode, round, voterId, targetId) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  // First, check if voterId and targetId are integers
  if (typeof voterId !== 'number' || typeof targetId !== 'number') {
    throw new Error('voterId and targetId must be integer Player IDs');
  }

  const existingVote = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('round', db.sql.Int, round)
    .input('voterId', db.sql.Int, voterId)          
    .query(`SELECT COUNT(*) AS count FROM Votes 
            WHERE gameCode = @gameCode AND round = @round AND voterId = @voterId`);

  if (existingVote.recordset[0].count > 0) {
    throw new Error('Player has already voted this round');
  }

  // Insert the vote record
  const insertQuery = `
    INSERT INTO Votes (gameCode, round, voterId, targetId)
    VALUES (@gameCode, @round, @voterId, @targetId)
  `;

  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('round', db.sql.Int, round)
    .input('voterId', db.sql.Int, voterId)         
    .input('targetId', db.sql.Int, targetId)       
    .query(insertQuery);
};

exports.getCurrentRound = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT round FROM GameState WHERE gameCode = @gameCode`);

  if (result.recordset.length === 0) throw new Error('Game not found');

  return result.recordset[0].round;
};

exports.getPlayerIdByUserId = async (gameCode, userId) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  
  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('userId', db.sql.VarChar, userId)
    .query('SELECT id FROM Players WHERE gameCode = @gameCode AND userId = @userId');
  if (result.recordset.length === 0) throw new Error('Player not found');
  return result.recordset[0].id;
}

  