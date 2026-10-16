import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { Product, SalesInvoice, SalesItem, PaymentMethod } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  Pause,
  Play,
  RotateCcw,
  Boxes,
  User,
  X
} from 'lucide-react';

export const PointOfSale: React.FC = () => {
  const { currentOrg, currentUser, dataVersion, refreshData, notify } = useApp();
  const orgId = currentOrg?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<{ product: Product; quantity: number; discount: number }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('WALK_IN');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [heldCarts, setHeldCarts] = useState<{ id: string; name: string; items: any[] }[]>([]);
  const [lastInvoice, setLastInvoice] = useState<SalesInvoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const products = useMemo(() => StorageRepository.getProducts(orgId), [orgId, dataVersion]);
  const stockBalances = useMemo(() => StorageRepository.getStockBalances(orgId), [orgId, dataVersion]);
  const warehouses = useMemo(() => StorageRepository.getWarehouses(orgId), [orgId, dataVersion]);
  const customers = useMemo(() => StorageRepository.getCustomers(orgId), [orgId, dataVersion]);
  const accounts = useMemo(() => StorageRepository.getCashBankAccounts(orgId), [orgId, dataVersion]);

  // Use primary warehouse
  const activeWarehouse = warehouses[0] || { id: 'wh-main', name: 'Main Depot' };
  const currency = currentOrg?.currencySymbol || '৳';

  // Get available stock for a product in the active warehouse
  const getProductStock = (productId: string) => {
    const bal = stockBalances.find(b => b.productId === productId && b.warehouseId === activeWarehouse.id);
    return bal ? bal.quantityOnHand - bal.quantityReserved : 0;
  };

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.specifications.colorName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.product.defaultSellingPrice - item.discount, 0);
  }, [cart]);

  const tax = useMemo(() => {
    return Math.round(subtotal * ((currentOrg?.taxVatRate || 5) / 100));
  }, [subtotal, currentOrg]);

  const grandTotal = Math.max(0, subtotal - invoiceDiscount + tax);
  const changeDue = Math.max(0, cashReceived - grandTotal);

  // Cart operations
  const addToCart = (product: Product) => {
    const available = getProductStock(product.id);
    const existing = cart.find(c => c.product.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (!currentOrg?.negativeStockAllowed && currentQtyInCart + 1 > available) {
      notify(`Insufficient stock for ${product.name}! Available: ${available} ${product.unit}`, 'error');
      return;
    }

    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const available = getProductStock(productId);
    if (!currentOrg?.negativeStockAllowed && newQty > available) {
      notify(`Cannot exceed available stock of ${available} ${product.unit}`, 'error');
      return;
    }

    setCart(cart.map(c => c.product.id === productId ? { ...c, quantity: newQty } : c));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived(0);
    setInvoiceDiscount(0);
  };

  const holdCart = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `hold-${Date.now()}`,
      name: `Held Order #${heldCarts.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      items: cart
    };
    setHeldCarts([...heldCarts, newHold]);
    clearCart();
    notify('Cart held in memory. You can resume it anytime.', 'info');
  };

  const resumeCart = (heldId: string) => {
    const target = heldCarts.find(h => h.id === heldId);
    if (target) {
      setCart(target.items);
      setHeldCarts(heldCarts.filter(h => h.id !== heldId));
      notify(`Resumed ${target.name}`, 'info');
    }
  };

  // Complete Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      notify('Cart is empty. Add fabric items to checkout.', 'error');
      return;
    }

    if (paymentMethod === 'CASH' && cashReceived < grandTotal) {
      notify(`Received cash (${currency} ${cashReceived}) is less than grand total (${currency} ${grandTotal})!`, 'error');
      return;
    }

    // Determine account
    let targetAccount = accounts.find(a => a.accountType === (paymentMethod === 'CASH' ? 'CASH' : paymentMethod.startsWith('MFS') ? 'MFS' : 'BANK'));
    if (!targetAccount) targetAccount = accounts[0];

    const customer = customers.find(c => c.id === selectedCustomerId);
    const invoiceNumber = `POS-${Date.now().toString().slice(-6)}`;

    const salesItems: SalesItem[] = cart.map(c => ({
      productId: c.product.id,
      productName: c.product.name,
      specSummary: `${c.product.specifications.yarnCount || ''} ${c.product.specifications.gsm || ''} GSM`,
      color: c.product.specifications.colorName,
      unit: c.product.unit,
      quantity: c.quantity,
      unitPrice: c.product.defaultSellingPrice,
      unitCost: c.product.currentWeightedAvgCost || c.product.defaultPurchasePrice,
      discount: c.discount,
      total: c.quantity * c.product.defaultSellingPrice - c.discount
    }));

    const isCredit = paymentMethod === 'CREDIT';
    const paidAmount = isCredit ? 0 : grandTotal;
    const dueAmount = isCredit ? grandTotal : 0;

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      organizationId: orgId,
      invoiceNumber,
      salesChannel: 'POS',
      customerId: selectedCustomerId,
      customerName: customer?.name || 'Walk-In Retail Customer',
      warehouseId: activeWarehouse.id,
      date: new Date().toISOString(),
      items: salesItems,
      subtotal,
      discount: invoiceDiscount,
      tax,
      deliveryCharge: 0,
      grandTotal,
      totalCostOfGoodsSold: 0, // calculated in storage engine
      paidAmount,
      dueAmount,
      paymentMethod,
      paymentAccountId: isCredit ? undefined : targetAccount?.id,
      paymentStatus: isCredit ? 'UNPAID' : 'PAID',
      orderStatus: 'DELIVERED',
      salesperson: currentUser.name,
      notes: 'Counter POS Instant Sale'
    };

    const res = StorageRepository.postSalesInvoice(newInvoice, currentUser);

    if (res.success) {
      notify(`Sale completed! Invoice #${invoiceNumber} recorded.`, 'success');
      setLastInvoice(res.invoice || newInvoice);
      setIsReceiptOpen(true);
      clearCart();
      refreshData();
    } else {
      notify(res.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="In-Store Point of Sale (POS)"
        subtitle={`Fast counter billing from ${activeWarehouse.name}. Immediate stock deduction and cash drawer integration.`}
        actions={
          heldCarts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                <Pause className="w-3.5 h-3.5" />
                <span>Held Carts ({heldCarts.length}):</span>
              </span>
              {heldCarts.map(h => (
                <button
                  key={h.id}
                  onClick={() => resumeCart(h.id)}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs font-semibold hover:bg-amber-100 flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  <span>{h.name}</span>
                </button>
              ))}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Catalog Grid (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Pills */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Scan barcode, SKU, or search fabric name / color..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-full font-medium shrink-0 transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full font-medium shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map(prod => {
              const stock = getProductStock(prod.id);
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between transition-all select-none ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed border-slate-200'
                      : 'hover:border-teal-500 hover:shadow-md cursor-pointer border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                        {prod.sku}
                      </span>
                      {prod.specifications.colorHex && (
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: prod.specifications.colorHex }}
                          title={prod.specifications.colorName}
                        />
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight">
                      {prod.name}
                    </h4>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {prod.specifications.gsm ? `${prod.specifications.gsm} GSM • ` : ''}
                      {prod.specifications.construction || prod.unit}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-teal-700">
                        {currency} {prod.defaultSellingPrice}
                      </div>
                      <div className="text-[10px] text-slate-400">per {prod.unit}</div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-600'
                          : stock <= prod.reorderLevel
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {stock} {prod.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Shopping Cart & Checkout Panel (5 columns) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[750px]">
          <div>
            {/* Customer selector & Hold action */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <User className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 p-1.5 rounded border border-slate-200 focus:outline-none"
                >
                  <option value="WALK_IN">Walk-In Counter Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({currency} {c.currentBalance.toLocaleString()} Due)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={holdCart}
                  disabled={cart.length === 0}
                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded border border-amber-200 disabled:opacity-40"
                  title="Hold Cart"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded border border-rose-200 disabled:opacity-40"
                  title="Clear Cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="my-3 overflow-y-auto max-h-[340px] space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Cart is empty. Click on fabrics on the left to add items.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <div className="flex-1 mr-2">
                      <div className="font-bold text-slate-900 truncate max-w-[160px]">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {currency} {item.product.defaultSellingPrice} / {item.product.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-white border flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3 text-slate-600" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateQuantity(item.product.id, Number(e.target.value))}
                        className="w-12 text-center p-0.5 rounded border bg-white font-bold text-xs"
                      />
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-white border flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3 text-slate-600" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-bold text-slate-900 ml-2">
                      {currency} {(item.quantity * item.product.defaultSellingPrice).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Controls */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            {/* Subtotal, Discount & Tax */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Invoice Discount:</span>
                <div className="flex items-center gap-1">
                  <span>- {currency}</span>
                  <input
                    type="number"
                    value={invoiceDiscount}
                    onChange={e => setInvoiceDiscount(Number(e.target.value))}
                    className="w-16 p-0.5 border rounded text-right font-semibold"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <span>Tax / VAT ({currentOrg?.taxVatRate || 5}%):</span>
                <span>{currency} {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-teal-700">{currency} {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { method: 'CASH', label: 'Cash', icon: Banknote },
                { method: 'BANK_TRANSFER', label: 'Card/Bank', icon: CreditCard },
                { method: 'MFS_BKASH', label: 'bKash', icon: Smartphone },
                { method: 'CREDIT', label: 'Credit (Due)', icon: Boxes }
              ].map(pm => {
                const isSelected = paymentMethod === pm.method;
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.method}
                    type="button"
                    onClick={() => setPaymentMethod(pm.method as PaymentMethod)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-[11px] block">{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Tendered & Change */}
            {paymentMethod === 'CASH' && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Cash Tendered ({currency}):</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(Number(e.target.value))}
                    className="w-28 p-1 border rounded bg-white font-bold text-slate-900"
                    placeholder="e.g. 5000"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Change Return:</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {currency} {changeDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Sale & Issue Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {isReceiptOpen && lastInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h3 className="text-base font-bold text-slate-900">{currentOrg?.name}</h3>
              <p className="text-[11px] text-slate-500">{currentOrg?.address}</p>
              <p className="text-[11px] text-slate-500">Phone: {currentOrg?.phone}</p>
              <div className="mt-2 text-xs font-mono font-bold text-slate-800">
                Receipt #{lastInvoice.invoiceNumber}
              </div>
              <div className="text-[10px] text-slate-400">
                {new Date(lastInvoice.date).toLocaleString()}
              </div>
            </div>

            <div className="py-4 border-b border-dashed border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-600 text-[11px]">
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>
              {lastInvoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-800">
                  <span className="truncate max-w-[120px]">{item.productName}</span>
                  <span className="text-slate-500">{item.quantity} {item.unit} @ {currency}{item.unitPrice}</span>
                  <span className="font-semibold">{currency}{item.total.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{currency} {lastInvoice.subtotal.toLocaleString()}</span>
              </div>
              {lastInvoice.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span>- {currency} {lastInvoice.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax:</span>
                <span>{currency} {lastInvoice.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>Total Paid:</span>
                <span>{currency} {lastInvoice.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Payment Method:</span>
                <span>{lastInvoice.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-4">
              Thank you for choosing {currentOrg?.name}! Goods once sold can be exchanged within 7 days with this invoice.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
