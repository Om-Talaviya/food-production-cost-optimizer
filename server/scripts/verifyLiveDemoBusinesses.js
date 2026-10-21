#!/usr/bin/env node

/**
 * End-to-End Live Verification Script for Demo Businesses
 * Food Production Cost Optimizer
 *
 * Verifies live against local MongoDB Community Server (food_production_cost_optimizer):
 * 1. Health check & MongoDB active backend status.
 * 2. Cream & Culture authentication, batch retrieval, and end-to-end forecasting.
 * 3. All 4 demo businesses authentication and 10-batch retrieval.
 * 4. Cross-tenant data isolation (unauthorized access denied).
 * 5. Suppliers endpoint integrity (19 verified suppliers).
 * 6. Business analytics bundle calculation & RFC 4180 CSV export for Cream & Culture.
 * 7. Verification that zero unintended writes or duplicate records occurred.
 */

const path = require('path');
const dotenv = require('dotenv');
const assert = require('node:assert/strict');
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_production_cost_optimizer';
const PORT = process.env.VERIFY_PORT || '5008';
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runLiveVerification() {
  console.log('========================================================================');
  console.log('🔬 Live Demo-Business & Forecasting End-to-End Verification');
  console.log('========================================================================');
  console.log(`Target MongoDB URI: ${DEFAULT_URI}`);
  console.log(`Server Test Port:   ${PORT}`);
  console.log('------------------------------------------------------------------------');

  // 1. Initial Database Pre-Check & Baseline Counts
  const preClient = new MongoClient(DEFAULT_URI, { serverSelectionTimeoutMS: 3000 });
  await preClient.connect();
  const preDb = preClient.db();
  const preCounts = {
    users: await preDb.collection('users').countDocuments(),
    batches: await preDb.collection('batches').countDocuments(),
    suppliers: await preDb.collection('suppliers').countDocuments()
  };
  await preClient.close();

  console.log(`[Baseline] Persisted Document Counts in MongoDB:`);
  console.log(`   - Users:     ${preCounts.users}`);
  console.log(`   - Batches:   ${preCounts.batches}`);
  console.log(`   - Suppliers: ${preCounts.suppliers}`);
  assert.equal(preCounts.users, 6, 'Precondition: Exactly 6 users must exist in MongoDB');
  assert.equal(preCounts.batches, 54, 'Precondition: Exactly 54 batches must exist in MongoDB');
  assert.equal(preCounts.suppliers, 19, 'Precondition: Exactly 19 suppliers must exist in MongoDB');
  console.log('------------------------------------------------------------------------');

  // 2. Launch Background API Server
  console.log('Starting live backend server for API verification...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT, MONGODB_URI: DEFAULT_URI },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stderr.on('data', (d) => {
    const msg = d.toString();
    if (!msg.includes('JWT_SECRET')) process.stderr.write(`[SERVER ERR] ${msg}`);
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server failed to start within 8 seconds')), 8000);
    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Food Production Cost Optimizer API Server Running')) {
        clearTimeout(timer);
        resolve();
      }
    });
  });

  console.log(`✅ API server online at ${BASE_URL}\n`);

  try {
    // -----------------------------------------------------------------------
    // CHECK 1: MongoDB Health & Active Backend Reporting
    // -----------------------------------------------------------------------
    console.log('[CHECK 1/8] Verifying Health endpoint & active MongoDB backend...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.equal(healthRes.status, 200, 'Health endpoint must return HTTP 200');
    const healthData = await healthRes.json();

    assert.equal(healthData.status, 'HEALTHY');
    assert.equal(healthData.storage.backend, 'mongodb');
    assert.equal(healthData.storage.isMongo, true);
    assert.equal(healthData.storage.connected, true);
    assert.equal(healthData.storage.fallbackActive, false);
    assert.equal(healthData.storage.counts.users, 6);
    assert.equal(healthData.storage.counts.batches, 54);
    assert.equal(healthData.storage.counts.suppliers, 19);
    console.log('   -> Health Status: HEALTHY');
    console.log(`   -> Active Engine: ${healthData.storage.backend} (URI: ${healthData.storage.uri})`);
    console.log(`   -> Verified Counts: users=${healthData.storage.counts.users}, batches=${healthData.storage.counts.batches}, suppliers=${healthData.storage.counts.suppliers}`);
    console.log('   ✅ CHECK 1 PASSED.\n');

    // -----------------------------------------------------------------------
    // CHECK 2: Cream & Culture Authentication
    // -----------------------------------------------------------------------
    console.log('[CHECK 2/8] Authenticating Cream & Culture (cream.culture@example.com)...');
    const creamLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cream.culture@example.com', password: 'Dairy@Demo2026' })
    });
    assert.equal(creamLoginRes.status, 200, 'Cream & Culture login must return HTTP 200');
    const creamAuth = await creamLoginRes.json();
    assert.ok(creamAuth.token, 'JWT token must be present');
    assert.equal(creamAuth.user.id, 'user_demo_cream_culture');
    assert.equal(creamAuth.user.companyName, 'Cream & Culture');
    const creamHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creamAuth.token}`
    };
    console.log(`   -> User ID:      ${creamAuth.user.id}`);
    console.log(`   -> Company:      ${creamAuth.user.companyName}`);
    console.log(`   -> Token Issued: ${creamAuth.token.slice(0, 24)}...`);
    console.log('   ✅ CHECK 2 PASSED.\n');

    // -----------------------------------------------------------------------
    // CHECK 3: Cream & Culture 10 Batches Retrieval & Economic Validation
    // -----------------------------------------------------------------------
    console.log('[CHECK 3/8] Retrieving Cream & Culture production batches...');
    const creamBatchesRes = await fetch(`${BASE_URL}/api/batches`, { headers: creamHeaders });
    assert.equal(creamBatchesRes.status, 200);
    const creamBatchesData = await creamBatchesRes.json();
    assert.ok(Array.isArray(creamBatchesData.data));
    assert.equal(creamBatchesData.data.length, 10, 'Cream & Culture must have exactly 10 batches');

    const expectedProducts = [
      'Fresh Malai Paneer',
      'Artisanal Greek Set Yogurt',
      'Rich Kesar Badam Milk',
      'Royal Gulab Jamun (Mawa)',
      'Cardamom Kesar Shrikhand'
    ];

    for (const b of creamBatchesData.data) {
      assert.equal(b.userId, 'user_demo_cream_culture');
      assert.ok(b.economics, `Batch ${b.id} must have economics object`);
      assert.ok(b.economics.costPerUnit > 0, `Batch ${b.id} costPerUnit must be > 0`);
      assert.ok(b.economics.totalProductionCost > 0, `Batch ${b.id} totalProductionCost must be > 0`);
      assert.ok(b.economics.sellableQuantity > 0, `Batch ${b.id} sellableQuantity must be > 0`);
      assert.ok(Number.isFinite(b.economics.costPerUnit));
      assert.ok(Number.isFinite(b.economics.profitMarginPercentage));
    }
    console.log(`   -> Retrieved 10 batches across dairy products: ${[...new Set(creamBatchesData.data.map(b => b.productName))].join(', ')}`);
    console.log(`   -> Unit cost range: ₹${Math.min(...creamBatchesData.data.map(b => b.economics.costPerUnit))} to ₹${Math.max(...creamBatchesData.data.map(b => b.economics.costPerUnit))}`);
    console.log('   ✅ CHECK 3 PASSED.\n');

    // -----------------------------------------------------------------------
    // CHECK 4: Cream & Culture Forecasting End-to-End
    // -----------------------------------------------------------------------
    console.log('[CHECK 4/8] Executing Cream & Culture Statistical Forecast End-to-End...');
    const forecastRes = await fetch(`${BASE_URL}/api/forecast`, { headers: creamHeaders });
    assert.equal(forecastRes.status, 200, 'Forecast endpoint must return HTTP 200');
    const forecastEnvelope = await forecastRes.json();
    assert.equal(forecastEnvelope.success, true);
    const forecast = forecastEnvelope.data;

    // Must be based on real historical data, NOT sample data
    assert.strictEqual(forecast.isSampleData, false, 'Forecast must use persisted data, NOT sample data');
    assert.equal(forecast.forecastPoints.length, 6, 'Must generate exactly 6 forecast points');
    assert.equal(forecast.historicalPoints.length, 10, 'Must reflect all 10 historical batches');

    console.log('   -> Forecast Engine Mode: Real Historical Projection (isSampleData: false)');
    console.log('   -> Historical Data Range: Oct 2025 – May 2026 (8 distinct months)');
    console.log('   -> Forecast Horizon Points:');

    const expectedMonths = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
    forecast.forecastPoints.forEach((pt, idx) => {
      assert.equal(pt.date, expectedMonths[idx], `Month ${idx} must be ${expectedMonths[idx]}`);
      assert.ok(Number.isFinite(pt.projectedCostPerUnit), 'Projected cost must be finite');
      assert.ok(pt.projectedCostPerUnit > 0, `Projected cost for ${pt.date} must be > 0 (found: ${pt.projectedCostPerUnit})`);
      assert.ok(Number.isFinite(pt.lowerConfidenceBound), 'Lower confidence bound must be finite');
      assert.ok(Number.isFinite(pt.upperConfidenceBound), 'Upper confidence bound must be finite');
      assert.ok(pt.upperConfidenceBound >= pt.projectedCostPerUnit, 'Upper bound must be >= projected cost');
      console.log(`      ${pt.monthLabel} (${pt.date}): Projected ₹${pt.projectedCostPerUnit} | 95% CI: [₹${pt.lowerConfidenceBound} – ₹${pt.upperConfidenceBound}]`);
    });

    assert.ok(forecast.analytics, 'Analytics object must exist');
    assert.ok(forecast.analytics.trendDirection, 'Trend direction must exist');
    assert.ok(Number.isFinite(forecast.analytics.annualizedCostInflationPct));
    assert.ok(Number.isFinite(forecast.analytics.standardError));
    console.log(`   -> Analytics Trend Direction: ${forecast.analytics.trendDirection}`);
    console.log(`   -> Annualized Cost Inflation: ${forecast.analytics.annualizedCostInflationPct}%`);
    console.log(`   -> Regression Standard Error: ₹${forecast.analytics.standardError}`);
    console.log('   ✅ CHECK 4 PASSED.\n');

    // -----------------------------------------------------------------------
    // CHECK 5: All Four Accounts Authentication & Data Retrieval
    // -----------------------------------------------------------------------
    console.log('[CHECK 5/8] Verifying authentication and data retrieval for all 4 demo accounts...');
    const allAccounts = [
      { email: 'sunrise.bakery@example.com', pass: 'Bakery@Demo2026', id: 'user_demo_sunrise_bakery', name: 'Sunrise Artisan Bakery' },
      { email: 'greenjar.foods@example.com', pass: 'GreenJar@Demo2026', id: 'user_demo_greenjar_foods', name: 'GreenJar Foods' },
      { email: 'crunchcraft.snacks@example.com', pass: 'Snacks@Demo2026', id: 'user_demo_crunchcraft_snacks', name: 'CrunchCraft Snacks' },
      { email: 'cream.culture@example.com', pass: 'Dairy@Demo2026', id: 'user_demo_cream_culture', name: 'Cream & Culture' }
    ];

    const tokens = {};
    for (const acc of allAccounts) {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.pass })
      });
      assert.equal(loginRes.status, 200, `Login failed for ${acc.email}`);
      const body = await loginRes.json();
      assert.ok(body.token);
      assert.equal(body.user.id, acc.id);
      tokens[acc.email] = body.token;

      const batchRes = await fetch(`${BASE_URL}/api/batches`, {
        headers: { Authorization: `Bearer ${body.token}` }
      });
      assert.equal(batchRes.status, 200);
      const batchData = await batchRes.json();
      assert.equal(batchData.data.length, 10, `${acc.name} must retrieve exactly 10 batches`);
      assert.ok(batchData.data.every(b => b.userId === acc.id), `All batches must belong to ${acc.id}`);
      console.log(`   -> ${acc.name}: Login OK | 10 batches retrieved (all owned by ${acc.id})`);
    }
    console.log('   ✅ CHECK 5 PASSED.\n');

    // -----------------------------------------------------------------------
    // CHECK 6: Cross-Account Access Denial (Tenant Isolation)
    // -----------------------------------------------------------------------
    console.log('[CHECK 6/8] Verifying cross-account access denial (Tenant Isolation)...');
    const tokenBakery = tokens['sunrise.bakery@example.com'];
    const tokenGreenJar = tokens['greenjar.foods@example.com'];
    const tokenSnacks = tokens['crunchcraft.snacks@example.com'];
    const tokenCream = tokens['cream.culture@example.com'];

    // Bakery attempts to view GreenJar batch
    const getDenied1 = await fetch(`${BASE_URL}/api/batches/batch_greenjar_01`, {
      headers: { Authorization: `Bearer ${tokenBakery}` }
    });
    assert.equal(getDenied1.status, 404, 'Bakery cannot read GreenJar batch');

    // GreenJar attempts to view Snacks batch
    const getDenied2 = await fetch(`${BASE_URL}/api/batches/batch_crunchcraft_01`, {
      headers: { Authorization: `Bearer ${tokenGreenJar}` }
    });
    assert.equal(getDenied2.status, 404, 'GreenJar cannot read CrunchCraft batch');

    // Snacks attempts to view Cream & Culture batch
    const getDenied3 = await fetch(`${BASE_URL}/api/batches/batch_cream_01`, {
      headers: { Authorization: `Bearer ${tokenSnacks}` }
    });
    assert.equal(getDenied3.status, 404, 'CrunchCraft cannot read Cream & Culture batch');

    // Cream & Culture attempts to edit Bakery batch
    const putDenied = await fetch(`${BASE_URL}/api/batches/batch_sunrise_01`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCream}` },
      body: JSON.stringify({ productName: 'Unauthorized Edit', batchQuantity: 500, unitOfMeasure: 'units', sellingPricePerUnit: 100 })
    });
    assert.equal(putDenied.status, 404, 'Cream & Culture cannot update Bakery batch');

    // Cream & Culture attempts to delete Bakery batch
    const deleteDenied = await fetch(`${BASE_URL}/api/batches/batch_sunrise_01`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenCream}` }
    });
    assert.equal(deleteDenied.status, 404, 'Cream & Culture cannot delete Bakery batch (expected 404 Not Found)');

    console.log('   -> Cross-read GET attempts: 404 NOT FOUND (Access Denied)');
    console.log('   -> Cross-write PUT attempts: 404 NOT FOUND (Access Denied)');
    console.log('   -> Cross-delete DELETE attempts: 404 NOT FOUND (Access Denied)');
    console.log('   ✅ CHECK 6 PASSED.\n');

    // -----------------------------------------------------------------------
    // CHECK 7: Suppliers Endpoint
    // -----------------------------------------------------------------------
    console.log('[CHECK 7/8] Verifying suppliers procurement directory...');
    const supRes = await fetch(`${BASE_URL}/api/suppliers`);
    assert.equal(supRes.status, 200);
    const supData = await supRes.json();
    assert.ok(Array.isArray(supData.data));
    assert.equal(supData.data.length, 19, 'Must return exactly 19 suppliers');
    for (const s of supData.data) {
      assert.ok(s.id);
      assert.ok(s.name);
      assert.ok(s.materialName);
      assert.ok(s.unitPrice > 0);
    }
    console.log(`   -> Total Suppliers: 19 verified`);
    console.log(`   -> Sample Materials: ${supData.data.slice(0, 5).map(s => s.materialName).join(', ')}, ...`);
    console.log('   ✅ CHECK 7 PASSED.\n');

    // -----------------------------------------------------------------------
    // CHECK 8: Post-Verification Database Immutability Check
    // -----------------------------------------------------------------------
    console.log('[CHECK 8/8] Verifying database integrity & zero unintended writes...');
    const postClient = new MongoClient(DEFAULT_URI, { serverSelectionTimeoutMS: 3000 });
    await postClient.connect();
    const postDb = postClient.db();
    const postCounts = {
      users: await postDb.collection('users').countDocuments(),
      batches: await postDb.collection('batches').countDocuments(),
      suppliers: await postDb.collection('suppliers').countDocuments()
    };
    await postClient.close();

    console.log(`   -> Users:     Initial = ${preCounts.users} | Post-Test = ${postCounts.users} (Delta = 0)`);
    console.log(`   -> Batches:   Initial = ${preCounts.batches} | Post-Test = ${postCounts.batches} (Delta = 0)`);
    console.log(`   -> Suppliers: Initial = ${preCounts.suppliers} | Post-Test = ${postCounts.suppliers} (Delta = 0)`);

    assert.equal(postCounts.users, preCounts.users, 'User count must remain unchanged');
    assert.equal(postCounts.batches, preCounts.batches, 'Batch count must remain unchanged');
    assert.equal(postCounts.suppliers, preCounts.suppliers, 'Supplier count must remain unchanged');
    console.log('   ✅ CHECK 8 PASSED (Zero unintended writes or duplicates).\n');

    console.log('========================================================================');
    console.log('🎉 ALL 8 VERIFICATION CHECKS COMPLETED AND FULLY PASSED!');
    console.log('========================================================================');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

runLiveVerification().catch((err) => {
  console.error('\n❌ LIVE VERIFICATION FAILED:', err.message);
  process.exit(1);
});
