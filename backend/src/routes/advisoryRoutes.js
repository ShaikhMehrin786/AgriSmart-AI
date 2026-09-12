const express = require('express');
const { getWeather, getIrrigation, getSustainability } = require('../controllers/advisoryController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/weather', protect, getWeather);
router.post('/irrigation', protect, getIrrigation);
router.get('/sustainability-score', protect, getSustainability);

module.exports = router;
