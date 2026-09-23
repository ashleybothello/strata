import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Sun, Moon, Globe } from 'lucide-react';
import { useAppState } from '../state/AppState';

export default function TopNav({ transparent = false }) {
  const { pathname } = useLocation();
  const { activeAlerts, isAnomaly, time, theme, setTheme, lang, setLang, t } = useAppState();

  const links = [
    { to: '/',           label: t('home') },
    { to: '/dashboard',  label: t('dashboard') },
    { to: '/monitoring', label: t('monitoring') },
    { to: '/map',        label: t('map') },
    { to: '/network',    label: t('network') },
    { to: '/assessment', label: t('ai') },
    { to: '/alerts',     label: `${t('alerts')}${activeAlerts.length > 0 ? ` (${activeAlerts.length})` : ''}` },
    { to: '/about',      label: t('about') },
  ];

  return (
    <nav className={`topnav${transparent ? ' topnav-transparent' : ''}`}>
      <div className="container-wide topnav-inner">
        <div className="topnav-brand">
          <div className="brand-icon">
            <img src="/logo.png" alt="STRATA Logo" height={24} style={{ borderRadius: '50%' }} />
          </div>
          <div className="brand-text">
            <span className="brand-name">STRATA</span>
            <span className="brand-sub">Geotechnical Subsidence Monitoring System</span>
          </div>
        </div>

        <ul className="topnav-links">
          {links.map(l => (
            <li key={l.to}>
              <Link to={l.to} className={pathname === l.to ? 'active' : ''}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="topnav-right">
          {isAnomaly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f87171', fontFamily: 'var(--mono)' }}>
              <AlertTriangle size={13} />
              <span>ALERT ACTIVE</span>
            </div>
          )}

          <div className="header-toggles" style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Theme Toggle */}
            <button
              className="toggle-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
            </button>

            {/* Language Dropdown */}
            <div className="lang-dropdown-wrap">
              <Globe size={12} style={{ color: '#c2ab8f' }} />
              <select
                className="lang-dropdown"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                title="Select Language"
              >
                <option value="en">EN — English</option>
                <option value="hi">HI — हिंदी</option>
                <option value="ur">UR — اردو</option>
              </select>
            </div>
          </div>

          <div className="nav-status" style={{ marginLeft: 12 }}>
            <span className="status-dot-sm" />
            <span>{time.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
