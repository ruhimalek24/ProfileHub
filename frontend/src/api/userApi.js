import api from './axios';

// Returns { user, stats } for the logged-in user.
export function getMeRequest() {
  return api.get('/users/me');
}

export function healthRequest() {
  return api.get('/health');
}

// currentPassword is only needed when the email changes.
export function updateProfileRequest({ name, email, currentPassword }) {
  return api.put('/users/me', { name, email, currentPassword });
}

export function changePasswordRequest({ currentPassword, newPassword, confirmNewPassword }) {
  return api.put('/users/me/password', { currentPassword, newPassword, confirmNewPassword });
}

export function uploadProfilePictureRequest(file) {
  const formData = new FormData();
  formData.append('profilePicture', file);
  // Needed: the shared instance defaults to JSON, which would turn FormData into JSON.
  // With this header axios lets the browser add the multipart boundary.
  return api.put('/users/me/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// Image URL for <img src>. The version changes on every upload,
// so the browser never shows an old cached picture.
export function getProfilePictureUrl(version) {
  return `${api.defaults.baseURL}/users/me/profile-picture?v=${encodeURIComponent(version)}`;
}
