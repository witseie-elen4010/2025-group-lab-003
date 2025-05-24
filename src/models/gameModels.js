const logAction = require('../models/adminModel');

// Generate a 6-char game code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

exports.createGame = async (creatorName, mode = 'online') => {
  const db = require('../config/db');
  const gameCode = generateCode();

  const query = `
    INSERT INTO GameState (gameCode, round, gameStarted, winner, log, mode, adminUserId)
    VALUES (@gameCode, 1, 0, NULL, '[]', @mode, @creatorName)
  `;

  const pool = await db.poolPromise;
  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('mode', db.sql.VarChar, mode)
    .input('creatorName', db.sql.VarChar, creatorName)
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

    // Ensure there is exactly one "undercover" and the rest are "civilian"
    const roleOptions = ['undercover'];
    const playerCountQuery = `
      SELECT COUNT(*) AS playerCount FROM Players WHERE gameCode = @gameCode
    `;
    const result = await pool.request()
        .input('gameCode', db.sql.VarChar, gameCode)
        .query(playerCountQuery);

    const playerCount = result.recordset[0].playerCount;

    // Add enough "civilian" roles to the roleOptions array
    for (let i = 1; i < playerCount; i++) {
        roleOptions.push('civilian');
    }

    // Shuffle the roles to distribute them randomly
    const shuffledRoles = roleOptions.sort(() => Math.random() - 0.5);

    const wordSet = {
        undercover: 'Apple',
        civilian: 'Banana'
    };

    // Get the list of players from the database
    const playersResult = await pool.request()
        .input('gameCode', db.sql.VarChar, gameCode)
        .query(`SELECT userId FROM Players WHERE gameCode = @gameCode`);

    const players = playersResult.recordset;

    // Assign roles and words to each player
    for (let i = 0; i < players.length; i++) {
        const role = shuffledRoles[i];
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

// Check if all players have voted for given gameCode and round
exports.haveAllPlayersVoted = async (gameCode, round) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  // Get count of active players in the game
  const playerCountQuery = `
    SELECT COUNT(*) AS playerCount
    FROM Players
    WHERE gameCode = @gameCode
      AND status = 'active'   -- or whatever field indicates they are still in game
  `;

  const votesCountQuery = `
    SELECT COUNT(DISTINCT voterId) AS votesCount
    FROM Votes
    WHERE gameCode = @gameCode AND round = @round
  `;

  // Run queries concurrently
  const [playersResult, votesResult] = await Promise.all([
    pool.request()
      .input('gameCode', db.sql.VarChar, gameCode)
      .query(playerCountQuery),

    pool.request()
      .input('gameCode', db.sql.VarChar, gameCode)
      .input('round', db.sql.Int, round)
      .query(votesCountQuery),
  ]);

  const playerCount = playersResult.recordset[0].playerCount;
  const votesCount = votesResult.recordset[0].votesCount;

  return votesCount >= playerCount; // true if all players voted
};

// Get the vote counts for a given game and round
exports.getVoteCounts = async (gameCode, round) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  const query = `
    SELECT targetId, COUNT(*) AS votesReceived
    FROM Votes
    WHERE gameCode = @gameCode AND round = @round
    GROUP BY targetId
    ORDER BY votesReceived DESC
  `;

  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('round', db.sql.Int, round)
    .query(query);

  return result.recordset;
};

// Mark player as eliminated by playerId
exports.eliminatePlayerById = async (playerId) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  await pool.request()
    .input('playerId', db.sql.Int, playerId)
    .query(`UPDATE Players SET status = 'eliminated' WHERE id = @playerId`);
};

// Get player details by id
exports.getPlayerById = async (playerId) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  const result = await pool.request()
    .input('playerId', db.sql.Int, playerId)
    .query(`SELECT userId, status FROM Players WHERE id = @playerId`);

  if (result.recordset.length === 0) throw new Error('Player not found');
  return result.recordset[0];
};


exports.incrementRound = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`UPDATE GameState SET round = round + 1 WHERE gameCode = @gameCode`);
};

exports.assignNewWords = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  // Define new words for roles (can randomize later)
  const wordSet = {
    undercover: 'Cherry',  // example new word
    civilian: 'Grape'
  };

  const playersResult = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT userId, role FROM Players WHERE gameCode = @gameCode AND status = 'active'`);

  const players = playersResult.recordset;

  // Update word only for each player, keep roles unchanged
  for (const player of players) {
    const newWord = wordSet[player.role] || 'Unknown';
    await pool.request()
      .input('userId', db.sql.VarChar, player.userId)
      .input('gameCode', db.sql.VarChar, gameCode)
      .input('word', db.sql.VarChar, newWord)
      .query(`
        UPDATE Players
        SET word = @word
        WHERE userId = @userId AND gameCode = @gameCode
      `);
  }
};

exports.getPlayerRoleById = async (playerId) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  const result = await pool.request()
    .input('playerId', db.sql.Int, playerId)
    .query(`SELECT userId, role FROM Players WHERE id = @playerId`);

  if (result.recordset.length === 0) throw new Error('Player not found');
  return result.recordset[0];  // { userId, role }
};

exports.endGame = async (gameCode, winnerSide) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  // Update the winner column in GameState for the given gameCode
  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('winner', db.sql.VarChar, winnerSide)
    .query(`UPDATE GameState SET winner = @winner, gameStarted = 0 WHERE gameCode = @gameCode`);
};


exports.saveChatMessage = async (gameCode, round, playerName, message) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('round', db.sql.Int, round)
    .input('playerName', db.sql.VarChar, playerName)
    .input('message', db.sql.NVarChar, message)
    .query(`
      INSERT INTO ChatMessages (gameCode, round, playerName, message)
      VALUES (@gameCode, @round, @playerName, @message)
    `);

  // Log the chat message action:
  await logAction(playerName, 'CHAT_MESSAGE', `In game ${gameCode}, round ${round}: ${message}`, gameCode);
};

exports.getGameMode = async (gameCode) => {
    const db = require('../config/db');
    const pool = await db.poolPromise;
    const result = await pool.request()
        .input('gameCode', db.sql.VarChar, gameCode)
        .query('SELECT mode FROM GameState WHERE gameCode = @gameCode');
    if (result.recordset.length === 0) throw new Error('Game not found');
    return result.recordset[0].mode;
};

// Insert a new user into Users table
exports.createUser = async (name, email, passwordHash) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  const query = `
    INSERT INTO Users (name, email, password_hash)
    VALUES (@name, @email, @passwordHash)
  `;

  await pool.request()
    .input('name', db.sql.NVarChar, name)
    .input('email', db.sql.NVarChar, email)
    .input('passwordHash', db.sql.NVarChar, passwordHash)
    .query(query);
};

// Find a user by email
exports.getUserByEmail = async (email) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  const query = `SELECT * FROM Users WHERE email = @email`;

  const result = await pool.request()
    .input('email', db.sql.NVarChar, email)
    .query(query);

  return result.recordset[0]; // return user object or undefined
};

// Get overall game state: winner and rounds played
exports.getGameState = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT winner, round, gameStarted, mode FROM GameState WHERE gameCode = @gameCode`);
  return result.recordset[0];
};

// Get all players with their roles for a game
exports.getPlayersWithRoles = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT userId, role FROM Players WHERE gameCode = @gameCode`);
  return result.recordset;
};

// Get active players with their roles
exports.getActivePlayers = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT userId, role, status FROM Players WHERE gameCode = @gameCode AND status = 'active'`);
  return result.recordset;
};

//RETURNING THE ADMIN USER
exports.getAdminUserId = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT adminUserId FROM GameState WHERE gameCode = @gameCode`);
  return result.recordset[0]?.adminUserId;
};

// UPDATING THE GAME MODE
exports.updateGameMode = async (gameCode, mode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  const query = `
    UPDATE GameState
    SET mode = @mode
    WHERE gameCode = @gameCode
  `;

  await pool.request()
    .input('mode', db.sql.VarChar, mode)
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(query);

  console.log(`Updated game mode to ${mode} for gameCode ${gameCode}`);
};





