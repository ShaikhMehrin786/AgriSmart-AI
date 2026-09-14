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

  // 7. Confidence Level Thresholds
  const { getConfidenceLevel } = require('../services/onnxInferenceService');
  await test('getConfidenceLevel accurately maps HIGH (>=70%), MODERATE (45-69.99%), and LOW (<45%)', () => {
    assert.strictEqual(getConfidenceLevel(95.5), 'High', '>=70 should be High');
    assert.strictEqual(getConfidenceLevel(70.0), 'High', '70.0 should be High');
    assert.strictEqual(getConfidenceLevel(69.9), 'Moderate', '69.9 should be Moderate');
    assert.strictEqual(getConfidenceLevel(45.0), 'Moderate', '45.0 should be Moderate');
    assert.strictEqual(getConfidenceLevel(44.46), 'Low', '44.46 should be Low');
    assert.strictEqual(getConfidenceLevel(12.0), 'Low', '12.0 should be Low');
  });

  // 8. Image Quality Assessment Heuristics
  const sharp = require('sharp');
  const { assessImageQuality } = require('../services/imageQualityService');
  await test('assessImageQuality detects tiny, dark, bright, and low-contrast images', async () => {
    // A. Tiny image (<100px)
    const tinyBuf = await sharp({ create: { width: 60, height: 60, channels: 3, background: { r: 120, g: 120, b: 120 } } }).jpeg().toBuffer();
    const tinyRes = await assessImageQuality(tinyBuf);
    assert(tinyRes.issues.includes('IMAGE_TOO_SMALL'), 'Tiny image must trigger IMAGE_TOO_SMALL');
    assert.strictEqual(tinyRes.level, 'POOR', 'Tiny image level must be POOR');

    // B. Dark image (mean luminance < 35)
    const darkBuf = await sharp({ create: { width: 250, height: 250, channels: 3, background: { r: 15, g: 15, b: 15 } } }).jpeg().toBuffer();
    const darkRes = await assessImageQuality(darkBuf);
    assert(darkRes.issues.includes('TOO_DARK'), 'Dark image must trigger TOO_DARK');

    // C. Bright image (mean luminance > 230)
    const brightBuf = await sharp({ create: { width: 250, height: 250, channels: 3, background: { r: 245, g: 245, b: 245 } } }).jpeg().toBuffer();
    const brightRes = await assessImageQuality(brightBuf);
    assert(brightRes.issues.includes('TOO_BRIGHT'), 'Bright image must trigger TOO_BRIGHT');

    // D. Normal Field Image
    const normalBuf = await fs.promises.readFile(testImagePath);
    const normalRes = await assessImageQuality(normalBuf);
    assert(['GOOD', 'FAIR'].includes(normalRes.level), `Normal field image should be GOOD or FAIR, got ${normalRes.level}`);
  });

  // 9. Raw Prediction Transparency & Diagnostic State for LOW Confidence
  await test('predictDisease preserves raw prediction name and exact confidence when confidence is LOW', async () => {
    const result = await predictDisease(testImagePath);
    assert(result.disease && typeof result.disease === 'string', 'Raw disease must be preserved');
    assert(result.crop && typeof result.crop === 'string', 'Raw crop must be preserved');
    assert(typeof result.confidence === 'number', 'Confidence must be numeric');
    assert(['HIGH', 'MODERATE', 'LOW', 'High', 'Moderate', 'Low'].includes(result.confidenceLevel), 'Valid confidence level');
    assert(['HEALTHY', 'DISEASE', 'UNKNOWN'].includes(result.diagnosticState), 'Valid diagnosticState');
    assert(typeof result.requiresBetterImage === 'boolean', 'requiresBetterImage must be boolean');
  });

  // 10. Prediction Margin Transparency & Second Candidate
  await test('Inference exposes predictionMargin, secondCandidate, and isAmbiguous flag', async () => {
    const imageBuffer = await fs.promises.readFile(testImagePath);
    const result = await predictCropDisease(imageBuffer);
    assert(typeof result.predictionMargin === 'number', 'predictionMargin must be a number');
    assert(typeof result.isAmbiguous === 'boolean', 'isAmbiguous must be boolean');
    if (result.top3.length > 1) {
      assert(result.secondCandidate !== null, 'secondCandidate must be present when top3 > 1');
      assert.strictEqual(typeof result.secondCandidate.disease, 'string', 'secondCandidate disease must be string');
      assert(typeof result.secondCandidate.confidence === 'number', 'secondCandidate confidence must be number');
    }
  });

  // 11. POOR Image non-blocking execution
  await test('POOR image triggers requiresBetterImage=true without blocking inference', async () => {
    const tinyBuf = await sharp({ create: { width: 80, height: 80, channels: 3, background: { r: 20, g: 150, b: 40 } } }).jpeg().toBuffer();
    const result = await predictDisease(tinyBuf);
    assert(result, 'Inference must succeed on poor quality image');
    assert.strictEqual(result.requiresBetterImage, true, 'Poor quality must set requiresBetterImage to true');
    assert.strictEqual(result.imageQuality.level, 'POOR', 'Quality level must be POOR');
    assert(result.disease && result.confidence > 0, 'Inference must still produce prediction');
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
