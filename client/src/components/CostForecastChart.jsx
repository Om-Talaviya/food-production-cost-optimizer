import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

/**
 * Parses YYYY-MM into a continuous month index (year * 12 + month - 1)
 * for verifying exact consecutive month continuity.
 */
function getMonthIndex(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.slice(0, 7).split('-');
  if (parts.length < 2) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(y) || Number.isNaN(m)) return null;
  return y * 12 + (m - 1);
}

/**
 * Formats a date string (YYYY-MM) or monthLabel into compact tick label: "Sep '25"
 */
function formatTickLabel(dateStr, monthLabel) {
  if (dateStr && /^\d{4}-\d{2}/.test(dateStr)) {
    const [year, month] = dateStr.slice(0, 7).split('-');
    const mNum = parseInt(month, 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mName = months[mNum - 1] || month;
    return `${mName} '${year.slice(2)}`;
  }
  if (monthLabel) {
    const parts = monthLabel.trim().split(/\s+/);
    if (parts.length >= 2) {
      const m = parts[0].slice(0, 3);
      const y = parts[1].replace(/^[^\d]+/, '');
      return `${m} '${y.slice(-2)}`;
    }
    return monthLabel;
  }
  return dateStr || '';
}

/**
 * Formats a full month label for tooltips: "September 2026"
 */
function formatFullLabel(dateStr, monthLabel) {
  if (monthLabel && monthLabel.includes(' ')) return monthLabel;
  if (dateStr && /^\d{4}-\d{2}/.test(dateStr)) {
    const [year, month] = dateStr.slice(0, 7).split('-');
    const mNum = parseInt(month, 10);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[mNum - 1] || month} ${year}`;
  }
  return monthLabel || dateStr || '';
}

export default function CostForecastChart({
  historicalPoints = [],
  forecastPoints = [],
  productName = 'Premium Mango Jam',
  unitOfMeasure = 'kg',
  hasMixedUnits = false,
  isSampleData = false,
  analytics = {}
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Normalize points and build continuous unified timeline
  const { points, canConnect, yMin, yMax, yTicks, isConstant } = useMemo(() => {
    const hist = (historicalPoints || []).map((p, idx) => ({
      id: `h_${idx}`,
      idx,
      type: 'historical',
      date: p.date,
      monthLabel: p.monthLabel,
      cost: p.actualCostPerUnit != null && Number.isFinite(Number(p.actualCostPerUnit))
        ? Number(p.actualCostPerUnit)
        : null,
      rawMaterialCost: p.rawMaterialCost,
      productionQuantity: p.productionQuantity,
      sellingPrice: p.sellingPrice,
      lowerBound: null,
      upperBound: null
    }));

    const fc = (forecastPoints || []).map((p, idx) => ({
      id: `f_${idx}`,
      idx: hist.length + idx,
      type: 'forecast',
      date: p.date,
      monthLabel: p.monthLabel,
      cost: p.projectedCostPerUnit != null && Number.isFinite(Number(p.projectedCostPerUnit))
        ? Number(p.projectedCostPerUnit)
        : null,
      lowerBound: p.lowerConfidenceBound != null && Number.isFinite(Number(p.lowerConfidenceBound))
        ? Number(p.lowerConfidenceBound)
        : null,
      upperBound: p.upperConfidenceBound != null && Number.isFinite(Number(p.upperConfidenceBound))
        ? Number(p.upperConfidenceBound)
        : null
    }));

    const all = [...hist, ...fc];

    // Determine if transition between last historical and first forecast is consecutive
    let connects = false;
    if (hist.length > 0 && fc.length > 0) {
      const lastH = hist[hist.length - 1];
      const firstF = fc[0];
      const mH = getMonthIndex(lastH.date);
      const mF = getMonthIndex(firstF.date);
      if (mH !== null && mF !== null) {
        connects = mF === mH + 1 && lastH.cost !== null && firstF.cost !== null;
      }
    }

    // Determine Y range from actual data points (including confidence bounds)
    const validCosts = [];
    all.forEach(p => {
      if (p.cost !== null) validCosts.push(p.cost);
      if (p.lowerBound !== null) validCosts.push(p.lowerBound);
      if (p.upperBound !== null) validCosts.push(p.upperBound);
    });

    if (validCosts.length === 0) {
      return {
        points: all,
        canConnect: connects,
        yMin: 0,
        yMax: 100,
        yTicks: [0, 25, 50, 75, 100],
        isConstant: false
      };
    }

    const rawMin = Math.min(...validCosts);
    const rawMax = Math.max(...validCosts);
    const constant = Math.abs(rawMax - rawMin) < 0.001;

    let minAxis, maxAxis;
    if (constant) {
      minAxis = Math.max(0, Math.floor((rawMin - 5) / 5) * 5);
      maxAxis = Math.ceil((rawMax + 5) / 5) * 5;
    } else {
      const span = rawMax - rawMin;
      const pad = span * 0.12;
      minAxis = Math.max(0, Math.floor((rawMin - pad) / 5) * 5);
      maxAxis = Math.ceil((rawMax + pad) / 5) * 5;
    }

    if (minAxis === maxAxis) {
      maxAxis = minAxis + 10;
    }

    // Generate 5 evenly spaced ticks
    const step = (maxAxis - minAxis) / 4;
    const ticks = [0, 1, 2, 3, 4].map(i => Math.round((minAxis + i * step) * 10) / 10);

    return {
      points: all,
      canConnect: connects,
      yMin: minAxis,
      yMax: maxAxis,
      yTicks: ticks,
      isConstant: constant
    };
  }, [historicalPoints, forecastPoints]);

  // Chart dimensions (SVG coordinate space)
  const width = 940;
  const height = 340;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 55;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const totalPoints = points.length;
  const getX = idx => {
    if (totalPoints <= 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (totalPoints - 1)) * plotWidth;
  };

  const getY = val => {
    if (val === null || val === undefined || yMax === yMin) return padTop + plotHeight / 2;
    const norm = (val - yMin) / (yMax - yMin);
    return padTop + plotHeight - norm * plotHeight;
  };

  // Slice historical and forecast subsets
  const histSubset = points.filter(p => p.type === 'historical');
  const fcSubset = points.filter(p => p.type === 'forecast');

  // Build SVG path for Historical series (skipping nulls gracefully)
  const histPath = useMemo(() => {
    let d = '';
    let drawing = false;
    histSubset.forEach(p => {
      if (p.cost !== null) {
        const x = getX(p.idx);
        const y = getY(p.cost);
        if (!drawing) {
          d += `M ${x} ${y}`;
          drawing = true;
        } else {
          d += ` L ${x} ${y}`;
        }
      } else {
        drawing = false;
      }
    });
    return d;
  }, [histSubset, yMin, yMax]);

  // Build SVG area fill for Historical series
  const histArea = useMemo(() => {
    const valid = histSubset.filter(p => p.cost !== null);
    if (valid.length < 2) return '';
    const firstX = getX(valid[0].idx);
    const lastX = getX(valid[valid.length - 1].idx);
    const baseY = getY(yMin);

    let d = `M ${firstX} ${baseY}`;
    valid.forEach(p => {
      d += ` L ${getX(p.idx)} ${getY(p.cost)}`;
    });
    d += ` L ${lastX} ${baseY} Z`;
    return d;
  }, [histSubset, yMin, yMax]);

  // Build SVG path for Forecast series
  const fcPath = useMemo(() => {
    let d = '';
    fcSubset.forEach((p, i) => {
      if (p.cost !== null) {
        const x = getX(p.idx);
        const y = getY(p.cost);
        if (i === 0) d += `M ${x} ${y}`;
        else d += ` L ${x} ${y}`;
      }
    });
    return d;
  }, [fcSubset, yMin, yMax]);

  // Build connecting segment path from last historical to first forecast
  const connectionPath = useMemo(() => {
    if (!canConnect || histSubset.length === 0 || fcSubset.length === 0) return '';
    const lastH = histSubset[histSubset.length - 1];
    const firstF = fcSubset[0];
    if (lastH.cost === null || firstF.cost === null) return '';
    return `M ${getX(lastH.idx)} ${getY(lastH.cost)} L ${getX(firstF.idx)} ${getY(firstF.cost)}`;
  }, [canConnect, histSubset, fcSubset, yMin, yMax]);

  // Build 95% Confidence Interval band polygon
  const confidenceBandPolygon = useMemo(() => {
    const validFc = fcSubset.filter(p => p.lowerBound !== null && p.upperBound !== null);
    if (validFc.length === 0) return '';

    const upperPoints = [];
    const lowerPoints = [];

    if (canConnect && histSubset.length > 0) {
      const lastH = histSubset[histSubset.length - 1];
      if (lastH.cost !== null) {
        const x = getX(lastH.idx);
        const y = getY(lastH.cost);
        upperPoints.push(`${x},${y}`);
        lowerPoints.push(`${x},${y}`);
      }
    }

    validFc.forEach(p => {
      upperPoints.push(`${getX(p.idx)},${getY(p.upperBound)}`);
      lowerPoints.unshift(`${getX(p.idx)},${getY(p.lowerBound)}`);
    });

    return [...upperPoints, ...lowerPoints].join(' ');
  }, [canConnect, histSubset, fcSubset, yMin, yMax]);

  // X coordinate of transition between historical and forecast
  const transitionX = useMemo(() => {
    if (histSubset.length === 0 || fcSubset.length === 0) return null;
    const lastH = histSubset[histSubset.length - 1];
    const firstF = fcSubset[0];
    return (getX(lastH.idx) + getX(firstF.idx)) / 2;
  }, [histSubset, fcSubset]);

  const activePoint = hoveredPoint != null ? points[hoveredPoint] : null;

  return (
    <div className="space-y-4">

      {/* Mixed units warning if detected */}
      {hasMixedUnits && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Mixed Measurement Units Detected: </span>
            Batch records use multiple units of measure. Per-unit production costs cannot be directly compared across differing physical units without standardized conversions.
          </div>
        </div>
      )}

      {/* SVG Time-Series Chart */}
      <div className="relative w-full bg-gray-950/90 rounded-xl border border-gray-800 p-4 select-none">
        
        {/* Chart Header Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-gray-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Unit Production Cost:</span>
            <span className="font-extrabold text-white font-mono">
              ₹ / {hasMixedUnits ? 'unit (mixed)' : (unitOfMeasure || 'kg')}
            </span>
            {isConstant && (
              <span className="badge badge-amber text-[10px]">Stable (Constant Cost)</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="w-3.5 h-1 bg-emerald-500 rounded-full inline-block" />
              <span>Actual Historical</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-cyan-400 inline-block" />
              <span>Projected Forecast</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-3 h-2 bg-cyan-400/20 border border-cyan-400/40 rounded-sm inline-block" />
              <span>95% Confidence Band</span>
            </div>
          </div>
        </div>

        {/* The Responsive SVG Plot */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[380px] overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Emerald gradient for historical area */}
            <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Cyan gradient for confidence cone */}
            <linearGradient id="cyanConeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.20" />
            </linearGradient>

            {/* Subtle glow filter for active point */}
            <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map(val => {
            const y = getY(val);
            return (
              <g key={`ytick_${val}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#1f2937"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ₹{val}
                </text>
              </g>
            );
          })}

          {/* Historical Area Fill */}
          {histArea && (
            <path d={histArea} fill="url(#emeraldGrad)" />
          )}

          {/* Forecast 95% Confidence Band Polygon */}
          {confidenceBandPolygon && (
            <polygon
              points={confidenceBandPolygon}
              fill="url(#cyanConeGrad)"
              stroke="#06b6d4"
              strokeWidth="0.8"
              strokeDasharray="3,3"
              strokeOpacity="0.45"
            />
          )}

          {/* Transition Divider between Historical and Forecast */}
          {transitionX !== null && (
            <g>
              <line
                x1={transitionX}
                y1={padTop}
                x2={transitionX}
                y2={height - padBottom}
                stroke="#4b5563"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <rect
                x={transitionX - 44}
                y={padTop - 18}
                width="88"
                height="16"
                rx="4"
                fill="#111827"
                stroke="#374151"
                strokeWidth="1"
              />
              <text
                x={transitionX}
                y={padTop - 6}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="9"
                fontWeight="700"
                letterSpacing="0.04em"
              >
                FORECAST START
              </text>
            </g>
          )}

          {/* Solid Historical Trend Line */}
          {histPath && (
            <path
              d={histPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Connecting segment from actual history to forecast horizon */}
          {connectionPath && (
            <path
              d={connectionPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              strokeLinecap="round"
            />
          )}

          {/* Dashed Forecast Line */}
          {fcPath && (
            <path
              d={fcPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Historical Data Dots */}
          {histSubset.map(p => {
            if (p.cost === null) return null;
            const cx = getX(p.idx);
            const cy = getY(p.cost);
            const isHovered = hoveredPoint === p.idx;

            return (
              <g key={p.id}>
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="#10b981"
                    fillOpacity="0.3"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#10b981"
                  stroke="#022c22"
                  strokeWidth="2"
                  filter={isHovered ? 'url(#pointGlow)' : undefined}
                />
              </g>
            );
          })}

          {/* Forecast Data Dots (Diamonds/Accents) */}
          {fcSubset.map(p => {
            if (p.cost === null) return null;
            const cx = getX(p.idx);
            const cy = getY(p.cost);
            const isHovered = hoveredPoint === p.idx;

            return (
              <g key={p.id}>
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="#06b6d4"
                    fillOpacity="0.3"
                    className="animate-ping"
                  />
                )}
                <rect
                  x={cx - (isHovered ? 4.5 : 3.5)}
                  y={cy - (isHovered ? 4.5 : 3.5)}
                  width={isHovered ? 9 : 7}
                  height={isHovered ? 9 : 7}
                  transform={`rotate(45, ${cx}, ${cy})`}
                  fill="#06b6d4"
                  stroke="#082f49"
                  strokeWidth="2"
                  filter={isHovered ? 'url(#pointGlow)' : undefined}
                />
              </g>
            );
          })}

          {/* X-Axis Ticks & Labels */}
          {points.map(p => {
            const x = getX(p.idx);
            const label = formatTickLabel(p.date, p.monthLabel);
            const isFc = p.type === 'forecast';
            const isHovered = hoveredPoint === p.idx;

            return (
              <g key={`xtick_${p.id}`}>
                <line
                  x1={x}
                  y1={height - padBottom}
                  x2={x}
                  y2={height - padBottom + 5}
                  stroke={isFc ? '#0891b2' : '#374151'}
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padBottom + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : (isFc ? '#38bdf8' : '#9ca3af')}
                  fontSize="9.5"
                  fontWeight={isFc ? '600' : '400'}
                  fontFamily="sans-serif"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Hover Scrub Line & Target Hitboxes */}
          {points.map((p, i) => {
            const x = getX(p.idx);
            const leftBoundary = i === 0 ? padLeft : (getX(points[i - 1].idx) + x) / 2;
            const rightBoundary = i === points.length - 1 ? width - padRight : (getX(points[i + 1].idx) + x) / 2;

            return (
              <rect
                key={`hitbox_${p.id}`}
                x={leftBoundary}
                y={padTop}
                width={Math.max(1, rightBoundary - leftBoundary)}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p.idx)}
              />
            );
          })}

          {/* Active Hover Crosshair Line */}
          {activePoint && (
            <line
              x1={getX(activePoint.idx)}
              y1={padTop}
              x2={getX(activePoint.idx)}
              y2={height - padBottom}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="2,2"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none rounded-lg border border-gray-700 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-md transition-all text-xs space-y-1.5 min-w-[210px]"
            style={{
              left: `${Math.min(75, Math.max(5, (getX(activePoint.idx) / width) * 100))}%`,
              top: '14%'
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-800 pb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formatFullLabel(activePoint.date, activePoint.monthLabel)}
              </span>
              <span
                className={`badge text-[9px] ${
                  activePoint.type === 'forecast' ? 'badge-cyan' : 'badge-emerald'
                }`}
              >
                {activePoint.type === 'forecast' ? 'Statistical Forecast' : 'Actual Historical'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-gray-400 text-[11px]">Unit Production Cost:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  activePoint.type === 'forecast' ? 'text-cyan-300' : 'text-emerald-400'
                }`}
              >
                {activePoint.cost !== null ? `₹${activePoint.cost}` : 'Unavailable'}
                {activePoint.cost !== null && (
                  <span className="text-[10px] text-gray-500 font-normal"> / {unitOfMeasure || 'kg'}</span>
                )}
              </span>
            </div>

            {activePoint.type === 'forecast' && activePoint.lowerBound !== null && (
              <div className="text-[10px] text-gray-400 border-t border-gray-800/80 pt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>95% Confidence Interval:</span>
                  <span className="font-mono text-gray-200">
                    ₹{activePoint.lowerBound} – ₹{activePoint.upperBound}
                  </span>
                </div>
              </div>
            )}

            {activePoint.type === 'historical' && activePoint.productionQuantity != null && (
              <div className="text-[10px] text-gray-400 border-t border-gray-800/80 pt-1 flex justify-between">
                <span>Batch Quantity:</span>
                <span className="font-mono text-gray-300">{activePoint.productionQuantity} {unitOfMeasure || 'kg'}</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
