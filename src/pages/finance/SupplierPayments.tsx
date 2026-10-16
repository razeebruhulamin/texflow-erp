import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { SupplierPayment, PaymentMethod } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  ArrowUpFromDot,
  Plus,
  Search,
  CheckCircle2,
  X,
  CreditCard
} from 'lucide-react';

export const SupplierPayments: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const payments = useMemo(() => StorageRepository.getSupplierPayments(orgId), [orgId, dataVersion]);
  const suppliers = useMemo(() => StorageRepository.getSuppliers(orgId), [orgId, dataVersion]);
  const purchaseOrders = useMemo(() => StorageRepository.getPurchaseOrders(orgId), [orgId, dataVersion]);
  const accounts = useMemo(() => StorageRepository.getCashBankAccounts(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedPOId, setSelectedPOId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [accountId, setAccountId] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const supplierUnpaidPOs = useMemo(() => {
    if (!selectedSupplierId) return [];
    return purchaseOrders.filter(p => p.supplierId === selectedSupplierId && p.dueAmount > 0);
  }, [purchaseOrders, selectedSupplierId]);

  const handleOpenAdd = () => {
    const firstSup = suppliers.find(s => s.currentBalance > 0) || suppliers[0];
    setSelectedSupplierId(firstSup?.id || '');
    setAccountId(accounts.find(a => a.accountType === 'BANK')?.id || accounts[0]?.id || '');
    setPaymentAmount(firstSup?.currentBalance ? Math.min(firstSup.currentBalance, 100000) : 50000);
    setReference(`CHQ-${Date.now().toString().slice(-4)}`);
    setNotes('Supplier trade liability payment');
    setIsModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || paymentAmount <= 0) {
      notify('Please select supplier and enter valid payment amount', 'error');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    const newPayment: SupplierPayment = {
      id: `sp-${Date.now()}`,
      organizationId: orgId,
      voucherNumber: `VOU-${Date.now().toString().slice(-4)}`,
      supplierId: selectedSupplierId,
      supplierName: supplier?.name || 'Supplier',
      purchaseOrderId: selectedPOId || undefined,
      paymentDate: new Date().toISOString(),
      amount: paymentAmount,
      paymentMethod,
      accountId: accountId || accounts[0]?.id || 'acc-1',
      reference,
      notes,
      recordedBy: currentUser.name
    };

    const res = StorageRepository.postSupplierPayment(newPayment, currentUser);
    if (res.success) {
      notify(res.message, 'success');
      refreshData();
      setIsModalOpen(false);
    } else {
      notify(res.message, 'error');
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      return (
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [payments, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Payments & Debit Vouchers"
        subtitle="Disburse payments to yarn spinning mills, greige mills, and dye vendors. Reduces accounts payable."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'ACCOUNTANT']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Payment Voucher</span>
            </button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search voucher # or supplier name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Voucher #</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Disbursed From Account</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
                <th className="px-4 py-3">Reference & Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No supplier payments recorded.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const acc = accounts.find(a => a.id === p.accountId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {p.voucherNumber}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {p.supplierName}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800">
                          {p.paymentMethod.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {acc?.accountName || 'Bank Account'}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-rose-600 text-sm">
                        {currency} {p.amount.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        <div>{p.notes}</div>
                        <div className="text-[10px] text-slate-400">Ref: {p.reference} • By {p.recordedBy}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePayment}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Issue Supplier Payment Voucher</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => {
                    setSelectedSupplierId(e.target.value);
                    const sup = suppliers.find(s => s.id === e.target.value);
                    if (sup && sup.currentBalance > 0) {
                      setPaymentAmount(sup.currentBalance);
                    }
                  }}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  required
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable Due: {currency} {s.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {supplierUnpaidPOs.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link to Purchase Order Bill (Optional)</label>
                  <select
                    value={selectedPOId}
                    onChange={e => {
                      setSelectedPOId(e.target.value);
                      const po = supplierUnpaidPOs.find(p => p.id === e.target.value);
                      if (po) setPaymentAmount(po.dueAmount);
                    }}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="">-- Apply to General Running Balance --</option>
                    {supplierUnpaidPOs.map(po => (
                      <option key={po.id} value={po.id}>
                        {po.purchaseNumber} - Due: {currency} {po.dueAmount.toLocaleString()} ({new Date(po.orderDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount ({currency}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-rose-600 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank Cheque / Electronic Transfer</option>
                    <option value="CASH">Cash Office</option>
                    <option value="MFS_BKASH">bKash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Disburse From Account *</label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} (Bal: {currency} {a.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cheque # / Voucher Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none font-mono"
                  placeholder="e.g. IBBL-CHQ-9901"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Payment for yarn lot delivery."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Post Payment Voucher
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
