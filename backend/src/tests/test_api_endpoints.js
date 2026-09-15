// Integration Test for API Routes, Input Validation, and Security Middleware

const assert = require('assert');
const app = require('../app');
const http = require('http');

let server;
let port;
let token;

async function runApiTests() {
  console.log('====================================================');
  console.log(' RUNNING API VALIDATION & SECURITY TEST SUITE       ');
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

  // Helper function to send HTTP requests to test server
  function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => rawData += chunk);
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      resolve();
    });
  });

  try {
    // Generate a valid mock JWT token for authenticated endpoint testing
    const { generateToken } = require('../utils/jwt');
    token = generateToken({ id: 'test-user-uuid', email: 'test@agrismart.ai' });
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1. Unauthorized Access Tests
    await test('GET /api/advisory/weather returns 401 without auth token', async () => {
      const res = await request('GET', '/api/advisory/weather');
      assert.strictEqual(res.status, 401);
    });

    await test('POST /api/advisory/irrigation returns 401 without auth token', async () => {
      const res = await request('POST', '/api/advisory/irrigation', { crop: 'Tomato', soilMoisture: 30 });
      assert.strictEqual(res.status, 401);
    });

    await test('POST /api/assistant/chat returns 401 without auth token', async () => {
      const res = await request('POST', '/api/assistant/chat', { message: 'Hello' });
      assert.strictEqual(res.status, 401);
    });

    // 2. Input Validation Tests (with auth)
    await test('POST /api/advisory/irrigation returns 400 for negative soilMoisture', async () => {
      const res = await request('POST', '/api/advisory/irrigation', { crop: 'Tomato', soilMoisture: -10, area: 1 }, authHeaders);
      assert.strictEqual(res.status, 400);
      assert(res.data.message.includes('soilMoisture must be between 0% and 100%'));
    });

    await test('POST /api/advisory/irrigation returns 400 for soilMoisture > 100', async () => {
      const res = await request('POST', '/api/advisory/irrigation', { crop: 'Tomato', soilMoisture: 125, area: 1 }, authHeaders);
      assert.strictEqual(res.status, 400);
      assert(res.data.message.includes('soilMoisture must be between 0% and 100%'));
    });

    await test('POST /api/advisory/irrigation returns 400 for invalid field area', async () => {
      const res = await request('POST', '/api/advisory/irrigation', { crop: 'Tomato', soilMoisture: 30, area: -2 }, authHeaders);
      assert.strictEqual(res.status, 400);
      assert(res.data.message.includes('field area must be a positive number'));
    });

    await test('POST /api/advisory/sustainability-score returns 400 for invalid soilMoisture', async () => {
      const res = await request('POST', '/api/advisory/sustainability-score', { crop: 'Tomato', soilMoisture: 150 }, authHeaders);
      assert.strictEqual(res.status, 400);
      assert(res.data.message.includes('soilMoisture must be a valid number between 0% and 100%'));
    });

    await test('POST /api/assistant/chat returns 400 for empty message', async () => {
      const res = await request('POST', '/api/assistant/chat', { message: '   ' }, authHeaders);
      assert.strictEqual(res.status, 400);
      assert(res.data.message.includes('valid natural language message or question is required'));
    });

    // 3. Functional Endpoints (with auth)
    await test('GET /api/advisory/sustainability-score returns 200 with deterministic score', async () => {
      const res = await request('GET', '/api/advisory/sustainability-score', null, authHeaders);
      assert.strictEqual(res.status, 200);
      assert(res.data.success);
      assert(typeof res.data.data.sustainabilityScore === 'number');
      assert(res.data.data.factors.length === 4);
    });

    await test('POST /api/advisory/sustainability-score returns 200 with customized metrics', async () => {
      const res = await request('POST', '/api/advisory/sustainability-score', {
        crop: 'Tomato',
        soilMoisture: 42,
        disease: 'Tomato Early Blight'
      }, authHeaders);
      assert.strictEqual(res.status, 200);
      assert(res.data.success);
      assert(res.data.data.sustainabilityScore >= 75);
    });

    await test('GET /api/advisory/diseases returns 200 with catalog array', async () => {
      const res = await request('GET', '/api/advisory/diseases', null, authHeaders);
      assert.strictEqual(res.status, 200);
      assert(res.data.success);
      assert(Array.isArray(res.data.data));
      assert(res.data.count > 0);
    });

    await test('GET /api/advisory/diseases/:diseaseName returns 200 for supported disease', async () => {
      const res = await request('GET', '/api/advisory/diseases/Tomato%20Early%20Blight', null, authHeaders);
      assert.strictEqual(res.status, 200);
      assert(res.data.success);
      assert.strictEqual(res.data.data.diseaseName, 'Tomato Early Blight');
      assert(res.data.data.organicRemedy);
    });

    await test('GET /api/advisory/diseases/:diseaseName returns 404 for unknown disease', async () => {
      const res = await request('GET', '/api/advisory/diseases/UnknownNonexistentPathogen', null, authHeaders);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
    });

    await test('POST /api/assistant/chat returns 200 with grounded response', async () => {
      const res = await request('POST', '/api/assistant/chat', {
        message: 'Should I spray fungicide today?',
        prediction: { crop: 'Tomato', disease: 'Tomato Early Blight', confidence: 90 },
        weather: { temperature: 24, humidity: 85, rainProbability: 70 }
      }, authHeaders);
      assert.strictEqual(res.status, 200);
      assert(res.data.success);
      assert(res.data.data.reply);
      assert(res.data.data.isGrounded);
      assert(res.data.data.warnings.length > 0);
    });

    // SIH Bonus Module A Test: Crop Recommendation
    await test('POST /api/advisory/crop-recommendation returns ranked suitable crops', async () => {
      const res = await request('POST', '/api/advisory/crop-recommendation', {
        soilType: 'Loamy',
        pH: 6.5,
        temperature: 24,
        humidity: 65,
        rainfall: 150,
        waterAvailability: 'Moderate',
        season: 'Rabi',
        previousCrop: 'Rice'
      }, authHeaders);
      assert.strictEqual(res.status, 200);
      assert(res.data.success);
      assert(Array.isArray(res.data.data.recommendations));
      assert(res.data.data.topRecommendation);
      assert(res.data.data.dataSource.includes('ICAR'));
    });

    // SIH Bonus Module F Test: IoT Telemetry
    await test('GET /api/advisory/iot/telemetry returns simulated sensor feed', async () => {
      const res = await request('GET', '/api/advisory/iot/telemetry?crop=Tomato', null, authHeaders);
      assert.strictEqual(res.status, 200);
      assert(res.data.success);
      assert(res.data.data.current.telemetry.soilMoisture);
      assert.strictEqual(res.data.data.current.hardwareStatus.nodeStatus, 'ONLINE');
    });

    // SIH Bonus Module G Test: Agentic Autonomous Advisory Loop
    await test('POST /api/advisory/agentic/autonomous-cycle executes sense-reason-decide loop', async () => {
      const res = await request('POST', '/api/advisory/agentic/autonomous-cycle', {
        crop: 'Tomato',
        disease: 'Tomato Early Blight',
        confidence: 0.91
      }, authHeaders);
      assert.strictEqual(res.status, 200);
      assert(res.data.success);
      assert(res.data.data.executionLoop.step1_Perceive);
      assert(res.data.data.executionLoop.step2_Analyze);
      assert(res.data.data.executionLoop.step3_Reason);
      assert(res.data.data.executionLoop.step4_Decide);
      assert(res.data.data.executionLoop.step5_Notify);
    });

  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(` API TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runApiTests().catch(err => {
  console.error('Fatal API test error:', err);
  process.exit(1);
});
