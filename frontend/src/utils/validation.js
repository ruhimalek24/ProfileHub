// Same normalizeEmail() the backend uses (validator 13.15.35, default options).
import normalizeEmail from 'validator/es/lib/normalizeEmail';

// Form checks. Same rules as the backend, so users see errors before sending.
// Each function returns an object like { email: 'Email is required.' }.
// An empty object means the form is valid.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

function checkEmail(email) {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Please enter a valid email address.';
  return '';
}

export function validateLogin({ email, password }) {
  const errors = {};

  const emailError = checkEmail(email);
  if (emailError) errors.email = emailError;

  if (!password) errors.password = 'Password is required.';

  return errors;
}

export function validateSignup({ name, email, password, confirmPassword }) {
  const errors = {};

  if (!name.trim()) errors.name = 'Full name is required.';
  else if (name.trim().length > 100) errors.name = 'Name must be 100 characters or less.';

  const emailError = checkEmail(email);
  if (emailError) errors.email = emailError;

  if (!password) errors.password = 'Password is required.';
  else if (password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  else if (password.length > MAX_PASSWORD_LENGTH)
    errors.password = `Password must be ${MAX_PASSWORD_LENGTH} characters or less.`;

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';

  return errors;
}

function checkNewPassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > MAX_PASSWORD_LENGTH)
    return `Password must be ${MAX_PASSWORD_LENGTH} characters or less.`;
  return '';
}

// True only if the new email is really a different address.
// Uses the backend's normalization, so "Bob@Example.COM" equals "bob@example.com".
// savedEmail comes from the backend and is already normalized.
export function isEmailChanged(newEmail, savedEmail) {
  if (checkEmail(newEmail)) return false; // invalid email: that error is shown instead
  return normalizeEmail(newEmail.trim()) !== savedEmail;
}

export function validateProfile({ name, email, currentPassword }, savedEmail) {
  const errors = {};

  if (!name.trim()) errors.name = 'Full name is required.';
  else if (name.trim().length > 100) errors.name = 'Name must be 100 characters or less.';

  const emailError = checkEmail(email);
  if (emailError) errors.email = emailError;
  else if (isEmailChanged(email, savedEmail) && !currentPassword) {
    errors.currentPassword = 'Please enter your current password to change your email.';
  }

  return errors;
}

export function validateChangePassword({ currentPassword, newPassword, confirmNewPassword }) {
  const errors = {};

  if (!currentPassword) errors.currentPassword = 'Current password is required.';

  const passwordError = checkNewPassword(newPassword);
  if (passwordError) errors.newPassword = passwordError;
  else if (newPassword === currentPassword)
    errors.newPassword = 'New password must be different from your current password.';

  if (!confirmNewPassword) errors.confirmNewPassword = 'Please confirm your new password.';
  else if (confirmNewPassword !== newPassword) errors.confirmNewPassword = 'Passwords do not match.';

  return errors;
}

// Profile picture: same limits as the backend (which also checks the real file content).
export const PROFILE_PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024; // 2 MB

export function validateProfilePicture(file) {
  if (!file) return 'Please choose an image to upload.';
  if (!PROFILE_PICTURE_TYPES.includes(file.type)) return 'Please choose a JPG, PNG or WebP image.';
  if (file.size > MAX_PROFILE_PICTURE_BYTES) return 'Image must be 2 MB or smaller.';
  return '';
}
