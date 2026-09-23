import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { Shield, Phone, KeyRound, ArrowRight, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

// Animated coal & sandstone grid canvas background
function HoloGrid() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0, raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const gs = 60;
      ctx.strokeStyle = `rgba(194, 171, 143, 0.05)`;
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Warm amber scanning line
      const scanY = ((t * 0.4) % (H + 60)) - 30;
      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      grad.addColorStop(0, 'rgba(194, 171, 143, 0)');
      grad.addColorStop(0.5, 'rgba(232, 146, 42, 0.08)');
      grad.addColorStop(1, 'rgba(194, 171, 143, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 40, W, 80);
      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Mine Operator'); // 'Mine Operator' | 'Planner' | 'Regulator'
  
  const [phone, setPhone] = useState('7977289946');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState(null);
  const otpRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const formatPhone = (val) => {
    // Auto-prefix +91 for Indian numbers
    let v = val.replace(/[^\d+]/g, '');
    if (v.length > 0 && !v.startsWith('+')) v = '+91' + v;
    return v;
  };

  const handleSendOtp = async () => {
    setError(''); setSuccess('');
    const formatted = formatPhone(phone);
    if (!/^\+[1-9]\d{9,14}$/.test(formatted)) {
      return setError('Enter a valid mobile number (10 digits, e.g. 9876543210)');
    }
    if (isRegistering && (!name || !email)) {
      return setError('Please fill in your name and email to register');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Failed to send OTP');

      setCountdown(60);
      setStep('otp');

      if (data.devOtp) {
        setDevOtp(data.devOtp);
        console.log("OTP Sent: ", data.devOtp);
      }
      setSuccess('Verification OTP sent via SMS & Email!');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('Cannot reach server. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (next.every(d => d !== '')) verifyOtp(next.join(''));
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    if (pasted.length === 6) verifyOtp(pasted);
    else otpRefs.current[pasted.length]?.focus();
  };

  const verifyOtp = async (code) => {
    setError(''); setLoading(true);
    const formatted = formatPhone(phone);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted, otp: code, isRegistering, name, email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        login(data.token, data.phone);
        navigate('/dashboard');
      }
    } catch {
      setError('Cannot reach server. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setError(''); setDevOtp(null);
    setStep('phone');
    handleSendOtp();
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0c0a07', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font, "Inter", sans-serif)',
      position: 'relative', overflow: 'hidden',
    }}>
      <HoloGrid />

      {/* Warm Coal & Ember Glow Orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,171,143,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Coal Vibe Login Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 430,
        margin: '0 16px',
        background: 'rgba(16, 14, 11, 0.96)',
        border: '1px solid rgba(194, 171, 143, 0.25)',
        borderRadius: 14,
        backdropFilter: 'blur(24px)',
        boxShadow: '0 0 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(194, 171, 143, 0.05)',
        overflow: 'hidden',
      }}>
        {/* Top Ember Accent Bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #c2ab8f, #e8922a, #c2ab8f, transparent)' }} />

        <div style={{ padding: '38px 36px 34px' }}>
          {/* Logo / Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 12,
              background: 'linear-gradient(135deg, #2d261c, #1a1510)',
              border: '1px solid rgba(194, 171, 143, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 20px rgba(194, 171, 143, 0.15)',
            }}>
              <Shield size={24} color="#c2ab8f" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f5f0e8', letterSpacing: '-0.02em' }}>
              STRATA
            </div>
            <div style={{ fontSize: 11, color: '#c2ab8f', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.14em', marginTop: 3, opacity: 0.9 }}>
              MINE TELEMETRY ACCESS
            </div>
          </div>

          {/* Step: Phone / Registration */}
          {step === 'phone' && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
                <button
                  onClick={() => setIsRegistering(false)}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', background: 'none',
                    borderBottom: !isRegistering ? '2px solid #c2ab8f' : '2px solid transparent',
                    color: !isRegistering ? '#c2ab8f' : '#7a6e60', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s', fontSize: 14
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsRegistering(true)}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', background: 'none',
                    borderBottom: isRegistering ? '2px solid #c2ab8f' : '2px solid transparent',
                    color: isRegistering ? '#c2ab8f' : '#7a6e60', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s', fontSize: 14
                  }}
                >
                  Register
                </button>
              </div>

              {isRegistering && (
                <>
                  <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#c9bfaf' }}>Full Name</div>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(194, 171, 143, 0.2)',
                      borderRadius: 8, padding: '12px 14px', marginBottom: 14, color: '#f5f0e8',
                      outline: 'none', boxSizing: 'border-box', fontSize: 14
                    }}
                  />
                  
                  <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#c9bfaf' }}>Email Address</div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(194, 171, 143, 0.2)',
                      borderRadius: 8, padding: '12px 14px', marginBottom: 14, color: '#f5f0e8',
                      outline: 'none', boxSizing: 'border-box', fontSize: 14
                    }}
                  />

                  <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#c9bfaf' }}>Operator Role</div>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      width: '100%', background: '#1a1510', border: '1px solid rgba(194, 171, 143, 0.2)',
                      borderRadius: 8, padding: '12px 14px', marginBottom: 14, color: '#f5f0e8',
                      outline: 'none', boxSizing: 'border-box', appearance: 'none', fontSize: 14
                    }}
                  >
                    <option value="Mine Operator">Mine Operator</option>
                    <option value="Planner">Geotechnical Planner</option>
                    <option value="Regulator">Safety Regulator</option>
                  </select>
                </>
              )}

              <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#c9bfaf' }}>
                Mobile Number
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(194, 171, 143, 0.2)',
                borderRadius: 8, padding: '0 14px', marginBottom: 16,
                transition: 'border-color 0.2s',
              }}>
                <Phone size={15} color="#c2ab8f" style={{ flexShrink: 0 }} />
                <input
                  id="login-phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#f5f0e8', fontSize: 15, padding: '13px 0',
                    fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em',
                  }}
                  autoFocus
                />
                <span style={{ fontSize: 11, color: '#7a6e60', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>+91</span>
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14, padding: '10px 12px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8 }}>
                  <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: '#fca5a5' }}>{error}</span>
                </div>
              )}

              <button
                id="login-send-otp-btn"
                onClick={handleSendOtp}
                disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? 'rgba(194, 171, 143, 0.2)' : 'linear-gradient(135deg, #c2ab8f, #8a765d)',
                  color: '#0c0a07', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 0 20px rgba(194, 171, 143, 0.2)',
                }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
                {loading ? 'Transmitting OTP...' : 'Send OTP Code'}
              </button>

              <p style={{ fontSize: 11, color: '#7a6e60', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
                Secure multi-channel authorization broadcast for mine personnel.
              </p>
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: '#c9bfaf', marginBottom: 4 }}>Authorization code dispatched to</div>
                <div style={{ fontSize: 15, color: '#c2ab8f', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                  +91 {phone.replace(/\D/g, '')}
                </div>
              </div>

              {/* 6-box OTP input */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{
                      width: 44, height: 52, textAlign: 'center', fontSize: 20,
                      fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                      background: digit ? 'rgba(194, 171, 143, 0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${digit ? '#c2ab8f' : 'rgba(194, 171, 143, 0.2)'}`,
                      borderRadius: 8, color: '#f5f0e8', outline: 'none',
                      transition: 'all 0.15s',
                    }}
                  />
                ))}
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14, padding: '10px 12px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8 }}>
                  <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: '#fca5a5' }}>{error}</span>
                </div>
              )}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14, color: '#c2ab8f', fontSize: 13 }}>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Verifying credentials...
                </div>
              )}

              {success && !loading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, padding: '10px 12px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 8 }}>
                  <CheckCircle2 size={14} color="#4ade80" />
                  <span style={{ fontSize: 12, color: '#86efac' }}>{success}</span>
                </div>
              )}

              {/* Resend & back */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <button
                  onClick={() => { setStep('phone'); setError(''); setOtp(['','','','','','']); }}
                  style={{ background: 'none', border: 'none', color: '#7a6e60', fontSize: 12, cursor: 'pointer', padding: 0 }}
                >
                  ← Change number
                </button>
                <button
                  id="login-resend-btn"
                  onClick={handleResend}
                  disabled={countdown > 0}
                  style={{
                    background: 'none', border: 'none', cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    color: countdown > 0 ? '#5c4e3f' : '#c2ab8f', fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                    fontWeight: 600
                  }}
                >
                  <RefreshCw size={11} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom brand strip */}
        <div style={{ padding: '12px 36px', borderTop: '1px solid rgba(194, 171, 143, 0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#7a6e60', fontFamily: 'JetBrains Mono, monospace' }}>STRATA GEOTECHNICAL</span>
          <span style={{ fontSize: 10, color: '#c2ab8f', fontFamily: 'JetBrains Mono, monospace', opacity: 0.8 }}>DGMS COMPLIANT</span>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #100e0b inset !important; -webkit-text-fill-color: #f5f0e8 !important; }
      `}</style>
    </div>
  );
}
