import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types/case';
import { ShieldCheck, Lock, KeyRound, UserCheck, Eye, EyeOff, AlertCircle, Scale, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { validateLoginCredentials, getStoredCredentials } from '../utils/authUtils';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  stats?: {
    total: number;
    hcCount: number;
    labourCount: number;
    itCount: number;
    disposedCount: number;
  };
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, stats }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccessNotice, setResetSuccessNotice] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setResetSuccessNotice('');
    const creds = getStoredCredentials();
    if (role === 'admin') {
      setUsername('admin');
      setPassword(creds.adminPasswordHash);
    } else {
      setUsername('staff');
      setPassword(creds.staffPasswordHash || 'viewer');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccessNotice('');

    const res = validateLoginCredentials(selectedRole, username, password);
    if (!res.success) {
      setError(res.message || 'અમાન્ય યુઝરનેમ અથવા પાસવર્ડ!');
      return;
    }

    if (res.user) {
      onLogin(res.user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Corporation Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-3 border-b border-blue-900/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-1 shadow-lg ring-2 ring-amber-400/50 flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/transperant_logo_3_ef60ebcc.png"
              alt="GSRTC Seal"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-amber-300 tracking-wide">
              ગુજરાત રાજ્ય માર્ગ વાહન વ્યવહાર નિગમ (GSRTC)
            </h1>
            <p className="text-xs text-blue-200 font-bold">
              સુરત વિભાગ • લેબર શાખા (Labour Branch) કોર્ટ કેસ પોર્ટલ
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-blue-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>સુરક્ષિત પોર્ટલ</span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="max-w-md w-full mx-auto my-6">
        <div 
          style={{ backgroundColor: '#ffffff', border: '3px solid #1e3a8a' }}
          className="rounded-3xl shadow-2xl overflow-hidden text-slate-900"
        >
          {/* Header Banner */}
          <div 
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)' }}
            className="p-6 text-white text-center"
          >
            <div 
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl mx-auto flex items-center justify-center bg-white p-1.5 shadow-2xl ring-4 ring-amber-400/40 mb-3"
            >
              <img
                src="/assets/aistudio/transperant_logo_3_ef60ebcc.png"
                alt="GSRTC સત્તાવાર પ્રતીક"
                className="w-full h-full object-contain"
              />
            </div>
            <span 
              style={{ backgroundColor: 'rgba(253,224,71,0.2)', color: '#fde047', border: '1px solid rgba(253,224,71,0.4)' }}
              className="text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5"
            >
              GSRTC સુરત વિભાગ • લેબર શાખા
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              કેસ પોર્ટલ લોગીન (Login)
            </h2>
            <p className="text-xs text-blue-100 font-medium mt-1">
              હાઈકોર્ટ, લેબર કોર્ટ અને ઔદ્યોગિક ટ્રિબ્યુનલ કેસોના સંચાલન માટે લોગીન કરો
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }} className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                style={{
                  backgroundColor: selectedRole === 'admin' ? '#1d4ed8' : '#ffffff',
                  color: selectedRole === 'admin' ? '#ffffff' : '#1e293b',
                  border: '2px solid #1d4ed8'
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>👑 એડમિન (Full Access)</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('viewer')}
                style={{
                  backgroundColor: selectedRole === 'viewer' ? '#059669' : '#ffffff',
                  color: selectedRole === 'viewer' ? '#ffffff' : '#1e293b',
                  border: '2px solid #059669'
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span>👁️ સ્ટાફ (View Only)</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div 
                style={{ backgroundColor: '#ffe4e6', color: '#9f1239', border: '1.5px solid #f43f5e' }}
                className="p-3 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {resetSuccessNotice && (
              <div 
                style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1.5px solid #22c55e' }}
                className="p-3 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{resetSuccessNotice}</span>
              </div>
            )}

            {selectedRole === 'admin' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    યુઝરનેમ (Username)
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}
                      className="w-full pl-9 pr-3 py-2.5 text-sm font-bold rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 font-medium">
                    અધિકૃત એડમિન યુઝરનેમ: <strong className="text-blue-800">admin</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    સુરક્ષા પાસવર્ડ (Password / PIN)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="પાસવર્ડ દાખલ કરો"
                      style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}
                      className="w-full pl-9 pr-10 py-2.5 text-sm font-bold rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Forgot Password Link Button */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-blue-700 hover:text-blue-900 font-black hover:underline cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>પાસવર્ડ ભૂલી ગયા? (Forgot Password?)</span>
                    </button>
                    <span className="text-[11px] text-slate-500 font-bold">ડિફોલ્ટ: 1234</span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                style={{ backgroundColor: '#ecfdf5', border: '2px solid #a7f3d0' }}
                className="p-4 rounded-2xl text-xs text-emerald-950 font-bold space-y-2"
              >
                <div className="flex items-center gap-1.5 text-emerald-800 text-sm font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>વાંચન મોડ (Read-Only Viewer Access)</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  કોઈ પાસવર્ડની જરૂર નથી. સ્ટાફ તરીકે લોગીન કરીને તમે તમામ કેસો જોઈ શકો છો, સર્ચ કરી શકો છો અને મુદત કેલેન્ડર જોઈ શકો છો.
                </p>
              </div>
            )}

            {/* Login Submit Button */}
            <button
              type="submit"
              style={{
                background: selectedRole === 'admin' 
                  ? 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)' 
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff'
              }}
              className="w-full py-3 px-4 text-sm font-black rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{selectedRole === 'admin' ? 'એડમિન પોર્ટલમાં પ્રવેશ કરો' : 'સ્ટાફ તરીકે પ્રવેશ કરો'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Summary Pill at Bottom */}
          {stats && (
            <div className="bg-slate-50 border-t border-slate-200 p-3 px-5 text-center text-xs text-slate-600 font-semibold flex items-center justify-around">
              <div>કુલ કેસો: <strong className="text-blue-800 font-mono">{stats.total}</strong></div>
              <div className="h-3 w-px bg-slate-300"></div>
              <div>હાઈકોર્ટ: <strong className="text-sky-800 font-mono">{stats.hcCount}</strong></div>
              <div className="h-3 w-px bg-slate-300"></div>
              <div>લેબર કોર્ટ: <strong className="text-emerald-800 font-mono">{stats.labourCount}</strong></div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        ગુજરાત રાજ્ય માર્ગ વાહન વ્યવહાર નિગમ (GSRTC) • સુરત વિભાગ
      </footer>

      {/* Forgot / Reset Password Modal */}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
          onPasswordResetSuccess={(newPass) => {
            setPassword(newPass);
            setResetSuccessNotice('🎉 પાસવર્ડ સફળતાપૂર્વક રીસેટ થયો! નવો પાસવર્ડ દાખલ થઈ ગયો છે, હવે લોગીન કરો.');
            setError('');
          }}
        />
      )}
    </div>
  );
};
