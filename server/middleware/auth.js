import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'etiraf-secret-key-2024';

// JWT token yarat
export const tokenYarat = (userId, rol) => {
  return jwt.sign(
    { userId, rol },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Token yoxla (middleware)
export const authYoxla = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ xəta: 'Giriş tələb olunur' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-şifrə');

    if (!user || !user.aktiv) {
      return res.status(401).json({ xəta: 'İstifadəçi tapılmadı' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ xəta: 'Etibarsız token' });
  }
};

// Admin yoxla
export const adminYoxla = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ xəta: 'Admin icazəsi tələb olunur' });
  }
  next();
};

// Moderator və ya Admin yoxla
export const moderatorYoxla = (req, res, next) => {
  if (req.user.rol !== 'admin' && req.user.rol !== 'moderator') {
    return res.status(403).json({ xəta: 'Moderator icazəsi tələb olunur' });
  }
  next();
};

// Jeton kifayət edirmi yoxla
export const jetonYoxla = (lazımOlanJeton) => {
  return (req, res, next) => {
    if (req.user.jeton < lazımOlanJeton) {
      return res.status(403).json({ 
        xəta: 'Kifayət qədər jeton yoxdur',
        lazım: lazımOlanJeton,
        mövcud: req.user.jeton
      });
    }
    next();
  };
};
