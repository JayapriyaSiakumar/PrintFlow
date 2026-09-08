import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, Shield, Sparkles, Store, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    resetTokenForModal,
    setResetTokenForModal,
    login,
    register,
    forgotPassword,
    resetPassword,
  } = useApp();

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [resetToken, setResetToken] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedResetToken, setGeneratedResetToken] = useState<string | null>(null);

  // Sync token from context if provided
  useEffect(() => {
    if (resetTokenForModal) {
      setResetToken(resetTokenForModal);
    }
  }, [resetTokenForModal]);

  // Clear feedback when modal opens or mode changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setLoading(false);
      if (authModalMode === 'login' || authModalMode === 'register') {
        setGeneratedResetToken(null);
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (authModalMode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        await login(email.trim(), password);
      } else if (authModalMode === 'register') {
        if (!name.trim()) {
          throw new Error('Please provide your full name.');
        }
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please provide a valid email address.');
        }
        if (password.length < 6) {
          throw new Error('Password must contain at least 6 characters.');
        }
        await register(name.trim(), email.trim(), password, storeName.trim());
      } else if (authModalMode === 'forgot-password') {
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }
        const res = await forgotPassword(email.trim());
        if (res.resetToken) {
          setGeneratedResetToken(res.resetToken);
          setResetToken(res.resetToken);
          setSuccessMessage('Reset token generated! You can now proceed to set a new password.');
        } else {
          setSuccessMessage(res.message || 'Password reset instructions have been generated.');
        }
      } else if (authModalMode === 'reset-password') {
        if (!resetToken.trim()) {
          throw new Error('Please enter the security reset token.');
        }
        if (password.length < 6) {
          throw new Error('New password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }
        const res = await resetPassword(resetToken.trim(), password);
        setSuccessMessage(res.message || 'Password reset successfully! Please sign in.');
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        setResetTokenForModal('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication request failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      setEmail(demoEmail);
      setPassword(demoPass);
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
          id="btn-close-auth-modal"
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

          <div className="flex items-center justify-between">
            <h2 className="font-['Montserrat'] font-bold text-xl text-[#1a1c1c]">
              {authModalMode === 'login' && 'Sign In to PrintFlow'}
              {authModalMode === 'register' && 'Create Your Account'}
              {authModalMode === 'forgot-password' && 'Reset Your Password'}
              {authModalMode === 'reset-password' && 'Set New Password'}
            </h2>
          </div>

          <p className="text-xs text-[#555f6f] mt-1">
            {authModalMode === 'login' && 'Enter your credentials or use a quick demo profile.'}
            {authModalMode === 'register' && 'Register as a standard user. Admin access is strictly granted by administrators.'}
            {authModalMode === 'forgot-password' && 'Enter your registered email to generate a security reset token.'}
            {authModalMode === 'reset-password' && 'Provide your reset token and enter your new password.'}
          </p>
        </div>

        {/* Quick Demo Logins Bar (Visible on Login mode) */}
        {authModalMode === 'login' && (
          <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-[#0058be] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Quick 1-Click Demo Profiles:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-admin-login"
                onClick={() => handleQuickDemoLogin('admin@printflow.io', 'admin123')}
                className="py-1.5 px-3 rounded-lg bg-white hover:bg-purple-50 border border-purple-200 text-xs font-semibold text-[#6b38d4] transition-colors flex items-center gap-2 shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <div className="text-left leading-tight">
                  <div className="font-bold">Jordan Hayes</div>
                  <div className="text-[10px] text-purple-600 font-normal">Role: Admin</div>
                </div>
              </button>
              <button
                type="button"
                id="btn-demo-user-login"
                onClick={() => handleQuickDemoLogin('alex@printflow.io', 'password123')}
                className="py-1.5 px-3 rounded-lg bg-white hover:bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0058be] transition-colors flex items-center gap-2 shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-[#0058be]" />
                <div className="text-left leading-tight">
                  <div className="font-bold">Alex Rivera</div>
                  <div className="text-[10px] text-[#0058be] font-normal">Role: User</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3.5">
          
          {/* Error message banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#ba1a1a] font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success message banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{successMessage}</p>
                {generatedResetToken && authModalMode === 'forgot-password' && (
                  <div className="mt-2 pt-2 border-t border-emerald-200">
                    <span className="text-[11px] font-bold block mb-1">Generated Security Token:</span>
                    <code className="block bg-white p-1.5 rounded border border-emerald-300 font-mono text-[11px] text-emerald-900 break-all select-all">
                      {generatedResetToken}
                    </code>
                    <button
                      type="button"
                      onClick={() => openAuthModal('reset-password')}
                      className="mt-2 text-xs font-bold text-[#0058be] hover:underline flex items-center gap-1"
                    >
                      Proceed to Reset Password →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE: REGISTER */}
          {authModalMode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    id="input-register-name"
                    placeholder="e.g. Maya Lin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Store / Brand Name (Optional)</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-register-store"
                    placeholder="e.g. Apex Prints"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                  />
                </div>
              </div>
            </>
          )}

          {/* EMAIL INPUT (Login, Register, Forgot Password) */}
          {(authModalMode === 'login' || authModalMode === 'register' || authModalMode === 'forgot-password') && (
            <div>
              <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  id="input-auth-email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                />
              </div>
            </div>
          )}

          {/* RESET TOKEN INPUT (Reset Password Mode) */}
          {authModalMode === 'reset-password' && (
            <div>
              <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Security Reset Token</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  id="input-reset-token"
                  placeholder="Paste your 48-character reset token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs font-mono text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                />
              </div>
            </div>
          )}

          {/* PASSWORD INPUT (Login, Register, Reset Password) */}
          {(authModalMode === 'login' || authModalMode === 'register' || authModalMode === 'reset-password') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#1a1c1c]">
                  {authModalMode === 'reset-password' ? 'New Password' : 'Password'}
                </label>
                {authModalMode === 'login' && (
                  <button
                    type="button"
                    id="btn-goto-forgot-password"
                    onClick={() => openAuthModal('forgot-password')}
                    className="text-[11px] font-semibold text-[#0058be] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  id="input-auth-password"
                  placeholder="•••••••• (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                />
              </div>
            </div>
          )}

          {/* CONFIRM PASSWORD INPUT (Reset Password Mode) */}
          {authModalMode === 'reset-password' && (
            <div>
              <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  id="input-auth-confirm-password"
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            id="btn-auth-submit"
            className="w-full py-2.5 rounded-lg bg-[#0058be] hover:bg-[#2170e4] font-semibold text-xs text-white shadow-sm shadow-[#0058be]/20 transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? (
              'Processing request...'
            ) : authModalMode === 'login' ? (
              'Sign In'
            ) : authModalMode === 'register' ? (
              'Create User Account'
            ) : authModalMode === 'forgot-password' ? (
              'Generate Reset Token'
            ) : (
              'Update Password'
            )}
          </button>

          {/* Mode Navigation Footers */}
          <div className="text-center pt-2 border-t border-[#eeeeee]">
            {authModalMode === 'login' && (
              <p className="text-xs text-[#555f6f]">
                Don't have an account?{' '}
                <button
                  type="button"
                  id="btn-switch-to-register"
                  onClick={() => openAuthModal('register')}
                  className="font-bold text-[#0058be] hover:underline"
                >
                  Create one now
                </button>
              </p>
            )}

            {authModalMode === 'register' && (
              <p className="text-xs text-[#555f6f]">
                Already have an account?{' '}
                <button
                  type="button"
                  id="btn-switch-to-login"
                  onClick={() => openAuthModal('login')}
                  className="font-bold text-[#0058be] hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}

            {(authModalMode === 'forgot-password' || authModalMode === 'reset-password') && (
              <div className="flex items-center justify-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="font-semibold text-[#555f6f] hover:text-[#1a1c1c] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
                {authModalMode === 'forgot-password' && (
                  <button
                    type="button"
                    onClick={() => openAuthModal('reset-password')}
                    className="font-bold text-[#0058be] hover:underline"
                  >
                    Already have a token?
                  </button>
                )}
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

