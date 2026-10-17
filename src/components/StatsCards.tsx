import React from 'react';
import { SheetKey } from '../types/case';
import { Landmark, Scale, Gavel, Archive, Layers, Calendar as CalendarIcon } from 'lucide-react';

interface StatsProps {
  hcCount: number;
  labourCount: number;
  itCount: number;
  finalHearingCount: number;
  disposedCount: number;
  activeSheet: SheetKey | 'SUMMARY' | 'CALENDAR';
  onSelectTab: (tab: SheetKey | 'SUMMARY' | 'CALENDAR') => void;
  onFilterStatus?: (status: string) => void;
}

export const StatsCards: React.FC<StatsProps> = ({
  hcCount,
  labourCount,
  itCount,
  finalHearingCount,
  disposedCount,
  activeSheet,
  onSelectTab,
}) => {
  const total = hcCount + labourCount + itCount;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-4">
      {/* 1. Total Cases (Royal Blue / Indigo Gradient) */}
      <div 
        onClick={() => onSelectTab('SUMMARY')}
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: '#ffffff',
          borderColor: activeSheet === 'SUMMARY' ? '#fde047' : '#3b82f6'
        }}
        className="card-grad-total px-3 py-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02] border-2"
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold mb-0.5 opacity-90">
          <span>કુલ કેસો</span>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-white">
            <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight">
          {total}
        </div>
        <div className="text-[10px] sm:text-[11px] font-semibold mt-0.5 opacity-90 truncate">
          એડવોકેટ લિસ્ટ 👤
        </div>
      </div>

      {/* 2. High Court (Vibrant Cobalt Blue Gradient) */}
      <div
        onClick={() => onSelectTab('HC CASE')}
        style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)',
          color: '#ffffff',
          borderColor: activeSheet === 'HC CASE' ? '#fde047' : '#38bdf8'
        }}
        className="card-grad-hc px-3 py-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02] border-2"
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold mb-0.5 opacity-90">
          <span>હાઈકોર્ટ કેસ</span>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-white">
            <Landmark className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tabular-nums">
          {hcCount}
        </div>
        <div className="text-[10px] sm:text-[11px] font-semibold mt-0.5 opacity-90 truncate">
          SCA / LPA કેસ
        </div>
      </div>

      {/* 3. Labour Court (Vibrant Emerald Green Gradient) */}
      <div
        onClick={() => onSelectTab('LABOUR CASE')}
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)',
          color: '#ffffff',
          borderColor: activeSheet === 'LABOUR CASE' ? '#fde047' : '#34d399'
        }}
        className="card-grad-labour px-3 py-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02] border-2"
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold mb-0.5 opacity-90">
          <span>લેબર કોર્ટ</span>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-white">
            <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tabular-nums">
          {labourCount}
        </div>
        <div className="text-[10px] sm:text-[11px] font-semibold mt-0.5 opacity-90 truncate">
          સુરત / અમદાવાદ
        </div>
      </div>

      {/* 4. Industrial Tribunal IT (Vibrant Violet / Purple Gradient) */}
      <div
        onClick={() => onSelectTab('IT CASE')}
        style={{
          background: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #c084fc 100%)',
          color: '#ffffff',
          borderColor: activeSheet === 'IT CASE' ? '#fde047' : '#c084fc'
        }}
        className="card-grad-it px-3 py-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02] border-2"
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold mb-0.5 opacity-90">
          <span>ઔદ્યોગિક (IT)</span>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-white">
            <Gavel className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tabular-nums">
          {itCount}
        </div>
        <div className="text-[10px] sm:text-[11px] font-semibold mt-0.5 opacity-90 truncate">
          ટ્રિબ્યુનલ
        </div>
      </div>

      {/* 5. Next Hearings / Calendar (Sunset Orange Gradient) */}
      <div
        onClick={() => onSelectTab('CALENDAR')}
        style={{
          background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f59e0b 100%)',
          color: '#ffffff',
          borderColor: activeSheet === 'CALENDAR' ? '#fde047' : '#fdba74'
        }}
        className="card-grad-hearing px-3 py-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-2"
        title="કોર્ટ મુદત કેલેન્ડર ખોલવા ક્લિક કરો"
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold mb-0.5 opacity-90">
          <span>મુદત કેલેન્ડર</span>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-white animate-pulse">
            <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tabular-nums">
          {finalHearingCount}
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold mt-0.5 opacity-95 truncate">
          સુનાવણી 📅
        </div>
      </div>

      {/* 6. Disposed Archive (Jade Green / Archive Gradient) */}
      <div
        onClick={() => onSelectTab('DISPOSED ARCHIVE')}
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
          color: '#ffffff',
          borderColor: activeSheet === 'DISPOSED ARCHIVE' ? '#fde047' : '#6ee7b7'
        }}
        className="card-grad-disposed px-3 py-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-2"
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold mb-0.5 opacity-90">
          <span>નિકાલ</span>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-white">
            <Archive className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tabular-nums">
          {disposedCount}
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold mt-0.5 opacity-95 truncate">
          ચુકાદો / નિકાલ
        </div>
      </div>
    </div>
  );
};
