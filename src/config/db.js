const mssql = require('mssql');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.INCOGNITO_CONNECTION_STRING;

/*
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  }
};*/

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
  // connectionString,
  sql: mssql,
  poolPromise,
};
