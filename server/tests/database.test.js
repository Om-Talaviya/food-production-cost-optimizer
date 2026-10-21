/**
 * MongoDB Persistence & Offline-First Repository Test Suite
 * Exercises connection, CRUD, empty states, migrations, idempotency,
 * fallback behavior, and restart persistence on an isolated test database.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('fs');

const {
  connectMongo,
  disconnectMongo,
  createMongoIndexes,
  migrateFromJson,
  mongoDb
} = require('../utils/mongoStore');

const {
  initializeDatabase,
  closeDatabase,
  getDatabaseStatus,
  db
} = require('../utils/database');

const TEST_URI = 'mongodb://127.0.0.1:27017/food_production_cost_optimizer_test';

test.describe('Local MongoDB Persistence Layer Tests', () => {
  let clientInstance = null;
  let dbInstance = null;
  let mongoAvailable = false;

  test.before(async () => {
    try {
      const conn = await connectMongo(TEST_URI, { serverSelectionTimeoutMS: 2000 });
      clientInstance = conn.client;
      dbInstance = conn.db;
      mongoAvailable = true;

      // Clean test database before running
      try {
        await dbInstance.collection('users').drop();
      } catch (e) {}
      try {
        await dbInstance.collection('batches').drop();
      } catch (e) {}
      try {
        await dbInstance.collection('suppliers').drop();
      } catch (e) {}

      await createMongoIndexes(dbInstance);
    } catch (err) {
      mongoAvailable = false;
      console.log('ℹ️  Local MongoDB not running on 127.0.0.1:27017 — live MongoDB CRUD tests will be skipped; fallback behavior will be verified.');
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

  test('1. Successful connection, indexing, and repository CRUD operations', async (t) => {
    if (!mongoAvailable) {
      t.skip('Requires running local MongoDB service (mongodb://127.0.0.1:27017)');
      return;
    }
    // 1.1 Create user
    const testUser = {
      name: 'Integration Tester',
      email: 'tester@offline.local',
      companyName: 'Offline Test Foods Corp'
    };
    const createdUser = await mongoDb.createUser(testUser);
    assert.ok(createdUser.id, 'User must have a generated ID');
    assert.equal(createdUser.email, 'tester@offline.local');

    // 1.2 Find user by email (case-insensitive)
    const foundUser = await mongoDb.findUserByEmail('TESTER@offline.local');
    assert.ok(foundUser);
    assert.equal(foundUser.id, createdUser.id);
    assert.equal(foundUser.name, 'Integration Tester');

    // 1.3 Save batch with economics calculation
    const batchInput = {
      productName: 'Offline Test Fruit Spread',
      productCategory: 'Preserves & Jams',
      batchQuantity: 500,
      unitOfMeasure: 'kg',
      sellingPricePerUnit: 150,
      packagingCost: 8000,
      labourCost: 6000,
      energyCost: 3000,
      waterUtilitiesCost: 800,
      transportLogisticsCost: 1500,
      overheadCost: 5000,
      wastagePercentage: 4.0,
      ingredients: [
        { name: 'Organic Fruit', quantity: 300, unit: 'kg', unitPrice: 70 },
        { name: 'Cane Sugar', quantity: 200, unit: 'kg', unitPrice: 40 }
      ]
    };

    const savedBatch = await mongoDb.saveBatch(batchInput, createdUser.id);
    assert.ok(savedBatch.id);
    assert.equal(savedBatch.userId, createdUser.id);
    assert.ok(savedBatch.economics);
    assert.ok(savedBatch.economics.costPerUnit > 0);
    assert.equal(savedBatch.economics.batchQuantity, 500);

    // 1.4 Get batches for user
    const userBatches = await mongoDb.getBatches(createdUser.id);
    assert.equal(userBatches.length, 1);
    assert.equal(userBatches[0].id, savedBatch.id);

    // 1.5 Get batch by ID with ownership enforcement
    const fetchedBatch = await mongoDb.getBatchById(savedBatch.id, createdUser.id);
    assert.ok(fetchedBatch);
    assert.equal(fetchedBatch.productName, 'Offline Test Fruit Spread');

    // 1.6 Foreign user cannot access another user's batch
    const foreignBatch = await mongoDb.getBatchById(savedBatch.id, 'foreign_user_id');
    assert.strictEqual(foreignBatch, null, 'Should return null for foreign user');

    // 1.7 Save and get supplier
    const supplierInput = {
      name: 'Local Organic Farms',
      materialName: 'Organic Fruit',
      unitPrice: 68,
      unitOfMeasure: 'kg',
      qualityRating: 4.9
    };
    const savedSupplier = await mongoDb.saveSupplier(supplierInput);
    assert.ok(savedSupplier.id);

    const suppliers = await mongoDb.getSuppliers();
    assert.ok(suppliers.length >= 1);
    assert.ok(suppliers.some(s => s.name === 'Local Organic Farms'));

    // 1.8 Delete batch
    const deleted = await mongoDb.deleteBatch(savedBatch.id, createdUser.id);
    assert.strictEqual(deleted, true);
    const postDeleteBatches = await mongoDb.getBatches(createdUser.id);
    assert.equal(postDeleteBatches.length, 0);
  });

  test('2. Empty database behavior', async (t) => {
    if (!mongoAvailable) {
      t.skip('Requires running local MongoDB service (mongodb://127.0.0.1:27017)');
      return;
    }
    // Non-existent user
    const missingUser = await mongoDb.findUserByEmail('does_not_exist@domain.test');
    assert.strictEqual(missingUser, null);

    // Empty batches for unknown user
    const missingBatches = await mongoDb.getBatches('user_without_batches');
    assert.deepEqual(missingBatches, []);

    // Empty batch by ID
    const missingBatch = await mongoDb.getBatchById('non_existent_batch_id', 'some_user');
    assert.strictEqual(missingBatch, null);
  });

  test('3. Safe data migration, idempotency, and duplicate prevention', async (t) => {
    if (!mongoAvailable) {
      t.skip('Requires running local MongoDB service (mongodb://127.0.0.1:27017)');
      return;
    }
    // Create an isolated scratch JSON file for testing migration
    const scratchDir = path.join(__dirname, '..', '..', '.tmp_test_migration');
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    const scratchFile = path.join(scratchDir, 'test_store.json');

    const testStoreContent = {
      users: [
        { id: 'usr_mig_01', name: 'Migrated User 1', email: 'migrated1@test.local' },
        { id: 'usr_mig_02', name: 'Migrated User 2', email: 'migrated2@test.local' }
      ],
      batches: [
        {
          id: 'batch_mig_01',
          userId: 'usr_mig_01',
          productName: 'Migrated Mango Pickle',
          batchQuantity: 800,
          unitOfMeasure: 'kg',
          sellingPricePerUnit: 180,
          packagingCost: 10000,
          labourCost: 8000,
          energyCost: 4000,
          waterUtilitiesCost: 1000,
          transportLogisticsCost: 2000,
          overheadCost: 6000,
          wastagePercentage: 5.0,
          ingredients: [{ name: 'Raw Mango', quantity: 600, unit: 'kg', unitPrice: 50 }]
        }
      ],
      suppliers: [
        { id: 'sup_mig_01', name: 'Spice Supplier', materialName: 'Mustard Seeds', unitPrice: 120 }
      ]
    };

    fs.writeFileSync(scratchFile, JSON.stringify(testStoreContent, null, 2), 'utf8');

    try {
      // First run: Should insert all 2 users, 1 batch, 1 supplier
      const run1 = await migrateFromJson(scratchFile, dbInstance);
      assert.equal(run1.status, 'SUCCESS');
      assert.equal(run1.users.inserted, 2);
      assert.equal(run1.batches.inserted, 1);
      assert.equal(run1.suppliers.inserted, 1);

      // Second run: Should detect existing documents and insert 0 duplicates
      const run2 = await migrateFromJson(scratchFile, dbInstance);
      assert.equal(run2.status, 'SUCCESS');
      assert.equal(run2.users.inserted, 0, 'Must not duplicate users');
      assert.equal(run2.users.skipped, 2);
      assert.equal(run2.batches.inserted, 0, 'Must not duplicate batches');
      assert.equal(run2.batches.skipped, 1);
      assert.equal(run2.suppliers.inserted, 0, 'Must not duplicate suppliers');
      assert.equal(run2.suppliers.skipped, 1);

      // Verify original file was completely preserved
      const fileAfter = fs.readFileSync(scratchFile, 'utf8');
      assert.deepEqual(JSON.parse(fileAfter), testStoreContent, 'Source JSON file must remain unmodified');
    } finally {
      // Cleanup scratch file
      if (fs.existsSync(scratchFile)) fs.unlinkSync(scratchFile);
      if (fs.existsSync(scratchDir)) fs.rmdirSync(scratchDir);
    }
  });

  test('4. Database Coordinator - MongoDB unavailable behavior and safe fallback', async () => {
    // Attempting to connect to an unreachable port with fallback allowed
    const fallbackResult = await initializeDatabase({
      uri: 'mongodb://127.0.0.1:27019/unreachable_db',
      serverSelectionTimeoutMS: 300,
      allowFallback: true
    });

    assert.equal(fallbackResult.success, true);
    assert.equal(fallbackResult.backend, 'json_fallback');
    assert.equal(fallbackResult.fallbackActive, true);

    const status = await getDatabaseStatus();
    assert.equal(status.backend, 'json_fallback');
    assert.equal(status.fallbackActive, true);
    assert.ok(status.error);

    // Attempting to connect with fallback explicitly disabled must throw
    await assert.rejects(async () => {
      await initializeDatabase({
        uri: 'mongodb://127.0.0.1:27019/unreachable_db',
        serverSelectionTimeoutMS: 300,
        allowFallback: false
      });
    }, /MongoDB connection failed/);
  });

  test('5. Correct persistence after reconnecting to local MongoDB', async (t) => {
    if (!mongoAvailable) {
      t.skip('Requires running local MongoDB service (mongodb://127.0.0.1:27017)');
      return;
    }
    // Reconnect cleanly to test database
    await connectMongo(TEST_URI);

    const persistentId = 'batch_persistence_verify_' + Date.now();
    await mongoDb.saveBatch({
      id: persistentId,
      productName: 'Persistence Check Spread',
      batchQuantity: 1000,
      unitOfMeasure: 'kg',
      sellingPricePerUnit: 120,
      ingredients: []
    }, 'user_persistent_01');

    // Disconnect
    await disconnectMongo();

    // Reconnect
    await connectMongo(TEST_URI);

    // Document should still exist
    const retrieved = await mongoDb.getBatchById(persistentId, 'user_persistent_01');
    assert.ok(retrieved);
    assert.equal(retrieved.id, persistentId);
    assert.equal(retrieved.productName, 'Persistence Check Spread');

    // Cleanup
    await mongoDb.deleteBatch(persistentId, 'user_persistent_01');
  });

  test('6. API Compatibility - Database coordinator interface matches contract', () => {
    const requiredMethods = [
      'findUserByEmail',
      'createUser',
      'getBatches',
      'getBatchById',
      'saveBatch',
      'deleteBatch',
      'getSuppliers',
      'saveSupplier'
    ];

    for (const method of requiredMethods) {
      assert.equal(typeof db[method], 'function', `db.${method} must be an asynchronous function`);
    }
  });
});
