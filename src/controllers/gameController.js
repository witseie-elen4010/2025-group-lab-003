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
  const { gameCode } = req.body;

  if (!gameCode) {
    return res.status(400).json({ error: 'Game code is required' });
  }

  try {
    await gameModel.startGame(gameCode);
    console.log(`Game ${gameCode} started`);
    res.json({ message: 'Game started' });
  } catch (err) {
    console.error('Error starting game', err);
    res.status(500).json({ error: 'Failed to start game' });
  }
};


