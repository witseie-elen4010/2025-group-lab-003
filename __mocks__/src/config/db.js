module.exports = {
    sql: {
      VarChar: 'VarChar',
      Int: 'Int'
    },
    poolPromise: {
      request: jest.fn().mockReturnThis(),
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] })
    }
  };

  console.log('✅ Mock DB loaded');

  