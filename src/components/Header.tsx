import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Bell, Activity, Sparkles, User as UserIcon, Shield, CheckCircle2, ChevronRight, LogOut, Heart, Palette, Play } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    cartCount,
    setIsCartOpen,
    user,
    openAuthModal,
    logout,
    setIsDashboardOpen,
    setDashboardTab,
    notifications,
    unreadCount,
    isNotificationDropdownOpen,
    setIsNotificationDropdownOpen,
    markNotificationsRead,
    socketConnected,
    setIsAdminSimulatorOpen,
  } = useApp();

  return (
    <header className="fixed top-0 w-full z-40 bg-[#f9f9f9]/90 backdrop-blur-xl border-b border-[#e2e2e2]/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-20 max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={() => setActiveView('products')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0058be] to-[#2170e4] flex items-center justify-center text-white shadow-sm shadow-[#0058be]/20 group-hover:scale-105 transition-transform">
            <span className="font-['Montserrat'] font-bold text-lg tracking-wider">PF</span>
          </div>
          <span className="font-['Montserrat'] font-semibold text-2xl tracking-tight text-[#0058be]">
            PrintFlow
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-10">
          <button
            onClick={() => setActiveView('products')}
            className={`transition-colors text-base font-medium py-1 ${
              activeView === 'products'
                ? 'text-[#0058be] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#424754] hover:text-[#0058be]'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveView('how-it-works')}
            className={`transition-colors text-base font-medium py-1 ${
              activeView === 'how-it-works'
                ? 'text-[#0058be] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#424754] hover:text-[#0058be]'
            }`}
          >
            How it Works
          </button>
          <button
            onClick={() => setActiveView('pricing')}
            className={`transition-colors text-base font-medium py-1 ${
              activeView === 'pricing'
                ? 'text-[#0058be] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#424754] hover:text-[#0058be]'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => setActiveView('design-tool')}
            className={`transition-colors text-base font-medium py-1 flex items-center gap-1.5 ${
              activeView === 'design-tool'
                ? 'text-[#0058be] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#424754] hover:text-[#0058be]'
            }`}
          >
            <Palette className="w-4 h-4 text-[#6b38d4]" />
            <span>Design Tool</span>
          </button>
          <button
            onClick={() => setActiveView('unit-tests')}
            className={`transition-colors text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              activeView === 'unit-tests'
                ? 'bg-[#0058be] text-white border-[#0058be]'
                : 'bg-white text-[#555f6f] border-[#c2c6d6] hover:border-[#0058be] hover:text-[#0058be]'
            }`}
          >
            <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
            <span>Unit Tests</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Socket.io Live Sync Beacon */}
          <div 
            onClick={() => setIsAdminSimulatorOpen(true)}
            title="Real-time Socket.io Sync Active - Click to open Live Simulator"
            className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-mono text-[11px]">{socketConnected ? 'Live Socket.io' : 'Connecting...'}</span>
          </div>

          {/* Admin Live Trigger Drawer Button */}
          <button
            onClick={() => setIsAdminSimulatorOpen(true)}
            title="Live Broadcast & Order Simulator"
            className="p-2 rounded-lg text-[#555f6f] hover:text-[#0058be] hover:bg-[#eeeeee] transition-colors"
          >
            <Activity className="w-5 h-5" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
              className="relative p-2 rounded-lg text-[#555f6f] hover:text-[#0058be] hover:bg-[#eeeeee] transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#e2e2e2] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-[#f9f9f9] border-b border-[#e2e2e2] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#0058be]" />
                    <span className="font-semibold text-sm text-[#1a1c1c]">Live Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markNotificationsRead()}
                      className="text-xs text-[#0058be] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#f3f3f4]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[#555f6f] text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationsRead(n.id)}
                        className={`p-3.5 hover:bg-[#f9f9f9] transition-colors cursor-pointer ${
                          !n.read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#1a1c1c] line-clamp-1">{n.title}</h4>
                          <span className="text-[10px] text-[#727785] whitespace-nowrap">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-[#424754] mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-[#f9f9f9] border-t border-[#e2e2e2] text-center">
                  <span className="text-[11px] text-[#727785] flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Real-time WebSocket Stream Active
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-lg text-[#555f6f] hover:text-[#0058be] hover:bg-[#eeeeee] transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0058be] text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Auth Button or User Profile */}
          {user ? (
            <div className="relative group">
              <button 
                onClick={() => {
                  setDashboardTab('orders');
                  setIsDashboardOpen(true);
                }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#eeeeee] hover:bg-[#e2e2e2] transition-colors"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-white"
                />
                <span className="font-medium text-xs text-[#1a1c1c] max-w-[90px] truncate hidden sm:inline">
                  {user.name}
                </span>
                {user.role === 'admin' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#6b38d4] text-white uppercase">
                    Admin
                  </span>
                )}
              </button>

              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#e2e2e2] py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-3.5 py-2 border-b border-[#f3f3f4]">
                  <p className="text-xs font-bold text-[#1a1c1c] truncate">{user.name}</p>
                  <p className="text-[11px] text-[#727785] truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-[#0058be] bg-[#d8e2ff] px-2 py-0.5 rounded capitalize">
                    {user.role} Account
                  </span>
                </div>
                <button
                  onClick={() => {
                    setDashboardTab('orders');
                    setIsDashboardOpen(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#424754] hover:bg-[#f9f9f9] flex items-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Order History
                </button>
                <button
                  onClick={() => {
                    setDashboardTab('designs');
                    setIsDashboardOpen(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#424754] hover:bg-[#f9f9f9] flex items-center gap-2"
                >
                  <Palette className="w-3.5 h-3.5" /> Saved Designs
                </button>
                <button
                  onClick={() => {
                    setDashboardTab('wishlist');
                    setIsDashboardOpen(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#424754] hover:bg-[#f9f9f9] flex items-center gap-2"
                >
                  <Heart className="w-3.5 h-3.5" /> Wishlist
                </button>
                <div className="border-t border-[#f3f3f4] my-1"></div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#ba1a1a] hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('register')}
              className="px-5 py-2 font-semibold text-sm bg-[#0058be] text-white rounded-lg hover:bg-[#2170e4] active:scale-95 shadow-sm shadow-[#0058be]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Get Started
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
