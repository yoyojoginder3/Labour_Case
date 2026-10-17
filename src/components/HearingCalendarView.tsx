import React, { useState, useMemo } from 'react';
import { SheetDataMap, SheetKey } from '../types/case';
import { extractDateFromStatus, getStatusCategory } from '../data/initialData';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Printer, 
  Landmark, 
  Scale, 
  Gavel, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

interface HearingItem {
  sheetKey: SheetKey;
  originalIndex: number;
  caseNo: string;
  fileNo: string;
  advocate: string;
  applicant: string;
  court: string;
  summary: string;
  status: string;
  rawDate: string; // e.g. "20/10/2026"
  parsedDate: Date | null;
  dayKey: string; // "YYYY-MM-DD"
}

interface HearingCalendarViewProps {
  data: SheetDataMap;
  onSelectCase: (sheetKey: SheetKey, originalIndex: number) => void;
}

// Helper to parse date strings like "20/10/2026", "20-10-2026", "08-10-2021"
function parseHearingDate(dateStr: string): { parsed: Date | null; dayKey: string } {
  if (!dateStr) return { parsed: null, dayKey: '' };
  
  // Replace - with /
  const clean = dateStr.replace(/-/g, '/').trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // 0-indexed
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    
    // Check validity
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, day);
      const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { parsed: d, dayKey };
    }
  }
  return { parsed: null, dayKey: '' };
}

export const HearingCalendarView: React.FC<HearingCalendarViewProps> = ({
  data,
  onSelectCase
}) => {
  // Current visible calendar month (Default: October 2026 since case data is centered around Oct 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 9 = October (0-indexed)
  
  // Selected date filter (dayKey e.g. "2026-10-20" or null for all)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>('2026-10-20');
  const [courtFilter, setCourtFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all scheduled hearings across HC, Labour, and IT cases
  const allHearings = useMemo(() => {
    const list: HearingItem[] = [];

    // 1. High Court Cases
    const hcRows = data['HC CASE'] || [];
    for (let i = 2; i < hcRows.length; i++) {
      const row = hcRows[i];
      if (!row || !row.some(c => c.trim())) continue;

      const status = row[10] || '';
      const dateStr = extractDateFromStatus(status);
      if (dateStr) {
        const { parsed, dayKey } = parseHearingDate(dateStr);
        list.push({
          sheetKey: 'HC CASE',
          originalIndex: i,
          caseNo: row[3] || row[1] || 'SCA',
          fileNo: row[1] || '',
          advocate: (row[4] || '').trim() || 'અનિર્ણિત',
          applicant: row[5] || '',
          court: 'હાઈકોર્ટ (HC)',
          summary: row[6] || '',
          status: status,
          rawDate: dateStr,
          parsedDate: parsed,
          dayKey
        });
      }
    }

    // 2. Labour Court Cases
    const labourRows = data['LABOUR CASE'] || [];
    for (let i = 2; i < labourRows.length; i++) {
      const row = labourRows[i];
      if (!row || !row.some(c => c.trim())) continue;

      const status = row[6] || '';
      const dateStr = extractDateFromStatus(status);
      if (dateStr) {
        const { parsed, dayKey } = parseHearingDate(dateStr);
        list.push({
          sheetKey: 'LABOUR CASE',
          originalIndex: i,
          caseNo: row[1] || 'રેફ. નં',
          fileNo: '',
          advocate: (row[3] || '').trim() || 'અનિર્ણિત',
          applicant: row[4] || '',
          court: `લેબર કોર્ટ (${row[2] || 'સુરત'})`,
          summary: row[5] || '',
          status: status,
          rawDate: dateStr,
          parsedDate: parsed,
          dayKey
        });
      }
    }

    // 3. Industrial Tribunal Cases
    const itRows = data['IT CASE'] || [];
    for (let i = 2; i < itRows.length; i++) {
      const row = itRows[i];
      if (!row || !row.some(c => c.trim())) continue;

      const status = row[6] || '';
      const dateStr = extractDateFromStatus(status);
      if (dateStr) {
        const { parsed, dayKey } = parseHearingDate(dateStr);
        list.push({
          sheetKey: 'IT CASE',
          originalIndex: i,
          caseNo: row[1] || 'રેફ. નં',
          fileNo: '',
          advocate: (row[3] || '').trim() || 'અનિર્ણિત',
          applicant: row[4] || '',
          court: `ઔદ્યોગિક અદાલત IT (${row[2] || 'સુરત'})`,
          summary: row[5] || '',
          status: status,
          rawDate: dateStr,
          parsedDate: parsed,
          dayKey
        });
      }
    }

    // Sort chronologically
    return list.sort((a, b) => {
      if (!a.parsedDate) return 1;
      if (!b.parsedDate) return -1;
      return a.parsedDate.getTime() - b.parsedDate.getTime();
    });
  }, [data]);

  // Map of hearings grouped by dayKey ("YYYY-MM-DD")
  const hearingsByDay = useMemo(() => {
    const map: Record<string, HearingItem[]> = {};
    for (const h of allHearings) {
      if (!h.dayKey) continue;
      if (!map[h.dayKey]) map[h.dayKey] = [];
      map[h.dayKey].push(h);
    }
    return map;
  }, [allHearings]);

  // Calendar matrix calculations for current month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days: Array<{ dayNum: number; dayKey: string; isCurrentMonth: boolean; count: number }> = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ dayNum: 0, dayKey: '', isCurrentMonth: false, count: 0 });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = hearingsByDay[dayKey]?.length || 0;
      days.push({ dayNum: d, dayKey, isCurrentMonth: true, count });
    }

    return days;
  }, [currentYear, currentMonth, hearingsByDay]);

  // Filtered hearings for the list view
  const activeHearings = useMemo(() => {
    return allHearings.filter((h) => {
      if (selectedDayKey && h.dayKey !== selectedDayKey) return false;
      if (courtFilter !== 'all' && h.sheetKey !== courtFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          h.caseNo.toLowerCase().includes(q) ||
          h.advocate.toLowerCase().includes(q) ||
          h.applicant.toLowerCase().includes(q) ||
          h.summary.toLowerCase().includes(q) ||
          h.rawDate.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allHearings, selectedDayKey, courtFilter, searchQuery]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const gujaratiMonths = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];

  const weekDayNames = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];

  const handlePrintDailyCauseList = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Vibrant Amber/Blue Gradient */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #d97706 100%)',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.35)'
        }}
        className="text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-amber-400/30"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span style={{ backgroundColor: '#fef08a', color: '#713f12' }} className="p-2 rounded-2xl shadow-md">
                <CalendarIcon className="w-6 h-6 stroke-[2.5]" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                કોર્ટ મુદત કેલેન્ડર & ડેઈલી કોઝ લિસ્ટ (Court Hearing Schedule)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-blue-100 font-semibold">
              GSRTC સુરત લેબર શાખા • તારીખ પ્રમાણે કોર્ટમાં જવા માટેના કેસોનું લાઈવ સમયપત્રક
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDayKey(null)}
              style={{
                backgroundColor: !selectedDayKey ? '#ffffff' : 'rgba(255,255,255,0.2)',
                color: !selectedDayKey ? '#1e3a8a' : '#ffffff',
                border: '2px solid rgba(255,255,255,0.4)'
              }}
              className="px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md hover:scale-105 active:scale-95"
            >
              બધી મુદતો ({allHearings.length})
            </button>

            <button
              onClick={handlePrintDailyCauseList}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff'
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>બોર્ડ પ્રિન્ટ કરો</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout: Calendar on Left, Daily Cause List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Month Calendar (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <div 
            style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}
            className="rounded-3xl p-4 sm:p-5 shadow-lg overflow-hidden"
          >
            {/* Calendar Month & Controls */}
            <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {gujaratiMonths[currentMonth]} {currentYear}
                </span>
                <span 
                  style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                  className="text-[11px] font-black px-2.5 py-0.5 rounded-full font-mono"
                >
                  {allHearings.filter(h => h.parsedDate && h.parsedDate.getMonth() === currentMonth && h.parsedDate.getFullYear() === currentYear).length} મુદત
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}
                  className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                  title="પાછલો મહિનો"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}
                  className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                  title="આગામી મહિનો"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 text-center my-2 text-xs font-black text-slate-500">
              {weekDayNames.map((w, idx) => (
                <div key={w} className={`py-1.5 ${idx === 0 ? 'text-rose-600' : ''}`}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, idx) => {
                if (!day.isCurrentMonth) {
                  return <div key={idx} className="h-11 sm:h-12" />;
                }

                const isSelected = selectedDayKey === day.dayKey;
                const hasHearings = day.count > 0;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayKey(day.dayKey)}
                    style={{
                      backgroundColor: isSelected
                        ? '#1d4ed8'
                        : hasHearings
                        ? '#fef3c7'
                        : '#f8fafc',
                      color: isSelected
                        ? '#ffffff'
                        : hasHearings
                        ? '#92400e'
                        : '#334155',
                      border: isSelected
                        ? '2px solid #1e40af'
                        : hasHearings
                        ? '2px solid #f59e0b'
                        : '1px solid #e2e8f0'
                    }}
                    className={`h-11 sm:h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all hover:scale-105 shadow-2xs ${
                      hasHearings ? 'font-black' : 'font-semibold'
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{day.dayNum}</span>
                    {hasHearings && (
                      <span 
                        style={{
                          backgroundColor: isSelected ? '#fde047' : '#ea580c',
                          color: isSelected ? '#0f172a' : '#ffffff'
                        }}
                        className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full mt-0.5 leading-none shadow-xs"
                      >
                        {day.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Presets Strip */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold">
              <span className="text-slate-500">ઝડપી તારીખ:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setCurrentMonth(9); // October
                    setCurrentYear(2026);
                    setSelectedDayKey('2026-10-15');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200"
                >
                  ૧૫/૧૦ (3)
                </button>
                <button
                  onClick={() => {
                    setCurrentMonth(9);
                    setCurrentYear(2026);
                    setSelectedDayKey('2026-10-20');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-900 hover:bg-orange-200"
                >
                  ૨૦/૧૦ (2)
                </button>
                <button
                  onClick={() => {
                    setCurrentMonth(9);
                    setCurrentYear(2026);
                    setSelectedDayKey('2026-10-23');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 hover:bg-blue-200"
                >
                  ૨૩/૧૦ (2)
                </button>
              </div>
            </div>
          </div>

          {/* Chronological Upcoming Timeline Cards */}
          <div 
            style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}
            className="rounded-3xl p-4 sm:p-5 shadow-lg space-y-3"
          >
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>આગામી તમામ મુદતો (Upcoming Timeline)</span>
            </h3>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {Object.keys(hearingsByDay)
                .sort()
                .map((dayKey) => {
                  const items = hearingsByDay[dayKey];
                  const first = items[0];
                  const isSel = selectedDayKey === dayKey;

                  return (
                    <div
                      key={dayKey}
                      onClick={() => setSelectedDayKey(dayKey)}
                      style={{
                        backgroundColor: isSel ? '#eff6ff' : '#f8fafc',
                        border: isSel ? '2px solid #3b82f6' : '1.5px solid #e2e8f0'
                      }}
                      className="p-2.5 rounded-2xl cursor-pointer hover:bg-blue-50/70 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          style={{ backgroundColor: '#fef08a', color: '#713f12', border: '1.5px solid #facc15' }}
                          className="px-2.5 py-1 rounded-xl text-xs font-mono font-black"
                        >
                          {first.rawDate}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {items.length} કેસ શેડ્યુલ થયેલ છે
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {items.map(it => it.caseNo).slice(0, 2).join(', ')}
                            {items.length > 2 ? '...' : ''}
                          </span>
                        </div>
                      </div>

                      <span 
                        style={{ backgroundColor: isSel ? '#1d4ed8' : '#e2e8f0', color: isSel ? '#ffffff' : '#1e293b' }}
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black font-mono shrink-0"
                      >
                        {items.length}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Column: Daily Cause List (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div 
            style={{ backgroundColor: '#ffffff', border: '2.5px solid #2563eb' }}
            className="rounded-3xl overflow-hidden shadow-xl"
          >
            {/* Header of Daily Cause List */}
            <div 
              style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)' }}
              className="p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <span style={{ backgroundColor: '#f59e0b', color: '#0f172a' }} className="p-2 rounded-xl">
                  <Clock className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    {selectedDayKey 
                      ? `તા. ${allHearings.find(h => h.dayKey === selectedDayKey)?.rawDate || selectedDayKey} ના રોજનું કોર્ટ બોર્ડ` 
                      : 'તમામ સુનાવણીઓની યાદી'}
                  </h3>
                  <p className="text-xs text-blue-100 font-semibold">
                    કોર્ટમાં હાજરી આપવા માટેની સંપૂર્ણ દૈનિક યાદી
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span 
                  style={{ backgroundColor: '#fef08a', color: '#713f12' }}
                  className="text-xs font-black px-3 py-1 rounded-full shadow-md font-mono"
                >
                  {activeHearings.length} કેસો
                </span>
              </div>
            </div>

            {/* Quick Filter & Search Bar for Cause List */}
            <div 
              style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}
              className="p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs"
            >
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="કેસ નં, એડવોકેટ કે પાર્ટી શોધો..."
                  style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1' }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={courtFilter}
                  onChange={(e) => setCourtFilter(e.target.value)}
                  style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1' }}
                  className="px-2.5 py-1.5 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  <option value="all">તમામ કોર્ટ</option>
                  <option value="HC CASE">હાઈકોર્ટ (HC)</option>
                  <option value="LABOUR CASE">લેબર કોર્ટ</option>
                  <option value="IT CASE">ઔદ્યોગિક (IT)</option>
                </select>
              </div>
            </div>

            {/* Hearings List */}
            <div className="p-4 sm:p-5 max-h-[620px] overflow-y-auto space-y-3.5 scrollbar-thin">
              {activeHearings.length === 0 ? (
                <div className="p-10 text-center text-slate-500 bg-amber-50/40 rounded-2xl border border-dashed border-amber-300">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-amber-500" />
                  <p className="text-base font-bold text-slate-800">પસંદ કરેલ તારીખે કોઈ મુદત નથી</p>
                  <p className="text-xs text-slate-500 mt-1">
                    ડાબી બાજુના કેલેન્ડરમાં હાઇલાઇટ થયેલી તારીખ પર ક્લિક કરો અથવા "બધી મુદતો" બટન દબાવો
                  </p>
                </div>
              ) : (
                activeHearings.map((item, idx) => {
                  const statusCat = getStatusCategory(item.status);
                  const isHC = item.sheetKey === 'HC CASE';
                  const isLabour = item.sheetKey === 'LABOUR CASE';

                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                      className="p-4 rounded-2xl hover:shadow-md hover:border-blue-400 transition-all space-y-2.5"
                    >
                      {/* Top Header of Case */}
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            style={{
                              backgroundColor: isHC ? '#dbeafe' : isLabour ? '#d1fae5' : '#f3e8ff',
                              color: isHC ? '#1e40af' : isLabour ? '#065f46' : '#6b21a8',
                              border: '1.5px solid currentColor'
                            }}
                            className="px-2.5 py-0.5 rounded-lg text-xs font-black inline-flex items-center gap-1 shadow-2xs"
                          >
                            {isHC ? <Landmark className="w-3.5 h-3.5" /> : isLabour ? <Scale className="w-3.5 h-3.5" /> : <Gavel className="w-3.5 h-3.5" />}
                            <span>{item.court}</span>
                          </span>

                          <span 
                            style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1.5px solid #bae6fd' }}
                            className="px-2.5 py-0.5 rounded-lg text-xs font-black font-mono"
                          >
                            કેસ નં: {item.caseNo}
                          </span>

                          {item.fileNo && (
                            <span className="text-[11px] font-bold text-slate-500 font-mono">
                              ફાઈલ: {item.fileNo}
                            </span>
                          )}
                        </div>

                        <span 
                          style={{ backgroundColor: '#fef08a', color: '#713f12', border: '1.5px solid #facc15' }}
                          className="px-2.5 py-1 rounded-xl text-xs font-mono font-black shrink-0 shadow-2xs"
                        >
                          {item.rawDate}
                        </span>
                      </div>

                      {/* Advocate and Employee Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200">
                          <span className="text-[10px] text-purple-700 font-bold block mb-0.5">
                            પેનલ એડવોકેટશ્રી:
                          </span>
                          <span className="font-black text-purple-950 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-purple-600" />
                            <span>{item.advocate}</span>
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
                          <span className="text-[10px] text-emerald-700 font-bold block mb-0.5">
                            કર્મચારી / અરજદાર પક્ષ:
                          </span>
                          <span className="font-bold text-emerald-950 line-clamp-1">
                            {item.applicant}
                          </span>
                        </div>
                      </div>

                      {/* Case Facts Summary */}
                      <div className="p-2.5 rounded-xl bg-yellow-50/60 border border-yellow-200 text-xs text-slate-800 leading-relaxed font-medium">
                        <span className="font-bold text-amber-900 block mb-0.5">કેસની ટૂંકી વિગત:</span>
                        {item.summary || <span className="text-slate-400 italic">કોઈ વિગત નથી</span>}
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span 
                            style={{
                              backgroundColor: statusCat.type === 'final_hearing' ? '#ffedd5' : '#e0f2fe',
                              color: statusCat.type === 'final_hearing' ? '#9a3412' : '#0369a1',
                              border: '1.5px solid currentColor'
                            }}
                            className="px-2.5 py-1 rounded-xl text-xs font-bold"
                          >
                            {item.status.split('\n')[0]}
                          </span>
                        </div>

                        <button
                          onClick={() => onSelectCase(item.sheetKey, item.originalIndex)}
                          style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold hover:brightness-110 shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <span>કેસ ફાઈલ જુઓ</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
