import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  changePasswordRequest,
  updateProfileRequest,
  uploadProfilePictureRequest,
} from '../api/userApi';
import { getErrorMessage, getFieldErrors } from '../api/axios';
import {
  MIN_PASSWORD_LENGTH,
  isEmailChanged,
  validateChangePassword,
  validateProfile,
  validateProfilePicture,
} from '../utils/validation';
import AppLayout from '../components/AppLayout';
import Avatar from '../components/Avatar';
import Input from '../components/Input';
import Button from '../components/Button';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Set when the backend locks password checks (3 wrong current passwords).
  const [lockMessage, setLockMessage] = useState('');
  // Changing this key resets both forms.
  const [formKey, setFormKey] = useState(0);

  // 429 from either form: reset the page and explain the lock.
  function handleLocked(message) {
    setLockMessage(message);
    setFormKey((key) => key + 1);
    navigate('/profile', { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Current password is required', 'error');
  }

  return (
    <AppLayout>
      <header className="profile-page-header">
        <h1>Edit profile</h1>
        <p className="text-muted">Update your picture, account details and password.</p>
      </header>

      {lockMessage && (
        <div className="profile-lock-notice" role="alert">
          {lockMessage}
        </div>
      )}

      <div className="profile-page-sections">
        <ProfilePictureSection />
        <ProfileDetailsForm key={`details-${formKey}`} onLocked={handleLocked} />
        <ChangePasswordForm key={`password-${formKey}`} lockMessage={lockMessage} onLocked={handleLocked} />
      </div>
    </AppLayout>
  );
}

// ---------- Profile picture ----------
function ProfilePictureSection() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Free the preview image memory when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearSelection() {
    setFile(null);
    setPreviewUrl(null);
  }

  function handleFileChange(e) {
    const chosen = e.target.files[0];
    e.target.value = ''; // lets the user pick the same file again
    if (!chosen) return;

    const fileError = validateProfilePicture(chosen);
    if (fileError) {
      clearSelection();
      setError(fileError);
      return;
    }

    setError('');
    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen));
  }

  async function handleUpload() {
    setUploading(true);
    try {
      const res = await uploadProfilePictureRequest(file);
      updateUser(res.data.data.user);
      clearSelection();
      showToast(res.data.message, 'success'); // "Profile picture updated."
    } catch (err) {
      if (err.response?.status === 401) return; // session ended, AuthContext redirects
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    clearSelection();
    setError('');
  }

  return (
    <section className="card profile-section" aria-labelledby="picture-title">
      <h2 id="picture-title">Profile picture</h2>
      <p className="text-muted">
        JPG, PNG or WebP, up to 2 MB. A square image of at least 256 × 256 px looks best.
      </p>

      <div className="picture-row">
        <Avatar size="xl" src={previewUrl || undefined} />

        <div className="picture-controls">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            hidden
          />

          {file ? (
            <>
              <p className="picture-note">Preview. Not saved yet.</p>
              <div className="picture-buttons">
                <Button onClick={handleUpload} loading={uploading}>
                  {uploading ? 'Saving...' : 'Save picture'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={uploading}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="picture-buttons">
              <Button variant="outline" onClick={() => inputRef.current.click()}>
                {user?.profilePictureVersion ? 'Change picture' : 'Upload picture'}
              </Button>
            </div>
          )}

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- Name and email ----------
function ProfileDetailsForm({ onLocked }) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: user.name, email: user.email, currentPassword: '' });
  const [errors, setErrors] = useState({});
  const [askPassword, setAskPassword] = useState(false); // the backend asked for it
  const [saving, setSaving] = useState(false);

  // Same normalization as the backend, so "Bob@Example.COM" is not a change.
  const needsPassword = isEmailChanged(form.email, user.email) || askPassword;
  const hasChanges = form.name.trim() !== user.name || form.email.trim() !== user.email;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formErrors = validateProfile(form, user.email);
    if (needsPassword && !form.currentPassword && !formErrors.currentPassword) {
      formErrors.currentPassword = 'Please enter your current password to change your email.';
    }
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await updateProfileRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        currentPassword: needsPassword ? form.currentPassword : undefined,
      });
      const updated = res.data.data.user;
      updateUser(updated);
      setForm({ name: updated.name, email: updated.email, currentPassword: '' });
      setAskPassword(false);
      showToast(res.data.message, 'success'); // "Profile updated successfully."
    } catch (err) {
      if (err.response?.status === 401) return; // session ended, AuthContext redirects
      if (err.response?.status === 429) return onLocked(getErrorMessage(err));

      const fieldErrors = getFieldErrors(err);
      if (fieldErrors.currentPassword) setAskPassword(true); // safety net: backend wants it
      setErrors(fieldErrors);
      setForm((current) => ({ ...current, currentPassword: '' }));
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card profile-section" aria-labelledby="details-title">
      <h2 id="details-title">Account details</h2>
      <p className="text-muted">Changing your email needs your current password.</p>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        {needsPassword && (
          <Input
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
            hint="Needed to confirm your new email."
          />
        )}
        <Button type="submit" loading={saving} disabled={!hasChanges}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </section>
  );
}

// ---------- Password ----------
const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

function ChangePasswordForm({ lockMessage, onLocked }) {
  const { showToast } = useToast();

  const [form, setForm] = useState(EMPTY_PASSWORD_FORM);
  // After a lock, show the reason under the current password field.
  const [errors, setErrors] = useState(lockMessage ? { currentPassword: lockMessage } : {});
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formErrors = validateChangePassword(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await changePasswordRequest(form);
      setForm(EMPTY_PASSWORD_FORM);
      showToast(res.data.message, 'success'); // "Password updated successfully."
    } catch (err) {
      if (err.response?.status === 401) return; // session ended, AuthContext redirects
      if (err.response?.status === 429) return onLocked(getErrorMessage(err));

      // e.g. "Current password is incorrect. You have 2 attempts left."
      setErrors(getFieldErrors(err));
      setForm((current) => ({ ...current, currentPassword: '' }));
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card profile-section" aria-labelledby="password-title">
      <h2 id="password-title">Change password</h2>
      <p className="text-muted">Enter your current password, then choose a new one.</p>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
        />
        <Input
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />
        <Input
          label="Confirm new password"
          name="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmNewPassword}
          onChange={handleChange}
          error={errors.confirmNewPassword}
        />
        <Button type="submit" loading={saving}>
          {saving ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </section>
  );
}

export default Profile;
