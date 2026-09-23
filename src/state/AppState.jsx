import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

const AppContext = createContext(null);

// ─── Multi-language translation maps ───────────────────────────────────────
const translations = {
  en: {
    // Navigation
    home: 'Home',
    dashboard: 'Dashboard',
    monitoring: 'Live Monitoring',
    map: 'Mine Map',
    network: 'Sensor Network',
    ai: 'AI Assessment',
    alerts: 'Alerts',
    about: 'About Us',
    arch: 'System Architecture',
    analytics: 'Analytics',
    // UI elements
    ground_condition: 'GROUND CONDITION',
    risk_index: 'SUBSIDENCE RISK INDEX',
    affected_zone: 'AFFECTED LOCATION',
    active_alerts: 'ACTIVE ALERTS',
    status: 'SYSTEM STATUS',
    online: 'ONLINE',
    gateway: 'Gateway',
    nodes: 'Nodes',
    rf_health: 'RF Health',
    demo_data: 'DEMO DATA',
    simulate_anomaly: 'SIMULATE ANOMALY',
    reset_state: 'RESET NORMAL',
    tilt: 'TILT',
    strain: 'STRAIN',
    vibration: 'VIBRATION',
    crack_status: 'CRACK STATUS',
    battery: 'BATTERY',
    rssi: 'RSSI',
    normal: 'NORMAL',
    watch: 'WATCH',
    warning: 'WARNING',
    critical: 'CRITICAL',
    // OARS UI
    oarsWelcome: 'OARS Geotechnical Voice Assistant online. Say "Hey OARS" to wake me, or ask me about sensor metrics.',
    oarsTitle: 'OARS Voice Assistant',
    wakeWordActive: 'OARS online. How can I help?',
    wakeWordLabel: 'WAKE WORD',
    wakeIndicator: '🎙 SAY "HEY OARS" ANYTIME · ALWAYS LISTENING',
    micButton: 'Ask anything or use voice...',
    // OARS responses
    tiltResponse: null,
    strainResponse: null,
    vibrationResponse: null,
    crackResponse: null,
    alertResponse: null,
    noAlertResponse: 'All telemetry nodes are within safe calibrated baselines. There are no active alarms.',
    riskResponse: null,
    costResponse: 'Our Smart Mesh client nodes are ultra-low cost, estimated at ₹810 INR ($10 USD) per node, utilizing off-the-shelf ESP32 microcontrollers, MPU6050, and HX711 strain converters.',
    problemResponse: 'STRATA is an enterprise-grade real-time IoT and AI-driven geotechnical safety monitoring platform, designed to track surface displacement, tilt, and strain above underground coal mine panels to predict and alert on subsidence hazards.',
    networkResponse: null,
    coalResponse: 'Field trial parameters configured for Sector A/B of West Bokaro Coalfield, Jharkhand, above active underground panels extracting from seam Jharia-II at 120m depth.',
    greetingResponse: 'Hello! I am OARS, your voice and text safety assistant. Ask me about tilt, strain, active alarms, risk index, or node costs. You can also tell me "go to dashboard" or "show mine map".',
    defaultResponse: 'I can query all live metrics. Try asking about tilt levels, strain percentages, active alerts, regional risk index, or hardware component costs.',
    navDashboard: 'Navigating to the STRATA real-time Control Dashboard.',
    navMonitoring: 'Opening the live sensor telemetry monitoring grid.',
    navMap: 'Opening the West Bokaro 3D interactive mine map.',
    navNetwork: 'Opening the LoRa mesh network topology view.',
    navAI: 'Loading XGBoost model inference and explainability metrics.',
    navAlerts: 'Opening active safety warnings log.',
    navAnalytics: 'Loading monthly analytical charts and export logs.',
    navAbout: 'Loading the About Us page for STRATA Technologies.',
    navHome: 'Returning to the STRATA landing home page.',
    anomalyTrigger: 'Warning triggered: Simulating geotechnical subsidence at West Panel Node N02.',
    anomalyReset: 'Reset signal sent. Restoring normal telemetry bounds across all surface mesh nodes.',
    wakeTriggered: '👋 Hey OARS triggered! Listening for your command...',
  },
  hi: {
    // Navigation
    home: 'मुख्य पृष्ठ',
    dashboard: 'डैशबोर्ड',
    monitoring: 'लाइव निगरानी',
    map: 'खदान का नक्शा',
    network: 'सेंसर नेटवर्क',
    ai: 'एआई मूल्यांकन',
    alerts: 'अलर्ट',
    about: 'हमारे बारे में',
    arch: 'प्रणाली संरचना',
    analytics: 'विश्लेषण',
    // UI elements
    ground_condition: 'भूमि की स्थिति',
    risk_index: 'धंसाव जोखिम सूचकांक',
    affected_zone: 'प्रभावित क्षेत्र',
    active_alerts: 'सक्रिय अलर्ट',
    status: 'सिस्टम स्थिति',
    online: 'सक्रिय',
    gateway: 'गेटवे',
    nodes: 'नोड्स',
    rf_health: 'आरएफ स्वास्थ्य',
    demo_data: 'डेमो डेटा',
    simulate_anomaly: 'असामान्यता अनुकरण करें',
    reset_state: 'सामान्य स्थिति पर लाएं',
    tilt: 'झुकाव',
    strain: 'तनाव',
    vibration: 'कंपन',
    crack_status: 'दरार की स्थिति',
    battery: 'बैटरी',
    rssi: 'आरएसएसआई',
    normal: 'सामान्य',
    watch: 'निगरानी',
    warning: 'चेतावनी',
    critical: 'गंभीर',
    // OARS UI (Hindi)
    oarsWelcome: 'OARS जियोतकनीकी वॉयस असिस्टेंट ऑनलाइन। "Hey OARS" कहकर सक्रिय करें, या सेंसर मेट्रिक्स पूछें।',
    oarsTitle: 'OARS वॉयस असिस्टेंट',
    wakeWordActive: 'OARS ऑनलाइन। मैं कैसे मदद करूँ?',
    wakeWordLabel: 'वेक वर्ड',
    wakeIndicator: '🎙 "Hey OARS" कभी भी कहें · हमेशा सुन रहा है',
    micButton: 'कुछ पूछें या आवाज़ का उपयोग करें...',
    // OARS responses (Hindi)
    tiltResponse: null,
    strainResponse: null,
    vibrationResponse: null,
    crackResponse: null,
    alertResponse: null,
    noAlertResponse: 'सभी टेलीमेट्री नोड्स सुरक्षित सीमा के भीतर हैं। कोई सक्रिय अलर्ट नहीं है।',
    riskResponse: null,
    costResponse: 'हमारे स्मार्ट मेश क्लाइंट नोड्स बेहद कम लागत वाले हैं, अनुमानित ₹810 प्रति नोड, ESP32, MPU6050, और HX711 का उपयोग करके।',
    problemResponse: 'STRATA भूमिगत कोयला खदानों के लिए एक एंटरप्राइज-ग्रेड रियल-टाइम IoT और AI-संचालित जियोतकनीकी सुरक्षा निगरानी मंच है, जिसे धंसाव खतरों की भविष्यवाणी और चेतावनी देने के लिए डिजाइन किया गया है।',
    networkResponse: null,
    coalResponse: 'वेस्ट बोकारो कोलफील्ड, झारखंड के सेक्टर A/B के लिए फील्ड ट्रायल पैरामीटर कॉन्फ़िगर किए गए हैं, झरिया-II सीम पर 120 मीटर गहराई पर।',
    greetingResponse: 'नमस्ते! मैं OARS हूँ, आपका वॉयस और टेक्स्ट सुरक्षा सहायक। मुझसे झुकाव, तनाव, सक्रिय अलर्ट, जोखिम सूचकांक के बारे में पूछें। आप मुझे "डैशबोर्ड पर जाएं" भी कह सकते हैं।',
    defaultResponse: 'मैं सभी लाइव मेट्रिक्स क्वेरी कर सकता हूँ। झुकाव स्तर, तनाव प्रतिशत, सक्रिय अलर्ट, या हार्डवेयर लागत के बारे में पूछें।',
    navDashboard: 'STRATA रियल-टाइम कंट्रोल डैशबोर्ड पर नेविगेट हो रहे हैं।',
    navMonitoring: 'लाइव सेंसर टेलीमेट्री मॉनिटरिंग ग्रिड खुल रही है।',
    navMap: 'वेस्ट बोकारो 3D इंटरएक्टिव खदान मानचित्र खुल रहा है।',
    navNetwork: 'LoRa मेश नेटवर्क टोपोलॉजी व्यू खुल रहा है।',
    navAI: 'XGBoost मॉडल इन्फरेंस और एक्सप्लेनेबिलिटी मेट्रिक्स लोड हो रही है।',
    navAlerts: 'सक्रिय सुरक्षा चेतावनी लॉग खुल रहा है।',
    navAnalytics: 'मासिक विश्लेषणात्मक चार्ट और निर्यात लॉग लोड हो रहे हैं।',
    navAbout: 'STRATA Technologies के लिए हमारे बारे में पृष्ठ लोड हो रहा है।',
    navHome: 'STRATA लैंडिंग होम पेज पर वापस आ रहे हैं।',
    anomalyTrigger: 'चेतावनी सक्रिय: वेस्ट पैनल नोड N02 पर भू-तकनीकी धंसाव का अनुकरण।',
    anomalyReset: 'रीसेट सिग्नल भेजा गया। सभी नोड्स पर सामान्य टेलीमेट्री सीमाएं बहाल हो रही हैं।',
    wakeTriggered: '👋 Hey OARS सक्रिय! आपका आदेश सुन रहा है...',
  },
  ur: {
    // Navigation
    home: 'ہوم پیج',
    dashboard: 'ڈیش بورڈ',
    monitoring: 'براہ راست نگرانی',
    map: 'کان کا نقشہ',
    network: 'سنسر نیٹ ورک',
    ai: 'مصنوعی ذہانت جائزہ',
    alerts: 'انتباہات',
    about: 'ہمارے بارے میں',
    arch: 'سسٹم آرکیٹیکچر',
    analytics: 'تجزیہ',
    // UI elements
    ground_condition: 'زمین کی حالت',
    risk_index: 'دھنساؤ کا خطرہ انڈیکس',
    affected_zone: 'متاثرہ علاقہ',
    active_alerts: 'فعال انتباہات',
    status: 'سسٹم کی صورتحال',
    online: 'آن لائن',
    gateway: 'گیٹ وے',
    nodes: 'نوڈس',
    rf_health: 'سگنل صحت',
    demo_data: 'ڈیمو ڈیٹا',
    simulate_anomaly: 'غیر معمولی سمیلیٹر',
    reset_state: 'معمول پر لائیں',
    tilt: 'جھکاؤ',
    strain: 'کھنچاؤ',
    vibration: 'تھرتھراہٹ',
    crack_status: 'درار کی حالت',
    battery: 'بیٹری',
    rssi: 'سگنل طاقت',
    normal: 'نارمل',
    watch: 'واچ',
    warning: 'وارننگ',
    critical: 'خطرناک',
    // OARS UI (Urdu)
    oarsWelcome: 'OARS جیو ٹیکنیکل وائس اسسٹنٹ آن لائن۔ "Hey OARS" کہیں یا سینسر میٹرکس پوچھیں۔',
    oarsTitle: 'OARS وائس اسسٹنٹ',
    wakeWordActive: 'OARS آن لائن۔ میں کیسے مدد کر سکتا ہوں؟',
    wakeWordLabel: 'اِختیاری لفظ',
    wakeIndicator: '🎙 "Hey OARS" کسی بھی وقت بولو · ہمیشہ سن رہا ہے',
    micButton: 'کچھ پوچھیں یا آواز استعمال کریں...',
    // OARS responses (Urdu)
    tiltResponse: null,
    strainResponse: null,
    vibrationResponse: null,
    crackResponse: null,
    alertResponse: null,
    noAlertResponse: 'تمام ٹیلی میٹری نوڈس محفوظ حدود میں ہیں۔ کوئی فعال الارم نہیں ہے۔',
    riskResponse: null,
    costResponse: 'ہمارے سمارٹ میش کلائنٹ نوڈس انتہائی کم لاگت ہیں، تخمینہ ₹810 فی نوڈ، ESP32، MPU6050، اور HX711 استعمال کرکے۔',
    problemResponse: 'STRATA زیر زمین کوئلہ کانوں کے لیے ایک انٹرپرائز گریڈ ریئل ٹائم IoT اور AI سے چلنے والا حفاظتی نگرانی کا پلیٹ فارم ہے، جو کان دھنساؤ کے خطرات کی پیشن گوئی اور انتباہ کرنے کے لیے ڈیزائن کیا گیا ہے۔',
    networkResponse: null,
    coalResponse: 'ویسٹ بوکارو کول فیلڈ، جھارکھنڈ کے سیکٹر A/B کے لیے فیلڈ ٹرائل پیرامیٹر ترتیب دیے گئے ہیں، جھاریا-II سیم پر 120 میٹر گہرائی پر۔',
    greetingResponse: 'السلام علیکم! میں OARS ہوں، آپ کا وائس اور ٹیکسٹ سیفٹی اسسٹنٹ۔ مجھ سے جھکاؤ، کھنچاؤ، فعال انتباہات، یا خطرے کے انڈیکس کے بارے میں پوچھیں۔',
    defaultResponse: 'میں تمام لائیو میٹرکس سے معلومات دے سکتا ہوں۔ جھکاؤ، کھنچاؤ، فعال انتباہات، یا ہارڈویئر لاگت کے بارے میں پوچھیں۔',
    navDashboard: 'STRATA ریئل ٹائم کنٹرول ڈیش بورڈ پر جا رہے ہیں۔',
    navMonitoring: 'لائیو سنسر ٹیلی میٹری مانیٹرنگ گرڈ کھل رہی ہے۔',
    navMap: 'ویسٹ بوکارو 3D انٹرایکٹو کان کا نقشہ کھل رہا ہے۔',
    navNetwork: 'LoRa میش نیٹ ورک ٹوپولوجی ویو کھل رہا ہے۔',
    navAI: 'XGBoost ماڈل انفرنس اور وضاحتی میٹرکس لوڈ ہو رہے ہیں۔',
    navAlerts: 'فعال حفاظتی انتباہات لاگ کھل رہا ہے۔',
    navAnalytics: 'ماہانہ تجزیاتی چارٹس اور برآمد لاگ لوڈ ہو رہے ہیں۔',
    navAbout: 'STRATA Technologies کے بارے میں معلومات کا صفحہ لوڈ ہو رہا ہے۔',
    navHome: 'STRATA لینڈنگ ہوم پیج پر واپس جا رہے ہیں۔',
    anomalyTrigger: 'انتباہ فعال: ویسٹ پینل نوڈ N02 پر جیو ٹیکنیکل دھنساؤ کی نقل۔',
    anomalyReset: 'ری سیٹ سگنل بھیجا گیا۔ تمام نوڈس پر معمول کی ٹیلی میٹری حدود بحال ہو رہی ہیں۔',
    wakeTriggered: '👋 Hey OARS فعال! آپ کا حکم سن رہا ہے...',
  },
};

export function AppStateProvider({ children }) {
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());
  const [time, setTime] = useState(new Date());
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('en');
  const lastAlertRef = useRef(0); // timestamp of last SMS alert (debounce)
  const telemetryRef = useRef([]); // always holds latest telemetry for alert sending

  const [history, setHistory] = useState([]);
  const [telemetry, setTelemetry] = useState(() => {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      list.push({ id: `N${String(i).padStart(2, '0')}`, zone: '', depth: '', status: 'NORMAL', tilt: 0, strain: 0, vib: 0, crack: 'NO DETECTION', bat: 100, rssi: -70, snr: 8 });
    }
    return list;
  });
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [riskIndex, setRiskIndex] = useState(24);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const t = (key) => {
    const val = translations[lang]?.[key] ?? translations['en']?.[key];
    if (val === null) return '';
    return val ?? key;
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Poll Live Simulation Data from Backend ──────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/telemetry/live');
        const data = await res.json();
        if (data.success) {
          setHistory(data.history || []);
          setTelemetry(data.telemetry || []);
          setActiveAlerts(data.activeAlerts || []);
          setIsAnomaly(data.isAnomaly || false);
          setRiskIndex(data.riskIndex || 24);
        }
      } catch (err) {
        /* silently ignore network errors during polling */
      }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);


  // ── Anomaly SMS Alert: fire when isAnomaly goes true ─────────────────────
  useEffect(() => {
    if (!isAnomaly) return;
    
    console.log(`[DIAGNOSTIC] ANOMALY DETECTED: PASS`);
    
    const now = Date.now();
    // Debounce: minimum 60s between SMS alerts
    if (now - lastAlertRef.current < 60_000) {
      console.log(`[DIAGNOSTIC] ANOMALY ALERT SKIPPED: Debounced (Cooldown: ${Math.round((60_000 - (now - lastAlertRef.current)) / 1000)}s left)`);
      return;
    }
    lastAlertRef.current = now;

    // Read auth session from localStorage
    let token = null;
    try {
      const raw = localStorage.getItem('strata_session');
      if (raw) token = JSON.parse(raw).token;
    } catch { /* no session */ }
    
    if (!token) {
      console.error(`[DIAGNOSTIC] ANOMALY API CALLED: FAIL (No logged in session token found in localStorage. Please log in first.)`);
      return;
    }

    // Pull live node data from latest telemetry snapshot
    const snap = telemetryRef.current;
    const criticalNodes = snap.filter(n => n.status === 'CRITICAL');
    const watchNodes = snap.filter(n => n.status === 'WATCH');

    // Safe route: surface nodes that are NORMAL
    const safeRoute = snap
      .filter(n => n.depth === 'Surface' && n.status === 'NORMAL')
      .slice(0, 3)
      .map(n => `${n.id} (${n.zone})`);
    safeRoute.push('Surface Exit');

    console.log(`[DIAGNOSTIC] ANOMALY API CALLED: PASS`);

    fetch('/api/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        criticalNodes,
        watchNodes,
        safeRoute,
        dashboardUrl: window.location.origin + '/dashboard',
      }),
    })
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(d => {
        console.log(`[DIAGNOSTIC] BACKEND RECEIVED REQUEST: PASS`);
        console.log(`[DIAGNOSTIC] TWILIO RESPONSE: PASS (SID: ${d.sid || 'N/A'})`);
        console.log(`[DIAGNOSTIC] SMS SENT: PASS`);
      })
      .catch(err => {
        console.error(`[DIAGNOSTIC] BACKEND RECEIVED REQUEST / TWILIO CALL: FAIL (Error: ${err.message})`);
      });
  }, [isAnomaly]);
  // ─────────────────────────────────────────────────────────────────────────



  const groundCondition = useMemo(() => {
    if (riskIndex > 75) return { status: t('critical'), color:'var(--red)',    chipClass:'critical' };
    if (riskIndex > 50) return { status: t('warning'),  color:'var(--ember)', chipClass:'warning'  };
    if (riskIndex > 30) return { status: t('watch'),    color:'var(--yellow)', chipClass:'watch'    };
    return               { status: t('normal'),  color:'var(--green)', chipClass:'normal'   };
  }, [riskIndex, lang]);



  const toggleAcknowledge = (id) => {
    setAcknowledgedAlerts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Word-numbers spoken by voice → digits
  const WORD_NUMS = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
    ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,
    sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20 };

  const getChatbotResponse = async (query) => {
    // ── Merge latest real-time history snapshot into telemetry metadata ──────
    // history[] is updated every 2 s with live random readings.
    // telemetry (useMemo) only updates on anomaly toggle — its tilt/strain/vib
    // are stale between anomaly state changes.
    const latestSnap = history[history.length - 1] || {};
    const liveTelemetry = telemetry.map(node => ({
      ...node,
      tilt:   latestSnap[`${node.id}_tilt`]   ?? node.tilt,
      strain: latestSnap[`${node.id}_strain`] ?? node.strain,
      vib:    latestSnap[`${node.id}_vib`]    ?? node.vib,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          lang,
          telemetry: liveTelemetry,   // ← live readings, not static snapshot
          activeAlerts,
          riskIndex,
          groundCondition,
          timestamp: latestSnap.time || new Date().toLocaleTimeString('en-IN'),
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.response;
    } catch (err) {
      console.error('[CHAT_API_ERROR] using local fallback:', err);
      // ── Rich local fallback — always returns real sensor data ────────────
      const q = query.toLowerCase();

      // Resolve word-numbers: "node twelve" → 12
      const resolveNodeNum = (str) => {
        const wordMatch = Object.entries(WORD_NUMS).find(([w]) => str.includes(w));
        if (wordMatch) return wordMatch[1];
        const m = str.match(/(\d{1,2})/);
        return m ? parseInt(m[1]) : null;
      };

      // ── Node-specific query: "tilt of node 12", "note 2 vibration", "N15 battery" ──
      const isNodeQ = /(node|note|नोड|نوڈ|n\d)/i.test(q);
      if (isNodeQ) {
        const num = resolveNodeNum(q);
        if (num >= 1 && num <= 20) {
          const node = liveTelemetry[num - 1];   // ← live data
          if (node) {
            const wantsTilt   = /tilt|jhukao|झुकाव|جھکاؤ/.test(q);
            const wantsStrain = /strain|tanav|तनाव|کھنچاؤ/.test(q);
            const wantsVib    = /vibrat|vib|kampan|कंपन|تھرتھر/.test(q);
            const wantsBat    = /battery|bat|charge|बैटरी|بیٹری/.test(q);
            const wantsRssi   = /rssi|signal|rf|سگنل/.test(q);
            const wantsCrack  = /crack|darar|दरार|درار/.test(q);
            const wantsStatus = /status|condition|health|स्थिति|حالت/.test(q);

            if (wantsTilt)   return `Node ${node.id} (${node.zone}): Tilt = ${node.tilt.toFixed(3)}° | Status: ${node.status} | Threshold: 1.00°`;
            if (wantsStrain) return `Node ${node.id} (${node.zone}): Strain = ${node.strain.toFixed(3)}% | Status: ${node.status}`;
            if (wantsVib)    return `Node ${node.id} (${node.zone}): Vibration = ${node.vib.toFixed(3)}g | Status: ${node.status}`;
            if (wantsBat)    return `Node ${node.id} (${node.zone}): Battery = ${node.bat}%`;
            if (wantsRssi)   return `Node ${node.id} (${node.zone}): RSSI = ${node.rssi} dBm, SNR = ${node.snr} dB`;
            if (wantsCrack)  return `Node ${node.id} (${node.zone}): Crack sensor = "${node.crack}"`;
            if (wantsStatus) return `Node ${node.id} (${node.zone}) is ${node.status}. Tilt: ${node.tilt.toFixed(3)}°, Strain: ${node.strain.toFixed(3)}%, Crack: ${node.crack}.`;
            return `Node ${node.id} | ${node.zone} | Depth: ${node.depth} | Status: ${node.status} | Tilt: ${node.tilt.toFixed(3)}° | Strain: ${node.strain.toFixed(3)}% | Vib: ${node.vib.toFixed(3)}g | Crack: ${node.crack} | Battery: ${node.bat}% | RSSI: ${node.rssi} dBm`;
          }
        }
      }

      // ── General sensor queries (use liveTelemetry) ───────────────────────
      const n01 = liveTelemetry[0], n02 = liveTelemetry[1], n03 = liveTelemetry[2];

      if (/tilt|jhukao|झुकाव|جھکاؤ/.test(q)) {
        const anom = liveTelemetry.filter(n => n.status !== 'NORMAL');
        const extra = anom.length ? ` Anomalous: ${anom.map(n => `${n.id}: ${n.tilt.toFixed(2)}°`).join(', ')}.` : '';
        return `Tilt — N01: ${n01.tilt.toFixed(3)}°, N02: ${n02.tilt.toFixed(3)}°, N03: ${n03.tilt.toFixed(3)}°.${extra}`;
      }
      if (/strain|tanav|तनाव|کھنچاؤ/.test(q)) {
        return `Strain — N01: ${n01.strain.toFixed(3)}%, N02: ${n02.strain.toFixed(3)}%, N03: ${n03.strain.toFixed(3)}%.`;
      }
      if (/vibrat|kampan|कंपन|تھرتھر/.test(q)) {
        return `Vibration — N01: ${n01.vib.toFixed(3)}g, N02: ${n02.vib.toFixed(3)}g, N03: ${n03.vib.toFixed(3)}g.`;
      }
      if (/crack|darar|दरार|درار/.test(q)) {
        const cracked = liveTelemetry.filter(n => n.crack !== 'NO DETECTION');
        return cracked.length
          ? `${cracked.length} crack event(s): ${cracked.map(n => `${n.id}: ${n.crack}`).join(', ')}.`
          : 'No crack detection events across all 20 nodes.';
      }
      if (/alert|alarm|warning|khatra|انتباہ|अलर्ट/.test(q)) {
        if (activeAlerts.length > 0) {
          return `${activeAlerts.length} active alert(s). Latest: "${activeAlerts[0].title}" on ${activeAlerts[0].node}. Action: ${activeAlerts[0].recomm}`;
        }
        return 'All telemetry nodes are within safe baselines. No active alerts.';
      }
      if (/risk|index|score|jokhim|خطرہ|जोखिम/.test(q)) {
        return `Subsidence risk index: ${riskIndex}/100 — Ground: ${groundCondition.status}.`;
      }
      if (/critical|which node|which nodes|गंभीर|خطرناک/.test(q)) {
        const c = liveTelemetry.filter(n => n.status === 'CRITICAL');
        return c.length ? `${c.length} CRITICAL: ${c.map(n=>`${n.id} (Tilt:${n.tilt.toFixed(2)}°)`).join(', ')}.` : 'No CRITICAL nodes.';
      }
      if (/battery|बैटरी|بیٹری|charge|power/.test(q)) {
        const s = [...liveTelemetry].sort((a,b)=>a.bat-b.bat);
        return `Battery — Lowest: ${s[0].id} at ${s[0].bat}%, Highest: ${s[s.length-1].id} at ${s[s.length-1].bat}%.`;
      }
      if (/rssi|signal|lora|rf|network|नेटवर्क|نیٹ/.test(q)) {
        return `Network — N01: ${n01.rssi}dBm (SNR:${n01.snr}dB), N02: ${n02.rssi}dBm, N03: ${n03.rssi}dBm.`;
      }
      if (/summary|overview|all node|how many|total/.test(q)) {
        const c = telemetry.filter(n=>n.status==='CRITICAL').length;
        const w = telemetry.filter(n=>n.status==='WATCH').length;
        return `${telemetry.length} nodes total: ${telemetry.length-c-w} NORMAL, ${w} WATCH, ${c} CRITICAL. Risk: ${riskIndex}/100.`;
      }
      if (/cost|price|bom|paise|लागत|لاگت/.test(q)) return t('costResponse');
      if (/coal|bokaro|mine|खदान|کان/.test(q))      return t('coalResponse');
      if (/hello|namaste|salam|नमस्ते|السلام/.test(q)) return t('greetingResponse');
      return `I can answer questions about any of the 20 sensor nodes — ask "tilt of node 12", "battery of node 5", "which nodes are critical", or "risk index".`;
    }
  };

  const handleSetIsAnomaly = async (newVal) => {
    let val = typeof newVal === 'function' ? newVal(isAnomaly) : newVal;
    try {
      await fetch('/api/simulation/anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: val })
      });
      setIsAnomaly(val);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider value={{
      isAnomaly, setIsAnomaly: handleSetIsAnomaly,
      acknowledgedAlerts, toggleAcknowledge,
      time, history,
      telemetry, riskIndex, groundCondition, activeAlerts,
      theme, setTheme,
      lang, setLang, t,
      getChatbotResponse,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}
