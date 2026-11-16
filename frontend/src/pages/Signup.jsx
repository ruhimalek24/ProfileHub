import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../api/axios';
import { MIN_PASSWORD_LENGTH, validateSignup } from '../utils/validation';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '' };

function Signup() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formErrors = validateSignup(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    try {
      const email = form.email.trim();
      const result = await signup({ ...form, name: form.name.trim(), email });
      showToast(result.message, 'success'); // "Account created! Please log in."
      navigate('/login', { state: { email } });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);

      // Duplicate email (409): show it under the email field too.
      if (err.response?.status === 409) {
        fieldErrors.email = getErrorMessage(err);
      }

      setErrors(fieldErrors);
      showToast(getErrorMessage(err), 'error');
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It only takes a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Full name"
          name="name"
          placeholder="Alex Smith"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          autoFocus
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="Type it again"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Signup;
