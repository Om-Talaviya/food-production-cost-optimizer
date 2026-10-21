/**
 * MongoDB Persistence Layer for Food Production Cost Optimizer.
 * Connects to local MongoDB Community Server (offline-first).
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { calculateBatchEconomics } = require('./calculator');

let client = null;
let db = null;
let currentUri = null;

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/food_production_cost_optimizer';

/**
 * Connect to MongoDB and set up database reference.
 */
async function connectMongo(uri = DEFAULT_URI, options = {}) {
  if (client && db && currentUri === uri && !options.reconnect) {
    return { client, db };
  }

  if (client) {
    await disconnectMongo();
  }

  const connectOptions = {
    serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 3000,
    connectTimeoutMS: options.connectTimeoutMS || 3000,
    ...options
  };

  currentUri = uri;
  client = new MongoClient(uri, connectOptions);
  try {
    await client.connect();
    db = client.db();
    await createMongoIndexes(db);
    return { client, db };
  } catch (err) {
    try {
      await client.close();
    } catch (_) {}
    client = null;
    db = null;
    currentUri = null;
    throw err;
  }
}

/**
 * Close active MongoDB connection.
 */
async function disconnectMongo() {
  if (client) {
    try {
      await client.close();
    } finally {
      client = null;
      db = null;
      currentUri = null;
    }
  }
}

/**
 * Create indexes for performance, query isolation, and uniqueness.
 */
async function createMongoIndexes(databaseInstance) {
  const targetDb = databaseInstance || db;
  if (!targetDb) return;

  const usersCol = targetDb.collection('users');
  const batchesCol = targetDb.collection('batches');
  const suppliersCol = targetDb.collection('suppliers');

  // Users: Unique email and unique custom ID
  await usersCol.createIndex({ email: 1 }, { unique: true, background: true });
  await usersCol.createIndex({ id: 1 }, { unique: true, background: true });

  // Batches: Unique custom ID, compound user and creation time for fast isolated history
  await batchesCol.createIndex({ id: 1 }, { unique: true, background: true });
  await batchesCol.createIndex({ userId: 1, createdAt: -1 }, { background: true });
  await batchesCol.createIndex({ productName: 1 }, { background: true });

  // Suppliers: Unique custom ID, material name lookup
  await suppliersCol.createIndex({ id: 1 }, { unique: true, background: true });
  await suppliersCol.createIndex({ materialName: 1 }, { background: true });
}

/**
 * Safe, idempotent migration from store.json to MongoDB.
 * Never modifies or deletes store.json.
 * Avoids duplicate records and does not overwrite existing MongoDB data unless forceOverwrite is true.
 */
async function migrateFromJson(jsonPath, databaseInstance, options = {}) {
  const targetDb = databaseInstance || db;
  if (!targetDb) {
    throw new Error('Database not connected. Cannot perform migration.');
  }

  const resolvedPath = jsonPath || path.join(__dirname, '..', 'data', 'store.json');
  if (!fs.existsSync(resolvedPath)) {
    return {
      status: 'SKIPPED',
      reason: 'Source JSON file does not exist',
      path: resolvedPath,
      users: { inserted: 0, skipped: 0 },
      batches: { inserted: 0, skipped: 0 },
      suppliers: { inserted: 0, skipped: 0 }
    };
  }

  let sourceData;
  try {
    const raw = fs.readFileSync(resolvedPath, 'utf8');
    sourceData = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read/parse JSON store at ${resolvedPath}: ${err.message}`);
  }

  const usersCol = targetDb.collection('users');
  const batchesCol = targetDb.collection('batches');
  const suppliersCol = targetDb.collection('suppliers');

  const stats = {
    users: { inserted: 0, skipped: 0 },
    batches: { inserted: 0, skipped: 0 },
    suppliers: { inserted: 0, skipped: 0 }
  };

  // 1. Migrate Users
  if (Array.isArray(sourceData.users)) {
    for (const u of sourceData.users) {
      if (!u.email) continue;
      const normalizedEmail = u.email.toLowerCase();
      const existing = await usersCol.findOne({
        $or: [{ id: u.id }, { email: normalizedEmail }]
      });

      if (!existing) {
        const userDoc = {
          ...u,
          id: u.id || 'user_' + Date.now(),
          email: normalizedEmail,
          createdAt: u.createdAt || new Date().toISOString()
        };
        delete userDoc._id;
        await usersCol.insertOne(userDoc);
        stats.users.inserted++;
      } else if (options.forceOverwrite) {
        const updateDoc = { ...u, email: normalizedEmail };
        delete updateDoc._id;
        await usersCol.updateOne({ id: existing.id }, { $set: updateDoc });
        stats.users.inserted++;
      } else {
        stats.users.skipped++;
      }
    }
  }

  // 2. Migrate Batches
  if (Array.isArray(sourceData.batches)) {
    for (const b of sourceData.batches) {
      if (!b.id) continue;
      const existing = await batchesCol.findOne({ id: b.id });

      if (!existing) {
        const economics = b.economics || calculateBatchEconomics(b);
        const batchDoc = {
          ...b,
          economics,
          updatedAt: b.updatedAt || b.createdAt || new Date().toISOString(),
          createdAt: b.createdAt || new Date().toISOString()
        };
        delete batchDoc._id;
        await batchesCol.insertOne(batchDoc);
        stats.batches.inserted++;
      } else if (options.forceOverwrite) {
        const economics = b.economics || calculateBatchEconomics(b);
        const batchDoc = { ...b, economics };
        delete batchDoc._id;
        await batchesCol.updateOne({ id: b.id }, { $set: batchDoc });
        stats.batches.inserted++;
      } else {
        stats.batches.skipped++;
      }
    }
  }

  // 3. Migrate Suppliers
  if (Array.isArray(sourceData.suppliers)) {
    for (const s of sourceData.suppliers) {
      if (!s.id) continue;
      const existing = await suppliersCol.findOne({ id: s.id });

      if (!existing) {
        const supplierDoc = { ...s };
        delete supplierDoc._id;
        await suppliersCol.insertOne(supplierDoc);
        stats.suppliers.inserted++;
      } else if (options.forceOverwrite) {
        const updateDoc = { ...s };
        delete updateDoc._id;
        await suppliersCol.updateOne({ id: s.id }, { $set: updateDoc });
        stats.suppliers.inserted++;
      } else {
        stats.suppliers.skipped++;
      }
    }
  }

  return {
    status: 'SUCCESS',
    path: resolvedPath,
    ...stats
  };
}

/**
 * MongoDB Repository implementation with identical signature to dbFallback.js.
 */
const mongoDb = {
  // Users
  findUserByEmail: async (email) => {
    if (!email || !db) return null;
    const doc = await db.collection('users').findOne(
      { email: email.toLowerCase() },
      { projection: { _id: 0 } }
    );
    return doc;
  },

  createUser: async (userObj) => {
    if (!db) throw new Error('Database not connected');
    const id = userObj.id || 'user_' + Date.now();
    const doc = {
      ...userObj,
      id,
      email: (userObj.email || '').toLowerCase(),
      createdAt: userObj.createdAt || new Date().toISOString()
    };
    delete doc._id;
    await db.collection('users').insertOne(doc);
    return { ...doc };
  },

  // Batches (User isolated)
  getBatches: async (userId) => {
    if (!userId || !db) return [];
    const list = await db.collection('batches')
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return list;
  },

  getBatchById: async (id, userId) => {
    if (!id || !db) return null;
    const query = { id };
    if (userId) query.userId = userId;
    const batch = await db.collection('batches').findOne(query, { projection: { _id: 0 } });
    return batch;
  },

  saveBatch: async (batchData, userId) => {
    if (!userId) throw new Error('User ID required for batch operations');
    if (!db) throw new Error('Database not connected');

    const id = batchData.id || 'batch_' + Date.now();
    const economics = calculateBatchEconomics(batchData);

    const fullBatch = {
      ...batchData,
      id,
      economics,
      userId,
      updatedAt: new Date().toISOString(),
      createdAt: batchData.createdAt || new Date().toISOString()
    };
    delete fullBatch._id;

    // Enforce ownership if existing
    const existing = await db.collection('batches').findOne({ id });
    if (existing && existing.userId !== userId) {
      throw new Error("Unauthorized: cannot modify another user's batch");
    }

    await db.collection('batches').updateOne(
      { id },
      { $set: fullBatch },
      { upsert: true }
    );

    return fullBatch;
  },

  deleteBatch: async (id, userId) => {
    if (!userId) throw new Error('User ID required for batch operations');
    if (!db) throw new Error('Database not connected');

    const existing = await db.collection('batches').findOne({ id });
    if (!existing) return false;
    if (existing.userId !== userId) {
      throw new Error("Unauthorized: cannot delete another user's batch");
    }

    const res = await db.collection('batches').deleteOne({ id });
    return res.deletedCount > 0;
  },

  // Suppliers
  getSuppliers: async () => {
    if (!db) return [];
    const list = await db.collection('suppliers')
      .find({}, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();
    return list;
  },

  saveSupplier: async (supplierObj) => {
    if (!db) throw new Error('Database not connected');
    const id = supplierObj.id || 'sup_' + Date.now();
    const full = { ...supplierObj, id };
    delete full._id;

    await db.collection('suppliers').updateOne(
      { id },
      { $set: full },
      { upsert: true }
    );

    return full;
  },

  // Diagnostics
  getCounts: async () => {
    if (!db) return { users: 0, batches: 0, suppliers: 0 };
    const [users, batches, suppliers] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('batches').countDocuments(),
      db.collection('suppliers').countDocuments()
    ]);
    return { users, batches, suppliers };
  }
};

module.exports = {
  DEFAULT_URI,
  connectMongo,
  disconnectMongo,
  createMongoIndexes,
  migrateFromJson,
  mongoDb,
  getDbInstance: () => db,
  getMongoClient: () => client
};
