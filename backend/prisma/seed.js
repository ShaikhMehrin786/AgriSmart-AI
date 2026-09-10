// AgriSmart AI Database Seeding Script
// Populates PostgreSQL with verified crop and disease monographs

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AgriSmart PostgreSQL Database Seeding...');

  // 1. Tomato
  const tomato = await prisma.crop.upsert({
    where: { name: 'Tomato' },
    update: {},
    create: {
      name: 'Tomato',
      scientificName: 'Solanum lycopersicum',
      description: 'Major commercial vegetable crop cultivated across all states in India.',
      waterRequirementLevel: 'Medium',
      diseases: {
        create: [
          {
            name: 'Tomato Early Blight',
            scientificName: 'Alternaria solani',
            symptoms: 'Concentric dark brown rings with target-board appearance on older leaves, yellow halo surrounding spots.',
            severityDefault: 'Moderate',
            organicTreatment: 'Spray 0.5% neem oil solution or Trichoderma viride. Prune lower diseased foliage.',
            chemicalTreatment: 'Apply Mancozeb 75% WP @ 2g/liter or Chlorothalonil 75% WP @ 2g/liter water.',
            preventiveMeasures: 'Ensure 60cm plant spacing, practice 3-year crop rotation with non-solanaceous crops, avoid overhead sprinkler irrigation.',
            optimalTempMin: 24.0,
            optimalTempMax: 29.0,
            optimalHumidityMin: 80.0
          },
          {
            name: 'Tomato Late Blight',
            scientificName: 'Phytophthora infestans',
            symptoms: 'Water-soaked irregular pale green lesions turning dark brown rapidly with white fuzzy fungal mold on leaf undersides.',
            severityDefault: 'Critical',
            organicTreatment: 'Spray Copper hydroxide @ 2.5g/liter or Bordeaux mixture (1%). Immediately destroy infected debris.',
            chemicalTreatment: 'Apply Metalaxyl + Mancozeb (Ridomil MZ) @ 2.5g/liter or Dimethomorph @ 1.5g/liter.',
            preventiveMeasures: 'Improve drainage, avoid wetting leaves during evening hours, plant resistant hybrids.',
            optimalTempMin: 18.0,
            optimalTempMax: 22.0,
            optimalHumidityMin: 90.0
          },
          {
            name: 'Tomato Healthy',
            scientificName: 'N/A',
            symptoms: 'Foliage is vibrant green, firm, free of necrotic lesions, spots, or chlorosis.',
            severityDefault: 'None',
            organicTreatment: 'Apply regular vermicompost and microbial biostimulants to maintain plant immunity.',
            chemicalTreatment: 'None needed.',
            preventiveMeasures: 'Maintain regular soil moisture monitoring and periodic preventative scouting.',
            optimalTempMin: 20.0,
            optimalTempMax: 30.0,
            optimalHumidityMin: 50.0
          }
        ]
      }
    }
  });

  // 2. Potato
  const potato = await prisma.crop.upsert({
    where: { name: 'Potato' },
    update: {},
    create: {
      name: 'Potato',
      scientificName: 'Solanum tuberosum',
      description: 'Crucial food security tuber crop in northern and eastern Indian plains.',
      waterRequirementLevel: 'Medium',
      diseases: {
        create: [
          {
            name: 'Potato Late Blight',
            scientificName: 'Phytophthora infestans',
            symptoms: 'Water-soaked dark lesions spreading rapidly across entire canopy, tuber rot in storage.',
            severityDefault: 'Critical',
            organicTreatment: 'Apply Bordeaux mixture 1% prophylactically. Destroy infected haulms.',
            chemicalTreatment: 'Spray Cymoxanil 8% + Mancozeb 64% WP @ 2.5g/liter water.',
            preventiveMeasures: 'Use certified disease-free seed tubers; practice earthing up to protect developing tubers.',
            optimalTempMin: 15.0,
            optimalTempMax: 20.0,
            optimalHumidityMin: 85.0
          },
          {
            name: 'Potato Early Blight',
            scientificName: 'Alternaria solani',
            symptoms: 'Small scattered brown spots on leaves with concentric ring patterns.',
            severityDefault: 'Moderate',
            organicTreatment: 'Spray bio-fungicides like Pseudomonas fluorescens @ 5g/liter.',
            chemicalTreatment: 'Mancozeb 75% WP @ 2.0g/liter or Propineb 70% WP @ 2g/liter.',
            preventiveMeasures: 'Adequate potassium fertilization, destroy harvest residue.',
            optimalTempMin: 22.0,
            optimalTempMax: 28.0,
            optimalHumidityMin: 75.0
          },
          {
            name: 'Potato Healthy',
            scientificName: 'N/A',
            symptoms: 'Uniform emerald leaves, robust stems, no spotting or wilting.',
            severityDefault: 'None',
            organicTreatment: 'Maintain balanced N-P-K and micronutrient sprays.',
            chemicalTreatment: 'None required.',
            preventiveMeasures: 'Optimal irrigation scheduling; do not water-log ridges.',
            optimalTempMin: 18.0,
            optimalTempMax: 25.0,
            optimalHumidityMin: 60.0
          }
        ]
      }
    }
  });

  // 3. Apple
  const apple = await prisma.crop.upsert({
    where: { name: 'Apple' },
    update: {},
    create: {
      name: 'Apple',
      scientificName: 'Malus domestica',
      description: 'Temperate orchard crop prevalent in Jammu & Kashmir, Himachal Pradesh, and Uttarakhand.',
      waterRequirementLevel: 'High',
      diseases: {
        create: [
          {
            name: 'Apple Scab',
            scientificName: 'Venturia inaequalis',
            symptoms: 'Olive-green to velvety dark brown lesions on leaves and fruit, causing leaf distortion and premature defoliation.',
            severityDefault: 'High',
            organicTreatment: 'Spray sulfur-based formulations or potassium bicarbonate.',
            chemicalTreatment: 'Apply Difenoconazole 25% EC @ 0.5ml/liter or Dodine 65% WP @ 1g/liter.',
            preventiveMeasures: 'Rake and burn fallen leaves before winter; prune orchard canopy for air penetration.',
            optimalTempMin: 16.0,
            optimalTempMax: 24.0,
            optimalHumidityMin: 85.0
          },
          {
            name: 'Apple Cedar Rust',
            scientificName: 'Gymnosporangium juniperi-virginianae',
            symptoms: 'Bright yellow-orange spots on upper leaf surfaces that develop tube-like projections on lower surfaces.',
            severityDefault: 'Moderate',
            organicTreatment: 'Neem-based botanical fungistat.',
            chemicalTreatment: 'Myclobutanil @ 1ml/liter water.',
            preventiveMeasures: 'Eradicate alternate host cedar/juniper trees in orchard vicinity.',
            optimalTempMin: 18.0,
            optimalTempMax: 25.0,
            optimalHumidityMin: 80.0
          }
        ]
      }
    }
  });

  console.log(`✅ Seeded ${[tomato.name, potato.name, apple.name].join(', ')} and their disease catalogs successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
