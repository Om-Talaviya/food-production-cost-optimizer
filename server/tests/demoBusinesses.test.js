/**
 * Automated Tests for 4 Seeded Demo Businesses
 * Food Production Cost Optimizer
 *
 * Verifies:
 * - User creation & bcrypt authentication for all 4 businesses
 * - Batch ownership & data isolation across accounts
 * - Internal mathematical consistency of economics
 * - 6-month statistical forecasting eligibility (distinct months >= 3)
 * - Seed script idempotency (zero duplicates on re-run)
 * - Integrity of existing demo users and existing store records
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const { connectMongo, disconnectMongo, mongoDb, createMongoIndexes } = require('../utils/mongoStore');
const { calculateBatchEconomics } = require('../utils/calculator');
const { generateCostForecast } = require('../utils/forecastEngine');
const { DEMO_BUSINESSES } = require('../data/demoBusinessesData');

const TEST_URI = 'mongodb://127.0.0.1:27017/food_production_cost_optimizer_demo_test';

test.describe('Demo Businesses Data & Workflow Tests', () => {
  let dbInstance = null;
  let mongoAvailable = false;

  test.before(async () => {
    try {
      const conn = await connectMongo(TEST_URI, { serverSelectionTimeoutMS: 2000 });
      dbInstance = conn.db;
      mongoAvailable = true;

      // Reset test database collections
      try { await dbInstance.collection('users').drop(); } catch (e) {}
      try { await dbInstance.collection('batches').drop(); } catch (e) {}
      try { await dbInstance.collection('suppliers').drop(); } catch (e) {}

      await createMongoIndexes(dbInstance);

      // Pre-seed an existing user to verify existing data is preserved
      await dbInstance.collection('users').insertOne({
        id: 'user_preexisting_guest',
        email: 'guest@demo.com',
        name: 'DEMO Guest',
        passwordHash: 'demo-no-password',
        companyName: 'Demo Foods Corp (Sample Data)',
        createdAt: '2026-08-28T05:03:26.644Z'
      });

      await dbInstance.collection('batches').insertOne({
        id: 'batch_preexisting_mango_jam',
        userId: 'user_preexisting_guest',
        productName: 'Pre-existing Mango Jam',
        batchQuantity: 1000,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 160,
        overheadCost: 10000,
        wastagePercentage: 6.5,
        ingredients: [{ name: 'Mango Pulp', quantity: 550, unit: 'kg', unitPrice: 85 }],
        createdAt: '2026-08-28T05:03:26.646Z'
      });
    } catch (err) {
      mongoAvailable = false;
      console.log('ℹ️  Local MongoDB not running on 127.0.0.1:27017 — live MongoDB demo business tests will be skipped; batch economics & forecasting models will be verified.');
    }
  });

  test.after(async () => {
    if (mongoAvailable && dbInstance) {
      try {
        await dbInstance.collection('users').drop();
        await dbInstance.collection('batches').drop();
        await dbInstance.collection('suppliers').drop();
      } catch (e) {}
    }
    await disconnectMongo();
  });

  test('1. Four demo businesses are seeded with valid schemas & bcrypt password hashes', async (t) => {
    if (!mongoAvailable) {
      t.skip('Requires running local MongoDB service (mongodb://127.0.0.1:27017)');
      return;
    }
    assert.equal(DEMO_BUSINESSES.length, 4, 'Must define exactly 4 demo businesses');

    for (const biz of DEMO_BUSINESSES) {
      const { user } = biz;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(user.password, salt);

      const created = await mongoDb.createUser({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash,
        companyName: user.companyName,
        category: user.category
      });

      assert.equal(created.id, user.id);
      assert.equal(created.email, user.email.toLowerCase());

      // Verify bcrypt password verification works
      const retrieved = await mongoDb.findUserByEmail(user.email);
      assert.ok(retrieved);
      const isPasswordValid = await bcrypt.compare(user.password, retrieved.passwordHash);
      assert.equal(isPasswordValid, true, `Password for ${user.email} must verify with bcrypt`);

      // Incorrect password must be rejected
      const isWrongPasswordValid = await bcrypt.compare('WrongPassword123!', retrieved.passwordHash);
      assert.equal(isWrongPasswordValid, false, 'Invalid password must not verify');
    }

    // Verify existing demo user was not removed or altered
    const existingGuest = await mongoDb.findUserByEmail('guest@demo.com');
    assert.ok(existingGuest);
    assert.equal(existingGuest.id, 'user_preexisting_guest');
  });

  test('2. Batches and suppliers are seeded and isolated by user ID', async (t) => {
    if (!mongoAvailable) {
      t.skip('Requires running local MongoDB service (mongodb://127.0.0.1:27017)');
      return;
    }
    for (const biz of DEMO_BUSINESSES) {
      const { user, batches, suppliers } = biz;

      // Seed batches for user
      for (const batch of batches) {
        const saved = await mongoDb.saveBatch(batch, user.id);
        assert.equal(saved.userId, user.id);
        assert.ok(saved.economics);
        assert.ok(saved.economics.costPerUnit > 0);
        assert.ok(saved.economics.totalProductionCost > 0);
      }

      // Seed suppliers
      for (const sup of suppliers) {
        await mongoDb.saveSupplier(sup);
      }

      // Verify user's batch count
      const userBatches = await mongoDb.getBatches(user.id);
      assert.equal(userBatches.length, batches.length, `${user.companyName} must have ${batches.length} batches`);

      // Verify every batch belongs to this user
      assert.ok(userBatches.every(b => b.userId === user.id));
    }
  });

  test('3. Cross-User Data Isolation - Users cannot access or mutate another users batches', async (t) => {
    if (!mongoAvailable) {
      t.skip('Requires running local MongoDB service (mongodb://127.0.0.1:27017)');
      return;
    }
    const userA = DEMO_BUSINESSES[0].user; // Sunrise Bakery
    const userB = DEMO_BUSINESSES[1].user; // GreenJar Foods

    const batchesA = await mongoDb.getBatches(userA.id);
    const batchesB = await mongoDb.getBatches(userB.id);

    assert.ok(batchesA.length > 0);
    assert.ok(batchesB.length > 0);

    const batchAId = batchesA[0].id;
    const batchBId = batchesB[0].id;

    // User A can access their own batch
    const ownBatch = await mongoDb.getBatchById(batchAId, userA.id);
    assert.ok(ownBatch);
    assert.equal(ownBatch.id, batchAId);

    // User B CANNOT access User A's batch
    const foreignBatch = await mongoDb.getBatchById(batchAId, userB.id);
    assert.strictEqual(foreignBatch, null, 'User B must not be able to read User A batch');

    // User B CANNOT modify User A's batch
    await assert.rejects(async () => {
      await mongoDb.saveBatch({
        id: batchAId,
        productName: 'Malicious Overwrite Attempt',
        batchQuantity: 9999,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 10
      }, userB.id);
    }, /Unauthorized: cannot modify another user's batch/);

    // User B CANNOT delete User A's batch
    await assert.rejects(async () => {
      await mongoDb.deleteBatch(batchAId, userB.id);
    }, /Unauthorized: cannot delete another user's batch/);

    // Ensure User A's batch remains unchanged
    const intactBatch = await mongoDb.getBatchById(batchAId, userA.id);
    assert.equal(intactBatch.productName, batchesA[0].productName);
  });

  test('4. Internal Mathematical Consistency of All Seeded Batches', () => {
    for (const biz of DEMO_BUSINESSES) {
      for (const batch of biz.batches) {
        const eco = calculateBatchEconomics(batch);

        // 1. Quantities
        assert.ok(eco.batchQuantity > 0, 'Batch quantity must be positive');
        assert.ok(eco.sellableQuantity <= eco.batchQuantity, 'Sellable quantity cannot exceed batch quantity');
        assert.equal(
          Math.round((eco.sellableQuantity + eco.wastageQuantity) * 100) / 100,
          eco.batchQuantity,
          'Sellable + wastage must equal batch quantity'
        );

        // 2. Costs reconciliation
        const directSum = eco.rawMaterialCost + eco.packagingCost + eco.labourCost +
          eco.energyCost + eco.waterUtilitiesCost + eco.transportLogisticsCost;
        assert.ok(directSum > 0, 'Direct costs must be positive');

        const calculatedWastage = directSum * (eco.wastagePercentage / 100);
        assert.equal(
          Math.round(eco.wastageCost),
          Math.round(calculatedWastage),
          'Wastage cost must reconcile with direct cost multiplier'
        );

        const expectedTotal = directSum + eco.wastageCost + eco.overheadCost;
        assert.equal(
          Math.round(eco.totalProductionCost),
          Math.round(expectedTotal),
          'Total production cost must reconcile'
        );

        // 3. Revenue & Margins
        const expectedRevenue = Math.round(eco.sellableQuantity * eco.sellingPricePerUnit * 100) / 100;
        assert.equal(
          Math.round(eco.totalRevenue),
          Math.round(expectedRevenue),
          'Revenue must reconcile with sellable quantity * selling price'
        );

        const expectedProfit = Math.round((eco.totalRevenue - eco.totalProductionCost) * 100) / 100;
        assert.equal(
          Math.round(eco.grossProfit),
          Math.round(expectedProfit),
          'Gross profit must equal revenue - production cost'
        );

        // 4. Break-even logic
        if (eco.contributionMarginPerUnit > 0) {
          assert.ok(typeof eco.breakEvenQuantity === 'number', 'Positive contribution margin must have numeric break-even');
          assert.ok(eco.breakEvenQuantity >= 0);
        } else if (eco.overheadCost > 0) {
          assert.strictEqual(eco.breakEvenQuantity, null, 'Unprofitable contribution margin with fixed overhead must yield null break-even');
        }
      }
    }
  });

  test('5. Monthly historical coverage supports 6-month statistical forecasting', () => {
    for (const biz of DEMO_BUSINESSES) {
      const records = biz.batches.map(b => ({
        date: b.createdAt,
        costPerUnit: calculateBatchEconomics(b).costPerUnit,
        totalProductionCost: calculateBatchEconomics(b).totalProductionCost,
        productionQuantity: b.batchQuantity,
        rawMaterialCost: calculateBatchEconomics(b).rawMaterialCost,
        sellingPrice: b.sellingPricePerUnit
      }));

      const distinctMonths = new Set(records.map(r => r.date.slice(0, 7))).size;
      assert.ok(
        distinctMonths >= 6,
        `${biz.user.companyName} should span at least 6 distinct months (found: ${distinctMonths})`
      );

      // Verify forecast engine runs without falling back to synthetic sample data
      const forecast = generateCostForecast(records, 6);
      assert.ok(forecast);
      assert.equal(forecast.isSampleData, false, 'Should be real historical forecast');
      assert.equal(forecast.forecastPoints.length, 6, 'Should generate 6 projected points');
      assert.ok(forecast.analytics.trendDirection);
      assert.ok(forecast.forecastPoints.every(p => p.projectedCostPerUnit > 0));
    }
  });

  test('6. Idempotency - Re-saving existing batches or suppliers produces zero duplicate documents', async (t) => {
    if (!mongoAvailable) {
      t.skip('Requires running local MongoDB service (mongodb://127.0.0.1:27017)');
      return;
    }
    const countsBefore = await mongoDb.getCounts();

    // Attempt to re-save all users, batches and suppliers
    for (const biz of DEMO_BUSINESSES) {
      // Re-saving batch with existing ID updates in place
      for (const batch of biz.batches) {
        await mongoDb.saveBatch(batch, biz.user.id);
      }
      for (const sup of biz.suppliers) {
        await mongoDb.saveSupplier(sup);
      }
    }

    const countsAfter = await mongoDb.getCounts();
    assert.equal(countsAfter.batches, countsBefore.batches, 'Batch count must not increase on duplicate save');
    assert.equal(countsAfter.suppliers, countsBefore.suppliers, 'Supplier count must not increase on duplicate save');
  });
});
