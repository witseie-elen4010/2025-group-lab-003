'use strict';
const express = require('express');
const path = require('path');

const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Game route
app.get('/game.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'game.html'));
});
  
// Elimination route
app.get('/eliminated.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'eliminated.html'));
});

// API routes
const gameRoutes = require('./routes/gameRoutes');
app.use('/api/game', gameRoutes);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// Store io instance on app so it can be accessed in routes/controllers
app.set('io', io);

// Set up a Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinGame', (gameCode, playerName) => {
    console.log(`${playerName} joined game: ${gameCode}`);
    socket.join(gameCode);
    io.to(gameCode).emit('playerJoined', playerName);
  });

  socket.on('startGame', (gameCode) => {
    console.log(`Game ${gameCode} started`);
    io.to(gameCode).emit('gameStarted');
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log('Server running on port', port));
