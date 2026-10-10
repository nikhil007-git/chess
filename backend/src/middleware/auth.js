import { verifyToken } from '../utils/token.js';

// Middleware to enforce active admin authentication (via session cookie or Bearer token)
export const requireAdmin = (req, res, next) => {
  // 1. Check session
  if (req.session && req.session.admin) {
    req.admin = req.session.admin;
    return next();
  }

  // 2. Check Authorization Bearer header (supports cross-origin / third-party-cookie-blocked browsers)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifyToken(token);
    if (verified) {
      req.admin = verified;
      if (req.session) {
        req.session.admin = verified;
      }
      return next();
    }
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid admin authentication required to perform this action.',
  });
};
