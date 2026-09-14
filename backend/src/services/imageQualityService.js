// Deterministic Image Quality Assessment Service (Sharp)
// Non-blocking advisory check for foliar disease diagnostics
const sharp = require('sharp');

/**
 * Assess photographic quality of an uploaded crop leaf image.
 * Uses deterministic statistics: dimensions, luminance, contrast standard deviation,
 * and Laplacian convolution for sharpness/blur estimation.
 *
 * @param {Buffer} imageBuffer - Raw image buffer
 * @returns {Promise<{
 *   score: number,
 *   level: 'GOOD' | 'FAIR' | 'POOR',
 *   issues: string[],
 *   metrics: { width: number, height: number, brightness: number, contrast: number, sharpness: number } | null
 * }>}
 */
async function assessImageQuality(imageBuffer) {
  try {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
      return {
        score: 0.5,
        level: 'FAIR',
        issues: ['INVALID_BUFFER'],
        metrics: null
      };
    }

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    const issues = [];
    let score = 1.0;

    // 1. Dimensions check (< 100px is insufficient for foliar feature resolution)
    if (width < 100 || height < 100) {
      issues.push('IMAGE_TOO_SMALL');
      score -= 0.40;
    } else if (width < 180 || height < 180) {
      issues.push('IMAGE_LOW_RESOLUTION');
      score -= 0.15;
    }

    // 2. Brightness / Luminance & Contrast via Channel Statistics
    const stats = await image.stats();
    const rMean = stats.channels[0]?.mean || 0;
    const gMean = stats.channels[1]?.mean || 0;
    const bMean = stats.channels[2]?.mean || 0;
    const luminance = +(0.299 * rMean + 0.587 * gMean + 0.114 * bMean).toFixed(1);

    const rStd = stats.channels[0]?.stdev || 0;
    const gStd = stats.channels[1]?.stdev || 0;
    const bStd = stats.channels[2]?.stdev || 0;
    const avgStd = +((rStd + gStd + bStd) / 3).toFixed(1);

    if (luminance < 35) {
      issues.push('TOO_DARK');
      score -= 0.35;
    } else if (luminance > 230) {
      issues.push('TOO_BRIGHT');
      score -= 0.35;
    }

    if (avgStd < 12) {
      issues.push('LOW_CONTRAST');
      score -= 0.25;
    }

    // 3. Sharpness / Blur estimation via 3x3 Laplacian kernel
    const laplacianKernel = {
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
    };
    const lapStats = await sharp(imageBuffer)
      .grayscale()
      .convolve(laplacianKernel)
      .stats();
    const sharpness = +(lapStats.channels[0]?.stdev || 0).toFixed(1);

    if (sharpness < 8.0 && !issues.includes('LOW_CONTRAST')) {
      issues.push('LIKELY_BLURRY');
      score -= 0.25;
    }

    // Clamp score to [0.0, 1.0]
    score = Math.max(0.0, Math.min(1.0, +score.toFixed(2)));

    // Categorize Level
    let level = 'GOOD';
    if (score < 0.50 || issues.includes('IMAGE_TOO_SMALL') || issues.length >= 2) {
      level = 'POOR';
    } else if (score < 0.80 || issues.length === 1) {
      level = 'FAIR';
    } else {
      level = 'GOOD';
    }

    return {
      score,
      level,
      issues,
      metrics: {
        width,
        height,
        brightness: luminance,
        contrast: avgStd,
        sharpness
      }
    };
  } catch (err) {
    console.warn('Image quality assessment fallback:', err.message);
    return {
      score: 0.7,
      level: 'FAIR',
      issues: [],
      metrics: null
    };
  }
}

module.exports = { assessImageQuality };
