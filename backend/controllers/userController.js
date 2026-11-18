const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { COOKIE_NAME, cookieOptions } = require('../config/cookie');
const {
  detectImageType,
  isSafeFileName,
  getPicturePath,
  getContentType,
  getPictureVersion,
  savePicture,
  deletePicture,
} = require('../utils/profilePicture');

const SALT_ROUNDS = 10; // same as signup
const MAX_PASSWORD_ATTEMPTS = 3; // wrong current-password tries before the lock
const LOCK_MINUTES = 15; // how long password checks stay locked

// GET /api/users/me  (protected)
async function getMe(req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, email, profile_picture, login_count, last_login, previous_login, created_at,
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
        profilePictureVersion: getPictureVersion(user.profile_picture),
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

// ---------- Helpers for profile updates ----------

// Only the user fields that are safe to send to the browser.
function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    profilePictureVersion: getPictureVersion(row.profile_picture),
  };
}

// Token is valid but the user was deleted (same reply as getMe).
function sendAccountNotFound(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  return res.status(401).json({ success: false, message: 'Account not found. Please log in again.' });
}

// Error shown under one form field.
// Never use 401 here: the frontend logs the user out on 401.
function sendFieldError(res, status, field, message) {
  return res.status(status).json({ success: false, message, errors: [{ field, message }] });
}

// Reply for a wrong (400) or locked (429) current password.
function sendPasswordCheckFailed(res, result) {
  if (result.status === 'wrong') {
    const word = result.attemptsLeft === 1 ? 'attempt' : 'attempts';
    return sendFieldError(res, 400, 'currentPassword',
      `Current password is incorrect. You have ${result.attemptsLeft} ${word} left.`);
  }

  const minutes = result.minutesLeft === 1 ? 'minute' : 'minutes';
  const message = result.justLocked
    ? `Too many incorrect attempts. Password verification is locked for ${LOCK_MINUTES} minutes.`
    : `Too many incorrect attempts. Please try again in ${result.minutesLeft} ${minutes}.`;
  return sendFieldError(res, 429, 'currentPassword', message);
}

// Loads the user with the password-lock info.
// is_locked is 1 while the lock time is in the future.
async function findUserForUpdate(userId) {
  const [rows] = await pool.query(
    `SELECT id, email, password_hash, created_at, profile_picture, failed_password_attempts,
            password_locked_until > NOW() AS is_locked,
            CEIL(TIMESTAMPDIFF(SECOND, NOW(), password_locked_until) / 60) AS minutes_left
     FROM users
     WHERE id = ?`,
    [userId]
  );
  return rows[0];
}

// Checks the current password, allowing 3 wrong tries in a row.
// The count is saved in the users table, so refreshing the page, another tab,
// logging out and in, or restarting the server does not reset it.
// Returns { status: 'ok' } | { status: 'wrong', attemptsLeft } | { status: 'locked', minutesLeft, justLocked }
async function verifyCurrentPassword(user, plainPassword) {
  // Still locked: don't even check the password.
  if (user.is_locked) {
    return { status: 'locked', minutesLeft: Math.max(1, Number(user.minutes_left)), justLocked: false };
  }

  // The lock has expired: counting starts again from 0.
  if (user.failed_password_attempts >= MAX_PASSWORD_ATTEMPTS) {
    await pool.query(
      `UPDATE users SET failed_password_attempts = 0, password_locked_until = NULL
       WHERE id = ? AND password_locked_until <= NOW()`,
      [user.id]
    );
  }

  // Correct password: clear the counter and any lock.
  if (await bcrypt.compare(plainPassword, user.password_hash)) {
    await pool.query(
      'UPDATE users SET failed_password_attempts = 0, password_locked_until = NULL WHERE id = ?',
      [user.id]
    );
    return { status: 'ok' };
  }

  // Wrong password: add 1 inside MySQL (not in JavaScript), so wrong
  // guesses sent at the same moment are all counted.
  await pool.query(
    'UPDATE users SET failed_password_attempts = LEAST(failed_password_attempts + 1, 255) WHERE id = ?',
    [user.id]
  );
  const [rows] = await pool.query('SELECT failed_password_attempts FROM users WHERE id = ?', [user.id]);
  const attempts = rows[0] ? rows[0].failed_password_attempts : MAX_PASSWORD_ATTEMPTS;

  if (attempts >= MAX_PASSWORD_ATTEMPTS) {
    // Start the lock (unless another request already started it).
    await pool.query(
      `UPDATE users SET password_locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
       WHERE id = ? AND (password_locked_until IS NULL OR password_locked_until <= NOW())`,
      [LOCK_MINUTES, user.id]
    );
    return { status: 'locked', minutesLeft: LOCK_MINUTES, justLocked: true };
  }

  return { status: 'wrong', attemptsLeft: MAX_PASSWORD_ATTEMPTS - attempts };
}

// PUT /api/users/me  (protected) - update name and email
async function updateProfile(req, res) {
  const { name, email, currentPassword } = req.body;

  const user = await findUserForUpdate(req.userId);
  if (!user) return sendAccountNotFound(res);

  // Both emails are normalized (by the validator now and at signup),
  // so a simple compare tells if the address really changed.
  const emailChanged = email !== user.email;

  if (emailChanged) {
    if (!currentPassword) {
      return sendFieldError(res, 400, 'currentPassword',
        'Please enter your current password to change your email.');
    }

    // Wrong or locked password: nothing is saved, not even the name.
    const check = await verifyCurrentPassword(user, currentPassword);
    if (check.status !== 'ok') return sendPasswordCheckFailed(res, check);

    const [taken] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, user.id]);
    if (taken.length > 0) {
      return sendFieldError(res, 409, 'email', 'This email is already registered.');
    }
  }

  try {
    await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, user.id]);
  } catch (err) {
    // Someone else saved the same email at the same moment.
    if (err.code === 'ER_DUP_ENTRY') {
      return sendFieldError(res, 409, 'email', 'This email is already registered.');
    }
    throw err;
  }

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user: toPublicUser({ ...user, name, email }) },
  });
}

// PUT /api/users/me/password  (protected)
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const user = await findUserForUpdate(req.userId);
  if (!user) return sendAccountNotFound(res);

  const check = await verifyCurrentPassword(user, currentPassword);
  if (check.status !== 'ok') return sendPasswordCheckFailed(res, check);

  if (await bcrypt.compare(newPassword, user.password_hash)) {
    return sendFieldError(res, 400, 'newPassword',
      'New password must be different from your current password.');
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  // Saving the new password also clears the counter and any lock.
  await pool.query(
    'UPDATE users SET password_hash = ?, failed_password_attempts = 0, password_locked_until = NULL WHERE id = ?',
    [newHash, user.id]
  );

  res.json({ success: true, message: 'Password updated successfully.' });
}

// PUT /api/users/me/profile-picture  (protected, multipart field "profilePicture")
async function uploadProfilePicture(req, res) {
  if (!req.file) {
    return sendFieldError(res, 400, 'profilePicture', 'Please choose an image to upload.');
  }

  // Check the real file content (header only, see detectImageType).
  const extension = detectImageType(req.file.buffer);
  if (!extension) {
    return sendFieldError(res, 415, 'profilePicture', 'Please choose a JPG, PNG or WebP image.');
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, created_at, profile_picture FROM users WHERE id = ?',
    [req.userId]
  );
  const user = rows[0];
  if (!user) return sendAccountNotFound(res);

  // 1. Save the new file first (random name, the old file is untouched).
  const newFileName = await savePicture(req.file.buffer, extension);

  // 2. Point the database to the new file.
  try {
    const [result] = await pool.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [newFileName, user.id]
    );
    if (result.affectedRows === 0) {
      // The account was deleted in the meantime.
      await deletePicture(newFileName);
      return sendAccountNotFound(res);
    }
  } catch (err) {
    // Database failed: remove the new file and keep the old picture.
    await deletePicture(newFileName);
    throw err;
  }

  // 3. Only now remove the old file.
  if (user.profile_picture) await deletePicture(user.profile_picture);

  res.json({
    success: true,
    message: 'Profile picture updated.',
    data: { user: toPublicUser({ ...user, profile_picture: newFileName }) },
  });
}

// GET /api/users/me/profile-picture  (protected)
// Sends the logged-in user's own picture. 404 (never 401) when there is none,
// so the frontend simply shows the default avatar.
async function getProfilePicture(req, res) {
  const [rows] = await pool.query('SELECT profile_picture FROM users WHERE id = ?', [req.userId]);
  const fileName = rows[0]?.profile_picture;

  const notFound = () =>
    res.status(404).json({ success: false, message: 'Profile picture not found.' });

  if (!isSafeFileName(fileName)) return notFound();

  res.set({
    'Content-Type': getContentType(fileName),
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'",
    'Cache-Control': 'private, max-age=86400',
  });

  res.sendFile(getPicturePath(fileName), (err) => {
    // File missing on disk (or could not be read).
    if (err && !res.headersSent) notFound();
  });
}

module.exports = {
  getMe,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  getProfilePicture,
};
