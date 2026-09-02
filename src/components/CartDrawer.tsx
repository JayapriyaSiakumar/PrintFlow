import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles, Tag } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    createOrder,
    user,
    openAuthModal,
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Shipping details state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [street, setStreet] = useState('742 Evergreen Terrace');
  const [city, setCity] = useState('Portland');
  const [state, setState] = useState('OR');
  const [zip, setZip] = useState('97201');

  if (!isCartOpen) return null;

  const shippingFee = cartSubtotal >= 75 || (couponApplied && couponCode.toUpperCase() === 'SPRINGPRINT') ? 0 : 5.99;
  const finalTotal = Math.max(0, cartSubtotal + shippingFee - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'SPRINGPRINT') {
      setCouponApplied(true);
      setDiscountAmount(0);
    } else if (code === 'CREATOR20') {
      setCouponApplied(true);
      setDiscountAmount(cartSubtotal * 0.2);
    } else {
      alert('Invalid coupon code. Try SPRINGPRINT or CREATOR20');
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOrder(true);
    try {
      await createOrder({
        street,
        city,
        state,
        zip,
        country: 'United States',
        name,
        email,
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }

      setIsCheckingOut(false);
    } catch (err: any) {
      alert(err.message || 'Error processing order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 flex justify-end">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#e2e2e2] animate-in slide-in-from-right duration-250"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#eeeeee] flex items-center justify-between bg-[#f9f9f9]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0058be]" />
            <h2 className="font-['Montserrat'] font-bold text-lg text-[#1a1c1c]">
              {isCheckingOut ? 'Express Checkout' : `Shopping Cart (${cart.length})`}
            </h2>
          </div>
          <button
            onClick={() => {
              if (isCheckingOut) setIsCheckingOut(false);
              else setIsCartOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-[#eeeeee] hover:bg-[#e2e2e2] flex items-center justify-center text-[#1a1c1c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        {!isCheckingOut ? (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#eeeeee]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#555f6f]">
                  <ShoppingBag className="w-12 h-12 text-[#c2c6d6] mb-3 stroke-1" />
                  <p className="font-semibold text-sm text-[#1a1c1c]">Your cart is empty</p>
                  <p className="text-xs text-[#727785] mt-1 max-w-xs">
                    Explore our print-on-demand blanks or launch the Design Tool to start customizing.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-4 flex gap-3.5 items-start">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-20 rounded-lg object-contain bg-[#eeeeee] mix-blend-multiply flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-xs text-[#1a1c1c] truncate">{item.product.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#727785] hover:text-[#ba1a1a] p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#555f6f]">
                        <span>Size: <strong className="text-[#1a1c1c]">{item.size}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          Color:
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
                            style={{ backgroundColor: item.color.hex }}
                          />
                        </span>
                      </div>

                      {item.customDesign?.text && (
                        <div className="mt-1.5 px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[10px] text-[#0058be] font-medium truncate">
                          🎨 Custom: "{item.customDesign.text}" ({item.customDesign.placement})
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center border border-[#c2c6d6] rounded-md overflow-hidden bg-white">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs font-bold hover:bg-[#f3f3f4]"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs font-bold hover:bg-[#f3f3f4]"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-xs text-[#1a1c1c]">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-[#eeeeee] bg-[#f9f9f9] flex flex-col gap-3">
                {/* Promo Code Input */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#727785] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. SPRINGPRINT)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-white border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-1 focus:ring-[#0058be] uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#eeeeee] hover:bg-[#e2e2e2] rounded-lg text-xs font-semibold text-[#1a1c1c]"
                  >
                    Apply
                  </button>
                </form>

                {couponApplied && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Promo active: {couponCode.toUpperCase()}
                  </p>
                )}

                {/* Totals Breakdown */}
                <div className="space-y-1 text-xs text-[#555f6f] pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-[#1a1c1c]">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Shipping:</span>
                    <span>{shippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `$${shippingFee.toFixed(2)}`}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#e2e2e2] pt-2 flex justify-between items-baseline font-bold text-sm text-[#1a1c1c]">
                    <span>Total Amount:</span>
                    <span className="font-['Montserrat'] text-base text-[#0058be]">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full py-3 rounded-xl bg-[#0058be] hover:bg-[#2170e4] font-semibold text-xs text-white shadow-md shadow-[#0058be]/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Checkout Step Form */
          <form onSubmit={handleCompleteOrder} className="flex-1 flex flex-col justify-between overflow-y-auto p-5">
            <div className="flex flex-col gap-3.5">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-[#0058be]">
                ✨ <strong>REST & Socket Integration</strong>: Submitting will broadcast real-time order tracking events via Socket.io across all active sessions.
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Shipping Address</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#1a1c1c] block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1a1c1c] block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Zip Code</label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Order summary recap */}
              <div className="p-3 bg-[#f9f9f9] rounded-xl border border-[#eeeeee] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{cart.length} item(s)</span>
                </div>
                <div className="flex justify-between font-bold text-[#0058be]">
                  <span>Total to Pay:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#eeeeee] flex flex-col gap-2">
              <button
                type="submit"
                disabled={submittingOrder}
                className="w-full py-3 rounded-xl bg-[#0058be] hover:bg-[#2170e4] font-semibold text-xs text-white shadow-md shadow-[#0058be]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingOrder ? 'Routing to Print Hub...' : `Pay & Submit Order ($${finalTotal.toFixed(2)})`}
              </button>
              <button
                type="button"
                onClick={() => setIsCheckingOut(false)}
                className="text-xs text-[#555f6f] hover:underline text-center py-1"
              >
                Back to Cart
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
