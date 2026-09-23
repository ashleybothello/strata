import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mic, MicOff, Send, X, Radio, Globe, Loader } from 'lucide-react';
import { useAppState } from '../state/AppState';

const LANG_MAP = { en: 'en-IN', hi: 'hi-IN', ur: 'ur-PK' };

// ── Wake phrases that activate OARS ─────────────────────────────────────────
const WAKE_PHRASES = ['hey oars', 'hey ors', 'oars', 'hi oars', 'hey ours', 'ay oars'];

export default function OarsAssistant() {
  const { lang, setLang, t, getChatbotResponse, setIsAnomaly } = useAppState();

  const [isOpen,           setIsOpen]           = useState(false);
  const [messages,         setMessages]         = useState([]);
  const [inputValue,       setInputValue]       = useState('');
  const [isListening,      setIsListening]      = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isThinking,       setIsThinking]       = useState(false);
  const [micError,         setMicError]         = useState('');

  const navigate       = useNavigate();
  const chatEndRef     = useRef(null);

  // Refs that hold the two SR instances
  const wakeRecRef     = useRef(null);
  const talkRecRef     = useRef(null);

  // Flags (refs so closures always read latest value without re-creating effects)
  const wakeStoppedRef = useRef(false);  // component unmounted / lang changed
  const wakeSuspended  = useRef(false);  // temporarily paused while talk-rec is live

  // ── Init welcome message ──────────────────────────────────────────────────
  useEffect(() => {
    setMessages([{ id: 0, sender: 'bot', text: t('oarsWelcome') }]);
  }, [lang]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // ── Speech synthesis ──────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    
    // Fix for Chrome garbage collection bug stopping speech
    window.utterances = window.utterances || [];
    window.utterances.push(utt);
    utt.onend = () => {
      window.utterances = window.utterances.filter(u => u !== utt);
    };

    utt.rate  = 1.05;
    utt.pitch = 1.0;
    utt.lang  = LANG_MAP[lang] || 'en-IN';
    
    // Ensure a voice is explicitly selected if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const voice = voices.find(v => v.lang.startsWith(utt.lang.split('-')[0]));
      if (voice) utt.voice = voice;
    }

    window.speechSynthesis.speak(utt);
  }, [lang]);

  // ── Add message helper ────────────────────────────────────────────────────
  const addMsg = (sender, text, extra = {}) =>
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender, text, ...extra }]);

  // ── Remove loading bubble ─────────────────────────────────────────────────
  const removeLoading = () =>
    setMessages(prev => prev.filter(m => !m.isLoading));

  // ── Build a fresh SpeechRecognition ───────────────────────────────────────
  const buildRec = useCallback((continuous, interim) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous      = continuous;
    r.interimResults  = interim;
    r.lang            = LANG_MAP[lang] || 'en-IN';
    r.maxAlternatives = 3;
    return r;
  }, [lang]);

  // ── Resume wake-word listener ─────────────────────────────────────────────
  const resumeWake = useCallback(() => {
    wakeSuspended.current = false;
    if (wakeStoppedRef.current) return;
    // give the browser a moment to release the mic
    setTimeout(() => {
      if (wakeSuspended.current || wakeStoppedRef.current) return;
      try { wakeRecRef.current?.start(); } catch (_) {}
    }, 600);
  }, []);

  // ── Handle processed user message (navigation + chatbot) ─────────────────
  const handleUserMessage = useCallback(async (text) => {
    const raw = text.trim();
    if (!raw) return;

    addMsg('user', raw);
    addMsg('bot', '...', { isLoading: true });
    setIsThinking(true);

    const q = raw.toLowerCase();
    let response = '';

    try {
      // ── NAVIGATION INTENTS ─────────────────────────────────────────────────
      // Only navigate when user explicitly asks to "go to" / "take me to" / "open" a page
      // Or says the page name clearly as a navigation command
      const isNav = q.includes('take me to') || q.includes('go to') || q.includes('open') || q.includes('navigate');

      if ((isNav && q.includes('dashboard')) || (q === 'dashboard')) {
        navigate('/dashboard'); response = t('navDashboard');
      } else if ((isNav && q.includes('monitor')) || (q === 'monitoring')) {
        navigate('/monitoring'); response = t('navMonitoring');
      } else if ((isNav && q.includes('map')) || (q === 'map')) {
        navigate('/map'); response = t('navMap');
      } else if ((isNav && q.includes('network')) || (q === 'network')) {
        navigate('/network'); response = t('navNetwork');
      } else if (q === 'at assessment' || (isNav && q.includes('assessment'))) {
        navigate('/assessment'); response = t('navAI');
      } else if ((isNav && q.includes('alert')) || (q === 'alerts')) {
        navigate('/alerts'); response = t('navAlerts');
      } else if ((isNav && q.includes('analytics')) || (q === 'analytics')) {
        navigate('/analytics'); response = t('navAnalytics');
      } else if ((isNav && (q.includes('about') || q.includes('home')))) {
        navigate(q.includes('home') ? '/' : '/about'); response = t('navAbout');
      }
      // ── ANOMALY CONTROL ────────────────────────────────────────────────────
      else if (q.includes('simulate') || q.includes('trigger anomaly')) { setIsAnomaly(true);  response = t('anomalyTrigger'); }
      else if (q.includes('reset anomaly') || q.includes('clear anomaly'))   { setIsAnomaly(false); response = t('anomalyReset'); }
      // ── EVERYTHING ELSE → API chatbot (node values, greetings, ai based, etc) ─
      else {
        response = await getChatbotResponse(raw);
      }

      removeLoading();
      addMsg('bot', response || t('defaultResponse'));
      speak(response || t('defaultResponse'));
    } catch (err) {
      console.error('[OARS handleUserMessage]', err);
      removeLoading();
      const errMsg = 'Sorry, I could not fetch that data right now. Please try again.';
      addMsg('bot', errMsg);
      speak(errMsg);
    } finally {
      setIsThinking(false);
    }
  }, [navigate, setIsAnomaly, getChatbotResponse, t, speak]);


  // ── TALK recognition (push-to-talk / post-wake) ───────────────────────────
  const startTalkRec = useCallback(() => {
    // stop any previous talk rec
    try { talkRecRef.current?.abort(); } catch (_) {}

    const rec = buildRec(false, false);
    if (!rec) { setMicError('Speech recognition not supported. Use Chrome or Edge.'); return; }

    rec.onstart  = () => { setIsListening(true); setMicError(''); };
    rec.onresult = (e)  => {
      const transcript = e.results[0][0].transcript;
      handleUserMessage(transcript);
    };
    rec.onend    = () => { setIsListening(false); resumeWake(); };
    rec.onerror  = (e)  => {
      setIsListening(false);
      resumeWake();
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        setMicError('Mic access denied — allow microphone in your browser.');
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setMicError(`Mic error: ${e.error}`);
      }
    };

    talkRecRef.current = rec;
    try { rec.start(); } catch (e) {
      setMicError(`Could not start mic: ${e.message}`);
      resumeWake();
    }
  }, [buildRec, handleUserMessage, resumeWake]);

  // ── WAKE-WORD always-on listener ──────────────────────────────────────────
  useEffect(() => {
    wakeStoppedRef.current = false;
    wakeSuspended.current  = false;
    let retryTimer = null;

    const startWake = () => {
      if (wakeStoppedRef.current || wakeSuspended.current) return;
      try { wakeRecRef.current?.stop(); } catch (_) {}

      const rec = buildRec(true, true);
      if (!rec) return;

      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const tx = event.results[i][0].transcript.toLowerCase().trim();
          const isWake = WAKE_PHRASES.some(p => tx.includes(p));
          if (!isWake) continue;

          // Suspend wake, stop it, launch talk-rec
          wakeSuspended.current = true;
          try { rec.stop(); } catch (_) {}

          setIsOpen(true);
          setIsWakeWordActive(true);
          setTimeout(() => setIsWakeWordActive(false), 3000);
          speak(t('wakeWordActive'));

          if (event.results[i].isFinal) {
            addMsg('bot', t('wakeTriggered'));
            setTimeout(startTalkRec, 1000);
          }
          break;
        }
      };

      rec.onend   = () => { if (!wakeStoppedRef.current && !wakeSuspended.current) retryTimer = setTimeout(startWake, 400); };
      rec.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') console.warn('[Wake error]', e.error);
        if (!wakeStoppedRef.current && !wakeSuspended.current) retryTimer = setTimeout(startWake, 1000);
      };

      try {
        rec.start();
        wakeRecRef.current = rec;
      } catch (e) {
        console.warn('[Wake start failed]', e);
        if (!wakeStoppedRef.current && !wakeSuspended.current) retryTimer = setTimeout(startWake, 2000);
      }
    };

    startWake();

    return () => {
      wakeStoppedRef.current = true;
      clearTimeout(retryTimer);
      try { wakeRecRef.current?.stop(); } catch (_) {}
    };
  }, [lang]); // only restart when language changes

  // ── Toggle push-to-talk button ────────────────────────────────────────────
  const toggleListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setMicError('Speech recognition not supported. Use Chrome or Edge.');
      return;
    }
    setMicError('');

    if (isListening) {
      try { talkRecRef.current?.stop(); } catch (_) {}
      return;
    }

    // Suspend wake-word, start talk-rec
    wakeSuspended.current = true;
    try { wakeRecRef.current?.stop(); } catch (_) {}
    if (!isOpen) setIsOpen(true);
    setTimeout(startTalkRec, 200);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      handleUserMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSend(); };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="oars-widget">
      {isOpen ? (
        <div className="oars-panel">
          {/* ── Header ── */}
          <div className="oars-header" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={14} className="spin" style={{ color: '#c2ab8f' }} />
              <span className="oars-title" style={{ fontSize: '13px' }}>{t('oarsTitle')}</span>
              {isWakeWordActive && (
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: '#4ade80', background: 'rgba(34,197,94,0.12)', padding: '2px 6px', borderRadius: 3, letterSpacing: '0.05em' }}>
                  {t('wakeWordLabel')}
                </span>
              )}
              {isThinking && (
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: '#c2ab8f', background: 'rgba(194, 171, 143,0.1)', padding: '2px 6px', borderRadius: 3, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Loader size={8} className="spin" /> THINKING
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Language dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(194, 171, 143,0.12)', border: '1px solid rgba(194, 171, 143,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                <Globe size={11} style={{ color: '#c2ab8f' }} />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  style={{ background: 'transparent', color: '#c2ab8f', border: 'none', outline: 'none', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.05em' }}
                >
                  <option value="en" style={{ background: '#1a1a1a', color: '#e2e8f0' }}>EN</option>
                  <option value="hi" style={{ background: '#1a1a1a', color: '#e2e8f0' }}>HI</option>
                  <option value="ur" style={{ background: '#1a1a1a', color: '#e2e8f0' }}>UR</option>
                </select>
              </div>
              <button style={{ background: 'none', border: 'none', color: '#7a6e60', cursor: 'pointer', padding: 4 }} onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Chat body ── */}
          <div className="oars-body" style={{ padding: '12px', gap: '8px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-msg ${msg.sender}`}
                style={{
                  borderRadius: msg.sender === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                  padding: '8px 12px',
                  boxShadow: 'none',
                  border: msg.sender === 'bot' ? '1px solid rgba(194, 171, 143,0.15)' : 'none',
                  opacity: msg.isLoading ? 0.6 : 1,
                }}
              >
                {msg.isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader size={10} className="spin" style={{ color: '#c2ab8f' }} />
                    <span style={{ fontSize: 11, color: '#c2ab8f', fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>PROCESSING</span>
                  </span>
                ) : (
                  <div>{msg.text}</div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* ── Wake indicator ── */}
          <div className="oars-wake-indicator">
            {isListening
              ? '🔴 LISTENING — SPEAK NOW'
              : t('wakeIndicator')}
          </div>

          {/* ── Mic error banner ── */}
          {micError && (
            <div style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.15)', borderTop: '1px solid rgba(239,68,68,0.3)', fontSize: 10, color: '#f87171', fontFamily: 'var(--mono)' }}>
              ⚠ {micError}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="oars-footer" style={{ padding: '10px' }}>
            <input
              type="text"
              className="oars-input"
              placeholder={isListening ? 'Listening...' : t('micButton')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isListening}
            />
            <button
              className="oars-mic-btn"
              onClick={handleSend}
              style={{ background: 'rgba(194, 171, 143,0.2)', color: '#c2ab8f' }}
              title="Send"
              disabled={isListening || isThinking}
            >
              <Send size={14} />
            </button>
            <button
              className={`oars-mic-btn ${isListening ? 'active' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Push-to-talk'}
              style={isListening ? { background: 'rgba(239,68,68,0.2)', color: '#f87171', animation: 'pulse 1s infinite' } : {}}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <button
          className={`oars-trigger ${isListening ? 'listening' : ''}`}
          onClick={() => setIsOpen(true)}
          title="Open OARS · Say 'Hey OARS' anytime"
        >
          <MessageSquare size={20} />
        </button>
      )}
    </div>
  );
}
