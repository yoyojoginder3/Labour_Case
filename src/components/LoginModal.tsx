import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types/case';
import { ShieldCheck, Lock, KeyRound, UserCheck, Eye, EyeOff, AlertCircle, Scale, Building2, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  currentUser: AuthUser | null;
  onLogin: (user: AuthUser) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentUser,
  onLogin,
  onClose
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('1234');
    } else {
      setUsername('staff');
      setPassword('viewer');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'admin') {
      if (password === '1234' || password === 'admin123' || password === 'gsrtc@123' || password === 'admin') {
        onLogin({
          username: username.trim() || 'admin',
          name: 'લેબર શાખા અધિકારીશ્રી (Labour Officer)',
          role: 'admin',
          designation: 'લેબર ઓફિસર, GSRTC સુરત વિભાગ'
        });
        onClose();
      } else {
        setError('ખોટો પાસવર્ડ! એડમિન માટે "1234" અથવા "gsrtc@123" નો ઉપયોગ કરો.');
      }
    } else {
      onLogin({
        username: username.trim() || 'staff',
        name: 'લેબર શાખા સ્ટાફ (Viewer)',
        role: 'viewer',
        designation: 'વાંચન / વ્યુઅર મોડ'
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #1e3a8a' }}
        className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col"
      >
        {/* Header Strip with GSRTC Labour Branch Emblem */}
        <div 
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)' }}
          className="p-5 sm:p-6 text-white text-center relative shrink-0"
        >
          <div 
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl mx-auto flex items-center justify-center bg-white p-1.5 shadow-xl ring-2 ring-amber-400/50 mb-2.5"
          >
            <img
              src="/assets/aistudio/transperant_logo_3_ef60ebcc.png"
              alt="GSRTC સત્તાવાર પ્રતીક"
              className="w-full h-full object-contain"
            />
          </div>
          <span 
            style={{ backgroundColor: 'rgba(253,224,71,0.2)', color: '#fde047', border: '1px solid rgba(253,224,71,0.4)' }}
            className="text-[10px] sm:text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1"
          >
            GSRTC સુરત વિભાગ • લેબર શાખા (Labour Branch)
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            સુરક્ષિત કેસ પોર્ટલ લોગીન
          </h2>
          <p className="text-[11px] sm:text-xs text-blue-100 font-semibold mt-0.5">
            નવા કેસ ઉમેરવા અથવા ડિલીટ કરવા માટે એડમિન એક્સેસ જરૂરી છે
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }} className="p-2.5 sm:p-3 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              style={{
                backgroundColor: selectedRole === 'admin' ? '#1d4ed8' : '#ffffff',
                color: selectedRole === 'admin' ? '#ffffff' : '#1e293b',
                border: '2px solid #1d4ed8'
              }}
              className="py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>👑 એડમિન (Full)</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('viewer')}
              style={{
                backgroundColor: selectedRole === 'viewer' ? '#059669' : '#ffffff',
                color: selectedRole === 'viewer' ? '#ffffff' : '#1e293b',
                border: '2px solid #059669'
              }}
              className="py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>👁️ સ્ટાફ (View)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {error && (
            <div 
              style={{ backgroundColor: '#ffe4e6', color: '#9f1239', border: '1.5px solid #f43f5e' }}
              className="p-3 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
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
                    placeholder="1234"
                    style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}
                    className="w-full pl-9 pr-10 py-2 text-sm font-bold rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>ડેમો પાસવર્ડ: <strong className="text-blue-700 font-mono">1234</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div 
              style={{ backgroundColor: '#ecfdf5', border: '2px solid #a7f3d0' }}
              className="p-3.5 rounded-2xl text-xs text-emerald-950 font-bold space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-emerald-800 text-sm font-black">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>વાંચન મોડ (Read-Only Viewer Access)</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                કોઈ પાસવર્ડની જરૂર નથી. સ્ટાફ તરીકે લોગીન કરીને તમે તમામ કેસો જોઈ શકો છો, સર્ચ કરી શકો છો અને એક્સેલ ડાઉનલોડ કરી શકો છો.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #cbd5e1' }}
              className="flex-1 py-2.5 text-xs font-black rounded-xl hover:bg-slate-200 transition-colors"
            >
              બંધ કરો
            </button>
            <button
              type="submit"
              style={{
                background: selectedRole === 'admin' 
                  ? 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)' 
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff'
              }}
              className="flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>{selectedRole === 'admin' ? 'એડમિન પ્રવેશ' : 'સ્ટાફ પ્રવેશ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
