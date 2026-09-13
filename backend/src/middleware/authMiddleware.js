const { verifyToken } = require('../utils/jwt');

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
    req.user = { id: decoded.id, role: decoded.role || 'user' };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * e.g. router.get('/admin', protect, authorize('admin', 'agronomist'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role || 'user'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
