const request = require('supertest');
const express = require('express');

// Mock the DB layer modules that your controllers use
jest.mock('../src/models/gameModels', () => ({
  createGame: jest.fn().mockResolvedValue('ABC123'),
  joinGame: jest.fn().mockResolvedValue(),
  assignRoles: jest.fn().mockResolvedValue(),
  getCurrentRound: jest.fn().mockResolvedValue(1),
  assignWordsForRound: jest.fn().mockResolvedValue(),
  updateGameMode: jest.fn().mockResolvedValue(),
  startGame: jest.fn().mockResolvedValue(),
  getPlayersByGameCode: jest.fn(),
  getPlayerByNameAndGameCode: jest.fn().mockResolvedValue({ userId: 'Player1', word: 'apple', role: 'civilian' }),
  getPlayerIdByUserId: jest.fn().mockResolvedValue('playerid1'),
  recordVote: jest.fn().mockResolvedValue(),
  haveAllPlayersVoted: jest.fn().mockResolvedValue(false),

  getActivePlayers: jest.fn().mockResolvedValue([
    { userId: 'player1', role: 'civilian' },
    { userId: 'player2', role: 'undercover' }
  ]),
  getVoteCounts: jest.fn().mockResolvedValue([{ targetId: 'player1' }]),
  eliminatePlayerById: jest.fn().mockResolvedValue(),
  getPlayerRoleById: jest.fn().mockResolvedValue({ role: 'civilian' }),
  getPlayerById: jest.fn().mockResolvedValue({ userId: 'player1' }),
  endGame: jest.fn().mockResolvedValue(),
  incrementRound: jest.fn().mockResolvedValue(),
}));

// Mock adminModel (logAction)
jest.mock('../src/models/adminModel', () => jest.fn().mockResolvedValue());

const gameRoutes = require('../src/routes/gameRoutes');

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/game', gameRoutes);
});

describe('Game API create game endpoints', () => {
  test('POST /api/game/create', async () => {
    const res = await request(app)
      .post('/api/game/create')
      .send({ creatorName: 'Tester' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('gameCode', 'ABC123');
    expect(res.body).toHaveProperty('message', 'Game created successfully');
  });

  test('POST /api/game/create without creatorName should return 400', async () => {
    const res = await request(app)
        .post('/api/game/create')
        .send({});  // no creatorName sent

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Creator name is required');
  });
});

describe('Game API join game endpoints', () => {
    test('should join player successfully when valid data is sent', async () => {
        const gameModel = require('../src/models/gameModels');

        // Override mock to return null only for this call
        gameModel.getPlayerByNameAndGameCode.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/game/join')
            .send({ name: 'Player1', gameCode: 'ABC123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Joined game successfully');
    });


  test('should return 400 if name or gameCode is missing', async () => {
    // Missing name
    let res = await request(app)
      .post('/api/game/join')
      .send({ gameCode: 'ABC123' });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Name and game code are required');

    // Missing gameCode
    res = await request(app)
      .post('/api/game/join')
      .send({ name: 'Player1' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Name and game code are required');
  });

  test('should return 500 on server error', async () => {
    // Mock gameModel.joinGame to throw error
    const gameModel = require('../src/models/gameModels');
    gameModel.getPlayerByNameAndGameCode.mockResolvedValueOnce(null);

    jest.spyOn(gameModel, 'joinGame').mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app)
      .post('/api/game/join')
      .send({ name: 'Player1', gameCode: 'ABC123' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to join game');
  });
});


describe('Game API start game endpoints', () => {
    beforeAll(() => {
        app.set('io', {
            to: () => ({
            emit: () => {}
            }),
        });

        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

  test('should start game successfully with provided gameMode', async () => {
    const res = await request(app)
      .post('/api/game/start')
      .send({ gameCode: 'ABC123', playerName: 'Tester', gameMode: 'classic' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Game started');
    expect(res.body).toHaveProperty('gameMode', 'classic');
  });

  test('should start game successfully and default gameMode to online if not provided', async () => {
    const res = await request(app)
      .post('/api/game/start')
      .send({ gameCode: 'ABC123', playerName: 'Tester' }); // no gameMode

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Game started');
    expect(res.body).toHaveProperty('gameMode', 'online');
  });

  test('should return 400 if gameCode is missing', async () => {
    const res = await request(app)
      .post('/api/game/start')
      .send({ playerName: 'Tester', gameMode: 'classic' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Game code is required');
  });

  test('should return 500 if an internal error occurs', async () => {
    // Mock assignRoles to throw an error
    const gameModel = require('../src/models/gameModels');
    jest.spyOn(gameModel, 'assignRoles').mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app)
      .post('/api/game/start')
      .send({ gameCode: 'ABC123', playerName: 'Tester', gameMode: 'classic' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to start game');
  });
});

describe('Game API get players endpoints', () => {
    const gameModel = require('../src/models/gameModels');
  test('should return player list for a valid gameCode', async () => {
    const mockPlayers = [
      { userId: 'Player1' },
      { userId: 'Player2' },
    ];
    gameModel.getPlayersByGameCode.mockResolvedValue(mockPlayers);

    const res = await request(app).get('/api/game/players/ABC123');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(mockPlayers);
  });

  test('should return 500 if there is an error', async () => {
    jest.spyOn(gameModel, 'getPlayersByGameCode').mockRejectedValue(new Error('DB failure'));

    const res = await request(app).get('/api/game/players/ABC123');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to fetch players');
  });
});

describe('Game API for get player word endpoints', () => {
  const gameModel = require('../src/models/gameModels');

  test('should return word and role for existing player', async () => {
    // Mock resolved value to simulate found player
    gameModel.getPlayerByNameAndGameCode.mockResolvedValue({
      word: 'apple',
      role: 'civilian'
    });

    const res = await request(app).get('/api/game/player/ABC123/Player1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('word', 'apple');
    expect(res.body).toHaveProperty('role', 'civilian');
  });

  test('should return 404 if player not found', async () => {
    gameModel.getPlayerByNameAndGameCode.mockResolvedValue(null);

    const res = await request(app).get('/api/game/player/ABC123/NonExistentPlayer');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Player not found');
  });

  test('should return 500 if there is a server error', async () => {
    gameModel.getPlayerByNameAndGameCode.mockRejectedValue(new Error('DB failure'));

    const res = await request(app).get('/api/game/player/ABC123/Player1');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to fetch player data');
  });
});

describe('Game API submit vote endpoint', () => {
  const gameModel = require('../src/models/gameModels');

  test('should record vote successfully when valid data is sent and all votes are not yet in', async () => {
    gameModel.getPlayerIdByUserId.mockResolvedValueOnce('voterid');
    gameModel.getPlayerIdByUserId.mockResolvedValueOnce('targetid');
    gameModel.getCurrentRound.mockResolvedValueOnce(1);
    gameModel.recordVote.mockResolvedValueOnce();
    gameModel.haveAllPlayersVoted.mockResolvedValueOnce(false); // votes not complete

    const res = await request(app)
      .post('/api/game/vote')
      .send({
        gameCode: 'ABC123',
        voterName: 'Voter',
        votedFor: 'Target'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Vote recorded');
  });

  test('should return 400 if any voting data is missing', async () => {
    let res = await request(app)
      .post('/api/game/vote')
      .send({ voterName: 'Voter', votedFor: 'Target' }); // missing gameCode

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing voting data');

    res = await request(app)
      .post('/api/game/vote')
      .send({ gameCode: 'ABC123', votedFor: 'Target' }); // missing voterName

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing voting data');

    res = await request(app)
      .post('/api/game/vote')
      .send({ gameCode: 'ABC123', voterName: 'Voter' }); // missing votedFor

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing voting data');
  });

  test('should return 500 if there is an internal error', async () => {
    gameModel.getPlayerIdByUserId.mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app)
      .post('/api/game/vote')
      .send({
        gameCode: 'ABC123',
        voterName: 'Voter',
        votedFor: 'Target'
      });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'DB failure' || 'Failed to record vote');
  });
});

describe('gameModel dummy test', () => {
  test('should run a basic dummy test', () => {
    expect(1 + 1).toBe(2);
  });
});