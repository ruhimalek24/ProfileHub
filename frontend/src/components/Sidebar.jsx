import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './Sidebar.css';

// Side menu for the dashboard.
// links: [{ to, label, icon }]   open/onClose: mobile drawer state
function Sidebar({ links, open = false, onClose, onLogout }) {
  const { user } = useAuth();

  return (
    <>
      {/* Dark backdrop on mobile when open */}
      <div className={`sidebar-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          {user && (
            <div className="sidebar-user">
              <Avatar size="md" />
              <div className="sidebar-user-text">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}

          <nav className="sidebar-nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-icon" aria-hidden="true">
                  {link.icon}
                </span>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {onLogout && (
          <button type="button" className="sidebar-link sidebar-logout" onClick={onLogout}>
            <span className="sidebar-icon" aria-hidden="true">
              ⎋
            </span>
            Logout
          </button>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
