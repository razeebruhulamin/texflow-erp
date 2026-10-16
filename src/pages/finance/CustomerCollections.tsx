import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { CustomerCollection, PaymentMethod } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  ArrowDownToDot,
  Plus,
  Search,
  CheckCircle2,
  X,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';

export const CustomerCollections: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const collections = useMemo(() => StorageRepository.getCustomerCollections(orgId), [orgId, dataVersion]);
  const customers = useMemo(() => StorageRepository.getCustomers(orgId), [orgId, dataVersion]);
  const salesInvoices = useMemo(() => StorageRepository.getSalesInvoices(orgId), [orgId, dataVersion]);
  const accounts = useMemo(() => StorageRepository.getCashBankAccounts(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // Collection form
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [collectionAmount, setCollectionAmount] = useState<number>(10000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [accountId, setAccountId] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Unpaid invoices for customer
  const customerUnpaidInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return salesInvoices.filter(i => i.customerId === selectedCustomerId && i.dueAmount > 0);
  }, [salesInvoices, selectedCustomerId]);

  const handleOpenAdd = () => {
    const firstCust = customers.find(c => c.currentBalance > 0) || customers[0];
    setSelectedCustomerId(firstCust?.id || '');
    setAccountId(accounts[0]?.id || '');
    setCollectionAmount(firstCust?.currentBalance ? Math.min(firstCust.currentBalance, 50000) : 10000);
    setReference(`MR-${Date.now().toString().slice(-4)}`);
    setNotes('Invoice settlement collection');
    setIsModalOpen(true);
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || collectionAmount <= 0) {
      notify('Please select customer and enter valid collection amount', 'error');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const newCollection: CustomerCollection = {
      id: `col-${Date.now()}`,
      organizationId: orgId,
      receiptNumber: `MR-${Date.now().toString().slice(-4)}`,
      customerId: selectedCustomerId,
      customerName: customer?.name || 'Customer',
      salesInvoiceId: selectedInvoiceId || undefined,
      collectionDate: new Date().toISOString(),
      amount: collectionAmount,
      paymentMethod,
      accountId: accountId || accounts[0]?.id || 'acc-1',
      reference,
      notes,
      recordedBy: currentUser.name
    };

    const res = StorageRepository.postCustomerCollection(newCollection, currentUser);
    if (res.success) {
      notify(res.message, 'success');
      refreshData();
      setIsModalOpen(false);
    } else {
      notify(res.message, 'error');
    }
  };

  const filteredCollections = useMemo(() => {
    return collections.filter(c => {
      return (
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [collections, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Collections & Money Receipts"
        subtitle="Record full, partial, and advance payments against sales invoices. Updates customer ledger and deposit bank accounts."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'ACCOUNTANT', 'SALES_EXECUTIVE']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Money Receipt</span>
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
            placeholder="Search receipt # or customer name..."
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
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Deposited Account</th>
                <th className="px-4 py-3 text-right">Collected Amount</th>
                <th className="px-4 py-3">Notes & Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No customer collection receipts recorded.
                  </td>
                </tr>
              ) : (
                filteredCollections.map(col => {
                  const acc = accounts.find(a => a.id === col.accountId);
                  return (
                    <tr key={col.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {col.receiptNumber}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(col.collectionDate).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {col.customerName}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800">
                          {col.paymentMethod.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {acc?.accountName || 'Primary Account'}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-emerald-600 text-sm">
                        {currency} {col.amount.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        <div>{col.notes}</div>
                        <div className="text-[10px] text-slate-400">Ref: {col.reference} • By {col.recordedBy}</div>
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
            onSubmit={handleSaveCollection}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Customer Money Receipt</h3>
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
                <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find(c => c.id === e.target.value);
                    if (cust && cust.currentBalance > 0) {
                      setCollectionAmount(cust.currentBalance);
                    }
                  }}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Due: {currency} {c.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {customerUnpaidInvoices.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link to Unpaid Sales Invoice (Optional)</label>
                  <select
                    value={selectedInvoiceId}
                    onChange={e => {
                      setSelectedInvoiceId(e.target.value);
                      const inv = customerUnpaidInvoices.find(i => i.id === e.target.value);
                      if (inv) setCollectionAmount(inv.dueAmount);
                    }}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="">-- Apply to General Running Balance --</option>
                    {customerUnpaidInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - Due: {currency} {inv.dueAmount.toLocaleString()} ({new Date(inv.date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Collection Amount ({currency}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={collectionAmount}
                  onChange={e => setCollectionAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-emerald-600 text-sm focus:outline-none"
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
                    <option value="BANK_TRANSFER">Bank Transfer / Cheque</option>
                    <option value="CASH">Cash Drawer</option>
                    <option value="MFS_BKASH">bKash Merchant</option>
                    <option value="MFS_NAGAD">Nagad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deposit Into Account *</label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    required
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deposit Slip / Transaction Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none font-mono"
                  placeholder="e.g. EBL-DEP-09881"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Partial collection against delivery challan."
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
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Post Money Receipt
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
