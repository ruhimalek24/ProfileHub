const jwt = require('jsonwebtoken');
const { COOKIE_NAME, cookieOptions } = require('../config/cookie');

// Protects routes. Reads the JWT from the HttpOnly cookie.
// On success, sets req.userId for the next handler.
function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to continue.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    // Bad or old cookie: remove it so the browser stops sending it.
    res.clearCookie(COOKIE_NAME, cookieOptions);

    const message =
      err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid session. Please log in again.';

    return res.status(401).json({ success: false, message });
  }
}

module.exports = requireAuth;
