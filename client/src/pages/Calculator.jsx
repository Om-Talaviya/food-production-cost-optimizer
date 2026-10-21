import React, { useState, useEffect } from 'react';
import { 
  Calculator as CalcIcon, Plus, Trash2, Save, RotateCcw, 
  DollarSign, Package, Zap, Truck, AlertTriangle, CheckCircle2, Bookmark
} from 'lucide-react';
import { calculateBatchEconomics, formatCurrency } from '../utils/calculator';
import { SAMPLE_BATCH_PRESETS } from '../utils/sampleData';

export default function Calculator({ activeBatch, onSaveBatch, onNavigate }) {
  const [productName, setProductName] = useState(activeBatch?.productName || 'New Food Recipe');
  const [productCategory, setProductCategory] = useState(activeBatch?.productCategory || 'General Food');
  const [batchQuantity, setBatchQuantity] = useState(activeBatch?.batchQuantity || 1000);
  const [unitOfMeasure, setUnitOfMeasure] = useState(activeBatch?.unitOfMeasure || 'kg');
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState(activeBatch?.sellingPricePerUnit || 150);

  const [packagingCost, setPackagingCost] = useState(activeBatch?.packagingCost || 15000);
  const [labourCost, setLabourCost] = useState(activeBatch?.labourCost || 12000);
  const [energyCost, setEnergyCost] = useState(activeBatch?.energyCost || 6000);
  const [waterUtilitiesCost, setWaterUtilitiesCost] = useState(activeBatch?.waterUtilitiesCost || 1500);
  const [transportLogisticsCost, setTransportLogisticsCost] = useState(activeBatch?.transportLogisticsCost || 3500);
  const [overheadCost, setOverheadCost] = useState(activeBatch?.overheadCost || 8000);
  const [wastagePercentage, setWastagePercentage] = useState(activeBatch?.wastagePercentage || 5.0);

  const [ingredients, setIngredients] = useState(
    activeBatch?.ingredients || [
      { name: 'Primary Ingredient A', quantity: 500, unit: 'kg', unitPrice: 80 },
      { name: 'Secondary Ingredient B', quantity: 300, unit: 'kg', unitPrice: 45 },
      { name: 'Additive / Spice C', quantity: 5, unit: 'kg', unitPrice: 300 }
    ]
  );

  const [saveNotification, setSaveNotification] = useState(null);

  // Sync if activeBatch prop changes
  useEffect(() => {
    if (activeBatch) {
      setProductName(activeBatch.productName || 'Food Recipe');
      setProductCategory(activeBatch.productCategory || 'General Food');
      setBatchQuantity(activeBatch.batchQuantity || 1000);
      setUnitOfMeasure(activeBatch.unitOfMeasure || 'kg');
      setSellingPricePerUnit(activeBatch.sellingPricePerUnit || 150);
      setPackagingCost(activeBatch.packagingCost || 0);
      setLabourCost(activeBatch.labourCost || 0);
      setEnergyCost(activeBatch.energyCost || 0);
      setWaterUtilitiesCost(activeBatch.waterUtilitiesCost || 0);
      setTransportLogisticsCost(activeBatch.transportLogisticsCost || 0);
      setOverheadCost(activeBatch.overheadCost || 0);
      setWastagePercentage(activeBatch.wastagePercentage || 0);
      setIngredients(activeBatch.ingredients || []);
    }
  }, [activeBatch]);

  // Compute live economics
  const economics = calculateBatchEconomics({
    batchQuantity,
    unitOfMeasure,
    sellingPricePerUnit,
    packagingCost,
    labourCost,
    energyCost,
    waterUtilitiesCost,
    transportLogisticsCost,
    overheadCost,
    wastagePercentage,
    ingredients
  });

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 10, unit: unitOfMeasure, unitPrice: 50 }]);
  };

  const handleRemoveIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx, field, val) => {
    const updated = [...ingredients];
    updated[idx][field] = field === 'name' || field === 'unit' ? val : Number(val);
    setIngredients(updated);
  };

  const handleLoadPreset = (preset) => {
    setProductName(preset.productName);
    setProductCategory(preset.productCategory);
    setBatchQuantity(preset.batchQuantity);
    setUnitOfMeasure(preset.unitOfMeasure);
    setSellingPricePerUnit(preset.sellingPricePerUnit);
    setPackagingCost(preset.packagingCost);
    setLabourCost(preset.labourCost);
    setEnergyCost(preset.energyCost);
    setWaterUtilitiesCost(preset.waterUtilitiesCost);
    setTransportLogisticsCost(preset.transportLogisticsCost);
    setOverheadCost(preset.overheadCost);
    setWastagePercentage(preset.wastagePercentage);
    setIngredients(preset.ingredients);
  };

  const handleSave = () => {
    const batchObj = {
      id: activeBatch?.id,
      productName,
      productCategory,
      batchQuantity,
      unitOfMeasure,
      sellingPricePerUnit,
      packagingCost,
      labourCost,
      energyCost,
      waterUtilitiesCost,
      transportLogisticsCost,
      overheadCost,
      wastagePercentage,
      ingredients,
      economics
    };
    onSaveBatch(batchObj);
    setSaveNotification('Batch Saved Successfully!');
    setTimeout(() => setSaveNotification(null), 3000);
  };

  return (
    <div className="space-y-8">
      
      {/* Header & Quick Presets Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <span className="badge badge-emerald text-[10px] mb-1">Production Economics Engine</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Batch Cost Calculator</h1>
          <p className="text-xs text-gray-400">Enter raw material recipe costs and operational parameters to calculate full unit cost economics.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg p-1">
            <span className="text-[11px] text-gray-400 font-semibold px-2">Presets:</span>
            {SAMPLE_BATCH_PRESETS.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => handleLoadPreset(p)}
                className="btn btn-secondary text-[10px] py-1 px-2"
              >
                {p.productName.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            className="btn btn-primary text-xs py-2 px-4 shadow-lg shadow-emerald-950/50"
          >
            <Save className="w-4 h-4" />
            <span>Save Batch</span>
          </button>
        </div>
      </div>

      {saveNotification && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Real-Time Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Product Basics */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 border-b border-gray-800 pb-2">
              1. Product & Batch Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Mango Jam, Biscuits"
                />
              </div>

              <div>
                <label className="input-label">Category</label>
                <input
                  type="text"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Preserves, Beverages"
                />
              </div>

              <div>
                <label className="input-label">Batch Production Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(Number(e.target.value))}
                  className="input-field font-semibold text-emerald-400"
                />
              </div>

              <div>
                <label className="input-label">Unit of Measure (UOM)</label>
                <select
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  className="input-field"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="L">Liters (L)</option>
                  <option value="units">Units / Packs</option>
                  <option value="g">Grams (g)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Target Selling Price per {unitOfMeasure} (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={sellingPricePerUnit}
                  onChange={(e) => setSellingPricePerUnit(Number(e.target.value))}
                  className="input-field font-bold text-cyan-400"
                />
              </div>

              <div>
                <label className="input-label">Expected Process Wastage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="0.1"
                  value={wastagePercentage}
                  onChange={(e) => setWastagePercentage(Number(e.target.value))}
                  className="input-field font-bold text-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Raw Materials Table */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
                2. Raw Materials & Formulation Ingredients
              </h3>
              <button
                onClick={handleAddIngredient}
                className="btn btn-secondary text-xs py-1 px-3"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-900/60 p-2.5 rounded-lg border border-gray-800">
                  <div className="col-span-4 sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Ingredient Name"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                      className="input-field text-xs py-1.5"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="0"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                      className="input-field text-xs py-1.5"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 font-mono">₹</span>
                      <input
                        type="number"
                        placeholder="Price/unit"
                        min="0"
                        value={ing.unitPrice}
                        onChange={(e) => handleIngredientChange(idx, 'unitPrice', e.target.value)}
                        className="input-field text-xs py-1.5"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-2">
                    <span className="text-xs font-bold text-white font-mono hidden sm:inline">
                      {formatCurrency(ing.quantity * ing.unitPrice)}
                    </span>
                    <button
                      onClick={() => handleRemoveIngredient(idx)}
                      className="text-gray-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-gray-300 pt-2 border-t border-gray-800">
              <span>Total Raw Material Cost:</span>
              <span className="text-emerald-400 font-mono text-sm">{formatCurrency(economics.rawMaterialCost)}</span>
            </div>
          </div>

          {/* Section 3: Operational Costs */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 border-b border-gray-800 pb-2">
              3. Packaging, Labour & Overhead Expenses
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Packaging Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Direct Labour Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={labourCost}
                  onChange={(e) => setLabourCost(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Electricity / Energy Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={energyCost}
                  onChange={(e) => setEnergyCost(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Water & Utilities (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={waterUtilitiesCost}
                  onChange={(e) => setWaterUtilitiesCost(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Transportation & Logistics (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={transportLogisticsCost}
                  onChange={(e) => setTransportLogisticsCost(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Fixed Plant Overheads (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={overheadCost}
                  onChange={(e) => setOverheadCost(Number(e.target.value))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Real-Time Economics Output Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="card bg-gray-900 border-emerald-500/40 p-6 space-y-5 sticky top-20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Calculated Economics</span>
              <span className="badge badge-emerald">Live Updates</span>
            </div>

            <div className="space-y-4">
              
              <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800">
                <span className="text-xs text-gray-400 block">Total Batch Production Cost</span>
                <span className="text-3xl font-extrabold text-white">{formatCurrency(economics.totalProductionCost)}</span>
              </div>

              <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800">
                <span className="text-xs text-gray-400 block">Cost Per Sellable {unitOfMeasure}</span>
                <span className="text-2xl font-extrabold text-emerald-400">₹{economics.costPerUnit} / {unitOfMeasure}</span>
                <span className="text-[11px] text-gray-500 block mt-1">
                  Net Sellable Quantity: {economics.sellableQuantity} {unitOfMeasure} (Wastage: {economics.wastageQuantity} {unitOfMeasure})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block">Gross Profit</span>
                  <span className={`text-lg font-bold ${economics.grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(economics.grossProfit)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block">Profit Margin %</span>
                  <span className={`text-lg font-bold ${economics.profitMarginPercentage >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {economics.profitMarginPercentage}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Break-Even Batch Volume:</span>
                  <span className="font-bold text-purple-300">
                    {economics.breakEvenQuantity === null || economics.breakEvenQuantity === undefined ? '—' : economics.breakEvenQuantity} {unitOfMeasure}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Break-Even Selling Price:</span>
                  <span className="font-bold text-purple-300">₹{economics.breakEvenSellingPrice} / {unitOfMeasure}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => onNavigate('whatif')}
                  className="w-full btn btn-primary text-xs py-2.5"
                >
                  Test What-If Scenarios &rarr;
                </button>

                <button
                  onClick={() => onNavigate('optimizer')}
                  className="w-full btn btn-secondary text-xs py-2.5"
                >
                  Run Cost Optimization &rarr;
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
