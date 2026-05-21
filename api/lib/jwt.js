const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nuwatch_dev_secret';

/**
 * Verifica el token JWT en el header Authorization.
 * Devuelve { valid: true, user } o { valid: false, error }.
 */
function verifyToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return { valid: false, error: 'No token provided' };
  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { valid: true, user };
  } catch (e) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}

/**
 * Genera un token JWT de sesión (8 horas de duración).
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

/**
 * Genera un token de reset temporal (1 hora de duración).
 */
function generateResetToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { verifyToken, generateToken, generateResetToken };
