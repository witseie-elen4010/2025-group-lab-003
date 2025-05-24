// __tests__/gameController.test.js

// Import the modules and functions to test
const gameModel = require('../src/models/gameModels');
const logAction = require('../src/models/adminModel');
const gameController = require('../src/controllers/gameController');

// Use manual mocks for gameModel and logAction
jest.mock('../src/models/gameModels');
jest.mock('../src/models/adminModel');

describe('createGame (success scenario)', () => {
  // Set up fresh request/response objects before each test
  let req, res;
  beforeEach(() => {
    req = { body: { creatorName: 'Alice' } };  // valid creatorName for success scenario
    // Mock response object with jest functions for status and json
    res = {
      status: jest.fn().mockReturnThis(),  // allows chaining like res.status(200).json(...)
      json: jest.fn()
    };

    // Optionally, set default return values for our mock functions
    gameModel.createGame.mockResolvedValue('GAME123');   // simulate DB generating game code "GAME123"
    gameModel.joinGame.mockResolvedValue({ playerName: 'Alice', gameCode: 'GAME123' });
    logAction.mockResolvedValue(true);  // simulate successful log (no meaningful return)
  });

  // Ensure no mock calls or state leak between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with the gameCode, and call createGame, joinGame, and logAction once with correct arguments', async () => {
    // Call the controller function (assuming it returns a Promise)
    await gameController.createGame(req, res);

    // 1. Check that gameModel.createGame was called once with the creator's name
    expect(gameModel.createGame).toHaveBeenCalledTimes(1);
    expect(gameModel.createGame).toHaveBeenCalledWith('Alice');

    // 2. Check that gameModel.joinGame was called once with the new game code and creator's name
    expect(gameModel.joinGame).toHaveBeenCalledTimes(1);
    expect(gameModel.joinGame).toHaveBeenCalledWith('Alice', 'GAME123');

    expect(logAction).toHaveBeenCalledTimes(1);
    expect(logAction).toHaveBeenCalledWith(
      'Alice',
      'CREATE_GAME',
      'Game code: GAME123',
      'GAME123'
    );

    // 4. Check that the response was sent with HTTP 200 and the correct JSON body
    
    // expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Game created successfully',
      gameCode: 'GAME123'
    });
    //expect(res.json).toHaveBeenCalledWith({ message: 'Game created successfully GAME123' });
  });

  it('should respond with 400 if creatorName is missing', async () => {
    req.body.creatorName = undefined; // simulate missing creatorName

    await gameController.createGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Creator name is required' });

    expect(gameModel.createGame).not.toHaveBeenCalled();
    expect(gameModel.joinGame).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it('should respond with 500 if an error occurs during game creation', async () => {
    gameModel.createGame.mockRejectedValue(new Error('DB error'));

    await gameController.createGame(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error creating game' });
    expect(gameModel.joinGame).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

});

describe('joinGame controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { name: 'Bob', gameCode: 'GAME123' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    gameModel.joinGame.mockResolvedValue(undefined);  // joinGame returns nothing meaningful
    logAction.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call joinGame and logAction then respond with success message', async () => {
    await gameController.joinGame(req, res);

    expect(gameModel.joinGame).toHaveBeenCalledWith('Bob', 'GAME123');
    expect(logAction).toHaveBeenCalledWith('Bob', 'JOIN_GAME', 'Game code: GAME123', 'GAME123');
    expect(res.json).toHaveBeenCalledWith({ message: 'Joined game successfully' });
  });

  it('should return 400 if name is missing', async () => {
    req.body.name = undefined;

    await gameController.joinGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Name and game code are required' });
    expect(gameModel.joinGame).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it('should return 400 if gameCode is missing', async () => {
    req.body.gameCode = undefined;

    await gameController.joinGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Name and game code are required' });
    expect(gameModel.joinGame).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it('should return 500 if joinGame throws an error', async () => {
    gameModel.joinGame.mockRejectedValue(new Error('DB failure'));

    await gameController.joinGame(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to join game' });
    expect(logAction).not.toHaveBeenCalled();
  });
});


describe('getPlayers controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { gameCode: 'GAME123' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch players by gameCode and respond with JSON', async () => {
    const mockPlayers = [
      { userId: 'player1' },
      { userId: 'player2' }
    ];
    gameModel.getPlayersByGameCode.mockResolvedValue(mockPlayers);

    await gameController.getPlayers(req, res);

    expect(gameModel.getPlayersByGameCode).toHaveBeenCalledTimes(1);
    expect(gameModel.getPlayersByGameCode).toHaveBeenCalledWith('GAME123');

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(mockPlayers);
  });

  it('should respond with 500 and error message if model throws', async () => {
    gameModel.getPlayersByGameCode.mockRejectedValue(new Error('DB failure'));

    await gameController.getPlayers(req, res);

    expect(gameModel.getPlayersByGameCode).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch players' });
  });
});


describe('startGame controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        gameCode: 'GAME123',
        gameMode: 'classic',
        playerName: 'Alice'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    gameModel.assignRolesAndWords.mockResolvedValue();
    gameModel.updateGameMode.mockResolvedValue();
    logAction.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start game and update mode when gameMode is provided', async () => {
    await gameController.startGame(req, res);

    expect(gameModel.assignRolesAndWords).toHaveBeenCalledWith('GAME123');
    expect(gameModel.updateGameMode).toHaveBeenCalledWith('GAME123', 'classic');
    expect(logAction).toHaveBeenCalledWith(
      'Alice',
      'START_GAME',
      'Started game GAME123 with mode classic',
      'GAME123'
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Game started',
      gameMode: 'classic'
    });
  });

  it('should start game and default gameMode to online if not provided', async () => {
    req.body.gameMode = undefined;

    await gameController.startGame(req, res);

    expect(gameModel.assignRolesAndWords).toHaveBeenCalledWith('GAME123');
    expect(gameModel.updateGameMode).not.toHaveBeenCalled();
    expect(logAction).toHaveBeenCalledWith(
      'Alice',
      'START_GAME',
      'Started game GAME123 with mode undefined',
      'GAME123'
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Game started',
      gameMode: 'online'
    });
  });

  it('should return 400 if gameCode is missing', async () => {
    req.body.gameCode = undefined;

    await gameController.startGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Game code is required' });

    expect(gameModel.assignRolesAndWords).not.toHaveBeenCalled();
    expect(gameModel.updateGameMode).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it('should return 500 if an error occurs in try-catch', async () => {
    gameModel.assignRolesAndWords.mockRejectedValue(new Error('DB failure'));

    await gameController.startGame(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to start game' });
  });
});


describe('getPlayerWord controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {
        gameCode: 'GAME123',
        playerName: 'Alice'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return player word and role if player found', async () => {
    const mockPlayer = { word: 'Apple', role: 'undercover' };
    gameModel.getPlayerByNameAndGameCode.mockResolvedValue(mockPlayer);

    await gameController.getPlayerWord(req, res);

    expect(gameModel.getPlayerByNameAndGameCode).toHaveBeenCalledWith('Alice', 'GAME123');
    expect(res.json).toHaveBeenCalledWith({ word: 'Apple', role: 'undercover' });
  });

  it('should return 404 if player not found', async () => {
    gameModel.getPlayerByNameAndGameCode.mockResolvedValue(null);

    await gameController.getPlayerWord(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Player not found' });
  });

  it('should return 500 if model throws an error', async () => {
    gameModel.getPlayerByNameAndGameCode.mockRejectedValue(new Error('DB error'));

    await gameController.getPlayerWord(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch player data' });
  });
});
