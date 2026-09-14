const { PrismaClient } = require('@prisma/client');
const { predictDisease } = require('../services/mlInferenceService');
const { getDiseaseKnowledge, SAFETY_DISCLAIMER } = require('../data/diseaseKnowledgeBase');
const { generateRecommendations } = require('../services/recommendationService');
const prisma = new PrismaClient();

const createPrediction = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const imagePath = req.file.path;
    const result = await predictDisease(imagePath);

    const prediction = await prisma.prediction.create({
      data: {
        userId: req.user.id,
        imagePath,
        disease: result.disease,
        confidence: result.confidence,
        crop: result.crop,
        severity: result.severity,
        heatmapPath: result.heatmapPath
      }
    });

    // Retrieve rich agronomic advisory for the predicted condition
    const advisory = getDiseaseKnowledge(result.rawClass || result.disease);

    // Generate integrated recommendations if coordinates are available or default
    let recommendations = null;
    try {
      recommendations = await generateRecommendations({
        crop: result.crop,
        disease: result.disease,
        lat: req.body?.lat || req.query?.lat || null,
        lon: req.body?.lon || req.query?.lon || null
      });
    } catch (recErr) {
      console.warn('Integrated recommendation generation skipped:', recErr.message);
    }

    const enrichedPrediction = {
      ...prediction,
      confidenceLevel: result.confidenceLevel || 'Moderate',
      isUncertain: result.isUncertain || false,
      uncertaintyReason: result.uncertaintyReason || null,
      top3: result.top3 || [],
      rawClass: result.rawClass,
      inferenceTimeMs: result.inferenceTimeMs,
      advisory,
      recommendations,
      safetyDisclaimer: SAFETY_DISCLAIMER
    };

    res.status(201).json({
      success: true,
      prediction: enrichedPrediction,
      top3: result.top3 || [],
      confidenceLevel: result.confidenceLevel || 'Moderate',
      isUncertain: result.isUncertain || false,
      uncertaintyReason: result.uncertaintyReason || null,
      advisory,
      recommendations,
      safetyDisclaimer: SAFETY_DISCLAIMER
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPredictionById = async (req, res) => {
  try {
    const prediction = await prisma.prediction.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found' });

    const advisory = getDiseaseKnowledge(prediction.disease);
    const confidenceLevel = prediction.confidence >= 70 ? 'High' : prediction.confidence >= 45 ? 'Moderate' : 'Low';
    const isUncertain = prediction.confidence < 45;

    res.json({
      success: true,
      prediction: {
        ...prediction,
        confidenceLevel,
        isUncertain,
        advisory,
        safetyDisclaimer: SAFETY_DISCLAIMER
      },
      advisory,
      confidenceLevel,
      isUncertain
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPrediction, getHistory, getPredictionById };
