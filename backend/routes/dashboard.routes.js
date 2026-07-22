const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// All routes are protected by verifyToken mounted in server.js
// GET /api/dashboard/stats?month=YYYY-MM
router.get('/stats', dashboardController.getDashboardStats);

// GET /api/dashboard/forecast?month=YYYY-MM
router.get('/forecast', dashboardController.getForecast);

// GET /api/dashboard/insight?month=YYYY-MM (singular per Spec 2.3)
router.get('/insight', dashboardController.getInsight);

module.exports = router;
