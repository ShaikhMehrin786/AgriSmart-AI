// Service that wraps ML model inference
// In a real scenario, this would use onnxruntime-node.
// Since we don't have the ONNX model locally, we return a mock prediction structured properly.

const predictDisease = async (imagePath) => {
  // Simulate ML processing time
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        disease: 'Late Blight',
        confidence: 94.2,
        crop: 'Potato',
        severity: 'Moderate',
        heatmapPath: imagePath // mock heatmap as original image for now
      });
    }, 1500);
  });
};

module.exports = { predictDisease };
