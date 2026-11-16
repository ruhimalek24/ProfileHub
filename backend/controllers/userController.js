const pool = require('../config/db');
const { COOKIE_NAME, cookieOptions } = require('../config/cookie');

// GET /api/users/me  (protected)
async function getMe(req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, email, login_count, last_login, previous_login, created_at,
            DATEDIFF(NOW(), created_at) AS days_as_member
     FROM users
     WHERE id = ?`,
    [req.userId]
  );
  const user = rows[0];

  // Token is valid but the user was deleted.
  if (!user) {
    res.clearCookie(COOKIE_NAME, cookieOptions);
    return res.status(401).json({
      success: false,
      message: 'Account not found. Please log in again.',
    });
  }

  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM users');

  res.json({
    success: true,
    message: 'User loaded.',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
      stats: {
        loginCount: user.login_count,
        daysAsMember: user.days_as_member,
        lastLogin: user.last_login,
        previousLogin: user.previous_login,
        totalUsers: countRows[0].total,
      },
    },
  });
}

module.exports = { getMe };
