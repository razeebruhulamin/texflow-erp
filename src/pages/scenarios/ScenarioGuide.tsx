import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import {
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Cog,
  Store,
  ArrowDownToDot,
  Receipt,
  UserCheck,
  Warehouse,
  Boxes,
  FileSpreadsheet,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface ScenarioItem {
  id: string;
  code: string;
  title: string;
  description: string;
  targetOrgId: string;
  targetOrgName: string;
  recommendedRole: string;
  targetRoute: string;
  steps: string[];
  verificationCriteria: string[];
}

export const ScenarioGuide: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { switchOrganization, switchUser, users, notify, resetAllDemoData } = useApp();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('A');

  const scenarios: ScenarioItem[] = [
    {
      id: 'A',
      code: 'Scenario A',
      title: 'Purchasing & Warehouse Goods Receipt',
      description: 'Test yarn procurement, goods receipt note, raw inventory increase, and supplier payable ledger.',
      targetOrgId: 'org-knitting',
      targetOrgName: 'Apex Knitting Mills Ltd.',
      recommendedRole: 'STOREKEEPER',
      targetRoute: 'purchases',
      steps: [
        'Open Apex Knitting Mills organization.',
        'View supplier Square Spinning Mills or create a new spinning supplier.',
        'Create a Purchase Order for 1,000 kg of 30s/1 Combed Cotton Yarn.',
        'Click "Receive Stock" to post the Goods Receipt Note (GRN) into Raw Yarn Store.',
        'Confirm raw yarn stock increases by 1,000 kg and supplier payables update.'
      ],
      verificationCriteria: [
        'Stock balance increased in Raw Yarn Warehouse.',
        'Stock Movement ledger recorded a PURCHASE_RECEIPT audit entry.',
        'Supplier outstanding balance reflects the unpaid invoice portion.'
      ]
    },
    {
      id: 'B',
      code: 'Scenario B',
      title: 'Production Estimation & Fiber Conversion',
      description: 'Test circular knitting recipe (BOM), 85% yield calculation (1,000 kg yarn → 850 kg fabric), and finished goods receipt.',
      targetOrgId: 'org-knitting',
      targetOrgName: 'Apex Knitting Mills Ltd.',
      recommendedRole: 'PRODUCTION_MANAGER',
      targetRoute: 'production',
      steps: [
        'Navigate to Textile Production & Conversion Engine.',
        'In Production Estimator, select "Single Jersey 160 GSM Combed Cotton Standard Knitting".',
        'Verify configured 85% yield: inputting 1,000 kg yarn yields exactly 850 kg finished fabric with 150 kg lint wastage.',
        'Verify estimated material cost, direct labor, overheads, and cost per finished kg.',
        'Launch job and click "Complete Job" to post actual output into finished goods store.'
      ],
      verificationCriteria: [
        'Estimator shows real-time shortage warning if raw stock is insufficient.',
        'Completing job reduces raw yarn by 1,000 kg and increases finished fabric by 850 kg.',
        'Weighted-average cost of finished goods updates automatically.'
      ]
    },
    {
      id: 'C',
      code: 'Scenario C',
      title: 'POS Counter & Online Channel Sales',
      description: 'Test rapid in-store counter POS billing with cash change calculation, and B2B credit dispatch.',
      targetOrgId: 'org-trading',
      targetOrgName: 'TexVogue Fabrics Ltd.',
      recommendedRole: 'POS_CASHIER',
      targetRoute: 'pos',
      steps: [
        'Switch to TexVogue Fabrics Ltd. and open In-Store POS.',
        'Search or click fabric items to add rolls to cart.',
        'Select Cash payment method, enter tendered cash, and observe automatic change calculation.',
        'Click "Complete Sale" to issue instant printable receipt.',
        'Observe immediate stock deduction in inventory and cash drawer balance increase.'
      ],
      verificationCriteria: [
        'System prevents checkout if requested quantity exceeds available stock.',
        'Cash drawer receives immediate payment receipt.',
        'Online sales channel records social commerce orders with shipping addresses.'
      ]
    },
    {
      id: 'D',
      code: 'Scenario D',
      title: 'Customer Collections & Supplier Payments',
      description: 'Test accounts receivable collection against sales invoices and accounts payable vouchers.',
      targetOrgId: 'org-trading',
      targetOrgName: 'TexVogue Fabrics Ltd.',
      recommendedRole: 'ACCOUNTANT',
      targetRoute: 'collections',
      steps: [
        'Open Customer Collections and select a customer with outstanding dues.',
        'Record a partial money receipt (e.g. ৳20,000) deposited into bank account.',
        'Check Customer Ledger to verify debit/credit balance reduces.',
        'Navigate to Supplier Payments and issue a debit payment voucher.',
        'Confirm supplier payables decrease and bank account liquidity balance deducts.'
      ],
      verificationCriteria: [
        'Money receipts update running customer balances consistently.',
        'Supplier payments reduce accounts payable and link to PO references.'
      ]
    },
    {
      id: 'E',
      code: 'Scenario E',
      title: 'Operating Expenses & Profit & Loss Statement',
      description: 'Test operating expenses recording, cash deduction, and clean accounting separation in P&L.',
      targetOrgId: 'org-trading',
      targetOrgName: 'TexVogue Fabrics Ltd.',
      recommendedRole: 'ACCOUNTANT',
      targetRoute: 'expenses',
      steps: [
        'Navigate to Operating Expenses and record an expense (e.g. Warehouse Rent ৳45,000).',
        'Verify bank account balance is deducted.',
        'Open Reports Suite → Profit and Loss Statement.',
        'Verify that inventory purchases are NOT treated as immediate P&L operating expenses.',
        'Verify Gross Profit = Net Sales - COGS, and Operating Profit = Gross Profit - Operating Expenses.'
      ],
      verificationCriteria: [
        'Documented management reporting basis accurately applied.',
        'Stock purchases capitalized to inventory assets rather than expensed upfront.'
      ]
    },
    {
      id: 'F',
      code: 'Scenario F',
      title: 'Employee Salary & Manual Absence Deductions',
      description: 'Test manual absence deduction without biometric/GPS hardware using configured divisor.',
      targetOrgId: 'org-knitting',
      targetOrgName: 'Apex Knitting Mills Ltd.',
      recommendedRole: 'HR_PAYROLL_OFFICER',
      targetRoute: 'payroll',
      steps: [
        'Open Manual Absence & Salary Payroll Engine.',
        'Click "Calculate & Post Payroll" and select an employee.',
        'Enter 2 absent days manually.',
        'Verify daily deduction formula: Daily Rate = Basic Salary ÷ configured divisor (26 or 30 days).',
        'Approve payroll, click "Disburse Pay", and generate printable salary slip.'
      ],
      verificationCriteria: [
        'Absence deduction amount matches absent days × daily rate.',
        'Salary payment generates financial transaction in bank ledger without duplicate deduction.'
      ]
    },
    {
      id: 'G',
      code: 'Scenario G',
      title: 'Multi-Warehouse Inventory Transfer',
      description: 'Test moving stock between warehouses while preserving organization-wide balance.',
      targetOrgId: 'org-trading',
      targetOrgName: 'TexVogue Fabrics Ltd.',
      recommendedRole: 'STOREKEEPER',
      targetRoute: 'inventory',
      steps: [
        'Open Inventory Ledger → Transfers tab.',
        'Click "Transfer Stock" and select a fabric product.',
        'Transfer 100 kg from Dhaka Central Warehouse to Chittagong Retail Outlet.',
        'Verify source warehouse quantity decreases by 100 kg.',
        'Verify destination warehouse quantity increases by 100 kg.',
        'Confirm total organization-wide inventory remains exactly the same.'
      ],
      verificationCriteria: [
        'Source warehouse deducted, destination warehouse credited.',
        'Two balancing stock movements (TRANSFER_OUT and TRANSFER_IN) logged in ledger.'
      ]
    },
    {
      id: 'H',
      code: 'Scenario H',
      title: 'Multi-Tenant Data Isolation',
      description: 'Verify strict isolation between Organization A (Trading), Org B (Knitting), and Org C (Dyeing).',
      targetOrgId: 'org-trading',
      targetOrgName: 'TexVogue Fabrics Ltd.',
      recommendedRole: 'ORGANIZATION_OWNER',
      targetRoute: 'products',
      steps: [
        'In Organization A, note products, customers, and inventory balances.',
        'Use Top Navbar tenant switcher to switch to Organization B (Knitting Mills).',
        'Verify that Organization A records (customers, invoices, products, warehouses) are completely invisible in Org B.',
        'Switch to Platform Super Admin to manage SaaS tenant accounts without exposing operational records.'
      ],
      verificationCriteria: [
        'Data repository scopes all queries by organizationId.',
        'Platform administrator manages tenants only via designated platform area.'
      ]
    },
    {
      id: 'I',
      code: 'Scenario I',
      title: 'Role-Based Permissions & Data Persistence',
      description: 'Test RBAC role simulation and persistence across page reloads.',
      targetOrgId: 'org-trading',
      targetOrgName: 'TexVogue Fabrics Ltd.',
      recommendedRole: 'POS_CASHIER',
      targetRoute: 'pos',
      steps: [
        'Switch user to POS Cashier (Sonia Akter).',
        'Observe sidebar navigation: sensitive financial settings and payroll are hidden.',
        'Switch user to Accountant (Fahim Ahmed) to observe financial access.',
        'Save any transaction, reload the browser tab, and confirm data persists in localStorage.'
      ],
      verificationCriteria: [
        'Non-authorized modules hidden from restricted roles.',
        'All state stored in structured localStorage repository layer with zero data loss.'
      ]
    },
    {
      id: 'J',
      code: 'Scenario J',
      title: 'Dynamic Reports & Date-Range Recalculation',
      description: 'Test real-time date filtering, channel margin analysis, and CSV/print generation.',
      targetOrgId: 'org-trading',
      targetOrgName: 'TexVogue Fabrics Ltd.',
      recommendedRole: 'ORGANIZATION_OWNER',
      targetRoute: 'reports',
      steps: [
        'Navigate to Financial & Ops Reports Suite.',
        'Select "Profit & Loss (P&L)" report.',
        'Change From/To dates and observe dynamic recalculation of revenues, COGS, and operating expenses.',
        'Switch to Inventory Valuation or Customer Receivables report.',
        'Click "Export CSV" to download formatted report spreadsheet.'
      ],
      verificationCriteria: [
        'Figures dynamically recalculate based on selected dates.',
        'CSV export triggers browser file download.'
      ]
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  const handleLaunchScenario = (sc: ScenarioItem) => {
    switchOrganization(sc.targetOrgId);
    // Find matching role user
    const targetUser = users.find(u => u.organizationId === sc.targetOrgId && u.role === sc.recommendedRole);
    if (targetUser) {
      switchUser(targetUser.id);
    }
    notify(`Switched context for ${sc.code}: ${sc.targetOrgName}`, 'info');
    navigate(sc.targetRoute);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical End-to-End Acceptance Scenarios (A - J)"
        subtitle="Guided interactive verification suite demonstrating all 10 business workflows mandated in the master specification."
        actions={
          <button
            onClick={() => {
              resetAllDemoData();
              notify('Demo data restored to initial clean state.', 'info');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Seed Data</span>
          </button>
        }
      />

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Scenario List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          {scenarios.map(sc => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {sc.code}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {sc.targetOrgName.split(' ')[0]}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">{sc.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sc.description}</p>
              </div>
            );
          })}
        </div>

        {/* Right Side: Detailed Scenario Interactive Guide & One-Click Runner (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded">
                {currentScenario.code}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{currentScenario.title}</h2>
              <p className="text-xs text-slate-600 mt-1">{currentScenario.description}</p>
            </div>

            <button
              onClick={() => handleLaunchScenario(currentScenario)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 shrink-0 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch & Test Scenario</span>
            </button>
          </div>

          {/* Test Setup Details */}
          <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border">
            <div>
              <span className="text-slate-400 block text-[11px]">Target Organization</span>
              <span className="font-bold text-slate-900 block mt-0.5">{currentScenario.targetOrgName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Recommended Demo Role</span>
              <span className="font-bold text-teal-700 block mt-0.5">
                {currentScenario.recommendedRole.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Primary Test Screen</span>
              <span className="font-bold text-indigo-700 block mt-0.5 capitalize">
                {currentScenario.targetRoute}
              </span>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Step-by-Step Execution Workflow:
            </h4>
            <div className="space-y-2 text-xs">
              {currentScenario.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-white shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center shrink-0 text-[11px]">
                    {idx + 1}
                  </div>
                  <span className="text-slate-700 leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance Verification Criteria */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Verification & Acceptance Criteria:
            </h4>
            <div className="space-y-1.5 text-xs">
              {currentScenario.verificationCriteria.map((crit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{crit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
