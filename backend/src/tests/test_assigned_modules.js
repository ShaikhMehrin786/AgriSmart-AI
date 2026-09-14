// Comprehensive Automated Test Suite for Member 5 Assigned Modules:
// 1. Weather Module (weatherService.js)
// 2. Smart Irrigation Module (irrigationService.js)
// 3. Recommendation Engine Module (recommendationService.js)
// 4. Sustainability Index Calculator (sustainabilityService.js)
// 5. Grounded GenAI Agronomist (genAiService.js)
// 6. Disease Monograph Knowledge Base (diseaseService.js)

const assert = require('assert');
process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const { getWeatherData, calculatePathogenRisk } = require('../services/weatherService');
const { evaluateIrrigation } = require('../services/irrigationService');
const { generateRecommendations } = require('../services/recommendationService');
const { calculateSustainabilityScore } = require('../services/sustainabilityService');
const { answerFarmerQuery } = require('../services/genAiService');
const { getDiseaseMonograph, getAllDiseases, getSupportedCrops } = require('../services/diseaseService');

async function runAllTests() {
  console.log('====================================================');
  console.log(' RUNNING INTEGRATION & UNIT TEST SUITE FOR MODULES ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function it(description, fn) {
    try {
      fn();
      console.log(`  [PASS] ${description}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${description}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  }

  async function itAsync(description, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${description}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${description}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // SUITE 1: WEATHER MODULE
  // -------------------------------------------------------------
  console.log('--- SUITE 1: WEATHER MODULE ---');

  await itAsync('getWeatherData returns valid structure and precipitation probability', async () => {
    const weather = await getWeatherData(18.5204, 73.8567);
    assert(weather, 'Weather object should not be null');
    assert.strictEqual(typeof weather.temperature, 'number');
    assert.strictEqual(typeof weather.humidity, 'number');
    assert.strictEqual(typeof weather.rainProbability, 'number');
    assert(weather.rainProbability >= 0 && weather.rainProbability <= 100, 'rainProbability should be 0-100%');
    assert(weather.forecast && Array.isArray(weather.forecast), 'forecast must be an array');
    assert.strictEqual(weather.forecast.length, 5, 'forecast must contain 5 days');
    assert(weather.pathogenRisk, 'pathogenRisk must be calculated');
  });

  it('calculatePathogenRisk outputs CRITICAL risk under high humidity + warm temp + rain', () => {
    const weather = { temperature: 24, humidity: 82, rainProbability: 65 };
    const risk = calculatePathogenRisk('Tomato Early Blight', weather);
    assert.strictEqual(risk.riskScore, 1);
    assert.strictEqual(risk.riskLevel, 'CRITICAL OUTBREAK WARNING');
    assert(risk.alertMessage.includes('Severe threat'));
  });

  it('calculatePathogenRisk outputs LOW risk under dry and cool conditions', () => {
    const weather = { temperature: 15, humidity: 40, rainProbability: 10 };
    const risk = calculatePathogenRisk('General Pathogen', weather);
    assert(risk.riskScore < 0.50);
    assert.strictEqual(risk.riskLevel, 'LOW');
  });

  // -------------------------------------------------------------
  // SUITE 2: SMART IRRIGATION MODULE
  // -------------------------------------------------------------
  console.log('\n--- SUITE 2: SMART IRRIGATION MODULE ---');

  it('evaluateIrrigation delays irrigation on imminent rainfall with sufficient soil moisture', () => {
    const weather = { temperature: 26, humidity: 80, rainProbability: 70 };
    const res = evaluateIrrigation('Tomato', 45, weather, { stage: 'Vegetative', soilType: 'Loamy', area: 2 });
    assert.strictEqual(res.action, 'Delay Irrigation');
    assert.strictEqual(res.urgency, 'Preventative');
    assert.strictEqual(res.waterRequired, '0 L/m²');
    assert.strictEqual(res.waterVolumeTotal, '0 m³');
  });

  it('evaluateIrrigation urges urgent irrigation when soil moisture is critically low and rain is low', () => {
    const weather = { temperature: 32, humidity: 30, rainProbability: 10 };
    const res = evaluateIrrigation('Tomato', 12, weather, { stage: 'Fruiting', soilType: 'Sandy', area: 1 });
    assert.strictEqual(res.action, 'Irrigate Urgently');
    assert.strictEqual(res.urgency, 'Urgent');
    assert(parseFloat(res.waterRequired) > 0, 'waterRequired must be positive');
  });

  it('evaluateIrrigation limits evening watering during hot humid conditions to stop fungi', () => {
    const weather = { temperature: 30, humidity: 90, rainProbability: 20 };
    const res = evaluateIrrigation('Tomato', 55, weather, { stage: 'Vegetative', soilType: 'Loamy', area: 1 });
    assert.strictEqual(res.action, 'Limit Evening Watering');
    assert.strictEqual(res.urgency, 'Preventative');
  });

  // -------------------------------------------------------------
  // SUITE 3: CRITICAL TEST CASE & SINGLE SOURCE OF TRUTH
  // -------------------------------------------------------------
  console.log('\n--- SUITE 3: CRITICAL TEST CASE & SINGLE SOURCE OF TRUTH ---');

  await itAsync('recommendationService irrigation strictly reflects irrigationService output', async () => {
    const testWeather = {
      temperature: 24,
      humidity: 82,
      rainProbability: 65,
      condition: 'Rainy',
      location: 'Pune Experimental Station'
    };

    const irrigationResult = evaluateIrrigation('Tomato', 18, testWeather, {
      stage: 'Vegetative',
      soilType: 'Loamy',
      area: 1
    });

    const recResult = await generateRecommendations({
      crop: 'Tomato',
      disease: 'Tomato Early Blight',
      soilMoisture: 18,
      stage: 'Vegetative',
      soilType: 'Loamy',
      area: 1,
      weather: testWeather
    });

    // 1. Verify Top-Level Irrigation Object in Recommendation Result
    assert(recResult.irrigation, 'recResult must have top-level irrigation object');
    assert.strictEqual(recResult.irrigation.action, irrigationResult.action, 'Top-level action must strictly match irrigationService');
    assert.strictEqual(recResult.irrigation.urgency, irrigationResult.urgency, 'Top-level urgency must strictly match irrigationService');
    assert.strictEqual(recResult.irrigation.waterRequired, irrigationResult.waterRequired, 'Top-level waterRequired must strictly match');
    assert.strictEqual(recResult.irrigation.waterVolumeTotal, irrigationResult.waterVolumeTotal, 'Top-level waterVolumeTotal must strictly match');

    // 2. Verify Recommendations Array Item for Irrigation
    const irrigationRecItem = recResult.recommendations.find(r => r.type === 'IRRIGATION');
    assert(irrigationRecItem, 'recommendations array must contain an IRRIGATION item');
    assert.strictEqual(irrigationRecItem.title, irrigationResult.action, 'Irrigation recommendation title must equal irrigationService action');
    assert.strictEqual(irrigationRecItem.reason, irrigationResult.reason, 'Irrigation recommendation reason must equal irrigationService reason');

    // 3. Verify Disease Proliferation & Chemical Spray Advisory Rules
    const diseaseRecItem = recResult.recommendations.find(r => r.type === 'DISEASE');
    assert(diseaseRecItem, 'recommendations array must contain a DISEASE item');
    assert(diseaseRecItem.priority === 'CRITICAL' || diseaseRecItem.priority === 'HIGH', 'Disease priority should be high or critical');
    assert(diseaseRecItem.reason.includes('Tomato Early Blight'));

    const chemicalRecItem = recResult.recommendations.find(r => r.type === 'CHEMICAL_SAFETY');
    assert(chemicalRecItem, 'recommendations array must contain a CHEMICAL_SAFETY item due to rainProb >= 50%');
    assert.strictEqual(chemicalRecItem.priority, 'HIGH');
    assert(chemicalRecItem.title.includes('Avoid foliar spray applications'));

    // 4. Verify Overall Risk Level
    assert.strictEqual(recResult.riskLevel, 'CRITICAL', 'Overall risk level must be CRITICAL due to outbreak alert');

    // 5. Verify Attached Monograph and Sustainability Index
    assert(recResult.sustainability, 'recResult must attach sustainability index');
    assert(recResult.diseaseMonograph, 'recResult must attach verified disease monograph');
    assert.strictEqual(recResult.diseaseMonograph.diseaseName, 'Tomato Early Blight');
    assert(recResult.diseaseMonograph.organicRemedy.includes('Neem oil') || recResult.diseaseMonograph.organicRemedy.includes('Trichoderma'));
  });

  // -------------------------------------------------------------
  // SUITE 4: RECOMMENDATION ENGINE EDGE CASES
  // -------------------------------------------------------------
  console.log('\n--- SUITE 4: RECOMMENDATION ENGINE EDGE CASES ---');

  await itAsync('generateRecommendations handles healthy plant with moderate weather', async () => {
    const recResult = await generateRecommendations({
      crop: 'Tomato',
      disease: 'Tomato healthy',
      soilMoisture: 45,
      weather: { temperature: 22, humidity: 55, rainProbability: 15, condition: 'Clear' }
    });

    assert.strictEqual(recResult.riskLevel, 'LOW');
    const diseaseItem = recResult.recommendations.find(r => r.type === 'GENERAL_CARE');
    assert(diseaseItem, 'Healthy plant should yield GENERAL_CARE recommendation');
    assert(recResult.sustainability.score >= 80, 'Healthy plant with optimal moisture must have high sustainability');
  });

  await itAsync('generateRecommendations handles missing soil moisture gracefully', async () => {
    const recResult = await generateRecommendations({
      crop: 'Corn',
      disease: null,
      soilMoisture: null,
      weather: { temperature: 28, humidity: 60, rainProbability: 65, condition: 'Rain' }
    });

    assert.strictEqual(recResult.irrigation, null, 'irrigation object should be null when soil moisture is null');
    const rainHoldItem = recResult.recommendations.find(r => r.type === 'IRRIGATION');
    assert(rainHoldItem, 'Should synthesize weather-based irrigation advisory when rain is forecasted');
    assert.strictEqual(rainHoldItem.title, 'Hold scheduled irrigation');
  });

  // -------------------------------------------------------------
  // SUITE 5: DETERMINISTIC SUSTAINABILITY INDEX CALCULATOR
  // -------------------------------------------------------------
  console.log('\n--- SUITE 5: SUSTAINABILITY INDEX CALCULATOR ---');

  it('calculateSustainabilityScore awards high score (Grade A) when rain is avoided & moisture is optimal', () => {
    const res = calculateSustainabilityScore({
      crop: 'Tomato',
      soilMoisture: 45,
      weather: { temperature: 24, humidity: 70, rainProbability: 65, condition: 'Rain' },
      irrigation: { action: 'Delay Irrigation', waterRequired: '0 L/m²' },
      disease: 'Tomato Early Blight'
    });

    assert(res.sustainabilityScore >= 85, `Score should be >=85, got ${res.sustainabilityScore}`);
    assert.strictEqual(res.grade, 'A');
    assert(res.breakdown.length === 4, 'Must have 4 breakdown categories');
    assert(res.components.irrigationEfficiency.score >= 90, 'Irrigation efficiency should be high for delaying ahead of rain');
    assert(res.improvementSuggestions.length > 0, 'Should return improvement suggestions');
  });

  it('calculateSustainabilityScore penalizes over-watering risk before imminent rain', () => {
    const res = calculateSustainabilityScore({
      crop: 'Tomato',
      soilMoisture: 72, // over-saturated
      weather: { temperature: 24, humidity: 85, rainProbability: 70, condition: 'Rain' },
      irrigation: { action: 'Irrigate Urgently', waterRequired: '25 L/m²' },
      disease: 'Tomato Late Blight'
    });

    assert(res.sustainabilityScore < 70, `Score should be penalized, got ${res.sustainabilityScore}`);
    assert(res.components.waterEfficiency.score <= 60, 'Water efficiency must reflect saturation risk');
    assert(res.components.irrigationEfficiency.score <= 50, 'Irrigation efficiency must reflect over-watering penalty');
  });

  it('calculateSustainabilityScore handles missing optional inputs and records unavailableData', () => {
    const res = calculateSustainabilityScore({
      crop: 'Potato'
    });

    assert(typeof res.sustainabilityScore === 'number');
    assert(res.sustainabilityScore >= 0 && res.sustainabilityScore <= 100);
    assert(res.unavailableData.includes('soilMoisture'), 'soilMoisture must be recorded as unavailable');
    assert(res.unavailableData.includes('diseaseDiagnosis'), 'diseaseDiagnosis must be recorded as unavailable');
    assert(res.factors.length === 4, 'Factors array must still exist for UI rendering');
  });

  it('calculateSustainabilityScore is 100% deterministic (repeatable outputs)', () => {
    const input = {
      crop: 'Tomato',
      soilMoisture: 38,
      weather: { temperature: 26, humidity: 62, rainProbability: 25 },
      irrigation: { action: 'Maintain Regular Schedule', waterRequired: '10 L/m²' },
      disease: 'Tomato Early Blight'
    };
    const run1 = calculateSustainabilityScore(input);
    const run2 = calculateSustainabilityScore(input);
    assert.strictEqual(run1.sustainabilityScore, run2.sustainabilityScore, 'Scores must be identical');
    assert.strictEqual(run1.grade, run2.grade, 'Grades must be identical');
  });

  // -------------------------------------------------------------
  // SUITE 6: GROUNDED GENAI AGRONOMIST
  // -------------------------------------------------------------
  console.log('\n--- SUITE 6: GROUNDED GENAI AGRONOMIST ---');

  await itAsync('answerFarmerQuery preserves deterministic irrigation decision without override', async () => {
    const res = await answerFarmerQuery({
      question: 'Should I irrigate my tomato crops today?',
      diagnosisContext: { crop: 'Tomato', disease: 'Tomato Early Blight', confidence: 92 },
      weatherContext: { temperature: 25, humidity: 82, rainProbability: 75, condition: 'Rain' },
      irrigationContext: { action: 'Delay Irrigation', waterRequired: '0 L/m²' }
    });

    assert(res.isGrounded, 'Response must be marked as grounded');
    assert.strictEqual(res.groundedContext.irrigationDecision, 'Delay Irrigation');
    assert(res.irrigationAdvice.includes('Postpone irrigation') || res.irrigationAdvice.includes('Delay'));
    assert(res.warnings.some(w => w.includes('Rain forecast') || w.includes('NOT spray')), 'Must warn against spraying during rain');
    assert(res.reply && res.reply.length > 20, 'Must provide full conversational reply');
  });

  await itAsync('answerFarmerQuery returns structured guidance on pest / disease inquiry', async () => {
    const res = await answerFarmerQuery({
      question: 'What medicine or spray should I use for Early Blight?',
      diagnosisContext: { crop: 'Tomato', disease: 'Tomato Early Blight', confidence: 95 },
      weatherContext: { temperature: 24, humidity: 55, rainProbability: 10, condition: 'Clear' },
      irrigationContext: { action: 'Maintain Regular Schedule', waterRequired: '12 L/m²' }
    });

    assert(res.diseaseManagement, 'Must provide disease management object');
    assert(res.diseaseManagement.organicRemedy.includes('Neem oil') || res.diseaseManagement.organicRemedy.includes('Trichoderma'));
    assert(res.immediateActions.length > 0, 'Must provide immediate actions');
  });

  await itAsync('answerFarmerQuery generates vernacular Hinglish guidance when queried in Hindi', async () => {
    const res = await answerFarmerQuery({
      question: 'Kya main aaj spray karun ya pani du?',
      diagnosisContext: { crop: 'Tomato', disease: 'Tomato Early Blight' },
      weatherContext: { temperature: 24, humidity: 85, rainProbability: 70 },
      irrigationContext: { action: 'Delay Irrigation' }
    });

    const rep = res.reply.toLowerCase();
    const isVernacular = res.reply.includes('सलाह') || res.reply.includes('स्प्रे') || res.reply.includes('सिंचाई') ||
      rep.includes('spray') || rep.includes('pani') || rep.includes('barish') || rep.includes('mat') || rep.includes('karein') || rep.includes('nahi');
    assert(isVernacular, 'Should return Hindi/Hinglish response');
  });

  // -------------------------------------------------------------
  // SUITE 7: DISEASE-SPECIFIC AGRONOMIC MONOGRAPHS
  // -------------------------------------------------------------
  console.log('\n--- SUITE 7: DISEASE MONOGRAPHS ---');

  it('getDiseaseMonograph retrieves verified data for Tomato Early Blight', () => {
    const mono = getDiseaseMonograph('Tomato Early Blight');
    assert(mono.found, 'Monograph must be found');
    assert.strictEqual(mono.crop, 'Tomato');
    assert.strictEqual(mono.scientificName, 'Alternaria solani');
    assert(mono.symptoms.includes('Concentric dark brown rings'));
    assert(mono.organicRemedy.includes('Neem oil'));
    assert(mono.chemicalControl.includes('Mancozeb'));
  });

  it('getDiseaseMonograph retrieves verified data for Potato Late Blight', () => {
    const mono = getDiseaseMonograph('Potato Late Blight', 'Potato');
    assert(mono.found, 'Monograph must be found');
    assert.strictEqual(mono.severityDefault, 'Critical');
    assert(mono.chemicalControl.includes('Cymoxanil') || mono.chemicalControl.includes('Mancozeb'));
  });

  it('getDiseaseMonograph provides safe IPM fallback for uncatalogued disease', () => {
    const mono = getDiseaseMonograph('Unknown Exotic Wilt', 'Eggplant');
    assert.strictEqual(mono.found, false);
    assert(mono.prevention.includes('Maintain balanced fertilization'));
    assert(mono.organicRemedy.includes('Neem oil'));
  });

  it('getAllDiseases filters by crop correctly', () => {
    const tomatoes = getAllDiseases({ crop: 'Tomato' });
    assert(tomatoes.length >= 2, 'Should return at least 2 tomato monographs');
    tomatoes.forEach(d => assert.strictEqual(d.crop, 'Tomato'));
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(` TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
