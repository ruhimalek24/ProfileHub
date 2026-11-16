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
