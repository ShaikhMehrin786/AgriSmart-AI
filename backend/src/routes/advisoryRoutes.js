const express = require('express');
const {
  getWeather,
  getIrrigation,
  getSustainability,
  getRecommendations,
  getDiseases,
  getDiseaseByName,
  getDiseaseAdvisory,
  getCropRecommendations,
  getIotTelemetry,
  postIotTelemetry,
  getAgenticCycle
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

// SIH-2026 Bonus Module A: Crop Recommendation
router.post('/crop-recommendation', protect, getCropRecommendations);
router.get('/crop-recommendation', protect, getCropRecommendations);

// SIH-2026 Bonus Module F: IoT Sensor Integration
router.get('/iot/telemetry', protect, getIotTelemetry);
router.post('/iot/telemetry', protect, postIotTelemetry);

// SIH-2026 Bonus Module G: Agentic Advisor
router.post('/agentic/autonomous-cycle', protect, getAgenticCycle);
router.get('/agentic/autonomous-cycle', protect, getAgenticCycle);

module.exports = router;
