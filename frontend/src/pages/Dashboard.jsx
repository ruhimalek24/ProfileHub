import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMeRequest } from '../api/userApi';
import { getErrorMessage } from '../api/axios';
import { formatDate, formatDateTime, getInitials } from '../utils/format';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Footer from '../components/Footer';
import './Dashboard.css';

const SIDEBAR_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/', label: 'Home', icon: '⌂' },
];

function Dashboard() {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null); // { user, stats } from /users/me
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMeRequest();
      setData(res.data.data);
    } catch (err) {
      // 401 = session ended. AuthContext already redirects to Login.
      if (err.response?.status !== 401) {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    await logout();
    showToast('You have been logged out.', 'success');
    navigate('/');
  }

  return (
    <div className="dashboard">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="dashboard-body">
        <Sidebar
          links={SIDEBAR_LINKS}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />

        <div className="dashboard-main">
          <main className="dashboard-content">
            {loading && !data && <DashboardSkeleton />}

            {error && !loading && (
              <div className="dashboard-error card" role="alert">
                <h2>Could not load your dashboard</h2>
                <p className="text-muted">{error}</p>
                <Button onClick={loadDashboard}>Try again</Button>
              </div>
            )}

            {data && !error && (
              <DashboardData data={data} loading={loading} onRefresh={loadDashboard} onLogout={handleLogout} />
            )}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

// The real content, shown once data has loaded.
function DashboardData({ data, loading, onRefresh, onLogout }) {
  const { user, stats } = data;

  // last_login is the current session (set at login), so the
  // previous login is the meaningful "Last login" for the user.
  const isFirstLogin = !stats.previousLogin;

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name} 👋</h1>
          <p className="text-muted">Here is a quick look at your account.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} loading={loading}>
          Refresh
        </Button>
      </header>

      <section className="dashboard-stats" aria-label="Statistics">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          icon="👥"
          hint="Registered accounts"
        />
        <StatCard
          label="Days as member"
          value={stats.daysAsMember}
          icon="📅"
          hint={stats.daysAsMember === 0 ? 'Joined today' : `Since ${formatDate(user.createdAt)}`}
        />
        <StatCard
          label="Login count"
          value={stats.loginCount}
          icon="🔑"
          hint={stats.loginCount === 1 ? 'Your first login' : 'Total successful logins'}
        />
        <StatCard
          label="Last login"
          value={isFirstLogin ? 'First visit' : formatDateTime(stats.previousLogin)}
          icon="🕒"
          hint={isFirstLogin ? 'Welcome aboard!' : 'Before this session'}
        />
      </section>

      <section className="dashboard-profile card" aria-labelledby="profile-title">
        <div className="profile-top">
          <span className="profile-avatar" aria-hidden="true">
            {getInitials(user.name)}
          </span>
          <div>
            <h2 id="profile-title">Profile</h2>
            <p className="text-muted">Your account details.</p>
          </div>
        </div>

        <dl className="profile-list">
          <div>
            <dt>Full name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt>Current session started</dt>
            <dd>{formatDateTime(stats.lastLogin)}</dd>
          </div>
        </dl>

        <div className="profile-actions">
          <Button variant="danger" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </section>
    </>
  );
}

// Grey placeholder blocks while loading.
function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton skeleton-title" />
      <div className="dashboard-stats">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="skeleton skeleton-profile" />
    </div>
  );
}

export default Dashboard;
