// Full-Stack Connectivity and API Verification Suite
async function runTests() {
  console.log('====================================================');
  console.log('   STRATA FULL-STACK API & CONNECTIVITY TEST SUITE  ');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3001';
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. Health Check
  await test('GET /api/health (Unified Gateway Health)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== 'ok') throw new Error('Health check returned non-ok status');
    console.log(`   ↳ Services: Gateway=${json.services.expressGateway.status}, DB=${json.services.database.status}, Gemini=${json.services.geminiAI.status}`);
  });

  // 2. Auth OTP flow
  let devToken = null;
  await test('POST /api/send-otp (Authentication Dispatch)', async () => {
    const res = await fetch(`${BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error('OTP send failed');
  });

  await test('POST /api/verify-otp (Token & Session Generation)', async () => {
    const res = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210', otp: '123456', isRegistering: true, name: 'Admin Engineer' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.token) throw new Error('Token not generated');
    devToken = json.token;
    console.log(`   ↳ Generated Session Token: ${devToken.slice(0, 12)}...`);
  });

  // 3. Live Telemetry Stream
  await test('GET /api/telemetry/live (20-node mesh feed)', async () => {
    const res = await fetch(`${BASE_URL}/api/telemetry/live`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.telemetry || json.telemetry.length !== 20) throw new Error(`Expected 20 nodes, got ${json.telemetry?.length}`);
    console.log(`   ↳ Mesh Nodes: ${json.telemetry.length} | Risk Index: ${json.riskIndex} | History Length: ${json.history?.length}`);
  });

  // 4. Anomaly Simulation Toggle
  await test('POST /api/simulation/anomaly (Toggle Anomaly State)', async () => {
    const res = await fetch(`${BASE_URL}/api/simulation/anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.isAnomaly) throw new Error('Anomaly state failed to toggle to true');

    // Reset back
    await fetch(`${BASE_URL}/api/simulation/anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false })
    });
  });

  // 5. OARS Chatbot & Gemini AI
  await test('POST /api/chat (OARS Intelligence / Gemini Inference)', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'tilt of node 2', lang: 'en', telemetry: [] })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.response) throw new Error('Empty chat response');
    console.log(`   ↳ OARS response preview: "${json.response.slice(0, 70)}..."`);
  });

  // 6. Hardware Sensor Telemetry Endpoint
  await test('GET /api/hardware_telemetry (ESP32 Sensor Interface)', async () => {
    const res = await fetch(`${BASE_URL}/api/hardware_telemetry`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.data) throw new Error('No data field in hardware response');
    console.log(`   ↳ Source: ${json.source} | Data items: ${json.data.length || 1}`);
  });

  // 7. ML Analytics Bridge
  await test('GET /api/ml/validation (Predictive Metrics Interface)', async () => {
    const res = await fetch(`${BASE_URL}/api/ml/validation`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log(`   ↳ Validation: RMSE=${json.rmse_mm}mm, R2=${json.r2_score}`);
  });

  console.log('\n----------------------------------------------------');
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('----------------------------------------------------\n');
}

runTests().catch(console.error);
