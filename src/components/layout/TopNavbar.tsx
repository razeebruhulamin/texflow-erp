import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import {
  Building2,
  User,
  Warehouse,
  RotateCcw,
  Plus,
  Search,
  Bell,
  Menu,
  ChevronDown,
  Check,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface TopNavbarProps {
  navigate: (route: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  navigate,
  collapsed,
  setCollapsed
}) => {
  const {
    currentOrg,
    currentUser,
    organizations,
    users,
    currentWarehouseId,
    setWarehouseId,
    switchOrganization,
    switchUser,
    resetAllDemoData,
    isPlatformAdminMode,
    setPlatformAdminMode
  } = useApp();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const warehouses = currentOrg ? StorageRepository.getWarehouses(currentOrg.id) : [];

  // Filter users by current org (or all for platform admin)
  const availableUsers = isPlatformAdminMode
    ? users
    : users.filter(u => u.organizationId === currentOrg?.id || u.role === 'PLATFORM_SUPER_ADMIN');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Hamburger + Tenant Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Tenant Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setOrgDropdownOpen(!orgDropdownOpen);
              setUserDropdownOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-all shadow-sm"
          >
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <div className="text-left hidden sm:block">
              <span className="block text-xs text-slate-400 font-normal leading-none mb-0.5">Active Tenant</span>
              <span className="truncate max-w-[180px] block leading-tight">
                {isPlatformAdminMode ? 'SaaS Platform Admin' : currentOrg?.name || 'Select Org'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {orgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Organization Workspace
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {organizations.map(org => {
                  const isSelected = !isPlatformAdminMode && currentOrg?.id === org.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setOrgDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-start justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-teal-50/70 text-teal-900 font-medium' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 leading-tight">{org.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 capitalize">
                          {org.businessType.toLowerCase().replace(/_/g, ' ')} • {org.currency}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-teal-600 mt-1" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={() => {
                    setPlatformAdminMode(true);
                    navigate('admin-overview');
                    setOrgDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${
                    isPlatformAdminMode ? 'bg-teal-50 text-teal-900 font-medium' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    <span>Platform Admin Control</span>
                  </div>
                  {isPlatformAdminMode && <Check className="w-4 h-4 text-teal-600" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warehouse Filter (if inside an organization) */}
        {!isPlatformAdminMode && warehouses.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700">
            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentWarehouseId}
              onChange={e => setWarehouseId(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Warehouses ({warehouses.length})</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Quick actions, Role Switcher, Reset Demo Data, User profile */}
      <div className="flex items-center gap-3">
        {/* Quick actions button */}
        {!isPlatformAdminMode && (
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('pos')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>POS Sale</span>
            </button>
            <button
              onClick={() => navigate('purchases')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Purchase</span>
            </button>
          </div>
        )}

        {/* Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setOrgDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px]">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-slate-900 leading-none truncate max-w-[120px]">{currentUser.name}</div>
              <div className="text-[10px] text-teal-600 font-medium mt-0.5">
                {currentUser.role.replace(/_/g, ' ')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Simulate Role / User
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {availableUsers.map(user => {
                  const isCurrent = currentUser.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {user.role.toLowerCase().replace(/_/g, ' ')}
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-teal-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={() => setResetConfirmOpen(true)}
          title="Reset demonstration data to initial state"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Confirmation Modal for Demo Data Reset */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">Reset Demonstration Data?</h3>
            <p className="text-sm text-slate-600 mt-2">
              This will restore all 3 organizations, warehouses, yarn & fabric products, sales, purchases, and production recipes back to their clean initial state.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllDemoData();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
