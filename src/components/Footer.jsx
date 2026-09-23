import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-name">STRATA</div>
            <p className="footer-brand-desc">
              AI-enabled Low Cost Real Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India.
            </p>
            <div style={{ marginTop: 16, fontSize: 11, fontFamily: 'var(--mono)', color: '#475569' }}>
              STRATA Technologies · Geotechnical Safety Systems
            </div>
          </div>

          <div>
            <div className="footer-col-title">Platform</div>
            <ul className="footer-links">
              <li><Link to="/dashboard">Live Dashboard</Link></li>
              <li><Link to="/monitoring">Monitoring Console</Link></li>
              <li><Link to="/map">Mine Panel Map</Link></li>
              <li><Link to="/network">Sensor Network</Link></li>
              <li><Link to="/alerts">Alert System</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Technology</div>
            <ul className="footer-links">
              <li><Link to="/assessment">AI Assessment</Link></li>
              <li><Link to="/about">Hardware Stack</Link></li>
              <li><Link to="/about">LoRa Mesh Network</Link></li>
              <li><Link to="/about">Platform Details</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Compliance</div>
            <ul className="footer-links">
              <li><a href="#">DGMS Guidelines</a></li>
              <li><a href="#">CMR 2017</a></li>
              <li><a href="#">IS 15752 Standards</a></li>
              <li><a href="#">MoEF Regulations</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-bottom-text" style={{ color: '#475569' }}>
            © 2026 STRATA Technologies. All rights reserved.
          </span>
          <span className="footer-ps-badge" style={{ color: '#64748b' }}>
            Enterprise Edition · Active Monitoring Suite
          </span>
        </div>
      </div>
    </footer>
  );
}
