import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const to = "+917977289946";

const client = twilio(sid, token);

// Test every known trial template with a contentVariable
// so we can see which ones actually pass through our content vs Twilio's own canned messages
const templates = [
  'sms_2fa',
  'sms_appointment_reminders',
  'sms_order_confirmation',
  'sms_delivery_updates',
  'sms_customer_support',
  'sms_marketing_promotions',
  'sms_event_notifications',
  'sms_feedback_surveys',
  'sms_internal_alerts',
];

async function testOne(body) {
  try {
    const msg = await client.messages.create({
      to, from: process.env.TWILIO_PHONE_NUMBER, body,
      contentVariables: JSON.stringify({ "1": "STRATA-ANOMALY-TEST", "2": "N02", "3": "N03->Surface" }),
    });
    console.log(`✅ ${body} — SID: ${msg.sid}`);
    return true;
  } catch (err) {
    console.log(`❌ ${body} — ${err.message}`);
    return false;
  }
}

// Only test the first one that works — we don't want to flood the phone
// Run them one by one with a delay
(async () => {
  for (const t of templates) {
    const ok = await testOne(t);
    if (ok) {
      console.log(`\n✔ Use this template: "${t}"`);
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }
})();
