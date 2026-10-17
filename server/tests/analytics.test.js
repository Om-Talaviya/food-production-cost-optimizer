/**
 * Business Analytics Engine tests (Workstream D)
 * ==============================================
 * The analytics engine is authored as client-side ESM
 * (`client/src/utils/analyticsEngine.js`) with no React/DOM imports so it can
 * be exercised from the existing Node test runner through dynamic `import()`.
 * See TODO.md DD-1.
 *
 * Fixtures are built with the real `calculateBatchEconomics` so the tests cover
 * the actual data contract between the calculator and the analytics layer.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { calculateBatchEconomics, round2 } = require('../utils/calculator');

const ENGINE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'client',
  'src',
  'utils',
  'analyticsEngine.js'
);

let enginePromise;
function loadEngine() {
  if (!enginePromise) {
    enginePromise = import(pathToFileURL(ENGINE_PATH).href);
  }
  return enginePromise;
}

const mangoJamInput = {
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
    { name: 'Mango Pulp', quantity: 550, unit: 'kg', unitPrice: 85 },
    { name: 'Sugar', quantity: 420, unit: 'kg', unitPrice: 42 },
    { name: 'Pectin', quantity: 8, unit: 'kg', unitPrice: 750 },
    { name: 'Citric Acid', quantity: 4, unit: 'kg', unitPrice: 180 }
  ]
};

const lossMakingInput = {
  batchQuantity: 500,
  unitOfMeasure: 'kg',
  sellingPricePerUnit: 50,
  packagingCost: 5000,
  labourCost: 4000,
  energyCost: 2000,
  waterUtilitiesCost: 500,
  transportLogisticsCost: 1000,
  overheadCost: 3000,
  wastagePercentage: 5,
  ingredients: [{ name: 'Pulp', quantity: 300, unit: 'kg', unitPrice: 100 }]
};

function makeBatch(id, productName, productCategory, input) {
  return {
    id,
    productName,
    productCategory,
    createdAt: '2026-05-01T00:00:00.000Z',
    economics: calculateBatchEconomics(input)
  };
}

test('buildAnalysisRow - flattens a batch into the documented column set', async () => {
  const { buildAnalysisRow, ANALYSIS_COLUMNS } = await loadEngine();
  const batch = makeBatch('b1', 'Mango Jam', 'Preserves', mangoJamInput);
  const row = buildAnalysisRow(batch);

  for (const col of ANALYSIS_COLUMNS) {
    assert.ok(col.key in row, `row missing column key: ${col.key}`);
  }

  assert.equal(row.batchId, 'b1');
  assert.equal(row.productName, 'Mango Jam');
  assert.equal(row.productCategory, 'Preserves');
  assert.equal(row.unitOfMeasure, 'kg');
  assert.equal(row.batchQuantity, 1000);
  assert.equal(row.sellableQuantity, 935);
  assert.equal(row.wastageQuantity, 65); // 1000 - 935
  assert.equal(row.rawMaterialCost, 71110);
  assert.equal(row.totalProductionCost, 130462.15);
  assert.equal(row.costPerUnit, 139.53);
  assert.equal(row.totalRevenue, 149600);
  assert.equal(row.grossProfit, 19137.85);
  assert.equal(row.profitMarginPercentage, 12.79);

  // Ingredient analysis
  assert.equal(row.ingredientCount, 4);
  assert.equal(row.topIngredientName, 'Mango Pulp');
  assert.equal(row.topIngredientCost, 46750);
  // 46750 / 71110 * 100 = 65.74 (%)
  assert.equal(row.topIngredientSharePct, 65.74);
});

test('buildAnalysisRow - missing economics degrades to defaults without throwing', async () => {
  const { buildAnalysisRow } = await loadEngine();
  const row = buildAnalysisRow({ id: 'empty' });

  assert.equal(row.batchId, 'empty');
  assert.equal(row.productName, 'Unnamed Product');
  assert.equal(row.productCategory, 'Uncategorised');
  assert.equal(row.unitOfMeasure, 'kg');
  assert.equal(row.totalProductionCost, 0);
  assert.equal(row.topIngredientName, '');
  assert.equal(row.topIngredientSharePct, 0);
  assert.equal(row.ingredientCount, 0);

  // Null / undefined batch must also be safe.
  assert.equal(buildAnalysisRow(null).batchId, '');
  assert.equal(buildAnalysisRow(undefined).topIngredientCost, 0);
});

test('safeDiv - zero/absent/non-finite denominators return 0', async () => {
  const { safeDiv } = await loadEngine();
  assert.equal(safeDiv(10, 0), 0);
  assert.equal(safeDiv(10, undefined), 0);
  assert.equal(safeDiv(10, null), 0);
  assert.equal(safeDiv(10, NaN), 0);
  assert.equal(safeDiv(10, Infinity), 0);
  assert.equal(safeDiv(NaN, 5), 0);
  assert.equal(safeDiv(10, 4), 2.5);
});

test('Empty dataset - zeroed KPIs, empty structure, explanatory insight', async () => {
  const { buildAnalysisBundle } = await loadEngine();
  const bundle = buildAnalysisBundle([]);

  assert.deepEqual(bundle.rows, []);
  assert.equal(bundle.kpis.batchCount, 0);
  assert.equal(bundle.kpis.totalProductionCost, 0);
  assert.equal(bundle.kpis.totalRevenue, 0);
  assert.equal(bundle.kpis.totalProfit, 0);
  assert.equal(bundle.kpis.avgUnitCost, 0);
  assert.equal(bundle.kpis.portfolioMarginPct, 0);
  assert.equal(bundle.kpis.wastageSharePct, 0);
  assert.equal(bundle.structure.totalCost, 0);
  assert.equal(bundle.structure.categories.length, 7);
  bundle.structure.categories.forEach((c) => assert.equal(c.sharePct, 0));

  assert.equal(bundle.insights.length, 1);
  assert.equal(bundle.insights[0].id, 'no-data');
  assert.equal(bundle.insights[0].severity, 'info');

  // Non-array input must not throw either.
  assert.equal(buildAnalysisBundle(null).kpis.batchCount, 0);
});

test('computePortfolioKpis - aggregates match documented formulas', async () => {
  const { buildDataset, computePortfolioKpis } = await loadEngine();
  const ecoA = calculateBatchEconomics(mangoJamInput);
  const ecoB = calculateBatchEconomics(lossMakingInput);
  const batches = [
    makeBatch('b1', 'Mango Jam', 'Preserves', mangoJamInput),
    makeBatch('b2', 'Cheap Sauce', 'Sauces', lossMakingInput)
  ];

  const rows = buildDataset(batches);
  const k = computePortfolioKpis(rows);

  const sumSellable = ecoA.sellableQuantity + ecoB.sellableQuantity;
  const sumProdCost = ecoA.totalProductionCost + ecoB.totalProductionCost;
  const sumRevenue = ecoA.totalRevenue + ecoB.totalRevenue;
  const sumProfit = ecoA.grossProfit + ecoB.grossProfit;
  const sumWastage = ecoA.wastageCost + ecoB.wastageCost;

  assert.equal(k.batchCount, 2);
  assert.equal(k.productCount, 2);
  assert.equal(k.totalProductionCost, round2(sumProdCost));
  assert.equal(k.totalRevenue, round2(sumRevenue));
  assert.equal(k.totalProfit, round2(sumProfit));
  assert.equal(k.totalWastageCost, round2(sumWastage));
  assert.equal(k.avgUnitCost, round2(sumProdCost / sumSellable));
  assert.equal(k.avgSellingPrice, round2(sumRevenue / sumSellable));
  assert.equal(k.portfolioMarginPct, round2((sumProfit / sumRevenue) * 100));
  assert.equal(k.wastageSharePct, round2((sumWastage / sumProdCost) * 100));

  // The loss-making batch must be detected.
  assert.equal(k.lossMakingCount, 1);
  assert.deepEqual(k.lossMakingProducts, ['Cheap Sauce']);
});

test('computeCostStructure - fixed 7-category taxonomy summing to 100%', async () => {
  const { buildDataset, computeCostStructure, COST_CATEGORIES } = await loadEngine();
  const rows = buildDataset([
    makeBatch('b1', 'Mango Jam', 'Preserves', mangoJamInput),
    makeBatch('b2', 'Cheap Sauce', 'Sauces', lossMakingInput)
  ]);
  const structure = computeCostStructure(rows);

  assert.equal(structure.categories.length, COST_CATEGORIES.length);
  assert.deepEqual(
    structure.categories.map((c) => c.key),
    COST_CATEGORIES.map((c) => c.key)
  );

  // Category costs sum to total production cost (energy + water are merged).
  const sumCategories = round2(
    structure.categories.reduce((acc, c) => acc + c.cost, 0)
  );
  assert.equal(sumCategories, structure.totalCost);

  // Shares sum to ~100 (allow 0.05 for per-category rounding).
  const sumShares = structure.categories.reduce((acc, c) => acc + c.sharePct, 0);
  assert.ok(Math.abs(sumShares - 100) < 0.05, `shares summed to ${sumShares}`);
});

test('rankProducts - sorted descending with stable 1-based ranks', async () => {
  const { buildDataset, rankProducts } = await loadEngine();
  const rows = buildDataset([
    makeBatch('b1', 'Mango Jam', 'Preserves', mangoJamInput),
    makeBatch('b2', 'Cheap Sauce', 'Sauces', lossMakingInput)
  ]);
  const ranking = rankProducts(rows);

  assert.equal(ranking.length, 2);
  assert.equal(ranking[0].rank, 1);
  assert.equal(ranking[1].rank, 2);
  assert.ok(ranking[0].marginPct >= ranking[1].marginPct);
  assert.equal(ranking[0].productName, 'Mango Jam');
  assert.equal(ranking[1].productName, 'Cheap Sauce');
});

test('computeMarginBands - every row lands in exactly one band', async () => {
  const { buildDataset, computeMarginBands } = await loadEngine();
  const rows = buildDataset([
    makeBatch('b1', 'Mango Jam', 'Preserves', mangoJamInput),
    makeBatch('b2', 'Cheap Sauce', 'Sauces', lossMakingInput)
  ]);
  const bands = computeMarginBands(rows);

  const total = bands.reduce((acc, b) => acc + b.count, 0);
  assert.equal(total, rows.length);
  // Loss-making row should be in the first band.
  assert.equal(bands[0].count, 1);
});

test('computeWastageAnalysis - offenders sorted by wasted value', async () => {
  const { buildDataset, computeWastageAnalysis } = await loadEngine();
  const rows = buildDataset([
    makeBatch('b1', 'Mango Jam', 'Preserves', mangoJamInput),
    makeBatch('b2', 'Cheap Sauce', 'Sauces', lossMakingInput)
  ]);
  const wastage = computeWastageAnalysis(rows);

  assert.equal(wastage.offenders.length, 2);
  assert.ok(wastage.offenders[0].wastageCost >= wastage.offenders[1].wastageCost);
  assert.equal(wastage.offenders[0].productName, 'Mango Jam');
  assert.ok(wastage.totalWastageCost > 0);
  assert.ok(wastage.totalWastageQuantity > 0);
});

test('generateInsights - loss-making and wastage rules fire with evidence', async () => {
  const { buildDataset, computePortfolioKpis, computeCostStructure, generateInsights } =
    await loadEngine();
  const rows = buildDataset([
    makeBatch('b1', 'Mango Jam', 'Preserves', mangoJamInput),
    makeBatch('b2', 'Cheap Sauce', 'Sauces', lossMakingInput)
  ]);
  const kpis = computePortfolioKpis(rows);
  const structure = computeCostStructure(rows);
  const insights = generateInsights(rows, kpis, structure);

  const ids = insights.map((i) => i.id);
  assert.ok(ids.includes('loss-making'), 'expected loss-making insight');
  assert.ok(ids.includes('high-wastage'), 'expected high-wastage insight');

  const loss = insights.find((i) => i.id === 'loss-making');
  assert.equal(loss.severity, 'critical');
  assert.equal(loss.metricValue, 1);

  // Every insight carries numeric evidence.
  insights.forEach((i) => {
    assert.equal(typeof i.metricLabel, 'string');
    assert.ok(Number.isFinite(Number(i.metricValue)), `bad metricValue for ${i.id}`);
  });
});

test('toCsv - stable header and RFC 4180 escaping', async () => {
  const { toCsv, ANALYSIS_COLUMNS } = await loadEngine();
  const rows = [
    {
      batchId: 'b1',
      productName: 'He, said "hi"',
      productCategory: 'Line\nBreak',
      createdAt: '2026-05-01'
    }
  ];
  const csv = toCsv(rows, ANALYSIS_COLUMNS);
  const lines = csv.split('\n');

  // Header uses the documented labels, one column per ANALYSIS_COLUMNS entry.
  const header = lines[0].split(',');
  assert.equal(header.length, ANALYSIS_COLUMNS.length);
  assert.equal(header[0], 'batch_id');
  assert.equal(header[1], 'product_name');

  // Escaped content: comma, quote doubling, and embedded newline.
  assert.ok(csv.includes('"He, said ""hi"""'));
  assert.ok(csv.includes('"Line\nBreak"'));

  // Header + one data row for a single input row (embedded newline keeps the
  // escaped row on the same logical record).
  assert.ok(csv.startsWith('batch_id,product_name,product_category'));
});

test('escapeCsvField - direct escaping rules', async () => {
  const { escapeCsvField } = await loadEngine();
  assert.equal(escapeCsvField('plain'), 'plain');
  assert.equal(escapeCsvField('a,b'), '"a,b"');
  assert.equal(escapeCsvField('a"b'), '"a""b"');
  assert.equal(escapeCsvField(null), '');
  assert.equal(escapeCsvField(undefined), '');
  assert.equal(escapeCsvField(42), '42');
});

test('No identity/secret leakage - exported columns are economics-only', async () => {
  const { ANALYSIS_COLUMNS } = await loadEngine();
  const forbidden = ['token', 'password', 'email', 'user', 'jwt', 'secret', 'auth'];
  const keys = ANALYSIS_COLUMNS.map((c) => c.key.toLowerCase());
  forbidden.forEach((needle) => {
    assert.ok(
      !keys.some((k) => k.includes(needle)),
      `analysis column unexpectedly exposes '${needle}'`
    );
  });
});
