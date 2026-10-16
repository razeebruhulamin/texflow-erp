import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Supplier } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Building2,
  Search,
  Plus,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';

export const SupplierList: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const suppliers = useMemo(() => StorageRepository.getSuppliers(orgId), [orgId, dataVersion]);
  const purchases = useMemo(() => StorageRepository.getPurchaseOrders(orgId), [orgId, dataVersion]);
  const supplierPayments = useMemo(() => StorageRepository.getSupplierPayments(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // Form State
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    supplierType: 'SPINNING_MILL',
    openingBalance: 0,
    paymentTermsDays: 30,
    active: true
  });

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [suppliers, searchTerm]);

  // Build Supplier Ledger
  const ledgerEntries = useMemo(() => {
    if (!selectedSupplier) return [];

    const entries: {
      date: string;
      reference: string;
      type: string;
      debit: number; // Payments reduce payable
      credit: number; // Invoices increase payable
      notes: string;
    }[] = [];

    if (selectedSupplier.openingBalance > 0) {
      entries.push({
        date: '2026-01-01T00:00:00Z',
        reference: 'OPENING-BAL',
        type: 'Opening Payable',
        debit: 0,
        credit: selectedSupplier.openingBalance,
        notes: 'Initial opening payable balance'
      });
    }

    // Purchases
    purchases
      .filter(p => p.supplierId === selectedSupplier.id)
      .forEach(po => {
        entries.push({
          date: po.orderDate,
          reference: po.purchaseNumber,
          type: 'Purchase Invoice',
          debit: 0,
          credit: po.grandTotal,
          notes: `Goods procured (${po.status})`
        });
      });

    // Supplier payments
    supplierPayments
      .filter(sp => sp.supplierId === selectedSupplier.id)
      .forEach(pay => {
        entries.push({
          date: pay.paymentDate,
          reference: pay.voucherNumber,
          type: 'Payment Voucher',
          debit: pay.amount,
          credit: 0,
          notes: `Paid via ${pay.paymentMethod}`
        });
      });

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    return entries.map(e => {
      running += e.credit - e.debit; // net payable
      return { ...e, runningBalance: running };
    });
  }, [selectedSupplier, purchases, supplierPayments]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: `SUPP-${Date.now().toString().slice(-3)}`,
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      supplierType: 'SPINNING_MILL',
      openingBalance: 0,
      paymentTermsDays: 30,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      notify('Please enter supplier name', 'error');
      return;
    }

    const newSup: Supplier = {
      id: `supp-${Date.now()}`,
      organizationId: orgId,
      name: formData.name!,
      code: formData.code || `SUPP-${Date.now().toString().slice(-3)}`,
      contactPerson: formData.contactPerson || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      supplierType: formData.supplierType as any || 'SPINNING_MILL',
      openingBalance: Number(formData.openingBalance) || 0,
      currentBalance: Number(formData.openingBalance) || 0,
      paymentTermsDays: Number(formData.paymentTermsDays) || 30,
      active: formData.active ?? true
    };

    StorageRepository.saveSupplier(newSup);
    StorageRepository.logAction(
      orgId,
      'CREATE_SUPPLIER',
      'CONTACTS',
      `Supplier ${newSup.name} (${newSup.code}) created.`,
      currentUser.name
    );

    refreshData();
    setIsModalOpen(false);
    notify(`Supplier ${newSup.name} saved!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers & Accounts Payable Ledger"
        subtitle="Manage spinning mills, greige mills, dye & chemical vendors, payment vouchers, and running payables."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'ACCOUNTANT', 'STOREKEEPER']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Supplier</span>
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
            placeholder="Search supplier name, code, contact..."
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
                <th className="px-4 py-3">Supplier / Code</th>
                <th className="px-4 py-3">Vendor Type</th>
                <th className="px-4 py-3">Contact Person & Phone</th>
                <th className="px-4 py-3">Credit Terms</th>
                <th className="px-4 py-3 text-right">Current Outstanding Payable</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map(supp => (
                <tr key={supp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{supp.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{supp.code}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                      {supp.supplierType.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    <div>{supp.contactPerson}</div>
                    <div className="text-[11px] text-slate-400">{supp.phone}</div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {supp.paymentTermsDays} Days
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-rose-600">
                    {currency} {supp.currentBalance.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={supp.active ? 'ACTIVE' : 'SUSPENDED'} />
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedSupplier(supp);
                        setIsLedgerOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-semibold text-[11px] transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>View Ledger</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Ledger Modal */}
      {isLedgerOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
                  Supplier Statement & Accounts Payable Ledger
                </span>
                <h3 className="text-xl font-bold text-slate-900">{selectedSupplier.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Code: {selectedSupplier.code} | Contact: {selectedSupplier.contactPerson} ({selectedSupplier.phone})
                </p>
              </div>
              <button
                onClick={() => setIsLedgerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border">
                <span className="text-slate-400 block mb-0.5">Payment Terms</span>
                <span className="font-bold text-slate-800 text-sm">{selectedSupplier.paymentTermsDays} Days</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <span className="text-rose-600 block mb-0.5 font-semibold">Total Outstanding Payable</span>
                <span className="font-bold text-rose-700 text-sm">
                  {currency} {selectedSupplier.currentBalance.toLocaleString()}
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
                    <th className="p-2.5 text-right">Debit / Paid (-)</th>
                    <th className="p-2.5 text-right">Credit / Bill (+)</th>
                    <th className="p-2.5 text-right">Running Payable</th>
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
                        <td className="p-2.5 text-right font-medium text-emerald-600">
                          {e.debit > 0 ? `${currency} ${e.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-900">
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

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Supplier</h3>
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
                <label className="block font-semibold text-slate-700 mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Meghna Spinning Mills Ltd."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Code</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none font-mono"
                    placeholder="SUPP-005"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Type</label>
                  <select
                    value={formData.supplierType}
                    onChange={e => setFormData({ ...formData, supplierType: e.target.value as any })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="SPINNING_MILL">Spinning Mill (Yarn)</option>
                    <option value="GREIGE_MILL">Greige Mill</option>
                    <option value="DYE_CHEMICAL_VENDOR">Dyes & Chemicals</option>
                    <option value="ACCESSORIES">Accessories & Spares</option>
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Payable ({currency})</label>
                  <input
                    type="number"
                    value={formData.openingBalance || ''}
                    onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
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
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
