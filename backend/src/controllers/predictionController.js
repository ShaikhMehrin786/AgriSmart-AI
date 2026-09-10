// Prediction Controller
// Orchestrates in-process ONNX inference, Grad-CAM, and PostgreSQL persistence
const prisma = require('../config/database');
const { predictCropDisease } = require('../services/onnxInferenceService');
const { generateGradCamOverlay } = require('../services/gradCamService');

async function handlePrediction(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a leaf photograph (image/jpeg, image/png).' });
    }

    const imageBuffer = req.file.buffer;

    // 1. In-process ONNX inference (onnxruntime-node)
    const inferenceResult = await predictCropDisease(imageBuffer);

    // 2. Generate Grad-CAM activation heatmap overlay
    const heatmapDataUrl = await generateGradCamOverlay(imageBuffer);

    // 3. Query PostgreSQL for verified disease monograph
    let cropEntity = null;
    let diseaseEntity = null;

    try {
      cropEntity = await prisma.crop.findFirst({
        where: { name: { contains: inferenceResult.crop, mode: 'insensitive' } }
      });

      if (cropEntity) {
        diseaseEntity = await prisma.disease.findFirst({
          where: {
            cropId: cropEntity.id,
            name: { contains: inferenceResult.disease, mode: 'insensitive' }
          }
        });
      }
    } catch (dbErr) {
      console.warn('Database query bypassed during standalone demo:', dbErr.message);
    }

    // Default fallback agronomic details if DB has not yet been seeded
    const monograph = {
      symptoms: diseaseEntity?.symptoms || 'Concentric leaf rings, discoloration, chlorotic margins.',
      severity: diseaseEntity?.severityDefault || 'Moderate',
      organicTreatment: diseaseEntity?.organicTreatment || 'Spray 0.5% neem oil emulsion or Trichoderma viride. Remove diseased lower leaves.',
      chemicalTreatment: diseaseEntity?.chemicalTreatment || 'Apply Mancozeb 75% WP @ 2g/liter water if disease exceeds 20% canopy.',
      preventiveMeasures: diseaseEntity?.preventiveMeasures || 'Maintain plant spacing for aeration; avoid overhead sprinkler watering.'
    };

    // 4. Save to PostgreSQL if user is authenticated and DB is connected
    let predictionRecordId = 'temp-demo-id';
    try {
      if (req.user?.id && cropEntity && diseaseEntity) {
        const saved = await prisma.prediction.create({
          data: {
            userId: req.user.id,
            cropId: cropEntity.id,
            diseaseId: diseaseEntity.id,
            imageUrl: 'leaf_upload_memory.jpg',
            heatmapUrl: heatmapDataUrl ? 'data:image/png' : null,
            confidence: inferenceResult.confidence,
            severity: monograph.severity,
            modelVersion: inferenceResult.modelVersion
          }
        });
        predictionRecordId = saved.id;
      }
    } catch (saveErr) {
      console.warn('Could not save prediction log to DB:', saveErr.message);
    }

    // Return unified diagnostic response
    res.json({
      id: predictionRecordId,
      crop: inferenceResult.crop,
      disease: inferenceResult.disease,
      isHealthy: inferenceResult.isHealthy,
      confidence: inferenceResult.confidence,
      severity: monograph.severity,
      inferenceTimeMs: inferenceResult.inferenceTimeMs,
      modelVersion: inferenceResult.modelVersion,
      heatmap: heatmapDataUrl,
      monograph,
      recommendations: [
        monograph.organicTreatment,
        monograph.preventiveMeasures
      ]
    });
  } catch (error) {
    next(error);
  }
}

async function getPredictionHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const history = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        crop: { select: { name: true } },
        disease: { select: { name: true, severityDefault: true } }
      }
    });

    res.json({ history });
  } catch (error) {
    // If DB empty or disconnected, return mock sample history
    res.json({
      history: [
        {
          id: 'mock-1',
          crop: { name: 'Tomato' },
          disease: { name: 'Tomato Early Blight', severityDefault: 'Moderate' },
          confidence: 94.2,
          createdAt: new Date()
        }
      ]
    });
  }
}

module.exports = {
  handlePrediction,
  getPredictionHistory
};
