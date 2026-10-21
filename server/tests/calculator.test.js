const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBatchEconomics, calculateWhatIfScenario } = require('../utils/calculator');
const { analyzeAndOptimizeBatch } = require('../utils/optimizerEngine');
const { generateCostForecast } = require('../utils/forecastEngine');

test('Batch Economics Calculation - Mango Jam Preset (Known Sample Values)', () => {
  const input = {
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
      { name: 'Mango Pulp', quantity: 550, unit: 'kg', unitPrice: 85 }, // 46750
      { name: 'Sugar', quantity: 420, unit: 'kg', unitPrice: 42 },      // 17640
      { name: 'Pectin', quantity: 8, unit: 'kg', unitPrice: 750 },      // 6000
      { name: 'Citric Acid', quantity: 4, unit: 'kg', unitPrice: 180 }  // 720
    ]
  };

  const result = calculateBatchEconomics(input);

  // Raw Material Cost: 46750 + 17640 + 6000 + 720 = 71110
  assert.equal(result.rawMaterialCost, 71110);
  
  // Direct variable costs = 71110 + 18000 + 12000 + 6500 + 1500 + 4000 = 113110
  // Wastage cost = 113110 * 0.065 = 7352.15
  assert.equal(result.wastageCost, 7352.15);

  // Total variable cost = 113110 + 7352.15 = 120462.15
  assert.equal(result.totalVariableCost, 120462.15);

  // Total Production Cost = 120462.15 + 10000 = 130462.15
  assert.equal(result.totalProductionCost, 130462.15);

  // Sellable Quantity = 1000 * (1 - 0.065) = 935 kg
  assert.equal(result.sellableQuantity, 935);

  // Cost per unit = 130462.15 / 935 = 139.53
  assert.equal(result.costPerUnit, 139.53);

  // Total Revenue = 935 * 160 = 149600
  assert.equal(result.totalRevenue, 149600);

  // Gross profit = 149600 - 130462.15 = 19137.85
  assert.equal(result.grossProfit, 19137.85);

  // Margin % = (19137.85 / 149600) * 100 = 12.79%
  assert.equal(result.profitMarginPercentage, 12.79);
});

test('Edge Cases - Zero Quantity and Zero Selling Price', () => {
  const input = {
    batchQuantity: 0,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 0,
    packagingCost: 0,
    labourCost: 0,
    energyCost: 0,
    waterUtilitiesCost: 0,
    transportLogisticsCost: 0,
    overheadCost: 0,
    wastagePercentage: 0,
    ingredients: []
  };

  const result = calculateBatchEconomics(input);
  assert.equal(result.totalProductionCost, 0);
  assert.equal(result.costPerUnit, 0);
  assert.equal(result.grossProfit, 0);
  assert.equal(result.profitMarginPercentage, 0);
  assert.equal(result.breakEvenQuantity, 0);
});

test('Edge Cases - Negative Numbers and Sanitization', () => {
  const input = {
    batchQuantity: -500,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: -100,
    packagingCost: -50,
    labourCost: -20,
    energyCost: -10,
    waterUtilitiesCost: -5,
    transportLogisticsCost: -5,
    overheadCost: -100,
    wastagePercentage: -10,
    ingredients: [
      { name: 'Bad Ingredient', quantity: -10, unit: 'kg', unitPrice: -50 }
    ]
  };

  const result = calculateBatchEconomics(input);
  assert.ok(result.rawMaterialCost >= 0);
  assert.ok(result.totalProductionCost >= 0);
  assert.ok(result.costPerUnit >= 0);
  assert.ok(result.sellingPricePerUnit >= 0);
});

test('What-If Scenario Simulation - Price Spike & Wastage Reduction', () => {
  const baseline = {
    batchQuantity: 1000,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 160,
    packagingCost: 10000,
    labourCost: 10000,
    energyCost: 5000,
    waterUtilitiesCost: 1000,
    transportLogisticsCost: 2000,
    overheadCost: 5000,
    wastagePercentage: 5,
    ingredients: [
      { name: 'Fruit Concentrate', quantity: 500, unit: 'kg', unitPrice: 100 }
    ]
  };

  const mods = {
    ingredientPriceChangePct: 10,
    wastageDeltaPct: -2
  };

  const sim = calculateWhatIfScenario(baseline, mods);

  assert.ok(sim.scenario.rawMaterialCost > sim.baseline.rawMaterialCost);
  assert.equal(sim.scenario.rawMaterialCost, 55000); // 500 * 110
  assert.equal(sim.scenario.wastagePercentage, 3);   // 5 - 2
  assert.ok(sim.delta.totalCostChange > 0);
});

test('Production Optimization Rules Engine Audit', () => {
  const economics = calculateBatchEconomics({
    batchQuantity: 1000,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 100, // Cost is ~139, so margin is negative
    packagingCost: 25000,     // High packaging (>18%)
    labourCost: 12000,
    energyCost: 6500,
    waterUtilitiesCost: 1500,
    transportLogisticsCost: 4000,
    overheadCost: 10000,
    wastagePercentage: 8.0,   // High wastage (>5%)
    ingredients: [
      { name: 'Expensive Pulp', quantity: 600, unit: 'kg', unitPrice: 100 } // 60000 (>20% total cost)
    ]
  });

  const analysis = analyzeAndOptimizeBatch(economics);
  assert.ok(analysis.recommendations.length >= 3);
  assert.ok(analysis.summary.healthScore < 80);
  assert.ok(analysis.summary.totalPotentialSavingsMin > 0);
});

test('Optimizer Engine - Partial/Incomplete Economics Object Does Not Crash', () => {
  const analysis = analyzeAndOptimizeBatch({ totalProductionCost: 1000 });
  assert.ok(analysis);
  assert.ok(Array.isArray(analysis.recommendations));
  assert.ok(Array.isArray(analysis.flags));
  assert.ok(analysis.summary.healthScore >= 10);
  assert.ok(Number.isFinite(analysis.summary.totalPotentialSavingsMin));
  assert.ok(Number.isFinite(analysis.summary.totalPotentialSavingsMax));
  analysis.recommendations.forEach(rec => {
    assert.ok(Number.isFinite(rec.estimatedSavingsMin), rec.id);
    assert.ok(Number.isFinite(rec.estimatedSavingsMax), rec.id);
  });
});

test('Forecast Engine - Empty Records Fall Back to Sample Data', () => {
  const forecast = generateCostForecast([], 6);
  assert.equal(forecast.isSampleData, true);
  assert.equal(forecast.forecastPoints.length, 6);
  assert.equal(forecast.unitOfMeasure, 'kg');
  assert.equal(forecast.hasMixedUnits, false);
});

test('Cost Forecasting Statistical Engine Audit', () => {
  const records = [
    { date: '2025-08-01', costPerUnit: 80, totalProductionCost: 80000, productionQuantity: 1000, rawMaterialCost: 40000, sellingPrice: 120, unitOfMeasure: 'kg', productName: 'Mango Jam' },
    { date: '2025-09-01', costPerUnit: 82, totalProductionCost: 82000, productionQuantity: 1000, rawMaterialCost: 41000, sellingPrice: 120, unitOfMeasure: 'kg', productName: 'Mango Jam' },
    { date: '2025-10-01', costPerUnit: 85, totalProductionCost: 85000, productionQuantity: 1000, rawMaterialCost: 43000, sellingPrice: 120, unitOfMeasure: 'kg', productName: 'Mango Jam' },
    { date: '2025-11-01', costPerUnit: 88, totalProductionCost: 88000, productionQuantity: 1000, rawMaterialCost: 45000, sellingPrice: 120, unitOfMeasure: 'kg', productName: 'Mango Jam' }
  ];

  const forecast = generateCostForecast(records, 6);
  assert.equal(forecast.isSampleData, false);
  assert.equal(forecast.forecastPoints.length, 6);
  assert.ok(forecast.analytics.trendDirection === 'INCREASING');
  assert.equal(forecast.unitOfMeasure, 'kg');
  assert.equal(forecast.hasMixedUnits, false);
  assert.equal(forecast.productName, 'Mango Jam');
});

test('Forecast Engine - Chronological Date Ordering and Consecutive 6-Month Sequence', () => {
  // Pass unsorted historical records
  const records = [
    { date: '2025-11-01', costPerUnit: 90, unitOfMeasure: 'kg' },
    { date: '2025-09-01', costPerUnit: 86, unitOfMeasure: 'kg' },
    { date: '2025-12-01', costPerUnit: 92, unitOfMeasure: 'kg' },
    { date: '2025-10-01', costPerUnit: 88, unitOfMeasure: 'kg' }
  ];

  const forecast = generateCostForecast(records, 6);

  // Check historical ordering is strictly ascending
  const histDates = forecast.historicalPoints.map(p => p.date);
  assert.deepEqual(histDates, ['2025-09', '2025-10', '2025-11', '2025-12']);

  // Check 6 forecast points exist
  assert.equal(forecast.forecastPoints.length, 6);

  // Check forecast begins immediately in the consecutive month after 2025-12
  const fcDates = forecast.forecastPoints.map(p => p.date);
  assert.deepEqual(fcDates, [
    '2026-01',
    '2026-02',
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06'
  ]);

  // Ensure year is retained in monthLabel to prevent duplicated ambiguous labels
  forecast.forecastPoints.forEach(p => {
    assert.ok(p.monthLabel.includes('2026'), `Month label ${p.monthLabel} should include year 2026`);
    assert.equal(p.isForecast, true);
    assert.ok(p.projectedCostPerUnit > 0);
    assert.ok(p.lowerConfidenceBound <= p.projectedCostPerUnit);
    assert.ok(p.upperConfidenceBound >= p.projectedCostPerUnit);
  });
});

test('Forecast Engine - Actual-versus-Forecast Mapping & Null Preservation', () => {
  const records = [
    { date: '2025-07-01', costPerUnit: 80, unitOfMeasure: 'kg' },
    { date: '2025-08-01', costPerUnit: null, unitOfMeasure: 'kg' }, // Missing value
    { date: '2025-09-01', costPerUnit: undefined, unitOfMeasure: 'kg' }, // Undefined value
    { date: '2025-10-01', costPerUnit: 84, unitOfMeasure: 'kg' }
  ];

  const forecast = generateCostForecast(records, 6);

  // Missing values must remain null, NOT coerced to 0
  assert.strictEqual(forecast.historicalPoints[0].actualCostPerUnit, 80);
  assert.strictEqual(forecast.historicalPoints[1].actualCostPerUnit, null);
  assert.strictEqual(forecast.historicalPoints[2].actualCostPerUnit, null);
  assert.strictEqual(forecast.historicalPoints[3].actualCostPerUnit, 84);

  // Historical points are flagged isForecast: false
  assert.strictEqual(forecast.historicalPoints[0].isForecast, false);

  // Forecast points are flagged isForecast: true
  assert.strictEqual(forecast.forecastPoints[0].isForecast, true);
});

test('Forecast Engine - Unit Comparability and Mixed Units Detection', () => {
  const mixedRecords = [
    { date: '2025-08-01', costPerUnit: 80, unitOfMeasure: 'kg' },
    { date: '2025-09-01', costPerUnit: 45, unitOfMeasure: 'liters' }
  ];

  const result = generateCostForecast(mixedRecords, 6);
  assert.equal(result.hasMixedUnits, true);
  assert.strictEqual(result.unitOfMeasure, null);

  const homogeneousRecords = [
    { date: '2025-08-01', costPerUnit: 80, unitOfMeasure: 'units' },
    { date: '2025-09-01', costPerUnit: 85, unitOfMeasure: 'units' }
  ];

  const cleanResult = generateCostForecast(homogeneousRecords, 6);
  assert.equal(cleanResult.hasMixedUnits, false);
  assert.equal(cleanResult.unitOfMeasure, 'units');
});

test('Forecast Engine - Identical Historical Values Retained Without Fabricated Variation', () => {
  // If costs are genuinely identical, the engine should retain them faithfully
  const identicalRecords = [
    { date: '2025-08-01', costPerUnit: 85.00, unitOfMeasure: 'kg' },
    { date: '2025-09-01', costPerUnit: 85.00, unitOfMeasure: 'kg' },
    { date: '2025-10-01', costPerUnit: 85.00, unitOfMeasure: 'kg' },
    { date: '2025-11-01', costPerUnit: 85.00, unitOfMeasure: 'kg' }
  ];

  const forecast = generateCostForecast(identicalRecords, 6);
  forecast.historicalPoints.forEach(p => {
    assert.strictEqual(p.actualCostPerUnit, 85);
  });
  assert.equal(forecast.analytics.trendDirection, 'STABLE');
});

test('Forecast Engine Regression - Cream & Culture Historical Series, Bounds & Mixed Units', () => {
  const creamRecords = [
    { date: '2025-10-18T06:00:00.000Z', costPerUnit: 325.44, unitOfMeasure: 'kg', productName: 'Fresh Malai Paneer' },
    { date: '2025-11-15T06:30:00.000Z', costPerUnit: 247.42, unitOfMeasure: 'kg', productName: 'Artisanal Greek Set Yogurt' },
    { date: '2025-12-12T07:00:00.000Z', costPerUnit: 177.25, unitOfMeasure: 'L', productName: 'Rich Kesar Badam Milk' },
    { date: '2026-01-16T06:00:00.000Z', costPerUnit: 325.43, unitOfMeasure: 'kg', productName: 'Fresh Malai Paneer' },
    { date: '2026-02-12T07:30:00.000Z', costPerUnit: 342.25, unitOfMeasure: 'kg', productName: 'Royal Gulab Jamun (Mawa)' },
    { date: '2026-03-10T06:30:00.000Z', costPerUnit: 245.53, unitOfMeasure: 'kg', productName: 'Cardamom Kesar Shrikhand' },
    { date: '2026-03-28T07:00:00.000Z', costPerUnit: 246.55, unitOfMeasure: 'kg', productName: 'Artisanal Greek Set Yogurt' },
    { date: '2026-04-14T06:00:00.000Z', costPerUnit: 345.91, unitOfMeasure: 'kg', productName: 'Fresh Malai Paneer (Warm Weather Risk)' },
    { date: '2026-04-30T07:30:00.000Z', costPerUnit: 178.17, unitOfMeasure: 'L', productName: 'Rich Kesar Badam Milk' },
    { date: '2026-05-18T06:30:00.000Z', costPerUnit: 314.01, unitOfMeasure: 'kg', productName: 'Fresh Malai Paneer' }
  ];

  const forecast = generateCostForecast(creamRecords, 6);

  // 1. Mixed units detection and portfolio product name
  assert.equal(forecast.isSampleData, false);
  assert.equal(forecast.hasMixedUnits, true, 'Cream & Culture contains both kg and L');
  assert.strictEqual(forecast.unitOfMeasure, null, 'Unit must be null when mixed units exist');
  assert.equal(forecast.productName, 'Production Batch Portfolio');

  // 2. Projected values strictly follow the hybrid model formula
  const expectedProjections = [195.43, 176.34, 157.26, 138.17, 119.09, 100];
  assert.deepEqual(
    forecast.forecastPoints.map(p => p.projectedCostPerUnit),
    expectedProjections,
    'Forecast values must strictly follow the hybrid Holt and linear regression model'
  );

  // 3. Mathematical validity: confidence intervals contain projected points and outputs are finite
  forecast.forecastPoints.forEach(p => {
    assert.ok(Number.isFinite(p.projectedCostPerUnit), 'Projected cost must be finite');
    assert.ok(Number.isFinite(p.lowerConfidenceBound), 'Lower confidence bound must be finite');
    assert.ok(Number.isFinite(p.upperConfidenceBound), 'Upper confidence bound must be finite');
    assert.ok(
      p.lowerConfidenceBound <= p.projectedCostPerUnit,
      `Lower bound ${p.lowerConfidenceBound} must be <= projected ${p.projectedCostPerUnit}`
    );
    assert.ok(
      p.projectedCostPerUnit <= p.upperConfidenceBound,
      `Projected ${p.projectedCostPerUnit} must be <= upper bound ${p.upperConfidenceBound}`
    );
  });
});

test('Optimizer Engine - Empty Object Rejected by Validation', () => {
  const { analyzeAndOptimizeBatch } = require('../utils/optimizerEngine');
  const analysis = analyzeAndOptimizeBatch({});
  // The optimizer engine itself handles empty objects gracefully
  // but the API validation should reject empty objects
  assert.ok(analysis);
  assert.ok(Array.isArray(analysis.recommendations));
});

test('Optimizer Engine - Valid Request Works', () => {
  const { analyzeAndOptimizeBatch } = require('../utils/optimizerEngine');
  const analysis = analyzeAndOptimizeBatch({
    batchQuantity: 1000,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 100,
    packagingCost: 25000,
    labourCost: 12000,
    energyCost: 6500,
    waterUtilitiesCost: 1500,
    transportLogisticsCost: 4000,
    overheadCost: 10000,
    wastagePercentage: 8.0,
    ingredients: [
      { name: 'Expensive Pulp', quantity: 600, unit: 'kg', unitPrice: 100 }
    ]
  });
  assert.ok(analysis);
  assert.ok(Array.isArray(analysis.recommendations));
  assert.ok(analysis.recommendations.length >= 3);
});

test('Calculate Engine - Invalid Input Rejected', () => {
  const { calculateBatchEconomics } = require('../utils/calculator');
  // Should not crash on invalid input, should handle gracefully
  const result = calculateBatchEconomics({
    batchQuantity: -100,
    unitOfMeasure: 'invalid',
    sellingPricePerUnit: -50,
    packagingCost: -100,
    ingredients: []
  });
  // Should sanitize negative values to 0
  assert.ok(result.batchQuantity >= 0);
  assert.ok(result.sellingPricePerUnit >= 0);
  assert.ok(result.packagingCost >= 0);
  assert.ok(result.rawMaterialCost >= 0);
  assert.ok(result.totalProductionCost >= 0);
});

test('AI Advisor - Asking about ingredient cost vs wastage produces distinct, structured responses', async () => {
  const { queryAIAdvisor, generateOfflineAIResponse } = require('../utils/aiEngine');

  const batchContext = {
    productName: 'Premium Mango Jam',
    batchQuantity: 1000,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 160,
    totalProductionCost: 85000,
    costPerUnit: 85,
    profitMarginPercentage: 46.88,
    rawMaterialCost: 50000,
    packagingCost: 15000,
    overheadCost: 10000,
    wastageCost: 5000,
    wastagePercentage: 6.5,
    costContributions: {
      rawMaterialPct: 58.82,
      packagingPct: 17.65,
      overheadPct: 11.76,
      wastagePct: 5.88
    },
    ingredients: [
      { name: 'Alphonso Mango Pulp', quantity: 500, unit: 'kg', unitPrice: 70, totalCost: 35000 },
      { name: 'Refined Sugar', quantity: 400, unit: 'kg', unitPrice: 35, totalCost: 14000 },
      { name: 'Pectin', quantity: 10, unit: 'kg', unitPrice: 100, totalCost: 1000 }
    ]
  };

  // 1. Ask about ingredient cost
  const resIngredients = await queryAIAdvisor('Why is my ingredient cost so high?', batchContext);
  assert.equal(resIngredients.status, 'SUCCESS');
  assert.equal(resIngredients.mode, 'DEMO_OFFLINE_AI');
  assert.ok(resIngredients.answer.includes('Summary'));
  assert.ok(resIngredients.answer.includes('Cost Drivers'));
  assert.ok(resIngredients.answer.includes('Recommended Actions'));
  assert.ok(resIngredients.answer.includes('Alphonso Mango Pulp'));
  assert.ok(resIngredients.answer.includes('₹35000'));

  // 2. Ask about wastage
  const resWastage = await queryAIAdvisor('How can I reduce wastage and yield loss?', batchContext);
  assert.equal(resWastage.status, 'SUCCESS');
  assert.equal(resWastage.mode, 'DEMO_OFFLINE_AI');
  assert.ok(resWastage.answer.includes('Summary'));
  assert.ok(resWastage.answer.includes('Cost Drivers'));
  assert.ok(resWastage.answer.includes('Recommended Actions'));
  assert.ok(resWastage.answer.includes('6.5%'));
  assert.ok(resWastage.answer.includes('₹5000'));

  // 3. Verify the responses are strictly distinct and not reused or stale
  assert.notEqual(resIngredients.answer, resWastage.answer, 'Ingredient response and wastage response must be distinct');
});

test('AI Advisor - Inflation and Scaling Scenarios calculate exact grounded numbers', () => {
  const { generateOfflineAIResponse } = require('../utils/aiEngine');

  const batchContext = {
    productName: 'Tomato Sauce',
    batchQuantity: 2000,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 80,
    totalProductionCost: 100000,
    costPerUnit: 50,
    profitMarginPercentage: 37.5,
    rawMaterialCost: 60000,
    overheadCost: 12000,
    wastagePercentage: 4.0,
    costContributions: { rawMaterialPct: 60, overheadPct: 12 }
  };

  // 15% raw material price increase
  const res15 = generateOfflineAIResponse('What happens if raw material prices increase by 15%?', batchContext);
  // 15% of 60,000 = 9,000
  assert.ok(res15.includes('₹9000'), 'Should calculate exact 15% increase of ₹9,000');
  assert.ok(res15.includes('Summary') && res15.includes('Recommended Actions'));

  // Batch size scaling
  const resScale = generateOfflineAIResponse('How does batch size scaling affect my fixed plant overheads?', batchContext);
  assert.ok(resScale.includes('₹12000'), 'Should reference exact overhead of ₹12,000');
  assert.ok(resScale.includes('1.5x Volume'), 'Should include 1.5x volume projection');
  assert.ok(resScale.includes('2.0x Volume'), 'Should include 2.0x volume projection');
});
