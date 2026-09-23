import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const to = "+917977289946";

const client = twilio(sid, token);

async function runTests() {
  console.log("Testing Twilio Trial Content API...");
  try {
    const msg = await client.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      contentSid: 'HXxxxxxxxx', // Wait, contentSid usually starts with HX
      // Actually, if it's "sms_2fa", maybe Twilio expects `messagingBinding`?
    });
    console.log(`✅ SUCCESS:`, msg.sid);
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }
}

runTests();
