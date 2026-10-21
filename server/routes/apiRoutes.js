const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db } = require('../utils/database');
const { calculateBatchEconomics, calculateWhatIfScenario } = require('../utils/calculator');
const { analyzeAndOptimizeBatch } = require('../utils/optimizerEngine');
const { generateCostForecast, getSampleForecastData } = require('../utils/forecastEngine');
const { queryAIAdvisor } = require('../utils/aiEngine');
const { authMiddleware, JWT_SECRET } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validation');

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

router.post('/auth/register', validate(schemas.register), async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await db.createUser({
      name,
      email,
      passwordHash,
      companyName: companyName || 'Food Processors Inc.',
      createdAt: new Date().toISOString()
    });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, companyName: user.companyName }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // DEMO MODE: Guest login for portfolio evaluation only.
    // This creates an isolated demo user that can only access its own data.
    // Real users should register and login normally.
    if (email === 'guest@demo.com' && password === 'guest123') {
      // Ensure guest user exists in store (for demo data isolation)
      let guestUser = await db.findUserByEmail('guest@demo.com');
      if (!guestUser) {
        guestUser = await db.createUser({
          name: 'DEMO Guest',
          email: 'guest@demo.com',
          passwordHash: 'demo-no-password', // not used for guest login
          companyName: 'Demo Foods Corp (Sample Data)',
          createdAt: new Date().toISOString()
        });
        // Seed a few demo batches for the guest user if they don't have any
        const guestBatches = await db.getBatches(guestUser.id);
        if (guestBatches.length === 0) {
          const { calculateBatchEconomics } = require('../utils/calculator');
          const demoBatch = {
            id: 'batch_demo_mango_jam',
            userId: guestUser.id,
            productName: 'Premium Mango Jam (Demo)',
            productCategory: 'Preserves & Jams',
            batchQuantity: 1000,
            unitOfMeasure: 'kg',
            sellingPricePerUnit: 160,
            packagingCost: 18000,
            labourCost: 12000,
            energyCost: 6500,
            waterUtilitiesCost: 1500,
            transportLogisticsCost: 4000,
            overheadCost: 10000,
            wastagePercentage: 6.5,
            ingredients: [
              { name: 'Mango Pulp (Alphonso)', quantity: 550, unit: 'kg', unitPrice: 85 },
              { name: 'Refined Sugar', quantity: 420, unit: 'kg', unitPrice: 42 },
              { name: 'Pectin (Fruit Grade)', quantity: 8, unit: 'kg', unitPrice: 750 },
              { name: 'Citric Acid', quantity: 4, unit: 'kg', unitPrice: 180 }
            ],
            createdAt: new Date().toISOString()
          };
          await db.saveBatch(demoBatch, guestUser.id);
        }
      }

      const token = jwt.sign(
        { id: guestUser.id, email: guestUser.email, name: guestUser.name, isDemo: true },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: { id: guestUser.id, name: guestUser.name, email: guestUser.email, companyName: guestUser.companyName, isDemo: true }
      });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, companyName: user.companyName }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// 2. PRODUCTION COST ENGINE ENDPOINTS
// ==========================================

router.post('/calculate', validate(schemas.calculate), (req, res) => {
  try {
    const economics = calculateBatchEconomics(req.body);
    res.json({ success: true, data: economics });
  } catch (err) {
    res.status(400).json({ error: 'Calculation failed: ' + err.message });
  }
});

router.post('/whatif/simulate', validate(schemas.whatIf), (req, res) => {
  try {
    const { baseline, modifications } = req.body;
    if (!baseline) {
      return res.status(400).json({ error: 'Baseline batch data is required' });
    }
    const result = calculateWhatIfScenario(baseline, modifications || {});
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: 'What-If Simulation failed: ' + err.message });
  }
});

router.post('/optimizer/analyze', validate(schemas.optimizer), (req, res) => {
  try {
    const batchData = req.body;
    const economics = batchData.economics || calculateBatchEconomics(batchData);
    const analysis = analyzeAndOptimizeBatch(economics);
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(400).json({ error: 'Optimization analysis failed: ' + err.message });
  }
});

// ==========================================
// 3. AI ADVISOR ENDPOINT
// ==========================================

router.post('/ai/advisor', authMiddleware, validate(schemas.aiAdvisor), async (req, res) => {
  try {
    const { question, batchData } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question prompt is required' });
    }

    const economics = batchData?.economics || calculateBatchEconomics(batchData || {});
    const batchContext = {
      ...batchData,
      ...economics,
      economics,
      productName: batchData?.productName || 'Food Batch',
      unitOfMeasure: batchData?.unitOfMeasure || 'kg',
      batchQuantity: batchData?.batchQuantity || 1000,
      sellingPricePerUnit: batchData?.sellingPricePerUnit || economics.sellingPricePerUnit || 0,
      wastagePercentage: batchData?.wastagePercentage !== undefined ? batchData.wastagePercentage : (economics.wastagePercentage || 0),
      ingredients: Array.isArray(batchData?.ingredients) ? batchData.ingredients : []
    };

    const result = await queryAIAdvisor(question, batchContext);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: 'AI Advisor error: ' + err.message });
  }
});

// ==========================================
// 4. BATCH MANAGEMENT ENDPOINTS
// ==========================================

router.get('/batches', authMiddleware, async (req, res) => {
  try {
    const batches = await db.getBatches(req.user.id);
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/batches/:id', authMiddleware, async (req, res) => {
  try {
    const batch = await db.getBatchById(req.params.id, req.user.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches', authMiddleware, validate(schemas.batch), async (req, res) => {
  try {
    if (!req.body.productName || !req.body.batchQuantity) {
      return res.status(400).json({ error: 'Product Name and Batch Quantity are required' });
    }
    const saved = await db.saveBatch({
      ...req.body,
      userId: req.user.id
    }, req.user.id);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/batches/:id', authMiddleware, validate(schemas.batch), async (req, res) => {
  try {
    const existing = await db.getBatchById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    const updated = await db.saveBatch({
      ...existing,
      ...req.body,
      id: req.params.id,
      userId: req.user.id
    }, req.user.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/batches/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await db.getBatchById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    const deleted = await db.deleteBatch(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    if (err.message && err.message.includes('Unauthorized')) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.post('/batches/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const existing = await db.getBatchById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    const copy = {
      ...existing,
      id: undefined,
      productName: `${existing.productName} (Copy)`,
      createdAt: new Date().toISOString()
    };
    const saved = await db.saveBatch(copy, req.user.id);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. FORECASTING ENDPOINT
// ==========================================

router.get('/forecast', authMiddleware, async (req, res) => {
  try {
    const batches = await db.getBatches(req.user.id);
    const records = batches.map(b => ({
      date: b.createdAt || new Date().toISOString(),
      costPerUnit: b.economics?.costPerUnit || 0,
      totalProductionCost: b.economics?.totalProductionCost || 0,
      productionQuantity: b.batchQuantity || 0,
      rawMaterialCost: b.economics?.rawMaterialCost || 0,
      sellingPrice: b.sellingPricePerUnit || 0,
      unitOfMeasure: b.unitOfMeasure,
      productName: b.productName
    }));

    // A forecast needs a believable monthly history. The built-in demo seed
    // batches are unrelated products created within days of each other, so fall
    // back to the labeled Mango Jam sample dataset instead of forecasting from
    // near-identical dates.
    const distinctMonths = new Set(records.map(r => (r.date || '').slice(0, 7))).size;
    if (records.length < 3 || distinctMonths < 3) {
      return res.json({ success: true, data: getSampleForecastData() });
    }

    const forecast = generateCostForecast(records, 6);
    res.json({ success: true, data: forecast });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. SUPPLIER ANALYSIS ENDPOINT
// ==========================================

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await db.getSuppliers();
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suppliers', authMiddleware, validate(schemas.supplier), async (req, res) => {
  try {
    const saved = await db.saveSupplier(req.body);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
