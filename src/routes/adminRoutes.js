const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// GET /api/admin/logs
router.get('/logs', adminController.getActionLogs);

module.exports = router;
