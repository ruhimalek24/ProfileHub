import api from './axios';

// Returns { user, stats } for the logged-in user.
export function getMeRequest() {
  return api.get('/users/me');
}

export function healthRequest() {
  return api.get('/health');
}
