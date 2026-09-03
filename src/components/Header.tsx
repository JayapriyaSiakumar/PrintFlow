import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import { 
  ShoppingBag, 
  Bell, 
  User as UserIcon, 
  Heart, 
  Palette, 
  Search, 
  SlidersHorizontal, 
  X, 
  Menu, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  PackageCheck,
  Layers,
  ArrowRight
} from 'lucide-react';

const CATEGORIES: { label: string; value: Category | 'All' }[] = [
  { label: 'All Categories', value: 'All' },
  { label: 'Apparel', value: 'Apparel' },
  { label: 'Home Decor', value: 'Home Decor' },
  { label: 'Accessories', value: 'Accessories' },
  { label: 'Stationery', value: 'Stationery' },
];

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    cartCount,
    setIsCartOpen,
    wishlistCount,
    setIsWishlistOpen,
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
    filters,
    setSearchQuery,
    setCategory,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (activeView !== 'products') {
      setActiveView('products');
    }
  };

  const handleCategorySelect = (catValue: Category | 'All') => {
    if (catValue === 'All') {
      setCategory('Apparel'); // or default
    } else {
      setCategory(catValue);
    }
    setCategoryDropdownOpen(false);
    if (activeView !== 'products') {
      setActiveView('products');
    }
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-[#f9f9f9]/95 backdrop-blur-xl border-b border-[#e2e2e2]/70 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo */}
        <div 
          onClick={() => {
            setActiveView('products');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0058be] to-[#2170e4] flex items-center justify-center text-white shadow-sm shadow-[#0058be]/20 group-hover:scale-105 transition-transform">
            <span className="font-['Montserrat'] font-bold text-lg tracking-wider">PF</span>
          </div>
          <div className="flex flex-col">
            <span className="font-['Montserrat'] font-bold text-2xl tracking-tight text-[#0058be] leading-none">
              PrintFlow
            </span>
            <span className="text-[10px] font-medium text-[#727785] tracking-wide mt-0.5 hidden sm:inline">
              Custom Merch Platform
            </span>
          </div>
        </div>

        {/* Center: Search & Filter Bar (Desktop & Tablet) */}
        <div className="hidden md:flex flex-1 max-w-lg items-center relative">
          <div className="w-full flex items-center bg-[#eeeeee]/90 hover:bg-[#e8e8e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0058be]/30 focus-within:border-[#0058be] border border-transparent rounded-full px-3.5 py-1.5 transition-all">
            
            {/* Quick Category Filter Selector */}
            <div className="relative flex-shrink-0" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1a1c1c] pr-2.5 mr-2 border-r border-[#d0d3d8] hover:text-[#0058be] transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0058be]" />
                <span className="max-w-[85px] truncate">{filters.category || 'All'}</span>
                <ChevronDown className="w-3 h-3 text-[#727785]" />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-[#e2e2e2] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#727785] uppercase tracking-wider border-b border-[#f0f0f2]">
                    Filter by Category
                  </div>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => handleCategorySelect(cat.value)}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                        filters.category === cat.value
                          ? 'bg-[#d8e2ff]/50 text-[#0058be] font-bold'
                          : 'text-[#424754] hover:bg-[#f9f9f9]'
                      }`}
                    >
                      {cat.label}
                      {filters.category === cat.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0058be]"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input */}
            <Search className="w-4 h-4 text-[#727785] mr-2 flex-shrink-0" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search products, tees, hoodies, mugs..."
              className="w-full bg-transparent text-xs text-[#1a1c1c] placeholder:text-[#727785] focus:outline-none"
            />

            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-[#d8d8d8] rounded-full text-[#727785] hover:text-[#1a1c1c] transition-colors ml-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center-Right: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-7">
          <button
            onClick={() => setActiveView('products')}
            className={`transition-colors text-sm font-medium py-1 ${
              activeView === 'products'
                ? 'text-[#0058be] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#424754] hover:text-[#0058be]'
            }`}
          >
            Catalog
          </button>
          
          <button
            onClick={() => setActiveView('design-tool')}
            className={`transition-colors text-sm font-medium py-1 flex items-center gap-1.5 ${
              activeView === 'design-tool'
                ? 'text-[#0058be] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#424754] hover:text-[#0058be]'
            }`}
          >
            <Palette className="w-4 h-4 text-[#6b38d4]" />
            <span>Design Studio</span>
          </button>

          <button
            onClick={() => setActiveView('how-it-works')}
            className={`transition-colors text-sm font-medium py-1 ${
              activeView === 'how-it-works'
                ? 'text-[#0058be] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#424754] hover:text-[#0058be]'
            }`}
          >
            How it Works
          </button>
        </nav>

        {/* Right: Actions (Wishlist, Notifications, Cart, Profile, Mobile Menu) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 rounded-lg text-[#555f6f] hover:text-[#0058be] hover:bg-[#eeeeee] transition-colors"
            title="Search products"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist Button with Heart Icon & Counter Badge */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="relative p-2 rounded-lg text-[#555f6f] hover:text-rose-600 hover:bg-[#eeeeee] transition-colors cursor-pointer group"
            title={`View Saved Wishlist (${wishlistCount} items)`}
          >
            <Heart className={`w-5 h-5 transition-transform group-hover:scale-110 ${
              wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''
            }`} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
              className="relative p-2 rounded-lg text-[#555f6f] hover:text-[#0058be] hover:bg-[#eeeeee] transition-colors cursor-pointer"
              title="Notifications"
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
                      className="text-xs text-[#0058be] hover:underline font-medium cursor-pointer"
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
            className="relative p-2 rounded-lg text-[#555f6f] hover:text-[#0058be] hover:bg-[#eeeeee] transition-colors cursor-pointer"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0058be] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Auth Button or User Profile */}
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#eeeeee] hover:bg-[#e2e2e2] transition-colors cursor-pointer"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-white"
                />
                <span className="font-medium text-xs text-[#1a1c1c] max-w-[90px] truncate hidden lg:inline">
                  {user.name}
                </span>
                {user.role === 'admin' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#6b38d4] text-white uppercase hidden sm:inline">
                    Admin
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-[#727785]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#e2e2e2] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-[#f3f3f4]">
                    <p className="text-xs font-bold text-[#1a1c1c] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#727785] truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#0058be] bg-[#d8e2ff] px-2 py-0.5 rounded capitalize">
                      {user.role} Account
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setDashboardTab('orders');
                      setIsDashboardOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#424754] hover:bg-[#f9f9f9] flex items-center gap-2 cursor-pointer"
                  >
                    <PackageCheck className="w-3.5 h-3.5 text-[#0058be]" /> Order History
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setDashboardTab('designs');
                      setIsDashboardOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#424754] hover:bg-[#f9f9f9] flex items-center gap-2 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#6b38d4]" /> Saved Designs
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setIsWishlistOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#424754] hover:bg-[#f9f9f9] flex items-center gap-2 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Wishlist ({wishlistCount})
                  </button>
                  <div className="border-t border-[#f3f3f4] my-1"></div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#ba1a1a] hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('register')}
              className="px-4 sm:px-5 py-2 font-semibold text-xs sm:text-sm bg-[#0058be] text-white rounded-lg hover:bg-[#2170e4] active:scale-95 shadow-sm shadow-[#0058be]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-[#555f6f] hover:text-[#0058be] hover:bg-[#eeeeee] transition-colors"
            title="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-[#1a1c1c]" />}
          </button>

        </div>
      </div>

      {/* Mobile Search Expandable Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 bg-[#f9f9f9] border-b border-[#e2e2e2] animate-in slide-in-from-top duration-150">
          <div className="flex items-center bg-white border border-[#c2c6d6] rounded-lg px-3 py-2 shadow-inner">
            <Search className="w-4 h-4 text-[#727785] mr-2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search all apparel, merch..."
              className="w-full bg-transparent text-xs text-[#1a1c1c] focus:outline-none"
              autoFocus
            />
            {filters.searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-[#727785] hover:text-[#1a1c1c]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleCategorySelect(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filters.category === cat.value
                    ? 'bg-[#0058be] text-white'
                    : 'bg-[#eeeeee] text-[#424754] hover:bg-[#e2e2e2]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-[#e2e2e2] shadow-xl animate-in slide-in-from-top duration-200">
          <div className="px-5 py-4 space-y-3">
            
            <div className="text-[11px] font-bold text-[#727785] uppercase tracking-wider">
              Navigation
            </div>

            <button
              onClick={() => {
                setActiveView('products');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                activeView === 'products' ? 'bg-[#d8e2ff] text-[#0058be] font-bold' : 'text-[#1a1c1c] hover:bg-[#f9f9f9]'
              }`}
            >
              <span>Catalog Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setActiveView('design-tool');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                activeView === 'design-tool' ? 'bg-[#d8e2ff] text-[#0058be] font-bold' : 'text-[#1a1c1c] hover:bg-[#f9f9f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#6b38d4]" />
                <span>Custom Design Studio</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setActiveView('how-it-works');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                activeView === 'how-it-works' ? 'bg-[#d8e2ff] text-[#0058be] font-bold' : 'text-[#1a1c1c] hover:bg-[#f9f9f9]'
              }`}
            >
              <span>How PrintFlow Works</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="border-t border-[#f0f0f2] pt-3">
              <div className="text-[11px] font-bold text-[#727785] uppercase tracking-wider mb-2">
                Quick Category Filters
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.filter(c => c.value !== 'All').map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => {
                      handleCategorySelect(cat.value);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs text-left font-medium border ${
                      filters.category === cat.value
                        ? 'border-[#0058be] bg-[#d8e2ff]/50 text-[#0058be]'
                        : 'border-[#e2e2e2] bg-[#f9f9f9] text-[#424754]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#f0f0f2] pt-3 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsWishlistOpen(true);
                }}
                className="flex-1 py-2.5 px-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                Wishlist ({wishlistCount})
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCartOpen(true);
                }}
                className="flex-1 py-2.5 px-3 bg-[#0058be] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                Cart ({cartCount})
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
