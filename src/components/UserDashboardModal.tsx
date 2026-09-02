import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import {
  X,
  Package,
  Palette,
  Heart,
  User,
  Shield,
  Clock,
  CheckCircle2,
  Truck,
  Sparkles,
  ExternalLink,
  Trash2,
  ShoppingBag,
  Store,
  Key,
} from 'lucide-react';

export const UserDashboardModal: React.FC = () => {
  const {
    isDashboardOpen,
    setIsDashboardOpen,
    dashboardTab,
    setDashboardTab,
    user,
    token,
    orders,
    savedDesigns,
    deleteCustomDesign,
    favorites,
    products,
    setDesigningProduct,
    setActiveView,
    addToCart,
    updateProfile,
  } = useApp();

  const [editName, setEditName] = useState(user?.name || '');
  const [editStore, setEditStore] = useState(user?.storeName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  if (!isDashboardOpen) return null;

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name: editName, storeName: editStore });
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Pending</span>;
      case 'processing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0058be] uppercase">Processing</span>;
      case 'printing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#6b38d4] uppercase animate-pulse">Printing</span>;
      case 'quality_check':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">QA Inspection</span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">Shipped</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase">Delivered</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 uppercase">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e2e2e2] flex flex-col h-[85vh]"
      >
        {/* Modal Top Bar */}
        <div className="p-6 bg-[#f9f9f9] border-b border-[#eeeeee] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0058be]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Montserrat'] font-bold text-lg text-[#1a1c1c]">
                  {user ? user.name : 'Creator Workspace'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d8e2ff] text-[#0058be] uppercase">
                  {user ? user.role : 'Guest Session'}
                </span>
              </div>
              <p className="text-xs text-[#555f6f]">{user?.storeName || 'PrintFlow Creator Space'}</p>
            </div>
          </div>

          <button
            onClick={() => setIsDashboardOpen(false)}
            className="w-8 h-8 rounded-full bg-[#eeeeee] hover:bg-[#e2e2e2] flex items-center justify-center text-[#1a1c1c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#eeeeee] px-6 bg-white gap-6">
          <button
            onClick={() => setDashboardTab('orders')}
            className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              dashboardTab === 'orders'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#555f6f] hover:text-[#1a1c1c]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Live Tracking ({orders.length})</span>
          </button>

          <button
            onClick={() => setDashboardTab('designs')}
            className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              dashboardTab === 'designs'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#555f6f] hover:text-[#1a1c1c]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>My Custom Designs ({savedDesigns.length})</span>
          </button>

          <button
            onClick={() => setDashboardTab('wishlist')}
            className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              dashboardTab === 'wishlist'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#555f6f] hover:text-[#1a1c1c]'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Wishlist ({favoriteProducts.length})</span>
          </button>

          <button
            onClick={() => setDashboardTab('profile')}
            className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              dashboardTab === 'profile'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#555f6f] hover:text-[#1a1c1c]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & JWT Security</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f9f9f9]">
          
          {/* TAB 1: ORDERS & TRACKING */}
          {dashboardTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-[#eeeeee]">
                  <Package className="w-10 h-10 text-[#c2c6d6] mx-auto mb-2" />
                  <p className="font-semibold text-sm text-[#1a1c1c]">No orders placed yet</p>
                  <p className="text-xs text-[#727785] mt-1">Design your first custom apparel to start order routing.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-5 border border-[#e2e2e2] shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#eeeeee]">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-sm text-[#1a1c1c]">#{order.id}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-[11px] text-[#727785] mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-['Montserrat'] font-bold text-sm text-[#0058be]">
                          ${order.total.toFixed(2)}
                        </span>
                        {order.trackingNumber && (
                          <p className="text-[10px] font-mono text-[#555f6f] mt-0.5">
                            Tracking: {order.trackingNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded bg-[#eeeeee] flex items-center justify-center font-bold text-[10px]">
                              {item.quantity}×
                            </span>
                            <span className="font-semibold text-[#1a1c1c]">{item.product.name}</span>
                            <span className="text-[#555f6f]">({item.size}, {item.color.name})</span>
                            {item.customDesign?.text && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-[10px] text-[#0058be]">
                                Custom "{item.customDesign.text}"
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-[#1a1c1c]">${item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Live Order Timeline Progress Tracker */}
                    <div className="pt-3 border-t border-[#f3f3f4]">
                      <span className="text-[11px] font-bold text-[#1a1c1c] uppercase tracking-wider block mb-2">
                        Live Production Timeline (Socket.io Real-Time Stream)
                      </span>
                      <div className="space-y-2 relative pl-4 border-l-2 border-[#0058be]/30 ml-2">
                        {order.timeline.map((event, i) => (
                          <div key={i} className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#0058be] ring-2 ring-white" />
                            <div className="flex justify-between items-start text-xs">
                              <span className="font-semibold text-[#1a1c1c]">{event.label}</span>
                              <span className="text-[10px] text-[#727785]">
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#555f6f] mt-0.5">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: SAVED DESIGNS */}
          {dashboardTab === 'designs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedDesigns.length === 0 ? (
                <div className="sm:col-span-2 p-12 text-center bg-white rounded-xl border border-[#eeeeee]">
                  <Palette className="w-10 h-10 text-[#c2c6d6] mx-auto mb-2" />
                  <p className="font-semibold text-sm text-[#1a1c1c]">No saved custom creations</p>
                  <p className="text-xs text-[#727785] mt-1">Open the Design Tool to craft and save your personalized garments.</p>
                </div>
              ) : (
                savedDesigns.map((dsg) => (
                  <div key={dsg.id} className="bg-white rounded-xl p-4 border border-[#e2e2e2] flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 bg-[#eeeeee] rounded-lg p-2 flex items-center justify-center relative">
                        <img src={dsg.productImage} alt={dsg.name} className="w-full h-full object-contain mix-blend-multiply" />
                        <span
                          className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: dsg.selectedColorHex }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#1a1c1c] truncate">{dsg.name}</h4>
                        <p className="text-[11px] text-[#555f6f]">{dsg.productName}</p>
                        {dsg.designText && (
                          <p className="text-[11px] font-semibold text-[#0058be] mt-1 truncate">
                            Text: "{dsg.designText}"
                          </p>
                        )}
                        <span className="text-[10px] text-[#727785] block mt-1">
                          Created {new Date(dsg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-[#f3f3f4]">
                      <button
                        onClick={() => {
                          const target = products.find((p) => p.id === dsg.productId) || products[0];
                          setDesigningProduct(target);
                          setIsDashboardOpen(false);
                          setActiveView('design-tool');
                        }}
                        className="flex-1 py-1.5 px-2 bg-[#0058be] text-white rounded text-xs font-semibold hover:bg-[#2170e4]"
                      >
                        Edit in Studio
                      </button>
                      <button
                        onClick={() => deleteCustomDesign(dsg.id)}
                        className="p-1.5 text-[#ba1a1a] hover:bg-red-50 rounded"
                        title="Delete Design"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {dashboardTab === 'wishlist' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {favoriteProducts.length === 0 ? (
                <div className="sm:col-span-3 p-12 text-center bg-white rounded-xl border border-[#eeeeee]">
                  <Heart className="w-10 h-10 text-[#c2c6d6] mx-auto mb-2" />
                  <p className="font-semibold text-sm text-[#1a1c1c]">Your wishlist is empty</p>
                  <p className="text-xs text-[#727785] mt-1">Click the heart icon on any product in the catalog to save it here.</p>
                </div>
              ) : (
                favoriteProducts.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl p-3 border border-[#e2e2e2] flex flex-col justify-between">
                    <img src={p.image} alt={p.name} className="w-full aspect-[4/5] object-cover rounded-lg bg-[#eeeeee] mix-blend-multiply mb-2" />
                    <div>
                      <h4 className="font-semibold text-xs text-[#1a1c1c] truncate">{p.name}</h4>
                      <p className="font-bold text-xs text-[#0058be] mt-0.5">${p.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setDesigningProduct(p);
                        setIsDashboardOpen(false);
                        setActiveView('design-tool');
                      }}
                      className="mt-2 w-full py-1.5 bg-[#0058be] text-white rounded text-xs font-semibold hover:bg-[#2170e4]"
                    >
                      Customize Now
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: PROFILE & JWT SECURITY */}
          {dashboardTab === 'profile' && (
            <div className="space-y-6">
              <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-xl border border-[#e2e2e2] space-y-4">
                <h3 className="font-bold text-sm text-[#1a1c1c]">Creator Profile Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#e2e2e2] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Store / Brand Name</label>
                    <input
                      type="text"
                      value={editStore}
                      onChange={(e) => setEditStore(e.target.value)}
                      className="w-full px-3 py-2 border border-[#e2e2e2] rounded-lg text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-[#0058be] text-white rounded-lg text-xs font-semibold hover:bg-[#2170e4]"
                >
                  {savingProfile ? 'Saving...' : 'Update Profile'}
                </button>
              </form>

              {/* JWT Token Debug & Payload */}
              <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#0058be]" />
                  <h3 className="font-bold text-sm text-[#1a1c1c]">Active JSON Web Token (JWT)</h3>
                </div>
                <p className="text-xs text-[#555f6f]">
                  This token is passed as an <code className="bg-[#eeeeee] px-1 py-0.5 rounded text-[11px]">Authorization: Bearer</code> header for REST API requests.
                </p>
                <div className="p-3 bg-[#f3f3f4] rounded-lg font-mono text-[11px] text-[#424754] break-all select-all">
                  {token || 'No active JWT token stored (Guest mode)'}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
