import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const PricingView: React.FC = () => {
  const { setActiveView, openAuthModal, user } = useApp();
  const [estimatedMonthlyOrders, setEstimatedMonthlyOrders] = useState(50);

  const tiers = [
    {
      name: 'Creator Free',
      price: '$0',
      period: 'Forever free',
      description: 'Ideal for independent artists, creators, and individuals looking to launch custom merchandise.',
      features: [
        'No monthly platform fee',
        'Standard blank catalog access',
        'Interactive 2D/3D Design Studio',
        'Socket.io real-time order tracking',
        'Direct-to-garment DTG printing',
        'RESTful API access (100 req/min)',
      ],
      cta: 'Get Started Free',
      popular: false,
      tierAction: () => {
        if (!user) openAuthModal('register');
        else setActiveView('products');
      },
    },
    {
      name: 'Brand Growth',
      price: '$29',
      period: 'per month',
      description: 'Built for scaling fashion brands, creator collectives, and high-volume merchandise stores.',
      features: [
        'Up to 20% off all blank garment catalog items',
        'Custom inside neck label printing',
        'Branded packing slips & customized stickers',
        'Priority high-speed fulfillment queue (24-48 hr dispatch)',
        'Dedicated account manager & live support',
        'Unlimited REST API webhooks',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
      tierAction: () => {
        if (!user) openAuthModal('register');
        else alert('Brand Growth Trial activated for your account!');
      },
    },
    {
      name: 'Enterprise / Label',
      price: '$199',
      period: 'per month',
      description: 'For global apparel brands, retail conglomerates, and influencer networks requiring custom logistics.',
      features: [
        'Maximum volume discounts (up to 35% off blanks)',
        'Custom woven tags & custom poly-mailers',
        'Global multi-hub distributed routing',
        'Dedicated 99.99% SLA & custom warehouse integrations',
        'Dedicated color matching & bespoke garment sourcing',
        'Enterprise Single Sign-On (SSO)',
      ],
      cta: 'Contact Enterprise Sales',
      popular: false,
      tierAction: () => {
        alert('Thank you for your interest! Our Enterprise team will contact you.');
      },
    },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 py-10">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#d8e2ff] text-[#0058be] mb-3 inline-block">
          Transparent Creator Pricing
        </span>
        <h1 className="font-['Montserrat'] font-bold text-4xl sm:text-5xl text-[#1a1c1c] tracking-tight">
          Simple, Predictable Plans
        </h1>
        <p className="font-['Inter'] text-sm text-[#555f6f] mt-3 leading-relaxed">
          Zero upfront inventory fees. You only pay for blanks when an order is created, keeping your cash flow completely free.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-stretch">
        {tiers.map((t, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-7 flex flex-col justify-between border transition-all ${
              t.popular
                ? 'bg-white border-[#0058be] shadow-xl ring-2 ring-[#0058be]/20 relative'
                : 'bg-white border-[#e2e2e2] shadow-sm hover:border-[#c2c6d6]'
            }`}
          >
            {t.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0058be] text-white shadow-xs">
                Most Popular for Creators
              </span>
            )}

            <div>
              <h3 className="font-['Montserrat'] font-bold text-lg text-[#1a1c1c]">{t.name}</h3>
              <p className="text-xs text-[#555f6f] mt-1 min-h-[36px]">{t.description}</p>

              <div className="my-6 flex items-baseline gap-1.5">
                <span className="font-['Montserrat'] font-bold text-4xl text-[#1a1c1c]">{t.price}</span>
                <span className="text-xs text-[#727785]">{t.period}</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#eeeeee]">
                <p className="text-[11px] font-bold text-[#1a1c1c] uppercase tracking-wider">Included Features:</p>
                {t.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#424754]">
                    <Check className="w-4 h-4 text-[#0058be] flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={t.tierAction}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-colors mt-8 cursor-pointer ${
                t.popular
                  ? 'bg-[#0058be] hover:bg-[#2170e4] text-white shadow-sm shadow-[#0058be]/20'
                  : 'bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c]'
              }`}
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Volume Discount Calculator */}
      <div className="bg-[#eeeeee] rounded-2xl p-8 border border-[#e2e2e2]">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <h3 className="font-['Montserrat'] font-bold text-2xl text-[#1a1c1c]">
            Interactive Volume Discount Calculator
          </h3>
          <p className="text-xs text-[#555f6f]">
            Drag the slider to see your automatic bulk discount applied per garment:
          </p>

          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-xs font-bold text-[#1a1c1c]">
              <span>Monthly Volume: {estimatedMonthlyOrders} units</span>
              <span className="text-[#0058be]">
                {estimatedMonthlyOrders >= 100
                  ? '30% Enterprise Discount'
                  : estimatedMonthlyOrders >= 25
                  ? '20% Growth Discount'
                  : estimatedMonthlyOrders >= 6
                  ? '15% Batch Discount'
                  : 'Standard Tier'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="200"
              value={estimatedMonthlyOrders}
              onChange={(e) => setEstimatedMonthlyOrders(Number(e.target.value))}
              className="w-full accent-[#0058be]"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
