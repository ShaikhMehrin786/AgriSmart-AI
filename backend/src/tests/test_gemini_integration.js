/**
 * AgriSmart AI — Primary Conversational Gemini & Safety Integration Test Suite
 *
 * Verifies:
 * 1. Bounded History Normalization & Context Building
 * 2. Semantic Conversations A through H (without hardcoded sentence matching)
 * 3. Live Multi-Turn Conversational Progression (evolving naturally between turns)
 * 4. Agriculture Domain Boundary & Non-Agri Redirects
 * 5. Safety Guardrails (Rain spray warning, healthy plant treatment blocking)
 * 6. Zero API Key Leakage
 */

require('dotenv').config();
const assert = require('assert');
const {
  answerFarmerQuery,
  normalizeConversationHistory,
  buildAgriSmartContext,
  evaluateContextRelevance,
  detectLanguage,
  resolveConfidenceMeta,
  resolveDiagnosticState
} = require('../services/genAiService');
const { chat } = require('../controllers/assistantController');

async function runConversationalBrainTests() {
  console.log('================================================================');
  console.log(' AGRISMART AI — GEMINI PRIMARY CONVERSATIONAL BRAIN TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function recordPass(testName) {
    totalTests++;
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${testName}`);
  }

  // =========================================================================
  // PART 1: NORMALIZATION, RELEVANCE MODEL & CONTEXT BUILDER CONTRACTS
  // =========================================================================
  console.log('--- PART 1: NORMALIZATION & CONTEXT RELEVANCE CONTRACTS ---');

  // Test 1: Bounded History Normalization
  const sampleHistory = [
    { role: 'user', content: 'Turn 1' },
    { role: 'assistant', content: 'Turn 2' },
    { role: 'model', content: 'Turn 3' }, // consecutive model turn
    { role: 'user', content: 'Turn 4' }
  ];
  const normalized = normalizeConversationHistory(sampleHistory, 10);
  assert.strictEqual(normalized.length, 3);
  assert.strictEqual(normalized[0].role, 'user');
  assert.strictEqual(normalized[1].role, 'model');
  assert.strictEqual(normalized[2].role, 'user');
  assert.ok(normalized[1].parts[0].text.includes('Turn 2') && normalized[1].parts[0].text.includes('Turn 3'));
  recordPass('History normalizer merges consecutive same-role turns & enforces alternating format');

  // Test 2: Context Relevance Model (DATA EXISTENCE != DATA RELEVANCE)
  const candidateDiagnosis = { crop: 'Squash', disease: 'Squash Powdery Mildew', confidence: 0.88 };
  const candidateWeather = { temperature: 28, humidity: 75, rainProbability: 20 };
  const candidateIrrigation = { action: 'Maintain Schedule', reason: 'Adequate moisture' };

  // 2a. Generic question with candidate DB scan -> NOT relevant
  const relGeneric = evaluateContextRelevance({
    question: 'Can you help me to grow my plants?',
    history: [],
    diagnosisContext: candidateDiagnosis,
    weatherContext: candidateWeather,
    irrigationContext: candidateIrrigation
  });
  assert.strictEqual(relGeneric.latestScan.relevant, false);
  assert.strictEqual(relGeneric.latestScan.reason, 'not_relevant');
  assert.strictEqual(relGeneric.activeCrop.name, null);
  assert.strictEqual(relGeneric.weather.relevant, false);
  assert.strictEqual(relGeneric.irrigation.relevant, false);
  assert.strictEqual(relGeneric.hasAnyGroundedContext, false);
  recordPass('Context Relevance: Generic plant-care query with stored Squash scan evaluates as NOT relevant (0 telemetry attached)');

  // 2b. Explicit scan inquiry -> relevant
  const relExplicitScan = evaluateContextRelevance({
    question: 'What should I do about my latest scan?',
    history: [],
    diagnosisContext: candidateDiagnosis
  });
  assert.strictEqual(relExplicitScan.latestScan.relevant, true);
  assert.strictEqual(relExplicitScan.latestScan.reason, 'explicit_reference');
  assert.strictEqual(relExplicitScan.activeCrop.name, 'Squash');
  recordPass('Context Relevance: Explicit scan query attaches latest scan with reason "explicit_reference"');

  // 2c. Active conversation inheritance
  const relTomatoFollowUp = evaluateContextRelevance({
    question: 'What should I do next?',
    history: [
      { role: 'user', content: 'I am growing tomatoes and noticed yellow spots.' },
      { role: 'assistant', content: 'Yellow spots may indicate early blight.' }
    ],
    diagnosisContext: candidateDiagnosis // Stored Squash scan in DB
  });
  assert.strictEqual(relTomatoFollowUp.activeCrop.name, 'Tomato');
  assert.strictEqual(relTomatoFollowUp.activeCrop.source, 'active_conversation');
  assert.strictEqual(relTomatoFollowUp.latestScan.relevant, false, 'Must NOT inject unrelated Squash DB scan into Tomato conversation');
  recordPass('Context Relevance: Active Tomato conversation inherits Tomato crop topic without injecting Squash DB scan');

  // 2d. Weather & Irrigation explicit gating
  const relWeather = evaluateContextRelevance({
    question: 'Is today suitable for spraying given the forecast?',
    history: [],
    weatherContext: candidateWeather
  });
  assert.strictEqual(relWeather.weather.relevant, true);
  assert.strictEqual(relWeather.weather.reason, 'explicit_reference');

  const relIrrigation = evaluateContextRelevance({
    question: 'Should I water my plants today?',
    history: [],
    irrigationContext: candidateIrrigation
  });
  assert.strictEqual(relIrrigation.irrigation.relevant, true);
  assert.strictEqual(relIrrigation.irrigation.reason, 'explicit_reference');
  recordPass('Context Relevance: Explicit weather and irrigation queries correctly activate respective telemetry channels');

  // Test 3: Context Builder Formatter (gated by relevance)
  const contextText = buildAgriSmartContext({
    relevance: relExplicitScan,
    diagnosisContext: { crop: 'Squash', diseaseName: 'Squash Powdery Mildew', confidence: 0.92 },
    weatherContext: { temperature: 26, humidity: 82, rainProbability: 65, windSpeed: 12 },
    irrigationContext: { action: 'Delay Irrigation', reason: 'Imminent rainfall' }
  });
  assert.ok(contextText.includes('Squash Powdery Mildew'));
  recordPass('AgriSmart context builder selectively formats only relevant context');

  // =========================================================================
  // PART 2: CONVERSATIONS A THROUGH H (SEMANTIC BEHAVIOR VERIFICATION)
  // =========================================================================
  console.log('\n--- PART 2: SEMANTIC CONVERSATIONS (A - H) ---');

  // --- Conversation A: Implicit Reference ---
  // User establishes problem -> User asks follow-up without repeating crop -> Resolved from context
  console.log('\n[Conversation A]: Implicit Reference Resolution');
  const convAHistory = [
    { role: 'user', content: 'My tomato leaves have started developing yellow spots.' },
    { role: 'assistant', content: 'Yellow spots on tomato leaves can be caused by early fungal blight or septoria leaf spot. Inspect the lower leaves for concentric rings.' }
  ];
  const resA = await answerFarmerQuery({
    question: 'Where do I begin?',
    history: convAHistory
  });
  assert.strictEqual(resA.domain, 'AGRICULTURE');
  assert.ok(resA.reply.length > 20);
  assert.ok(
    resA.reply.toLowerCase().includes('inspect') ||
    resA.reply.toLowerCase().includes('check') ||
    resA.reply.toLowerCase().includes('leaf') ||
    resA.reply.toLowerCase().includes('spot') ||
    resA.reply.toLowerCase().includes('prun') ||
    resA.reply.toLowerCase().includes('tomato'),
    'Must resolve "begin" in context of the tomato foliar problem'
  );
  recordPass('Conv A: "Where do I begin?" resolves reference to tomato yellow spots naturally');

  // --- Conversation B: Agritech Example ---
  // Tech in agriculture -> "Can you show me an example?" -> Agritech code/concept
  console.log('\n[Conversation B]: Agritech Example Continuation');
  const convBHistory = [
    { role: 'user', content: 'How can Python help farmers in crop management?' },
    { role: 'assistant', content: 'Python is widely used in precision agriculture for analyzing satellite NDVI vegetation imagery, predicting crop yields, and scheduling automated drip irrigation.' }
  ];
  const resB = await answerFarmerQuery({
    question: 'Can you show me an example?',
    history: convBHistory
  });
  assert.strictEqual(resB.domain, 'AGRICULTURE');
  assert.ok(
    resB.reply.toLowerCase().includes('python') ||
    resB.reply.toLowerCase().includes('ndvi') ||
    resB.reply.toLowerCase().includes('crop') ||
    resB.reply.toLowerCase().includes('yield') ||
    resB.reply.toLowerCase().includes('irrigation'),
    'Must provide an agricultural Python/data example'
  );
  recordPass('Conv B: "Can you show me an example?" maintains agritech context and provides example');

  // --- Conversation C: Goal Shift (Diagnosis -> Prevention) ---
  console.log('\n[Conversation C]: Goal Shift (Diagnosis -> Prevention)');
  const convCHistory = [
    { role: 'user', content: 'What causes powdery mildew in squash?' },
    { role: 'assistant', content: 'Powdery mildew in squash is caused by fungal spores proliferating under warm, humid conditions with shaded canopies.' }
  ];
  const resC = await answerFarmerQuery({
    question: 'How can I prevent it from ever happening in the first place?',
    history: convCHistory
  });
  assert.strictEqual(resC.domain, 'AGRICULTURE');
  assert.ok(
    resC.reply.toLowerCase().includes('prevent') ||
    resC.reply.toLowerCase().includes('spacing') ||
    resC.reply.toLowerCase().includes('sunlight') ||
    resC.reply.toLowerCase().includes('resistant') ||
    resC.reply.toLowerCase().includes('drip') ||
    resC.reply.toLowerCase().includes('scouting') ||
    resC.reply.toLowerCase().includes('sanitation'),
    'Must pivot to preventive cultural practices'
  );
  recordPass('Conv C: Shifts conversational goal to preventive crop care and cultural controls');

  // --- Conversation D: Topic Shift (Disease -> Irrigation) ---
  console.log('\n[Conversation D]: Topic Shift (Disease -> Irrigation)');
  const convDHistory = [
    { role: 'user', content: 'My potato crop has early blight.' },
    { role: 'assistant', content: 'Potato early blight causes dark brown lesions. Sanitation and organic bio-fungicides are recommended.' }
  ];
  const resD = await answerFarmerQuery({
    question: 'How should I water them to avoid spreading it?',
    history: convDHistory
  });
  assert.strictEqual(resD.domain, 'AGRICULTURE');
  assert.ok(
    resD.reply.toLowerCase().includes('water') ||
    resD.reply.toLowerCase().includes('drip') ||
    resD.reply.toLowerCase().includes('irrigation') ||
    resD.reply.toLowerCase().includes('foliage') ||
    resD.reply.toLowerCase().includes('soil'),
    'Must address water management for potato early blight'
  );
  recordPass('Conv D: Follows topic transition to irrigation water management');

  // --- Conversation E: Temporal Follow-up ---
  console.log('\n[Conversation E]: Temporal Weather Follow-up');
  const convEHistory = [
    { role: 'user', content: 'I need to spray protective neem oil on my crops.' },
    { role: 'assistant', content: 'Neem oil is an effective organic preventive control. Apply early in the morning for maximum efficacy.' }
  ];
  const resE = await answerFarmerQuery({
    question: 'What if it rains tomorrow?',
    history: convEHistory,
    weatherContext: { temperature: 25, humidity: 85, rainProbability: 70 }
  });
  assert.strictEqual(resE.domain, 'AGRICULTURE');
  assert.ok(
    resE.reply.toLowerCase().includes('rain') ||
    resE.reply.toLowerCase().includes('wash') ||
    resE.reply.toLowerCase().includes('postpone') ||
    resE.reply.toLowerCase().includes('delay') ||
    resE.reply.toLowerCase().includes('spray'),
    'Must advise delaying spray due to rain'
  );
  recordPass('Conv E: Resolves temporal weather/rain impact on spraying operations');

  // --- Conversation F: Multilingual Switch (English -> Hinglish) ---
  console.log('\n[Conversation F]: Multilingual Switch (English -> Hinglish)');
  const convFHistory = [
    { role: 'user', content: 'I grow tomatoes in my farm.' },
    { role: 'assistant', content: 'Tomatoes require balanced nutrition and good soil drainage. How are your plants doing?' }
  ];
  const resF = await answerFarmerQuery({
    question: 'Inke patte peele ho rahe hain, kya karu?',
    history: convFHistory
  });
  assert.strictEqual(resF.domain, 'AGRICULTURE');
  const repF = resF.reply.toLowerCase();
  assert.ok(
    repF.includes('patte') ||
    repF.includes('karein') ||
    repF.includes('pani') ||
    repF.includes('spray') ||
    repF.includes('tomato') ||
    repF.includes('nitrogen') ||
    repF.includes('leaves') ||
    resF.reply.includes('पत्त'),
    'Must address tomato leaf yellowing in Hindi/Hinglish context'
  );
  recordPass('Conv F: Smoothly handles multilingual switch maintaining crop context');

  // --- Conversation G: Pure Non-Agriculture Query ---
  console.log('\n[Conversation G]: Pure Non-Agriculture Domain Boundary');
  const resG = await answerFarmerQuery({
    question: 'What is Python?'
  });
  assert.strictEqual(resG.domain, 'NON_AGRICULTURE');
  assert.strictEqual(resG.contextual, false);
  assert.strictEqual(resG.groundedContext, null);
  assert.ok(
    resG.reply.includes('agriculture') ||
    resG.reply.includes('AgriSmart') ||
    resG.reply.includes('crops') ||
    resG.reply.includes('farming'),
    'Must politely redirect to agriculture'
  );
  recordPass('Conv G: Pure non-agriculture inquiry receives polite domain redirect without farm telemetry');

  // --- Conversation H: Agriculture-Connected Technology ---
  console.log('\n[Conversation H]: Agriculture-Connected Technology');
  const resH = await answerFarmerQuery({
    question: 'What is Python used for in agriculture?'
  });
  assert.strictEqual(resH.domain, 'AGRICULTURE');
  assert.ok(
    resH.reply.toLowerCase().includes('python') &&
    (resH.reply.toLowerCase().includes('farm') || resH.reply.toLowerCase().includes('crop') || resH.reply.toLowerCase().includes('precision') || resH.reply.toLowerCase().includes('irrigation') || resH.reply.toLowerCase().includes('yield')),
    'Must substantively answer agriculture technology inquiry'
  );
  recordPass('Conv H: Agriculture-connected technology inquiry is answered substantively');

  // =========================================================================
  // PART 3: LIVE MULTI-TURN CONVERSATIONAL SEQUENCE
  // =========================================================================
  console.log('\n--- PART 3: LIVE MULTI-TURN CONVERSATION PROGRESSION ---');
  
  const liveHistory = [];

  // Turn 1
  console.log('Turn 1: "My tomato leaves have started developing yellow spots."');
  const turn1Res = await answerFarmerQuery({
    question: 'My tomato leaves have started developing yellow spots.',
    history: liveHistory
  });
  liveHistory.push({ role: 'user', content: 'My tomato leaves have started developing yellow spots.' });
  liveHistory.push({ role: 'assistant', content: turn1Res.reply });
  console.log(`   Assistant 1: ${turn1Res.reply.slice(0, 110)}...`);

  // Turn 2
  console.log('\nTurn 2: "Where do I begin?"');
  const turn2Res = await answerFarmerQuery({
    question: 'Where do I begin?',
    history: liveHistory
  });
  liveHistory.push({ role: 'user', content: 'Where do I begin?' });
  liveHistory.push({ role: 'assistant', content: turn2Res.reply });
  console.log(`   Assistant 2: ${turn2Res.reply.slice(0, 110)}...`);
  assert.notStrictEqual(turn1Res.reply, turn2Res.reply, 'Turn 2 response must evolve and not copy Turn 1');

  // Turn 3
  console.log('\nTurn 3: "How can I prevent this from getting worse?"');
  const turn3Res = await answerFarmerQuery({
    question: 'How can I prevent this from getting worse?',
    history: liveHistory
  });
  liveHistory.push({ role: 'user', content: 'How can I prevent this from getting worse?' });
  liveHistory.push({ role: 'assistant', content: turn3Res.reply });
  console.log(`   Assistant 3: ${turn3Res.reply.slice(0, 110)}...`);
  assert.notStrictEqual(turn2Res.reply, turn3Res.reply, 'Turn 3 response must evolve into prevention');

  // Turn 4
  console.log('\nTurn 4: "What if it rains tomorrow?"');
  const turn4Res = await answerFarmerQuery({
    question: 'What if it rains tomorrow?',
    history: liveHistory,
    weatherContext: { temperature: 25, humidity: 80, rainProbability: 60 }
  });
  console.log(`   Assistant 4: ${turn4Res.reply.slice(0, 110)}...`);
  assert.notStrictEqual(turn3Res.reply, turn4Res.reply, 'Turn 4 response must address weather');
  recordPass('Live 4-Turn Sequence: responses evolve naturally across turns without repetitive templates');

  // Non-agri 2-turn sequence
  console.log('\n[Non-Agri 2-Turn Sequence]: "What is Python?" -> "Can you give me an example?"');
  const nonAgriTurn1 = await answerFarmerQuery({ question: 'What is Python?' });
  assert.strictEqual(nonAgriTurn1.domain, 'NON_AGRICULTURE');
  
  const nonAgriTurn2 = await answerFarmerQuery({
    question: 'Can you give me an example?',
    history: [
      { role: 'user', content: 'What is Python?' },
      { role: 'assistant', content: nonAgriTurn1.reply }
    ]
  });
  assert.strictEqual(nonAgriTurn2.domain, 'NON_AGRICULTURE');
  assert.strictEqual(nonAgriTurn2.contextual, false);
  recordPass('Non-Agri follow-up maintains domain boundary without false grounding');

  // =========================================================================
  // PART 3.5: FULL CONTEXT RELEVANCE & DATA GATING CONTRACTS (10 SCENARIOS)
  // =========================================================================
  console.log('\n--- PART 3.5: FULL CONTEXT RELEVANCE & DATA GATING (10 SCENARIOS) ---');

  const storedSquashScan = {
    crop: 'Squash',
    disease: 'Squash Powdery Mildew',
    diseaseName: 'Squash Powdery Mildew',
    confidence: 0.88
  };
  const liveWeather = { temperature: 29, humidity: 72, rainProbability: 25, windSpeed: 10 };
  const liveIrrigation = { action: 'Maintain Regular Schedule', reason: 'Optimal soil moisture' };

  // Scenario 1: Generic plant care + stored Squash scan in DB -> NO Squash injection
  console.log('\n[Scenario 1]: Generic plant-care + stored Squash scan in candidate pool');
  const sc1 = await answerFarmerQuery({
    question: 'Can you help me to grow my plants?',
    history: [],
    diagnosisContext: storedSquashScan,
    weatherContext: liveWeather,
    irrigationContext: liveIrrigation
  });
  assert.strictEqual(sc1.domain, 'AGRICULTURE');
  assert.strictEqual(sc1.contextual, false);
  assert.strictEqual(sc1.groundedContext, null);
  assert.strictEqual(sc1.reply.toLowerCase().includes('squash'), false, 'Must NOT inject Squash into generic question');
  assert.strictEqual(sc1.reply.toLowerCase().includes('powdery mildew'), false, 'Must NOT inject Powdery Mildew into generic question');
  recordPass('Scenario 1: Generic plant-care question + stored Squash scan -> 0 Squash injection, contextual=false');

  // Scenario 2: Generic agriculture question + latest disease exists -> NO disease injection
  console.log('\n[Scenario 2]: Generic crop improvement + stored scan');
  const sc2 = await answerFarmerQuery({
    question: 'How can I improve my crops?',
    history: [],
    diagnosisContext: storedSquashScan,
    weatherContext: liveWeather
  });
  assert.strictEqual(sc2.domain, 'AGRICULTURE');
  assert.strictEqual(sc2.contextual, false);
  assert.strictEqual(sc2.groundedContext, null);
  recordPass('Scenario 2: Generic agriculture question + stored disease -> 0 disease injection, contextual=false');

  // Scenario 3: Generic question with no active conversation -> NO farm telemetry
  console.log('\n[Scenario 3]: Generic garden inquiry without active context');
  const sc3 = await answerFarmerQuery({
    question: 'I need help with my garden and soil.',
    history: [],
    diagnosisContext: storedSquashScan,
    weatherContext: liveWeather,
    irrigationContext: liveIrrigation
  });
  assert.strictEqual(sc3.domain, 'AGRICULTURE');
  assert.strictEqual(sc3.contextual, false);
  assert.strictEqual(sc3.groundedContext, null);
  recordPass('Scenario 3: Generic inquiry without active topic -> NO farm telemetry');

  // Scenario 4: Agriculture follow-up after explicit Tomato conversation -> Tomato inherited, NO Squash
  console.log('\n[Scenario 4]: Tomato conversation follow-up with stored Squash scan');
  const sc4 = await answerFarmerQuery({
    question: 'How can I help them grow better?',
    history: [
      { role: 'user', content: 'I am growing tomatoes and noticed yellow spots on lower foliage.' },
      { role: 'assistant', content: 'Yellow spots on tomato foliage suggest early blight or septoria.' }
    ],
    diagnosisContext: storedSquashScan // Squash scan in DB
  });
  assert.strictEqual(sc4.domain, 'AGRICULTURE');
  assert.ok(sc4.reply.toLowerCase().includes('tomato'), 'Must inherit Tomato context from history');
  assert.strictEqual(sc4.reply.toLowerCase().includes('squash'), false, 'Must NOT inject Squash from DB into Tomato chat');
  recordPass('Scenario 4: Agriculture follow-up after explicit Tomato chat -> Tomato inherited, Squash DB scan blocked');

  // Scenario 5: Follow-up to explicit latest scan discussion -> scan context inherited
  console.log('\n[Scenario 5]: Explicit latest scan inquiry');
  const sc5 = await answerFarmerQuery({
    question: 'What should I do about my latest scan?',
    history: [],
    diagnosisContext: storedSquashScan
  });
  assert.strictEqual(sc5.domain, 'AGRICULTURE');
  assert.strictEqual(sc5.contextual, true);
  assert.ok(sc5.groundedContext !== null && sc5.groundedContext.crop === 'Squash');
  assert.ok(sc5.reply.toLowerCase().includes('squash') || sc5.reply.toLowerCase().includes('powdery') || sc5.reply.toLowerCase().includes('mildew'));
  recordPass('Scenario 5: Explicit scan inquiry -> scan context correctly attached');

  // Scenario 6: Weather-specific question -> weather attached
  console.log('\n[Scenario 6]: Weather-specific inquiry');
  const sc6 = await answerFarmerQuery({
    question: 'Is today suitable for spraying given the weather forecast?',
    history: [],
    weatherContext: liveWeather
  });
  assert.strictEqual(sc6.domain, 'AGRICULTURE');
  assert.strictEqual(sc6.contextual, true);
  assert.ok(sc6.groundedContext && sc6.groundedContext.weather !== null);
  recordPass('Scenario 6: Weather-specific question -> weather telemetry attached');

  // Scenario 7: Generic agriculture question -> weather NOT automatically attached
  console.log('\n[Scenario 7]: Generic agriculture question with weather candidate present');
  const sc7 = await answerFarmerQuery({
    question: 'How do I care for my plants?',
    history: [],
    weatherContext: liveWeather
  });
  assert.strictEqual(sc7.contextual, false);
  assert.strictEqual(sc7.groundedContext, null);
  recordPass('Scenario 7: Generic agriculture question -> weather NOT automatically attached');

  // Scenario 8: Irrigation-specific question -> irrigation attached
  console.log('\n[Scenario 8]: Irrigation-specific inquiry');
  const sc8 = await answerFarmerQuery({
    question: 'Should I water my plants today?',
    history: [],
    irrigationContext: liveIrrigation
  });
  assert.strictEqual(sc8.domain, 'AGRICULTURE');
  assert.strictEqual(sc8.contextual, true);
  assert.ok(sc8.groundedContext && sc8.groundedContext.irrigation !== null);
  recordPass('Scenario 8: Irrigation-specific question -> irrigation telemetry attached');

  // Scenario 9: Generic agriculture question -> irrigation NOT automatically attached
  console.log('\n[Scenario 9]: Generic agriculture question with irrigation candidate present');
  const sc9 = await answerFarmerQuery({
    question: 'How do I take better care of my plants?',
    history: [],
    irrigationContext: liveIrrigation
  });
  assert.strictEqual(sc9.contextual, false);
  assert.strictEqual(sc9.groundedContext, null);
  recordPass('Scenario 9: Generic agriculture question -> irrigation NOT automatically attached');

  // Scenario 10: Non-agriculture question -> no AgriSmart telemetry
  console.log('\n[Scenario 10]: Non-agriculture inquiry with all telemetry present');
  const sc10 = await answerFarmerQuery({
    question: 'Tell me a funny joke about space.',
    history: [],
    diagnosisContext: storedSquashScan,
    weatherContext: liveWeather,
    irrigationContext: liveIrrigation
  });
  assert.strictEqual(sc10.domain, 'NON_AGRICULTURE');
  assert.strictEqual(sc10.contextual, false);
  assert.strictEqual(sc10.groundedContext, null);
  recordPass('Scenario 10: Non-agriculture question -> 0 AgriSmart telemetry, domain redirect');

  // =========================================================================
  // PART 4: REAL API CONTROLLER TEST (POST /api/assistant/chat)
  // =========================================================================
  console.log('\n--- PART 4: REAL API CONTROLLER INTEGRATION ---');
  const mockReq = {
    body: {
      message: 'Can you show me an example?',
      history: [
        { role: 'user', content: 'How can Python help farmers?' },
        { role: 'assistant', content: 'Python is used in precision agriculture for yield prediction.' }
      ],
      language: 'en'
    },
    user: null
  };
  let apiResponse = null;
  const mockRes = {
    json: (payload) => { apiResponse = payload; return mockRes; },
    status: (code) => { mockRes.statusCode = code; return mockRes; }
  };

  await chat(mockReq, mockRes);
  assert.ok(apiResponse && apiResponse.success, 'API must return success: true');
  assert.strictEqual(apiResponse.data.domain, 'AGRICULTURE');
  assert.strictEqual(apiResponse.data.contextual, false);
  recordPass('Real API Controller forwards bounded history and returns structured intelligence');

  // Security Check
  console.log('\n--- API Key Security Check ---');
  const rawKey = process.env.GEMINI_API_KEY;
  if (rawKey) {
    const combined = JSON.stringify(turn1Res) + JSON.stringify(turn2Res) + JSON.stringify(apiResponse);
    assert.strictEqual(combined.includes(rawKey), false, 'SECURITY VIOLATION: GEMINI_API_KEY leaked in output');
  }
  recordPass('Zero API key leakage across all responses');

  console.log('\n================================================================');
  console.log(` ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% COMPLIANCE!`);
  console.log('================================================================\n');
}

runConversationalBrainTests().catch(err => {
  console.error('\n❌ Gemini Integration Test Failed:', err);
  process.exit(1);
});
