import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X, Sparkles } from 'lucide-react';
import { resetAdminPassword } from '../utils/authUtils';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordResetSuccess: (newPass: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordResetSuccess
}) => {
  const [securityKey, setSecurityKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!securityKey.trim()) {
      setError('કૃપા કરીને વિભાગીય સિક્યોરિટી કોડ અથવા સુરત દાખલ કરો.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 3) {
      setError('નવો પાસવર્ડ ઓછામાં ઓછો 3 અક્ષરનો હોવો જોઈએ.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('નવો પાસવર્ડ અને કન્ફર્મ પાસવર્ડ એકબીજા સાથે મેળ ખાતા નથી.');
      return;
    }

    const res = resetAdminPassword(securityKey, newPassword);
    if (!res.success) {
      setError(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setTimeout(() => {
      onPasswordResetSuccess(newPassword);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        style={{ borderColor: '#cbd5e1' }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div 
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}
          className="px-5 py-4 text-white flex items-center justify-between border-b-2 border-amber-400"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/transperant_logo_3_ef60ebcc.png"
                alt="GSRTC Seal"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                એડમિન પાસવર્ડ રીસેટ (Forgot Password)
              </h3>
              <p className="text-xs text-amber-200/90 font-bold">
                સુરત વિભાગ • લેબર શાખા સિક્યોરિટી
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleReset} className="p-5 sm:p-6 space-y-4">
          {/* Instructions Box with Master PIN Hint */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-1.5 font-black text-amber-950 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>વિભાગીય સિક્યોરિટી વેરિફિકેશન</span>
            </div>
            <p className="leading-relaxed">
              અધિકૃત એડમિન પાસવર્ડ રીસેટ કરવા માટે સુરત વિભાગનો સત્તાવાર રીકવરી કોડ (<code className="bg-amber-200 px-1.5 py-0.5 rounded font-bold text-slate-900">GSRTC@SURAT</code> અથવા <code className="bg-amber-200 px-1.5 py-0.5 rounded font-bold text-slate-900">1960</code> અથવા <code className="bg-amber-200 px-1.5 py-0.5 rounded font-bold text-slate-900">સુરત</code>) દાખલ કરો.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Verification Code Input */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              સિક્યોરિટી રીકવરી પિન / જવાબ:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <input
                type="text"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                placeholder="દા.ત. GSRTC@SURAT અથવા 1960 અથવા સુરત"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold border-2 border-slate-300 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* New Password Input */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              નવો પાસવર્ડ (New Password):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="નવો પાસવર્ડ દાખલ કરો (દા.ત. 1234, admin@2026)"
                className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm font-bold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Input */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              કન્ફર્મ નવો પાસવર્ડ (Confirm Password):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ફરીથી નવો પાસવર્ડ દાખલ કરો"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              રદ કરો
            </button>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff'
              }}
              className="px-5 py-2 text-xs sm:text-sm font-black rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>પાસવર્ડ રીસેટ કરો (Save Password)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
