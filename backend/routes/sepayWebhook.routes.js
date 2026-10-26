const express = require('express');
const sepayWebhookController = require('../controllers/sepayWebhook.controller');

const router = express.Router();

router.post('/', sepayWebhookController.receiveSePayWebhook);

module.exports = router;
