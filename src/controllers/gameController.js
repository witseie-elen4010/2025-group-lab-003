const gameModel = require('../models/gameModels');

exports.createGame = async (req, res) => {
  try {
    const gameCode = await gameModel.createGame();
    // join the creator as the first player
    console.log('Game created successfully', gameCode);
    res.json({ message: 'Game created successfully', gameCode });
  } catch (err) {
    console.error('Error creating game', err);
    res.status(500).json({ error: 'Error creating game' });
  }
};
