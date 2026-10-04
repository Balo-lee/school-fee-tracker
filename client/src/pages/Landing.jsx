import { Link } from 'react-router-dom';
import './Landing.css';

function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-brand">
          <img src="/logo.png" alt="Crown Heights College logo" />
          <span>Crown Heights College</span>
        </div>
        <div className="nav-links">
          <Link to="/login">Log In</Link>
          <Link to="/register" className="btn-secondary">Register</Link>
        </div>
      </nav>

      <div className="landing-hero">
        <img src="/logo.png" alt="Crown Heights College crest" className="hero-logo" />
        <h1>Crown Heights College</h1>
        <p className="tagline">
          A secure, modern way for parents to track and pay school fees online,
          and for the school to manage collections in real time.
        </p>

        <div className="landing-buttons">
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
            Log In
          </Link>
          <Link to="/register" className="btn-secondary">
            Register as a Parent
          </Link>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <h3>Secure Payments</h3>
            <p>Pay fees online safely through our Paystack-integrated checkout.</p>
          </div>
          <div className="feature-card">
            <h3>Real-Time Tracking</h3>
            <p>See exactly what's paid and what's outstanding, updated instantly.</p>
          </div>
          <div className="feature-card">
            <h3>Instant Receipts</h3>
            <p>Every payment generates a digital receipt you can download anytime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;