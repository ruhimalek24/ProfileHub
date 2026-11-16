import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import './Landing.css';

// Feature cards. Add or edit items here.
const FEATURES = [
  {
    icon: '🔐',
    title: 'Secure login',
    text: 'Your session lives in a secure HttpOnly cookie, so scripts on the page can never read it.',
  },
  {
    icon: '🛡️',
    title: 'Protected passwords',
    text: 'Passwords are hashed with bcrypt before they are saved. We never store plain text.',
  },
  {
    icon: '📊',
    title: 'Personal dashboard',
    text: 'See your profile and real activity stats, like total logins and days as a member.',
  },
  {
    icon: '📱',
    title: 'Works everywhere',
    text: 'A clean layout that fits desktop, tablet and phone screens.',
  },
];

function Landing() {
  const { isAuthenticated } = useAuth();

  // Logged-in users go straight to their dashboard.
  const startLink = isAuthenticated ? '/dashboard' : '/signup';
  const startText = isAuthenticated ? 'Go to Dashboard' : 'Get Started';

  return (
    <>
      <Navbar />

      <main className="landing">
        {/* ===== Hero ===== */}
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-text">
              <span className="hero-badge">Simple · Secure · Fast</span>
              <h1>
                Welcome to <span className="text-primary">Project1</span>
              </h1>
              <p className="hero-lead">
                Create your account in seconds and get a personal dashboard that keeps your
                information safe and easy to see.
              </p>
              <div className="hero-actions">
                <Button to={startLink} size="lg">
                  {startText}
                </Button>
                {!isAuthenticated && (
                  <Button to="/login" variant="outline" size="lg">
                    I have an account
                  </Button>
                )}
              </div>
            </div>

            {/* Small dashboard preview made from real components */}
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-window">
                <div className="hero-window-bar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="hero-window-body">
                  <p className="hero-window-title">Welcome back, Alex 👋</p>
                  <div className="hero-stats">
                    <StatCard label="Total logins" value="24" icon="🔑" />
                    <StatCard label="Days as member" value="58" icon="📅" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Features ===== */}
        <section className="features" id="features">
          <div className="container">
            <div className="section-heading">
              <h2>Everything you need to get started</h2>
              <p className="text-muted">
                Built with modern tools and good security habits from day one.
              </p>
            </div>

            <div className="features-grid">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="feature-card card">
                  <span className="feature-icon" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3>{feature.title}</h3>
                  <p className="text-muted">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Call to action ===== */}
        {!isAuthenticated && (
          <section className="cta">
            <div className="container">
              <div className="cta-box">
                <h2>Ready to begin?</h2>
                <p>Join today. It is free and only takes a minute.</p>
                <Button to="/signup" variant="secondary" size="lg">
                  Create your account
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

export default Landing;
