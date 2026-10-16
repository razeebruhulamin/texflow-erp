import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { PurchaseOrder, PurchaseItem, Supplier, Product } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Plus,
  Search,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
  Calendar,
  X,
  Building2,
  Eye,
  CreditCard,
  Truck
} from 'lucide-react';

export const PurchaseList: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Goods receipt inputs
  const [receiptQtys, setReceiptQtys] = useState<Record<string, number>>({});
  const [receiptWarehouseId, setReceiptWarehouseId] = useState<string>('');
  const [receiptNotes, setReceiptNotes] = useState<string>('');

  const purchases = useMemo(() => StorageRepository.getPurchaseOrders(orgId), [orgId, dataVersion]);
  const suppliers = useMemo(() => StorageRepository.getSuppliers(orgId), [orgId, dataVersion]);
  const warehouses = useMemo(() => StorageRepository.getWarehouses(orgId), [orgId, dataVersion]);
  const products = useMemo(() => StorageRepository.getProducts(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // New PO Form state
  const [newPOSupplierId, setNewPOSupplierId] = useState<string>('');
  const [newPOWarehouseId, setNewPOWarehouseId] = useState<string>('');
  const [newPOItems, setNewPOItems] = useState<PurchaseItem[]>([]);
  const [newPODiscount, setNewPODiscount] = useState<number>(0);
  const [newPOFreight, setNewPOFreight] = useState<number>(0);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesSearch =
        p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchTerm, statusFilter]);

  const handleOpenReceipt = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setReceiptWarehouseId(po.warehouseId || warehouses[0]?.id || '');
    const initialQtys: Record<string, number> = {};
    po.items.forEach(item => {
      const remaining = Math.max(0, item.orderQuantity - (item.receivedQuantity || 0));
      initialQtys[item.productId] = remaining;
    });
    setReceiptQtys(initialQtys);
    setIsReceiptModalOpen(true);
  };

  const handlePostGoodsReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    const receiptPayload = selectedPO.items.map(item => ({
      productId: item.productId,
      receivedQty: Number(receiptQtys[item.productId]) || 0,
      rejectedQty: 0
    }));

    const result = StorageRepository.postGoodsReceipt(
      selectedPO.id,
      receiptPayload,
      receiptWarehouseId,
      receiptNotes,
      currentUser
    );

    if (result.success) {
      notify(result.message, 'success');
      refreshData();
      setIsReceiptModalOpen(false);
    } else {
      notify(result.message, 'error');
    }
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPOSupplierId || newPOItems.length === 0) {
      notify('Please select a supplier and add at least one product.', 'error');
      return;
    }

    const supplier = suppliers.find(s => s.id === newPOSupplierId);
    const subtotal = newPOItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const tax = Math.round(subtotal * ((currentOrg?.taxVatRate || 5) / 100));
    const grandTotal = subtotal - newPODiscount + tax + newPOFreight;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      organizationId: orgId,
      purchaseNumber: `${currentOrg?.purchasePrefix || 'PO'}-${Date.now().toString().slice(-4)}`,
      supplierId: newPOSupplierId,
      supplierName: supplier?.name || 'Supplier',
      warehouseId: newPOWarehouseId || warehouses[0]?.id || '',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      items: newPOItems,
      subtotal,
      discount: newPODiscount,
      tax,
      freightCosts: newPOFreight,
      grandTotal,
      paidAmount: 0,
      dueAmount: grandTotal,
      status: 'APPROVED',
      paymentStatus: 'UNPAID',
      notes: 'New purchase order created in approved status'
    };

    StorageRepository.savePurchaseOrder(newPO);
    StorageRepository.logAction(
      orgId,
      'CREATE_PURCHASE_ORDER',
      'PURCHASING',
      `PO ${newPO.purchaseNumber} created for ${newPO.supplierName} (Total: ${currency} ${grandTotal.toLocaleString()}).`,
      currentUser.name
    );

    refreshData();
    setIsNewPOOpen(false);
    notify(`Purchase Order ${newPO.purchaseNumber} created! Ready for goods receipt.`, 'success');
  };

  const handleAddLineItem = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const newItem: PurchaseItem = {
      productId: prod.id,
      productName: prod.name,
      specSummary: `${prod.specifications.yarnCount || ''} ${prod.specifications.gsm ? prod.specifications.gsm + ' GSM' : ''}`,
      unit: prod.unit,
      orderQuantity: 1000,
      receivedQuantity: 0,
      rejectedQuantity: 0,
      unitPrice: prod.defaultPurchasePrice || 320,
      taxAmount: 0,
      totalPrice: 1000 * (prod.defaultPurchasePrice || 320),
      lotNumber: `LOT-REC-${Date.now().toString().slice(-4)}`
    };

    setNewPOItems([...newPOItems, newItem]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchasing & Goods Receipt"
        subtitle="Manage supplier procurement, purchase orders, quality acceptance, and warehouse stock receipts."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'STOREKEEPER', 'MANAGER']) && (
            <button
              onClick={() => {
                setNewPOSupplierId(suppliers[0]?.id || '');
                setNewPOWarehouseId(warehouses[0]?.id || '');
                setNewPOItems([]);
                setNewPODiscount(0);
                setNewPOFreight(0);
                setIsNewPOOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search PO number or supplier name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Receipt Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Pending Receipt (Approved)</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Goods Received</option>
          </select>
        </div>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Items Summary</th>
                <th className="px-4 py-3">Order Date</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-right">Due Balance</th>
                <th className="px-4 py-3 text-center">Receipt Status</th>
                <th className="px-4 py-3 text-center">Payment</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(po => {
                  const itemsSummary = po.items.map(i => `${i.orderQuantity} ${i.unit} ${i.productName}`).join(', ');
                  const canReceive = po.status !== 'RECEIVED' && po.status !== 'CANCELLED';

                  return (
                    <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {po.purchaseNumber}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{po.supplierName}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="truncate max-w-[220px] text-slate-600" title={itemsSummary}>
                          {itemsSummary}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {po.items.length} line item(s)
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(po.orderDate).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {currency} {po.grandTotal.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-rose-600">
                        {currency} {po.dueAmount.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={po.status} />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={po.paymentStatus} />
                      </td>

                      <td className="px-4 py-3 text-center">
                        {canReceive ? (
                          <button
                            onClick={() => handleOpenReceipt(po)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-sm transition-all"
                            title="Receive goods into warehouse inventory"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive Stock</span>
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

      {/* Goods Receipt Modal */}
      {isReceiptModalOpen && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handlePostGoodsReceipt}
            className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
                  Goods Receipt Note (GRN)
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Receive Goods for {selectedPO.purchaseNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Supplier: {selectedPO.supplierName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination Receiving Warehouse *
                </label>
                <select
                  value={receiptWarehouseId}
                  onChange={e => setReceiptWarehouseId(e.target.value)}
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

              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Line Items & Received Quantities:
                </label>
                <div className="space-y-3 border rounded-lg p-3 bg-slate-50">
                  {selectedPO.items.map(item => {
                    const alreadyRec = item.receivedQuantity || 0;
                    const remaining = item.orderQuantity - alreadyRec;
                    return (
                      <div key={item.productId} className="bg-white p-3 rounded border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900">{item.productName}</span>
                          <span className="text-slate-500">
                            Ordered: {item.orderQuantity} {item.unit} | Received: {alreadyRec} {item.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-[11px] text-slate-500 mb-0.5">
                              Quantity to Receive Now ({item.unit}):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              value={receiptQtys[item.productId] ?? remaining}
                              onChange={e =>
                                setReceiptQtys({
                                  ...receiptQtys,
                                  [item.productId]: Number(e.target.value)
                                })
                              }
                              className="w-full p-1.5 border rounded focus:outline-none font-bold text-teal-700"
                            />
                          </div>
                          <div className="w-40">
                            <label className="block text-[11px] text-slate-500 mb-0.5">Lot / Batch #</label>
                            <input
                              type="text"
                              defaultValue={item.lotNumber || 'LOT-RCV-01'}
                              className="w-full p-1.5 border rounded focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Notes / Inspection Details</label>
                <textarea
                  rows={2}
                  value={receiptNotes}
                  onChange={e => setReceiptNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Visual quality passed, weighed on digital floor scale, zero damaged cones."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Confirm & Post Stock Receipt</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Purchase Order Creation Modal */}
      {isNewPOOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePO}
            className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create Purchase Order</h3>
              <button
                type="button"
                onClick={() => setIsNewPOOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
                  <select
                    value={newPOSupplierId}
                    onChange={e => setNewPOSupplierId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - Balance: {currency} {s.currentBalance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Warehouse</label>
                  <select
                    value={newPOWarehouseId}
                    onChange={e => setNewPOWarehouseId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">Add Materials / Products to PO:</label>
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAddLineItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="border border-teal-500 rounded px-2 py-1 text-teal-700 font-semibold focus:outline-none bg-teal-50"
                  >
                    <option value="">+ Add Product Line Item</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {newPOItems.length === 0 ? (
                  <div className="p-4 border-2 border-dashed rounded-lg text-center text-slate-400">
                    No items added yet. Select a product above to add to this purchase order.
                  </div>
                ) : (
                  <div className="space-y-2 border rounded-lg p-2 max-h-48 overflow-y-auto">
                    {newPOItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded border">
                        <div className="flex-1 font-medium text-slate-900 truncate">
                          {item.productName}
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] text-slate-400">Qty ({item.unit})</label>
                          <input
                            type="number"
                            value={item.orderQuantity}
                            onChange={e => {
                              const qty = Number(e.target.value);
                              const updated = [...newPOItems];
                              updated[idx].orderQuantity = qty;
                              updated[idx].totalPrice = qty * updated[idx].unitPrice;
                              setNewPOItems(updated);
                            }}
                            className="w-full p-1 border rounded bg-white text-xs"
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] text-slate-400">Price / {item.unit}</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => {
                              const price = Number(e.target.value);
                              const updated = [...newPOItems];
                              updated[idx].unitPrice = price;
                              updated[idx].totalPrice = updated[idx].orderQuantity * price;
                              setNewPOItems(updated);
                            }}
                            className="w-full p-1 border rounded bg-white text-xs"
                          />
                        </div>
                        <div className="w-28 text-right font-bold text-slate-900">
                          {currency} {item.totalPrice.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPOItems(newPOItems.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Landed costs & discounts */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="block text-slate-600 mb-1">Discount Amount ({currency})</label>
                  <input
                    type="number"
                    value={newPODiscount}
                    onChange={e => setNewPODiscount(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Freight / Landed Costs ({currency})</label>
                  <input
                    type="number"
                    value={newPOFreight}
                    onChange={e => setNewPOFreight(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsNewPOOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Record Purchase Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
