const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.post('/create', gameController.createGame);

module.exports = router;
