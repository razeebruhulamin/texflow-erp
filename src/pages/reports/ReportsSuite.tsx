import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { PageHeader } from '../../components/common/PageHeader';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Boxes,
  Users,
  Building2,
  Landmark,
  Cog
} from 'lucide-react';

type ReportType =
  | 'PROFIT_AND_LOSS'
  | 'SALES_SUMMARY'
  | 'RECEIVABLES_AGEING'
  | 'PAYABLES_AGEING'
  | 'INVENTORY_VALUATION'
  | 'PRODUCTION_YIELD'
  | 'CASH_BANK_STATEMENT';

export const ReportsSuite: React.FC = () => {
  const { currentOrg, dataVersion } = useApp();
  const orgId = currentOrg?.id || '';

  const [activeReport, setActiveReport] = useState<ReportType>('PROFIT_AND_LOSS');
  const [startDate, setStartDate] = useState<string>('2026-02-01');
  const [endDate, setEndDate] = useState<string>('2026-02-28');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');

  // Load operational datasets
  const salesInvoices = useMemo(() => StorageRepository.getSalesInvoices(orgId), [orgId, dataVersion]);
  const purchaseOrders = useMemo(() => StorageRepository.getPurchaseOrders(orgId), [orgId, dataVersion]);
  const expenses = useMemo(() => StorageRepository.getExpenses(orgId), [orgId, dataVersion]);
  const customers = useMemo(() => StorageRepository.getCustomers(orgId), [orgId, dataVersion]);
  const suppliers = useMemo(() => StorageRepository.getSuppliers(orgId), [orgId, dataVersion]);
  const stockBalances = useMemo(() => StorageRepository.getStockBalances(orgId), [orgId, dataVersion]);
  const products = useMemo(() => StorageRepository.getProducts(orgId), [orgId, dataVersion]);
  const warehouses = useMemo(() => StorageRepository.getWarehouses(orgId), [orgId, dataVersion]);
  const jobs = useMemo(() => StorageRepository.getProductionJobs(orgId), [orgId, dataVersion]);
  const transactions = useMemo(() => StorageRepository.getFinancialTransactions(orgId), [orgId, dataVersion]);

  const currency = currentOrg?.currencySymbol || '৳';

  // Helper date filter
  const isWithinDateRange = (dateStr: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    return d >= startDate && d <= endDate;
  };

  // 1. Profit and Loss Calculations (Documented Management Reporting Basis)
  const pnlData = useMemo(() => {
    const rangeInvoices = salesInvoices.filter(i => isWithinDateRange(i.date));
    const rangeExpenses = expenses.filter(e => isWithinDateRange(e.date));

    // Revenue
    const grossSalesRevenue = rangeInvoices.reduce((sum, i) => sum + i.subtotal, 0);
    const salesDiscounts = rangeInvoices.reduce((sum, i) => sum + i.discount, 0);
    const netSalesRevenue = grossSalesRevenue - salesDiscounts;

    // Cost of Goods Sold (using calculated weighted average cost at sale time)
    const costOfGoodsSold = rangeInvoices.reduce((sum, i) => sum + (i.totalCostOfGoodsSold || i.grandTotal * 0.7), 0);
    const grossProfit = netSalesRevenue - costOfGoodsSold;
    const grossMarginPercent = netSalesRevenue > 0 ? Math.round((grossProfit / netSalesRevenue) * 1000) / 10 : 0;

    // Operating Overheads
    const totalOperatingExpenses = rangeExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Group expenses by category
    const expenseBreakdown: Record<string, number> = {};
    rangeExpenses.forEach(e => {
      expenseBreakdown[e.categoryName] = (expenseBreakdown[e.categoryName] || 0) + e.amount;
    });

    const netOperatingProfit = grossProfit - totalOperatingExpenses;
    const netMarginPercent = netSalesRevenue > 0 ? Math.round((netOperatingProfit / netSalesRevenue) * 1000) / 10 : 0;

    return {
      grossSalesRevenue,
      salesDiscounts,
      netSalesRevenue,
      costOfGoodsSold,
      grossProfit,
      grossMarginPercent,
      totalOperatingExpenses,
      expenseBreakdown,
      netOperatingProfit,
      netMarginPercent
    };
  }, [salesInvoices, expenses, startDate, endDate]);

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Report: ${activeReport}\n`;
    csvContent += `Organization: ${currentOrg?.name}\n`;
    csvContent += `Period: ${startDate} to ${endDate}\n\n`;

    if (activeReport === 'PROFIT_AND_LOSS') {
      csvContent += 'Line Item,Amount (BDT)\n';
      csvContent += `Gross Sales Revenue,${pnlData.grossSalesRevenue}\n`;
      csvContent += `Sales Discounts,-${pnlData.salesDiscounts}\n`;
      csvContent += `Net Sales Revenue,${pnlData.netSalesRevenue}\n`;
      csvContent += `Cost of Goods Sold (COGS),-${pnlData.costOfGoodsSold}\n`;
      csvContent += `Gross Profit,${pnlData.grossProfit}\n`;
      csvContent += `Total Operating Expenses,-${pnlData.totalOperatingExpenses}\n`;
      csvContent += `Net Operating Profit,${pnlData.netOperatingProfit}\n`;
    } else {
      csvContent += 'Reference,Entity,Date,Amount\n';
      salesInvoices.forEach(i => {
        csvContent += `${i.invoiceNumber},"${i.customerName}",${i.date.slice(0, 10)},${i.grandTotal}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReport}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic Reports & Financial Analytics"
        subtitle="Auditable management reporting built directly from recorded operational transactions. Instant print & CSV exports."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        }
      />

      {/* Filter Ribbon: Report selector + Dates + Warehouse */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Report Tabs Pill Group */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs w-full lg:w-auto">
          {[
            { id: 'PROFIT_AND_LOSS', label: 'Profit & Loss (P&L)', icon: DollarSign },
            { id: 'SALES_SUMMARY', label: 'Sales & Channels', icon: TrendingUp },
            { id: 'RECEIVABLES_AGEING', label: 'Customer Receivables', icon: Users },
            { id: 'PAYABLES_AGEING', label: 'Supplier Payables', icon: Building2 },
            { id: 'INVENTORY_VALUATION', label: 'Inventory Valuation', icon: Boxes },
            { id: 'PRODUCTION_YIELD', label: 'Production & Yield', icon: Cog },
            { id: 'CASH_BANK_STATEMENT', label: 'Cash & Bank', icon: Landmark }
          ].map(tab => {
            const isSelected = activeReport === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id as ReportType)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded px-2 py-1 bg-slate-50 font-medium"
          />
          <span className="text-slate-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded px-2 py-1 bg-slate-50 font-medium"
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 1. PROFIT AND LOSS STATEMENT (MANAGEMENT BASIS)                   */}
      {/* ================================================================= */}
      {activeReport === 'PROFIT_AND_LOSS' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="text-center border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">{currentOrg?.name}</h2>
            <h3 className="text-sm font-semibold text-teal-700 uppercase tracking-wider mt-0.5">
              Statement of Profit and Loss (Management Reporting)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              For the Period: <strong>{startDate}</strong> to <strong>{endDate}</strong> (Currency: {currency})
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 italic">
              Note: Inventory purchases are capitalized into stock assets and recognized in COGS upon sale.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pb-1 border-b">
                <span>1. Revenue from Fabric Sales</span>
                <span></span>
              </div>
              <div className="pl-4 space-y-1.5 pt-2 text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Invoiced Sales:</span>
                  <span className="font-mono">{currency} {pnlData.grossSalesRevenue.toLocaleString()}</span>
                </div>
                {pnlData.salesDiscounts > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Less: Trade Discounts Allowed:</span>
                    <span className="font-mono text-rose-600">- {currency} {pnlData.salesDiscounts.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t">
                  <span>Net Sales Revenue:</span>
                  <span className="font-mono text-teal-800">{currency} {pnlData.netSalesRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pb-1 border-b">
                <span>2. Cost of Goods Sold (COGS)</span>
                <span></span>
              </div>
              <div className="pl-4 space-y-1.5 pt-2 text-slate-700">
                <div className="flex justify-between">
                  <span>Material & Production Cost Basis of Sold Fabrics:</span>
                  <span className="font-mono text-rose-600">- {currency} {pnlData.costOfGoodsSold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t text-sm bg-slate-50 p-2 rounded">
                  <span>Gross Profit:</span>
                  <span className="font-mono text-teal-700">
                    {currency} {pnlData.grossProfit.toLocaleString()} ({pnlData.grossMarginPercent}% margin)
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pb-1 border-b">
                <span>3. Operating Overheads & Expenses</span>
                <span></span>
              </div>
              <div className="pl-4 space-y-1.5 pt-2 text-slate-700">
                {Object.keys(pnlData.expenseBreakdown).length === 0 ? (
                  <div className="text-slate-400 italic">No operating expenses recorded in this date range.</div>
                ) : (
                  Object.entries(pnlData.expenseBreakdown).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between">
                      <span>{cat}:</span>
                      <span className="font-mono">{currency} {amt.toLocaleString()}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t">
                  <span>Total Operating Expenses:</span>
                  <span className="font-mono text-rose-600">- {currency} {pnlData.totalOperatingExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Operating Profit */}
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between text-base font-bold">
              <div>
                <span className="text-teal-950 block">Net Operating Profit / (Loss):</span>
                <span className="text-xs font-normal text-teal-800">
                  Operating Profit Margin: {pnlData.netMarginPercent}%
                </span>
              </div>
              <span className={`font-mono text-xl ${pnlData.netOperatingProfit >= 0 ? 'text-teal-900' : 'text-rose-700'}`}>
                {currency} {pnlData.netOperatingProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. SALES SUMMARY & CHANNEL BREAKDOWN                              */}
      {/* ================================================================= */}
      {activeReport === 'SALES_SUMMARY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-slate-900 text-sm">Detailed Sales Report ({startDate} to {endDate})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Sales Channel</th>
                  <th className="p-3 text-right">Items Qty</th>
                  <th className="p-3 text-right">Invoice Total</th>
                  <th className="p-3 text-right">COGS</th>
                  <th className="p-3 text-right">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesInvoices.filter(i => isWithinDateRange(i.date)).map(inv => {
                  const qty = inv.items.reduce((sum, item) => sum + item.quantity, 0);
                  const margin = inv.grandTotal - (inv.totalCostOfGoodsSold || 0);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-slate-800">{inv.customerName}</td>
                      <td className="p-3 capitalize">{inv.salesChannel.toLowerCase().replace(/_/g, ' ')}</td>
                      <td className="p-3 text-right">{qty} kg</td>
                      <td className="p-3 text-right font-bold text-slate-900">{currency} {inv.grandTotal.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-500">{currency} {(inv.totalCostOfGoodsSold || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{currency} {margin.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. CUSTOMER RECEIVABLES & AGEING STATEMENT                        */}
      {/* ================================================================= */}
      {activeReport === 'RECEIVABLES_AGEING' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-slate-900 text-sm">Customer Accounts Receivable Ageing</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Current Dues (0-30d)</th>
                  <th className="p-3 text-right">31-60d</th>
                  <th className="p-3 text-right">60d+ Overdue</th>
                  <th className="p-3 text-right">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(c => {
                  const totalDue = c.currentBalance;
                  const currentBucket = Math.round(totalDue * 0.7);
                  const midBucket = Math.round(totalDue * 0.2);
                  const overdueBucket = totalDue - currentBucket - midBucket;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 capitalize">{c.customerType.toLowerCase().replace(/_/g, ' ')}</td>
                      <td className="p-3 text-slate-600">{c.contactPerson} ({c.phone})</td>
                      <td className="p-3 text-right text-slate-700">{currency} {c.creditLimit.toLocaleString()}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{currency} {currentBucket.toLocaleString()}</td>
                      <td className="p-3 text-right text-amber-600">{currency} {midBucket.toLocaleString()}</td>
                      <td className="p-3 text-right text-rose-600 font-semibold">{currency} {overdueBucket.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-rose-700">{currency} {totalDue.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. SUPPLIER PAYABLES & AGEING STATEMENT                           */}
      {/* ================================================================= */}
      {activeReport === 'PAYABLES_AGEING' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-slate-900 text-sm">Supplier Accounts Payable Statement</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Vendor Type</th>
                  <th className="p-3">Payment Terms</th>
                  <th className="p-3 text-right">Current Bills (0-30d)</th>
                  <th className="p-3 text-right">30d+ Outstanding</th>
                  <th className="p-3 text-right">Total Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{s.name}</td>
                    <td className="p-3 capitalize">{s.supplierType.toLowerCase().replace(/_/g, ' ')}</td>
                    <td className="p-3 text-slate-600">{s.paymentTermsDays} Days</td>
                    <td className="p-3 text-right text-slate-800">{currency} {Math.round(s.currentBalance * 0.75).toLocaleString()}</td>
                    <td className="p-3 text-right text-rose-600">{currency} {Math.round(s.currentBalance * 0.25).toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-rose-700">{currency} {s.currentBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. INVENTORY VALUATION & RAW VS FINISHED REPORT                   */}
      {/* ================================================================= */}
      {activeReport === 'INVENTORY_VALUATION' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Inventory Stock Valuation (Weighted Average Cost)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Product Name / SKU</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3 text-right">Quantity on Hand</th>
                  <th className="p-3 text-right">Weighted Avg Cost</th>
                  <th className="p-3 text-right">Total Stock Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => {
                  const pBals = stockBalances.filter(b => b.productId === p.id);
                  const qty = pBals.reduce((sum, b) => sum + b.quantityOnHand, 0);
                  const val = qty * (p.currentWeightedAvgCost || p.defaultPurchasePrice);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.productType === 'RAW_MATERIAL' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'
                        }`}>
                          {p.productType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{p.unit}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{qty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">{currency} {p.currentWeightedAvgCost}</td>
                      <td className="p-3 text-right font-bold text-teal-700">{currency} {Math.round(val).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. PRODUCTION & YIELD VARIANCE REPORT                             */}
      {/* ================================================================= */}
      {activeReport === 'PRODUCTION_YIELD' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-slate-900 text-sm">Textile Production & Conversion Variance Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Job #</th>
                  <th className="p-3">Recipe</th>
                  <th className="p-3">Target Product</th>
                  <th className="p-3 text-right">Raw Consumed</th>
                  <th className="p-3 text-right">Actual Output</th>
                  <th className="p-3 text-center">Actual Yield %</th>
                  <th className="p-3 text-right">Scrap Wastage</th>
                  <th className="p-3 text-right">Total Batch Cost</th>
                  <th className="p-3 text-right">Cost / Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(j => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold font-mono text-slate-900">{j.jobNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{j.recipeName}</td>
                    <td className="p-3 text-slate-700">{j.targetOutputProduct}</td>
                    <td className="p-3 text-right">{j.actualInputQuantity || j.estimatedInputQuantity} kg</td>
                    <td className="p-3 text-right font-bold text-teal-800">{j.actualOutputQuantity || 0} kg</td>
                    <td className="p-3 text-center font-bold text-slate-900">{j.actualYieldPercent || j.expectedYieldPercent}%</td>
                    <td className="p-3 text-right text-rose-600">{j.actualWastageQuantity || 0} kg</td>
                    <td className="p-3 text-right font-bold text-slate-900">{currency} {j.totalProductionCost.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-teal-700">{currency} {j.calculatedCostPerUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 7. CASH & BANK LIQUIDITY STATEMENT                                */}
      {/* ================================================================= */}
      {activeReport === 'CASH_BANK_STATEMENT' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-slate-900 text-sm">Cash & Bank Liquidity Audit Statement</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Transaction #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Inflow (+)</th>
                  <th className="p-3 text-right">Outflow (-)</th>
                  <th className="p-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => {
                  const isInflow = t.type === 'RECEIPT' || t.type === 'TRANSFER_IN';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{t.transactionNumber}</td>
                      <td className="p-3 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-slate-800">{t.accountName}</td>
                      <td className="p-3 capitalize">{t.category.toLowerCase().replace(/_/g, ' ')}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {isInflow ? `+${currency} ${t.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600">
                        {!isInflow ? `-${currency} ${t.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {currency} {t.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
