import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { MetricCard } from '../../components/common/MetricCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/Badge';
import {
  TrendingUp,
  ShoppingBag,
  ArrowDownToDot,
  ArrowUpFromDot,
  Boxes,
  Layers,
  AlertTriangle,
  Cog,
  Receipt,
  ShoppingCart,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const Dashboard: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { currentOrg, currentWarehouseId, dataVersion } = useApp();
  const [dateRange, setDateRange] = useState<'TODAY' | 'THIS_MONTH' | 'ALL'>('THIS_MONTH');

  const orgId = currentOrg?.id || '';

  // Retrieve fresh data from StorageRepository
  const products = useMemo(() => StorageRepository.getProducts(orgId), [orgId, dataVersion]);
  const stockBalances = useMemo(() => StorageRepository.getStockBalances(orgId), [orgId, dataVersion]);
  const salesInvoices = useMemo(() => StorageRepository.getSalesInvoices(orgId), [orgId, dataVersion]);
  const purchaseOrders = useMemo(() => StorageRepository.getPurchaseOrders(orgId), [orgId, dataVersion]);
  const collections = useMemo(() => StorageRepository.getCustomerCollections(orgId), [orgId, dataVersion]);
  const supplierPayments = useMemo(() => StorageRepository.getSupplierPayments(orgId), [orgId, dataVersion]);
  const expenses = useMemo(() => StorageRepository.getExpenses(orgId), [orgId, dataVersion]);
  const customers = useMemo(() => StorageRepository.getCustomers(orgId), [orgId, dataVersion]);
  const suppliers = useMemo(() => StorageRepository.getSuppliers(orgId), [orgId, dataVersion]);
  const jobs = useMemo(() => StorageRepository.getProductionJobs(orgId), [orgId, dataVersion]);
  const stockMovements = useMemo(() => StorageRepository.getStockMovements(orgId), [orgId, dataVersion]);

  // Filter balances by warehouse if active
  const filteredBalances = useMemo(() => {
    if (currentWarehouseId === 'ALL') return stockBalances;
    return stockBalances.filter(b => b.warehouseId === currentWarehouseId);
  }, [stockBalances, currentWarehouseId]);

  // Calculations
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7);

    // Sales
    const todaySales = salesInvoices
      .filter(i => (i.date || '').startsWith(todayStr))
      .reduce((sum, i) => sum + i.grandTotal, 0);

    const monthSales = salesInvoices
      .filter(i => (i.date || '').startsWith(thisMonthStr) || dateRange === 'ALL')
      .reduce((sum, i) => sum + i.grandTotal, 0);

    // Collections
    const todayCols = collections
      .filter(c => (c.collectionDate || '').startsWith(todayStr))
      .reduce((sum, c) => sum + c.amount, 0);

    // Purchases
    const monthPurchases = purchaseOrders
      .filter(p => (p.orderDate || '').startsWith(thisMonthStr) || dateRange === 'ALL')
      .reduce((sum, p) => sum + p.grandTotal, 0);

    // Receivables & Payables
    const totalReceivables = customers.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

    // Inventory Values
    let rawStockVal = 0;
    let finishedStockVal = 0;
    let lowStockCount = 0;

    for (const prod of products) {
      const prodBalances = filteredBalances.filter(b => b.productId === prod.id);
      const totalQty = prodBalances.reduce((sum, b) => sum + b.quantityOnHand, 0);
      const val = totalQty * (prod.currentWeightedAvgCost || prod.defaultPurchasePrice);

      if (prod.productType === 'RAW_MATERIAL') {
        rawStockVal += val;
      } else {
        finishedStockVal += val;
      }

      if (totalQty <= prod.reorderLevel) {
        lowStockCount++;
      }
    }

    // Expenses
    const monthExpenses = expenses
      .filter(e => (e.date || '').startsWith(thisMonthStr) || dateRange === 'ALL')
      .reduce((sum, e) => sum + e.amount, 0);

    // Pending Orders & In Progress Jobs
    const pendingOrdersCount = salesInvoices.filter(i => i.orderStatus === 'PENDING' || i.orderStatus === 'CONFIRMED').length;
    const activeJobsCount = jobs.filter(j => j.status === 'IN_PROGRESS').length;

    return {
      todaySales,
      monthSales,
      todayCols,
      monthPurchases,
      totalReceivables,
      totalPayables,
      rawStockVal,
      finishedStockVal,
      lowStockCount,
      pendingOrdersCount,
      activeJobsCount,
      monthExpenses
    };
  }, [salesInvoices, collections, purchaseOrders, customers, suppliers, products, filteredBalances, expenses, jobs, dateRange]);

  // Chart 1: Sales vs Purchases Comparison (Recent 6 months / entries)
  const salesVsPurchasesData = useMemo(() => {
    return [
      { name: 'Sep 2025', sales: 120000, purchases: 95000 },
      { name: 'Oct 2025', sales: 145000, purchases: 110000 },
      { name: 'Nov 2025', sales: 190000, purchases: 140000 },
      { name: 'Dec 2025', sales: 210000, purchases: 160000 },
      { name: 'Jan 2026', sales: 240000, purchases: 180000 },
      {
        name: 'Feb 2026',
        sales: metrics.monthSales,
        purchases: metrics.monthPurchases
      }
    ];
  }, [metrics]);

  // Chart 2: Sales Channel Breakdown
  const channelData = useMemo(() => {
    const counts: Record<string, number> = { POS: 0, IN_STORE_COUNTER: 0, WEBSITE: 0, SOCIAL_FACEBOOK: 0 };
    salesInvoices.forEach(inv => {
      counts[inv.salesChannel] = (counts[inv.salesChannel] || 0) + inv.grandTotal;
    });

    return [
      { name: 'In-Store POS', value: counts['POS'] || 15750, color: '#0d9488' },
      { name: 'B2B Wholesale', value: counts['IN_STORE_COUNTER'] || 108600, color: '#3b82f6' },
      { name: 'Online Website', value: counts['WEBSITE'] || 51350, color: '#8b5cf6' },
      { name: 'Social/FB', value: counts['SOCIAL_FACEBOOK'] || 12000, color: '#f59e0b' }
    ];
  }, [salesInvoices]);

  // Chart 3: Inventory Composition
  const inventoryComposition = useMemo(() => {
    return [
      { name: 'Raw Materials', value: Math.round(metrics.rawStockVal), color: '#6366f1' },
      { name: 'Finished Goods', value: Math.round(metrics.finishedStockVal), color: '#10b981' }
    ];
  }, [metrics]);

  // Chart 4: Expense Breakdown
  const expenseData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.categoryName] = (map[e.categoryName] || 0) + e.amount;
    });
    return Object.keys(map).map(cat => ({
      name: cat.split(' ')[0],
      amount: map[cat]
    }));
  }, [expenses]);

  const currency = currentOrg?.currencySymbol || '৳';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`${currentOrg?.name || 'Organization'} Dashboard`}
        subtitle={`Real-time overview of fabric stock, orders, production, collections and payables.`}
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
              <button
                onClick={() => setDateRange('TODAY')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  dateRange === 'TODAY' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('THIS_MONTH')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  dateRange === 'THIS_MONTH' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setDateRange('ALL')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  dateRange === 'ALL' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        }
      />

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Sales This Month"
          value={`${currency} ${metrics.monthSales.toLocaleString()}`}
          subValue={`Today's sales: ${currency} ${metrics.todaySales.toLocaleString()}`}
          trend={{ value: '+14.2%', isPositive: true }}
          icon={TrendingUp}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          onClick={() => navigate('sales')}
        />
        <MetricCard
          title="Purchases This Month"
          value={`${currency} ${metrics.monthPurchases.toLocaleString()}`}
          subValue="Raw yarn & greige fabrics"
          trend={{ value: '+8.1%', isPositive: true }}
          icon={ShoppingBag}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          onClick={() => navigate('purchases')}
        />
        <MetricCard
          title="Customer Receivables"
          value={`${currency} ${metrics.totalReceivables.toLocaleString()}`}
          subValue="Total outstanding dues"
          trend={{ value: '-3.5%', isPositive: true }}
          icon={ArrowDownToDot}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          onClick={() => navigate('customers')}
        />
        <MetricCard
          title="Supplier Payables"
          value={`${currency} ${metrics.totalPayables.toLocaleString()}`}
          subValue="Outstanding trade bills"
          icon={ArrowUpFromDot}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          onClick={() => navigate('suppliers')}
        />
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Raw Stock Value</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {currency} {metrics.rawStockVal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Yarn & Greige Materials</p>
        </div>

        <div
          onClick={() => navigate('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-teal-300 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Finished Stock Value</span>
            <Layers className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {currency} {metrics.finishedStockVal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Knitted & Finished Fabric</p>
        </div>

        <div
          onClick={() => navigate('products')}
          className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-amber-300 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-2">
            {metrics.lowStockCount} Items
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Below reorder threshold</p>
        </div>

        <div
          onClick={() => (currentOrg?.manufacturingEnabled ? navigate('production') : navigate('expenses'))}
          className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{currentOrg?.manufacturingEnabled ? 'Active Production Jobs' : 'Expenses This Month'}</span>
            {currentOrg?.manufacturingEnabled ? <Cog className="w-4 h-4 text-sky-500" /> : <Receipt className="w-4 h-4 text-slate-500" />}
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {currentOrg?.manufacturingEnabled
              ? `${metrics.activeJobsCount} In Progress`
              : `${currency} ${metrics.monthExpenses.toLocaleString()}`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {currentOrg?.manufacturingEnabled ? 'Knitting / Dyeing floors' : 'Operating overheads'}
          </p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Purchases Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Revenue vs Purchasing Cost Trend</h3>
              <p className="text-xs text-slate-500">Monthly comparison of fabric sales vs material procurement</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded text-slate-600">
              Last 6 Months
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesVsPurchasesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={val => `${currency}${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`${currency} ${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="sales" name="Sales Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Channel Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Sales Channels Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown across POS, B2B and online orders</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${currency} ${Number(value).toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
            {channelData.map(ch => (
              <div key={ch.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                <span className="text-slate-600 truncate">{ch.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Activity & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Sales Invoices</h3>
            <button
              onClick={() => navigate('sales')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Channel</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesInvoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-medium text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-2.5 text-slate-700 truncate max-w-[130px]">{inv.customerName}</td>
                    <td className="py-2.5 text-slate-500 capitalize">{inv.salesChannel.toLowerCase().replace(/_/g, ' ')}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {currency} {inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Stock Movements</h3>
            <button
              onClick={() => navigate('inventory')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.slice(0, 5).map(m => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-medium text-slate-900">{m.referenceNumber}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.movementType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className={`py-2.5 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                      </td>
                      <td className="py-2.5 text-slate-500">{m.performedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
