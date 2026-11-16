import api from './axios';

export function signupRequest({ name, email, password, confirmPassword }) {
  return api.post('/auth/signup', { name, email, password, confirmPassword });
}

export function loginRequest({ email, password }) {
  return api.post('/auth/login', { email, password });
}

export function logoutRequest() {
  return api.post('/auth/logout');
}
