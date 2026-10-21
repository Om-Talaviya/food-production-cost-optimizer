/**
 * Statistical Cost Forecasting Engine.
 * Uses Double Exponential Smoothing (Holt's Linear Trend) & Linear Regression
 * to forecast future production costs, unit prices, and margins.
 */

const { round2 } = require('./calculator');

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function generateCostForecast(historicalRecords = [], forecastMonths = 6) {
  // Defensive check for empty or small dataset
  if (!Array.isArray(historicalRecords) || historicalRecords.length === 0) {
    return getSampleForecastData();
  }

  // Sort chronological by date
  const sorted = [...historicalRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
  const validRecords = sorted.filter(r => optionalNumber(r.costPerUnit) !== null);

  if (validRecords.length === 0) {
    return getSampleForecastData();
  }

  const n = validRecords.length;
  const costs = validRecords.map(r => Number(r.costPerUnit));

  // Perform Linear Regression for Trend over valid records
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += costs[i];
    sumXY += i * costs[i];
    sumXX += i * i;
  }

  const denom = n * sumXX - sumX * sumX;
  const slope = n > 1 && denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = n > 1 ? (sumY - slope * sumX) / n : (costs[0] || 100);

  // Holt's Double Exponential Smoothing (alpha=0.3, beta=0.1)
  const alpha = 0.3;
  const beta = 0.1;

  let level = costs[0] || 100;
  let trend = n > 1 ? costs[1] - costs[0] : 0;

  for (let i = 1; i < n; i++) {
    const value = costs[i];
    const prevLevel = level;
    level = alpha * value + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Calculate Standard Error for Confidence Intervals
  let sumSquaredErr = 0;
  for (let i = 0; i < n; i++) {
    const fitted = intercept + slope * i;
    sumSquaredErr += Math.pow(costs[i] - fitted, 2);
  }
  const stdErr = Math.sqrt(sumSquaredErr / Math.max(1, n - 2));

  // Project future periods starting after the last chronological historical date
  const lastHistoricalRecord = sorted[sorted.length - 1];
  const lastDate = new Date(lastHistoricalRecord.date || Date.now());
  const forecastPoints = [];

  for (let h = 1; h <= forecastMonths; h++) {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + h);

    const projectedCostHolt = level + h * trend;
    const projectedCostLinear = intercept + slope * (n - 1 + h);
    const projectedCost = Math.max(0, (projectedCostHolt + projectedCostLinear) / 2);

    const marginOfError = 1.96 * stdErr * Math.sqrt(1 + (1 / n) + Math.pow(h, 2) / 12);
    const lowerBound = Math.max(0, projectedCost - marginOfError);
    const upperBound = projectedCost + marginOfError;

    forecastPoints.push({
      date: futureDate.toISOString().slice(0, 7), // YYYY-MM
      monthLabel: futureDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
      projectedCostPerUnit: round2(projectedCost),
      lowerConfidenceBound: round2(lowerBound),
      upperConfidenceBound: round2(upperBound),
      isForecast: true
    });
  }

  const historicalPoints = sorted.map(r => ({
    date: r.date.slice(0, 7),
    monthLabel: new Date(r.date).toLocaleString('default', { month: 'short', year: 'numeric' }),
    actualCostPerUnit: optionalNumber(r.costPerUnit) !== null ? round2(r.costPerUnit) : null,
    actualTotalCost: optionalNumber(r.totalProductionCost) !== null ? round2(r.totalProductionCost) : null,
    productionQuantity: optionalNumber(r.productionQuantity) !== null ? round2(r.productionQuantity) : null,
    rawMaterialCost: optionalNumber(r.rawMaterialCost) !== null ? round2(r.rawMaterialCost) : null,
    sellingPrice: optionalNumber(r.sellingPrice) !== null ? round2(r.sellingPrice) : null,
    unitOfMeasure: r.unitOfMeasure,
    isForecast: false
  }));

  const avgCost = costs.reduce((a, b) => a + b, 0) / n;
  const avgInflationRatePct = round2((slope / Math.max(1, avgCost)) * 100 * 12); // Annualized

  const units = new Set(sorted.map(r => String(r.unitOfMeasure || '').trim()).filter(Boolean));
  const hasUnknownUnit = sorted.some(r => !String(r.unitOfMeasure || '').trim());
  const unitsComparable = sorted.length > 0 && units.size === 1 && !hasUnknownUnit;
  const unitOfMeasure = unitsComparable ? [...units][0] : null;
  const hasMixedUnits = units.size > 1 || (units.size > 0 && hasUnknownUnit);

  const products = new Set(sorted.map(r => String(r.productName || '').trim()).filter(Boolean));
  const productName = products.size === 1 ? [...products][0] : 'Production Batch Portfolio';

  return {
    isSampleData: false,
    productName,
    unitOfMeasure,
    hasMixedUnits,
    historicalPoints,
    forecastPoints,
    analytics: {
      trendDirection: slope > 0.05 ? 'INCREASING' : (slope < -0.05 ? 'DECREASING' : 'STABLE'),
      annualizedCostInflationPct: avgInflationRatePct,
      forecastModel: "Hybrid Holt Exponential Smoothing & Linear Trend Regression",
      confidenceIntervalPct: 95,
      standardError: round2(stdErr)
    }
  };
}

const SAMPLE_PRODUCT_NAME = 'Premium Mango Jam';
const SAMPLE_PRODUCT_CATEGORY = 'Preserves & Jams';

// Deterministic small month-to-month variation so the demo dataset is believable and reproducible.
const SAMPLE_MONTHLY_NOISE = [0.42, -0.35, 0.18, -0.52, 0.28, -0.15, 0.47, -0.38, 0.24, -0.12, 0.36, -0.29];

function getSampleForecastData() {
  // Believable monthly historical data for ONE product (Premium Mango Jam),
  // covering 12 consecutive months. Not real production records.
  const baseDate = new Date('2025-09-01');
  const historicalPoints = [];
  const baseCost = 86.0;

  for (let i = 0; i < 12; i++) {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + i);
    const monthStr = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });

    // Steady raw-material inflation plus a seasonal cost dip during the peak
    // mango harvesting season (roughly Feb-May), which makes pulp cheaper.
    const seasonal = 3.5 * Math.sin(2 * Math.PI * (i + 2) / 12);
    const trend = i * 1.2;
    const noise = SAMPLE_MONTHLY_NOISE[i] || 0;
    const costPerUnit = baseCost + trend + seasonal + noise;
    const batchQty = 1000 + (i % 3) * 50;
    const sellingPrice = 160;

    historicalPoints.push({
      date: monthStr,
      monthLabel,
      productName: SAMPLE_PRODUCT_NAME,
      productCategory: SAMPLE_PRODUCT_CATEGORY,
      actualCostPerUnit: round2(costPerUnit),
      actualTotalCost: round2(costPerUnit * batchQty),
      productionQuantity: batchQty,
      rawMaterialCost: round2(costPerUnit * batchQty * 0.55),
      sellingPrice,
      isForecast: false
    });
  }

  const lastDate = new Date('2026-08-01');
  const forecastPoints = [];
  const lastCost = historicalPoints[historicalPoints.length - 1].actualCostPerUnit;

  for (let h = 1; h <= 6; h++) {
    const d = new Date(lastDate);
    d.setMonth(d.getMonth() + h);
    const monthStr = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });

    const projected = lastCost + h * 1.35;
    const stdErr = 3.2;
    const margin = 1.96 * stdErr * Math.sqrt(1 + (h / 6));

    forecastPoints.push({
      date: monthStr,
      monthLabel,
      projectedCostPerUnit: round2(projected),
      lowerConfidenceBound: round2(projected - margin),
      upperConfidenceBound: round2(projected + margin),
      isForecast: true
    });
  }

  return {
    isSampleData: true,
    productName: SAMPLE_PRODUCT_NAME,
    productCategory: SAMPLE_PRODUCT_CATEGORY,
    unitOfMeasure: 'kg',
    hasMixedUnits: false,
    dataSource: 'Sample Demo Dataset',
    description: 'Illustrative monthly production history for one product (Premium Mango Jam). Sample data shown for demonstration only — not real production records.',
    historicalPoints,
    forecastPoints,
    analytics: {
      trendDirection: 'INCREASING',
      annualizedCostInflationPct: 8.4,
      forecastModel: "Hybrid Holt Exponential Smoothing & Linear Trend Regression (Sample Demo Dataset)",
      confidenceIntervalPct: 95,
      standardError: 3.2
    }
  };
}

module.exports = {
  generateCostForecast,
  getSampleForecastData
};
