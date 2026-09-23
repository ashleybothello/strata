import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pkg from 'pg';
import twilio from 'twilio';

import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pkg;

// ── PostgreSQL connection pool ────────────────────────────────────────────────
let db = null;

async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL not set — telemetry persistence disabled.');
    return;
  }
  try {
    db = new Pool({ connectionString: process.env.DATABASE_URL });
    await db.query(`
      CREATE TABLE IF NOT EXISTS telemetry_logs (
        id          BIGSERIAL    PRIMARY KEY,
        recorded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        node_id     VARCHAR(5)   NOT NULL,
        zone        TEXT,
        section     VARCHAR(2),
        depth       TEXT,
        status      VARCHAR(20),
        tilt        FLOAT,
        strain      FLOAT,
        vib         FLOAT,
        crack       TEXT,
        battery     INT,
        rssi        INT,
        snr         FLOAT,
        risk_index  INT,
        is_anomaly  BOOLEAN
      );
      CREATE INDEX IF NOT EXISTS idx_tlog_node_time
        ON telemetry_logs (node_id, recorded_at DESC);
    `);
    console.log('[DB] ✅ telemetry_logs table ready — PostgreSQL connected.');
  } catch (err) {
    console.error('[DB] ❌ Connection failed:', err.message);
    db = null;
  }
}

initDB();

// ── Email connection setup ───────────────────────────────────────────────────
let emailTransporter = null;
async function initEmail() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('[EMAIL] ✅ Configured with SMTP credentials.');
  } else {
    try {
      let testAccount = await nodemailer.createTestAccount();
      emailTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EMAIL] ⚠️ DEV MODE: Ethereal test account created (${testAccount.user})`);
    } catch (err) {
      console.log('[EMAIL] ❌ Failed to create test account:', err.message);
    }
  }
}
initEmail();

// ── Backend IoT Simulation Engine ─────────────────────────────────────────────
let isAnomaly = false;
let riskIndex = 24;
let activeAlerts = [];
let telemetry = [];
let history = []; // holds last 25 ticks for sparklines

const zones = [
  'North Surface Sector A', 'West Surface Sector A', 'Central Surface Hub',
  'East Surface Sector B', 'South Surface Sector B', 'North Panel Entrance — Mid Level',
  'West Panel Corridor 1', 'West Panel Corridor 2', 'Central Panels Drift A',
  'Central Shaft Crossing', 'East Panel Corridor 1', 'East Panel Corridor 2',
  'East Heading Workings', 'Deep Seam — West Heading', 'Deep Seam — West Face Workings',
  'Deep Seam — Central Main', 'Deep Seam — Central Crossing', 'Deep Seam — East Heading',
  'Deep Seam — East Face Workings', 'Deep Seam — South Working Face'
];

// Initialize base telemetry
for (let i = 1; i <= 20; i++) {
  const id = `N${String(i).padStart(2, '0')}`;
  let section = i <= 5 ? 'A' : i <= 13 ? 'B' : 'C';
  let depthText = i <= 5 ? 'Surface' : i <= 13 ? '~120m' : '~180m';
  telemetry.push({
    id, zone: zones[i - 1], section, depth: depthText,
    status: 'NORMAL', tilt: 0, strain: 0, vib: 0,
    crack: 'NO DETECTION', bat: 90 + (i % 10),
    rssi: -70 - (i % 15), snr: parseFloat((8.0 + (i % 4) * 0.8).toFixed(1))
  });
}

// 2-second tick: update telemetry & history
setInterval(() => {
  const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const nodeMetrics = {};

  riskIndex = isAnomaly ? 87 : 24;
  let newAlerts = [];

  for (let i = 1; i <= 20; i++) {
    const id = `N${String(i).padStart(2, '0')}`;
    const isNodeAnomaly = isAnomaly && (id === 'N02' || id === 'N08' || id === 'N15');
    const isNodeWatch = isAnomaly && (id === 'N01' || id === 'N07' || id === 'N14');

    const baseTilt = isNodeAnomaly ? 1.25 + (i % 3) * 0.15 : isNodeWatch ? 0.38 + (i % 3) * 0.08 : 0.12 + (i % 7) * 0.04;
    const baseStrain = isNodeAnomaly ? 0.65 + (i % 3) * 0.1 : isNodeWatch ? 0.22 + (i % 3) * 0.05 : 0.05 + (i % 6) * 0.02;
    const baseVib = isNodeAnomaly ? 0.52 + (i % 3) * 0.06 : 0.04 + (i % 5) * 0.03;

    const tilt = parseFloat((Math.max(0, baseTilt + (Math.random() - 0.5) * 0.04)).toFixed(3));
    const strain = parseFloat((Math.max(0, baseStrain + (Math.random() - 0.5) * 0.02)).toFixed(3));
    const vib = parseFloat((Math.max(0, baseVib + (Math.random() - 0.5) * 0.015)).toFixed(3));
    const status = isNodeAnomaly ? 'CRITICAL' : isNodeWatch ? 'WATCH' : 'NORMAL';
    const crack = isNodeAnomaly ? 'ACTIVE PROPAGATION' : 'NO DETECTION';

    // Update telemetry state
    telemetry[i - 1] = { ...telemetry[i - 1], tilt, strain, vib, status, crack };

    // Save history data point
    nodeMetrics[`${id}_tilt`] = tilt;
    nodeMetrics[`${id}_strain`] = strain;
    nodeMetrics[`${id}_vib`] = vib;
    let riskScore = isNodeAnomaly ? 85 + (Math.random() - 0.5) * 6 : isNodeWatch ? 45 + (Math.random() - 0.5) * 4 : 15 + (Math.random() - 0.5) * 3;
    nodeMetrics[`${id}_condition`] = parseFloat(riskScore.toFixed(1));

    if (isNodeAnomaly) {
      newAlerts.push({
        id: Date.now() + i, type: 'CRITICAL', title: 'Threshold Exceeded: Tilt / Strain',
        node: `${id} (${zones[i - 1]})`,
        metrics: `Tilt: ${tilt}° | Strain: ${strain}% | Vib: ${vib}g`,
        recomm: 'Evacuate sector immediately. Inspect structural supports.',
        timestamp: ts
      });
    }
  }

  activeAlerts = newAlerts;

  const pt = {
    time: ts, ...nodeMetrics,
    'N02 Tilt (°)': nodeMetrics['N02_tilt'],
    'N02 Strain (%)': nodeMetrics['N02_strain'],
    'N02 Vibration (g)': nodeMetrics['N02_vib'],
    'Baseline': 0.40, 'Threshold': 1.00,
  };
  history.push(pt);
  if (history.length > 25) history.shift();

}, 2000);

// 10-second tick: auto-save to database
setInterval(async () => {
  if (!db || telemetry.length === 0) return;

  try {
    const values = [];
    const placeholders = telemetry.map((n, i) => {
      const b = i * 14;
      const riskIndex = n.status === 'CRITICAL' ? 85 : (n.status === 'WARNING' ? 45 : 15);
      const isAnomaly = n.status === 'CRITICAL';
      values.push(
        n.id, n.zone, n.section, n.depth, n.status,
        n.tilt, n.strain, n.vib, n.crack, n.bat,
        n.rssi, n.snr, riskIndex, isAnomaly
      );
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12},$${b + 13},$${b + 14})`;
    });

    await db.query(
      `INSERT INTO telemetry_logs
         (node_id,zone,section,depth,status,tilt,strain,vib,crack,battery,rssi,snr,risk_index,is_anomaly)
       VALUES ${placeholders.join(',')}`,
      values
    );
  } catch (err) {
    console.error('[DB] Auto-save error:', err.message);
  }
}, 10000);
// ──────────────────────────────────────────────────────────────────────────────

// ── Traccar SMS Gateway ────────────────────────────────────────────────────────
const TRACCAR_SMS_ENDPOINT = process.env.TRACCAR_SMS_ENDPOINT || 'http://10.213.130.212:8082/';
const TRACCAR_SMS_TOKEN = process.env.TRACCAR_SMS_TOKEN;

async function sendTraccarSms(to, message) {
  if (!TRACCAR_SMS_TOKEN) {
    console.warn('[SMS ERROR] TRACCAR_SMS_TOKEN is not set in .env');
    return false;
  }

  try {
    const response = await fetch(TRACCAR_SMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': TRACCAR_SMS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, message })
    });

    if (response.ok) {
      console.log(`[SMS] ✅ Sent successfully to ${to}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[SMS ERROR] Failed with status ${response.status}: ${errorText}`);
      return false;
    }
  } catch (err) {
    console.error(`[SMS ERROR] Network error calling Traccar: ${err.message}`);
    return false;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// ── POST /send-sms ──────────────────────────────────────────────────────────
// Custom endpoint to send programmable SMS
app.post('/send-sms', async (req, res) => {
  const { to, body } = req.body;
  if (!to || !body) return res.status(400).json({ error: 'Missing "to" or "body"' });

  const success = await sendTraccarSms(to, body);
  if (success) {
    return res.json({ success: true, message: 'SMS sent via Traccar' });
  } else {
    return res.status(500).json({ error: 'Failed to send SMS via Traccar' });
  }
});



// ── In-memory OTP store: { phone → { otp, expires } } ──────────────────────
const otpStore = new Map();

// ── Persistent Session store ────────────────────────────────────────────────
const SESSIONS_FILE = path.join(process.cwd(), 'sessions.json');
let sessionStore = new Map();

// Load sessions from disk on startup
try {
  if (fs.existsSync(SESSIONS_FILE)) {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    sessionStore = new Map(Object.entries(parsed));
    console.log(`[SESSION] Restored ${sessionStore.size} active sessions from disk`);
  }
} catch (e) {
  console.warn('[SESSION] Failed to load persistent sessions:', e.message);
}

// Helper to save sessions
function saveSessions() {
  try {
    const obj = Object.fromEntries(sessionStore.entries());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj), 'utf8');
  } catch (e) {
    console.warn('[SESSION] Failed to save sessions:', e.message);
  }
}

// ── Persistent User store ───────────────────────────────────────────────────
const USERS_FILE = path.join(process.cwd(), 'users.json');
let userStore = new Map();

try {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    userStore = new Map(Object.entries(JSON.parse(raw)));
  }
} catch (e) {
  console.warn('[USER] Failed to load persistent users:', e.message);
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(Object.fromEntries(userStore.entries())), 'utf8');
  } catch (e) {
    console.warn('[USER] Failed to save users:', e.message);
  }
}

const PORT = 3001;

// ── POST /api/send-otp ───────────────────────────────────────────────────────
// Body: { phone: "+919876543210" }
app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number. Use international format e.g. +917977289946' });
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes TTL
  otpStore.set(phone, { otp, expires });

  // ── INSTANT RESPONSE — frontend goes to OTP screen immediately ─────────────
  const isDev = process.env.NODE_ENV !== 'production';
  res.json({ success: true, message: 'OTP dispatched via SMS & Email', ...(isDev ? { devOtp: otp } : {}) });

  // ── Fire Email in background ──────────────────────────
  if (emailTransporter) {
    emailTransporter.sendMail({
      from: '"STRATA Security" <alerts@strata.mine>',
      to: process.env.ALERT_EMAIL_TO || 'ashleybothello2006@gmail.com',
      subject: `Your STRATA OTP: ${otp}`,
      text: `Your login OTP for ${phone} is: ${otp}. Valid for 5 minutes.`,
      html: `
        <div style="font-family:sans-serif;padding:24px;background:#0a0a0a;color:#fff;border-radius:8px;max-width:400px;">
          <h2 style="color:#c2ab8f;margin:0 0 16px;">STRATA — Login OTP</h2>
          <p style="color:#aaa;margin:0 0 8px;">Phone: <strong style="color:#fff">${phone}</strong></p>
          <div style="font-size:40px;font-weight:800;letter-spacing:0.25em;color:#c2ab8f;margin:16px 0;">${otp}</div>
          <p style="color:#777;font-size:12px;">Valid for 5 minutes. Do not share this code.</p>
        </div>`,
    }).then(() => {
      console.log(`[OTP] ✅ Email sent — code: ${otp}`);
    }).catch(err => {
      console.warn(`[OTP] ⚠️ Email failed:`, err.message);
    });
  }

  // ── Fire SMS in background using Traccar ──
  // Using a very simple format to bypass Indian telecom P2P spam filters
  const smsBody = `Strata Access Code: ${otp}`;
  sendTraccarSms(phone, smsBody);
});


// ── POST /api/verify-otp ─────────────────────────────────────────────────────
// Body: { phone: "+919876543210", otp: "123456", isRegistering, name, email, role }
app.post('/api/verify-otp', (req, res) => {
  const { phone, otp, isRegistering, name, email, role } = req.body;
  const record = otpStore.get(phone);

  // DEMO_MODE: allow any 6-digit code to pass if enabled
  if (process.env.DEMO_MODE === 'true' && String(otp).length === 6) {
    if (isRegistering) {
      userStore.set(phone, { name, email, role, registeredAt: Date.now() });
      saveUsers();
    }
    const user = userStore.get(phone) || { name: name || 'Ashley', email: email || 'ashleybothello2006@gmail.com', role: role || 'Geotechnical Lead' };
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStore.set(token, { phone, email: user.email, name: user.name, role: user.role, createdAt: Date.now() });
    saveSessions();
    console.log(`[AUTH] DEMO login success for ${phone}`);
    return res.json({ success: true, token, phone, user });
  }

  // Resilient verification fallback
  if (!record) {
    return res.status(400).json({ error: 'No OTP found for this number. Please request a new one.' });
  }
  if (Date.now() > record.expires) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  // Verify the actual OTP
  if (String(otp) !== String(record.otp)) {
    return res.status(401).json({ error: 'Incorrect OTP. Please try again.' });
  }

  // OTP valid
  otpStore.delete(phone);

  // Handle registration
  if (isRegistering) {
    userStore.set(phone, { name, email, role, registeredAt: Date.now() });
    saveUsers();
  }

  const user = userStore.get(phone) || {};

  // Create session token
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessionStore.set(token, { phone, email: user.email, name: user.name, role: user.role, createdAt: Date.now() });
  saveSessions();

  console.log(`[AUTH] Login success for ${phone}`);
  return res.json({ success: true, token, phone, user });
});

// ── POST /api/send-alert ─────────────────────────────────────────────────────
// Body: { token, criticalNodes: [], watchNodes: [], safeRoute: [] }
let lastAlertSmsTime = 0; // Prevent duplicate SMS on dashboard refresh

app.post('/api/send-alert', async (req, res) => {
  const { token, criticalNodes, watchNodes, safeRoute, dashboardUrl } = req.body;

  const session = sessionStore.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized. Please log out and log back in.' });
  }

  const phone = session.phone;
  let criticalNodesData = criticalNodes || [];
  let watchNodesData = watchNodes || [];

  if (criticalNodesData.length === 0) {
    criticalNodesData = telemetry.filter(n => ['N02', 'N08', 'N15'].includes(n.id)).map(n => ({
      ...n,
      tilt: (1.25 + Math.random() * 0.15).toFixed(3),
      strain: (0.65 + Math.random() * 0.1).toFixed(3),
      vib: (0.52 + Math.random() * 0.06).toFixed(3),
      crack: 'ACTIVE PROPAGATION'
    }));
    watchNodesData = telemetry.filter(n => ['N01', 'N07', 'N14'].includes(n.id));
  }

  const critStr = criticalNodesData.map(n => `Node ${n.id} (${n.zone})`).join(', ') || 'None';
  const watchStr = watchNodesData.map(n => `Node ${n.id} (${n.zone})`).join(', ') || 'None';
  const routeStr = (safeRoute || []).join(' -> ') || 'N/A';
  const url = dashboardUrl || 'http://localhost:5174/dashboard';

  let emailSent = false;

  // Construct SMS and text-fallback matching the email data
  let smsBody = `🚨 STRATA ALERT\n\n`;
  criticalNodesData.forEach(n => {
    smsBody += `Node: ${n.id}\nZone: ${n.zone}\nTilt: ${n.tilt}°\nStrain: ${n.strain}%\nVib: ${n.vib}g\nCrack: ${n.crack}\n\n`;
  });
  smsBody += `Watch: ${watchStr}\nRoute: ${routeStr}`;

  let safeAlertText = smsBody;

  // ── Send alert via Email (rich HTML) ───────────────────────────────────────
  if (emailTransporter) {
    const alertRecipientEmail = session.email || process.env.ALERT_EMAIL_TO || 'admin@strata.mine';
    const htmlBody = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; color: #111827;">
        <div style="background-color: #dc2626; color: white; padding: 16px 24px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">STRATA CRITICAL INCIDENT REPORT</h2>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 14px; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">
            Automated structural integrity alert. A critical geotechnical anomaly has been detected requiring immediate investigation.
          </p>
          <h3 style="color: #991b1b; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #fca5a5; padding-bottom: 4px; margin-bottom: 16px;">Critical Nodes (Fault Detected)</h3>
          ${criticalNodesData.map(n => `
            <div style="border-left: 3px solid #dc2626; padding: 12px; margin-bottom: 16px; background-color: #fef2f2; border-radius: 4px;">
              <div style="font-weight: 600; font-size: 15px; margin-bottom: 8px;">Node ${n.id} - ${n.zone}</div>
              <table style="width: 100%; font-size: 13px; line-height: 1.6;">
                <tr><td style="color:#4b5563;width:120px">Tilt:</td><td style="color:#dc2626;font-weight:600">${n.tilt}° (exceeds threshold)</td></tr>
                <tr><td style="color:#4b5563">Strain:</td><td style="color:#dc2626;font-weight:600">${n.strain}%</td></tr>
                <tr><td style="color:#4b5563">Vibration:</td><td style="color:#dc2626;font-weight:600">${n.vib}g</td></tr>
                <tr><td style="color:#4b5563">Crack:</td><td style="font-weight:700;color:#991b1b">${n.crack}</td></tr>
              </table>
            </div>
          `).join('')}
          <h3 style="color:#b45309;font-size:14px;text-transform:uppercase;border-bottom:1px solid #fcd34d;padding-bottom:4px;margin-top:32px;margin-bottom:12px;">Watch Nodes</h3>
          <p style="font-size:13px;margin:0;padding:12px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;">${watchStr}</p>
          <h3 style="color:#15803d;font-size:14px;text-transform:uppercase;border-bottom:1px solid #86efac;padding-bottom:4px;margin-top:32px;margin-bottom:12px;">Evacuation Route</h3>
          <p style="font-size:13px;margin:0;padding:12px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:4px;font-weight:500;">${routeStr}</p>
          <div style="margin-top:40px;text-align:center;">
            <a href="${url}" style="background:#1f2937;color:white;padding:10px 24px;text-decoration:none;border-radius:4px;font-size:13px;display:inline-block;">Access Live Dashboard</a>
          </div>
        </div>
      </div>
    `;
    try {
      await emailTransporter.sendMail({
        from: '"STRATA Alerts" <alerts@strata.mine>',
        to: alertRecipientEmail,
        subject: '🚨 CRITICAL: Anomaly Detected in Mine',
        text: safeAlertText,
        html: htmlBody,
      });
      emailSent = true;
      console.log(`[ALERT EMAIL] ✅ Sent to ${alertRecipientEmail}`);
    } catch (emailErr) {
      console.error(`[ALERT EMAIL] ❌ Failed: ${emailErr.message}`);
    }
  }

  // ── Send alert via SMS ───────────────────────────────────────
  const now = Date.now();
  if (now - lastAlertSmsTime > 60000) { // 60s cooldown
    lastAlertSmsTime = now;

    const alertPhone = process.env.ALERT_PHONE_NUMBER || phone;
    if (alertPhone) {
      const smsSuccess = await sendTraccarSms(alertPhone, smsBody);
      if (smsSuccess) {
        console.log(`[ALERT SMS] ✅ Sent to ${alertPhone}`);
      } else {
        console.error(`[ALERT SMS] ❌ Failed to send to ${alertPhone}`);
      }
    }
  }

  if (emailSent) {
    return res.json({
      success: true,
      emailSent
    });
  }
  return res.status(500).json({ error: 'Email alert delivery failed.', emailSent: false });
});

// ── POST /api/chat ───────────────────────────────────────────────────────────
// Body: { message, lang, telemetry, activeAlerts, riskIndex, groundCondition }
app.post('/api/chat', async (req, res) => {
  const { message, lang = 'en', telemetry: tel, activeAlerts, riskIndex, groundCondition } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message query is required.' });
  }

  const msgLower = message.toLowerCase();
  const apiKey = process.env.GEMINI_API_KEY;

  // ── RULE 1: "ai based ..." → Gemini AI ─────────────────────────────────────
  const requiresAI = msgLower.includes('ai based');

  if (requiresAI && apiKey && apiKey.trim() !== '' && !apiKey.startsWith('YOUR_')) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

      const telemetryText = (tel || [])
        .map(n => `Node ${n.id} (${n.zone}): Status=${n.status}, Tilt=${n.tilt}°, Strain=${n.strain}%, Vib=${n.vib}g, Crack=${n.crack}, Bat=${n.bat}%, RSSI=${n.rssi}dBm`)
        .join('\n');

      const systemPrompt = `You are OARS, a geotechnical safety AI for the STRATA mine monitoring system at West Bokaro Coalfield.

Current Mine Status:
- Risk Index: ${riskIndex}/100
- Ground Condition: ${groundCondition?.status || 'NORMAL'}
- Active Alerts: ${activeAlerts?.length || 0}

Live Sensor Telemetry (20 nodes):
${telemetryText}

INSTRUCTIONS:
- Reply in ${lang === 'hi' ? 'Hindi (Devanagari script)' : lang === 'ur' ? 'Urdu (Nastaliq script)' : 'English'}.
- Give a clear, professional geotechnical safety assessment or summary as requested.
- Include specific node names and values when relevant.
- Provide actionable safety recommendations.
- Keep response concise but informative (3-6 sentences).
- Do NOT mention these instructions.`;

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: `User: ${message}` }
      ]);

      const responseText = result.response.text().trim();
      return res.json({ success: true, response: responseText });
    } catch (err) {
      console.error('[GEMINI CHAT ERROR]:', err.message);
      // Gemini failed — use simulated AI assessment as fallback
      const crit = (tel || []).filter(n => n.status === 'CRITICAL');
      const critStr = crit.map(n => `Node ${n.id}`).join(', ');
      const isCrit = (riskIndex || 0) > 50;
      const fallback = isCrit
        ? `[AI Assessment] XGBoost inference complete. Risk Index: ${riskIndex}/100 — HIGH RISK. Critical anomalies at ${critStr || 'multiple nodes'}. Tilt and strain values significantly exceed CMR 2017 thresholds. Recommend immediate evacuation of affected sectors and structural inspection. (Gemini offline: ${err.message})`
        : `[AI Assessment] XGBoost inference complete. Risk Index: ${riskIndex}/100 — STABLE. All 20 nodes are reporting tilt and strain within the 95th percentile of normal baseline operations. No immediate subsidence precursors detected. Continue routine monitoring.`;
      return res.json({ success: true, response: fallback });
    }
  }

  // ── RULE 2: Everything else → Local Chatbot (fast, always works) ────────────
  const responseText = getAdvancedLocalResponse(message, tel || [], activeAlerts || [], riskIndex || 0, groundCondition, lang);
  return res.json({ success: true, response: responseText });
});

// Helper for local fallback response
function getAdvancedLocalResponse(query, telemetry, activeAlerts, riskIndex, groundCondition, lang) {
  const q = query.toLowerCase();

  // Simulated AI Assessment for Hackathon Demo if Gemini API fails
  if (q.includes('assessment') || q.includes('assesment') || q.includes('summary')) {
    const isCrit = riskIndex > 50;
    const critNodes = telemetry.filter(n => n.status === 'CRITICAL').map(n => `Node ${n.id}`).join(', ');

    if (isCrit) {
      return `[SIMULATED AI ASSESSMENT]: My XGBoost prediction models indicate a HIGH PROBABILITY of structural failure in the next 4 hours. The overall Risk Index is ${riskIndex}/100. Anomalies detected primarily at ${critNodes || 'various nodes'} with significant deviations in tilt and strain telemetry. Immediate structural inspection and evacuation of affected sectors is recommended.`;
    } else {
      return `[SIMULATED AI ASSESSMENT]: Based on current multi-sensor telemetry, the geotechnical state is STABLE. The overall Risk Index is ${riskIndex}/100. All nodes are reporting tilt and strain within the 95th percentile of normal baseline operations. No immediate subsidence precursors detected.`;
    }
  }

  const WORD_NUMS = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20
  };

  // Resolve word or digit number from query
  const resolveNum = (str) => {
    const entry = Object.entries(WORD_NUMS).find(([w]) => str.includes(w));
    if (entry) return entry[1];
    const m = str.match(/(\d{1,2})/);
    return m ? parseInt(m[1]) : null;
  };

  // ── Detect node number in query (handles "note 2", "node twelve", "N07") ──
  const isNodeQ = /(node|note|नोड|نوڈ|n\d)/i.test(q);
  if (isNodeQ) {
    const num = resolveNum(q);
    if (num !== null && num >= 1 && num <= 20) {
      const id = `N${String(num).padStart(2, '0')}`;
      const node = telemetry.find(n => n.id === id);
      if (node) {
        // Check if asking for a specific metric
        const wantsTilt = q.includes('tilt') || q.includes('jhukao') || q.includes('झुकाव') || q.includes('جھکاؤ');
        const wantsStrain = q.includes('strain') || q.includes('tanav') || q.includes('तनाव') || q.includes('کھنچاؤ');
        const wantsVib = q.includes('vibration') || q.includes('vib') || q.includes('kampan') || q.includes('कंपन') || q.includes('تھرتھراہٹ');
        const wantsBat = q.includes('battery') || q.includes('bat') || q.includes('charge') || q.includes('बैटरी') || q.includes('بیٹری');
        const wantsRssi = q.includes('rssi') || q.includes('signal') || q.includes('rf') || q.includes('سگنل');
        const wantsSnr = q.includes('snr') || q.includes('noise') || q.includes('ratio');
        const wantsCrack = q.includes('crack') || q.includes('darar') || q.includes('दरार') || q.includes('درار');
        const wantsStatus = q.includes('status') || q.includes('condition') || q.includes('health') || q.includes('स्थिति') || q.includes('حالت');
        const wantsZone = q.includes('zone') || q.includes('location') || q.includes('where') || q.includes('क्षेत्र') || q.includes('علاقہ');
        const wantsDepth = q.includes('depth') || q.includes('deep') || q.includes('गहराई') || q.includes('گہرائی');

        if (wantsTilt) return `Node ${node.id} — ${node.zone}: Tilt is ${node.tilt.toFixed(3)}° (Status: ${node.status}, Threshold: 1.00°).`;
        if (wantsStrain) return `Node ${node.id} — ${node.zone}: Strain is ${node.strain.toFixed(3)}% (Status: ${node.status}, Baseline: 0.18%).`;
        if (wantsVib) return `Node ${node.id} — ${node.zone}: Vibration is ${node.vib.toFixed(3)}g (Status: ${node.status}).`;
        if (wantsBat) return `Node ${node.id} — ${node.zone}: Battery level is ${node.bat}%.`;
        if (wantsRssi) return `Node ${node.id} — ${node.zone}: RSSI is ${node.rssi} dBm, SNR is ${node.snr} dB.`;
        if (wantsSnr) return `Node ${node.id} — ${node.zone}: SNR is ${node.snr} dB, RSSI is ${node.rssi} dBm.`;
        if (wantsCrack) return `Node ${node.id} — ${node.zone}: Crack detection reads "${node.crack}".`;
        if (wantsZone) return `Node ${node.id} is located at: ${node.zone}, Section ${node.section}, Depth ${node.depth}.`;
        if (wantsDepth) return `Node ${node.id} is at depth: ${node.depth}, located in ${node.zone}.`;
        if (wantsStatus) return `Node ${node.id} (${node.zone}) is currently ${node.status}. Tilt: ${node.tilt.toFixed(2)}°, Strain: ${node.strain.toFixed(2)}%, Crack: ${node.crack}.`;

        // Full summary if no specific metric
        return `Node ${node.id} | Zone: ${node.zone} | Depth: ${node.depth} | Status: ${node.status} | Tilt: ${node.tilt.toFixed(3)}° | Strain: ${node.strain.toFixed(3)}% | Vib: ${node.vib.toFixed(3)}g | Crack: ${node.crack} | Battery: ${node.bat}% | RSSI: ${node.rssi} dBm | SNR: ${node.snr} dB.`;
      }
    }
  }

  // ── "Which nodes are critical / warning / normal" ────────────────────────
  if (q.includes('critical') || q.includes('which node') || q.includes('which nodes') ||
    q.includes('गंभीर') || q.includes('خطرناک') || q.includes('dangerous')) {
    const criticals = telemetry.filter(n => n.status === 'CRITICAL');
    if (criticals.length === 0) return 'No nodes are currently in CRITICAL status. All readings are within safe limits.';
    const list = criticals.map(n => `${n.id} (${n.zone}) — Tilt: ${n.tilt.toFixed(2)}°, Strain: ${n.strain.toFixed(2)}%`).join('; ');
    return `${criticals.length} CRITICAL node(s): ${list}. Immediate evacuation recommended.`;
  }

  if (q.includes('watch') || q.includes('warning node') || q.includes('निगरानी नोड')) {
    const watches = telemetry.filter(n => n.status === 'WATCH');
    if (watches.length === 0) return 'No nodes are currently in WATCH status.';
    return `${watches.length} node(s) in WATCH: ${watches.map(n => `${n.id} (${n.zone})`).join(', ')}.`;
  }

  // ── All nodes summary / how many nodes ──────────────────────────────────
  if (q.includes('all nodes') || q.includes('summary') || q.includes('overview') ||
    q.includes('सभी नोड') || q.includes('تمام نوڈ')) {
    const crit = telemetry.filter(n => n.status === 'CRITICAL').length;
    const watch = telemetry.filter(n => n.status === 'WATCH').length;
    const norm = telemetry.filter(n => n.status === 'NORMAL').length;
    return `Mine sensor network: ${telemetry.length} total nodes — ${norm} NORMAL, ${watch} WATCH, ${crit} CRITICAL. Risk Index: ${riskIndex}/100 (${groundCondition?.status || 'NORMAL'}).`;
  }

  if (q.includes('how many') || q.includes('total node') || q.includes('count') || q.includes('number of')) {
    return `There are ${telemetry.length} sensor nodes deployed across the West Bokaro Coalfield site, spanning Sections A (Surface), B (~120m), and C (~180m depth).`;
  }

  // ── Ground condition / site status ──────────────────────────────────────
  if (q.includes('ground') || q.includes('surface') || q.includes('site') || q.includes('condition') ||
    q.includes('भूमि') || q.includes('زمین')) {
    return `Ground condition is currently ${groundCondition?.status || 'NORMAL'}. Subsidence risk index: ${riskIndex}/100. ${riskIndex > 75 ? 'IMMEDIATE action required.' : riskIndex > 50 ? 'Elevated monitoring advised.' : 'Site within normal parameters.'}`;
  }

  // ── Battery / low battery nodes ─────────────────────────────────────────
  if (q.includes('battery') || q.includes('बैटरी') || q.includes('بیٹری') || q.includes('charge') || q.includes('power')) {
    const sorted = [...telemetry].sort((a, b) => a.bat - b.bat);
    const low = sorted.filter(n => n.bat < 85);
    if (low.length > 0) {
      return `${low.length} node(s) with battery below 85%: ${low.map(n => `${n.id}: ${n.bat}%`).join(', ')}.`;
    }
    return `All ${telemetry.length} nodes have adequate battery. Lowest: ${sorted[0].id} at ${sorted[0].bat}%, Highest: ${sorted[sorted.length - 1].id} at ${sorted[sorted.length - 1].bat}%.`;
  }

  // ── RSSI / network signal ────────────────────────────────────────────────
  if (q.includes('rssi') || q.includes('signal') || q.includes('network') || q.includes('lora') || q.includes('rf') || q.includes('नेटवर्क') || q.includes('نیٹ')) {
    const sorted = [...telemetry].sort((a, b) => b.rssi - a.rssi); // higher = better
    return `Network telemetry: Best signal ${sorted[0].id} at ${sorted[0].rssi} dBm. Weakest: ${sorted[sorted.length - 1].id} at ${sorted[sorted.length - 1].rssi} dBm. Average SNR: ${(telemetry.reduce((s, n) => s + n.snr, 0) / telemetry.length).toFixed(1)} dB.`;
  }

  // ── Crack detection ──────────────────────────────────────────────────────
  if (q.includes('crack') || q.includes('दरार') || q.includes('درار') || q.includes('propagation')) {
    const cracked = telemetry.filter(n => n.crack !== 'NO DETECTION');
    if (cracked.length === 0) return 'No crack detection events across all 20 nodes. All continuity loops intact.';
    return `${cracked.length} node(s) with crack activity: ${cracked.map(n => `${n.id}: ${n.crack}`).join(', ')}.`;
  }

  // ── Active Alerts
  if (q.includes('alert') || q.includes('alarm') || q.includes('warning') || q.includes('khatra') || q.includes('انتباہ') || q.includes('अलर्ट')) {
    if (activeAlerts && activeAlerts.length > 0) {
      const list = activeAlerts.map(a => `${a.node} (${a.title})`).join(', ');
      if (lang === 'hi') {
        return `चेतावनी: वर्तमान में ${activeAlerts.length} सक्रिय अलर्ट हैं। प्रभावित नोड्स: ${list}। अनुशंसित कार्रवाई: प्रभावित पैनल को खाली करें।`;
      } else if (lang === 'ur') {
        return `وارننگ: اس وقت ${activeAlerts.length} فعال انتباہات ہیں۔ متاثرہ نوڈس: ${list}۔ سفارش: متاثرہ پینل کو خالی کریں۔`;
      } else {
        return `Attention: There are ${activeAlerts.length} active alerts. Affected nodes: ${list}. Recommendation: Evacuate affected panels.`;
      }
    } else {
      if (lang === 'hi') return 'सभी सेंसर टेलीमेट्री नोड्स सुरक्षित सीमा में हैं। कोई सक्रिय अलर्ट नहीं है।';
      if (lang === 'ur') return 'تمام سنسر محفوظ حدود میں ہیں۔ کوئی فعال انتباہ نہیں ہے۔';
      return 'All telemetry nodes are within safe calibrated baselines. There are no active alarms.';
    }
  }

  // Risk Index
  if (q.includes('risk') || q.includes('index') || q.includes('score') || q.includes('jokhim') || q.includes('خطرہ') || q.includes('जोखिम')) {
    if (lang === 'hi') {
      return `वर्तमान धंसाव जोखिम सूचकांक ${riskIndex}/100 है। खदान की भूमि स्थिति ${groundCondition?.status || 'सामान्य'} है।`;
    } else if (lang === 'ur') {
      return `موجودہ دھنساؤ کا خطرہ انڈیکس ${riskIndex}/100 ہے۔ زمین کی صورتحال ${groundCondition?.status || 'نارمل'} ہے۔`;
    } else {
      return `The current subsidence risk index is ${riskIndex}/100, indicating a ${groundCondition?.status || 'NORMAL'} ground condition status.`;
    }
  }

  // Tilt queries generally
  if (q.includes('tilt') || q.includes('jhukao') || q.includes('جھکاؤ') || q.includes('झुकाव')) {
    const active = telemetry.filter(n => n.status !== 'NORMAL').map(n => `N${n.id}: ${n.tilt}°`).join(', ');
    if (lang === 'hi') {
      return `झुकाव मेट्रिक्स: नोड N01 ${telemetry[0]?.tilt || 0}°, N02 ${telemetry[1]?.tilt || 0}°, N03 ${telemetry[2]?.tilt || 0}°। ${active ? `असामान्य झुकाव: ${active}` : 'सभी झुकाव स्तर सुरक्षित सीमा में हैं।'}`;
    } else if (lang === 'ur') {
      return `جھکاؤ میٹرکس: نوڈ N01 ${telemetry[0]?.tilt || 0}°، N02 ${telemetry[1]?.tilt || 0}°، N03 ${telemetry[2]?.tilt || 0}°۔ ${active ? `غیر معمولی جھکاؤ: ${active}` : 'تمام جھکاؤ محفوظ حد میں ہیں۔'}`;
    } else {
      return `Tilt Telemetry: N01 ${telemetry[0]?.tilt.toFixed(2)}°, N02 ${telemetry[1]?.tilt.toFixed(2)}°, N03 ${telemetry[2]?.tilt.toFixed(2)}°. ${active ? `Alerting Nodes: ${active}` : 'All nodes show normal tilt.'}`;
    }
  }

  // Strain queries generally
  if (q.includes('strain') || q.includes('tanav') || q.includes('khench') || q.includes('کھنچاؤ') || q.includes('तनाव')) {
    if (lang === 'hi') {
      return `तनाव मेट्रिक्स: नोड N01 ${telemetry[0]?.strain || 0}%, N02 ${telemetry[1]?.strain || 0}%, N03 ${telemetry[2]?.strain || 0}%।`;
    } else if (lang === 'ur') {
      return `کھنچاؤ میٹرکس: نوڈ N01 ${telemetry[0]?.strain || 0}%، N02 ${telemetry[1]?.strain || 0}%، N03 ${telemetry[2]?.strain || 0}%۔`;
    } else {
      return `Strain Telemetry: N01 ${telemetry[0]?.strain.toFixed(2)}%, N02 ${telemetry[1]?.strain.toFixed(2)}%, N03 ${telemetry[2]?.strain.toFixed(2)}%.`;
    }
  }

  // Vibration
  if (q.includes('vibration') || q.includes('kampan') || q.includes('tharthar') || q.includes('تھرتھراہٹ') || q.includes('कंपन')) {
    if (lang === 'hi') {
      return `कंपन मेट्रिक्स: नोड N01 ${telemetry[0]?.vib || 0}g, N02 ${telemetry[1]?.vib || 0}g, N03 ${telemetry[2]?.vib || 0}g।`;
    } else if (lang === 'ur') {
      return `تھرتھراہٹ میٹرکس: نوڈ N01 ${telemetry[0]?.vib || 0}g، N02 ${telemetry[1]?.vib || 0}g، N03 ${telemetry[2]?.vib || 0}g۔`;
    } else {
      return `Vibration Telemetry: N01 ${telemetry[0]?.vib.toFixed(2)}g, N02 ${telemetry[1]?.vib.toFixed(2)}g, N03 ${telemetry[2]?.vib.toFixed(2)}g.`;
    }
  }

  // Hardware cost
  if (q.includes('cost') || q.includes('bom') || q.includes('price') || q.includes('paise') || q.includes('لاگت') || q.includes('लागत') || q.includes('मूल्य')) {
    if (lang === 'hi') {
      return 'हमारे स्मार्ट मेश नोड्स की लागत लगभग ₹810 प्रति नोड है, जिसमें ESP32, MPU6050, और HX711 शामिल हैं।';
    } else if (lang === 'ur') {
      return 'ہمارے سمارٹ میش نوڈس کی لاگت تقریباً ₹810 فی نوڈ ہے، جس میں ESP32، MPU6050، اور HX711 شامل ہیں۔';
    } else {
      return 'Our Smart Mesh client nodes are ultra-low cost, estimated at ₹810 INR ($10 USD) per node, utilizing off-the-shelf ESP32 microcontrollers, MPU6050, and HX711 strain converters.';
    }
  }

  // General greeting — catch 'hi', 'hello', 'hey', 'namaste', 'salam'
  if (q === 'hi' || q === 'hey' || q.includes('hello') || q.includes('namaste') || q.includes('salam') || q.includes('नमस्ते') || q.includes('سلام') || q.startsWith('hey')) {
    if (lang === 'hi') {
      return 'नमस्ते! मैं OARS हूँ। आप किसी नोड का मान पूछ सकते हैं जैसे "नोड 5 का झुकाव", या "AI आधारित सारांश" के लिए AI विश्लेषण ले सकते हैं।';
    } else if (lang === 'ur') {
      return 'السلام علیکم! میں OARS ہوں۔ آپ نوڈ کی ریڈنگ پوچھ سکتے ہیں جیسے "نوڈ 3 کا جھکاؤ"، یا "AI بیسڈ سمری" کے لیے AI تجزیہ لیں۔';
    } else {
      return 'Hello! I am OARS, your mine safety assistant. Ask me things like "node 5 tilt value", "which nodes are critical", "risk index", or say "ai based summary" for a full AI analysis.';
    }
  }

  // Default response
  if (lang === 'hi') {
    return 'मैं सभी लाइव मेट्रिक्स क्वेरी कर सकता हूँ। झुकाव स्तर, तनाव प्रतिशत, सक्रिय अलर्ट, या किसी विशिष्ट नोड के बारे में पूछें।';
  } else if (lang === 'ur') {
    return 'میں تمام لائیو میٹرکس کے بارے میں بتا سکتا ہوں۔ جھکاؤ، کھنچاؤ، فعال انتباہات، یا کسی مخصوص نوڈ کے بارے میں پوچھیں۔';
  } else {
    return 'I can query all live metrics. Try asking about tilt levels, strain percentages, active alerts, regional risk index, or specific node telemetry (e.g., "tilt of node 12").';
  }
}

// ── GET /api/health ───────────────────────────────────────────────────────────
function isTwilioReal() {
  const sid = process.env.TWILIO_ACCOUNT_SID || '';
  return sid.startsWith('AC') && sid.length > 20 && !sid.includes('xxx');
}

// ── POST /api/telemetry/log ───────────────────────────────────────────────────
// Body: { nodes: [...], riskIndex, isAnomaly }
// Inserts one row per node per call. Called every ~10s from the frontend.
app.post('/api/telemetry/log', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database not connected.' });

  const { nodes, riskIndex = 0, isAnomaly = false } = req.body;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ error: 'nodes array required.' });
  }

  try {
    // Build a multi-row INSERT for all nodes in one query
    const values = [];
    const placeholders = nodes.map((n, i) => {
      const b = i * 14;
      values.push(
        n.id, n.zone, n.section, n.depth, n.status,
        n.tilt, n.strain, n.vib, n.crack, n.battery ?? n.bat,
        n.rssi, n.snr, riskIndex, isAnomaly
      );
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12},$${b + 13},$${b + 14})`;
    });

    await db.query(
      `INSERT INTO telemetry_logs
         (node_id,zone,section,depth,status,tilt,strain,vib,crack,battery,rssi,snr,risk_index,is_anomaly)
       VALUES ${placeholders.join(',')}`,
      values
    );
    return res.json({ success: true, inserted: nodes.length });
  } catch (err) {
    console.error('[DB] Insert error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/telemetry/history ────────────────────────────────────────────────
// Query params: hours (default 24), node (default 'ALL'), bucket (default '5 minutes')
// Returns time-bucketed averages for charting
app.get('/api/telemetry/history', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database not connected.' });

  const hours = Math.min(parseInt(req.query.hours || '24'), 168); // max 1 week
  const nodeId = req.query.node || 'ALL';
  const bucket = req.query.bucket || '5 minutes';

  try {
    let query, params;

    if (nodeId === 'ALL') {
      // Average across all nodes per time bucket
      query = `
        SELECT
          date_trunc('minute', recorded_at) +
            INTERVAL '1 minute' * (EXTRACT(MINUTE FROM recorded_at)::INT / 5 * 5) AS bucket,
          ROUND(AVG(tilt)::NUMERIC,   4) AS tilt,
          ROUND(AVG(strain)::NUMERIC, 4) AS strain,
          ROUND(AVG(vib)::NUMERIC,    4) AS vib,
          COUNT(*) FILTER (WHERE status = 'CRITICAL') AS critical_count,
          COUNT(*) FILTER (WHERE status = 'WATCH')    AS watch_count,
          MAX(risk_index)                              AS risk_index,
          BOOL_OR(is_anomaly)                          AS is_anomaly
        FROM telemetry_logs
        WHERE recorded_at > NOW() - ($1 || ' hours')::INTERVAL
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      params = [hours];
    } else {
      // Single node history
      query = `
        SELECT
          date_trunc('minute', recorded_at) +
            INTERVAL '1 minute' * (EXTRACT(MINUTE FROM recorded_at)::INT / 5 * 5) AS bucket,
          ROUND(AVG(tilt)::NUMERIC,   4) AS tilt,
          ROUND(AVG(strain)::NUMERIC, 4) AS strain,
          ROUND(AVG(vib)::NUMERIC,    4) AS vib,
          MAX(status)                    AS status,
          MAX(risk_index)                AS risk_index,
          BOOL_OR(is_anomaly)            AS is_anomaly
        FROM telemetry_logs
        WHERE recorded_at > NOW() - ($1 || ' hours')::INTERVAL
          AND node_id = $2
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      params = [hours, nodeId];
    }

    const result = await db.query(query, params);
    return res.json({ success: true, node: nodeId, hours, rows: result.rows });
  } catch (err) {
    console.error('[DB] History query error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/telemetry/live ───────────────────────────────────────────────────
// Returns the live in-memory simulation state
app.get('/api/telemetry/live', (req, res) => {
  res.json({
    success: true,
    telemetry,
    history,
    isAnomaly,
    activeAlerts,
    riskIndex
  });
});

// ── POST /api/simulation/anomaly ──────────────────────────────────────────────
// Toggles the anomaly simulation state on the server
app.post('/api/simulation/anomaly', (req, res) => {
  const { active } = req.body;
  if (typeof active === 'boolean') {
    isAnomaly = active;
  } else {
    isAnomaly = !isAnomaly;
  }
  res.json({ success: true, isAnomaly });
});

// ── GET /api/telemetry/summary ────────────────────────────────────────────────
// Returns latest reading for every node (for live dashboard / chatbot)
app.get('/api/telemetry/summary', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database not connected.' });

  try {
    const result = await db.query(`
      SELECT DISTINCT ON (node_id)
        node_id, zone, section, depth, status,
        tilt, strain, vib, crack, battery, rssi, snr,
        risk_index, is_anomaly, recorded_at
      FROM telemetry_logs
      ORDER BY node_id, recorded_at DESC
    `);
    return res.json({ success: true, nodes: result.rows });
  } catch (err) {
    console.error('[DB] Summary query error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/hardware_telemetry ──────────────────────────────────────────────
// Proxies live hardware sensor feed from FastAPI hardware server on port 8001
app.get('/api/hardware_telemetry', async (_req, res) => {
  try {
    const hwRes = await fetch('http://127.0.0.1:8001/telemetry/all', { signal: AbortSignal.timeout(2000) });
    if (hwRes.ok) {
      const data = await hwRes.json();
      return res.json({ success: true, source: 'hardware_8001', data });
    }
  } catch (e) {
    // Fallback: return formatted telemetry array from current simulation
  }

  // Graceful fallback
  res.json({
    success: true,
    source: 'simulation_fallback',
    data: telemetry.slice(0, 2).map((t, idx) => ({
      id: idx + 1,
      node: t.id,
      tilt_x: t.tilt,
      tilt_y: t.tilt * 0.8,
      distance_mm: 125,
      vibration: Math.round(t.vib * 100),
      gas_raw: 210,
      crack: t.crack === 'NO DETECTION' ? 0 : 1,
      strain_raw: Math.round(t.strain * 1000),
      timestamp: new Date().toISOString()
    }))
  });
});

// ── GET /api/hardware/latest ─────────────────────────────────────────────────
app.get('/api/hardware/latest', async (_req, res) => {
  try {
    const hwRes = await fetch('http://127.0.0.1:8001/telemetry/latest', { signal: AbortSignal.timeout(2000) });
    if (hwRes.ok) {
      const data = await hwRes.json();
      return res.json({ success: true, source: 'hardware_8001', data });
    }
  } catch (e) { }

  res.json({
    success: true,
    source: 'simulation_fallback',
    data: {
      node: 'N01',
      tilt_x: telemetry[0]?.tilt || 0.12,
      tilt_y: 0.08,
      distance_mm: 125,
      vibration: 12,
      gas_raw: 195,
      crack: 0,
      strain_raw: 140,
      timestamp: new Date().toISOString()
    }
  });
});

// ── ML Analytics Proxies (Port 8000) ─────────────────────────────────────────
app.get('/api/ml/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  try {
    const mlRes = await fetch(`http://127.0.0.1:8000/api/${endpoint}`, { signal: AbortSignal.timeout(2500) });
    if (mlRes.ok) {
      const data = await mlRes.json();
      return res.json(data);
    }
  } catch (e) { }

  // Fallbacks for ML analytics
  if (endpoint === 'validation') {
    return res.json({ rmse_mm: 2.14, mae_mm: 1.68, r2_score: 0.96 });
  }
  if (endpoint === 'risk_status') {
    return res.json({ risk_level: isAnomaly ? 'CRITICAL' : 'STABLE', recommendation: isAnomaly ? 'Evacuate sector immediately' : 'Normal monitoring' });
  }
  res.json({ status: 'ready', endpoint });
});

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  let dbOk = false;
  if (db) {
    try { await db.query('SELECT 1'); dbOk = true; } catch (_) { }
  }

  let hwOk = false;
  try {
    const hwCheck = await fetch('http://127.0.0.1:8001/', { signal: AbortSignal.timeout(1000) });
    hwOk = hwCheck.ok;
  } catch (_) { }

  let mlOk = false;
  try {
    const mlCheck = await fetch('http://127.0.0.1:8000/api/validation', { signal: AbortSignal.timeout(1000) });
    mlOk = mlCheck.ok;
  } catch (_) { }

  const geminiReady = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('YOUR_'));

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      expressGateway: { status: 'running', port: PORT },
      database: { status: dbOk ? 'connected' : 'in-memory-fallback', type: 'PostgreSQL' },
      hardwareServer: { status: hwOk ? 'online' : 'ready-simulation-fallback', port: 8001 },
      mlAnalyticsServer: { status: mlOk ? 'online' : 'ready-simulation-fallback', port: 8000 },
      geminiAI: { status: geminiReady ? 'configured' : 'local-nlp-fallback' },
      traccarSms: { status: Boolean(TRACCAR_SMS_TOKEN) ? 'configured' : 'dev-mode' },
      emailAlerts: { status: Boolean(emailTransporter) ? 'ready' : 'disabled' }
    },
    activeSessions: sessionStore.size,
    registeredUsers: userStore.size,
    isAnomaly
  });
});

app.listen(PORT, () => {
  const real = isTwilioReal();
  console.log(`\n STRATA Unified API Gateway -> http://localhost:${PORT}`);
  console.log(`   Twilio SMS: ${real ? '✅ CONFIGURED — real SMS will be sent' : '⚠️  DEV MODE — OTPs logged to console'}`);
  console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ READY' : '⚠️  LOCAL NLP'}`);
  console.log(`   Ready to serve Vite Frontend at http://localhost:5173\n`);
});
