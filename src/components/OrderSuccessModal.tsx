import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Package, Clock, Truck, ShieldCheck, ArrowRight, X } from 'lucide-react';

export const OrderSuccessModal: React.FC = () => {
  const { latestOrder, setLatestOrder, setIsDashboardOpen, setDashboardTab } = useApp();

  if (!latestOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e2e2e2] p-6 sm:p-8"
      >
        {/* Close Button */}
        <button
          onClick={() => setLatestOrder(null)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#eeeeee] hover:bg-[#e2e2e2] flex items-center justify-center text-[#1a1c1c] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h2 className="font-['Montserrat'] font-bold text-2xl text-[#1a1c1c] tracking-tight">
            Order Successfully Placed!
          </h2>
          <p className="text-xs text-[#555f6f] mt-1 max-w-sm">
            Your print-on-demand items have been dispatched to our automated fulfillment queue.
          </p>

          {/* Order Details Card */}
          <div className="w-full bg-[#f9f9f9] rounded-xl p-4 border border-[#eeeeee] my-5 text-left text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-[#eeeeee]">
              <span className="text-[#727785]">Order Reference:</span>
              <span className="font-mono font-bold text-sm text-[#0058be]">#{latestOrder.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#727785]">Tracking Number:</span>
              <span className="font-mono font-medium text-[#1a1c1c]">{latestOrder.trackingNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#727785]">Total Charged:</span>
              <span className="font-bold text-[#1a1c1c]">${latestOrder.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#727785]">Destination:</span>
              <span className="text-[#1a1c1c] truncate max-w-[200px]">
                {latestOrder.shippingAddress.city}, {latestOrder.shippingAddress.state}
              </span>
            </div>
          </div>

          {/* Real-time sync note */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] mb-5 w-full text-left">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span><strong>Socket.io Live Sync:</strong> You will receive real-time updates as your apparel moves through DTG printing and QA.</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setLatestOrder(null);
                setDashboardTab('orders');
                setIsDashboardOpen(true);
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#0058be] hover:bg-[#2170e4] font-semibold text-xs text-white shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Track in Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLatestOrder(null)}
              className="px-4 py-2.5 rounded-xl bg-[#eeeeee] hover:bg-[#e8e8e8] font-semibold text-xs text-[#1a1c1c] transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
