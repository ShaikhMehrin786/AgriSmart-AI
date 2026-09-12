
const getWeather = async (req, res) => {
  res.json({
    success: true,
    data: { temperature: 24, humidity: 65, rainProbability: 30, windSpeed: 12, condition: 'Sunny' }
  });
};

const getIrrigation = async (req, res) => {
  res.json({
    success: true,
    data: {
      action: 'Delay Irrigation',
      reason: 'Soil moisture is sufficient and rainfall probability is high in the next 24 hours.',
      waterRequired: '0 L/m²'
    }
  });
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

module.exports = { getWeather, getIrrigation, getSustainability };
