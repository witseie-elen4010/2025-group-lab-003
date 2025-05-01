'use strict'
const express = require('express');
const path = require('path');
const gameRoutes = require('./gameRoutes');  // Import game routes

const app = express();

app.use(express.json()); // parse incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // parse URL-encoded form data (i.e., data sent from HTML forms)

// Serve static files (like frontend.js) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/game', gameRoutes); // Use the game routes for API calls

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));  
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
