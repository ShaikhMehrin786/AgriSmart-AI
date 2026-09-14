// Service that wraps ML model inference using in-process onnxruntime-node
const fs = require('fs');
const path = require('path');
const { predictCropDisease } = require('./onnxInferenceService');
const { generateGradCamOverlay } = require('./gradCamService');

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

    // Run ONNX inference
    const prediction = await predictCropDisease(imageBuffer);

    // Determine lesion severity based on condition and confidence
    let severity = 'Low';
    if (prediction.isHealthy) {
      severity = 'None';
    } else if (prediction.confidence >= 80) {
      severity = 'High';
    } else if (prediction.confidence >= 50) {
      severity = 'Moderate';
    }

    // Generate Grad-CAM activation heatmap overlay
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
