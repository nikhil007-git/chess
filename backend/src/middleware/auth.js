// Middleware to enforce active admin session
export const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.admin) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid admin authentication required to perform this action.',
    });
  }
  next();
};
