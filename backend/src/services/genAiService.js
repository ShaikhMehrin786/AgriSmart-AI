// Grounded GenAI Agronomist Service
// Grounded RAG Decision-Support for Farmers with Strict Agronomic & Weather Guardrails
const axios = require('axios');
const { getDiseaseKnowledge, SAFETY_DISCLAIMER } = require('../data/diseaseKnowledgeBase');
const { getDiseaseMonograph } = require('./diseaseService');
const { calculateSustainabilityScore } = require('./sustainabilityService');

const GEMINI_API_TIMEOUT_MS = 15000;

const SAFETY_DISCLAIMERS = {
  en: "Always read and adhere to registered chemical product labels in your jurisdiction. Follow prescribed PPE (Personal Protective Equipment) and Pre-Harvest Intervals (PHI). Consult your local Krishi Vigyan Kendra (KVK) or State Agricultural Extension Officer for region-specific spray schedules.",
  hi: "हमेशा पंजीकृत कृषि उत्पाद लेबल के निर्देशों का पालन करें। निर्धारित पीपीई (PPE) और फसल कटाई पूर्व अंतराल (PHI) का ध्यान रखें। क्षेत्र-विशिष्ट स्प्रे मार्गदर्शन के लिए अपने स्थानीय कृषि विज्ञान केंद्र (KVK) या कृषि प्रसार अधिकारी से संपर्क करें।",
  hinglish: "Hamesha registered chemical product labels ke directions follow karein. Prescribed PPE aur Pre-Harvest Intervals (PHI) ka dhyan rakhein. Apne local Krishi Vigyan Kendra (KVK) ya Agricultural Extension Officer se consult karein."
};

/**
 * Multilingual Agronomic Translation Dictionary
 */
const AGRONOMIC_TRANSLATIONS = {
  // Monitoring phrases
  'Scout foliage at bud break for reddish leaf thickening or puckering.': {
    hi: 'कलियों के फूटने के समय पत्तियों पर लालिमा, सिकुड़न या विकृति के लक्षणों का नियमित निरीक्षण करें।',
    hinglish: 'Bud break ke time leaves par laal pan ya puckering ke symptoms ko regular check karein.'
  },
  'Regularly inspect foliar canopy and leaf undersides for any early signs of spots or puckering.': {
    hi: 'पत्तियों की निचली सतह और नई शाखाओं पर धब्बों या सिकुड़न के शुरुआती लक्षणों का नियमित निरीक्षण करें।',
    hinglish: 'Leaves ke niche aur nayi branches par spots ya curling ke early signs regular check karein.'
  },
  'Scout leaf undersides and new growth weekly for early signs of spots or discoloration.': {
    hi: 'पत्तियों की निचली सतह और नई वृद्धि का साप्ताहिक निरीक्षण करें ताकि धब्बे या बदरंग होने के शुरुआती लक्षण तुरंत पहचाने जा सकें।',
    hinglish: 'Leaves ki lower surface aur nayi growth par spots ya discoloration ke early signs weekly check karein.'
  },
  'Continue regular field scouting and visual monitoring.': {
    hi: 'खेत की नियमित निगरानी और पत्तियों का सतत दृश्य निरीक्षण जारी रखें।',
    hinglish: 'Field ki regular scouting aur leaves ka visual inspection continue rakhein.'
  },
  'Continue routine visual monitoring of canopy foliage.': {
    hi: 'पौधों की पत्तियों और छत्रक का नियमित दृश्य निरीक्षण जारी रखें।',
    hinglish: 'Canopy foliage ka routine visual monitoring continue rakhein.'
  },

  // Irrigation phrases
  'Provide 25-50 mm water per week during stone hardening and fruit swell via under-canopy micro-sprinklers or drip.': {
    hi: 'फल विकास व कड़ा होने की अवस्था में ड्रिप या माइक्रो-स्प्रिंकलर द्वारा प्रति सप्ताह 25-50 मिमी जल दें; पत्तियों को गीला करने से बचें।',
    hinglish: 'Fruit swell aur stone hardening ke time drip ya under-canopy micro-sprinklers se weekly 25-50 mm paani dein; leaves ko geela na karein.'
  },
  'Provide appropriate root-zone irrigation via drip; avoid wetting foliage.': {
    hi: 'ड्रिप सिंचाई द्वारा पौधों की जड़ों में आवश्यकतानुसार पानी दें; पत्तियों को ऊपर से गीला करने से बचें।',
    hinglish: 'Drip irrigation se root zone mein paani dein; foliage ko geela karne se bachein.'
  },
  'Provide appropriate root-zone irrigation; avoid wetting foliage.': {
    hi: 'ड्रिप सिंचाई द्वारा पौधों की जड़ों में पानी दें; पत्तियों पर पानी के छिड़काव से बचें।',
    hinglish: 'Root zone mein drip se paani dein; foliage ko geela na karein.'
  },
  'Water at the soil line with drip systems; avoid overhead sprinklers that wet foliage for extended periods.': {
    hi: 'ड्रिप प्रणाली द्वारा सीधे मिट्टी की सतह पर पानी दें; पत्तियों को लंबे समय तक गीला रखने वाले फव्वारों से बचें।',
    hinglish: 'Drip system se directly mitti par paani dein; overhead sprinklers avoid karein jo leaves ko geela rakhte hain.'
  },
  'Utilize drip irrigation underneath vine canopies. Avoid any sprinkler misting.': {
    hi: 'बेलों के नीचे ड्रिप सिंचाई का प्रयोग करें। पत्तियों पर फव्वारा सिंचाई से बचें।',
    hinglish: 'Vine canopy ke niche drip irrigation use karein. Sprinkler misting avoid karein.'
  },

  // Preventive Care & General Actions
  'Maintain balanced nitrogen fertilization; avoid excess late-season nitrogen which delays winter hardiness.': {
    hi: 'संतुलित नाइट्रोजन उर्वरक दें; मौसम के अंत में अत्यधिक नाइट्रोजन देने से बचें जो शीत सहनशीलता घटाता है।',
    hinglish: 'Balanced nitrogen fertilizer dein; late-season excessive nitrogen avoid karein jo winter hardiness kam karta hai.'
  },
  'Maintain balanced crop nutrition, proper plant spacing, and clean hygiene.': {
    hi: 'संतुलित पोषण दें, पौधों के बीच उचित दूरी रखें और खेत को खरपतवार मुक्त व स्वच्छ रखें।',
    hinglish: 'Balanced crop nutrition dein, proper plant spacing rakhein aur field clean rakhein.'
  },
  'Maintain balanced nitrogen and potassium nutrition; clean weeding.': {
    hi: 'संतुलित नाइट्रोजन और पोटाश पोषण दें; समय पर निराई-गुड़ाई कर खेत साफ़ रखें।',
    hinglish: 'Balanced nitrogen aur potassium nutrition dein; regular weeding karke field clean rakhein.'
  },
  'Ensure proper row spacing, clean crop rotation, and disease-free certified seeds.': {
    hi: 'पौधों के बीच उचित दूरी, फसल चक्र और प्रमाणित रोगमुक्त बीजों का प्रयोग सुनिश्चित करें।',
    hinglish: 'Proper row spacing rakhein, crop rotation karein aur disease-free certified seeds use karein.'
  },

  // Disease Management / Immediate Actions
  'Inspect leaf undersides daily': {
    hi: 'पत्तियों की निचली सतह का प्रतिदिन निरीक्षण करें',
    hinglish: 'Leaves ki lower surface ko daily inspect karein'
  },
  'Prune heavily spotted lower leaves': {
    hi: 'अधिक धब्बे वाली निचली पत्तियों को काटकर नष्ट करें',
    hinglish: 'Heavy spots wali lower leaves ko prune karke destroy karein'
  },
  'Sanitize pruning tools': {
    hi: 'कटाई-छंटाई के औजारों को विसंक्रमित (sanitize) करें',
    hinglish: 'Pruning tools ko sanitize karein'
  },
  'Neem oil foliar spray (5ml/L)': {
    hi: 'नीम तेल का पर्णीय छिड़काव (5 मिली/लीटर)',
    hinglish: 'Neem oil foliar spray (5ml/L)'
  },
  'Bio-fungicide (Trichoderma viride or Bacillus subtilis)': {
    hi: 'जैविक कवकनाशी (ट्राइकोडर्मा विरिडी या बैसिलस सबटिलिस)',
    hinglish: 'Bio-fungicide (Trichoderma viride ya Bacillus subtilis)'
  },
  'Consult local KVK or extension officer for registered protective fungicides': {
    hi: 'पंजीकृत सुरक्षात्मक कवकनाशियों की सटीक खुराक के लिए स्थानीय कृषि विज्ञान केंद्र (KVK) या प्रसार अधिकारी से परामर्श लें',
    hinglish: 'Registered protective fungicides ke liye local KVK ya extension officer se consult karein'
  },
  'Regular foliar scouting': {
    hi: 'नियमित रूप से पत्तियों का निरीक्षण',
    hinglish: 'Regular foliar scouting'
  }
};

/**
 * Translates agronomic text into the requested target language
 */
function translateAgronomicText(text, lang) {
  if (!text || typeof text !== 'string') return text || '';
  if (lang === 'en') return text;

  const clean = text.trim();
  if (AGRONOMIC_TRANSLATIONS[clean]?.[lang]) {
    return AGRONOMIC_TRANSLATIONS[clean][lang];
  }

  let t = clean;
  if (lang === 'hi') {
    // Structural pattern translations for Hindi
    t = t
      .replace(/Scout foliage at bud break for (.*)\.?/i, 'कलियों के फूटने के समय पत्तियों पर $1 के लक्षणों का नियमित निरीक्षण करें।')
      .replace(/Provide ([\d-]+)\s*mm water per week during (.*) via (.*)\.?/i, '$2 के दौरान $3 द्वारा प्रति सप्ताह $1 मिमी जल दें; पत्तियों को गीला करने से बचें।')
      .replace(/Provide appropriate root-zone irrigation via drip;\s*avoid wetting foliage\.?/i, 'ड्रिप सिंचाई द्वारा पौधों की जड़ों में पानी दें; पत्तियों को गीला करने से बचें।')
      .replace(/Provide appropriate root-zone irrigation;\s*avoid wetting foliage\.?/i, 'ड्रिप सिंचाई द्वारा पौधों की जड़ों में पानी दें; पत्तियों पर पानी के छिड़काव से बचें।')
      .replace(/Water at the soil line with drip systems;\s*avoid overhead sprinklers.*\.?/i, 'ड्रिप प्रणाली द्वारा सीधे मिट्टी की सतह पर पानी दें; फव्वारा सिंचाई से पत्तियों को गीला करने से बचें।')
      .replace(/Utilize drip irrigation underneath vine canopies\.\s*Avoid any sprinkler misting\.?/i, 'बेलों के नीचे ड्रिप सिंचाई का प्रयोग करें। पत्तियों पर फव्वारा सिंचाई से बचें।')
      .replace(/Maintain balanced nitrogen fertilization;\s*avoid excess late-season nitrogen.*\.?/i, 'संतुलित नाइट्रोजन उर्वरक दें; मौसम के अंत में अधिक नाइट्रोजन से बचें जो शीत सहनशीलता घटाता है।')
      .replace(/Maintain balanced crop nutrition,\s*proper plant spacing,\s*and clean hygiene\.?/i, 'संतुलित पोषण दें, क्यारियों में उचित दूरी रखें और खेत को खरपतवार मुक्त रखें।')
      .replace(/Inspect leaf undersides daily/i, 'पत्तियों की निचली सतह का प्रतिदिन निरीक्षण करें')
      .replace(/Prune heavily spotted lower leaves/i, 'अधिक धब्बे वाली निचली पत्तियों को काटकर नष्ट करें')
      .replace(/Sanitize pruning tools/i, 'कटाई-छंटाई के औजारों को विसंक्रमित (sanitize) करें')
      .replace(/Consult local KVK.*registered.*protective fungicides.*/i, 'पंजीकृत कवकनाशियों की सटीक खुराक के लिए स्थानीय कृषि विज्ञान केंद्र (KVK) से परामर्श लें।')
      .replace(/Neem oil foliar spray \(5ml\/L\)/i, 'नीम तेल का पर्णीय छिड़काव (5 मिली/लीटर)')
      .replace(/Bio-fungicide \((.*)\)/i, 'जैविक कवकनाशी ($1)')
      .replace(/Ensure proper row spacing.*certified seeds.*/i, 'पौधों के बीच उचित दूरी, फसल चक्र और प्रमाणित रोगमुक्त बीजों का प्रयोग करें।')
      .replace(/under-canopy micro-sprinklers or drip/i, 'ड्रिप या माइक्रो-स्प्रिंकलर')
      .replace(/stone hardening and fruit swell/i, 'फल विकास व कड़ा होने की अवस्था')
      .replace(/reddish leaf thickening or puckering/i, 'लालिमा, पत्तियों के मुड़ने या सिकुड़न')
      .replace(/leaf undersides and new growth/i, 'पत्तियों की निचली सतह और नई वृद्धि');
    return t;
  } else if (lang === 'hinglish') {
    // Structural pattern translations for Hinglish
    t = t
      .replace(/Scout foliage at bud break for (.*)\.?/i, 'Bud break ke time leaves par $1 ke symptoms ko regular check karein.')
      .replace(/Provide ([\d-]+)\s*mm water per week during (.*) via (.*)\.?/i, '$2 ke time $3 se weekly $1 mm paani dein; leaves ko geela na karein.')
      .replace(/Provide appropriate root-zone irrigation via drip;\s*avoid wetting foliage\.?/i, 'Drip irrigation se root zone mein paani dein; leaves par paani na dalein.')
      .replace(/Provide appropriate root-zone irrigation;\s*avoid wetting foliage\.?/i, 'Root zone mein drip se paani dein; foliage ko geela na karein.')
      .replace(/Water at the soil line with drip systems;\s*avoid overhead sprinklers.*\.?/i, 'Drip system se directly mitti par paani dein; overhead sprinklers avoid karein.')
      .replace(/Utilize drip irrigation underneath vine canopies\.\s*Avoid any sprinkler misting\.?/i, 'Vine canopy ke niche drip irrigation use karein. Sprinkler misting avoid karein.')
      .replace(/Maintain balanced nitrogen fertilization;\s*avoid excess late-season nitrogen.*\.?/i, 'Balanced nitrogen use karein; late-season excess nitrogen avoid karein.')
      .replace(/Maintain balanced crop nutrition,\s*proper plant spacing,\s*and clean hygiene\.?/i, 'Balanced crop nutrition dein, proper spacing rakhein aur field clean rakhein.')
      .replace(/Inspect leaf undersides daily/i, 'Leaves ke niche daily inspect karein')
      .replace(/Prune heavily spotted lower leaves/i, 'Heavy spots wali lower leaves ko prune karke destroy karein')
      .replace(/Sanitize pruning tools/i, 'Pruning tools ko sanitize karein')
      .replace(/Consult local KVK.*registered.*protective fungicides.*/i, 'Registered fungicides ke liye local KVK ya extension officer se consult karein.')
      .replace(/Neem oil foliar spray \(5ml\/L\)/i, 'Neem oil foliar spray (5ml/L)')
      .replace(/Bio-fungicide \((.*)\)/i, 'Bio-fungicide ($1)')
      .replace(/Ensure proper row spacing.*certified seeds.*/i, 'Proper row spacing rakhein aur certified disease-free seeds use karein.')
      .replace(/under-canopy micro-sprinklers or drip/i, 'drip ya under-canopy micro-sprinklers')
      .replace(/stone hardening and fruit swell/i, 'fruit swell aur stone hardening stage')
      .replace(/reddish leaf thickening or puckering/i, 'reddish leaf thickening ya puckering');
    return t;
  }
  return text;
}

/**
 * Normalizes confidence input (decimal like 0.4446, number like 44.46, string)
 * Returns { value, percent, level: 'HIGH'|'MODERATE'|'LOW'|'UNKNOWN', isUncertain }
 */
function resolveConfidenceMeta(rawConf) {
  if (rawConf === null || rawConf === undefined) {
    return { value: null, percent: null, level: 'UNKNOWN', isUncertain: false };
  }
  let num = typeof rawConf === 'string' ? parseFloat(rawConf.replace('%', '')) : Number(rawConf);
  if (isNaN(num)) {
    return { value: null, percent: null, level: 'UNKNOWN', isUncertain: false };
  }
  // If passed as decimal fraction (0.4446), convert to 44.46%
  const percent = (num <= 1.0 && num > 0) ? +(num * 100).toFixed(2) : +num.toFixed(2);
  let level = 'LOW';
  if (percent >= 70) {
    level = 'HIGH';
  } else if (percent >= 45) {
    level = 'MODERATE';
  } else {
    level = 'LOW';
  }
  return {
    value: num,
    percent,
    level,
    isUncertain: level === 'LOW'
  };
}

/**
 * Determines diagnostic state: HEALTHY, DISEASE, or UNKNOWN
 */
function resolveDiagnosticState(diseaseName, isHealthyFlag, kb) {
  if (!diseaseName) return 'UNKNOWN';
  if (isHealthyFlag === true || kb?.isHealthy === true || /healthy/i.test(diseaseName)) {
    return 'HEALTHY';
  }
  if (isHealthyFlag === false || kb?.isHealthy === false || !/healthy/i.test(diseaseName)) {
    return 'DISEASE';
  }
  return 'UNKNOWN';
}

/**
 * Resolves output language: 'hi', 'hinglish', or 'en'
 */
function resolveLanguage(question, language) {
  const reqLang = (language || '').toLowerCase();
  if (reqLang === 'hi' || reqLang === 'hindi') return 'hi';
  if (reqLang === 'hinglish') return 'hinglish';
  if (reqLang === 'en' || reqLang === 'english') return 'en';

  const q = (question || '').toLowerCase();
  // Devanagari script detection -> 'hi'
  if (/[\u0900-\u097F]/.test(q)) return 'hi';

  // Hinglish keyword detection
  if (
    q.includes('kya') || q.includes('kyu') || q.includes('kaise') ||
    q.includes('dawai') || q.includes('chhidkaav') || q.includes('kripya') ||
    q.includes('upaay') || q.includes('batayein') || q.includes('paani')
  ) {
    return 'hinglish';
  }

  return 'en';
}

/**
 * Generate a grounded agricultural response to a farmer query
 *
 * @param {Object} params
 * @param {string} params.question - The natural language question from the farmer
 * @param {Object|null} [params.diagnosisContext] - Latest foliar diagnosis and knowledge base details
 * @param {Object|null} [params.weatherContext] - Real-time atmospheric conditions (temp, humidity, rain%)
 * @param {Object|null} [params.irrigationContext] - Action, urgency, waterRequired, etc.
 * @param {Object|null} [params.sustainabilityContext] - Score, grade, level
 * @param {Array} [params.recommendations] - Recommendations array
 * @param {string} [params.language] - Requested/detected language ('en', 'hi', 'hinglish')
 * @returns {Promise<Object>} Grounded agronomic response with structured guidance
 */
async function answerFarmerQuery({
  question,
  diagnosisContext = null,
  weatherContext = null,
  irrigationContext = null,
  sustainabilityContext = null,
  recommendations = [],
  language = 'en'
}) {
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new Error('Valid question string is required');
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const isKeyConfigured = Boolean(
    geminiApiKey &&
    geminiApiKey !== 'your_gemini_api_key_here' &&
    geminiApiKey !== 'your_gemini_api_key' &&
    geminiApiKey.trim().length > 10
  );

  const crop = diagnosisContext?.crop || 'Tomato';
  const disease = diagnosisContext?.disease || null;
  const confMeta = resolveConfidenceMeta(diagnosisContext?.confidence);
  const confidence = confMeta.percent !== null ? `${confMeta.percent}%` : 'High (Visual Diagnostic)';
  const severity = diagnosisContext?.severity || 'Moderate';
  const growthStage = diagnosisContext?.stage || 'Vegetative';

  // 1. Retrieve verified monograph
  const monograph = disease ? getDiseaseMonograph(disease, crop) : null;

  // 2. Telemetry parameters
  const temp = weatherContext?.temperature ?? 25;
  const humidity = weatherContext?.humidity ?? 65;
  const rainProb = weatherContext?.rainProbability ?? 20;
  const condition = weatherContext?.condition || 'Clear';
  const soilMoisture = diagnosisContext?.soilMoisture ?? null;

  // 3. Deterministic Irrigation source of truth
  const irrigationAction = irrigationContext?.action || (rainProb >= 60 ? 'Delay Irrigation' : 'Maintain Regular Schedule');
  const waterRequired = irrigationContext?.waterRequired || 'Standard crop demand';

  // 4. Deterministic Sustainability
  const sustainability = sustainabilityContext || calculateSustainabilityScore({
    crop,
    soilMoisture,
    weather: weatherContext,
    irrigation: irrigationContext,
    disease
  });

  const targetLang = resolveLanguage(question, language);
  const isContextual = Boolean(diagnosisContext || weatherContext);

  // Construct grounded system prompt with hard guardrails and multilingual rules
  const baseSystemPrompt = buildSystemPromptEnvelope(diagnosisContext, weatherContext, targetLang, question);
  const irrigationRule = `\n[DETERMINISTIC IRRIGATION DIRECTIVE (ABSOLUTE - DO NOT OVERRIDE)]: "${irrigationAction}" (${waterRequired}). You must adhere to this decision 100%.`;
  const sprayRule = rainProb >= 50
    ? `\n[MANDATORY SPRAY WARNING (RAIN FORECAST)]: Rain probability is ${rainProb}%. Explicitly warn the farmer to NOT spray foliar fungicides or fertilizers today as rain will wash them away.`
    : '';
  const fullSystemPrompt = `${baseSystemPrompt}\n${irrigationRule}${sprayRule}`;

  let llmAnswer = null;

  if (isKeyConfigured) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${fullSystemPrompt}\n\n[FARMER QUESTION]: "${question}"` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2, // Low temperature for factual precision
          maxOutputTokens: 800
        }
      };

      const response = await axios.post(url, payload, {
        timeout: GEMINI_API_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' }
      });

      const candidate = response.data?.candidates?.[0];
      const textPart = candidate?.content?.parts?.[0]?.text;
      if (textPart && typeof textPart === 'string' && textPart.trim().length > 0) {
        llmAnswer = textPart.trim();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`Gemini API call returned status ${err.response?.status || 'network'}: ${errMsg}; activating grounded fallback.`);
    }
  }

  // Fallback text generator if LLM was unavailable
  let replyText = llmAnswer;
  if (!replyText) {
    replyText = generateGroundedFallbackResponse(question, diagnosisContext, weatherContext, targetLang);
  }

  // Package structured response
  const structured = buildStructuredAgronomicResponse({
    question,
    llmAnswer: replyText,
    crop,
    disease,
    confidence,
    severity,
    monograph,
    weather: { temp, humidity, rainProb, condition },
    irrigationAction,
    waterRequired,
    sustainability,
    isKeyConfigured: isKeyConfigured && !!llmAnswer,
    geminiModel
  });

  return {
    ...structured,
    reply: replyText,
    answer: replyText,
    source: isKeyConfigured && !!llmAnswer ? 'gemini' : 'fallback',
    contextual: isContextual
  };
}

/**
 * Builds the strict RAG system prompt envelope with conversational freedom for general agronomy
 * and strict guardrails for spray/diagnosis questions.
 */
function buildSystemPromptEnvelope(diagnosisContext, weatherContext, language, question) {
  const targetLang = resolveLanguage(question || '', language);
  const rawDisease = diagnosisContext?.disease || null;
  const crop = diagnosisContext?.crop || null;

  const confMeta = resolveConfidenceMeta(diagnosisContext?.confidence);
  const confidence = confMeta.percent !== null ? `${confMeta.percent}%` : null;
  const confidenceLevel = diagnosisContext?.confidenceLevel || confMeta.level;
  const isUncertain = confMeta.isUncertain || confidenceLevel === 'LOW';

  const diagnosticState = diagnosisContext
    ? (diagnosisContext.diagnosticState || resolveDiagnosticState(rawDisease, diagnosisContext.isHealthy, null))
    : null;

  const temp = weatherContext?.temperature ?? weatherContext?.temp ?? '26';
  const humidity = weatherContext?.humidity ?? '65';
  const rainProb = Number(weatherContext?.rainProbability ?? weatherContext?.rainProb ?? '20');
  const weatherCondition = weatherContext?.condition || 'Clear / Mild';
  const isRainImminent = rainProb >= 50;

  let langInstruction = 'Respond in clear, farmer-friendly English.';
  if (targetLang === 'hi') {
    langInstruction = 'MANDATORY LANGUAGE: Respond 100% in natural, fluent Hindi (Devanagari script). Translate all guidance into Hindi without English sentences.';
  } else if (targetLang === 'hinglish') {
    langInstruction = 'MANDATORY LANGUAGE: Respond 100% in natural, farmer-friendly Hinglish (Hindi written in Roman script, e.g., "Crop rotation se soil health improve hoti hai", "Leaves par regular scouting karein").';
  }

  let diagnosisBlock = 'No previous leaf scan available in current session.';
  if (diagnosisContext && rawDisease) {
    if (diagnosticState === 'HEALTHY') {
      diagnosisBlock = `Diagnostic State: HEALTHY (No active foliar disease detected)
- Crop: ${crop || 'Crop'}
- Condition: ${rawDisease}
- Model Confidence: ${confidence || 'Moderate'} (${confidenceLevel})
- Uncertainty Flag: ${isUncertain ? 'YES (Confidence is low; unconfirmed prediction)' : 'NO'}`;
    } else {
      diagnosisBlock = `Diagnostic State: DISEASE (Active foliar pathogen detected)
- Crop: ${crop || 'Crop'}
- Disease Detected: ${rawDisease}
- Model Confidence: ${confidence || 'Moderate'} (${confidenceLevel})
- Pathogen Type: ${diagnosisContext.pathogenType || 'Pathogen'}
- Key Organic Controls: ${Array.isArray(diagnosisContext.organicManagement) ? diagnosisContext.organicManagement.join('; ') : 'Neem oil, Bio-fungicides'}
- Immediate Actions: ${Array.isArray(diagnosisContext.immediateActions) ? diagnosisContext.immediateActions.join('; ') : 'Scout leaves, prune heavily damaged foliage'}`;
    }
  }

  const weatherBlock = `Temperature: ${temp}°C, Humidity: ${humidity}%, Rain Probability (Next 24h): ${rainProb}%, Weather: ${weatherCondition}`;

  return `You are AgriSmart AI, an expert agricultural decision-support agronomist for Indian farmers.

==================================================
FARM TELEMETRY & BACKGROUND CONTEXT
==================================================
[RECENT CROP SCAN CONTEXT (OPTIONAL BACKGROUND)]:
${diagnosisBlock}

[REAL-TIME WEATHER TELEMETRY]:
${weatherBlock}

==================================================
MANDATORY CONVERSATIONAL & SAFETY RULES:
==================================================
1. PRIMARY OBJECTIVE — ANSWER THE USER'S ACTUAL QUESTION:
   - Always directly and helpfully answer the farmer's specific question.
   - For general agricultural or educational questions (such as crop rotation, vermicompost, soil health, drip irrigation, fertilizer management, planting seasons), provide a comprehensive and practical explanation. DO NOT force or discuss the recent crop scan if it is unrelated.

2. WHEN TO USE THE RECENT CROP SCAN CONTEXT:
   - ONLY reference or focus on the recent crop scan when:
     a) The farmer explicitly asks about their recent scan, diagnosis, or test result (e.g., "What about my scan?", "Mere latest scan ke according kya karu?").
     b) The farmer's question is specifically about the diagnosed crop and disease condition.

3. SPRAYING SAFETY & WEATHER GUARDRAIL:
   - If the farmer asks whether they can spray fungicide or pesticides today:
     * If Rain Probability is >= 50% (${rainProb}%), you MUST warn them NOT to apply foliar sprays today as rainfall will wash off the application and cause runoff.
     * If the recent scan diagnosis is HEALTHY, clarify that healthy plants do NOT need curative chemical fungicide sprays.
     * If spraying is suitable (< 50% rain), recommend spraying during calm morning (06:00-08:00 AM) or late afternoon, emphasizing organic/biological controls first.

4. HEALTHY DIAGNOSIS GUARDRAIL:
   - When discussing a healthy plant diagnosis, NEVER recommend curative fungicides, chemical sprays, or bactericides. Focus on preventive hygiene, balanced nutrition, and visual scouting.

5. LOW CONFIDENCE HANDLING:
   - If discussing an AI scan prediction with LOW confidence (< 45%), clearly communicate that the result is an unconfirmed possibility and advise capturing a clearer close-up photograph in diffuse daylight.

6. SAFETY DISCLAIMER:
   - Encourage consulting local Krishi Vigyan Kendra (KVK) or State Agricultural Extension Officers for formal chemical product labels.

7. LANGUAGE REQUIREMENT:
   - ${langInstruction}`;
}

/**
 * Deterministic grounded response generator for offline, rate-limited, or unconfigured environments.
 * Directly answers the farmer's specific question using categorized agricultural intelligence.
 */
function generateGroundedFallbackResponse(question, diagnosisContext, weatherContext, language = 'en') {
  const q = (question || '').toLowerCase().trim();
  const targetLang = resolveLanguage(question, language);

  const rawDisease = diagnosisContext?.disease || null;
  const crop = diagnosisContext?.crop || 'Crop';

  const confMeta = resolveConfidenceMeta(diagnosisContext?.confidence);
  const confidence = confMeta.percent !== null ? confMeta.percent : 45;
  const confidenceLevel = diagnosisContext?.confidenceLevel || confMeta.level;
  const isUncertain = confMeta.isUncertain || confidenceLevel === 'LOW';

  const diagnosticState = diagnosisContext
    ? (diagnosisContext.diagnosticState || resolveDiagnosticState(rawDisease, diagnosisContext.isHealthy, null))
    : null;

  const rainProb = Number(weatherContext?.rainProbability ?? weatherContext?.rainProb ?? 20);
  const isRainImminent = rainProb >= 50;
  const temp = weatherContext?.temperature ?? weatherContext?.temp ?? 26;
  const humidity = weatherContext?.humidity ?? 65;

  const disclaimer = SAFETY_DISCLAIMERS[targetLang] || SAFETY_DISCLAIMERS.en;

  // ----------------------------------------------------
  // CATEGORY 1: CROP ROTATION / FASAL CHAKRA
  // ----------------------------------------------------
  if (/crop rotation|fasal chakra|fasal badal|rotation|फसल चक्र|फसल चक्रण/i.test(q)) {
    if (targetLang === 'hi') {
      return `🔄 **फसल चक्र (Crop Rotation) की जानकारी:**\n\n` +
        `फसल चक्र एक ही खेत में योजनाबद्ध तरीके से फसलों को बदल-बदल कर उगाने की वैज्ञानिक पद्धति है।\n\n` +
        `• **मुख्य लाभ:**\n` +
        `  1. **मिट्टी की उर्वरता:** दलहनी फसलें (चना, मूंग, उड़द) वायुमंडलीय नाइट्रोजन को मिट्टी में स्थिर (fix) करती हैं।\n` +
        `  2. **कीट व रोग नियंत्रण:** एक ही कुल (family) के कीट और कवक के जीवन चक्र को तोड़ने में मदद मिलती है।\n` +
        `  3. **खरपतवार प्रबंधन:** विभिन्न फसलों के साथ खरपतवारों का प्रकोप कम होता है।\n\n` +
        `• **उत्तम उदाहरण:** धान/गेहूं के बाद दलहन (दालें) या तिलहन फसलें लगाना, और गहरी जड़ वाली फसलों के बाद उथली जड़ वाली फसलें लेना।\n\n` +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `🔄 **Crop Rotation (Fasal Chakra) Guidance:**\n\n` +
        `Crop rotation ka matlab hai ek hi khet mein alag-alag crops ko sequence mein lagana taaki soil nutrients aur soil health optimize ho sakein.\n\n` +
        `• **Key Benefits:**\n` +
        `  1. **Soil Fertility:** Legume crops (jaise moong, chana, urad) soil mein natural nitrogen fix karti hain.\n` +
        `  2. **Pest & Disease Break:** Ek hi crop baar-baar na lagane se soil-borne pests aur fungal spores ka cycle break ho jata hai.\n` +
        `  3. **Weed Control:** Different crop canopies se weeds ka spread naturally control hota hai.\n\n` +
        `• **Best Practice:** Cereals (Wheat/Rice/Maize) ke baad pulses (dalhani faslein) ya green manure (Dhaincha) rotate karein.\n\n` +
        `*${disclaimer}*`;
    }
    return `🔄 **Crop Rotation Principles & Benefits:**\n\n` +
      `Crop rotation is the practice of planting different crops sequentially on the same plot of land to maintain soil fertility, optimize nutrient uptake, and disrupt weed, pest, and disease lifecycles.\n\n` +
      `• **Key Benefits:**\n` +
      `  1. **Nitrogen Fixation:** Alternating heavy nitrogen-feeders (cereals like wheat or maize) with legumes (pulses, beans) naturally replenishes soil nitrogen.\n` +
      `  2. **Pathogen Cycle Disruption:** Breaks host-pathogen cycles for soil-borne fungi, nematodes, and specialized insect pests.\n` +
      `  3. **Root Zone Diversity:** Alternating deep-rooted crops with shallow-rooted crops improves soil aeration and prevents hardpan formation.\n\n` +
      `• **Recommended Sequence:** Follow cereal crops with pulses or oilseeds, and incorporate green manuring crops (like Sunn hemp or Sesbania) periodically.\n\n` +
      `*${disclaimer}*`;
  }

  // ----------------------------------------------------
  // CATEGORY 2: VERMICOMPOST / COMPOST / ORGANIC MANURE
  // ----------------------------------------------------
  if (/vermicompost|compost|jaivik khad|gobhar|organic manure|वर्मीकम्पोस्ट|केंचुआ खाद|जैविक खाद/i.test(q)) {
    if (targetLang === 'hi') {
      return `🌱 **वर्मीकम्पोस्ट (केंचुआ खाद) एवं जैविक पोषण:**\n\n` +
        `वर्मीकम्पोस्ट केंचुओं द्वारा जैविक कचरे व गोबर के अपघटन से तैयार की जाने वाली पोषक तत्वों से भरपूर खाद है।\n\n` +
        `• **प्रयोग विधि:** बुवाई के समय 2-3 टन प्रति हेक्टेयर या प्रति पौधे 250-500 ग्राम मिट्टी में मिलाएं।\n` +
        `• **लाभ:** मिट्टी की जल धारण क्षमता बढ़ती है, सूक्ष्मजीव सक्रिय होते हैं और पौधों की रोग प्रतिरोधक क्षमता में सुधार होता है।\n\n` +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `🌱 **Vermicompost & Organic Nutrition Guidance:**\n\n` +
        `Vermicompost (Kenchua khad) organic biomass aur cow dung ko earthworms dwara decompose karke banayi jati hai.\n\n` +
        `• **Application Rate:** Sowing ke time 2-3 tonnes per hectare ya 250-500g per plant root-zone mein mix karein.\n` +
        `• **Benefits:** Soil moisture retention improve hoti hai, beneficial microbes boost hote hain aur root health strong hoti hai.\n\n` +
        `*${disclaimer}*`;
    }
    return `🌱 **Vermicompost & Organic Manure Guidance:**\n\n` +
      `Vermicompost is a nutrient-dense organic amendment produced by earthworms decomposing organic matter.\n\n` +
      `• **Application Rate:** Incorporate 2-3 tonnes/hectare during basal field preparation or 250-500g per plant in the root zone.\n` +
      `• **Benefits:** Enriches soil organic carbon, enhances beneficial soil microflora, and significantly boosts moisture retention.\n\n` +
      `*${disclaimer}*`;
  }

  // ----------------------------------------------------
  // CATEGORY 3: DRIP IRRIGATION / WATER MANAGEMENT
  // ----------------------------------------------------
  if (/drip irrigation|tapak sinchai|irrigation method|sinchai|ड्रिप सिंचाई|टपक सिंचाई|सिंचाई/i.test(q)) {
    if (targetLang === 'hi') {
      return `💧 **ड्रिप (टपक) सिंचाई प्रबंधन:**\n\n` +
        `ड्रिप सिंचाई सीधे पौधों की जड़ों में पानी और घुलनशील खाद पहुंचाने की सबसे कुशल तकनीक है।\n\n` +
        `• **मुख्य लाभ:** 40-60% पानी की बचत, खरपतवारों में कमी, और पत्तियों के सूखे रहने से फफूंद जनित रोगों (Fungal Blights) से सुरक्षा।\n` +
        `• **सुझाव:** पत्तियों पर ऊपर से छिड़काव (overhead sprinkler) से बचें ताकि पर्णीय रोग न फैलें।\n\n` +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `💧 **Drip Irrigation Management:**\n\n` +
        `Drip irrigation se paani directly root zone tak reach hota hai jisse evaporation aur water runoff minimize hota hai.\n\n` +
        `• **Key Benefits:** 40-60% water savings, weed reduction aur foliage dry rehne se fungal blights aur leaf spots control rehte hain.\n` +
        `• **Tip:** Overhead sprinklers avoid karein jo leaves ko lamba time geela rakhte hain.\n\n` +
        `*${disclaimer}*`;
    }
    return `💧 **Drip Irrigation & Water Efficiency:**\n\n` +
      `Drip irrigation delivers water and soluble nutrients directly to the root zone with up to 90% water efficiency.\n\n` +
      `• **Agronomic Advantages:** Minimizes evaporation losses, prevents foliar leaf wetness (reducing fungal leaf spots and blights), and optimizes root zone oxygenation.\n` +
      `• **Best Practice:** Water in the early morning at the soil line; avoid overhead sprinklers on disease-sensitive crops.\n\n` +
      `*${disclaimer}*`;
  }

  // ----------------------------------------------------
  // CATEGORY 4: FERTILIZERS / NPK / SOIL NUTRITION
  // ----------------------------------------------------
  if (/npk|fertilizer|urea|dap|potash|poshan|fertiliser|fertilization|उर्वरक|यूरिया|पोषक तत्व/i.test(q)) {
    if (targetLang === 'hi') {
      return `🌾 **संतुलित उर्वरक एवं NPK पोषण:**\n\n` +
        `• **नाइट्रोजन (N):** वानस्पतिक वृद्धि और पत्तियों के हरे रंग (क्लोरोफिल) के लिए आवश्यक।\n` +
        `• **फास्फोरस (P):** मजबूत जड़ों के विकास और फूलों के निर्माण में सहायक।\n` +
        `• **पोटाश (K):** पौधों में रोग प्रतिरोधक क्षमता और फल/दाने की गुणवत्ता बढ़ाता है।\n` +
        `• **सलाह:** मृदा स्वास्थ्य कार्ड (Soil Health Card) के अनुसार ही संतुलित मात्रा में उर्वरक दें; अत्यधिक नाइट्रोजन से बचें।\n\n` +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `🌾 **Balanced Fertilization & NPK Guidance:**\n\n` +
        `• **Nitrogen (N):** Vegetative leaf growth aur green canopy ke liye zaroori hai.\n` +
        `• **Phosphorus (P):** Root growth aur flower/fruit development boost karta hai.\n` +
        `• **Potassium (K):** Disease resistance aur grain/fruit quality enhance karta hai.\n` +
        `• **Advice:** Soil health card ke test results ke mutabik balanced ratio use karein; excess nitrogen se bachein.\n\n` +
        `*${disclaimer}*`;
    }
    return `🌾 **Balanced Crop Nutrition & NPK Management:**\n\n` +
      `• **Nitrogen (N):** Drives vegetative canopy and chlorophyll synthesis.\n` +
      `• **Phosphorus (P):** Essential for robust root establishment, flowering, and energy transfer.\n` +
      `• **Potassium (K):** Regulates stomatal conductance, builds disease resilience, and improves harvest quality.\n` +
      `• **Recommendation:** Apply nutrients based on certified soil testing; avoid excessive late-season nitrogen which promotes tender, disease-prone growth.\n\n` +
      `*${disclaimer}*`;
  }

  // ----------------------------------------------------
  // CATEGORY 5: SPRAYING & WEATHER FEASIBILITY
  // ----------------------------------------------------
  if (/spray|स्प्रे|छिड़काव|chhidkaav|chhidkav|fungicide|pesticide|कीटनाशक|फफूंदनाशक|dawai|dawa|दवा|दवाई|medicine|chemical/i.test(q)) {
    if (isRainImminent) {
      let diagNoteEn = '';
      let diagNoteHi = '';
      let diagNoteHinglish = '';

      if (diagnosticState === 'HEALTHY') {
        const uncertEn = isUncertain ? ` (Unconfirmed prediction with LOW confidence: ${confidence}%)` : '';
        diagNoteEn = `\n• **Crop Diagnostic Status:** Foliage is diagnosed as **Healthy**${uncertEn}. No curative chemical fungicide or bactericide is needed for a healthy crop.\n• **Irrigation & Monitoring:** Utilize root-zone drip irrigation and continue routine visual monitoring and foliar scouting.`;
        diagNoteHi = `\n• **फसल स्थिति:** वर्तमान स्कैन में पत्तियां **स्वस्थ (Healthy)** हैं। स्वस्थ फसल पर किसी कवकनाशी की आवश्यकता नहीं है।\n• **सिंचाई व निगरानी:** ड्रिप सिंचाई अपनाएं और पत्तियों की नियमित निगरानी व निरीक्षण जारी रखें।`;
        diagNoteHinglish = `\n• **Crop Diagnostic Status:** Foliage **Healthy** detect hui hai. Healthy plants par kisi curative fungicide ki zaroorat nahi hai.\n• **Care:** Drip irrigation use karein aur routine scouting/monitoring continue karein.`;
      } else if (diagnosticState === 'DISEASE' && rawDisease) {
        diagNoteEn = `\n• **Diagnosed Disease:** ${rawDisease}. Once weather clears, apply organic bio-control such as Neem oil or Trichoderma.\n• **Irrigation:** Use drip irrigation; avoid wetting foliage.`;
        diagNoteHi = `\n• **पहचाना गया रोग:** ${rawDisease}। मौसम साफ़ होने पर जैविक विकल्प (नीम तेल) का प्रयोग करें।\n• **सिंचाई:** ड्रिप सिंचाई अपनाएं।`;
        diagNoteHinglish = `\n• **Diagnosed Disease:** ${rawDisease}. Weather clear hone ke baad organic spray use karein.\n• **Irrigation:** Drip irrigation prefer karein.`;
      }

      if (targetLang === 'hi') {
        return `🌧️ **मौसम चेतावनी — छिड़काव स्थगित रखें (${rainProb}% बारिश का अनुमान):**\n\n` +
          `आपके क्षेत्र में अगले 24 घंटों में बारिश की संभावना **${rainProb}%** है।\n\n` +
          `• **सलाह:** आज पत्तियों पर कोई भी कीटनाशक, कवकनाशी या पर्णीय खाद का छिड़काव **न करें**। बारिश से दवा धुल जाएगी और रासायनिक अपवाह (runoff) होगा।\n` +
          `• **कार्रवाई:** मौसम साफ़ और शुष्क होने तक प्रतीक्षा करें। खेत में जलनिकासी की उचित व्यवस्था सुनिश्चित करें।` +
          diagNoteHi + `\n\n` +
          `*${disclaimer}*`;
      } else if (targetLang === 'hinglish') {
        return `🌧️ **Weather Warning — Postpone Spraying (${rainProb}% Rain Forecast):**\n\n` +
          `Aapke area mein next 24 hours mein rain probability **${rainProb}%** hai.\n\n` +
          `• **Advisory:** Aaj koi bhi foliar spray (fungicide/pesticide) **na karein**. Baarish se dawa wash ho jayegi aur effectiveness zero ho jayegi.\n` +
          `• **Action:** Weather clear aur dry hone tak spray postpone karein.` +
          diagNoteHinglish + `\n\n` +
          `*${disclaimer}*`;
      }
      return `🌧️ **Weather Safety Warning — Postpone Spraying (${rainProb}% Rain Forecasted):**\n\n` +
        `Rain probability for your location is currently **${rainProb}%** (>= 50%).\n\n` +
        `• **Advisory:** Do NOT apply any foliar fungicides, insecticides, or nutrients today. Rainfall will wash off the application, resulting in wasted product and chemical runoff.\n` +
        `• **Recommended Action:** Postpone spraying until a clear, dry morning window with calm winds.` +
        diagNoteEn + `\n\n` +
        `*${disclaimer}*`;
    }

    // Weather is clear (< 50% rain)
    if (diagnosticState === 'HEALTHY') {
      if (targetLang === 'hi') {
        return `🌿 **छिड़काव परामर्श — स्वस्थ फसल (${crop}):**\n\n` +
          `• **निदान स्थिति:** वर्तमान स्कैन में पत्तियां **स्वस्थ (Healthy)** हैं।\n` +
          `• **छिड़काव सलाह:** स्वस्थ फसल पर किसी भी उपचारात्मक कवकनाशी (curative fungicide) या कीटनाशक के छिड़काव की **आवश्यकता नहीं है**।\n` +
          `• **मौसम:** तापमान ${temp}°C, नमी ${humidity}%, बारिश ${rainProb}% (अनुकूल)।\n` +
          `• **देखभाल:** नियमित रूप से पत्तियों की निचली सतह का निरीक्षण करते रहें और संतुलित पोषण दें।\n\n` +
          `*${disclaimer}*`;
      } else if (targetLang === 'hinglish') {
        return `🌿 **Spraying Advisory — Healthy Crop (${crop}):**\n\n` +
          `• **Diagnostic Status:** Current scan ke mutabik foliage **Healthy** hai.\n` +
          `• **Spraying Advice:** Healthy plants par curative fungicide ya chemical dawa ka spray karne ki **zaroorat nahi hai**.\n` +
          `• **Weather:** Temperature ${temp}°C, humidity ${humidity}%, rain probability ${rainProb}% (clear).\n` +
          `• **Care:** Regular weekly scouting continue rakhein aur balanced nutrition dein.\n\n` +
          `*${disclaimer}*`;
      }
      return `🌿 **Spraying Advisory — Healthy Crop (${crop}):**\n\n` +
        `• **Diagnostic Status:** Foliage is currently classified as **Healthy**.\n` +
        `• **Spraying Guidance:** No curative chemical fungicides or bactericides are required for a healthy crop.\n` +
        `• **Farm Weather:** Temperature ${temp}°C, humidity ${humidity}%, rain probability ${rainProb}% (favorable).\n` +
        `• **Routine Care:** Continue regular visual scouting of leaf undersides and maintain clean field hygiene.\n\n` +
        `*${disclaimer}*`;
    }

    if (diagnosticState === 'DISEASE' && rawDisease) {
      const rawOrganic = Array.isArray(diagnosisContext?.organicManagement) && diagnosisContext.organicManagement.length > 0
        ? diagnosisContext.organicManagement[0]
        : 'Neem oil foliar spray (5ml/L)';
      const organicAction = translateAgronomicText(rawOrganic, targetLang);

      if (targetLang === 'hi') {
        return `✅ **छिड़काव मार्गदर्शन (${rawDisease}):**\n\n` +
          `मौसम अनुकूल है (तापमान ${temp}°C, बारिश ${rainProb}%)। आप सुबह या देर शाम छिड़काव कर सकते हैं:\n\n` +
          `• **जैविक नियंत्रण:** ${organicAction}\n` +
          `• **समय:** सुबह 06:00 से 08:00 बजे या शाम 04:30 के बाद जब हवा शांत हो।\n` +
          `• **सावधानी:** ${disclaimer}`;
      } else if (targetLang === 'hinglish') {
        return `✅ **Spraying Guidance for ${rawDisease}:**\n\n` +
          `Weather conditions favorable hain (temperature ${temp}°C, rain probability ${rainProb}%).\n\n` +
          `• **Organic Bio-Control:** ${organicAction}\n` +
          `• **Best Timing:** Early morning (06:00-08:00 AM) ya late afternoon jab hawa shaant ho.\n` +
          `• **Safety Note:** ${disclaimer}`;
      }
      return `✅ **Spraying Guidance for ${rawDisease}:**\n\n` +
        `Weather conditions are favorable (${temp}°C, ${rainProb}% rain probability):\n\n` +
        `• **Organic / Biological Control:** ${organicAction}\n` +
        `• **Application Window:** Spray during calm early morning (06:00-08:00 AM) or late afternoon.\n` +
        `• **Safety Guidance:** ${disclaimer}`;
    }

    // Default Spraying Guidance (No specific scan loaded)
    if (targetLang === 'hi') {
      return `🌾 **सामान्य छिड़काव मार्गदर्शन:**\n\n` +
        `• **मौसम जांच:** वर्तमान तापमान ${temp}°C, नमी ${humidity}%, बारिश ${rainProb}%।\n` +
        `• **सर्वोत्तम समय:** शांत मौसम में सुबह 06:00-08:00 बजे छिड़काव करें ताकि दवा का फैलाव अच्छा हो और वाष्पीकरण कम हो।\n` +
        `• **जैविक प्राथमिकता:** रासायनिक दवाओं से पहले जैविक विकल्प (जैसे नीम तेल 5 मिली/लीटर) अपनाएं।\n\n` +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `🌾 **General Spraying Guidance:**\n\n` +
        `• **Weather Telemetry:** Temperature ${temp}°C, humidity ${humidity}%, rain probability ${rainProb}%.\n` +
        `• **Best Time:** Early morning (06:00-08:00 AM) mein spray karein jab wind calm ho.\n` +
        `• **Organic Priority:** Pehle organic formulations (jaise neem oil 5ml/L) use karein.\n\n` +
        `*${disclaimer}*`;
    }
    return `🌾 **General Spraying Best Practices:**\n\n` +
      `• **Current Weather:** ${temp}°C, ${humidity}% humidity, ${rainProb}% rain probability.\n` +
      `• **Optimal Timing:** Apply during early morning (06:00-08:00 AM) when wind speed is minimal and leaf absorption is highest.\n` +
      `• **IPM Priority:** Prioritize organic/biological formulations (such as cold-pressed neem oil 5ml/L) before considering chemical interventions.\n\n` +
      `*${disclaimer}*`;
  }

  // ----------------------------------------------------
  // CATEGORY 6: EXPLICIT QUESTIONS ABOUT LATEST SCAN / DIAGNOSIS
  // ----------------------------------------------------
  if (/latest scan|scan report|scan result|mera scan|meri scan|meri diagnosis|mere scan|scan ke according|recent scan|uploaded image|detection result|leaf scan|नवीनतम स्कैन|स्कैन रिपोर्ट/i.test(q)) {
    if (diagnosticState === 'HEALTHY') {
      let uncertText = isUncertain ? ` (Uncertainty: Low Confidence ${confidence}%)` : '';
      if (targetLang === 'hi') {
        return `🌿 **आपके नवीनतम स्कैन का विश्लेषण (${crop}):**\n\n` +
          `• **निदान स्थिति:** पत्तियां **स्वस्थ (Healthy)** पाई गई हैं (${confidence}% विश्वसनीयता)${uncertText}।\n` +
          `• **परामर्श:** किसी रासायनिक या कवकनाशी उपचार की आवश्यकता नहीं है।\n` +
          `• **नियमित देखभाल:** ड्रिप सिंचाई द्वारा जड़ों में पानी दें और पत्तियों को सूखा रखें। साप्ताहिक निरीक्षण जारी रखें।\n\n` +
          `*${disclaimer}*`;
      } else if (targetLang === 'hinglish') {
        return `🌿 **Latest Scan Report Summary (${crop}):**\n\n` +
          `• **Diagnostic Status:** Leaves **Healthy** detect hui hain (${confidence}% confidence)${uncertText}.\n` +
          `• **Treatment Advice:** Kisi chemical ya fungicide spray ki zaroorat nahi hai.\n` +
          `• **Care:** Drip irrigation use karein, leaves ko dry rakhein aur weekly foliar scouting continue karein.\n\n` +
          `*${disclaimer}*`;
      }
      return `🌿 **Latest Scan Summary (${crop}):**\n\n` +
        `• **Diagnostic Status:** Your crop foliage is classified as **Healthy** (${confidence}% confidence)${uncertText}.\n` +
        `• **Action Required:** No curative chemical treatments are needed.\n` +
        `• **Preventive Maintenance:** Maintain balanced nutrition, proper plant spacing, and continue routine foliar monitoring.\n\n` +
        `*${disclaimer}*`;
    }

    if (diagnosticState === 'DISEASE' && rawDisease) {
      const rawOrganic = Array.isArray(diagnosisContext?.organicManagement) && diagnosisContext.organicManagement.length > 0
        ? diagnosisContext.organicManagement[0]
        : 'Neem oil foliar spray (5ml/L)';
      const rawImmediate = Array.isArray(diagnosisContext?.immediateActions) && diagnosisContext.immediateActions.length > 0
        ? diagnosisContext.immediateActions[0]
        : 'Prune heavily spotted leaves';

      const organicAction = translateAgronomicText(rawOrganic, targetLang);
      const immediateAction = translateAgronomicText(rawImmediate, targetLang);

      let uncertNotice = '';
      if (isUncertain) {
        uncertNotice = targetLang === 'hi'
          ? `⚠️ *नोट: मॉडल की विश्वसनीयता कम (${confidence}%) है। कृपया पुष्टि के लिए स्पष्ट क्लोज़-अप फोटो पुनः लें।*\n\n`
          : targetLang === 'hinglish'
            ? `⚠️ *Note: Model confidence LOW (${confidence}%) hai. Confirmation ke liye clear close-up photo lein.*\n\n`
            : `⚠️ *Note: Diagnostic confidence is LOW (${confidence}%). Please capture a clearer close-up photograph for confirmation.*\n\n`;
      }

      if (targetLang === 'hi') {
        return `🌾 **आपके नवीनतम स्कैन का विश्लेषण (${rawDisease}):**\n\n` +
          uncertNotice +
          `• **पहचाना गया रोग:** ${rawDisease} (${crop})\n` +
          `• **तात्कालिक कदम:** ${immediateAction}\n` +
          `• **जैविक नियंत्रण:** ${organicAction}\n` +
          `• **मौसम सलाह:** तापमान ${temp}°C, बारिश ${rainProb}% (${isRainImminent ? 'आज छिड़काव न करें' : 'मौसम अनुकूल है'})।\n\n` +
          `*${disclaimer}*`;
      } else if (targetLang === 'hinglish') {
        return `🌾 **Latest Scan Diagnosis (${rawDisease}):**\n\n` +
          uncertNotice +
          `• **Detected Condition:** ${rawDisease} (${crop})\n` +
          `• **Immediate Action:** ${immediateAction}\n` +
          `• **Organic Treatment:** ${organicAction}\n` +
          `• **Weather Context:** ${temp}°C, rain probability ${rainProb}% (${isRainImminent ? 'Do not spray today' : 'Favorable window'}).\n\n` +
          `*${disclaimer}*`;
      }
      return `🌾 **Latest Scan Diagnostic Report (${rawDisease}):**\n\n` +
        uncertNotice +
        `• **Diagnosed Condition:** ${rawDisease} on ${crop}\n` +
        `• **Immediate Step:** ${immediateAction}\n` +
        `• **Key Organic Control:** ${organicAction}\n` +
        `• **Weather Telemetry:** ${temp}°C, ${rainProb}% rain probability (${isRainImminent ? 'Postpone foliar sprays' : 'Clear spraying window'}).\n\n` +
        `*${disclaimer}*`;
    }

    // No scan available in context
    if (targetLang === 'hi') {
      return `📷 **स्कैन संदर्भ:** अभी तक कोई पत्ती स्कैन उपलब्ध नहीं है। कृपया "Disease Detection" पृष्ठ पर जाकर अपनी फसल की पत्ती का फोटो अपलोड करें।\n\n*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `📷 **Scan Context:** Abhi koi leaf scan record nahi mila. Kripya "Disease Detection" tab par jakar apni crop ki leaf image upload karein.\n\n*${disclaimer}*`;
    }
    return `📷 **Scan Context:** No crop leaf scan was found in the current session. Please navigate to the Disease Detection section to upload a leaf photograph for diagnosis.\n\n*${disclaimer}*`;
  }

  // ----------------------------------------------------
  // CATEGORY 7: SYMPTOM / DISEASE SPECIFIC QUESTIONS
  // (e.g., "Potato ke leaves par brown spots hain", "yellow leaves", "leaf spot")
  // ----------------------------------------------------
  if (/spot|blight|rot|rust|mildew|yellow|brown|curl|wilt|dhabbe|pila|sukh|keeda|fungus|धब्बे|पीला|कीट|फफूंद|झुलसा|सिकुड़न/i.test(q)) {
    if (targetLang === 'hi') {
      return `🔍 **पत्तियों पर धब्बों व लक्षणों का प्रबंधन:**\n\n` +
        `पत्तियों पर भूरे या पीले धब्बे आमतौर पर फफूंद जनित संक्रमण (जैसे अर्ली ब्लाइट, लीफ स्पॉट) या पोषण की कमी का संकेत होते हैं।\n\n` +
        `• **तात्कालिक कदम:**\n` +
        `  1. अधिक संक्रमित निचली पत्तियों को तोड़कर खेत से दूर नष्ट करें।\n` +
        `  2. पत्तियों पर ऊपर से पानी डालने से बचें; ड्रिप सिंचाई अपनाएं।\n` +
        `• **जैविक उपचार:** नीम का तेल (5 मिली/लीटर) या *ट्राइकोडर्मा विरिडी* जैविक कवकनाशी का पर्णीय छिड़काव करें।\n` +
        `• **स्वच्छता:** पौधों के बीच उचित दूरी रखें ताकि हवा और धूप का आवागमन बना रहे।\n\n` +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `🔍 **Foliar Spots & Symptom Management:**\n\n` +
        `Leaves par brown ya yellow spots generally fungal infection (Early Blight, Leaf Spot) ya nutrient deficiency ki wajah se aate hain.\n\n` +
        `• **Immediate Action:**\n` +
        `  1. Zyada infected lower leaves ko prune karke field se bahar destroy karein.\n` +
        `  2. Foliage ko dry rakhein aur drip irrigation prefer karein.\n` +
        `• **Organic Control:** Neem oil spray (5ml/L) ya *Trichoderma viride* / *Bacillus subtilis* bio-fungicide use karein.\n` +
        `• **Field Care:** Plant spacing proper rakhein taaki sunlight aur airflow bana rahe.\n\n` +
        `*${disclaimer}*`;
    }
    return `🔍 **Foliar Spots & Symptom Management:**\n\n` +
      `Brown or yellow spots on foliage commonly indicate fungal infections (such as Early Blight or Cercospora Leaf Spot) or localized nutrient stress.\n\n` +
      `• **Immediate Containment:**\n` +
      `  1. Prune and safely dispose of heavily spotted lower leaves to reduce spore inoculation.\n` +
      `  2. Keep foliar canopies dry by utilizing root-zone drip irrigation instead of overhead sprinklers.\n` +
      `• **Organic & Biological Control:** Apply a foliar spray of cold-pressed Neem oil (5ml/L) or a registered bio-fungicide (*Trichoderma viride* or *Bacillus subtilis*).\n` +
      `• **Cultural Practices:** Ensure proper plant spacing for airflow and follow crop rotation.\n\n` +
      `*${disclaimer}*`;
  }

  // ----------------------------------------------------
  // CATEGORY 8: GENERAL AGRONOMY FALLBACK
  // ----------------------------------------------------
  if (targetLang === 'hi') {
    return `🌾 **एग्रीस्मार्ट कृषि विशेषज्ञ परामर्श:**\n\n` +
      `"${question}" के संदर्भ में:\n\n` +
      `• **सफल खेती के मूल सिद्धांत:** नियमित खेत निरीक्षण, मिट्टी परीक्षण आधारित संतुलित खाद (NPK व सूक्ष्म पोषक तत्व), ड्रिप सिंचाई और फसल चक्र अपनाना आवश्यक है।\n` +
      `• **कीट व रोग प्रबंधन:** रासायनिक दवाओं के अत्यधिक प्रयोग से बचें और जैविक व नीम आधारित विकल्पों को प्राथमिकता दें।\n` +
      `• **विशिष्ट मार्गदर्शन:** अपनी स्थानीय जलवायु और फसल किस्म के अनुसार सटीक परामर्श हेतु स्थानीय कृषि विज्ञान केंद्र (KVK) से संपर्क करें।\n\n` +
      `*${disclaimer}*`;
  } else if (targetLang === 'hinglish') {
    return `🌾 **AgriSmart AI Decision-Support Guidance:**\n\n` +
      `"${question}" ke context mein:\n\n` +
      `• **Best Agronomic Practices:** Regular field scouting karein, soil health card ke mutabik balanced fertilizers dein, drip irrigation use karein aur crop rotation follow karein.\n` +
      `• **IPM Strategy:** Chemical sprays se pehle organic formulations (jaise neem oil ya bio-fungicides) ko priority dein.\n` +
      `• **Extension Advice:** Specific crop recommendation aur label dosage ke liye local Krishi Vigyan Kendra (KVK) se consult karein.\n\n` +
      `*${disclaimer}*`;
  }

  return `🌾 **AgriSmart AI Decision-Support Guidance:**\n\n` +
    `Regarding "${question}":\n\n` +
    `• **Core Agronomic Principles:** Implement regular foliar scouting, balanced fertilization based on certified soil tests, efficient root-zone irrigation (drip), and systematic crop rotation.\n` +
    `• **Integrated Pest Management (IPM):** Prioritize cultural hygiene and organic biocontrols before considering chemical interventions.\n` +
    `• **Extension Guidance:** Consult your local Krishi Vigyan Kendra (KVK) or State Agricultural Extension Officer for region-specific recommendations.\n\n` +
    `*${disclaimer}*`;
}

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

/**
 * Deterministic structured builder ensuring consistency between LLM and offline fallback
 */
function buildStructuredAgronomicResponse({
  question,
  llmAnswer,
  crop,
  disease,
  confidence,
  severity,
  monograph,
  weather,
  irrigationAction,
  waterRequired,
  sustainability,
  isKeyConfigured,
  geminiModel = 'gemini-flash-latest'
}) {
  const isRainImminent = weather.rainProb >= 50;
  const isHealthy = !disease || disease.toLowerCase().includes('healthy');

  // Immediate Actions
  const immediateActions = [];
  if (!isHealthy) {
    if (monograph?.immediateActions) {
      immediateActions.push(monograph.immediateActions);
    }
    immediateActions.push(`Inspect lower canopy of ${crop} daily for spot expansion.`);
  } else {
    immediateActions.push('Continue weekly scouting. Maintain current soil moisture management.');
  }

  // Warnings
  const warnings = [];
  if (isRainImminent) {
    warnings.push(`Rain forecast (${weather.rainProb}%): Do NOT spray foliar fungicides today. Rainfall will wash away chemical applications.`);
  }
  if (weather.humidity >= 85 && !isHealthy) {
    warnings.push(`High humidity (${weather.humidity}%): Spores germinate rapidly on wet leaves. Avoid overhead watering.`);
  }

  // Irrigation Advice
  const irrigationAdvice = irrigationAction === 'Delay Irrigation'
    ? `Postpone irrigation. Rain forecast (${weather.rainProb}%) will provide natural soil moisture.`
    : irrigationAction === 'Irrigate Urgently'
    ? `Apply precision irrigation (${waterRequired}) immediately to prevent root stress.`
    : `Follow regular irrigation schedule (${waterRequired}).`;

  // Disease Management
  const diseaseManagement = isHealthy
    ? 'Crop is healthy. Preventative biological tonics (e.g. Panchagavya 3% or vermiwash) recommended every 15 days.'
    : {
        organicRemedy: monograph?.organicRemedy || 'Neem oil spray 0.5% with bio-soap emulsifier.',
        chemicalControl: isRainImminent
          ? 'HOLD SPRAY — Postpone chemical spraying until after rain passes.'
          : (monograph?.chemicalControl || 'Mancozeb 75% WP @ 2g/L (apply on dry morning).'),
        prevention: monograph?.prevention || 'Maintain 60cm spacing and 3-year non-solanaceous rotation.'
      };

  // Fallback text generator if LLM was unavailable
  let replyText = llmAnswer;
  if (!replyText) {
    replyText = generateDeterministicGroundedReply({
      question,
      crop,
      disease,
      isHealthy,
      monograph,
      weather,
      irrigationAction,
      irrigationAdvice,
      warnings,
      isRainImminent
    });
  }

  return {
    reply: replyText,
    answer: replyText,
    summary: `${crop} advisory: ${irrigationAction}. ${warnings[0] || 'Conditions stable.'}`,
    groundedContext: {
      crop,
      disease: disease || 'Healthy / No Disease',
      diagnosticConfidence: confidence,
      severity,
      temperature: `${weather.temp}°C`,
      humidity: `${weather.humidity}%`,
      rainProbability: `${weather.rainProb}%`,
      irrigationDecision: irrigationAction,
      sustainabilityScore: sustainability.score,
      sourceOfTruth: 'AgriSmart Deterministic Agronomy & ICAR Monograph'
    },
    immediateActions,
    irrigationAdvice,
    diseaseManagement,
    prevention: monograph?.recommendedActions || ['Maintain clean field ridges', 'Monitor soil moisture'],
    sustainabilityAdvice: sustainability.improvementSuggestions || ['Use drip irrigation to deliver water directly to roots.'],
    warnings,
    isGrounded: true,
    engine: isKeyConfigured ? `Gemini (${geminiModel}) (Grounded)` : 'Deterministic Agronomic Rule Engine (Offline Grounded)'
  };
}

/**
 * Deterministic fallback reply when Gemini API is unconfigured or offline
 */
function generateDeterministicGroundedReply({
  question,
  crop,
  disease,
  isHealthy,
  monograph,
  weather,
  irrigationAction,
  irrigationAdvice,
  warnings,
  isRainImminent
}) {
  const qLower = question.toLowerCase();
  const isHindi = qLower.includes('kya') || qLower.includes('dawai') || qLower.includes('pani') || qLower.includes('kaise') || qLower.includes('kare') || qLower.includes('kripya');

  if (isHindi) {
    if (qLower.includes('spray') || qLower.includes('dawai')) {
      if (isRainImminent) {
        return `⚠️ **स्प्रे सलाह (${crop}):** आपके क्षेत्र में बारिश की संभावना (${weather.rainProb}%) है। आज कोई भी कीटनाशक या फफूंदनाशक स्प्रे **न करें**, क्योंकि बारिश में दवा धुल जाएगी।\n\n• **जैविक उपाय:** बारिश के बाद सुबह ${monograph?.organicRemedy || 'नीम का तेल (5ml/L)'} का छिड़काव करें।\n• **तत्काल कार्य:** रोगग्रस्त निचली पत्तियों को तोड़कर खेत से दूर दबा दें।`;
      }
      return `✅ **स्प्रे सलाह (${crop}):** मौसम अनुकूल है (${weather.rainProb}% बारिश)।\n• **जैविक उपाय:** ${monograph?.organicRemedy || 'नीम तेल 5ml/लीटर'}\n• **रासायनिक उपाय:** ${monograph?.chemicalControl || 'मैनकोज़ेब 75% WP @ 2g/L'}\n• सुबह या शाम के समय छिड़काव करें।`;
    }
    if (qLower.includes('pani') || qLower.includes('irrigation')) {
      return `💧 **सिंचाई सलाह (${crop}):** ${irrigationAdvice}\n• निर्णय: **${irrigationAction}**\n• आर्द्रता: ${weather.humidity}%, तापमान: ${weather.temp}°C।`;
    }
    return `🌿 **एग्रीस्मार्ट फसल सलाह (${crop} - ${disease || 'स्वस्थ'}):**\n• **स्थिति:** ${disease || 'फसल स्वस्थ है'}\n• **सिंचाई निर्णय:** ${irrigationAction}\n• **मुख्य उपाय:** ${monograph?.organicRemedy || 'नियमित निगरानी जारी रखें'}\n• ${warnings[0] || 'मौसम अनुकूल है।'}`;
  }

  // English fallback
  if (qLower.includes('spray') || qLower.includes('fungicide') || qLower.includes('chemical') || qLower.includes('medicine')) {
    if (isRainImminent) {
      return `⚠️ **Spraying Advisory for ${crop} (${disease || 'Foliar Health'}):**\nRain is forecasted in your area (${weather.rainProb}% probability). Do **NOT** apply any foliar sprays today—precipitation will wash away the active ingredients into runoff.\n\n• **Organic Alternative (Post-Rain):** ${monograph?.organicRemedy || 'Neem oil spray (5ml/L) or Trichoderma viride'}\n• **Immediate Action:** Prune and deeply bury heavily spotted foliage to curb secondary spore transmission.`;
    }
    return `✅ **Spraying Guidance for ${crop} (${disease || 'Foliar Health'}):**\nCurrent weather is favorable (${weather.rainProb}% rain probability, ${weather.temp}°C):\n• **Biological / Organic Remedy:** ${monograph?.organicRemedy || 'Neem oil 0.5% or Trichoderma viride @ 5g/L'}\n• **Targeted Chemical Control:** ${monograph?.chemicalControl || 'Mancozeb 75% WP @ 2g/L'}\n• Apply during early morning or late afternoon for optimal foliar absorption.`;
  }

  if (qLower.includes('water') || qLower.includes('irrigate') || qLower.includes('irrigation')) {
    return `💧 **Smart Irrigation Guidance for ${crop}:**\n• **Prescribed Action:** ${irrigationAction}\n• **Reasoning:** ${irrigationAdvice}\n• **Weather Context:** ${weather.temp}°C, ${weather.humidity}% humidity, ${weather.rainProb}% rain probability.`;
  }

  return `🌿 **AgriSmart Grounded Agronomist Advisory for ${crop}:**\n• **Diagnosis:** ${disease || 'Healthy Canopy'}\n• **Irrigation Directive:** ${irrigationAction}\n• **Recommended Organic Protocol:** ${monograph?.organicRemedy || 'Apply bio-stimulants and maintain balanced soil moisture'}\n• **Weather Notice:** ${warnings[0] || `Favorable weather conditions (${weather.temp}°C, ${weather.humidity}% humidity).`}\n• **Preventative Practice:** ${monograph?.prevention || 'Ensure proper plant spacing and crop rotation.'}`;
}

module.exports = {
  answerFarmerQuery,
  buildStructuredAgronomicResponse,
  generateGroundedFallbackResponse,
  generateDeterministicGroundedReply,
  buildSystemPromptEnvelope,
  resolveConfidenceMeta,
  resolveDiagnosticState,
  resolveLanguage,
  translateAgronomicText,
  SAFETY_DISCLAIMERS,
  isConfigured
};

