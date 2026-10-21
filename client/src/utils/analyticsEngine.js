/**
 * Business Analytics Engine (pure, framework-free)
 * ================================================
 * Derives an analysis-ready dataset and portfolio-level business metrics from
 * stored production batches. Every function is deterministic and side-effect
 * free so it can be unit-tested from Node and reused by the UI.
 *
 * Data contract: each input batch is `{ ...metadata, economics }` where
 * `economics` is the object returned by `calculateBatchEconomics` (see
 * `client/src/utils/calculator.js`). Missing/absent fields degrade to 0/null
 * rather than throwing.
 *
 * No user identity, token, or secret is read or emitted by this module.
 */

/** Cost taxonomy — labels/colours align with the Dashboard breakdown. */
export const COST_CATEGORIES = [
  { key: 'rawMaterialCost', label: 'Raw Materials', color: '#10b981' },
  { key: 'packagingCost', label: 'Packaging', color: '#06b6d4' },
  { key: 'labourCost', label: 'Labour', color: '#f59e0b' },
  { key: 'energyWaterCost', label: 'Energy & Water', color: '#8b5cf6' },
  { key: 'transportLogisticsCost', label: 'Logistics', color: '#3b82f6' },
  { key: 'overheadCost', label: 'Overheads', color: '#f43f5e' },
  { key: 'wastageCost', label: 'Wastage Loss', color: '#ec4899' }
];

/** Ordered, documented analysis-ready column set. Headers stay ASCII so the
 * file loads cleanly in pandas/numpy with UTF-8 decoding. */
export const ANALYSIS_COLUMNS = [
  { key: 'batchId', label: 'batch_id' },
  { key: 'productName', label: 'product_name' },
  { key: 'productCategory', label: 'product_category' },
  { key: 'unitOfMeasure', label: 'unit_of_measure' },
  { key: 'batchQuantity', label: 'batch_quantity' },
  { key: 'sellableQuantity', label: 'sellable_quantity' },
  { key: 'wastageQuantity', label: 'wastage_quantity' },
  { key: 'wastagePercentage', label: 'wastage_percentage' },
  { key: 'rawMaterialCost', label: 'raw_material_cost' },
  { key: 'packagingCost', label: 'packaging_cost' },
  { key: 'labourCost', label: 'labour_cost' },
  { key: 'energyCost', label: 'energy_cost' },
  { key: 'waterUtilitiesCost', label: 'water_utilities_cost' },
  { key: 'transportLogisticsCost', label: 'transport_logistics_cost' },
  { key: 'overheadCost', label: 'overhead_cost' },
  { key: 'wastageCost', label: 'wastage_cost' },
  { key: 'totalVariableCost', label: 'total_variable_cost' },
  { key: 'totalProductionCost', label: 'total_production_cost' },
  { key: 'costPerUnit', label: 'cost_per_unit' },
  { key: 'sellingPricePerUnit', label: 'selling_price_per_unit' },
  { key: 'totalRevenue', label: 'total_revenue' },
  { key: 'grossProfit', label: 'gross_profit' },
  { key: 'profitMarginPercentage', label: 'profit_margin_percentage' },
  { key: 'roiPercentage', label: 'roi_percentage' },
  { key: 'contributionMarginPerUnit', label: 'contribution_margin_per_unit' },
  { key: 'breakEvenQuantity', label: 'break_even_quantity' },
  { key: 'breakEvenRevenue', label: 'break_even_revenue' },
  { key: 'ingredientCount', label: 'ingredient_count' },
  { key: 'topIngredientName', label: 'top_ingredient_name' },
  { key: 'topIngredientCost', label: 'top_ingredient_cost' },
  { key: 'topIngredientSharePct', label: 'top_ingredient_share_pct' },
  { key: 'createdAt', label: 'created_at' }
];

/** Coerce to a finite number, defaulting to 0. */
export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Coerce to a finite number, but preserve "unknown" as `null` instead of
 * collapsing it to 0. Null/undefined/empty string and non-finite values are
 * unavailable; a real 0 stays 0.
 */
export function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Round to 2 decimals with the same convention used across the app. */
export function round2(val) {
  return Math.round((toNumber(val) + Number.EPSILON) * 100) / 100;
}

/** Division that is safe against zero / absent / non-finite denominators. */
export function safeDiv(numerator, denominator) {
  const d = Number(denominator);
  if (!Number.isFinite(d) || d === 0) return 0;
  const n = Number(numerator);
  if (!Number.isFinite(n)) return 0;
  return n / d;
}

function energyWater(economics) {
  return toNumber(economics.energyCost) + toNumber(economics.waterUtilitiesCost);
}

/**
 * Flatten one batch into a single analysis-ready record.
 * @param {object} batch
 * @returns {object} flat row (keys match ANALYSIS_COLUMNS)
 */
export function buildAnalysisRow(batch) {
  const b = batch || {};
  const eco = b.economics || {};
  const ingredients = Array.isArray(eco.ingredients) ? eco.ingredients : [];

  let topIngredientName = '';
  let topIngredientCost = 0;
  for (const ing of ingredients) {
    const cost = toNumber(ing && ing.totalCost);
    if (cost > topIngredientCost) {
      topIngredientCost = cost;
      topIngredientName = (ing && ing.name) || '';
    }
  }

  const rawMaterialCost = toNumber(eco.rawMaterialCost);
  const batchQuantity = toNumber(eco.batchQuantity);
  const sellableQuantity = toNumber(eco.sellableQuantity);
  // Wastage stays "unknown" (null) when unavailable, and is only derived when
  // both batch and sellable quantities are themselves known.
  const knownWastageQuantity = optionalNumber(eco.wastageQuantity);
  const knownBatchQuantity = optionalNumber(eco.batchQuantity);
  const knownSellableQuantity = optionalNumber(eco.sellableQuantity);
  const wastageQuantity =
    knownWastageQuantity !== null
      ? knownWastageQuantity
      : knownBatchQuantity !== null && knownSellableQuantity !== null
        ? Math.max(0, knownBatchQuantity - knownSellableQuantity)
        : null;

  return {
    batchId: b.id || '',
    productName: b.productName || 'Unnamed Product',
    productCategory: b.productCategory || 'Uncategorised',
    unitOfMeasure: eco.unitOfMeasure || b.unitOfMeasure || 'kg',
    batchQuantity,
    sellableQuantity,
    wastageQuantity,
    wastagePercentage: optionalNumber(eco.wastagePercentage),
    rawMaterialCost,
    packagingCost: toNumber(eco.packagingCost),
    labourCost: toNumber(eco.labourCost),
    energyCost: toNumber(eco.energyCost),
    waterUtilitiesCost: toNumber(eco.waterUtilitiesCost),
    transportLogisticsCost: toNumber(eco.transportLogisticsCost),
    overheadCost: toNumber(eco.overheadCost),
    wastageCost: optionalNumber(eco.wastageCost),
    totalVariableCost: toNumber(eco.totalVariableCost),
    totalProductionCost: toNumber(eco.totalProductionCost),
    costPerUnit: toNumber(eco.costPerUnit),
    sellingPricePerUnit: toNumber(eco.sellingPricePerUnit),
    totalRevenue: toNumber(eco.totalRevenue),
    grossProfit: toNumber(eco.grossProfit),
    profitMarginPercentage: toNumber(eco.profitMarginPercentage),
    roiPercentage: toNumber(eco.roiPercentage),
    contributionMarginPerUnit: toNumber(eco.contributionMarginPerUnit),
    breakEvenQuantity: optionalNumber(eco.breakEvenQuantity),
    breakEvenRevenue: optionalNumber(eco.breakEvenRevenue),
    ingredientCount: ingredients.length,
    topIngredientName,
    topIngredientCost: round2(topIngredientCost),
    topIngredientSharePct: round2(safeDiv(topIngredientCost, rawMaterialCost) * 100),
    createdAt: b.createdAt || ''
  };
}

/** Build the analysis-ready dataset from an array of batches. */
export function buildDataset(batches) {
  const list = Array.isArray(batches) ? batches : [];
  return list.map(buildAnalysisRow);
}

/**
 * Portfolio-level KPIs aggregated across all rows.
 * All ratios use safeDiv so an empty dataset yields a fully-zeroed object.
 */
export function computePortfolioKpis(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const sum = (key) => list.reduce((acc, r) => acc + toNumber(r[key]), 0);

  const totalProductionCost = round2(sum('totalProductionCost'));
  const totalRevenue = round2(sum('totalRevenue'));
  const totalProfit = round2(sum('grossProfit'));
  const totalSellable = sum('sellableQuantity');
  const totalQuantity = sum('batchQuantity');

  // Wastage value is only known where at least one row reports it; unknown rows
  // are excluded from both the numerator and the denominator rather than being
  // silently treated as zero-cost.
  const wastageRows = list.filter((r) => optionalNumber(r.wastageCost) !== null);
  const knownWastageCost = wastageRows.reduce((a, r) => a + toNumber(r.wastageCost), 0);
  const knownWastageBase = wastageRows.reduce((a, r) => a + toNumber(r.totalProductionCost), 0);
  const totalWastageCost =
    list.length === 0 ? 0 : wastageRows.length > 0 ? round2(knownWastageCost) : null;

  // Quantity-based averages are only meaningful when every row shares one known
  // unit of measure; otherwise they are unavailable rather than misleading.
  const unitInfo = list.reduce(
    (acc, r) => {
      const u = String(r.unitOfMeasure == null ? '' : r.unitOfMeasure).trim();
      if (u === '') acc.unknown = true;
      else acc.units.add(u);
      return acc;
    },
    { units: new Set(), unknown: false }
  );
  const unitsComparable = list.length > 0 && unitInfo.units.size === 1 && !unitInfo.unknown;

  const avgUnitCost =
    list.length === 0 ? 0 : unitsComparable ? round2(safeDiv(totalProductionCost, totalSellable)) : null;
  const avgSellingPrice =
    list.length === 0 ? 0 : unitsComparable ? round2(safeDiv(totalRevenue, totalSellable)) : null;
  const portfolioMarginPct = round2(safeDiv(totalProfit, totalRevenue) * 100);
  const wastageSharePct =
    list.length === 0
      ? 0
      : wastageRows.length > 0
        ? round2(safeDiv(knownWastageCost, knownWastageBase) * 100)
        : null;
  const totalQuantityAgg =
    list.length === 0 ? 0 : unitsComparable ? round2(totalQuantity) : null;
  const totalSellableQuantity =
    list.length === 0 ? 0 : unitsComparable ? round2(totalSellable) : null;
  const achievedWastagePct =
    list.length === 0
      ? 0
      : unitsComparable && totalQuantity > 0
        ? round2(safeDiv(totalQuantity - totalSellable, totalQuantity) * 100)
        : null;

  const lossMaking = list.filter((r) => toNumber(r.grossProfit) < 0);
  const healthy = list.filter((r) => toNumber(r.profitMarginPercentage) >= 20);
  const products = new Set(list.map((r) => r.productName));
  const categories = new Set(list.map((r) => r.productCategory));

  return {
    batchCount: list.length,
    productCount: products.size,
    categoryCount: categories.size,
    totalQuantity: totalQuantityAgg,
    totalSellableQuantity,
    totalProductionCost,
    totalRevenue,
    totalProfit,
    totalWastageCost,
    avgUnitCost,
    avgSellingPrice,
    portfolioMarginPct,
    wastageSharePct,
    achievedWastagePct,
    lossMakingCount: lossMaking.length,
    healthyMarginCount: healthy.length,
    lossMakingProducts: lossMaking.map((r) => r.productName)
  };
}

/**
 * Aggregate the 7-category cost structure across all rows.
 * Returns categories in fixed taxonomy order with absolute cost and share.
 */
export function computeCostStructure(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const totalCost = round2(
    list.reduce((acc, r) => acc + toNumber(r.totalProductionCost), 0)
  );

  const categories = COST_CATEGORIES.map((cat) => {
    const cost = round2(
      list.reduce((acc, r) => {
        if (cat.key === 'energyWaterCost') return acc + energyWater(r);
        return acc + toNumber(r[cat.key]);
      }, 0)
    );
    return {
      key: cat.key,
      label: cat.label,
      color: cat.color,
      cost,
      sharePct: round2(safeDiv(cost, totalCost) * 100)
    };
  });

  return { totalCost, categories };
}

/**
 * Rank products by a numeric metric (default: profit margin %).
 * Returns a new array sorted descending with a 1-based `rank`.
 */
export function rankProducts(rows, metricKey = 'profitMarginPercentage') {
  const list = Array.isArray(rows) ? rows : [];
  return [...list]
    .sort((a, b) => toNumber(b[metricKey]) - toNumber(a[metricKey]))
    .map((r, idx) => ({
      rank: idx + 1,
      batchId: r.batchId,
      productName: r.productName,
      productCategory: r.productCategory,
      marginPct: toNumber(r.profitMarginPercentage),
      unitCost: toNumber(r.costPerUnit),
      sellingPrice: toNumber(r.sellingPricePerUnit),
      profit: toNumber(r.grossProfit),
      revenue: toNumber(r.totalRevenue),
      quantity: toNumber(r.sellableQuantity)
    }));
}

/** Distribution of margins into named bands (used for the histogram). */
export function computeMarginBands(rows) {
  const bands = [
    { key: 'loss', label: 'Loss (<0%)', min: -Infinity, max: 0, color: '#f43f5e', count: 0 },
    { key: 'thin', label: 'Thin (0-10%)', min: 0, max: 10, color: '#f59e0b', count: 0 },
    { key: 'moderate', label: 'Moderate (10-20%)', min: 10, max: 20, color: '#3b82f6', count: 0 },
    { key: 'healthy', label: 'Healthy (20-35%)', min: 20, max: 35, color: '#10b981', count: 0 },
    { key: 'strong', label: 'Strong (35%+)', min: 35, max: Infinity, color: '#06b6d4', count: 0 }
  ];
  const list = Array.isArray(rows) ? rows : [];
  for (const r of list) {
    const m = toNumber(r.profitMarginPercentage);
    const band =
      m < 0 ? bands[0] :
      m < 10 ? bands[1] :
      m < 20 ? bands[2] :
      m < 35 ? bands[3] : bands[4];
    band.count += 1;
  }
  return bands;
}

/**
 * Wastage analysis: totals plus per-product offenders sorted by wasted value.
 */
export function computeWastageAnalysis(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const offenders = [...list]
    .map((r) => ({
      batchId: r.batchId,
      productName: r.productName,
      unitOfMeasure: r.unitOfMeasure,
      wastagePercentage: optionalNumber(r.wastagePercentage),
      wastageQuantity: optionalNumber(r.wastageQuantity),
      wastageCost: optionalNumber(r.wastageCost)
    }))
    .sort((a, b) => {
      if (a.wastageCost === null && b.wastageCost === null) return 0;
      if (a.wastageCost === null) return 1;
      if (b.wastageCost === null) return -1;
      return b.wastageCost - a.wastageCost;
    });

  const knownCost = offenders.filter((o) => o.wastageCost !== null);
  const knownQty = offenders.filter((o) => o.wastageQuantity !== null);

  const qtyUnitInfo = knownQty.reduce(
    (acc, o) => {
      const u = String(o.unitOfMeasure == null ? '' : o.unitOfMeasure).trim();
      if (u === '') acc.unknown = true;
      else acc.units.add(u);
      return acc;
    },
    { units: new Set(), unknown: false }
  );
  const qtyComparable = knownQty.length > 0 && qtyUnitInfo.units.size === 1 && !qtyUnitInfo.unknown;

  return {
    totalWastageCost:
      list.length === 0
        ? 0
        : knownCost.length > 0
          ? round2(knownCost.reduce((a, o) => a + o.wastageCost, 0))
          : null,
    totalWastageQuantity:
      list.length === 0
        ? 0
        : knownQty.length > 0
          ? qtyComparable
            ? round2(knownQty.reduce((a, o) => a + o.wastageQuantity, 0))
            : null
          : null,
    offenders
  };
}

/**
 * Deterministic, evidence-based insight rules over the aggregate.
 * Each insight records the numeric evidence that triggered it.
 * @returns {Array<{id,severity,category,title,detail,metricLabel,metricValue}>}
 */
export function generateInsights(rows, kpis, structure) {
  const list = Array.isArray(rows) ? rows : [];
  const k = kpis || computePortfolioKpis(list);
  const s = structure || computeCostStructure(list);
  const insights = [];

  if (list.length === 0) {
    insights.push({
      id: 'no-data',
      severity: 'info',
      category: 'Data',
      title: 'No batches available for analysis',
      detail: 'Create or import at least one production batch to populate portfolio analytics.',
      metricLabel: 'Batches',
      metricValue: 0
    });
    return insights;
  }

  // 1. Loss-making products
  if (k.lossMakingCount > 0) {
    insights.push({
      id: 'loss-making',
      severity: 'critical',
      category: 'Profitability',
      title: `${k.lossMakingCount} product(s) priced below cost`,
      detail: `Production cost exceeds revenue for: ${k.lossMakingProducts.join(', ')}. Review pricing or input costs.`,
      metricLabel: 'Loss-making batches',
      metricValue: k.lossMakingCount
    });
  }

  // 2. Portfolio margin health
  if (k.portfolioMarginPct < 10) {
    insights.push({
      id: 'margin-thin',
      severity: 'warning',
      category: 'Profitability',
      title: 'Portfolio margin is thin',
      detail: 'Blended profit margin is below 10%. Re-examine the largest cost drivers below.',
      metricLabel: 'Portfolio margin',
      metricValue: round2(k.portfolioMarginPct)
    });
  } else if (k.portfolioMarginPct >= 20) {
    insights.push({
      id: 'margin-healthy',
      severity: 'positive',
      category: 'Profitability',
      title: 'Portfolio margin is healthy',
      detail: 'Blended profit margin is at or above 20%, indicating sound pricing against current costs.',
      metricLabel: 'Portfolio margin',
      metricValue: round2(k.portfolioMarginPct)
    });
  }

  // 3. Cost concentration
  const top = [...s.categories].sort((a, b) => b.cost - a.cost)[0];
  if (top && top.sharePct >= 40) {
    insights.push({
      id: 'cost-concentration',
      severity: 'info',
      category: 'Cost Structure',
      title: `Cost concentrated in ${top.label}`,
      detail: `${top.label} accounts for ${top.sharePct}% of total production cost. Procurement and yield here dominate outcomes.`,
      metricLabel: `${top.label} share`,
      metricValue: round2(top.sharePct)
    });
  }

  // 4. High wastage
  const worstWaste = [...list].sort(
    (a, b) => toNumber(b.wastagePercentage) - toNumber(a.wastagePercentage)
  )[0];
  if (worstWaste && toNumber(worstWaste.wastagePercentage) > 5) {
    insights.push({
      id: 'high-wastage',
      severity: 'warning',
      category: 'Wastage',
      title: 'Wastage above 5% on at least one product',
      detail: `${worstWaste.productName} loses ${toNumber(worstWaste.wastagePercentage)}% to wastage (${optionalNumber(worstWaste.wastageCost) === null ? 'cost unavailable' : worstWaste.wastageCost} in cost). Reducing wastage is a direct margin lever.`,
      metricLabel: 'Highest wastage %',
      metricValue: round2(toNumber(worstWaste.wastagePercentage))
    });
  }

  // 5. Break-even risk
  const noBreakEven = list.filter((r) => {
    const be = optionalNumber(r.breakEvenQuantity);
    return be === null || be > toNumber(r.sellableQuantity);
  });
  if (noBreakEven.length > 0) {
    insights.push({
      id: 'break-even',
      severity: 'warning',
      category: 'Break-even',
      title: `${noBreakEven.length} batch(es) cannot reach break-even`,
      detail: `Sellable volume is below the break-even quantity for: ${noBreakEven.map((r) => r.productName).join(', ')}.`,
      metricLabel: 'At-risk batches',
      metricValue: noBreakEven.length
    });
  }

  // 6. Revenue concentration
  if (list.length >= 3 && k.totalRevenue > 0) {
    const topRev = [...list].sort((a, b) => toNumber(b.totalRevenue) - toNumber(a.totalRevenue))[0];
    const share = round2(safeDiv(toNumber(topRev.totalRevenue), k.totalRevenue) * 100);
    if (share >= 60) {
      insights.push({
        id: 'revenue-concentration',
        severity: 'info',
        category: 'Portfolio',
        title: 'Revenue concentrated in one product',
        detail: `${topRev.productName} contributes ${share}% of portfolio revenue — a diversification risk.`,
        metricLabel: 'Top product revenue share',
        metricValue: share
      });
    }
  }

  // 7. Best performer highlight
  const best = [...list].sort((a, b) => toNumber(b.grossProfit) - toNumber(a.grossProfit))[0];
  if (best && toNumber(best.grossProfit) > 0) {
    insights.push({
      id: 'top-contributor',
      severity: 'positive',
      category: 'Portfolio',
      title: `${best.productName} is the top profit contributor`,
      detail: `It generates the largest absolute gross profit in the portfolio and can anchor capacity allocation.`,
      metricLabel: 'Gross profit',
      metricValue: round2(toNumber(best.grossProfit))
    });
  }

  return insights;
}

/** Escape one CSV field per RFC 4180 (quotes doubled, wrapped when needed). */
export function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialise rows to CSV using the ordered `ANALYSIS_COLUMNS` header.
 * @param {Array<object>} rows
 * @param {Array<{key,label}>} columns
 */
export function toCsv(rows, columns = ANALYSIS_COLUMNS) {
  const list = Array.isArray(rows) ? rows : [];
  const header = columns.map((c) => escapeCsvField(c.label)).join(',');
  const body = list.map((row) =>
    columns.map((c) => escapeCsvField(row[c.key])).join(',')
  );
  return [header, ...body].join('\r\n');
}

/** One-shot convenience used by the UI and the sample-data generator. */
export function buildAnalysisBundle(batches) {
  const rows = buildDataset(batches);
  const kpis = computePortfolioKpis(rows);
  const structure = computeCostStructure(rows);
  return {
    rows,
    kpis,
    structure,
    ranking: rankProducts(rows),
    marginBands: computeMarginBands(rows),
    wastage: computeWastageAnalysis(rows),
    insights: generateInsights(rows, kpis, structure)
  };
}
