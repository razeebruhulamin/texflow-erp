// ============================================================================
// TEXFLOW ERP - MULTI-TENANT TEXTILE & FABRIC BUSINESS MANAGEMENT SAAS
// CORE TYPE DEFINITIONS
// ============================================================================

export type RoleType =
  | 'PLATFORM_SUPER_ADMIN'
  | 'ORGANIZATION_OWNER'
  | 'ORGANIZATION_ADMIN'
  | 'MANAGER'
  | 'ACCOUNTANT'
  | 'SALES_EXECUTIVE'
  | 'POS_CASHIER'
  | 'STOREKEEPER'
  | 'PRODUCTION_MANAGER'
  | 'HR_PAYROLL_OFFICER'
  | 'VIEWER_AUDITOR';

export type BusinessType = 'TRADING' | 'KNITTING' | 'DYEING' | 'FINISHING' | 'COMPOSITE_MANUFACTURING';

export type ProductType = 'RAW_MATERIAL' | 'FINISHED_GOODS';

export type UnitType = 'kg' | 'meter' | 'yard' | 'roll' | 'cone' | 'piece' | 'bag';

export type YarnCountSystem = 'Ne' | 'Nm' | 'Denier' | 'Tex' | 'Dtex';

export type FabricConstruction =
  | 'Single Jersey'
  | 'Rib 1x1'
  | 'Rib 2x2'
  | 'Interlock'
  | 'Fleece'
  | 'Terry'
  | 'Pique'
  | 'Lacoste'
  | 'Twill'
  | 'Canvas'
  | 'Woven'
  | 'Denim';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MFS_BKASH' | 'MFS_NAGAD' | 'CREDIT' | 'CHEQUE';

export type SalesChannel = 'POS' | 'IN_STORE_COUNTER' | 'WEBSITE' | 'SOCIAL_FACEBOOK' | 'MARKETPLACE' | 'PHONE_WHATSAPP';

// --- Platform & Organization ---
export interface SubscriptionPlan {
  id: string;
  name: string;
  code: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  monthlyFee: number;
  maxUsers: number;
  maxWarehouses: number;
  hasManufacturing: boolean;
  hasMultiWarehouse: boolean;
  hasAdvancedReports: boolean;
  description: string;
}

export interface Organization {
  id: string;
  name: string;
  businessType: BusinessType;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  currency: string; // e.g. "BDT"
  currencySymbol: string; // e.g. "৳"
  timezone: string; // "Asia/Dhaka"
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  planId: string;
  createdAt: string;
  defaultWarehouseId?: string;
  manufacturingEnabled: boolean;
  processType: 'trading' | 'knitting' | 'dyeing' | 'finishing' | 'combined';
  // Settings
  absenceDeductionDivisor: number; // typically 30 or 26 days
  negativeStockAllowed: boolean;
  costingMethod: 'WEIGHTED_AVERAGE' | 'FIFO';
  taxVatRate: number; // percentage, e.g., 5%
  invoicePrefix: string;
  purchasePrefix: string;
  jobPrefix: string;
}

export interface User {
  id: string;
  organizationId: string; // empty string for Platform Super Admin
  name: string;
  email: string;
  role: RoleType;
  designation: string;
  phone?: string;
  active: boolean;
  avatar?: string;
}

// --- Warehouses & Inventory ---
export interface Warehouse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  location: string;
  isDefault: boolean;
  active: boolean;
  managerName?: string;
  contactPhone?: string;
}

export interface TextileSpecification {
  materialType?: string; // e.g., "100% Combed Cotton", "60/40 CVC", "Polyester Spun"
  yarnCount?: string; // e.g., "30s", "24s", "40s"
  countSystem?: YarnCountSystem;
  gsm?: number; // e.g., 160, 180, 220
  fabricWidth?: number; // width in inches or cm
  widthUnit?: 'inch' | 'cm';
  weightKg?: number;
  colorName?: string; // e.g., "Melange Grey", "Navy Blue", "Optical White"
  colorHex?: string;
  colorCode?: string;
  fiberComposition?: string; // e.g., "100% Cotton", "95% Cotton 5% Spandex"
  construction?: FabricConstruction;
  finishingType?: string; // e.g., "Silicon Softener", "Enzyme Washed", "Mercerized", "Peach Finish"
  qualityGrade?: 'A_GRADE' | 'B_GRADE' | 'EXPORT_QUALITY' | 'STANDARD';
  dyeLotNumber?: string;
  coneWeightKg?: number;
  technicalNotes?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  color: string;
  gsm?: number;
  width?: number;
  sellingPrice: number;
}

export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  category: string; // e.g., "Yarn", "Greige Fabric", "Knit Finished Fabric", "Woven Fabric"
  description: string;
  productType: ProductType; // RAW_MATERIAL or FINISHED_GOODS
  unit: UnitType;
  secondaryUnit?: UnitType;
  unitConversionFactor?: number; // 1 secondaryUnit = factor * primaryUnit (e.g. 1 roll = 25 kg)
  defaultPurchasePrice: number;
  defaultSellingPrice: number;
  currentWeightedAvgCost: number; // cost basis for inventory valuation & COGS
  reorderLevel: number;
  specifications: TextileSpecification;
  variants?: ProductVariant[];
  imageUrl?: string;
  active: boolean;
}

export interface StockBalance {
  id: string;
  organizationId: string;
  productId: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
  averageUnitCost: number;
  batchLotNumber?: string;
  color?: string;
}

export type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'PURCHASE_RETURN'
  | 'SALES_DISPATCH'
  | 'SALES_RETURN'
  | 'PRODUCTION_ISSUE' // Raw materials consumed
  | 'PRODUCTION_RECEIPT' // Finished goods received
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'STOCK_ADJUSTMENT'
  | 'OPENING_BALANCE';

export interface StockMovement {
  id: string;
  organizationId: string;
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  quantity: number; // positive for additions, negative for deductions
  unit: UnitType;
  unitCost: number;
  totalCost: number;
  referenceNumber: string; // e.g., PO-1001, INV-2001, JOB-3001
  referenceType: 'PURCHASE' | 'SALE' | 'PRODUCTION' | 'TRANSFER' | 'ADJUSTMENT';
  date: string;
  batchLot?: string;
  notes?: string;
  performedBy: string;
}

export interface StockAdjustment {
  id: string;
  organizationId: string;
  adjustmentNumber: string;
  warehouseId: string;
  productId: string;
  batchLot?: string;
  systemQuantity: number;
  physicalQuantity: number;
  adjustmentQuantity: number; // physical - system
  unit: UnitType;
  unitCost: number;
  totalValueImpact: number;
  reason: 'DAMAGE' | 'WASTAGE' | 'STOCK_COUNT_CORRECTION' | 'MISSING_INVENTORY' | 'OPENING_BALANCE';
  date: string;
  approvedBy: string;
  notes?: string;
}

export interface StockTransfer {
  id: string;
  organizationId: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  unit: UnitType;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  performedBy: string;
  notes?: string;
}

// --- Contacts: Customers & Suppliers ---
export interface Customer {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  customerType: 'WHOLESALE' | 'RETAIL' | 'GARMENT_MANUFACTURER' | 'BUYING_HOUSE';
  creditLimit: number;
  openingBalance: number; // positive = customer owes us (receivable)
  currentBalance: number; // running receivables
  paymentTermsDays: number;
  notes?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  supplierType: 'SPINNING_MILL' | 'GREIGE_MILL' | 'DYE_CHEMICAL_VENDOR' | 'ACCESSORIES';
  openingBalance: number; // positive = we owe supplier (payable)
  currentBalance: number; // running payables
  paymentTermsDays: number;
  notes?: string;
  active: boolean;
}

// --- Purchases & Supplier Payments ---
export interface PurchaseItem {
  productId: string;
  productName: string;
  specSummary?: string;
  lotNumber?: string;
  color?: string;
  unit: UnitType;
  orderQuantity: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  taxAmount: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  purchaseNumber: string; // e.g. PO-2026-001
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  goodsReceiptDate?: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  freightCosts: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: 'DRAFT' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  notes?: string;
}

export interface SupplierPayment {
  id: string;
  organizationId: string;
  voucherNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string; // Cash/Bank account
  reference: string;
  notes?: string;
  recordedBy: string;
}

// --- Sales, POS & Collections ---
export interface SalesItem {
  productId: string;
  productName: string;
  specSummary?: string;
  color?: string;
  lotNumber?: string;
  unit: UnitType;
  quantity: number;
  unitPrice: number;
  unitCost: number; // for COGS margin calculation
  discount: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  organizationId: string;
  invoiceNumber: string; // e.g. INV-2026-001
  salesChannel: SalesChannel;
  customerId: string; // or "WALK_IN"
  customerName: string;
  warehouseId: string;
  date: string;
  items: SalesItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge: number;
  grandTotal: number;
  totalCostOfGoodsSold: number; // cost calculated at time of sale
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentAccountId?: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  salesperson: string;
  onlineDetails?: {
    platform: string;
    shippingAddress: string;
    trackingNumber?: string;
    customerPhone: string;
  };
  notes?: string;
}

export interface CustomerCollection {
  id: string;
  organizationId: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  salesInvoiceId?: string;
  collectionDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  reference: string;
  notes?: string;
  recordedBy: string;
}

// --- Production: BOM & Jobs ---
export interface RecipeInputItem {
  productId: string;
  productName: string;
  requiredQuantity: number; // per unit of output or base batch
  unit: UnitType;
  unitCostEstimate: number;
}

export interface ProductionRecipe {
  id: string;
  organizationId: string;
  code: string; // e.g. BOM-KNIT-01
  name: string;
  processType: 'KNITTING' | 'DYEING' | 'FINISHING' | 'PRINTING' | 'COMPOSITE';
  inputItems: RecipeInputItem[];
  outputProductId: string;
  outputProductName: string;
  targetOutputQuantity: number; // benchmark basis (e.g. 100 kg or 850 kg)
  expectedYieldPercent: number; // e.g. 85%
  expectedWastagePercent: number; // e.g. 15%
  estimatedLaborCost: number;
  estimatedChemicalDyeCost: number;
  estimatedMachineOverheadCost: number;
  notes?: string;
  active: boolean;
}

export interface ProductionJob {
  id: string;
  organizationId: string;
  jobNumber: string; // e.g. JOB-2026-001
  recipeId: string;
  recipeName: string;
  processType: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  completionDate?: string;
  // Estimated
  targetOutputProduct: string;
  targetOutputProductId: string;
  estimatedInputQuantity: number;
  estimatedOutputQuantity: number;
  expectedYieldPercent: number;
  expectedWastagePercent: number;
  // Actuals
  actualInputQuantity: number;
  actualOutputQuantity: number;
  actualWastageQuantity: number;
  actualYieldPercent: number;
  inputUnit: UnitType;
  outputUnit: UnitType;
  inputBatchLot?: string;
  outputBatchLot?: string;
  outputColor?: string;
  // Costs
  rawMaterialCost: number;
  directLaborCost: number;
  dyeChemicalCost: number;
  overheadCost: number;
  totalProductionCost: number;
  calculatedCostPerUnit: number;
  supervisor: string;
  notes?: string;
}

// --- Expenses ---
export interface ExpenseCategory {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  expenseNumber: string;
  categoryId: string;
  categoryName: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  payee: string;
  description: string;
  receiptNumber?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  recordedBy: string;
}

// --- Employees & Payroll ---
export interface Employee {
  id: string;
  organizationId: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  department: 'PRODUCTION' | 'DYEING' | 'QUALITY' | 'SALES' | 'ACCOUNTS' | 'WAREHOUSE' | 'MANAGEMENT';
  phone: string;
  email: string;
  joiningDate: string;
  basicSalary: number;
  allowances: number;
  active: boolean;
  notes?: string;
}

export interface PayrollEntry {
  id: string;
  organizationId: string;
  payrollNumber: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  periodMonth: string; // "2026-10"
  basicSalary: number;
  allowances: number;
  bonus: number;
  absentDays: number;
  absenceDailyRate: number;
  absenceDeductionAmount: number;
  otherDeductions: number;
  advanceAdjustment: number;
  netSalary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  paymentDate?: string;
  paymentAccountId?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}

// --- Cash & Bank Management ---
export interface CashBankAccount {
  id: string;
  organizationId: string;
  accountName: string;
  accountType: 'CASH' | 'BANK' | 'MFS';
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  openingBalance: number;
  currentBalance: number;
  currency: string;
}

export interface FinancialTransaction {
  id: string;
  organizationId: string;
  transactionNumber: string;
  date: string;
  accountId: string;
  accountName: string;
  type: 'RECEIPT' | 'PAYMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  category:
    | 'CUSTOMER_COLLECTION'
    | 'POS_SALE'
    | 'SUPPLIER_PAYMENT'
    | 'OPERATING_EXPENSE'
    | 'SALARY_PAYMENT'
    | 'INTERNAL_TRANSFER'
    | 'INITIAL_CAPITAL'
    | 'OTHER';
  amount: number;
  balanceAfter: number;
  referenceId?: string; // invoice, voucher, or job ID
  notes: string;
  performedBy: string;
}

// --- Audit & Activity ---
export interface AuditLog {
  id: string;
  organizationId: string;
  action: string;
  module: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

// --- Reports Filter Model ---
export interface ReportFilter {
  dateRange: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';
  startDate: string;
  endDate: string;
  warehouseId?: string;
  productId?: string;
  customerId?: string;
  supplierId?: string;
  salesChannel?: string;
  category?: string;
}
