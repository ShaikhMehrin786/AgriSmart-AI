const express = require('express');
const { getWeather, getIrrigation, getSustainability, getRecommendations } = require('../controllers/advisoryController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/weather', protect, getWeather);
router.post('/irrigation', protect, getIrrigation);
router.get('/sustainability-score', protect, getSustainability);
router.post('/recommendations', protect, getRecommendations);
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
