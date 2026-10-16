import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Employee } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  X
} from 'lucide-react';

export const EmployeeList: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const employees = useMemo(() => StorageRepository.getEmployees(orgId), [orgId, dataVersion]);
  const currency = currentOrg?.currencySymbol || '৳';

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    employeeCode: '',
    designation: '',
    department: 'PRODUCTION',
    phone: '',
    email: '',
    joiningDate: '2026-01-01',
    basicSalary: 30000,
    allowances: 8000,
    active: true
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      return (
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [employees, searchTerm]);

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      employeeCode: `EMP-${Date.now().toString().slice(-3)}`,
      designation: '',
      department: 'PRODUCTION',
      phone: '',
      email: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      basicSalary: 30000,
      allowances: 8000,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) {
      notify('Please enter employee name', 'error');
      return;
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      organizationId: orgId,
      fullName: formData.fullName!,
      employeeCode: formData.employeeCode || `EMP-${Date.now().toString().slice(-3)}`,
      designation: formData.designation || 'Staff',
      department: formData.department as any || 'PRODUCTION',
      phone: formData.phone || '',
      email: formData.email || '',
      joiningDate: formData.joiningDate || new Date().toISOString().slice(0, 10),
      basicSalary: Number(formData.basicSalary) || 0,
      allowances: Number(formData.allowances) || 0,
      active: formData.active ?? true
    };

    StorageRepository.saveEmployee(newEmp);
    StorageRepository.logAction(
      orgId,
      'CREATE_EMPLOYEE',
      'PEOPLE',
      `Employee ${newEmp.fullName} (${newEmp.employeeCode}) created.`,
      currentUser.name
    );

    refreshData();
    setIsModalOpen(false);
    notify(`Employee ${newEmp.fullName} saved successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        subtitle="Manage factory floor technicians, machine masters, storekeepers, accounts, and management personnel."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'HR_PAYROLL_OFFICER']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
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
            placeholder="Search employee name, code, designation..."
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
                <th className="px-4 py-3">Employee / ID</th>
                <th className="px-4 py-3">Designation & Dept</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Joining Date</th>
                <th className="px-4 py-3 text-right">Basic Salary</th>
                <th className="px-4 py-3 text-right">Allowances</th>
                <th className="px-4 py-3 text-right">Gross Total</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{emp.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{emp.designation}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{emp.department.toLowerCase()}</div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    <div>{emp.phone}</div>
                    <div className="text-[10px] text-slate-400">{emp.email}</div>
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {new Date(emp.joiningDate).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {currency} {emp.basicSalary.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    {currency} {emp.allowances.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-teal-700">
                    {currency} {(emp.basicSalary + emp.allowances).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={emp.active ? 'ACTIVE' : 'SUSPENDED'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
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
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName || ''}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employeeCode || ''}
                    onChange={e => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value as any })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="PRODUCTION">Production Floor</option>
                    <option value="DYEING">Dyeing & Finishing</option>
                    <option value="QUALITY">Quality Control</option>
                    <option value="SALES">Sales & Retail</option>
                    <option value="ACCOUNTS">Finance & Accounts</option>
                    <option value="WAREHOUSE">Warehouse Logistics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation / Role Title</label>
                <input
                  type="text"
                  value={formData.designation || ''}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Senior Knitting Technician"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate || ''}
                    onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Basic Salary ({currency})</label>
                  <input
                    type="number"
                    value={formData.basicSalary || ''}
                    onChange={e => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Allowances ({currency})</label>
                  <input
                    type="number"
                    value={formData.allowances || ''}
                    onChange={e => setFormData({ ...formData, allowances: Number(e.target.value) })}
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
                Save Employee
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
