const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.post('/create', gameController.createGame);
router.get('/players/:gameCode', gameController.getPlayers); 

module.exports = router;

