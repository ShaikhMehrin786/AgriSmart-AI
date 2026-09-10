// Advisory Controller
// Exposes weather intelligence, pathogen risk, smart irrigation, and sustainability scoring
const { getWeatherData, calculatePathogenRisk } = require('../services/weatherService');
const { evaluateIrrigation, calculateSustainabilityScore } = require('../services/irrigationService');

async function getWeatherAndRisk(req, res, next) {
  try {
    const lat = req.query.lat || 21.1458; // Default Nagpur/Maharashtra center
    const lon = req.query.lon || 79.0882;
    const disease = req.query.disease || 'Tomato Early Blight';

    const weather = await getWeatherData(lat, lon);
    const risk = calculatePathogenRisk(disease, weather);

    res.json({
      weather,
      risk
    });
  } catch (error) {
    next(error);
  }
}

async function getIrrigationAdvice(req, res, next) {
  try {
    const { cropName = 'Tomato', soilMoisturePercent = 40, latitude = 21.14, longitude = 79.08 } = req.body;

    const weather = await getWeatherData(latitude, longitude);
    const irrigationAdvice = evaluateIrrigation(cropName, parseFloat(soilMoisturePercent), weather);

    res.json({
      crop: cropName,
      weather,
      advisory: irrigationAdvice
    });
  } catch (error) {
    next(error);
  }
}

async function getSustainabilityScore(req, res, next) {
  try {
    const practices = req.body || {};
    const result = calculateSustainabilityScore(practices);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWeatherAndRisk,
  getIrrigationAdvice,
  getSustainabilityScore
};
