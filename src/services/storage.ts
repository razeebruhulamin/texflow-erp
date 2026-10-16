import {
  Organization,
  SubscriptionPlan,
  User,
  Warehouse,
  Product,
  StockBalance,
  StockMovement,
  StockAdjustment,
  StockTransfer,
  Customer,
  Supplier,
  PurchaseOrder,
  SupplierPayment,
  SalesInvoice,
  CustomerCollection,
  ProductionRecipe,
  ProductionJob,
  ExpenseCategory,
  Expense,
  Employee,
  PayrollEntry,
  CashBankAccount,
  FinancialTransaction,
  AuditLog
} from '../types';

import {
  SEED_PLANS,
  SEED_ORGANIZATIONS,
  SEED_USERS,
  SEED_WAREHOUSES,
  SEED_PRODUCTS,
  SEED_STOCK_BALANCES,
  SEED_STOCK_MOVEMENTS,
  SEED_CUSTOMERS,
  SEED_SUPPLIERS,
  SEED_PURCHASE_ORDERS,
  SEED_SUPPLIER_PAYMENTS,
  SEED_SALES_INVOICES,
  SEED_CUSTOMER_COLLECTIONS,
  SEED_PRODUCTION_RECIPES,
  SEED_PRODUCTION_JOBS,
  SEED_EXPENSE_CATEGORIES,
  SEED_EXPENSES,
  SEED_EMPLOYEES,
  SEED_PAYROLL_ENTRIES,
  SEED_CASH_BANK_ACCOUNTS,
  SEED_FINANCIAL_TRANSACTIONS,
  SEED_AUDIT_LOGS
} from './seedData';

const STORAGE_PREFIX = 'texflow_v1_';

function getStorage<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return defaultData;
  }
}

function setStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to storage`, e);
  }
}

export const StorageRepository = {
  // Initialization & Reset
  init: () => {
    if (!localStorage.getItem(STORAGE_PREFIX + 'initialized')) {
      StorageRepository.resetAll();
      localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
    }
  },

  resetAll: () => {
    setStorage('plans', SEED_PLANS);
    setStorage('organizations', SEED_ORGANIZATIONS);
    setStorage('users', SEED_USERS);
    setStorage('warehouses', SEED_WAREHOUSES);
    setStorage('products', SEED_PRODUCTS);
    setStorage('stock_balances', SEED_STOCK_BALANCES);
    setStorage('stock_movements', SEED_STOCK_MOVEMENTS);
    setStorage('customers', SEED_CUSTOMERS);
    setStorage('suppliers', SEED_SUPPLIERS);
    setStorage('purchases', SEED_PURCHASE_ORDERS);
    setStorage('supplier_payments', SEED_SUPPLIER_PAYMENTS);
    setStorage('sales_invoices', SEED_SALES_INVOICES);
    setStorage('customer_collections', SEED_CUSTOMER_COLLECTIONS);
    setStorage('production_recipes', SEED_PRODUCTION_RECIPES);
    setStorage('production_jobs', SEED_PRODUCTION_JOBS);
    setStorage('expense_categories', SEED_EXPENSE_CATEGORIES);
    setStorage('expenses', SEED_EXPENSES);
    setStorage('employees', SEED_EMPLOYEES);
    setStorage('payroll_entries', SEED_PAYROLL_ENTRIES);
    setStorage('accounts', SEED_CASH_BANK_ACCOUNTS);
    setStorage('financial_transactions', SEED_FINANCIAL_TRANSACTIONS);
    setStorage('audit_logs', SEED_AUDIT_LOGS);
    setStorage('stock_adjustments', []);
    setStorage('stock_transfers', []);
    localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
  },

  // Plans & Organizations
  getPlans: (): SubscriptionPlan[] => getStorage('plans', SEED_PLANS),
  savePlan: (plan: SubscriptionPlan) => {
    const list = StorageRepository.getPlans();
    const idx = list.findIndex(p => p.id === plan.id);
    if (idx >= 0) list[idx] = plan;
    else list.push(plan);
    setStorage('plans', list);
  },

  getOrganizations: (): Organization[] => getStorage('organizations', SEED_ORGANIZATIONS),
  getOrganization: (id: string): Organization | undefined => {
    return StorageRepository.getOrganizations().find(o => o.id === id);
  },
  saveOrganization: (org: Organization) => {
    const list = StorageRepository.getOrganizations();
    const idx = list.findIndex(o => o.id === org.id);
    if (idx >= 0) list[idx] = org;
    else list.push(org);
    setStorage('organizations', list);
  },

  // Users
  getUsers: (orgId?: string): User[] => {
    const list = getStorage<User>('users', SEED_USERS);
    if (!orgId) return list;
    return list.filter(u => u.organizationId === orgId);
  },
  saveUser: (user: User) => {
    const list = getStorage<User>('users', SEED_USERS);
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) list[idx] = user;
    else list.push(user);
    setStorage('users', list);
  },

  // Warehouses
  getWarehouses: (orgId: string): Warehouse[] => {
    return getStorage<Warehouse>('warehouses', SEED_WAREHOUSES).filter(w => w.organizationId === orgId);
  },
  saveWarehouse: (warehouse: Warehouse) => {
    const list = getStorage<Warehouse>('warehouses', SEED_WAREHOUSES);
    const idx = list.findIndex(w => w.id === warehouse.id);
    if (idx >= 0) list[idx] = warehouse;
    else list.push(warehouse);
    setStorage('warehouses', list);
  },

  // Products
  getProducts: (orgId: string): Product[] => {
    return getStorage<Product>('products', SEED_PRODUCTS).filter(p => p.organizationId === orgId);
  },
  getProduct: (orgId: string, id: string): Product | undefined => {
    return StorageRepository.getProducts(orgId).find(p => p.id === id);
  },
  saveProduct: (product: Product) => {
    const list = getStorage<Product>('products', SEED_PRODUCTS);
    const idx = list.findIndex(p => p.id === product.id);
    if (idx >= 0) list[idx] = product;
    else list.push(product);
    setStorage('products', list);
  },

  // Stock Balances
  getStockBalances: (orgId: string): StockBalance[] => {
    return getStorage<StockBalance>('stock_balances', SEED_STOCK_BALANCES).filter(s => s.organizationId === orgId);
  },
  saveStockBalance: (balance: StockBalance) => {
    const list = getStorage<StockBalance>('stock_balances', SEED_STOCK_BALANCES);
    const idx = list.findIndex(s => s.id === balance.id);
    if (idx >= 0) list[idx] = balance;
    else list.push(balance);
    setStorage('stock_balances', list);
  },

  // Stock Movements
  getStockMovements: (orgId: string): StockMovement[] => {
    return getStorage<StockMovement>('stock_movements', SEED_STOCK_MOVEMENTS).filter(m => m.organizationId === orgId);
  },
  addStockMovement: (movement: StockMovement) => {
    const list = getStorage<StockMovement>('stock_movements', SEED_STOCK_MOVEMENTS);
    list.unshift(movement);
    setStorage('stock_movements', list);
  },

  // Stock Adjustments
  getStockAdjustments: (orgId: string): StockAdjustment[] => {
    return getStorage<StockAdjustment>('stock_adjustments', []).filter(a => a.organizationId === orgId);
  },
  saveStockAdjustment: (adj: StockAdjustment) => {
    const list = getStorage<StockAdjustment>('stock_adjustments', []);
    list.unshift(adj);
    setStorage('stock_adjustments', list);
  },

  // Stock Transfers
  getStockTransfers: (orgId: string): StockTransfer[] => {
    return getStorage<StockTransfer>('stock_transfers', []).filter(t => t.organizationId === orgId);
  },
  saveStockTransfer: (transfer: StockTransfer) => {
    const list = getStorage<StockTransfer>('stock_transfers', []);
    const idx = list.findIndex(t => t.id === transfer.id);
    if (idx >= 0) list[idx] = transfer;
    else list.unshift(transfer);
    setStorage('stock_transfers', list);
  },

  // Customers
  getCustomers: (orgId: string): Customer[] => {
    return getStorage<Customer>('customers', SEED_CUSTOMERS).filter(c => c.organizationId === orgId);
  },
  getCustomer: (orgId: string, id: string): Customer | undefined => {
    return StorageRepository.getCustomers(orgId).find(c => c.id === id);
  },
  saveCustomer: (customer: Customer) => {
    const list = getStorage<Customer>('customers', SEED_CUSTOMERS);
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) list[idx] = customer;
    else list.push(customer);
    setStorage('customers', list);
  },

  // Suppliers
  getSuppliers: (orgId: string): Supplier[] => {
    return getStorage<Supplier>('suppliers', SEED_SUPPLIERS).filter(s => s.organizationId === orgId);
  },
  getSupplier: (orgId: string, id: string): Supplier | undefined => {
    return StorageRepository.getSuppliers(orgId).find(s => s.id === id);
  },
  saveSupplier: (supplier: Supplier) => {
    const list = getStorage<Supplier>('suppliers', SEED_SUPPLIERS);
    const idx = list.findIndex(s => s.id === supplier.id);
    if (idx >= 0) list[idx] = supplier;
    else list.push(supplier);
    setStorage('suppliers', list);
  },

  // Purchases & Supplier Payments
  getPurchaseOrders: (orgId: string): PurchaseOrder[] => {
    return getStorage<PurchaseOrder>('purchases', SEED_PURCHASE_ORDERS).filter(p => p.organizationId === orgId);
  },
  savePurchaseOrder: (po: PurchaseOrder) => {
    const list = getStorage<PurchaseOrder>('purchases', SEED_PURCHASE_ORDERS);
    const idx = list.findIndex(p => p.id === po.id);
    if (idx >= 0) list[idx] = po;
    else list.unshift(po);
    setStorage('purchases', list);
  },

  getSupplierPayments: (orgId: string): SupplierPayment[] => {
    return getStorage<SupplierPayment>('supplier_payments', SEED_SUPPLIER_PAYMENTS).filter(sp => sp.organizationId === orgId);
  },
  saveSupplierPayment: (sp: SupplierPayment) => {
    const list = getStorage<SupplierPayment>('supplier_payments', SEED_SUPPLIER_PAYMENTS);
    list.unshift(sp);
    setStorage('supplier_payments', list);
  },

  // Sales & Collections
  getSalesInvoices: (orgId: string): SalesInvoice[] => {
    return getStorage<SalesInvoice>('sales_invoices', SEED_SALES_INVOICES).filter(s => s.organizationId === orgId);
  },
  saveSalesInvoice: (inv: SalesInvoice) => {
    const list = getStorage<SalesInvoice>('sales_invoices', SEED_SALES_INVOICES);
    const idx = list.findIndex(i => i.id === inv.id);
    if (idx >= 0) list[idx] = inv;
    else list.unshift(inv);
    setStorage('sales_invoices', list);
  },

  getCustomerCollections: (orgId: string): CustomerCollection[] => {
    return getStorage<CustomerCollection>('customer_collections', SEED_CUSTOMER_COLLECTIONS).filter(c => c.organizationId === orgId);
  },
  saveCustomerCollection: (col: CustomerCollection) => {
    const list = getStorage<CustomerCollection>('customer_collections', SEED_CUSTOMER_COLLECTIONS);
    list.unshift(col);
    setStorage('customer_collections', list);
  },

  // Production: BOM & Jobs
  getProductionRecipes: (orgId: string): ProductionRecipe[] => {
    return getStorage<ProductionRecipe>('production_recipes', SEED_PRODUCTION_RECIPES).filter(r => r.organizationId === orgId);
  },
  saveProductionRecipe: (recipe: ProductionRecipe) => {
    const list = getStorage<ProductionRecipe>('production_recipes', SEED_PRODUCTION_RECIPES);
    const idx = list.findIndex(r => r.id === recipe.id);
    if (idx >= 0) list[idx] = recipe;
    else list.unshift(recipe);
    setStorage('production_recipes', list);
  },

  getProductionJobs: (orgId: string): ProductionJob[] => {
    return getStorage<ProductionJob>('production_jobs', SEED_PRODUCTION_JOBS).filter(j => j.organizationId === orgId);
  },
  saveProductionJob: (job: ProductionJob) => {
    const list = getStorage<ProductionJob>('production_jobs', SEED_PRODUCTION_JOBS);
    const idx = list.findIndex(j => j.id === job.id);
    if (idx >= 0) list[idx] = job;
    else list.unshift(job);
    setStorage('production_jobs', list);
  },

  // Expenses
  getExpenseCategories: (orgId: string): ExpenseCategory[] => {
    return getStorage<ExpenseCategory>('expense_categories', SEED_EXPENSE_CATEGORIES).filter(c => c.organizationId === orgId);
  },
  saveExpenseCategory: (cat: ExpenseCategory) => {
    const list = getStorage<ExpenseCategory>('expense_categories', SEED_EXPENSE_CATEGORIES);
    const idx = list.findIndex(c => c.id === cat.id);
    if (idx >= 0) list[idx] = cat;
    else list.push(cat);
    setStorage('expense_categories', list);
  },

  getExpenses: (orgId: string): Expense[] => {
    return getStorage<Expense>('expenses', SEED_EXPENSES).filter(e => e.organizationId === orgId);
  },
  saveExpense: (exp: Expense) => {
    const list = getStorage<Expense>('expenses', SEED_EXPENSES);
    const idx = list.findIndex(e => e.id === exp.id);
    if (idx >= 0) list[idx] = exp;
    else list.unshift(exp);
    setStorage('expenses', list);
  },

  // Employees & Payroll
  getEmployees: (orgId: string): Employee[] => {
    return getStorage<Employee>('employees', SEED_EMPLOYEES).filter(e => e.organizationId === orgId);
  },
  saveEmployee: (emp: Employee) => {
    const list = getStorage<Employee>('employees', SEED_EMPLOYEES);
    const idx = list.findIndex(e => e.id === emp.id);
    if (idx >= 0) list[idx] = emp;
    else list.push(emp);
    setStorage('employees', list);
  },

  getPayrollEntries: (orgId: string): PayrollEntry[] => {
    return getStorage<PayrollEntry>('payroll_entries', SEED_PAYROLL_ENTRIES).filter(p => p.organizationId === orgId);
  },
  savePayrollEntry: (payroll: PayrollEntry) => {
    const list = getStorage<PayrollEntry>('payroll_entries', SEED_PAYROLL_ENTRIES);
    const idx = list.findIndex(p => p.id === payroll.id);
    if (idx >= 0) list[idx] = payroll;
    else list.unshift(payroll);
    setStorage('payroll_entries', list);
  },

  // Cash & Bank
  getCashBankAccounts: (orgId: string): CashBankAccount[] => {
    return getStorage<CashBankAccount>('accounts', SEED_CASH_BANK_ACCOUNTS).filter(a => a.organizationId === orgId);
  },
  saveCashBankAccount: (acc: CashBankAccount) => {
    const list = getStorage<CashBankAccount>('accounts', SEED_CASH_BANK_ACCOUNTS);
    const idx = list.findIndex(a => a.id === acc.id);
    if (idx >= 0) list[idx] = acc;
    else list.push(acc);
    setStorage('accounts', list);
  },

  getFinancialTransactions: (orgId: string): FinancialTransaction[] => {
    return getStorage<FinancialTransaction>('financial_transactions', SEED_FINANCIAL_TRANSACTIONS).filter(t => t.organizationId === orgId);
  },
  addFinancialTransaction: (trx: FinancialTransaction) => {
    const list = getStorage<FinancialTransaction>('financial_transactions', SEED_FINANCIAL_TRANSACTIONS);
    list.unshift(trx);
    setStorage('financial_transactions', list);
  },

  // Audit Logs
  getAuditLogs: (orgId?: string): AuditLog[] => {
    const list = getStorage<AuditLog>('audit_logs', SEED_AUDIT_LOGS);
    if (!orgId) return list;
    return list.filter(l => l.organizationId === orgId);
  },
  logAction: (orgId: string, action: string, module: string, details: string, performedBy: string) => {
    const list = getStorage<AuditLog>('audit_logs', SEED_AUDIT_LOGS);
    const log: AuditLog = {
      id: 'log-' + Date.now(),
      organizationId: orgId,
      action,
      module,
      details,
      performedBy,
      timestamp: new Date().toISOString()
    };
    list.unshift(log);
    setStorage('audit_logs', list);
  },

  // =========================================================================
  // INTEGRATED BUSINESS TRANSACTIONS ENGINE
  // =========================================================================

  /**
   * Scenario A & Purchasing: Post goods receipt from a purchase order
   * - Increases stock in selected warehouse
   * - Updates product weighted-average cost
   * - Creates StockMovement audit record
   * - Sets PO status to RECEIVED / PARTIALLY_RECEIVED
   * - Increases supplier outstanding payable
   */
  postGoodsReceipt: (
    poId: string,
    receivedItems: { productId: string; receivedQty: number; rejectedQty: number }[],
    warehouseId: string,
    notes: string,
    user: User
  ): { success: boolean; message: string } => {
    const po = StorageRepository.getPurchaseOrders(user.organizationId).find(p => p.id === poId);
    if (!po) return { success: false, message: 'Purchase Order not found.' };

    const stockBalances = StorageRepository.getStockBalances(user.organizationId);
    const products = StorageRepository.getProducts(user.organizationId);

    let allReceived = true;

    for (const recItem of receivedItems) {
      if (recItem.receivedQty <= 0) continue;

      const poLine = po.items.find(i => i.productId === recItem.productId);
      if (!poLine) continue;

      poLine.receivedQuantity = (poLine.receivedQuantity || 0) + recItem.receivedQty;
      poLine.rejectedQuantity = (poLine.rejectedQuantity || 0) + recItem.rejectedQty;

      if (poLine.receivedQuantity < poLine.orderQuantity) {
        allReceived = false;
      }

      // 1. Update or create stock balance for this warehouse & product
      let balance = stockBalances.find(b => b.productId === recItem.productId && b.warehouseId === warehouseId);
      const prod = products.find(p => p.id === recItem.productId);

      if (!balance) {
        balance = {
          id: `sb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          organizationId: user.organizationId,
          productId: recItem.productId,
          warehouseId,
          quantityOnHand: 0,
          quantityReserved: 0,
          averageUnitCost: poLine.unitPrice,
          batchLotNumber: poLine.lotNumber || 'LOT-' + Date.now(),
          color: poLine.color
        };
        stockBalances.push(balance);
      }

      // Weighted Average Cost calculation:
      const oldQty = balance.quantityOnHand;
      const oldCost = balance.averageUnitCost;
      const newQty = oldQty + recItem.receivedQty;
      const newAvgCost = oldQty > 0
        ? Math.round(((oldQty * oldCost + recItem.receivedQty * poLine.unitPrice) / newQty) * 100) / 100
        : poLine.unitPrice;

      balance.quantityOnHand = newQty;
      balance.averageUnitCost = newAvgCost;

      // Update product's master weighted average cost
      if (prod) {
        prod.currentWeightedAvgCost = newAvgCost;
        StorageRepository.saveProduct(prod);
      }

      // 2. Add StockMovement record
      StorageRepository.addStockMovement({
        id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: user.organizationId,
        productId: recItem.productId,
        warehouseId,
        movementType: 'PURCHASE_RECEIPT',
        quantity: recItem.receivedQty,
        unit: poLine.unit,
        unitCost: poLine.unitPrice,
        totalCost: recItem.receivedQty * poLine.unitPrice,
        referenceNumber: po.purchaseNumber,
        referenceType: 'PURCHASE',
        date: new Date().toISOString(),
        batchLot: poLine.lotNumber,
        notes: notes || `Goods received against PO ${po.purchaseNumber}`,
        performedBy: user.name
      });
    }

    setStorage('stock_balances', stockBalances);

    // Update PO status
    po.status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    po.goodsReceiptDate = new Date().toISOString();
    StorageRepository.savePurchaseOrder(po);

    // Update Supplier payable balance
    const supplier = StorageRepository.getSupplier(user.organizationId, po.supplierId);
    if (supplier) {
      supplier.currentBalance += po.dueAmount;
      StorageRepository.saveSupplier(supplier);
    }

    StorageRepository.logAction(
      user.organizationId,
      'POST_GOODS_RECEIPT',
      'PURCHASING',
      `Goods receipt posted for PO ${po.purchaseNumber} into warehouse. Inventory updated.`,
      user.name
    );

    return { success: true, message: `Goods receipt recorded for ${po.purchaseNumber}. Stock balances updated.` };
  },

  /**
   * Scenario C & Sales: Post sales invoice (POS, Counter, or Online)
   * - Validates sufficient stock
   * - Deducts stock balance
   * - Creates StockMovement (SALES_DISPATCH)
   * - Calculates COGS
   * - Updates Customer receivables if partial or credit
   * - Updates Cash/Bank account and creates FinancialTransaction if cash/instant payment
   */
  postSalesInvoice: (
    invoice: SalesInvoice,
    user: User
  ): { success: boolean; message: string; invoice?: SalesInvoice } => {
    const org = StorageRepository.getOrganization(user.organizationId);
    const stockBalances = StorageRepository.getStockBalances(user.organizationId);
    const products = StorageRepository.getProducts(user.organizationId);

    // Check stock for each line item
    for (const item of invoice.items) {
      const balance = stockBalances.find(b => b.productId === item.productId && b.warehouseId === invoice.warehouseId);
      const available = balance ? balance.quantityOnHand - balance.quantityReserved : 0;

      if (!org?.negativeStockAllowed && available < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${item.productName}". Available: ${available} ${item.unit}, Requested: ${item.quantity} ${item.unit}.`
        };
      }
    }

    // Deduct stock and compute exact COGS
    let totalCogs = 0;
    for (const item of invoice.items) {
      let balance = stockBalances.find(b => b.productId === item.productId && b.warehouseId === invoice.warehouseId);
      const prod = products.find(p => p.id === item.productId);
      const unitCost = balance?.averageUnitCost || prod?.currentWeightedAvgCost || item.unitPrice * 0.7;

      item.unitCost = unitCost;
      totalCogs += unitCost * item.quantity;

      if (balance) {
        balance.quantityOnHand -= item.quantity;
      }

      // Add Stock Movement
      StorageRepository.addStockMovement({
        id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: user.organizationId,
        productId: item.productId,
        warehouseId: invoice.warehouseId,
        movementType: 'SALES_DISPATCH',
        quantity: -item.quantity,
        unit: item.unit,
        unitCost,
        totalCost: -(unitCost * item.quantity),
        referenceNumber: invoice.invoiceNumber,
        referenceType: 'SALE',
        date: invoice.date || new Date().toISOString(),
        notes: `Sales dispatch to ${invoice.customerName} (${invoice.salesChannel})`,
        performedBy: user.name
      });
    }

    invoice.totalCostOfGoodsSold = totalCogs;
    setStorage('stock_balances', stockBalances);

    // Save invoice
    StorageRepository.saveSalesInvoice(invoice);

    // Update Customer receivables balance
    if (invoice.customerId && invoice.customerId !== 'WALK_IN' && invoice.dueAmount > 0) {
      const customer = StorageRepository.getCustomer(user.organizationId, invoice.customerId);
      if (customer) {
        customer.currentBalance += invoice.dueAmount;
        StorageRepository.saveCustomer(customer);
      }
    }

    // If paid amount > 0 and account specified, update Cash/Bank
    if (invoice.paidAmount > 0 && invoice.paymentAccountId) {
      const accounts = StorageRepository.getCashBankAccounts(user.organizationId);
      const acc = accounts.find(a => a.id === invoice.paymentAccountId);
      if (acc) {
        acc.currentBalance += invoice.paidAmount;
        setStorage('accounts', accounts);

        StorageRepository.addFinancialTransaction({
          id: `ft-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          organizationId: user.organizationId,
          transactionNumber: `TRX-${Date.now().toString().slice(-4)}`,
          date: invoice.date || new Date().toISOString(),
          accountId: acc.id,
          accountName: acc.accountName,
          type: 'RECEIPT',
          category: invoice.salesChannel === 'POS' ? 'POS_SALE' : 'CUSTOMER_COLLECTION',
          amount: invoice.paidAmount,
          balanceAfter: acc.currentBalance,
          referenceId: invoice.id,
          notes: `Sales Receipt for ${invoice.invoiceNumber} (${invoice.customerName})`,
          performedBy: user.name
        });
      }
    }

    StorageRepository.logAction(
      user.organizationId,
      'POST_SALES_INVOICE',
      'SALES',
      `Sales invoice ${invoice.invoiceNumber} posted for ৳${invoice.grandTotal.toLocaleString()} (${invoice.salesChannel}). Stock deducted.`,
      user.name
    );

    return { success: true, message: `Invoice ${invoice.invoiceNumber} recorded successfully.`, invoice };
  },

  /**
   * Scenario D: Record Customer Collection
   */
  postCustomerCollection: (
    collection: CustomerCollection,
    user: User
  ): { success: boolean; message: string } => {
    // 1. Update customer balance
    const customer = StorageRepository.getCustomer(user.organizationId, collection.customerId);
    if (customer) {
      customer.currentBalance = Math.max(0, customer.currentBalance - collection.amount);
      StorageRepository.saveCustomer(customer);
    }

    // 2. If specific invoice is linked, reduce invoice due amount
    if (collection.salesInvoiceId) {
      const invoices = StorageRepository.getSalesInvoices(user.organizationId);
      const inv = invoices.find(i => i.id === collection.salesInvoiceId);
      if (inv) {
        inv.paidAmount += collection.amount;
        inv.dueAmount = Math.max(0, inv.grandTotal - inv.paidAmount);
        inv.paymentStatus = inv.dueAmount === 0 ? 'PAID' : 'PARTIAL';
        setStorage('sales_invoices', invoices);
      }
    }

    // 3. Update account balance and financial transaction
    const accounts = StorageRepository.getCashBankAccounts(user.organizationId);
    const acc = accounts.find(a => a.id === collection.accountId);
    if (acc) {
      acc.currentBalance += collection.amount;
      setStorage('accounts', accounts);

      StorageRepository.addFinancialTransaction({
        id: `ft-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: user.organizationId,
        transactionNumber: `TRX-${Date.now().toString().slice(-4)}`,
        date: collection.collectionDate,
        accountId: acc.id,
        accountName: acc.accountName,
        type: 'RECEIPT',
        category: 'CUSTOMER_COLLECTION',
        amount: collection.amount,
        balanceAfter: acc.currentBalance,
        referenceId: collection.id,
        notes: `Money Receipt ${collection.receiptNumber} from ${collection.customerName}`,
        performedBy: user.name
      });
    }

    // 4. Save collection
    StorageRepository.saveCustomerCollection(collection);

    StorageRepository.logAction(
      user.organizationId,
      'POST_COLLECTION',
      'COLLECTIONS',
      `Received ৳${collection.amount.toLocaleString()} from ${collection.customerName} (${collection.receiptNumber})`,
      user.name
    );

    return { success: true, message: `Collection ${collection.receiptNumber} recorded successfully.` };
  },

  /**
   * Scenario D: Record Supplier Payment
   */
  postSupplierPayment: (
    payment: SupplierPayment,
    user: User
  ): { success: boolean; message: string } => {
    // 1. Update supplier balance
    const supplier = StorageRepository.getSupplier(user.organizationId, payment.supplierId);
    if (supplier) {
      supplier.currentBalance = Math.max(0, supplier.currentBalance - payment.amount);
      StorageRepository.saveSupplier(supplier);
    }

    // 2. If specific PO is linked, reduce PO due amount
    if (payment.purchaseOrderId) {
      const purchases = StorageRepository.getPurchaseOrders(user.organizationId);
      const po = purchases.find(p => p.id === payment.purchaseOrderId);
      if (po) {
        po.paidAmount += payment.amount;
        po.dueAmount = Math.max(0, po.grandTotal - po.paidAmount);
        po.paymentStatus = po.dueAmount === 0 ? 'PAID' : 'PARTIAL';
        setStorage('purchases', purchases);
      }
    }

    // 3. Deduct from account balance and add financial transaction
    const accounts = StorageRepository.getCashBankAccounts(user.organizationId);
    const acc = accounts.find(a => a.id === payment.accountId);
    if (acc) {
      acc.currentBalance -= payment.amount;
      setStorage('accounts', accounts);

      StorageRepository.addFinancialTransaction({
        id: `ft-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: user.organizationId,
        transactionNumber: `TRX-${Date.now().toString().slice(-4)}`,
        date: payment.paymentDate,
        accountId: acc.id,
        accountName: acc.accountName,
        type: 'PAYMENT',
        category: 'SUPPLIER_PAYMENT',
        amount: payment.amount,
        balanceAfter: acc.currentBalance,
        referenceId: payment.id,
        notes: `Payment Voucher ${payment.voucherNumber} to ${payment.supplierName}`,
        performedBy: user.name
      });
    }

    // 4. Save supplier payment
    StorageRepository.saveSupplierPayment(payment);

    StorageRepository.logAction(
      user.organizationId,
      'POST_SUPPLIER_PAYMENT',
      'PAYMENTS',
      `Paid ৳${payment.amount.toLocaleString()} to ${payment.supplierName} (Voucher ${payment.voucherNumber})`,
      user.name
    );

    return { success: true, message: `Supplier payment of ৳${payment.amount.toLocaleString()} recorded.` };
  },

  /**
   * Scenario B & Production: Complete Production Job
   * - Deducts raw material inventory from source warehouse (PRODUCTION_ISSUE)
   * - Adds finished fabric into destination warehouse (PRODUCTION_RECEIPT)
   * - Calculates total production cost and updates finished product weighted-average cost
   * - Records actual wastage and yield
   */
  completeProductionJob: (
    jobId: string,
    actualInputQty: number,
    actualOutputQty: number,
    actualWastageQty: number,
    directLaborCost: number,
    dyeChemicalCost: number,
    overheadCost: number,
    destWarehouseId: string,
    user: User
  ): { success: boolean; message: string } => {
    const jobs = StorageRepository.getProductionJobs(user.organizationId);
    const job = jobs.find(j => j.id === jobId);
    if (!job) return { success: false, message: 'Production job not found.' };

    if (job.status === 'COMPLETED') {
      return { success: false, message: 'Job has already been completed.' };
    }

    const recipe = StorageRepository.getProductionRecipes(user.organizationId).find(r => r.id === job.recipeId);
    const stockBalances = StorageRepository.getStockBalances(user.organizationId);
    const products = StorageRepository.getProducts(user.organizationId);

    // 1. Deduct raw materials from source warehouse
    let totalRawCost = 0;
    if (recipe) {
      for (const input of recipe.inputItems) {
        const inputQty = actualInputQty * (input.requiredQuantity || 1);
        let rawBalance = stockBalances.find(b => b.productId === input.productId && b.warehouseId === job.sourceWarehouseId);

        const prod = products.find(p => p.id === input.productId);
        const costBasis = rawBalance?.averageUnitCost || prod?.currentWeightedAvgCost || input.unitCostEstimate;

        totalRawCost += inputQty * costBasis;

        if (rawBalance) {
          rawBalance.quantityOnHand = Math.max(0, rawBalance.quantityOnHand - inputQty);
        }

        // Add movement for raw material consumed
        StorageRepository.addStockMovement({
          id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          organizationId: user.organizationId,
          productId: input.productId,
          warehouseId: job.sourceWarehouseId,
          movementType: 'PRODUCTION_ISSUE',
          quantity: -inputQty,
          unit: input.unit,
          unitCost: costBasis,
          totalCost: -(inputQty * costBasis),
          referenceNumber: job.jobNumber,
          referenceType: 'PRODUCTION',
          date: new Date().toISOString(),
          notes: `Raw material issued for production job ${job.jobNumber}`,
          performedBy: user.name
        });
      }
    }

    // 2. Total production cost & cost per unit
    const totalProdCost = totalRawCost + directLaborCost + dyeChemicalCost + overheadCost;
    const costPerFinishedUnit = actualOutputQty > 0 ? Math.round((totalProdCost / actualOutputQty) * 100) / 100 : 0;
    const actualYield = actualInputQty > 0 ? Math.round((actualOutputQty / actualInputQty) * 1000) / 10 : 0;

    // 3. Receive finished goods into destination warehouse
    let finishBalance = stockBalances.find(b => b.productId === job.targetOutputProductId && b.warehouseId === destWarehouseId);
    const outputProd = products.find(p => p.id === job.targetOutputProductId);

    if (!finishBalance) {
      finishBalance = {
        id: `sb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: user.organizationId,
        productId: job.targetOutputProductId,
        warehouseId: destWarehouseId,
        quantityOnHand: 0,
        quantityReserved: 0,
        averageUnitCost: costPerFinishedUnit,
        batchLotNumber: job.outputBatchLot || 'LOT-PROD-' + Date.now().toString().slice(-4),
        color: job.outputColor
      };
      stockBalances.push(finishBalance);
    }

    // Update finished goods weighted average cost
    const oldQty = finishBalance.quantityOnHand;
    const oldCost = finishBalance.averageUnitCost;
    const newQty = oldQty + actualOutputQty;
    const newAvgCost = oldQty > 0
      ? Math.round(((oldQty * oldCost + actualOutputQty * costPerFinishedUnit) / newQty) * 100) / 100
      : costPerFinishedUnit;

    finishBalance.quantityOnHand = newQty;
    finishBalance.averageUnitCost = newAvgCost;

    if (outputProd) {
      outputProd.currentWeightedAvgCost = newAvgCost;
      StorageRepository.saveProduct(outputProd);
    }

    setStorage('stock_balances', stockBalances);

    // Add finished goods receipt movement
    StorageRepository.addStockMovement({
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organizationId: user.organizationId,
      productId: job.targetOutputProductId,
      warehouseId: destWarehouseId,
      movementType: 'PRODUCTION_RECEIPT',
      quantity: actualOutputQty,
      unit: job.outputUnit,
      unitCost: costPerFinishedUnit,
      totalCost: actualOutputQty * costPerFinishedUnit,
      referenceNumber: job.jobNumber,
      referenceType: 'PRODUCTION',
      date: new Date().toISOString(),
      batchLot: job.outputBatchLot,
      notes: `Finished goods receipt from job ${job.jobNumber} (${actualYield}% yield)`,
      performedBy: user.name
    });

    // 4. Update Job status and actuals
    job.status = 'COMPLETED';
    job.completionDate = new Date().toISOString();
    job.actualInputQuantity = actualInputQty;
    job.actualOutputQuantity = actualOutputQty;
    job.actualWastageQuantity = actualWastageQty;
    job.actualYieldPercent = actualYield;
    job.rawMaterialCost = totalRawCost;
    job.directLaborCost = directLaborCost;
    job.dyeChemicalCost = dyeChemicalCost;
    job.overheadCost = overheadCost;
    job.totalProductionCost = totalProdCost;
    job.calculatedCostPerUnit = costPerFinishedUnit;
    job.destinationWarehouseId = destWarehouseId;

    StorageRepository.saveProductionJob(job);

    StorageRepository.logAction(
      user.organizationId,
      'COMPLETE_PRODUCTION_JOB',
      'PRODUCTION',
      `Production job ${job.jobNumber} completed. ${actualInputQty} ${job.inputUnit} consumed -> ${actualOutputQty} ${job.outputUnit} finished (${actualYield}% yield). Total cost: ৳${totalProdCost.toLocaleString()}.`,
      user.name
    );

    return {
      success: true,
      message: `Job ${job.jobNumber} completed successfully! Received ${actualOutputQty} ${job.outputUnit} into finished goods inventory at ৳${costPerFinishedUnit}/unit.`
    };
  },

  /**
   * Scenario G: Warehouse Stock Transfer
   */
  postStockTransfer: (
    transfer: StockTransfer,
    user: User
  ): { success: boolean; message: string } => {
    const stockBalances = StorageRepository.getStockBalances(user.organizationId);
    const sourceBalance = stockBalances.find(b => b.productId === transfer.productId && b.warehouseId === transfer.fromWarehouseId);

    if (!sourceBalance || sourceBalance.quantityOnHand < transfer.quantity) {
      return {
        success: false,
        message: `Insufficient stock in source warehouse. Available: ${sourceBalance?.quantityOnHand || 0} ${transfer.unit}`
      };
    }

    // 1. Deduct from source warehouse
    sourceBalance.quantityOnHand -= transfer.quantity;

    // 2. Add to destination warehouse
    let destBalance = stockBalances.find(b => b.productId === transfer.productId && b.warehouseId === transfer.toWarehouseId);
    if (!destBalance) {
      destBalance = {
        id: `sb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: user.organizationId,
        productId: transfer.productId,
        warehouseId: transfer.toWarehouseId,
        quantityOnHand: 0,
        quantityReserved: 0,
        averageUnitCost: sourceBalance.averageUnitCost,
        batchLotNumber: sourceBalance.batchLotNumber,
        color: sourceBalance.color
      };
      stockBalances.push(destBalance);
    }
    destBalance.quantityOnHand += transfer.quantity;

    setStorage('stock_balances', stockBalances);

    // 3. Add movement records
    StorageRepository.addStockMovement({
      id: `sm-${Date.now()}-out`,
      organizationId: user.organizationId,
      productId: transfer.productId,
      warehouseId: transfer.fromWarehouseId,
      movementType: 'TRANSFER_OUT',
      quantity: -transfer.quantity,
      unit: transfer.unit,
      unitCost: sourceBalance.averageUnitCost,
      totalCost: -(transfer.quantity * sourceBalance.averageUnitCost),
      referenceNumber: transfer.transferNumber,
      referenceType: 'TRANSFER',
      date: transfer.date,
      notes: `Transferred to destination warehouse`,
      performedBy: user.name
    });

    StorageRepository.addStockMovement({
      id: `sm-${Date.now()}-in`,
      organizationId: user.organizationId,
      productId: transfer.productId,
      warehouseId: transfer.toWarehouseId,
      movementType: 'TRANSFER_IN',
      quantity: transfer.quantity,
      unit: transfer.unit,
      unitCost: sourceBalance.averageUnitCost,
      totalCost: transfer.quantity * sourceBalance.averageUnitCost,
      referenceNumber: transfer.transferNumber,
      referenceType: 'TRANSFER',
      date: transfer.date,
      notes: `Transferred from source warehouse`,
      performedBy: user.name
    });

    transfer.status = 'COMPLETED';
    StorageRepository.saveStockTransfer(transfer);

    StorageRepository.logAction(
      user.organizationId,
      'STOCK_TRANSFER',
      'INVENTORY',
      `Transferred ${transfer.quantity} ${transfer.unit} of product between warehouses (${transfer.transferNumber}).`,
      user.name
    );

    return { success: true, message: `Stock transfer ${transfer.transferNumber} completed successfully.` };
  },

  /**
   * Scenario E: Post Operating Expense
   */
  postExpenseTransaction: (
    expense: Expense,
    user: User
  ): { success: boolean; message: string } => {
    // 1. Deduct from cash/bank account
    const accounts = StorageRepository.getCashBankAccounts(user.organizationId);
    const acc = accounts.find(a => a.id === expense.accountId);
    if (acc) {
      acc.currentBalance -= expense.amount;
      setStorage('accounts', accounts);

      StorageRepository.addFinancialTransaction({
        id: `ft-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: user.organizationId,
        transactionNumber: `TRX-${Date.now().toString().slice(-4)}`,
        date: expense.date,
        accountId: acc.id,
        accountName: acc.accountName,
        type: 'PAYMENT',
        category: 'OPERATING_EXPENSE',
        amount: expense.amount,
        balanceAfter: acc.currentBalance,
        referenceId: expense.id,
        notes: `Expense ${expense.expenseNumber}: ${expense.categoryName} (${expense.description})`,
        performedBy: user.name
      });
    }

    // 2. Save expense
    StorageRepository.saveExpense(expense);

    StorageRepository.logAction(
      user.organizationId,
      'POST_EXPENSE',
      'EXPENSES',
      `Recorded expense ${expense.expenseNumber} of ৳${expense.amount.toLocaleString()} for ${expense.categoryName}.`,
      user.name
    );

    return { success: true, message: `Expense ${expense.expenseNumber} recorded successfully.` };
  },

  /**
   * Scenario F: Post Payroll Payment
   */
  postPayrollPayment: (
    payrollId: string,
    accountId: string,
    paymentMethod: any,
    user: User
  ): { success: boolean; message: string } => {
    const list = StorageRepository.getPayrollEntries(user.organizationId);
    const entry = list.find(p => p.id === payrollId);
    if (!entry) return { success: false, message: 'Payroll entry not found.' };

    const accounts = StorageRepository.getCashBankAccounts(user.organizationId);
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return { success: false, message: 'Payment account not found.' };

    // Deduct salary from account
    acc.currentBalance -= entry.netSalary;
    setStorage('accounts', accounts);

    // Update payroll
    entry.status = 'PAID';
    entry.paymentDate = new Date().toISOString();
    entry.paymentAccountId = accountId;
    entry.paymentMethod = paymentMethod;
    entry.paymentReference = `SAL-${entry.periodMonth}-${entry.employeeName.split(' ')[0]}`;
    StorageRepository.savePayrollEntry(entry);

    // Financial Transaction
    StorageRepository.addFinancialTransaction({
      id: `ft-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organizationId: user.organizationId,
      transactionNumber: `TRX-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      accountId: acc.id,
      accountName: acc.accountName,
      type: 'PAYMENT',
      category: 'SALARY_PAYMENT',
      amount: entry.netSalary,
      balanceAfter: acc.currentBalance,
      referenceId: entry.id,
      notes: `Salary payment to ${entry.employeeName} (${entry.designation}) for ${entry.periodMonth}`,
      performedBy: user.name
    });

    StorageRepository.logAction(
      user.organizationId,
      'POST_PAYROLL_PAYMENT',
      'PAYROLL',
      `Paid net salary of ৳${entry.netSalary.toLocaleString()} to ${entry.employeeName} for ${entry.periodMonth}.`,
      user.name
    );

    return { success: true, message: `Salary payment of ৳${entry.netSalary.toLocaleString()} posted successfully.` };
  }
};
