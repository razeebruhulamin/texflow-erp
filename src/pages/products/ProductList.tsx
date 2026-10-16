import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Product, ProductType, UnitType, FabricConstruction } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  Boxes,
  Check,
  X,
  AlertCircle,
  Eye,
  Edit2
} from 'lucide-react';

export const ProductList: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form State for creating/editing product
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    category: 'Knit Finished Fabric',
    description: '',
    productType: 'FINISHED_GOODS',
    unit: 'kg',
    secondaryUnit: 'roll',
    unitConversionFactor: 25,
    defaultPurchasePrice: 400,
    defaultSellingPrice: 500,
    currentWeightedAvgCost: 400,
    reorderLevel: 100,
    active: true,
    specifications: {
      materialType: '100% Combed Cotton',
      yarnCount: '30s',
      countSystem: 'Ne',
      gsm: 160,
      fabricWidth: 72,
      widthUnit: 'inch',
      colorName: 'Royal Blue',
      colorHex: '#1e40af',
      fiberComposition: '100% Cotton',
      construction: 'Single Jersey',
      finishingType: 'Silicon Softener',
      qualityGrade: 'EXPORT_QUALITY'
    }
  });

  const products = useMemo(() => StorageRepository.getProducts(orgId), [orgId, dataVersion]);
  const stockBalances = useMemo(() => StorageRepository.getStockBalances(orgId), [orgId, dataVersion]);
  const warehouses = useMemo(() => StorageRepository.getWarehouses(orgId), [orgId, dataVersion]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.specifications.colorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.specifications.yarnCount || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'ALL' || p.productType === filterType;
      const matchesCat = filterCategory === 'ALL' || p.category === filterCategory;

      return matchesSearch && matchesType && matchesCat;
    });
  }, [products, searchTerm, filterType, filterCategory]);

  const currency = currentOrg?.currencySymbol || '৳';

  const handleOpenAdd = () => {
    setFormData({
      sku: `FAB-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'Knit Finished Fabric',
      description: '',
      productType: 'FINISHED_GOODS',
      unit: 'kg',
      secondaryUnit: 'roll',
      unitConversionFactor: 25,
      defaultPurchasePrice: 0,
      defaultSellingPrice: 0,
      currentWeightedAvgCost: 0,
      reorderLevel: 100,
      active: true,
      specifications: {
        materialType: '100% Cotton',
        yarnCount: '30s',
        countSystem: 'Ne',
        gsm: 160,
        fabricWidth: 72,
        widthUnit: 'inch',
        colorName: '',
        colorHex: '#3b82f6',
        fiberComposition: '100% Cotton',
        construction: 'Single Jersey',
        finishingType: '',
        qualityGrade: 'A_GRADE'
      }
    });
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      notify('Please fill in required fields (Name and SKU)', 'error');
      return;
    }

    const prodToSave: Product = {
      id: selectedProduct?.id || `prod-${Date.now()}`,
      organizationId: orgId,
      sku: formData.sku!,
      name: formData.name!,
      category: formData.category || 'General Fabric',
      description: formData.description || '',
      productType: formData.productType || 'FINISHED_GOODS',
      unit: formData.unit as UnitType || 'kg',
      secondaryUnit: formData.secondaryUnit as UnitType,
      unitConversionFactor: Number(formData.unitConversionFactor) || 1,
      defaultPurchasePrice: Number(formData.defaultPurchasePrice) || 0,
      defaultSellingPrice: Number(formData.defaultSellingPrice) || 0,
      currentWeightedAvgCost: Number(formData.currentWeightedAvgCost) || Number(formData.defaultPurchasePrice) || 0,
      reorderLevel: Number(formData.reorderLevel) || 50,
      specifications: formData.specifications || {},
      active: formData.active ?? true
    };

    StorageRepository.saveProduct(prodToSave);
    StorageRepository.logAction(
      orgId,
      selectedProduct ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
      'PRODUCTS',
      `Product ${prodToSave.name} (${prodToSave.sku}) saved.`,
      currentUser.name
    );

    refreshData();
    setIsModalOpen(false);
    notify(`Product "${prodToSave.name}" saved successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog & Textile Specs"
        subtitle="Manage yarn counts, GSM, fiber blends, fabric width, roll conversion rules, and stock balances."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'MANAGER', 'STOREKEEPER']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Textile Product</span>
            </button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by SKU, fabric, yarn, GSM, color..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Type:</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="RAW_MATERIAL">Raw Material (Yarn/Greige)</option>
              <option value="FINISHED_GOODS">Finished Goods (Knitted/Dyed)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Category:</span>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none font-medium"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Product / SKU</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Textile Specifications</th>
                <th className="px-4 py-3 text-right">Avg Cost / Selling</th>
                <th className="px-4 py-3 text-right">Stock On Hand</th>
                <th className="px-4 py-3 text-right">Stock Value</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const pBalances = stockBalances.filter(b => b.productId === p.id);
                  const totalQty = pBalances.reduce((sum, b) => sum + b.quantityOnHand, 0);
                  const reservedQty = pBalances.reduce((sum, b) => sum + b.quantityReserved, 0);
                  const stockValue = totalQty * (p.currentWeightedAvgCost || p.defaultPurchasePrice);
                  const isLow = totalQty <= p.reorderLevel;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {p.specifications.colorHex && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                              style={{ backgroundColor: p.specifications.colorHex }}
                              title={p.specifications.colorName || 'Color'}
                            />
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{p.sku}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.productType === 'RAW_MATERIAL'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {p.productType === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Goods'}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">{p.category}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-slate-600">
                          {p.specifications.yarnCount && (
                            <span className="font-medium mr-2">Yarn: {p.specifications.yarnCount}</span>
                          )}
                          {p.specifications.gsm && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold mr-1.5">
                              {p.specifications.gsm} GSM
                            </span>
                          )}
                          {p.specifications.fabricWidth && (
                            <span className="text-slate-500 mr-2">
                              {p.specifications.fabricWidth}" width
                            </span>
                          )}
                          {p.specifications.construction && (
                            <span className="text-teal-700 font-medium">
                              • {p.specifications.construction}
                            </span>
                          )}
                        </div>
                        {p.secondaryUnit && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Rule: 1 {p.secondaryUnit} = {p.unitConversionFactor} {p.unit}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-slate-900">
                          {currency} {p.defaultSellingPrice} / {p.unit}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cost: {currency} {p.currentWeightedAvgCost}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                          {totalQty.toLocaleString()} {p.unit}
                        </div>
                        {reservedQty > 0 && (
                          <div className="text-[10px] text-slate-400">
                            ({reservedQty} reserved)
                          </div>
                        )}
                        {isLow && (
                          <div className="text-[10px] text-amber-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {currency} {Math.round(stockValue).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={p.active ? 'ACTIVE' : 'SUSPENDED'} />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsDetailOpen(true);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                            title="View Specifications & History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission(['ORGANIZATION_ADMIN', 'MANAGER']) && (
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setFormData(p);
                                setIsModalOpen(true);
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      {isDetailOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
                  {selectedProduct.productType.replace(/_/g, ' ')}
                </span>
                <h3 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {selectedProduct.sku}</p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-1">Textile Material & Composition</span>
                <p className="font-semibold text-slate-800">
                  {selectedProduct.specifications.fiberComposition || 'N/A'} (
                  {selectedProduct.specifications.materialType})
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-1">Yarn Count & Construction</span>
                <p className="font-semibold text-slate-800">
                  {selectedProduct.specifications.yarnCount || 'N/A'} • {selectedProduct.specifications.construction || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-1">Fabric Weight & Width</span>
                <p className="font-semibold text-slate-800">
                  {selectedProduct.specifications.gsm ? `${selectedProduct.specifications.gsm} GSM` : 'N/A'} •{' '}
                  {selectedProduct.specifications.fabricWidth ? `${selectedProduct.specifications.fabricWidth}" Width` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-1">Color / Finishing Treatment</span>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  {selectedProduct.specifications.colorHex && (
                    <span
                      className="w-3 h-3 rounded-full border inline-block"
                      style={{ backgroundColor: selectedProduct.specifications.colorHex }}
                    />
                  )}
                  <span>
                    {selectedProduct.specifications.colorName || 'Natural'} •{' '}
                    {selectedProduct.specifications.finishingType || 'Standard'}
                  </span>
                </p>
              </div>
            </div>

            {/* Warehouse Wise Inventory Breakdown */}
            <h4 className="font-bold text-slate-900 text-xs uppercase mb-3">Warehouse Stock Breakdown</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">Warehouse</th>
                    <th className="p-2.5">Lot / Batch</th>
                    <th className="p-2.5 text-right">Available Qty</th>
                    <th className="p-2.5 text-right">Unit Cost</th>
                    <th className="p-2.5 text-right">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockBalances
                    .filter(b => b.productId === selectedProduct.id)
                    .map(sb => {
                      const wh = warehouses.find(w => w.id === sb.warehouseId);
                      return (
                        <tr key={sb.id}>
                          <td className="p-2.5 font-medium text-slate-900">{wh?.name || 'Warehouse'}</td>
                          <td className="p-2.5 text-slate-500 font-mono">{sb.batchLotNumber || 'LOT-MAIN'}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {sb.quantityOnHand} {selectedProduct.unit}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">
                            {currency} {sb.averageUnitCost}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-600">
                            {currency} {(sb.quantityOnHand * sb.averageUnitCost).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedProduct ? 'Edit Textile Product' : 'Add New Textile Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-teal-500"
                    placeholder="e.g. Single Jersey 100% Cotton 160 GSM"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-teal-500 font-mono"
                    placeholder="e.g. FAB-SJ-160-BLK"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Classification</label>
                  <select
                    value={formData.productType}
                    onChange={e => setFormData({ ...formData, productType: e.target.value as ProductType })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="FINISHED_GOODS">Finished Goods (Fabric)</option>
                    <option value="RAW_MATERIAL">Raw Material (Yarn/Greige)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    placeholder="e.g. Knit Finished Fabric"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Unit</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="meter">Meter (m)</option>
                    <option value="yard">Yard</option>
                    <option value="roll">Roll</option>
                    <option value="cone">Cone</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>

              {/* Textile Specific Fields */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Textile Specifications
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Yarn Count (e.g. 30s, 24s)</label>
                    <input
                      type="text"
                      value={formData.specifications?.yarnCount || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          specifications: { ...formData.specifications, yarnCount: e.target.value }
                        })
                      }
                      className="w-full p-2 border bg-white rounded-md"
                      placeholder="30s"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">GSM (Grams / Sq Meter)</label>
                    <input
                      type="number"
                      value={formData.specifications?.gsm || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          specifications: { ...formData.specifications, gsm: Number(e.target.value) }
                        })
                      }
                      className="w-full p-2 border bg-white rounded-md"
                      placeholder="160"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Fabric Width (Inches)</label>
                    <input
                      type="number"
                      value={formData.specifications?.fabricWidth || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          specifications: { ...formData.specifications, fabricWidth: Number(e.target.value) }
                        })
                      }
                      className="w-full p-2 border bg-white rounded-md"
                      placeholder="72"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Knit Construction</label>
                    <select
                      value={formData.specifications?.construction || 'Single Jersey'}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          specifications: {
                            ...formData.specifications,
                            construction: e.target.value as FabricConstruction
                          }
                        })
                      }
                      className="w-full p-2 border bg-white rounded-md"
                    >
                      <option value="Single Jersey">Single Jersey</option>
                      <option value="Rib 1x1">Rib 1x1</option>
                      <option value="Interlock">Interlock</option>
                      <option value="Fleece">Fleece</option>
                      <option value="Pique">Pique</option>
                      <option value="Twill">Twill</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Color Name</label>
                    <input
                      type="text"
                      value={formData.specifications?.colorName || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          specifications: { ...formData.specifications, colorName: e.target.value }
                        })
                      }
                      className="w-full p-2 border bg-white rounded-md"
                      placeholder="Navy Blue"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Color Shade Code / Hex</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.specifications?.colorHex || '#3b82f6'}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            specifications: { ...formData.specifications, colorHex: e.target.value }
                          })
                        }
                        className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.specifications?.colorHex || '#3b82f6'}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            specifications: { ...formData.specifications, colorHex: e.target.value }
                          })
                        }
                        className="flex-1 p-2 border bg-white rounded-md font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Reorder */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Purchase Cost ({currency})</label>
                  <input
                    type="number"
                    value={formData.defaultPurchasePrice || ''}
                    onChange={e => setFormData({ ...formData, defaultPurchasePrice: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Selling Price ({currency})</label>
                  <input
                    type="number"
                    value={formData.defaultSellingPrice || ''}
                    onChange={e => setFormData({ ...formData, defaultSellingPrice: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:outline-none font-bold text-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reorder Level Threshold</label>
                  <input
                    type="number"
                    value={formData.reorderLevel || ''}
                    onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
