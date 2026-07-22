const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
const verifyToken = require('../middleware/verifyToken');
const { budgetValidationRules } = require('../middleware/validateRequest');

router.use(verifyToken);

router.get('/', budgetController.getBudgets);
router.post('/', budgetValidationRules, budgetController.upsertBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
