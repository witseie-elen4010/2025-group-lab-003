const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.post('/create', gameController.createGame);
router.post('/join', gameController.joinGame);
router.post('/start', gameController.startGame);
router.get('/players/:gameCode', gameController.getPlayers);
router.get('/player/:gameCode/:playerName', gameController.getPlayerWord);
router.post('/vote', gameController.submitVote);
router.get('/results/:gameCode', gameController.getGameResults);
router.get('/is-admin/:gameCode/:playerName', gameController.isAdmin);
router.get('/mode/:gameCode', gameController.getGameMode);
router.get('/status/:gameCode', gameController.getGameStatus);




module.exports = router;

