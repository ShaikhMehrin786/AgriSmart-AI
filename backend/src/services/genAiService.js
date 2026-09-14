// Grounded GenAI Agronomist Service
// Primary Conversational Intelligence: Gemini 3.6 Flash / Multi-turn
// Deterministic Layer: AgriSmart Context Builder + Safety Guardrails + Telemetry Grounding
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
 * Strictly enforces requested response language as a hard contract.
 */
function detectLanguage(text = '') {
  const normalized = String(text).toLowerCase();
  
  // 1. Explicit target language request directives (Highest Priority)
  if (/\b(in\s+hindi|hindi\s+me(?:in)?|translate\s+(?:it\s+|that\s+)?to\s+hindi|explain\s+(?:that\s+|this\s+|it\s+|the\s+same\s+)?in\s+hindi|hindi\s+mein\s+samjhao|hindi\s+bhasha|hindi\s+version|tell\s+me\s+in\s+hindi)\b/i.test(normalized) || /[\u0900-\u097F]/.test(normalized)) {
    return 'hi';
  }
  
  if (/\b(in\s+hinglish|hinglish\s+me(?:in)?|translate\s+(?:it\s+|that\s+)?to\s+hinglish|explain\s+(?:that\s+|this\s+|it\s+|the\s+same\s+)?in\s+hinglish|hinglish\s+mein\s+samjhao|hinglish\s+version|tell\s+me\s+in\s+hinglish)\b/i.test(normalized)) {
    return 'hinglish';
  }

  if (/\b(in\s+english|english\s+me(?:in)?|translate\s+(?:it\s+|that\s+)?to\s+english|explain\s+(?:that\s+|this\s+|it\s+|the\s+same\s+)?in\s+english|english\s+version|answer\s+in\s+english|tell\s+me\s+in\s+english)\b/i.test(normalized)) {
    return 'en';
  }
  
  // 2. Hinglish colloquial vocabulary matching
  const hinglishMarkers = [
    'kya', 'kaise', 'kare', 'karein', 'karegi', 'karna', 'karun', 'karu', 'hai', 'hain', 'mein', 'mera', 'meri', 'mere',
    'paani', 'pani', 'fasal', 'khet', 'patte', 'patti', 'bimari', 'ilaaj', 'dawa', 'dawaii', 'spray', 'khad',
    'chahiye', 'batao', 'bataiye', 'madad', 'rog', 'kisan', 'keede', 'mausam', 'barish', 'barsat', 'kal', 'aaj', 'parso',
    'du', 'dein', 'sakte', 'sakta', 'nahi', 'mat', 'nidan', 'sinchai', 'ab', 'ise', 'isse', 'kripya', 'samjhao', 'bhi', 'kuch'
  ];
  const words = normalized.split(/[^a-zA-Z0-9]+/);
  const matchCount = words.filter(w => hinglishMarkers.includes(w)).length;
  if (matchCount >= 2 || (matchCount >= 1 && words.length <= 4)) {
    return 'hinglish';
  }
  
  return 'en';
}

/**
 * Semantic Topic and Intent Extractor for a Single Turn
 * Evaluates domain, topic, crop, and symptom cleanly without sticky pollution.
 */
function extractTurnTopic(text = '') {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return { type: 'empty' };

  // 1. Pure Non-Agriculture Queries (Must be politely redirected, NOT answered as agri or tutorials)
  const isPureTechNonAgri = /\b(what\s+is\s+(?:python|java|javascript|c\+\+|html|css|react|angular|nodejs?|c#|golang|rust|php|ruby|sql)|write\s+(?:a\s+)?(?:python|java|javascript|code|script))\b/i.test(t);
  const isGeneralNonAgri = /\b(who\s+is|capital\s+of|joke|funny|movie|song|actor|actress|crypto|bitcoin|stock\s+market|cricket|football|president|space|galaxy|planet|alien|recipe|cook\s+pizza)\b/i.test(t);
  
  const hasAgriConnection = /\b(farm|farmer|farmers|agri|agriculture|crop|crops|kheti|kisan|yield|soil|irrigation|sinchai|fasal|khet)\b/i.test(t);

  if ((isPureTechNonAgri || isGeneralNonAgri) && !hasAgriConnection) {
    return { type: 'non_agri', domain: 'NON_AGRICULTURE' };
  }

  // 2. Agritech & Technology Applied to Agriculture (Legitimate Agriculture Topic)
  if (/\b(python|ai|ml|iot|sensors?|drones?|satellites?|gis|machine\s+learning)\b/i.test(t) && hasAgriConnection) {
    return { type: 'agritech', domain: 'AGRICULTURE', topic: 'Precision Agriculture & Agritech' };
  }

  // 3. Plant Nutrition, Nitrogen, and Fertilization
  if (/\b(nitrogen|phosphorus|potassium|npk|micronutrients?|urea|dap|fertilizer|khad|plant\s+nutrition|why\s+do\s+plants\s+need\s+nitrogen)\b/i.test(t)) {
    const isNitrogen = /\bnitrogen\b/i.test(t);
    return {
      type: 'plant_nutrition',
      domain: 'AGRICULTURE',
      topic: isNitrogen ? 'Nitrogen in Plant Nutrition' : 'Plant Nutrition & Fertilization',
      nutrient: isNitrogen ? 'nitrogen' : 'npk'
    };
  }

  // 4. Soil Science & Soil Health
  if (/\b(soil\s+health|soil\s+importance|importance\s+of\s+soil|healthy\s+soil|mitti|mrrida)\b/i.test(t) || /^what\s+is\s+soil\??$/i.test(t)) {
    return { type: 'soil', domain: 'AGRICULTURE', topic: 'Soil Health & Science' };
  }

  // 5. Crop Rotation
  if (/\b(crop\s+rotation|rotation\s+of\s+crops|fasal\s+chakra)\b/i.test(t)) {
    return { type: 'crop_rotation', domain: 'AGRICULTURE', topic: 'Crop Rotation' };
  }

  // 6. Photosynthesis & Plant Biology
  if (/\b(photosynthesis|prakash\s+sanshleshan|chlorophyll)\b/i.test(t)) {
    return { type: 'photosynthesis', domain: 'AGRICULTURE', topic: 'Photosynthesis' };
  }

  // 7. Weather & Rainfall
  if (/\b(weather|forecast|rain(?:s|ing|fall)?|shower(?:s)?|barish|barsat|temperature|temp|humidity|mausam|kal\s+ka\s+mausam)\b/i.test(t)) {
    return { type: 'weather', domain: 'AGRICULTURE', topic: 'Weather & Rain Advisory' };
  }

  // 8. Irrigation & Water Management
  if (/\b(irrigat(?:e|ion|ing)|water(?:ing)?|soil\s+moisture|drip|sprinkler|sinchai|pani\s+dena)\b/i.test(t)) {
    return { type: 'irrigation', domain: 'AGRICULTURE', topic: 'Irrigation & Water Management' };
  }

  // 9. Crop & Symptom Mentions
  const cropMatch = t.match(/\b(tomato(?:es)?|potato(?:es)?|apple(?:s)?|corn|grape(?:s)?|wheat|rice|squash|pepper(?:s)?|strawberry|strawberries|peach(?:es)?|cherry|cherries|soybean(?:s)?|cotton|sugarcane|cucumber(?:s)?|onion(?:s)?|garlic|cabbage|cauliflower|brinjal|eggplant|okra|bhindi|aloo|tamatar)\b/i);
  
  const symptomMatch = t.match(/\b(yellow(?:ing)?\s*(?:leaves|spots?|foliage)?|yellow\s+leaves|brown\s+spots?|black\s+spots?|dark\s+spots?|leaf\s+curl|wilting|peele\s+patte|bhure\s+dhabbe|dhabbe|blight|mildew|rot|rust|scab|spots?\s+on\s+leaves)\b/i);

  if (cropMatch || symptomMatch) {
    let crop = null;
    if (cropMatch) {
      let c = cropMatch[1].charAt(0).toUpperCase() + cropMatch[1].slice(1).toLowerCase();
      if (c.startsWith('Tomato') || c === 'Tamatar') crop = 'Tomato';
      else if (c.startsWith('Potato') || c === 'Aloo') crop = 'Potato';
      else if (c.startsWith('Apple')) crop = 'Apple';
      else if (c.startsWith('Grape')) crop = 'Grape';
      else if (c.startsWith('Corn')) crop = 'Corn';
      else if (c.startsWith('Squash')) crop = 'Squash';
      else crop = c;
    }

    let symptom = null;
    if (symptomMatch) {
      const s = symptomMatch[0].toLowerCase();
      if (s.includes('brown')) symptom = 'brown spots';
      else if (s.includes('yellow')) symptom = 'yellow leaves';
      else if (s.includes('blight')) symptom = 'blight';
      else symptom = s;
    }

    return {
      type: 'crop_symptom',
      domain: 'AGRICULTURE',
      crop,
      symptom,
      topic: crop ? `${crop} Crop Health` : 'Plant Foliar Health'
    };
  }

  // 10. Language Switch or Generic Reference Follow-up
  if (/\b(explain\s+(?:that|this|it|the\s+same|again)|translate|in\s+hindi|in\s+hinglish|in\s+english|hindi\s+me(?:in)?|hinglish\s+me(?:in)?|english\s+me(?:in)?|ise\s+hindi|ise\s+hinglish|samjhao|why\s+is\s+it\s+useful|can\s+i\s+improve\s+it\s+naturally|what\s+should\s+i\s+do\s+next|where\s+should\s+i\s+start|what\s+could\s+be\s+causing\s+this|how\s+can\s+i\s+prevent\s+it)\b/i.test(t)) {
    return { type: 'follow_up', domain: 'AGRICULTURE' };
  }

  return { type: 'general', domain: 'AGRICULTURE' };
}

/**
 * Bounded history normalization (most recent 8-12 turns, alternating user/model)
 */
function normalizeConversationHistory(history = [], maxTurns = 10) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

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

  while (normalized.length > 0 && normalized[0].role !== 'user') {
    normalized.shift();
  }

  return normalized;
}

/**
 * Context Relevance Model
 * Tracks chronological conversation state and enforces DATA EXISTENCE != DATA RELEVANCE.
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
  const queryTurn = extractTurnTopic(q);

  // Chronologically trace history to maintain active topic state
  let activeCrop = null;
  let activeSymptom = null;
  let activeTopic = 'General Agriculture';
  let activeTopicType = 'general';

  for (const item of history) {
    if (item.role === 'user') {
      const uText = String(item.content || item.text || item.parts?.[0]?.text || item.message || '').trim();
      if (!uText) continue;

      const turn = extractTurnTopic(uText);

      if (turn.type === 'crop_symptom') {
        if (turn.crop) activeCrop = turn.crop;
        if (turn.symptom) activeSymptom = turn.symptom; // Overwrite older symptom with newly mentioned symptom
        activeTopic = activeCrop ? `${activeCrop} Management` : 'Crop Health';
        activeTopicType = 'crop_symptom';
      } else if (turn.type === 'soil') {
        activeCrop = null; // Cleanly transition away from older crop
        activeSymptom = null;
        activeTopic = 'Soil Health & Science';
        activeTopicType = 'soil';
      } else if (turn.type === 'crop_rotation') {
        activeCrop = null;
        activeSymptom = null;
        activeTopic = 'Crop Rotation';
        activeTopicType = 'crop_rotation';
      } else if (turn.type === 'plant_nutrition') {
        activeCrop = null;
        activeSymptom = null;
        activeTopic = turn.topic;
        activeTopicType = 'plant_nutrition';
      } else if (turn.type === 'agritech') {
        activeCrop = null;
        activeSymptom = null;
        activeTopic = turn.topic;
        activeTopicType = 'agritech';
      } else if (turn.type === 'photosynthesis') {
        activeCrop = null;
        activeSymptom = null;
        activeTopic = 'Photosynthesis';
        activeTopicType = 'photosynthesis';
      } else if (turn.type === 'weather') {
        activeTopic = activeCrop ? `${activeCrop} Weather Management` : 'Weather Advisory';
        activeTopicType = 'weather';
      } else if (turn.type === 'non_agri') {
        activeCrop = null;
        activeSymptom = null;
        activeTopic = 'Non-Agriculture';
        activeTopicType = 'non_agri';
      }
    }
  }

  // Evaluate CURRENT query turn
  const hasAgriConnection = /\b(farm|farmer|farmers|agri|agriculture|crop|crops|kheti|kisan|yield|soil|irrigation|sinchai|fasal|khet)\b/i.test(q);
  if (activeTopicType === 'non_agri' && !hasAgriConnection && (queryTurn.type === 'general' || queryTurn.type === 'follow_up')) {
    queryTurn.type = 'non_agri';
    queryTurn.domain = 'NON_AGRICULTURE';
  }

  if (queryTurn.type === 'crop_symptom') {
    if (queryTurn.crop) activeCrop = queryTurn.crop;
    if (queryTurn.symptom) activeSymptom = queryTurn.symptom;
    activeTopic = activeCrop ? `${activeCrop} Management` : 'Crop Health';
    activeTopicType = 'crop_symptom';
  } else if (queryTurn.type === 'soil') {
    activeCrop = null;
    activeSymptom = null;
    activeTopic = 'Soil Health & Science';
    activeTopicType = 'soil';
  } else if (queryTurn.type === 'crop_rotation') {
    activeCrop = null;
    activeSymptom = null;
    activeTopic = 'Crop Rotation';
    activeTopicType = 'crop_rotation';
  } else if (queryTurn.type === 'plant_nutrition') {
    activeCrop = null;
    activeSymptom = null;
    activeTopic = queryTurn.topic;
    activeTopicType = 'plant_nutrition';
  } else if (queryTurn.type === 'agritech') {
    activeCrop = null;
    activeSymptom = null;
    activeTopic = queryTurn.topic;
    activeTopicType = 'agritech';
  } else if (queryTurn.type === 'photosynthesis') {
    activeCrop = null;
    activeSymptom = null;
    activeTopic = 'Photosynthesis';
    activeTopicType = 'photosynthesis';
  } else if (queryTurn.type === 'weather') {
    activeTopic = activeCrop ? `${activeCrop} Weather Management` : 'Weather Advisory';
    activeTopicType = 'weather';
  } else if (queryTurn.type === 'non_agri') {
    activeCrop = null;
    activeSymptom = null;
    activeTopic = 'Non-Agriculture';
    activeTopicType = 'non_agri';
  }

  // Scan reference evaluation (DATA EXISTENCE != DATA RELEVANCE)
  const isExplicitScan = /\b(scan|scans|scanned|detection|detected|diagnos(?:is|ed|tic)|report|result|image\s+i\s+uploaded|photo\s+i\s+uploaded|uploaded\s+(?:image|photo|picture|scan)|last\s+result|recent\s+result|nidan|meri\s+report|mera\s+scan|last\s+scan|recent\s+scan|latest\s+scan|previous\s+scan)\b/i.test(q);
  const scanRelevant = Boolean(diagnosisContext && isExplicitScan && queryTurn.type !== 'non_agri');

  // Weather relevance (only relevant if explicitly asking weather/rain or active weather topic)
  const isExplicitWeather = queryTurn.type === 'weather' || /\b(weather|forecast|rain(?:s|ing|fall)?|shower(?:s)?|barish|barsat|temperature|temp|humidity|spray.*weather|mausam|kal\s+ka\s+mausam)\b/i.test(q);
  const weatherRelevant = Boolean(weatherContext && isExplicitWeather && queryTurn.type !== 'non_agri');

  // Irrigation relevance
  const isExplicitIrrigation = queryTurn.type === 'irrigation' || /\b(irrigat(?:e|ion|ing)|water(?:ing)?|soil\s+moisture|drip|sprinkler|pani\s+(?:du|dein|lagaye|dena|chahiye)|sinchai|how\s+much\s+water|when\s+to\s+water)\b/i.test(q);
  const irrigationRelevant = Boolean(irrigationContext && isExplicitIrrigation && queryTurn.type !== 'non_agri');

  const isLanguageSwitch = /\b(explain\s+(?:that|this|it|the\s+same|again)|translate|in\s+hindi|in\s+hinglish|in\s+english|hindi\s+me(?:in)?|hinglish\s+me(?:in)?|english\s+me(?:in)?|ise\s+hindi|ise\s+hinglish|samjhao)\b/i.test(q);

  return {
    queryTurn,
    activeCrop: {
      name: activeCrop || (scanRelevant ? diagnosisContext?.crop : null),
      source: activeCrop ? 'active_conversation' : (scanRelevant ? 'latest_scan' : null)
    },
    activeSymptom,
    activeTopic,
    activeTopicType,
    isLanguageSwitch,
    latestScan: {
      relevant: scanRelevant,
      reason: scanRelevant ? 'explicit_reference' : 'not_relevant',
      data: scanRelevant ? diagnosisContext : null
    },
    disease: {
      relevant: scanRelevant || (activeTopicType === 'crop_symptom' && Boolean(activeSymptom)),
      diseaseName: scanRelevant ? (diagnosisContext?.disease || diagnosisContext?.diseaseName) : null
    },
    weather: {
      relevant: weatherRelevant,
      reason: weatherRelevant ? 'explicit_reference' : 'not_relevant',
      data: weatherRelevant ? weatherContext : null
    },
    irrigation: {
      relevant: irrigationRelevant,
      reason: irrigationRelevant ? 'explicit_reference' : 'not_relevant',
      data: irrigationRelevant ? irrigationContext : null
    },
    sustainability: {
      relevant: Boolean(sustainabilityContext && /\b(sustainability|eco|carbon|water\s+saving|green\s+score)\b/i.test(q)),
      data: sustainabilityContext
    },
    hasAnyGroundedContext: scanRelevant || weatherRelevant || irrigationRelevant
  };
}

/**
 * Build AgriSmart background context for Gemini
 */
function buildAgriSmartContext({ relevance, diagnosisContext, weatherContext, irrigationContext }) {
  const parts = [];

  if ((relevance?.activeTopicType === 'crop_symptom' || relevance?.activeTopicType === 'weather') && relevance?.activeCrop?.name) {
    parts.push(`[ACTIVE CONVERSATIONAL TOPIC]:
- Target Crop: ${relevance.activeCrop.name}
${relevance.activeSymptom ? `- Current Active Symptom / Problem: ${relevance.activeSymptom}\n` : ''}- Note: Answer in the context of ${relevance.activeCrop.name}${relevance.activeSymptom ? ` (${relevance.activeSymptom})` : ''}. If user asks a follow-up or language-switch ("What if it rains tomorrow?", "Please explain that in Hindi", "What should I do next?"), resolve it directly to this active crop context.`);
  } else if (relevance?.activeTopicType === 'soil') {
    parts.push(`[ACTIVE CONVERSATIONAL TOPIC]:
- Subject: Soil Health & Agronomic Soil Management
- Note: If user asks "Can I improve it naturally?", "it" refers to soil health.`);
  } else if (relevance?.activeTopicType === 'crop_rotation') {
    parts.push(`[ACTIVE CONVERSATIONAL TOPIC]:
- Subject: Crop Rotation in Sustainable Agriculture
- Note: If user asks "Why is it useful?", "it" refers to crop rotation.`);
  } else if (relevance?.activeTopicType === 'plant_nutrition') {
    parts.push(`[ACTIVE CONVERSATIONAL TOPIC]:
- Subject: Plant Nutrition & Mineral Dynamics`);
  } else if (relevance?.activeTopicType === 'agritech') {
    parts.push(`[ACTIVE CONVERSATIONAL TOPIC]:
- Subject: Precision Agriculture & Technology (Python, AI/ML, IoT, Remote Sensing in Farming)`);
  }

  if (relevance?.latestScan?.relevant && diagnosisContext && (diagnosisContext.diseaseName || diagnosisContext.disease)) {
    const diseaseName = diagnosisContext.diseaseName || diagnosisContext.disease;
    const crop = diagnosisContext.crop || 'Plant';
    const conf = Math.round((diagnosisContext.confidence || 0.85) * 100);
    const kb = getDiseaseKnowledge(diseaseName);

    parts.push(`[LATEST SCAN CONTEXT (Explicitly Requested)]:
- Crop: ${crop}
- Diagnosed Condition: ${diseaseName} (${conf}% confidence)
- Pathogen Type: ${kb.pathogenType || 'N/A'}
- Primary Cultural Actions: ${(kb.immediateActions || kb.immediateSteps || []).slice(0, 2).join('; ') || 'Inspect foliage, prune affected areas'}
- Organic Options: ${(kb.organicManagement || kb.organicControls || []).slice(0, 2).join('; ') || 'Neem oil foliar spray'}`);
  }

  if (relevance?.weather?.relevant && weatherContext) {
    const temp = weatherContext.temperature ?? 'N/A';
    const humidity = weatherContext.humidity ?? 'N/A';
    const rainProb = weatherContext.rainProbability ?? weatherContext.pop ?? 0;
    const wind = weatherContext.windSpeed ?? 'N/A';

    parts.push(`[LIVE WEATHER TELEMETRY — TRUSTED SYSTEM SOURCE OF TRUTH (DO NOT MODIFY)]:
- Temperature: ${temp}°C
- Relative Humidity: ${humidity}%
- Rain Probability: ${rainProb}%
- Wind Speed: ${wind} km/h

TRUSTED TELEMETRY MANDATE:
These values come directly from the application's trusted weather sensor service.
If you cite temperature or rain probability in your response, you MUST use ${temp}°C and ${rainProb}%.
Never estimate, recalculate, substitute, or invent another value (e.g. do NOT say 22% if rain probability is ${rainProb}%, and do NOT say 89% if rain probability is 22%).
Reproduce these exact figures or provide qualitative guidance.`);
  }

  if (relevance?.irrigation?.relevant && irrigationContext) {
    parts.push(`[SMART IRRIGATION CONTEXT (Relevant to Query)]:
- Action: ${irrigationContext.action || irrigationContext.recommendation || 'Regular irrigation'}
- Reason: ${irrigationContext.reason || 'Optimal soil moisture schedule'}`);
  }

  if (parts.length === 0) {
    return `[CONTEXT NOTE]: No specific scan or telemetry data was requested for this turn. Answer as a helpful general agronomist.`;
  }

  return parts.join('\n\n');
}

/**
 * Build System Instructions for Gemini as Primary Conversational Brain
 */
function buildSystemInstruction(language = 'en', agriContext = '') {
  const langName = language === 'hi' 
    ? 'HINDI (Devanagari script: हिन्दी). The entire response MUST be written in natural, fluent Hindi in Devanagari script.'
    : language === 'hinglish'
    ? 'HINGLISH (everyday colloquial Hindi written using the Latin/Roman English alphabet, e.g. "Agar kal barish hoti hai toh tomato par spray mat karein..."). The entire substantive response MUST be written in Hinglish.'
    : 'ENGLISH. The entire substantive response MUST be written in clear English.';

  let instruction = `You are AgriSmart AI, an expert conversational AI agronomist specialized exclusively in agriculture, crop health, soil science, plant pathology, precision irrigation, weather intelligence, and smart farming technology.

==================================================
CRITICAL LANGUAGE REQUIREMENT (HARD OUTPUT CONTRACT):
==================================================
- Requested Language: ${langName}
- You MUST generate the entire substantive response in this requested language.
- Do NOT respond in English when Hindi or Hinglish is requested.
- Do NOT translate only the heading while leaving the body in English.
- Generate natural, high-quality, idiomatic agricultural explanations in the requested language.

==================================================
CONVERSATIONAL PRINCIPLES & FOLLOW-UP RESOLUTION:
==================================================
1. QUESTION-FIRST DIRECT ANSWERING:
   - Always understand what the user is ACTUALLY asking and answer that specific question first.
   - For plant nutrition/nitrogen (e.g., "Why do plants need nitrogen?"), provide a direct educational explanation of nitrogen's role (chlorophyll synthesis, amino acids, protein formation, leafy vegetative growth, deficiency chlorosis).
   - For conceptual/scientific questions (e.g., "What is soil health?", "What is crop rotation?", "Explain photosynthesis"), explain that specific concept thoroughly with practical agronomic depth.
   - Do NOT deflect conceptual questions into unrelated generic plant care checklists.

2. CONVERSATION UNDERSTANDING, SEMANTIC CONTINUITY & LANGUAGE SWITCHES:
   - Understand the current user message in the context of recent conversation history.
   - LANGUAGE-SWITCH REQUESTS (CRITICAL):
     * When the user asks "Please explain that in Hindi.", "Now explain it in Hinglish.", "Explain that in English.", or "अब इसे हिंदी में समझाओ।", this means: "Explain the previous answer/topic in the requested language."
     * Preserve the exact substantive context of the immediately preceding turn (e.g. rain precautions for tomato plants) and explain it natively in the requested language. Do NOT switch to an unrelated topic like Photosynthesis.
   - REFERENCE RESOLUTION & PRONOUNS:
     * When user asks "Can I improve it naturally?", resolve "it" to the active topic (e.g. soil health).
     * When user asks "Why is it useful?", resolve "it" to the active topic (e.g. crop rotation).
     * When user asks "What could be causing this?" or "What should I do next?", resolve "this" to the active crop/symptom (e.g. tomato yellowing or tomato brown spots).
     * When user introduces a new symptom (e.g., "My tomato leaves have brown spots."), update the discussion to brown spots (Septoria / Early blight spots, copper/neem treatment, leaf pruning) rather than reusing the old yellow-leaf explanation.
   - AGRITECH INQUIRIES:
     * When user asks "How can Python help farmers?", answer directly how programming, Python, AI/ML, and sensors power precision agriculture (NDVI, yield forecasting, automated irrigation, disease detection).

3. DOMAIN BOUNDARIES:
   - AgriSmart is dedicated exclusively to agriculture, farming, crops, plant health, agronomy, soil, fertilizers, irrigation, weather for agriculture, and modern agricultural technology.
   - If the user asks a pure non-agriculture question (e.g., "What is Python?", "What is Java?", general programming without farming, movies, sports, generic jokes), set "domain": "NON_AGRICULTURE", "contextual": false, and politely redirect them toward agriculture.
   - Agriculture-connected technology questions (e.g., "How can Python help farmers?", "IoT sensors in farm irrigation") ARE ALLOWED as "domain": "AGRICULTURE".

4. TRUSTED TELEMETRY GROUNDING (DATA INTEGRITY CONTRACT):
   - When LIVE WEATHER TELEMETRY is provided in the context below, it is the application's SINGLE SOURCE OF TRUTH.
   - If you cite any numerical values (temperature, rain probability, humidity, wind speed), you MUST reproduce the EXACT provided values (e.g. if rain probability is 22%, write 22%; if 89%, write 89%).
   - NEVER estimate, recalculate, substitute, fabricate, or hallucinate different numerical values.
   - If you do not need to mention specific numbers, provide sound qualitative agronomic guidance.

5. CONTEXT RELEVANCE & HONEST GROUNDING (DATA EXISTENCE != DATA RELEVANCE):
   - Use ONLY the context explicitly provided in AVAILABLE AGRISMART SYSTEM CONTEXT.
   - Never assume stored database scans or weather data apply unless explicitly attached for this turn.
   - For generic agriculture questions, broad plant care, conceptual agronomy, or non-agri queries, set "contextual": false.

6. SAFETY & REGULATORY:
   - Always encourage IPM (Integrated Pest Management) and cultural/organic controls first.
   - If rain probability is high (>=50%), advise against foliar chemical sprays.
   - For healthy plants, focus on preventive nutrition and irrigation; do NOT prescribe curative fungicides.

7. STRUCTURED JSON OUTPUT SCHEMA:
You MUST respond with a single valid JSON object strictly matching this schema:
{
  "domain": "AGRICULTURE" | "NON_AGRICULTURE",
  "contextual": boolean,
  "topic": string,
  "intent": "GREETING" | "GENERAL_PLANT_CARE" | "DIAGNOSIS" | "TREATMENT" | "PREVENTION" | "IRRIGATION" | "WEATHER" | "AGRITECH" | "GENERAL_AGRICULTURE" | "NON_AGRICULTURE",
  "response": "Your natural, helpful, conversational response in the requested language...",
  "needs_clarification": boolean
}`;

  if (agriContext) {
    instruction += `\n\nAVAILABLE AGRISMART SYSTEM CONTEXT (Single Source of Truth):\n${agriContext}`;
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
  if (relevance?.queryTurn?.type === 'non_agri' || sanitized.domain === 'NON_AGRICULTURE' || sanitized.intent === 'NON_AGRICULTURE') {
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

  // Rule 6: Telemetry Data Grounding & Value Integrity Protection (Single Source of Truth)
  if (weatherContext && (relevance?.weather?.relevant || relevance?.hasAnyGroundedContext)) {
    const trustedRain = weatherContext.rainProbability ?? weatherContext.pop;
    const trustedTemp = weatherContext.temperature;

    if (trustedRain !== undefined && trustedRain !== null) {
      sanitized.response = sanitized.response.replace(
        /(\b\d{1,3}\s*%\s*(?:rain|precipitation|chance\s+of\s+rain|probability\s+of\s+rain|barish|barsat)\b)/gi,
        (match) => {
          const num = parseInt(match, 10);
          if (!isNaN(num) && num !== trustedRain) {
            return match.replace(/\d{1,3}\s*%/, `${trustedRain}%`);
          }
          return match;
        }
      );

      sanitized.response = sanitized.response.replace(
        /((?:rain|precipitation|barish|barsat|chance\s+of\s+rain|probability\s+of\s+rain)(?:[^\d\n\r]{1,25})?)(\b\d{1,3}\s*%)/gi,
        (match, prefix, perc) => {
          const num = parseInt(perc, 10);
          if (!isNaN(num) && num !== trustedRain) {
            return `${prefix}${trustedRain}%`;
          }
          return match;
        }
      );

      sanitized.response = sanitized.response.replace(
        /(\b\d{1,2}\s*°\s*C\s*,\s*)(\d{1,3}\s*%)/gi,
        (match, tempPart, percPart) => {
          const num = parseInt(percPart, 10);
          if (!isNaN(num) && num !== trustedRain) {
            return `${tempPart}${trustedRain}%`;
          }
          return match;
        }
      );
    }

    if (trustedTemp !== undefined && trustedTemp !== null) {
      sanitized.response = sanitized.response.replace(
        /(\b\d{1,2}\s*°\s*C\b)/gi,
        (match) => {
          const num = parseInt(match, 10);
          if (!isNaN(num) && Math.abs(num - trustedTemp) > 2) {
            return `${trustedTemp}°C`;
          }
          return match;
        }
      );
    }
  }

  return sanitized;
}

/**
 * Resilient Contextual Fallback for Gemini API Quota Limits / Offline State
 * Employs Question-First Response Generation & Semantic Continuity
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
      ? "नमस्ते! 👋 मैं आपका एग्रीस्मार्ट एआई कृषि सलाहकार हूँ। आज मैं आपकी फसलों, मृदा स्वास्थ्य, पोषण, सिंचाई या कृषि तकनीक में कैसे सहायता कर सकता हूँ? 🌱"
      : lang === 'hinglish'
      ? "Namaste! 👋 Main aapka AgriSmart AI Agronomist hoon. Aaj main aapki fasal, mitti ki dekhbhal, nutrition, sinchai ya kheti ke sawalon me kaise madad kar sakta hoon? 🌱"
      : "Hello! 👋 I'm your AgriSmart AI Agronomist. How can I assist you with your crops, soil management, plant nutrition, irrigation, or farming questions today? 🌱";

    return {
      domain: 'AGRICULTURE',
      contextual: false,
      topic: 'Greeting',
      intent: 'GREETING',
      response: greeting,
      needs_clarification: false
    };
  }

  // 2. Pure Non-Agriculture Check (e.g. "What is Python?", "What is Java?")
  if (rel.queryTurn?.type === 'non_agri' || rel.activeTopicType === 'non_agri') {
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

  // 3. Agritech & Technology in Agriculture (e.g. "How can Python help farmers?")
  if (rel.activeTopicType === 'agritech' || rel.queryTurn?.type === 'agritech') {
    const agritechResp = lang === 'hi'
      ? "कृषि में आधुनिक तकनीक व प्रोग्रामिंग (जैसे Python, AI/ML और IoT) किसानों की कई महत्वपूर्ण क्षेत्रों में सहायता करती है:\n\n1. **उपग्रह व ड्रोन आधारित NDVI मैपिंग:** फसल के स्वास्थ्य और तनावग्रस्त क्षेत्रों की पहचान के लिए सैटेलाइट डेटा का विश्लेषण।\n2. **सटीक सिंचाई पूर्वानुमान:** मौसम और मिट्टी की नमी के आधार पर पानी की सही मात्रा का निर्धारण।\n3. **रोग व कीट की स्वचालित पहचान:** मोबाइल कैमरे से पत्तियों की तस्वीर लेकर रोग की तुरंत पहचान।\n\n```python\n# उपग्रह डेटा से फसल स्वास्थ्य (NDVI) विश्लेषण\nimport numpy as np\ndef calculate_ndvi(nir_band, red_band):\n    return (nir_band - red_band) / (nir_band + red_band + 1e-6)\n```\n\nइससे किसानों की लागत कम होती है और पैदावार में वृद्धि होती है। 🌱"
      : lang === 'hinglish'
      ? "Agriculture me modern technology (Python, AI/ML, IoT sensors) farmers ki multiple ways me help karti hai:\n\n1. **Satellite & Drone NDVI Mapping:** Crop health aur stress areas ko satellite data se analyze karna.\n2. **Smart Irrigation Forecast:** Weather aur soil moisture ke basis par exact watering schedule banana.\n3. **Automated Disease Detection:** Mobile photos se leaf diseases classify karna.\n\n```python\n# NDVI Crop Health Calculation\nimport numpy as np\ndef calculate_ndvi(nir_band, red_band):\n    return (nir_band - red_band) / (nir_band + red_band + 1e-6)\n```\n\nYe tools resource wastage kam karte hain aur yield badhate hain. 🌱"
      : "In precision agriculture, modern technology (including Python, AI/ML, IoT sensors, and drone imaging) helps farmers make data-driven agronomic decisions:\n\n1. **Satellite & Drone NDVI Vegetation Mapping:** Computing the Normalized Difference Vegetation Index from spectral bands to spot nitrogen deficiency, drought stress, and canopy vigor variations across hectares.\n2. **Predictive Irrigation & Evapotranspiration Models:** Forecasting daily root-zone soil water depletion to automate drip valves and prevent over-irrigation.\n3. **Automated Disease & Pest Detection:** Running edge convolutional neural networks on smartphones to identify foliar lesions directly in the field.\n\n```python\n# NDVI Vegetation Index Calculation for Crop Vigor\nimport numpy as np\ndef calculate_ndvi(nir_band, red_band):\n    return (nir_band - red_band) / (nir_band + red_band + 1e-6)\n```\n\nThese automated workflows enable variable-rate spraying, yield forecasting, and optimal resource management. 🌱";

    return {
      domain: 'AGRICULTURE',
      contextual: false,
      topic: 'Precision Agriculture',
      intent: 'AGRITECH',
      response: agritechResp,
      needs_clarification: false
    };
  }

  // 4. Plant Nutrition & Nitrogen (e.g. "Why do plants need nitrogen?")
  if (rel.activeTopicType === 'plant_nutrition' || rel.queryTurn?.type === 'plant_nutrition') {
    const isNitrogen = rel.activeTopic.toLowerCase().includes('nitrogen') || /\bnitrogen\b/i.test(q);
    const nutritionResp = isNitrogen
      ? (lang === 'hi'
          ? "🌿 **पौधों के लिए नाइट्रोजन (Nitrogen) क्यों आवश्यक है?**\n\nनाइट्रोजन पौधों की वृद्धि और विकास के लिए सबसे महत्वपूर्ण प्राथमिक पोषक तत्व है:\n\n1. **क्लोरोफिल निर्माण:** नाइट्रोजन क्लोरोफिल अणु का मुख्य घटक है, जो प्रकाश संश्लेषण द्वारा सूर्य के प्रकाश को भोजन (ग्लूकोज) में बदलने के लिए आवश्यक है।\n2. **प्रोटीन व अमीनो एसिड निर्माण:** यह अमीनो एसिड की बुनियादी निर्माण इकाई है, जिससे पौधों के संरचनात्मक प्रोटीन और एंजाइम बनते हैं।\n3. **वानस्पतिक वृद्धि:** यह तनों, शाखाओं और हरी पत्तियों के तेजी से विकास को प्रेरित करता है।\n\n**कमी के लक्षण (Deficiency):** पुरानी निचली पत्तियां पीली पड़ने लगती हैं (क्लोरोसिस) और पौधों का विकास रुक जाता है।\n\n*जैविक स्रोत: अच्छी तरह सड़ा हुआ गोबर का खाद, वर्मीकम्पोस्ट, नीम की खली और ढैंचा/सनई की हरी खाद। 🌱*"
          : lang === 'hinglish'
          ? "🌿 **Plants ko Nitrogen (N) kyu chahiye hota hai?**\n\nNitrogen plant growth ka sabse primary nutrient hai:\n\n1. **Chlorophyll Synthesis:** Nitrogen chlorophyll ka main component hai jo photosynthesis ke liye zaroori hai.\n2. **Proteins & Enzymes:** Ye amino acids aur structural proteins banata hai jisse nayi cells banti hain.\n3. **Vegetative Canopy Growth:** Green leaves aur branches ki fast growth ko drive karta hai.\n\n**Deficiency Signs:** Lower leaves peeli hone lagti hain aur plant ki height ruk jati hai.\n\n*Organic Sources: Vermicompost, Gobar khad, Neem cake aur Legume green manure. 🌱*"
          : "🌿 **Why Plants Need Nitrogen (N) in Agriculture:**\n\nNitrogen is the most critical primary macronutrient for plant growth and metabolic survival:\n\n1. **Chlorophyll Synthesis & Photosynthesis:** Nitrogen is an essential atomic constituent of the chlorophyll molecule. Without adequate nitrogen, plants cannot efficiently capture solar photons to synthesize carbohydrates.\n2. **Amino Acids, Proteins & Enzymes:** Nitrogen forms the foundational amino backbone of all plant proteins, structural membranes, and functional metabolic enzymes.\n3. **Vegetative Canopy & Biomass Development:** It directly drives rapid cell division, shoot elongation, and lush foliar expansion during vegetative growth stages.\n4. **Nucleic Acids (DNA/RNA):** Nitrogen is required for genetic replication and cellular energy transfer (ATP).\n\n**Deficiency Symptoms (Chlorosis):** General uniform yellowing of older, lower leaves as mobile nitrogen is translocated to newer canopy shoots, accompanied by stunted vegetative growth. 🌱")
      : (lang === 'hi'
          ? "🧪 **फसलों के लिए संतुलित पोषण (N-P-K) के सिद्धांत:**\n\n1. **नाइट्रोजन (N):** वानस्पतिक वृद्धि व हरी पत्तियों के विकास के लिए।\n2. **फॉस्फोरस (P):** जड़ विकास और फूल/फल बनने के लिए।\n3. **पोटाश (K):** रोग प्रतिरोधक क्षमता, सूखा सहनशीलता और गुणवत्ता के लिए।\n\n*सटीक मात्रा के लिए हमेशा मिट्टी परीक्षण (Soil Test) कराएं। 🌱*"
          : "🧪 **Principles of Balanced Plant Nutrition (N-P-K):**\n\n1. **Nitrogen (N):** Drives vegetative canopy and foliage.\n2. **Phosphorus (P):** Develops deep root architecture and early flowering.\n3. **Potassium (K):** Regulates stomatal conductance, water stress resistance, and fruit sizing. 🌱");

    return {
      domain: 'AGRICULTURE',
      contextual: false,
      topic: 'Plant Nutrition',
      intent: 'GENERAL_AGRICULTURE',
      response: nutritionResp,
      needs_clarification: false
    };
  }

  // 5. Crop Rotation (e.g. "What is crop rotation?", "Why is it useful?")
  if (rel.activeTopicType === 'crop_rotation' || rel.queryTurn?.type === 'crop_rotation') {
    const rotResp = lang === 'hi'
      ? "🔄 **फसल चक्र (Crop Rotation) क्या है और यह क्यों उपयोगी है?**\n\nफसल चक्र का अर्थ है एक ही खेत में अलग-अलग मौसमों में बदल-बदल कर विभिन्न फसलों को उगाना।\n\n**मुख्य लाभ व उपयोगिता:**\n1. **रोग व कीट चक्र तोड़ना:** एक ही फसल को बार-बार लगाने से उस फसल के विशिष्ट कीट व फफूंद मिट्टी में पनप जाते हैं। फसल बदलने से उनका चक्र टूट जाता है।\n2. **मिट्टी में प्राकृतिक नाइट्रोजन स्थिरीकरण:** दलहनी फसलें (जैसे मूंग, चना, अरहर) राइजोबियम जीवाणुओं की सहायता से हवा से नाइट्रोजन खींचकर मिट्टी में स्थिर करती हैं।\n3. **मृदा स्वास्थ्य व संरचना सुधार:** गहरी जड़ों वाली और उथली जड़ों वाली फसलों को बारी-बारी से लगाने से मिट्टी में वायु संचार सुधरता है।\n\n**चक्र उदाहरण:** `दलहनी फसल (चना/मूंग) ➔ भारी पोषक लेने वाला अनाज (गेहूं/मक्का) ➔ पत्तेदार सब्जी/कंद (आलू/प्याज)` 🌱"
      : lang === 'hinglish'
      ? "🔄 **Crop Rotation kyu useful aur zaroori hai?**\n\nCrop rotation ka matlab hai ek hi khet me season-by-season alag-alag type ki crops ko sequence me grow karna.\n\n**Main Benefits:**\n1. **Pest aur Disease Cycle Break:** Lagatar same crop lagane se soil-borne bimariya badhti hain. Crop badalne se pathogens starve ho jate hain.\n2. **Natural Soil Nitrogen:** Legume crops (moong, chana) soil me natural atmospheric nitrogen fix karti hain.\n3. **Soil Structure:** Deep root aur shallow root crops alternate karne se soil aeration behtar hota hai.\n\n**Sequence Example:** `Legume (Chana/Moong) ➔ Cereal (Wheat/Corn) ➔ Root/Vegetable (Potato/Onion)` 🌱"
      : "🔄 **What is Crop Rotation and Why is it Useful?**\n\nCrop rotation is the systematic practice of cultivating different crop species in recurring seasonal succession on the same parcel of agricultural land.\n\n**Key Agronomic Benefits & Utility:**\n1. **Disrupts Host-Specific Pest & Pathogen Cycles:** Monocultures allow specialized soil-borne fungi, nematodes, and insect pests to accumulate. Introducing a non-host plant family starves these pest populations.\n2. **Biological Nitrogen Fixation:** Incorporating legumes (such as chickpeas, lentils, or clover) enriches the soil with atmospheric nitrogen via symbiotic Rhizobium root nodules, cutting fertilizer demands for heavy feeders (corn, wheat).\n3. **Improves Soil Structure & Nutrient Use:** Alternating deep taproot crops with shallow fibrous-root crops accesses nutrients from diverse soil depths and improves soil porosity.\n\n**Recommended Sequence:** `Legume (N-fixer) ➔ Heavy Feeder Cereal (Corn/Wheat) ➔ Leafy Brassica (Cabbage) ➔ Light Feeder Root Crop (Onion/Carrot)` 🌱";

    return {
      domain: 'AGRICULTURE',
      contextual: false,
      topic: 'Crop Rotation',
      intent: 'GENERAL_AGRICULTURE',
      response: rotResp,
      needs_clarification: false
    };
  }

  // 6. Soil Health & Science (e.g. "What is soil health?", "Can I improve it naturally?")
  if (rel.activeTopicType === 'soil' || rel.queryTurn?.type === 'soil') {
    const isNaturalImprovement = /\b(improve|natural|naturally|health|organic|compost|fertility|enrich|kaise\s+sudhare)\b/i.test(q) || (rel.isLanguageSwitch && rel.activeTopic.includes('Soil'));
    const soilResp = isNaturalImprovement
      ? (lang === 'hi'
          ? "🌱 **मृदा स्वास्थ्य को प्राकृतिक रूप से कैसे सुधारें:**\n\n1. **जैविक खाद (Organic Matter):** अच्छी तरह सड़ा हुआ गोबर का खाद या वर्मीकम्पोस्ट (5-10 टन/हेक्टेयर) मिलाकर मिट्टी की जलधारण क्षमता और लाभकारी सूक्ष्मजीवों की संख्या बढ़ाएं।\n2. **हरी खाद व कवर क्रॉप्स:** ढैंचा, सनई या दलहनी फसलों को उगाकर फूल आने पर मिट्टी में दबाएं ताकि प्राकृतिक नाइट्रोजन और बायोमास जुड़े।\n3. **मल्चिंग (Mulching):** फसल अवशेषों या सूखे पत्तों की मल्चिंग करें ताकि मिट्टी की नमी सुरक्षित रहे और कटाव रुके।\n4. **न्यूनतम जुताई (Minimum Tillage):** अनावश्यक गहरी जुताई से बचें ताकि मिट्टी की संरचना और केंचुओं का आवास सुरक्षित रहे। 🌱"
          : lang === 'hinglish'
          ? "🌱 **Soil Health ko Naturally Improve karne ke Best Ways:**\n\n1. **Organic Matter:** Well-decomposed Gobar khad ya Vermicompost add karein taaki microbial activity aur water retention badhe.\n2. **Green Manuring:** Dhaincha ya legume crops ko grow karke soil me mix karein natural nitrogen ke liye.\n3. **Mulching:** Crop residue se mulching karein taaki moisture hold rahe aur soil erosion ruke.\n4. **Minimum Tillage:** Over-ploughing avoid karein taaki beneficial earthworms aur soil structure disturb na ho. 🌱"
          : "🌱 **How to Naturally Improve and Restore Soil Health:**\n\n1. **Incorporate Organic Matter:** Apply well-decomposed farmyard manure or vermicompost to dramatically increase cation exchange capacity (CEC), water infiltration, and beneficial microbial populations.\n2. **Grow Nitrogen-Fixing Cover Crops & Green Manure:** Cultivate legumes or sunn hemp and till them in before flowering to replenish active soil carbon and fixed nitrogen.\n3. **Apply Organic Mulch:** Maintain a protective layer of crop residues or straw across beds to moderate root temperatures, retain moisture, and curb erosion.\n4. **Practise Minimum / Conservation Tillage:** Minimize excessive soil inversion to preserve mycorrhizal fungal networks, earthworm burrows, and aggregate stability. 🌱")
      : (lang === 'hi'
          ? "🌍 **कृषि में मृदा स्वास्थ्य (Soil Health) का महत्व:**\n\nमिट्टी केवल पौधों को सहारा देने वाला माध्यम नहीं है, बल्कि एक जीवित पारिस्थितिकी तंत्र है जो कृषि की नींव है:\n\n1. **पोषक तत्वों का भंडार:** यह पौधों के लिए आवश्यक 17 अनिवार्य पोषक तत्वों को जड़ क्षेत्र में संचित और उपलब्ध कराती है।\n2. **जल संरक्षण व निकासी:** वर्षा और सिंचाई के पानी को सोखकर जड़ क्षेत्र में नमी बनाए रखती है।\n3. **सूक्ष्मजीव जीवन:** इसमें मौजूद अरबों लाभकारी जीवाणु और केंचुए कार्बनिक पदार्थों को पौधों के अवशोषण योग्य पोषक तत्वों में बदलते हैं। 🌱"
          : "🌍 **The Importance of Soil Health in Agriculture:**\n\nSoil health is the continued capacity of soil to function as a vital living ecosystem that sustains plants, animals, and agricultural productivity:\n\n1. **Nutrient Reservoir & Bioavailability:** Houses and cycles essential macro- and micro-nutrients via ion exchange.\n2. **Hydrological Regulation:** Regulates water retention in the root zone while preventing hypoxia.\n3. **Biological Diversity:** Supports the soil microbiome that decomposes organic residues and suppresses soil-borne pathogens. 🌱");

    return {
      domain: 'AGRICULTURE',
      contextual: false,
      topic: 'Soil Science',
      intent: 'GENERAL_AGRICULTURE',
      response: soilResp,
      needs_clarification: false
    };
  }

  // 7. Photosynthesis
  if (rel.activeTopicType === 'photosynthesis' || rel.queryTurn?.type === 'photosynthesis') {
    const photoResp = lang === 'hi'
      ? "☀️ **प्रकाश संश्लेषण (Photosynthesis) की प्रक्रिया:**\n\nप्रकाश संश्लेषण वह मूलभूत प्रक्रिया है जिसमें पौधे सूर्य के प्रकाश, कार्बन डाइऑक्साइड ($CO_2$) और पानी ($H_2O$) का उपयोग करके ग्लूकोज और ऑक्सीजन ($O_2$) बनाते हैं:\n\n$$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{प्रकाश} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6O}_2$$\n\nयह प्रक्रिया सीधे फसल की बायोमास वृद्धि और पैदावार को निर्धारित करती है। 🌱"
      : "☀️ **How Photosynthesis Works in Crop Science:**\n\nPhotosynthesis is the foundational biochemical process through which green plants convert light energy, carbon dioxide ($CO_2$), and water ($H_2O$) into glucose (chemical energy) and oxygen ($O_2$):\n\n$$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{Light} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6O}_2$$\n\nCanopy photosynthetic efficiency directly dictates crop biomass accumulation and final harvestable yield. 🌱";

    return {
      domain: 'AGRICULTURE',
      contextual: false,
      topic: 'Plant Biology',
      intent: 'GENERAL_AGRICULTURE',
      response: photoResp,
      needs_clarification: false
    };
  }

  // 8. Weather Queries & Rain Follow-ups (Standalone or with active crop)
  const isWeatherAction = rel.activeTopicType === 'weather' || rel.queryTurn?.type === 'weather' || /\b(weather|forecast|rain(?:s|ing|fall)?|shower(?:s)?|barish|barsat|temperature|temp|humidity|spray.*weather|mausam|kal\s+ka\s+mausam)\b/i.test(q) || (rel.isLanguageSwitch && rel.activeTopic.includes('Weather'));
  if (isWeatherAction) {
    const crop = rel.activeCrop?.name;
    const temp = weatherContext?.temperature ?? 26;
    const rainProb = weatherContext ? (weatherContext.rainProbability ?? weatherContext.pop ?? 22) : 22;

    if (crop) {
      const rainCropResp = lang === 'hi'
        ? `🌧️ **वर्षा व फसल प्रबंधन (${crop}):**\n\nयदि कल बारिश होने की संभावना है, तो अपने ${crop} के लिए निम्नलिखित सावधानियां रखें:\n\n1. **फोलियर स्प्रे टालें:** किसी भी कीटनाशक, फफूंदनाशक (जैसे नीम तेल) या तरल खाद का छिड़काव न करें, क्योंकि बारिश दवा को धो देगी।\n2. **पत्तियों में फफूंद का खतरा:** पत्तियों के अधिक समय तक गीले रहने से ${crop} में फफूंद (जैसे धब्बे और ब्लाइट) तेजी से फैलती है। हवा का संचार बनाए रखें।\n3. **सिंचाई रोकें:** बारिश से पहले पानी न दें और खेत की जलनिकासी नालियों को साफ़ रखें ताकि जड़ों में पानी न भरे। 🌱`
        : lang === 'hinglish'
        ? `🌧️ **Barish aur Fasal Prabandhan (${crop}):**\n\nAgar kal barish expected hai toh ${crop} ke liye ye steps follow karein:\n\n1. **Foliar Spray Postpone Karein:** Neem oil ya chemical spray na karein, barish se spray dhul jayega.\n2. **Foliage Moisture Control:** Leaves geeli rehne se ${crop} me fungal spots aur blight tezi se failte hain. Proper aeration rakhein.\n3. **Sinchai Rokein:** Sinchai delay karein aur drainage clear rakhein taaki roots me paani jam na ho. 🌱`
        : `🌧️ **Rain & Crop Management Advisory (${crop}):**\n\nIf rain is expected tomorrow, consider the following agronomic precautions for your ${crop}:\n\n1. **Postpone Foliar Sprays:** Hold off on applying any organic or chemical foliar sprays (such as neem oil or copper bio-fungicides) until dry weather returns, as rainfall will wash active ingredients off the foliage.\n2. **Manage Foliar Moisture & Disease Proliferation:** Extended leaf wetness accelerates fungal spore germination (such as foliar spots and blight on ${crop}). Ensure good canopy aeration so leaves dry quickly.\n3. **Pause Scheduled Irrigation:** Do not water ahead of expected rainfall, and ensure field drainage channels are clear to prevent waterlogging around root zones. 🌱`;

      return {
        domain: 'AGRICULTURE',
        contextual: rel.weather.relevant,
        topic: `${crop} Weather Advisory`,
        intent: 'WEATHER',
        response: rainCropResp,
        needs_clarification: false
      };
    } else {
      const generalRainResp = lang === 'hi'
        ? "🌧️ **कृषि मौसम व वर्षा मार्गदर्शन:**\n\nयदि आपके क्षेत्र में कल बारिश की संभावना है:\n\n1. **स्प्रे स्थगित करें:** किसी भी फोलियर स्प्रे या रासायनिक छिड़काव को रोकें ताकि दवा धुल न जाए।\n2. **सिंचाई रोकें:** निर्धारित सिंचाई को टालें ताकि पानी की बचत हो और जलभराव न हो।\n3. **जल निकासी जांचें:** खेत की नालियों की सफाई करें ताकि जड़ क्षेत्र में पानी जमा न हो। 🌱"
        : "🌧️ **Agricultural Weather Guidance:**\n\nIf rain is expected tomorrow on your farm, keep these core agronomic practices in mind:\n\n1. **Postpone Foliar Applications:** Hold off on spraying liquid fertilizers, fungicides, or pesticides, as precipitation will wash active ingredients off.\n2. **Delay Scheduled Irrigation:** Pause irrigation cycles to conserve water and prevent soil saturation.\n3. **Check Field Drainage:** Ensure furrows, beds, and drainage channels are clear to avoid standing water and root hypoxia. 🌱";

      return {
        domain: 'AGRICULTURE',
        contextual: rel.weather.relevant,
        topic: 'Weather Advisory',
        intent: 'WEATHER',
        response: generalRainResp,
        needs_clarification: false
      };
    }
  }

  // 8.5. Irrigation & Water Management
  if (rel.irrigation.relevant || rel.activeTopicType === 'irrigation' || rel.queryTurn?.type === 'irrigation') {
    const action = irrigationContext?.action || irrigationContext?.reason || 'Inspect soil moisture in root zone before watering.';
    const irrigationResp = lang === 'hi'
      ? `💧 **सिंचाई व जल प्रबंधन परामर्श:**\n\n${action}\n\n1. **ड्रिप सिंचाई:** पत्तियों को ऊपर से गीला करने से बचें; सीधे जड़ क्षेत्र में पानी दें।\n2. **मृदा नमी परीक्षण:** ऊपरी 2-3 इंच मिट्टी को छूकर नमी की जांच करें। 🌱`
      : lang === 'hinglish'
      ? `💧 **Sinchai aur Jal Prabandhan:**\n\n${action}\n\n1. **Drip Irrigation:** Leaves ko geela na karein; direct root zone me paani dein.\n2. **Soil Moisture Check:** Top 2-3 inch mitti check karke hi zaroorat anusar pani dein. 🌱`
      : `💧 **Irrigation & Water Management Advisory:**\n\n${action}\n\n1. **Root-Zone Delivery:** Apply irrigation directly at the soil line using drip lines to avoid canopy leaf wetness.\n2. **Soil Moisture Check:** Check the top 2–3 inches of soil before running irrigation cycles. 🌱`;

    return {
      domain: 'AGRICULTURE',
      contextual: rel.irrigation.relevant,
      topic: 'Irrigation Advisory',
      intent: 'IRRIGATION',
      response: irrigationResp,
      needs_clarification: false
    };
  }

  // 9. Explicit Latest Scan Discussion (e.g. "What was detected in my latest scan?")
  if (rel.latestScan.relevant && diagnosisContext) {
    const dCrop = diagnosisContext.crop || 'Plant';
    const dDisease = diagnosisContext.disease || diagnosisContext.diseaseName || 'Crop Disease';
    const conf = Math.round((diagnosisContext.confidence || 0.85) * 100);

    const scanResp = lang === 'hi'
      ? `📋 **नवीनतम स्कैन रिपोर्ट (${dCrop} - ${dDisease}):**\n\nहालिया स्कैन में **${dDisease}** (${conf}% सटीकता) की पुष्टि हुई है।\n\n1. **तात्कालिक कदम:** रोगग्रस्त पत्तियों को काटकर नष्ट करें।\n2. **जैविक स्प्रे:** सुबह नीम तेल (5 मिली/लीटर) का छिड़काव करें।\n3. **सिंचाई:** ड्रिप से केवल जड़ों में पानी दें।\n\n*${disclaimer}*`
      : `📋 **Latest Scan Report (${dCrop} - ${dDisease}):**\n\nBased on your recent scan diagnosing **${dDisease}** (${conf}% confidence):\n\n1. **Immediate Step:** Carefully prune heavily infected foliage.\n2. **Organic Management:** Apply cold-pressed neem oil (5ml/L) or bio-fungicide.\n3. **Moisture Control:** Keep canopy foliage dry with drip irrigation.\n\n*${disclaimer}*`;

    return {
      domain: 'AGRICULTURE',
      contextual: true,
      topic: 'Scan Diagnosis',
      intent: 'DIAGNOSIS',
      response: scanResp,
      needs_clarification: false
    };
  }

  // 10. Crop-Specific Foliar Health & Symptom Assessment (e.g. Tomato Yellow Leaves vs Brown Spots vs Prevention vs Steps)
  if (rel.activeCrop?.name) {
    const crop = rel.activeCrop.name;
    const symptom = rel.activeSymptom || 'foliar symptoms';

    // A. Initial steps / Where to begin / Next steps
    if (/\b(where\s+do\s+i\s+(begin|start)|what\s+should\s+i\s+do\s+next|first\s+steps?|what\s+next|kaha\s+se\s+shuru|where\s+should\s+i\s+start)\b/i.test(q)) {
      const beginResp = lang === 'hi'
        ? `🔍 **निरीक्षण व प्रारंभिक कदम (${crop}):**\n\n1. **कैनोपी जांच:** अपने ${crop} के पौधों की निचली पत्तियों और तनों का बारीकी से निरीक्षण करें कि धब्बों या पीलापन का स्वरूप कैसा है।\n2. **स्वच्छता:** अत्यधिक रोगग्रस्त या सूखी निचली पत्तियों को विसंक्रमित कैंची से काटकर नष्ट करें।\n3. **सिंचाई:** ड्रिप सिंचाई द्वारा केवल जड़ों में पानी दें; पत्तियों को सूखा रखें।\n\n*${disclaimer}*`
        : `🔍 **Initial Inspection & Next Steps (${crop}):**\n\n1. **Canopy Inspection:** Start by inspecting the lower leaves and undersides of your ${crop} to check the pattern of discoloration or lesions.\n2. **Sanitation:** Carefully prune and destroy heavily affected lower foliage using clean shears to reduce pathogen loads.\n3. **Foliar Management:** Deliver water directly to the root zone via drip irrigation rather than wetting foliage.\n\n*${disclaimer}*`;

      return {
        domain: 'AGRICULTURE',
        contextual: true,
        topic: 'Initial Scouting',
        intent: 'DIAGNOSIS',
        response: beginResp,
        needs_clarification: false
      };
    }

    // B. Prevention & Spread Control
    if (/\b(prevent|worse|stop.*(it|spread|disease)|future|roktham|prevention|how\s+can\s+i\s+prevent)\b/i.test(q)) {
      const preventResp = lang === 'hi'
        ? `🛡️ **रोग रोकथाम व सुरक्षा उपाय (${crop}):**\n\n1. **पौधों में दूरी व वायु संचार:** पौधों के बीच पर्याप्त दूरी रखें ताकि पत्तियों में हवा और धूप का प्रवाह बना रहे।\n2. **जैविक सुरक्षा:** सुबह के समय सुरक्षात्मक नीम तेल (5 मिली/लीटर) या ट्राइकोडर्मा का छिड़काव करें।\n3. **फसल चक्र:** अगली बुवाई में गैर-सोलेनेसी फसलों का चक्र अपनाएं।\n\n*${disclaimer}*`
        : `🛡️ **Prevention & Disease Spread Control (${crop}):**\n\n1. **Airflow & Spacing:** Maintain proper spacing between ${crop} plants to ensure rapid canopy drying and air circulation.\n2. **Protective Bio-Control:** Apply cold-pressed neem oil (5ml/L) or registered bio-fungicide during calm mornings.\n3. **Mulching:** Apply organic straw mulch around plant bases to prevent soil-borne pathogens from splashing onto leaves during watering.\n\n*${disclaimer}*`;

      return {
        domain: 'AGRICULTURE',
        contextual: true,
        topic: 'Preventive Care',
        intent: 'PREVENTION',
        response: preventResp,
        needs_clarification: false
      };
    }

    // C. Brown Spots specifically
    if (/\b(brown\s+spots?|bhure\s+dhabbe|dark\s+spots?|black\s+spots?)\b/i.test(q) || (symptom.includes('brown') && !/\byellow\b/i.test(q))) {
      const brownResp = lang === 'hi'
        ? `🍂 **पत्तियों पर भूरे धब्बों का परामर्श (${crop}):**\n\n${crop} की पत्तियों पर भूरे या गहरे रंग के धब्बे आमतौर पर फफूंद जनित संक्रमण (जैसे अर्ली ब्लाइट / सेप्टोरिया लीफ स्पॉट) का संकेत होते हैं:\n\n1. **सफाई व छंटाई:** रोगग्रस्त भूरे धब्बों वाली निचली पत्तियों को विसंक्रमित कैंची से काटकर नष्ट करें।\n2. **जैविक उपचार:** सुबह के समय कॉपर-आधारित जैविक कवकनाशी या नीम तेल (5 मिली/लीटर) का स्प्रे करें।\n3. **पत्तियों को सूखा रखें:** पत्तियों पर ऊपर से पानी न डालें; ड्रिप सिंचाई से केवल जड़ों में पानी दें।\n\n*${disclaimer}*`
        : lang === 'hinglish'
        ? `🍂 **Brown Spots Assessment (${crop}):**\n\n${crop} ki leaves par brown ya dark concentric spots fungal leaf spot (Early Blight / Septoria) ka indication hain:\n\n1. **Sanitation:** Heavily spotted brown leaves ko prune karke destroy karein.\n2. **Protective Spray:** Copper-based bio-fungicide ya Neem oil (5ml/L) ka spray karein.\n3. **Irrigation:** Roots me drip se paani dein; foliage geela na karein.\n\n*${disclaimer}*`
        : `🍂 **Brown Spot Symptom Assessment (${crop}):**\n\nBrown or dark necrotic spots on ${crop} foliage typically indicate foliar fungal infections such as Early Blight (*Alternaria*) or Septoria Leaf Spot:\n\n1. **Sanitation & Pruning:** Carefully prune and destroy infected lower foliage showing brown target-like rings to eliminate primary fungal spore reservoirs.\n2. **Fungicidal Protection:** Apply a registered copper-based bio-fungicide or cold-pressed neem oil during calm morning hours.\n3. **Foliar Moisture Management:** Switch exclusively to root-zone drip irrigation to keep canopy leaves dry and arrest secondary spore propagation.\n\n*${disclaimer}*`;

      return {
        domain: 'AGRICULTURE',
        contextual: true,
        topic: 'Brown Spot Management',
        intent: 'DIAGNOSIS',
        response: brownResp,
        needs_clarification: false
      };
    }

    // D. Yellow leaves / Initial Foliar Assessment
    const yellowResp = lang === 'hi'
      ? `🌱 **पत्तियों के पीलेपन का परामर्श (${crop}):**\n\n${crop} की पत्तियों का पीला पड़ना नाइट्रोजन/मैग्नीशियम पोषण की कमी, अत्यधिक पानी देने या शुरुआती फफूंद संक्रमण के कारण हो सकता है:\n\n1. **निरीक्षण:** देखें कि पीलापन पुरानी निचली पत्तियों पर है (पोषक कमी) या नई पत्तियों पर।\n2. **नमी नियंत्रण:** अधिक पानी देने से बचें और मिट्टी में उचित जल निकासी रखें।\n3. **पोषण:** संतुलित जैविक खाद या वर्मीकम्पोस्ट का प्रयोग करें।\n\n*${disclaimer}*`
      : lang === 'hinglish'
      ? `🌱 **Yellow Leaves Assessment (${crop}):**\n\n${crop} ke patto par peelapan nutrient deficiency (nitrogen/magnesium), over-watering ya early fungal stress ka sign ho sakta hai:\n\n1. **Inspection:** Check karein ki peelapan lower leaves par hai ya nayi leaves par.\n2. **Moisture Control:** Over-watering avoid karein aur root drainage check karein.\n3. **Nutrition:** Balanced organic compost add karein.\n\n*${disclaimer}*`
      : `🌱 **Foliar Symptom Assessment (${crop}):**\n\nYellowing foliage on ${crop} commonly indicates localized nutrient chlorosis (such as nitrogen or magnesium deficiency), over-watering, or early fungal stress:\n\n1. **Canopy Inspection:** Check whether yellowing begins uniformly on older lower leaves (nitrogen mobility) or appears as interveinal yellowing.\n2. **Moisture Control:** Ensure soil is well-drained and avoid over-irrigation which can cause root hypoxia.\n3. **Balanced Feeding:** Apply organic compost or a balanced foliar nutrient spray to restore vigor.\n\n*${disclaimer}*`;

    return {
      domain: 'AGRICULTURE',
      contextual: true,
      topic: 'Symptom Assessment',
      intent: 'DIAGNOSIS',
      response: yellowResp,
      needs_clarification: false
    };
  }

  // 11. General Plant Care & Growth (Broad agriculture query without specific topic)
  const generalPlantCareResp = lang === 'hi'
    ? `🌱 **पौधों की सामान्य देखभाल व संवर्धन मार्गदर्शन:**\n\n1. **मिट्टी व पोषण:** अच्छी जैविक खाद (वर्मीकम्पोस्ट) का प्रयोग करें।\n2. **जल प्रबंधन:** पत्तियों पर पानी का छिड़काव न करें; सुबह के समय सीधे जड़ क्षेत्र में पानी दें।\n3. **धूप व वायु संचार:** पौधों को प्रतिदिन 6-8 घंटे की धूप और पर्याप्त दूरी दें।\n4. **नियमित निरीक्षण:** पत्तियों की निचली सतह की नियमित जांच करें। 🌱`
    : `🌱 **General Plant Care & Crop Improvement:**\n\nTo help your crops grow vigorously and maintain optimal health:\n\n1. **Soil & Root Zone Health:** Maintain fertile, well-draining soil with rich organic compost.\n2. **Targeted Watering:** Water directly at the root zone via drip lines to keep canopy foliage dry.\n3. **Sunlight & Spacing:** Provide 6–8 hours of sunlight and adequate spacing for canopy aeration.\n4. **Regular Scouting:** Inspect leaf undersides weekly for early signs of stress or pests. 🌱`;

  return {
    domain: 'AGRICULTURE',
    contextual: false,
    topic: 'General Plant Care',
    intent: 'GENERAL_PLANT_CARE',
    response: generalPlantCareResp,
    needs_clarification: false
  };
}

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

  // If query is pure non-agriculture, do not call Gemini or use fallback immediately
  if (relevance.queryTurn?.type === 'non_agri') {
    geminiOutput = generateContextualFallback({
      question,
      history: normalizedHistory,
      relevance,
      diagnosisContext,
      weatherContext,
      irrigationContext,
      language
    });
    modelUsed = 'domain-guardrail-redirect';
  } else if (apiKey) {
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
  extractTurnTopic,
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
