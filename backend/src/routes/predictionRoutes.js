const express = require('express');
const { createPrediction, getHistory, getPredictionById } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/').post(protect, upload.single('image'), createPrediction);
router.route('/history').get(protect, getHistory);
router.route('/:id').get(protect, getPredictionById);

module.exports = router;
