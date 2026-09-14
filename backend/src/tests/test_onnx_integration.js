// ============================================================================
// ONNX Integration Contract Test Suite (Backend Runtime & Tensor Verification)
// NOTE: This test suite validates tensor shapes, normalization mathematics,
// and ONNX Runtime integration contracts using synthetic/smoke test samples.
// It is an integration contract test, NOT a real-world model accuracy test.
// For real-world field image validation, see test_real_field_inference.js.
// ============================================================================
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { initOnnxSession, getOnnxSession, getClassLabels } = require('../config/onnxConfig');
const { predictCropDisease, preprocessImage, softmax } = require('../services/onnxInferenceService');
const { predictDisease } = require('../services/mlInferenceService');

async function runOnnxIntegrationTests() {
  console.log('====================================================');
  console.log(' RUNNING ONNX INTEGRATION CONTRACT TESTS            ');
  console.log(' (Verifies Tensor Shape, Normalization & ONNX Contract)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  }

  // 1. Session Initialization and Class Labels Count
  await test('initOnnxSession initializes session and loads exactly 28 public classes', async () => {
    await initOnnxSession();
    const session = getOnnxSession();
    const labels = getClassLabels();

    assert(session !== null, 'Session should be initialized');
    assert(Array.isArray(labels), 'Labels should be an array');
    assert.strictEqual(labels.length, 28, `Expected exactly 28 class labels, got ${labels.length}`);
    assert(labels.includes('Apple___Apple_scab'), 'Labels should contain Apple___Apple_scab');
    assert(labels.includes('Tomato___healthy'), 'Labels should contain Tomato___healthy');
    assert(session.inputNames.length > 0, 'Session must have input names');
    assert(session.outputNames.length > 0, 'Session must have output names');
    assert.strictEqual(session.inputNames[0], 'input', 'Input name should be "input"');
    assert.strictEqual(session.outputNames[0], 'output', 'Output name should be "output"');
  });

  // 2. Preprocessing Shape and Values
  const sampleImagePath = path.resolve(__dirname, '../../../ml-pipeline/checkpoints/synthetic_smoke_data/Apple___Apple_scab/synthetic_0_0.jpg');
  const fallbackSamplePath = path.resolve(__dirname, '../../../ml-pipeline/checkpoints/synthetic_processed/train/Apple___Apple_scab/synthetic_0_0.jpg');
  const testImagePath = fs.existsSync(sampleImagePath) ? sampleImagePath : fallbackSamplePath;

  await test('preprocessImage produces [1, 3, 224, 224] Float32 tensor', async () => {
    assert(fs.existsSync(testImagePath), `Test image not found at ${testImagePath}`);
    const imageBuffer = await fs.promises.readFile(testImagePath);
    const tensor = await preprocessImage(imageBuffer);

    assert.strictEqual(tensor.type, 'float32', 'Tensor type must be float32');
    assert.deepStrictEqual(tensor.dims, [1, 3, 224, 224], 'Tensor dimensions must be [1, 3, 224, 224]');
    assert.strictEqual(tensor.data.length, 1 * 3 * 224 * 224, 'Tensor data length must match 1*3*224*224');
    
    // Check that normalization produces normalized values (not raw 0..255)
    const firstVal = tensor.data[0];
    assert(firstVal >= -3.0 && firstVal <= 3.0, `Normalized pixel value ${firstVal} should be within reasonable range [-3, 3]`);
  });

  // 3. ONNX Direct Inference Service
  await test('predictCropDisease returns valid prediction with 28-class mapping', async () => {
    const imageBuffer = await fs.promises.readFile(testImagePath);
    const result = await predictCropDisease(imageBuffer);

    assert(result, 'Prediction result should not be null');
    assert.strictEqual(typeof result.crop, 'string', 'Crop must be a string');
    assert.strictEqual(typeof result.disease, 'string', 'Disease must be a string');
    assert.strictEqual(typeof result.isHealthy, 'boolean', 'isHealthy must be boolean');
    assert.strictEqual(typeof result.confidence, 'number', 'Confidence must be a number');
    assert(result.confidence >= 0 && result.confidence <= 100, 'Confidence must be between 0 and 100');
    assert.strictEqual(typeof result.inferenceTimeMs, 'number', 'inferenceTimeMs must be a number');
    assert(result.inferenceTimeMs >= 0, 'inferenceTimeMs must be non-negative');
    assert.strictEqual(typeof result.rawClass, 'string', 'rawClass must be a string');
    assert(typeof result.classIndex === 'number' && result.classIndex >= 0 && result.classIndex < 28, 'classIndex must be between 0 and 27');
    console.log(`      -> Result: ${result.disease} (Confidence: ${result.confidence}%, Latency: ${result.inferenceTimeMs}ms)`);
  });

  // 4. ML Inference Wrapper Service (Used by predictionController)
  await test('predictDisease service returns schema-compliant prediction object', async () => {
    const result = await predictDisease(testImagePath);

    assert(result, 'Result should not be null');
    assert.strictEqual(typeof result.disease, 'string', 'disease must be a string');
    assert.strictEqual(typeof result.confidence, 'number', 'confidence must be a number');
    assert.strictEqual(typeof result.crop, 'string', 'crop must be a string');
    assert(['None', 'Low', 'Moderate', 'High'].includes(result.severity), `Invalid severity: ${result.severity}`);
    assert(result.heatmapPath !== undefined, 'heatmapPath must be defined');
    assert(result.rawClass, 'rawClass must be defined');
    console.log(`      -> ML Service Result: Crop=${result.crop}, Disease=${result.disease}, Severity=${result.severity}`);
  });

  // 5. Buffer input support in predictDisease
  await test('predictDisease supports direct Buffer input', async () => {
    const buffer = await fs.promises.readFile(testImagePath);
    const result = await predictDisease(buffer);

    assert(result, 'Result should not be null');
    assert(result.disease, 'Disease must be present');
    assert(result.confidence > 0, 'Confidence must be > 0');
  });

  // 6. Softmax Utility Test
  await test('softmax sums to 1.0 and preserves relative ordering', () => {
    const logits = [2.0, 1.0, 0.1];
    const probs = softmax(logits);
    const sum = probs.reduce((a, b) => a + b, 0);
    assert(Math.abs(sum - 1.0) < 1e-5, 'Softmax probabilities must sum to 1.0');
    assert(probs[0] > probs[1] && probs[1] > probs[2], 'Ordering must be preserved');
  });

  console.log('\n====================================================');
  console.log(` TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOnnxIntegrationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
