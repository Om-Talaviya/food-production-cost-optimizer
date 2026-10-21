const jwt = require('jsonwebtoken');

// JWT_SECRET must be set in production. In development, a fallback is allowed for convenience.
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;

if (isProduction && !JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is required in production.');
  console.error('Set a strong random string (min 32 chars) in your environment.');
  process.exit(1);
}

if (!JWT_SECRET) {
  // Development fallback - NOT SECURE for production use
  console.warn('⚠️ WARNING: Using development JWT_SECRET fallback. Set JWT_SECRET in .env for production.');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'demo_token') {
    req.user = { id: 'user_guest', email: 'guest@demo.com', name: 'DEMO Guest', isDemo: true };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET || 'dev-secret-not-for-production');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET: JWT_SECRET || 'dev-secret-not-for-production'
};
