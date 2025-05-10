jest.mock('../src/config/db'); // Prevents real DB connection
jest.mock('../src/models/gameModels'); // Mock the model

const gameController = require('../src/controllers/gameController');
const gameModel = require('../src/models/gameModels');

describe('CreateGame and Join Game', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { creatorName: 'Andile' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('should return 400 if creatorName is missing', async () => {
    req.body.creatorName = '';
    await gameController.createGame(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Creator name is required' });
  });

  test('should return 200 and gameCode if creation succeeds', async () => {
    gameModel.createGame.mockResolvedValue('ABC123');
    gameModel.joinGame.mockResolvedValue();

    await gameController.createGame(req, res);
    expect(gameModel.createGame).toHaveBeenCalled();
    expect(gameModel.joinGame).toHaveBeenCalledWith('Andile', 'ABC123');
    expect(res.json).toHaveBeenCalledWith({ message: 'Game created successfully', gameCode: 'ABC123' });
  });

  test('should return 500 if model throws error', async () => {
    // Suppress expected console.error just for this test
    const originalError = console.error;
    console.error = jest.fn();

    gameModel.createGame.mockRejectedValue(new Error('DB error'));

    await gameController.createGame(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error creating game' });
  });
});

describe('List of players in Lobby', () => {
    let req, res;
  
    beforeEach(() => {
      req = { params: { gameCode: 'XYZ789' } };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });
  
    test('should return a list of players for a valid gameCode', async () => {
      const mockPlayers = [{ userId: 'Andile' }, { userId: 'Tumisho' }];
      gameModel.getPlayersByGameCode.mockResolvedValue(mockPlayers);
  
      await gameController.getPlayers(req, res);
  
      expect(gameModel.getPlayersByGameCode).toHaveBeenCalledWith('XYZ789');
      expect(res.json).toHaveBeenCalledWith(mockPlayers);
    });
  
    test('should return 500 if fetching players fails', async () => {
      gameModel.getPlayersByGameCode.mockRejectedValue(new Error('DB error'));
  
      await gameController.getPlayers(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch players' });
    });
  });
  

afterAll(() => {
    jest.resetAllMocks();
});