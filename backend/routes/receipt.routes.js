const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');

// POST /api/receipts/upload - Upload and scan receipt image
router.post('/upload', receiptController.upload, receiptController.handleUploadReceipt);

// DELETE /api/receipts/:id - Delete receipt image and record
router.delete('/:id', receiptController.deleteReceipt);

module.exports = router;
