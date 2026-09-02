import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, Shield, Sparkles, Store, KeyRound } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
  } = useApp();

  if (!isAuthModalOpen) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [role, setRole] = useState<'creator' | 'customer' | 'admin'>('creator');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role, storeName);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e2e2e2]"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#eeeeee] flex items-center justify-center text-[#1a1c1c] hover:bg-[#e2e2e2] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 bg-[#f9f9f9] border-b border-[#eeeeee]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#0058be] text-white flex items-center justify-center font-bold text-xs">
              PF
            </div>
            <span className="font-['Montserrat'] font-semibold text-lg text-[#0058be]">
              PrintFlow Auth
            </span>
          </div>
          <h2 className="font-['Montserrat'] font-bold text-xl text-[#1a1c1c]">
            {isLogin ? 'Sign In to Your Workspace' : 'Create Creator Account'}
          </h2>
          <p className="text-xs text-[#555f6f] mt-1">
            JWT-secured RESTful authentication with role permissions
          </p>
        </div>

        {/* Quick Demo Logins Bar */}
        <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#0058be] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo Accounts:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('alex@printflow.io', 'password123')}
              className="py-1 px-2 rounded bg-white hover:bg-blue-100 border border-blue-200 text-[11px] font-semibold text-[#0058be] transition-colors truncate"
            >
              🎨 Alex (Creator)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@printflow.io', 'admin123')}
              className="py-1 px-2 rounded bg-white hover:bg-purple-100 border border-purple-200 text-[11px] font-semibold text-[#6b38d4] transition-colors truncate"
            >
              🛡️ Jordan (Admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('elena@gmail.com', 'customer123')}
              className="py-1 px-2 rounded bg-white hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold text-emerald-700 transition-colors truncate"
            >
              👤 Elena (Customer)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#ba1a1a] font-medium">
              {errorMessage}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Store / Brand Name</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Neo Tokyo Apparel"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      role === 'creator' ? 'border-[#0058be] bg-[#d8e2ff]/30 text-[#0058be]' : 'border-[#e2e2e2] text-[#555f6f]'
                    }`}
                  >
                    🎨 Creator / Store
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      role === 'customer' ? 'border-[#0058be] bg-[#d8e2ff]/30 text-[#0058be]' : 'border-[#e2e2e2] text-[#555f6f]'
                    }`}
                  >
                    🛍️ Customer / Buyer
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#0058be] hover:bg-[#2170e4] font-semibold text-xs text-white shadow-sm shadow-[#0058be]/20 transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating with JWT...' : isLogin ? 'Sign In' : 'Create Creator Account'}
          </button>

          <div className="text-center pt-2">
            {isLogin ? (
              <p className="text-xs text-[#555f6f]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="font-bold text-[#0058be] hover:underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#555f6f]">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="font-bold text-[#0058be] hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
