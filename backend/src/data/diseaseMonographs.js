// Agronomic Disease Knowledge Monograph Repository
// Grounded in Indian Council of Agricultural Research (ICAR) & CIBRC agricultural guidelines

const DISEASE_MONOGRAPHS = [
  {
    id: 'tomato-early-blight',
    crop: 'Tomato',
    diseaseName: 'Tomato Early Blight',
    scientificName: 'Alternaria solani',
    pathogenType: 'Fungal',
    severityDefault: 'Moderate',
    symptoms: 'Concentric dark brown rings with target-board appearance on older lower leaves, progressive chlorotic yellow halo surrounding necrotic lesions, stem cankers near soil line.',
    causes: 'Soil-borne fungal pathogen Alternaria solani surviving on infected crop residue, splashing upward during rain or overhead irrigation.',
    environmentalConditions: {
      optimalTempMin: 22.0,
      optimalTempMax: 29.0,
      optimalHumidityMin: 75.0,
      conduciveWeather: 'Warm temperatures (24-29°C) combined with high relative humidity (>75%) and prolonged leaf wetness.'
    },
    prevention: 'Maintain 60cm plant spacing for adequate air circulation, apply organic mulch around plant base to prevent soil splash, practice 3-year crop rotation with non-solanaceous crops, avoid overhead sprinkler irrigation.',
    recommendedActions: [
      'Prune and destroy lower diseased leaves immediately.',
      'Apply mulch to prevent fungal spores from splashing onto foliage.',
      'Ensure drip irrigation rather than overhead sprinklers to keep canopy dry.'
    ],
    organicRemedy: 'Foliar spray of cold-pressed Neem oil (0.5% / 5ml per liter of water with bio-soap emulsifier) or Trichoderma viride / Pseudomonas fluorescens bio-fungicide @ 5g/liter.',
    chemicalControl: 'Mancozeb 75% WP @ 2.0g/liter water or Chlorothalonil 75% WP @ 2.0g/liter water. Do not apply when rainfall is expected within 12 hours.',
    immediateActions: 'Scout field to identify extent of spread. Remove severely infected leaves from the bottom 30cm of plants and bury them at least 1 foot deep away from field borders.'
  },
  {
    id: 'tomato-late-blight',
    crop: 'Tomato',
    diseaseName: 'Tomato Late Blight',
    scientificName: 'Phytophthora infestans',
    pathogenType: 'Oomycete',
    severityDefault: 'Critical',
    symptoms: 'Rapidly spreading water-soaked irregular pale green lesions turning dark brown to purplish-black; white downy fungal mold on leaf undersides during moist mornings; rapid canopy collapse.',
    causes: 'Oomycete pathogen Phytophthora infestans carried by wind and moisture droplets, capable of destroying entire fields within 48 to 72 hours.',
    environmentalConditions: {
      optimalTempMin: 15.0,
      optimalTempMax: 22.0,
      optimalHumidityMin: 85.0,
      conduciveWeather: 'Cool, wet, cloudy weather with persistent fog or morning dew and high humidity (>85%).'
    },
    prevention: 'Plant certified disease-free transplants, select resistant hybrid cultivars, ensure excellent field drainage, space rows at least 75cm apart to facilitate fast drying of foliage.',
    recommendedActions: [
      'Quarantine infected area immediately; do not move equipment from infected to healthy sections.',
      'Destroy heavily blighted plants to stop spore clouds.',
      'Halt all overhead watering immediately.'
    ],
    organicRemedy: 'Prophylactic Bordeaux mixture (1% copper sulfate + hydrated lime) or Copper hydroxide @ 2.5g/liter. (Note: biologicals are ineffective once late blight becomes systemic).',
    chemicalControl: 'Systemic curative spray: Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold) @ 2.5g/liter or Dimethomorph 50% WP @ 1.5g/liter.',
    immediateActions: 'Immediately eradicate severely blighted plants. If weather forecast predicts continuous overcast rain, apply protective curative fungicide across non-symptomatic plants before disease expands.'
  },
  {
    id: 'tomato-healthy',
    crop: 'Tomato',
    diseaseName: 'Tomato Healthy',
    scientificName: 'N/A',
    pathogenType: 'None',
    severityDefault: 'None',
    symptoms: 'Vibrant emerald-green leaves with crisp margins, sturdy vascular stems, active apical growth, and absence of necrotic spots, chlorosis, or curling.',
    causes: 'Optimal nutrition, balanced soil moisture, and favorable atmospheric conditions.',
    environmentalConditions: {
      optimalTempMin: 18.0,
      optimalTempMax: 30.0,
      optimalHumidityMin: 45.0,
      conduciveWeather: 'Moderate daytime temperature (22-28°C), good solar radiation, balanced humidity.'
    },
    prevention: 'Continue routine preventative scouting every 4 to 5 days, keep field edges weed-free, and monitor soil moisture sensors.',
    recommendedActions: [
      'Maintain regular drip irrigation according to crop stage.',
      'Apply vermicompost or seaweed extract to maintain root vigor.',
      'Record leaf scans periodically to detect microscopic early outbreaks.'
    ],
    organicRemedy: 'Preventative bio-stimulants: Panchagavya (3% spray) or vermiwash every 15 days to fortify natural systemic resistance.',
    chemicalControl: 'No chemical fungicides required.',
    immediateActions: 'Maintain current agricultural care schedule. No corrective intervention necessary.'
  },
  {
    id: 'potato-early-blight',
    crop: 'Potato',
    diseaseName: 'Potato Early Blight',
    scientificName: 'Alternaria solani',
    pathogenType: 'Fungal',
    severityDefault: 'Moderate',
    symptoms: 'Small scattered dark brown to black spots with characteristic concentric circular ridges on foliage, initiating on older lower leaves and causing premature defoliation.',
    causes: 'Alternaria solani conidia overwintering in infected tuber debris and weed solanaceous hosts.',
    environmentalConditions: {
      optimalTempMin: 20.0,
      optimalTempMax: 28.0,
      optimalHumidityMin: 75.0,
      conduciveWeather: 'Alternating wet and dry cycles with temperatures around 25°C and high humidity.'
    },
    prevention: 'Use certified disease-free seed tubers, practice 2 to 3-year crop rotation, maintain balanced potassium and nitrogen fertilization to prevent crop stress.',
    recommendedActions: [
      'Avoid nitrogen deficiency which accelerates plant senescence and blight susceptibility.',
      'Earthing up properly to protect developing tubers from spore wash.',
      'Scout lower canopy weekly.'
    ],
    organicRemedy: 'Bio-fungicide spray of Pseudomonas fluorescens @ 5g/liter or fermented butter-milk (Chaach) spray (5%).',
    chemicalControl: 'Mancozeb 75% WP @ 2.0g/liter or Propineb 70% WP @ 2.0g/liter water.',
    immediateActions: 'Prune infected lower foliage. Ensure ridges are well-drained and avoid field traffic while canopy is damp.'
  },
  {
    id: 'potato-late-blight',
    crop: 'Potato',
    diseaseName: 'Potato Late Blight',
    scientificName: 'Phytophthora infestans',
    pathogenType: 'Oomycete',
    severityDefault: 'Critical',
    symptoms: 'Irregular water-soaked spots on leaf tips and margins spreading rapidly into brown-black necrotic lesions; white cottony mildew under leaf surface; sunken brown rot in tubers.',
    causes: 'Infected seed tubers carrying Phytophthora mycelium into the field, propagating rapidly in cool wet seasons.',
    environmentalConditions: {
      optimalTempMin: 12.0,
      optimalTempMax: 20.0,
      optimalHumidityMin: 85.0,
      conduciveWeather: 'Night temperature 10-15°C with dew, day temperature 18-22°C, and relative humidity above 85% for over 48 hours.'
    },
    prevention: 'Plant certified disease-free certified tubers; deep earthing up (15-20cm ridge height) to shield tubers; eradicate volunteer potato plants.',
    recommendedActions: [
      'Cut haulms (stems) 10-14 days before harvest if late blight is detected to protect tubers during lifting.',
      'Never wash blighted tubers before storage.'
    ],
    organicRemedy: 'Prophylactic Bordeaux mixture (1%) or Copper oxychloride 50% WP @ 2.5g/liter.',
    chemicalControl: 'Cymoxanil 8% + Mancozeb 64% WP (Curzate) @ 2.5g/liter or Fenamidone + Mancozeb @ 2.5g/liter.',
    immediateActions: 'Apply emergency systemic curative fungicide. Cut and burn haulms if tuber infection is imminent.'
  },
  {
    id: 'potato-healthy',
    crop: 'Potato',
    diseaseName: 'Potato Healthy',
    scientificName: 'N/A',
    pathogenType: 'None',
    severityDefault: 'None',
    symptoms: 'Uniform dark green canopy, erect succulent foliage without chlorotic halos, blemishes, or wilted tips.',
    causes: 'Optimal seed tuber health, well-aerated loamy ridge soil, and appropriate irrigation.',
    environmentalConditions: {
      optimalTempMin: 15.0,
      optimalTempMax: 24.0,
      optimalHumidityMin: 50.0,
      conduciveWeather: 'Mild daytime sunshine (18-22°C), cool nights, and moderate humidity.'
    },
    prevention: 'Maintain regular earthing up, scout for aphid vectors, avoid water-logging between furrows.',
    recommendedActions: [
      'Maintain regular irrigation intervals to avoid tuber cracking.',
      'Monitor for potato tuber moth and cutworms.'
    ],
    organicRemedy: 'Preventative neem oil (3ml/L) to deter sucking pests that vector viral pathogens.',
    chemicalControl: 'None required.',
    immediateActions: 'Continue optimal fertilizer scheduling and soil moisture monitoring.'
  },
  {
    id: 'apple-scab',
    crop: 'Apple',
    diseaseName: 'Apple Scab',
    scientificName: 'Venturia inaequalis',
    pathogenType: 'Fungal',
    severityDefault: 'High',
    symptoms: 'Olive-green to velvety dull dark brown spots on leaves; fruit lesions become scab-like, corky, and cracked; causes premature summer defoliation and unmarketable fruit.',
    causes: 'Venturia inaequalis ascospores released from fallen overwintered leaves during spring rains.',
    environmentalConditions: {
      optimalTempMin: 15.0,
      optimalTempMax: 24.0,
      optimalHumidityMin: 80.0,
      conduciveWeather: 'Continuous leaf wetness for 9-12 hours at temperatures between 16°C and 24°C.'
    },
    prevention: 'Orchard sanitation: sweep, mulch, or burn fallen autumn leaves; prune tree canopies to ensure direct sunlight and rapid drying.',
    recommendedActions: [
      'Collect fallen autumn leaves and treat orchard floor with 5% urea spray to accelerate leaf decomposition.',
      'Maintain open center or central leader pruning.'
    ],
    organicRemedy: 'Wettable sulfur (80% WDG) @ 2.5g/liter or potassium bicarbonate spray during early bud break.',
    chemicalControl: 'Difenoconazole 25% EC @ 0.3ml/liter or Dodine 65% WP @ 1g/liter water.',
    immediateActions: 'Spray curative systemic fungicide within 72 hours of primary infection rain event.'
  },
  {
    id: 'apple-cedar-rust',
    crop: 'Apple',
    diseaseName: 'Apple Cedar Rust',
    scientificName: 'Gymnosporangium juniperi-virginianae',
    pathogenType: 'Fungal',
    severityDefault: 'Moderate',
    symptoms: 'Bright yellow-orange spots on upper leaf surfaces that enlarge and turn orange with tiny black pimples (pycnia); tube-like fungal aecia develop on underside of leaves.',
    causes: 'Heteroecious rust fungus requiring both apple trees and Eastern red cedar / juniper trees to complete its two-year life cycle.',
    environmentalConditions: {
      optimalTempMin: 16.0,
      optimalTempMax: 24.0,
      optimalHumidityMin: 75.0,
      conduciveWeather: 'Warm spring rains occurring as cedar galls produce gelatinous orange spore horns.'
    },
    prevention: 'Remove nearby cedar or juniper trees within a 1-2 km radius of the orchard; choose rust-resistant apple varieties.',
    recommendedActions: [
      'Scout nearby windbreak conifers for cedar-apple rust galls and prune them before spring.',
      'Apply preventative protective fungicides between tight cluster and petal fall.'
    ],
    organicRemedy: 'Sulfur or copper-based sprays applied just before rainy infection periods.',
    chemicalControl: 'Myclobutanil 10% WP @ 0.5g/liter or Mancozeb 75% WP @ 2.5g/liter.',
    immediateActions: 'Check surrounding conifers for galls. Apply protective fungicide before forecasted rain during the pink-to-petal-fall stage.'
  },
  {
    id: 'corn-common-rust',
    crop: 'Corn',
    diseaseName: 'Corn Common Rust',
    scientificName: 'Puccinia sorghi',
    pathogenType: 'Fungal',
    severityDefault: 'Moderate',
    symptoms: 'Golden-brown to cinnamon-brown powdery pustules (uredinia) on both upper and lower leaf surfaces; ruptured epidermis releasing reddish-brown airborne spores.',
    causes: 'Puccinia sorghi windborne spores blown in on southerly wind currents from warmer overwintering zones.',
    environmentalConditions: {
      optimalTempMin: 16.0,
      optimalTempMax: 25.0,
      optimalHumidityMin: 80.0,
      conduciveWeather: 'Cool to moderate temperatures (16-25°C) with high relative humidity (>80%) and 6+ hours of dew.'
    },
    prevention: 'Plant resistant corn hybrids; ensure timely planting to avoid peak spore migration windows.',
    recommendedActions: [
      'Scout fields starting at vegetative stage V6-V8.',
      'Check lower and mid-canopy leaves for pustule development.'
    ],
    organicRemedy: 'Neem-based formulations (Azadirachtin 0.15%) to suppress early pustule sporulation.',
    chemicalControl: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1ml/liter water.',
    immediateActions: 'Evaluate leaf area affected on ear leaves. If pustules appear before silking on susceptible hybrids, schedule fungicide application.'
  }
];

module.exports = {
  DISEASE_MONOGRAPHS
};
