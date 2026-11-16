// Login lifetime. Token and cookie must expire together, so both live here.
const TOKEN_EXPIRES_IN = '2h'; // used by jwt.sign()
const COOKIE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 7,200,000 ms = 2 hours

// Settings for the JWT cookie. Same options must be used to set and clear it.
const COOKIE_NAME = 'token';

const cookieOptions = {
  httpOnly: true, // JavaScript in the browser cannot read it
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax', // not sent on cross-site POSTs (CSRF protection)
  path: '/',
};

module.exports = { COOKIE_NAME, cookieOptions, TOKEN_EXPIRES_IN, COOKIE_MAX_AGE_MS };
