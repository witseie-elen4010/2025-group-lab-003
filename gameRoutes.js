/*
I HAVE COMMENTED OUT THIS FILE PROVIDED THERE IS NO GAMECONTROLLER FILE DEFINED
const express = require('express');
const path = require('path');

// Import gameController from the backend folder
const gameController = require('./backend/gameController');

const router = express.Router();

router.post('/create', gameController.createGame);
router.post('/join', gameController.joinGame);
router.post('/start', gameController.startGame);
router.post('/vote', gameController.voteOut);

module.exports = router;*/
