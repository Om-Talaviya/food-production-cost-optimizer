/**
 * JSON File Persistence Store.
 * Zero-config execution with local JSON file storage.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Memory store state
let localStore = {
  users: [],
  batches: [],
  suppliers: [],
  historicalCosts: []
};

// Seed default realistic food processing demo batches
// Creates a realistic single-product (Mango Jam) history across 6 months
// to enable meaningful cost forecasting for the portfolio demo.
function seedInitialDemoData() {
  const { calculateBatchEconomics } = require('./calculator');

  // Generate 6 months of Mango Jam production history (Mar 2026 - Aug 2026)
  // with realistic cost variations (seasonal mango pricing, improving yield)
  const baseIngredients = [
    { name: 'Mango Pulp (Alphonso)', quantity: 550, unit: 'kg', unitPrice: 80 },
    { name: 'Refined Sugar', quantity: 420, unit: 'kg', unitPrice: 40 },
    { name: 'Pectin (Fruit Grade)', quantity: 8, unit: 'kg', unitPrice: 750 },
    { name: 'Citric Acid', quantity: 4, unit: 'kg', unitPrice: 180 }
  ];

  const monthlyVariations = [
    // Mar 2026 - end of season, higher pulp price, higher wastage
    { month: 2, pulpPrice: 84, sugarPrice: 42, wastage: 5.5, sellingPrice: 165, overhead: 10100 },
    // Apr 2026 - prices start dropping
    { month: 3, pulpPrice: 83, sugarPrice: 42, wastage: 5.0, sellingPrice: 165, overhead: 10100 },
    // May 2026 - peak harvest, lower prices, better yield
    { month: 4, pulpPrice: 82, sugarPrice: 41, wastage: 4.8, sellingPrice: 165, overhead: 10100 },
    // Jun 2026 - peak harvest continues
    { month: 5, pulpPrice: 81, sugarPrice: 41, wastage: 4.5, sellingPrice: 165, overhead: 10100 },
    // Jul 2026 - end of peak
    { month: 6, pulpPrice: 80, sugarPrice: 40, wastage: 4.3, sellingPrice: 165, overhead: 10100 },
    // Aug 2026 - end of season
    { month: 7, pulpPrice: 79, sugarPrice: 40, wastage: 4.0, sellingPrice: 165, overhead: 10100 }
  ];

  const demoBatches = monthlyVariations.map((v, i) => {
    const ingredients = baseIngredients.map(ing => {
      if (ing.name === 'Mango Pulp (Alphonso)') return { ...ing, unitPrice: v.pulpPrice };
      if (ing.name === 'Refined Sugar') return { ...ing, unitPrice: v.sugarPrice };
      return ing;
    });

    const baseDate = new Date('2026-03-01T10:00:00Z');
    baseDate.setMonth(baseDate.getMonth() + i);

    return {
      id: `batch_mango_jam_2026_${String(i + 3).padStart(2, '0')}`,
      userId: 'user_demo_01',
      productName: 'Premium Mango Jam',
      productCategory: 'Preserves & Jams',
      batchQuantity: 1000,
      unitOfMeasure: 'kg',
      sellingPricePerUnit: v.sellingPrice,
      packagingCost: 18500,
      labourCost: 12200,
      energyCost: 6700,
      waterUtilitiesCost: 1500,
      transportLogisticsCost: 4200,
      overheadCost: v.overhead,
      wastagePercentage: v.wastage,
      ingredients,
      createdAt: new Date(baseDate).toISOString()
    };
  });

  localStore.batches = demoBatches.map(b => ({
    ...b,
    economics: calculateBatchEconomics(b)
  }));

  localStore.suppliers = [
    {
      id: 'sup_01',
      name: 'AgroFresh Pulps Ltd',
      materialName: 'Mango Pulp (Alphonso)',
      unitPrice: 85,
      unitOfMeasure: 'kg',
      leadTimeDays: 4,
      moq: 500,
      transportCostPerUnit: 3.5,
      qualityRating: 4.8,
      reliabilityScorePct: 96
    },
    {
      id: 'sup_02',
      name: 'Global Fruit Processing Corp',
      materialName: 'Mango Pulp (Alphonso)',
      unitPrice: 79,
      unitOfMeasure: 'kg',
      leadTimeDays: 8,
      moq: 1500,
      transportCostPerUnit: 6.0,
      qualityRating: 4.3,
      reliabilityScorePct: 88
    },
    {
      id: 'sup_03',
      name: 'PureSugar Refineries',
      materialName: 'Refined Sugar',
      unitPrice: 42,
      unitOfMeasure: 'kg',
      leadTimeDays: 2,
      moq: 1000,
      transportCostPerUnit: 1.2,
      qualityRating: 4.9,
      reliabilityScorePct: 99
    }
  ];

  saveLocalStore();
}

function loadLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      localStore = JSON.parse(content);
    } else {
      seedInitialDemoData();
    }
  } catch (e) {
    console.warn('Could not load local JSON store, resetting to initial seed:', e.message);
    seedInitialDemoData();
  }
}

function saveLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write local JSON store:', e.message);
  }
}

async function initializeDatabase() {
  loadLocalStore();
  console.log('ℹ️ Using local JSON database (server/data/store.json).');
  return false;
}

// Data Access Helpers
const db = {
  // Users
  findUserByEmail: async (email) => {
    return localStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  createUser: async (userObj) => {
    const newUser = { ...userObj, id: 'user_' + Date.now() };
    localStore.users.push(newUser);
    saveLocalStore();
    return newUser;
  },

  // Batches - with user isolation
  getBatches: async (userId) => {
    if (!userId) return [];
    return localStore.batches.filter(b => b.userId === userId);
  },
  getBatchById: async (id, userId) => {
    const batch = localStore.batches.find(b => b.id === id);
    if (!batch) return null;
    if (userId && batch.userId !== userId) return null; // enforce ownership
    return batch;
  },
  saveBatch: async (batchData, userId) => {
    if (!userId) throw new Error('User ID required for batch operations');
    const { calculateBatchEconomics } = require('./calculator');
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

    const existingIdx = localStore.batches.findIndex(b => b.id === id);
    if (existingIdx >= 0) {
      // Verify ownership before update
      if (localStore.batches[existingIdx].userId !== userId) {
        throw new Error('Unauthorized: cannot modify another user\'s batch');
      }
      localStore.batches[existingIdx] = fullBatch;
    } else {
      localStore.batches.unshift(fullBatch);
    }
    saveLocalStore();
    return fullBatch;
  },
  deleteBatch: async (id, userId) => {
    if (!userId) throw new Error('User ID required for batch operations');
    const batchIdx = localStore.batches.findIndex(b => b.id === id);
    if (batchIdx === -1) return false;
    if (localStore.batches[batchIdx].userId !== userId) {
      throw new Error('Unauthorized: cannot delete another user\'s batch');
    }
    localStore.batches.splice(batchIdx, 1);
    saveLocalStore();
    return true;
  },

  // Suppliers (global - not user-scoped for demo simplicity)
  getSuppliers: async () => {
    return localStore.suppliers;
  },
  saveSupplier: async (supplierObj) => {
    const id = supplierObj.id || 'sup_' + Date.now();
    const full = { ...supplierObj, id };
    const idx = localStore.suppliers.findIndex(s => s.id === id);
    if (idx >= 0) {
      localStore.suppliers[idx] = full;
    } else {
      localStore.suppliers.push(full);
    }
    saveLocalStore();
    return full;
  }
};

module.exports = {
  initializeDatabase,
  db
};
