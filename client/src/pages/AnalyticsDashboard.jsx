import React, { useMemo, useState } from 'react';
import {
  BarChart3, Download, DollarSign, TrendingUp, Package, AlertTriangle,
  Percent, Layers, Lightbulb, ArrowUpRight, ArrowDownRight, FlaskConical
} from 'lucide-react';
import { formatCurrency } from '../utils/calculator';
import { buildAnalysisBundle, toCsv, ANALYSIS_COLUMNS } from '../utils/analyticsEngine';

const SEVERITY_BADGE = {
  critical: 'badge-rose',
  warning: 'badge-amber',
  positive: 'badge-emerald',
  info: 'badge-cyan'
};

const UNAVAILABLE = '—';

function formatAmount(value) {
  return value === null || value === undefined ? UNAVAILABLE : formatCurrency(value);
}

function downloadCsv(filename, contents) {
  // Prepend a UTF-8 BOM so Excel opens ₹ and non-ASCII product names correctly.
  const blob = new Blob(['\uFEFF' + contents], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AnalyticsDashboard({ batches = [], activeBatch, onNavigate }) {
  const [exported, setExported] = useState(false);

  const bundle = useMemo(() => buildAnalysisBundle(batches), [batches]);
  const { rows, kpis, structure, ranking, marginBands, wastage, insights } = bundle;

  const maxWastageCost = wastage.offenders.reduce(
    (m, o) => (o.wastageCost !== null && o.wastageCost !== undefined ? Math.max(m, o.wastageCost) : m), 0
  );
  const maxBandCount = marginBands.reduce((m, b) => Math.max(m, b.count), 0);

  const assetProduct = useMemo(() => {
    if (!activeBatch) return rows[0]?.productName;
    return activeBatch.productName;
  }, [activeBatch, rows]);

  function handleExport() {
    const csv = toCsv(rows, ANALYSIS_COLUMNS);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`production-analysis-${stamp}.csv`, csv);
    setExported(true);
    window.setTimeout(() => setExported(false), 2500);
  }

  return (
    <div className="space-y-8">

      {/* Header & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <span className="badge badge-cyan text-[10px] mb-1">Business Analytics</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Portfolio Analytics &amp; Insights</h1>
          <p className="text-xs text-gray-400">
            Analysis-ready dataset, cost-structure breakdown, product ranking and rule-based insights across all saved batches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Dataset</div>
            <div className="text-xs font-semibold text-gray-300">{rows.length} batch{rows.length === 1 ? '' : 'es'} · {ANALYSIS_COLUMNS.length} fields</div>
          </div>
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className={`btn text-xs py-2 px-4 shadow-md ${rows.length === 0 ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
            title={rows.length === 0 ? 'No batches to export' : 'Export the analysis-ready dataset as CSV'}
          >
            <Download className="w-4 h-4" />
            <span>{exported ? 'Exported!' : 'Export Analysis CSV'}</span>
          </button>
        </div>
      </div>

      {/* Demo / synthetic data notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-200/90">
        <FlaskConical className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          Metrics are computed from locally stored batches. Batches loaded from the built-in sample set are
          <strong> synthetic demonstration data</strong>, not audited real-world records — treat exported figures as illustrative.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Production Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{formatCurrency(kpis.totalProductionCost)}</div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>Across batches:</span>
            <span className="font-semibold text-emerald-400">{kpis.batchCount} · {kpis.productCount} product(s)</span>
          </div>
        </div>

        <div className="card space-y-2 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Portfolio Revenue</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400">{formatCurrency(kpis.totalRevenue)}</div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>Avg selling price:</span>
            <span className="font-semibold text-white">{kpis.avgSellingPrice == null ? UNAVAILABLE : `₹${kpis.avgSellingPrice}`}</span>
          </div>
        </div>

        <div className="card space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{formatCurrency(kpis.totalProfit)}</span>
            <span className={`badge text-xs ${kpis.portfolioMarginPct >= 20 ? 'badge-emerald' : kpis.portfolioMarginPct < 0 ? 'badge-rose' : 'badge-amber'}`}>
              {kpis.portfolioMarginPct}%
            </span>
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>Avg unit cost:</span>
            <span className="font-semibold text-white">{kpis.avgUnitCost == null ? UNAVAILABLE : `₹${kpis.avgUnitCost}`}</span>
          </div>
        </div>

        <div className="card space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Wastage Share of Cost</span>
            <Percent className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-300">{kpis.wastageSharePct == null ? UNAVAILABLE : `${kpis.wastageSharePct}%`}</div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
            <span>Wastage loss:</span>
            <span className="font-semibold text-white">{formatAmount(kpis.totalWastageCost)}</span>
          </div>
        </div>
      </div>

      {/* Secondary KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Batches', value: kpis.batchCount, icon: Layers, color: 'text-cyan-400' },
          { label: 'Loss-making', value: kpis.lossMakingCount, icon: AlertTriangle, color: 'text-rose-400' },
          { label: 'Healthy margins', value: kpis.healthyMarginCount, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Sellable volume', value: kpis.totalSellableQuantity == null ? UNAVAILABLE : `${kpis.totalSellableQuantity}`, icon: Package, color: 'text-amber-400' },
          { label: 'Achieved wastage', value: kpis.achievedWastagePct == null ? UNAVAILABLE : `${kpis.achievedWastagePct}%`, icon: Percent, color: 'text-purple-400' }
        ].map((k) => (
          <div key={k.label} className="card card-interactive p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500">{k.label}</div>
              <div className="text-lg font-bold text-white">{k.value}</div>
            </div>
            <k.icon className={`w-4 h-4 ${k.color}`} />
          </div>
        ))}
      </div>

      {/* Cost structure + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-7 card space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Portfolio Cost Structure</span>
              </h3>
              <p className="text-xs text-gray-400">Aggregated expenditure by category across all batches.</p>
            </div>
            <span className="text-xs text-gray-400 font-mono">{formatCurrency(structure.totalCost)}</span>
          </div>

          <div className="space-y-4">
            {structure.categories.map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono">{formatCurrency(item.cost)}</span>
                    <span className="font-bold text-white w-12 text-right">{item.sharePct}%</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(1, item.sharePct)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 card space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Automated Insights</h3>
          </div>

          {insights.length === 0 ? (
            <p className="text-xs text-gray-400">No notable findings for the current dataset.</p>
          ) : (
            <div className="space-y-3">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-lg border border-gray-800 bg-gray-950/50 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-white leading-snug">{ins.title}</span>
                    <span className={`badge ${SEVERITY_BADGE[ins.severity] || 'badge-cyan'} text-[9px] shrink-0`}>
                      {ins.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{ins.detail}</p>
                  <div className="text-[10px] text-gray-500 flex items-center justify-between pt-0.5">
                    <span>{ins.metricLabel}</span>
                    <span className="font-mono text-gray-300">{ins.metricValue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Margin distribution + wastage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div className="card space-y-5">
          <div className="border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Margin Distribution</span>
            </h3>
            <p className="text-xs text-gray-400">Number of batches per profit-margin band.</p>
          </div>
          <div className="space-y-4">
            {marginBands.map((band) => (
              <div key={band.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-200">{band.label}</span>
                  <span className="font-bold text-white">{band.count}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${maxBandCount > 0 ? Math.max(2, (band.count / maxBandCount) * 100) : 0}%`,
                      backgroundColor: band.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-5">
          <div className="border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Wastage Analysis</span>
            </h3>
            <p className="text-xs text-gray-400">
              Total wastage {formatAmount(wastage.totalWastageCost)} · {wastage.totalWastageQuantity == null ? UNAVAILABLE : `${wastage.totalWastageQuantity} units`}.
            </p>
          </div>
          {wastage.offenders.length === 0 ? (
            <p className="text-xs text-gray-400">No wastage recorded.</p>
          ) : (
            <div className="space-y-4">
              {wastage.offenders.slice(0, 6).map((o) => (
                <div key={o.batchId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-200 truncate max-w-[55%]">{o.productName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono">{formatAmount(o.wastageCost)}</span>
                      <span className="font-bold text-rose-300 w-12 text-right">{o.wastagePercentage == null ? UNAVAILABLE : `${o.wastagePercentage}%`}</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-rose-500"
                      style={{ width: `${maxWastageCost > 0 && o.wastageCost !== null && o.wastageCost !== undefined ? Math.max(2, (o.wastageCost / maxWastageCost) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product ranking table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Product Ranking by Margin</h3>
            <p className="text-xs text-gray-400">Batches ordered by profit margin, with cost and contribution detail.</p>
          </div>
          {assetProduct && (
            <span className="badge badge-cyan text-[10px] hidden sm:inline-flex">Active: {assetProduct}</span>
          )}
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Category</th>
                <th>Unit Cost</th>
                <th>Selling Price</th>
                <th>Gross Profit</th>
                <th>Margin</th>
                <th>Rank Value</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 text-xs py-6">
                    No batches available. Create a production batch to populate the ranking.
                  </td>
                </tr>
              )}
              {ranking.map((r) => (
                <tr key={r.batchId || `${r.rank}-${r.productName}`}>
                  <td className="text-gray-500 font-mono text-xs">{r.rank}</td>
                  <td className="font-semibold text-white">{r.productName}</td>
                  <td className="text-xs text-gray-400">{r.productCategory}</td>
                  <td className="font-mono text-xs text-white">₹{r.unitCost}</td>
                  <td className="font-mono text-xs text-white">₹{r.sellingPrice}</td>
                  <td className={`font-mono text-xs font-bold ${r.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(r.profit)}
                  </td>
                  <td>
                    <span className={`badge text-xs ${r.marginPct >= 20 ? 'badge-emerald' : r.marginPct < 0 ? 'badge-rose' : 'badge-amber'}`}>
                      <span className="inline-flex items-center gap-0.5">
                        {r.marginPct < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {r.marginPct}%
                      </span>
                    </span>
                  </td>
                  <td className="text-xs text-gray-400">
                    Revenue {formatCurrency(r.revenue)} · Qty {r.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-gray-500">
            Analysis dataset is derived from the same economics engine used by the calculator — no recomputation.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('batches')}
            className="btn btn-secondary text-xs py-1.5 px-3"
          >
            Manage Batches ({batches.length}) &rarr;
          </button>
        </div>
      </div>

    </div>
  );
}
