import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppStateProvider } from './state/AppState';
import { AuthProvider } from './state/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import OarsAssistant from './components/OarsAssistant';

export default function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />

            {/* Protected — require login */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard initialTab="home" /></ProtectedRoute>} />
            <Route path="/monitoring" element={<ProtectedRoute><Dashboard initialTab="live" /></ProtectedRoute>} />
            <Route path="/map"        element={<ProtectedRoute><Dashboard initialTab="map" /></ProtectedRoute>} />
            <Route path="/network"    element={<ProtectedRoute><Dashboard initialTab="network" /></ProtectedRoute>} />
            <Route path="/assessment" element={<ProtectedRoute><Dashboard initialTab="ai" /></ProtectedRoute>} />
            <Route path="/alerts"     element={<ProtectedRoute><Dashboard initialTab="alerts" /></ProtectedRoute>} />
            <Route path="/analytics"  element={<ProtectedRoute><Dashboard initialTab="analytics" /></ProtectedRoute>} />

            <Route path="*" element={<Home />} />
          </Routes>
          <OarsAssistant />
        </BrowserRouter>
      </AppStateProvider>
    </AuthProvider>
  );
}
