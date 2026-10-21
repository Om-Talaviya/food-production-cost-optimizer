#!/usr/bin/env node

/**
 * Idempotent Demo Businesses Seeder
 * Food Production Cost Optimizer
 *
 * Populates 4 distinct realistic food-production businesses:
 * 1. Sunrise Artisan Bakery (Bakery & Confectionery)
 * 2. GreenJar Foods (Pickles & Preserves)
 * 3. CrunchCraft Snacks (Snacks & Namkeen)
 * 4. Cream & Culture (Dairy & Desserts)
 *
 * Usage:
 *   node server/scripts/seedDemoBusinesses.js
 *   node server/scripts/seedDemoBusinesses.js --dry-run
 *   node server/scripts/seedDemoBusinesses.js --json
 */

const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { initializeDatabase, closeDatabase, getDatabaseStatus, db } = require('../utils/database');
const { calculateBatchEconomics } = require('../utils/calculator');
const { DEMO_BUSINESSES } = require('../data/demoBusinessesData');

async function seedDemoBusinesses(options = {}) {
  const isDryRun = options.dryRun || process.argv.includes('--dry-run');
  const forceJson = options.forceJson || process.argv.includes('--json');

  console.log('========================================================================');
  console.log('🌱 Food Production Cost Optimizer — Demo Businesses Seeder');
  console.log('========================================================================');
  if (isDryRun) {
    console.log('⚠️ DRY RUN MODE: Validating data and operations. No database writes.');
  }

  // 1. Initialize Active Storage Backend
  const initResult = await initializeDatabase({
    storageBackend: forceJson ? 'json' : undefined
  });

  const dbStatus = await getDatabaseStatus();
  console.log(`📦 Active Storage Backend: ${dbStatus.backend.toUpperCase()}`);
  console.log(`🔗 Target Database / URI:  ${dbStatus.uri}`);
  if (dbStatus.fallbackActive) {
    console.log('⚠️ Notice: Running in JSON fallback mode (store.json).');
  }
  console.log('------------------------------------------------------------------------');

  const stats = {
    users: { inserted: 0, skipped: 0, total: 0 },
    batches: { inserted: 0, skipped: 0, total: 0 },
    suppliers: { inserted: 0, skipped: 0, total: 0 }
  };

  try {
    // 2. Fetch existing suppliers once for duplicate check
    const existingSuppliers = await db.getSuppliers();
    const existingSupplierIds = new Set(existingSuppliers.map(s => s.id));

    // 3. Process Each Demo Business
    for (const business of DEMO_BUSINESSES) {
      const { user: userDef, batches: batchDefs, suppliers: supplierDefs } = business;
      console.log(`\n🏢 Seeding Business: "${userDef.companyName}" (${userDef.email})`);

      // 3.1 Check / Create User
      stats.users.total++;
      const existingUser = await db.findUserByEmail(userDef.email);
      let activeUserId = userDef.id;

      if (existingUser) {
        console.log(`   👤 User already exists: ${existingUser.email} (ID: ${existingUser.id}) -> SKIPPED`);
        stats.users.skipped++;
        activeUserId = existingUser.id;
      } else {
        if (!isDryRun) {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(userDef.password, salt);
          const createdUser = await db.createUser({
            id: userDef.id,
            name: userDef.name,
            email: userDef.email,
            passwordHash,
            companyName: userDef.companyName,
            category: userDef.category,
            createdAt: userDef.createdAt || new Date().toISOString()
          });
          activeUserId = createdUser.id;
        }
        console.log(`   👤 User created: ${userDef.email} (ID: ${userDef.id}) -> INSERTED`);
        stats.users.inserted++;
      }

      // 3.2 Check / Create Batches with User Isolation
      const userExistingBatches = await db.getBatches(activeUserId);
      const userBatchIds = new Set(userExistingBatches.map(b => b.id));

      let bizBatchesInserted = 0;
      let bizBatchesSkipped = 0;

      for (const batchInput of batchDefs) {
        stats.batches.total++;
        if (userBatchIds.has(batchInput.id)) {
          stats.batches.skipped++;
          bizBatchesSkipped++;
        } else {
          if (!isDryRun) {
            const economics = calculateBatchEconomics(batchInput);
            await db.saveBatch({
              ...batchInput,
              id: batchInput.id,
              userId: activeUserId,
              economics,
              createdAt: batchInput.createdAt || new Date().toISOString()
            }, activeUserId);
          }
          stats.batches.inserted++;
          bizBatchesInserted++;
        }
      }
      console.log(`   📦 Batches: ${batchDefs.length} evaluated (${bizBatchesInserted} to insert, ${bizBatchesSkipped} existing)`);

      // 3.3 Check / Create Suppliers
      for (const sup of supplierDefs) {
        stats.suppliers.total++;
        if (existingSupplierIds.has(sup.id)) {
          stats.suppliers.skipped++;
        } else {
          if (!isDryRun) {
            await db.saveSupplier(sup);
            existingSupplierIds.add(sup.id);
          }
          stats.suppliers.inserted++;
        }
      }
    }

    console.log('\n========================================================================');
    console.log('📊 Seeding Execution Summary:');
    console.log('========================================================================');
    console.log(`   Users:     ${stats.users.inserted} inserted, ${stats.users.skipped} skipped (${stats.users.total} total)`);
    console.log(`   Batches:   ${stats.batches.inserted} inserted, ${stats.batches.skipped} skipped (${stats.batches.total} total)`);
    console.log(`   Suppliers: ${stats.suppliers.inserted} inserted, ${stats.suppliers.skipped} skipped (${stats.suppliers.total} total)`);
    console.log('------------------------------------------------------------------------');

    if (!isDryRun) {
      const finalStatus = await getDatabaseStatus();
      if (finalStatus.counts) {
        console.log(`📈 Final Persisted MongoDB Collection Counts:`);
        console.log(`   - Users:     ${finalStatus.counts.users}`);
        console.log(`   - Batches:   ${finalStatus.counts.batches}`);
        console.log(`   - Suppliers: ${finalStatus.counts.suppliers}`);
      }
    }

    console.log('✅ Demo businesses seeder finished successfully.');
    return { success: true, stats };
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    throw err;
  } finally {
    await closeDatabase();
  }
}

if (require.main === module) {
  seedDemoBusinesses()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDemoBusinesses };
