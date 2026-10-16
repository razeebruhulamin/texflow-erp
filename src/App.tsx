import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { ProductList } from './pages/products/ProductList';
import { PurchaseList } from './pages/purchases/PurchaseList';
import { SalesList } from './pages/sales/SalesList';
import { PointOfSale } from './pages/pos/PointOfSale';
import { OnlineOrders } from './pages/online-orders/OnlineOrders';
import { ProductionManagement } from './pages/production/ProductionManagement';
import { InventoryLedger } from './pages/inventory/InventoryLedger';
import { WarehouseList } from './pages/inventory/WarehouseList';
import { CustomerList } from './pages/contacts/CustomerList';
import { SupplierList } from './pages/contacts/SupplierList';
import { CustomerCollections } from './pages/finance/CustomerCollections';
import { SupplierPayments } from './pages/finance/SupplierPayments';
import { Expenses } from './pages/finance/Expenses';
import { CashBankAccounts } from './pages/finance/CashBankAccounts';
import { ReportsSuite } from './pages/reports/ReportsSuite';
import { EmployeeList } from './pages/employees/EmployeeList';
import { PayrollManagement } from './pages/employees/PayrollManagement';
import { UsersPermissions } from './pages/admin/UsersPermissions';
import { OrganizationSettings } from './pages/settings/OrganizationSettings';
import { AuditLogView } from './pages/admin/AuditLogView';
import { PlatformAdmin } from './pages/admin/PlatformAdmin';
import { ScenarioGuide } from './pages/scenarios/ScenarioGuide';

const AppContent: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const { isPlatformAdminMode } = useApp();

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard navigate={setCurrentRoute} />;
      case 'products':
        return <ProductList />;
      case 'purchases':
        return <PurchaseList />;
      case 'sales':
        return <SalesList />;
      case 'pos':
        return <PointOfSale />;
      case 'online-orders':
        return <OnlineOrders />;
      case 'production':
        return <ProductionManagement />;
      case 'inventory':
        return <InventoryLedger />;
      case 'warehouses':
        return <WarehouseList />;
      case 'customers':
        return <CustomerList />;
      case 'suppliers':
        return <SupplierList />;
      case 'collections':
        return <CustomerCollections />;
      case 'payments':
        return <SupplierPayments />;
      case 'expenses':
        return <Expenses />;
      case 'cash-bank':
        return <CashBankAccounts />;
      case 'reports':
        return <ReportsSuite />;
      case 'employees':
        return <EmployeeList />;
      case 'payroll':
        return <PayrollManagement />;
      case 'users-permissions':
        return <UsersPermissions />;
      case 'settings':
        return <OrganizationSettings />;
      case 'audit-log':
        return <AuditLogView />;
      case 'admin-overview':
      case 'admin-organizations':
      case 'admin-plans':
        return <PlatformAdmin />;
      case 'scenarios':
        return <ScenarioGuide navigate={setCurrentRoute} />;
      default:
        return <Dashboard navigate={setCurrentRoute} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Sidebar
        currentRoute={currentRoute}
        navigate={setCurrentRoute}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          navigate={setCurrentRoute}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentPage()}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
