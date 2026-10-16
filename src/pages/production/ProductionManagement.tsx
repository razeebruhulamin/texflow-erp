import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import {
  ProductionRecipe,
  ProductionJob,
  Product,
  Warehouse,
  StockBalance
} from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Cog,
  Calculator,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Boxes,
  ArrowRight,
  Sparkles,
  X,
  FileSpreadsheet,
  Clock,
  Sliders,
  DollarSign
} from 'lucide-react';

export const ProductionManagement: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [activeTab, setActiveTab] = useState<'ESTIMATOR' | 'JOBS' | 'BOMS'>('ESTIMATOR');

  const recipes = useMemo(() => StorageRepository.getProductionRecipes(orgId), [orgId, dataVersion]);
  const jobs = useMemo(() => StorageRepository.getProductionJobs(orgId), [orgId, dataVersion]);
  const products = useMemo(() => StorageRepository.getProducts(orgId), [orgId, dataVersion]);
  const warehouses = useMemo(() => StorageRepository.getWarehouses(orgId), [orgId, dataVersion]);
  const stockBalances = useMemo(() => StorageRepository.getStockBalances(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // =========================================================================
  // INTERACTIVE PRODUCTION ESTIMATOR STATE
  // =========================================================================
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  const [estimationMode, setEstimationMode] = useState<'BY_INPUT' | 'BY_OUTPUT'>('BY_INPUT');
  const [inputQuantityInput, setInputQuantityInput] = useState<number>(1000);
  const [targetOutputInput, setTargetOutputInput] = useState<number>(850);
  const [overrideYieldPercent, setOverrideYieldPercent] = useState<number>(85);

  const selectedRecipe = useMemo(() => {
    return recipes.find(r => r.id === selectedRecipeId) || recipes[0];
  }, [recipes, selectedRecipeId]);

  // Keep yield synced with recipe when recipe changes
  React.useEffect(() => {
    if (selectedRecipe) {
      setOverrideYieldPercent(selectedRecipe.expectedYieldPercent);
    }
  }, [selectedRecipeId]);

  // Calculations for Estimator
  const estimationResult = useMemo(() => {
    if (!selectedRecipe) return null;

    const yieldDecimal = Math.max(0.01, overrideYieldPercent / 100);
    const wastagePercent = Math.max(0, 100 - overrideYieldPercent);

    let calculatedInput = inputQuantityInput;
    let calculatedOutput = targetOutputInput;

    if (estimationMode === 'BY_INPUT') {
      calculatedOutput = Math.round(calculatedInput * yieldDecimal * 10) / 10;
    } else {
      calculatedInput = Math.round((calculatedOutput / yieldDecimal) * 10) / 10;
    }

    const calculatedWastage = Math.round((calculatedInput - calculatedOutput) * 10) / 10;

    // Check raw material stock availability in warehouse
    const primaryInput = selectedRecipe.inputItems[0];
    const rawProd = products.find(p => p.id === primaryInput?.productId);
    const totalRawInStock = stockBalances
      .filter(b => b.productId === primaryInput?.productId)
      .reduce((sum, b) => sum + b.quantityOnHand, 0);

    const hasShortage = totalRawInStock < calculatedInput;
    const shortageAmount = Math.max(0, calculatedInput - totalRawInStock);

    // Cost estimations
    const rawMaterialCost = calculatedInput * (rawProd?.currentWeightedAvgCost || primaryInput?.unitCostEstimate || 320);
    const laborCost = calculatedOutput * (selectedRecipe.estimatedLaborCost || 15);
    const dyeChemCost = calculatedOutput * (selectedRecipe.estimatedChemicalDyeCost || 0);
    const overheadCost = calculatedOutput * (selectedRecipe.estimatedMachineOverheadCost || 12);
    const totalEstimatedCost = rawMaterialCost + laborCost + dyeChemCost + overheadCost;
    const estimatedCostPerUnit = calculatedOutput > 0 ? Math.round((totalEstimatedCost / calculatedOutput) * 100) / 100 : 0;

    return {
      calculatedInput,
      calculatedOutput,
      calculatedWastage,
      yieldPercent: overrideYieldPercent,
      wastagePercent,
      totalRawInStock,
      hasShortage,
      shortageAmount,
      rawMaterialCost,
      laborCost,
      dyeChemCost,
      overheadCost,
      totalEstimatedCost,
      estimatedCostPerUnit,
      primaryInput,
      rawProd
    };
  }, [selectedRecipe, overrideYieldPercent, estimationMode, inputQuantityInput, targetOutputInput, stockBalances, products]);

  // =========================================================================
  // JOB COMPLETION MODAL STATE
  // =========================================================================
  const [completingJob, setCompletingJob] = useState<ProductionJob | null>(null);
  const [completeInputQty, setCompleteInputQty] = useState<number>(0);
  const [completeOutputQty, setCompleteOutputQty] = useState<number>(0);
  const [completeWastageQty, setCompleteWastageQty] = useState<number>(0);
  const [completeLaborCost, setCompleteLaborCost] = useState<number>(0);
  const [completeChemCost, setCompleteChemCost] = useState<number>(0);
  const [completeOverheadCost, setCompleteOverheadCost] = useState<number>(0);
  const [completeDestWarehouseId, setCompleteDestWarehouseId] = useState<string>('');

  const handleOpenCompleteJob = (job: ProductionJob) => {
    setCompletingJob(job);
    setCompleteInputQty(job.estimatedInputQuantity);
    setCompleteOutputQty(job.estimatedOutputQuantity);
    setCompleteWastageQty(job.estimatedInputQuantity - job.estimatedOutputQuantity);
    setCompleteLaborCost(job.directLaborCost || job.estimatedOutputQuantity * 15);
    setCompleteChemCost(job.dyeChemicalCost || 0);
    setCompleteOverheadCost(job.overheadCost || job.estimatedOutputQuantity * 12);
    setCompleteDestWarehouseId(job.destinationWarehouseId || warehouses[1]?.id || warehouses[0]?.id || '');
  };

  const handleExecuteJobComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingJob) return;

    const res = StorageRepository.completeProductionJob(
      completingJob.id,
      completeInputQty,
      completeOutputQty,
      completeWastageQty,
      completeLaborCost,
      completeChemCost,
      completeOverheadCost,
      completeDestWarehouseId,
      currentUser
    );

    if (res.success) {
      notify(res.message, 'success');
      refreshData();
      setCompletingJob(null);
    } else {
      notify(res.message, 'error');
    }
  };

  // Create Job from Current Estimate
  const handleLaunchJobFromEstimate = () => {
    if (!selectedRecipe || !estimationResult) return;

    if (estimationResult.hasShortage && !currentOrg?.negativeStockAllowed) {
      notify(`Cannot launch job! Shortage of ${estimationResult.shortageAmount} kg in raw material stock.`, 'error');
      return;
    }

    const sourceWh = warehouses[0]?.id || 'wh-1';
    const destWh = warehouses.length > 1 ? warehouses[1]?.id : warehouses[0]?.id || 'wh-1';

    const newJob: ProductionJob = {
      id: `job-${Date.now()}`,
      organizationId: orgId,
      jobNumber: `${currentOrg?.jobPrefix || 'JOB'}-${Date.now().toString().slice(-4)}`,
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.name,
      processType: selectedRecipe.processType,
      sourceWarehouseId: sourceWh,
      destinationWarehouseId: destWh,
      status: 'IN_PROGRESS',
      startDate: new Date().toISOString(),
      targetOutputProduct: selectedRecipe.outputProductName,
      targetOutputProductId: selectedRecipe.outputProductId,
      estimatedInputQuantity: estimationResult.calculatedInput,
      estimatedOutputQuantity: estimationResult.calculatedOutput,
      expectedYieldPercent: estimationResult.yieldPercent,
      expectedWastagePercent: estimationResult.wastagePercent,
      actualInputQuantity: estimationResult.calculatedInput,
      actualOutputQuantity: 0,
      actualWastageQuantity: 0,
      actualYieldPercent: 0,
      inputUnit: estimationResult.primaryInput?.unit || 'kg',
      outputUnit: 'kg',
      inputBatchLot: 'YRN-SPIN-LOT-44',
      outputBatchLot: `ROLL-${Date.now().toString().slice(-4)}`,
      rawMaterialCost: estimationResult.rawMaterialCost,
      directLaborCost: estimationResult.laborCost,
      dyeChemicalCost: estimationResult.dyeChemCost,
      overheadCost: estimationResult.overheadCost,
      totalProductionCost: estimationResult.totalEstimatedCost,
      calculatedCostPerUnit: estimationResult.estimatedCostPerUnit,
      supervisor: currentUser.name,
      notes: `Launched from Production Estimator at ${estimationResult.yieldPercent}% expected yield`
    };

    StorageRepository.saveProductionJob(newJob);
    StorageRepository.logAction(
      orgId,
      'LAUNCH_PRODUCTION_JOB',
      'PRODUCTION',
      `Production job ${newJob.jobNumber} launched for ${newJob.targetOutputProduct}. Target: ${newJob.estimatedOutputQuantity} kg.`,
      currentUser.name
    );

    refreshData();
    notify(`Production Job ${newJob.jobNumber} is now IN PROGRESS on factory floor!`, 'success');
    setActiveTab('JOBS');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Textile Production & Conversion Engine"
        subtitle="Manage knitting and dyeing recipes (BOM), two-way output yield estimation, material issuance, and finished fabric receipts."
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <button
              onClick={() => setActiveTab('ESTIMATOR')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'ESTIMATOR' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Production Estimator</span>
            </button>
            <button
              onClick={() => setActiveTab('JOBS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'JOBS' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cog className="w-3.5 h-3.5" />
              <span>Job Register ({jobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('BOMS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'BOMS' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>BOM Recipes ({recipes.length})</span>
            </button>
          </div>
        }
      />

      {/* ================================================================= */}
      {/* TAB 1: INTERACTIVE PRODUCTION ESTIMATOR (SCENARIO B FOCUS)        */}
      {/* ================================================================= */}
      {activeTab === 'ESTIMATOR' && (
        <div className="space-y-6">
          {/* Top Recipe & Formula Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block">
                  Step 1: Select Production Process & BOM Recipe
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Circular Knitting & Fabric Conversion Calculator
                </h3>
              </div>
              <div className="w-full md:w-96">
                <select
                  value={selectedRecipeId}
                  onChange={e => setSelectedRecipeId(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                >
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code}) - {r.processType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recipe Details Pill Bar */}
            {selectedRecipe && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">Input Raw Material</span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5">
                    {selectedRecipe.inputItems[0]?.productName}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">Finished Output Fabric</span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5">
                    {selectedRecipe.outputProductName}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">Process Standard Yield</span>
                  <span className="font-bold text-teal-700 block mt-0.5">
                    {selectedRecipe.expectedYieldPercent}% (Wastage: {selectedRecipe.expectedWastagePercent}%)
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">Process Type</span>
                  <span className="font-bold text-indigo-700 block mt-0.5">
                    {selectedRecipe.processType} Floor
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Calculator Core Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 columns: Two-way Input Controls & Sliders */}
            <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Step 2: Estimation Mode (Two-Way Calculation)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEstimationMode('BY_INPUT')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      estimationMode === 'BY_INPUT'
                        ? 'border-teal-600 bg-teal-50/60 text-teal-900 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">Based on Available Raw Yarn</div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                      Input Qty → Calculate Output
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstimationMode('BY_OUTPUT')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      estimationMode === 'BY_OUTPUT'
                        ? 'border-teal-600 bg-teal-50/60 text-teal-900 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">Based on Target Order Fabric</div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                      Target Output → Calculate Raw Input
                    </div>
                  </button>
                </div>
              </div>

              {/* Input Value Control */}
              {estimationMode === 'BY_INPUT' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Enter Available Input Yarn Quantity ({estimationResult?.primaryInput?.unit || 'kg'}):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inputQuantityInput}
                    onChange={e => setInputQuantityInput(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg text-lg font-bold text-teal-800 focus:outline-none focus:border-teal-600"
                    placeholder="e.g. 1000"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formula: Estimated Finished Output = {inputQuantityInput} kg × {overrideYieldPercent}% yield
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Enter Desired Target Finished Fabric Quantity (kg):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetOutputInput}
                    onChange={e => setTargetOutputInput(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg text-lg font-bold text-teal-800 focus:outline-none focus:border-teal-600"
                    placeholder="e.g. 850"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formula: Required Raw Yarn = {targetOutputInput} kg ÷ {overrideYieldPercent}% yield
                  </p>
                </div>
              )}

              {/* Interactive Yield % Slider */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-teal-600" />
                    <span>Expected Production Yield Rate:</span>
                  </label>
                  <span className="text-sm font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {overrideYieldPercent}% (Wastage: {100 - overrideYieldPercent}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={overrideYieldPercent}
                  onChange={e => setOverrideYieldPercent(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>50% (High Wastage)</span>
                  <span>85% (Knitting Standard)</span>
                  <span>100% (Zero Loss)</span>
                </div>
              </div>

              {/* Warehouse Inventory Stock Verification */}
              {estimationResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    estimationResult.hasShortage
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {estimationResult.hasShortage ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>
                      {estimationResult.hasShortage
                        ? 'Stock Shortage Warning'
                        : 'Sufficient Raw Material in Warehouse'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    Available in stock: <strong>{estimationResult.totalRawInStock.toLocaleString()} kg</strong> |
                    Required for job: <strong>{estimationResult.calculatedInput.toLocaleString()} kg</strong>.
                    {estimationResult.hasShortage && (
                      <span className="block font-bold text-amber-800 mt-0.5">
                        Deficit: {estimationResult.shortageAmount.toLocaleString()} kg required to procure.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Right 6 columns: Real-time Calculation Summary & Unit Costing */}
            {estimationResult && (
              <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs uppercase tracking-wider text-teal-400 font-semibold">
                      Estimation Results & Costing Breakdown
                    </span>
                    <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded text-slate-300 font-mono">
                      Yield: {estimationResult.yieldPercent}%
                    </span>
                  </div>

                  {/* Quantity Conversions Hero */}
                  <div className="grid grid-cols-3 gap-3 my-5 text-center">
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                      <span className="text-[11px] text-slate-400 block">Raw Input</span>
                      <span className="text-xl font-bold text-slate-100 block mt-1">
                        {estimationResult.calculatedInput.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">{estimationResult.primaryInput?.unit}</span>
                    </div>

                    <div className="bg-teal-950/80 p-3 rounded-lg border border-teal-700">
                      <span className="text-[11px] text-teal-300 block">Finished Fabric</span>
                      <span className="text-xl font-bold text-teal-200 block mt-1">
                        {estimationResult.calculatedOutput.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-teal-400">kg output</span>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                      <span className="text-[11px] text-rose-300 block">Lint / Scrap</span>
                      <span className="text-xl font-bold text-rose-200 block mt-1">
                        {estimationResult.calculatedWastage.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">kg wastage</span>
                    </div>
                  </div>

                  {/* Detailed Cost Breakdown Table */}
                  <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                    <div className="flex justify-between text-slate-300">
                      <span>Raw Material Cost:</span>
                      <span className="font-semibold text-white font-mono">
                        {currency} {estimationResult.rawMaterialCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Direct Knitting Labor ({currency}15/kg):</span>
                      <span className="font-semibold text-white font-mono">
                        {currency} {estimationResult.laborCost.toLocaleString()}
                      </span>
                    </div>
                    {estimationResult.dyeChemCost > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>Dyeing & Chemicals:</span>
                        <span className="font-semibold text-white font-mono">
                          {currency} {estimationResult.dyeChemCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-300">
                      <span>Machine & Factory Overhead ({currency}12/kg):</span>
                      <span className="font-semibold text-white font-mono">
                        {currency} {estimationResult.overheadCost.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-teal-300 pt-2 border-t border-slate-800">
                      <span>Total Estimated Production Cost:</span>
                      <span className="font-mono">{currency} {estimationResult.totalEstimatedCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Final Cost per Finished Unit & Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Estimated Cost per Finished kg:</span>
                    <span className="text-2xl font-bold text-teal-400 font-mono">
                      {currency} {estimationResult.estimatedCostPerUnit} <span className="text-xs text-slate-400">/ kg</span>
                    </span>
                  </div>

                  <button
                    onClick={handleLaunchJobFromEstimate}
                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Production Job</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: PRODUCTION JOB REGISTER & WORKFLOW EXECUTION               */}
      {/* ================================================================= */}
      {activeTab === 'JOBS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Job Number</th>
                    <th className="px-4 py-3">Process / Recipe</th>
                    <th className="px-4 py-3">Target Output Fabric</th>
                    <th className="px-4 py-3 text-right">Raw Consumed</th>
                    <th className="px-4 py-3 text-right">Finished Output</th>
                    <th className="px-4 py-3 text-center">Yield %</th>
                    <th className="px-4 py-3 text-right">Batch Cost</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        No production jobs recorded.
                      </td>
                    </tr>
                  ) : (
                    jobs.map(job => {
                      const isComplete = job.status === 'COMPLETED';

                      return (
                        <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                            {job.jobNumber}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{job.recipeName}</div>
                            <div className="text-[10px] text-slate-400">{job.processType}</div>
                          </td>

                          <td className="px-4 py-3 font-medium text-slate-900">
                            {job.targetOutputProduct}
                          </td>

                          <td className="px-4 py-3 text-right text-slate-700">
                            {isComplete ? job.actualInputQuantity : job.estimatedInputQuantity} {job.inputUnit}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-teal-800">
                            {isComplete ? `${job.actualOutputQuantity} ${job.outputUnit}` : `Est: ${job.estimatedOutputQuantity} ${job.outputUnit}`}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-slate-800">
                              {isComplete ? `${job.actualYieldPercent}%` : `${job.expectedYieldPercent}% (Est)`}
                            </span>
                            {isComplete && job.actualWastageQuantity > 0 && (
                              <div className="text-[10px] text-rose-500">
                                {job.actualWastageQuantity} kg scrap
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            {currency} {job.totalProductionCost.toLocaleString()}
                            <div className="text-[10px] text-slate-400">
                              {currency}{job.calculatedCostPerUnit} / unit
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={job.status} />
                          </td>

                          <td className="px-4 py-3 text-center">
                            {!isComplete ? (
                              <button
                                onClick={() => handleOpenCompleteJob(job)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-sm transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Complete Job</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Stock In</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: BILL OF MATERIALS (BOM) & RECIPES LIST                     */}
      {/* ================================================================= */}
      {activeTab === 'BOMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map(rec => (
            <div key={rec.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    {rec.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{rec.name}</h3>
                  <p className="text-xs text-slate-500">{rec.processType} Conversion Recipe</p>
                </div>
                <Badge variant="success">{rec.expectedYieldPercent}% Yield</Badge>
              </div>

              <div className="text-xs space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Output Target:</span>
                  <span className="font-semibold text-slate-900">{rec.outputProductName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Standard Wastage:</span>
                  <span className="font-semibold text-rose-600">{rec.expectedWastagePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Direct Labor:</span>
                  <span className="font-semibold text-slate-900">{currency} {rec.estimatedLaborCost}/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Overhead Rate:</span>
                  <span className="font-semibold text-slate-900">{currency} {rec.estimatedMachineOverheadCost}/kg</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border text-[11px] text-slate-600 leading-snug">
                {rec.notes}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: COMPLETE PRODUCTION JOB & RECEIVE FINISHED FABRIC          */}
      {/* ================================================================= */}
      {completingJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteJobComplete}
            className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
                  Production Completion & Finished Goods Receipt
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Complete Job {completingJob.jobNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target Product: {completingJob.targetOutputProduct}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompletingJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-snug">
                Completing this job will permanently deduct <strong>{completeInputQty} {completingJob.inputUnit}</strong> of raw material from the raw store, and receive <strong>{completeOutputQty} {completingJob.outputUnit}</strong> into finished fabric inventory with recalculated weighted-average cost.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Actual Raw Consumed ({completingJob.inputUnit}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={completeInputQty}
                    onChange={e => setCompleteInputQty(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:outline-none font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Actual Accepted Output ({completingJob.outputUnit}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={completeOutputQty}
                    onChange={e => {
                      const out = Number(e.target.value);
                      setCompleteOutputQty(out);
                      setCompleteWastageQty(Math.max(0, completeInputQty - out));
                    }}
                    className="w-full p-2 border rounded-lg focus:outline-none font-bold text-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Actual Scrap / Wastage ({completingJob.outputUnit})
                  </label>
                  <input
                    type="number"
                    value={completeWastageQty}
                    onChange={e => setCompleteWastageQty(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:outline-none text-rose-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Destination Warehouse for Finished Fabric *
                  </label>
                  <select
                    value={completeDestWarehouseId}
                    onChange={e => setCompleteDestWarehouseId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct Production Costs */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                <div>
                  <label className="block text-slate-600 mb-1">Direct Labor ({currency})</label>
                  <input
                    type="number"
                    value={completeLaborCost}
                    onChange={e => setCompleteLaborCost(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Dyes / Chemicals ({currency})</label>
                  <input
                    type="number"
                    value={completeChemCost}
                    onChange={e => setCompleteChemCost(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Overhead / Power ({currency})</label>
                  <input
                    type="number"
                    value={completeOverheadCost}
                    onChange={e => setCompleteOverheadCost(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setCompletingJob(null)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Post Finished Goods Receipt</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
