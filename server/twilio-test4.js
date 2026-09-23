import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const to = "+917977289946";

const client = twilio(sid, token);

async function runTests() {
  try {
    await client.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      // Pass the template name? Maybe it's 'TemplateName' or 'TemplateSid'?
      // Or maybe just body: "sms_2fa" ?
      body: "sms_2fa"
    });
    console.log(`✅ SUCCESS body: sms_2fa`);
  } catch (err) {
    console.log(`❌ ERROR body: sms_2fa -> ${err.message}`);
  }
}

runTests();
