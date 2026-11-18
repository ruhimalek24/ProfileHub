import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './AppLayout.css';

const SIDEBAR_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/profile', label: 'Edit profile', icon: '✎' },
  { to: '/', label: 'Home', icon: '⌂' },
];

// Page shell for logged-in pages (Dashboard, Profile):
// Navbar on top, Sidebar on the left (a drawer on small screens), Footer below.
function AppLayout({ children }) {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    showToast('You have been logged out.', 'success');
    navigate('/');
  }

  return (
    <div className="app-layout">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="app-layout-body">
        <Sidebar
          links={SIDEBAR_LINKS}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />

        <div className="app-layout-main">
          <main className="app-layout-content">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
