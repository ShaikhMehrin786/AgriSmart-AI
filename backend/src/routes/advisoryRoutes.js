const express = require('express');
const {
  getWeather,
  getIrrigation,
  getSustainability,
  getRecommendations,
  getDiseases,
  getDiseaseByName,
  getDiseaseAdvisory
} = require('../controllers/advisoryController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/weather', protect, getWeather);
router.post('/irrigation', protect, getIrrigation);
router.get('/sustainability-score', protect, getSustainability);
router.post('/sustainability-score', protect, getSustainability);
router.get('/diseases', protect, getDiseases);
router.get('/diseases/:diseaseName', protect, getDiseaseByName);
router.post('/recommendations', protect, getRecommendations);
router.get('/recommendations', protect, getRecommendations);
router.get('/disease/:className', protect, getDiseaseAdvisory);
router.get('/disease', protect, getDiseaseAdvisory);

module.exports = router;
