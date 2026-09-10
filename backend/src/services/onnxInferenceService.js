// In-Process ONNX Inference Service (onnxruntime-node)
// Zero Python runtime in live execution
const ort = require('onnxruntime-node');
const sharp = require('sharp');
const { getOnnxSession, getClassLabels } = require('../config/onnxConfig');

// ImageNet normalization constants
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

/**
 * Preprocess image buffer to Float32Array tensor [1, 3, 224, 224]
 */
async function preprocessImage(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .resize(224, 224, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channelSize = width * height;
  const float32Data = new Float32Array(3 * channelSize);

  // CHW format (Channel, Height, Width) with ImageNet normalization
  for (let i = 0; i < channelSize; i++) {
    const r = data[i * 3] / 255.0;
    const g = data[i * 3 + 1] / 255.0;
    const b = data[i * 3 + 2] / 255.0;

    float32Data[i] = (r - MEAN[0]) / STD[0];                   // R channel
    float32Data[channelSize + i] = (g - MEAN[1]) / STD[1];     // G channel
    float32Data[2 * channelSize + i] = (b - MEAN[2]) / STD[2]; // B channel
  }

  return new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);
}

/**
 * Compute Softmax over raw logits
 */
function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((acc, val) => acc + val, 0);
  return exps.map(e => e / sumExps);
}

/**
 * Run inference on uploaded image buffer
 */
async function predictCropDisease(imageBuffer) {
  const session = getOnnxSession();
  const classLabels = getClassLabels();

  if (!session) {
    // Development/Fallback Simulation Mode if ONNX weights not yet generated
    return runSimulationInference(classLabels);
  }

  try {
    const tensor = await preprocessImage(imageBuffer);
    const inputName = session.inputNames[0] || 'input';
    const feeds = { [inputName]: tensor };

    const startTime = Date.now();
    const results = await session.run(feeds);
    const inferenceTimeMs = Date.now() - startTime;

    const outputName = session.outputNames[0] || 'output';
    const outputTensor = results[outputName];
    const logits = Array.from(outputTensor.data);
    const probabilities = softmax(logits);

    // Identify top prediction
    let maxProb = -1;
    let maxIdx = -1;
    probabilities.forEach((prob, idx) => {
      if (prob > maxProb) {
        maxProb = prob;
        maxIdx = idx;
      }
    });

    const predictedRawLabel = classLabels[maxIdx] || 'Tomato___Early_blight';
    const [rawCrop, rawDisease] = predictedRawLabel.split('___');
    const cropName = rawCrop.replace('_', ' ');
    const diseaseName = rawDisease ? rawDisease.replace(/_/g, ' ') : 'Healthy';

    return {
      crop: cropName,
      disease: diseaseName === 'healthy' ? `${cropName} Healthy` : `${cropName} ${diseaseName}`,
      isHealthy: diseaseName.toLowerCase() === 'healthy',
      confidence: parseFloat((maxProb * 100).toFixed(2)),
      inferenceTimeMs,
      modelVersion: 'v1.0-onnx',
      rawClass: predictedRawLabel
    };
  } catch (error) {
    console.error('Error during ONNX inference:', error);
    throw new Error(`Inference execution failed: ${error.message}`);
  }
}

/**
 * Fallback simulation for testing before training is finalized
 */
function runSimulationInference(classLabels) {
  const fallbackLabel = classLabels[29] || 'Tomato___Early_blight';
  return {
    crop: 'Tomato',
    disease: 'Tomato Early Blight',
    isHealthy: false,
    confidence: 94.20,
    inferenceTimeMs: 38,
    modelVersion: 'v1.0-simulated-onnx',
    rawClass: fallbackLabel
  };
}

module.exports = {
  predictCropDisease,
  preprocessImage
};
