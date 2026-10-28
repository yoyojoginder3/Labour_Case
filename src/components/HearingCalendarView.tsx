import React, { useState, useMemo } from 'react';
import { SheetDataMap, SheetKey } from '../types/case';
import { 
  extractDateFromStatus, 
  extractDateFromRow, 
  detectSheetColumns, 
  getStatusCategory,
  gujaratiToEnglishDigits
} from '../data/initialData';
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

// Helper to parse date strings (e.g. "20/10/2026", "2026-10-20", "૨૧/૦૯/૨૦૨૬", "08-10-2021")
function parseHearingDate(dateStr: string): { parsed: Date | null; dayKey: string } {
  if (!dateStr) return { parsed: null, dayKey: '' };
  
  const clean = gujaratiToEnglishDigits(dateStr).replace(/[-.]/g, '/').trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    let day = 0;
    let month = 0;
    let year = 0;

    // Check if ISO format YYYY/MM/DD
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // 0-indexed
      year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
    }
    
    // Check validity
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(year, month, day);
      const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { parsed: d, dayKey };
    }
  }
  return { parsed: null, dayKey: '' };
}

const GUJARATI_MONTHS = [
  'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
  'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
];

const GUJARATI_FULL_DAY_NAMES = [
  'રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'
];

const WEEK_DAY_NAMES = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];

export const HearingCalendarView: React.FC<HearingCalendarViewProps> = ({
  data,
  onSelectCase
}) => {
  // Current real-world Today's Date
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth(); // 0-indexed (9 = October)
  const todayDate = today.getDate();
  const todayDayKey = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;
  const todayFormattedGujarati = `${todayDate} ${GUJARATI_MONTHS[todayMonth]} ${todayYear}, ${GUJARATI_FULL_DAY_NAMES[today.getDay()]}`;
  const todayShortDate = `${String(todayDate).padStart(2, '0')}/${String(todayMonth + 1).padStart(2, '0')}/${todayYear}`;

  // Current visible calendar month (Default: today's month & year)
  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);
  
  // Selected date filter (Default: today's date)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(todayDayKey);
  const [courtFilter, setCourtFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all scheduled hearings across HC, Labour, and IT cases
  const allHearings = useMemo(() => {
    const list: HearingItem[] = [];

    // 1. High Court Cases
    const hcRows = data['HC CASE'] || [];
    const hcCols = detectSheetColumns(hcRows[1], 'HC CASE');
    for (let i = 2; i < hcRows.length; i++) {
      const row = hcRows[i];
      if (!row || !row.some(c => c && c.trim())) continue;

      const status = (row[hcCols.statusCol] || row[row.length - 1] || '').trim();
      const dateStr = extractDateFromStatus(status) || extractDateFromRow(row, hcCols.statusCol);
      if (dateStr) {
        const { parsed, dayKey } = parseHearingDate(dateStr);
        let caseNo = (row[hcCols.caseNoCol] || '').trim();
        if (!caseNo) {
          // Look for case number pattern in first few columns
          for (let c = 1; c <= Math.min(row.length - 1, 4); c++) {
            if (row[c] && /\d+/.test(row[c])) {
              caseNo = row[c].trim();
              break;
            }
          }
        }
        if (!caseNo) caseNo = row[1] || 'SCA';

        list.push({
          sheetKey: 'HC CASE',
          originalIndex: i,
          caseNo,
          fileNo: hcCols.fileNoCol >= 0 ? (row[hcCols.fileNoCol] || '') : '',
          advocate: (row[hcCols.advCol] || '').trim() || 'અનિર્ણિત',
          applicant: row[hcCols.empCol] || '',
          court: 'હાઈકોર્ટ (HC)',
          summary: row[hcCols.summaryCol] || '',
          status: status || 'સુનાવણી મુદત',
          rawDate: dateStr,
          parsedDate: parsed,
          dayKey
        });
      }
    }

    // 2. Labour Court Cases
    const labourRows = data['LABOUR CASE'] || [];
    const labourCols = detectSheetColumns(labourRows[1], 'LABOUR CASE');
    for (let i = 2; i < labourRows.length; i++) {
      const row = labourRows[i];
      if (!row || !row.some(c => c && c.trim())) continue;

      const status = (row[labourCols.statusCol] || row[row.length - 1] || '').trim();
      const dateStr = extractDateFromStatus(status) || extractDateFromRow(row, labourCols.statusCol);
      if (dateStr) {
        const { parsed, dayKey } = parseHearingDate(dateStr);
        let caseNo = (row[labourCols.caseNoCol] || '').trim();
        if (!caseNo) caseNo = row[1] || 'રેફ. નં';

        const courtName = labourCols.courtCol >= 0 && row[labourCols.courtCol] ? row[labourCols.courtCol].trim() : 'સુરત';

        list.push({
          sheetKey: 'LABOUR CASE',
          originalIndex: i,
          caseNo,
          fileNo: '',
          advocate: (row[labourCols.advCol] || '').trim() || 'અનિર્ણિત',
          applicant: row[labourCols.empCol] || '',
          court: `લેબર કોર્ટ (${courtName})`,
          summary: row[labourCols.summaryCol] || '',
          status: status || 'સુનાવણી મુદત',
          rawDate: dateStr,
          parsedDate: parsed,
          dayKey
        });
      }
    }

    // 3. Industrial Tribunal Cases
    const itRows = data['IT CASE'] || [];
    const itCols = detectSheetColumns(itRows[1], 'IT CASE');
    for (let i = 2; i < itRows.length; i++) {
      const row = itRows[i];
      if (!row || !row.some(c => c && c.trim())) continue;

      const status = (row[itCols.statusCol] || row[row.length - 1] || '').trim();
      const dateStr = extractDateFromStatus(status) || extractDateFromRow(row, itCols.statusCol);
      if (dateStr) {
        const { parsed, dayKey } = parseHearingDate(dateStr);
        let caseNo = (row[itCols.caseNoCol] || '').trim();
        if (!caseNo) caseNo = row[1] || 'રેફ. નં';

        const courtName = itCols.courtCol >= 0 && row[itCols.courtCol] ? row[itCols.courtCol].trim() : 'સુરત';

        list.push({
          sheetKey: 'IT CASE',
          originalIndex: i,
          caseNo,
          fileNo: '',
          advocate: (row[itCols.advCol] || '').trim() || 'અનિર્ણિત',
          applicant: row[itCols.empCol] || '',
          court: `ઔદ્યોગિક અદાલત IT (${courtName})`,
          summary: row[itCols.summaryCol] || '',
          status: status || 'સુનાવણી મુદત',
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
    
    const days: Array<{
      dayNum: number;
      dayKey: string;
      isCurrentMonth: boolean;
      count: number;
      isToday: boolean;
    }> = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ dayNum: 0, dayKey: '', isCurrentMonth: false, count: 0, isToday: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = hearingsByDay[dayKey]?.length || 0;
      const isToday = dayKey === todayDayKey;
      days.push({ dayNum: d, dayKey, isCurrentMonth: true, count, isToday });
    }

    return days;
  }, [currentYear, currentMonth, hearingsByDay, todayDayKey]);

  // Hearings specifically on today's date
  const todayHearings = useMemo(() => {
    return hearingsByDay[todayDayKey] || [];
  }, [hearingsByDay, todayDayKey]);

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
      {/* Top Banner with Vibrant Gradient & Always-Visible Current Date */}
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

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(todayMonth);
                setCurrentYear(todayYear);
                setSelectedDayKey(todayDayKey);
              }}
              style={{
                backgroundColor: selectedDayKey === todayDayKey ? '#22c55e' : '#ffffff',
                color: selectedDayKey === todayDayKey ? '#ffffff' : '#065f46',
                border: '2px solid #22c55e'
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🎯 આજે ({todayShortDate})</span>
              {todayHearings.length > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {todayHearings.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedDayKey(null)}
              style={{
                backgroundColor: !selectedDayKey ? '#ffffff' : 'rgba(255,255,255,0.2)',
                color: !selectedDayKey ? '#1e3a8a' : '#ffffff',
                border: '2px solid rgba(255,255,255,0.4)'
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              બધી મુદતો ({allHearings.length})
            </button>

            <button
              type="button"
              onClick={handlePrintDailyCauseList}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff'
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>બોર્ડ પ્રિન્ટ કરો</span>
            </button>
          </div>
        </div>

        {/* Prominent Real-time Today Date Indicator Strip */}
        <div 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', border: '1.5px solid rgba(253, 224, 71, 0.5)' }}
          className="mt-4 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm backdrop-blur-xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400"></span>
            </span>
            <span className="text-amber-200 font-bold">આજની વર્તમાન તારીખ (Current Date):</span>
            <span className="text-white font-mono font-black text-sm sm:text-base bg-emerald-950/90 px-3 py-1 rounded-xl border border-emerald-400 shadow-inner">
              {todayFormattedGujarati}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-100">
            {todayHearings.length > 0 ? (
              <span className="bg-amber-500 text-slate-950 px-3 py-1 rounded-xl font-black shadow-xs">
                🚨 આજે {todayHearings.length} કેસોની કોર્ટ સુનાવણી છે!
              </span>
            ) : (
              <span className="bg-emerald-800/90 text-emerald-100 px-3 py-1 rounded-xl font-bold border border-emerald-400/40">
                ✅ આજે કોઈ કેસની કોર્ટ મુદત નથી
              </span>
            )}
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
            <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {GUJARATI_MONTHS[currentMonth]} {currentYear}
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
                  type="button"
                  onClick={() => {
                    setCurrentMonth(todayMonth);
                    setCurrentYear(todayYear);
                    setSelectedDayKey(todayDayKey);
                  }}
                  style={{
                    backgroundColor: currentMonth === todayMonth && currentYear === todayYear && selectedDayKey === todayDayKey ? '#059669' : '#ecfdf5',
                    color: currentMonth === todayMonth && currentYear === todayYear && selectedDayKey === todayDayKey ? '#ffffff' : '#047857',
                    border: '1.5px solid #10b981'
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-black shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  title="આજના મહિના અને તારીખ પર જાઓ"
                >
                  <span>🎯 આજે</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}
                  className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  title="પાછલો મહિનો"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}
                  className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  title="આગામી મહિનો"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 text-center my-2 text-xs font-black text-slate-500">
              {WEEK_DAY_NAMES.map((w, idx) => (
                <div key={w} className={`py-1.5 ${idx === 0 ? 'text-rose-600' : ''}`}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, idx) => {
                if (!day.isCurrentMonth) {
                  return <div key={idx} className="h-12 sm:h-14" />;
                }

                const isSelected = selectedDayKey === day.dayKey;
                const hasHearings = day.count > 0;
                const isToday = day.isToday;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayKey(day.dayKey)}
                    style={{
                      backgroundColor: isSelected
                        ? (isToday ? '#0f766e' : '#1d4ed8')
                        : isToday
                        ? '#dcfce7'
                        : hasHearings
                        ? '#fef3c7'
                        : '#f8fafc',
                      color: isSelected
                        ? '#ffffff'
                        : isToday
                        ? '#14532d'
                        : hasHearings
                        ? '#92400e'
                        : '#334155',
                      border: isSelected
                        ? `2.5px solid ${isToday ? '#34d399' : '#1e40af'}`
                        : isToday
                        ? '2.5px solid #16a34a'
                        : hasHearings
                        ? '2px solid #f59e0b'
                        : '1px solid #e2e8f0',
                      boxShadow: isToday ? '0 0 0 2px rgba(34, 197, 94, 0.4)' : undefined
                    }}
                    className={`h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all hover:scale-105 shadow-2xs ${
                      hasHearings || isToday ? 'font-black' : 'font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-mono">{day.dayNum}</span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" title="આજની તારીખ" />
                      )}
                    </div>

                    {/* Today Badge */}
                    {isToday && (
                      <span
                        style={{
                          backgroundColor: isSelected ? '#34d399' : '#16a34a',
                          color: isSelected ? '#064e3b' : '#ffffff'
                        }}
                        className="text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter leading-none mt-0.5 shadow-2xs"
                      >
                        આજે
                      </span>
                    )}

                    {/* Hearings Count Badge */}
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

            {/* Color Legend */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border-2 border-emerald-500 inline-block" />
                <span>આજની તારીખ (Today)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-100 border-2 border-amber-500 inline-block" />
                <span>મુદત કેસો (Hearings)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-600 border border-blue-800 inline-block" />
                <span>પસંદ કરેલ (Selected)</span>
              </div>
            </div>

            {/* Quick Presets Strip */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold">
              <span className="text-slate-500">ઝડપી તારીખ:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMonth(todayMonth);
                    setCurrentYear(todayYear);
                    setSelectedDayKey(todayDayKey);
                  }}
                  style={{
                    backgroundColor: selectedDayKey === todayDayKey ? '#059669' : '#dcfce7',
                    color: selectedDayKey === todayDayKey ? '#ffffff' : '#14532d',
                    border: '1.5px solid #16a34a'
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-black transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>📍 આજે ({todayShortDate})</span>
                  {todayHearings.length > 0 && (
                    <span className="bg-emerald-700 text-white px-1.5 rounded-full text-[10px]">
                      {todayHearings.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMonth(9); // October
                    setCurrentYear(2026);
                    setSelectedDayKey('2026-10-20');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-900 hover:bg-orange-200 cursor-pointer"
                >
                  ૨૦/૧૦ (2)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMonth(9);
                    setCurrentYear(2026);
                    setSelectedDayKey('2026-10-23');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 hover:bg-blue-200 cursor-pointer"
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                      {selectedDayKey === todayDayKey
                        ? `📍 આજની તારીખનું કોર્ટ બોર્ડ (${todayShortDate})`
                        : selectedDayKey 
                        ? `તા. ${allHearings.find(h => h.dayKey === selectedDayKey)?.rawDate || selectedDayKey} ના રોજનું કોર્ટ બોર્ડ` 
                        : 'તમામ સુનાવણીઓની યાદી'}
                    </h3>
                    {selectedDayKey === todayDayKey && (
                      <span style={{ backgroundColor: '#22c55e', color: '#ffffff' }} className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow-xs">
                        આજનું લાઈવ બોર્ડ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-100 font-semibold mt-0.5">
                    {selectedDayKey === todayDayKey ? todayFormattedGujarati : 'કોર્ટમાં હાજરી આપવા માટેની સંપૂર્ણ દૈનિક યાદી'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedDayKey !== todayDayKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMonth(todayMonth);
                      setCurrentYear(todayYear);
                      setSelectedDayKey(todayDayKey);
                    }}
                    style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                    className="px-3 py-1.5 rounded-xl text-xs font-black shadow-md hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>🎯 આજનું બોર્ડ જુઓ</span>
                  </button>
                )}
                <span 
                  style={{ backgroundColor: '#fef08a', color: '#713f12' }}
                  className="text-xs font-black px-3 py-1.5 rounded-full shadow-md font-mono"
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
                <div className="p-8 sm:p-10 text-center text-slate-500 bg-amber-50/50 rounded-2xl border-2 border-dashed border-amber-300 space-y-2.5">
                  <CalendarIcon className="w-12 h-12 mx-auto text-amber-500" />
                  <p className="text-base font-black text-slate-800">
                    {selectedDayKey === todayDayKey
                      ? `આજે (${todayFormattedGujarati}) કોઈ કેસની સુનાવણી નથી`
                      : 'પસંદ કરેલ તારીખે કોઈ મુદત નથી'}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {selectedDayKey === todayDayKey
                      ? 'આગામી તારીખની મુદતો જોવા માટે ડાબી બાજુ કેલેન્ડરમાં હાઇલાઇટ થયેલી તારીખ પર ક્લિક કરો અથવા "બધી મુદતો" બટન દબાવો.'
                      : 'ડાબી બાજુના કેલેન્ડરમાં હાઇલાઇટ થયેલી તારીખ પર ક્લિક કરો અથવા "બધી મુદતો" બટન દબાવો.'}
                  </p>
                  <div className="pt-2 flex justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedDayKey(null)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                    >
                      તમામ મુદતો જુઓ ({allHearings.length})
                    </button>
                  </div>
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
