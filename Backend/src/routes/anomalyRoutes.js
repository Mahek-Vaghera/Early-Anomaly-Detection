const express = require('express');
const router = express.Router();
const anomalyController = require('../controllers/anomalyController');

router.get('/', anomalyController.getAllAnomalies);
router.get('/:userId', anomalyController.getByUser);

module.exports = router;
