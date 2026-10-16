import {
  Organization,
  SubscriptionPlan,
  User,
  Warehouse,
  Product,
  StockBalance,
  StockMovement,
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

export const SEED_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter Trader',
    code: 'STARTER',
    monthlyFee: 3500,
    maxUsers: 3,
    maxWarehouses: 1,
    hasManufacturing: false,
    hasMultiWarehouse: false,
    hasAdvancedReports: false,
    description: 'Designed for single-store fabric retailers and small fabric wholesalers.'
  },
  {
    id: 'plan-pro',
    name: 'Professional Enterprise',
    code: 'PROFESSIONAL',
    monthlyFee: 9500,
    maxUsers: 10,
    maxWarehouses: 4,
    hasManufacturing: true,
    hasMultiWarehouse: true,
    hasAdvancedReports: true,
    description: 'Comprehensive solution for fabric manufacturers, knitting mills, and multi-depot wholesalers.'
  },
  {
    id: 'plan-enterprise',
    name: 'Industrial Composite',
    code: 'ENTERPRISE',
    monthlyFee: 22000,
    maxUsers: 50,
    maxWarehouses: 15,
    hasManufacturing: true,
    hasMultiWarehouse: true,
    hasAdvancedReports: true,
    description: 'Unlimited scalability for integrated composite textile mills, dyeing & printing conglomerates.'
  }
];

export const SEED_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-trading',
    name: 'TexVogue Fabrics Ltd.',
    businessType: 'TRADING',
    ownerName: 'Kabir Hossain',
    email: 'info@texvogue.com.bd',
    phone: '+880 1711-200300',
    address: 'Plot 42, Road 11, Sector 4, Uttara, Dhaka-1230',
    logo: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=128&q=80',
    currency: 'BDT',
    currencySymbol: '৳',
    timezone: 'Asia/Dhaka',
    status: 'ACTIVE',
    planId: 'plan-pro',
    createdAt: '2026-01-15T09:00:00Z',
    defaultWarehouseId: 'wh-t1',
    manufacturingEnabled: false,
    processType: 'trading',
    absenceDeductionDivisor: 30,
    negativeStockAllowed: false,
    costingMethod: 'WEIGHTED_AVERAGE',
    taxVatRate: 5,
    invoicePrefix: 'TV-INV',
    purchasePrefix: 'TV-PO',
    jobPrefix: 'TV-JOB'
  },
  {
    id: 'org-knitting',
    name: 'Apex Knitting Mills Ltd.',
    businessType: 'KNITTING',
    ownerName: 'Engr. Mustafizur Rahman',
    email: 'contact@apexknitting.com',
    phone: '+880 1819-450890',
    address: 'Vogra Bypass, Gazipur Sadar, Gazipur-1704',
    logo: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=128&q=80',
    currency: 'BDT',
    currencySymbol: '৳',
    timezone: 'Asia/Dhaka',
    status: 'ACTIVE',
    planId: 'plan-pro',
    createdAt: '2026-02-01T08:30:00Z',
    defaultWarehouseId: 'wh-k1',
    manufacturingEnabled: true,
    processType: 'knitting',
    absenceDeductionDivisor: 26,
    negativeStockAllowed: false,
    costingMethod: 'WEIGHTED_AVERAGE',
    taxVatRate: 5,
    invoicePrefix: 'AKM-INV',
    purchasePrefix: 'AKM-PO',
    jobPrefix: 'AKM-KNIT'
  },
  {
    id: 'org-dyeing',
    name: 'Chroma Dyeing & Finishing Ltd.',
    businessType: 'DYEING',
    ownerName: 'Asif Mahmud',
    email: 'operations@chromadyeing.bd',
    phone: '+880 1912-780123',
    address: 'Tarabo, Rupganj, Narayanganj-1460',
    logo: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=128&q=80',
    currency: 'BDT',
    currencySymbol: '৳',
    timezone: 'Asia/Dhaka',
    status: 'ACTIVE',
    planId: 'plan-enterprise',
    createdAt: '2026-02-10T11:00:00Z',
    defaultWarehouseId: 'wh-d1',
    manufacturingEnabled: true,
    processType: 'dyeing',
    absenceDeductionDivisor: 30,
    negativeStockAllowed: false,
    costingMethod: 'WEIGHTED_AVERAGE',
    taxVatRate: 5,
    invoicePrefix: 'CDF-INV',
    purchasePrefix: 'CDF-PO',
    jobPrefix: 'CDF-DYE'
  }
];

export const SEED_USERS: User[] = [
  // Platform Super Admin
  {
    id: 'user-admin',
    organizationId: '',
    name: 'Ahmad Tanvir (Platform Admin)',
    email: 'admin@texflow-platform.com',
    role: 'PLATFORM_SUPER_ADMIN',
    designation: 'Head of SaaS Platform',
    phone: '+880 1700-000001',
    active: true
  },
  // Organization A (Trading)
  {
    id: 'user-a-owner',
    organizationId: 'org-trading',
    name: 'Kabir Hossain',
    email: 'kabir@texvogue.com.bd',
    role: 'ORGANIZATION_OWNER',
    designation: 'Managing Director',
    phone: '+880 1711-200300',
    active: true
  },
  {
    id: 'user-a-acc',
    organizationId: 'org-trading',
    name: 'Fahim Ahmed',
    email: 'fahim.accounts@texvogue.com.bd',
    role: 'ACCOUNTANT',
    designation: 'Chief Accountant',
    phone: '+880 1711-200305',
    active: true
  },
  {
    id: 'user-a-pos',
    organizationId: 'org-trading',
    name: 'Sonia Akter',
    email: 'sonia.pos@texvogue.com.bd',
    role: 'POS_CASHIER',
    designation: 'Senior Cashier & Sales',
    phone: '+880 1711-200310',
    active: true
  },
  {
    id: 'user-a-sales',
    organizationId: 'org-trading',
    name: 'Tanvir Hasan',
    email: 'tanvir.sales@texvogue.com.bd',
    role: 'SALES_EXECUTIVE',
    designation: 'B2B Sales Executive',
    phone: '+880 1711-200312',
    active: true
  },
  // Organization B (Knitting)
  {
    id: 'user-b-owner',
    organizationId: 'org-knitting',
    name: 'Engr. Mustafizur Rahman',
    email: 'mustafiz@apexknitting.com',
    role: 'ORGANIZATION_OWNER',
    designation: 'Managing Director & Textile Engineer',
    phone: '+880 1819-450890',
    active: true
  },
  {
    id: 'user-b-prod',
    organizationId: 'org-knitting',
    name: 'Rafiqul Islam',
    email: 'rafiq.production@apexknitting.com',
    role: 'PRODUCTION_MANAGER',
    designation: 'Knitting Floor In-charge',
    phone: '+880 1819-450892',
    active: true
  },
  {
    id: 'user-b-store',
    organizationId: 'org-knitting',
    name: 'Jahangir Alam',
    email: 'store@apexknitting.com',
    role: 'STOREKEEPER',
    designation: 'Head of Yarn & Fabric Stores',
    phone: '+880 1819-450895',
    active: true
  },
  {
    id: 'user-b-hr',
    organizationId: 'org-knitting',
    name: 'Nusrat Jahan',
    email: 'hr@apexknitting.com',
    role: 'HR_PAYROLL_OFFICER',
    designation: 'HR & Compliance Manager',
    phone: '+880 1819-450898',
    active: true
  },
  // Organization C (Dyeing)
  {
    id: 'user-c-owner',
    organizationId: 'org-dyeing',
    name: 'Asif Mahmud',
    email: 'asif@chromadyeing.bd',
    role: 'ORGANIZATION_OWNER',
    designation: 'Proprietor & Managing Director',
    phone: '+880 1912-780123',
    active: true
  },
  {
    id: 'user-c-prod',
    organizationId: 'org-dyeing',
    name: 'Tareq Aziz',
    email: 'tareq.dyeing@chromadyeing.bd',
    role: 'PRODUCTION_MANAGER',
    designation: 'Dyehouse Master',
    phone: '+880 1912-780125',
    active: true
  }
];

export const SEED_WAREHOUSES: Warehouse[] = [
  // Org A: Trading
  {
    id: 'wh-t1',
    organizationId: 'org-trading',
    name: 'Dhaka Central Warehouse',
    code: 'WH-DAC-01',
    location: 'Plot 12, Tongi Industrial Area, Gazipur',
    isDefault: true,
    active: true,
    managerName: 'Khorshed Alam',
    contactPhone: '+880 1711-200401'
  },
  {
    id: 'wh-t2',
    organizationId: 'org-trading',
    name: 'Chittagong Retail Outlet & Depot',
    code: 'WH-CTG-02',
    location: 'Teribazar Market, Chittagong',
    isDefault: false,
    active: true,
    managerName: 'Kamal Uddin',
    contactPhone: '+880 1711-200402'
  },
  // Org B: Knitting
  {
    id: 'wh-k1',
    organizationId: 'org-knitting',
    name: 'Raw Material Yarn Warehouse',
    code: 'WH-YARN-01',
    location: 'Building 1, Vogra Factory Complex',
    isDefault: true,
    active: true,
    managerName: 'Jahangir Alam',
    contactPhone: '+880 1819-450895'
  },
  {
    id: 'wh-k2',
    organizationId: 'org-knitting',
    name: 'Knitted Goods Finished Store',
    code: 'WH-KNIT-02',
    location: 'Building 2 Ground Floor, Vogra Complex',
    isDefault: false,
    active: true,
    managerName: 'Delwar Hossain',
    contactPhone: '+880 1819-450896'
  },
  // Org C: Dyeing
  {
    id: 'wh-d1',
    organizationId: 'org-dyeing',
    name: 'Greige Fabric Receiving Warehouse',
    code: 'WH-GREIGE-01',
    location: 'Shed A, Tarabo Plant',
    isDefault: true,
    active: true,
    managerName: 'Shamsul Haque',
    contactPhone: '+880 1912-780131'
  },
  {
    id: 'wh-d2',
    organizationId: 'org-dyeing',
    name: 'Dyed & Finished Goods Warehouse',
    code: 'WH-DYED-02',
    location: 'Shed C Inspection Floor, Tarabo Plant',
    isDefault: false,
    active: true,
    managerName: 'Mozammel Hossain',
    contactPhone: '+880 1912-780132'
  }
];

export const SEED_PRODUCTS: Product[] = [
  // --- Org A: Trading Products ---
  {
    id: 'prod-t1',
    organizationId: 'org-trading',
    sku: 'FAB-SJ-COT-160-BLK',
    name: 'Single Jersey 100% Cotton 160 GSM - Jet Black',
    category: 'Knit Finished Fabric',
    description: 'Combed 30s cotton single jersey reactive dyed with enzyme wash for premium t-shirts.',
    productType: 'FINISHED_GOODS',
    unit: 'kg',
    secondaryUnit: 'roll',
    unitConversionFactor: 25, // 1 roll = 25 kg
    defaultPurchasePrice: 420,
    defaultSellingPrice: 520,
    currentWeightedAvgCost: 420,
    reorderLevel: 200,
    specifications: {
      materialType: '100% Combed Cotton',
      yarnCount: '30s',
      countSystem: 'Ne',
      gsm: 160,
      fabricWidth: 72,
      widthUnit: 'inch',
      colorName: 'Jet Black',
      colorHex: '#171717',
      fiberComposition: '100% Cotton',
      construction: 'Single Jersey',
      finishingType: 'Silicon Softener & Enzyme Washed',
      qualityGrade: 'EXPORT_QUALITY',
      dyeLotNumber: 'LOT-2601'
    },
    active: true
  },
  {
    id: 'prod-t2',
    organizationId: 'org-trading',
    sku: 'FAB-SJ-CVC-180-NVY',
    name: 'CVC Single Jersey 180 GSM - Navy Blue',
    category: 'Knit Finished Fabric',
    description: '60% Cotton 40% Polyester blend, soft hand feel, durable color fastness.',
    productType: 'FINISHED_GOODS',
    unit: 'kg',
    secondaryUnit: 'roll',
    unitConversionFactor: 25,
    defaultPurchasePrice: 380,
    defaultSellingPrice: 480,
    currentWeightedAvgCost: 380,
    reorderLevel: 150,
    specifications: {
      materialType: '60/40 CVC Blend',
      yarnCount: '26s',
      countSystem: 'Ne',
      gsm: 180,
      fabricWidth: 68,
      widthUnit: 'inch',
      colorName: 'Navy Blue',
      colorHex: '#1e3a8a',
      fiberComposition: '60% Cotton 40% Polyester',
      construction: 'Single Jersey',
      finishingType: 'Compacted & Pre-shrunk',
      qualityGrade: 'A_GRADE',
      dyeLotNumber: 'LOT-2602'
    },
    active: true
  },
  {
    id: 'prod-t3',
    organizationId: 'org-trading',
    sku: 'FAB-RIB-1X1-220-WHT',
    name: '1x1 Rib Lycra 220 GSM - Optical White',
    category: 'Rib & Collar Fabric',
    description: '95% Cotton 5% Spandex rib knit for neck ribbing, cuffs, and polo collars.',
    productType: 'FINISHED_GOODS',
    unit: 'kg',
    defaultPurchasePrice: 490,
    defaultSellingPrice: 620,
    currentWeightedAvgCost: 490,
    reorderLevel: 100,
    specifications: {
      materialType: 'Cotton Spandex Rib',
      yarnCount: '30s + 20D Spandex',
      countSystem: 'Ne',
      gsm: 220,
      fabricWidth: 44,
      widthUnit: 'inch',
      colorName: 'Optical White',
      colorHex: '#ffffff',
      fiberComposition: '95% Cotton 5% Spandex',
      construction: 'Rib 1x1',
      finishingType: 'Stenter Heat-set',
      qualityGrade: 'EXPORT_QUALITY'
    },
    active: true
  },
  {
    id: 'prod-t4',
    organizationId: 'org-trading',
    sku: 'FAB-INT-COT-240-MEL',
    name: 'Interlock Cotton 240 GSM - Heather Grey Melange',
    category: 'Knit Finished Fabric',
    description: 'Double knit interlock structure, heavy winter-weight and babywear grade.',
    productType: 'FINISHED_GOODS',
    unit: 'kg',
    defaultPurchasePrice: 530,
    defaultSellingPrice: 660,
    currentWeightedAvgCost: 530,
    reorderLevel: 80,
    specifications: {
      materialType: '100% Combed Cotton',
      yarnCount: '40s',
      countSystem: 'Ne',
      gsm: 240,
      fabricWidth: 60,
      widthUnit: 'inch',
      colorName: 'Heather Grey',
      colorHex: '#9ca3af',
      fiberComposition: '90% Cotton 10% Viscose Melange',
      construction: 'Interlock',
      finishingType: 'Peach Finished',
      qualityGrade: 'A_GRADE'
    },
    active: true
  },

  // --- Org B: Knitting Mill Products ---
  {
    id: 'prod-k-yarn1',
    organizationId: 'org-knitting',
    sku: 'YRN-30-COMB-RAW',
    name: '30s/1 Combed 100% Cotton Yarn (Ring Spun)',
    category: 'Raw Yarn',
    description: 'Virgin cotton spinning cones, suitable for fine gauge single jersey knitting.',
    productType: 'RAW_MATERIAL',
    unit: 'kg',
    secondaryUnit: 'cone',
    unitConversionFactor: 2.08, // approx 2.08 kg per cone (24 cones = 50 kg carton)
    defaultPurchasePrice: 320,
    defaultSellingPrice: 350,
    currentWeightedAvgCost: 320,
    reorderLevel: 500,
    specifications: {
      materialType: '100% Combed Cotton',
      yarnCount: '30s',
      countSystem: 'Ne',
      fiberComposition: '100% Cotton',
      qualityGrade: 'A_GRADE',
      coneWeightKg: 2.08,
      technicalNotes: 'CSP 3100, IPI < 50, Hairiness 4.2'
    },
    active: true
  },
  {
    id: 'prod-k-yarn2',
    organizationId: 'org-knitting',
    sku: 'YRN-24-CARD-RAW',
    name: '24s/1 Carded Cotton Yarn',
    category: 'Raw Yarn',
    description: 'Carded cotton yarn for standard fleece back and heavy rib knits.',
    productType: 'RAW_MATERIAL',
    unit: 'kg',
    defaultPurchasePrice: 280,
    defaultSellingPrice: 310,
    currentWeightedAvgCost: 280,
    reorderLevel: 400,
    specifications: {
      materialType: '100% Carded Cotton',
      yarnCount: '24s',
      countSystem: 'Ne',
      fiberComposition: '100% Cotton',
      qualityGrade: 'STANDARD',
      coneWeightKg: 2.08
    },
    active: true
  },
  {
    id: 'prod-k-out1',
    organizationId: 'org-knitting',
    sku: 'KNT-GREIGE-SJ-160',
    name: 'Greige Single Jersey Fabric 160 GSM (Knitted)',
    category: 'Knitted Greige Fabric',
    description: 'Circular knitted raw greige fabric off knitting machines, ready for dyeing.',
    productType: 'FINISHED_GOODS',
    unit: 'kg',
    secondaryUnit: 'roll',
    unitConversionFactor: 25,
    defaultPurchasePrice: 0,
    defaultSellingPrice: 395,
    currentWeightedAvgCost: 358, // raw yarn (320 / 0.85 yield = 376.5) plus labor/overhead
    reorderLevel: 300,
    specifications: {
      materialType: '100% Combed Cotton Greige',
      yarnCount: '30s',
      countSystem: 'Ne',
      gsm: 160,
      fabricWidth: 70,
      widthUnit: 'inch',
      colorName: 'Natural Ecru Greige',
      colorHex: '#fef3c7',
      fiberComposition: '100% Cotton',
      construction: 'Single Jersey',
      finishingType: 'Unwashed Loomstate Greige',
      qualityGrade: 'A_GRADE'
    },
    active: true
  },
  {
    id: 'prod-k-out2',
    organizationId: 'org-knitting',
    sku: 'KNT-GREIGE-RIB-220',
    name: 'Greige 1x1 Rib Fabric 220 GSM (Knitted)',
    category: 'Knitted Greige Fabric',
    description: 'Knitted ribbed collar and cuff greige fabric produced from 24s yarn.',
    productType: 'FINISHED_GOODS',
    unit: 'kg',
    defaultPurchasePrice: 0,
    defaultSellingPrice: 380,
    currentWeightedAvgCost: 335,
    reorderLevel: 200,
    specifications: {
      materialType: '100% Cotton Greige',
      yarnCount: '24s',
      countSystem: 'Ne',
      gsm: 220,
      fabricWidth: 42,
      widthUnit: 'inch',
      colorName: 'Natural Ecru Greige',
      colorHex: '#fef3c7',
      fiberComposition: '100% Cotton',
      construction: 'Rib 1x1',
      finishingType: 'Unwashed Loomstate'
    },
    active: true
  },

  // --- Org C: Dyeing & Finishing Products ---
  {
    id: 'prod-d-in1',
    organizationId: 'org-dyeing',
    sku: 'RAW-GREIGE-SJ-160',
    name: 'Raw Greige Single Jersey 160 GSM (Purchased)',
    category: 'Greige Fabric Input',
    description: 'Raw knitted fabric rolls received from knitting mills for commission dyeing.',
    productType: 'RAW_MATERIAL',
    unit: 'kg',
    secondaryUnit: 'roll',
    unitConversionFactor: 25,
    defaultPurchasePrice: 370,
    defaultSellingPrice: 400,
    currentWeightedAvgCost: 370,
    reorderLevel: 1000,
    specifications: {
      materialType: '100% Cotton Greige',
      yarnCount: '30s',
      countSystem: 'Ne',
      gsm: 160,
      fabricWidth: 70,
      widthUnit: 'inch',
      colorName: 'Greige Ecru',
      colorHex: '#fde68a',
      construction: 'Single Jersey'
    },
    active: true
  },
  {
    id: 'prod-d-chem',
    organizationId: 'org-dyeing',
    sku: 'CHM-DYESTUFF-REAC-BLU',
    name: 'Reactive Dyestuff & Auxiliary Chemicals Batch',
    category: 'Dyes & Chemicals',
    description: 'Reactive blue dyestuff, soda ash, glauber salt, scouring and leveling agents.',
    productType: 'RAW_MATERIAL',
    unit: 'kg',
    defaultPurchasePrice: 120,
    defaultSellingPrice: 150,
    currentWeightedAvgCost: 120,
    reorderLevel: 150,
    specifications: {
      materialType: 'Chemical Formulation',
      technicalNotes: 'Contains reactive dye and fixatives for high color fastness grade 4+'
    },
    active: true
  },
  {
    id: 'prod-d-out1',
    organizationId: 'org-dyeing',
    sku: 'FIN-DYED-SJ-ROYAL',
    name: 'Reactive Dyed Finished Single Jersey - Royal Blue',
    category: 'Dyed Finished Fabric',
    description: 'High-temperature soft-flow jet dyed, compacted, silicon-softened finished fabric.',
    productType: 'FINISHED_GOODS',
    unit: 'kg',
    secondaryUnit: 'roll',
    unitConversionFactor: 25,
    defaultPurchasePrice: 0,
    defaultSellingPrice: 530,
    currentWeightedAvgCost: 460,
    reorderLevel: 300,
    specifications: {
      materialType: '100% Combed Cotton Dyed',
      yarnCount: '30s',
      countSystem: 'Ne',
      gsm: 160,
      fabricWidth: 72,
      widthUnit: 'inch',
      colorName: 'Royal Blue',
      colorHex: '#2563eb',
      fiberComposition: '100% Cotton',
      construction: 'Single Jersey',
      finishingType: 'Enzyme Washed & Compacted',
      qualityGrade: 'EXPORT_QUALITY',
      dyeLotNumber: 'DYE-LOT-901'
    },
    active: true
  }
];

export const SEED_STOCK_BALANCES: StockBalance[] = [
  // Org A: Trading
  {
    id: 'sb-t1-1',
    organizationId: 'org-trading',
    productId: 'prod-t1',
    warehouseId: 'wh-t1',
    quantityOnHand: 1450,
    quantityReserved: 100,
    averageUnitCost: 420,
    batchLotNumber: 'LOT-2601',
    color: 'Jet Black'
  },
  {
    id: 'sb-t1-2',
    organizationId: 'org-trading',
    productId: 'prod-t1',
    warehouseId: 'wh-t2',
    quantityOnHand: 320,
    quantityReserved: 0,
    averageUnitCost: 420,
    batchLotNumber: 'LOT-2601',
    color: 'Jet Black'
  },
  {
    id: 'sb-t2-1',
    organizationId: 'org-trading',
    productId: 'prod-t2',
    warehouseId: 'wh-t1',
    quantityOnHand: 890,
    quantityReserved: 50,
    averageUnitCost: 380,
    batchLotNumber: 'LOT-2602',
    color: 'Navy Blue'
  },
  {
    id: 'sb-t3-1',
    organizationId: 'org-trading',
    productId: 'prod-t3',
    warehouseId: 'wh-t1',
    quantityOnHand: 410,
    quantityReserved: 0,
    averageUnitCost: 490,
    color: 'Optical White'
  },
  {
    id: 'sb-t4-1',
    organizationId: 'org-trading',
    productId: 'prod-t4',
    warehouseId: 'wh-t1',
    quantityOnHand: 250,
    quantityReserved: 0,
    averageUnitCost: 530,
    color: 'Heather Grey'
  },

  // Org B: Knitting
  {
    id: 'sb-k-yarn1',
    organizationId: 'org-knitting',
    productId: 'prod-k-yarn1',
    warehouseId: 'wh-k1',
    quantityOnHand: 2400,
    quantityReserved: 300,
    averageUnitCost: 320,
    batchLotNumber: 'YRN-SPIN-44'
  },
  {
    id: 'sb-k-yarn2',
    organizationId: 'org-knitting',
    productId: 'prod-k-yarn2',
    warehouseId: 'wh-k1',
    quantityOnHand: 1100,
    quantityReserved: 0,
    averageUnitCost: 280,
    batchLotNumber: 'YRN-SPIN-12'
  },
  {
    id: 'sb-k-out1',
    organizationId: 'org-knitting',
    productId: 'prod-k-out1',
    warehouseId: 'wh-k2',
    quantityOnHand: 850,
    quantityReserved: 0,
    averageUnitCost: 358,
    batchLotNumber: 'ROLL-KNIT-101'
  },
  {
    id: 'sb-k-out2',
    organizationId: 'org-knitting',
    productId: 'prod-k-out2',
    warehouseId: 'wh-k2',
    quantityOnHand: 340,
    quantityReserved: 0,
    averageUnitCost: 335,
    batchLotNumber: 'ROLL-KNIT-099'
  },

  // Org C: Dyeing
  {
    id: 'sb-d-in1',
    organizationId: 'org-dyeing',
    productId: 'prod-d-in1',
    warehouseId: 'wh-d1',
    quantityOnHand: 3200,
    quantityReserved: 500,
    averageUnitCost: 370,
    batchLotNumber: 'GRG-LOT-88'
  },
  {
    id: 'sb-d-chem',
    organizationId: 'org-dyeing',
    productId: 'prod-d-chem',
    warehouseId: 'wh-d1',
    quantityOnHand: 650,
    quantityReserved: 0,
    averageUnitCost: 120
  },
  {
    id: 'sb-d-out1',
    organizationId: 'org-dyeing',
    productId: 'prod-d-out1',
    warehouseId: 'wh-d2',
    quantityOnHand: 1150,
    quantityReserved: 0,
    averageUnitCost: 460,
    batchLotNumber: 'DYE-LOT-901',
    color: 'Royal Blue'
  }
];

export const SEED_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm-t1',
    organizationId: 'org-trading',
    productId: 'prod-t1',
    warehouseId: 'wh-t1',
    movementType: 'OPENING_BALANCE',
    quantity: 1500,
    unit: 'kg',
    unitCost: 420,
    totalCost: 630000,
    referenceNumber: 'OB-2026-001',
    referenceType: 'ADJUSTMENT',
    date: '2026-01-15T10:00:00Z',
    performedBy: 'Kabir Hossain',
    notes: 'Initial warehouse opening stock verification'
  },
  {
    id: 'sm-t2',
    organizationId: 'org-trading',
    productId: 'prod-t1',
    warehouseId: 'wh-t1',
    movementType: 'TRANSFER_OUT',
    quantity: -320,
    unit: 'kg',
    unitCost: 420,
    totalCost: -134400,
    referenceNumber: 'TRF-DAC-CTG-01',
    referenceType: 'TRANSFER',
    date: '2026-02-01T14:30:00Z',
    performedBy: 'Khorshed Alam',
    notes: 'Transfer to Chittagong showroom branch'
  },
  {
    id: 'sm-t3',
    organizationId: 'org-trading',
    productId: 'prod-t1',
    warehouseId: 'wh-t2',
    movementType: 'TRANSFER_IN',
    quantity: 320,
    unit: 'kg',
    unitCost: 420,
    totalCost: 134400,
    referenceNumber: 'TRF-DAC-CTG-01',
    referenceType: 'TRANSFER',
    date: '2026-02-02T11:00:00Z',
    performedBy: 'Kamal Uddin',
    notes: 'Received transfer from Dhaka warehouse'
  },
  {
    id: 'sm-k1',
    organizationId: 'org-knitting',
    productId: 'prod-k-yarn1',
    warehouseId: 'wh-k1',
    movementType: 'PURCHASE_RECEIPT',
    quantity: 3000,
    unit: 'kg',
    unitCost: 320,
    totalCost: 960000,
    referenceNumber: 'AKM-PO-2601',
    referenceType: 'PURCHASE',
    date: '2026-02-05T09:00:00Z',
    performedBy: 'Jahangir Alam',
    notes: 'Received bulk 30s combed yarn from Square Spinning'
  },
  {
    id: 'sm-k2',
    organizationId: 'org-knitting',
    productId: 'prod-k-yarn1',
    warehouseId: 'wh-k1',
    movementType: 'PRODUCTION_ISSUE',
    quantity: -1000,
    unit: 'kg',
    unitCost: 320,
    totalCost: -320000,
    referenceNumber: 'AKM-JOB-001',
    referenceType: 'PRODUCTION',
    date: '2026-02-12T08:00:00Z',
    performedBy: 'Rafiqul Islam',
    notes: 'Issued 1000 kg yarn to Circular Machine Line #4'
  },
  {
    id: 'sm-k3',
    organizationId: 'org-knitting',
    productId: 'prod-k-out1',
    warehouseId: 'wh-k2',
    movementType: 'PRODUCTION_RECEIPT',
    quantity: 850,
    unit: 'kg',
    unitCost: 358,
    totalCost: 304300,
    referenceNumber: 'AKM-JOB-001',
    referenceType: 'PRODUCTION',
    date: '2026-02-14T17:00:00Z',
    performedBy: 'Rafiqul Islam',
    notes: 'Received 850 kg completed Single Jersey (85% yield, 150 kg lint/wastage)'
  }
];

export const SEED_CUSTOMERS: Customer[] = [
  // Org A: Trading
  {
    id: 'cust-t1',
    organizationId: 'org-trading',
    code: 'CUST-001',
    name: 'Ananta Garments & Apparels Ltd.',
    contactPerson: 'Ziaul Haque (GM Sourcing)',
    phone: '+880 1713-112233',
    email: 'sourcing@anantagroup.com',
    address: 'Nishat Nagar, Tongi, Gazipur',
    customerType: 'GARMENT_MANUFACTURER',
    creditLimit: 500000,
    openingBalance: 120000,
    currentBalance: 185000,
    paymentTermsDays: 30,
    active: true
  },
  {
    id: 'cust-t2',
    organizationId: 'org-trading',
    code: 'CUST-002',
    name: 'Standard Fashions Wholesale',
    contactPerson: 'Mohammad Faruk',
    phone: '+880 1817-223344',
    email: 'faruk@standardfashions.com',
    address: 'Shop 14, Islampur Cloth Market, Old Dhaka',
    customerType: 'WHOLESALE',
    creditLimit: 300000,
    openingBalance: 45000,
    currentBalance: 85000,
    paymentTermsDays: 15,
    active: true
  },
  {
    id: 'cust-t3',
    organizationId: 'org-trading',
    code: 'CUST-003',
    name: 'Dapper Menswear Boutique',
    contactPerson: 'Sabbir Ahmed',
    phone: '+880 1911-334455',
    email: 'sabbir@dapperbd.com',
    address: 'Banani 11, Dhaka',
    customerType: 'RETAIL',
    creditLimit: 50000,
    openingBalance: 0,
    currentBalance: 12000,
    paymentTermsDays: 7,
    active: true
  },

  // Org B: Knitting
  {
    id: 'cust-k1',
    organizationId: 'org-knitting',
    code: 'CUST-K01',
    name: 'Robintex Composite Dyeing & Garments',
    contactPerson: 'Mahfuz Alam (Commercial Dept)',
    phone: '+880 1714-998877',
    email: 'commercial@robintex.com',
    address: 'Bhulta, Gausia, Narayanganj',
    customerType: 'GARMENT_MANUFACTURER',
    creditLimit: 1200000,
    openingBalance: 250000,
    currentBalance: 320000,
    paymentTermsDays: 45,
    active: true
  },

  // Org C: Dyeing
  {
    id: 'cust-c1',
    organizationId: 'org-dyeing',
    code: 'CUST-C01',
    name: 'Ha-Meem Knitwear Division',
    contactPerson: 'Moniruzzaman',
    phone: '+880 1712-445566',
    email: 'monir@hameemgroup.com',
    address: 'Tejgaon Industrial Area, Dhaka',
    customerType: 'GARMENT_MANUFACTURER',
    creditLimit: 1500000,
    openingBalance: 350000,
    currentBalance: 490000,
    paymentTermsDays: 30,
    active: true
  }
];

export const SEED_SUPPLIERS: Supplier[] = [
  // Org A: Trading
  {
    id: 'supp-t1',
    organizationId: 'org-trading',
    code: 'SUPP-001',
    name: 'Envoy Textiles Ltd.',
    contactPerson: 'Tanveer Ahmed',
    phone: '+880 1711-556677',
    email: 'sales@envoytextiles.com',
    address: 'Envoy Tower, 186 Lake Circus, Kalabagan, Dhaka',
    supplierType: 'GREIGE_MILL',
    openingBalance: 180000,
    currentBalance: 110000,
    paymentTermsDays: 30,
    active: true
  },
  {
    id: 'supp-t2',
    organizationId: 'org-trading',
    code: 'SUPP-002',
    name: 'Badsha Textiles Mills Ltd.',
    contactPerson: 'Shafiqul Islam',
    phone: '+880 1819-667788',
    email: 'order@badshagroup.com',
    address: 'Gulshan-2, Dhaka',
    supplierType: 'SPINNING_MILL',
    openingBalance: 90000,
    currentBalance: 45000,
    paymentTermsDays: 20,
    active: true
  },

  // Org B: Knitting
  {
    id: 'supp-k1',
    organizationId: 'org-knitting',
    code: 'SUPP-K01',
    name: 'Square Spinning Mills Ltd.',
    contactPerson: 'Golam Kibria',
    phone: '+880 1711-889900',
    email: 'spinning.sales@squaregroup.com',
    address: 'Square Centre, 48 Mohakhali C/A, Dhaka-1212',
    supplierType: 'SPINNING_MILL',
    openingBalance: 450000,
    currentBalance: 380000,
    paymentTermsDays: 30,
    active: true
  },

  // Org C: Dyeing
  {
    id: 'supp-c1',
    organizationId: 'org-dyeing',
    code: 'SUPP-C01',
    name: 'Archroma Bangladesh Ltd.',
    contactPerson: 'Dr. Shahinur Rahman',
    phone: '+880 1713-776655',
    email: 'info@archroma.com.bd',
    address: 'Uttara Commercial Area, Sector 3, Dhaka',
    supplierType: 'DYE_CHEMICAL_VENDOR',
    openingBalance: 140000,
    currentBalance: 95000,
    paymentTermsDays: 25,
    active: true
  }
];

export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  // Org A: Trading
  {
    id: 'po-t1',
    organizationId: 'org-trading',
    purchaseNumber: 'TV-PO-2601',
    supplierId: 'supp-t1',
    supplierName: 'Envoy Textiles Ltd.',
    warehouseId: 'wh-t1',
    orderDate: '2026-02-10T10:00:00Z',
    expectedDeliveryDate: '2026-02-15T10:00:00Z',
    goodsReceiptDate: '2026-02-14T15:00:00Z',
    items: [
      {
        productId: 'prod-t1',
        productName: 'Single Jersey 100% Cotton 160 GSM - Jet Black',
        specSummary: '30s Ne, 160 GSM, 72" width',
        lotNumber: 'LOT-2601',
        color: 'Jet Black',
        unit: 'kg',
        orderQuantity: 500,
        receivedQuantity: 500,
        rejectedQuantity: 0,
        unitPrice: 420,
        taxAmount: 10500,
        totalPrice: 210000
      }
    ],
    subtotal: 210000,
    discount: 5000,
    tax: 10500,
    freightCosts: 3000,
    grandTotal: 218500,
    paidAmount: 150000,
    dueAmount: 68500,
    status: 'RECEIVED',
    paymentStatus: 'PARTIAL',
    notes: 'Received in good condition and stocked in Dhaka Central Warehouse.'
  },

  // Org B: Knitting Factory
  {
    id: 'po-k1',
    organizationId: 'org-knitting',
    purchaseNumber: 'AKM-PO-2601',
    supplierId: 'supp-k1',
    supplierName: 'Square Spinning Mills Ltd.',
    warehouseId: 'wh-k1',
    orderDate: '2026-02-01T10:00:00Z',
    expectedDeliveryDate: '2026-02-05T10:00:00Z',
    goodsReceiptDate: '2026-02-05T12:00:00Z',
    items: [
      {
        productId: 'prod-k-yarn1',
        productName: '30s/1 Combed 100% Cotton Yarn (Ring Spun)',
        specSummary: '30s Ne Combed Ring Spun Cones',
        lotNumber: 'YRN-SPIN-44',
        unit: 'kg',
        orderQuantity: 3000,
        receivedQuantity: 3000,
        rejectedQuantity: 0,
        unitPrice: 320,
        taxAmount: 48000,
        totalPrice: 960000
      }
    ],
    subtotal: 960000,
    discount: 10000,
    tax: 48000,
    freightCosts: 12000,
    grandTotal: 1010000,
    paidAmount: 700000,
    dueAmount: 310000,
    status: 'RECEIVED',
    paymentStatus: 'PARTIAL',
    notes: 'Yarn received and checked by laboratory QC.'
  }
];

export const SEED_SUPPLIER_PAYMENTS: SupplierPayment[] = [
  {
    id: 'sp-t1',
    organizationId: 'org-trading',
    voucherNumber: 'PAY-VOU-2601',
    supplierId: 'supp-t1',
    supplierName: 'Envoy Textiles Ltd.',
    purchaseOrderId: 'po-t1',
    paymentDate: '2026-02-16T11:00:00Z',
    amount: 150000,
    paymentMethod: 'BANK_TRANSFER',
    accountId: 'acc-t-bank',
    reference: 'EBL-TRF-9921',
    notes: 'Advance part payment for PO TV-PO-2601',
    recordedBy: 'Fahim Ahmed'
  },
  {
    id: 'sp-k1',
    organizationId: 'org-knitting',
    voucherNumber: 'AKM-PAY-01',
    supplierId: 'supp-k1',
    supplierName: 'Square Spinning Mills Ltd.',
    purchaseOrderId: 'po-k1',
    paymentDate: '2026-02-08T14:00:00Z',
    amount: 700000,
    paymentMethod: 'BANK_TRANSFER',
    accountId: 'acc-k-bank',
    reference: 'IBBL-CHQ-4402',
    notes: 'Cheque issued for yarn shipment',
    recordedBy: 'Engr. Mustafizur Rahman'
  }
];

export const SEED_SALES_INVOICES: SalesInvoice[] = [
  // Org A: In-Store POS & B2B Sales
  {
    id: 'inv-t1',
    organizationId: 'org-trading',
    invoiceNumber: 'TV-INV-2601',
    salesChannel: 'IN_STORE_COUNTER',
    customerId: 'cust-t1',
    customerName: 'Ananta Garments & Apparels Ltd.',
    warehouseId: 'wh-t1',
    date: '2026-02-18T14:30:00Z',
    items: [
      {
        productId: 'prod-t1',
        productName: 'Single Jersey 100% Cotton 160 GSM - Jet Black',
        specSummary: '160 GSM 72" Black',
        color: 'Jet Black',
        unit: 'kg',
        quantity: 200,
        unitPrice: 520,
        unitCost: 420,
        discount: 2000,
        total: 102000
      }
    ],
    subtotal: 104000,
    discount: 2000,
    tax: 5100,
    deliveryCharge: 1500,
    grandTotal: 108600,
    totalCostOfGoodsSold: 84000, // 200 kg * 420 cost
    paidAmount: 60000,
    dueAmount: 48600,
    paymentMethod: 'BANK_TRANSFER',
    paymentAccountId: 'acc-t-bank',
    paymentStatus: 'PARTIAL',
    orderStatus: 'DELIVERED',
    salesperson: 'Tanvir Hasan',
    notes: 'Challan delivered via truck #DHAKA-METRO-TA-4412'
  },
  {
    id: 'inv-t2',
    organizationId: 'org-trading',
    invoiceNumber: 'TV-POS-2602',
    salesChannel: 'POS',
    customerId: 'cust-t3',
    customerName: 'Dapper Menswear Boutique',
    warehouseId: 'wh-t1',
    date: '2026-02-20T16:15:00Z',
    items: [
      {
        productId: 'prod-t3',
        productName: '1x1 Rib Lycra 220 GSM - Optical White',
        specSummary: '220 GSM Rib',
        color: 'Optical White',
        unit: 'kg',
        quantity: 25,
        unitPrice: 620,
        unitCost: 490,
        discount: 0,
        total: 15500
      }
    ],
    subtotal: 15500,
    discount: 500,
    tax: 750,
    deliveryCharge: 0,
    grandTotal: 15750,
    totalCostOfGoodsSold: 12250, // 25 * 490
    paidAmount: 15750,
    dueAmount: 0,
    paymentMethod: 'CASH',
    paymentAccountId: 'acc-t-cash',
    paymentStatus: 'PAID',
    orderStatus: 'DELIVERED',
    salesperson: 'Sonia Akter',
    notes: 'Immediate counter checkout'
  },
  {
    id: 'inv-t3',
    organizationId: 'org-trading',
    invoiceNumber: 'TV-WEB-2603',
    salesChannel: 'WEBSITE',
    customerId: 'cust-t2',
    customerName: 'Standard Fashions Wholesale',
    warehouseId: 'wh-t1',
    date: '2026-02-22T11:20:00Z',
    items: [
      {
        productId: 'prod-t2',
        productName: 'CVC Single Jersey 180 GSM - Navy Blue',
        specSummary: '180 GSM CVC Navy',
        color: 'Navy Blue',
        unit: 'kg',
        quantity: 100,
        unitPrice: 480,
        unitCost: 380,
        discount: 1000,
        total: 47000
      }
    ],
    subtotal: 48000,
    discount: 1000,
    tax: 2350,
    deliveryCharge: 2000,
    grandTotal: 51350,
    totalCostOfGoodsSold: 38000,
    paidAmount: 20000,
    dueAmount: 31350,
    paymentMethod: 'MFS_BKASH',
    paymentAccountId: 'acc-t-bkash',
    paymentStatus: 'PARTIAL',
    orderStatus: 'DISPATCHED',
    salesperson: 'Online System',
    onlineDetails: {
      platform: 'Shopify Store',
      shippingAddress: 'Shop 14, Islampur Cloth Market, Dhaka',
      trackingNumber: 'REDX-998822',
      customerPhone: '+880 1817-223344'
    },
    notes: 'RedX courier pickup scheduled'
  }
];

export const SEED_CUSTOMER_COLLECTIONS: CustomerCollection[] = [
  {
    id: 'col-t1',
    organizationId: 'org-trading',
    receiptNumber: 'MR-2601',
    customerId: 'cust-t1',
    customerName: 'Ananta Garments & Apparels Ltd.',
    salesInvoiceId: 'inv-t1',
    collectionDate: '2026-02-19T10:00:00Z',
    amount: 60000,
    paymentMethod: 'BANK_TRANSFER',
    accountId: 'acc-t-bank',
    reference: 'EBL-DEP-0043',
    notes: 'Advance part collection for INV TV-INV-2601',
    recordedBy: 'Fahim Ahmed'
  },
  {
    id: 'col-t2',
    organizationId: 'org-trading',
    receiptNumber: 'MR-2602',
    customerId: 'cust-t2',
    customerName: 'Standard Fashions Wholesale',
    salesInvoiceId: 'inv-t3',
    collectionDate: '2026-02-22T11:25:00Z',
    amount: 20000,
    paymentMethod: 'MFS_BKASH',
    accountId: 'acc-t-bkash',
    reference: 'BKASH-TRX-871109',
    notes: 'bKash merchant payment confirmation',
    recordedBy: 'Sonia Akter'
  }
];

export const SEED_PRODUCTION_RECIPES: ProductionRecipe[] = [
  // Org B: Knitting Recipe (1000 kg yarn -> 850 kg fabric @ 85% yield)
  {
    id: 'recipe-k1',
    organizationId: 'org-knitting',
    code: 'BOM-KNIT-SJ-85',
    name: 'Single Jersey 160 GSM Combed Cotton Standard Knitting',
    processType: 'KNITTING',
    inputItems: [
      {
        productId: 'prod-k-yarn1',
        productName: '30s/1 Combed 100% Cotton Yarn (Ring Spun)',
        requiredQuantity: 1.17647, // 1 / 0.85 approx 1.176 kg yarn per 1 kg fabric
        unit: 'kg',
        unitCostEstimate: 320
      }
    ],
    outputProductId: 'prod-k-out1',
    outputProductName: 'Greige Single Jersey Fabric 160 GSM (Knitted)',
    targetOutputQuantity: 850, // for 1000 kg yarn input
    expectedYieldPercent: 85,
    expectedWastagePercent: 15,
    estimatedLaborCost: 15, // BDT per kg finished output
    estimatedChemicalDyeCost: 0, // Greige fabric without dyeing
    estimatedMachineOverheadCost: 12, // BDT per kg finished output
    notes: 'Benchmark 30s yarn conversion on Mayer & Cie circular knitting machines. 15% wastage consists of fiber fly, lint, and end cones.',
    active: true
  },
  {
    id: 'recipe-k2',
    organizationId: 'org-knitting',
    code: 'BOM-KNIT-RIB-88',
    name: '1x1 Rib 220 GSM Cotton Knitting Recipe',
    processType: 'KNITTING',
    inputItems: [
      {
        productId: 'prod-k-yarn2',
        productName: '24s/1 Carded Cotton Yarn',
        requiredQuantity: 1.136, // approx 88% yield
        unit: 'kg',
        unitCostEstimate: 280
      }
    ],
    outputProductId: 'prod-k-out2',
    outputProductName: 'Greige 1x1 Rib Fabric 220 GSM (Knitted)',
    targetOutputQuantity: 880,
    expectedYieldPercent: 88,
    expectedWastagePercent: 12,
    estimatedLaborCost: 16,
    estimatedChemicalDyeCost: 0,
    estimatedMachineOverheadCost: 14,
    notes: 'Terrot circular rib knitting machine setup.',
    active: true
  },

  // Org C: Dyeing Recipe (Greige -> Reactive Dyed Finished Fabric @ 92% yield)
  {
    id: 'recipe-c1',
    organizationId: 'org-dyeing',
    code: 'BOM-DYE-ROYAL-92',
    name: 'Reactive Royal Blue Dyeing & Silicon Finishing',
    processType: 'DYEING',
    inputItems: [
      {
        productId: 'prod-d-in1',
        productName: 'Raw Greige Single Jersey 160 GSM (Purchased)',
        requiredQuantity: 1.087, // 1 / 0.92
        unit: 'kg',
        unitCostEstimate: 370
      },
      {
        productId: 'prod-d-chem',
        productName: 'Reactive Dyestuff & Auxiliary Chemicals Batch',
        requiredQuantity: 0.08, // 80g chemicals per kg fabric
        unit: 'kg',
        unitCostEstimate: 120
      }
    ],
    outputProductId: 'prod-d-out1',
    outputProductName: 'Reactive Dyed Finished Single Jersey - Royal Blue',
    targetOutputQuantity: 920,
    expectedYieldPercent: 92,
    expectedWastagePercent: 8,
    estimatedLaborCost: 25,
    estimatedChemicalDyeCost: 35,
    estimatedMachineOverheadCost: 20,
    notes: 'Soft-flow dyeing vessel process: Scouring, bleaching, reactive dyeing, soaping, stenter compaction, silicon softening.',
    active: true
  }
];

export const SEED_PRODUCTION_JOBS: ProductionJob[] = [
  // Org B: Completed Job #001
  {
    id: 'job-k1',
    organizationId: 'org-knitting',
    jobNumber: 'AKM-KNIT-001',
    recipeId: 'recipe-k1',
    recipeName: 'Single Jersey 160 GSM Combed Cotton Standard Knitting',
    processType: 'KNITTING',
    sourceWarehouseId: 'wh-k1', // Raw Yarn Store
    destinationWarehouseId: 'wh-k2', // Knitted Goods Finished Store
    status: 'COMPLETED',
    startDate: '2026-02-12T08:00:00Z',
    completionDate: '2026-02-14T17:00:00Z',
    targetOutputProduct: 'Greige Single Jersey Fabric 160 GSM (Knitted)',
    targetOutputProductId: 'prod-k-out1',
    estimatedInputQuantity: 1000,
    estimatedOutputQuantity: 850,
    expectedYieldPercent: 85,
    expectedWastagePercent: 15,
    actualInputQuantity: 1000,
    actualOutputQuantity: 850,
    actualWastageQuantity: 150,
    actualYieldPercent: 85,
    inputUnit: 'kg',
    outputUnit: 'kg',
    inputBatchLot: 'YRN-SPIN-44',
    outputBatchLot: 'ROLL-KNIT-101',
    rawMaterialCost: 320000, // 1000 kg * 320 BDT
    directLaborCost: 12750, // 850 kg * 15 BDT
    dyeChemicalCost: 0,
    overheadCost: 10200, // 850 kg * 12 BDT
    totalProductionCost: 342950,
    calculatedCostPerUnit: 403.47, // 342950 / 850
    supervisor: 'Rafiqul Islam',
    notes: 'Batch produced seamlessly with exact expected 85% yield.'
  },
  // Org B: In Progress Job #002
  {
    id: 'job-k2',
    organizationId: 'org-knitting',
    jobNumber: 'AKM-KNIT-002',
    recipeId: 'recipe-k1',
    recipeName: 'Single Jersey 160 GSM Combed Cotton Standard Knitting',
    processType: 'KNITTING',
    sourceWarehouseId: 'wh-k1',
    destinationWarehouseId: 'wh-k2',
    status: 'IN_PROGRESS',
    startDate: '2026-02-20T08:00:00Z',
    targetOutputProduct: 'Greige Single Jersey Fabric 160 GSM (Knitted)',
    targetOutputProductId: 'prod-k-out1',
    estimatedInputQuantity: 500,
    estimatedOutputQuantity: 425,
    expectedYieldPercent: 85,
    expectedWastagePercent: 15,
    actualInputQuantity: 500,
    actualOutputQuantity: 0,
    actualWastageQuantity: 0,
    actualYieldPercent: 0,
    inputUnit: 'kg',
    outputUnit: 'kg',
    inputBatchLot: 'YRN-SPIN-44',
    rawMaterialCost: 160000,
    directLaborCost: 6375,
    dyeChemicalCost: 0,
    overheadCost: 5100,
    totalProductionCost: 171475,
    calculatedCostPerUnit: 403.47,
    supervisor: 'Rafiqul Islam',
    notes: 'Currently running on Circular Machine 2.'
  }
];

export const SEED_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'exp-cat-1', organizationId: 'org-trading', name: 'Showroom & Warehouse Rent', code: 'RENT' },
  { id: 'exp-cat-2', organizationId: 'org-trading', name: 'Electricity, Gas & Utilities', code: 'UTILITY' },
  { id: 'exp-cat-3', organizationId: 'org-trading', name: 'Freight & Transportation', code: 'TRANSPORT' },
  { id: 'exp-cat-4', organizationId: 'org-trading', name: 'Marketing & Digital Ads', code: 'MARKETING' },
  { id: 'exp-cat-5', organizationId: 'org-trading', name: 'Office Tea, Stationery & Admin', code: 'OFFICE' },
  { id: 'exp-cat-6', organizationId: 'org-knitting', name: 'Factory Power & Diesel Generator', code: 'POWER' },
  { id: 'exp-cat-7', organizationId: 'org-knitting', name: 'Needle & Machine Spares', code: 'MAINTENANCE' },
  { id: 'exp-cat-8', organizationId: 'org-dyeing', name: 'ETP Effluent Treatment Chemicals', code: 'ETP' }
];

export const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-t1',
    organizationId: 'org-trading',
    expenseNumber: 'EXP-2601',
    categoryId: 'exp-cat-1',
    categoryName: 'Showroom & Warehouse Rent',
    date: '2026-02-05T10:00:00Z',
    amount: 45000,
    paymentMethod: 'BANK_TRANSFER',
    accountId: 'acc-t-bank',
    payee: 'Haji Shamsuddin Building Estate',
    description: 'Monthly warehouse rental for Dhaka central storage',
    status: 'APPROVED',
    recordedBy: 'Fahim Ahmed'
  },
  {
    id: 'exp-t2',
    organizationId: 'org-trading',
    expenseNumber: 'EXP-2602',
    categoryId: 'exp-cat-3',
    categoryName: 'Freight & Transportation',
    date: '2026-02-15T15:00:00Z',
    amount: 6500,
    paymentMethod: 'CASH',
    accountId: 'acc-t-cash',
    payee: 'Bengal Express Cargo',
    description: 'Local truck delivery charges for fabric rolls',
    status: 'APPROVED',
    recordedBy: 'Fahim Ahmed'
  },
  {
    id: 'exp-k1',
    organizationId: 'org-knitting',
    expenseNumber: 'AKM-EXP-01',
    categoryId: 'exp-cat-6',
    categoryName: 'Factory Power & Diesel Generator',
    date: '2026-02-10T12:00:00Z',
    amount: 65000,
    paymentMethod: 'BANK_TRANSFER',
    accountId: 'acc-k-bank',
    payee: 'DESCO / Meghna Petroleum',
    description: 'Industrial high voltage electricity tariff payment',
    status: 'APPROVED',
    recordedBy: 'Engr. Mustafizur Rahman'
  }
];

export const SEED_EMPLOYEES: Employee[] = [
  // Org A: Trading
  {
    id: 'emp-t1',
    organizationId: 'org-trading',
    employeeCode: 'EMP-01',
    fullName: 'Fahim Ahmed',
    designation: 'Chief Accountant',
    department: 'ACCOUNTS',
    phone: '+880 1711-200305',
    email: 'fahim.accounts@texvogue.com.bd',
    joiningDate: '2024-01-01',
    basicSalary: 35000,
    allowances: 10000,
    active: true
  },
  {
    id: 'emp-t2',
    organizationId: 'org-trading',
    employeeCode: 'EMP-02',
    fullName: 'Sonia Akter',
    designation: 'Senior Cashier & Sales',
    department: 'SALES',
    phone: '+880 1711-200310',
    email: 'sonia.pos@texvogue.com.bd',
    joiningDate: '2024-06-15',
    basicSalary: 22000,
    allowances: 6000,
    active: true
  },
  {
    id: 'emp-t3',
    organizationId: 'org-trading',
    employeeCode: 'EMP-03',
    fullName: 'Tanvir Hasan',
    designation: 'B2B Sales Executive',
    department: 'SALES',
    phone: '+880 1711-200312',
    email: 'tanvir.sales@texvogue.com.bd',
    joiningDate: '2024-08-01',
    basicSalary: 25000,
    allowances: 7000,
    active: true
  },

  // Org B: Knitting
  {
    id: 'emp-k1',
    organizationId: 'org-knitting',
    employeeCode: 'AKM-E01',
    fullName: 'Rafiqul Islam',
    designation: 'Knitting Floor In-charge',
    department: 'PRODUCTION',
    phone: '+880 1819-450892',
    email: 'rafiq.production@apexknitting.com',
    joiningDate: '2023-03-01',
    basicSalary: 42000,
    allowances: 12000,
    active: true
  },
  {
    id: 'emp-k2',
    organizationId: 'org-knitting',
    employeeCode: 'AKM-E02',
    fullName: 'Jahangir Alam',
    designation: 'Head of Yarn & Fabric Stores',
    department: 'WAREHOUSE',
    phone: '+880 1819-450895',
    email: 'store@apexknitting.com',
    joiningDate: '2023-05-10',
    basicSalary: 28000,
    allowances: 8000,
    active: true
  }
];

export const SEED_PAYROLL_ENTRIES: PayrollEntry[] = [
  {
    id: 'pay-t1',
    organizationId: 'org-trading',
    payrollNumber: 'PAY-2026-01-01',
    employeeId: 'emp-t1',
    employeeName: 'Fahim Ahmed',
    designation: 'Chief Accountant',
    periodMonth: '2026-01',
    basicSalary: 35000,
    allowances: 10000,
    bonus: 3000,
    absentDays: 1,
    absenceDailyRate: 1166.67, // 35000 / 30
    absenceDeductionAmount: 1167,
    otherDeductions: 0,
    advanceAdjustment: 0,
    netSalary: 46833,
    status: 'PAID',
    paymentDate: '2026-02-01T10:00:00Z',
    paymentAccountId: 'acc-t-bank',
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: 'EBL-SAL-1001',
    notes: 'Salary for January 2026'
  },
  {
    id: 'pay-t2',
    organizationId: 'org-trading',
    payrollNumber: 'PAY-2026-01-02',
    employeeId: 'emp-t2',
    employeeName: 'Sonia Akter',
    designation: 'Senior Cashier & Sales',
    periodMonth: '2026-01',
    basicSalary: 22000,
    allowances: 6000,
    bonus: 2000,
    absentDays: 2,
    absenceDailyRate: 733.33, // 22000 / 30
    absenceDeductionAmount: 1467,
    otherDeductions: 0,
    advanceAdjustment: 0,
    netSalary: 28533,
    status: 'PAID',
    paymentDate: '2026-02-01T10:00:00Z',
    paymentAccountId: 'acc-t-bank',
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: 'EBL-SAL-1002',
    notes: 'Salary for January 2026 with 2 absent days deduction'
  }
];

export const SEED_CASH_BANK_ACCOUNTS: CashBankAccount[] = [
  // Org A: Trading Accounts
  {
    id: 'acc-t-cash',
    organizationId: 'org-trading',
    accountName: 'Main Cash Counter & Drawer',
    accountType: 'CASH',
    openingBalance: 50000,
    currentBalance: 59250, // 50000 + 15750 (POS sale) - 6500 (expense)
    currency: 'BDT'
  },
  {
    id: 'acc-t-bank',
    organizationId: 'org-trading',
    accountName: 'Eastern Bank Ltd. (Current A/C)',
    accountType: 'BANK',
    accountNumber: '104-102-0044991',
    bankName: 'Eastern Bank PLC',
    branchName: 'Uttara Branch',
    openingBalance: 450000,
    currentBalance: 329634, // 450000 - 150000 (PO part pay) + 60000 (collection) - 45000 (rent) - (46833 + 28533 salary)
    currency: 'BDT'
  },
  {
    id: 'acc-t-bkash',
    organizationId: 'org-trading',
    accountName: 'bKash Merchant Account',
    accountType: 'MFS',
    accountNumber: '01711200399',
    openingBalance: 20000,
    currentBalance: 40000, // + 20000 collection
    currency: 'BDT'
  },

  // Org B: Knitting Accounts
  {
    id: 'acc-k-cash',
    organizationId: 'org-knitting',
    accountName: 'Factory Petty Cash',
    accountType: 'CASH',
    openingBalance: 35000,
    currentBalance: 35000,
    currency: 'BDT'
  },
  {
    id: 'acc-k-bank',
    organizationId: 'org-knitting',
    accountName: 'Islami Bank Bangladesh PLC (Corporate)',
    accountType: 'BANK',
    accountNumber: '2050-189-020088',
    bankName: 'Islami Bank Bangladesh PLC',
    branchName: 'Gazipur Chowrasta',
    openingBalance: 1250000,
    currentBalance: 485000, // 1250000 - 700000 (yarn pay) - 65000 (power)
    currency: 'BDT'
  },

  // Org C: Dyeing Accounts
  {
    id: 'acc-c-cash',
    organizationId: 'org-dyeing',
    accountName: 'Mill Cash Office',
    accountType: 'CASH',
    openingBalance: 40000,
    currentBalance: 40000,
    currency: 'BDT'
  },
  {
    id: 'acc-c-bank',
    organizationId: 'org-dyeing',
    accountName: 'Prime Bank Ltd. (A/C)',
    accountType: 'BANK',
    accountNumber: '110-109-887711',
    bankName: 'Prime Bank PLC',
    branchName: 'Narayanganj Branch',
    openingBalance: 820000,
    currentBalance: 820000,
    currency: 'BDT'
  }
];

export const SEED_FINANCIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'ft-t1',
    organizationId: 'org-trading',
    transactionNumber: 'TRX-2601',
    date: '2026-02-05T10:00:00Z',
    accountId: 'acc-t-bank',
    accountName: 'Eastern Bank Ltd. (Current A/C)',
    type: 'PAYMENT',
    category: 'OPERATING_EXPENSE',
    amount: 45000,
    balanceAfter: 405000,
    referenceId: 'exp-t1',
    notes: 'Warehouse rent payment',
    performedBy: 'Fahim Ahmed'
  },
  {
    id: 'ft-t2',
    organizationId: 'org-trading',
    transactionNumber: 'TRX-2602',
    date: '2026-02-15T15:00:00Z',
    accountId: 'acc-t-cash',
    accountName: 'Main Cash Counter & Drawer',
    type: 'PAYMENT',
    category: 'OPERATING_EXPENSE',
    amount: 6500,
    balanceAfter: 43500,
    referenceId: 'exp-t2',
    notes: 'Freight charges for fabric rolls',
    performedBy: 'Fahim Ahmed'
  },
  {
    id: 'ft-t3',
    organizationId: 'org-trading',
    transactionNumber: 'TRX-2603',
    date: '2026-02-16T11:00:00Z',
    accountId: 'acc-t-bank',
    accountName: 'Eastern Bank Ltd. (Current A/C)',
    type: 'PAYMENT',
    category: 'SUPPLIER_PAYMENT',
    amount: 150000,
    balanceAfter: 255000,
    referenceId: 'sp-t1',
    notes: 'Part payment to Envoy Textiles Ltd.',
    performedBy: 'Fahim Ahmed'
  },
  {
    id: 'ft-t4',
    organizationId: 'org-trading',
    transactionNumber: 'TRX-2604',
    date: '2026-02-19T10:00:00Z',
    accountId: 'acc-t-bank',
    accountName: 'Eastern Bank Ltd. (Current A/C)',
    type: 'RECEIPT',
    category: 'CUSTOMER_COLLECTION',
    amount: 60000,
    balanceAfter: 315000,
    referenceId: 'col-t1',
    notes: 'Collection from Ananta Garments',
    performedBy: 'Fahim Ahmed'
  },
  {
    id: 'ft-t5',
    organizationId: 'org-trading',
    transactionNumber: 'TRX-2605',
    date: '2026-02-20T16:15:00Z',
    accountId: 'acc-t-cash',
    accountName: 'Main Cash Counter & Drawer',
    type: 'RECEIPT',
    category: 'POS_SALE',
    amount: 15750,
    balanceAfter: 59250,
    referenceId: 'inv-t2',
    notes: 'POS Sale Cash Receipt',
    performedBy: 'Sonia Akter'
  },
  {
    id: 'ft-t6',
    organizationId: 'org-trading',
    transactionNumber: 'TRX-2606',
    date: '2026-02-22T11:25:00Z',
    accountId: 'acc-t-bkash',
    accountName: 'bKash Merchant Account',
    type: 'RECEIPT',
    category: 'CUSTOMER_COLLECTION',
    amount: 20000,
    balanceAfter: 40000,
    referenceId: 'col-t2',
    notes: 'Online sale payment via bKash',
    performedBy: 'Sonia Akter'
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    organizationId: 'org-trading',
    action: 'CREATE_ORGANIZATION',
    module: 'PLATFORM_ADMIN',
    details: 'Organization TexVogue Fabrics Ltd. onboarded successfully.',
    performedBy: 'Ahmad Tanvir',
    timestamp: '2026-01-15T09:00:00Z'
  },
  {
    id: 'log-02',
    organizationId: 'org-trading',
    action: 'POST_PURCHASE_RECEIPT',
    module: 'PURCHASING',
    details: 'Received 500 kg Jet Black Single Jersey into Dhaka Central Warehouse (PO TV-PO-2601).',
    performedBy: 'Khorshed Alam',
    timestamp: '2026-02-14T15:00:00Z'
  },
  {
    id: 'log-03',
    organizationId: 'org-trading',
    action: 'POST_POS_SALE',
    module: 'POS',
    details: 'Completed counter sale TV-POS-2602 for ৳15,750 (Cash). Inventory reduced.',
    performedBy: 'Sonia Akter',
    timestamp: '2026-02-20T16:15:00Z'
  },
  {
    id: 'log-04',
    organizationId: 'org-knitting',
    action: 'COMPLETE_PRODUCTION_JOB',
    module: 'PRODUCTION',
    details: 'Job AKM-KNIT-001 completed. 1000 kg yarn consumed, 850 kg fabric received at 85% yield.',
    performedBy: 'Rafiqul Islam',
    timestamp: '2026-02-14T17:00:00Z'
  }
];
