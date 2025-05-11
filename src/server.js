'use strict';
const express = require('express');
const path = require('path');

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

// API routes
const gameRoutes = require('./routes/gameRoutes');
app.use('/api/game', gameRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port', port));
