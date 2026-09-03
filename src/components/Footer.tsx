import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Shield, Truck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView, setCategory, setIsWishlistOpen } = useApp();

  return (
    <footer className="w-full bg-[#eeeeee] border-t border-[#e2e2e2] mt-20 select-none">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-[#dadada]">
          
          {/* Col 1: Brand & Updated Description */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0058be] text-white flex items-center justify-center font-['Montserrat'] font-bold text-base shadow-sm">
                PF
              </div>
              <span className="font-['Montserrat'] font-semibold text-2xl tracking-tight text-[#0058be]">
                PrintFlow
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#555f6f] leading-relaxed max-w-md">
              Create, customize, and deliver premium on-demand apparel and custom merchandise. Premium printing, zero minimum orders, and fast automated fulfillment worldwide.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-[#555f6f]">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#0058be]" /> Fast Global Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> 100% Quality Guaranteed
              </span>
            </div>
          </div>

          {/* Col 2: Catalog Categories */}
          <div className="space-y-3">
            <h4 className="font-['Montserrat'] font-bold text-sm text-[#1a1c1c]">Products</h4>
            <ul className="space-y-2 text-xs text-[#555f6f]">
              <li>
                <button
                  onClick={() => {
                    setCategory('Apparel');
                    setActiveView('products');
                  }}
                  className="hover:text-[#0058be] transition-colors cursor-pointer"
                >
                  Apparel Blanks
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCategory('Home Decor');
                    setActiveView('products');
                  }}
                  className="hover:text-[#0058be] transition-colors cursor-pointer"
                >
                  Home Decor
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCategory('Accessories');
                    setActiveView('products');
                  }}
                  className="hover:text-[#0058be] transition-colors cursor-pointer"
                >
                  Bags & Accessories
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCategory('Stationery');
                    setActiveView('products');
                  }}
                  className="hover:text-[#0058be] transition-colors cursor-pointer"
                >
                  Stationery & Prints
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links & Services */}
          <div className="space-y-3">
            <h4 className="font-['Montserrat'] font-bold text-sm text-[#1a1c1c]">Quick Links</h4>
            <ul className="space-y-2 text-xs text-[#555f6f]">
              <li>
                <button 
                  onClick={() => setActiveView('products')} 
                  className="hover:text-[#0058be] transition-colors cursor-pointer"
                >
                  Browse Catalog
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveView('design-tool')} 
                  className="hover:text-[#0058be] transition-colors cursor-pointer"
                >
                  Design Studio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveView('how-it-works')} 
                  className="hover:text-[#0058be] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsWishlistOpen(true)} 
                  className="hover:text-[#0058be] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Saved Wishlist
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#727785]">
          <p>© {new Date().getFullYear()} PrintFlow Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span className="hover:underline cursor-pointer">Print Quality Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
