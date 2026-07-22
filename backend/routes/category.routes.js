const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { check, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

function validateInput(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }
  next();
}

const categoryRules = [
  check('name').trim().notEmpty().withMessage('Tên danh mục không được để trống')
    .isLength({ max: 100 }).withMessage('Tên danh mục tối đa 100 ký tự'),
  check('type').isIn(['expense', 'income']).withMessage('Loại danh mục phải là expense hoặc income'),
  validateInput
];

const updateRules = [
  check('name').trim().notEmpty().withMessage('Tên danh mục không được để trống')
    .isLength({ max: 100 }).withMessage('Tên danh mục tối đa 100 ký tự'),
  validateInput
];

// All routes are protected by verifyToken (mounted in server.js)
// GET /api/categories
router.get('/', categoryController.getAllCategories);

// POST /api/categories
router.post('/', categoryRules, categoryController.createCategory);

// PUT /api/categories/:id
router.put('/:id', updateRules, categoryController.updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
