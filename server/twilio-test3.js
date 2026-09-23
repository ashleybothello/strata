import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const to = "+917977289946";

const client = twilio(sid, token);

async function runTests() {
  try {
    await client.messages.create({ to, from: process.env.TWILIO_PHONE_NUMBER, body: "Hello" });
  } catch (err) {
    console.log(`❌ ERROR CODE: ${err.code}, MORE INFO: ${err.moreInfo}, STATUS: ${err.status}`);
  }
}

runTests();
