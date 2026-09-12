const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const srcDir = path.join(backendDir, 'src');

const dirs = [
  'prisma',
  'src/config',
  'src/controllers',
  'src/middleware',
  'src/routes',
  'src/services',
  'src/utils',
  'uploads'
];

dirs.forEach(d => {
  const p = path.join(backendDir, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// .env
fs.writeFileSync(path.join(backendDir, '.env'), `PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="supersecretjwtkeyforagrismart123"
WEATHER_API_KEY="mock_weather_key"
AI_PROVIDER="MOCK"
`);

// prisma/schema.prisma
fs.writeFileSync(path.join(backendDir, 'prisma', 'schema.prisma'), `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // Change to "postgresql" for production
  url      = env("DATABASE_URL")
}

model User {
  id          String       @id @default(uuid())
  name        String
  email       String       @unique
  password    String
  location    String?
  phone       String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  predictions Prediction[]
}

model Prediction {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  imagePath   String
  disease     String
  confidence  Float
  crop        String
  severity    String
  heatmapPath String?
  createdAt   DateTime @default(now())
}
`);

// src/config/env.js
fs.writeFileSync(path.join(srcDir, 'config', 'env.js'), `require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
};
`);

// src/utils/jwt.js
fs.writeFileSync(path.join(srcDir, 'utils', 'jwt.js'), `const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
`);

// src/middleware/authMiddleware.js
fs.writeFileSync(path.join(srcDir, 'middleware', 'authMiddleware.js'), `const { verifyToken } = require('../utils/jwt');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
`);

// src/middleware/uploadMiddleware.js
fs.writeFileSync(path.join(srcDir, 'middleware', 'uploadMiddleware.js'), `const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, \`\${Date.now()}-\${file.originalname}\`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error('Images only!'));
  }
});

module.exports = upload;
`);

// src/services/mlInferenceService.js
fs.writeFileSync(path.join(srcDir, 'services', 'mlInferenceService.js'), `// Service that wraps ML model inference
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
`);

// src/controllers/authController.js
fs.writeFileSync(path.join(srcDir, 'controllers', 'authController.js'), `const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;
    
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone, location },
    });

    const token = generateToken(user.id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, location: user.location, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id);
      res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, location: user.location, phone: user.phone }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, phone: true, location: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getProfile };
`);

// src/controllers/predictionController.js
fs.writeFileSync(path.join(srcDir, 'controllers', 'predictionController.js'), `const { PrismaClient } = require('@prisma/client');
const { predictDisease } = require('../services/mlInferenceService');
const prisma = new PrismaClient();

const createPrediction = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const imagePath = req.file.path;
    const result = await predictDisease(imagePath);

    const prediction = await prisma.prediction.create({
      data: {
        userId: req.user.id,
        imagePath,
        disease: result.disease,
        confidence: result.confidence,
        crop: result.crop,
        severity: result.severity,
        heatmapPath: result.heatmapPath
      }
    });

    res.status(201).json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPredictionById = async (req, res) => {
  try {
    const prediction = await prisma.prediction.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found' });
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPrediction, getHistory, getPredictionById };
`);

// src/controllers/advisoryController.js
fs.writeFileSync(path.join(srcDir, 'controllers', 'advisoryController.js'), `
const getWeather = async (req, res) => {
  res.json({
    success: true,
    data: { temperature: 24, humidity: 65, rainProbability: 30, windSpeed: 12, condition: 'Sunny' }
  });
};

const getIrrigation = async (req, res) => {
  res.json({
    success: true,
    data: {
      action: 'Delay Irrigation',
      reason: 'Soil moisture is sufficient and rainfall probability is high in the next 24 hours.',
      waterRequired: '0 L/m²'
    }
  });
};

const getSustainability = async (req, res) => {
  res.json({
    success: true,
    data: {
      score: 85, level: 'Excellent',
      factors: [
        { name: 'Water Efficiency', score: 92 },
        { name: 'Disease Management', score: 78 }
      ]
    }
  });
};

module.exports = { getWeather, getIrrigation, getSustainability };
`);

// src/controllers/assistantController.js
fs.writeFileSync(path.join(srcDir, 'controllers', 'assistantController.js'), `
const chat = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });
  
  setTimeout(() => {
    res.json({
      success: true,
      data: { reply: 'Based on your current crop data and local weather, I suggest reviewing your irrigation schedule. The recent soil moisture readings indicate adequate hydration.' }
    });
  }, 1000);
};

module.exports = { chat };
`);

// Routes
fs.writeFileSync(path.join(srcDir, 'routes', 'authRoutes.js'), `const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

module.exports = router;
`);

fs.writeFileSync(path.join(srcDir, 'routes', 'predictionRoutes.js'), `const express = require('express');
const { createPrediction, getHistory, getPredictionById } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/').post(protect, upload.single('image'), createPrediction);
router.route('/history').get(protect, getHistory);
router.route('/:id').get(protect, getPredictionById);

module.exports = router;
`);

fs.writeFileSync(path.join(srcDir, 'routes', 'advisoryRoutes.js'), `const express = require('express');
const { getWeather, getIrrigation, getSustainability } = require('../controllers/advisoryController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/weather', protect, getWeather);
router.post('/irrigation', protect, getIrrigation);
router.get('/sustainability-score', protect, getSustainability);

module.exports = router;
`);

fs.writeFileSync(path.join(srcDir, 'routes', 'assistantRoutes.js'), `const express = require('express');
const { chat } = require('../controllers/assistantController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/chat', protect, chat);

module.exports = router;
`);

// app.js & server.js
fs.writeFileSync(path.join(srcDir, 'app.js'), `const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'AgriSmart AI backend is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/assistant', assistantRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

module.exports = app;
`);

fs.writeFileSync(path.join(srcDir, 'server.js'), `const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`);

console.log('Backend scaffolding complete.');
