const express = require('express');
const router = express.Router();
const savingsJarController = require('../controllers/savingsJar.controller');

// Base path: /api/jars (mounted with verifyToken in server.js)

// 1. Get all jars with dynamic warning calculations
router.get('/', savingsJarController.getAllJars);

// 2. Create a new jar
router.post('/', savingsJarController.createJar);

// 3. Update an existing jar (name, target, date, etc)
router.patch('/:id', savingsJarController.updateJar);

// 4. Delete a jar (only if current_amount == 0)
router.delete('/:id', savingsJarController.deleteJar);

// 5. Deposit money into jar
router.post('/:id/deposit', savingsJarController.deposit);

// 6. Withdraw money from jar
router.post('/:id/withdraw', savingsJarController.withdraw);

// 7. Get transaction history for a jar
router.get('/:id/history', savingsJarController.getJarHistory);

module.exports = router;
