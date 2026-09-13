// Recommendation Engine Service (Deterministic, Rule-Based Agronomy Decision Support)
// Fulfills "SEE -> UNDERSTAND -> ACT" core paradigm
const { getWeatherData, calculatePathogenRisk } = require('./weatherService');
const { evaluateIrrigation } = require('./irrigationService');

/**
 * Generate integrated agronomic recommendations combining:
 * 1. Crop
 * 2. Disease / Prediction Information
 * 3. Temperature
 * 4. Humidity
 * 5. Rain Probability
 * 6. Soil Moisture
 * 7. Irrigation Advisory
 */
async function generateRecommendations(input = {}) {
  const {
    crop = 'General Crop',
    disease = null,
    soilMoisture = null,
    stage = 'Vegetative',
    soilType = 'Loamy',
    area = 1.0,
    lat = null,
    lon = null,
    weather: customWeather = null
  } = input;

  // 1. Obtain Atmospheric Telemetry (Reuse existing weatherService)
  let weather = customWeather;
  if (!weather || weather.temperature === undefined || weather.rainProbability === undefined) {
    weather = await getWeatherData(lat, lon);
  }

  const temp = Number(weather.temperature) || 25;
  const humidity = Number(weather.humidity) || 60;
  const rainProb = Number(weather.rainProbability) || 0;
  const weatherCondition = weather.condition || 'Clear';

  // 2. Evaluate Irrigation (Reuse existing irrigationService if soil moisture provided)
  let irrigation = null;
  const hasSoilMoisture = soilMoisture !== null && soilMoisture !== undefined && !isNaN(Number(soilMoisture));
  const numericMoisture = hasSoilMoisture ? Number(soilMoisture) : null;

  if (hasSoilMoisture) {
    irrigation = evaluateIrrigation(crop, numericMoisture, weather, { stage, soilType, area });
  }

  // 3. Pathogen Proliferation Risk (Reuse existing weatherService)
  const isHealthy = !disease || disease.toLowerCase().includes('healthy');
  const pathogenRisk = disease
    ? calculatePathogenRisk(disease, weather)
    : calculatePathogenRisk('General Pathogen', weather);

  const recommendations = [];

  // -------------------------------------------------------------
  // RULE SET 1: DISEASE & PATHOGEN PROLIFERATION RULES
  // -------------------------------------------------------------
  if (disease && !isHealthy) {
    if (humidity >= 75 && (temp >= 18 && temp <= 29)) {
      const isCriticalFungal = rainProb >= 50 || humidity >= 85;
      recommendations.push({
        priority: isCriticalFungal ? 'CRITICAL' : 'HIGH',
        type: 'DISEASE',
        title: 'Monitor crop closely for rapid pathogen spread',
        reason: `High humidity (${humidity}%) and warm temperature (${temp}°C) create optimal conditions for ${disease} spore germination and foliar lesion expansion.`,
        action: 'Inspect leaf undersides daily, maintain plant spacing for canopy aeration, and prune heavily spotted foliage to reduce secondary inoculum.'
      });
    } else if (humidity < 60 && rainProb < 30) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'DISEASE',
        title: 'Targeted disease containment during dry window',
        reason: `Current moderate humidity (${humidity}%) slows airborne spore release, offering a favorable window to isolate and treat ${disease}.`,
        action: 'Remove diseased leaves and burn or bury infected haulms away from field ridges.'
      });
    } else {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'DISEASE',
        title: `Active monitoring for ${disease}`,
        reason: `Environmental conditions (${temp}°C, ${humidity}% humidity) allow gradual disease development.`,
        action: 'Maintain regular scouting twice a week and ensure balanced potassium fertilization to bolster cell wall resistance.'
      });
    }
  } else if (isHealthy && disease) {
    recommendations.push({
      priority: 'LOW',
      type: 'GENERAL_CARE',
      title: 'Maintain preventative crop scouting',
      reason: 'No active foliar pathogen lesions detected on the crop.',
      action: 'Continue weekly scouting and maintain balanced microbial bio-stimulants or compost tea for root immunity.'
    });
  }

  // -------------------------------------------------------------
  // RULE SET 2: CHEMICAL & SPRAY SAFETY RULES (vs. Rain Forecast)
  // -------------------------------------------------------------
  if (rainProb >= 50) {
    recommendations.push({
      priority: 'HIGH',
      type: 'CHEMICAL_SAFETY',
      title: 'Avoid foliar spray applications today',
      reason: `High precipitation probability (${rainProb}% within upcoming window). Rainfall will wash away fungicides or fertilizers, causing chemical runoff and economic loss.`,
      action: 'Postpone all chemical, biological, and foliar spray treatments until dry weather returns and leaf surfaces dry out.'
    });
  } else if (rainProb < 30 && disease && !isHealthy) {
    recommendations.push({
      priority: 'MEDIUM',
      type: 'CHEMICAL_SAFETY',
      title: 'Favorable spraying window for organic/biological controls',
      reason: `Dry forecast (${rainProb}% rain) provides adequate leaf adherence and systemic absorption time.`,
      action: 'Apply recommended organic neem oil (5ml/L) or targeted biological control in the early morning or late afternoon.'
    });
  }

  // -------------------------------------------------------------
  // RULE SET 3: SMART IRRIGATION SYNTHESIS RULES
  // -------------------------------------------------------------
  if (irrigation) {
    let priority = 'LOW';
    let actionGuide = '';

    if (irrigation.action === 'Delay Irrigation') {
      priority = rainProb >= 60 ? 'HIGH' : 'MEDIUM';
      actionGuide = `Hold off on irrigation. ${irrigation.nextIrrigation}. Application rate set to 0 L/m².`;
    } else if (irrigation.action === 'Irrigate Urgently') {
      priority = (numericMoisture !== null && numericMoisture < 20) ? 'CRITICAL' : 'HIGH';
      actionGuide = `Apply ${irrigation.waterRequired} (${irrigation.waterVolumeTotal} total for ${area} ha) immediately to relieve root-zone water deficit.`;
    } else if (irrigation.action === 'Limit Evening Watering') {
      priority = 'MEDIUM';
      actionGuide = 'Schedule irrigation exclusively during early morning hours (06:00 – 08:00 AM) to prevent prolonged foliar wetness.';
    } else {
      priority = irrigation.urgency === 'Urgent' ? 'HIGH' : irrigation.urgency === 'Preventative' ? 'MEDIUM' : 'LOW';
      actionGuide = `Apply scheduled maintenance watering (${irrigation.waterRequired}). ${irrigation.nextIrrigation}.`;
    }

    recommendations.push({
      priority,
      type: 'IRRIGATION',
      title: irrigation.action,
      reason: irrigation.reason,
      action: actionGuide
    });
  } else {
    // When soil moisture sensor is not specified, synthesize from weather
    if (rainProb >= 60) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'IRRIGATION',
        title: 'Hold scheduled irrigation',
        reason: `Natural precipitation forecasted (${rainProb}% chance within 24h). Conserves water and prevents soil saturation.`,
        action: 'Check field soil moisture before operating pumps.'
      });
    }
  }

  // -------------------------------------------------------------
  // RULE SET 4: OVERALL RISK LEVEL DETERMINATION
  // -------------------------------------------------------------
  let riskLevel = 'LOW';
  const hasCritical = recommendations.some(r => r.priority === 'CRITICAL') || pathogenRisk?.riskLevel?.includes('CRITICAL');
  const hasHigh = recommendations.some(r => r.priority === 'HIGH') || pathogenRisk?.riskLevel?.includes('HIGH');
  const hasMedium = recommendations.some(r => r.priority === 'MEDIUM') || pathogenRisk?.riskLevel?.includes('MODERATE');

  if (hasCritical) {
    riskLevel = 'CRITICAL';
  } else if (hasHigh) {
    riskLevel = 'HIGH';
  } else if (hasMedium) {
    riskLevel = 'MEDIUM';
  }

  return {
    riskLevel,
    crop,
    disease: disease || 'Not Specified',
    summary: `${riskLevel} agricultural risk level identified for ${crop}. ${recommendations[0]?.title || 'Maintain regular farm routine.'}`,
    pathogenRisk: pathogenRisk ? {
      riskScore: pathogenRisk.riskScore,
      riskLevel: pathogenRisk.riskLevel,
      alertMessage: pathogenRisk.alertMessage
    } : null,
    weather: {
      location: weather.location || 'Local Farm Field',
      temperature: temp,
      humidity,
      rainProbability: rainProb,
      condition: weatherCondition
    },
    soilMoisture: numericMoisture,
    irrigation: irrigation ? {
      action: irrigation.action,
      urgency: irrigation.urgency,
      waterRequired: irrigation.waterRequired,
      waterVolumeTotal: irrigation.waterVolumeTotal,
      nextIrrigation: irrigation.nextIrrigation
    } : null,
    recommendations
  };
}

module.exports = {
  generateRecommendations
};
