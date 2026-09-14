// Disease Monograph Service
// Single source of truth for disease monographs, symptoms, organic remedies, and chemical controls

const { DISEASE_MONOGRAPHS } = require('../data/diseaseMonographs');

/**
 * Normalize string for fuzzy matching (removes underscores, special characters, case-insensitive)
 */
function normalizeName(str = '') {
  return String(str)
    .toLowerCase()
    .replace(/_{1,3}/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

/**
 * Retrieve monograph for a given disease name and optional crop
 */
function getDiseaseMonograph(diseaseName, crop = null) {
  if (!diseaseName) return null;

  const normQuery = normalizeName(diseaseName);
  const normCrop = crop ? normalizeName(crop) : null;

  // 1. Direct or normalized match
  let found = DISEASE_MONOGRAPHS.find(m => {
    const normMonograph = normalizeName(m.diseaseName);
    const normId = normalizeName(m.id);
    return normMonograph === normQuery || normId === normQuery;
  });

  // 2. Fuzzy / partial match if direct match fails
  if (!found) {
    found = DISEASE_MONOGRAPHS.find(m => {
      const normMonograph = normalizeName(m.diseaseName);
      return normMonograph.includes(normQuery) || normQuery.includes(normMonograph);
    });
  }

  // 3. Match by crop if disease contains crop name (e.g. "Tomato Early Blight" vs "Early Blight")
  if (!found && normCrop) {
    found = DISEASE_MONOGRAPHS.find(m => {
      const monographCrop = normalizeName(m.crop);
      const normMonograph = normalizeName(m.diseaseName);
      return monographCrop === normCrop && (normMonograph.includes(normQuery) || normQuery.includes(normMonograph));
    });
  }

  // 4. Return found monograph or structured fallback for unknown / general diseases
  if (found) {
    return {
      found: true,
      ...found
    };
  }

  // Fallback for uncatalogued disease
  const isHealthy = normQuery.includes('healthy');
  return {
    found: false,
    id: 'unknown-disease',
    crop: crop || 'General Crop',
    diseaseName: diseaseName,
    scientificName: 'Unclassified / Field Observation',
    pathogenType: isHealthy ? 'None' : 'Undetermined',
    severityDefault: isHealthy ? 'None' : 'Moderate',
    symptoms: isHealthy
      ? 'Foliage appears normal without apparent necrotic or chlorotic lesions.'
      : `Unspecified foliar symptoms reported for ${diseaseName}.`,
    causes: isHealthy
      ? 'Balanced physiological state.'
      : 'Etiology undetermined; may involve fungal, bacterial, or abiotic stress vectors.',
    environmentalConditions: {
      optimalTempMin: 18.0,
      optimalTempMax: 28.0,
      optimalHumidityMin: 70.0,
      conduciveWeather: 'Standard agricultural microclimate.'
    },
    prevention: 'Maintain balanced fertilization, avoid overhead irrigation, ensure good plant spacing, and practice routine crop rotation.',
    recommendedActions: [
      'Isolate symptomatic plants for closer inspection.',
      'Consult local Krishi Vigyan Kendra (KVK) or extension officer with a physical leaf sample.',
      'Check soil moisture and nutrient levels to rule out abiotic deficiencies.'
    ],
    organicRemedy: 'Preventative broad-spectrum bio-fungicide: Neem oil spray (0.5%) or Trichoderma viride application to soil.',
    chemicalControl: 'Broad-spectrum contact fungicide (e.g. Mancozeb 75% WP @ 2g/L) only if infection is actively spreading.',
    immediateActions: 'Scout adjacent rows to establish infection perimeter. Disinfect pruning shears between plants.'
  };
}

/**
 * Get all available disease monographs with optional filtering
 */
function getAllDiseases({ crop, severity } = {}) {
  let list = [...DISEASE_MONOGRAPHS];
  if (crop) {
    const normCrop = normalizeName(crop);
    list = list.filter(m => normalizeName(m.crop) === normCrop);
  }
  if (severity) {
    list = list.filter(m => m.severityDefault.toLowerCase() === severity.toLowerCase());
  }
  return list;
}

/**
 * Get all supported crops in the knowledge base
 */
function getSupportedCrops() {
  const cropSet = new Set(DISEASE_MONOGRAPHS.map(m => m.crop));
  return Array.from(cropSet);
}

module.exports = {
  getDiseaseMonograph,
  getAllDiseases,
  getSupportedCrops,
  normalizeName
};
