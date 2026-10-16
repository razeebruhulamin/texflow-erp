import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Customer } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Users,
  Search,
  Plus,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const customers = useMemo(() => StorageRepository.getCustomers(orgId), [orgId, dataVersion]);
  const salesInvoices = useMemo(() => StorageRepository.getSalesInvoices(orgId), [orgId, dataVersion]);
  const collections = useMemo(() => StorageRepository.getCustomerCollections(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    customerType: 'GARMENT_MANUFACTURER',
    creditLimit: 500000,
    openingBalance: 0,
    paymentTermsDays: 30,
    active: true
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      return (
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [customers, searchTerm]);

  // Build Customer Ledger Transactions
  const ledgerEntries = useMemo(() => {
    if (!selectedCustomer) return [];

    const entries: {
      date: string;
      reference: string;
      type: string;
      debit: number; // Invoices increase receivables
      credit: number; // Collections reduce receivables
      notes: string;
    }[] = [];

    // Opening balance
    if (selectedCustomer.openingBalance > 0) {
      entries.push({
        date: selectedCustomer.openingBalance ? '2026-01-01T00:00:00Z' : '',
        reference: 'OPENING-BAL',
        type: 'Opening Balance',
        debit: selectedCustomer.openingBalance,
        credit: 0,
        notes: 'Initial account opening balance'
      });
    }

    // Invoices
    salesInvoices
      .filter(i => i.customerId === selectedCustomer.id)
      .forEach(inv => {
        entries.push({
          date: inv.date,
          reference: inv.invoiceNumber,
          type: 'Sales Invoice',
          debit: inv.grandTotal,
          credit: 0,
          notes: `Goods dispatched (${inv.salesChannel})`
        });
      });

    // Collections
    collections
      .filter(c => c.customerId === selectedCustomer.id)
      .forEach(col => {
        entries.push({
          date: col.collectionDate,
          reference: col.receiptNumber,
          type: 'Money Receipt (Collection)',
          debit: 0,
          credit: col.amount,
          notes: `Payment via ${col.paymentMethod}`
        });
      });

    // Sort chronologically
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let running = 0;
    return entries.map(e => {
      running += e.debit - e.credit;
      return { ...e, runningBalance: running };
    });
  }, [selectedCustomer, salesInvoices, collections]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: `CUST-${Date.now().toString().slice(-3)}`,
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      customerType: 'GARMENT_MANUFACTURER',
      creditLimit: 500000,
      openingBalance: 0,
      paymentTermsDays: 30,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      notify('Please enter customer name', 'error');
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      organizationId: orgId,
      name: formData.name!,
      code: formData.code || `CUST-${Date.now().toString().slice(-3)}`,
      contactPerson: formData.contactPerson || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      customerType: formData.customerType as any || 'WHOLESALE',
      creditLimit: Number(formData.creditLimit) || 0,
      openingBalance: Number(formData.openingBalance) || 0,
      currentBalance: Number(formData.openingBalance) || 0,
      paymentTermsDays: Number(formData.paymentTermsDays) || 30,
      active: formData.active ?? true
    };

    StorageRepository.saveCustomer(newCust);
    StorageRepository.logAction(
      orgId,
      'CREATE_CUSTOMER',
      'CONTACTS',
      `Customer ${newCust.name} (${newCust.code}) created.`,
      currentUser.name
    );

    refreshData();
    setIsModalOpen(false);
    notify(`Customer ${newCust.name} saved!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & Accounts Receivable Ledger"
        subtitle="Manage B2B garment manufacturers, fabric wholesalers, credit limits, and full transaction ledgers."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'SALES_EXECUTIVE', 'ACCOUNTANT']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Customer</span>
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
            placeholder="Search by customer name, code, phone..."
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
                <th className="px-4 py-3">Customer / Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Contact Person & Phone</th>
                <th className="px-4 py-3 text-right">Credit Limit</th>
                <th className="px-4 py-3 text-right">Current Due Receivable</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(cust => {
                const isOverLimit = cust.currentBalance > cust.creditLimit && cust.creditLimit > 0;

                return (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{cust.code}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {cust.customerType.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <div>{cust.contactPerson}</div>
                      <div className="text-[11px] text-slate-400">{cust.phone}</div>
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {currency} {cust.creditLimit.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right font-bold">
                      <span className={cust.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {currency} {cust.currentBalance.toLocaleString()}
                      </span>
                      {isOverLimit && (
                        <div className="text-[10px] text-rose-500 font-bold mt-0.5">Over Limit!</div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={cust.active ? 'ACTIVE' : 'SUSPENDED'} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setIsLedgerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-semibold text-[11px] transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                        <span>View Ledger</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Financial Ledger Modal */}
      {isLedgerOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
                  Customer Statement & Financial Ledger
                </span>
                <h3 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Code: {selectedCustomer.code} | Contact: {selectedCustomer.contactPerson} ({selectedCustomer.phone})
                </p>
              </div>
              <button
                onClick={() => setIsLedgerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border">
                <span className="text-slate-400 block mb-0.5">Credit Limit</span>
                <span className="font-bold text-slate-800 text-sm">
                  {currency} {selectedCustomer.creditLimit.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <span className="text-slate-400 block mb-0.5">Terms</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedCustomer.paymentTermsDays} Days Credit
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <span className="text-rose-600 block mb-0.5 font-semibold">Total Outstanding Receivable</span>
                <span className="font-bold text-rose-700 text-sm">
                  {currency} {selectedCustomer.currentBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="border rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Reference #</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Debit (+)</th>
                    <th className="p-2.5 text-right">Credit (-)</th>
                    <th className="p-2.5 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500">
                          {e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-2.5 font-mono font-semibold text-slate-900">{e.reference}</td>
                        <td className="p-2.5 text-slate-700">{e.notes}</td>
                        <td className="p-2.5 text-right font-medium text-slate-900">
                          {e.debit > 0 ? `${currency} ${e.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-medium text-emerald-600">
                          {e.credit > 0 ? `${currency} ${e.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-bold text-rose-600">
                          {currency} {e.runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsLedgerOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
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
                <label className="block font-semibold text-slate-700 mb-1">Company / Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Dapper Apparels Ltd."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Code</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none font-mono"
                    placeholder="CUST-009"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Category</label>
                  <select
                    value={formData.customerType}
                    onChange={e => setFormData({ ...formData, customerType: e.target.value as any })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="GARMENT_MANUFACTURER">Garment Factory</option>
                    <option value="WHOLESALE">Fabric Wholesaler</option>
                    <option value="RETAIL">Retail Boutique</option>
                    <option value="BUYING_HOUSE">Buying House</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    placeholder="+880 1711..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit ({currency})</label>
                  <input
                    type="number"
                    value={formData.creditLimit || ''}
                    onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={formData.paymentTermsDays || ''}
                    onChange={e => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
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
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
