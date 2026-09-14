// Automated Test Suite for Disease Knowledge Base, Confidence Handling, and Advisory Service
const assert = require('assert');
const path = require('path');
const {
  KNOWLEDGE_BASE,
  SAFETY_DISCLAIMER,
  getDiseaseKnowledge,
  getFallbackEntry
} = require('../data/diseaseKnowledgeBase');
const { getConfidenceLevel, parseClassLabel } = require('../services/onnxInferenceService');
const { generateRecommendations } = require('../services/recommendationService');
const publicLabels = require('../models/class_labels_public.json');

async function runTests() {
  console.log('====================================================');
  console.log(' RUNNING KNOWLEDGE BASE & ADVISORY INTEGRATION TESTS');
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

  // --- 1. Confidence Level Categorization ---
  await test('getConfidenceLevel categorizes High / Moderate / Low correctly', () => {
    assert.strictEqual(getConfidenceLevel(95.0), 'High');
    assert.strictEqual(getConfidenceLevel(70.0), 'High');
    assert.strictEqual(getConfidenceLevel(69.9), 'Moderate');
    assert.strictEqual(getConfidenceLevel(45.0), 'Moderate');
    assert.strictEqual(getConfidenceLevel(44.9), 'Low');
    assert.strictEqual(getConfidenceLevel(15.2), 'Low');
  });

  // --- 2. Label Parsing ---
  await test('parseClassLabel parses disease and healthy classes into clean strings', () => {
    const d1 = parseClassLabel('Tomato___Early_blight');
    assert.strictEqual(d1.crop, 'Tomato');
    assert.strictEqual(d1.disease, 'Tomato Early blight');
    assert.strictEqual(d1.isHealthy, false);

    const d2 = parseClassLabel('Apple___healthy');
    assert.strictEqual(d2.crop, 'Apple');
    assert.strictEqual(d2.disease, 'Apple Healthy');
    assert.strictEqual(d2.isHealthy, true);
  });

  // --- 3. 28-Class Knowledge Base Completeness ---
  await test('Every public benchmark class (28 classes) exists with complete metadata', () => {
    assert.strictEqual(publicLabels.length, 28, `Expected 28 labels, got ${publicLabels.length}`);

    publicLabels.forEach(label => {
      const entry = KNOWLEDGE_BASE[label];
      assert(entry, `Missing knowledge base entry for label: ${label}`);
      assert.strictEqual(entry.rawClass, label);
      assert(entry.crop && typeof entry.crop === 'string', `${label} must have valid crop`);
      assert(entry.disease && typeof entry.disease === 'string', `${label} must have valid disease`);
      assert(typeof entry.isHealthy === 'boolean', `${label} must have isHealthy boolean`);
      assert(entry.description && entry.description.length > 20, `${label} must have rich description`);
      assert(entry.visualSymptoms && entry.visualSymptoms.length > 10, `${label} must have visual symptoms`);
      assert(entry.imageQualityGuidance, `${label} must have image quality guidance`);

      if (!entry.isHealthy) {
        assert(Array.isArray(entry.immediateActions) && entry.immediateActions.length > 0, `${label} must have immediateActions`);
        assert(Array.isArray(entry.organicManagement) && entry.organicManagement.length > 0, `${label} must have organicManagement`);
        assert(Array.isArray(entry.chemicalManagement) && entry.chemicalManagement.length > 0, `${label} must have chemicalManagement`);
        assert(Array.isArray(entry.prevention) && entry.prevention.length > 0, `${label} must have prevention`);
        assert(entry.severityGuidance && typeof entry.severityGuidance === 'object', `${label} must have severityGuidance`);
      } else {
        assert(Array.isArray(entry.preventiveCropCare) && entry.preventiveCropCare.length > 0, `${label} must have preventiveCropCare`);
        assert(entry.monitoringGuidance, `${label} must have monitoringGuidance`);
        assert(entry.irrigationGuidance, `${label} must have irrigationGuidance`);
      }
    });
  });

  // --- 4. getDiseaseKnowledge Lookup (Direct & Fuzzy) ---
  await test('getDiseaseKnowledge retrieves exact and formatted lookups', () => {
    const entry1 = getDiseaseKnowledge('Tomato___Late_blight');
    assert.strictEqual(entry1.disease, 'Tomato Late Blight');
    assert.strictEqual(entry1.crop, 'Tomato');

    const entry2 = getDiseaseKnowledge('Tomato Late Blight');
    assert.strictEqual(entry2.rawClass, 'Tomato___Late_blight');

    const entry3 = getDiseaseKnowledge('Apple Scab');
    assert.strictEqual(entry3.rawClass, 'Apple___Apple_scab');
  });

  // --- 5. Safe Fallback on Unknown Query ---
  await test('getDiseaseKnowledge fails safely for unknown classes', () => {
    const fallback = getDiseaseKnowledge('Unknown_Exotic_Fungus');
    assert(fallback, 'Fallback object must be returned');
    assert.strictEqual(fallback.crop, 'General Crop');
    assert(fallback.description.length > 0);
    assert(Array.isArray(fallback.immediateActions));
    assert(Array.isArray(fallback.organicManagement));
    assert(Array.isArray(fallback.chemicalManagement));
  });

  // --- 6. Recommendation Service Integration with Knowledge Base ---
  await test('generateRecommendations embeds agronomic advisory into output', async () => {
    const rec = await generateRecommendations({
      crop: 'Tomato',
      disease: 'Tomato Early Blight',
      soilMoisture: 45
    });

    assert(rec, 'Recommendation output must not be null');
    assert(rec.agronomicAdvisory, 'agronomicAdvisory must be attached');
    assert.strictEqual(rec.agronomicAdvisory.crop, 'Tomato');
    assert(rec.agronomicAdvisory.immediateActions.length > 0);
    assert.strictEqual(rec.agronomicAdvisory.safetyDisclaimer, SAFETY_DISCLAIMER);
    assert(rec.irrigation, 'Irrigation recommendation must be computed');
  });

  // --- 7. Safety Disclaimer Integrity ---
  await test('Safety disclaimer reminds users of extension officers and registered labels', () => {
    assert(SAFETY_DISCLAIMER.includes('registered chemical product labels'));
    assert(SAFETY_DISCLAIMER.includes('Krishi Vigyan Kendra'));
  });

  console.log('\n====================================================');
  console.log(` TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
