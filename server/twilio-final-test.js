import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const critStr = "N02, N08, N15";
const watchStr = "N01, N07, N14";
const routeStr = "N03 -> N04 -> N05 -> Surface";
const url = "http://localhost:5174/dashboard";

const compactAlert =
  `[STRATA] ANOMALY DETECTED! ` +
  `CRITICAL: ${critStr}. ` +
  `WATCH: ${watchStr}. ` +
  `SAFE ROUTE: ${routeStr}. ` +
  `Monitor: ${url}`;

console.log("Sending anomaly alert:\n", compactAlert, "\n");

client.messages.create({
  to: "+917977289946",
  from: process.env.TWILIO_PHONE_NUMBER,
  body: 'sms_2fa',
  contentVariables: JSON.stringify({ "1": compactAlert })
})
.then(msg => console.log(`✅ Sent! SID: ${msg.sid}`))
.catch(err => console.log(`❌ Failed: ${err.message}`));
