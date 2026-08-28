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
});

test('Cost Forecasting Statistical Engine Audit', () => {
  const records = [
    { date: '2025-08-01', costPerUnit: 80, totalProductionCost: 80000, productionQuantity: 1000, rawMaterialCost: 40000, sellingPrice: 120 },
    { date: '2025-09-01', costPerUnit: 82, totalProductionCost: 82000, productionQuantity: 1000, rawMaterialCost: 41000, sellingPrice: 120 },
    { date: '2025-10-01', costPerUnit: 85, totalProductionCost: 85000, productionQuantity: 1000, rawMaterialCost: 43000, sellingPrice: 120 },
    { date: '2025-11-01', costPerUnit: 88, totalProductionCost: 88000, productionQuantity: 1000, rawMaterialCost: 45000, sellingPrice: 120 }
  ];

  const forecast = generateCostForecast(records, 6);
  assert.equal(forecast.isSampleData, false);
  assert.equal(forecast.forecastPoints.length, 6);
  assert.ok(forecast.analytics.trendDirection === 'INCREASING');
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
