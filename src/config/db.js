const mssql = require('mssql');
require('dotenv').config();

const config = {
  connectionString: process.env.INCOGNITO_CONNECTION_STRING,
  options: {
    encrypt: true,  // for Azure
  },
};

const poolPromise = mssql.connect(config.connectionString)
  .then(pool => {
    console.log('✅ Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    throw err;  // Important: re-throw error to avoid resolving to undefined
  });


module.exports = {
  connectionString: process.env.INCOGNITO_CONNECTION_STRING,
  sql: mssql,
  poolPromise,
};
