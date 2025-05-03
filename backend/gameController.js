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
  // TODO: Implement join game logic
}


//module.exports = router
