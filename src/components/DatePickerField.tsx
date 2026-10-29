import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, CalendarDays, Check } from 'lucide-react';
import { gujaratiToEnglishDigits } from '../data/initialData';

interface DatePickerFieldProps {
  value: string;
  onChange: (formattedDate: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  inputStyle?: React.CSSProperties;
  showTodayBtn?: boolean;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
}

const GUJARATI_MONTHS = [
  'જાન્યુઆરી (Jan)',
  'ફેબ્રુઆરી (Feb)',
  'માર્ચ (Mar)',
  'એપ્રિલ (Apr)',
  'મે (May)',
  'જૂન (Jun)',
  'જુલાઈ (Jul)',
  'ઓગસ્ટ (Aug)',
  'સપ્ટેમ્બર (Sep)',
  'ઓક્ટોબર (Oct)',
  'નવેમ્બર (Nov)',
  'ડિસેમ્બર (Dec)'
];

const WEEK_DAYS = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];

/** Parses DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD into { day, month, year } */
function parseDateParts(dateStr: string): { day: number; month: number; year: number } | null {
  if (!dateStr) return null;
  const clean = gujaratiToEnglishDigits(dateStr).trim().replace(/[-.]/g, '/');
  const parts = clean.split('/');

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return { day: d, month: m, year: y };
    } else {
      // DD/MM/YYYY
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return { day: d, month: m, year: y };
    }
  }
  return null;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY પસંદ કરો...',
  label,
  className = '',
  inputStyle,
  showTodayBtn = true,
  minYear = 1950,
  maxYear = 2045,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const parsed = parseDateParts(value);

  const [viewMonth, setViewMonth] = useState<number>(parsed ? parsed.month : today.getMonth());
  const [viewYear, setViewYear] = useState<number>(parsed ? parsed.year : today.getFullYear());

  // Keep view synchronized when value changes from outside
  useEffect(() => {
    if (parsed) {
      setViewMonth(parsed.month);
      setViewYear(parsed.year);
    }
  }, [value]);

  // Click outside listener to close calendar popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => Math.max(minYear, prev - 1));
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => Math.min(maxYear, prev + 1));
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(viewMonth + 1).padStart(2, '0');
    const formatted = `${dd}/${mm}/${viewYear}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setViewMonth(today.getMonth());
    setViewYear(yyyy);
    onChange(`${dd}/${mm}/${yyyy}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Build calendar matrix for current viewMonth and viewYear
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const days: Array<{
    dayNum: number;
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      dayNum: prevMonthDays - i,
      isCurrentMonth: false,
      isSelected: false,
      isToday: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = parsed
      ? parsed.day === d && parsed.month === viewMonth && parsed.year === viewYear
      : false;
    const isToday =
      today.getDate() === d &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear;

    days.push({
      dayNum: d,
      isCurrentMonth: true,
      isSelected,
      isToday
    });
  }

  // Generate Year options array
  const yearOptions: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearOptions.push(y);
  }

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`}>
      {label && (
        <label className="block text-xs font-black text-slate-900 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{label}</span>
          </span>
          {showTodayBtn && !disabled && (
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[10px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
            >
              આજની તારીખ
            </button>
          )}
        </label>
      )}

      {/* Input Display Bar */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle || {
            backgroundColor: '#ffffff',
            border: '1.5px solid #94a3b8'
          }}
          className="w-full text-xs sm:text-sm pl-9 pr-24 py-2 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer"
        />

        {/* Left Calendar Icon: Click to open/toggle */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          title="કેલેન્ડર ખોલવા ક્લિક કરો (Open Calendar)"
          className="absolute left-2 text-blue-600 hover:text-blue-800 transition-colors p-1 cursor-pointer disabled:opacity-50"
        >
          <CalendarDays className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Right Controls: Clear (X) + Calendar Button */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="તારીખ સાફ કરો (Clear)"
              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          {/* Interactive Toggle Button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            disabled={disabled}
            style={{
              backgroundColor: isOpen ? '#1d4ed8' : '#eff6ff',
              color: isOpen ? '#ffffff' : '#1d4ed8',
              border: '1px solid #bfdbfe'
            }}
            className="px-2 py-1 rounded-lg text-[11px] font-black hover:bg-blue-600 hover:text-white flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="કેલેન્ડરમાંથી તારીખ પસંદ કરો"
          >
            <span>📅</span>
            <span>{isOpen ? 'બંધ' : 'પસંદ'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* INTERACTIVE POPUP CALENDAR DROPDOWN */}
      {/* ============================================================== */}
      {isOpen && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '2px solid #2563eb',
            boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.25), 0 0 15px rgba(37, 99, 235, 0.2)'
          }}
          className="absolute z-50 left-0 mt-1 w-72 sm:w-80 rounded-2xl p-3 text-slate-900 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Controls: Month & Year Selectors + Arrows */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="પાછલો મહિનો"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}
                className="px-2 py-1 text-xs font-black rounded-lg border focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {GUJARATI_MONTHS.map((mName, idx) => (
                  <option key={idx} value={idx}>
                    {mName}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}
                className="px-2 py-1 text-xs font-black rounded-lg border focus:ring-2 focus:ring-blue-500 cursor-pointer font-mono"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              title="આગલો મહિનો"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-black text-slate-600 border-b border-slate-100">
            {WEEK_DAYS.map((w, idx) => (
              <div key={w} className={idx === 0 ? 'text-rose-600' : ''}>
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1.5">
            {days.map((d, index) => {
              if (!d.isCurrentMonth) {
                return (
                  <div
                    key={`prev-${index}`}
                    className="h-8 flex items-center justify-center text-xs font-semibold text-slate-300 pointer-events-none"
                  >
                    {d.dayNum}
                  </div>
                );
              }

              let btnStyle: React.CSSProperties = {};
              let btnClass = 'text-slate-800 hover:bg-blue-100 hover:text-blue-900';

              if (d.isSelected) {
                btnStyle = { backgroundColor: '#1d4ed8', color: '#ffffff' };
                btnClass = 'shadow-xs font-black scale-105';
              } else if (d.isToday) {
                btnStyle = { backgroundColor: '#fef08a', color: '#713f12', border: '1.5px solid #eab308' };
                btnClass = 'font-black';
              }

              return (
                <button
                  key={`day-${d.dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(d.dayNum)}
                  style={btnStyle}
                  className={`h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${btnClass}`}
                >
                  {d.dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Controls */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-black">
            <button
              type="button"
              onClick={handleSetToday}
              style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}
              className="px-2.5 py-1 rounded-lg hover:bg-blue-200 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>⭐</span>
              <span>આજે</span>
            </button>

            <div className="flex items-center gap-1.5">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{ backgroundColor: '#fff1f2', color: '#be123c' }}
                  className="px-2.5 py-1 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                >
                  સાફ કરો
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                બંધ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
