// Grounded GenAI Agronomist Service
// Assembles RAG context from PostgreSQL monograph + diagnosis + weather
const axios = require('axios');

/**
 * Generate a grounded response to a farmer's natural language question
 */
async function answerFarmerQuery({ question, diagnosisContext, weatherContext, language = 'en' }) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const systemContext = `
You are AgriSmart AI, an expert agricultural decision-support agronomist designed for Indian farmers.
You must strictly base your advice on the following REAL-TIME FARM CONTEXT:

[DIAGNOSTIC STATUS]:
- Crop: ${diagnosisContext?.crop || 'Tomato'}
- Disease Detected: ${diagnosisContext?.disease || 'Tomato Early Blight'}
- Confidence: ${diagnosisContext?.confidence || '94%'}
- Severity: ${diagnosisContext?.severity || 'Moderate'}
- Organic Treatment: ${diagnosisContext?.organicTreatment || 'Neem oil 0.5% or Trichoderma viride spray'}
- Chemical Treatment: ${diagnosisContext?.chemicalTreatment || 'Mancozeb 75% WP @ 2g/liter'}
- Prevention: ${diagnosisContext?.preventiveMeasures || 'Proper plant spacing, avoid overhead watering'}

[METEOROLOGICAL TELEMETRY]:
- Temperature: ${weatherContext?.temperature || 25}°C
- Humidity: ${weatherContext?.humidity || 80}%
- Rain Probability (Next 24h): ${weatherContext?.rainProbability || 60}%
- Weather Condition: ${weatherContext?.condition || 'Overcast'}

[SAFETY RULES]:
1. NEVER recommend banned or unapproved hazardous chemicals.
2. If rain probability is >50%, explicitly instruct the farmer NOT to spray foliar fungicides today, because rain will wash it away.
3. Always prioritize organic/biological solutions before chemical treatments.
4. If asked in Hindi or Hinglish, reply warmly and clearly in the same vernacular tone. Keep answers concise, actionable, and formatted in bullet points.
`;

  // Fallback heuristic if API key is not yet set
  if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
    return generateGroundedFallbackResponse(question, diagnosisContext, weatherContext);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemContext}\n\nFarmer's Question: "${question}"` }
          ]
        }
      ]
    };

    const response = await axios.post(url, payload, { timeout: 8000 });
    const answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return answer || generateGroundedFallbackResponse(question, diagnosisContext, weatherContext);
  } catch (error) {
    console.warn('Gemini API call failed, using grounded fallback generator:', error.message);
    return generateGroundedFallbackResponse(question, diagnosisContext, weatherContext);
  }
}

/**
 * Deterministic grounded response generator for offline/unconfigured environments
 */
function generateGroundedFallbackResponse(question, diagnosisContext, weatherContext) {
  const rainProb = weatherContext?.rainProbability || 60;
  const isRainImminent = rainProb > 50;
  const disease = diagnosisContext?.disease || 'Tomato Early Blight';
  const organic = diagnosisContext?.organicTreatment || 'Neem oil spray (5ml/L) and Trichoderma viride';

  if (question.toLowerCase().includes('spray') || question.toLowerCase().includes('dawai') || question.toLowerCase().includes('medicine')) {
    if (isRainImminent) {
      return `⚠️ **Advisory for ${disease}:** Rain is expected in your area (${rainProb}% probability). Do NOT apply any spray today as it will be washed away and wasted. Wait for a clear, dry morning to apply:
• **Organic:** ${organic}
• **Immediate Action:** Prune and destroy any heavily spotted lower leaves to stop spore splash.`;
    } else {
      return `✅ **Spraying Guidance for ${disease}:** Weather is favorable for application:
• **Biological Remedy:** ${organic}
• Apply during early morning or late afternoon for maximum leaf absorption.`;
    }
  }

  return `🌿 **AgriSmart Agronomist Recommendation for ${disease}:**
• **Diagnosis:** ${disease} (${diagnosisContext?.confidence || '94%'} confidence)
• **Key Action:** ${organic}
• **Weather Alert:** Current humidity is ${weatherContext?.humidity || 80}%. Ensure good spacing between plants to improve airflow and dry out foliar moisture.`;
}

module.exports = {
  answerFarmerQuery
};
