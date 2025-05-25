const gameModel = require('../models/gameModels');
const logAction = require('../models/adminModel');

exports.createGame = async (req, res) => {
  const { creatorName } = req.body;

  if (!creatorName) {
    return res.status(400).json({ error: 'Creator name is required' });
  }

  try {
    const gameCode = await gameModel.createGame(creatorName);
    await gameModel.joinGame(creatorName, gameCode);

    // Log this action
    await logAction(creatorName, 'CREATE_GAME', `Game code: ${gameCode}`, gameCode);

    console.log('Game created and creator joined successfully', gameCode);
    res.json({ message: 'Game created successfully', gameCode });
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ error: 'Error creating game' });
  }
};

exports.joinGame = async (req, res) => {
  const { name, gameCode } = req.body;

  if (!name || !gameCode) {
    return res.status(400).json({ error: 'Name and game code are required' });
  }

  try {
    // Check if player already in game
    const existingPlayer = await gameModel.getPlayerByNameAndGameCode(name, gameCode);
    if (existingPlayer) {
      return res.status(400).json({ error: 'Player has already joined this game. Try a different name.' });
    }

    await gameModel.joinGame(name, gameCode);
    console.log(`${name} joined game ${gameCode}`);

    // Log this action
    await logAction(name, 'JOIN_GAME', `Game code: ${gameCode}`, gameCode);

    res.json({ message: 'Joined game successfully' });
  } catch (err) {
    console.error('Join game error:', err);
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
    res.status(500).json({ error: 'Failed to fetch players' });
  }
};

exports.startGame = async (req, res) => {
  const { gameCode, gameMode, playerName } = req.body;

  if (!gameCode) {
    return res.status(400).json({ error: 'Game code is required' });
  }

  try {

    await gameModel.assignRoles(gameCode);
    const round = await gameModel.getCurrentRound(gameCode);
    await gameModel.assignWordsForRound(gameCode, round);

    // Save the selected gameMode to the DB here:
    if (gameMode) {
      await gameModel.updateGameMode(gameCode, gameMode);
      console.log(`Game mode for game ${gameCode} set to ${gameMode}`);
    }

    // Mark the game as started in the database
    await gameModel.startGame(gameCode);
    console.log(`Game ${gameCode} marked as started in database`);

    // Log this action
    await logAction(playerName, 'START_GAME', `Started game ${gameCode} with mode ${gameMode}`, gameCode);

    // Get the io instance to trigger description phase
    const io = req.app.get('io');

    // Automatically start description phase 10 seconds after game starts
    console.log(`Scheduling description phase for game ${gameCode} to start in 10 seconds`);
    setTimeout(() => {
      console.log(`Starting automatic description phase for game ${gameCode}`);
      startDescribingPhase(gameCode, io);
    }, 5000); // 10 seconds delay

    res.json({ message: 'Game started', gameMode: gameMode || 'online' });
  } catch (err) {
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
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
};

exports.submitVote = async (req, res) => {
  const { gameCode, voterName, votedFor } = req.body;

  if (!gameCode || !voterName || !votedFor) {
    return res.status(400).json({ error: 'Missing voting data' });
  }

  try {
    // Check if we're in a revote and if this player is eligible to vote
    const revoteState = activeRevotes.get(gameCode);
    if (revoteState) {
      if (!revoteState.eligibleVoters.includes(voterName)) {
        return res.status(403).json({ error: 'You are not eligible to vote in this revote' });
      }
    }

    const voterId = await gameModel.getPlayerIdByUserId(gameCode, voterName);
    const targetId = await gameModel.getPlayerIdByUserId(gameCode, votedFor);
    const round = await gameModel.getCurrentRound(gameCode);

    await gameModel.recordVote(gameCode, round, voterId, targetId);

    // Log this action
    await logAction(voterName, 'VOTE', `Voted for ${votedFor} in game ${gameCode}`, gameCode);

    console.log(`Vote recorded: ${voterName} voted for ${votedFor}`);

    // Check if we're in a revote state
    const currentRevoteState = activeRevotes.get(gameCode);
    let allVotesIn;

    if (currentRevoteState && currentRevoteState.round === round) {
      // We're in a revote - only check eligible voters
      console.log(`Checking revote votes for eligible voters: ${currentRevoteState.eligibleVoters.join(', ')}`);
      allVotesIn = await gameModel.haveEligibleVotersVoted(gameCode, round, currentRevoteState.eligibleVoters);
    } else {
      // Normal voting - check all active players
      allVotesIn = await gameModel.haveAllPlayersVoted(gameCode, round);
    }

    console.log(`All votes in check: ${allVotesIn} for game ${gameCode}, round ${round}`);

    if (allVotesIn) {
      console.log(`All votes are in for round ${round} in game ${gameCode}`);

      // Clear revote state if it exists
      if (currentRevoteState) {
        activeRevotes.delete(gameCode);
        console.log(`Cleared revote state for game ${gameCode}`);
      }

      const io = req.app.get('io');
      io.to(gameCode).emit('allVotesIn',  { message: 'All votes are in!' });

      // Call elimination logic
      try {
        console.log(`Starting elimination process for game ${gameCode}, round ${round}`);
        const eliminatedUserId = await eliminatePlayer(gameCode, round, io);
        console.log(`Elimination result: ${eliminatedUserId ? `Player ${eliminatedUserId} eliminated` : 'Revote required'}`);
      } catch (elimErr) {
        console.error('Error during elimination:', elimErr);
      }
    } else {
      console.log(`Not all votes in yet for game ${gameCode}, round ${round}`);
    }

    res.json({ message: 'Vote recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to record vote' });
  }
};

async function eliminatePlayer(gameCode, round, io) {
  console.log(`eliminatePlayer called for game ${gameCode}, round ${round}`);

  // Get vote counts for the round
  const voteCounts = await gameModel.getVoteCounts(gameCode, round);
  console.log(`Vote counts retrieved:`, voteCounts);

  if (voteCounts.length === 0) {
    throw new Error('No votes found to eliminate');
  }

  // Check for draw (multiple players with same highest vote count)
  const highestVoteCount = voteCounts[0].votesReceived;
  const playersWithHighestVotes = voteCounts.filter(vote => vote.votesReceived === highestVoteCount);

  console.log(`Highest vote count: ${highestVoteCount}, Players with highest votes: ${playersWithHighestVotes.length}`);

  // If there's a draw, trigger revote
  if (playersWithHighestVotes.length > 1) {
    console.log(`Draw detected! ${playersWithHighestVotes.length} players tied with ${highestVoteCount} votes each`);

    // Get all active players
    const allActivePlayers = await gameModel.getActivePlayers(gameCode);
    const allActivePlayerIds = allActivePlayers.map(p => p.userId);

    // Get the tied players' userIds
    const tiedPlayerIds = playersWithHighestVotes.map(vote => vote.targetId);
    const tiedPlayers = [];
    for (const playerId of tiedPlayerIds) {
      const player = await gameModel.getPlayerById(playerId);
      tiedPlayers.push(player.userId);
    }

    // Determine who can vote in revote
    let eligibleVoters;
    let revoteMessage;

    if (tiedPlayers.length === allActivePlayers.length) {
      // Special case for when all players are tied (like 3-player game)
      if (tiedPlayers.length <= 3) {
        // For small groups, each player votes between the other players (no self-voting)
        eligibleVoters = allActivePlayerIds;
        revoteMessage = `All players tied! Each player votes between: ${tiedPlayers.join(', ')} (no self-voting)`;
        console.log(`All players tied in small group - special revote rules`);
      } else {
        // Large group - normal revote rules
        eligibleVoters = allActivePlayerIds;
        revoteMessage = `Everyone is tied! All players revote between: ${tiedPlayers.join(', ')}`;
        console.log(`All players tied - everyone can revote`);
      }
    } else {
      // Only non-tied players can vote
      eligibleVoters = allActivePlayerIds.filter(playerId => !tiedPlayers.includes(playerId));
      revoteMessage = `It's a draw! Only non-tied players (${eligibleVoters.join(', ')}) vote between: ${tiedPlayers.join(', ')}`;
      console.log(`All active players: ${allActivePlayerIds.join(', ')}`);
      console.log(`Tied players: ${tiedPlayers.join(', ')}`);
      console.log(`Eligible voters: ${eligibleVoters.join(', ')}`);
    }

    // Store revote state
    activeRevotes.set(gameCode, {
      round: round,
      eligibleVoters: eligibleVoters,
      tiedPlayers: tiedPlayers
    });

    // Clear all votes for this round to allow revoting
    await gameModel.clearVotesForRound(gameCode, round);
    console.log(`Votes cleared for revote in game ${gameCode}, round ${round}`);

    // Emit revote event to all clients
    io.to(gameCode).emit('revoteRequired', {
      message: revoteMessage,
      tiedPlayers: tiedPlayers,
      eligibleVoters: eligibleVoters,
      round: round
    });

    console.log(`Revote event emitted for game ${gameCode}`);
    return null; // No elimination this time, waiting for revote
  }

  // No draw - proceed with normal elimination
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

  if (eliminatedPlayerRole.role === 'undercover') {
    // Undercover eliminated → Game ends, civilians win
    await gameModel.endGame(gameCode, 'civilian');
    io.to(gameCode).emit('gameEnded', { winner: 'civilian' });
  } else {
    // Civilian eliminated → Check if undercover wins or continue game
    const remainingPlayers = await gameModel.getActivePlayers(gameCode);
    const remainingCivilians = remainingPlayers.filter(p => p.role === 'civilian').length;
    const remainingUndercover = remainingPlayers.filter(p => p.role === 'undercover').length;

    // Undercover wins if they equal or outnumber civilians (typically when 2 players left: 1 undercover, 1 civilian)
    if (remainingUndercover >= remainingCivilians || remainingPlayers.length <= 2) {
      await gameModel.endGame(gameCode, 'undercover');
      io.to(gameCode).emit('gameEnded', { winner: 'undercover' });
    } else {
      // Continue to next round
      await gameModel.incrementRound(gameCode);
      const round = await gameModel.getCurrentRound(gameCode);
      await gameModel.assignWordsForRound(gameCode, round);

      const currentRound = await gameModel.getCurrentRound(gameCode);

      // Start description phase for the new round
      console.log(`Starting description phase for round ${currentRound} in game ${gameCode}`);
      setTimeout(() => {
        startDescribingPhase(gameCode, io);
      }, 10000); // Give players 10 seconds to see elimination result

      // Notify players to reload the game page with new round info
      io.to(gameCode).emit('newRoundStarted', {
        round: currentRound,
        eliminatedPlayer: eliminatedPlayer.userId });
    }
  }

  return eliminatedPlayer.userId;
}

//FOR THE RESULTS PAGE
exports.getGameResults = async (req, res) => {
  const gameCode = req.params.gameCode;

  try {
    const gameState = await gameModel.getGameState(gameCode);
    if (!gameState) return res.status(404).json({ error: 'Game not found' });

    const players = await gameModel.getPlayersWithRoles(gameCode);

    res.json({
      winnerSide: gameState.winner,
      roundsPlayed: gameState.round,
      players: players
    });
  } catch (err) {
    console.error('Error fetching game results:', err);
    res.status(500).json({ error: 'Failed to fetch game results' });
  }
};

// CHECK IF THERE IS AN ADMIN
exports.isAdmin = async (req, res) => {
  const { gameCode, playerName } = req.params;
  try {
    const adminId = await gameModel.getAdminUserId(gameCode);
    res.json({ admin: adminId === playerName });
  } catch (err) {
    console.error('Error checking admin:', err);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};
//GAME MODE FOR ALL USERS
exports.getGameMode = async (req, res) => {
  try {
    const mode = await gameModel.getGameMode(req.params.gameCode);
    res.json({ mode });
  } catch (err) {
    console.error('Failed to fetch game mode', err);
    res.status(500).json({ error: 'Failed to fetch game mode' });
  }
};

exports.getGameStatus = async (req, res) => {
  const { gameCode } = req.params;
  try {
    const gameState = await gameModel.getGameState(gameCode);
    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      gameStarted: gameState.gameStarted === 1,
      gameMode: gameState.mode || 'online',
      round: gameState.round,
      winner: gameState.winner
    });
  } catch (err) {
    console.error('Error fetching game status:', err);
    res.status(500).json({ error: 'Failed to fetch game status' });
  }
};

// Store active description phases
const activeDescriptionPhases = new Map();

// Store active revote states
const activeRevotes = new Map();

async function startDescribingPhase(gameCode, io) {
  const players = await gameModel.getActivePlayers(gameCode);
  if (!players || players.length === 0) return;

  // Initialize description phase data
  const phaseData = {
    gameCode,
    players: players.map(p => p.userId),
    currentSpeakerIndex: 0,
    speakerDuration: 60, // 60 seconds per player
    timer: null
  };

  // Store the phase data
  activeDescriptionPhases.set(gameCode, phaseData);

  // Start the first player's turn
  startPlayerTurn(gameCode, io);
}

function startPlayerTurn(gameCode, io) {
  const phaseData = activeDescriptionPhases.get(gameCode);
  if (!phaseData) return;

  // Clear existing timer if running to prevent conflicts
  if (phaseData.timer) {
    clearInterval(phaseData.timer);
    phaseData.timer = null;
  }

  const currentSpeaker = phaseData.players[phaseData.currentSpeakerIndex];
  const speakerIndex = phaseData.currentSpeakerIndex;
  const totalSpeakers = phaseData.players.length;

  console.log(`Starting turn for ${currentSpeaker} (${speakerIndex + 1}/${totalSpeakers})`);

  io.to(gameCode).emit('startDescriptionPhase', {
    currentSpeaker,
    speakerIndex,
    totalSpeakers,
    duration: phaseData.speakerDuration
  });

  let timeLeft = phaseData.speakerDuration;

  phaseData.timer = setInterval(() => {
    // Send timer update first
    io.to(gameCode).emit('timerUpdate', {
      timeLeft,
      maxTime: phaseData.speakerDuration,
      currentSpeaker,
      speakerIndex,
      totalSpeakers,
      phase: 'description'
    });

    // Decrement time after sending update
    timeLeft--;

    // Check if time is up
    if (timeLeft < 0) {
      clearInterval(phaseData.timer);
      phaseData.timer = null;
      moveToNextPlayer(gameCode, io);
    }
  }, 1000);
}

function moveToNextPlayer(gameCode, io) {
  const phaseData = activeDescriptionPhases.get(gameCode);
  if (!phaseData) return;

  phaseData.currentSpeakerIndex++;

  // Check if all players have had their turn
  if (phaseData.currentSpeakerIndex >= phaseData.players.length) {
    // All players finished - start discussion phase
    console.log(`All players finished describing in game ${gameCode}. Starting discussion phase.`);

    // Clean up the phase data
    activeDescriptionPhases.delete(gameCode);

    // Start discussion phase
    startDiscussionPhase(gameCode, io);
  } else {
    // Move to next player immediately without nested timeouts
    const nextSpeaker = phaseData.players[phaseData.currentSpeakerIndex];
    console.log(`Moving to next speaker: ${nextSpeaker}`);

    // Emit next speaker event and start their turn immediately
    io.to(gameCode).emit('nextSpeaker', {
      currentSpeaker: nextSpeaker,
      speakerIndex: phaseData.currentSpeakerIndex,
      totalSpeakers: phaseData.players.length,
    });

    // Start the next player's turn immediately
    startPlayerTurn(gameCode, io);
  }
}

function startDiscussionPhase(gameCode, io) {
  console.log(`Starting discussion phase for game ${gameCode}`);

  // Notify all clients that discussion phase has started
  io.to(gameCode).emit('phaseChange', {
    newPhase: 'discussion',
    duration: 300 // 5 minutes for discussion
  });

  // After 5 minutes, automatically start voting phase
  setTimeout(() => {
    io.to(gameCode).emit('phaseChange', {
      newPhase: 'voting'
    });
  }, 300000); // 5 minutes
}

// Test endpoint to manually trigger description phase
exports.testDescriptionPhase = async (req, res) => {
  const { gameCode, playerName } = req.body;

  if (!gameCode || !playerName) {
    return res.status(400).json({ error: 'Game code and player name are required' });
  }

  try {
    // Check if player is the game creator (admin)
    const gameState = await gameModel.getGameState(gameCode);
    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const adminUserId = await gameModel.getAdminUserId(gameCode);
    if (adminUserId !== playerName) {
      return res.status(403).json({ error: 'Only the game creator can start test phases' });
    }

    const io = req.app.get('io');
    console.log(`Starting test description phase for game ${gameCode} by ${playerName}`);

    // Start the description phase
    startDescribingPhase(gameCode, io);

    res.json({ message: 'Test description phase started' });
  } catch (err) {
    console.error('Test description phase error:', err);
    res.status(500).json({ error: 'Failed to start test description phase' });
  }
};

// Export the description phase functions and data for testing and server access
module.exports.startDescribingPhase = startDescribingPhase;
module.exports.startDiscussionPhase = startDiscussionPhase;
module.exports.activeDescriptionPhases = activeDescriptionPhases;
