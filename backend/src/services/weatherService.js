// Weather Intelligence & Pathogen Risk Correlator Service
const axios = require('axios');
const prisma = require('../config/database');

/**
 * Fetch local weather for given latitude and longitude
 */
async function getWeatherData(latitude, longitude) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // Fallback defaults for testing or if API key is missing
  if (!apiKey || apiKey === 'your_openweather_api_key_here') {
    return {
      location: 'Nagpur Agricultural Zone',
      temperature: 26.5,
      humidity: 84.0,
      rainProbability: 75.0,
      windSpeed: 12.4,
      condition: 'Humid / Light Showers',
      isSimulated: true
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url, { timeout: 4000 });
    const data = response.data;

    const weatherPayload = {
      location: data.name || 'Local Farm Field',
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainProbability: data.clouds?.all || 20.0,
      windSpeed: data.wind?.speed || 5.0,
      condition: data.weather[0]?.description || 'Clear',
      isSimulated: false
    };

    // Log to PostgreSQL asynchronously
    prisma.weatherLog.create({
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        temperature: weatherPayload.temperature,
        humidity: weatherPayload.humidity,
        rainProbability: weatherPayload.rainProbability,
        windSpeed: weatherPayload.windSpeed
      }
    }).catch(err => console.error('Error logging weather to DB:', err.message));

    return weatherPayload;
  } catch (error) {
    console.warn('Weather API failed, using regional defaults:', error.message);
    return {
      location: 'Local Farm Field',
      temperature: 25.0,
      humidity: 80.0,
      rainProbability: 60.0,
      windSpeed: 8.0,
      condition: 'Overcast',
      isSimulated: true
    };
  }
}

/**
 * Correlate weather with disease biology to calculate pathogen outbreak risk
 */
function calculatePathogenRisk(diseaseName, weather) {
  const { temperature, humidity, rainProbability } = weather;

  // High fungal proliferation conditions (e.g. Blights, Mildews)
  let riskScore = 0;

  if (humidity >= 80) riskScore += 0.45;
  else if (humidity >= 65) riskScore += 0.25;

  if (temperature >= 18 && temperature <= 28) riskScore += 0.35;
  else riskScore += 0.10;

  if (rainProbability >= 60) riskScore += 0.20;
  else if (rainProbability >= 30) riskScore += 0.10;

  let riskLevel = 'LOW';
  let alertMessage = 'Environmental conditions are unfavorable for fungal spread.';

  if (riskScore >= 0.75) {
    riskLevel = 'CRITICAL OUTBREAK WARNING';
    alertMessage = 'Severe threat: High humidity and warm temperatures create optimal conditions for rapid spore germination. Inspect field daily.';
  } else if (riskScore >= 0.50) {
    riskLevel = 'MODERATE';
    alertMessage = 'Moderate threat: Moisture levels promote gradual lesion expansion. Maintain preventive vigilance.';
  }

  return {
    riskScore: parseFloat(riskScore.toFixed(2)),
    riskLevel,
    alertMessage
  };
}

module.exports = {
  getWeatherData,
  calculatePathogenRisk
};
