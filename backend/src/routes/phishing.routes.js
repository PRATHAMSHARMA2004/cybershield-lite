// phishing.routes.js
const express = require('express');
const router = express.Router();
const { analyzePhishing, getPhishingHistory } = require('../controllers/phishing.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/analyze', analyzePhishing);
router.get('/history', getPhishingHistory);

module.exports = router;
