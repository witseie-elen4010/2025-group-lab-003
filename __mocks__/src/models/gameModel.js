// __mocks__/gameModel.js
module.exports = {
  createGame: jest.fn((creatorName) => {
    // Return a fake game code for a new game
    return 'FAKE-GAME-CODE'; // This can be overridden in tests if needed
  }),
  joinGame: jest.fn((gameCode, playerName) => {
    // Simulate a successful join (could return a player object or true)
    return { gameCode, playerName };
  }),
};
