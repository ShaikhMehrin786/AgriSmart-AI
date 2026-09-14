// Sustainability Index Calculator Service
// Scale: 0 - 100 based on Water, Bio-control, Disease Prevention, and Resource Optimization
// Formula: Score = (0.35 * W_eff) + (0.30 * P_bio) + (0.20 * D_prev) + (0.15 * R_opt)

/**
 * Calculates deterministic farm sustainability score and metrics breakdown.
 *
 * @param {Object} params
 * @param {number} [params.waterEfficiency] - Weather-aligned irrigation efficiency (0-100)
 * @param {number} [params.bioControlRatio] - Organic / Biological pesticide ratio (0-100)
 * @param {number} [params.diseasePrevention] - Timely scouting and prevention score (0-100)
 * @param {number} [params.resourceOptimization] - Soil retention and balanced input score (0-100)
 * @returns {Object} Structured sustainability score breakdown with grade and actionable tips
 */
function calculateSustainabilityScore(params = {}) {
  const wEff = Math.max(0, Math.min(100, Number(params.waterEfficiency ?? 90)));
  const pBio = Math.max(0, Math.min(100, Number(params.bioControlRatio ?? 85)));
  const dPrev = Math.max(0, Math.min(100, Number(params.diseasePrevention ?? 80)));
  const rOpt = Math.max(0, Math.min(100, Number(params.resourceOptimization ?? 88)));

  const rawScore = (0.35 * wEff) + (0.30 * pBio) + (0.20 * dPrev) + (0.15 * rOpt);
  const score = Math.round(rawScore);

  let grade = 'A';
  let level = 'Excellent Ecological Management';

  if (score >= 85) {
    grade = 'A';
    level = 'Excellent Ecological Management';
  } else if (score >= 70) {
    grade = 'B';
    level = 'Good Sustainable Practices';
  } else if (score >= 55) {
    grade = 'C';
    level = 'Moderate Sustainability (Action Needed)';
  } else if (score >= 40) {
    grade = 'D';
    level = 'Sub-Optimal Resource Management';
  } else {
    grade = 'F';
    level = 'High Environmental Risk';
  }

  const factors = [
    { name: 'Water Efficiency (Weather-Aligned)', score: wEff, max: 100, weight: '35%' },
    { name: 'Organic & Bio-Control Adoption', score: pBio, max: 100, weight: '30%' },
    { name: 'Disease Prevention & Early Scouting', score: dPrev, max: 100, weight: '20%' },
    { name: 'Resource & Soil Health Optimization', score: rOpt, max: 100, weight: '15%' }
  ];

  return {
    score,
    grade,
    level,
    factors,
    summary: Your farm achieves a Sustainability Index of /100 (, Grade ).
  };
}

module.exports = { calculateSustainabilityScore };
