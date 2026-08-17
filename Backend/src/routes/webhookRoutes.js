const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { validateWebhookPayload } = require('../middleware/validator');

router.post('/aa-fetch', validateWebhookPayload, webhookController.receiveWebhook);
router.get('/health', webhookController.health);

module.exports = router;
