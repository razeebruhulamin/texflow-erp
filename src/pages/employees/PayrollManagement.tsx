import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Employee, PayrollEntry, PaymentMethod } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  CreditCard,
  Plus,
  Printer,
  CheckCircle2,
  Calendar,
  X,
  UserCheck,
  Building2,
  Calculator
} from 'lucide-react';

export const PayrollManagement: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-02');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<PayrollEntry | null>(null);

  const employees = useMemo(() => StorageRepository.getEmployees(orgId), [orgId, dataVersion]);
  const payrolls = useMemo(() => StorageRepository.getPayrollEntries(orgId), [orgId, dataVersion]);
  const accounts = useMemo(() => StorageRepository.getCashBankAccounts(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';
  const divisor = currentOrg?.absenceDeductionDivisor || 30;

  // New Payroll Generation State
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [absentDays, setAbsentDays] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [advanceAdj, setAdvanceAdj] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const selectedEmp = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Daily rate and deduction calculation
  const payrollCalculation = useMemo(() => {
    if (!selectedEmp) return null;

    const basic = selectedEmp.basicSalary;
    const allowances = selectedEmp.allowances;
    const dailyRate = Math.round((basic / divisor) * 100) / 100;
    const absenceDeduction = Math.round(dailyRate * absentDays);
    const netSalary = Math.max(0, basic + allowances + bonus - absenceDeduction - advanceAdj);

    return {
      basic,
      allowances,
      dailyRate,
      absenceDeduction,
      netSalary
    };
  }, [selectedEmp, divisor, absentDays, bonus, advanceAdj]);

  const handleOpenGenerate = () => {
    setSelectedEmpId(employees[0]?.id || '');
    setAbsentDays(0);
    setBonus(0);
    setAdvanceAdj(0);
    setNotes('');
    setIsGenerateModalOpen(true);
  };

  const handlePostPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !payrollCalculation) return;

    const newPayroll: PayrollEntry = {
      id: `pay-${Date.now()}`,
      organizationId: orgId,
      payrollNumber: `PAY-${selectedMonth}-${selectedEmp.employeeCode}`,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.fullName,
      designation: selectedEmp.designation,
      periodMonth: selectedMonth,
      basicSalary: payrollCalculation.basic,
      allowances: payrollCalculation.allowances,
      bonus,
      absentDays,
      absenceDailyRate: payrollCalculation.dailyRate,
      absenceDeductionAmount: payrollCalculation.absenceDeduction,
      otherDeductions: 0,
      advanceAdjustment: advanceAdj,
      netSalary: payrollCalculation.netSalary,
      status: 'APPROVED',
      notes
    };

    StorageRepository.savePayrollEntry(newPayroll);
    StorageRepository.logAction(
      orgId,
      'APPROVE_PAYROLL',
      'PAYROLL',
      `Payroll approved for ${selectedEmp.fullName} (${selectedMonth}): Net salary ${currency} ${payrollCalculation.netSalary.toLocaleString()}.`,
      currentUser.name
    );

    refreshData();
    setIsGenerateModalOpen(false);
    notify(`Payroll ${newPayroll.payrollNumber} calculated and approved! Ready for bank disbursement.`, 'success');
  };

  const handleDisbursePayment = (entry: PayrollEntry) => {
    const bankAcc = accounts.find(a => a.accountType === 'BANK') || accounts[0];
    if (!bankAcc) {
      notify('No cash/bank account available to disburse salary.', 'error');
      return;
    }

    const res = StorageRepository.postPayrollPayment(entry.id, bankAcc.id, 'BANK_TRANSFER', currentUser);
    if (res.success) {
      notify(res.message, 'success');
      refreshData();
    } else {
      notify(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual Absence & Salary Payroll Engine"
        subtitle={`Complies with manual absence deduction rules (Divisor: ${divisor} days). Configured daily deduction rate = Basic Salary ÷ ${divisor}.`}
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'HR_PAYROLL_OFFICER']) && (
            <button
              onClick={handleOpenGenerate}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Calculate & Post Payroll</span>
            </button>
          )
        }
      />

      {/* Month selector & Policy indicator */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Salary Period Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border border-slate-200 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none"
          />
        </div>

        <div className="text-xs bg-slate-50 px-3 py-1.5 rounded-lg border text-slate-600">
          Configured Policy: <strong>Basic Salary ÷ {divisor} days</strong> daily absence deduction rate
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Payroll #</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-right">Basic + Allowances</th>
                <th className="px-4 py-3 text-center">Absent Days</th>
                <th className="px-4 py-3 text-right">Absence Deduction</th>
                <th className="px-4 py-3 text-right">Bonus / Adv</th>
                <th className="px-4 py-3 text-right">Net Payable</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No payroll entries recorded for this period.
                  </td>
                </tr>
              ) : (
                payrolls.map(pay => {
                  const isPaid = pay.status === 'PAID';

                  return (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold font-mono text-slate-900">{pay.payrollNumber}</td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{pay.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{pay.designation}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-500">{pay.periodMonth}</td>

                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {currency} {(pay.basicSalary + pay.allowances).toLocaleString()}
                        <div className="text-[10px] text-slate-400">Basic: {currency}{pay.basicSalary}</div>
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {pay.absentDays} Day(s)
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-rose-600">
                        - {currency} {pay.absenceDeductionAmount.toLocaleString()}
                        <div className="text-[10px] text-slate-400">@{currency}{pay.absenceDailyRate}/day</div>
                      </td>

                      <td className="px-4 py-3 text-right text-slate-600">
                        <div>+{currency}{pay.bonus}</div>
                        {pay.advanceAdjustment > 0 && <div className="text-[10px] text-rose-500">-{currency}{pay.advanceAdjustment}</div>}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-emerald-700 text-sm">
                        {currency} {pay.netSalary.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={pay.status} />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSlip(pay)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900"
                            title="Print Salary Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => handleDisbursePayment(pay)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-sm transition-all"
                            >
                              Disburse Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h3 className="text-base font-bold text-slate-900">{currentOrg?.name}</h3>
              <p className="text-xs text-slate-500">Salary Pay Slip - Month: {selectedSlip.periodMonth}</p>
              <div className="mt-2 text-xs font-mono font-bold text-teal-700">
                {selectedSlip.payrollNumber}
              </div>
            </div>

            <div className="my-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Name:</span>
                <span className="font-bold text-slate-900">{selectedSlip.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Designation:</span>
                <span className="font-semibold text-slate-800">{selectedSlip.designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Basic Salary:</span>
                <span className="font-mono">{currency} {selectedSlip.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">House Rent & Allowances:</span>
                <span className="font-mono">{currency} {selectedSlip.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Performance Bonus:</span>
                <span className="font-mono">+{currency} {selectedSlip.bonus.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Absence Deduction ({selectedSlip.absentDays} days @ {currency}{selectedSlip.absenceDailyRate}):</span>
                <span className="font-mono font-bold">-{currency} {selectedSlip.absenceDeductionAmount.toLocaleString()}</span>
              </div>
              {selectedSlip.advanceAdjustment > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Advance Salary Adjustment:</span>
                  <span className="font-mono font-bold">-{currency} {selectedSlip.advanceAdjustment.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Net Salary Payable:</span>
                <span className="text-teal-700 font-mono">{currency} {selectedSlip.netSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Disbursement Status:</span>
                <span className="font-semibold text-emerald-600">{selectedSlip.status}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 border rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Salary Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculate & Post Modal */}
      {isGenerateModalOpen && selectedEmp && payrollCalculation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handlePostPayroll}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-600" />
                <span>Manual Absence & Salary Computation</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Employee *</label>
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  required
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.designation}) - Basic: {currency} {e.basicSalary.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Formula & Live Calculation Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span>Eligible Basic Salary:</span>
                  <span className="font-bold text-slate-900">{currency} {payrollCalculation.basic.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowances:</span>
                  <span className="font-semibold text-slate-900">{currency} {payrollCalculation.allowances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-teal-700 font-semibold border-t pt-1">
                  <span>Daily Rate Formula ({payrollCalculation.basic} ÷ {divisor} days):</span>
                  <span>{currency} {payrollCalculation.dailyRate} / day</span>
                </div>
              </div>

              {/* Manual Absence Days input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Manual Absent Days (Authorized Entry) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  required
                  value={absentDays}
                  onChange={e => setAbsentDays(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-rose-600 text-sm focus:outline-none"
                  placeholder="0"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Calculated absence deduction: <strong>{currency} {payrollCalculation.absenceDeduction.toLocaleString()}</strong> ({absentDays} × {currency}{payrollCalculation.dailyRate})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bonus ({currency})</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={e => setBonus(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Advance Adjustment ({currency})</label>
                  <input
                    type="number"
                    value={advanceAdj}
                    onChange={e => setAdvanceAdj(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Net Result Preview */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-emerald-900">Net Salary Payable:</span>
                <span className="text-lg font-bold text-emerald-700">
                  {currency} {payrollCalculation.netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Approve & Post Payroll
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
