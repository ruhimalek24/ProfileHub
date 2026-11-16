import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from './Button';
import './Navbar.css';

// Top bar. Shows Login/Sign Up for guests, Dashboard/Logout for users.
// `onMenuClick` (optional) shows a menu button, used by the dashboard sidebar.
function Navbar({ onMenuClick }) {
  const { isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    showToast('You have been logged out.', 'success');
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <div className="navbar-left">
          {onMenuClick && (
            <button
              type="button"
              className="navbar-icon-btn navbar-menu-btn"
              onClick={onMenuClick}
              aria-label="Open sidebar"
            >
              ☰
            </button>
          )}
          <Link to="/" className="navbar-brand">
            <span className="navbar-logo">P1</span>
            Project1
          </Link>
        </div>

        <button
          type="button"
          className="navbar-icon-btn navbar-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '×' : '⋯'}
        </button>

        <nav className={`navbar-actions ${menuOpen ? 'is-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Button to="/dashboard" variant="ghost" size="sm">
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                Login
              </Button>
              <Button to="/signup" size="sm">
                Sign Up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
