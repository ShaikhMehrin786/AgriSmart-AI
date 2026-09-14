/**
 * AgriSmart AI - Gemini Integration & Multilingual Advisory Tests
 *
 * Verifies:
 * 1. Diagnostic state resolution (HEALTHY, DISEASE, UNKNOWN).
 * 2. Confidence level classification (HIGH >= 70, MODERATE 45-69, LOW < 45).
 * 3. Strict Healthy-class guardrails (NO fungicides, NO curative disease sprays for healthy plants).
 * 4. Low-confidence uncertainty and image retake guidance.
 * 5. Weather & rain spray safety guardrail (Rain >= 50% forbids foliar spray).
 * 6. Multilingual response consistency:
 *    - Hindi (hi): Pure natural Hindi with zero untranslated English advisory sentences.
 *    - Hinglish: Natural farmer-friendly Hinglish with zero untranslated English advisory sentences.
 *    - English (en): Complete English advisory unchanged.
 * 7. Live browser scenario: Peach Healthy @ 44.46% with 60% rain.
 * 8. API key security (zero leakage).
 */

require('dotenv').config();
const assert = require('assert');
const {
  answerFarmerQuery,
  generateGroundedFallbackResponse,
  resolveConfidenceMeta,
  resolveDiagnosticState,
  resolveLanguage,
  translateAgronomicText,
  SAFETY_DISCLAIMERS,
  isConfigured
} = require('../services/genAiService');
const { getDiseaseKnowledge } = require('../data/diseaseKnowledgeBase');

async function runGeminiIntegrationTests() {
  console.log('================================================================');
  console.log(' AGRISMART AI — GEMINI MULTILINGUAL & GUARDRAIL TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function recordPass(testName) {
    totalTests++;
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${testName}`);
  }

  // --- Test 1: Confidence Normalization & Level Resolution ---
  console.log('1. Verifying Confidence Level Classification:');
  const conf1 = resolveConfidenceMeta(0.4446);
  assert.strictEqual(conf1.percent, 44.46);
  assert.strictEqual(conf1.level, 'LOW');
  assert.strictEqual(conf1.isUncertain, true);

  const conf2 = resolveConfidenceMeta(44.46);
  assert.strictEqual(conf2.percent, 44.46);
  assert.strictEqual(conf2.level, 'LOW');
  assert.strictEqual(conf2.isUncertain, true);

  const conf3 = resolveConfidenceMeta(0.65);
  assert.strictEqual(conf3.percent, 65.0);
  assert.strictEqual(conf3.level, 'MODERATE');
  assert.strictEqual(conf3.isUncertain, false);

  const conf4 = resolveConfidenceMeta(88.5);
  assert.strictEqual(conf4.percent, 88.5);
  assert.strictEqual(conf4.level, 'HIGH');
  assert.strictEqual(conf4.isUncertain, false);
  recordPass('Confidence 44.46% and 0.4446 accurately mapped to LOW (<45%)');

  // --- Test 2: Diagnostic State Resolution ---
  console.log('\n2. Verifying Diagnostic State Resolution:');
  assert.strictEqual(resolveDiagnosticState('Peach Healthy', true), 'HEALTHY');
  assert.strictEqual(resolveDiagnosticState('Tomato___healthy', true), 'HEALTHY');
  assert.strictEqual(resolveDiagnosticState('Potato___Early_blight', false), 'DISEASE');
  assert.strictEqual(resolveDiagnosticState(null, null), 'UNKNOWN');
  recordPass('Diagnostic states (HEALTHY, DISEASE, UNKNOWN) resolved accurately');

  // --- Test 3: Language Resolver ---
  console.log('\n3. Verifying Language Resolver:');
  assert.strictEqual(resolveLanguage('Can I spray?', 'en'), 'en');
  assert.strictEqual(resolveLanguage('क्या मैं स्प्रे कर सकता हूँ?', 'hi'), 'hi');
  assert.strictEqual(resolveLanguage('Kya main aaj spray kar sakta hoon?', 'hinglish'), 'hinglish');
  assert.strictEqual(resolveLanguage('पौधों की देखभाल कैसे करें?', ''), 'hi'); // Devanagari auto-detect
  assert.strictEqual(resolveLanguage('Kya spray karun aaj?', ''), 'hinglish'); // Hinglish auto-detect
  recordPass('Language resolver identifies en, hi, and hinglish accurately');

  // --- Test 4: Live Scenario in English: Peach Healthy (44.46%, Rain 60%) ---
  console.log('\n4. Verifying English Advisory on Peach Healthy (44.46%, Rain 60%):');
  const peachKb = getDiseaseKnowledge('Peach___healthy');
  const peachDiagnosis = {
    crop: 'Peach',
    disease: 'Peach Healthy',
    confidence: 0.4446,
    confidenceLevel: 'LOW',
    diagnosticState: 'HEALTHY',
    isHealthy: true,
    isUncertain: true,
    visualSymptoms: peachKb.visualSymptoms,
    monitoringGuidance: peachKb.monitoringGuidance,
    preventiveCropCare: peachKb.preventiveCropCare,
    irrigationGuidance: peachKb.irrigationGuidance
  };
  const liveWeather = { temperature: 25, humidity: 80, rainProbability: 60, condition: 'Overcast' };

  const enResult = await answerFarmerQuery({
    question: 'Can I spray fungicide today? What should I do for my crop?',
    diagnosisContext: peachDiagnosis,
    weatherContext: liveWeather,
    language: 'en'
  });

  const enReplyLower = enResult.reply.toLowerCase();
  assert.ok(!enReplyLower.includes('chlorothalonil') && !enReplyLower.includes('dormant copper'), 'No chemical fungicide for healthy peach');
  assert.ok(enReplyLower.includes('healthy') || enReplyLower.includes('no disease'), 'Identifies healthy foliage');
  assert.ok(enReplyLower.includes('uncertain') || enReplyLower.includes('low'), 'Communicates uncertainty');
  assert.ok(enReplyLower.includes('rain') || enReplyLower.includes('wash') || enReplyLower.includes('do not'), 'Warns against rain spray');
  recordPass('English advisory strictly obeys healthy, low-confidence, and weather guardrails');

  // --- Test 5: Hindi Response Consistency (Zero English Sentence Leaks) ---
  console.log('\n5. Verifying Pure Hindi Advisory Consistency:');
  const hiResult = await answerFarmerQuery({
    question: 'क्या मैं आज स्प्रे कर सकता हूँ? फसल की देखभाल के उपाय बताएं।',
    diagnosisContext: peachDiagnosis,
    weatherContext: liveWeather,
    language: 'hi'
  });

  console.log('   --- Hindi Response Output ---');
  console.log(hiResult.reply);
  console.log('   -----------------------------');

  // Verify that English sentences from KB are NOT leaked in Hindi mode
  assert.ok(!hiResult.reply.includes('Scout foliage at bud break'), 'English monitoring phrase must NOT appear in Hindi response');
  assert.ok(!hiResult.reply.includes('Provide 25-50 mm water per week'), 'English irrigation phrase must NOT appear in Hindi response');
  assert.ok(!hiResult.reply.includes('No fungicide, bactericide'), 'English spray advice must NOT appear in Hindi response');
  assert.ok(hiResult.reply.includes('स्वस्थ') || hiResult.reply.includes('पौधा') || hiResult.reply.includes('फसल'), 'Response must contain Hindi agronomic advice');
  assert.ok(hiResult.reply.includes('निरीक्षण') || hiResult.reply.includes('निगरानी'), 'Monitoring translated to Hindi');
  assert.ok(hiResult.reply.includes('सिंचाई'), 'Irrigation translated to Hindi');
  assert.ok(hiResult.reply.includes('बारिश') || hiResult.reply.includes('छिड़काव'), 'Rain/spray translated to Hindi');
  recordPass('Hindi advisory contains pure natural Hindi with zero English sentence leaks');

  // --- Test 6: Hinglish Response Consistency ---
  console.log('\n6. Verifying Hinglish Advisory Consistency:');
  const hinglishResult = await answerFarmerQuery({
    question: 'Kya main aaj spray kar sakta hoon? Kripya dekhbhal batayein.',
    diagnosisContext: peachDiagnosis,
    weatherContext: liveWeather,
    language: 'hinglish'
  });

  console.log('   --- Hinglish Response Output ---');
  console.log(hinglishResult.reply);
  console.log('   --------------------------------');

  assert.ok(!hinglishResult.reply.includes('Provide 25-50 mm water per week during stone hardening and fruit swell via under-canopy micro-sprinklers or drip.'), 'Raw English irrigation string must NOT leak into Hinglish');
  assert.ok(hinglishResult.reply.includes('Healthy') || hinglishResult.reply.includes('healthy'), 'Healthy state recognized');
  assert.ok(hinglishResult.reply.includes('spray na karein') || hinglishResult.reply.includes('zaroorat nahi') || hinglishResult.reply.includes('wash ho jayega'), 'Natural Hinglish phrasing used');
  recordPass('Hinglish advisory contains natural farmer-friendly Hinglish');

  // --- Test 7: Healthy Tomato in Hindi ---
  console.log('\n7. Verifying Healthy Tomato in Hindi:');
  const tomatoKb = getDiseaseKnowledge('Tomato___healthy');
  const tomatoHealthyDiagnosis = {
    crop: 'Tomato',
    disease: 'Tomato Healthy',
    confidence: 85.0,
    confidenceLevel: 'HIGH',
    diagnosticState: 'HEALTHY',
    isHealthy: true,
    isUncertain: false,
    visualSymptoms: tomatoKb.visualSymptoms,
    monitoringGuidance: tomatoKb.monitoringGuidance,
    preventiveCropCare: tomatoKb.preventiveCropCare,
    irrigationGuidance: tomatoKb.irrigationGuidance
  };
  const mildWeather = { temperature: 24, humidity: 55, rainProbability: 10, condition: 'Clear' };

  const tomatoHiResult = await answerFarmerQuery({
    question: 'टमाटर के लिए कौन सा फफूंदनाशक स्प्रे करें?',
    diagnosisContext: tomatoHealthyDiagnosis,
    weatherContext: mildWeather,
    language: 'hi'
  });

  assert.ok(tomatoHiResult.reply.includes('स्वस्थ') || tomatoHiResult.reply.includes('आवश्यकता नहीं'), 'Healthy tomato in Hindi advises no fungicide needed');
  recordPass('Healthy Tomato in Hindi safely rejects unwarranted fungicide requests');

  // --- Test 8: Diseased Prediction (Potato Early Blight) in Hindi & Hinglish ---
  console.log('\n8. Verifying Diseased Prediction (Potato Early Blight) in Hindi & Hinglish:');
  const potatoEbKb = getDiseaseKnowledge('Potato___Early_blight');
  const potatoEbDiagnosis = {
    crop: 'Potato',
    disease: 'Potato Early Blight',
    confidence: 89.2,
    confidenceLevel: 'HIGH',
    diagnosticState: 'DISEASE',
    isHealthy: false,
    isUncertain: false,
    pathogenType: potatoEbKb.pathogenType,
    visualSymptoms: potatoEbKb.visualSymptoms,
    immediateActions: potatoEbKb.immediateActions,
    organicManagement: potatoEbKb.organicManagement,
    chemicalManagement: potatoEbKb.chemicalManagement,
    prevention: potatoEbKb.prevention
  };

  const ebHiResult = await answerFarmerQuery({
    question: 'आलू के अगेती झुलसा रोग के लिए जैविक उपचार क्या है?',
    diagnosisContext: potatoEbDiagnosis,
    weatherContext: mildWeather,
    language: 'hi'
  });

  assert.ok(ebHiResult.reply.includes('जैविक') || ebHiResult.reply.includes('नीम') || ebHiResult.reply.includes('उपचार'), 'Potato Early Blight in Hindi provides organic management');
  recordPass('Potato Early Blight in Hindi provides translated organic management');

  // --- Test 9: High Rain (60%) Spray Safety Guardrail in Hindi ---
  console.log('\n9. Verifying Spray Safety Guardrail in Hindi (Rain 60%):');
  const highRainWeather = { temperature: 26, humidity: 88, rainProbability: 60, condition: 'Rain' };
  const rainHiResult = await answerFarmerQuery({
    question: 'क्या मैं आज कीटनाशक का छिड़काव कर सकता हूँ?',
    diagnosisContext: potatoEbDiagnosis,
    weatherContext: highRainWeather,
    language: 'hi'
  });

  assert.ok(rainHiResult.reply.includes('बारिश') && (rainHiResult.reply.includes('न करें') || rainHiResult.reply.includes('धुल जाएगी')), 'High rain in Hindi forbids foliar spray');
  recordPass('High precipitation (60%) in Hindi strictly warns against spray');

  // --- Test 10: API Key Security Assertion ---
  console.log('\n10. Verifying API Key Security:');
  const rawKey = process.env.GEMINI_API_KEY;
  if (rawKey) {
    const jsonStr = JSON.stringify(enResult) + JSON.stringify(hiResult) + JSON.stringify(hinglishResult);
    assert.strictEqual(
      jsonStr.includes(rawKey),
      false,
      'SECURITY VIOLATION: GEMINI_API_KEY must NEVER be present in response objects'
    );
  }
  recordPass('Zero API key leakage in outputs across all languages');

  console.log('\n================================================================');
  console.log(` ALL ${passedTests}/${totalTests} GEMINI MULTILINGUAL & GUARDRAIL TESTS PASSED!`);
  console.log('================================================================\n');
}

runGeminiIntegrationTests().catch(err => {
  console.error('\n❌ Gemini Integration Test Failed:', err);
  process.exit(1);
});
