import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { SalesInvoice, SalesChannel } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Globe,
  Search,
  Truck,
  PackageCheck,
  ShoppingBag,
  Phone,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';

export const OnlineOrders: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const invoices = useMemo(() => StorageRepository.getSalesInvoices(orgId), [orgId, dataVersion]);
  const currency = currentOrg?.currencySymbol || '৳';

  // Filter online orders (WEBSITE, SOCIAL_FACEBOOK, MARKETPLACE, PHONE_WHATSAPP)
  const onlineOrders = useMemo(() => {
    return invoices.filter(inv => {
      const isOnline = ['WEBSITE', 'SOCIAL_FACEBOOK', 'MARKETPLACE', 'PHONE_WHATSAPP'].includes(inv.salesChannel);
      if (!isOnline) return false;

      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.onlineDetails?.shippingAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesChannel = channelFilter === 'ALL' || inv.salesChannel === channelFilter;
      const matchesStatus = statusFilter === 'ALL' || inv.orderStatus === statusFilter;

      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [invoices, searchTerm, channelFilter, statusFilter]);

  const updateOrderStatus = (invoiceId: string, newStatus: any) => {
    const list = StorageRepository.getSalesInvoices(orgId);
    const target = list.find(i => i.id === invoiceId);
    if (target) {
      target.orderStatus = newStatus;
      StorageRepository.saveSalesInvoice(target);
      StorageRepository.logAction(
        orgId,
        'UPDATE_ONLINE_ORDER',
        'SALES',
        `Online order ${target.invoiceNumber} status updated to ${newStatus}.`,
        currentUser.name
      );
      refreshData();
      notify(`Order ${target.invoiceNumber} status updated to ${newStatus}.`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online & Social Commerce Orders"
        subtitle="Manage orders originating from your website, Facebook shop, WhatsApp, and courier logistics."
      />

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search order #, customer, or shipping address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Channel:</span>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none font-medium"
            >
              <option value="ALL">All Online Channels</option>
              <option value="WEBSITE">Website Store</option>
              <option value="SOCIAL_FACEBOOK">Facebook / Instagram</option>
              <option value="MARKETPLACE">Daraz / Marketplace</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Dispatch Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Confirmation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DISPATCHED">Dispatched with Courier</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Order / Reference</th>
                <th className="px-4 py-3">Platform / Channel</th>
                <th className="px-4 py-3">Customer & Delivery Address</th>
                <th className="px-4 py-3">Items Summary</th>
                <th className="px-4 py-3 text-right">Order Total</th>
                <th className="px-4 py-3 text-center">Payment</th>
                <th className="px-4 py-3 text-center">Fulfillment Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {onlineOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No online orders found matching current criteria.
                  </td>
                </tr>
              ) : (
                onlineOrders.map(order => {
                  const itemsSummary = order.items.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ');

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 font-mono">{order.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.date).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700">
                          <Globe className="w-3 h-3" />
                          <span>{order.onlineDetails?.platform || order.salesChannel.replace(/_/g, ' ')}</span>
                        </span>
                        {order.onlineDetails?.trackingNumber && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Tracking: {order.onlineDetails.trackingNumber}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {order.onlineDetails?.shippingAddress || 'Store Pickup'}
                        </div>
                        {order.onlineDetails?.customerPhone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{order.onlineDetails.customerPhone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="truncate max-w-[200px] text-slate-600" title={itemsSummary}>
                          {itemsSummary}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-900">{currency} {order.grandTotal.toLocaleString()}</div>
                        {order.deliveryCharge > 0 && (
                          <div className="text-[10px] text-slate-400">
                            incl. {currency}{order.deliveryCharge} ship fee
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={order.paymentStatus} />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={order.orderStatus} />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <select
                          value={order.orderStatus}
                          onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className="text-[11px] font-medium border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirm</option>
                          <option value="DISPATCHED">Dispatch (Courier)</option>
                          <option value="DELIVERED">Mark Delivered</option>
                          <option value="CANCELLED">Cancel Order</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
