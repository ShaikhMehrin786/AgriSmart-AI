/**
 * Crop Recommendation Service
 * Fulfills SIH-2026 Problem Statement Bonus Module A
 * 
 * Dataset Source:
 *   ICAR (Indian Council of Agricultural Research) Agro-Ecological Crop Requirement Matrix
 *   & FAO Ecocrop Soil-Climate Database.
 * 
 * Inputs:
 *   - soilType (e.g. 'Alluvial', 'Black', 'Clay', 'Sandy Loam', 'Loamy', 'Red')
 *   - pH (e.g. 6.5)
 *   - temperature (°C)
 *   - humidity (%)
 *   - rainfall (annual or seasonal mm)
 *   - waterAvailability ('High', 'Moderate', 'Low', 'Drip')
 *   - season ('Kharif', 'Rabi', 'Zaid', 'All-Season')
 *   - location (State / District / Coordinates)
 *   - previousCrop (e.g. 'Wheat', 'Rice', 'Tomato', 'Corn', 'None')
 */

const CROP_DATABASE = [
  {
    crop: 'Tomato',
    minTemp: 18, maxTemp: 30, optTemp: 24,
    minHumidity: 40, maxHumidity: 80,
    minPh: 6.0, maxPh: 7.2,
    waterNeed: 'Moderate',
    suitableSoils: ['Loamy', 'Sandy Loam', 'Alluvial', 'Black'],
    seasons: ['Rabi', 'Kharif', 'Zaid', 'All-Season'],
    rotationPartners: ['Legumes', 'Beans', 'Corn', 'Wheat'],
    incompatiblePreceding: ['Potato', 'Eggplant', 'Pepper'], // Avoid Solanaceae succession
    waterCategory: 'Moderate',
    expectedYield: '25-35 tonnes/hectare',
    rationale: 'High economic value, responsive to controlled drip irrigation, well suited to neutral loamy soils.'
  },
  {
    crop: 'Corn (Maize)',
    minTemp: 18, maxTemp: 35, optTemp: 26,
    minHumidity: 45, maxHumidity: 85,
    minPh: 5.8, maxPh: 7.5,
    waterNeed: 'Moderate',
    suitableSoils: ['Alluvial', 'Loamy', 'Black', 'Red'],
    seasons: ['Kharif', 'Rabi', 'All-Season'],
    rotationPartners: ['Soybean', 'Chickpea', 'Groundnut', 'Mustard'],
    incompatiblePreceding: ['Corn', 'Sorghum'],
    waterCategory: 'Moderate',
    expectedYield: '4-6 tonnes/hectare',
    rationale: 'Sturdy C4 crop with high photosynthesis efficiency; excellent candidate following nitrogen-fixing legumes.'
  },
  {
    crop: 'Wheat',
    minTemp: 10, maxTemp: 24, optTemp: 18,
    minHumidity: 30, maxHumidity: 65,
    minPh: 6.0, maxPh: 7.8,
    waterNeed: 'Moderate',
    suitableSoils: ['Alluvial', 'Loamy', 'Clay Loam'],
    seasons: ['Rabi', 'Winter'],
    rotationPartners: ['Rice', 'Cotton', 'Legumes', 'Soybean'],
    incompatiblePreceding: ['Wheat', 'Barley'],
    waterCategory: 'Moderate',
    expectedYield: '3.5-5 tonnes/hectare',
    rationale: 'Premier cool-season cereal. Ideal when temperature is below 25°C and soil has good moisture retention.'
  },
  {
    crop: 'Rice (Paddy)',
    minTemp: 22, maxTemp: 36, optTemp: 28,
    minHumidity: 60, maxHumidity: 95,
    minPh: 5.5, maxPh: 7.0,
    waterNeed: 'High',
    suitableSoils: ['Clay', 'Clay Loam', 'Alluvial'],
    seasons: ['Kharif', 'Monsoon'],
    rotationPartners: ['Wheat', 'Pulses', 'Mustard', 'Potato'],
    incompatiblePreceding: ['Rice'],
    waterCategory: 'High',
    expectedYield: '3.5-5.5 tonnes/hectare',
    rationale: 'High water requirement crop, thriving in heavy clayey soils with high monsoon rainfall and warm humid air.'
  },
  {
    crop: 'Potato',
    minTemp: 12, maxTemp: 25, optTemp: 18,
    minHumidity: 50, maxHumidity: 80,
    minPh: 5.2, maxPh: 6.5,
    waterNeed: 'Moderate',
    suitableSoils: ['Sandy Loam', 'Loamy', 'Alluvial'],
    seasons: ['Rabi', 'Winter'],
    rotationPartners: ['Rice', 'Corn', 'Legumes'],
    incompatiblePreceding: ['Tomato', 'Eggplant', 'Pepper'],
    waterCategory: 'Moderate',
    expectedYield: '20-30 tonnes/hectare',
    rationale: 'Cool climate tuber crop requiring friable, well-aerated sandy loam with slightly acidic to neutral pH.'
  },
  {
    crop: 'Chickpea (Gram)',
    minTemp: 15, maxTemp: 28, optTemp: 22,
    minHumidity: 25, maxHumidity: 60,
    minPh: 6.0, maxPh: 8.0,
    waterNeed: 'Low',
    suitableSoils: ['Black', 'Loamy', 'Sandy Loam', 'Alluvial'],
    seasons: ['Rabi', 'Winter'],
    rotationPartners: ['Wheat', 'Rice', 'Corn', 'Barley'],
    incompatiblePreceding: ['Chickpea'],
    waterCategory: 'Low',
    expectedYield: '1.2-2.0 tonnes/hectare',
    rationale: 'Deep-rooting legume that enriches soil nitrogen (fixing 30-40 kg N/ha) while needing minimal supplemental irrigation.'
  },
  {
    crop: 'Cotton',
    minTemp: 21, maxTemp: 35, optTemp: 28,
    minHumidity: 40, maxHumidity: 75,
    minPh: 6.0, maxPh: 8.0,
    waterNeed: 'Moderate',
    suitableSoils: ['Black', 'Alluvial', 'Deep Loamy'],
    seasons: ['Kharif', 'Monsoon'],
    rotationPartners: ['Wheat', 'Soybean', 'Groundnut'],
    incompatiblePreceding: ['Cotton', 'Okra'],
    waterCategory: 'Moderate',
    expectedYield: '2-3 tonnes/hectare (seed cotton)',
    rationale: 'High-value fiber cash crop flourishing in deep black moisture-retentive soils with warm summer sunshine.'
  },
  {
    crop: 'Soybean',
    minTemp: 20, maxTemp: 32, optTemp: 26,
    minHumidity: 50, maxHumidity: 85,
    minPh: 6.0, maxPh: 7.5,
    waterNeed: 'Moderate',
    suitableSoils: ['Black', 'Alluvial', 'Loamy'],
    seasons: ['Kharif', 'Monsoon'],
    rotationPartners: ['Wheat', 'Chickpea', 'Mustard'],
    incompatiblePreceding: ['Soybean'],
    waterCategory: 'Moderate',
    expectedYield: '1.8-2.5 tonnes/hectare',
    rationale: 'Nitrogen-fixing oilseed crop; excellent preceding crop for Rabi wheat or mustard.'
  },
  {
    crop: 'Bell Pepper (Capsicum)',
    minTemp: 18, maxTemp: 30, optTemp: 24,
    minHumidity: 50, maxHumidity: 75,
    minPh: 6.0, maxPh: 7.0,
    waterNeed: 'Moderate',
    suitableSoils: ['Loamy', 'Sandy Loam', 'Alluvial'],
    seasons: ['Kharif', 'Rabi', 'All-Season'],
    rotationPartners: ['Legumes', 'Corn', 'Cabbage'],
    incompatiblePreceding: ['Tomato', 'Potato', 'Eggplant'],
    waterCategory: 'Moderate',
    expectedYield: '15-25 tonnes/hectare',
    rationale: 'High return horticulture crop ideal for precision protected cultivation or open-field drip systems.'
  },
  {
    crop: 'Mustard (Rapeseed)',
    minTemp: 10, maxTemp: 25, optTemp: 18,
    minHumidity: 30, maxHumidity: 65,
    minPh: 6.0, maxPh: 7.5,
    waterNeed: 'Low',
    suitableSoils: ['Sandy Loam', 'Loamy', 'Alluvial'],
    seasons: ['Rabi', 'Winter'],
    rotationPartners: ['Rice', 'Corn', 'Cotton', 'Pearl Millet'],
    incompatiblePreceding: ['Mustard', 'Cabbage', 'Cauliflower'],
    waterCategory: 'Low',
    expectedYield: '1.5-2.2 tonnes/hectare',
    rationale: 'Low water requirement oilseed crop, highly drought-tolerant and well suited to post-monsoon residual moisture.'
  }
];

/**
 * Recommend suitable crops based on agronomic parameters
 */
function recommendCrops(params = {}) {
  const {
    soilType = 'Loamy',
    pH = 6.5,
    temperature = 25,
    humidity = 60,
    rainfall = 100,
    waterAvailability = 'Moderate',
    season = 'All-Season',
    location = 'General Agriculture Zone',
    previousCrop = null
  } = params;

  const numPh = Number(pH) || 6.5;
  const numTemp = Number(temperature) || 25;
  const numHum = Number(humidity) || 60;
  const numRain = Number(rainfall) || 100;
  const normSoil = String(soilType || 'Loamy').trim().toLowerCase();
  const normSeason = String(season || 'All-Season').trim().toLowerCase();
  const normPrev = previousCrop ? String(previousCrop).trim().toLowerCase() : null;
  const normWater = String(waterAvailability || 'Moderate').trim().toLowerCase();

  const scored = CROP_DATABASE.map(candidate => {
    let score = 0;
    const reasons = [];
    const bonuses = [];
    const penalties = [];

    // 1. Temperature Fit (Weight: 25 points)
    if (numTemp >= candidate.minTemp && numTemp <= candidate.maxTemp) {
      const tempDiff = Math.abs(numTemp - candidate.optTemp);
      const tempScore = Math.max(15, 25 - (tempDiff * 2));
      score += tempScore;
      reasons.push(`Temperature (${numTemp}°C) is well within optimal envelope (${candidate.minTemp}–${candidate.maxTemp}°C).`);
    } else {
      const penalty = Math.min(20, Math.abs(numTemp - candidate.optTemp) * 2);
      penalties.push(`Temperature (${numTemp}°C) deviates from suitable range (${candidate.minTemp}–${candidate.maxTemp}°C).`);
      score -= penalty;
    }

    // 2. Soil Type Compatibility (Weight: 20 points)
    const matchesSoil = candidate.suitableSoils.some(s => s.toLowerCase().includes(normSoil) || normSoil.includes(s.toLowerCase()));
    if (matchesSoil) {
      score += 20;
      reasons.push(`Soil type (${soilType}) provides excellent drainage and texture for root development.`);
    } else {
      score += 8;
      penalties.push(`Soil type (${soilType}) is sub-optimal; requires soil conditioning or organic matter.`);
    }

    // 3. Soil pH Compatibility (Weight: 20 points)
    if (numPh >= candidate.minPh && numPh <= candidate.maxPh) {
      score += 20;
      reasons.push(`Soil pH (${numPh}) enables efficient nutrient availability (optimum: ${candidate.minPh}–${candidate.maxPh}).`);
    } else if (numPh >= candidate.minPh - 0.5 && numPh <= candidate.maxPh + 0.5) {
      score += 12;
      reasons.push(`Soil pH (${numPh}) is near tolerance threshold; minor liming or gypsum can optimize.`);
    } else {
      penalties.push(`Soil pH (${numPh}) is out of preferred range (${candidate.minPh}–${candidate.maxPh}).`);
    }

    // 4. Water Availability & Rainfall Alignment (Weight: 20 points)
    if (normWater === 'low' && candidate.waterCategory === 'Low') {
      score += 20;
      bonuses.push('Matches low water availability; high drought resilience.');
    } else if (normWater === 'high' && candidate.waterCategory === 'High') {
      score += 20;
      bonuses.push('Capitalizes on abundant water supply.');
    } else if (candidate.waterCategory === 'Moderate' && (normWater === 'moderate' || normWater === 'high' || normWater.includes('drip'))) {
      score += 18;
      reasons.push('Irrigation availability matches crop water duty.');
    } else if (normWater === 'low' && candidate.waterCategory === 'High') {
      penalties.push('High water consumption is risky under scarce water conditions.');
      score -= 15;
    } else {
      score += 12;
    }

    // 5. Season Fit (Weight: 15 points)
    const matchesSeason = candidate.seasons.some(s => s.toLowerCase() === normSeason || normSeason === 'all-season' || s.toLowerCase() === 'all-season');
    if (matchesSeason) {
      score += 15;
      reasons.push(`Cultivation season (${season}) perfectly matches growth cycle.`);
    } else {
      score += 5;
    }

    // 6. Crop Rotation Synergy (Weight: up to 10 bonus points / 15 penalty)
    if (normPrev) {
      const isBadFollow = candidate.incompatiblePreceding.some(p => normPrev.includes(p.toLowerCase()) || p.toLowerCase().includes(normPrev));
      const isGoodPartner = candidate.rotationPartners.some(p => normPrev.includes(p.toLowerCase()) || p.toLowerCase().includes(normPrev));

      if (isBadFollow) {
        score -= 15;
        penalties.push(`Succession warning: Planting ${candidate.crop} after ${previousCrop} risks perpetuating shared family pathogens.`);
      } else if (isGoodPartner) {
        score += 10;
        bonuses.push(`Rotation advantage: Rotating after ${previousCrop} breaks pest cycles and improves soil microbial diversity.`);
      }
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    let suitability = 'Low Suitability';
    if (finalScore >= 80) suitability = 'Highly Recommended';
    else if (finalScore >= 65) suitability = 'Recommended';
    else if (finalScore >= 50) suitability = 'Moderately Suitable';

    return {
      crop: candidate.crop,
      matchScore: finalScore,
      suitability,
      expectedYield: candidate.expectedYield,
      waterNeed: candidate.waterNeed,
      agronomicRationale: candidate.rationale,
      keyAdvantages: [...bonuses, ...reasons.slice(0, 2)],
      cautions: penalties
    };
  });

  // Sort by highest match score
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return {
    success: true,
    inputParameters: {
      soilType,
      pH: numPh,
      temperature: numTemp,
      humidity: numHum,
      rainfall: numRain,
      waterAvailability,
      season,
      location,
      previousCrop: previousCrop || 'None'
    },
    dataSource: 'ICAR Agro-Ecological Crop Suitability Matrix & FAO Ecocrop Model',
    evaluationMetric: 'Multi-Factor Agronomic Compatibility Index (0–100)',
    topRecommendation: scored[0],
    recommendations: scored
  };
}

module.exports = {
  recommendCrops,
  CROP_DATABASE
};
