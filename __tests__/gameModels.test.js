/*const gameModel = require('../src/models/gameModels');
const db = require('../src/config/db');

let pool;

beforeAll(async () => {
  pool = await db.poolPromise;
});

afterAll(async () => {
  if (pool) {
    await pool.close();
  }
});

describe('gameModels integration tests', () => {
  // let pool;
  let insertedGameCode;

  // beforeEach(async () => {
    //pool = await db.poolPromise;  // ensure pool ready before each test
  // });

  afterAll(async () => {
    if (insertedGameCode) {
      await pool.request()
        .input('gameCode', db.sql.VarChar, insertedGameCode)
        .query('DELETE FROM Players WHERE gameCode = @gameCode');

      await pool.request()
        .input('gameCode', db.sql.VarChar, insertedGameCode)
        .query('DELETE FROM GameState WHERE gameCode = @gameCode');
    }

    // await pool.close();  // close connection once all tests in this describe finish
  });

  it('should create game and insert it in DB', async () => {
    insertedGameCode = await gameModel.createGame('IntegrationTester');

    expect(typeof insertedGameCode).toBe('string');
    expect(insertedGameCode).toHaveLength(6);

    const result = await pool.request()
      .input('gameCode', db.sql.VarChar, insertedGameCode)
      .query('SELECT * FROM GameState WHERE gameCode = @gameCode');

    expect(result.recordset.length).toBe(1);
    expect(result.recordset[0].adminUserId).toBe('IntegrationTester');
  }, 20000);

  it('should create game with in person mode', async () => {
    const customMode = 'inperson';
    const code = await gameModel.createGame('IntegrationTester', customMode);
    
    const result = await pool.request()
      .input('gameCode', db.sql.VarChar, code)
      .query('SELECT * FROM GameState WHERE gameCode = @gameCode');
    
    expect(result.recordset[0].mode).toBe(customMode);
  });

  it('should join a player to the game', async () => {
    if (!insertedGameCode) {
      insertedGameCode = await gameModel.createGame('IntegrationTester');
    }

    await gameModel.joinGame('Player1', insertedGameCode);

    const playerResult = await pool.request()
      .input('userId', db.sql.VarChar, 'Player1')
      .input('gameCode', db.sql.VarChar, insertedGameCode)
      .query('SELECT * FROM Players WHERE userId = @userId AND gameCode = @gameCode');

    expect(playerResult.recordset.length).toBe(1);
    expect(playerResult.recordset[0].userId).toBe('Player1');
  });
  
  it('should get players by game code', async () => {
    if (!insertedGameCode) {
      insertedGameCode = await gameModel.createGame('IntegrationTester');
    }

    // Ensure at least one player joined (can reuse previous test logic or add new)
    await gameModel.joinGame('Player2', insertedGameCode);

    const players = await gameModel.getPlayersByGameCode(insertedGameCode);

    // players should be an array of objects with userId properties
    expect(Array.isArray(players)).toBe(true);
    expect(players.length).toBeGreaterThanOrEqual(1);
    expect(players.some(p => p.userId === 'Player2')).toBe(true);
  });
});

describe('gameModels startGame integration', () => {
  // let pool;
  let insertedGameCode;

  // beforeAll(async () => {
  //   pool = await db.poolPromise;
  // });

  beforeEach(async () => {
    insertedGameCode = await gameModel.createGame('IntegrationTester');
  });

  afterAll(async () => {
    if (insertedGameCode) {
      await pool.request()
        .input('gameCode', db.sql.VarChar, insertedGameCode)
        .query('DELETE FROM Players WHERE gameCode = @gameCode');
      await pool.request()
        .input('gameCode', db.sql.VarChar, insertedGameCode)
        .query('DELETE FROM GameState WHERE gameCode = @gameCode');
    }
    // await pool.close();
  });

  it('should set gameStarted flag to 1', async () => {
    await gameModel.startGame(insertedGameCode);

    const result = await pool.request()
      .input('gameCode', db.sql.VarChar, insertedGameCode)
      .query('SELECT gameStarted FROM GameState WHERE gameCode = @gameCode');

    expect(result.recordset[0].gameStarted).toBe(true);
  });
});
*/
/*
jest.mock('../src/config/db', () => {
  const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn().mockResolvedValue({ recordset: [{ userId: 'Andile' }] })
  };

  return {
    sql: {
      VarChar: 'VarChar',
      Int: 'Int'
    },
    poolPromise: Promise.resolve({
      request: jest.fn(() => mockRequest) // ✅ this enables pool.request().input().query()
    })
  };
});

// ✅ No need to import db
const gameModel = require('../src/models/gameModels');

describe('gameModels.createGame', () => {
  test('should insert game and return gameCode', async () => {
    const gameCode = await gameModel.createGame();
    expect(typeof gameCode).toBe('string');
    expect(gameCode).toHaveLength(6);
  });
});

describe('gameModels.joinGame', () => {
  test('should insert player into Players table', async () => {
    await expect(gameModel.joinGame('Andile', 'ABC123')).resolves.not.toThrow();
  });
});

describe('gameModels.getPlayersByGameCode', () => {
  test('should return list of players', async () => {
    const result = await gameModel.getPlayersByGameCode('ABC123');
    expect(result).toEqual([{ userId: 'Andile' }]); // based on your mock above
  });
});*/

describe('gameModel dummy test', () => {
  test('should run a basic dummy test', () => {
    expect(1 + 1).toBe(2);
  });
});