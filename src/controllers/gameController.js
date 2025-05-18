const gameModel = require('../models/gameModels');

exports.createGame = async (req, res) => {
  const { creatorName } = req.body;

  if (!creatorName) {
    return res.status(400).json({ error: 'Creator name is required' });
  }

  try {
    const gameCode = await gameModel.createGame();
    await gameModel.joinGame(creatorName, gameCode);

    console.log('Game created and creator joined successfully', gameCode);
    res.json({ message: 'Game created successfully', gameCode });
  } catch (err) {
    console.error('Error creating game', err);
    res.status(500).json({ error: 'Error creating game' });
  }
};

exports.joinGame = async (req, res) => {
  const { name, gameCode } = req.body;

  if (!name || !gameCode) {
    return res.status(400).json({ error: 'Name and game code are required' });
  }

  try {
    await gameModel.joinGame(name, gameCode);
    console.log(`${name} joined game ${gameCode}`);
    res.json({ message: 'Joined game successfully' });
  } catch (err) {
    console.error('Error joining game:', err);
    res.status(500).json({ error: 'Failed to join game' });
  }
};


exports.getPlayers = async (req, res) => {
  const gameCode = req.params.gameCode;
  console.log('Fetching players for game code:', gameCode);
  try {
    const players = await gameModel.getPlayersByGameCode(gameCode);
    console.log('Players fetched successfully', players);
    res.json(players);
  } catch (err) {
    console.error('Error fetching players', err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
};

exports.startGame = async (req, res) => {
  const { gameCode, gameMode } = req.body;

  if (!gameCode) {
    return res.status(400).json({ error: 'Game code is required' });
  }

  try {
    await gameModel.assignRolesAndWords(gameCode); // Build on Developer A's start
    console.log(`Game ${gameCode} started with roles assigned.`);
    res.json({ message: 'Game started', gameMode: gameMode || 'online' });
  } catch (err) {
    console.error('Error starting game', err);
    res.status(500).json({ error: 'Failed to start game' });
  }
};

exports.getPlayerWord = async (req, res) => {
  const { gameCode, playerName } = req.params;

  try {
    const player = await gameModel.getPlayerByNameAndGameCode(playerName, gameCode);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ word: player.word, role: player.role });
  } catch (err) {
    console.error('Error fetching player word/role:', err);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
};

exports.submitVote = async (req, res) => {
  const { gameCode, voterName, votedFor } = req.body;

  if (!gameCode || !voterName || !votedFor) {
    return res.status(400).json({ error: 'Missing voting data' });
  }

  try {
    const voterId = await gameModel.getPlayerIdByUserId(gameCode, voterName);
    const targetId = await gameModel.getPlayerIdByUserId(gameCode, votedFor);
    const round = await gameModel.getCurrentRound(gameCode);

    await gameModel.recordVote(gameCode, round, voterId, targetId);

    const allVotesIn = await gameModel.haveAllPlayersVoted(gameCode, round);

    if (allVotesIn) {
      const io = req.app.get('io');
      io.to(gameCode).emit('allVotesIn',  { message: 'All votes are in!' });
      // TODO: Something to handle when all votes are in
      // Call elimination logic right here
      try {
        const eliminatedUserId = await eliminatePlayer(gameCode, round, io);
        console.log(`Player eliminated: ${eliminatedUserId}`);
      } catch (elimErr) {
        console.error('Error during elimination:', elimErr);
      }
      console.log('All votes are in for round', round);
    }

    res.json({ message: 'Vote recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to record vote' });
  }
};

async function eliminatePlayer(gameCode, round, io) {
  // Get vote counts for the round
  const voteCounts = await gameModel.getVoteCounts(gameCode, round);
  if (voteCounts.length === 0) {
    throw new Error('No votes found to eliminate');
  }

  // Player with highest votes is first
  const eliminatedPlayerId = voteCounts[0].targetId;

  // Mark player eliminated
  await gameModel.eliminatePlayerById(eliminatedPlayerId);

  const eliminatedPlayerRole = await gameModel.getPlayerRoleById(eliminatedPlayerId);

  // Get eliminated player's userId
  const eliminatedPlayer = await gameModel.getPlayerById(eliminatedPlayerId);

  // Fetch updated players list to send in update
  const updatedPlayers = await gameModel.getPlayersByGameCode(gameCode);
  
  // Emit elimination event to all clients in the room
  io.to(gameCode).emit('playerEliminated', {
    eliminatedPlayer: eliminatedPlayer.userId,
    players: updatedPlayers
  });

  console.log(`Player ${eliminatedPlayer.userId} eliminated. Role: ${eliminatedPlayerRole.role}`);
  if (eliminatedPlayerRole.role === 'undercover') {
    // Impostor eliminated → Game ends, civilians win
    await gameModel.endGame(gameCode, 'civilian');
    io.to(gameCode).emit('gameEnded', { winner: 'civilian' });
  } else {
    // Civilian eliminated → Start next round
    await gameModel.incrementRound(gameCode);
    await gameModel.assignNewWords(gameCode);

    const currentRound = await gameModel.getCurrentRound(gameCode);

    // Notify players to reload the game page with new round info
    io.to(gameCode).emit('newRoundStarted', { round: currentRound });
  }

  return eliminatedPlayer.userId;
}



