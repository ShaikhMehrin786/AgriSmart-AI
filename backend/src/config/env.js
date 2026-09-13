require('dotenv').config();

const openWeatherKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || '';

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  OPENWEATHER_API_KEY: openWeatherKey,
  WEATHER_API_KEY: openWeatherKey,
  AI_PROVIDER: process.env.AI_PROVIDER,
};
