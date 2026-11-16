import axios from 'axios';

// One axios instance for the whole app.
// withCredentials: true makes the browser send the HttpOnly JWT cookie.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Turn any axios error into a friendly message. Never show status codes.
export function getErrorMessage(error) {
  if (!error.response) {
    return 'Cannot connect to the server. Please try again later.';
  }
  return error.response.data?.message || 'Something went wrong. Please try again later.';
}

// Backend validation errors as { fieldName: message }, for showing under inputs.
export function getFieldErrors(error) {
  const list = error.response?.data?.errors || [];
  const fieldErrors = {};
  list.forEach((item) => {
    if (!fieldErrors[item.field]) fieldErrors[item.field] = item.message;
  });
  return fieldErrors;
}

// AuthContext registers a function here to run when a session ends (401).
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    // 401 on login = wrong password. Let the login form handle it.
    if (error.response?.status === 401 && !isLoginRequest && onUnauthorized) {
      onUnauthorized(getErrorMessage(error));
    }
    return Promise.reject(error);
  }
);

export default api;
