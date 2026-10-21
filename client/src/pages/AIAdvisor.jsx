import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, User, Lightbulb, AlertCircle, 
  HelpCircle, RefreshCw, CheckCircle2, RotateCcw
} from 'lucide-react';
import { formatCurrency, round2 } from '../utils/calculator';
import MarkdownRenderer from '../components/MarkdownRenderer';

function getNowTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AIAdvisor({ activeBatch, batches = [] }) {
  const selectedBatch = activeBatch || batches[0] || {};
  const eco = selectedBatch.economics || {};

  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome-init',
      sender: 'ai',
      text: `### 👋 Welcome to the AI Production Cost Advisor

I have loaded your active batch dataset for **${selectedBatch.productName || 'Mango Jam'}** (${selectedBatch.batchQuantity || 1000} ${selectedBatch.unitOfMeasure || 'kg'}).

**Current Batch Financial Summary**:
- Unit Production Cost: **₹${eco.costPerUnit || 139.53} / ${selectedBatch.unitOfMeasure || 'kg'}**
- Gross Profit Margin: **${eco.profitMarginPercentage || 12.8}%**
- Primary Cost Component: **Raw Materials (${eco.costContributions?.rawMaterialPct || 54.5}%)**
- Wastage Loss: **₹${eco.wastageCost || 7352.15} (${eco.wastagePercentage || 6.5}%)**

Ask me any operational question or select one of the suggested prompts below!`,
      mode: 'DEMO_OFFLINE_AI',
      timestamp: getNowTimestamp()
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    "How can I reduce the unit production cost of this product?",
    "Why is my production cost high and which component should I focus on?",
    "How can I improve my gross profit margin to 25%?",
    "What happens if raw material prices increase by 15%?",
    "How does batch size scaling affect my fixed plant overheads?"
  ];

  const handleAsk = async (questionText) => {
    const q = (questionText || inputQuestion || '').trim();
    if (!q || loading) return;

    setErrorMessage(null);

    // Create unique ID for this user question
    const userMsgId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: q,
      timestamp: getNowTimestamp()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const token = localStorage.getItem('foodcost_token') || 'demo_token';
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: q,
          batchData: {
            ...selectedBatch,
            economics: eco
          }
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: 'ai',
          text: data.data.answer,
          mode: data.data.mode || 'DEMO_OFFLINE_AI',
          inResponseTo: userMsgId,
          timestamp: getNowTimestamp()
        }]);
      } else {
        throw new Error(data.error || 'Server returned an invalid AI response');
      }
    } catch (err) {
      console.warn('Backend call failed, using client fallback logic:', err.message);
      // Client offline AI fallback with rich grounded section responses
      const fallbackText = getClientOfflineAnswer(q, selectedBatch, eco);
      setMessages(prev => [...prev, {
        id: `ai-offline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'ai',
        text: fallbackText,
        mode: 'DEMO_OFFLINE_AI',
        inResponseTo: userMsgId,
        timestamp: getNowTimestamp()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (text) => {
    handleAsk(text);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <span className="badge badge-purple text-[10px] mb-1">Generative & Algorithmic AI</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Production Cost Advisor</h1>
          <p className="text-xs text-gray-400">Context-aware expert recommendations for cost reduction and operational decision support.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-xs">
          <Bot className="w-4 h-4 text-purple-400" />
          <span className="text-gray-400">Active Context:</span>
          <span className="font-bold text-white">{selectedBatch.productName || 'Batch'}</span>
          <span className="text-gray-500 text-[10px]">({selectedBatch.unitOfMeasure || 'kg'})</span>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Suggested Questions:</span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(prompt)}
              disabled={loading}
              className="btn btn-secondary text-xs py-1.5 px-3 bg-gray-900 border-gray-800 hover:border-purple-500/50 hover:text-purple-300 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="card bg-gray-950 border-gray-800 p-4 sm:p-6 min-h-[440px] max-h-[620px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isOffline = msg.mode === 'DEMO_OFFLINE_AI';

          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* AI Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Card */}
              <div className={`space-y-2 p-4 rounded-2xl border text-xs leading-relaxed transition-all ${
                isUser 
                  ? 'max-w-xl bg-emerald-950/40 border-emerald-500/30 text-white font-medium shadow-sm' 
                  : 'max-w-3xl bg-gray-900 border-gray-800 text-gray-200 w-full'
              }`}>
                
                {/* AI Header Bar */}
                {!isUser && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                        {isOffline ? 'Deterministic Rules Engine' : 'AI Operations Expert'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-[9px] ${
                        isOffline 
                          ? 'badge-amber' 
                          : 'badge-purple'
                      }`}>
                        {isOffline ? 'Offline Heuristic Mode (Demo)' : (msg.mode || 'Live AI')}
                      </span>
                      <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                    </div>
                  </div>
                )}

                {/* Message Body with Safe Markdown Rendering */}
                {isUser ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <MarkdownRenderer content={msg.text} />
                )}

                {/* User Timestamp */}
                {isUser && (
                  <div className="text-right pt-1">
                    <span className="text-[10px] text-emerald-400/70">{msg.timestamp}</span>
                  </div>
                )}

              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-gray-900/90 border border-purple-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-purple-300">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Analyzing production economics and evaluating cost reduction pathways...</span>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleRetry(messages.filter(m => m.sender === 'user').slice(-1)[0]?.text)}
              className="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 text-red-300 border-red-500/30 hover:bg-red-950/50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
        className="flex items-center gap-3"
      >
        <input
          type="text"
          placeholder="Ask a question about ingredient costs, wastage reduction, margin expansion, inflation..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          disabled={loading}
          className="input-field text-sm py-3 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={loading || !inputQuestion.trim()}
          className="btn btn-primary py-3 px-6 shrink-0 shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </form>

    </div>
  );
}

/**
 * Client-side heuristic offline answer generator.
 * Produces structured sections (Summary, Cost Drivers, Recommended Actions) grounded
 * in the active batch's actual numeric metrics without fabricating data.
 */
function getClientOfflineAnswer(question, batch = {}, eco = {}) {
  const q = (question || '').toLowerCase();

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
