import React, { useState, useEffect } from 'react';
import { 
  Truck, Star, ShieldCheck, Award, Clock, DollarSign, Plus, CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

export default function SupplierAnalysis() {
  const [selectedMaterial, setSelectedMaterial] = useState('Mango Pulp (Alphonso)');
  
  const [suppliers, setSuppliers] = useState([
    {
      id: 'sup_01',
      name: 'AgroFresh Pulps Ltd',
      materialName: 'Mango Pulp (Alphonso)',
      unitPrice: 85,
      unitOfMeasure: 'kg',
      leadTimeDays: 4,
      moq: 500,
      transportCostPerUnit: 3.5,
      qualityRating: 4.8,
      reliabilityScorePct: 96
    },
    {
      id: 'sup_02',
      name: 'Global Fruit Processing Corp',
      materialName: 'Mango Pulp (Alphonso)',
      unitPrice: 79,
      unitOfMeasure: 'kg',
      leadTimeDays: 8,
      moq: 1500,
      transportCostPerUnit: 6.0,
      qualityRating: 4.3,
      reliabilityScorePct: 88
    },
    {
      id: 'sup_03',
      name: 'PureSugar Refineries',
      materialName: 'Refined Sugar',
      unitPrice: 42,
      unitOfMeasure: 'kg',
      leadTimeDays: 2,
      moq: 1000,
      transportCostPerUnit: 1.2,
      qualityRating: 4.9,
      reliabilityScorePct: 99
    }
  ]);

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setSuppliers(data.data);
          if (!data.data.some(s => s.materialName === selectedMaterial)) {
            setSelectedMaterial(data.data[0].materialName);
          }
        }
      })
      .catch(err => console.warn('Could not fetch suppliers from server:', err.message));
  }, []);

  const materialsList = Array.from(new Set(suppliers.map(s => s.materialName)));
  const filteredSuppliers = suppliers.filter(s => s.materialName === selectedMaterial);

  // Compute Landed Cost = unitPrice + transportCostPerUnit
  const analyzed = filteredSuppliers.map(s => {
    const landedCost = s.unitPrice + s.transportCostPerUnit;
    return {
      ...s,
      landedCost
    };
  }).sort((a, b) => a.landedCost - b.landedCost);

  const cheapest = analyzed[0];
  const highestQuality = [...analyzed].sort((a, b) => b.qualityRating - a.qualityRating)[0];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <span className="badge badge-cyan text-[10px] mb-1">Procurement & Logistics</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Supplier & Raw Material Analysis</h1>
          <p className="text-xs text-gray-400">Evaluate Landed Unit Costs, Lead Times, MOQ thresholds, and Supplier Quality Ratings.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="input-field text-xs py-2 px-3 bg-gray-900 border-gray-700 text-white font-semibold"
          >
            {materialsList.map((m, idx) => (
              <option key={idx} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Lowest Landed Cost Winner */}
        {cheapest && (
          <div className="card bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-900 border-emerald-500/30 p-5 space-y-3">
            <div className="flex justify-between items-start">
              <span className="badge badge-emerald">Lowest Effective Landed Cost</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{cheapest.name}</h4>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">₹{cheapest.landedCost} / kg</span>
            </div>
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-800 space-y-1">
              <div className="flex justify-between">
                <span>Base Price:</span> <span className="text-white font-mono">₹{cheapest.unitPrice}/kg</span>
              </div>
              <div className="flex justify-between">
                <span>Transport Logistics:</span> <span className="text-white font-mono">₹{cheapest.transportCostPerUnit}/kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Highest Quality Supplier */}
        {highestQuality && (
          <div className="card bg-gradient-to-br from-cyan-950/40 via-gray-900 to-gray-900 border-cyan-500/30 p-5 space-y-3">
            <div className="flex justify-between items-start">
              <span className="badge badge-cyan">Highest Quality Rating</span>
              <Award className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{highestQuality.name}</h4>
              <div className="flex items-center gap-1 text-cyan-400 font-bold text-lg">
                <Star className="w-5 h-5 fill-cyan-400" />
                <span>{highestQuality.qualityRating} / 5.0</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-800 space-y-1">
              <div className="flex justify-between">
                <span>Reliability Score:</span> <span className="text-white font-bold">{highestQuality.reliabilityScorePct}%</span>
              </div>
              <div className="flex justify-between">
                <span>Landed Unit Cost:</span> <span className="text-white font-mono">₹{highestQuality.landedCost}/kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Trade-off Overview */}
        <div className="card bg-gray-900 border-gray-800 p-5 space-y-3">
          <span className="badge badge-amber">Procurement Insight</span>
          <h4 className="text-sm font-bold text-white">Procurement Trade-off Summary</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Supplier A offers a 7% lower base price but requires 2x higher Minimum Order Quantity (MOQ) and 4 additional lead time days.
          </p>
        </div>

      </div>

      {/* Multi-Supplier Comparison Table */}
      <div className="card space-y-4">
        <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3">
          Supplier Quote Matrix for: <span className="text-emerald-400">{selectedMaterial}</span>
        </h3>

        <div className="custom-table-container">
          <table className="custom-table text-xs">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Base Unit Price (₹)</th>
                <th>Transport Cost (₹)</th>
                <th>Net Landed Cost (₹)</th>
                <th>Lead Time (Days)</th>
                <th>MOQ Threshold</th>
                <th>Quality Rating</th>
                <th>Reliability</th>
              </tr>
            </thead>
            <tbody>
              {analyzed.map((sup, idx) => (
                <tr key={sup.id} className={idx === 0 ? 'bg-emerald-950/20 font-semibold' : ''}>
                  <td className="font-bold text-white">
                    {sup.name}
                    {idx === 0 && <span className="ml-2 badge badge-emerald text-[9px]">Best Landed Price</span>}
                  </td>
                  <td className="font-mono text-gray-300">₹{sup.unitPrice}</td>
                  <td className="font-mono text-gray-300">₹{sup.transportCostPerUnit}</td>
                  <td className="font-mono font-bold text-emerald-400 text-sm">₹{sup.landedCost} / kg</td>
                  <td className="text-gray-300">{sup.leadTimeDays} days</td>
                  <td className="font-mono text-gray-300">{sup.moq} kg</td>
                  <td>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{sup.qualityRating}</span>
                    </div>
                  </td>
                  <td className="font-bold text-cyan-400">{sup.reliabilityScorePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
