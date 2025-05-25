const logAction = require('../models/adminModel');

// Generate a 6-char game code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

exports.createGame = async (creatorName, mode = 'online') => {
  const db = require('../config/db');
  const gameCode = generateCode();

const query = `
  INSERT INTO GameState (gameCode, round, gameStarted, winner, log, mode, adminUserId, isActive)
  VALUES (@gameCode, 1, 0, NULL, '[]', @mode, @creatorName, 1)
`;

/*exports.disableGame = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  const query = `
    UPDATE GameState
    SET isActive = 0
    WHERE gameCode = @gameCode
  `;

  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(query);
};*/

///////////
  const pool = await db.poolPromise;
  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('mode', db.sql.VarChar, mode)
    .input('creatorName', db.sql.VarChar, creatorName)
    .query(query);

  return gameCode;
};

exports.disableGame = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  const query = `
    UPDATE GameState
    SET isActive = 0
    WHERE gameCode = @gameCode
  `;

  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(query);
};

exports.joinGame = async (playerName, gameCode) => {
    const db = require('../config/db');
    const pool = await db.poolPromise;

    // Check if game exists and is active
    const result = await pool.request()
      .input('gameCode', db.sql.VarChar, gameCode)
      .query('SELECT isActive FROM GameState WHERE gameCode = @gameCode');

    if (result.recordset.length === 0) {
      throw new Error('Game code not found');
    }

    if (result.recordset[0].isActive === 0) {
      throw new Error('Game is closed and cannot be joined');
    }

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
        .query(`SELECT userId, role, status FROM Players WHERE gameCode = @gameCode`);
    return result.recordset;
};

exports.startGame = async (gameCode) => {
    const db = require('../config/db');
    const pool = await db.poolPromise;

    await pool.request()
      .input('gameCode', db.sql.VarChar, gameCode)
      .query(`UPDATE GameState SET gameStarted = 1 WHERE gameCode = @gameCode`);
  };

// Assign roles to players
exports.assignRoles = async (gameCode) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  const playerCountQuery = `
    SELECT COUNT(*) AS playerCount FROM Players WHERE gameCode = @gameCode
  `;
  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(playerCountQuery);

  const playerCount = result.recordset[0].playerCount;

  // Create roles: 1 undercover, rest civilians
  const roles = ['undercover'];
  for (let i = 1; i < playerCount; i++) {
    roles.push('civilian');
  }

  // Shuffle roles randomly
  const shuffledRoles = roles.sort(() => Math.random() - 0.5);

  // Get players
  const playersResult = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT userId FROM Players WHERE gameCode = @gameCode`);

  const players = playersResult.recordset;

  // Assign roles to players
  for (let i = 0; i < players.length; i++) {
    await pool.request()
      .input('userId', db.sql.VarChar, players[i].userId)
      .input('gameCode', db.sql.VarChar, gameCode)
      .input('role', db.sql.VarChar, shuffledRoles[i])
      .query(`
        UPDATE Players SET role = @role WHERE userId = @userId AND gameCode = @gameCode
      `);
  }
};

// Assign words to players

// Load all word pairs from DB
exports.loadWordPairsFromDB = async () => {
  const db = require('../config/db');
  const pool = await db.poolPromise;
  const result = await pool.request()
    .query('SELECT undercoverWord, civilianWord FROM WordPairs');
  return result.recordset; // array of {undercoverWord, civilianWord}
};

// Get all word pairs assigned so far for a game
async function getUsedRoundsPairs(pool, gameCode) {
  const db = require('../config/db');
  const result = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT undercoverWord, civilianWord FROM RoundWords WHERE gameCode = @gameCode`);
  return result.recordset; // array of objects
}

// Filter to get unused pairs
function getUnusedPairs(allPairs, usedPairs) {
  return allPairs.filter(pair => !usedPairs.some(
    used => used.undercoverWord === pair.undercoverWord && used.civilianWord === pair.civilianWord
  ));
}

// Pick random pair from array
function pickRandomPair(pairs) {
  const idx = Math.floor(Math.random() * pairs.length);
  return pairs[idx];
}

exports.assignWordsForRound = async (gameCode, round) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  // Load dictionary pairs from DB
  const allPairs = await exports.loadWordPairsFromDB();

  // Load used pairs for this game
  const usedPairs = await getUsedRoundsPairs(pool, gameCode);

  // Filter to unused pairs
  const unusedPairs = getUnusedPairs(allPairs, usedPairs);

  if (unusedPairs.length === 0) {
    throw new Error('No unused word pairs left for this game.');
  }

  // Pick a random unused pair
  const selectedPair = pickRandomPair(unusedPairs);

  // Store selected pair for this round/game (upsert)
  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('round', db.sql.Int, round)
    .input('undercoverWord', db.sql.VarChar, selectedPair.undercoverWord)
    .input('civilianWord', db.sql.VarChar, selectedPair.civilianWord)
    .query(`
      MERGE INTO RoundWords WITH (HOLDLOCK) AS target
      USING (VALUES (@gameCode, @round)) AS source (gameCode, round)
      ON target.gameCode = source.gameCode AND target.round = source.round
      WHEN MATCHED THEN
        UPDATE SET undercoverWord = @undercoverWord, civilianWord = @civilianWord
      WHEN NOT MATCHED THEN
        INSERT (gameCode, round, undercoverWord, civilianWord)
        VALUES (@gameCode, @round, @undercoverWord, @civilianWord);
    `);

  // Get active players with roles
  const playersResult = await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .query(`SELECT userId, role FROM Players WHERE gameCode = @gameCode AND status = 'active'`);

  // Assign words to players based on role
  for (const player of playersResult.recordset) {
    const word = player.role === 'undercover' ? selectedPair.undercoverWord : selectedPair.civilianWord;
    await pool.request()
      .input('userId', db.sql.VarChar, player.userId)
      .input('gameCode', db.sql.VarChar, gameCode)
      .input('word', db.sql.VarChar, word)
      .query(`
        UPDATE Players SET word = @word WHERE userId = @userId AND gameCode = @gameCode
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

// Clear all votes for a given game and round to allow revoting
exports.clearVotesForRound = async (gameCode, round) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  const query = `
    DELETE FROM Votes
    WHERE gameCode = @gameCode AND round = @round
  `;

  await pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('round', db.sql.Int, round)
    .query(query);

  console.log(`Cleared votes for game ${gameCode}, round ${round}`);
};

// Check if all eligible voters have voted (for revote scenarios)
exports.haveEligibleVotersVoted = async (gameCode, round, eligibleVoterUserIds) => {
  const db = require('../config/db');
  const pool = await db.poolPromise;

  if (!eligibleVoterUserIds || eligibleVoterUserIds.length === 0) {
    return false;
  }

  // Get player IDs for eligible voters
  const eligibleVoterIds = [];
  for (const userId of eligibleVoterUserIds) {
    try {
      const playerId = await exports.getPlayerIdByUserId(gameCode, userId);
      eligibleVoterIds.push(playerId);
    } catch (err) {
      console.error(`Error getting player ID for ${userId}:`, err);
    }
  }

  if (eligibleVoterIds.length === 0) {
    return false;
  }

  // Count how many eligible voters have actually voted
  const placeholders = eligibleVoterIds.map((_, index) => `@voterId${index}`).join(',');
  const votesCountQuery = `
    SELECT COUNT(DISTINCT voterId) AS votesCount
    FROM Votes
    WHERE gameCode = @gameCode AND round = @round AND voterId IN (${placeholders})
  `;

  const request = pool.request()
    .input('gameCode', db.sql.VarChar, gameCode)
    .input('round', db.sql.Int, round);

  // Add each voter ID as a parameter
  eligibleVoterIds.forEach((id, index) => {
    request.input(`voterId${index}`, db.sql.Int, id);
  });

  const result = await request.query(votesCountQuery);

  const votesCount = result.recordset[0].votesCount;
  const expectedVotes = eligibleVoterUserIds.length;

  console.log(`Eligible voters check: ${votesCount}/${expectedVotes} eligible voters have voted`);
  return votesCount >= expectedVotes;
};





