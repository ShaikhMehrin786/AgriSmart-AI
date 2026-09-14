// Deterministic Sustainability Index Calculator Service
// Grounded in agronomic resource stewardship: Water Conservation, Irrigation Efficiency, Weather Awareness, & Disease Management
// Scale: 0 - 100 based on Water, Bio-control, Disease Prevention, and Resource Optimization

const { getDiseaseMonograph } = require('./diseaseService');

/**
 * Calculate deterministic Sustainability Score (0 - 100)
 * Handles both direct factor metrics and full agronomic telemetry inputs.
 *
 * @param {Object} input
 * @param {string} [input.crop]
 * @param {number} [input.soilMoisture]
 * @param {Object} [input.weather] { temperature, humidity, rainProbability, condition }
 * @param {Object} [input.irrigation] { action, urgency, waterRequired, waterVolumeTotal }
 * @param {string} [input.disease]
 * @param {boolean} [input.avoidedIrrigationDueToRain]
 * @param {number} [input.waterEfficiency]
 * @param {number} [input.bioControlRatio]
 * @param {number} [input.diseasePrevention]
 * @param {number} [input.resourceOptimization]
 * @returns {Object} Deterministic sustainability audit and factor breakdown
 */
function calculateSustainabilityScore(input = {}) {
  // Support direct metric parameters (teammate support)
  if (input.waterEfficiency !== undefined || input.bioControlRatio !== undefined) {
    const wEff = Math.max(0, Math.min(100, Number(input.waterEfficiency ?? 90)));
    const pBio = Math.max(0, Math.min(100, Number(input.bioControlRatio ?? 85)));
    const dPrev = Math.max(0, Math.min(100, Number(input.diseasePrevention ?? 80)));
    const rOpt = Math.max(0, Math.min(100, Number(input.resourceOptimization ?? 88)));

    const rawScore = (0.35 * wEff) + (0.30 * pBio) + (0.20 * dPrev) + (0.15 * rOpt);
    const score = Math.round(rawScore);

    let grade = 'A';
    let level = 'Excellent Ecological Management';

    if (score >= 85) {
      grade = 'A';
      level = 'Excellent Ecological Management';
    } else if (score >= 70) {
      grade = 'B';
      level = 'Good Sustainable Practices';
    } else if (score >= 55) {
      grade = 'C';
      level = 'Moderate Sustainability (Action Needed)';
    } else if (score >= 40) {
      grade = 'D';
      level = 'Sub-Optimal Resource Management';
    } else {
      grade = 'F';
      level = 'High Environmental Risk';
    }

    const factors = [
      { name: 'Water Efficiency (Weather-Aligned)', score: wEff, max: 100, weight: '35%' },
      { name: 'Organic & Bio-Control Adoption', score: pBio, max: 100, weight: '30%' },
      { name: 'Disease Prevention & Early Scouting', score: dPrev, max: 100, weight: '20%' },
      { name: 'Resource & Soil Health Optimization', score: rOpt, max: 100, weight: '15%' }
    ];

    return {
      score,
      totalScore: score,
      sustainabilityScore: score,
      grade,
      level,
      factors,
      summary: `Your farm achieves a Sustainability Index of ${score}/100 (${level}, Grade ${grade}).`,
      explanation: `Farm sustainability index is rated Grade ${grade} (${score}/100) across water conservation, bio-control adoption, and resource efficiency.`,
      improvementSuggestions: ['Continue organic practices and maintain weather-aligned irrigation schedules.']
    };
  }

  const {
    crop = 'General Crop',
    soilMoisture = null,
    weather = null,
    irrigation = null,
    disease = null,
    avoidedIrrigationDueToRain = null
  } = input;

  const unavailableData = [];

  // Track availability of input telemetry
  const hasSoilMoisture = soilMoisture !== null && soilMoisture !== undefined && !isNaN(Number(soilMoisture));
  const numMoisture = hasSoilMoisture ? Number(soilMoisture) : null;
  if (!hasSoilMoisture) unavailableData.push('soilMoisture');

  const hasWeather = weather && weather.temperature !== undefined && weather.rainProbability !== undefined;
  const temp = hasWeather ? Number(weather.temperature) : 25;
  const humidity = hasWeather ? Number(weather.humidity || 60) : 60;
  const rainProb = hasWeather ? Number(weather.rainProbability || 0) : 0;
  if (!hasWeather) unavailableData.push('weather');

  const hasIrrigation = irrigation && irrigation.action;
  if (!hasIrrigation) unavailableData.push('irrigationPlan');

  const hasDisease = disease && disease.trim() !== '';
  if (!hasDisease) unavailableData.push('diseaseDiagnosis');

  const suggestions = [];

  // -------------------------------------------------------------
  // 1. WATER EFFICIENCY COMPONENT (Weight: 35%)
  // Measures water deficit matching and preventing over-irrigation
  // -------------------------------------------------------------
  let waterScore = 75; // default benchmark
  let waterStatus = 'Moderate';
  let waterExplanation = '';

  if (hasSoilMoisture) {
    if (numMoisture >= 35 && numMoisture <= 65) {
      // Optimal root zone moisture range
      waterScore = 95;
      waterStatus = 'Optimal';
      waterExplanation = `Soil moisture (${numMoisture}%) is in the ideal agronomic range (35-65%), maintaining plant turgor without waterlogging.`;
    } else if (numMoisture > 65) {
      // Over-saturated soil
      waterScore = 55;
      waterStatus = 'Risk of Saturation';
      waterExplanation = `Soil moisture (${numMoisture}%) exceeds 65%, risking hypoxia and root rot. Hold off watering to conserve water.`;
      suggestions.push('Avoid additional watering until soil moisture recedes below 60% to prevent deep percolation loss.');
    } else if (numMoisture >= 20 && numMoisture < 35) {
      // Moderate deficit
      waterScore = 75;
      waterStatus = 'Depleted';
      waterExplanation = `Soil moisture (${numMoisture}%) is depleted but manageable. Planned irrigation will restore optimal levels.`;
    } else {
      // Critically low moisture
      waterScore = 60;
      waterStatus = 'Deficit Stress';
      waterExplanation = `Soil moisture (${numMoisture}%) is below wilting threshold (<20%), causing crop water stress.`;
      suggestions.push('Apply urgent precision irrigation to prevent permanent wilting and yield reduction.');
    }
  } else {
    waterExplanation = 'Soil moisture sensor telemetry not provided; calculated using standard crop evapotranspiration baseline.';
  }

  // -------------------------------------------------------------
  // 2. IRRIGATION EFFICIENCY & SCHEDULING (Weight: 25%)
  // Rewards postponing irrigation before rainfall, penalizes flood waste
  // -------------------------------------------------------------
  let irrigScore = 75;
  let irrigStatus = 'Standard';
  let irrigExplanation = '';

  const isRainImminent = rainProb >= 50;
  const isDelayed = irrigation?.action === 'Delay Irrigation' || avoidedIrrigationDueToRain === true;

  if (isDelayed || (isRainImminent && irrigation?.action !== 'Irrigate Urgently')) {
    // Farmer / System successfully avoided watering before natural precipitation
    irrigScore = 98;
    irrigStatus = 'High Conservation';
    irrigExplanation = `Excellent water stewardship: scheduled irrigation avoided due to forecasted rainfall (${rainProb}%). Conserved pump power and natural water.`;
  } else if (isRainImminent && irrigation?.action === 'Irrigate Urgently' && numMoisture !== null && numMoisture > 30) {
    // Unnecessary irrigation planned despite upcoming rain
    irrigScore = 40;
    irrigStatus = 'Over-watering Risk';
    irrigExplanation = `Irrigation scheduled immediately despite high rainfall probability (${rainProb}%). Risk of runoff and wasted pump energy.`;
    suggestions.push('Defer irrigation cycle: forecasted rainfall is sufficient to recharge root zone moisture.');
  } else if (irrigation?.action === 'Limit Evening Watering') {
    irrigScore = 85;
    irrigStatus = 'Microclimate Conscious';
    irrigExplanation = 'Irrigation scheduled for early morning to avoid extended foliar wetness and fungal spore germination during humid nights.';
  } else if (irrigation?.action === 'Irrigate Urgently') {
    irrigScore = 80;
    irrigStatus = 'Targeted Relief';
    irrigExplanation = `Precision application (${irrigation.waterRequired || 'calculated volume'}) applied directly to relieve moisture deficit.`;
  } else {
    irrigScore = 80;
    irrigStatus = 'Balanced';
    irrigExplanation = 'Irrigation regimen complies with crop growth stage and baseline transpiration demand.';
  }

  // -------------------------------------------------------------
  // 3. WEATHER AWARENESS & CHEMICAL RUNOFF PREVENTION (Weight: 20%)
  // Prevents chemical wash-off and foliar fungal microclimates
  // -------------------------------------------------------------
  let weatherScore = 80;
  let weatherStatus = 'Protected';
  let weatherExplanation = '';

  if (rainProb >= 50) {
    weatherScore = 90;
    weatherStatus = 'Weather Intercept Active';
    weatherExplanation = `Inclement weather intercepted (${rainProb}% precipitation chance). Foliar spray suspension prevents chemical pesticide runoff into groundwater.`;
  } else if (humidity >= 85 && (temp >= 20 && temp <= 30)) {
    weatherScore = 70;
    weatherStatus = 'Pathogen Vulnerability';
    weatherExplanation = `Warm humid weather (${temp}°C, ${humidity}% humidity) creates elevated fungal pathogen vulnerability.`;
    suggestions.push('Improve canopy airflow and scout daily for early lesions under current humid conditions.');
  } else {
    weatherScore = 92;
    weatherStatus = 'Favorable Window';
    weatherExplanation = `Weather conditions (${temp}°C, ${humidity}% humidity, ${rainProb}% rain) provide a stable window for farm operations.`;
  }

  // -------------------------------------------------------------
  // 4. DISEASE & AGROCHEMICAL MANAGEMENT (Weight: 20%)
  // Rewards biological/organic interventions over broad-spectrum chemicals
  // -------------------------------------------------------------
  let diseaseScore = 85;
  let diseaseStatus = 'Good Stewardship';
  let diseaseExplanation = '';

  if (hasDisease) {
    const isHealthy = disease.toLowerCase().includes('healthy');
    const monograph = getDiseaseMonograph(disease, crop);

    if (isHealthy) {
      diseaseScore = 96;
      diseaseStatus = 'Clean Canopy';
      diseaseExplanation = 'No active pathogens detected. Zero unnecessary synthetic chemical fungicides required.';
    } else {
      diseaseScore = 80;
      diseaseStatus = 'Integrated Pest Management (IPM)';
      diseaseExplanation = `Pathogen identified (${disease}). Recommended protocol prioritizes biological controls (${monograph?.organicRemedy ? 'organic biocontrol' : 'sanitation'}) before synthetic chemicals.`;
      suggestions.push(`Apply recommended bio-remedy: ${monograph?.organicRemedy || 'Neem oil formulation or Trichoderma viride'}.`);
      suggestions.push('Prune and bury heavily infected foliage rather than burning or leaving it in the furrow.');
    }
  } else {
    diseaseExplanation = 'No active disease diagnosis provided; scored using baseline biological protection practices.';
  }

  // General sustainable suggestions if array is sparse
  if (suggestions.length === 0) {
    suggestions.push('Maintain drip irrigation to deliver water directly to the root zone with zero evaporation loss.');
    suggestions.push('Apply organic mulch to retain soil moisture and reduce weed competition naturally.');
  }

  // -------------------------------------------------------------
  // WEIGHTED TOTAL SCORE (0 - 100)
  // -------------------------------------------------------------
  const weightedTotal = Math.round(
    waterScore * 0.35 +
    irrigScore * 0.25 +
    weatherScore * 0.20 +
    diseaseScore * 0.20
  );

  const finalScore = Math.max(0, Math.min(100, weightedTotal));

  // Determine Grade and Level
  let grade = 'B';
  let level = 'Good Sustainability';
  let rating = 'Good';

  if (finalScore >= 88) {
    grade = 'A';
    level = 'Optimal Sustainability';
    rating = 'Excellent';
  } else if (finalScore >= 75) {
    grade = 'B';
    level = 'Good Stewardship';
    rating = 'Good';
  } else if (finalScore >= 60) {
    grade = 'C';
    level = 'Moderate Efficiency';
    rating = 'Moderate';
  } else if (finalScore >= 45) {
    grade = 'D';
    level = 'Low Ecological Efficiency';
    rating = 'Fair';
  } else {
    grade = 'F';
    level = 'Critical Ecological Risk';
    rating = 'Needs Improvement';
  }

  const overallExplanation = isDelayed
    ? `High sustainability (${finalScore}/100) driven by weather-aware irrigation delay, saving water and energy ahead of natural rainfall.`
    : `Farm sustainability index is rated ${rating} (${finalScore}/100) based on water deficit balance, microclimate awareness, and crop protection.`;

  return {
    sustainabilityScore: finalScore,
    score: finalScore,
    totalScore: finalScore,
    grade,
    level,
    rating,
    summary: `Your farm achieves a Sustainability Index of ${finalScore}/100 (${level}, Grade ${grade}).`,
    explanation: overallExplanation,
    factors: [
      { name: 'Water Efficiency', score: waterScore, max: 100 },
      { name: 'Irrigation Efficiency', score: irrigScore, max: 100 },
      { name: 'Weather Awareness', score: weatherScore, max: 100 },
      { name: 'Disease Management', score: diseaseScore, max: 100 }
    ],
    breakdown: [
      { category: 'Water Efficiency', score: waterScore, max: 100, status: waterStatus },
      { category: 'Irrigation Efficiency', score: irrigScore, max: 100, status: irrigStatus },
      { category: 'Weather Awareness', score: weatherScore, max: 100, status: weatherStatus },
      { category: 'Disease Management', score: diseaseScore, max: 100, status: diseaseStatus }
    ],
    components: {
      waterEfficiency: {
        score: waterScore,
        status: waterStatus,
        weight: 0.35,
        explanation: waterExplanation
      },
      irrigationEfficiency: {
        score: irrigScore,
        status: irrigStatus,
        weight: 0.25,
        explanation: irrigExplanation
      },
      weatherAwareness: {
        score: weatherScore,
        status: weatherStatus,
        weight: 0.20,
        explanation: weatherExplanation
      },
      diseaseManagement: {
        score: diseaseScore,
        status: diseaseStatus,
        weight: 0.20,
        explanation: diseaseExplanation
      }
    },
    improvementSuggestions: suggestions,
    unavailableData
  };
}

module.exports = {
  calculateSustainabilityScore
};
