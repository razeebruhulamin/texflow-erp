import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { User, RoleType } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { ShieldCheck, Plus, User as UserIcon, X, Check } from 'lucide-react';

export const UsersPermissions: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify } = useApp();
  const orgId = currentOrg?.id || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const orgUsers = useMemo(() => StorageRepository.getUsers(orgId), [orgId, dataVersion]);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleType>('MANAGER');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('SALES_EXECUTIVE');
    setDesignation('Sales Executive');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      notify('Please enter user name and email', 'error');
      return;
    }

    const newUser: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      organizationId: orgId,
      name,
      email,
      role,
      designation,
      phone,
      active: true
    };

    StorageRepository.saveUser(newUser);
    StorageRepository.logAction(
      orgId,
      editingUser ? 'UPDATE_USER' : 'CREATE_USER',
      'USER_MANAGEMENT',
      `User ${newUser.name} assigned role ${newUser.role}.`,
      currentUser.name
    );

    refreshData();
    setIsModalOpen(false);
    notify(`User ${newUser.name} saved!`, 'success');
  };

  const toggleUserActive = (user: User) => {
    const updated = { ...user, active: !user.active };
    StorageRepository.saveUser(updated);
    refreshData();
    notify(`User ${user.name} is now ${updated.active ? 'Active' : 'Suspended'}.`, 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Role-Based Permissions"
        subtitle="Manage organization staff access, assigned business roles, and permission levels."
        actions={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3">User Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3 text-slate-600 font-mono">{u.email}</td>
                  <td className="p-3 text-slate-700">{u.designation}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge status={u.active ? 'ACTIVE' : 'SUSPENDED'} />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleUserActive(u)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                        u.active
                          ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
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
              <h3 className="text-base font-bold text-slate-900">Provision Organization User</h3>
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
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Role *</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as RoleType)}
                  className="w-full p-2 border rounded-lg focus:outline-none font-semibold text-teal-800"
                >
                  <option value="ORGANIZATION_ADMIN">Organization Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="SALES_EXECUTIVE">Sales Executive</option>
                  <option value="POS_CASHIER">POS Cashier</option>
                  <option value="STOREKEEPER">Storekeeper</option>
                  <option value="PRODUCTION_MANAGER">Production Manager</option>
                  <option value="HR_PAYROLL_OFFICER">HR & Payroll Officer</option>
                  <option value="VIEWER_AUDITOR">Viewer / Auditor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
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
                Save User
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
