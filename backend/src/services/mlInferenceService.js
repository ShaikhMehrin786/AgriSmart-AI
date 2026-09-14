// Service that wraps ML model inference using in-process onnxruntime-node
const fs = require('fs');
const path = require('path');
const { predictCropDisease } = require('./onnxInferenceService');
const { generateGradCamOverlay } = require('./gradCamService');
const { assessImageQuality } = require('./imageQualityService');

/**
 * Run ML disease prediction on an image (file path or Buffer)
 * @param {string|Buffer} imageInput - Local file path or Buffer of the uploaded leaf image
 * @returns {Promise<Object>} Formatted prediction object matching the Prisma schema contract
 */
const predictDisease = async (imageInput) => {
  try {
    let imageBuffer;
    let imagePath = null;

    if (Buffer.isBuffer(imageInput)) {
      imageBuffer = imageInput;
    } else if (typeof imageInput === 'string') {
      imagePath = imageInput;
      imageBuffer = await fs.promises.readFile(imageInput);
    } else {
      throw new Error('Invalid image input: expected file path string or Buffer');
    }

    // 1. Run deterministic advisory image quality check (non-blocking)
    const imageQuality = await assessImageQuality(imageBuffer);

    // 2. Run ONNX inference
    const prediction = await predictCropDisease(imageBuffer);

    // 3. Determine lesion severity based on condition and confidence
    let severity = 'Low';
    if (prediction.isHealthy) {
      severity = 'None';
    } else if (prediction.confidence >= 80) {
      severity = 'High';
    } else if (prediction.confidence >= 50) {
      severity = 'Moderate';
    }

    // 4. Combine quality and confidence for image capture recommendation
    const isLowConfidence = prediction.confidence < 45.0;
    const isPoorQuality = imageQuality.level === 'POOR';
    const requiresBetterImage = isLowConfidence || isPoorQuality;

    // 5. Generate Grad-CAM activation heatmap overlay
    let heatmapPath = null;
    try {
      heatmapPath = await generateGradCamOverlay(imageBuffer);
    } catch (camErr) {
      console.warn('Grad-CAM overlay generation skipped:', camErr.message);
      heatmapPath = imagePath || null;
    }

    return {
      disease: prediction.disease,
      confidence: prediction.confidence,
      confidenceLevel: prediction.confidenceLevel || 'Moderate',
      diagnosticState: prediction.diagnosticState || (prediction.confidence >= 45.0 ? (prediction.isHealthy ? 'HEALTHY' : 'DISEASE') : 'UNKNOWN'),
      predictionMargin: prediction.predictionMargin ?? 100.0,
      secondCandidate: prediction.secondCandidate || null,
      isAmbiguous: prediction.isAmbiguous || false,
      isUncertain: prediction.isUncertain || false,
      uncertaintyReason: prediction.uncertaintyReason || null,
      requiresBetterImage,
      imageQuality,
      top3: prediction.top3 || [],
      allPredictions: prediction.allPredictions || [],
      crop: prediction.crop,
      severity,
      heatmapPath: heatmapPath || imagePath,
      rawClass: prediction.rawClass,
      isHealthy: prediction.isHealthy,
      inferenceTimeMs: prediction.inferenceTimeMs
    };
  } catch (error) {
    console.error('Error in predictDisease:', error);
    throw error;
  }
};

module.exports = { predictDisease };
