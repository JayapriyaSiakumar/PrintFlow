import React from 'react';
import { useApp } from '../context/AppContext';
import { Palette, Cpu, Truck, CheckCircle2, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';

export const HowItWorksView: React.FC = () => {
  const { setActiveView } = useApp();

  const steps = [
    {
      step: '01',
      title: 'Choose Premium Blank & Customize',
      desc: 'Select from 100% organic cotton tees, fleece-lined hoodies, French terry sweaters, and eco-friendly home goods. Use our Ultra HD live customizer to upload graphics, tweak typography, and preview prints.',
      icon: Palette,
      color: 'bg-blue-50 text-[#0058be] border-blue-200',
    },
    {
      step: '02',
      title: 'Automated RESTful Order Routing',
      desc: 'Every order is secured with JWT tokens and dispatched through high-speed RESTful API endpoints. No minimum order quantities and zero upfront inventory risk.',
      icon: Cpu,
      color: 'bg-purple-50 text-[#6b38d4] border-purple-200',
    },
    {
      step: '03',
      title: 'Precision Kornit DTG Printing & QA',
      desc: 'Our fulfillment hubs utilize 1200 DPI industrial CMYK+W digital direct-to-garment printers and OEKO-TEX certified water-based inks, followed by rigorous 3-point automated quality inspection.',
      icon: Zap,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      step: '04',
      title: 'Socket.io Live Sync & Global Delivery',
      desc: 'Receive real-time WebSocket notifications across your devices as your apparel progresses through printing, quality check, and carrier dispatch with door-to-door tracking.',
      icon: Truck,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 py-10">
      
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#d8e2ff] text-[#0058be] mb-3 inline-block">
          The PrintFlow Pipeline
        </span>
        <h1 className="font-['Montserrat'] font-bold text-4xl sm:text-5xl text-[#1a1c1c] tracking-tight">
          How On-Demand Fulfillment Works
        </h1>
        <p className="font-['Inter'] text-sm text-[#555f6f] mt-3 leading-relaxed">
          From the first stroke in our design studio to automated industrial DTG printing and real-time carrier tracking.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-[#e2e2e2] flex flex-col justify-between shadow-sm hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono font-bold text-2xl text-[#0058be] opacity-40">
                    {s.step}
                  </span>
                  <div className={`p-3 rounded-xl border ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c] mb-2">
                  {s.title}
                </h3>
                <p className="font-['Inter'] text-xs text-[#555f6f] leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#f3f3f4] flex items-center gap-1.5 text-[11px] font-semibold text-[#0058be]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Automated Workflow</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Production Specs banner */}
      <div className="bg-[#eeeeee] rounded-2xl p-8 sm:p-10 border border-[#e2e2e2] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="font-['Montserrat'] font-bold text-2xl text-[#1a1c1c]">
            Ready to craft your custom apparel line?
          </h2>
          <p className="text-xs text-[#555f6f] max-w-xl">
            Start designing now with zero minimum orders, or integrate your eCommerce shop via our RESTful developer API.
          </p>
        </div>

        <button
          onClick={() => setActiveView('design-tool')}
          className="px-6 py-3 rounded-xl bg-[#0058be] hover:bg-[#2170e4] text-white font-semibold text-xs shadow-md shadow-[#0058be]/20 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
        >
          <span>Launch Design Tool</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
