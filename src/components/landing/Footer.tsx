import { Link } from 'react-router-dom';
import './Footer.css';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Dashboard', 'API'],
  Company: ['About', 'Careers', 'Blog', 'Press'],
  Resources: ['Documentation', 'Help Center', 'Community', 'Changelog'],
  Legal: ['Privacy', 'Terms', 'Cookie Policy', 'GDPR'],
};

const socialLinks = [
  { name: 'Twitter', icon: '𝕏' },
  { name: 'GitHub', icon: '⌘' },
  { name: 'Discord', icon: '💬' },
  { name: 'LinkedIn', icon: 'in' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-orb" style={{ width: 28, height: 28 }}></div>
              <span className="logo-text">Nova<span className="gradient-text">Life</span></span>
            </Link>
            <p className="footer-tagline">
              Stop Missing Deadlines. Start Living Ahead.
            </p>
            <div className="footer-social">
              {socialLinks.map((s, i) => (
                <a key={i} href="#" className="social-link" aria-label={s.name}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-links-grid">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="footer-column">
                <h5 className="footer-column-title">{category}</h5>
                <ul>
                  {links.map((link, i) => (
                    <li key={i}><a href="#">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} NovaLife. All rights reserved.</p>
          <p className="footer-built">
            Built with 🧠 AI + ❤️ by the NovaLife Team
          </p>
        </div>
      </div>
    </footer>
  );
}
