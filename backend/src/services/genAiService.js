// Grounded GenAI Agronomist Service
// Primary Conversational Intelligence: Gemini 3.6 Flash / Multi-turn
// Deterministic Layer: AgriSmart Context Builder + Safety Guardrails
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
 * Multilingual Agronomic Translation Dictionary for direct reports
 */
const AGRONOMIC_TRANSLATIONS = {
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
  'Prune and collect visibly infected shoots during dry weather to limit secondary spore release.': {
    hi: 'संक्रमित टहनियों को सूखे मौसम में काटकर नष्ट करें।',
    hinglish: 'Infected shoots ko dry weather me prune karke destroy karein.'
  },
  'Apply preventative wettable sulfur or liquid lime-sulfur sprays during early green-tip stage.': {
    hi: 'शुरुआती अवस्था में सल्फर आधारित जैविक स्प्रे करें।',
    hinglish: 'Early stage me sulphur-based organic spray karein.'
  }
};

/**
 * Detect language of query (en, hi, hinglish)
 */
function detectLanguage(text = '') {
  const normalized = String(text).toLowerCase();
  
  if (/[\u0900-\u097F]/.test(normalized)) {
    return 'hi';
  }
  
  const hinglishMarkers = [
    'kya', 'kaise', 'kare', 'karein', 'karegi', 'karna', 'karun', 'karu', 'hai', 'hain', 'mein', 'mera', 'meri', 'mere',
    'paani', 'pani', 'fasal', 'khet', 'patte', 'patti', 'bimari', 'ilaaj', 'dawa', 'dawaii', 'spray', 'khad',
    'chahiye', 'batao', 'bataiye', 'madad', 'rog', 'kisan', 'keede', 'mausam', 'barish', 'barsat', 'kal', 'aaj', 'parso',
    'du', 'dein', 'sakte', 'sakta', 'nahi', 'mat', 'nidan', 'sinchai'
  ];
  const words = normalized.split(/[^a-zA-Z0-9]+/);
  const matchCount = words.filter(w => hinglishMarkers.includes(w)).length;
  if (matchCount >= 2 || (matchCount >= 1 && words.length <= 4)) {
    return 'hinglish';
  }
  
  return 'en';
}

/**
 * Bounded history normalization (most recent 8-12 turns, alternating user/model)
 */
function normalizeConversationHistory(history = [], maxTurns = 10) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  // Slice most recent turns
  const recent = history.slice(-maxTurns);
  const normalized = [];
  let lastRole = null;

  for (const item of recent) {
    const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
    const text = String(item.content || item.text || item.message || '').trim();
    if (!text) continue;

    if (role === lastRole && normalized.length > 0) {
      normalized[normalized.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      normalized.push({
        role,
        parts: [{ text }]
      });
      lastRole = role;
    }
  }

  // Ensure sequence begins with 'user'
  while (normalized.length > 0 && normalized[0].role !== 'user') {
    normalized.shift();
  }

  return normalized;
}

/**
 * Context Relevance Model
 * Evaluates whether available candidate data sources (latest scan, active crop, disease, weather, irrigation, sustainability)
 * are genuinely relevant to the CURRENT turn.
 * Principle: DATA EXISTENCE != DATA RELEVANCE
 */
function evaluateContextRelevance({
  question = '',
  history = [],
  diagnosisContext = null,
  weatherContext = null,
  irrigationContext = null,
  sustainabilityContext = null
}) {
  const q = String(question || '').trim().toLowerCase();
  
  const cropRegex = /\b(tomato(?:es)?|potato(?:es)?|apple(?:s)?|corn|grape(?:s)?|wheat|rice|squash|pepper(?:s)?|strawberry|strawberries|peach(?:es)?|cherry|cherries|soybean(?:s)?|cotton|sugarcane|cucumber(?:s)?|onion(?:s)?|garlic|cabbage|cauliflower|brinjal|eggplant|okra|bhindi|aloo|tamatar)\b/i;
  
  const scanRefRegex = /\b(scan|scans|scanned|detection|detected|diagnos(?:is|ed|tic)|report|result|image\s+i\s+uploaded|photo\s+i\s+uploaded|uploaded\s+(?:image|photo|picture|scan)|last\s+result|recent\s+result|nidan|meri\s+report|mera\s+scan|last\s+scan|recent\s+scan|latest\s+scan|previous\s+scan)\b/i;

  const weatherRegex = /\b(weather|forecast|rain|raining|rainfall|barish|barsat|temperature|temp|humidity|wind|cloudy|sunny|precipitation|spray.*weather|mausam|kal\s+ka\s+mausam)\b/i;

  const irrigationRegex = /\b(irrigat(?:e|ion|ing)|water(?:ing)?|soil\s+moisture|drip|sprinkler|pani\s+(?:du|dein|lagaye|dena|chahiye)|sinchai|how\s+much\s+water|when\s+to\s+water)\b/i;

  const diseaseRegex = /\b(blight|mildew|rot|rust|scab|spot|spots|canker|virus|mosaic|wilt|fungus|fungal|pathogen|pest|insects|dhabbe|rog|bimari|keede)\b/i;

  // 1. Scan history for established active context
  let historyCrop = null;
  let historyDisease = false;
  let historyDiscussedScan = false;
  let historyDiscussedWeather = false;
  let historyDiscussedIrrigation = false;

  for (const item of history) {
    if (item.role !== 'user') continue;
    const text = String(item.content || item.text || item.parts?.[0]?.text || item.message || '').toLowerCase();
    if (!text) continue;

    const cMatch = text.match(cropRegex);
    if (cMatch) {
      let c = cMatch[1].charAt(0).toUpperCase() + cMatch[1].slice(1).toLowerCase();
      if (c.startsWith('Tomato')) c = 'Tomato';
      else if (c.startsWith('Potato')) c = 'Potato';
      else if (c === 'Aloo') c = 'Potato';
      else if (c === 'Tamatar') c = 'Tomato';
      else if (c === 'Bhindi') c = 'Okra';
      else if (c.startsWith('Apple')) c = 'Apple';
      else if (c.startsWith('Grape')) c = 'Grape';
      else if (c.startsWith('Pepper')) c = 'Pepper';
      else if (c.startsWith('Peach')) c = 'Peach';
      else if (c.startsWith('Strawberry')) c = 'Strawberry';
      else if (c.startsWith('Cherry')) c = 'Cherry';
      historyCrop = c;
    }

    if (scanRefRegex.test(text)) {
      historyDiscussedScan = true;
    }
    if (weatherRegex.test(text)) {
      historyDiscussedWeather = true;
    }
    if (irrigationRegex.test(text)) {
      historyDiscussedIrrigation = true;
    }
    if (diseaseRegex.test(text)) {
      historyDisease = true;
    }
  }

  // 2. Evaluate current question for explicit mentions
  let queryCrop = null;
  const cMatchQuery = q.match(cropRegex);
  if (cMatchQuery) {
    let c = cMatchQuery[1].charAt(0).toUpperCase() + cMatchQuery[1].slice(1).toLowerCase();
    if (c.startsWith('Tomato')) c = 'Tomato';
    else if (c.startsWith('Potato')) c = 'Potato';
    else if (c === 'Aloo') c = 'Potato';
    else if (c === 'Tamatar') c = 'Tomato';
    else if (c === 'Bhindi') c = 'Okra';
    else if (c.startsWith('Apple')) c = 'Apple';
    else if (c.startsWith('Grape')) c = 'Grape';
    else if (c.startsWith('Pepper')) c = 'Pepper';
    else if (c.startsWith('Peach')) c = 'Peach';
    else if (c.startsWith('Strawberry')) c = 'Strawberry';
    else if (c.startsWith('Cherry')) c = 'Cherry';
    queryCrop = c;
  }

  // Active crop resolution
  const activeCropName = queryCrop || historyCrop || null;
  const activeCropSource = queryCrop ? 'explicit_query' : historyCrop ? 'active_conversation' : null;

  // Latest scan relevance
  const isExplicitScan = scanRefRegex.test(q);
  const isScanFollowUp = historyDiscussedScan && /\b(it|this|that|next|kya\s+karu|what\s+now|steps?|action|treatment|remedy|dawa|cure|spray)\b/i.test(q);
  const scanRelevant = Boolean(diagnosisContext && (isExplicitScan || isScanFollowUp));
  const scanReason = isExplicitScan ? 'explicit_reference' : isScanFollowUp ? 'active_conversation' : 'not_relevant';

  // Disease relevance
  const isExplicitDisease = diseaseRegex.test(q);
  const isDiseaseFollowUp = (historyDisease || (scanRelevant && diagnosisContext?.disease)) && /\b(it|this|prevent|cure|treat|stop|spread|dawa|ilaaj|remedy|control)\b/i.test(q);
  const diseaseRelevant = Boolean(isExplicitDisease || isDiseaseFollowUp || scanRelevant);
  const diseaseReason = isExplicitDisease ? 'explicit_reference' : (isDiseaseFollowUp || scanRelevant) ? 'active_conversation' : 'not_relevant';

  // Weather relevance
  const isExplicitWeather = weatherRegex.test(q);
  const isWeatherFollowUp = historyDiscussedWeather && /\b(tomorrow|today|forecast|spray|rain|kal|aaj)\b/i.test(q);
  const weatherRelevant = Boolean(weatherContext && (isExplicitWeather || isWeatherFollowUp));
  const weatherReason = isExplicitWeather ? 'explicit_reference' : isWeatherFollowUp ? 'active_conversation' : 'not_relevant';

  // Irrigation relevance
  const isExplicitIrrigation = irrigationRegex.test(q);
  const isIrrigationFollowUp = historyDiscussedIrrigation && /\b(how\s+often|how\s+much|schedule|drip|watering|volume|frequency|pani|sinchai)\b/i.test(q);
  const irrigationRelevant = Boolean(irrigationContext && (isExplicitIrrigation || isIrrigationFollowUp));
  const irrigationReason = isExplicitIrrigation ? 'explicit_reference' : isIrrigationFollowUp ? 'active_conversation' : 'not_relevant';

  // Sustainability relevance
  const isExplicitSustainability = /\b(sustainability|eco|carbon|water\s+saving|green\s+score)\b/i.test(q);
  const sustainabilityRelevant = Boolean(sustainabilityContext && isExplicitSustainability);
  const sustainabilityReason = isExplicitSustainability ? 'explicit_reference' : 'not_relevant';

  return {
    latestScan: {
      relevant: scanRelevant,
      reason: scanReason,
      data: scanRelevant ? diagnosisContext : null
    },
    activeCrop: {
      name: activeCropName || (scanRelevant ? diagnosisContext?.crop : null),
      source: activeCropSource || (scanRelevant ? 'latest_scan' : null)
    },
    disease: {
      relevant: diseaseRelevant,
      diseaseName: (scanRelevant ? diagnosisContext?.disease : null) || null,
      reason: diseaseReason
    },
    weather: {
      relevant: weatherRelevant,
      reason: weatherReason,
      data: weatherRelevant ? weatherContext : null
    },
    irrigation: {
      relevant: irrigationRelevant,
      reason: irrigationReason,
      data: irrigationRelevant ? irrigationContext : null
    },
    sustainability: {
      relevant: sustainabilityRelevant,
      reason: sustainabilityReason,
      data: sustainabilityRelevant ? sustainabilityContext : null
    },
    hasAnyGroundedContext: scanRelevant || weatherRelevant || irrigationRelevant || sustainabilityRelevant
  };
}

/**
 * Build AgriSmart background context for Gemini
 */
function buildAgriSmartContext({ relevance, diagnosisContext, weatherContext, irrigationContext }) {
  const parts = [];

  if (relevance?.activeCrop?.name) {
    parts.push(`[ACTIVE CONVERSATIONAL TOPIC]:
- Target Crop: ${relevance.activeCrop.name} (Source: ${relevance.activeCrop.source})`);
  }

  if (relevance?.latestScan?.relevant && diagnosisContext && (diagnosisContext.diseaseName || diagnosisContext.disease)) {
    const diseaseName = diagnosisContext.diseaseName || diagnosisContext.disease;
    const crop = diagnosisContext.crop || 'Plant';
    const conf = Math.round((diagnosisContext.confidence || 0.85) * 100);
    const kb = getDiseaseKnowledge(diseaseName);

    parts.push(`[LATEST SCAN CONTEXT (Explicitly Requested / Active Topic)]:
- Crop: ${crop}
- Diagnosed Condition: ${diseaseName} (${conf}% confidence)
- Pathogen Type: ${kb.pathogenType || 'N/A'}
- Primary Cultural Actions: ${(kb.immediateActions || kb.immediateSteps || []).slice(0, 2).join('; ') || 'Inspect foliage, prune affected areas'}
- Organic Options: ${(kb.organicManagement || kb.organicControls || []).slice(0, 2).join('; ') || 'Neem oil foliar spray'}`);
  }

  if (relevance?.weather?.relevant && weatherContext) {
    parts.push(`[LIVE WEATHER TELEMETRY (Relevant to Query)]:
- Temperature: ${weatherContext.temperature ?? 'N/A'}°C
- Relative Humidity: ${weatherContext.humidity ?? 'N/A'}%
- Rain Probability: ${weatherContext.rainProbability ?? weatherContext.pop ?? 0}%
- Wind Speed: ${weatherContext.windSpeed ?? 'N/A'} km/h`);
  }

  if (relevance?.irrigation?.relevant && irrigationContext) {
    parts.push(`[SMART IRRIGATION CONTEXT (Relevant to Query)]:
- Action: ${irrigationContext.action || irrigationContext.recommendation || 'Regular irrigation'}
- Reason: ${irrigationContext.reason || 'Optimal soil moisture schedule'}`);
  }

  if (parts.length === 0) {
    return `[CONTEXT NOTE]: No specific scan, crop, or telemetry data was requested for this turn. Answer as a helpful general agronomist and ask for specific crop/farm details if needed.`;
  }

  return parts.join('\n\n');
}

/**
 * Build System Instructions for Gemini as Primary Conversational Brain
 */
function buildSystemInstruction(language = 'en', agriContext = '') {
  let instruction = `You are the conversational intelligence of AgriSmart AI, a conversational AI agronomist specialized exclusively in agriculture, plant science, crop disease management, soil care, weather intelligence, and agricultural technology.

CORE CONVERSATIONAL PRINCIPLES:
1. CONVERSATION UNDERSTANDING & RESOLUTION:
   - Understand the current user message in the context of recent conversation history.
   - If the user refers to something implicitly (e.g., "it", "they", "this problem", "what should I check first?", "where do I begin?", "what about tomorrow?", "can you show an example?", "how to fix this?"), resolve the reference from previous turns.
   - Do NOT repeat the previous answer verbatim unless repetition is explicitly requested.
   - Answer the user's CURRENT question and conversational goal directly and naturally.
   - If the user asks a follow-up question, continue the existing topic naturally.
   - If the user changes topic to another agriculture-related subject (e.g. from diseases to irrigation or to another crop), follow the new topic smoothly.
   - Never invent or assume a disease merely because a crop name was mentioned (e.g. "I grow tomatoes" or "My crop is Apple" means the crop is Tomato or Apple; do not jump to Early Blight or Apple Scab without symptoms).

2. DOMAIN BOUNDARIES:
   - AgriSmart is dedicated exclusively to agriculture, farming, crops, plant health, agronomy, soil, fertilizers, irrigation, weather for agriculture, and modern agricultural technology.
   - If the user asks a pure non-agriculture question (e.g., general programming like "What is Python?", general movies, sports, recipes for pizza, generic jokes), set "domain": "NON_AGRICULTURE", "contextual": false, and politely redirect them toward agriculture.
   - Agriculture-connected technology questions (e.g., "How is Python used in agriculture?", "How can SQL help manage farm data?", "How does soil physics affect irrigation?") ARE FULLY ALLOWED and MUST be answered substantively in the context of modern farming.

3. CONTEXT RELEVANCE & GROUNDING (DATA EXISTENCE != DATA RELEVANCE):
   - AgriSmart context is optional reference data provided only when relevant.
   - Use ONLY the context explicitly provided in AVAILABLE AGRISMART SYSTEM CONTEXT.
   - Never assume the user's latest scan, crop, disease, weather, or irrigation state is relevant merely because it exists in the database.
   - If no specific crop or disease is established in the user's message or active conversation history, do NOT invent or infer one from stored farm data.
   - When the user asks a broad agriculture question (e.g., "Can you help me to grow my plants?", "How do I make my plants healthier?", "How can I improve my crops?"), provide general agricultural guidance (soil care, deep root watering, light, balanced nutrition, scouting) and politely ask what specific crop they are growing.
   - Set "contextual": true ONLY if the response directly grounds in explicitly relevant scan data, live weather telemetry, or specific irrigation telemetry for this turn.
   - For generic agriculture questions, broad plant care, conceptual agronomy, or non-agri queries, set "contextual": false.

4. SAFETY & REGULATORY:
   - Always encourage IPM (Integrated Pest Management) and cultural/organic controls first.
   - If rain probability is high (>=50%), advise against foliar chemical sprays because rain washes them off.
   - For healthy plants, focus on preventive nutrition and irrigation; do NOT prescribe curative fungicides.
   - Match the user's language: ${language === 'hi' ? 'Hindi (Devanagari)' : language === 'hinglish' ? 'Hinglish (Hindi written in Roman script)' : 'English'}.

5. STRUCTURED JSON OUTPUT SCHEMA:
You MUST respond with a single valid JSON object strictly matching this schema:
{
  "domain": "AGRICULTURE" | "NON_AGRICULTURE",
  "contextual": boolean,
  "topic": string,
  "intent": "GREETING" | "GENERAL_PLANT_CARE" | "DIAGNOSIS" | "TREATMENT" | "PREVENTION" | "IRRIGATION" | "WEATHER" | "AGRITECH" | "GENERAL_AGRICULTURE" | "NON_AGRICULTURE",
  "response": "Your natural, helpful, conversational response here...",
  "needs_clarification": boolean
}`;

  if (agriContext) {
    instruction += `\n\nAVAILABLE AGRISMART SYSTEM CONTEXT (Use only when relevant to the user's inquiry):\n${agriContext}`;
  }

  return instruction;
}

/**
 * Deterministic Safety Guardrail & Post-Validation Layer
 */
function applySafetyAndDomainGuardrails(geminiResult, { relevance, weatherContext, diagnosisContext, irrigationContext, language = 'en' }) {
  const lang = language || 'en';
  const disclaimer = SAFETY_DISCLAIMERS[lang] || SAFETY_DISCLAIMERS.en;

  const sanitized = {
    domain: geminiResult.domain || 'AGRICULTURE',
    contextual: Boolean(geminiResult.contextual),
    topic: geminiResult.topic || 'General Farming',
    intent: geminiResult.intent || 'GENERAL_AGRICULTURE',
    response: String(geminiResult.response || '').trim(),
    needs_clarification: Boolean(geminiResult.needs_clarification),
    warnings: [],
    irrigationAdvice: null,
    diseaseManagement: null,
    immediateActions: []
  };

  // Rule 1: Non-Agriculture Boundary Enforcement
  if (sanitized.domain === 'NON_AGRICULTURE' || sanitized.intent === 'NON_AGRICULTURE') {
    sanitized.contextual = false;
    sanitized.domain = 'NON_AGRICULTURE';
    sanitized.intent = 'NON_AGRICULTURE';
  }

  // Rule 2: Gating Contextual flag if no grounded context is relevant
  if (relevance && !relevance.hasAnyGroundedContext && !relevance.activeCrop?.name) {
    sanitized.contextual = false;
  }

  // Rule 3: Rain & Spray Safety Guardrail
  const rainProb = weatherContext ? (weatherContext.rainProbability ?? weatherContext.pop ?? 0) : 0;
  if (rainProb >= 50 && sanitized.domain === 'AGRICULTURE') {
    sanitized.warnings.push('Rain forecast >= 50%: do NOT spray foliar chemicals or over-water.');
    sanitized.irrigationAdvice = 'Postpone irrigation due to imminent rainfall and wet soil conditions.';
  } else if (irrigationContext && (relevance?.irrigation?.relevant || relevance?.hasAnyGroundedContext)) {
    sanitized.irrigationAdvice = irrigationContext.reason || irrigationContext.action || null;
  }

  // Rule 4: Attach verified monograph and actions ONLY when scan or disease is explicitly relevant
  if ((relevance?.latestScan?.relevant || relevance?.disease?.relevant) && diagnosisContext && (diagnosisContext.diseaseName || diagnosisContext.disease)) {
    const dName = diagnosisContext.diseaseName || diagnosisContext.disease;
    const monograph = getDiseaseMonograph(dName);
    const knowledge = getDiseaseKnowledge(dName);

    if (monograph?.found) {
      sanitized.diseaseManagement = monograph;
    }
    sanitized.immediateActions = (knowledge && (knowledge.immediateActions || knowledge.immediateSteps)) || (monograph?.scoutingProtocol ? [monograph.scoutingProtocol] : []);
  }

  // Rule 5: Secret & API Key Leakage Protection
  const rawKey = process.env.GEMINI_API_KEY;
  if (rawKey && sanitized.response.includes(rawKey)) {
    sanitized.response = sanitized.response.replace(new RegExp(rawKey, 'g'), '[PROTECTED]');
  }

  return sanitized;
}

/**
 * Resilient Contextual Fallback for Gemini API Quota Limits / Offline State
 */
function generateContextualFallback({ question = '', history = [], relevance = null, diagnosisContext = null, weatherContext = null, irrigationContext = null, language = 'en' }) {
  const lang = language || 'en';
  const q = String(question || '').trim().toLowerCase();
  const disclaimer = SAFETY_DISCLAIMERS[lang] || SAFETY_DISCLAIMERS.en;

  const rel = relevance || evaluateContextRelevance({
    question: q,
    history,
    diagnosisContext,
    weatherContext,
    irrigationContext
  });

  // 1. Simple greeting check
  if (/^(hi|hii|hello|hey|namaste|good morning|good evening)\b/i.test(q)) {
    const greeting = lang === 'hi'
      ? "नमस्ते! 👋 मैं आपका एग्रीस्मार्ट एआई कृषि सलाहकार हूँ। आज मैं आपकी फसलों, रोग निदान, सिंचाई या मौसम में कैसे सहायता कर सकता हूँ? 🌱"
      : lang === 'hinglish'
      ? "Namaste! 👋 Main aapka AgriSmart AI Agronomist hoon. Aaj main aapki fasal, rog nidan, sinchai ya mausam me kaise madad kar sakta hoon? 🌱"
      : "Hi! 👋 I'm your AgriSmart AI Agronomist. How can I help you today? You can ask about crop health, irrigation, weather, fertilizers, pest management, or your latest scan. 🌱";

    return {
      domain: 'AGRICULTURE',
      contextual: false,
      topic: 'Greeting',
      intent: 'GREETING',
      response: greeting,
      needs_clarification: false
    };
  }

  // Check agricultural query presence
  let hasAgriHistory = false;
  let historyTopic = '';
  const agriPattern = /(agri|farm|kheti|crop|plant|grow|growth|care|soil|yield|pest|disease|irrigation|sinchai|water|watering|pani|paani|weather|mausam|rain|barish|barsat|precision|khet|fasal|kisan|patte|patti|spray|chhidkaw|khad|fertilizer|manure|pesticide|fungicide|dawa|tomato|potato|apple|corn|grape|wheat|rice|squash|pepper|strawberry|peach|leaves|leaf|spot|spots|fung|root|seed|rot|mildew|blight|garden|gardening|scan|scans|scanned|detection|detected|diagnos|report|nidan|greenhouse|orchard|seedling|compost|mulch)/i;

  for (const item of history) {
    if (item.role === 'user') {
      const text = String(item.content || item.text || item.parts?.[0]?.text || item.message || '').toLowerCase();
      if (agriPattern.test(text)) {
        hasAgriHistory = true;
      }
      if (/(python|programming|ai|code|data|model|sql)/i.test(text)) {
        if (hasAgriHistory || agriPattern.test(text)) {
          historyTopic = 'agritech';
        }
      }
    }
  }

  const hasAgriInQuery = agriPattern.test(q) || rel.hasAnyGroundedContext || rel.activeCrop.name !== null || rel.latestScan.relevant;

  // Pure non-agriculture check (if neither history nor current query has agriculture terms)
  if (!hasAgriHistory && !hasAgriInQuery) {
    const redirect = lang === 'hi'
      ? "मैं एग्रीस्मार्ट एआई कृषि विशेषज्ञ हूँ। मैं केवल कृषि, फसल स्वास्थ्य, मिट्टी और स्मार्ट फार्मिंग से जुड़े प्रश्नों में सहायता करता हूँ। कृपया अपनी फसल या खेती से संबंधित प्रश्न पूछें। 🌱"
      : lang === 'hinglish'
      ? "Main AgriSmart AI Agricultural Agronomist hoon aur sirf kheti, crop health, soil aur smart farming me madad karta hoon. Kripya apni fasal ya farming se related sawal poochein. 🌱"
      : "I am AgriSmart AI Agronomist, specialized exclusively in agriculture, crop health, soil management, and precision farming. While I focus on agricultural topics, feel free to ask how technology is applied in agriculture! How can I assist with your crops today? 🌱";

    return {
      domain: 'NON_AGRICULTURE',
      contextual: false,
      topic: 'Domain Redirect',
      intent: 'NON_AGRICULTURE',
      response: redirect,
      needs_clarification: false
    };
  }

  // Weather query or temporal follow-up
  if (rel.weather.relevant) {
    const temp = weatherContext?.temperature ?? 25;
    const rainProb = weatherContext ? (weatherContext.rainProbability ?? weatherContext.pop ?? 10) : 10;
    const weatherResp = rainProb >= 50
      ? (lang === 'hi'
          ? `🌧️ **मौसम व स्प्रे सलाह (${temp}°C, ${rainProb}% बारिश):**\n\nबारिश की संभावना (${rainProb}%) अधिक होने के कारण आज फोलियर स्प्रे और सिंचाई टालें (Delay Irrigation)। बारिश से स्प्रे धुल जाएगा और खेत में जलभराव हो सकता है। 🌱`
          : (lang === 'hinglish'
              ? `🌧️ **Mausam Telemetry (${temp}°C, ${rainProb}% Barish):**\n\nBarish ki ${rainProb}% sambhavna ke karan aaj foliar spray mat karein aur pani (sinchai) delay karein. Barish se spray dhul jayega. 🌱`
              : `🌧️ **Weather Telemetry (${temp}°C, ${rainProb}% Rain):**\n\nPostpone foliar chemical applications due to high probability of precipitation. Maintain proper drainage. 🌱`))
      : (lang === 'hi'
          ? `🌤️ **खेत मौसम सलाह (${temp}°C, ${rainProb}% बारिश):**\n\nमौसम साफ है। सुबह के समय खेत का निरीक्षण और आवश्यक कृषि कार्य किए जा सकते हैं। 🌱`
          : (lang === 'hinglish'
              ? `🌤️ **Khet Mausam Telemetry (${temp}°C, ${rainProb}% Barish):**\n\nMausam kheti ke anukool hai. Subah ke samay field scouting aur regular kheti operations kar sakte hain. 🌱`
              : `🌤️ **Farm Weather Telemetry (${temp}°C, ${rainProb}% Rain):**\n\nConditions are suitable for field scouting and early morning operations. 🌱`));

    return {
      domain: 'AGRICULTURE',
      contextual: true,
      topic: 'Weather',
      intent: 'WEATHER',
      response: weatherResp,
      needs_clarification: false
    };
  }

  // Agritech query or follow-up
  const isAgriTech = ((historyTopic === 'agritech' && /example/i.test(q)) || /(python|ai|sql|iot|sensors?|drones?|satellite|ndvi)/i.test(q)) && (hasAgriHistory || hasAgriInQuery);
  if (isAgriTech) {
    const agritechResp = lang === 'hi'
      ? "यहाँ कृषि में पायथन का एक व्यावहारिक उदाहरण है:\n\n```python\n# उपग्रह डेटा से एनडीवीआई (NDVI) फसल स्वास्थ्य विश्लेषण\nimport numpy as np\ndef calculate_ndvi(nir, red):\n    return (nir - red) / (nir + red + 1e-6)\n```\n\nड्रोन और सैटेलाइट इमेजरी के साथ फसल की वृद्धि मापने और स्मार्ट सिंचाई के लिए इसका उपयोग किया जाता है। 🌱"
      : "In precision agriculture, modern technology (such as Python, AI/ML, and IoT sensors) is used for satellite NDVI crop health mapping, disease classification, and predictive irrigation scheduling.\n\n```python\n# NDVI Vegetation Index Calculation for Crop Health\nimport numpy as np\ndef calculate_ndvi(nir_band, red_band):\n    return (nir_band - red_band) / (nir_band + red_band + 1e-6)\n```\n\nAgronomists apply these algorithms for yield forecasting and automated variable-rate spraying. 🌱";

    return {
      domain: 'AGRICULTURE',
      contextual: false,
      topic: 'Precision Agriculture',
      intent: 'AGRITECH',
      response: agritechResp,
      needs_clarification: false
    };
  }

  // Irrigation explicit query
  if (rel.irrigation.relevant) {
    const targetCrop = rel.activeCrop.name || 'plants';
    const irrigResp = lang === 'hi'
      ? `💧 **सिंचाई प्रबंधन (${targetCrop}):**\n\n- सीधे जड़ क्षेत्र में ड्रिप प्रणाली से पानी दें। पत्तियों पर ऊपर से पानी न डालें।\n- खेत में उचित जल निकासी रखें ताकि जड़ों में जलभराव न हो। 🌱`
      : `💧 **Irrigation & Moisture Protocol (${targetCrop}):**\n\n- Deliver water directly to the root zone via drip lines; avoid overhead sprinklers that wet the foliage.\n- Keep the topsoil evenly moist while ensuring adequate subsoil drainage to prevent root rot. 🌱`;

    return {
      domain: 'AGRICULTURE',
      contextual: true,
      topic: 'Irrigation',
      intent: 'IRRIGATION',
      response: irrigResp,
      needs_clarification: false
    };
  }

  // Explicit Latest Scan Discussion
  if (rel.latestScan.relevant && diagnosisContext) {
    const dCrop = diagnosisContext.crop || 'Plant';
    const dDisease = diagnosisContext.disease || diagnosisContext.diseaseName || 'Crop Disease';
    const conf = Math.round((diagnosisContext.confidence || 0.85) * 100);

    const scanResp = lang === 'hi'
      ? `📋 **नवीनतम स्कैन रिपोर्ट (${dCrop} - ${dDisease}):**\n\nआपके हालिया स्कैन में **${dDisease}** (${conf}% सटीकता) की पहचान हुई है।\n\n1. **तात्कालिक कदम:** रोगग्रस्त पत्तियों को सावधानीपूर्वक काटकर नष्ट करें।\n2. **जैविक प्रबंधन:** सुबह के समय नीम के तेल (5 मिली/लीटर) का स्प्रे करें।\n3. **सिंचाई:** ड्रिप सिंचाई द्वारा केवल जड़ों में पानी दें; पत्तियों को सूखा रखें।\n\n*${disclaimer}*`
      : lang === 'hinglish'
      ? `📋 **Latest Scan Report (${dCrop} - ${dDisease}):**\n\nAapke recent scan me **${dDisease}** (${conf}% confidence) detect hua hai.\n\n1. **Immediate Step:** Infected leaves ko prune karke safely destroy karein.\n2. **Organic Spray:** Subah neem oil (5ml/L) ka foliar spray karein.\n3. **Irrigation:** Roots me drip se paani dein; foliage geela na karein.\n\n*${disclaimer}*`
      : `📋 **Latest Scan Report (${dCrop} - ${dDisease}):**\n\nBased on your recent scan diagnosing **${dDisease}** (${conf}% confidence):\n\n1. **Immediate Step:** Carefully prune and destroy heavily spotted/infected foliage to reduce fungal inoculum.\n2. **Organic Management:** Apply a preventive neem oil foliar spray (5ml/L) or registered bio-fungicide.\n3. **Moisture Control:** Switch to root-zone drip irrigation to keep canopy foliage dry.\n\n*${disclaimer}*`;

    return {
      domain: 'AGRICULTURE',
      contextual: true,
      topic: 'Scan Diagnosis',
      intent: 'DIAGNOSIS',
      response: scanResp,
      needs_clarification: false
    };
  }

  // Explicit Crop Established in Conversation / Query
  const establishedCrop = rel.activeCrop.name;
  if (establishedCrop) {
    // 1. Initial Action / Where to Begin Question
    if (/\b(where do i (begin|start)|what (should|to) (i|we)?\s*(check|do) (first|initially)|how (should|do) i start|first steps?|kaha se shuru|kya karu pehle)\b/i.test(q)) {
      const beginResp = lang === 'hi'
        ? `🔍 **निरीक्षण व प्रारंभिक कदम (${establishedCrop}):**\n\n1. **पत्तियों की जांच:** अपने ${establishedCrop} के पौधों की निचली पत्तियों और तनों का निरीक्षण करें कि धब्बों का रंग और आकार कैसा है।\n2. **सफाई:** अत्यधिक प्रभावित निचली पत्तियों को विसंक्रमित कैंची से काटकर नष्ट करें।\n3. **जल प्रबंधन:** पत्तियों पर पानी का छिड़काव बंद करें और केवल जड़ों में पानी दें।\n\n*${disclaimer}*`
        : `🔍 **Initial Inspection & Next Steps (${establishedCrop}):**\n\n1. **Canopy Inspection:** Start by checking the lower leaves and undersides of your ${establishedCrop} to see if spots have dark concentric rings or yellow halos.\n2. **Sanitation:** Carefully prune and destroy heavily spotted lower leaves using clean tools to reduce fungal spore loads.\n3. **Foliar Management:** Ensure foliage stays dry by switching to drip irrigation at the root zone.\n\n*${disclaimer}*`;

      return {
        domain: 'AGRICULTURE',
        contextual: true,
        topic: 'Initial Scouting',
        intent: 'DIAGNOSIS',
        response: beginResp,
        needs_clarification: false
      };
    }

    // 2. Foliar Symptom Reporting / Diagnosis
    if (/\b(yellow spots?|brown spots?|spots? on leaves|dark spots?|lesions?|wilting|leaf curl|peele patte|dhabbe)\b/i.test(q)) {
      const symptomResp = lang === 'hi'
        ? `🌱 **फसल लक्षण परामर्श (${establishedCrop}):**\n\n${establishedCrop} की पत्तियों पर धब्बे फफूंद जनित संक्रमण (जैसे अर्ली ब्लाइट या सेप्टोरिया) या पोषण की कमी का संकेत हो सकते हैं। प्रभावित पत्तियों को सूखा रखें और कैनोपी में हवा का आवागमन सुनिश्चित करें।\n\n*${disclaimer}*`
        : `🌱 **Foliar Symptom Assessment (${establishedCrop}):**\n\nYellow or discolored foliar spots on ${establishedCrop} commonly indicate early fungal leaf spots or localized nutrient stress. Avoid overhead watering to prevent spore dispersal, and monitor whether new shoots are affected.\n\n*${disclaimer}*`;

      return {
        domain: 'AGRICULTURE',
        contextual: true,
        topic: 'Symptom Assessment',
        intent: 'DIAGNOSIS',
        response: symptomResp,
        needs_clarification: false
      };
    }

    // 3. Prevention & Spread Control
    if (/\b(prevent|worse|stop.*(it|spread|disease)|future|roktham)\b/i.test(q)) {
      const preventResp = lang === 'hi'
        ? `🛡️ **रोग रोकथाम व सुरक्षा उपाय (${establishedCrop}):**\n\n1. **हवा का संचार:** पौधों के बीच उचित दूरी रखें ताकि पत्तियों में हवा और धूप लगे।\n2. **जैविक सुरक्षा:** सुरक्षात्मक उपाय के रूप में नीम तेल (5 मिली/लीटर) या ट्राइकोडर्मा का सुबह के समय छिड़काव करें।\n3. **फसल चक्र:** अगली बुवाई में गैर-सोलेनेसी फसलों का चक्र अपनाएं।\n\n*${disclaimer}*`
        : `🛡️ **Prevention & Disease Spread Control (${establishedCrop}):**\n\n1. **Aeration & Spacing:** Maintain proper plant spacing and prune crowded lower foliage to maximize canopy air movement and rapid drying.\n2. **Protective Bio-Control:** Apply cold-pressed Neem oil (5ml/L) or a registered bio-fungicide during calm morning hours.\n3. **Mulching:** Apply organic mulch at the base to prevent soil-borne pathogens from splashing onto leaves during watering.\n\n*${disclaimer}*`;

      return {
        domain: 'AGRICULTURE',
        contextual: true,
        topic: 'Preventive Care',
        intent: 'PREVENTION',
        response: preventResp,
        needs_clarification: false
      };
    }

    // 4. General agronomic crop care for established crop
    const cropCareResp = lang === 'hi'
      ? `🌿 **फसल देखभाल परामर्श (${establishedCrop}):**\n\n1. **कैनोपी निरीक्षण:** पत्तियों की निचली सतह और नई शाखाओं का नियमित निरीक्षण करें।\n2. **पोषण व सिंचाई:** ड्रिप सिंचाई द्वारा संतुलित नमी रखें और पत्तियों को गीला करने से बचें।\n3. **स्वच्छता:** सूखी या पीली पत्तियों को काटकर खेत साफ़ रखें।\n\n*${disclaimer}*`
      : `🌿 **Agronomic Guidance (${establishedCrop}):**\n\n1. **Foliar Inspection:** Inspect leaf undersides and stems regularly to catch any early symptoms.\n2. **Water Management:** Apply water at the root zone via drip lines to avoid prolonged leaf wetness.\n3. **Sanitation:** Prune and safely remove discolored lower leaves to maintain canopy aeration.\n\n*${disclaimer}*`;

    return {
      domain: 'AGRICULTURE',
      contextual: true,
      topic: 'Crop Care',
      intent: 'GENERAL_AGRICULTURE',
      response: cropCareResp,
      needs_clarification: false
    };
  }

  // NO specific crop is established in query or history, and NO scan was requested.
  // Provide general agronomic guidance and ask what crop they are growing.
  const generalPlantCareResp = lang === 'hi'
    ? `🌱 **पौधों की सामान्य देखभाल व संवर्धन मार्गदर्शन:**\n\nपौधों के बेहतर विकास और अच्छी पैदावार के लिए इन मूलभूत कृषि सिद्धांतों का पालन करें:\n\n1. **मिट्टी व जड़ स्वास्थ्य:** जैविक खाद (वर्मीकम्पोस्ट) का प्रयोग करें और मिट्टी में उचित वायु संचार व जल निकासी रखें।\n2. **जल प्रबंधन:** पत्तियों पर पानी का छिड़काव न करें; सुबह के समय सीधे जड़ क्षेत्र में पानी दें।\n3. **धूप व वायु संचार:** पौधों को प्रतिदिन 6-8 घंटे की धूप और पर्याप्त दूरी दें ताकि हवा का प्रवाह बना रहे।\n4. **संतुलित पोषण:** पौधों की वृद्धि अवस्था के अनुसार संतुलित पोषक तत्व (N-P-K) दें।\n5. **नियमित निरीक्षण:** पत्तियों की निचली सतह पर कीटों या धब्बों के शुरुआती लक्षणों की नियमित जांच करें।\n\n*आप कौन सी फसल या पौधा उगा रहे हैं, या क्या आपको पत्तियों पर कोई खास लक्षण (जैसे पीलापन या धब्बे) दिखाई दे रहे हैं? कृपया बताएं ताकि मैं सटीक मार्गदर्शन दे सकूँ! 🌱*`
    : lang === 'hinglish'
    ? `🌱 **Plant Growth aur Care ke Core Principles:**\n\nApne plants ko healthy rakhne aur acchi growth ke liye in basic farming practices ko follow karein:\n\n1. **Mitti aur Root Health:** Mitti me achi organic compost milayein aur drainage maintain karein taaki paani jam na ho.\n2. **Water Management:** Leaves par paani mat chhidkein; subah root zone me drip se paani dein.\n3. **Dhoop aur Spacing:** Plants ko proper sunlight (6-8 ghante) aur canopy airflow ke liye sahi spacing dein.\n4. **Balanced Nutrition:** Growth stage ke according balanced nutrients aur organic manure use karein.\n5. **Regular Scouting:** Weekly leaves ke niche check karein koi pests ya spots toh nahi hain.\n\n*Aap kaunsi crop ya plant grow kar rahe hain? Kripya batayein taaki main aapko specific guidance de sakoon! 🌱*`
    : `🌱 **General Plant Care & Crop Improvement:**\n\nTo help your plants grow vigorously and maintain optimal health, follow these core agronomic best practices:\n\n1. **Soil & Root Zone Health:** Ensure well-aerated, fertile soil with good organic matter (compost) and proper drainage to avoid waterlogging.\n2. **Targeted Watering:** Deliver water directly to the soil line/root zone rather than overhead spraying, which keeps foliage dry and deters fungal pathogens.\n3. **Sunlight & Canopy Aeration:** Provide adequate daily sunlight (6–8 hours for most fruiting crops) and maintain proper plant spacing for air circulation.\n4. **Balanced Plant Nutrition:** Apply balanced organic compost or tailored N-P-K nutrients aligned with your crop's vegetative or flowering stage.\n5. **Regular Crop Scouting:** Check leaf undersides and new shoots weekly to catch any nutrient deficiencies or early pest pressure.\n\n*Which specific crop or plant are you growing, or are you noticing any particular symptoms (such as yellowing leaves or spots)? Let me know so I can provide tailored recommendations! 🌱*`;

  return {
    domain: 'AGRICULTURE',
    contextual: false,
    topic: 'General Plant Care',
    intent: 'GENERAL_PLANT_CARE',
    response: generalPlantCareResp,
    needs_clarification: true
  };
}

/**
 * Answer farmer query with Gemini as primary conversational brain
 */
async function answerFarmerQuery({
  question,
  history = [],
  diagnosisContext = null,
  weatherContext = null,
  irrigationContext = null,
  sustainabilityContext = null
}) {
  const language = detectLanguage(question);
  const normalizedHistory = normalizeConversationHistory(history, 10);
  
  // 1. Evaluate context relevance before building context
  const relevance = evaluateContextRelevance({
    question,
    history: normalizedHistory,
    diagnosisContext,
    weatherContext,
    irrigationContext,
    sustainabilityContext
  });

  const agriContext = buildAgriSmartContext({
    relevance,
    diagnosisContext,
    weatherContext,
    irrigationContext
  });

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  let geminiOutput = null;
  let modelUsed = 'gemini-conversational-brain';

  if (apiKey) {
    try {
      const systemInstruction = buildSystemInstruction(language, agriContext);
      
      const geminiContents = [...normalizedHistory];
      geminiContents.push({
        role: 'user',
        parts: [{ text: String(question).trim() }]
      });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await axios.post(
        url,
        {
          contents: geminiContents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.25,
            maxOutputTokens: 2048
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: GEMINI_API_TIMEOUT_MS
        }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        try {
          geminiOutput = JSON.parse(rawText);
          modelUsed = `gemini-live:${modelName}`;
        } catch (jsonErr) {
          const jsonMatch = rawText.match(/\{.*\}/s);
          if (jsonMatch) {
            geminiOutput = JSON.parse(jsonMatch[0]);
            modelUsed = `gemini-live:${modelName}`;
          } else {
            geminiOutput = {
              domain: 'AGRICULTURE',
              contextual: false,
              topic: 'General',
              intent: 'GENERAL_AGRICULTURE',
              response: rawText.trim(),
              needs_clarification: false
            };
            modelUsed = `gemini-live:${modelName}`;
          }
        }
      }
    } catch (err) {
      console.warn('Gemini API call skipped or rate limited, using grounded contextual fallback:', err.response?.data?.error?.message || err.message);
    }
  }

  // If Gemini did not return, execute contextual fallback
  if (!geminiOutput) {
    geminiOutput = generateContextualFallback({
      question,
      history: normalizedHistory,
      relevance,
      diagnosisContext,
      weatherContext,
      irrigationContext,
      language
    });
    modelUsed = 'agronomy-contextual-fallback';
  }

  // Apply deterministic safety & domain guardrails
  const guardedResult = applySafetyAndDomainGuardrails(geminiOutput, {
    relevance,
    weatherContext,
    diagnosisContext,
    irrigationContext,
    language
  });

  const isContextualEffective = guardedResult.contextual && (relevance.hasAnyGroundedContext || relevance.activeCrop.name !== null);

  const groundedContextObj = (isContextualEffective && relevance.hasAnyGroundedContext) ? {
    crop: relevance.activeCrop.name || (relevance.latestScan.relevant ? diagnosisContext?.crop : null),
    disease: relevance.disease.relevant ? (diagnosisContext?.disease || diagnosisContext?.diseaseName || null) : null,
    weather: relevance.weather.relevant ? weatherContext : null,
    irrigation: relevance.irrigation.relevant ? irrigationContext : null,
    irrigationDecision: (relevance.irrigation.relevant && irrigationContext) ? (irrigationContext.action || irrigationContext.recommendation || irrigationContext.status) : null,
    relevanceReasons: {
      latestScan: relevance.latestScan.reason,
      weather: relevance.weather.reason,
      irrigation: relevance.irrigation.reason
    }
  } : null;

  return {
    answer: guardedResult.response,
    reply: guardedResult.response,
    intent: guardedResult.intent,
    domain: guardedResult.domain,
    topic: guardedResult.topic,
    language,
    modelUsed,
    source: modelUsed,
    contextual: Boolean(isContextualEffective && groundedContextObj !== null),
    isGrounded: Boolean(isContextualEffective && groundedContextObj !== null),
    groundedContext: groundedContextObj,
    relevance,
    warnings: guardedResult.warnings,
    irrigationAdvice: guardedResult.irrigationAdvice,
    diseaseManagement: guardedResult.diseaseManagement,
    immediateActions: guardedResult.immediateActions,
    conversationState: {
      domain: guardedResult.domain,
      topic: guardedResult.topic,
      isAgricultureContext: guardedResult.domain === 'AGRICULTURE',
      contextual: Boolean(isContextualEffective && groundedContextObj !== null)
    }
  };
}

/**
 * Direct structured monograph report builder (for direct image scan detection reports)
 */
function buildStructuredAgronomicResponse({ diseaseName, confidence = 0.85, language = 'en', telemetry = null }) {
  const lang = ['hi', 'hinglish', 'en'].includes(language) ? language : 'en';
  const monograph = getDiseaseMonograph(diseaseName);
  const knowledge = getDiseaseKnowledge(diseaseName);

  const translate = (text) => {
    if (!text || lang === 'en') return text;
    if (AGRONOMIC_TRANSLATIONS[text] && AGRONOMIC_TRANSLATIONS[text][lang]) {
      return AGRONOMIC_TRANSLATIONS[text][lang];
    }
    return text;
  };

  const immediateAction = translate(knowledge.immediateActions?.[0] || knowledge.immediateSteps?.[0] || monograph.scoutingProtocol);
  const organicTreatment = translate(knowledge.organicManagement?.[0] || knowledge.organicControls?.[0] || monograph.organicFungicide);
  const chemicalTreatment = translate(knowledge.chemicalManagement?.[0] || knowledge.chemicalOptions?.[0] || 'Consult local KVK or extension officer for registered protective fungicides');
  const irrigationAdvice = translate(monograph.irrigationSchedule);
  const preventiveGuidance = translate(monograph.culturalControl);

  const sustainability = calculateSustainabilityScore({
    practices: ['drip_irrigation', 'organic_amendments', 'crop_rotation'],
    diseaseSeverity: confidence > 0.8 ? 'high' : 'medium'
  });

  const disclaimer = SAFETY_DISCLAIMERS[lang] || SAFETY_DISCLAIMERS.en;

  const responseText = `**${diseaseName} (${Math.round(confidence * 100)}% Confidence)**\n\n` +
    `• **Immediate Step:** ${immediateAction}\n` +
    `• **Organic Control:** ${organicTreatment}\n` +
    `• **Chemical Control:** ${chemicalTreatment}\n` +
    `• **Irrigation:** ${irrigationAdvice}\n` +
    `• **Prevention:** ${preventiveGuidance}\n\n` +
    `*${disclaimer}*`;

  return {
    diseaseName,
    confidence,
    language: lang,
    advisoryText: responseText,
    structuredAdvisory: {
      immediateAction,
      organicTreatment,
      chemicalTreatment,
      irrigationAdvice,
      preventiveGuidance
    },
    sustainabilityScore: sustainability.score,
    safetyDisclaimer: disclaimer
  };
}

function resolveConfidenceMeta(confidence) {
  let conf = Number(confidence) || 0;
  if (conf > 0 && conf <= 1.0) conf = conf * 100;
  const percent = Number(conf.toFixed(2));
  const level = percent >= 70 ? 'HIGH' : percent >= 45 ? 'MODERATE' : 'LOW';
  return {
    percent,
    level,
    isUncertain: percent < 45
  };
}

function resolveDiagnosticState(diseaseName, isHealthyFlag, kb = null) {
  if (!diseaseName) return 'UNKNOWN';
  if (isHealthyFlag === true || /healthy/i.test(diseaseName)) return 'HEALTHY';
  return 'DISEASE';
}

module.exports = {
  detectLanguage,
  normalizeConversationHistory,
  evaluateContextRelevance,
  buildAgriSmartContext,
  buildSystemInstruction,
  applySafetyAndDomainGuardrails,
  generateContextualFallback,
  answerFarmerQuery,
  buildStructuredAgronomicResponse,
  resolveConfidenceMeta,
  resolveDiagnosticState,
  SAFETY_DISCLAIMERS
};
