import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { StockMovement, StockTransfer, StockAdjustment, Product, Warehouse } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Boxes,
  ArrowRightLeft,
  SlidersHorizontal,
  Search,
  Plus,
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const InventoryLedger: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [activeTab, setActiveTab] = useState<'BALANCES' | 'MOVEMENTS' | 'TRANSFERS' | 'ADJUSTMENTS'>('BALANCES');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const products = useMemo(() => StorageRepository.getProducts(orgId), [orgId, dataVersion]);
  const stockBalances = useMemo(() => StorageRepository.getStockBalances(orgId), [orgId, dataVersion]);
  const movements = useMemo(() => StorageRepository.getStockMovements(orgId), [orgId, dataVersion]);
  const transfers = useMemo(() => StorageRepository.getStockTransfers(orgId), [orgId, dataVersion]);
  const adjustments = useMemo(() => StorageRepository.getStockAdjustments(orgId), [orgId, dataVersion]);
  const warehouses = useMemo(() => StorageRepository.getWarehouses(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // Transfer Form state
  const [trfProductId, setTrfProductId] = useState<string>('');
  const [trfFromWh, setTrfFromWh] = useState<string>('');
  const [trfToWh, setTrfToWh] = useState<string>('');
  const [trfQuantity, setTrfQuantity] = useState<number>(100);

  // Adjustment Form state
  const [adjProductId, setAdjProductId] = useState<string>('');
  const [adjWh, setAdjWh] = useState<string>('');
  const [adjPhysicalQty, setAdjPhysicalQty] = useState<number>(0);
  const [adjReason, setAdjReason] = useState<any>('STOCK_COUNT_CORRECTION');
  const [adjNotes, setAdjNotes] = useState<string>('');

  // Filtered stock balances
  const filteredBalances = useMemo(() => {
    return stockBalances.filter(b => {
      const prod = products.find(p => p.id === b.productId);
      const matchWh = selectedWarehouseId === 'ALL' || b.warehouseId === selectedWarehouseId;
      const matchSearch =
        (prod?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prod?.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.batchLotNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchWh && matchSearch;
    });
  }, [stockBalances, products, selectedWarehouseId, searchTerm]);

  // Handle Transfer Submit (Scenario G)
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (trfFromWh === trfToWh) {
      notify('Source and destination warehouses cannot be the same.', 'error');
      return;
    }

    const prod = products.find(p => p.id === trfProductId);
    if (!prod) return;

    const transferObj: StockTransfer = {
      id: `trf-${Date.now()}`,
      organizationId: orgId,
      transferNumber: `TRF-${Date.now().toString().slice(-4)}`,
      fromWarehouseId: trfFromWh,
      toWarehouseId: trfToWh,
      productId: trfProductId,
      quantity: trfQuantity,
      unit: prod.unit,
      date: new Date().toISOString(),
      status: 'PENDING',
      performedBy: currentUser.name,
      notes: 'Inter-warehouse fabric stock movement'
    };

    const res = StorageRepository.postStockTransfer(transferObj, currentUser);
    if (res.success) {
      notify(res.message, 'success');
      refreshData();
      setIsTransferModalOpen(false);
    } else {
      notify(res.message, 'error');
    }
  };

  // Handle Adjustment Submit
  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === adjProductId);
    if (!prod) return;

    const currentBal = stockBalances.find(b => b.productId === adjProductId && b.warehouseId === adjWh);
    const systemQty = currentBal ? currentBal.quantityOnHand : 0;
    const diff = adjPhysicalQty - systemQty;

    const adjustmentObj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      organizationId: orgId,
      adjustmentNumber: `ADJ-${Date.now().toString().slice(-4)}`,
      warehouseId: adjWh,
      productId: adjProductId,
      batchLot: currentBal?.batchLotNumber,
      systemQuantity: systemQty,
      physicalQuantity: adjPhysicalQty,
      adjustmentQuantity: diff,
      unit: prod.unit,
      unitCost: currentBal?.averageUnitCost || prod.currentWeightedAvgCost,
      totalValueImpact: diff * (currentBal?.averageUnitCost || prod.currentWeightedAvgCost),
      reason: adjReason,
      date: new Date().toISOString(),
      approvedBy: currentUser.name,
      notes: adjNotes
    };

    if (currentBal) {
      currentBal.quantityOnHand = adjPhysicalQty;
      StorageRepository.saveStockBalance(currentBal);
    }

    StorageRepository.addStockMovement({
      id: `sm-adj-${Date.now()}`,
      organizationId: orgId,
      productId: adjProductId,
      warehouseId: adjWh,
      movementType: 'STOCK_ADJUSTMENT',
      quantity: diff,
      unit: prod.unit,
      unitCost: currentBal?.averageUnitCost || prod.currentWeightedAvgCost,
      totalCost: diff * (currentBal?.averageUnitCost || prod.currentWeightedAvgCost),
      referenceNumber: adjustmentObj.adjustmentNumber,
      referenceType: 'ADJUSTMENT',
      date: new Date().toISOString(),
      notes: `Adjustment: ${adjReason} (${adjNotes})`,
      performedBy: currentUser.name
    });

    StorageRepository.saveStockAdjustment(adjustmentObj);
    StorageRepository.logAction(
      orgId,
      'POST_STOCK_ADJUSTMENT',
      'INVENTORY',
      `Stock adjusted for ${prod.name}. Physical count: ${adjPhysicalQty} (Variance: ${diff} ${prod.unit}).`,
      currentUser.name
    );

    notify(`Stock adjustment ${adjustmentObj.adjustmentNumber} posted!`, 'success');
    refreshData();
    setIsAdjustmentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Ledger & Stock Valuation"
        subtitle="Track multi-warehouse inventory balances, raw materials vs finished goods, inter-warehouse transfers, and audit logs."
        actions={
          <div className="flex items-center gap-2">
            {hasPermission(['ORGANIZATION_ADMIN', 'STOREKEEPER', 'MANAGER']) && (
              <>
                <button
                  onClick={() => {
                    setTrfProductId(products[0]?.id || '');
                    setTrfFromWh(warehouses[0]?.id || '');
                    setTrfToWh(warehouses[1]?.id || warehouses[0]?.id || '');
                    setIsTransferModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer Stock</span>
                </button>
                <button
                  onClick={() => {
                    setAdjProductId(products[0]?.id || '');
                    setAdjWh(warehouses[0]?.id || '');
                    setAdjPhysicalQty(0);
                    setIsAdjustmentModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Adjust Stock</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
          <button
            onClick={() => setActiveTab('BALANCES')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'BALANCES' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock Balances</span>
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'MOVEMENTS' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Movements Ledger ({movements.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TRANSFERS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'TRANSFERS' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfers ({transfers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ADJUSTMENTS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'ADJUSTMENTS' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjustments ({adjustments.length})</span>
          </button>
        </div>

        {/* Warehouse Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Warehouse:</span>
          <select
            value={selectedWarehouseId}
            onChange={e => setSelectedWarehouseId(e.target.value)}
            className="border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none font-medium bg-white"
          >
            <option value="ALL">All Warehouses ({warehouses.length})</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: STOCK BALANCES & VALUATION                                 */}
      {/* ================================================================= */}
      {activeTab === 'BALANCES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Batch / Lot #</th>
                  <th className="px-4 py-3 text-right">Available Qty</th>
                  <th className="px-4 py-3 text-right">Reserved Qty</th>
                  <th className="px-4 py-3 text-right">Avg Unit Cost</th>
                  <th className="px-4 py-3 text-right">Total Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No stock balances found.
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map(b => {
                    const prod = products.find(p => p.id === b.productId);
                    const wh = warehouses.find(w => w.id === b.warehouseId);
                    const val = b.quantityOnHand * b.averageUnitCost;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{prod?.name || 'Unknown Product'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{prod?.sku}</div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {wh?.name || 'Warehouse'}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              prod?.productType === 'RAW_MATERIAL'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-teal-50 text-teal-700'
                            }`}
                          >
                            {prod?.productType === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Goods'}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-500">
                          {b.batchLotNumber || 'LOT-STANDARD'}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {b.quantityOnHand.toLocaleString()} {prod?.unit}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-500">
                          {b.quantityReserved} {prod?.unit}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-700">
                          {currency} {b.averageUnitCost}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-teal-700">
                          {currency} {Math.round(val).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: AUDIT MOVEMENTS LEDGER                                     */}
      {/* ================================================================= */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3">Notes & Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => {
                  const prod = products.find(p => p.id === m.productId);
                  const wh = warehouses.find(w => w.id === m.warehouseId);
                  const isPositive = m.quantity > 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {m.referenceNumber}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.movementType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {prod?.name || 'Product'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">{wh?.name}</td>

                      <td className={`px-4 py-3 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                      </td>

                      <td className="px-4 py-3 text-right text-slate-600">
                        {currency} {m.unitCost}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        <div>{m.notes}</div>
                        <div className="text-[10px] text-slate-400">By {m.performedBy}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: TRANSFERS REGISTER (SCENARIO G)                            */}
      {/* ================================================================= */}
      {activeTab === 'TRANSFERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Transfer #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Source Warehouse</th>
                  <th className="px-4 py-3">Destination Warehouse</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No inter-warehouse transfers recorded.
                    </td>
                  </tr>
                ) : (
                  transfers.map(t => {
                    const fromWh = warehouses.find(w => w.id === t.fromWarehouseId);
                    const toWh = warehouses.find(w => w.id === t.toWarehouseId);
                    const prod = products.find(p => p.id === t.productId);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold font-mono text-slate-900">{t.transferNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-rose-600 font-semibold">{fromWh?.name}</td>
                        <td className="px-4 py-3 text-emerald-600 font-semibold">{toWh?.name}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{prod?.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {t.quantity} {t.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">{t.performedBy}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: ADJUSTMENTS REGISTER                                       */}
      {/* ================================================================= */}
      {activeTab === 'ADJUSTMENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Adjustment #</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">System Qty</th>
                  <th className="px-4 py-3 text-right">Physical Count</th>
                  <th className="px-4 py-3 text-right">Variance Qty</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No stock adjustments recorded.
                    </td>
                  </tr>
                ) : (
                  adjustments.map(adj => {
                    const prod = products.find(p => p.id === adj.productId);
                    const wh = warehouses.find(w => w.id === adj.warehouseId);

                    return (
                      <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold font-mono text-slate-900">{adj.adjustmentNumber}</td>
                        <td className="px-4 py-3 text-slate-700">{wh?.name}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{prod?.name}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{adj.systemQuantity} {adj.unit}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{adj.physicalQuantity} {adj.unit}</td>
                        <td className={`px-4 py-3 text-right font-bold ${adj.adjustmentQuantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {adj.adjustmentQuantity >= 0 ? `+${adj.adjustmentQuantity}` : adj.adjustmentQuantity} {adj.unit}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {adj.reason.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{adj.approvedBy}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal (Scenario G) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteTransfer}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                <span>Inter-Warehouse Stock Transfer</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Fabric / Yarn Product *</label>
                <select
                  value={trfProductId}
                  onChange={e => setTrfProductId(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Warehouse *</label>
                  <select
                    value={trfFromWh}
                    onChange={e => setTrfFromWh(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Warehouse *</label>
                  <select
                    value={trfToWh}
                    onChange={e => setTrfToWh(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={trfQuantity}
                  onChange={e => setTrfQuantity(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-slate-900 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Execute Transfer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteAdjustment}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                <span>Physical Stock Count Adjustment</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product *</label>
                  <select
                    value={adjProductId}
                    onChange={e => setAdjProductId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse *</label>
                  <select
                    value={adjWh}
                    onChange={e => setAdjWh(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Actual Physical Counted Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjPhysicalQty}
                  onChange={e => setAdjPhysicalQty(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Reason *</label>
                <select
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                >
                  <option value="STOCK_COUNT_CORRECTION">Stock Count Correction / Audit</option>
                  <option value="DAMAGE">Fabric Damage / Tear</option>
                  <option value="WASTAGE">Cutting / Cone Wastage</option>
                  <option value="MISSING_INVENTORY">Missing Stock</option>
                  <option value="OPENING_BALANCE">Opening Balance Setup</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Notes</label>
                <textarea
                  rows={2}
                  value={adjNotes}
                  onChange={e => setAdjNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Month-end floor physical verification count."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Post Adjustment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
