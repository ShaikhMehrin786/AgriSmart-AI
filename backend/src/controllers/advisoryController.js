
const { getWeatherData, calculatePathogenRisk } = require('../services/weatherService');

const getWeather = async (req, res) => {
  try {
    const { lat, lon, disease } = req.query;
    const weather = await getWeatherData(lat, lon);

    // If disease is specified in query, customize pathogen risk calculation
    if (disease && disease !== 'General') {
      weather.pathogenRisk = calculatePathogenRisk(disease, weather);
    }

    res.json({
      success: true,
      data: weather
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve weather data',
      error: error.message
    });
  }
};

const { evaluateIrrigation } = require('../services/irrigationService');

const getIrrigation = async (req, res) => {
  try {
    const {
      crop = 'Tomato',
      stage = 'Vegetative',
      soilType = 'Loamy',
      soilMoisture,
      area = 1,
      lat,
      lon
    } = req.body;

    // 1. Validate Soil Moisture (must be a number between 0 and 100)
    if (soilMoisture === undefined || soilMoisture === null || soilMoisture === '' || isNaN(Number(soilMoisture))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: soilMoisture is required and must be a valid number.'
      });
    }

    const numSoilMoisture = Number(soilMoisture);
    if (numSoilMoisture < 0 || numSoilMoisture > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: soilMoisture must be between 0% and 100%.'
      });
    }

    // 2. Validate Field Area (must be a positive number)
    const numArea = Number(area);
    if (isNaN(numArea) || numArea <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: field area must be a positive number greater than 0.'
      });
    }

    // 3. Obtain real weather data from the existing weatherService
    const weather = await getWeatherData(lat, lon);

    // 4. Generate rule-based irrigation recommendation using existing irrigationService
    const recommendation = evaluateIrrigation(crop, numSoilMoisture, weather, {
      stage,
      soilType,
      area: numArea
    });

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    console.error('Error in getIrrigation controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate smart irrigation recommendation',
      error: error.message
    });
  }
};

const getSustainability = async (req, res) => {
  res.json({
    success: true,
    data: {
      score: 85, level: 'Excellent',
      factors: [
        { name: 'Water Efficiency', score: 92 },
        { name: 'Disease Management', score: 78 }
      ]
    }
  });
};

const { generateRecommendations } = require('../services/recommendationService');

const getRecommendations = async (req, res) => {
  try {
    const input = {
      crop: req.body.crop || req.query.crop || 'General Crop',
      disease: req.body.disease || req.query.disease || null,
      soilMoisture: req.body.soilMoisture !== undefined ? req.body.soilMoisture : req.query.soilMoisture,
      stage: req.body.stage || req.query.stage || 'Vegetative',
      soilType: req.body.soilType || req.query.soilType || 'Loamy',
      area: req.body.area || req.query.area || 1.0,
      lat: req.body.lat || req.query.lat || null,
      lon: req.body.lon || req.query.lon || null
    };

    const recommendations = await generateRecommendations(input);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
};

const { getDiseaseKnowledge, SAFETY_DISCLAIMER } = require('../data/diseaseKnowledgeBase');

const getDiseaseAdvisory = async (req, res) => {
  try {
    const query = req.params.className || req.query.disease || req.query.rawClass || 'Tomato___Early_blight';
    const entry = getDiseaseKnowledge(query);
    res.json({
      success: true,
      data: {
        ...entry,
        safetyDisclaimer: SAFETY_DISCLAIMER
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve disease advisory',
      error: error.message
    });
  }
};

module.exports = { getWeather, getIrrigation, getSustainability, getRecommendations, getDiseaseAdvisory };
