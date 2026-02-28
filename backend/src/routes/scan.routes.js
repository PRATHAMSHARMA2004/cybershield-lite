const express    = require('express');
const router     = express.Router();
const { scanWebsite, getScanResult, getScanHistory, scanRateLimiter } = require('../controllers/scan.controller');
const { protect }          = require('../middleware/auth.middleware');
const { enforceScanLimit } = require('../middleware/usageLimit.middleware');

router.use(protect);

// enforceScanLimit runs after auth, before the controller
// Order: protect → scanRateLimiter (hourly) → enforceScanLimit (monthly) → scanWebsite
router.post('/website', scanRateLimiter, enforceScanLimit, scanWebsite);
router.get('/history',  getScanHistory);
router.get('/:scanId',  getScanResult);

module.exports = router;
