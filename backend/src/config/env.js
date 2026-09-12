require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
};
