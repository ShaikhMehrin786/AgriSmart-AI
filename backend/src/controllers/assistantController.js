// Grounded AI Agronomist Assistant Controller
// Connects farmer inquiries with verified agronomic monographs, live weather, and deterministic irrigation

const prisma = require('../config/database');
const { answerFarmerQuery, resolveConfidenceMeta, resolveDiagnosticState } = require('../services/genAiService');
const { getDiseaseKnowledge } = require('../data/diseaseKnowledgeBase');
const { getWeatherData } = require('../services/weatherService');
const { evaluateIrrigation } = require('../services/irrigationService');

const chat = async (req, res) => {
  try {
    const userMessage = req.body.message || req.body.question;
    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid natural language message or question is required.'
      });
    }

    const {
      language = 'en',
      predictionId,
      prediction,
      lat,
      lon
    } = req.body;

    // 1. Resolve Diagnosis Context from Payload or Database
    let diagnosisContext = prediction || req.body.diagnosisContext || null;
    let predictionRecord = prediction || null;

    if (!diagnosisContext && req.user?.id) {
      try {
        predictionRecord = predictionId
          ? await prisma.prediction.findFirst({ where: { id: predictionId, userId: req.user.id } })
          : await prisma.prediction.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });

        if (predictionRecord) {
          const diseaseName = predictionRecord.disease || predictionRecord.predictedClass;
          const kb = getDiseaseKnowledge(diseaseName);
          const confMeta = resolveConfidenceMeta(predictionRecord.confidence);
          const diagnosticState = resolveDiagnosticState(diseaseName, kb.isHealthy, kb);

          if (diagnosticState === 'HEALTHY') {
            diagnosisContext = {
              crop: predictionRecord.crop || kb.crop,
              disease: diseaseName || kb.disease,
              diagnosticState: 'HEALTHY',
              confidence: confMeta.percent,
              confidenceLevel: confMeta.level,
              isUncertain: confMeta.isUncertain,
              isHealthy: true,
              severity: 'None',
              visualSymptoms: kb.visualSymptoms,
              monitoringGuidance: kb.monitoringGuidance,
              preventiveCropCare: kb.preventiveCropCare,
              irrigationGuidance: kb.irrigationGuidance,
              imageQualityGuidance: kb.imageQualityGuidance,
              organicManagement: null,
              chemicalManagement: null,
              immediateActions: ['Continue regular field scouting and visual monitoring.']
            };
          } else {
            diagnosisContext = {
              crop: predictionRecord.crop || kb.crop,
              disease: diseaseName || kb.disease,
              diagnosticState: 'DISEASE',
              confidence: confMeta.percent,
              confidenceLevel: confMeta.level,
              isUncertain: confMeta.isUncertain,
              isHealthy: false,
              severity: predictionRecord.severity || 'Moderate',
              pathogenType: kb.pathogenType,
              visualSymptoms: kb.visualSymptoms,
              immediateActions: kb.immediateActions,
              organicManagement: kb.organicManagement,
              chemicalManagement: kb.chemicalManagement,
              prevention: kb.prevention,
              likelyCauses: kb.likelyCauses,
              irrigationGuidance: kb.irrigationConsiderations || kb.irrigationGuidance,
              imageQualityGuidance: kb.imageQualityGuidance
            };
          }
        }
      } catch (dbErr) {
        console.warn('Database diagnosis retrieval warning:', dbErr.message);
      }
    }

    // 2. Resolve Real-Time Weather Context
    let weatherContext = req.body.weather || null;
    if (!weatherContext || weatherContext.temperature === undefined) {
      try {
        weatherContext = await getWeatherData(lat || req.body.lat, lon || req.body.lon);
      } catch (wErr) {
        console.warn('Weather telemetry unavailable for assistant chat, using fallback:', wErr.message);
        weatherContext = {
          temperature: 25,
          humidity: 60,
          rainProbability: 20,
          condition: 'Clear'
        };
      }
    }

    // 3. Resolve Irrigation Context
    let irrigationContext = req.body.irrigation || null;
    if (!irrigationContext) {
      const crop = diagnosisContext?.crop || 'Tomato';
      const soilMoisture = req.body.soilMoisture !== undefined ? Number(req.body.soilMoisture) : 40;
      try {
        irrigationContext = evaluateIrrigation(crop, soilMoisture, weatherContext);
      } catch (irrigErr) {
        irrigationContext = {
          action: 'Maintain Regular Schedule',
          urgency: 'Normal',
          waterRequired: 'Standard irrigation volume'
        };
      }
    }

    // 4. Call Grounded GenAI Service with Conversation History & State
    const history = Array.isArray(req.body.history) ? req.body.history : (Array.isArray(req.body.conversationHistory) ? req.body.conversationHistory : []);
    const result = await answerFarmerQuery({
      question: userMessage.trim(),
      history,
      diagnosisContext,
      weatherContext,
      irrigationContext,
      sustainabilityContext: req.body.sustainability || null,
      recommendations: req.body.recommendations || [],
      language
    });

    res.json({
      success: true,
      data: {
        ...result,
        reply: result.answer || result.reply,
        answer: result.answer || result.reply,
        source: result.modelUsed || result.source || 'gemini',
        contextual: Boolean(result.contextual && result.groundedContext),
        groundedContext: result.groundedContext || null,
        conversationState: result.conversationState || null,
        diagnosisContext: (result.contextual && result.groundedContext?.disease) ? {
          crop: result.groundedContext?.crop || diagnosisContext?.crop,
          disease: result.groundedContext?.disease || diagnosisContext?.disease,
          confidence: diagnosisContext?.confidence
        } : null
      }
    });
  } catch (error) {
    console.error('Error in assistant chat controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process assistant query',
      error: error.message
    });
  }
};

module.exports = { chat };
