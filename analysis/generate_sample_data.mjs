/**
 * Deterministic sample-data generator for the Python EDA layer.
 * ============================================================
 * Produces an analysis-ready, reproducible dataset by running a synthetic
 * 12-month production history through the SAME engines the web app uses
 * (`client/src/utils/calculator.js` for economics and
 * `client/src/utils/analyticsEngine.js` for flattening/CSV). The output is
 * therefore internally consistent with the application's own numbers.
 *
 * Usage:
 *   node analysis/generate_sample_data.mjs
 *
 * Outputs (relative to the repository root):
 *   analysis/data/sample_production_dataset.csv  — full analysis-ready columns
 *   analysis/data/sample_cost_series.csv         — forecast-engine input shape
 *                                                  (date, product, cost_per_unit,
 *                                                   raw_material_cost,
 *                                                   production_quantity)
 *
 * The dataset is SYNTHETIC demo data (clearly labelled below). It is not real
 * business data and exists only so the EDA/forecast scripts are reproducible
 * without a running server.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateBatchEconomics } from '../client/src/utils/calculator.js';
import {
  buildDataset,
  toCsv,
  ANALYSIS_COLUMNS
} from '../client/src/utils/analyticsEngine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'analysis', 'data');

/**
 * Base product definitions.
 * These MIRROR `client/src/utils/sampleData.js` (kept inline because that file
 * uses extensionless ESM imports that Node cannot resolve directly). Keep the
 * two in sync when presets change.
 */
const PRODUCTS = [
  {
    productName: 'Premium Mango Jam',
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
    ]
  },
  {
    productName: 'Classic Tomato Ketchup',
    productCategory: 'Sauces & Condiments',
    batchQuantity: 2000,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 110,
    packagingCost: 24000,
    labourCost: 18000,
    energyCost: 11000,
    waterUtilitiesCost: 2500,
    transportLogisticsCost: 7500,
    overheadCost: 15000,
    wastagePercentage: 4.8,
    ingredients: [
      { name: 'Tomato Concentrate (28 Brix)', quantity: 1200, unit: 'kg', unitPrice: 52 },
      { name: 'Liquid Glucose & Sugar', quantity: 650, unit: 'kg', unitPrice: 40 },
      { name: 'Vinegar (4% Acidity)', quantity: 110, unit: 'kg', unitPrice: 22 },
      { name: 'Salt & Spices Blend', quantity: 40, unit: 'kg', unitPrice: 65 }
    ]
  },
  {
    productName: 'Crispy Butter Biscuits',
    productCategory: 'Bakery & Confectionery',
    batchQuantity: 500,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 220,
    packagingCost: 12000,
    labourCost: 14000,
    energyCost: 9500,
    waterUtilitiesCost: 1200,
    transportLogisticsCost: 3500,
    overheadCost: 9000,
    wastagePercentage: 3.2,
    ingredients: [
      { name: 'Refined Wheat Flour (Maida)', quantity: 260, unit: 'kg', unitPrice: 32 },
      { name: 'Pure Dairy Butter', quantity: 110, unit: 'kg', unitPrice: 420 },
      { name: 'Icing Sugar', quantity: 115, unit: 'kg', unitPrice: 45 },
      { name: 'Baking Powder & Emulsifiers', quantity: 15, unit: 'kg', unitPrice: 120 }
    ]
  },
  {
    productName: 'Tropical Multi-Fruit Juice',
    productCategory: 'Beverages',
    batchQuantity: 5000,
    unitOfMeasure: 'L',
    sellingPricePerUnit: 68,
    packagingCost: 45000,
    labourCost: 22000,
    energyCost: 18000,
    waterUtilitiesCost: 4000,
    transportLogisticsCost: 16000,
    overheadCost: 28000,
    wastagePercentage: 2.5,
    ingredients: [
      { name: 'Reconstituted Fruit Juice Concentrate', quantity: 3800, unit: 'L', unitPrice: 35 },
      { name: 'Cane Sugar Syrup', quantity: 800, unit: 'L', unitPrice: 28 },
      { name: 'Vitamin C & Ascorbic Acid', quantity: 15, unit: 'kg', unitPrice: 450 },
      { name: 'Purified Deionized Water Base', quantity: 400, unit: 'L', unitPrice: 2 }
    ]
  },
  {
    productName: 'Spicy Raw Mango Pickle',
    productCategory: 'Pickles & Spices',
    batchQuantity: 300,
    unitOfMeasure: 'kg',
    sellingPricePerUnit: 280,
    packagingCost: 9500,
    labourCost: 8000,
    energyCost: 3200,
    waterUtilitiesCost: 800,
    transportLogisticsCost: 2500,
    overheadCost: 5500,
    wastagePercentage: 5.0,
    ingredients: [
      { name: 'Diced Green Raw Mango', quantity: 180, unit: 'kg', unitPrice: 45 },
      { name: 'Mustard Oil (Cold Pressed)', quantity: 65, unit: 'kg', unitPrice: 165 },
      { name: 'Red Chili & Fenugreek Spice Mix', quantity: 40, unit: 'kg', unitPrice: 180 },
      { name: 'Iodized Salt', quantity: 20, unit: 'kg', unitPrice: 15 }
    ]
  }
];

const MONTHS = 12;
const START = { year: 2026, month: 1 }; // Jan 2026 .. Dec 2026

/** Deterministic PRNG (mulberry32) so the dataset is byte-reproducible. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Multiplier in [1 - jitter, 1 + jitter]. */
function jitter(rand, jitterPct) {
  return 1 + (rand() * 2 - 1) * (jitterPct / 100);
}

function monthIso(year, monthIndex0) {
  // Anchor each production run to the 15th of the month (mid-month batch).
  const d = new Date(Date.UTC(year, monthIndex0, 15));
  return d.toISOString();
}

function buildHistory() {
  const batches = [];
  PRODUCTS.forEach((preset, productIndex) => {
    const rand = mulberry32(1337 + productIndex * 97);
    for (let m = 0; m < MONTHS; m += 1) {
      const seasonal = 1 + 0.06 * Math.sin((2 * Math.PI * m) / 12); // gentle seasonality
      const inputInflation = 1 + 0.012 * m; // ~1.2%/month input cost drift
      const volumeTrend = 1 + 0.015 * m; // demand/volume growth

      const ingredients = preset.ingredients.map((ing) => ({
        ...ing,
        unitPrice: Number((ing.unitPrice * inputInflation * jitter(rand, 4)).toFixed(2)),
        quantity: Number((ing.quantity * jitter(rand, 3)).toFixed(2))
      }));

      const grossQuantity = Math.round(preset.batchQuantity * volumeTrend);

      const batchData = {
        ...preset,
        ingredients,
        batchQuantity: grossQuantity,
        wastagePercentage: Number(
          Math.max(0, preset.wastagePercentage * jitter(rand, 12) + (rand() < 0.15 ? 2.5 : 0)).toFixed(2)
        ),
        sellingPricePerUnit: Number(
          (preset.sellingPricePerUnit * (1 + 0.008 * m) * jitter(rand, 1.5)).toFixed(2)
        ),
        packagingCost: Number((preset.packagingCost * inputInflation * jitter(rand, 3)).toFixed(2)),
        labourCost: Number((preset.labourCost * (1 + 0.01 * m) * jitter(rand, 5)).toFixed(2)),
        energyCost: Number((preset.energyCost * seasonal * inputInflation * jitter(rand, 6)).toFixed(2)),
        waterUtilitiesCost: Number((preset.waterUtilitiesCost * jitter(rand, 8)).toFixed(2)),
        transportLogisticsCost: Number((preset.transportLogisticsCost * (1 + 0.01 * m) * jitter(rand, 5)).toFixed(2)),
        overheadCost: Number((preset.overheadCost * jitter(rand, 4)).toFixed(2))
      };

      const economics = calculateBatchEconomics(batchData);
      const monthIndex0 = (START.month - 1 + m) % 12;
      const year = START.year + Math.floor((START.month - 1 + m) / 12);

      batches.push({
        id: `sample_${productIndex + 1}_${String(m + 1).padStart(2, '0')}`,
        productName: preset.productName,
        productCategory: preset.productCategory,
        unitOfMeasure: preset.unitOfMeasure,
        createdAt: monthIso(year, monthIndex0),
        economics
      });
    }
  });
  return batches;
}

/** Forecast-engine input shape: date, product, cost_per_unit, raw_material_cost, production_quantity. */
function toCostSeriesCsv(rows) {
  const header = 'date,product,cost_per_unit,raw_material_cost,production_quantity';
  const body = rows.map((r) =>
    [
      (r.createdAt || '').slice(0, 10),
      /[",\n]/.test(r.productName) ? `"${r.productName.replace(/"/g, '""')}"` : r.productName,
      r.costPerUnit,
      r.rawMaterialCost,
      r.sellableQuantity
    ].join(',')
  );
  return [header, ...body].join('\n');
}

async function main() {
  const batches = buildHistory();
  const rows = buildDataset(batches);

  await mkdir(DATA_DIR, { recursive: true });

  const datasetCsv = toCsv(rows, ANALYSIS_COLUMNS);
  const seriesCsv = toCostSeriesCsv(rows);

  const datasetPath = join(DATA_DIR, 'sample_production_dataset.csv');
  const seriesPath = join(DATA_DIR, 'sample_cost_series.csv');

  await writeFile(datasetPath, datasetCsv + '\r\n', 'utf8');
  await writeFile(seriesPath, seriesCsv + '\n', 'utf8');

  console.log('Sample data generated (SYNTHETIC demo data — not real business data).');
  console.log(`  batches:  ${batches.length}`);
  console.log(`  columns:  ${ANALYSIS_COLUMNS.length}`);
  console.log(`  dataset:  analysis/data/sample_production_dataset.csv`);
  console.log(`  series:   analysis/data/sample_cost_series.csv`);
}

main().catch((err) => {
  console.error('Failed to generate sample data:', err);
  process.exit(1);
});
