// Very simple placeholder auth middleware.
// In a real app, replace this with your JWT/session validation logic.
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      },
    });
  }
  // You could decode/verify token here and attach user to req.user
  return next();
}

module.exports = { authMiddleware };

