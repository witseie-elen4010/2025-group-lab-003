const mssql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.INCOGNITO_CONNECTION_STRING;

const poolPromise = mssql.connect(connectionString)
  .then(pool => {
    console.log('✅ Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    throw err;  // Important: re-throw error to avoid resolving to undefined
  });

module.exports = {
  connectionString,
  sql: mssql,
  poolPromise,
};
