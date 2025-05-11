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

