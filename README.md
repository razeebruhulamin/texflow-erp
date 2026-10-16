# TexFlow ERP — Multi-Tenant Textile & Fabric Business Management SaaS

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646cff.svg)](https://vitejs.dev/)

**TexFlow ERP** is a modern, responsive, multi-tenant Software-as-a-Service (SaaS) platform architected specifically for the textile, fabric manufacturing, dyeing, and apparel trading industry. 

The system serves diverse textile business models on a unified SaaS platform with isolated data workspaces:
1. **Fabric & Textile Fiber Wholesalers / Traders** (Multi-warehouse stock, B2B contracts, in-store POS, online sales).
2. **Knitting & Fabric Manufacturing Factories** (Raw yarn consumption, BOM recipes, yield/wastage estimation, finished goods receipt).
3. **Fabric Dyeing, Coloring & Finishing Plants** (Greige fabric input, reactive dye recipes, yield and quality inspection).
4. **SaaS Platform Super Administration** (Organization onboarding, subscription tiers, resource quotas, tenant status).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+ / v22+
- **npm**: v9+ or v10+

### 2. Installation & Run
```bash
# Navigate to the project directory
cd texflow-erp

# Install dependencies (already installed)
npm install

# Start the development server
npm run dev

# Build production bundle
npm run build
```

Once started with `npm run dev`, open `http://localhost:5173` in your browser.

---

## 🏢 Demonstration Organizations & Fictional Business Models

The prototype comes seeded with three independent, fully populated organizations representing different business models in Bangladesh's textile sector:

| Organization | Business Model | Warehouses | Focus Capabilities |
| :--- | :--- | :--- | :--- |
| **TexVogue Fabrics Ltd.** (`org-trading`) | Finished Fabric Wholesale & Retail Trading | Dhaka Central Depot, Chittagong Retail Outlet | Counter POS, B2B Credit Sales, Online E-Commerce orders, multi-warehouse stock transfers. |
| **Apex Knitting Mills Ltd.** (`org-knitting`) | Circular Knitting Manufacturing Factory | Raw Material Yarn Store, Knitted Goods Store | 30s/24s Cotton Yarn procurement, 85% yield Single Jersey BOM recipe, labor & machine overhead costing. |
| **Chroma Dyeing & Finishing Ltd.** (`org-dyeing`) | Dyehouse & Chemical Finishing Plant | Greige Receiving Shed, Finished Goods Warehouse | Greige fabric processing, reactive dye recipes (92% yield), batch inspection. |
| **Platform Super Admin** | Central SaaS Management | Platform View | Tenant onboarding, subscription plan tiers (Starter, Pro, Enterprise), user quotas. |

### Demo Role Simulator
Use the **User / Role Switcher** in the top navigation bar to test role-based access:
- **Platform Super Admin** (Ahmad Tanvir) — Platform tenant administration.
- **Organization Owner** (Kabir Hossain / Mustafizur Rahman) — Complete enterprise management.
- **Production Manager** (Rafiqul Islam) — BOM formulas, recipe estimation, floor job completion.
- **Storekeeper** (Jahangir Alam) — Goods receipts, stock movements, inter-warehouse transfers.
- **Accountant** (Fahim Ahmed) — Money receipts, payment vouchers, operating expenses, financial statements.
- **POS Cashier** (Sonia Akter) — Rapid counter sales, change calculation, cash drawer management.
- **HR & Payroll Officer** (Nusrat Jahan) — Employee directory, manual absence deduction calculations.

---

## 🎯 Verification of Scenarios A through J

An interactive **Acceptance Scenarios Guide** is available directly in the sidebar with 1-click test launches:

- **Scenario A: Purchasing & Goods Receipt**
  - Apex Knitting Mills creates a Purchase Order for 1,000 kg 30s Combed Cotton Yarn from Square Spinning Mills.
  - Clicking "Receive Stock" updates the Raw Yarn Warehouse balance by 1,000 kg, updates the supplier payable balance, and writes a `PURCHASE_RECEIPT` audit movement.
- **Scenario B: Production Estimation & Conversion**
  - Circular Knitting Recipe configured for 85% yield.
  - Interactive two-way Estimator: Inputting 1,000 kg yarn calculates exactly 850 kg finished fabric with 150 kg lint wastage.
  - Real-time stock availability check alerts of shortages.
  - Completing the job deducts 1,000 kg raw yarn, receives 850 kg finished single jersey fabric into the finished goods store, and updates the finished goods weighted-average cost.
- **Scenario C: POS & Online Sales**
  - In-store POS rapid barcode/SKU search, category pills, shopping cart, line-item discounts.
  - Cash tendered with automatic return change calculation.
  - Complete Sale issues an instant printable thermal receipt, deducts inventory, and records cash in drawer.
  - Online sales module handles social commerce / courier orders with shipping addresses and dispatch workflows.
- **Scenario D: Collections & Supplier Payments**
  - Partial customer money receipt reduces customer ledger due and deposits funds into bank account.
  - Supplier payment voucher reduces accounts payable liability and disburses funds from bank account.
- **Scenario E: Operating Expenses & Profit & Loss Statement**
  - Operating expenses (rent, electricity, transport) deduct cash/bank liquidity.
  - Reports Suite generates a Profit and Loss statement: Gross Revenue minus Sales Discounts = Net Revenue; Net Revenue minus COGS = Gross Profit; Gross Profit minus Operating Expenses = Net Operating Profit.
  - Raw material inventory purchases are capitalized into stock assets rather than being expensed upfront.
- **Scenario F: Employee Salary & Manual Absence Deduction**
  - Strictly manual absence entry (no biometric/GPS hardware).
  - Daily absence rate formula = `Basic Salary ÷ Configured Divisor (e.g. 30 or 26 days)`.
  - Net salary = Basic + Allowances + Bonus - Absence Deduction - Advance Adjustment.
  - Post payment disburses from bank account and generates printable salary slip.
- **Scenario G: Multi-Warehouse Inventory Transfer**
  - Transferring 100 kg of fabric from Dhaka Central Warehouse to Chittagong Depot deducts source and credits destination.
  - Total organization-wide stock balance remains unchanged.
- **Scenario H: SaaS Tenant Data Isolation**
  - Switching between TexVogue Fabrics and Apex Knitting Mills isolates products, stock, invoices, customers, and financial records.
- **Scenario I: Permissions & Persistence**
  - Role permissions restrict sensitive modules (e.g., POS cashier cannot access payroll or settings).
  - Data persists across browser reloads via the structured `StorageRepository` layer.
- **Scenario J: Dynamic Date-Filtered Reports**
  - Centralized reports suite recalculates revenue, COGS, payables, and receivables based on From/To date pickers.
  - Supports CSV export and printable layouts.

---

## 🗄️ Architecture & Data Model

### Directory Structure
```
texflow-erp/
├── src/
│   ├── types/
│   │   └── index.ts                 # Strong TypeScript domain definitions
│   ├── services/
│   │   ├── seedData.ts              # Realistic textile seed data (3 orgs + plans)
│   │   └── storage.ts               # localStorage repository & business transaction engine
│   ├── context/
│   │   └── AppContext.tsx           # Multi-tenant context, role switcher, toasts
│   ├── components/
│   │   ├── common/                  # MetricCard, Badge, PageHeader, ToastContainer
│   │   └── layout/                  # Sidebar, TopNavbar
│   ├── pages/
│   │   ├── dashboard/               # KPI cards, Recharts trends, live activity
│   │   ├── products/                # Textile catalog, yarn counts, GSM, widths
│   │   ├── purchases/               # Purchase orders, Goods Receipt Note (GRN)
│   │   ├── sales/                   # B2B contracts, invoices, commercial tax invoice
│   │   ├── pos/                     # Fast counter POS, cart, receipt printing
│   │   ├── online-orders/           # E-commerce, social commerce, courier dispatch
│   │   ├── production/              # BOM recipes, two-way estimator, job execution
│   │   ├── inventory/               # Stock ledger, inter-warehouse transfers, adjustments
│   │   ├── contacts/                # Customer and supplier ledgers
│   │   ├── finance/                 # Collections, payments, expenses, cash/bank
│   │   ├── employees/               # Directory, manual absence payroll, pay slips
│   │   ├── reports/                 # P&L, sales, receivables ageing, payables, stock
│   │   ├── settings/                # Business profile, currency, absence divisor policy
│   │   ├── admin/                   # SaaS platform overview, onboarding, audit log
│   │   └── scenarios/               # Interactive acceptance scenarios A - J runner
│   ├── App.tsx                      # Layout shell and routing
│   └── main.tsx                     # Entry point
```

### Relational Schema Blueprint for Production Backend (PostgreSQL)
When transitioning to a PostgreSQL backend, the following schema structure maps directly to our TypeScript models:

```sql
-- Multi-Tenant Core
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    absence_deduction_divisor INT DEFAULT 30,
    manufacturing_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row-Level Security Policy
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON products
    FOR ALL
    USING (organization_id = current_setting('app.current_tenant_id')::uuid);

-- Textile Products & Specifications
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    product_type VARCHAR(50) NOT NULL, -- RAW_MATERIAL | FINISHED_GOODS
    unit VARCHAR(20) NOT NULL, -- kg, roll, cone, meter
    yarn_count VARCHAR(50), -- 30s, 24s
    gsm INT, -- 160, 180, 220
    fabric_width NUMERIC(8,2), -- 72 inch
    construction VARCHAR(50), -- Single Jersey, 1x1 Rib
    color_name VARCHAR(100),
    weighted_avg_cost NUMERIC(14,2) DEFAULT 0,
    selling_price NUMERIC(14,2) DEFAULT 0,
    reorder_level NUMERIC(14,2) DEFAULT 100
);

-- Warehouses & Stock Balances
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    quantity_on_hand NUMERIC(14,2) DEFAULT 0,
    quantity_reserved NUMERIC(14,2) DEFAULT 0,
    average_unit_cost NUMERIC(14,2) DEFAULT 0,
    batch_lot_number VARCHAR(100),
    UNIQUE (product_id, warehouse_id, batch_lot_number)
);

-- Production Recipes & Jobs
CREATE TABLE production_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    output_product_id UUID NOT NULL REFERENCES products(id),
    expected_yield_percent NUMERIC(5,2) DEFAULT 85,
    estimated_labor_cost NUMERIC(14,2) DEFAULT 15,
    estimated_overhead_cost NUMERIC(14,2) DEFAULT 12
);
```

---

## 🛠️ Production Transition Checklist

To transition this front-end prototype into a multi-region production cloud service:

1. **Authentication & Identity**:
   - Replace the demo switcher with Auth0, Supabase Auth, or NextAuth / JWT tokens with Argon2 password hashing.
   - Inject the verified `organization_id` into every API request token context.
2. **Server-Side Tenant Isolation**:
   - Enforce database-level PostgreSQL Row-Level Security (RLS) using `SET app.current_tenant_id = ?` per transaction connection.
   - Prevent frontend filtering from being relied upon for data privacy.
3. **Database Transactions**:
   - Wrap stock issue, finished goods receipt, and invoice creation in strict ACID database transactions (`BEGIN ... COMMIT`) to prevent race conditions during high-volume POS checkouts.
4. **Barcode Printing & Scanners**:
   - Integrate WebUSB / ESC/POS protocol drivers for physical thermal receipt printers (Epson, Xprinter) and zebra barcode label printers for fabric rolls.
5. **Real Payment Gateways**:
   - Integrate bKash Merchant Checkout API, Nagad Direct Payment, and SSLCommerz for automated online payment reconciliation.
6. **Automated Backup & Disaster Recovery**:
   - Implement daily automated tenant-scoped database exports and point-in-time recovery (PITR).

---

## 📄 License & Intellectual Property
Designed and developed for Textile & Fabric Business Management SaaS demonstration. All rights reserved.
