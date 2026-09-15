/**
 * Agentic Autonomous Advisor Service
 * Fulfills SIH-2026 Problem Statement Bonus Module G
 * 
 * Implements the Autonomous Sense-Reason-Decide-Act Feedback Loop:
 *   [PERCEIVE] -> [ANALYZE] -> [REASON] -> [DECIDE] -> [NOTIFY]
 */

const { evaluateIrrigation } = require('./irrigationService');
const { getWeatherData, calculatePathogenRisk } = require('./weatherService');
const { getDiseaseMonograph } = require('./diseaseService');
const { calculateSustainabilityScore } = require('./sustainabilityService');
const { generateSimulatedTelemetry } = require('./iotService');

/**
 * Execute an autonomous agent reasoning cycle for a farmer's crop field
 */
async function runAutonomousAdvisoryCycle(input = {}) {
  const {
    crop = 'Tomato',
    disease = 'Tomato Early Blight',
    confidence = 0.91,
    lat = null,
    lon = null,
    iotTelemetry = null,
    language = 'en'
  } = input;

  const cycleId = `CYCLE-${Date.now()}`;
  const timestamp = new Date().toISOString();

  // -------------------------------------------------------------
  // STEP 1: PERCEIVE (Ingest Multimodal Telemetry & Visual Diagnosis)
  // -------------------------------------------------------------
  const weather = await getWeatherData(lat, lon);
  const sensorData = iotTelemetry || generateSimulatedTelemetry({ crop, weather }).telemetry;
  const soilMoisture = sensorData.soilMoisture.value;
  const soilPh = sensorData.pH?.value || 6.5;

  const perceptionState = {
    crop,
    diagnosis: {
      disease,
      confidence: Math.round(confidence * 100) + '%',
      pathogenDetected: !disease.toLowerCase().includes('healthy')
    },
    weatherTelemetry: {
      temperature: weather.temperature + '°C',
      humidity: weather.humidity + '%',
      rainProbability: weather.rainProbability + '%',
      forecastCondition: weather.condition
    },
    soilTelemetry: {
      moisture: soilMoisture + '%',
      pH: soilPh,
      status: sensorData.soilMoisture.status
    }
  };

  // -------------------------------------------------------------
  // STEP 2: ANALYZE (Multi-Domain Algorithmic Processing)
  // -------------------------------------------------------------
  const pathogenRisk = calculatePathogenRisk(disease, weather);
  const irrigationEvaluation = evaluateIrrigation(crop, soilMoisture, weather, {
    soilType: 'Loamy',
    stage: 'Vegetative',
    area: 1.0
  });
  const sustainabilityAudit = calculateSustainabilityScore({
    crop,
    soilMoisture,
    weather,
    irrigationAction: irrigationEvaluation.action
  });
  const monograph = getDiseaseMonograph(disease, crop);

  // -------------------------------------------------------------
  // STEP 3: REASON (Agronomic Rule Engine & Conflict Resolution)
  // -------------------------------------------------------------
  const reasoningTrail = [];
  const conflictingSignalsResolved = [];

  // Check Conflict: High Rain Probability vs. Foliar Spraying
  if (weather.rainProbability >= 50) {
    reasoningTrail.push(`Precipitation probability is elevated (${weather.rainProbability}%). Applying liquid foliar spray now would lead to immediate chemical wash-off and waterway runoff.`);
    conflictingSignalsResolved.push({
      conflict: 'Active fungal disease requires treatment, but impending rain will wash off foliar sprays.',
      resolution: 'Preemptively postpone foliar chemical sprays until dry window; prioritize cultural sanitation and pruning immediately.'
    });
  }

  // Check Conflict: Low Soil Moisture vs. Rain Forecast
  if (soilMoisture < 35 && weather.rainProbability >= 60) {
    conflictingSignalsResolved.push({
      conflict: 'Soil moisture is low, but natural rainfall is forecasted within next 24 hours.',
      resolution: 'Withhold artificial drip irrigation to harness rainwater naturally and preserve sustainability index.'
    });
  } else if (irrigationEvaluation.urgency === 'High' || irrigationEvaluation.urgency === 'Urgent') {
    reasoningTrail.push(`Root-zone soil moisture is ${soilMoisture}%; active transpiration demands scheduled drip replenishment.`);
  }

  // Pathogen Risk Reasoning
  if (pathogenRisk.riskLevel === 'CRITICAL' || pathogenRisk.riskLevel === 'HIGH') {
    reasoningTrail.push(`Microclimate humidity (${weather.humidity}%) matches ${disease} spore germination envelope; high urgency pathogen containment required.`);
  }

  // -------------------------------------------------------------
  // STEP 4: DECIDE (Authoritative Multi-Action Synthesis)
  // -------------------------------------------------------------
  const primaryDecision = {
    irrigationAction: irrigationEvaluation.action,
    irrigationUrgency: irrigationEvaluation.urgency,
    diseaseIntervention: weather.rainProbability >= 50
      ? 'HOLD SPRAY: Rain imminent. Prune affected lower leaves only.'
      : (monograph.found ? monograph.scoutingProtocol : 'Apply targeted organic neem spray and scout canopy.'),
    pathogenRiskLevel: pathogenRisk.riskLevel,
    sustainabilityGrade: sustainabilityAudit.grade
  };

  // -------------------------------------------------------------
  // STEP 5: NOTIFY (Farmer Actionable Dispatch & Regional Language)
  // -------------------------------------------------------------
  const notificationTitle = `AgriSmart Autonomous Alert: ${crop} Action Plan`;
  const notificationMessageEn = `[Automated Decision]: ${primaryDecision.irrigationAction}. ${primaryDecision.diseaseIntervention} (Risk: ${primaryDecision.pathogenRiskLevel}, Sustainability: Grade ${primaryDecision.sustainabilityGrade}).`;
  
  const notificationMessageHi = `[स्वचालित निर्णय]: ${crop} के लिए ${weather.rainProbability >= 50 ? 'बारिश के कारण स्प्रे टालें और सिंचाई रोकें।' : 'सिंचाई और रोग प्रबंधन के निर्देश जारी किए गए हैं।'} (रोग जोखिम: ${primaryDecision.pathogenRiskLevel})`;

  return {
    success: true,
    cycleId,
    timestamp,
    executionLoop: {
      step1_Perceive: perceptionState,
      step2_Analyze: {
        pathogenRisk: pathogenRisk.riskLevel,
        evapotranspirationStatus: irrigationEvaluation.waterRequired,
        sustainabilityScore: sustainabilityAudit.score
      },
      step3_Reason: {
        reasoningTrail,
        conflictResolutions: conflictingSignalsResolved
      },
      step4_Decide: primaryDecision,
      step5_Notify: {
        priority: primaryDecision.pathogenRiskLevel === 'CRITICAL' ? 'URGENT' : 'NORMAL',
        title: notificationTitle,
        dispatches: {
          en: notificationMessageEn,
          hi: notificationMessageHi
        },
        immediateFarmerActions: monograph.found ? [
          monograph.scoutingProtocol,
          'Inspect leaf undersides within 24 hours.',
          primaryDecision.irrigationAction
        ] : [
          'Scout crop canopy and verify soil moisture.',
          primaryDecision.irrigationAction
        ]
      }
    }
  };
}

module.exports = {
  runAutonomousAdvisoryCycle
};
