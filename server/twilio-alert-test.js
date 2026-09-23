import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const to = "+917977289946";

const client = twilio(sid, token);

// Simulate exactly what the server sends for anomaly alerts
const critStr = "N02 (Central Surface Hub), N08 (Central Panels Drift A), N15 (Deep Seam West)";
const watchStr = "N01 (North Surface Sector A), N07 (West Panel Corridor 2)";
const routeStr = "N03 → N04 → N05 → Surface Exit";
const url = "http://localhost:5174/dashboard";

const customAlert = `STRATA ANOMALY ALERT
CRITICAL: ${critStr}
WATCH: ${watchStr}
SAFE ROUTE: ${routeStr}
LIVE: ${url}`;

console.log("Sending test alert SMS...");
console.log("Message content:\n", customAlert);

client.messages.create({
  to,
  from: process.env.TWILIO_PHONE_NUMBER,
  body: 'sms_account_alerts',
  contentVariables: JSON.stringify({ "1": customAlert })
})
.then(msg => console.log(`✅ SUCCESS! SID: ${msg.sid}`))
.catch(err => console.log(`❌ FAILED: ${err.message}`));
