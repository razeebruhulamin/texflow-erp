import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  CreditCard,
  DollarSign
} from 'lucide-react';

export const Expenses: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const expenses = useMemo(() => StorageRepository.getExpenses(orgId), [orgId, dataVersion]);
  const categories = useMemo(() => StorageRepository.getExpenseCategories(orgId), [orgId, dataVersion]);
  const accounts = useMemo(() => StorageRepository.getCashBankAccounts(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // Form State
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [accountId, setAccountId] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch =
        e.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || e.categoryId === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const handleOpenAdd = () => {
    setCategoryId(categories[0]?.id || '');
    setAccountId(accounts[0]?.id || '');
    setAmount(4500);
    setPayee('');
    setDescription('');
    setReceiptNumber(`BILL-${Date.now().toString().slice(-4)}`);
    setIsModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || amount <= 0) {
      notify('Please select an expense category and enter a valid amount', 'error');
      return;
    }

    const cat = categories.find(c => c.id === categoryId);
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      organizationId: orgId,
      expenseNumber: `EXP-${Date.now().toString().slice(-4)}`,
      categoryId,
      categoryName: cat?.name || 'General Expense',
      date: new Date().toISOString(),
      amount,
      paymentMethod,
      accountId: accountId || accounts[0]?.id || 'acc-1',
      payee: payee || 'Vendor',
      description: description || cat?.name || 'Expense voucher',
      receiptNumber,
      status: 'APPROVED',
      recordedBy: currentUser.name
    };

    const res = StorageRepository.postExpenseTransaction(newExp, currentUser);
    if (res.success) {
      notify(res.message, 'success');
      refreshData();
      setIsModalOpen(false);
    } else {
      notify(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operating Expenses"
        subtitle="Record showroom rent, electricity, freight, boiler fuel, and factory maintenance overheads."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'ACCOUNTANT']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
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
            placeholder="Search by expense #, payee, description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none font-medium bg-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Expense #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Payee / Vendor</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Payment Account</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No operating expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => {
                  const acc = accounts.find(a => a.id === exp.accountId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {exp.expenseNumber}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {exp.categoryName}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-900">
                        {exp.payee}
                      </td>

                      <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={exp.description}>
                        {exp.description}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {acc?.accountName || 'Cash Drawer'}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {currency} {exp.amount.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={exp.status} />
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
            onSubmit={handleSaveExpense}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Operating Expense</h3>
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
                <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Amount ({currency}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-slate-900 text-sm focus:outline-none"
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
                    <option value="CASH">Cash Drawer</option>
                    <option value="BANK_TRANSFER">Bank Account</option>
                    <option value="MFS_BKASH">bKash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid From Account *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Payee Name</label>
                <input
                  type="text"
                  value={payee}
                  onChange={e => setPayee(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Electric Utility / Landlord / Truck driver"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bill / Invoice Reference #</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none font-mono"
                  placeholder="e.g. DESCO-BILL-881"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Particulars</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Monthly showroom power tariff payment"
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
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Post Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
