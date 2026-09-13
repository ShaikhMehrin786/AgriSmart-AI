// Weather Intelligence & Pathogen Risk Correlator Service
const axios = require('axios');
const prisma = require('../config/database');
const { OPENWEATHER_API_KEY } = require('../config/env');

const DEFAULT_COORDS = {
  latitude: 21.1458,
  longitude: 79.0882,
  location: 'Nagpur Agricultural Zone'
};

/**
 * Format 5-day forecast from OpenWeather 3-hour list
 */
function parseOpenWeatherForecast(forecastList) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return getFallbackForecast(26.5, 75);
  }

  const daysMap = new Map();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayKey = new Date().toISOString().split('T')[0];

  for (const item of forecastList) {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0];

    if (!daysMap.has(dateKey)) {
      daysMap.set(dateKey, {
        dateKey,
        day: dayNames[date.getDay()],
        temps: [],
        humidities: [],
        pops: [],
        conditions: [],
        descriptions: [],
        icons: []
      });
    }

    const dayObj = daysMap.get(dateKey);
    if (item.main?.temp != null) dayObj.temps.push(item.main.temp);
    if (item.main?.humidity != null) dayObj.humidities.push(item.main.humidity);
    // pop is probability of precipitation between 0 and 1
    if (item.pop != null) dayObj.pops.push(item.pop);
    if (item.weather?.[0]?.main) dayObj.conditions.push(item.weather[0].main);
    if (item.weather?.[0]?.description) dayObj.descriptions.push(item.weather[0].description);
    if (item.weather?.[0]?.icon) dayObj.icons.push(item.weather[0].icon);
  }

  const daysArray = Array.from(daysMap.values()).slice(0, 5);

  return daysArray.map((d, index) => {
    const avgTemp = d.temps.length > 0 ? d.temps.reduce((a, b) => a + b, 0) / d.temps.length : 25;
    const minTemp = d.temps.length > 0 ? Math.min(...d.temps) : avgTemp - 2;
    const maxTemp = d.temps.length > 0 ? Math.max(...d.temps) : avgTemp + 2;
    const maxPop = d.pops.length > 0 ? Math.max(...d.pops) : 0;
    const avgHum = d.humidities.length > 0 ? Math.round(d.humidities.reduce((a, b) => a + b, 0) / d.humidities.length) : 60;
    const dominantCondition = d.conditions[Math.floor(d.conditions.length / 2)] || 'Clear';
    const dominantDesc = d.descriptions[Math.floor(d.descriptions.length / 2)] || 'Clear sky';
    const dominantIcon = d.icons[Math.floor(d.icons.length / 2)] || '01d';

    return {
      date: d.dateKey,
      day: d.dateKey === todayKey || index === 0 ? 'Today' : d.day,
      temp: Math.round(avgTemp * 10) / 10,
      tempMin: Math.round(minTemp * 10) / 10,
      tempMax: Math.round(maxTemp * 10) / 10,
      rain: Math.round(maxPop * 100),
      humidity: avgHum,
      condition: dominantCondition,
      description: dominantDesc,
      icon: dominantIcon
    };
  });
}

/**
 * Deterministic fallback forecast for simulation/offline mode
 */
function getFallbackForecast(baseTemp = 26.5, baseRain = 75) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return [
    { day: 'Today', temp: baseTemp, tempMin: Math.round((baseTemp - 3.5) * 10) / 10, tempMax: Math.round((baseTemp + 2.5) * 10) / 10, rain: baseRain, condition: 'Rain', description: 'Light showers', humidity: 84 },
    { day: dayNames[(today.getDay() + 1) % 7], temp: Math.round((baseTemp - 1.5) * 10) / 10, tempMin: Math.round((baseTemp - 4) * 10) / 10, tempMax: Math.round((baseTemp + 1) * 10) / 10, rain: Math.max(0, baseRain - 15), condition: 'Rain', description: 'Scattered rain', humidity: 80 },
    { day: dayNames[(today.getDay() + 2) % 7], temp: Math.round((baseTemp + 1.0) * 10) / 10, tempMin: Math.round((baseTemp - 2) * 10) / 10, tempMax: Math.round((baseTemp + 3.5) * 10) / 10, rain: Math.max(0, baseRain - 35), condition: 'Clouds', description: 'Overcast clouds', humidity: 72 },
    { day: dayNames[(today.getDay() + 3) % 7], temp: Math.round((baseTemp + 2.0) * 10) / 10, tempMin: Math.round((baseTemp - 1) * 10) / 10, tempMax: Math.round((baseTemp + 4.5) * 10) / 10, rain: Math.max(0, baseRain - 55), condition: 'Clouds', description: 'Partly cloudy', humidity: 65 },
    { day: dayNames[(today.getDay() + 4) % 7], temp: Math.round((baseTemp + 2.5) * 10) / 10, tempMin: Math.round((baseTemp - 0.5) * 10) / 10, tempMax: Math.round((baseTemp + 5) * 10) / 10, rain: Math.max(0, baseRain - 65), condition: 'Clear', description: 'Clear sky', humidity: 58 }
  ];
}

/**
 * Fetch local weather and 5-day forecast for given latitude and longitude
 */
async function getWeatherData(latitude, longitude) {
  const apiKey = OPENWEATHER_API_KEY;
  const lat = parseFloat(latitude) || DEFAULT_COORDS.latitude;
  const lon = parseFloat(longitude) || DEFAULT_COORDS.longitude;

  // Fallback defaults if API key is missing or unconfigured
  if (!apiKey || apiKey === 'your_openweather_api_key_here' || apiKey === 'mock_weather_key') {
    const fallbackPayload = {
      location: DEFAULT_COORDS.location,
      latitude: lat,
      longitude: lon,
      temperature: 26.5,
      feelsLike: 27.8,
      humidity: 84.0,
      rainProbability: 75.0,
      windSpeed: 12.4,
      condition: 'Rain',
      description: 'Humid / Light Showers',
      icon: '10d',
      forecast: getFallbackForecast(26.5, 75),
      isSimulated: true,
      dataSource: 'Simulated Agronomic Baseline (API Key Unconfigured)',
      recordedAt: new Date().toISOString()
    };
    fallbackPayload.pathogenRisk = calculatePathogenRisk('General Foliar Pathogen', fallbackPayload);
    return fallbackPayload;
  }

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const [weatherRes, forecastRes] = await Promise.allSettled([
      axios.get(weatherUrl, { timeout: 6000 }),
      axios.get(forecastUrl, { timeout: 6000 })
    ]);

    if (weatherRes.status !== 'fulfilled') {
      throw new Error(weatherRes.reason?.message || 'OpenWeather current weather request failed');
    }

    const currentData = weatherRes.value.data;
    const forecastList = forecastRes.status === 'fulfilled' ? forecastRes.value.data?.list : [];

    // Calculate precipitation probability from forecast POP (probability of precipitation)
    // OpenWeather provides `pop` between 0.0 and 1.0 in 3-hour forecast blocks.
    let rainProbability = 0;
    if (Array.isArray(forecastList) && forecastList.length > 0) {
      // Look at the next 12 hours (first 4 slots of 3 hours each) for immediate rain probability
      const next12Hours = forecastList.slice(0, 4);
      const maxPop = next12Hours.reduce((max, slot) => Math.max(max, slot.pop ?? 0), 0);
      rainProbability = Math.round(maxPop * 100);
    }

    // If current weather reports active precipitation, ensure rain probability reflects it
    const currentCondition = currentData.weather?.[0]?.main || 'Clear';
    if (['Rain', 'Drizzle', 'Thunderstorm'].includes(currentCondition)) {
      rainProbability = Math.max(rainProbability, 80);
    }

    // Wind speed: OpenWeather returns m/s with units=metric; convert to km/h for agricultural standard
    const windSpeedKmH = Math.round(((currentData.wind?.speed || 0) * 3.6) * 10) / 10;

    const parsedForecast = parseOpenWeatherForecast(forecastList);

    const weatherPayload = {
      location: currentData.name || (forecastRes.status === 'fulfilled' && forecastRes.value.data?.city?.name) || 'Local Farm Field',
      latitude: lat,
      longitude: lon,
      temperature: Math.round(currentData.main.temp * 10) / 10,
      feelsLike: Math.round(currentData.main.feels_like * 10) / 10,
      humidity: currentData.main.humidity,
      rainProbability: rainProbability,
      windSpeed: windSpeedKmH,
      condition: currentCondition,
      description: currentData.weather?.[0]?.description || currentCondition,
      icon: currentData.weather?.[0]?.icon || '01d',
      forecast: parsedForecast,
      isSimulated: false,
      dataSource: 'OpenWeatherMap Live Telemetry',
      recordedAt: new Date().toISOString()
    };

    weatherPayload.pathogenRisk = calculatePathogenRisk('General Foliar Pathogen', weatherPayload);

    // Asynchronously log to DB only if weatherLog model is supported
    if (prisma.weatherLog && typeof prisma.weatherLog.create === 'function') {
      prisma.weatherLog.create({
        data: {
          latitude: lat,
          longitude: lon,
          temperature: weatherPayload.temperature,
          humidity: weatherPayload.humidity,
          rainProbability: weatherPayload.rainProbability,
          windSpeed: weatherPayload.windSpeed
        }
      }).catch(err => console.error('Notice: Weather log DB recording deferred:', err.message));
    }

    return weatherPayload;
  } catch (error) {
    console.warn('Weather API failed or returned error, using fallback:', error.message);

    const fallbackPayload = {
      location: DEFAULT_COORDS.location,
      latitude: lat,
      longitude: lon,
      temperature: 25.0,
      feelsLike: 26.2,
      humidity: 80.0,
      rainProbability: 60.0,
      windSpeed: 10.5,
      condition: 'Overcast',
      description: 'Regional weather estimate (API offline)',
      icon: '04d',
      forecast: getFallbackForecast(25.0, 60),
      isSimulated: true,
      dataSource: `Fallback Baseline (${error.message})`,
      recordedAt: new Date().toISOString()
    };
    fallbackPayload.pathogenRisk = calculatePathogenRisk('General Foliar Pathogen', fallbackPayload);
    return fallbackPayload;
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
