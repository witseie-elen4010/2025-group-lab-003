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

// Login and Sign Up routes
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

// Loser route
app.get('/loser.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'loser.html'));
});

// Winner route
app.get('/winner.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'winner.html'));
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

//login routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/user', userRoutes);

// Set up a Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinGame', (gameCode, playerName) => {
    console.log(`${playerName} joined game: ${gameCode}`);
    socket.join(gameCode);
    io.to(gameCode).emit('playerJoined', playerName);
  });

  // --- Chat handler ---
  socket.on('joinRoom', (gameCode) => {
    socket.join(gameCode);
  });

  socket.on('chatMessage', async ({ gameCode, playerName, message }) => {
      // Check mode before allowing chat
    let mode = 'online';
    try {
      mode = await gameModel.getGameMode(gameCode);
    } catch (err) {
      console.error('Failed to check game mode:', err);
    }
    if (mode === 'inperson') return; // Ignore chat in in-person mode
    
    // Get current round from DB(NEED TO IMPLEMENT)
    // For now, we'll just assume round 1
    let round = 1;
    try {
      round = await gameModel.getCurrentRound(gameCode);
      await gameModel.saveChatMessage(gameCode, round, playerName, message);
    } catch (err) {
      console.error('Failed to save chat message:', err);
    }
    io.to(gameCode).emit('chatMessage', { playerName, message });
  });

  // --- End chat handler ---
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

