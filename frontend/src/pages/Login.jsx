import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../api/axios';
import { validateLogin } from '../utils/validation';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';

function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Signup sends the new email here, so the user does not retype it.
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear this field's error while the user fixes it.
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formErrors = validateLogin(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await login(form.email.trim(), form.password);
      showToast(`Welcome back, ${result.data.user.name}!`, 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Wrong email/password: server says "Invalid credentials. Please try again."
      setErrors(getFieldErrors(err));
      showToast(getErrorMessage(err), 'error');
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your dashboard."
      footer={
        <>
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </>
      }
    >
      {/* Sent here by ProtectedRoute (e.g. opened /dashboard after the session ended) */}
      {location.state?.from && (
        <p className="auth-notice" role="status">
          Please log in to continue.
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoFocus={!form.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoFocus={Boolean(form.email)}
        />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Login;
