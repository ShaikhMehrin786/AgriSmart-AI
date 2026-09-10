// JWT Authentication Middleware
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For prototype demo convenience, if no token, allow a mock guest user
    req.user = { id: 'demo-guest-user-uuid', email: 'farmer@agrismart.ai', name: 'Demo Farmer' };
    return next();
  }

  const secret = process.env.JWT_SECRET || 'super_secret_key';

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired authentication token.' });
    }
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken
};
