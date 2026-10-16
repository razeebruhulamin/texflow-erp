import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Warehouse } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Edit2,
  Check,
  X,
  Phone,
  User,
  MapPin,
  Boxes
} from 'lucide-react';

export const WarehouseList: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify, hasPermission } = useApp();
  const orgId = currentOrg?.id || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);

  const warehouses = useMemo(() => StorageRepository.getWarehouses(orgId), [orgId, dataVersion]);
  const stockBalances = useMemo(() => StorageRepository.getStockBalances(orgId), [orgId, dataVersion]);

  const [formData, setFormData] = useState<Partial<Warehouse>>({
    name: '',
    code: '',
    location: '',
    isDefault: false,
    active: true,
    managerName: '',
    contactPhone: ''
  });

  const handleOpenAdd = () => {
    setEditingWh(null);
    setFormData({
      name: '',
      code: `WH-${Date.now().toString().slice(-3)}`,
      location: '',
      isDefault: false,
      active: true,
      managerName: currentUser.name,
      contactPhone: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      notify('Please enter warehouse name and code', 'error');
      return;
    }

    const newWh: Warehouse = {
      id: editingWh?.id || `wh-${Date.now()}`,
      organizationId: orgId,
      name: formData.name!,
      code: formData.code!,
      location: formData.location || '',
      isDefault: formData.isDefault ?? false,
      active: formData.active ?? true,
      managerName: formData.managerName || '',
      contactPhone: formData.contactPhone || ''
    };

    StorageRepository.saveWarehouse(newWh);
    StorageRepository.logAction(
      orgId,
      editingWh ? 'UPDATE_WAREHOUSE' : 'CREATE_WAREHOUSE',
      'WAREHOUSE',
      `Warehouse ${newWh.name} (${newWh.code}) saved.`,
      currentUser.name
    );

    refreshData();
    setIsModalOpen(false);
    notify(`Warehouse ${newWh.name} saved successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses & Depots"
        subtitle="Manage storage sheds, yarn stores, and fabric retail depot locations across the organization."
        actions={
          hasPermission(['ORGANIZATION_ADMIN', 'STOREKEEPER']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Warehouse</span>
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map(wh => {
          const whBalances = stockBalances.filter(b => b.warehouseId === wh.id);
          const totalStockQty = whBalances.reduce((sum, b) => sum + b.quantityOnHand, 0);
          const totalValuation = whBalances.reduce((sum, b) => sum + b.quantityOnHand * b.averageUnitCost, 0);

          return (
            <div
              key={wh.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                    <WarehouseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{wh.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-400">{wh.code}</span>
                      {wh.isDefault && (
                        <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <StatusBadge status={wh.active ? 'ACTIVE' : 'SUSPENDED'} />
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t pt-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{wh.location || 'Location not specified'}</span>
                </div>
                {wh.managerName && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>In-charge: <strong>{wh.managerName}</strong></span>
                  </div>
                )}
                {wh.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{wh.contactPhone}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Stock Balance</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {totalStockQty.toLocaleString()} units
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Valuation</span>
                  <span className="font-bold text-teal-700 text-sm">
                    {currentOrg?.currencySymbol} {Math.round(totalValuation).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingWh ? 'Edit Warehouse' : 'Add New Warehouse'}
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Dhaka Central Fabric Depot"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warehouse Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none font-mono"
                  placeholder="WH-DAC-01"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Location Address</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="Plot 12, Industrial Area, Tongi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floor In-charge Name</label>
                  <input
                    type="text"
                    value={formData.managerName || ''}
                    onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone || ''}
                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <label htmlFor="isDefault" className="font-semibold text-slate-700">
                  Set as Organization Default Warehouse
                </label>
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
                Save Warehouse
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
