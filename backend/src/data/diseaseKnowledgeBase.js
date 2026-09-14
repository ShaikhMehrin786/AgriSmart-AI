/**
 * Comprehensive Agronomic Disease Knowledge Base (28 Public Benchmark Classes)
 *
 * SAFETY & REGULATORY COMPLIANCE:
 * - Recommendations do not prescribe unauthorized dosages.
 * - All chemical guidance mandates following locally registered product labels and state agricultural extension (ICAR / KVK / State Agriculture Dept) recommendations.
 * - AI outputs are decision-support advisory, not guaranteed legal diagnostic warrants.
 */

const SAFETY_DISCLAIMER = 'Always read and adhere to registered chemical product labels in your jurisdiction. Follow prescribed PPE (Personal Protective Equipment) and Pre-Harvest Intervals (PHI). Consult your local Krishi Vigyan Kendra (KVK) or State Agricultural Extension Officer for region-specific spray schedules.';

const KNOWLEDGE_BASE = {
  // ==========================================
  // APPLE
  // ==========================================
  'Apple___Apple_scab': {
    crop: 'Apple',
    disease: 'Apple Scab',
    rawClass: 'Apple___Apple_scab',
    isHealthy: false,
    pathogenType: 'Fungal (Venturia inaequalis)',
    description: 'A destructive fungal disease affecting apple foliage, blossoms, and developing fruit, causing premature defoliation and unmarketable scabby fruit lesions.',
    visualSymptoms: 'Olive-green to velvety brown or black circular spots on upper leaf surfaces. As lesions age, they become corky, thickened, and distorted.',
    likelyCauses: 'Prolonged leaf wetness (>6-9 hours) during springtime bud break, with moderate temperatures between 15°C and 24°C.',
    immediateActions: [
      'Prune and collect visibly infected shoots during dry weather to limit secondary spore release.',
      'Rake and destroy or compost fallen autumn leaves where fungal perithecia overwinter.'
    ],
    organicManagement: [
      'Apply preventative wettable sulfur or liquid lime-sulfur sprays during early green-tip stage.',
      'Use certified bio-fungicides containing Bacillus subtilis or Trichoderma harzianum.',
      'Spray potassium bicarbonate as an organic curative contact treatment.'
    ],
    chemicalManagement: [
      'Preventative protective fungicides such as Mancozeb or Captan applied at pink bud stage.',
      'Systemic sterol-inhibiting fungicides (e.g., Difenoconazole or Myclobutanil) during high-infection pressure.',
      'Rotate chemical FRAC codes to prevent fungicide resistance.'
    ],
    prevention: [
      'Select scab-resistant apple cultivars (e.g., Liberty, Prima, Enterprise) for new plantings.',
      'Ensure open canopy pruning to promote rapid wind drying of foliar moisture.',
      'Apply urea spray to fallen leaves in autumn to accelerate leaf decomposition and eliminate fungal spore reservoirs.'
    ],
    irrigationConsiderations: 'Irrigate via under-tree drip emitters. Strictly avoid overhead sprinklers that wet the canopy during bloom.',
    imageQualityGuidance: 'Capture close-up photos of distinct circular leaf lesions under diffuse daylight, avoiding extreme direct sunlight glare.',
    severityGuidance: {
      Low: '<5% leaf surface showing small olive spots; isolated to lower canopy.',
      Moderate: '5-20% leaf area affected; visible velvety lesion expansion.',
      High: '>20% leaf area covered with distorted, corky brown lesions; early leaf dropping.',
      Critical: 'Severe defoliation and cracked fruit lesions across entire orchard block.'
    }
  },

  'Apple___Cedar_apple_rust': {
    crop: 'Apple',
    disease: 'Cedar Apple Rust',
    rawClass: 'Apple___Cedar_apple_rust',
    isHealthy: false,
    pathogenType: 'Fungal (Gymnosporangium juniperi-virginianae)',
    description: 'A heteroecious fungal disease requiring two alternate hosts (Eastern Red Cedar/Juniper and Apple/Crabapple) to complete its complex life cycle.',
    visualSymptoms: 'Bright yellow-orange or reddish-orange circular spots on the upper leaf surface, often surrounded by a reddish border. Later, tiny tube-like fungal aecia structures erupt on the leaf underside.',
    likelyCauses: 'Spring rains wetting cedar galls on nearby juniper trees, releasing teliospores carried by wind up to 1-2 kilometers into apple orchards.',
    immediateActions: [
      'Inspect surrounding borders and remove wild red cedar/juniper galls within 500 meters if possible.',
      'Remove heavily infected foliage before fungal tubes form on leaf undersides.'
    ],
    organicManagement: [
      'Apply protective sulfur or copper octanoate (copper soap) sprays starting at tight cluster.',
      'Bio-control sprays with Serenade (Bacillus subtilis) applied preventatively.'
    ],
    chemicalManagement: [
      'Apply sterol inhibitor (SI) fungicides such as Myclobutanil or Tebuconazole from pink bud through petal fall.',
      'Protectant fungicides (e.g., Mancozeb) applied ahead of predicted rainfall events during active gall sporulation.'
    ],
    prevention: [
      'Eradicate or prune galls from alternate juniper hosts in the immediate vicinity.',
      'Plant rust-immune or resistant cultivars (e.g., Freedom, Redfree, William\'s Pride).'
    ],
    irrigationConsiderations: 'Maintain standard drip irrigation; foliar wetting does not initiate primary infection if windborne teliospores are absent, but keeps canopy dry.',
    imageQualityGuidance: 'Photograph bright orange lesions from both the upper leaf surface and the underside showing cluster cups.',
    severityGuidance: {
      Low: 'Few scattered bright yellow-orange flecks (<3 per leaf).',
      Moderate: 'Multiple distinct orange spots with reddish halos across canopy.',
      High: 'Abundant spotting with visible tube-like aecia on lower leaf surface and early leaf yellowing.',
      Critical: 'Severe foliar rust load causing premature defoliation and fruit deformities.'
    }
  },

  'Apple___healthy': {
    crop: 'Apple',
    disease: 'Apple Healthy',
    rawClass: 'Apple___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Clean, vigorous apple foliage with uniform green pigmentation, intact cuticle, and optimal photosynthetic potential.',
    visualSymptoms: 'No chlorosis, spotting, necrosis, or foliar distortion. Healthy leaf margins and glossy surface.',
    preventiveCropCare: [
      'Maintain balanced seasonal N-P-K fertilization based on annual soil tests.',
      'Apply foliar zinc and boron during pre-bloom to support cell integrity and fruit set.',
      'Perform annual dormant pruning to maximize sunlight penetration into the interior canopy.'
    ],
    monitoringGuidance: 'Perform bi-weekly orchard scouting from green tip through fruit harvest, inspecting spur leaves and terminal shoot growth.',
    irrigationGuidance: 'Deliver 25-40 mm of water per week using micro-drip or ring basins, increasing volume during fruit sizing.',
    imageQualityGuidance: 'Ensure clear focus across the entire leaf blade under diffuse daylight.'
  },

  // ==========================================
  // BLUEBERRY
  // ==========================================
  'Blueberry___healthy': {
    crop: 'Blueberry',
    disease: 'Blueberry Healthy',
    rawClass: 'Blueberry___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Healthy blueberry foliage characterized by deep green, smooth leaves, proper soil-acidification response, and vigorous cane development.',
    visualSymptoms: 'No leaf reddening, marginal scorch, rust pustules, or anthracnose leaf spots.',
    preventiveCropCare: [
      'Maintain soil pH strictly between 4.5 and 5.2 using elemental sulfur or peat moss.',
      'Apply ammonium-based nitrogen fertilizers (e.g., ammonium sulfate) rather than nitrate forms.',
      'Apply organic pine bark or sawdust mulch (5-8 cm depth) to conserve root moisture and suppress weeds.'
    ],
    monitoringGuidance: 'Scout weekly during warm, humid spells for Mummy Berry (Monilinia) or Anthracnose leaf spotting.',
    irrigationGuidance: 'Shallow root system requires frequent light drip irrigation. Keep top 30 cm of soil uniformly moist without waterlogging.',
    imageQualityGuidance: 'Photograph healthy shoot tips and mature leaves in sharp focus.'
  },

  // ==========================================
  // CHERRY
  // ==========================================
  'Cherry___healthy': {
    crop: 'Cherry',
    disease: 'Cherry Healthy',
    rawClass: 'Cherry___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Vigorous cherry tree foliage free from cherry leaf spot, powdery mildew, and bacterial canker.',
    visualSymptoms: 'Smooth, rich green serrated leaves with uniform color and strong petiole attachment.',
    preventiveCropCare: [
      'Prune in dry summer weather (post-harvest) rather than spring/winter to avoid bacterial canker infection.',
      'Ensure balanced calcium and potassium nutrition to enhance leaf cuticle thickness.'
    ],
    monitoringGuidance: 'Inspect lower leaf surfaces after rain events for tiny purple-to-brown spots of Cherry Leaf Spot (Blumeriella jaapii).',
    irrigationGuidance: 'Use regulated drip irrigation; avoid soil saturation during fruit ripening to prevent fruit splitting.',
    imageQualityGuidance: 'Capture leaves against natural daylight without shadows.'
  },

  // ==========================================
  // CORN / MAIZE
  // ==========================================
  'Corn___Cercospora_leaf_spot': {
    crop: 'Corn',
    disease: 'Cercospora Leaf Spot (Gray Leaf Spot)',
    rawClass: 'Corn___Cercospora_leaf_spot',
    isHealthy: false,
    pathogenType: 'Fungal (Cercospora zeae-maydis)',
    description: 'A major foliar fungal disease of maize that causes premature leaf blighting, reduced grain fill, and stalk lodging.',
    visualSymptoms: 'Distinctive rectangular, tan-to-gray lesions strictly bounded by parallel leaf veins. Lesions start small with yellow halos and elongate into long parallel strips.',
    likelyCauses: 'High relative humidity (>90%) and warm temperatures (25-32°C) coupled with minimum-till residue from previous corn crops.',
    immediateActions: [
      'Assess lesion progression relative to the ear leaf during pollination/grain fill.',
      'In high-risk fields, evaluate economic threshold before fungicide application.'
    ],
    organicManagement: [
      'Apply bio-fungicides containing Bacillus amyloliquefaciens at VT (tasseling) stage in organic fields.',
      'Rotate fields with non-host crops (soybean, sorghum, pulses) for at least 1-2 seasons.'
    ],
    chemicalManagement: [
      'Strobilurin + Triazole premix fungicides (e.g., Azoxystrobin + Difenoconazole or Pyraclostrobin + Fluxapyroxad) applied between V12 and R1 (silking).',
      'Follow label application timings to maximize ear-leaf protection.'
    ],
    prevention: [
      'Plant corn hybrids possessing high genetic resistance ratings against Gray Leaf Spot.',
      'Manage crop residue by tilling or rotating to non-host crops to reduce overwintered mycelium.'
    ],
    irrigationConsiderations: 'Avoid continuous overhead pivot irrigation during evening hours; schedule watering so leaf blades dry before nightfall.',
    imageQualityGuidance: 'Photograph rectangular vein-bounded lesions clearly showing straight edges and greyish fungal sheen.',
    severityGuidance: {
      Low: 'A few isolated rectangular lesions on lower canopy leaves below the ear leaf.',
      Moderate: 'Lesions progressing up to the leaf immediately below the ear leaf.',
      High: 'Ear leaf and leaves above ear leaf showing >25% blighted surface.',
      Critical: 'Entire canopy blighted before dent stage; premature senescence and stalk lodging risk.'
    }
  },

  'Corn___Common_rust': {
    crop: 'Corn',
    disease: 'Common Rust',
    rawClass: 'Corn___Common_rust',
    isHealthy: false,
    pathogenType: 'Fungal (Puccinia sorghi)',
    description: 'A foliar fungal rust characterized by powdery cinnamon-brown pustules erupting across both upper and lower leaf surfaces.',
    visualSymptoms: 'Small, circular-to-elongated powdery cinnamon-brown or golden pustules scattered across both leaf surfaces. Rubbing leaves leaves a rusty spore residue on fingers.',
    likelyCauses: 'Cool to moderate temperatures (16-25°C) with high humidity and prolonged dew. Airborne urediniospores carried from southern cropping regions.',
    immediateActions: [
      'Check if rust pustules are spreading to upper canopy leaves during tasseling.',
      'Differentiate from Southern Rust (which has smaller, orange-tan pustules predominantly on upper leaf surface).'
    ],
    organicManagement: [
      'Apply certified potassium silicate or copper-based bio-protectants at first sign of rust flecks.',
      'Incorporate foliar compost extracts and beneficial endophyte inoculants.'
    ],
    chemicalManagement: [
      'Foliar triazole or strobilurin fungicides (e.g., Tebuconazole, Propiconazole, or Pyraclostrobin) applied when pustules appear on upper leaves before blister stage (R2).'
    ],
    prevention: [
      'Plant hybrids with Rp gene-mediated resistance to Puccinia sorghi.',
      'Plant early in the season to mature past peak spore-shower periods.'
    ],
    irrigationConsiderations: 'Maintain uniform soil moisture; excessive sprinkler misting prolongs leaf wetness and favors rust germination.',
    imageQualityGuidance: 'Capture close-up macro shots showing individual powdery pustules and spore eruptions.',
    severityGuidance: {
      Low: 'Scattered rust pustules on lower leaves; <5% leaf area affected.',
      Moderate: 'Pustules expanding across middle canopy and ear leaf.',
      High: 'Dense pustule clusters covering >20% leaf area on ear leaf and upper canopy.',
      Critical: 'Severe pustule coalescence causing leaf chlorosis and premature leaf death.'
    }
  },

  'Corn___Northern_Leaf_Blight': {
    crop: 'Corn',
    disease: 'Northern Corn Leaf Blight (NCLB)',
    rawClass: 'Corn___Northern_Leaf_Blight',
    isHealthy: false,
    pathogenType: 'Fungal (Exserohilum turcicum / Setosphaeria turcica)',
    description: 'A major fungal foliar disease resulting in large, characteristic cigar-shaped or elliptical necrotic lesions that drastically reduce photosynthesis.',
    visualSymptoms: 'Long, elliptical, cigar-shaped grayish-green to tan lesions (2.5 to 15 cm long) not restricted by leaf veins. Dark olive-black spores may form inside lesions in humid weather.',
    likelyCauses: 'Moderate temperatures (18-27°C) accompanied by extended dew periods (6-12 hours) and surface residue from infected corn fields.',
    immediateActions: [
      'Monitor lesion spread relative to the ear leaf from V10 stage through grain fill.',
      'Avoid mechanical damage to corn leaves during late cultivation.'
    ],
    organicManagement: [
      'Bio-fungicide sprays containing Bacillus subtilis or copper hydroxide at early vegetative stages.',
      'Crop rotation with non-grass crops for at least 2 consecutive years.'
    ],
    chemicalManagement: [
      'Apply fungicides containing Azoxystrobin, Pyraclostrobin, Propiconazole, or Trifloxystrobin at or immediately before tasseling (VT) if lesions are observed on lower leaves.'
    ],
    prevention: [
      'Use certified hybrids with both qualitative (Ht1, Ht2, Ht3) and quantitative multi-genic resistance.',
      'Deep plow or shred crop residues in high-incidence fields to speed decomposition.'
    ],
    irrigationConsiderations: 'Ensure irrigation cycles do not leave foliage wet overnight; water in early morning.',
    imageQualityGuidance: 'Photograph the entire cigar-shaped lesion showing its tapered ends and border.',
    severityGuidance: {
      Low: '1-2 cigar-shaped lesions on bottom leaves below ear leaf.',
      Moderate: 'Lesions appearing on ear leaf at or before silking (R1).',
      High: 'Multiple large coalescing lesions on leaves above ear leaf.',
      Critical: 'Extensive canopy blighting (>50% leaf area) during grain fill, causing severe yield penalty.'
    }
  },

  // ==========================================
  // GRAPE
  // ==========================================
  'Grape___Black_rot': {
    crop: 'Grape',
    disease: 'Grape Black Rot',
    rawClass: 'Grape___Black_rot',
    isHealthy: false,
    pathogenType: 'Fungal (Guignardia bidwellii / Phyllosticta ampelicida)',
    description: 'One of the most destructive fungal diseases of grapevine, causing severe leaf spotting, shoot cankers, and complete mummification of grape berry clusters.',
    visualSymptoms: 'Small circular reddish-brown leaf spots with dark brown margins. Tiny black pimple-like fruiting bodies (pycnidia) appear arranged in a ring within the lesion. Berries shrivel into hard, black, wrinkled mummies.',
    likelyCauses: 'Warm, humid weather (21-27°C) with frequent rain events that release overwintered ascospores from mummified berries and canes.',
    immediateActions: [
      'Hand-prune and destroy mummified grape clusters and infected canes during dormancy.',
      'Remove spotted leaves early in the season before pycnidia disperse conidia.'
    ],
    organicManagement: [
      'Apply preventative copper hydroxide / Bordeaux mixture or wettable sulfur from bud break through veraison.',
      'Bio-fungicides based on Bacillus pumilus applied at 7-10 day intervals.'
    ],
    chemicalManagement: [
      'Protective Dithiocarbamates (Mancozeb) or Captan from 2-inch shoot stage to post-bloom.',
      'Systemic sterol inhibitors (Myclobutanil, Tebuconazole) or strobilurins (Azoxystrobin, Kresoxim-methyl) during critical pre-bloom to 4-week post-bloom window.'
    ],
    prevention: [
      'Canopy management: Trellis, shoot-thin, and leaf-pull around grape clusters to maximize airflow and sunlight.',
      'Sanitation: Destroy all overwintered mummies on the ground and trellis wires.'
    ],
    irrigationConsiderations: 'Utilize drip irrigation underneath vine canopies. Avoid any sprinkler misting.',
    imageQualityGuidance: 'Photograph both the tan leaf spot with visible black pycnidia dots and any shriveling berry clusters.',
    severityGuidance: {
      Low: 'A few isolated brown spots on lower leaves with no fruit infection.',
      Moderate: 'Spotted leaves across canopy; early berry infection (<5% berries with soft brown spots).',
      High: 'Widespread leaf lesions and berry clusters turning brown, rotting, and starting to mummify.',
      Critical: 'Complete cluster mummification and shoot cankers throughout vineyard.'
    }
  },

  'Grape___healthy': {
    crop: 'Grape',
    disease: 'Grape Healthy',
    rawClass: 'Grape___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Healthy grapevine canopy exhibiting lush green palmately lobed leaves, intact petioles, and vigorous tendril growth.',
    visualSymptoms: 'No leaf spotting, powdery white fungal growth, downy mildew oil spots, or berry mummies.',
    preventiveCropCare: [
      'Perform seasonal shoot positioning and suckering to optimize sun exposure.',
      'Maintain balanced potassium and magnesium levels to prevent physiological leaf scorch.',
      'Apply dormant winter lime-sulfur wash to eliminate overwintering fungal spores on bark.'
    ],
    monitoringGuidance: 'Weekly vineyard scouting from bud burst through harvest for Black Rot, Powdery Mildew, and Downy Mildew.',
    irrigationGuidance: 'Regulated Deficit Irrigation (RDI) via sub-surface or surface drip between fruit set and veraison.',
    imageQualityGuidance: 'Capture fully unfurled grape leaves in focus with clear leaf vein details.'
  },

  // ==========================================
  // PEACH
  // ==========================================
  'Peach___healthy': {
    crop: 'Peach',
    disease: 'Peach Healthy',
    rawClass: 'Peach___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Clean peach foliage free from Peach Leaf Curl (Taphrina deformans), Bacterial Spot (Xanthomonas), and Shot Hole disease.',
    visualSymptoms: 'Lanceolate glossy green leaves without reddish puckering, distortion, or shot-hole perforations.',
    preventiveCropCare: [
      'Apply a mandatory single dormant copper or chlorothalonil spray before bud swell in late winter to prevent Peach Leaf Curl.',
      'Maintain balanced nitrogen fertilization; avoid excess late-season nitrogen which delays winter hardiness.'
    ],
    monitoringGuidance: 'Scout foliage at bud break for reddish leaf thickening or puckering.',
    irrigationGuidance: 'Provide 25-50 mm water per week during stone hardening and fruit swell via under-canopy micro-sprinklers or drip.',
    imageQualityGuidance: 'Photograph healthy lanceolate leaves with smooth margins in diffuse light.'
  },

  // ==========================================
  // PEPPER BELL
  // ==========================================
  'Pepper_bell___Bacterial_spot': {
    crop: 'Pepper Bell',
    disease: 'Pepper Bell Bacterial Spot',
    rawClass: 'Pepper_bell___Bacterial_spot',
    isHealthy: false,
    pathogenType: 'Bacterial (Xanthomonas euvesicatoria / X. perforans)',
    description: 'A major seedborne and splash-dispersed bacterial disease affecting bell pepper leaves and fruit, causing severe defoliation and sunscald.',
    visualSymptoms: 'Small, circular to irregular water-soaked spots (1-3 mm) on leaves that turn dark brown or black with a pale halo. Older spots become necrotic and drop out, creating ragged shot-holes.',
    likelyCauses: 'Warm, humid weather (24-30°C) with driving rains or overhead sprinkler splashing; infected seeds or transplants.',
    immediateActions: [
      'Avoid entering or working in the field when pepper foliage is wet to stop mechanical bacterial spread.',
      'Remove and safely destroy severely infected plants in early localized nursery beds.'
    ],
    organicManagement: [
      'Apply fixed copper fungicides (copper hydroxide or copper sulfate basic) combined with bio-stimulants.',
      'Use bacteriophage-based bio-controls (e.g., AgriPhage) targeting specific Xanthomonas strains.'
    ],
    chemicalManagement: [
      'Apply tank mixtures of fixed copper with Mancozeb (which enhances free copper ions) preventatively at 7-day intervals during wet weather.',
      'Use plant defense activators like Acibenzolar-S-methyl (ASM) where approved.'
    ],
    prevention: [
      'Plant certified disease-free, hot-water-treated seed.',
      'Select bell pepper varieties with genetic resistance races (Races 1-10).',
      'Rotate crops for at least 2-3 years with non-solanaceous crops (avoid tomato, potato, eggplant).'
    ],
    irrigationConsiderations: 'Strictly use drip irrigation. Avoid any overhead sprinkler systems that create splashing.',
    imageQualityGuidance: 'Take high-resolution photos of water-soaked spots and shot-holes on leaf blades.',
    severityGuidance: {
      Low: 'A few isolated water-soaked flecks on lower leaves (<5 spots per leaf).',
      Moderate: 'Brown necrotic spots across multiple leaves; minor lower leaf drop.',
      High: 'Extensive spotting, chlorosis, and noticeable leaf drop exposing fruit to sunscald.',
      Critical: 'Severe defoliation (>50%) and bacterial blister lesions appearing on developing pepper fruits.'
    }
  },

  'Pepper_bell___healthy': {
    crop: 'Pepper Bell',
    disease: 'Pepper Bell Healthy',
    rawClass: 'Pepper_bell___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Healthy bell pepper plant exhibiting dark green foliage, vigorous branching, and strong blossom set.',
    visualSymptoms: 'Uniform green foliage without water-soaked lesions, vein yellowing, or mosaic mottling.',
    preventiveCropCare: [
      'Maintain consistent calcium and moisture supply to prevent Blossom End Rot.',
      'Apply balanced N-P-K with micronutrients (magnesium, sulfur, zinc).',
      'Use plastic or organic mulch to suppress weeds and stabilize soil temperature.'
    ],
    monitoringGuidance: 'Inspect weekly for early signs of bacterial spot, anthracnose, and aphid-borne viruses.',
    irrigationGuidance: 'Consistent drip irrigation delivering 25-35 mm per week; avoid water stress during flowering.',
    imageQualityGuidance: 'Capture crisp, evenly lit photos of the upper canopy foliage.'
  },

  // ==========================================
  // POTATO
  // ==========================================
  'Potato___Early_blight': {
    crop: 'Potato',
    disease: 'Potato Early Blight',
    rawClass: 'Potato___Early_blight',
    isHealthy: false,
    pathogenType: 'Fungal (Alternaria solani)',
    description: 'A common fungal foliar disease of potato occurring in senescing leaves or plants under environmental stress, reducing tuber bulking.',
    visualSymptoms: 'Dark brown to black circular-to-oval spots with characteristic concentric rings creating a "target-board" appearance. Lesions are surrounded by a narrow chlorotic halo.',
    likelyCauses: 'Alternating wet and dry cycles with warm temperatures (24-29°C) and nitrogen deficiency or crop senescence.',
    immediateActions: [
      'Avoid overhead irrigation late in the afternoon to shorten leaf wetness duration.',
      'Prune severely blighted lower leaves if localized.'
    ],
    organicManagement: [
      'Apply preventative copper hydroxide, copper octanoate, or sulfur dusts.',
      'Use bio-fungicide sprays containing Bacillus subtilis (Serenade) or Trichoderma harzianum.'
    ],
    chemicalManagement: [
      'Protective broad-spectrum fungicides (Mancozeb, Chlorothalonil) before row closure.',
      'Targeted fungicides (e.g., Azoxystrobin, Difenoconazole, Boscalid, Fluopyram) when concentric lesions appear.'
    ],
    prevention: [
      'Plant certified disease-free seed tubers.',
      'Ensure adequate nitrogen and potassium fertilization to prevent premature canopy senescence.',
      'Practice a minimum 3-year crop rotation away from solanaceous crops.'
    ],
    irrigationConsiderations: 'Irrigate in early morning via drip or furrow; allow foliage to dry completely before sunset.',
    imageQualityGuidance: 'Photograph target-board lesions showing concentric rings in sharp focus.',
    severityGuidance: {
      Low: 'Isolated target-board spots on older lower leaves.',
      Moderate: 'Target lesions spreading into mid-canopy; visible yellowing around spots.',
      High: '>25% foliar canopy covered with coalescing necrotic target spots.',
      Critical: 'Severe canopy collapse and premature plant death during active tuber bulking.'
    }
  },

  'Potato___Late_blight': {
    crop: 'Potato',
    disease: 'Potato Late Blight',
    rawClass: 'Potato___Late_blight',
    isHealthy: false,
    pathogenType: 'Oomycete (Phytophthora infestans)',
    description: 'A catastrophic, rapid-spreading oomycete disease capable of destroying entire potato fields within days and causing tuber rot in storage.',
    visualSymptoms: 'Large, irregular water-soaked pale-to-dark green lesions that rapidly turn purplish-black and necrotic. In humid conditions, a delicate white downy fungal-like growth appears on the lesion underside. Stems exhibit dark brown greasy lesions.',
    likelyCauses: 'Cool, wet weather (10-20°C) with relative humidity >90% for prolonged periods (late blight disease forecasting thresholds).',
    immediateActions: [
      'CRITICAL: Immediately scout neighboring rows and treat with anti-oomycete protectants upon first detection.',
      'Destroy volunteer potato plants and cull piles in surrounding field borders.',
      'Do not harvest tubers from fields with active foliar late blight until vines have been killed for 2 weeks.'
    ],
    organicManagement: [
      'Apply preventative copper sulfate / Bordeaux mixture at tight intervals ahead of cool, wet weather.',
      'Destroy (burn or bag) infected haulms immediately to prevent spore release.'
    ],
    chemicalManagement: [
      'Protective fungicides (Mancozeb, Chlorothalonil) ahead of disease alert warnings.',
      'Systemic/curative oomycete-specific fungicides: Metalaxyl / Mefenoxam (where sensitive), Dimethomorph, Cymoxanil, Mandipropamid, or Fluopicolide.',
      'Always alternate modes of action to manage fungicide resistance.'
    ],
    prevention: [
      'Use certified disease-free seed potatoes.',
      'Plant late-blight resistant potato cultivars (e.g., Kufri Girdhari, Kufri Himalini, Defender).',
      'Eliminate cull potato piles; ensure deep soil hilling to prevent zoospores washing into tuber zone.'
    ],
    irrigationConsiderations: 'Strictly suspend sprinkler irrigation during overcast, cool conditions. Rely solely on drip/furrow.',
    imageQualityGuidance: 'Photograph the white downy sporulation on the underside of water-soaked lesions in natural light.',
    severityGuidance: {
      Low: '1-2 water-soaked lesions with faint white border on isolated lower leaves.',
      Moderate: 'Multiple dark purplish-brown lesions across several plants; stem lesions starting.',
      High: 'Rapidly spreading dark foliar blight with strong downy sporulation on >20% canopy.',
      Critical: 'Complete canopy collapse, foul-smelling rotting foliage, and tuber infection.'
    }
  },

  'Potato___healthy': {
    crop: 'Potato',
    disease: 'Potato Healthy',
    rawClass: 'Potato___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Healthy potato canopy exhibiting robust green compound leaves, sturdy stems, and active tuber bulking.',
    visualSymptoms: 'Uniform green foliage without concentric target spots, dark water-soaked patches, or mosaic mottling.',
    preventiveCropCare: [
      'Hill soil properly around potato stems to protect developing tubers from sunlight and blight spores.',
      'Ensure balanced N-P-K nutrition with supplemental potassium for starch development.',
      'Maintain regular preventative scouting twice weekly during wet seasons.'
    ],
    monitoringGuidance: 'Scout field edges, low-lying wet spots, and dense canopy areas for early blight and late blight symptoms.',
    irrigationGuidance: 'Maintain 65-80% available soil moisture during tuber initiation and bulking using drip or furrow systems.',
    imageQualityGuidance: 'Capture vibrant compound leaves showing top and bottom surfaces.'
  },

  // ==========================================
  // RASPBERRY
  // ==========================================
  'Raspberry___healthy': {
    crop: 'Raspberry',
    disease: 'Raspberry Healthy',
    rawClass: 'Raspberry___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Vigorous raspberry cane and foliage free from Spur Blight, Cane Blight, Anthracnose, and Raspberry Mosaic Virus.',
    visualSymptoms: 'Bright green, serrated trifoliate leaves with silvery undersides and clean, unblemished primocanes.',
    preventiveCropCare: [
      'Prune out spent floricanes immediately after fruiting to improve sunlight and air circulation.',
      'Trellis canes off the ground to prevent soil-contact splash diseases.',
      'Mulch with wood chips to conserve root moisture.'
    ],
    monitoringGuidance: 'Inspect cane bases and leaves monthly for purple lesions or yellow vein banding.',
    irrigationGuidance: 'Drip irrigation at base of row; provide 25-35 mm per week during berry sizing.',
    imageQualityGuidance: 'Photograph healthy compound leaves with natural color rendering.'
  },

  // ==========================================
  // SOYBEAN
  // ==========================================
  'Soybean___healthy': {
    crop: 'Soybean',
    disease: 'Soybean Healthy',
    rawClass: 'Soybean___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Healthy soybean plant featuring trifoliate leaves with active nodulation and pod development.',
    visualSymptoms: 'Uniform green trifoliate foliage without Frogeye Leaf Spot, Asian Rust pustules, or Sudden Death Syndrome chlorosis.',
    preventiveCropCare: [
      'Inoculate seeds with Bradyrhizobium japonicum to ensure robust biological nitrogen fixation.',
      'Maintain adequate soil potassium to prevent potassium-deficiency leaf margin scorch.',
      'Practice minimum tillage with crop rotation.'
    ],
    monitoringGuidance: 'Scout fields weekly during R1 (flowering) through R5 (seed development) stages.',
    irrigationGuidance: 'Irrigate during R3-R5 reproductive stages to maximize pod fill; avoid waterlogging.',
    imageQualityGuidance: 'Capture clean trifoliate leaves in focus against natural background.'
  },

  // ==========================================
  // SQUASH
  // ==========================================
  'Squash___Powdery_mildew': {
    crop: 'Squash',
    disease: 'Squash Powdery Mildew',
    rawClass: 'Squash___Powdery_mildew',
    isHealthy: false,
    pathogenType: 'Fungal (Podosphaera xanthii / Erysiphe cichoracearum)',
    description: 'A prevalent fungal disease of cucurbits that covers leaves in white talcum-powder-like fungal colonies, causing premature leaf yellowing and fruit sunburn.',
    visualSymptoms: 'White, powdery, circular fungal spots appearing first on older lower leaves, petioles, and shaded stems, eventually covering the entire upper and lower leaf surfaces.',
    likelyCauses: 'High relative humidity at night coupled with dry, warm sunny days (20-28°C) in dense, shaded crop canopies.',
    immediateActions: [
      'Prune heavily infested older leaves to improve canopy airflow.',
      'Ensure prompt treatment before mildew covers more than 10% of the upper canopy.'
    ],
    organicManagement: [
      'Apply potassium bicarbonate (3-5 g/L) or baking soda with horticultural oil spray.',
      'Spray neem oil (0.5%) or dilute milk solution (1:9 milk to water) in full sunlight.',
      'Use bio-fungicides containing Bacillus amyloliquefaciens or Ampelomyces quisqualis.'
    ],
    chemicalManagement: [
      'Preventative and curative fungicides: DMI triazoles (Myclobutanil), Quinone Outside Inhibitors (QoI / Trifloxystrobin), or SDHI fungicides (Boscalid, Fluxapyroxad).',
      'Apply wettable sulfur in early stages (avoid sulfur when temperature exceeds 32°C to prevent phytotoxicity).'
    ],
    prevention: [
      'Plant powdery mildew-resistant squash varieties.',
      'Space plants generously to promote rapid air circulation and reduce dense shading.',
      'Destroy all cucurbit crop residue after harvest.'
    ],
    irrigationConsiderations: 'Irrigate at soil line using drip lines; dry foliar conditions prevent spore dispersal when moisture is kept at roots.',
    imageQualityGuidance: 'Photograph white powdery patches against the green leaf surface under diffuse lighting.',
    severityGuidance: {
      Low: 'Small isolated white talc-like spots on lower, older leaves (<5% leaf area).',
      Moderate: 'White fungal patches expanding across middle canopy leaves.',
      High: 'White powdery coating covering >30% of foliage; leaves turning yellow and brittle.',
      Critical: 'Complete leaf blighting, leaves drying to brown crisps, exposing fruit to sunscald.'
    }
  },

  // ==========================================
  // STRAWBERRY
  // ==========================================
  'Strawberry___healthy': {
    crop: 'Strawberry',
    disease: 'Strawberry Healthy',
    rawClass: 'Strawberry___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Healthy strawberry foliage exhibiting dark green trifoliate leaves, robust crowns, and clean flowering trusses.',
    visualSymptoms: 'No leaf scorch, angular leaf spot, gray mold (Botrytis), or powdery mildew.',
    preventiveCropCare: [
      'Grow on raised beds covered with black plastic or clean straw mulch to keep leaves and fruit off soil.',
      'Ensure balanced calcium and potassium fertilization for fruit firmness.',
      'Remove dead or senescent leaves during spring cleanout.'
    ],
    monitoringGuidance: 'Inspect crowns, leaf undersides, and blossoms weekly for Botrytis and spider mites.',
    irrigationGuidance: 'Drip irrigation beneath mulch; avoid wetting blossoms or developing fruit.',
    imageQualityGuidance: 'Focus on crisp trifoliate leaves with vibrant green coloration.'
  },

  // ==========================================
  // TOMATO
  // ==========================================
  'Tomato___Bacterial_spot': {
    crop: 'Tomato',
    disease: 'Tomato Bacterial Spot',
    rawClass: 'Tomato___Bacterial_spot',
    isHealthy: false,
    pathogenType: 'Bacterial (Xanthomonas perforans / X. gardneri)',
    description: 'A major bacterial disease of tomato causing foliar spotting, blighting, and scabby fruit lesions under warm, wet conditions.',
    visualSymptoms: 'Small (1-3 mm), dark brown, water-soaked circular-to-irregular lesions on leaves, often surrounded by yellow halos. Lesion centers become dry and crack.',
    likelyCauses: 'Warm temperatures (24-30°C) with frequent rain, high humidity, and driving winds that splash bacteria from soil or infected transplants.',
    immediateActions: [
      'Do not cultivate, prune, or spray when plants are wet.',
      'Isolate and rogue out infected nursery seedlings.'
    ],
    organicManagement: [
      'Apply fixed copper (copper hydroxide or copper octanoate) preventatively.',
      'Use bacteriophage treatments (AgriPhage-Tomato) targeting specific Xanthomonas strains.'
    ],
    chemicalManagement: [
      'Tank-mix copper hydroxide with Mancozeb to increase active cupric ion efficacy against copper-tolerant strains.',
      'Apply plant defense elicitors (Acibenzolar-S-methyl).'
    ],
    prevention: [
      'Use certified disease-free, hot-water-treated seed.',
      'Rotate fields away from solanaceous crops for at least 2-3 years.',
      'Stake and trellis tomato plants to elevate canopy from soil splash.'
    ],
    irrigationConsiderations: 'Strictly use drip irrigation under plastic mulch. Avoid overhead sprinklers.',
    imageQualityGuidance: 'Capture close-up images of small dark water-soaked spots with yellow halos.',
    severityGuidance: {
      Low: 'Few scattered water-soaked dark spots on lower leaves.',
      Moderate: 'Numerous brown spots with yellow halos across middle canopy.',
      High: 'Extensive spotting causing leaf yellowing, necrosis, and lower leaf drop.',
      Critical: 'Severe defoliation with black scab-like lesions on green and ripening fruit.'
    }
  },

  'Tomato___Early_blight': {
    crop: 'Tomato',
    disease: 'Tomato Early Blight',
    rawClass: 'Tomato___Early_blight',
    isHealthy: false,
    pathogenType: 'Fungal (Alternaria solani / A. tomatophila)',
    description: 'One of the most widespread fungal foliar diseases of tomato, producing characteristic target-board concentric ring lesions on leaves and stem cankers.',
    visualSymptoms: 'Dark brown-to-black spots on older lower leaves with distinctive concentric target rings, surrounded by yellow chlorotic margins. Lesions coalesce, turning leaves brown and dry.',
    likelyCauses: 'Warm, humid weather (24-29°C) with heavy dews, frequent rain, and dense unpruned canopies.',
    immediateActions: [
      'Prune and discard the lowest 30 cm of tomato foliage to eliminate ground contact.',
      'Collect and destroy infected fallen leaves to reduce spore load.'
    ],
    organicManagement: [
      'Apply preventative copper fungicide or bio-fungicides (Bacillus subtilis, Trichoderma viride).',
      'Spray potassium bicarbonate or neem oil (0.5%) early in disease onset.'
    ],
    chemicalManagement: [
      'Preventative protectants: Mancozeb 75% WP or Chlorothalonil applied ahead of wet weather.',
      'Systemic curatives: Azoxystrobin, Difenoconazole, or Pyraclostrobin rotated by FRAC group.'
    ],
    prevention: [
      'Stake, cage, and trellis tomatoes to maintain upright airflow.',
      'Apply 5-8 cm organic or plastic mulch around plant bases to prevent soil splash.',
      'Practice 3-year crop rotation away from solanaceous plants.'
    ],
    irrigationConsiderations: 'Irrigate exclusively at ground level using drip lines in the early morning.',
    imageQualityGuidance: 'Photograph concentric ring "target" patterns on lower leaves in clear focus.',
    severityGuidance: {
      Low: 'Isolated target spots on lowest leaves with minimal yellowing.',
      Moderate: 'Target lesions progressing into mid-canopy with noticeable chlorosis.',
      High: 'Extensive coalescing target lesions covering >25% of canopy; lower leaves withering.',
      Critical: 'Severe defoliation with dark sunken cankers at stem nodes and fruit calyx.'
    }
  },

  'Tomato___Late_blight': {
    crop: 'Tomato',
    disease: 'Tomato Late Blight',
    rawClass: 'Tomato___Late_blight',
    isHealthy: false,
    pathogenType: 'Oomycete (Phytophthora infestans)',
    description: 'An aggressive, highly destructive oomycete disease capable of rapidly destroying tomato foliage, stems, and fruit during cool, wet periods.',
    visualSymptoms: 'Large, dark, water-soaked greenish-brown to black greasy lesions on leaves and stems. Under high humidity, a distinctive white fungal-like downy growth appears on the lesion underside.',
    likelyCauses: 'Cool, wet, overcast weather (15-22°C) with relative humidity >90% and wind-dispersed sporangia.',
    immediateActions: [
      'CRITICAL: Immediately inspect entire crop upon first detection and apply protective oomycete-active treatments.',
      'Remove and bag heavily infected plants; do not place on open compost heaps.'
    ],
    organicManagement: [
      'Apply preventative copper hydroxide / Bordeaux mixture at 5-7 day intervals during cool, wet alerts.'
    ],
    chemicalManagement: [
      'Protective contact: Mancozeb or Chlorothalonil.',
      'Systemic anti-oomycete: Dimethomorph, Cymoxanil + Mancozeb, Mandipropamid, or Metalaxyl-M (where resistance has not developed).'
    ],
    prevention: [
      'Plant late-blight resistant tomato varieties (e.g., Mountain Magic, Defiant, Iron Lady).',
      'Eliminate volunteer tomato and potato plants from adjacent fields.',
      'Ensure wide plant spacing for rapid canopy drying.'
    ],
    irrigationConsiderations: 'Avoid any overhead irrigation; water exclusively via drip at soil level.',
    imageQualityGuidance: 'Photograph the white downy fungal-like sporulation on the underside of water-soaked spots.',
    severityGuidance: {
      Low: '1-2 water-soaked spots with faint white sporulation on isolated leaves.',
      Moderate: 'Multiple dark lesions on foliage with greasy brown stem cankers.',
      High: 'Widespread rapid leaf blight covering >25% canopy with rotting fruit lesions.',
      Critical: 'Complete canopy collapse, foul-smelling rotting foliage across the field.'
    }
  },

  'Tomato___Leaf_Mold': {
    crop: 'Tomato',
    disease: 'Tomato Leaf Mold',
    rawClass: 'Tomato___Leaf_Mold',
    isHealthy: false,
    pathogenType: 'Fungal (Passalora fulva / Cladosporium fulvum)',
    description: 'A fungal disease primarily affecting tomatoes in greenhouses, polyhouses, and humid field canopies, causing leaf yellowing and moldy undersides.',
    visualSymptoms: 'Pale green to bright yellow chlorotic patches on the upper leaf surface, with corresponding velvety olive-green to grayish-brown mold on the lower leaf surface.',
    likelyCauses: 'High relative humidity (>85%) and moderate temperatures (21-24°C) with poor canopy ventilation.',
    immediateActions: [
      'Increase greenhouse/tunnel ventilation and open sidewalls to reduce humidity below 80%.',
      'Prune lower infected leaves to enhance air circulation.'
    ],
    organicManagement: [
      'Apply copper sulfate, copper octanoate, or potassium bicarbonate.',
      'Use bio-fungicides with Bacillus subtilis or Trichoderma.'
    ],
    chemicalManagement: [
      'Apply fungicides such as Chlorothalonil, Mancozeb, Difenoconazole, or Azoxystrobin.'
    ],
    prevention: [
      'Grow leaf mold-resistant tomato hybrids (carrying Cf resistance genes).',
      'Maintain horizontal airflow fans in protected structures.',
      'Avoid high planting densities.'
    ],
    irrigationConsiderations: 'Irrigate via drip in the morning; keep greenhouse floors dry.',
    imageQualityGuidance: 'Photograph both the yellow upper leaf spots and the velvety olive-green lower mold.',
    severityGuidance: {
      Low: 'A few yellow spots on upper surface with faint olive mold underneath.',
      Moderate: 'Yellow patches spreading across middle canopy with dense velvety mold.',
      High: 'Extensive leaf yellowing, curling, and browning across the canopy.',
      Critical: 'Severe defoliation reducing fruit size and quality.'
    }
  },

  'Tomato___Septoria_leaf_spot': {
    crop: 'Tomato',
    disease: 'Tomato Septoria Leaf Spot',
    rawClass: 'Tomato___Septoria_leaf_spot',
    isHealthy: false,
    pathogenType: 'Fungal (Septoria lycopersici)',
    description: 'A destructive foliar fungal disease that causes severe lower canopy defoliation, progressing upward and exposing fruit to sunscald.',
    visualSymptoms: 'Numerous small (2-3 mm) circular spots with dark brown margins and sunken grayish-white centers. Tiny black specks (pycnidia) are visible in the center of mature spots.',
    likelyCauses: 'Warm temperatures (20-26°C) and extended wet periods from rain, dew, or overhead sprinklers.',
    immediateActions: [
      'Prune and discard infected lower leaves.',
      'Mulch soil around plants to prevent rain-splash of fungal spores from soil.'
    ],
    organicManagement: [
      'Apply fixed copper fungicides (copper hydroxide) at 7-day intervals.',
      'Spray bio-fungicides containing Bacillus amyloliquefaciens.'
    ],
    chemicalManagement: [
      'Preventative fungicides: Chlorothalonil or Mancozeb applied upon appearance of lower leaf spots.',
      'Systemic fungicides: Azoxystrobin, Pyraclostrobin, or Difenoconazole.'
    ],
    prevention: [
      'Practice 3-year crop rotation away from solanaceous plants.',
      'Stake, trellis, and mulch plants to prevent soil contact.',
      'Destroy crop residue after harvest.'
    ],
    irrigationConsiderations: 'Strictly use drip irrigation under mulch; keep foliage completely dry.',
    imageQualityGuidance: 'Photograph small circular spots showing dark borders and grayish centers with tiny black specks.',
    severityGuidance: {
      Low: 'Scattered small circular spots on the lowest 2-3 leaves.',
      Moderate: 'Numerous spots spreading up into middle canopy; lower leaves turning yellow.',
      High: 'Heavy defoliation on lower and middle canopy; leaves withering and falling.',
      Critical: 'Severe complete canopy loss leaving only top leaves and sun-scalded fruit.'
    }
  },

  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    crop: 'Tomato',
    disease: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    rawClass: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    isHealthy: false,
    pathogenType: 'Viral (Begomovirus transmitted by Whiteflies / Bemisia tabaci)',
    description: 'A devastating viral disease transmitted by the silverleaf whitefly, causing severe plant stunting, yellowing, upward leaf cupping, and complete yield loss.',
    visualSymptoms: 'Leaves are significantly reduced in size, curled upwards (cupped), with bright yellow (chlorotic) margins. Plants become severely stunted with a bushy appearance, and flower drop occurs.',
    likelyCauses: 'High populations of the vector whitefly (Bemisia tabaci) under warm, dry weather conditions.',
    immediateActions: [
      'CRITICAL: Immediately rogue out and bag infected plants to eliminate viral reservoirs.',
      'Install yellow sticky traps (1 trap per 100 m²) to monitor and capture whiteflies.'
    ],
    organicManagement: [
      'Apply insecticidal soap, neem oil (1%), or horticultural mineral oils to suppress whitefly nymphs.',
      'Spray entomopathogenic fungi like Beauveria bassiana or Verticillium lecanii for biological whitefly control.',
      'Use 40-50 mesh insect-proof netting in nursery seedling beds.'
    ],
    chemicalManagement: [
      'Target whitefly vector with systemic insecticides: Imidacloprid, Thiamethoxam, Acetamiprid, Spiromesifen, or Pyriproxyfen.',
      'Rotate chemical IRAC insecticide classes to avoid whitefly pesticide resistance.'
    ],
    prevention: [
      'Plant TYLCV-resistant tomato hybrids (carrying Ty-1, Ty-2, or Ty-3 resistance genes).',
      'Use reflective silver plastic mulch to repel incoming whiteflies.',
      'Maintain a 30-day host-free period between cropping seasons.'
    ],
    irrigationConsiderations: 'Maintain steady drip irrigation to avoid drought stress which exacerbates viral stunting.',
    imageQualityGuidance: 'Photograph the stunted shoot tip showing upward leaf curling and yellow margins.',
    severityGuidance: {
      Low: 'Mild upward cupping and yellowing on top shoot of isolated plant.',
      Moderate: 'Distinct yellow leaf curl on top third of canopy with early stunting.',
      High: 'Severely stunted bushy growth with yellow cupped leaves across multiple plants; blossoms aborting.',
      Critical: 'Widespread field infection with total cessation of fruit production.'
    }
  },

  'Tomato___Tomato_mosaic_virus': {
    crop: 'Tomato',
    disease: 'Tomato Mosaic Virus (ToMV)',
    rawClass: 'Tomato___Tomato_mosaic_virus',
    isHealthy: false,
    pathogenType: 'Viral (Tobamovirus mechanically transmitted)',
    description: 'A highly contagious and stable plant virus mechanically transmitted by tools, hands, clothing, and infected seeds, causing mottled leaves and unmarketable fruit.',
    visualSymptoms: 'Alternating light and dark green mosaic or mottling on leaves, accompanied by leaf distortion, blistering, and "shoestring" fern-like leaves. Plants may be stunted.',
    likelyCauses: 'Mechanical transmission during grafting, pruning, tying, or transplanting; contaminated seed or tobacco products.',
    immediateActions: [
      'Immediately rogue out and destroy infected plants; do not compost.',
      'Wash hands thoroughly with soap and water and sanitize all pruning tools with 20% non-fat dry milk or 10% trisodium phosphate (TSP) solution.'
    ],
    organicManagement: [
      'Apply skim milk or non-fat dry milk sprays during handling to inactivate viral particles on leaf surfaces.',
      'Use certified organic seed with proven negative virus assay.'
    ],
    chemicalManagement: [
      'No chemical viricides exist for plant viral infections. Control relies strictly on hygiene, tool sanitation, and genetic resistance.'
    ],
    prevention: [
      'Plant ToMV-resistant tomato varieties (carrying Tm-1, Tm-2, or Tm-2^2 resistance genes).',
      'Disinfect seed via hot water or trisodium phosphate treatment.',
      'Enforce strict worker hygiene: forbid smoking or tobacco use in tomato fields.'
    ],
    irrigationConsiderations: 'Drip irrigation; avoid touching or brushing against wet plants during maintenance.',
    imageQualityGuidance: 'Photograph the light/dark green mosaic pattern and leaf blistering in even lighting.',
    severityGuidance: {
      Low: 'Mild light/dark green mottling on few upper leaves.',
      Moderate: 'Clear mosaic patterning with slight leaf distortion and puckering.',
      High: 'Extensive mosaic, leaf distortion (shoestring effect), and plant stunting.',
      Critical: 'Severe stunting with internal brown necrosis in developing green fruit.'
    }
  },

  'Tomato___healthy': {
    crop: 'Tomato',
    disease: 'Tomato Healthy',
    rawClass: 'Tomato___healthy',
    isHealthy: true,
    pathogenType: 'None (Healthy Foliage)',
    description: 'Healthy tomato canopy with vibrant deep-green compound leaves, robust stems, and active flowering and fruit development.',
    visualSymptoms: 'Uniform green foliage without leaf spots, chlorosis, curling, or water-soaked lesions.',
    preventiveCropCare: [
      'Stake or trellis vines to keep foliage off the ground.',
      'Maintain consistent calcium and water supply to avoid Blossom End Rot.',
      'Prune suckers and lowest foliage for optimal air circulation.'
    ],
    monitoringGuidance: 'Scout foliage twice weekly for early signs of blight, bacterial spot, whiteflies, and hornworms.',
    irrigationGuidance: 'Apply 25-40 mm water per week via drip irrigation underneath plastic mulch.',
    imageQualityGuidance: 'Capture fully unfurled compound leaves in clear natural light.'
  }
};

/**
 * Retrieve comprehensive agronomic knowledge base entry by raw class name or disease name
 */
function getDiseaseKnowledge(rawClassOrDisease) {
  if (!rawClassOrDisease) {
    return getFallbackEntry('Unknown');
  }

  // Exact rawClass match
  if (KNOWLEDGE_BASE[rawClassOrDisease]) {
    return KNOWLEDGE_BASE[rawClassOrDisease];
  }

  // Match by normalized disease string or partial rawClass
  const normalizedSearch = rawClassOrDisease.toLowerCase().replace(/[\s_]+/g, '');
  for (const [key, entry] of Object.entries(KNOWLEDGE_BASE)) {
    const normKey = key.toLowerCase().replace(/[\s_]+/g, '');
    const normDisease = entry.disease.toLowerCase().replace(/[\s_]+/g, '');
    if (normKey === normalizedSearch || normDisease === normalizedSearch || normKey.includes(normalizedSearch)) {
      return entry;
    }
  }

  return getFallbackEntry(rawClassOrDisease);
}

/**
 * Fallback entry when an unknown or missing class is requested
 */
function getFallbackEntry(query) {
  return {
    crop: 'General Crop',
    disease: typeof query === 'string' ? query.replace(/___/g, ' ').replace(/_/g, ' ') : 'Unspecified Condition',
    rawClass: typeof query === 'string' ? query : 'General___Unknown',
    isHealthy: false,
    pathogenType: 'Unspecified',
    description: 'Field foliar condition analyzed by AgriSmart AI. Maintain standard agronomic monitoring and good hygiene.',
    visualSymptoms: 'Foliar discoloration or stress symptoms visible on leaf surface.',
    likelyCauses: 'Environmental stress, nutrient imbalance, or foliar pathogen.',
    immediateActions: [
      'Isolate symptomatic plants if symptoms spread rapidly.',
      'Consult local agricultural extension specialists with a fresh physical leaf sample.'
    ],
    organicManagement: [
      'Apply preventative bio-stimulants or certified neem-based formulations.'
    ],
    chemicalManagement: [
      'Consult local Krishi Vigyan Kendra (KVK) or extension officer for registered chemical remedies.'
    ],
    prevention: [
      'Maintain balanced crop nutrition, proper plant spacing, and clean crop rotation.'
    ],
    irrigationConsiderations: 'Use drip irrigation at root zone; avoid prolonged foliar wetness.',
    imageQualityGuidance: 'Capture a close-up, sharp photo of the affected leaf in bright, diffuse daylight.'
  };
}

module.exports = {
  SAFETY_DISCLAIMER,
  KNOWLEDGE_BASE,
  getDiseaseKnowledge,
  getFallbackEntry
};
