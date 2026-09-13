const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();

// Security headers with crossOriginResourcePolicy for public image serving
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Apply general API rate limiting to all /api endpoints
app.use('/api', apiLimiter);

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
