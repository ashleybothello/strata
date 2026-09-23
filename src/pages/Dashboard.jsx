import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Map, Network, Cpu,
  Bell, Database, Server, Info, ArrowLeft, RefreshCw, Sun, Moon, Globe, LogOut, User
} from 'lucide-react';
import { useAppState } from '../state/AppState';
import { useAuth } from '../state/AuthContext';
import DashboardHome from './dashboard/DashboardHome';
import LiveMonitoring from './dashboard/LiveMonitoring';
import MineMap from './dashboard/MineMap';
import AIAssessment from './dashboard/AIAssessment';
import Alerts from './dashboard/Alerts';
import Analytics from './dashboard/Analytics';
import SystemArch from './dashboard/SystemArch';

const navItems = [
  { id: 'home',    icon: LayoutDashboard, labelKey: 'dashboard' },
  { id: 'live',    icon: BarChart3,       labelKey: 'monitoring' },
  { id: 'map',     icon: Map,             labelKey: 'map' },
  { id: 'ai',      icon: Cpu,             labelKey: 'ai' },
  { id: 'alerts',  icon: Bell,            labelKey: 'alerts' },
  { id: 'analytics', icon: Database,      labelKey: 'analytics' },
];

const viewMap = {
  home: DashboardHome,
  live: LiveMonitoring,
  map: MineMap,
  ai: AIAssessment,
  alerts: Alerts,
  analytics: Analytics,
  arch: SystemArch,
};

// Maps URL pathname to tab id
const pathToTab = {
  '/dashboard':  'home',
  '/monitoring': 'live',
  '/map':        'map',
  '/assessment': 'ai',
  '/alerts':     'alerts',
  '/analytics':  'analytics',
};

const titleMap = {
  home: 'STRATA — Real-Time Control',
  live: 'Live Monitoring',
  map: 'Mine Panel Map',
  ai: 'AI Assessment',
  alerts: 'Safety Alerts',
  analytics: 'Analytics & Reports',
  arch: 'System Architecture',
};

const subtitleMap = {
  home: 'Ground deformation telemetry · West Bokaro Coalfield · Unit-IV',
  live: 'Continuous multi-node telemetry stream',
  map: 'GIS schematic overlay · 3D Interactive Mine Model',
  ai: 'XGBoost anomaly detection · Model v2.1',
  alerts: 'DGMS threshold-based early warning system',
  analytics: 'Historical deformation trend analysis',
  arch: 'Hardware architecture & specification',
};

export default function Dashboard({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'home');
  const { isAnomaly, setIsAnomaly, activeAlerts, time, theme, setTheme, lang, setLang, t, telemetry } = useAppState();
  const { phone, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync active tab whenever the URL pathname changes (e.g. from OARS navigation)
  useEffect(() => {
    const tab = pathToTab[location.pathname];
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.pathname]);

  const ActiveView = viewMap[activeTab] || DashboardHome;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon" style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src="/logo.png" alt="STRATA Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} />
          </div>
          <div className="brand-text">
            <span className="brand-name" style={{ fontSize:13 }}>STRATA</span>
            <span className="brand-sub">CONTROL ROOM</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {navItems.map(item => {
            const hasAlert = item.id === 'alerts' && activeAlerts.length > 0;
            return (
              <button
                key={item.id}
                className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon size={15} className="icon" />
                <span>{t(item.labelKey)}</span>
                {hasAlert && <span className="nav-alert-dot"/>}
              </button>
            );
          })}

          <div style={{ height: 16 }}/>
          <div className="sidebar-nav-label">Site</div>
          <button className="nav-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={15} className="icon"/>
            <span>Back to Home</span>
          </button>
          <button className="nav-btn" onClick={() => navigate('/about')}>
            <Info size={15} className="icon"/>
            <span>About Us</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Logged-in user */}
          {phone && (
            <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(34,211,238,0.06)', borderRadius: 8, border: '1px solid rgba(34,211,238,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <User size={11} color="#22d3ee" />
                <span style={{ fontSize: 10, color: '#22d3ee', fontFamily: 'monospace' }}>LOGGED IN</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{phone}</div>
            </div>
          )}
          <div className="sysrow"><span>SYSTEM</span><span className="sysval green">ONLINE</span></div>
          <div className="sysrow"><span>Gateway</span><span className="sysval">CONNECTED</span></div>
          <div className="sysrow"><span>Nodes</span><span className="sysval">{telemetry?.length || 20} / {telemetry?.length || 20}</span></div>
          <div className="sysrow"><span>RF Health</span><span className="sysval">96%</span></div>
          <div className="sysrow" style={{marginTop:6}}><span>DEMO</span><span className="sysval" style={{color:'#f59e0b'}}>SIMULATED</span></div>
          {/* Logout */}
          <button
            id="logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(248,113,113,0.25)',
              background: 'rgba(248,113,113,0.06)', color: '#f87171', fontSize: 11,
              fontWeight: 600, cursor: 'pointer', letterSpacing: '0.06em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'; }}
          >
            <LogOut size={11} />
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <div className="dash-title">{titleMap[activeTab]}</div>
            <div className="dash-subtitle">{subtitleMap[activeTab]}</div>
          </div>
          <div className="dash-header-right">
            {/* Language & Theme control */}
            <div className="header-toggles" style={{ marginRight: 8 }}>
              {/* Theme Toggle */}
              <button 
                className="toggle-btn"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={11} /> : <Sun size={11} />}
              </button>

              {/* Language Dropdown */}
              <div className="lang-dropdown-wrap">
                <Globe size={11} style={{ color: '#c2ab8f' }} />
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

            <button
              onClick={() => setIsAnomaly(!isAnomaly)}
              className={`sim-btn ${isAnomaly ? 'anomaly' : 'normal'}`}
            >
              <RefreshCw size={11} className={isAnomaly ? 'spin' : ''} />
              {isAnomaly ? 'RESET NORMAL' : 'SIMULATE ANOMALY'}
            </button>
            <div className="clock-display">
              {time.toLocaleDateString('en-IN')} &nbsp; {time.toLocaleTimeString('en-IN')}
            </div>
          </div>
        </header>

        <div className="dash-body">
          {isAnomaly && (
            <div className="alert-banner critical" style={{ marginBottom: 16 }}>
              <div className="alert-banner-info">
                <span style={{ color:'var(--red)', fontSize:18 }}>⚠</span>
                <div>
                  <div className="alert-banner-title">FAULT SEQUENCE ACTIVE — NODE N02 · WEST PANEL</div>
                  <div className="alert-banner-desc">Multi-sensor exceedance. Deformation indices above DGMS allowable limits. {activeAlerts.length} alarm(s) raised.</div>
                </div>
              </div>
              <button className="btn btn-sm btn-red" onClick={() => setActiveTab('alerts')}>
                VIEW ALERTS
              </button>
            </div>
          )}
          <ActiveView setActiveTab={setActiveTab} />
        </div>
      </main>
    </div>
  );
}
