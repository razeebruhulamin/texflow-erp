import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { PageHeader } from '../../components/common/PageHeader';
import { Settings, Save, CheckCircle2, ShieldCheck, DollarSign, Clock, Building2 } from 'lucide-react';

export const OrganizationSettings: React.FC = () => {
  const { currentOrg, currentUser, refreshData, notify } = useApp();

  const [name, setName] = useState(currentOrg?.name || '');
  const [phone, setPhone] = useState(currentOrg?.phone || '');
  const [email, setEmail] = useState(currentOrg?.email || '');
  const [address, setAddress] = useState(currentOrg?.address || '');
  const [currency, setCurrency] = useState(currentOrg?.currency || 'BDT');
  const [currencySymbol, setCurrencySymbol] = useState(currentOrg?.currencySymbol || '৳');
  const [timezone, setTimezone] = useState(currentOrg?.timezone || 'Asia/Dhaka');
  const [absenceDivisor, setAbsenceDivisor] = useState(currentOrg?.absenceDeductionDivisor || 30);
  const [negativeStock, setNegativeStock] = useState(currentOrg?.negativeStockAllowed || false);
  const [manufacturingEnabled, setManufacturingEnabled] = useState(currentOrg?.manufacturingEnabled || false);
  const [taxRate, setTaxRate] = useState(currentOrg?.taxVatRate || 5);
  const [invoicePrefix, setInvoicePrefix] = useState(currentOrg?.invoicePrefix || 'INV');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    const updatedOrg = {
      ...currentOrg,
      name,
      phone,
      email,
      address,
      currency,
      currencySymbol,
      timezone,
      absenceDeductionDivisor: Number(absenceDivisor) || 30,
      negativeStockAllowed: negativeStock,
      manufacturingEnabled,
      taxVatRate: Number(taxRate) || 0,
      invoicePrefix
    };

    StorageRepository.saveOrganization(updatedOrg);
    StorageRepository.logAction(
      currentOrg.id,
      'UPDATE_SETTINGS',
      'SETTINGS',
      `Organization settings updated by ${currentUser.name}.`,
      currentUser.name
    );

    refreshData();
    notify('Organization settings saved successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Organization Business Settings"
        subtitle="Configure company profile, invoices branding, currency, timezone, payroll rules, and manufacturing capabilities."
      />

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Business Profile & Invoicing Details</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Mill Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Business Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Factory / Office Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Operational & Financial Rules */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-teal-600" />
            <span>Operational & Policy Settings</span>
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Code & Symbol</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-20 p-2 border rounded-lg focus:outline-none font-bold"
                />
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-16 p-2 border rounded-lg focus:outline-none font-bold text-center"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">VAT / Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full p-2 border rounded-lg focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Absence Deduction Daily Divisor (Days) *
              </label>
              <select
                value={absenceDivisor}
                onChange={e => setAbsenceDivisor(Number(e.target.value))}
                className="w-full p-2 border rounded-lg focus:outline-none font-bold text-slate-900"
              >
                <option value={30}>30 Days (Standard Calendar Month: Basic ÷ 30)</option>
                <option value={26}>26 Days (Payable Working Days: Basic ÷ 26)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Controls the daily rate deduction when absent days are manually entered in payroll.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={e => setInvoicePrefix(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mfgToggle"
                checked={manufacturingEnabled}
                onChange={e => setManufacturingEnabled(e.target.checked)}
                className="rounded text-teal-600"
              />
              <label htmlFor="mfgToggle" className="font-semibold text-slate-800">
                Enable Textile Manufacturing & Production Modules (Knitting/Dyeing recipes & jobs)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="negStockToggle"
                checked={negativeStock}
                onChange={e => setNegativeStock(e.target.checked)}
                className="rounded text-teal-600"
              />
              <label htmlFor="negStockToggle" className="font-semibold text-slate-800">
                Allow Negative Stock / Backorders in Sales & POS
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
