import Navbar from './Navbar';
import Footer from './Footer';
import './AuthLayout.css';

// Shared frame for Login and Signup: navbar, centered card, footer.
function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="auth-card card">
          <div className="auth-header">
            <h1>{title}</h1>
            {subtitle && <p className="text-muted">{subtitle}</p>}
          </div>
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default AuthLayout;
