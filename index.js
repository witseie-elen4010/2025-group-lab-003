'use strict'
const express = require('express');
const path = require('path');
const gameRoutes = require('./gameRoutes');  // Import game routes

const app = express();

const mainRouter = require('./mainRoutes')

app.use(express.json()); // parse incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // parse URL-encoded form data (i.e., data sent from HTML forms)

// Serve static files (like frontend.js) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(mainRouter)
app.use('/api/game', gameRoutes); // Use the game routes for API calls

const port = process.env.PORT || 3000
app.listen(port)
console.log('Express server running on port', port)

