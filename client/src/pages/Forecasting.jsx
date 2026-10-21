import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, AlertCircle, Download, RefreshCw, 
  Info, BarChart2, CheckCircle2
} from 'lucide-react';
import { getSampleForecastData } from '../utils/forecastEngine';
import { formatCurrency } from '../utils/calculator';
import CostForecastChart from '../components/CostForecastChart';

export default function Forecasting() {
  const [forecastData, setForecastData] = useState(getSampleForecastData());
  const [loading, setLoading] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('foodcost_token');
      const res = await fetch('/api/forecast', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.data) {
        setForecastData(data.data);
      }
    } catch (err) {
      console.warn('Backend forecast fetch failed, using client statistical generator:', err.message);
      setForecastData(getSampleForecastData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const { 
    historicalPoints = [], 
    forecastPoints = [], 
    analytics = {}, 
    isSampleData = false, 
    productName,
    unitOfMeasure = 'kg',
    hasMixedUnits = false
  } = forecastData;

  const handleExportCSV = () => {
    const unitSuffix = unitOfMeasure ? ` (${unitOfMeasure})` : '';
    const rows = [
      ['Date', 'Type', `Cost Per Unit (₹)${unitSuffix}`, 'Lower Bound (₹)', 'Upper Bound (₹)'],
      ...historicalPoints.map(p => [p.monthLabel, 'Actual Historical', p.actualCostPerUnit !== null && p.actualCostPerUnit !== undefined ? p.actualCostPerUnit : 'N/A', '', '']),
      ...forecastPoints.map(p => [p.monthLabel, 'Statistical Forecast', p.projectedCostPerUnit, p.lowerConfidenceBound, p.upperConfidenceBound])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `food_cost_forecast_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <span className="badge badge-cyan text-[10px] mb-1">Time-Series Predictive Analytics</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Production Cost Forecasting</h1>
          <p className="text-xs text-gray-400">Statistical forecasting utilizing Holt's exponential smoothing and linear trend regression.</p>
          {isSampleData && (
            <span className="badge badge-amber text-[10px] mt-2">
              {productName} — Sample Demo Dataset
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchForecast}
            disabled={loading}
            className="btn btn-secondary text-xs py-2 px-3"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Model</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-primary text-xs py-2 px-4 shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Export Forecast CSV</span>
          </button>
        </div>
      </div>

      {/* DEMO / Sample Data Notice */}
      {isSampleData && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-100 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            <span className="font-extrabold text-amber-300">DEMO / SAMPLE DATA:</span>{' '}
            {productName ? `${productName} — ` : ''}
            {forecastData.description || 'Illustrative monthly history shown for demonstration only. This is not real production data.'}
          </span>
        </div>
      )}

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="card space-y-1">
          <span className="text-xs text-gray-400">Model Methodology</span>
          <div className="text-sm font-extrabold text-white">Hybrid Holt & Linear Regression</div>
          <span className="text-[11px] text-gray-500">Dual Exponential Smoothing</span>
        </div>

        <div className="card space-y-1">
          <span className="text-xs text-gray-400">Annualized Cost Inflation Rate</span>
          <div className="text-2xl font-extrabold text-amber-400">+{analytics.annualizedCostInflationPct}% / yr</div>
          <span className="text-[11px] text-gray-500">Based on historical trend</span>
        </div>

        <div className="card space-y-1">
          <span className="text-xs text-gray-400">Confidence Interval</span>
          <div className="text-2xl font-extrabold text-emerald-400">{analytics.confidenceIntervalPct}% Confidence</div>
          <span className="text-[11px] text-gray-500">Standard Error: ₹{analytics.standardError}</span>
        </div>

        <div className="card space-y-1">
          <span className="text-xs text-gray-400">Data Source Status</span>
          <div className="flex items-center gap-2">
            <span className={`badge ${isSampleData ? 'badge-amber' : 'badge-emerald'}`}>
              {isSampleData ? 'Sample Demo Data' : 'Active Batch History'}
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            {isSampleData ? (productName ? `${productName} (illustrative demo dataset)` : 'Illustrative demo dataset') : 'Clearly labeled estimate projections'}
          </span>
        </div>

      </div>

      {/* Interactive Time-Series Cost & Forecast Visualization */}
      <CostForecastChart
        historicalPoints={historicalPoints}
        forecastPoints={forecastPoints}
        productName={productName}
        unitOfMeasure={unitOfMeasure}
        hasMixedUnits={hasMixedUnits}
        isSampleData={isSampleData}
        analytics={analytics}
      />

      {/* Detailed Forecast Projection Table */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
          <h3 className="text-base font-bold text-white">
            Detailed 6-Month Projection Schedule & Upper/Lower Bounds
          </h3>
          <span className="text-xs text-gray-400">
            Base Unit: <span className="font-mono text-cyan-400 font-semibold">{unitOfMeasure || 'unit'}</span>
          </span>
        </div>

        <div className="custom-table-container">
          <table className="custom-table text-xs">
            <thead>
              <tr>
                <th>Forecast Month</th>
                <th>Status</th>
                <th>Projected Unit Cost (₹)</th>
                <th>95% Lower Bound (₹)</th>
                <th>95% Upper Bound (₹)</th>
                <th>Variance vs Last Actual</th>
              </tr>
            </thead>
            <tbody>
              {forecastPoints.map((fp, idx) => {
                const lastActual = [...historicalPoints].reverse().find(p => p.actualCostPerUnit !== null && p.actualCostPerUnit !== undefined)?.actualCostPerUnit;
                const variance = lastActual != null && fp.projectedCostPerUnit != null
                  ? Math.round((fp.projectedCostPerUnit - lastActual) * 100) / 100
                  : null;
                const varianceText = variance != null
                  ? (variance >= 0 ? `+₹${variance}` : `-₹${Math.abs(variance)}`)
                  : 'N/A';
                const varianceColor = variance != null && variance > 0 ? 'text-amber-400' : 'text-emerald-400';

                return (
                  <tr key={idx}>
                    <td className="font-bold text-white">{fp.monthLabel}</td>
                    <td><span className="badge badge-cyan text-[9px]">Projected Estimate</span></td>
                    <td className="font-bold font-mono text-cyan-400">₹{fp.projectedCostPerUnit} / {unitOfMeasure || 'unit'}</td>
                    <td className="font-mono text-emerald-400">₹{fp.lowerConfidenceBound}</td>
                    <td className="font-mono text-amber-400">₹{fp.upperConfidenceBound}</td>
                    <td className={`font-mono ${varianceColor}`}>
                      {varianceText}
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
