const express = require('express');
const router = express.Router();
const {
  getWeatherAndRisk,
  getIrrigationAdvice,
  getSustainabilityScore
} = require('../controllers/advisoryController');

router.get('/weather', getWeatherAndRisk);
router.post('/irrigation', getIrrigationAdvice);
router.post('/sustainability', getSustainabilityScore);

module.exports = router;
