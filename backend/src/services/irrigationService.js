// Smart Irrigation & Sustainability Calculation Engine
// Algorithmic Decision Support

// Crop base water requirement factor in mm/day (L/m²)
const CROP_WATER_FACTORS = {
  Rice: 8.0,
  Sugarcane: 7.5,
  Tomato: 5.5,
  Potato: 5.0,
  Cotton: 5.2,
  Corn: 4.8,
  Soybean: 4.5,
  Wheat: 4.0,
};

// Stage water requirement multipliers
const STAGE_MULTIPLIERS = {
  Seedling: 0.7,
  Vegetative: 1.0,
  Flowering: 1.3,
  Fruiting: 1.25,
  Maturity: 0.6,
};

// Soil retention and drainage characteristics
const SOIL_CHARACTERISTICS = {
  Sandy: { drainage: 'High', retention: 'Low', minSafeMoisture: 35 },
  Loamy: { drainage: 'Moderate', retention: 'Balanced', minSafeMoisture: 30 },
  Clay: { drainage: 'Slow', retention: 'High', minSafeMoisture: 25 },
  Silty: { drainage: 'Moderate', retention: 'Medium', minSafeMoisture: 28 },
  Peaty: { drainage: 'Slow', retention: 'Very High', minSafeMoisture: 30 },
};

/**
 * Generate smart irrigation advice based on crop, weather, and soil moisture
 */
function evaluateIrrigation(cropName, soilMoisture, weather = {}, options = {}) {
  const rainProb = Number(weather.rainProbability) || 0;
  const humidity = Number(weather.humidity) || 50;
  const temp = Number(weather.temperature) || 25;
  const stage = options.stage || 'Vegetative';
  const soilType = options.soilType || 'Loamy';
  const area = Number(options.area) || 1.0; // in hectares

  const baseFactor = CROP_WATER_FACTORS[cropName] || 5.0;
  const stageMultiplier = STAGE_MULTIPLIERS[stage] || 1.0;
  const soilMeta = SOIL_CHARACTERISTICS[soilType] || SOIL_CHARACTERISTICS.Loamy;

  let action = 'Maintain Regular Schedule';
  let reason = 'Current soil moisture and atmospheric conditions are well balanced.';
  let urgency = 'Normal';
  let waterLitersPerSqM = 0;
  let nextIrrigation = 'In 2–3 days as topsoil dries';

  // Decision rule hierarchy:
  // 1. Imminent rainfall check (delay to avoid runoff & waterlogging)
  if (rainProb >= 60 && soilMoisture >= 30) {
    action = 'Delay Irrigation';
    reason = `Natural precipitation forecasted (${rainProb}% chance within 24–48h) and current soil moisture (${soilMoisture}%) is sufficient. Delaying avoids nutrient leaching, root suffocation, and saves pumping energy.`;
    urgency = 'Preventative';
    waterLitersPerSqM = 0;
    nextIrrigation = 'Re-evaluate in 24–48 hours post-rainfall';
  }
  // 2. High soil moisture / waterlogging risk
  else if (soilMoisture >= 75) {
    action = 'Delay Irrigation';
    reason = `Current soil moisture is already near field capacity (${soilMoisture}% in ${soilType} soil). Additional irrigation would saturate the root zone and induce root hypoxia.`;
    urgency = 'Preventative';
    waterLitersPerSqM = 0;
    nextIrrigation = 'In 3–4 days after root-zone aeration';
  }
  // 3. Critically dry soil with low rain probability -> Urgent watering
  else if (soilMoisture < soilMeta.minSafeMoisture && rainProb < 40) {
    action = 'Irrigate Urgently';
    reason = `Critically low soil moisture (${soilMoisture}%) in ${soilType} soil combined with dry forecast (${rainProb}% rain) threatens immediate moisture stress and yield loss during ${stage} stage for ${cropName}.`;
    urgency = 'Urgent';
    const moistureDeficit = Math.max(0, 60 - soilMoisture);
    waterLitersPerSqM = Math.round((baseFactor * stageMultiplier * (moistureDeficit / 30) + 10) * 10) / 10;
    nextIrrigation = 'Immediately (within 6–12 hours)';
  }
  // 4. High humidity & high heat -> Fungal risk warning: water morning only
  else if (humidity > 85 && temp > 28) {
    action = 'Limit Evening Watering';
    reason = `High ambient humidity (${humidity}%) and warm temperatures (${temp}°C) create prime conditions for fungal germination. Avoid late afternoon or evening overhead irrigation; apply water at dawn only.`;
    urgency = 'Preventative';
    waterLitersPerSqM = Math.round(baseFactor * stageMultiplier * 0.8 * 10) / 10;
    nextIrrigation = 'Tomorrow morning at sunrise (06:00 – 08:00 AM)';
  }
  // 5. Moderate moisture needing routine top-up
  else if (soilMoisture < 50 && rainProb < 50) {
    action = 'Apply Moderate Irrigation';
    reason = `Soil moisture (${soilMoisture}%) is gradually depleting. Moderate watering recommended to maintain active transpiration and nutrient uptake for ${stage} ${cropName}.`;
    urgency = 'Normal';
    waterLitersPerSqM = Math.round(baseFactor * stageMultiplier * 10) / 10;
    nextIrrigation = 'Tomorrow during early morning hours';
  }
  // 6. Healthy baseline
  else {
    action = 'Maintain Regular Schedule';
    reason = `Soil moisture (${soilMoisture}%) and forecast (${rainProb}% rain, ${temp}°C) are within optimal agricultural threshold. Continue routine scout-based watering.`;
    urgency = 'Normal';
    waterLitersPerSqM = Math.round((baseFactor * stageMultiplier * 0.5) * 10) / 10;
    nextIrrigation = 'In 2 days if no precipitation occurs';
  }

  // Calculate volume: 1 L/m² = 10 m³ per hectare
  const totalCubicMeters = Math.round(waterLitersPerSqM * 10 * area * 10) / 10;

  return {
    action,
    reason,
    urgency,
    crop: cropName,
    growthStage: stage,
    soilType,
    fieldArea: area,
    soilMoistureRecorded: soilMoisture,
    soilMoisture,
    waterRequired: `${waterLitersPerSqM} L/m²`,
    waterVolumeTotal: `${totalCubicMeters} m³`,
    waterRequirementLevel: waterLitersPerSqM === 0 ? 'None' : waterLitersPerSqM > 20 ? 'High' : waterLitersPerSqM > 10 ? 'Medium' : 'Low',
    nextIrrigation,
    weather: {
      location: weather.location || 'Local Farm Field',
      temperature: temp,
      humidity,
      rainProbability: rainProb,
      condition: weather.condition || 'Clear',
      description: weather.description || ''
    }
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
