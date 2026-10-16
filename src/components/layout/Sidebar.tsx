import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  ShoppingCart,
  Store,
  Globe,
  Cog,
  Boxes,
  Warehouse as WarehouseIcon,
  Users,
  Building2,
  BookOpen,
  ArrowDownToDot,
  ArrowUpFromDot,
  Receipt,
  Landmark,
  FileSpreadsheet,
  UserCheck,
  CreditCard,
  ShieldAlert,
  Settings,
  History,
  ShieldCheck,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  navigate,
  collapsed
}) => {
  const { currentOrg, currentUser, isPlatformAdminMode, setPlatformAdminMode } = useApp();

  const isRole = (roles: string[]) => {
    if (currentUser.role === 'PLATFORM_SUPER_ADMIN' || currentUser.role === 'ORGANIZATION_OWNER') return true;
    return roles.includes(currentUser.role);
  };

  const navItemClass = (route: string) => {
    const isActive = currentRoute === route;
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
      isActive
        ? 'bg-teal-600 text-white shadow-sm font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      } h-screen sticky top-0`}
    >
      {/* Brand & Org Profile */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              TF
            </div>
            <div className="truncate">
              <h1 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                TexFlow <span className="text-[10px] bg-teal-100 text-teal-800 px-1 py-0.2 rounded font-semibold">ERP</span>
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {isPlatformAdminMode ? 'SaaS Platform Admin' : currentOrg?.name || 'Textile Management'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            TF
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Scenario Acceptance Tests Runner Pill */}
        {!collapsed && (
          <div
            onClick={() => navigate('scenarios')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              currentRoute === 'scenarios'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>E2E Acceptance Scenarios</span>
            </div>
            <p className={`text-[11px] mt-0.5 ${currentRoute === 'scenarios' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              Scenarios A - J Interactive Guide
            </p>
          </div>
        )}

        {/* Platform Administration Mode Nav */}
        {isPlatformAdminMode ? (
          <div>
            {!collapsed && (
              <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                Platform Admin
              </p>
            )}
            <nav className="space-y-1">
              <div onClick={() => navigate('admin-overview')} className={navItemClass('admin-overview')}>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!collapsed && <span>SaaS Overview</span>}
              </div>
              <div onClick={() => navigate('admin-organizations')} className={navItemClass('admin-organizations')}>
                <Building2 className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Organizations</span>}
              </div>
              <div onClick={() => navigate('admin-plans')} className={navItemClass('admin-plans')}>
                <CreditCard className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Subscription Plans</span>}
              </div>
            </nav>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div>
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  Overview
                </p>
              )}
              <nav className="space-y-1">
                <div onClick={() => navigate('dashboard')} className={navItemClass('dashboard')}>
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Dashboard</span>}
                </div>
              </nav>
            </div>

            {/* Business Operations */}
            <div>
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  Operations
                </p>
              )}
              <nav className="space-y-1">
                {isRole(['ORGANIZATION_ADMIN', 'MANAGER', 'STOREKEEPER', 'SALES_EXECUTIVE']) && (
                  <div onClick={() => navigate('products')} className={navItemClass('products')}>
                    <Layers className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Products & Specs</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'MANAGER', 'STOREKEEPER', 'ACCOUNTANT']) && (
                  <div onClick={() => navigate('purchases')} className={navItemClass('purchases')}>
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Purchases & Orders</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'MANAGER', 'SALES_EXECUTIVE', 'POS_CASHIER']) && (
                  <div onClick={() => navigate('sales')} className={navItemClass('sales')}>
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Sales & Invoices</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'SALES_EXECUTIVE', 'POS_CASHIER']) && (
                  <div onClick={() => navigate('pos')} className={navItemClass('pos')}>
                    <Store className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>In-Store POS</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'MANAGER', 'SALES_EXECUTIVE']) && (
                  <div onClick={() => navigate('online-orders')} className={navItemClass('online-orders')}>
                    <Globe className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Online & Social Sales</span>}
                  </div>
                )}

                {currentOrg?.manufacturingEnabled && isRole(['ORGANIZATION_ADMIN', 'PRODUCTION_MANAGER']) && (
                  <div onClick={() => navigate('production')} className={navItemClass('production')}>
                    <Cog className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Textile Production & BOM</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'MANAGER', 'STOREKEEPER']) && (
                  <div onClick={() => navigate('inventory')} className={navItemClass('inventory')}>
                    <Boxes className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Inventory Ledger</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'STOREKEEPER']) && (
                  <div onClick={() => navigate('warehouses')} className={navItemClass('warehouses')}>
                    <WarehouseIcon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Warehouses</span>}
                  </div>
                )}
              </nav>
            </div>

            {/* Contacts */}
            <div>
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  Contacts & Ledgers
                </p>
              )}
              <nav className="space-y-1">
                {isRole(['ORGANIZATION_ADMIN', 'SALES_EXECUTIVE', 'ACCOUNTANT']) && (
                  <div onClick={() => navigate('customers')} className={navItemClass('customers')}>
                    <Users className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Customers & Ledger</span>}
                  </div>
                )}
                {isRole(['ORGANIZATION_ADMIN', 'ACCOUNTANT', 'STOREKEEPER']) && (
                  <div onClick={() => navigate('suppliers')} className={navItemClass('suppliers')}>
                    <Building2 className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Suppliers & Ledger</span>}
                  </div>
                )}
              </nav>
            </div>

            {/* Finance */}
            <div>
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  Finance & Accounts
                </p>
              )}
              <nav className="space-y-1">
                {isRole(['ORGANIZATION_ADMIN', 'ACCOUNTANT', 'SALES_EXECUTIVE']) && (
                  <div onClick={() => navigate('collections')} className={navItemClass('collections')}>
                    <ArrowDownToDot className="w-4 h-4 shrink-0 text-emerald-600" />
                    {!collapsed && <span>Customer Collections</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'ACCOUNTANT']) && (
                  <div onClick={() => navigate('payments')} className={navItemClass('payments')}>
                    <ArrowUpFromDot className="w-4 h-4 shrink-0 text-rose-500" />
                    {!collapsed && <span>Supplier Payments</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'ACCOUNTANT']) && (
                  <div onClick={() => navigate('expenses')} className={navItemClass('expenses')}>
                    <Receipt className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Operating Expenses</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'ACCOUNTANT']) && (
                  <div onClick={() => navigate('cash-bank')} className={navItemClass('cash-bank')}>
                    <Landmark className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Cash & Bank Accounts</span>}
                  </div>
                )}

                {isRole(['ORGANIZATION_ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER_AUDITOR']) && (
                  <div onClick={() => navigate('reports')} className={navItemClass('reports')}>
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Financial & Ops Reports</span>}
                  </div>
                )}
              </nav>
            </div>

            {/* People & HR */}
            <div>
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  People & Payroll
                </p>
              )}
              <nav className="space-y-1">
                {isRole(['ORGANIZATION_ADMIN', 'HR_PAYROLL_OFFICER']) && (
                  <>
                    <div onClick={() => navigate('employees')} className={navItemClass('employees')}>
                      <UserCheck className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>Employees</span>}
                    </div>
                    <div onClick={() => navigate('payroll')} className={navItemClass('payroll')}>
                      <CreditCard className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>Manual Payroll</span>}
                    </div>
                  </>
                )}
              </nav>
            </div>

            {/* Administration */}
            <div>
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  Administration
                </p>
              )}
              <nav className="space-y-1">
                {isRole(['ORGANIZATION_ADMIN']) && (
                  <div onClick={() => navigate('users-permissions')} className={navItemClass('users-permissions')}>
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Users & Permissions</span>}
                  </div>
                )}
                {isRole(['ORGANIZATION_ADMIN']) && (
                  <div onClick={() => navigate('settings')} className={navItemClass('settings')}>
                    <Settings className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Organization Settings</span>}
                  </div>
                )}
                <div onClick={() => navigate('audit-log')} className={navItemClass('audit-log')}>
                  <History className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Audit Trail</span>}
                </div>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Footer Switcher to Platform Admin */}
      <div className="p-3 border-t border-slate-200">
        {!collapsed && (
          <button
            onClick={() => {
              if (isPlatformAdminMode) {
                setPlatformAdminMode(false);
                navigate('dashboard');
              } else {
                setPlatformAdminMode(true);
                navigate('admin-overview');
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-slate-700 bg-slate-50 hover:bg-slate-100"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>{isPlatformAdminMode ? 'Exit Platform Admin' : 'Platform Super Admin'}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
