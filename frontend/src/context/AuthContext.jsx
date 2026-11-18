import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest, logoutRequest, signupRequest } from '../api/authApi';
import { getMeRequest } from '../api/userApi';
import { setUnauthorizedHandler } from '../api/axios';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until first session check ends
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Ref so the 401 handler always sees the latest user.
  const userRef = useRef(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // On page load: ask the backend if the cookie is still valid.
  useEffect(() => {
    getMeRequest()
      .then((res) => setUser(res.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // When any request gets 401 while logged in, the session has ended
  // (token expired or cookie gone). Log out and go to Login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!userRef.current) return; // was not logged in, nothing to do
      setUser(null);
      showToast('Your session has expired. Please log in again.', 'error');
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, showToast]);

  async function signup(formData) {
    const res = await signupRequest(formData);
    return res.data;
  }

  async function login(email, password) {
    const res = await loginRequest({ email, password });
    setUser(res.data.data.user);
    return res.data;
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Even if the server fails, clear the user locally.
    }
    setUser(null);
  }

  // After a profile change, so Navbar, Sidebar and pages update right away.
  function updateUser(updatedUser) {
    setUser((current) => ({ ...current, ...updatedUser }));
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signup,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
