const app = require('./app');
const { PORT } = require('./config/env');
const { initOnnxSession } = require('./config/onnxConfig');

async function startServer() {
  // Pre-load ONNX model weights and class labels into memory on startup
  await initOnnxSession();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
