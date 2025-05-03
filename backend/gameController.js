// THIS FILE IS FOR GAME LOGIC
const games = {}; // This will store the games in memory

// Create Game
exports.createGame = (req, res) => {
  const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { creatorName } = req.body;
  games[gameCode] = {
    creatorName,
    players: [{ name: creatorName, role: 'creator' }],
    status: 'waiting', // waiting, in-progress, completed
  };
  res.json({ code: gameCode });
};


// Join Game
exports.joinGame = (req, res) => {
  const { name, gameCode } = req.body;
  if (!games[gameCode]) {
    return res.status(400).json({ error: 'Game does not exist' });
  }
  games[gameCode].players.push({ name, role: 'player' });
  res.json({ message: 'Joined game!' });
}


//module.exports = router
