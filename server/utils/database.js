/**
 * Unified Database Coordinator for Food Production Cost Optimizer.
 * Integrates local MongoDB Community Server with deterministic local JSON fallback.
 */

const path = require('path');
const { connectMongo, disconnectMongo, mongoDb, migrateFromJson, DEFAULT_URI } = require('./mongoStore');
const jsonFallback = require('./dbFallback');

let activeBackend = 'disconnected'; // 'mongodb' | 'json_fallback' | 'json' | 'disconnected'
let connectionError = null;
let configuredUri = null;

function sanitizeMongoUri(uri) {
  if (!uri) return 'none';
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch (e) {
    // If it's a standard mongodb:// string without URL constructor support
    return uri.replace(/:([^:@]+)@/, ':****@');
  }
}

/**
 * Initialize storage engine.
 * Attempts local MongoDB connection by default. If MongoDB service is unavailable,
 * falls back to local JSON store (server/data/store.json) with clear diagnostics.
 */
async function initializeDatabase(options = {}) {
  const uri = options.uri || process.env.MONGODB_URI || DEFAULT_URI;
  configuredUri = uri;
  const storagePref = (options.storageBackend || process.env.STORAGE_BACKEND || 'auto').toLowerCase();
  const allowFallback = (options.allowFallback !== undefined) 
    ? Boolean(options.allowFallback) 
    : (process.env.ALLOW_STORE_FALLBACK !== 'false');

  // Explicit JSON mode
  if (storagePref === 'json') {
    await jsonFallback.initializeDatabase();
    activeBackend = 'json';
    connectionError = null;
    console.log('📦 Persistence Engine: Local JSON Store (server/data/store.json) [Configured via STORAGE_BACKEND=json]');
    return { success: true, backend: 'json' };
  }

  // Attempt MongoDB Connection
  try {
    const { db } = await connectMongo(uri, {
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 2500,
      connectTimeoutMS: options.connectTimeoutMS || 2500
    });

    activeBackend = 'mongodb';
    connectionError = null;

    // Check if MongoDB collection is empty. If empty, auto-migrate seed/existing store.json
    try {
      const counts = await mongoDb.getCounts();
      if (counts.batches === 0) {
        const jsonPath = options.jsonPath || path.join(__dirname, '..', 'data', 'store.json');
        console.log(`ℹ️ MongoDB collection is empty. Performing initial migration from ${jsonPath}...`);
        const migrationResult = await migrateFromJson(jsonPath, db);
        console.log(`✅ Initial data migration complete: ${migrationResult.batches.inserted} batches, ${migrationResult.users.inserted} users, ${migrationResult.suppliers.inserted} suppliers imported.`);
      }
    } catch (migrationErr) {
      console.warn('⚠️ Non-fatal migration check warning during startup:', migrationErr.message);
    }

    console.log(`==================================================`);
    console.log(`✅ Local MongoDB Connected: ${sanitizeMongoUri(uri)}`);
    console.log(`📦 Persistence Engine: MongoDB (Offline-First)`);
    console.log(`==================================================`);

    return { success: true, backend: 'mongodb' };
  } catch (err) {
    connectionError = err.message;

    console.warn(`==================================================`);
    console.warn(`⚠️ LOCAL MONGODB CONNECTION NOTICE:`);
    console.warn(`Target URI: ${sanitizeMongoUri(uri)}`);
    console.warn(`Error: ${err.message}`);
    console.warn(`--------------------------------------------------`);
    console.warn(`💡 To start local MongoDB Community Server on Windows:`);
    console.warn(`   PowerShell: Start-Service MongoDB`);
    console.warn(`   Command Prompt: net start MongoDB`);
    console.warn(`==================================================`);

    if (allowFallback) {
      await jsonFallback.initializeDatabase();
      activeBackend = 'json_fallback';
      console.warn(`⚠️ Safe Fallback Activated: Operating on local JSON store (server/data/store.json).`);
      console.warn(`⚠️ NOTE: Modifications will save to store.json and can be migrated once MongoDB starts.`);
      return { success: true, backend: 'json_fallback', fallbackActive: true, error: err.message };
    }

    activeBackend = 'disconnected';
    throw new Error(`MongoDB connection failed and fallback is disabled: ${err.message}`);
  }
}

/**
 * Cleanly close active database connection.
 */
async function closeDatabase() {
  await disconnectMongo();
  activeBackend = 'disconnected';
  connectionError = null;
}

/**
 * Returns structured health and status of the persistence layer.
 */
async function getDatabaseStatus() {
  const isMongo = activeBackend === 'mongodb';
  let counts = { users: 0, batches: 0, suppliers: 0 };

  if (isMongo) {
    try {
      counts = await mongoDb.getCounts();
    } catch (e) {
      // Ignore count errors during status query
    }
  }

  return {
    backend: activeBackend,
    connected: activeBackend === 'mongodb' || activeBackend === 'json_fallback' || activeBackend === 'json',
    isMongo,
    fallbackActive: activeBackend === 'json_fallback',
    uri: sanitizeMongoUri(configuredUri || DEFAULT_URI),
    error: connectionError,
    counts: isMongo ? counts : undefined
  };
}

/**
 * Unified data access repository proxy.
 * Transparently delegates to MongoDB or fallback JSON store based on active connection.
 */
const db = {
  findUserByEmail: async (email) => {
    if (activeBackend === 'mongodb') {
      return mongoDb.findUserByEmail(email);
    }
    return jsonFallback.db.findUserByEmail(email);
  },

  createUser: async (userObj) => {
    if (activeBackend === 'mongodb') {
      return mongoDb.createUser(userObj);
    }
    return jsonFallback.db.createUser(userObj);
  },

  getBatches: async (userId) => {
    if (activeBackend === 'mongodb') {
      return mongoDb.getBatches(userId);
    }
    return jsonFallback.db.getBatches(userId);
  },

  getBatchById: async (id, userId) => {
    if (activeBackend === 'mongodb') {
      return mongoDb.getBatchById(id, userId);
    }
    return jsonFallback.db.getBatchById(id, userId);
  },

  saveBatch: async (batchData, userId) => {
    if (activeBackend === 'mongodb') {
      return mongoDb.saveBatch(batchData, userId);
    }
    return jsonFallback.db.saveBatch(batchData, userId);
  },

  deleteBatch: async (id, userId) => {
    if (activeBackend === 'mongodb') {
      return mongoDb.deleteBatch(id, userId);
    }
    return jsonFallback.db.deleteBatch(id, userId);
  },

  getSuppliers: async () => {
    if (activeBackend === 'mongodb') {
      return mongoDb.getSuppliers();
    }
    return jsonFallback.db.getSuppliers();
  },

  saveSupplier: async (supplierObj) => {
    if (activeBackend === 'mongodb') {
      return mongoDb.saveSupplier(supplierObj);
    }
    return jsonFallback.db.saveSupplier(supplierObj);
  }
};

module.exports = {
  DEFAULT_URI,
  initializeDatabase,
  closeDatabase,
  getDatabaseStatus,
  migrateFromJson,
  db,
  getActiveBackend: () => activeBackend
};
