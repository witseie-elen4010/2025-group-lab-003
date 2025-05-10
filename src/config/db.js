const mssql = require('mssql');
require('dotenv').config();

const config = {
  connectionString: process.env.INCOGNITO_CONNECTION_STRING,
  options: {
    encrypt: true,
  },
};

const poolPromise = mssql.connect(config.connectionString)
  .then(pool => {
    console.log('✅ Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

module.exports = {
  sql: mssql,
  poolPromise,
};
