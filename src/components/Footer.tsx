import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Shield, Cpu, RefreshCw } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView, setCategory } = useApp();

  return (
    <footer className="w-full bg-[#eeeeee] border-t border-[#e2e2e2] mt-20 select-none">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-[#dadada]">
          
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0058be] text-white flex items-center justify-center font-['Montserrat'] font-bold text-base shadow-sm">
                PF
              </div>
              <span className="font-['Montserrat'] font-semibold text-2xl tracking-tight text-[#0058be]">
                PrintFlow
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#555f6f] leading-relaxed max-w-sm">
              The modern on-demand apparel and merchandise platform built on the MERN stack with RESTful APIs, JWT role authentication, and real-time Socket.io updates.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-mono text-[#555f6f]">Fulfillment Nodes: US-West, US-East, EU-Central</span>
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
                  className="hover:text-[#0058be] transition-colors"
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
                  className="hover:text-[#0058be] transition-colors"
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
                  className="hover:text-[#0058be] transition-colors"
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
                  className="hover:text-[#0058be] transition-colors"
                >
                  Stationery & Prints
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Technology */}
          <div className="space-y-3">
            <h4 className="font-['Montserrat'] font-bold text-sm text-[#1a1c1c]">MERN Stack</h4>
            <ul className="space-y-2 text-xs text-[#555f6f]">
              <li>Express & Node REST API</li>
              <li>JWT Authentication Bearer</li>
              <li>Socket.io Real-Time Stream</li>
              <li>Tailwind CSS Design Tokens</li>
              <li>Kornit DTG Print Technology</li>
            </ul>
          </div>

          {/* Col 4: Platform & Support */}
          <div className="space-y-3">
            <h4 className="font-['Montserrat'] font-bold text-sm text-[#1a1c1c]">Resources</h4>
            <ul className="space-y-2 text-xs text-[#555f6f]">
              <li>
                <button onClick={() => setActiveView('how-it-works')} className="hover:text-[#0058be]">
                  How it Works
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('pricing')} className="hover:text-[#0058be]">
                  Pricing & Bulk Rates
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('design-tool')} className="hover:text-[#0058be]">
                  Interactive Studio
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('unit-tests')} className="hover:text-[#0058be]">
                  Unit Test Suite
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
