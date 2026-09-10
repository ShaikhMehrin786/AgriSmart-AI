// Centralized Global Error Handler
function errorHandler(err, req, res, next) {
  console.error('Unhandled Server Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum allowed size is 10 MB.' });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error occurred while processing request.'
  });
}

module.exports = errorHandler;
