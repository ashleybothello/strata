import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const to = "+917977289946";

const client = twilio(sid, token);

const payloadsToTest = [
  { body: "sms_account_alerts", contentVariables: JSON.stringify({ "1": "Critical Anomaly at N02, N08! Escape via N05." }) },
  { body: "sms_internal_alerts", contentVariables: JSON.stringify({ "1": "Anomaly", "2": "N02" }) },
];

async function runTests() {
  for (const params of payloadsToTest) {
    try {
      await client.messages.create({ to, from: process.env.TWILIO_PHONE_NUMBER, ...params });
      console.log(`✅ SUCCESS: ${JSON.stringify(params)}`);
    } catch (err) {
      console.log(`❌ FAILED: ${JSON.stringify(params)} -> ${err.message}`);
    }
  }
}

runTests();
