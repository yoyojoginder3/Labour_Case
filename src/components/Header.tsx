import React, { useState } from 'react';
import { SheetKey, AuthUser } from '../types/case';
import { 
  Landmark, 
  Scale, 
  Gavel, 
  Archive, 
  GraduationCap, 
  Calendar as CalendarIcon,
  Bell,
  Plus, 
  Download, 
  Upload, 
  Printer, 
  RotateCcw, 
  ChevronDown, 
  FileSpreadsheet,
  Lock,
  ShieldCheck,
  Eye,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  activeSheet: SheetKey | 'SUMMARY' | 'CALENDAR';
  onSelectTab: (tab: SheetKey | 'SUMMARY' | 'CALENDAR') => void;
  onOpenAddModal: () => void;
  onOpenExcelUpload: () => void;
  onOpenNotifications: () => void;
  urgentNotificationCount?: number;
  onExportExcel: (mode: 'all' | 'current' | 'pending' | 'disposed') => void;
  onImportExcel: (file: File) => void;
  onPrintCauseList: () => void;
  onResetData: () => void;
  totalCases: number;
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSheet,
  onSelectTab,
  onOpenAddModal,
  onOpenExcelUpload,
  onOpenNotifications,
  urgentNotificationCount = 0,
  onExportExcel,
  onImportExcel,
  onPrintCauseList,
  onResetData,
  totalCases,
  currentUser,
  onOpenLogin,
  onLogout
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportExcel(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-slate-300 shadow-md">
      {/* Official Corporation Header Strip - Reflects લેબર શાખા */}
      <div 
        style={{
          background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)',
          borderBottom: '2.5px solid #f59e0b'
        }}
        className="text-white px-3 sm:px-6 py-2"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span 
              style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
              className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-black text-xs shadow-md shrink-0"
            >
              ST
            </span>
            <div className="truncate">
              <span style={{ color: '#fde047' }} className="font-extrabold tracking-wide text-xs sm:text-sm">
                GSRTC સુરત વિભાગ • લેબર શાખા
              </span>
              <span className="text-slate-400 mx-1.5 hidden md:inline">•</span>
              <span className="text-slate-200 hidden md:inline font-bold">
                મજૂર / ઔદ્યોગિક અદાલત કેસ પોર્ટલ
              </span>
            </div>
          </div>

          {/* User Auth Status Strip & Notification Bell */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hearing Alerts Notification Bell */}
            <button
              onClick={onOpenNotifications}
              style={{
                backgroundColor: urgentNotificationCount > 0 ? '#ea580c' : 'rgba(255,255,255,0.18)',
                color: '#ffffff'
              }}
              className="px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm hover:brightness-110 transition-all cursor-pointer"
              title="કોર્ટ મુદત એલર્ટ & મોબાઈલ મેસેજ"
            >
              <Bell className={`w-3.5 h-3.5 ${urgentNotificationCount > 0 ? 'text-amber-300 animate-bounce' : 'text-slate-200'}`} />
              <span className="hidden sm:inline">મુદત એલર્ટ</span>
              {urgentNotificationCount > 0 && (
                <span
                  style={{ backgroundColor: '#fef08a', color: '#78350f' }}
                  className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-black leading-tight"
                >
                  {urgentNotificationCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span 
                  style={{
                    backgroundColor: isAdmin ? 'rgba(34, 197, 94, 0.25)' : 'rgba(56, 189, 248, 0.25)',
                    color: isAdmin ? '#86efac' : '#bae6fd',
                    border: isAdmin ? '1px solid #22c55e' : '1px solid #38bdf8'
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] sm:text-xs"
                >
                  {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
                  <span className="hidden sm:inline">{currentUser.name}</span>
                  <span className="sm:hidden">{isAdmin ? 'એડમિન' : 'સ્ટાફ'}</span>
                </span>
                <button
                  onClick={onLogout}
                  title="લોગઆઉટ / રોલ બદલો"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
                  className="p-1 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold hover:bg-white/25 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">લોગઆઉટ</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
                className="px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-sm hover:brightness-110"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>લોગીન</span>
              </button>
            )}

            <span 
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="font-black px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-mono shadow-sm hidden sm:inline"
            >
              કુલ: {totalCases}
            </span>
          </div>
        </div>
      </div>

      {/* Main Top Bar - Responsive Layout for PC & Mobile */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)' }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white flex items-center justify-center shadow-md ring-2 ring-blue-400/30 shrink-0"
          >
            <Scale className="w-5 h-5 text-amber-300 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
              નિગમના કેસોની સંપૂર્ણ વિગત
            </h1>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 hidden sm:block truncate">
              સુરત વિભાગ • લેબર શાખા કેસ સંચાલન પ્રણાલી
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav 
          style={{ backgroundColor: '#f1f5f9', border: '1.5px solid #cbd5e1' }}
          className="hidden xl:flex items-center gap-1 p-1 rounded-xl"
        >
          <button
            onClick={() => onSelectTab('HC CASE')}
            style={{
              backgroundColor: activeSheet === 'HC CASE' ? '#1d4ed8' : 'transparent',
              color: activeSheet === 'HC CASE' ? '#ffffff' : '#334155'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>હાઈકોર્ટ કેસ</span>
          </button>

          <button
            onClick={() => onSelectTab('LABOUR CASE')}
            style={{
              backgroundColor: activeSheet === 'LABOUR CASE' ? '#059669' : 'transparent',
              color: activeSheet === 'LABOUR CASE' ? '#ffffff' : '#334155'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>લેબર કોર્ટ કેસ</span>
          </button>

          <button
            onClick={() => onSelectTab('IT CASE')}
            style={{
              backgroundColor: activeSheet === 'IT CASE' ? '#7c3aed' : 'transparent',
              color: activeSheet === 'IT CASE' ? '#ffffff' : '#334155'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap"
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>ઔદ્યોગિક (IT)</span>
          </button>

          <button
            onClick={() => onSelectTab('DISPOSED ARCHIVE')}
            style={{
              backgroundColor: activeSheet === 'DISPOSED ARCHIVE' ? '#0d9488' : 'transparent',
              color: activeSheet === 'DISPOSED ARCHIVE' ? '#ffffff' : '#334155'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>નિકાલ</span>
          </button>

          <button
            onClick={() => onSelectTab('SUMMARY')}
            style={{
              backgroundColor: activeSheet === 'SUMMARY' ? '#d97706' : 'transparent',
              color: activeSheet === 'SUMMARY' ? '#ffffff' : '#334155'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>👤 એડવોકેટ</span>
          </button>

          <button
            onClick={() => onSelectTab('CALENDAR')}
            style={{
              backgroundColor: activeSheet === 'CALENDAR' ? '#ea580c' : 'transparent',
              color: activeSheet === 'CALENDAR' ? '#ffffff' : '#334155'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>📅 મુદત કેલેન્ડર</span>
          </button>
        </nav>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isAdmin ? (
            <>
              {/* Prominent Excel Upload Button */}
              <button
                onClick={onOpenExcelUpload}
                title="Excel File અપલોડ કરી કેસો અપડેટ કરો"
                style={{ backgroundColor: '#ffffff', color: '#047857', border: '2px solid #10b981' }}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-black rounded-xl hover:bg-emerald-50 transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span className="hidden sm:inline">Excel અપલોડ</span>
                <span className="sm:hidden">અપલોડ</span>
              </button>

              {/* Excel Download Dropdown Button */}
              <div className="relative">
                <div className="inline-flex rounded-xl shadow-md overflow-hidden">
                  <button
                    onClick={() => onExportExcel('all')}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#ffffff'
                    }}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.5]" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    style={{ backgroundColor: '#047857', color: '#ffffff', borderLeft: '1px solid rgba(255,255,255,0.3)' }}
                    className="px-2 sm:px-2.5 py-1.5 sm:py-2 hover:bg-emerald-800 transition-colors"
                    title="ડાઉનલોડ વિકલ્પો"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {showExportMenu && (
                  <div 
                    style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}
                    className="absolute right-0 mt-1.5 w-60 sm:w-64 rounded-2xl shadow-2xl py-1.5 z-40 text-xs text-slate-800 font-bold"
                    onClick={() => setShowExportMenu(false)}
                  >
                    <button
                      onClick={() => onExportExcel('all')}
                      className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 border-b border-slate-100"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>સંપૂર્ણ માસ્ટર એક્સેલ (બધી શીટ્સ)</span>
                    </button>
                    <button
                      onClick={() => onExportExcel('pending')}
                      className="w-full px-3.5 py-2 text-left hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 border-b border-slate-100"
                    >
                      <Landmark className="w-4 h-4 text-blue-600" />
                      <span>માત્ર પેન્ડિંગ કેસો એક્સેલ (HC, Labour, IT)</span>
                    </button>
                    <button
                      onClick={() => onExportExcel('disposed')}
                      className="w-full px-3.5 py-2 text-left hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 border-b border-slate-100"
                    >
                      <Archive className="w-4 h-4 text-teal-600" />
                      <span>નિકાલ થયેલ કેસો અલગ એક્સેલ</span>
                    </button>
                    <button
                      onClick={() => onExportExcel('current')}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-100 text-slate-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>હાલની શીટ ({activeSheet})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Add Case Button */}
              <button
                onClick={onOpenAddModal}
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)',
                  color: '#ffffff'
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black rounded-xl shadow-md hover:shadow-lg hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                <span className="hidden xs:inline">➕ નવો કેસ</span>
                <span className="xs:hidden">કેસ +</span>
              </button>
            </>
          ) : (
            <div 
              style={{ backgroundColor: '#f1f5f9', border: '1.5px solid #cbd5e1' }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>વાંચન મોડ (View Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Horizontal Scrollable Navigation Strip */}
      <div className="flex xl:hidden border-t border-slate-200 overflow-x-auto px-2 py-1.5 bg-slate-100 gap-1.5 scrollbar-none">
        <button
          onClick={() => onSelectTab('HC CASE')}
          style={{
            backgroundColor: activeSheet === 'HC CASE' ? '#1d4ed8' : '#ffffff',
            color: activeSheet === 'HC CASE' ? '#ffffff' : '#1e293b',
            border: '1.5px solid #cbd5e1'
          }}
          className="px-3 py-1.5 text-xs font-black rounded-lg whitespace-nowrap flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>હાઈકોર્ટ</span>
        </button>
        <button
          onClick={() => onSelectTab('LABOUR CASE')}
          style={{
            backgroundColor: activeSheet === 'LABOUR CASE' ? '#059669' : '#ffffff',
            color: activeSheet === 'LABOUR CASE' ? '#ffffff' : '#1e293b',
            border: '1.5px solid #cbd5e1'
          }}
          className="px-3 py-1.5 text-xs font-black rounded-lg whitespace-nowrap flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>લેબર કોર્ટ</span>
        </button>
        <button
          onClick={() => onSelectTab('IT CASE')}
          style={{
            backgroundColor: activeSheet === 'IT CASE' ? '#7c3aed' : '#ffffff',
            color: activeSheet === 'IT CASE' ? '#ffffff' : '#1e293b',
            border: '1.5px solid #cbd5e1'
          }}
          className="px-3 py-1.5 text-xs font-black rounded-lg whitespace-nowrap flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Gavel className="w-3.5 h-3.5" />
          <span>ઔદ્યોગિક (IT)</span>
        </button>
        <button
          onClick={() => onSelectTab('DISPOSED ARCHIVE')}
          style={{
            backgroundColor: activeSheet === 'DISPOSED ARCHIVE' ? '#0d9488' : '#ffffff',
            color: activeSheet === 'DISPOSED ARCHIVE' ? '#ffffff' : '#1e293b',
            border: '1.5px solid #cbd5e1'
          }}
          className="px-3 py-1.5 text-xs font-black rounded-lg whitespace-nowrap flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>નિકાલ</span>
        </button>
        <button
          onClick={() => onSelectTab('SUMMARY')}
          style={{
            backgroundColor: activeSheet === 'SUMMARY' ? '#d97706' : '#ffffff',
            color: activeSheet === 'SUMMARY' ? '#ffffff' : '#1e293b',
            border: '1.5px solid #cbd5e1'
          }}
          className="px-3 py-1.5 text-xs font-black rounded-lg whitespace-nowrap flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>એડવોકેટ</span>
        </button>
        <button
          onClick={() => onSelectTab('CALENDAR')}
          style={{
            backgroundColor: activeSheet === 'CALENDAR' ? '#ea580c' : '#ffffff',
            color: activeSheet === 'CALENDAR' ? '#ffffff' : '#1e293b',
            border: '1.5px solid #cbd5e1'
          }}
          className="px-3 py-1.5 text-xs font-black rounded-lg whitespace-nowrap flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>મુદત કેલેન્ડર</span>
        </button>
      </div>
    </header>
  );
};
