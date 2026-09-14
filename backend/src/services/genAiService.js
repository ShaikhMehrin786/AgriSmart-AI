// Grounded GenAI Agronomist Service
// Grounded RAG Decision-Support for Farmers with Strict Agronomic & Weather Guardrails
const axios = require('axios');
const { getDiseaseKnowledge, SAFETY_DISCLAIMER } = require('../data/diseaseKnowledgeBase');

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
 * @param {Object|null} params.diagnosisContext - Latest foliar diagnosis and knowledge base details
 * @param {Object|null} params.weatherContext - Real-time atmospheric conditions (temp, humidity, rain%)
 * @param {string} params.language - Requested/detected language ('en', 'hi', 'hinglish')
 * @returns {Promise<{ reply: string, source: 'gemini'|'fallback', contextual: boolean }>}
 */
async function answerFarmerQuery({ question, diagnosisContext = null, weatherContext = null, language = 'en' }) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const hasValidKey = Boolean(
    geminiApiKey &&
    geminiApiKey !== 'your_gemini_api_key_here' &&
    geminiApiKey !== 'your_gemini_api_key' &&
    geminiApiKey.length > 10
  );

  const isContextual = Boolean(diagnosisContext || weatherContext);

  // If API key is missing or placeholder, immediately route to deterministic grounded fallback
  if (!hasValidKey) {
    const fallbackReply = generateGroundedFallbackResponse(question, diagnosisContext, weatherContext, language);
    return {
      reply: fallbackReply,
      source: 'fallback',
      contextual: isContextual
    };
  }

  // Assemble Grounded System Prompt
  const systemPrompt = buildSystemPromptEnvelope(diagnosisContext, weatherContext, language);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\n[FARMER QUESTION]: "${question}"` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2, // Low temperature for strict factual adherence
        maxOutputTokens: 800,
      }
    };

    const response = await axios.post(url, payload, {
      timeout: GEMINI_API_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' }
    });

    // Check for safety finish reasons or empty candidates
    const candidate = response.data?.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart || typeof textPart !== 'string' || textPart.trim().length === 0) {
      console.warn('Gemini returned empty candidate or blocked response; using grounded fallback.');
      const fallbackReply = generateGroundedFallbackResponse(question, diagnosisContext, weatherContext, language);
      return {
        reply: fallbackReply,
        source: 'fallback',
        contextual: isContextual
      };
    }

    return {
      reply: textPart.trim(),
      source: 'gemini',
      contextual: isContextual
    };
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.warn(`Gemini API error (${error.response?.status || 'network'}): ${errMsg}; using grounded fallback.`);

    const fallbackReply = generateGroundedFallbackResponse(question, diagnosisContext, weatherContext, language);
    return {
      reply: fallbackReply,
      source: 'fallback',
      contextual: isContextual
    };
  }
}

/**
 * Builds the strict RAG system prompt envelope with hard guardrails and multilingual support
 */
function buildSystemPromptEnvelope(diagnosisContext, weatherContext, language) {
  const targetLang = resolveLanguage('', language);
  const rawDisease = diagnosisContext?.disease || 'Unspecified';
  const crop = diagnosisContext?.crop || 'Unspecified Crop';

  // Resolve state and confidence
  const confMeta = resolveConfidenceMeta(diagnosisContext?.confidence);
  const confidence = confMeta.percent !== null ? `${confMeta.percent}%` : 'N/A';
  const confidenceLevel = diagnosisContext?.confidenceLevel || confMeta.level;
  const isUncertain = confMeta.isUncertain || confidenceLevel === 'LOW';

  const diagnosticState = diagnosisContext?.diagnosticState ||
    resolveDiagnosticState(rawDisease, diagnosisContext?.isHealthy, null);

  const imageQuality = diagnosisContext?.imageQuality || null;
  const qualityIssues = Array.isArray(imageQuality?.issues) && imageQuality.issues.length > 0 ? imageQuality.issues.join(', ') : 'None';
  const requiresBetterImage = diagnosisContext?.requiresBetterImage || isUncertain || imageQuality?.level === 'POOR';

  const temp = weatherContext?.temperature ?? weatherContext?.temp ?? '26';
  const humidity = weatherContext?.humidity ?? '65';
  const rainProb = Number(weatherContext?.rainProbability ?? weatherContext?.rainProb ?? '20');
  const weatherCondition = weatherContext?.condition || 'Clear / Mild';
  const isRainImminent = rainProb >= 50;

  let langInstruction = 'Provide all explanations and bullet points in clear, farmer-friendly English.';
  if (targetLang === 'hi') {
    langInstruction = 'MANDATORY LANGUAGE: Output MUST be 100% in natural, fluent Hindi (Devanagari script). Translate all monitoring guidance, irrigation instructions, and agronomic advice into Hindi without leaving English sentences.';
  } else if (targetLang === 'hinglish') {
    langInstruction = 'MANDATORY LANGUAGE: Output MUST be 100% in farmer-friendly Hinglish (Hindi written in Roman script, e.g., "Leaves par regular scouting karein", "Drip irrigation se roots mein paani dein"). Do NOT output English sentences for guidance.';
  }

  if (diagnosticState === 'HEALTHY') {
    const rawPreventive = Array.isArray(diagnosisContext?.preventiveCropCare)
      ? diagnosisContext.preventiveCropCare.filter(item => !/spray|fungicide|copper|chemical|chlorothalonil/i.test(item)).join('; ')
      : 'Maintain balanced crop nutrition, proper plant spacing, and field sanitation.';
    const rawMonitoring = diagnosisContext?.monitoringGuidance || 'Regularly inspect foliar canopy and leaf undersides for any early signs of spots or puckering.';
    const rawIrrigation = diagnosisContext?.irrigationGuidance || 'Provide appropriate root-zone irrigation via drip; avoid wetting foliage.';
    const rawSymptoms = diagnosisContext?.visualSymptoms || 'Normal green foliage with smooth margins and no visible lesions.';

    const preventive = translateAgronomicText(rawPreventive, targetLang);
    const monitoring = translateAgronomicText(rawMonitoring, targetLang);
    const irrigation = translateAgronomicText(rawIrrigation, targetLang);
    const symptoms = translateAgronomicText(rawSymptoms, targetLang);

    return `You are AgriSmart AI's agricultural decision-support assistant designed for Indian farmers.
Your role is to provide actionable, farmer-friendly explanations grounded strictly in the verified farm telemetry below.

==================================================
REAL-TIME FARM TELEMETRY & DIAGNOSTIC CONTEXT
==================================================
[FOLIAR SCAN DIAGNOSIS]:
- Diagnostic State: HEALTHY (No active disease diagnosed)
- Crop: ${crop}
- Condition Detected: ${rawDisease}
- Model Confidence: ${confidence} (Confidence Level: ${confidenceLevel})
- AI Uncertainty Flag: ${isUncertain ? 'YES (Confidence is LOW; result is an unconfirmed model prediction)' : 'NO (Sufficient confidence)'}
- Healthy Foliage Visual Traits: ${symptoms}
- Preventive Crop Care: ${preventive}
- Monitoring & Scouting Guidance: ${monitoring}
- Irrigation Guidance: ${irrigation}

[METEOROLOGICAL TELEMETRY]:
- Temperature: ${temp}°C
- Relative Humidity: ${humidity}%
- Rain Probability (Next 24h): ${rainProb}%
- Weather Condition: ${weatherCondition}

==================================================
MANDATORY HARD RULES FOR HEALTHY DIAGNOSTIC STATE:
==================================================
1. HARD RULE — STRICTLY FORBID DISEASE TREATMENTS & FUNGICIDES:
   - The diagnosis is HEALTHY.
   - You MUST NEVER recommend fungicides, bactericides, insecticides, copper sprays, chlorothalonil, chemical disease controls, or curative sprays (such as Peach Leaf Curl sprays, dormant sprays, or blight treatments) for a healthy crop.
   - Explain clearly that the plant is currently diagnosed as healthy, so curative chemical or fungicide spraying is NOT recommended.
2. LOW CONFIDENCE & UNCERTAINTY HANDLING:
   ${isUncertain ? `- The Model Confidence is LOW (${confidenceLevel} / ${confidence}). You MUST explicitly state that this prediction is uncertain and only a possible result, NOT a confirmed diagnosis. Advise the farmer to inspect leaves closely and capture a clearer close-up photograph in diffuse daylight.` : `- State that current foliage appears healthy based on the scan.`}
3. WEATHER & SPRAY GUARDRAIL:
   ${isRainImminent ? `- Rain Probability is ${rainProb}% (>= 50%). Explicitly warn that no foliar application should be carried out today as rain will wash it away; advise monitoring canopy moisture.` : `- Advise maintaining proper root-zone watering without wetting leaves.`}
4. HEALTHY CROP CARE:
   - Provide preventive crop-care advice (balanced fertilization, proper aeration, field hygiene).
   - List what symptoms the farmer should watch out for during routine field scouting.
5. NO GUARANTEED DIAGNOSIS:
   - Remind the farmer that for formal agricultural extension validation, they should consult their local Krishi Vigyan Kendra (KVK).
6. LANGUAGE REQUIREMENT:
   - ${langInstruction}`;
  }

  // ==========================================
  // DISEASE STATE PROMPT
  // ==========================================
  const rawOrganic = Array.isArray(diagnosisContext?.organicManagement)
    ? diagnosisContext.organicManagement.map(o => translateAgronomicText(o, targetLang)).join('; ')
    : translateAgronomicText('Bio-fungicide, Trichoderma viride, or neem-based spray', targetLang);

  const rawChemical = Array.isArray(diagnosisContext?.chemicalManagement)
    ? diagnosisContext.chemicalManagement.map(c => translateAgronomicText(c, targetLang)).join('; ')
    : translateAgronomicText('Consult local KVK / extension officer for registered protective fungicides.', targetLang);

  const rawImmediate = Array.isArray(diagnosisContext?.immediateActions)
    ? diagnosisContext.immediateActions.map(i => translateAgronomicText(i, targetLang)).join('; ')
    : translateAgronomicText('Inspect foliage, prune heavily infected leaves, maintain field hygiene.', targetLang);

  const rawPrevention = Array.isArray(diagnosisContext?.prevention)
    ? diagnosisContext.prevention.map(p => translateAgronomicText(p, targetLang)).join('; ')
    : translateAgronomicText('Ensure proper row spacing, clean crop rotation, and disease-free certified seeds.', targetLang);

  return `You are AgriSmart AI's agricultural decision-support assistant designed for Indian farmers.
Your role is to provide actionable, farmer-friendly explanations grounded strictly in the verified farm telemetry below.

==================================================
REAL-TIME FARM TELEMETRY & DIAGNOSTIC CONTEXT
==================================================
[FOLIAR SCAN DIAGNOSIS]:
- Diagnostic State: DISEASE (Active disease detected)
- Crop: ${crop}
- Disease Detected: ${rawDisease}
- Pathogen Type: ${diagnosisContext?.pathogenType || 'Pathogen'}
- Model Confidence: ${confidence} (Confidence Level: ${confidenceLevel})
- AI Uncertainty Flag: ${isUncertain ? 'YES (Confidence < 45%; result is unconfirmed)' : 'NO (Normal confidence)'}
- Visual Symptoms: ${diagnosisContext?.visualSymptoms ? translateAgronomicText(diagnosisContext.visualSymptoms, targetLang) : 'Foliar discoloration/spots'}
- Immediate Actions: ${rawImmediate}
- Organic / Bio Controls: ${rawOrganic}
- Chemical Control Guidelines: ${rawChemical}
- Long-Term Prevention: ${rawPrevention}

[METEOROLOGICAL TELEMETRY]:
- Temperature: ${temp}°C
- Relative Humidity: ${humidity}%
- Rain Probability (Next 24h): ${rainProb}%
- Weather Condition: ${weatherCondition}

==================================================
STRICT SAFETY & BEHAVIORAL RULES FOR DISEASE STATE:
==================================================
1. STRICT TRUTH & FACTUAL GROUNDING: Base disease management strictly on the supplied diagnosis context for ${rawDisease}. Do not recommend treatments for unrelated diseases.
2. SPRAY SAFETY RULE: If Rain Probability is >= 50% (${rainProb}%), you MUST explicitly advise against immediate foliar spraying because rain will wash away chemical or biological sprays. Advise postponing foliar application until weather clears.
3. ORGANIC PRIORITY: Highlight organic, biological, and physical containment actions first before registered chemical recommendations.
4. CONFIDENCE HONESTY: ${isUncertain ? `Confidence is LOW (${confidenceLevel} / ${confidence}). Explicitly communicate that this diagnosis is uncertain and recommend capturing a clearer close-up leaf photograph.` : `Provide clear disease management steps.`}
5. NO GUARANTEED DIAGNOSIS: Advise consulting local Krishi Vigyan Kendra (KVK) for formal extension verification.
6. LANGUAGE REQUIREMENT: ${langInstruction}`;
}

/**
 * Deterministic grounded response generator for offline, rate-limited, or unconfigured environments
 */
function generateGroundedFallbackResponse(question, diagnosisContext, weatherContext, language = 'en') {
  const q = (question || '').toLowerCase();
  const targetLang = resolveLanguage(question, language);

  const rawDisease = diagnosisContext?.disease || 'Foliar Scan';
  const crop = diagnosisContext?.crop || 'Crop';

  const confMeta = resolveConfidenceMeta(diagnosisContext?.confidence);
  const confidence = confMeta.percent !== null ? confMeta.percent : 45;
  const confidenceLevel = diagnosisContext?.confidenceLevel || confMeta.level;
  const isUncertain = confMeta.isUncertain || confidenceLevel === 'LOW';

  const diagnosticState = diagnosisContext?.diagnosticState ||
    resolveDiagnosticState(rawDisease, diagnosisContext?.isHealthy, null);

  const rainProb = Number(weatherContext?.rainProbability ?? weatherContext?.rainProb ?? 20);
  const isRainImminent = rainProb >= 50;
  const temp = weatherContext?.temperature ?? weatherContext?.temp ?? 26;
  const humidity = weatherContext?.humidity ?? 65;

  const disclaimer = SAFETY_DISCLAIMERS[targetLang] || SAFETY_DISCLAIMERS.en;

  // ==========================================
  // BRANCH 1: HEALTHY DIAGNOSTIC STATE
  // ==========================================
  if (diagnosticState === 'HEALTHY') {
    const rawMonitoring = diagnosisContext?.monitoringGuidance || 'Scout leaf undersides and new growth weekly for early signs of spots or discoloration.';
    const rawIrrigation = diagnosisContext?.irrigationGuidance || 'Provide appropriate root-zone irrigation; avoid wetting foliage.';

    const monitoring = translateAgronomicText(rawMonitoring, targetLang);
    const irrigation = translateAgronomicText(rawIrrigation, targetLang);

    // Low-confidence uncertainty notice
    let uncertaintyNotice = '';
    if (isUncertain) {
      if (targetLang === 'hi') {
        uncertaintyNotice = `⚠️ **अनिश्चितता सूचना (Low Confidence):** मॉडल का वर्तमान अनुमान **${rawDisease}** केवल **${confidence}% (कम विश्वसनीयता)** पर आधारित है। यह एक संभावित परिणाम है, पुष्टि नहीं। कृपया अच्छी रोशनी में पत्ती का साफ़ क्लोज़-अप फोटो पुनः अपलोड करें।\n\n`;
      } else if (targetLang === 'hinglish') {
        uncertaintyNotice = `⚠️ **Uncertainty Notice (Low Confidence):** Current model prediction **${rawDisease}** sirf **${confidence}% (Low confidence)** par based hai. Yeh unconfirmed possible result hai. Kripya daylight mein saaf close-up photo capture karein.\n\n`;
      } else {
        uncertaintyNotice = `⚠️ **Uncertainty Notice:** The current model prediction is **${rawDisease}** with **LOW confidence (${confidence}%)**. This is an unconfirmed possible result. Please inspect leaves closely and capture a clearer close-up photograph in diffuse daylight for higher diagnostic certainty.\n\n`;
      }
    }

    // Weather note
    let rainNote = '';
    if (isRainImminent) {
      if (targetLang === 'hi') {
        rainNote = `🌧️ **मौसम सलाह (${rainProb}% बारिश की संभावना):** आज पत्तियों पर कोई छिड़काव न करें, क्योंकि बारिश से दवा धुल जाएगी। खेत में जल निकासी की उचित व्यवस्था रखें।\n`;
      } else if (targetLang === 'hinglish') {
        rainNote = `🌧️ **Weather Advisory (${rainProb}% rain forecast):** Aaj leaves par koi foliar spray na karein, kyunki baarish se spray wash ho jayega. Field drainage acchi rakhein.\n`;
      } else {
        rainNote = `🌧️ **Weather Advisory (${rainProb}% rain forecasted):** Do not apply any foliar sprays today as rain will wash them off. Maintain good field drainage.\n`;
      }
    } else {
      if (targetLang === 'hi') {
        rainNote = `🌤️ **मौसम स्थिति:** तापमान ${temp}°C, नमी ${humidity}%, बारिश की संभावना ${rainProb}%।\n`;
      } else if (targetLang === 'hinglish') {
        rainNote = `🌤️ **Farm Weather:** Temperature ${temp}°C, humidity ${humidity}%, rain probability ${rainProb}%.\n`;
      } else {
        rainNote = `🌤️ **Farm Weather:** ${temp}°C, ${humidity}% humidity, ${rainProb}% rain probability.\n`;
      }
    }

    // 1.1 Spray / Treatment query on Healthy Plant
    if (q.includes('spray') || q.includes('dawai') || q.includes('medicine') || q.includes('chhidkaav') || q.includes('fungicide') || q.includes('pesticide') || q.includes('treatment')) {
      if (targetLang === 'hi') {
        return `🌿 **फसल सुरक्षा परामर्श — स्वस्थ पत्तियां (${crop}):**\n\n` +
          uncertaintyNotice +
          `• **निदान स्थिति:** वर्तमान स्कैन में पत्तियां **स्वस्थ (Healthy)** पाई गई हैं।\n` +
          `• **छिड़काव सलाह:** स्वस्थ फसल पर किसी भी कवकनाशी (fungicide) या रासायनिक दवा के छिड़काव की आवश्यकता **नहीं** है।\n` +
          (isRainImminent ? `• **मौसम चेतावनी:** बारिश की संभावना ${rainProb}% है, अतः किसी भी प्रकार का छिड़काव न करें।\n` : '') +
          `• **सिंचाई व देखभाल:** ${irrigation}\n` +
          `• **नियमित निगरानी:** ${monitoring}\n\n` +
          `*${disclaimer}*`;
      } else if (targetLang === 'hinglish') {
        return `🌿 **Crop Protection Advisory — Healthy Foliage (${crop}):**\n\n` +
          uncertaintyNotice +
          `• **Diagnostic Status:** Current scan ke according foliage **Healthy** hai.\n` +
          `• **Spraying Advisory:** Healthy plants par kisi bhi fungicide ya chemical treatment ki zaroorat **nahi** hai.\n` +
          (isRainImminent ? `• **Weather Advisory:** Rain probability ${rainProb}% hai, isliye aaj koi foliar spray na karein.\n` : '') +
          `• **Irrigation & Care:** ${irrigation}\n` +
          `• **Routine Monitoring:** ${monitoring}\n\n` +
          `*${disclaimer}*`;
      }
      return `🌿 **Crop Protection Advisory — Healthy Foliage (${crop}):**\n\n` +
        uncertaintyNotice +
        `• **Diagnostic Status:** The current scan indicates **Healthy** foliage.\n` +
        `• **Spraying Advisory:** No fungicide, bactericide, or chemical disease treatment is required for healthy plants.\n` +
        (isRainImminent ? `• **Weather Advisory:** Rain probability is ${rainProb}%. Do not apply any foliar sprays today as rainfall will wash them off.\n` : '') +
        `• **Irrigation & Care:** ${irrigation}\n` +
        `• **Routine Monitoring:** ${monitoring}\n\n` +
        `*${disclaimer}*`;
    }

    // 1.2 General query on Healthy Plant
    if (targetLang === 'hi') {
      return `🌱 **एग्रीस्मार्ट फसल देखभाल — स्वस्थ पौधा (${crop}):**\n\n` +
        uncertaintyNotice +
        `• **फसल स्थिति:** पत्तियां स्वस्थ अनुमानित हैं (${confidence}% विश्वसनीयता)। किसी रोग उपचार की आवश्यकता नहीं है।\n` +
        `• **नियमित निगरानी:** ${monitoring}\n` +
        `• **सिंचाई मार्गदर्शन:** ${irrigation}\n` +
        rainNote + '\n' +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `🌱 **AgriSmart Crop Care Advisory — Healthy Plant (${crop}):**\n\n` +
        uncertaintyNotice +
        `• **Crop Status:** Leaves healthy predict hui hain (${confidence}% confidence). Kisi disease treatment ki zaroorat nahi hai.\n` +
        `• **Routine Monitoring:** ${monitoring}\n` +
        `• **Irrigation Guidance:** ${irrigation}\n` +
        rainNote + '\n' +
        `*${disclaimer}*`;
    }
    return `🌱 **AgriSmart Crop Care Advisory — Healthy Foliage (${crop}):**\n\n` +
      uncertaintyNotice +
      `• **Foliage Status:** The crop is classified as **Healthy** (${confidence}% confidence). No disease treatment is necessary.\n` +
      `• **Monitoring Guidance:** ${monitoring}\n` +
      `• **Irrigation & Soil:** ${irrigation}\n` +
      rainNote + '\n' +
      `*${disclaimer}*`;
  }

  // ==========================================
  // BRANCH 2: DISEASE DIAGNOSTIC STATE
  // ==========================================
  const rawOrganicList = Array.isArray(diagnosisContext?.organicManagement) && diagnosisContext.organicManagement.length > 0
    ? diagnosisContext.organicManagement
    : ['Neem oil foliar spray (5ml/L)', 'Bio-fungicide (Trichoderma viride or Bacillus subtilis)', 'Compost tea foliar drench'];

  const rawImmediateList = Array.isArray(diagnosisContext?.immediateActions) && diagnosisContext.immediateActions.length > 0
    ? diagnosisContext.immediateActions
    : ['Inspect leaf undersides daily', 'Prune heavily spotted lower leaves', 'Sanitize pruning tools'];

  const rawChemicalList = Array.isArray(diagnosisContext?.chemicalManagement) && diagnosisContext.chemicalManagement.length > 0
    ? diagnosisContext.chemicalManagement
    : ['Consult local KVK or extension officer for registered protective fungicides'];

  const organicList = rawOrganicList.map(o => translateAgronomicText(o, targetLang));
  const immediateList = rawImmediateList.map(i => translateAgronomicText(i, targetLang));
  const chemicalList = rawChemicalList.map(c => translateAgronomicText(c, targetLang));

  let uncertaintyNotice = '';
  if (isUncertain) {
    if (targetLang === 'hi') {
      uncertaintyNotice = `⚠️ **अनिश्चितता सूचना:** मॉडल कॉन्फिडेंस **कम (${confidence}%)** है। यह एक संभावित परिणाम है। कृपया अच्छी रोशनी में स्पष्ट फोटो पुनः लें।\n\n`;
    } else if (targetLang === 'hinglish') {
      uncertaintyNotice = `⚠️ **Uncertainty Notice:** Diagnostic confidence **LOW (${confidence}%)** hai. Yeh unconfirmed initial prediction hai. Kripya daylight mein clear close-up photo lein.\n\n`;
    } else {
      uncertaintyNotice = `⚠️ **Uncertainty Notice:** Diagnostic confidence is **LOW (${confidence}%)**. This is an unconfirmed initial prediction. Please capture a clearer close-up photo in diffuse daylight for confirmation.\n\n`;
    }
  }

  // 2.1 Spray / Treatment query on Diseased Plant
  if (q.includes('spray') || q.includes('dawai') || q.includes('medicine') || q.includes('chhidkaav') || q.includes('fungicide') || q.includes('pesticide') || q.includes('treatment')) {
    if (isRainImminent) {
      if (targetLang === 'hi') {
        return `⚠️ **स्प्रे सलाह (Spray Advisory - ${rawDisease}):**\n\n` +
          uncertaintyNotice +
          `आपके क्षेत्र में बारिश की संभावना **${rainProb}%** है। **आज किसी भी कीटनाशक या फफूंदनाशक का छिड़काव न करें**, क्योंकि बारिश से दवा धुल जाएगी।\n\n` +
          `• **मौसम साफ़ होने पर जैविक विकल्प:** ${organicList[0]}\n` +
          `• **तात्कालिक कदम:** ${immediateList[0]}\n` +
          `• **सावधानी:** ${disclaimer}`;
      } else if (targetLang === 'hinglish') {
        return `⚠️ **Spray Advisory (${rawDisease}):**\n\n` +
          uncertaintyNotice +
          `Aapke area mein rain probability **${rainProb}%** hai. **Aaj koi foliar spray na karein**, kyunki baarish se dawa wash ho jayegi.\n\n` +
          `• **Weather clear hone par organic treatment:** ${organicList[0]}\n` +
          `• **Immediate Action:** ${immediateList[0]}\n` +
          `• **Safety Note:** ${disclaimer}`;
      }
      return `⚠️ **Spray Advisory for ${rawDisease}:**\n\n` +
        uncertaintyNotice +
        `High precipitation forecasted (**${rainProb}% chance of rain**). **Do NOT apply foliar sprays today** as rainfall will wash away treatments and cause chemical runoff.\n\n` +
        `• **Recommended window:** Postpone spraying until a clear, dry morning.\n` +
        `• **Organic treatment (post-rain):** ${organicList[0]}\n` +
        `• **Immediate Action:** ${immediateList[0]}\n` +
        `• **Safety Note:** ${disclaimer}`;
    } else {
      if (targetLang === 'hi') {
        return `✅ **छिड़काव मार्गदर्शन (Spraying Guidance - ${rawDisease}):**\n\n` +
          uncertaintyNotice +
          `मौसम अनुकूल है (तापमान: ${temp}°C, बारिश: ${rainProb}%)। आप सुबह या देर शाम छिड़काव कर सकते हैं:\n\n` +
          `• **जैविक नियंत्रण:** ${organicList.slice(0, 2).map(o => `• ${o}`).join('\n')}\n` +
          `• **रासायनिक मार्गदर्शन:** ${chemicalList[0]}\n` +
          `• **सावधानी:** ${disclaimer}`;
      } else if (targetLang === 'hinglish') {
        return `✅ **Spraying Guidance (${rawDisease}):**\n\n` +
          uncertaintyNotice +
          `Weather favorable hai (temperature: ${temp}°C, rain probability: ${rainProb}%). Subah ya shaam ko spray kar sakte hain:\n\n` +
          `• **Organic Controls:**\n${organicList.slice(0, 2).map(o => `  • ${o}`).join('\n')}\n` +
          `• **Chemical Guidance:** ${chemicalList[0]}\n` +
          `• **Safety Note:** ${disclaimer}`;
      }
      return `✅ **Spraying Guidance for ${rawDisease}:**\n\n` +
        uncertaintyNotice +
        `Weather conditions are favorable for treatment (${temp}°C, ${rainProb}% rain probability):\n\n` +
        `• **Organic / Biological Controls:**\n${organicList.slice(0, 2).map(o => `  • ${o}`).join('\n')}\n` +
        `• **Chemical Guidance:** ${chemicalList[0]}\n` +
        `• **Application Tip:** Spray during early morning (06:00-08:00 AM) or late afternoon for maximum adherence.\n` +
        `• **Safety Note:** ${disclaimer}`;
    }
  }

  // 2.2 Organic query
  if (q.includes('organic') || q.includes('jaivik') || q.includes('natural') || q.includes('neem') || q.includes('home remedy')) {
    if (targetLang === 'hi') {
      return `🌿 **जैविक उपचार (Organic Management for ${rawDisease}):**\n\n` +
        uncertaintyNotice +
        organicList.map(item => `• ${item}`).join('\n') +
        `\n\n• **तात्कालिक कदम:** ${immediateList[0] || 'संक्रमित पत्तियों को हटाकर नष्ट करें।'}\n\n` +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `🌿 **Organic Management for ${rawDisease}:**\n\n` +
        uncertaintyNotice +
        organicList.map(item => `• ${item}`).join('\n') +
        `\n\n• **Immediate Physical Action:** ${immediateList[0] || 'Infected leaves ko remove karke destroy karein.'}\n\n` +
        `*${disclaimer}*`;
    }
    return `🌿 **Organic & Biological Management for ${rawDisease}:**\n\n` +
      uncertaintyNotice +
      organicList.map(item => `• ${item}`).join('\n') +
      `\n\n• **Immediate Physical Action:** ${immediateList[0] || 'Prune heavily infected leaves to reduce spore load.'}\n\n` +
      `*${disclaimer}*`;
  }

  // 2.3 Why / Cause query
  if (q.includes('kyu') || q.includes('why') || q.includes('cause') || q.includes('karan') || q.includes('reason')) {
    const rawCauses = diagnosisContext?.likelyCauses || `High humidity (${humidity}%) and temperature (${temp}°C) create favorable conditions for spore germination.`;
    const causes = translateAgronomicText(rawCauses, targetLang);
    if (targetLang === 'hi') {
      return `🔍 **रोग का कारण (${rawDisease}):**\n\n` +
        uncertaintyNotice +
        `• ${causes}\n` +
        `• **वर्तमान मौसम:** तापमान ${temp}°C, नमी ${humidity}%।\n` +
        `• **बचाव:** पौधों के बीच हवा का प्रवाह बनाए रखें और ड्रिप सिंचाई का उपयोग करें।\n\n` +
        `*${disclaimer}*`;
    } else if (targetLang === 'hinglish') {
      return `🔍 **Likely Causes for ${rawDisease}:**\n\n` +
        uncertaintyNotice +
        `• ${causes}\n` +
        `• **Current Weather:** Temperature ${temp}°C, humidity ${humidity}% pathogen spread favor karti hai.\n` +
        `• **Prevention:** Proper plant spacing rakhein aur overhead watering avoid karein.\n\n` +
        `*${disclaimer}*`;
    }
    return `🔍 **Likely Causes for ${rawDisease}:**\n\n` +
      uncertaintyNotice +
      `• ${causes}\n` +
      `• **Current Environmental Risk:** Temperature ${temp}°C with ${humidity}% humidity promotes pathogen proliferation.\n` +
      `• **Prevention:** Ensure proper row spacing for airflow and avoid overhead watering.\n\n` +
      `*${disclaimer}*`;
  }

  // 2.4 Default disease advisory
  if (targetLang === 'hi') {
    return `🌾 **एग्रीस्मार्ट कृषि विशेषज्ञ परामर्श (${crop} - ${rawDisease}):**\n\n` +
      uncertaintyNotice +
      `• **निदान स्थिति:** ${rawDisease} (${confidence}% विश्वसनीयता)\n` +
      `• **प्राथमिक कदम:** ${immediateList[0] || 'पौधों का नियमित निरीक्षण करें।'}\n` +
      `• **जैविक सलाह:** ${organicList[0] || 'नीम आधारित जैविक कीटनाशक का प्रयोग करें।'}\n` +
      `• **मौसम स्थिति:** तापमान ${temp}°C, आर्द्रता ${humidity}%, बारिश ${rainProb}%।\n\n` +
      `*${disclaimer}*`;
  } else if (targetLang === 'hinglish') {
    return `🌾 **AgriSmart Advisory (${crop} - ${rawDisease}):**\n\n` +
      uncertaintyNotice +
      `• **Diagnostic Status:** ${rawDisease} (${confidence}% confidence, ${confidenceLevel})\n` +
      `• **Immediate Action:** ${immediateList[0] || 'Leaves ka regular scouting karein'}\n` +
      `• **Key Organic Control:** ${organicList[0] || 'Neem oil spray ya bio-fungicide use karein'}\n` +
      `• **Farm Weather:** ${temp}°C, ${humidity}% humidity, ${rainProb}% rain probability.\n\n` +
      `*${disclaimer}*`;
  }

  return `🌾 **AgriSmart Decision-Support Advisory for ${rawDisease}:**\n\n` +
    uncertaintyNotice +
    `• **Diagnostic Status:** ${rawDisease} (${confidence}% confidence, ${confidenceLevel})\n` +
    `• **Immediate Action:** ${immediateList[0] || 'Regular foliar scouting'}\n` +
    `• **Key Organic Control:** ${organicList[0] || 'Bio-fungicide or neem oil formulation'}\n` +
    `• **Current Farm Conditions:** ${temp}°C, ${humidity}% humidity, ${rainProb}% rain probability.\n\n` +
    `*${disclaimer}*`;
}

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

module.exports = {
  answerFarmerQuery,
  generateGroundedFallbackResponse,
  buildSystemPromptEnvelope,
  resolveConfidenceMeta,
  resolveDiagnosticState,
  resolveLanguage,
  translateAgronomicText,
  SAFETY_DISCLAIMERS,
  isConfigured
};
