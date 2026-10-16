import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { CashBankAccount, FinancialTransaction } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Landmark,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  X
} from 'lucide-react';

export const CashBankAccounts: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  const accounts = useMemo(() => StorageRepository.getCashBankAccounts(orgId), [orgId, dataVersion]);
  const transactions = useMemo(() => StorageRepository.getFinancialTransactions(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // Transfer Form State
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(10000);
  const [transferNotes, setTransferNotes] = useState<string>('');

  const totalFunds = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  }, [accounts]);

  const filteredTransactions = useMemo(() => {
    if (selectedAccountId === 'ALL') return transactions;
    return transactions.filter(t => t.accountId === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const handleOpenTransfer = () => {
    setFromAccountId(accounts[0]?.id || '');
    setToAccountId(accounts[1]?.id || accounts[0]?.id || '');
    setTransferAmount(5000);
    setTransferNotes('Internal account fund rebalancing');
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      notify('Source and destination accounts must be different.', 'error');
      return;
    }

    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);

    if (!fromAcc || !toAcc) return;

    if (fromAcc.currentBalance < transferAmount) {
      notify(`Insufficient balance in ${fromAcc.accountName}! Available: ${currency} ${fromAcc.currentBalance.toLocaleString()}`, 'error');
      return;
    }

    // Deduct from source
    fromAcc.currentBalance -= transferAmount;
    StorageRepository.saveCashBankAccount(fromAcc);

    // Add to destination
    toAcc.currentBalance += transferAmount;
    StorageRepository.saveCashBankAccount(toAcc);

    // Record two matching transactions
    const now = new Date().toISOString();
    StorageRepository.addFinancialTransaction({
      id: `ft-${Date.now()}-out`,
      organizationId: orgId,
      transactionNumber: `TRX-${Date.now().toString().slice(-4)}`,
      date: now,
      accountId: fromAcc.id,
      accountName: fromAcc.accountName,
      type: 'TRANSFER_OUT',
      category: 'INTERNAL_TRANSFER',
      amount: transferAmount,
      balanceAfter: fromAcc.currentBalance,
      notes: `Transfer to ${toAcc.accountName} (${transferNotes})`,
      performedBy: currentUser.name
    });

    StorageRepository.addFinancialTransaction({
      id: `ft-${Date.now()}-in`,
      organizationId: orgId,
      transactionNumber: `TRX-${Date.now().toString().slice(-4)}`,
      date: now,
      accountId: toAcc.id,
      accountName: toAcc.accountName,
      type: 'TRANSFER_IN',
      category: 'INTERNAL_TRANSFER',
      amount: transferAmount,
      balanceAfter: toAcc.currentBalance,
      notes: `Transfer from ${fromAcc.accountName} (${transferNotes})`,
      performedBy: currentUser.name
    });

    StorageRepository.logAction(
      orgId,
      'INTERNAL_FUND_TRANSFER',
      'CASH_BANK',
      `Transferred ${currency} ${transferAmount.toLocaleString()} from ${fromAcc.accountName} to ${toAcc.accountName}.`,
      currentUser.name
    );

    notify(`Transferred ${currency} ${transferAmount.toLocaleString()} successfully. Internal transfers do NOT affect P&L revenue/expense.`, 'success');
    refreshData();
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash & Bank Accounts"
        subtitle={`Track available liquidity across physical cash counters, commercial bank accounts, and mobile financial services (Total: ${currency} ${totalFunds.toLocaleString()}).`}
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'ACCOUNTANT']) && (
            <button
              onClick={handleOpenTransfer}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Internal Fund Transfer</span>
            </button>
          )
        }
      />

      {/* Accounts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {accounts.map(acc => {
          const isCash = acc.accountType === 'CASH';
          const isMfs = acc.accountType === 'MFS';

          return (
            <div
              key={acc.id}
              className={`bg-white rounded-xl border p-5 shadow-sm space-y-4 transition-all ${
                selectedAccountId === acc.id ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl ${
                      isCash ? 'bg-amber-50 text-amber-600' : isMfs ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {isCash ? (
                      <Banknote className="w-5 h-5" />
                    ) : isMfs ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Landmark className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{acc.accountName}</h3>
                    <div className="text-xs text-slate-400 capitalize">
                      {acc.accountType} {acc.bankName ? `• ${acc.bankName}` : ''}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAccountId(selectedAccountId === acc.id ? 'ALL' : acc.id)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
                    selectedAccountId === acc.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {selectedAccountId === acc.id ? 'Filtered' : 'Filter Ledger'}
                </button>
              </div>

              {acc.accountNumber && (
                <div className="text-xs font-mono text-slate-500 bg-slate-50 p-2 rounded">
                  A/C: {acc.accountNumber} {acc.branchName ? `(${acc.branchName})` : ''}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Opening Balance</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {currency} {acc.openingBalance.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Available Liquidity</span>
                  <span className="text-lg font-bold text-teal-700">
                    {currency} {acc.currentBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Transactions Statement Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Account Transaction Ledger</h3>
            <p className="text-xs text-slate-500">
              {selectedAccountId === 'ALL'
                ? 'Consolidated statement across all financial accounts'
                : `Filtered statement for selected account`}
            </p>
          </div>
          {selectedAccountId !== 'ALL' && (
            <button
              onClick={() => setSelectedAccountId('ALL')}
              className="text-xs text-teal-600 font-semibold hover:underline"
            >
              Clear Filter (Show All)
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Tx #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Particulars / Notes</th>
                <th className="px-4 py-3 text-right">Inflow (+)</th>
                <th className="px-4 py-3 text-right">Outflow (-)</th>
                <th className="px-4 py-3 text-right">Running Liquidity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => {
                const isInflow = tx.type === 'RECEIPT' || tx.type === 'TRANSFER_IN';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold font-mono text-slate-900">{tx.transactionNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{tx.accountName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {tx.category.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[220px]" title={tx.notes}>
                      {tx.notes}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {isInflow ? `+${currency} ${tx.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">
                      {!isInflow ? `-${currency} ${tx.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {currency} {tx.balanceAfter.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteTransfer}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                <span>Internal Account Fund Transfer</span>
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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 leading-snug">
                Internal transfers rebalance cash between drawers and banks. They are strictly balance-sheet transfers and do <strong>not</strong> affect business revenue or operating expenses in the P&L statement.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer From Account *</label>
                <select
                  value={fromAccountId}
                  onChange={e => setFromAccountId(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  required
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} (Balance: {currency} {a.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer To Account *</label>
                <select
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  required
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} (Balance: {currency} {a.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Amount ({currency}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferAmount}
                  onChange={e => setTransferAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Purpose / Notes</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Deposit daily POS cash collection into bank account."
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
    </div>
  );
};
