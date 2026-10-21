/**
 * Pure Business Calculation Engine for Food Production Cost Optimizer.
 * All financial, batch yield, break-even, and cost contribution metrics are calculated here.
 */

function calculateBatchEconomics(batchData) {
  const batchQuantity = Math.max(0, Number(batchData.batchQuantity) || 0);
  const wastagePercentage = Math.min(99.9, Math.max(0, Number(batchData.wastagePercentage) || 0));
  const sellingPricePerUnit = Math.max(0, Number(batchData.sellingPricePerUnit) || 0);

  const rawMaterials = Array.isArray(batchData.ingredients) ? batchData.ingredients : [];
  
  // Calculate Raw Material Total & Itemized Breakdown
  let rawMaterialCost = 0;
  const ingredientsBreakdown = rawMaterials.map(ing => {
    const qty = Math.max(0, Number(ing.quantity) || 0);
    const price = Math.max(0, Number(ing.unitPrice) || 0);
    const total = qty * price;
    rawMaterialCost += total;
    return {
      name: ing.name || 'Unnamed Ingredient',
      quantity: qty,
      unit: ing.unit || 'kg',
      unitPrice: price,
      totalCost: round2(total)
    };
  });

  const packagingCost = Math.max(0, Number(batchData.packagingCost) || 0);
  const labourCost = Math.max(0, Number(batchData.labourCost) || 0);
  const energyCost = Math.max(0, Number(batchData.energyCost) || 0);
  const waterUtilitiesCost = Math.max(0, Number(batchData.waterUtilitiesCost) || 0);
  const transportLogisticsCost = Math.max(0, Number(batchData.transportLogisticsCost) || 0);
  const overheadCost = Math.max(0, Number(batchData.overheadCost) || 0);

  // Direct production cost before wastage multiplier
  const directProductionCost = rawMaterialCost + packagingCost + labourCost + energyCost + waterUtilitiesCost + transportLogisticsCost;
  
  // Wastage cost calculation based on wastage percentage on direct inputs
  const wastageCost = directProductionCost * (wastagePercentage / 100);
  
  // Total variable & total production cost
  const totalVariableCost = directProductionCost + wastageCost;
  const totalProductionCost = totalVariableCost + overheadCost;

  // Net sellable yield calculation
  const wastageQuantity = batchQuantity * (wastagePercentage / 100);
  const sellableQuantity = Math.max(0, batchQuantity - wastageQuantity);

  // Unit costs
  const costPerUnit = sellableQuantity > 0 ? totalProductionCost / sellableQuantity : 0;
  const variableCostPerUnit = sellableQuantity > 0 ? totalVariableCost / sellableQuantity : 0;

  // Revenue & Profitability
  const totalRevenue = sellableQuantity * sellingPricePerUnit;
  const grossProfit = totalRevenue - totalProductionCost;
  const profitMarginPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const roiPercentage = totalProductionCost > 0 ? (grossProfit / totalProductionCost) * 100 : 0;

  // Contribution Margin & Break-even analysis
  const contributionMarginPerUnit = sellingPricePerUnit - variableCostPerUnit;
  // Break-even volume is only meaningful when each unit contributes a positive
  // margin; otherwise it is unavailable (null) rather than a fabricated quantity,
  // unless there are no fixed costs to recover, in which case it is zero.
  const breakEvenQuantity =
    contributionMarginPerUnit > 0
      ? Math.ceil(overheadCost / contributionMarginPerUnit)
      : overheadCost > 0
        ? null
        : 0;
  const breakEvenRevenue =
    breakEvenQuantity === null ? null : breakEvenQuantity * sellingPricePerUnit;
  const breakEvenSellingPrice = sellableQuantity > 0 ? totalProductionCost / sellableQuantity : 0;

  // Cost contribution percentages
  const safeTotal = totalProductionCost || 1;
  const costContributions = {
    rawMaterialPct: round2((rawMaterialCost / safeTotal) * 100),
    packagingPct: round2((packagingCost / safeTotal) * 100),
    labourPct: round2((labourCost / safeTotal) * 100),
    energyPct: round2(((energyCost + waterUtilitiesCost) / safeTotal) * 100),
    logisticsPct: round2((transportLogisticsCost / safeTotal) * 100),
    overheadPct: round2((overheadCost / safeTotal) * 100),
    wastagePct: round2((wastageCost / safeTotal) * 100)
  };

  return {
    batchQuantity: round2(batchQuantity),
    unitOfMeasure: batchData.unitOfMeasure || 'kg',
    ingredients: ingredientsBreakdown,
    rawMaterialCost: round2(rawMaterialCost),
    packagingCost: round2(packagingCost),
    labourCost: round2(labourCost),
    energyCost: round2(energyCost),
    waterUtilitiesCost: round2(waterUtilitiesCost),
    transportLogisticsCost: round2(transportLogisticsCost),
    overheadCost: round2(overheadCost),
    wastagePercentage: round2(wastagePercentage),
    wastageCost: round2(wastageCost),
    wastageQuantity: round2(wastageQuantity),
    sellableQuantity: round2(sellableQuantity),
    totalVariableCost: round2(totalVariableCost),
    totalProductionCost: round2(totalProductionCost),
    costPerBatch: round2(totalProductionCost),
    costPerUnit: round2(costPerUnit),
    sellingPricePerUnit: round2(sellingPricePerUnit),
    totalRevenue: round2(totalRevenue),
    grossProfit: round2(grossProfit),
    profitMarginPercentage: round2(profitMarginPercentage),
    roiPercentage: round2(roiPercentage),
    contributionMarginPerUnit: round2(contributionMarginPerUnit),
    breakEvenQuantity: breakEvenQuantity === null ? null : round2(breakEvenQuantity),
    breakEvenRevenue: breakEvenRevenue === null ? null : round2(breakEvenRevenue),
    breakEvenSellingPrice: round2(breakEvenSellingPrice),
    costContributions
  };
}

function calculateWhatIfScenario(baselineData, scenarioMods) {
  const baseResult = calculateBatchEconomics(baselineData);

  // Apply scenario modifications
  const priceMultiplier = 1 + (Number(scenarioMods.ingredientPriceChangePct) || 0) / 100;
  const modIngredients = (baselineData.ingredients || []).map(ing => ({
    ...ing,
    unitPrice: Math.max(0, (Number(ing.unitPrice) || 0) * priceMultiplier)
  }));

  const modBatchQuantity = Math.max(1, (Number(baselineData.batchQuantity) || 1) * (1 + (Number(scenarioMods.batchSizeScalePct) || 0) / 100));
  const modWastagePct = Math.max(0, Math.min(99.9, (Number(baselineData.wastagePercentage) || 0) + (Number(scenarioMods.wastageDeltaPct) || 0)));
  const modPackagingCost = Math.max(0, (Number(baselineData.packagingCost) || 0) * (1 + (Number(scenarioMods.packagingCostChangePct) || 0) / 100));
  const modLabourCost = Math.max(0, (Number(baselineData.labourCost) || 0) * (1 + (Number(scenarioMods.labourCostChangePct) || 0) / 100));
  const modEnergyCost = Math.max(0, (Number(baselineData.energyCost) || 0) * (1 + (Number(scenarioMods.energyCostChangePct) || 0) / 100));
  const modSellingPrice = Math.max(0, (Number(baselineData.sellingPricePerUnit) || 0) * (1 + (Number(scenarioMods.sellingPriceChangePct) || 0) / 100));

  const modData = {
    ...baselineData,
    batchQuantity: modBatchQuantity,
    ingredients: modIngredients,
    wastagePercentage: modWastagePct,
    packagingCost: modPackagingCost,
    labourCost: modLabourCost,
    energyCost: modEnergyCost,
    sellingPricePerUnit: modSellingPrice
  };

  const scenarioResult = calculateBatchEconomics(modData);

  const delta = {
    totalCostChange: round2(scenarioResult.totalProductionCost - baseResult.totalProductionCost),
    totalCostChangePct: baseResult.totalProductionCost > 0 ? round2(((scenarioResult.totalProductionCost - baseResult.totalProductionCost) / baseResult.totalProductionCost) * 100) : 0,
    costPerUnitChange: round2(scenarioResult.costPerUnit - baseResult.costPerUnit),
    costPerUnitChangePct: baseResult.costPerUnit > 0 ? round2(((scenarioResult.costPerUnit - baseResult.costPerUnit) / baseResult.costPerUnit) * 100) : 0,
    profitChange: round2(scenarioResult.grossProfit - baseResult.grossProfit),
    profitChangePct: baseResult.grossProfit !== 0 ? round2(((scenarioResult.grossProfit - baseResult.grossProfit) / Math.abs(baseResult.grossProfit)) * 100) : 0,
    marginChangePctPoints: round2(scenarioResult.profitMarginPercentage - baseResult.profitMarginPercentage)
  };

  return {
    baseline: baseResult,
    scenario: scenarioResult,
    delta
  };
}

function round2(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

module.exports = {
  calculateBatchEconomics,
  calculateWhatIfScenario,
  round2
};
