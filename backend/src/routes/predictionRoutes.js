const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handlePrediction, getPredictionHistory } = require('../controllers/predictionController');

// Disease prediction from uploaded leaf image
router.post('/', upload.single('image'), authenticateToken, handlePrediction);

// Fetch prediction history for authenticated farmer
router.get('/history', authenticateToken, getPredictionHistory);

module.exports = router;
