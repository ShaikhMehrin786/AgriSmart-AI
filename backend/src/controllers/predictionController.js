const { PrismaClient } = require('@prisma/client');
const { predictDisease } = require('../services/mlInferenceService');
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

    res.status(201).json({ success: true, prediction });
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
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPrediction, getHistory, getPredictionById };
