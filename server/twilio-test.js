import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
// We'll test with the user's own phone number to ensure it's the verified one
const to = "+917977289946"; // The one from their screenshot

const client = twilio(sid, token);

const templatesToTest = [
  "Your Twilio code is 123456",
  "Your Twilio verification code is: 123456",
  "Your verification code is 123456",
  "123456",
  "[STRATA] Your code is 123456",
  "Your Twilio code is 123456.",
  "Your Twilio code is: 123456"
];

async function runTests() {
  console.log("Testing Twilio Trial Templates...");
  for (const body of templatesToTest) {
    try {
      await client.messages.create({ to, from: process.env.TWILIO_PHONE_NUMBER, body });
      console.log(`✅ SUCCESS: "${body}"`);
      break; // stop on first success
    } catch (err) {
      console.log(`❌ FAILED: "${body}" -> ${err.message}`);
    }
  }
}

runTests();
