import React from 'react';
import { 
  DollarSign, TrendingUp, Package, AlertCircle, ArrowUpRight, ArrowDownRight,
  PieChart, Sliders, Sparkles, Plus, Eye, Copy, Trash2
} from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

export default function Dashboard({ 
  batches = [], 
  activeBatch, 
  onSelectBatch, 
  onNavigate, 
  onDuplicateBatch, 
  onDeleteBatch 
}) {
  const selected = activeBatch || batches[0] || {};
  const eco = selected.economics || {};

  const costBreakdownData = [
    { label: 'Raw Materials', val: eco.rawMaterialCost || 0, color: '#10b981', pct: eco.costContributions?.rawMaterialPct || 0 },
    { label: 'Packaging', val: eco.packagingCost || 0, color: '#06b6d4', pct: eco.costContributions?.packagingPct || 0 },
    { label: 'Labour', val: eco.labourCost || 0, color: '#f59e0b', pct: eco.costContributions?.labourPct || 0 },
    { label: 'Energy & Water', val: (eco.energyCost || 0) + (eco.waterUtilitiesCost || 0), color: '#8b5cf6', pct: eco.costContributions?.energyPct || 0 },
    { label: 'Logistics', val: eco.transportLogisticsCost || 0, color: '#3b82f6', pct: eco.costContributions?.logisticsPct || 0 },
    { label: 'Overheads', val: eco.overheadCost || 0, color: '#64748b', pct: eco.costContributions?.overheadPct || 0 },
    { label: 'Wastage Loss', val: eco.wastageCost || 0, color: '#f43f5e', pct: eco.costContributions?.wastagePct || 0 }
  ];

  return (
    <div className="space-y-8">
      
      {/* Top Header & Batch Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <span className="badge badge-emerald text-[10px] mb-1">Executive Analytics</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Production Economics Dashboard</h1>
          <p className="text-xs text-gray-400">Overview of active production batch cost drivers, yield loss, and profit margins.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {batches.length > 0 && (
            <select
              value={selected.id || ''}
              onChange={(e) => {
                const found = batches.find(b => b.id === e.target.value);
                if (found) onSelectBatch(found);
              }}
              className="input-field text-xs py-2 px-3 max-w-xs font-semibold bg-gray-900 border-gray-700 text-white"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.productName} ({b.batchQuantity} {b.unitOfMeasure})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => onNavigate('calculator')}
            className="btn btn-primary text-xs py-2 px-4 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Production Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Batch Cost */}
        <div className="card space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Production Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatCurrency(eco.totalProductionCost)}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>Batch Size:</span>
            <span className="font-semibold text-emerald-400">{eco.batchQuantity || 0} {eco.unitOfMeasure}</span>
          </div>
        </div>

        {/* Cost Per Unit / kg */}
        <div className="card space-y-2 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Cost Per Sellable Unit</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400">
            ₹{eco.costPerUnit || 0} <span className="text-xs text-gray-400 font-normal">/ {eco.unitOfMeasure}</span>
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>Sellable Yield:</span>
            <span className="font-semibold text-white">{eco.sellableQuantity || 0} {eco.unitOfMeasure}</span>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="card space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Gross Profit & Margin</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{formatCurrency(eco.grossProfit)}</span>
            <span className={`badge text-xs ${eco.profitMarginPercentage >= 20 ? 'badge-emerald' : 'badge-amber'}`}>
              {eco.profitMarginPercentage || 0}%
            </span>
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>Selling Price:</span>
            <span className="font-semibold text-white">₹{eco.sellingPricePerUnit || 0} / {eco.unitOfMeasure}</span>
          </div>
        </div>

        {/* Break-Even Quantity */}
        <div className="card space-y-2 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Break-Even Volume</span>
            <AlertCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-300">
            {eco.breakEvenQuantity === null || eco.breakEvenQuantity === undefined ? '—' : eco.breakEvenQuantity}{' '}
            <span className="text-xs text-gray-400 font-normal">{eco.unitOfMeasure}</span>
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>Min Price to Break Even:</span>
            <span className="font-semibold text-white">₹{eco.breakEvenSellingPrice || 0} / {eco.unitOfMeasure}</span>
          </div>
        </div>

      </div>

      {/* Main Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cost Category Breakdown List */}
        <div className="lg:col-span-7 card space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span>Cost Structure & Contribution Percentages</span>
              </h3>
              <p className="text-xs text-gray-400">Distribution of expenditures per batch for {selected.productName || 'Active Batch'}</p>
            </div>
            <button 
              onClick={() => onNavigate('whatif')}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Scenario</span>
            </button>
          </div>

          {/* Visual Bar Distribution */}
          <div className="space-y-4">
            {costBreakdownData.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono">{formatCurrency(item.val)}</span>
                    <span className="font-bold text-white w-12 text-right">{item.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(1, item.pct)}%`, backgroundColor: item.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Decision Cards */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="card bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-900 border-emerald-500/30 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Production Optimization</h4>
                <p className="text-xs text-gray-400">Run algorithmic diagnostics on {selected.productName || 'Batch'}</p>
              </div>
            </div>

            <p className="text-xs text-gray-300">
              Primary Cost Driver: <strong className="text-emerald-400">Raw Materials ({eco.costContributions?.rawMaterialPct || 0}%)</strong>. Process wastage adds <strong className="text-amber-400">₹{eco.wastageCost || 0}</strong> per batch.
            </p>

            <button
              onClick={() => onNavigate('optimizer')}
              className="w-full btn btn-primary text-xs py-2.5"
            >
              View Full Optimization Report &rarr;
            </button>
          </div>

          <div className="card bg-gradient-to-br from-purple-950/40 via-gray-900 to-gray-900 border-purple-500/30 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">AI Operations Advisor</h4>
                <p className="text-xs text-gray-400">Ask natural questions regarding cost reduction</p>
              </div>
            </div>

            <div className="text-xs text-gray-300 bg-gray-950/60 p-3 rounded-lg border border-gray-800 italic">
              "How can I improve gross profit margin to 25%?"
            </div>

            <button
              onClick={() => onNavigate('ai-advisor')}
              className="w-full btn btn-secondary text-xs py-2.5 border-purple-500/30 text-purple-300 hover:bg-purple-950/50"
            >
              Ask AI Advisor Now &rarr;
            </button>
          </div>

        </div>

      </div>

      {/* Recent Batches Management Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Saved Production Batches</h3>
            <p className="text-xs text-gray-400">Compare cost metrics across different products and batch sizes.</p>
          </div>
          <button
            onClick={() => onNavigate('batches')}
            className="btn btn-secondary text-xs py-1.5 px-3"
          >
            Manage All Batches ({batches.length}) &rarr;
          </button>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Batch Quantity</th>
                <th>Total Cost</th>
                <th>Unit Cost</th>
                <th>Gross Margin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const bEco = b.economics || {};
                const isCurrent = b.id === selected.id;
                return (
                  <tr key={b.id} className={isCurrent ? 'bg-emerald-950/20' : ''}>
                    <td className="font-semibold text-white">
                      {b.productName}
                      {isCurrent && <span className="ml-2 badge badge-emerald text-[9px]">Active</span>}
                    </td>
                    <td className="text-xs text-gray-400">{b.productCategory || 'General'}</td>
                    <td className="font-mono text-xs">{b.batchQuantity} {b.unitOfMeasure}</td>
                    <td className="font-bold text-white font-mono">{formatCurrency(bEco.totalProductionCost)}</td>
                    <td className="font-bold text-emerald-400 font-mono">₹{bEco.costPerUnit} / {b.unitOfMeasure}</td>
                    <td>
                      <span className={`badge text-xs ${bEco.profitMarginPercentage >= 20 ? 'badge-emerald' : 'badge-amber'}`}>
                        {bEco.profitMarginPercentage}%
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectBatch(b)}
                          className="btn btn-secondary text-[11px] p-1.5"
                          title="Select Batch"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => onDuplicateBatch(b.id)}
                          className="btn btn-secondary text-[11px] p-1.5"
                          title="Duplicate Batch"
                        >
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => onDeleteBatch(b.id)}
                          className="btn btn-danger text-[11px] p-1.5"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
