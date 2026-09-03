/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { SidebarFilters } from './components/SidebarFilters';
import { ProductGrid } from './components/ProductGrid';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { DesignStudioModal } from './components/DesignStudioModal';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { AdminLiveSimulator } from './components/AdminLiveSimulator';
import { HowItWorksView } from './components/HowItWorksView';
import { PricingView } from './components/PricingView';
import { UnitTestsRunnerModal } from './components/UnitTestsRunnerModal';
import { Footer } from './components/Footer';

const MainLayout: React.FC = () => {
  const { activeView } = useApp();

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col font-['Inter'] antialiased">
      {/* Navigation Header */}
      <Header />

      {/* Main Viewport Container */}
      <main className="flex-1 pt-24 pb-12">
        {activeView === 'products' && (
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 pt-6">
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              {/* Sidebar Filters */}
              <SidebarFilters />
              
              {/* Product Catalog Grid */}
              <ProductGrid />
            </div>
          </div>
        )}

        {activeView === 'how-it-works' && <HowItWorksView />}
        {activeView === 'pricing' && <PricingView />}
        {activeView === 'design-tool' && <DesignStudioModal />}
        {activeView === 'unit-tests' && <UnitTestsRunnerModal />}
      </main>

      {/* Overlays, Drawers & Modals */}
      <ProductQuickViewModal />
      <AuthModal />
      <CartDrawer />
      <WishlistDrawer />
      <OrderSuccessModal />
      <UserDashboardModal />
      <AdminLiveSimulator />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
