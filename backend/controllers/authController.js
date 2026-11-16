const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const {
  COOKIE_NAME,
  cookieOptions,
  TOKEN_EXPIRES_IN,
  COOKIE_MAX_AGE_MS,
} = require('../config/cookie');

const SALT_ROUNDS = 10;

// POST /api/auth/signup
async function signup(req, res) {
  const { name, email, password } = req.body;

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'This email is already registered.',
    });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
  } catch (err) {
    // Two signups with the same email at the same moment.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
      });
    }
    throw err;
  }

  res.status(201).json({
    success: true,
    message: 'Account created! Please log in.',
  });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];

  // No account with this email. 404 (not 401) so the frontend
  // does not treat it as an expired session.
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found. Please register first.',
    });
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please try again.',
    });
  }

  // Track login stats for the dashboard.
  await pool.query(
    `UPDATE users
     SET previous_login = last_login, last_login = NOW(), login_count = login_count + 1
     WHERE id = ?`,
    [user.id]
  );

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });

  // Cookie lives exactly as long as the token (2 hours).
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: COOKIE_MAX_AGE_MS });

  res.json({
    success: true,
    message: 'Login successful.',
    data: { user: { id: user.id, name: user.name, email: user.email } },
  });
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ success: true, message: 'You have been logged out.' });
}

module.exports = { signup, login, logout };
