// Authentication Controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

async function register(req, res, next) {
  try {
    const { name, email, password, phone, locationName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        locationName
      }
    });

    const secret = process.env.JWT_SECRET || 'agrismart_super_secure_jwt_secret_change_in_production';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      message: 'Farmer account registered successfully.',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const secret = process.env.JWT_SECRET || 'agrismart_super_secure_jwt_secret_change_in_production';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, location: user.locationName }
    });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, locationName: true, createdAt: true }
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile
};
