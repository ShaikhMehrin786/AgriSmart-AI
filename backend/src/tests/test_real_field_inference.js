const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { predictCropDisease, preprocessImage } = require('../services/onnxInferenceService');
const { predictDisease } = require('../services/mlInferenceService');

const BASE_URL = 'http://localhost:5000';

const images = [
  {
    name: 'Apple Scab Field Image',
    sourceClass: 'Apple___Apple_scab',
    path: path.resolve(__dirname, '../../../ml-pipeline/data/processed/test_field/Apple___Apple_scab/pd_field_00000.jpg')
  },
  {
    name: 'Tomato Early Blight Field Image',
    sourceClass: 'Tomato___Early_blight',
    path: path.resolve(__dirname, '../../../ml-pipeline/data/processed/test_field/Tomato___Early_blight/pd_field_00000.jpg')
  },
  {
    name: 'Grape Black Rot Field Image',
    sourceClass: 'Grape___Black_rot',
    path: path.resolve(__dirname, '../../../ml-pipeline/data/processed/test_field/Grape___Black_rot/pd_field_00000.jpg')
  }
];

async function authenticateTestUser() {
  const timestamp = Date.now();
  const testEmail = `farmer_test_${timestamp}@agrismart.ai`;
  const testPassword = 'Password@123';
  const testName = `Test Farmer ${timestamp}`;

  console.log(`[Auth] Registering legitimate test user: ${testEmail}...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      phone: '9876543210',
      location: 'Pune Experimental Farm'
    })
  });

  const regData = await regRes.json();
  if (!regRes.ok || !regData.token) {
    throw new Error(`User registration failed (${regRes.status}): ${JSON.stringify(regData)}`);
  }

  assert(regData.user && typeof regData.user.id === 'string', 'Registered user must have a valid string ID');
  assert(typeof regData.token === 'string' && regData.token.length > 0, 'Registered user must receive a valid JWT token string');

  console.log(`[Auth] Successfully registered and authenticated User ID: ${regData.user.id}`);
  return {
    token: regData.token,
    user: regData.user
  };
}

async function runRealInferenceTests() {
  console.log('================================================================');
  console.log(' REAL API & ONNX INFERENCE END-TO-END VALIDATION               ');
  console.log('================================================================\n');

  // Step 1: Obtain legitimate JWT token
  const auth = await authenticateTestUser();
  const token = auth.token;
  console.log(`[Auth] Bearer Token acquired successfully.\n`);

  const resultsSummary = [];

  // Step 2: Test each of the 3 field images
  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    console.log(`[TEST ${i + 1}/3] Source Class: ${item.sourceClass}`);
    console.log(`         File Path:    ${item.path}`);

    const exists = fs.existsSync(item.path);
    console.log(`         File Exists:  ${exists}`);
    assert(exists, `Test image file must exist: ${item.path}`);

    const fileBuffer = fs.readFileSync(item.path);

    // In-process tensor verification
    const tensor = await preprocessImage(fileBuffer);
    assert.strictEqual(tensor.type, 'float32', 'Preprocessed tensor type must be float32');
    assert.deepStrictEqual(tensor.dims, [1, 3, 224, 224], 'Preprocessed tensor dims must be [1, 3, 224, 224]');

    const sampleSlice = Array.from(tensor.data.slice(0, 5)).map(v => v.toFixed(4));
    console.log(`         Tensor Shape: [${tensor.dims.join(', ')}], Type: ${tensor.type}`);
    console.log(`         First 5 Floats (Normalized): [${sampleSlice.join(', ')}]`);

    // In-process ONNX check
    const directPrediction = await predictCropDisease(fileBuffer);
    assert(directPrediction, 'Direct ONNX prediction must not be null');
    assert.strictEqual(typeof directPrediction.disease, 'string', 'Direct prediction disease must be string');
    assert.strictEqual(typeof directPrediction.crop, 'string', 'Direct prediction crop must be string');
    assert(typeof directPrediction.confidence === 'number' && directPrediction.confidence >= 0 && directPrediction.confidence <= 100, 'Direct confidence must be between 0 and 100');
    assert(typeof directPrediction.classIndex === 'number' && directPrediction.classIndex >= 0 && directPrediction.classIndex < 28, 'classIndex must be within [0, 27]');
    assert.strictEqual(typeof directPrediction.rawClass, 'string', 'Direct rawClass must be string');

    console.log(`         In-Process ONNX:`);
    console.log(`           - Predicted:  ${directPrediction.rawClass} (${directPrediction.disease})`);
    console.log(`           - Confidence: ${directPrediction.confidence}%`);
    console.log(`           - Latency:    ${directPrediction.inferenceTimeMs}ms`);

    // HTTP POST to Live Prediction API
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', blob, path.basename(item.path));

    const response = await fetch(`${BASE_URL}/api/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const httpStatus = response.status;
    const responseJson = await response.json();

    console.log(`         API HTTP Status: ${httpStatus}`);
    console.log(`         API Response Payload:`);
    console.log(`           ${JSON.stringify(responseJson, null, 2)}`);

    // Hard assertions on HTTP response and prediction structure
    assert.strictEqual(httpStatus, 201, `Expected HTTP 201 Created from /api/predictions, got ${httpStatus}`);
    assert.strictEqual(responseJson.success, true, 'API response success must be true');
    assert(responseJson.prediction && typeof responseJson.prediction.id === 'string', 'API response must contain prediction object with string id');
    assert.strictEqual(responseJson.prediction.userId, auth.user.id, 'Prediction userId must match authenticated user id');
    assert.strictEqual(typeof responseJson.prediction.crop, 'string', 'Prediction crop must be string');
    assert.strictEqual(typeof responseJson.prediction.disease, 'string', 'Prediction disease must be string');
    assert(typeof responseJson.prediction.confidence === 'number', 'Prediction confidence must be number');
    assert(['None', 'Low', 'Moderate', 'High', 'Critical'].includes(responseJson.prediction.severity), `Invalid severity in response: ${responseJson.prediction.severity}`);

    console.log(`         Database Record Created: true`);
    console.log(`           - Record ID:    ${responseJson.prediction.id}`);
    console.log(`           - Crop:         ${responseJson.prediction.crop}`);
    console.log(`           - Disease:      ${responseJson.prediction.disease}`);
    console.log(`           - Confidence:   ${responseJson.prediction.confidence}%`);
    console.log(`           - Severity:     ${responseJson.prediction.severity}`);
    console.log(`           - Heatmap Path: ${responseJson.prediction.heatmapPath ? 'Saved' : 'None'}`);

    resultsSummary.push({
      image: path.basename(item.path),
      sourceClass: item.sourceClass,
      httpStatus,
      predictedClass: responseJson.prediction.disease,
      rawClass: directPrediction.rawClass,
      confidence: responseJson.prediction.confidence,
      dbSuccess: true,
      predictionId: responseJson.prediction.id
    });

    console.log('\n----------------------------------------------------------------\n');
  }

  // Step 3: Query Prediction History to confirm records exist in PostgreSQL
  console.log('--- VERIFYING POSTGRESQL DATABASE PERSISTENCE ---');
  const historyRes = await fetch(`${BASE_URL}/api/predictions/history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const historyData = await historyRes.json();
  console.log(`History API HTTP Status: ${historyRes.status}`);

  // Hard assertions on History endpoint
  assert.strictEqual(historyRes.status, 200, `Expected HTTP 200 OK from /api/predictions/history, got ${historyRes.status}`);
  assert.strictEqual(historyData.success, true, 'History API response success must be true');
  assert(Array.isArray(historyData.data), 'History API response data must be an array');
  assert.strictEqual(historyData.data.length, images.length, `Expected exactly ${images.length} history records for test user, got ${historyData.data.length}`);

  const createdIds = resultsSummary.map(r => r.predictionId);
  historyData.data.forEach((p, idx) => {
    console.log(`  [Record ${idx + 1}] ID: ${p.id} | Crop: ${p.crop} | Disease: ${p.disease} | Conf: ${p.confidence}% | Severity: ${p.severity}`);
    assert(createdIds.includes(p.id), `Retrieved record ID ${p.id} must match one of the created test prediction IDs`);
  });

  console.log('\n================================================================');
  console.log(' FINAL RESULTS SUMMARY TABLE:');
  console.log('================================================================');
  console.table(resultsSummary.map(r => ({
    'IMAGE': r.image,
    'SOURCE CLASS': r.sourceClass,
    'PREDICTED CLASS': r.predictedClass,
    'CONFIDENCE': `${r.confidence}%`,
    'HTTP STATUS': r.httpStatus,
    'DB INSERTED': r.dbSuccess ? 'SUCCESS' : 'FAILED'
  })));
  console.log('================================================================\n');
}

runRealInferenceTests().catch((err) => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
