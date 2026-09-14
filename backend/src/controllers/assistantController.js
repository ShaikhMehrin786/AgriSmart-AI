
const prisma = require('../config/database');
const { answerFarmerQuery, resolveConfidenceMeta, resolveDiagnosticState } = require('../services/genAiService');
const { getDiseaseKnowledge } = require('../data/diseaseKnowledgeBase');
const { getWeatherData } = require('../services/weatherService');

const chat = async (req, res) => {
  try {
    const { message, language = 'en', predictionId, prediction, lat, lon } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // 1. Resolve Diagnosis Context from Database or Payload
    let diagnosisContext = null;
    let predictionRecord = prediction || null;

    if (!predictionRecord && req.user?.id) {
      try {
        predictionRecord = predictionId
          ? await prisma.prediction.findFirst({ where: { id: predictionId, userId: req.user.id } })
          : await prisma.prediction.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
      } catch (dbErr) {
        console.warn('Database diagnosis retrieval warning:', dbErr.message);
      }
    }

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

    // 2. Resolve Real-Time Weather Context
    let weatherContext = null;
    try {
      weatherContext = await getWeatherData(lat, lon);
    } catch (wErr) {
      console.warn('Weather telemetry unavailable for assistant chat:', wErr.message);
    }

    // 3. Call Grounded GenAI Service (or deterministic fallback)
    const result = await answerFarmerQuery({
      question: message.trim(),
      diagnosisContext,
      weatherContext,
      language
    });

    res.json({
      success: true,
      data: {
        reply: result.reply,
        source: result.source,
        contextual: result.contextual,
        diagnosisContext: diagnosisContext ? {
          crop: diagnosisContext.crop,
          disease: diagnosisContext.disease,
          confidence: diagnosisContext.confidence
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
