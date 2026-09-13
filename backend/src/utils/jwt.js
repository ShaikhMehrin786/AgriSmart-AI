const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '30d' });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
