import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Organization, SubscriptionPlan, BusinessType } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { MetricCard } from '../../components/common/MetricCard';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Plus,
  Power,
  Layers,
  ArrowRight,
  X,
  CheckCircle2,
  Globe
} from 'lucide-react';

export const PlatformAdmin: React.FC = () => {
  const { organizations, users, refreshData, notify, switchOrganization } = useApp();

  const [activeTab, setActiveTab] = useState<'ORGS' | 'PLANS'>('ORGS');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  const plans = useMemo(() => StorageRepository.getPlans(), []);

  // Form State for Onboarding
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('TRADING');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [planId, setPlanId] = useState('plan-pro');
  const [manufacturingEnabled, setManufacturingEnabled] = useState(true);
  const [processType, setProcessType] = useState<any>('knitting');

  // Stats
  const stats = useMemo(() => {
    const totalOrgs = organizations.length;
    const activeOrgs = organizations.filter(o => o.status === 'ACTIVE').length;
    const totalUsers = users.length;
    const estimatedMRR = organizations.reduce((sum, org) => {
      const plan = plans.find(p => p.id === org.planId);
      return sum + (plan?.monthlyFee || 0);
    }, 0);

    return { totalOrgs, activeOrgs, totalUsers, estimatedMRR };
  }, [organizations, users, plans]);

  const toggleOrgStatus = (org: Organization) => {
    const newStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updated = { ...org, status: newStatus as any };
    StorageRepository.saveOrganization(updated);
    StorageRepository.logAction(
      '',
      'TOGGLE_ORG_STATUS',
      'PLATFORM_ADMIN',
      `Organization ${org.name} status updated to ${newStatus}.`,
      'Platform Super Admin'
    );
    refreshData();
    notify(`Organization ${org.name} is now ${newStatus}.`, 'info');
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ownerName || !email) {
      notify('Please fill in required fields', 'error');
      return;
    }

    const orgId = `org-${Date.now().toString().slice(-4)}`;
    const newOrg: Organization = {
      id: orgId,
      name,
      businessType,
      ownerName,
      email,
      phone,
      address,
      logo: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=128&q=80',
      currency,
      currencySymbol: currency === 'BDT' ? '৳' : '$',
      timezone: 'Asia/Dhaka',
      status: 'ACTIVE',
      planId,
      createdAt: new Date().toISOString(),
      manufacturingEnabled,
      processType,
      absenceDeductionDivisor: 30,
      negativeStockAllowed: false,
      costingMethod: 'WEIGHTED_AVERAGE',
      taxVatRate: 5,
      invoicePrefix: `${name.slice(0, 3).toUpperCase()}-INV`,
      purchasePrefix: `${name.slice(0, 3).toUpperCase()}-PO`,
      jobPrefix: `${name.slice(0, 3).toUpperCase()}-JOB`
    };

    // Create default owner user
    const ownerUser = {
      id: `user-${Date.now()}`,
      organizationId: orgId,
      name: ownerName,
      email,
      role: 'ORGANIZATION_OWNER' as any,
      designation: 'Managing Director / Owner',
      phone,
      active: true
    };

    // Create default warehouse
    const defaultWh = {
      id: `wh-${Date.now()}`,
      organizationId: orgId,
      name: `${name} Main Facility`,
      code: 'WH-MAIN-01',
      location: address || 'Main Yard',
      isDefault: true,
      active: true,
      managerName: ownerName
    };

    newOrg.defaultWarehouseId = defaultWh.id;

    StorageRepository.saveOrganization(newOrg);
    StorageRepository.saveUser(ownerUser);
    StorageRepository.saveWarehouse(defaultWh);

    StorageRepository.logAction(
      orgId,
      'ONBOARD_ORGANIZATION',
      'PLATFORM_ADMIN',
      `New organization ${newOrg.name} onboarded with owner ${ownerName}.`,
      'Platform Super Admin'
    );

    refreshData();
    setIsOnboardingModalOpen(false);
    notify(`Organization "${newOrg.name}" provisioned and onboarded successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SaaS Platform Administration"
        subtitle="Manage registered tenant organizations, subscription plans, quotas, and multi-tenant resource limits."
        badge={
          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded border border-indigo-200">
            Platform Super Admin
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Organization</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Organizations"
          value={stats.totalOrgs}
          subValue={`${stats.activeOrgs} Active Subscriptions`}
          icon={Building2}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <MetricCard
          title="Total Provisioned Users"
          value={stats.totalUsers}
          subValue="Across all active tenants"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Estimated SaaS MRR"
          value={`৳ ${stats.estimatedMRR.toLocaleString()}`}
          subValue="Monthly subscription revenue"
          icon={CreditCard}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Tenant Isolation Status"
          value="Enforced (Org ID)"
          subValue="Multi-tenant client scoped"
          icon={ShieldCheck}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <button
          onClick={() => setActiveTab('ORGS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ORGS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Registered Organizations ({organizations.length})
        </button>
        <button
          onClick={() => setActiveTab('PLANS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'PLANS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Subscription Plan Tiers ({plans.length})
        </button>
      </div>

      {/* TAB 1: Registered Organizations */}
      {activeTab === 'ORGS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Organization Name</th>
                  <th className="p-3">Business Model</th>
                  <th className="p-3">Owner Contact</th>
                  <th className="p-3">Plan Tier</th>
                  <th className="p-3 text-center">Users</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Switch Workspace</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map(org => {
                  const plan = plans.find(p => p.id === org.planId);
                  const orgUsersCount = users.filter(u => u.organizationId === org.id).length;

                  return (
                    <tr key={org.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{org.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{org.id}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                          {org.businessType.toLowerCase().replace(/_/g, ' ')}
                        </span>
                        {org.manufacturingEnabled && (
                          <span className="text-[10px] text-teal-600 block mt-0.5 font-medium">
                            • Manufacturing enabled
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-slate-600">
                        <div className="font-medium text-slate-900">{org.ownerName}</div>
                        <div className="text-[10px] text-slate-400">{org.email}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-indigo-700">{plan?.name}</div>
                        <div className="text-[10px] text-slate-400">৳{plan?.monthlyFee}/mo</div>
                      </td>

                      <td className="p-3 text-center font-bold text-slate-800">
                        {orgUsersCount} / {plan?.maxUsers}
                      </td>

                      <td className="p-3 text-center">
                        <StatusBadge status={org.status} />
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => switchOrganization(org.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-semibold rounded text-[11px] border transition-colors inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleOrgStatus(org)}
                          className={`p-1.5 rounded transition-colors ${
                            org.status === 'ACTIVE'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={org.status === 'ACTIVE' ? 'Suspend Organization' : 'Activate Organization'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Subscription Plans */}
      {activeTab === 'PLANS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {p.code}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-indigo-600">৳ {p.monthlyFee.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">per month</div>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>

              <div className="space-y-2 text-xs border-t pt-3 text-slate-700">
                <div className="flex justify-between">
                  <span>Max Users Limit:</span>
                  <span className="font-bold text-slate-900">{p.maxUsers} Users</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Warehouses:</span>
                  <span className="font-bold text-slate-900">{p.maxWarehouses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manufacturing & BOM:</span>
                  <span className="font-bold text-slate-900">{p.hasManufacturing ? 'Included' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advanced P&L Analytics:</span>
                  <span className="font-bold text-slate-900">{p.hasAdvancedReports ? 'Included' : 'Standard'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding Wizard Modal */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleOnboardSubmit}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Onboard New Textile Business</h3>
              <button
                type="button"
                onClick={() => setIsOnboardingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Mill Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Padma Textile Mills Ltd."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Type</label>
                  <select
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value as BusinessType)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="TRADING">Fabric Trader / Wholesaler</option>
                    <option value="KNITTING">Knitting Factory</option>
                    <option value="DYEING">Dyeing & Finishing Mill</option>
                    <option value="COMPOSITE_MANUFACTURING">Composite Mill</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subscription Plan</label>
                  <select
                    value={planId}
                    onChange={e => setPlanId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none font-semibold text-indigo-700"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (৳{p.monthlyFee}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Managing Director / Owner *</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    placeholder="owner@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    placeholder="+880 1711..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  placeholder="Plot/Street, Industrial Area"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <input
                  type="checkbox"
                  id="onboardMfg"
                  checked={manufacturingEnabled}
                  onChange={e => setManufacturingEnabled(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="onboardMfg" className="font-semibold text-slate-800">
                  Provision Manufacturing & Production Recipes Engine
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsOnboardingModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Provision Organization
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
