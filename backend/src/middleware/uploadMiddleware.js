// Multer Image Upload Middleware
// Enforces 10MB limit and whitelisted image formats
const multer = require('multer');

// Store in memory for instant tensor ingestion
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload JPEG, PNG, or WebP images only.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum
  }
});

module.exports = upload;
