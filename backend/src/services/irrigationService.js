// Smart Irrigation & Sustainability Calculation Engine
// Algorithmic Decision Support

/**
 * Generate smart irrigation advice based on crop, weather, and soil moisture
 */
function evaluateIrrigation(cropName, soilMoisture, weather) {
  const rainProb = weather.rainProbability || 0;
  const humidity = weather.humidity || 50;
  const temp = weather.temperature || 25;

  let action = 'Maintain Regular Schedule';
  let reason = 'Current soil moisture and atmospheric conditions are well balanced.';
  let urgency = 'Normal';

  if (rainProb >= 60 && soilMoisture >= 35) {
    action = 'Delay Irrigation';
    reason = `Natural precipitation forecasted (${rainProb}% chance within 24h) and current soil moisture (${soilMoisture}%) is sufficient. Conserves water and prevents root suffocation.`;
    urgency = 'Preventative';
  } else if (soilMoisture < 25 && rainProb < 35) {
    action = 'Irrigate Urgently';
    reason = `Critically low soil moisture (${soilMoisture}%) combined with dry forecast (${rainProb}% rain) threatens crop wilting and yield drop.`;
    urgency = 'Urgent';
  } else if (humidity > 85 && temp > 28) {
    action = 'Limit Evening Watering';
    reason = 'High ambient humidity with excessive evening watering creates stagnant droplet films that accelerate fungal foliar germination.';
    urgency = 'Preventative';
  }

  return {
    action,
    reason,
    urgency,
    soilMoistureRecorded: soilMoisture,
    waterRequirementLevel: 'Medium'
  };
}

/**
 * Calculate farm sustainability score (0 - 100)
 */
function calculateSustainabilityScore(practices = {}) {
  const {
    usesOrganicRemedies = true,
    followsWeatherIrrigation = true,
    removesInfectedFoliage = true,
    maintainsSoilMulch = true
  } = practices;

  let score = 0;
  const breakdown = [];

  // 1. Water Efficiency (35 pts)
  if (followsWeatherIrrigation) {
    score += 35;
    breakdown.push({ category: 'Water Conservation', score: 35, max: 35, status: 'Optimal' });
  } else {
    score += 15;
    breakdown.push({ category: 'Water Conservation', score: 15, max: 35, status: 'Needs Improvement' });
  }

  // 2. Eco-friendly Treatment (30 pts)
  if (usesOrganicRemedies) {
    score += 30;
    breakdown.push({ category: 'Eco-Friendly Biocides', score: 30, max: 30, status: 'Optimal' });
  } else {
    score += 10;
    breakdown.push({ category: 'Eco-Friendly Biocides', score: 10, max: 30, status: 'Heavy Chemical Reliance' });
  }

  // 3. Preventive Sanitation (20 pts)
  if (removesInfectedFoliage) {
    score += 20;
    breakdown.push({ category: 'Field Hygiene & Pruning', score: 20, max: 20, status: 'Optimal' });
  } else {
    score += 8;
    breakdown.push({ category: 'Field Hygiene & Pruning', score: 8, max: 20, status: 'Debris Left in Field' });
  }

  // 4. Soil Health (15 pts)
  if (maintainsSoilMulch) {
    score += 15;
    breakdown.push({ category: 'Soil Health & Mulching', score: 15, max: 15, status: 'Optimal' });
  } else {
    score += 5;
    breakdown.push({ category: 'Soil Health & Mulching', score: 5, max: 15, status: 'Bare Soil Erosion Risk' });
  }

  return {
    totalScore: score,
    grade: score >= 85 ? 'A (Excellent Eco-Stewardship)' : score >= 70 ? 'B (Sustainable)' : 'C (High Chemical Footprint)',
    breakdown
  };
}

module.exports = {
  evaluateIrrigation,
  calculateSustainabilityScore
};
