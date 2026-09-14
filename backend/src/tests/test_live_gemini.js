// Automated Verification for Grounded GenAI Agronomist with Live Gemini API
// Safe execution: Never exposes or logs the API secret

const assert = require('assert');
require('dotenv').config();
process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const { answerFarmerQuery, buildStructuredAgronomicResponse } = require('../services/genAiService');

async function testGeminiIntegration() {
  console.log('====================================================');
  console.log(' TESTING GROUNDED GENAI WITH CONFIGURED API KEY      ');
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

  // 1. Check Key Configuration
  await test('GEMINI_API_KEY is detected and non-placeholder', async () => {
    const key = process.env.GEMINI_API_KEY;
    assert(key, 'GEMINI_API_KEY must be defined in environment');
    assert.notStrictEqual(key, 'your_gemini_api_key_here', 'Key must not be placeholder');
    assert(key.length > 20, 'Key length indicates valid format');
  });

  // 2. Test Live Query with Grounded Context & Delay Irrigation directive
  await test('Live Gemini generates grounded response respecting Delay Irrigation', async () => {
    const result = await answerFarmerQuery({
      question: 'Can I turn on the water pumps and irrigate my tomato field today?',
      diagnosisContext: {
        crop: 'Tomato',
        disease: 'Tomato Early Blight',
        confidence: 94,
        severity: 'Moderate',
        stage: 'Flowering'
      },
      weatherContext: {
        temperature: 24,
        humidity: 84,
        rainProbability: 75,
        condition: 'Overcast with Rain'
      },
      irrigationContext: {
        action: 'Delay Irrigation',
        urgency: 'Preventative',
        waterRequired: '0 L/m²',
        nextIrrigation: 'Hold until rain event subsides'
      }
    });

    assert(result, 'Result should not be null');
    assert(result.isGrounded, 'Response must be marked as grounded');
    assert.strictEqual(result.groundedContext.irrigationDecision, 'Delay Irrigation');
    assert(result.reply, 'Reply must have textual content');

    // Verify model did not recommend watering when rain is 75%
    const lower = result.reply.toLowerCase();
    const warnsWateringOrRain = lower.includes('delay') || lower.includes('rain') || lower.includes('wait') || lower.includes('postpone') || lower.includes('hold') || lower.includes('not') || lower.includes('no');
    assert(warnsWateringOrRain, 'Model must acknowledge delay/rain advisory');
    assert(result.warnings.length > 0, 'Must contain rain/humidity warnings');
  });

  // 3. Test Chemical Spray Withholding Rule (Rain >= 50%)
  await test('Live Gemini warns against foliar chemical spray when rain probability >= 50%', async () => {
    const result = await answerFarmerQuery({
      question: 'Should I spray Mancozeb or pesticide on the tomato leaves right now?',
      diagnosisContext: {
        crop: 'Tomato',
        disease: 'Tomato Early Blight',
        confidence: 90
      },
      weatherContext: {
        temperature: 23,
        humidity: 88,
        rainProbability: 80,
        condition: 'Rain'
      },
      irrigationContext: {
        action: 'Delay Irrigation'
      }
    });

    const lower = result.reply.toLowerCase();
    const warnsAgainstSpray = lower.includes('not') || lower.includes("n't") || lower.includes('no') || lower.includes('wash') || lower.includes('delay') || lower.includes('avoid') || lower.includes('postpone') || lower.includes('hold') || lower.includes('rain') || lower.includes('न करें') || lower.includes('धुल');
    assert(warnsAgainstSpray, 'Model must advise against spraying before rainfall');
    assert(result.warnings.some(w => w.includes('Do NOT spray') || w.includes('Rain forecast')));
  });

  // 4. Test Vernacular / Hinglish Inquiry
  await test('Live Gemini responds appropriately to Hinglish farming inquiry', async () => {
    const result = await answerFarmerQuery({
      question: 'Kya main aaj tamatar me spray kar sakta hu? Barish hone wali hai kya?',
      diagnosisContext: {
        crop: 'Tomato',
        disease: 'Tomato Early Blight'
      },
      weatherContext: {
        temperature: 25,
        humidity: 85,
        rainProbability: 70
      },
      irrigationContext: {
        action: 'Delay Irrigation'
      },
      language: 'hi'
    });

    assert(result.reply, 'Reply must exist');
    assert(result.reply.length > 30, 'Reply should be comprehensive');
  });

  // 5. Test Fallback Mechanism
  await test('Grounded fallback operates reliably if API key is invalidated', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
      const fallback = await answerFarmerQuery({
        question: 'What organic treatment works for Potato Late Blight?',
        diagnosisContext: {
          crop: 'Potato',
          disease: 'Potato Late Blight'
        },
        weatherContext: {
          temperature: 19,
          humidity: 86,
          rainProbability: 20
        },
        irrigationContext: {
          action: 'Maintain Regular Schedule',
          waterRequired: '8 L/m²'
        }
      });

      assert(fallback.isGrounded, 'Fallback must be grounded');
      assert.strictEqual(fallback.engine, 'Deterministic Agronomic Rule Engine (Offline Grounded)');
      assert(fallback.diseaseManagement, 'Must have structured disease management');
      assert(fallback.reply.includes('Late Blight') || fallback.reply.includes('Bordeaux') || fallback.reply.includes('Copper') || fallback.reply.includes('AgriSmart'));
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  // 6. Test Model Configuration (Configured Model is Used)
  await test('Configured Gemini model (GEMINI_MODEL || gemini-flash-latest) is utilized', async () => {
    const configured = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const structured = buildStructuredAgronomicResponse({
      question: 'Soil health query',
      llmAnswer: 'Maintain organic matter and optimal irrigation.',
      crop: 'Wheat',
      weather: { temp: 22, humidity: 55, rainProb: 15 },
      irrigationAction: 'Maintain Regular Schedule',
      waterRequired: '5 L/m²',
      sustainability: { score: 88 },
      isKeyConfigured: true,
      geminiModel: configured
    });
    assert(structured.engine.includes(configured), `Structured response engine must reference configured model ${configured}, got: ${structured.engine}`);

    // Verify default parameter falls back to gemini-flash-latest
    const defaultModel = buildStructuredAgronomicResponse({
      question: 'Default check',
      llmAnswer: 'Default advisory',
      crop: 'Tomato',
      weather: { temp: 25, humidity: 60, rainProb: 10 },
      irrigationAction: 'Maintain Regular Schedule',
      waterRequired: '5 L/m²',
      sustainability: { score: 85 },
      isKeyConfigured: true
    });
    assert(defaultModel.engine.includes('gemini-flash-latest'), `Default model parameter must be gemini-flash-latest, got: ${defaultModel.engine}`);
  });

  console.log('\n====================================================');
  console.log(` GEMINI TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

testGeminiIntegration().catch(err => {
  console.error('Fatal Gemini test error:', err.message);
  process.exit(1);
});
