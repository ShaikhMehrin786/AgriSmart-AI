// Comprehensive Automated Test Suite for Member 5 Assigned Modules:
// 1. Weather Module (weatherService.js)
// 2. Smart Irrigation Module (irrigationService.js)
// 3. Recommendation Engine Module (recommendationService.js)

const assert = require('assert');
const { getWeatherData, calculatePathogenRisk } = require('../services/weatherService');
const { evaluateIrrigation, calculateSustainabilityScore } = require('../services/irrigationService');
const { generateRecommendations } = require('../services/recommendationService');

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
  // SUITE 3: CRITICAL TEST CASE (USER SPECIFIED)
  // Crop: Tomato, Disease: Tomato Early Blight, Soil moisture: 18%, Temp: 24°C, Humidity: 82%, Rain prob: 65%
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
