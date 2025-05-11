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
});

/*describe('gameModels.startGame', () => {
  test('should update gameStarted in GameState', async () => {
    await expect(gameModel.startGame('ABC123')).resolves.toBeUndefined();
    // No assert here because DB is mocked — this ensures no throw
  });
});*/