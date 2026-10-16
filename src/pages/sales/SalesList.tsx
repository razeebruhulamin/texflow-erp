import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { SalesInvoice, SalesItem, Customer, Product, PaymentMethod } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Plus,
  Search,
  ShoppingCart,
  Printer,
  Eye,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';

export const SalesList: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  const invoices = useMemo(() => StorageRepository.getSalesInvoices(orgId), [orgId, dataVersion]);
  const customers = useMemo(() => StorageRepository.getCustomers(orgId), [orgId, dataVersion]);
  const products = useMemo(() => StorageRepository.getProducts(orgId), [orgId, dataVersion]);
  const warehouses = useMemo(() => StorageRepository.getWarehouses(orgId), [orgId, dataVersion]);
  const accounts = useMemo(() => StorageRepository.getCashBankAccounts(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // New Invoice Form
  const [newCustomerId, setNewCustomerId] = useState<string>('');
  const [newWarehouseId, setNewWarehouseId] = useState<string>('');
  const [newItems, setNewItems] = useState<SalesItem[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('CREDIT');
  const [newDiscount, setNewDiscount] = useState<number>(0);
  const [newDeliveryFee, setNewDeliveryFee] = useState<number>(0);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchChannel = channelFilter === 'ALL' || inv.salesChannel === channelFilter;
      return matchSearch && matchChannel;
    });
  }, [invoices, searchTerm, channelFilter]);

  const handleCreateB2BInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId || newItems.length === 0) {
      notify('Please select a customer and add products.', 'error');
      return;
    }

    const customer = customers.find(c => c.id === newCustomerId);
    const subtotal = newItems.reduce((sum, i) => sum + i.total, 0);
    const tax = Math.round(subtotal * ((currentOrg?.taxVatRate || 5) / 100));
    const grandTotal = subtotal - newDiscount + tax + newDeliveryFee;

    const isCredit = newPaymentMethod === 'CREDIT';
    const paidAmount = isCredit ? 0 : grandTotal;
    const dueAmount = isCredit ? grandTotal : 0;

    const targetAccount = accounts[0];

    const newInv: SalesInvoice = {
      id: `inv-${Date.now()}`,
      organizationId: orgId,
      invoiceNumber: `${currentOrg?.invoicePrefix || 'INV'}-${Date.now().toString().slice(-4)}`,
      salesChannel: 'IN_STORE_COUNTER',
      customerId: newCustomerId,
      customerName: customer?.name || 'Customer',
      warehouseId: newWarehouseId || warehouses[0]?.id || '',
      date: new Date().toISOString(),
      items: newItems,
      subtotal,
      discount: newDiscount,
      tax,
      deliveryCharge: newDeliveryFee,
      grandTotal,
      totalCostOfGoodsSold: 0,
      paidAmount,
      dueAmount,
      paymentMethod: newPaymentMethod,
      paymentAccountId: isCredit ? undefined : targetAccount?.id,
      paymentStatus: isCredit ? 'UNPAID' : 'PAID',
      orderStatus: 'DELIVERED',
      salesperson: currentUser.name,
      notes: 'B2B Sales Contract Challan'
    };

    const res = StorageRepository.postSalesInvoice(newInv, currentUser);

    if (res.success) {
      notify(`Sales invoice ${newInv.invoiceNumber} recorded! Inventory deducted and customer ledger updated.`, 'success');
      refreshData();
      setIsNewInvoiceOpen(false);
    } else {
      notify(res.message, 'error');
    }
  };

  const handleAddProductLine = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const line: SalesItem = {
      productId: prod.id,
      productName: prod.name,
      specSummary: `${prod.specifications.yarnCount || ''} ${prod.specifications.gsm || ''} GSM`,
      color: prod.specifications.colorName,
      unit: prod.unit,
      quantity: 50,
      unitPrice: prod.defaultSellingPrice,
      unitCost: prod.currentWeightedAvgCost,
      discount: 0,
      total: 50 * prod.defaultSellingPrice
    };

    setNewItems([...newItems, line]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices & Customer Orders"
        subtitle="Manage B2B contracts, counter sales, credit invoices, customer dispatch notes, and receivables."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'SALES_EXECUTIVE', 'MANAGER']) && (
            <button
              onClick={() => {
                setNewCustomerId(customers[0]?.id || '');
                setNewWarehouseId(warehouses[0]?.id || '');
                setNewItems([]);
                setNewDiscount(0);
                setNewDeliveryFee(0);
                setIsNewInvoiceOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create B2B Sales Invoice</span>
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
            placeholder="Search invoice number or customer name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Sales Channel:</span>
          <select
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
            className="border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none font-medium"
          >
            <option value="ALL">All Channels</option>
            <option value="POS">In-Store POS</option>
            <option value="IN_STORE_COUNTER">B2B Wholesale</option>
            <option value="WEBSITE">Online Website</option>
            <option value="SOCIAL_FACEBOOK">Social Commerce</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Due Receivable</th>
                <th className="px-4 py-3 text-center">Payment Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                      {inv.invoiceNumber}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {inv.customerName}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {inv.salesChannel.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {currency} {inv.grandTotal.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {currency} {inv.paidAmount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-rose-600">
                      {currency} {inv.dueAmount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsInvoiceModalOpen(true);
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900"
                        title="View & Print Enterprise Tax Invoice"
                      >
                        <FileText className="w-4 h-4 text-teal-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise Printable Invoice Modal */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header: Company Profile */}
            <div className="flex items-start justify-between border-b pb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{currentOrg?.name}</h2>
                <p className="text-xs text-slate-500 mt-1">{currentOrg?.address}</p>
                <p className="text-xs text-slate-500">Phone: {currentOrg?.phone} | Email: {currentOrg?.email}</p>
                <p className="text-xs text-slate-500">Tax/VAT Reg: BIN-8820491-002</p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-bold tracking-widest text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                  Commercial Tax Invoice
                </span>
                <div className="text-base font-bold text-slate-900 mt-2 font-mono">
                  {selectedInvoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500">
                  Date: {new Date(selectedInvoice.date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Bill To Details */}
            <div className="grid grid-cols-2 gap-6 my-6 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 font-semibold uppercase block mb-1">Customer / Bill To:</span>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoice.customerName}</p>
                <p className="text-slate-600 mt-0.5">Sales Channel: {selectedInvoice.salesChannel.replace(/_/g, ' ')}</p>
                <p className="text-slate-600">Issued by: {selectedInvoice.salesperson}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 font-semibold uppercase block mb-1">Payment & Terms:</span>
                <p className="font-semibold text-slate-800">Payment Method: {selectedInvoice.paymentMethod.replace(/_/g, ' ')}</p>
                <p className="font-semibold text-slate-800">Status: {selectedInvoice.paymentStatus}</p>
                <p className="text-slate-600">Order Dispatch: {selectedInvoice.orderStatus}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border rounded-lg overflow-hidden mb-6 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2.5">Fabric Specification</th>
                    <th className="p-2.5 text-center">Unit</th>
                    <th className="p-2.5 text-right">Quantity</th>
                    <th className="p-2.5 text-right">Unit Rate</th>
                    <th className="p-2.5 text-right">Total ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] text-slate-500">{item.specSummary}</div>
                      </td>
                      <td className="p-2.5 text-center text-slate-600">{item.unit}</td>
                      <td className="p-2.5 text-right font-medium text-slate-900">{item.quantity}</td>
                      <td className="p-2.5 text-right text-slate-700">{currency} {item.unitPrice}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {currency} {item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end mb-6 text-xs">
              <div className="w-64 space-y-1.5 border-t pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{currency} {selectedInvoice.subtotal.toLocaleString()}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span>- {currency} {selectedInvoice.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>VAT / Tax ({currentOrg?.taxVatRate || 5}%):</span>
                  <span>{currency} {selectedInvoice.tax.toLocaleString()}</span>
                </div>
                {selectedInvoice.deliveryCharge > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery / Freight:</span>
                    <span>{currency} {selectedInvoice.deliveryCharge.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t">
                  <span>Grand Total:</span>
                  <span className="text-teal-700">{currency} {selectedInvoice.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span>{currency} {selectedInvoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Outstanding Due:</span>
                  <span>{currency} {selectedInvoice.dueAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-[11px] text-slate-400">
                Authorized Signature & Seal: _______________________
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create B2B Sales Invoice Modal */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateB2BInvoice}
            className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create B2B Sales Contract Invoice</h3>
              <button
                type="button"
                onClick={() => setIsNewInvoiceOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
                  <select
                    value={newCustomerId}
                    onChange={e => setNewCustomerId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - Credit Limit: {currency} {c.creditLimit.toLocaleString()} (Due: {currency} {c.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Warehouse</label>
                  <select
                    value={newWarehouseId}
                    onChange={e => setNewWarehouseId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">Add Fabric Products:</label>
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAddProductLine(e.target.value);
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

                {newItems.length === 0 ? (
                  <div className="p-4 border-2 border-dashed rounded-lg text-center text-slate-400">
                    No fabric items selected yet. Use the dropdown above to add items.
                  </div>
                ) : (
                  <div className="space-y-2 border rounded-lg p-2 max-h-48 overflow-y-auto">
                    {newItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded border">
                        <div className="flex-1 font-medium text-slate-900 truncate">
                          {item.productName}
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] text-slate-400">Qty ({item.unit})</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => {
                              const qty = Number(e.target.value);
                              const updated = [...newItems];
                              updated[idx].quantity = qty;
                              updated[idx].total = qty * updated[idx].unitPrice;
                              setNewItems(updated);
                            }}
                            className="w-full p-1 border rounded bg-white text-xs"
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] text-slate-400">Rate / {item.unit}</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => {
                              const rate = Number(e.target.value);
                              const updated = [...newItems];
                              updated[idx].unitPrice = rate;
                              updated[idx].total = updated[idx].quantity * rate;
                              setNewItems(updated);
                            }}
                            className="w-full p-1 border rounded bg-white text-xs"
                          />
                        </div>
                        <div className="w-28 text-right font-bold text-slate-900">
                          {currency} {item.total.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Terms */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <label className="block text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={e => setNewPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-1.5 border rounded"
                  >
                    <option value="CREDIT">Customer Credit (Due Bill)</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="MFS_BKASH">bKash Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Discount ({currency})</label>
                  <input
                    type="number"
                    value={newDiscount}
                    onChange={e => setNewDiscount(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Delivery / Truck Fee ({currency})</label>
                  <input
                    type="number"
                    value={newDeliveryFee}
                    onChange={e => setNewDeliveryFee(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsNewInvoiceOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Post Sales Invoice & Dispatch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
