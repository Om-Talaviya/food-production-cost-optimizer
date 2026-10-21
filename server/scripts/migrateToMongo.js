#!/usr/bin/env node

/**
 * Migration CLI Script: JSON Store -> Local MongoDB
 * Safely copies records from server/data/store.json into MongoDB without modifying or deleting store.json.
 * Prevents duplicates when run multiple times.
 *
 * Usage:
 *   node server/scripts/migrateToMongo.js
 *   node server/scripts/migrateToMongo.js --force
 */

const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root if available
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { connectMongo, disconnectMongo, migrateFromJson, DEFAULT_URI } = require('../utils/mongoStore');

async function runMigration() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  const jsonPath = path.join(__dirname, '..', 'data', 'store.json');
  const force = process.argv.includes('--force');

  console.log(`========================================================`);
  console.log(`🍃 Food Production Cost Optimizer - Data Migration Tool`);
  console.log(`========================================================`);
  console.log(`Target MongoDB URI: ${uri}`);
  console.log(`Source JSON Path:   ${jsonPath}`);
  console.log(`Overwrite Mode:     ${force ? 'FORCE (overwrite existing)' : 'SAFE (skip existing, insert missing only)'}`);
  console.log(`--------------------------------------------------------`);

  let client = null;
  try {
    console.log(`Connecting to MongoDB...`);
    const conn = await connectMongo(uri, { serverSelectionTimeoutMS: 5000 });
    client = conn.client;
    const db = conn.db;

    console.log(`✅ Connected successfully to database: "${db.databaseName}"`);
    console.log(`Beginning safe migration from ${jsonPath}...`);

    const result = await migrateFromJson(jsonPath, db, { forceOverwrite: force });

    console.log(`--------------------------------------------------------`);
    console.log(`📊 Migration Summary:`);
    console.log(`   Users:     ${result.users.inserted} inserted, ${result.users.skipped} skipped (already present)`);
    console.log(`   Batches:   ${result.batches.inserted} inserted, ${result.batches.skipped} skipped (already present)`);
    console.log(`   Suppliers: ${result.suppliers.inserted} inserted, ${result.suppliers.skipped} skipped (already present)`);
    console.log(`--------------------------------------------------------`);
    console.log(`✅ Migration completed successfully.`);
    console.log(`🔒 Source file "${jsonPath}" remains completely untouched.`);
  } catch (err) {
    console.error(`❌ Migration failed: ${err.message}`);
    console.error(`💡 Ensure local MongoDB service is running (e.g. 'net start MongoDB' or 'Start-Service MongoDB').`);
    process.exitCode = 1;
  } finally {
    if (client) {
      await disconnectMongo();
      console.log(`Closed MongoDB connection.`);
    }
  }
}

runMigration();
