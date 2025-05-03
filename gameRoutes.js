const express = require('express');
const path = require('path');

// Import gameController from the backend folder
const gameController = require('./backend/gameController');

const router = express.Router();

router.post('/create', gameController.createGame);
router.post('/join', gameController.joinGame);

module.exports = router;
