/**
 * AI Production Cost Advisor Engine.
 * Supports external LLM integration (Gemini / OpenAI) with deterministic offline fallback.
 */

const { round2 } = require('./calculator');

async function queryAIAdvisor(userQuestion, batchContext = {}) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  // Build structured prompt context
  const structuredPrompt = buildStructuredPrompt(userQuestion, batchContext);

  // If Gemini API Key is provided, attempt call
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      const response = await callGeminiAPI(geminiApiKey, structuredPrompt);
      if (response) {
        return {
          answer: response,
          mode: 'GEMINI_AI',
          status: 'SUCCESS'
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, defaulting to intelligent rule engine:', err.message);
    }
  }

  // If OpenAI API Key is provided, attempt call
  if (openAiApiKey && openAiApiKey !== 'your_openai_api_key_here') {
    try {
      const response = await callOpenAIAPI(openAiApiKey, structuredPrompt);
      if (response) {
        return {
          answer: response,
          mode: 'OPENAI_AI',
          status: 'SUCCESS'
        };
      }
    } catch (err) {
      console.warn('OpenAI API call failed, defaulting to intelligent rule engine:', err.message);
    }
  }

  // Graceful Fallback Mode (Deterministic Rule & Analytical Engine)
  const offlineAdvice = generateOfflineAIResponse(userQuestion, batchContext);
  return {
    answer: offlineAdvice,
    mode: 'DEMO_OFFLINE_AI',
    status: 'SUCCESS'
  };
}

function buildStructuredPrompt(question, batch) {
  return `You are a Senior Food Processing Operations & Economics Expert Advisor.
Analyze the following production batch data and answer the user's operational query concisely with actionable steps.

Product Name: ${batch.productName || 'Food Product'}
Batch Quantity: ${batch.batchQuantity || 1000} ${batch.unitOfMeasure || 'kg'}
Total Production Cost: ₹${batch.totalProductionCost || 0}
Cost Per Unit: ₹${batch.costPerUnit || 0}
Selling Price: ₹${batch.sellingPricePerUnit || 0}
Gross Profit Margin: ${batch.profitMarginPercentage || 0}%
Break-even Quantity: ${batch.breakEvenQuantity || 0} units

Cost Breakdown (%):
- Raw Materials: ${batch.costContributions?.rawMaterialPct || 0}%
- Packaging: ${batch.costContributions?.packagingPct || 0}%
- Labour: ${batch.costContributions?.labourPct || 0}%
- Energy & Utilities: ${batch.costContributions?.energyPct || 0}%
- Logistics: ${batch.costContributions?.logisticsPct || 0}%
- Overhead: ${batch.costContributions?.overheadPct || 0}%
- Wastage Loss: ${batch.costContributions?.wastagePct || 0}% (${batch.wastagePercentage || 0}% loss)

User Question: "${question}"

Provide a structured, professional recommendation covering:
1. Executive Summary & Root Cause Analysis
2. Primary Cost Driver Insights
3. Specific Actionable Steps to Reduce Cost / Improve Margin
4. Estimated Financial Impact`;
}

function generateOfflineAIResponse(question, batch = {}) {
  const q = (question || '').toLowerCase();
  const eco = batch.economics || {};

  const productName = batch.productName || 'Food Batch';
  const unit = batch.unitOfMeasure || 'kg';
  const batchQuantity = Math.max(0, Number(batch.batchQuantity) || 1000);
  const wastagePct = Number.isFinite(Number(batch.wastagePercentage))
    ? Number(batch.wastagePercentage)
    : (Number.isFinite(Number(eco.wastagePercentage)) ? Number(eco.wastagePercentage) : 5);
  const wastageQuantity = round2(batchQuantity * (wastagePct / 100));
  const sellableQuantity = Math.max(0, batchQuantity - wastageQuantity) || 1000;

  const totalCost = Number(batch.totalProductionCost) || Number(eco.totalProductionCost) || 0;
  const costPerUnit = Number(batch.costPerUnit) || Number(eco.costPerUnit) || (totalCost && sellableQuantity ? round2(totalCost / sellableQuantity) : 85);
  const sellingPrice = Number(batch.sellingPricePerUnit) || Number(eco.sellingPricePerUnit) || 120;
  const grossProfit = Number(batch.grossProfit) || Number(eco.grossProfit) || round2((sellableQuantity * sellingPrice) - totalCost);
  const marginPct = Number.isFinite(Number(batch.profitMarginPercentage))
    ? round2(Number(batch.profitMarginPercentage))
    : (Number.isFinite(Number(eco.profitMarginPercentage)) ? round2(Number(eco.profitMarginPercentage)) : 20);

  const rawMaterialCost = Number(batch.rawMaterialCost) || Number(eco.rawMaterialCost) || 0;
  const wastageCost = Number(batch.wastageCost) || Number(eco.wastageCost) || round2(totalCost * (wastagePct / 100));
  const packagingCost = Number(batch.packagingCost) || Number(eco.packagingCost) || 0;
  const labourCost = Number(batch.labourCost) || Number(eco.labourCost) || 0;
  const overheadCost = Number(batch.overheadCost) || Number(eco.overheadCost) || 0;

  const contributions = batch.costContributions || eco.costContributions || {};
  const rawPct = contributions.rawMaterialPct || (totalCost ? round2((rawMaterialCost / totalCost) * 100) : 50);
  const packagingPct = contributions.packagingPct || (totalCost ? round2((packagingCost / totalCost) * 100) : 12);
  const overheadPct = contributions.overheadPct || (totalCost ? round2((overheadCost / totalCost) * 100) : 10);
  const wastageCostPct = contributions.wastagePct || (totalCost ? round2((wastageCost / totalCost) * 100) : 4.5);

  const ingredients = Array.isArray(batch.ingredients) ? batch.ingredients : [];

  // 1. RAW MATERIAL PRICE INFLATION (15% SHOCK) - Specific Simulation
  if (q.includes('15%') || q.includes('inflation') || q.includes('price hike') || q.includes('price spike') || (q.includes('increase') && q.includes('price'))) {
    const rawCostIncrease = round2(rawMaterialCost * 0.15);
    const newTotalCost = round2(totalCost + rawCostIncrease);
    const newUnitCost = round2(newTotalCost / Math.max(1, sellableQuantity));
    const newGrossProfit = round2((sellableQuantity * sellingPrice) - newTotalCost);
    const newMarginPct = round2((newGrossProfit / Math.max(1, sellableQuantity * sellingPrice)) * 100);

    return `### 📋 Summary
Simulating a **+15% price increase** on raw materials for **${productName}**:
- Raw Material Cost Rises By: **+₹${rawCostIncrease}** (from ₹${rawMaterialCost} to ₹${round2(rawMaterialCost + rawCostIncrease)})
- Unit Production Cost Increases: **+₹${round2(newUnitCost - costPerUnit)} / ${unit}** (from ₹${costPerUnit} to **₹${newUnitCost}**)
- Gross Profit Margin Contracts: from **${marginPct}%** down to **${newMarginPct}%** (profit: ₹${newGrossProfit}).

### 🔍 Cost Drivers
Because raw materials constitute **${rawPct}%** of your cost structure, unhedged ingredient price inflation severely compresses gross margin by **${round2(marginPct - newMarginPct)} percentage points**.

### 🎯 Recommended Actions
1. **Pass-Through Pricing Formula**: Adjust selling price from ₹${sellingPrice} to **₹${round2(sellingPrice + (newUnitCost - costPerUnit))} / ${unit}** to preserve current unit margin.
2. **Quarterly Forward Contracts**: Lock in fixed seasonal purchase pricing with fruit/commodity aggregators.
3. **Recipe Re-Engineering**: Audit formulation pectin/sweetener balance within regulatory guidelines to absorb ingredient shifts.`;
  }

  // 2. BATCH SIZE SCALING & OVERHEAD DILUTION
  if (q.includes('scaling') || q.includes('scale') || q.includes('batch size') || q.includes('overhead') || q.includes('capacity')) {
    const overheadPerUnit = round2(overheadCost / Math.max(1, sellableQuantity));
    const scale15UnitOverhead = round2(overheadCost / Math.max(1, sellableQuantity * 1.5));
    const scale20UnitOverhead = round2(overheadCost / Math.max(1, sellableQuantity * 2.0));
    const savings15 = round2(overheadPerUnit - scale15UnitOverhead);
    const savings20 = round2(overheadPerUnit - scale20UnitOverhead);

    return `### 📋 Summary
Fixed plant overhead for **${productName}** is **₹${overheadCost}** (${overheadPct}% of total cost), contributing **₹${overheadPerUnit} / ${unit}** to your current unit cost at **${batchQuantity} ${unit}** scale.

### 🔍 Cost Drivers
Scaling batch volume dilutes fixed machine depreciation, facility lease, and supervisor overhead across more sellable units:
- **At 1.5x Volume (${Math.round(batchQuantity * 1.5)} ${unit})**: Unit overhead falls to **₹${scale15UnitOverhead} / ${unit}** (saves **₹${savings15} / ${unit}**).
- **At 2.0x Volume (${Math.round(batchQuantity * 2.0)} ${unit})**: Unit overhead falls to **₹${scale20UnitOverhead} / ${unit}** (saves **₹${savings20} / ${unit}**).

### 🎯 Recommended Actions
1. **Batch Consolidation**: Combine weekly micro-runs into consolidated bi-weekly production cycles.
2. **CIP Downtime Reduction**: Group similar recipe variants consecutively to eliminate intermediate clean-in-place downtime.
3. **Off-Peak Energy Scheduling**: Run energy-intensive heating cycles during utility off-peak tariff hours.`;
  }

  // 3. INGREDIENTS / RAW MATERIAL ANALYSIS
  if (q.includes('ingredient') || q.includes('raw material') || q.includes('recipe') || q.includes('pulp') || q.includes('sugar')) {
    const sortedIngredients = [...ingredients]
      .map(ing => {
        const qty = Number(ing.quantity) || 0;
        const price = Number(ing.unitPrice) || 0;
        const total = Number(ing.totalCost) || (qty * price);
        return { name: ing.name || 'Ingredient', qty, unit: ing.unit || unit, price, total: round2(total) };
      })
      .sort((a, b) => b.total - a.total);

    const topIng = sortedIngredients[0];
    const topIngShare = topIng && rawMaterialCost > 0 ? round2((topIng.total / rawMaterialCost) * 100) : null;

    let ingredientList = '';
    if (sortedIngredients.length > 0) {
      ingredientList = sortedIngredients.slice(0, 4).map((ing, i) => (
        `${i + 1}. **${ing.name}**: ${ing.qty} ${ing.unit} @ ₹${ing.price}/${ing.unit} = **₹${ing.total}**`
      )).join('\n');
    } else {
      ingredientList = `- Total Raw Material Expense: **₹${rawMaterialCost}** (${rawPct}% of total batch production cost)`;
    }

    return `### 📋 Summary
Raw materials represent your primary cost center for **${productName}**, totaling **₹${rawMaterialCost}** (${rawPct}% of total batch production cost).

### 🔍 Cost Drivers
Top ingredients by expenditure:
${ingredientList}
${topIng ? `\nPrimary ingredient concentration: **${topIng.name}** accounts for **${topIngShare}%** of your total raw material spend.` : ''}

### 🎯 Recommended Actions
1. **Volume Contract Negotiation**: Focus supplier negotiations on ${topIng ? `**${topIng.name}**` : 'your primary ingredient'}; a 6% volume discount would save **₹${round2(rawMaterialCost * 0.06)} per batch**.
2. **Dual-Sourcing Strategy**: Qualify a secondary supplier for primary commodities to prevent spot-market price spikes.
3. **Moisture & Storage Buffer**: Audit ingredient storage conditions to minimize pre-processing spoilage.`;
  }

  // 4. PROCESS WASTAGE & YIELD LOSS
  if (q.includes('wastage') || q.includes('waste') || q.includes('yield') || q.includes('scrap') || q.includes('spoilage')) {
    const reclaimedAt3Pct = wastagePct > 3 ? round2(wastageCost * ((wastagePct - 3) / wastagePct)) : round2(wastageCost * 0.4);

    return `### 📋 Summary
For **${productName}**, process yield loss is currently **${wastagePct}%**, converting **${wastageQuantity} ${unit}** into non-sellable waste and costing **₹${wastageCost}** per batch (${wastageCostPct}% of production expenses).

### 🔍 Cost Drivers
- Gross Production Volume: **${batchQuantity} ${unit}**
- Net Sellable Output: **${sellableQuantity} ${unit}**
- Direct Financial Loss: **₹${wastageCost}** in lost direct materials and processing effort.

### 🎯 Recommended Actions
1. **Filling & Dosing Calibration**: Calibrate inline filling nozzles to eliminate 1.5–2% overfill loss.
2. **Scrap Recovery & Rework**: Reducing yield loss down to 3.0% will reclaim **₹${reclaimedAt3Pct} per batch** directly to gross profit.
3. **Thermal Process Controls**: Standardize cooking/pasteurization holding temperatures to prevent batch burn-on scrap.`;
  }

  // 5. PROFIT MARGIN ENHANCEMENT
  if (q.includes('margin') || q.includes('profit') || q.includes('25%') || q.includes('30%')) {
    const target25Price = round2(costPerUnit / 0.75);
    const target30Price = round2(costPerUnit / 0.70);
    const priceGap25 = round2(target25Price - sellingPrice);

    return `### 📋 Summary
Current gross profit margin for **${productName}** is **${marginPct}%**, generating **₹${grossProfit}** gross profit per batch at selling price **₹${sellingPrice} / ${unit}**.

### 🔍 Cost Drivers
- Unit Production Cost: **₹${costPerUnit} / ${unit}**
- Break-Even Selling Price: **₹${round2(costPerUnit)} / ${unit}**
- Target Selling Price for 25% Margin: **₹${target25Price} / ${unit}** (${priceGap25 > 0 ? `+₹${priceGap25} price adjustment` : 'currently achieved'})
- Target Selling Price for 30% Margin: **₹${target30Price} / ${unit}**

### 🎯 Recommended Actions
1. **Channel Price Optimization**: Introduce premium 250g retail formats where price elasticity supports higher realized unit revenue.
2. **Combined Margin Lever**: Implement a 5% ingredient discount (saves ₹${round2(rawMaterialCost * 0.05)}) and a 2% wastage cut (reclaims ₹${round2(wastageCost * 0.35)}) to boost margin by +4.2% without price hikes.
3. **B2B Volume Bundling**: Offer tiered discounts on large orders to drive overall gross margin rupees while keeping price competitive.`;
  }

  // 6. GENERAL COST REDUCTION
  if (q.includes('reduce') || q.includes('lower') || q.includes('cut') || q.includes('save') || q.includes('cost reduction')) {
    return `### 📋 Summary
Operational cost reduction strategy for **${productName}** (Current Unit Cost: **₹${costPerUnit} / ${unit}**, Total: **₹${totalCost}**):

### 🔍 Cost Drivers
Your three largest expenditure categories:
1. **Raw Materials**: **₹${rawMaterialCost}** (${rawPct}% of cost)
2. **Packaging**: **₹${packagingCost}** (${packagingPct}% of cost)
3. **Process Wastage**: **₹${wastageCost}** (${wastageCostPct}% of cost)

### 🎯 Recommended Actions
1. **Tiered Raw Material Contracts**: Target 5-7% discount on bulk ingredient purchase orders (saves **₹${round2(rawMaterialCost * 0.06)} per batch**).
2. **Packaging Gauge Optimization**: Transition from heavy corrugated outer boxes to optimized secondary packaging (saves **₹${round2(packagingCost * 0.12)} per batch**).
3. **Yield Loss Reclamation**: Reduce line scrap from ${wastagePct}% to 3% (reclaims **₹${round2(wastageCost * 0.4)} per batch**).`;
  }

  // 7. WHY IS COST HIGH / DIAGNOSTIC
  if (q.includes('why') && (q.includes('high') || q.includes('expensive') || q.includes('driver') || q.includes('component'))) {
    return `### 📋 Summary
Cost driver diagnostic for **${productName}** with unit production cost of **₹${costPerUnit} / ${unit}**:

### 🔍 Cost Drivers
- **Raw Materials**: **${rawPct}%** (₹${rawMaterialCost}) — Primary cost driver.
- **Packaging Expense**: **${packagingPct}%** (₹${packagingCost}).
- **Yield Loss & Scrap**: **${wastageCostPct}%** (₹${wastageCost}) at ${wastagePct}% wastage rate.
- **Plant Overheads**: **${overheadPct}%** (₹${overheadCost}).

### 🎯 Recommended Actions
1. **Supplier Negotiation**: Focus on raw materials since they constitute ${rawPct}% of your unit cost.
2. **Batch Volume Increase**: Scaling batch size from ${batchQuantity} ${unit} to ${Math.round(batchQuantity * 1.5)} ${unit} dilutes fixed overhead by ~33%.
3. **Scrap Audit**: Track rejection logs at each processing phase (prep, cooking, filling, labelling).`;
  }

  // 8. DEFAULT OPERATIONAL OVERVIEW
  return `### 📋 Summary
Operational economics snapshot for **${productName}**:
- Batch Volume: **${batchQuantity} ${unit}** (Sellable: **${sellableQuantity} ${unit}**)
- Unit Production Cost: **₹${costPerUnit} / ${unit}**
- Selling Price: **₹${sellingPrice} / ${unit}**
- Gross Profit Margin: **${marginPct}%** (Gross Profit: **₹${grossProfit}**)

### 🔍 Cost Drivers
- Raw Materials: **₹${rawMaterialCost}** (${rawPct}%)
- Packaging: **₹${packagingCost}** (${packagingPct}%)
- Fixed Overhead: **₹${overheadCost}** (${overheadPct}%)
- Wastage Loss: **₹${wastageCost}** (${wastagePct}% yield loss)

### 🎯 Recommended Actions
1. **Procurement Consolidation**: Negotiate volume terms for top raw materials.
2. **Yield Loss Target**: Reduce process scrap below 3% to reclaim lost inventory value.
3. **Capacity Scheduling**: Optimize batch scheduling to dilute fixed plant overheads.`;
}

async function callGeminiAPI(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function callOpenAIAPI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || null;
}

module.exports = {
  queryAIAdvisor,
  generateOfflineAIResponse
};
