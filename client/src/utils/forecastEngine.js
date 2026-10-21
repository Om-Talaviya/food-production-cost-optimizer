import { round2 } from './calculator';

const SAMPLE_PRODUCT_NAME = 'Premium Mango Jam';
const SAMPLE_PRODUCT_CATEGORY = 'Preserves & Jams';

// Deterministic small month-to-month variation so the demo dataset is believable and reproducible.
const SAMPLE_MONTHLY_NOISE = [0.42, -0.35, 0.18, -0.52, 0.28, -0.15, 0.47, -0.38, 0.24, -0.12, 0.36, -0.29];

export function getSampleForecastData() {
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
