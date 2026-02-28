const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:scanId', protect, generateReport);

module.exports = router;
