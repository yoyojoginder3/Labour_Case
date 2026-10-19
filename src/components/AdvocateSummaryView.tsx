import React from 'react';
import { SheetDataMap, SheetKey } from '../types/case';
import { extractDateFromStatus, getStatusCategory, isInvalidAdvocateName, normalizeAdvocateName, isHeaderRow } from '../data/initialData';
import { User, Calendar, ExternalLink, Scale, CheckCircle2, Clock } from 'lucide-react';

interface AdvocateSummaryViewProps {
  data: SheetDataMap;
  onSelectAdvocate: (advocateName: string, sheetKey?: SheetKey) => void;
}

interface AdvocateRow {
  name: string;
  total: number;
  hcCount: number;
  labourCount: number;
  itCount: number;
  disposedCount: number;
  pendingCount: number;
}

interface CauseListItem {
  sheetKey: SheetKey;
  caseNo: string;
  advocate: string;
  applicant: string;
  court: string;
  hearingDate: string;
  status: string;
  originalIndex: number;
}

const ADVOCATE_THEMES: Record<string, {
  border: string;
  cardBg: string;
  avatarBg: string;
  btnBg: string;
  tagColor: string;
}> = {
  'સેજલ માંડવીયા': {
    border: '#6366f1',
    cardBg: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)',
    avatarBg: '#4f46e5',
    btnBg: '#4f46e5',
    tagColor: '#3730a3'
  },
  'હેમંત મુન્સા': {
    border: '#f59e0b',
    cardBg: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
    avatarBg: '#d97706',
    btnBg: '#d97706',
    tagColor: '#92400e'
  },
  'હિમેશ નાયડું': {
    border: '#06b6d4',
    cardBg: 'linear-gradient(135deg, #ecfeff 0%, #ffffff 100%)',
    avatarBg: '#0891b2',
    btnBg: '#0891b2',
    tagColor: '#155e75'
  },
  'વ્યોમા ઝવેરી': {
    border: '#f43f5e',
    cardBg: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
    avatarBg: '#e11d48',
    btnBg: '#e11d48',
    tagColor: '#9f1239'
  },
  'ટી. એલ. હાલારી': {
    border: '#10b981',
    cardBg: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
    avatarBg: '#059669',
    btnBg: '#059669',
    tagColor: '#065f46'
  },
  'પી.એફ. ઝવેરી': {
    border: '#14b8a6',
    cardBg: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)',
    avatarBg: '#0d9488',
    btnBg: '#0d9488',
    tagColor: '#115e59'
  },
  'રૂતુરાજ મીના': {
    border: '#a855f7',
    cardBg: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
    avatarBg: '#7c3aed',
    btnBg: '#7c3aed',
    tagColor: '#6b21a8'
  },
  'હાર્દિક રાવલ': {
    border: '#3b82f6',
    cardBg: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
    avatarBg: '#2563eb',
    btnBg: '#2563eb',
    tagColor: '#1e40af'
  },
  'રાકેશ પટેલ': {
    border: '#f97316',
    cardBg: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
    avatarBg: '#ea580c',
    btnBg: '#ea580c',
    tagColor: '#9a3412'
  }
};

export const AdvocateSummaryView: React.FC<AdvocateSummaryViewProps> = ({
  data,
  onSelectAdvocate
}) => {
  const advocateMap: Record<string, AdvocateRow> = {};
  const causeList: CauseListItem[] = [];

  const processSheet = (sheetKey: SheetKey, advCol: number, caseCol: number, appCol: number, statusCol: number, courtCol?: number) => {
    const rows = data[sheetKey] || [];
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.some(c => c.trim()) || isHeaderRow(row)) continue;
      const rawAdv = row[advCol] || '';
      if (isInvalidAdvocateName(rawAdv)) continue;
      const advName = normalizeAdvocateName(rawAdv) || 'અનિર્ણિત / અન્ય';
      const status = row[statusCol] || '';
      const isDisposed = status.toLowerCase().includes('disposed') || status.toLowerCase().includes('decision');
      const date = extractDateFromStatus(status);

      if (!advocateMap[advName]) {
        advocateMap[advName] = {
          name: advName,
          total: 0,
          hcCount: 0,
          labourCount: 0,
          itCount: 0,
          disposedCount: 0,
          pendingCount: 0
        };
      }

      advocateMap[advName].total += 1;
      if (sheetKey === 'HC CASE') advocateMap[advName].hcCount += 1;
      if (sheetKey === 'LABOUR CASE') advocateMap[advName].labourCount += 1;
      if (sheetKey === 'IT CASE') advocateMap[advName].itCount += 1;

      if (isDisposed) {
        advocateMap[advName].disposedCount += 1;
      } else {
        advocateMap[advName].pendingCount += 1;
      }

      if (date) {
        causeList.push({
          sheetKey,
          caseNo: row[caseCol] || row[1] || 'અજ્ઞાત',
          advocate: advName,
          applicant: row[appCol] || '-',
          court: courtCol ? row[courtCol] : 'હાઈકોર્ટ (HC)',
          hearingDate: date,
          status,
          originalIndex: i
        });
      }
    }
  };

  processSheet('HC CASE', 4, 3, 5, 10);
  processSheet('LABOUR CASE', 3, 1, 4, 6, 2);
  processSheet('IT CASE', 3, 1, 4, 6, 2);

  const advocates = Object.values(advocateMap).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Big Colorful Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #7c3aed 100%)',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
        }}
        className="text-white rounded-3xl p-6 shadow-xl border-2 border-indigo-400/30"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ backgroundColor: '#f59e0b', color: '#0f172a' }} className="p-1.5 rounded-lg">
                <Scale className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                નિગમ પેનલ એડવોકેટ્સ (Advocates & Cases)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-indigo-100 font-semibold">
              સુરત વિભાગ હેઠળના તમામ એડવોકેટશ્રીઓ અને તેમના હાઈકોર્ટ / લેબર કોર્ટ કેસોની સંપૂર્ણ માહિતી
            </p>
          </div>
          <div 
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}
            className="flex items-center gap-3 px-5 py-2.5 rounded-2xl backdrop-blur-md"
          >
            <span className="text-xs text-white font-bold">કુલ પેનલ એડવોકેટ્સ:</span>
            <span className="font-mono text-3xl font-black text-amber-300 tabular-nums">
              {advocates.length}
            </span>
          </div>
        </div>
      </div>

      {/* Advocates Grid with Distinct Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {advocates.map((adv) => {
          const theme = ADVOCATE_THEMES[adv.name] || {
            border: '#94a3b8',
            cardBg: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            avatarBg: '#475569',
            btnBg: '#475569',
            tagColor: '#1e293b'
          };

          return (
            <div
              key={adv.name}
              style={{
                background: theme.cardBg,
                border: `2.5px solid ${theme.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
              className="rounded-2xl p-5 hover:shadow-2xl transition-all flex flex-col justify-between hover:scale-[1.02]"
            >
              <div>
                {/* Header Strip of Advocate Card */}
                <div 
                  style={{ borderBottom: '2px solid rgba(0,0,0,0.06)' }}
                  className="flex items-start justify-between gap-3 pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: theme.avatarBg }}
                      className="w-11 h-11 rounded-2xl text-white flex items-center justify-center font-bold text-sm shadow-md"
                    >
                      <User className="w-5 h-5 text-white stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 style={{ color: theme.tagColor }} className="font-black text-base sm:text-lg">
                        {adv.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-500">નિગમ પેનલ એડવોકેટ</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span 
                      style={{ color: theme.tagColor }}
                      className="text-2xl sm:text-3xl font-black font-mono tabular-nums block"
                    >
                      {adv.total}
                    </span>
                    <span className="text-[11px] font-black text-slate-500">કુલ કેસો</span>
                  </div>
                </div>

                {/* Case Counts Breakdown Boxes with Rich Colors */}
                <div className="grid grid-cols-3 gap-2.5 my-3.5 text-center">
                  <div 
                    style={{ backgroundColor: '#dbeafe', border: '1.5px solid #93c5fd' }}
                    className="p-2.5 rounded-xl shadow-2xs"
                  >
                    <span style={{ color: '#1e40af' }} className="text-[11px] font-black block">
                      હાઈકોર્ટ
                    </span>
                    <span style={{ color: '#1e3a8a' }} className="font-black font-mono tabular-nums text-base">
                      {adv.hcCount}
                    </span>
                  </div>

                  <div 
                    style={{ backgroundColor: '#d1fae5', border: '1.5px solid #6ee7b7' }}
                    className="p-2.5 rounded-xl shadow-2xs"
                  >
                    <span style={{ color: '#065f46' }} className="text-[11px] font-black block">
                      લેબર કોર્ટ
                    </span>
                    <span style={{ color: '#064e3b' }} className="font-black font-mono tabular-nums text-base">
                      {adv.labourCount}
                    </span>
                  </div>

                  <div 
                    style={{ backgroundColor: '#f3e8ff', border: '1.5px solid #c084fc' }}
                    className="p-2.5 rounded-xl shadow-2xs"
                  >
                    <span style={{ color: '#6b21a8' }} className="text-[11px] font-black block">
                      ઔદ્યોગિક
                    </span>
                    <span style={{ color: '#581c87' }} className="font-black font-mono tabular-nums text-base">
                      {adv.itCount}
                    </span>
                  </div>
                </div>

                {/* Status Split Indicators */}
                <div 
                  style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1' }}
                  className="flex items-center justify-between text-xs py-2 px-3 rounded-xl font-bold shadow-2xs"
                >
                  <div className="flex items-center gap-1.5" style={{ color: '#0369a1' }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>પેન્ડિંગ: <strong className="font-mono text-sm">{adv.pendingCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: '#15803d' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>નિકાલ: <strong className="font-mono text-sm">{adv.disposedCount}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div 
                style={{ borderTop: '2px solid rgba(0,0,0,0.06)' }}
                className="mt-4 pt-3"
              >
                <button
                  onClick={() => onSelectAdvocate(adv.name)}
                  style={{
                    backgroundColor: theme.btnBg,
                    color: '#ffffff'
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-black rounded-xl transition-all shadow-md hover:brightness-110 active:scale-95"
                >
                  <span>કેસોની યાદી જુઓ ({adv.total})</span>
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Hearings / Cause List Table with Warm Sunset Gradient Header */}
      <div 
        style={{ backgroundColor: '#ffffff', border: '2.5px solid #f59e0b' }}
        className="rounded-3xl overflow-hidden shadow-xl"
      >
        <div 
          style={{ background: 'linear-gradient(90deg, #ea580c 0%, #f59e0b 100%)' }}
          className="px-6 py-4 text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-amber-100" />
            <h3 className="font-black text-base sm:text-xl">
              કોર્ટ મુદત / સુનાવણી કોઝ લિસ્ટ (Court Hearing Schedule)
            </h3>
          </div>
          <span 
            style={{ backgroundColor: '#ffffff', color: '#b45309' }}
            className="text-xs font-black px-3.5 py-1 rounded-full shadow-md"
          >
            કુલ {causeList.length} સુનાવણીઓ
          </span>
        </div>

        <div className="overflow-x-auto max-h-96 scrollbar-thin">
          <table className="w-full text-left text-xs sm:text-[13px] border-collapse">
            <thead style={{ backgroundColor: '#1e293b', color: '#ffffff' }} className="sticky top-0">
              <tr>
                <th className="px-3.5 py-3 font-extrabold">સુનાવણી તારીખ</th>
                <th className="px-3.5 py-3 font-extrabold">કોર્ટ / વિભાગ</th>
                <th className="px-3.5 py-3 font-extrabold">કેસ નંબર</th>
                <th className="px-3.5 py-3 font-extrabold">એડવોકેટ</th>
                <th className="px-3.5 py-3 font-extrabold">પાર્ટી / કર્મચારી</th>
                <th className="px-3.5 py-3 font-extrabold">હાલનું સ્ટેટસ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {causeList.map((item, idx) => {
                const statusCat = getStatusCategory(item.status);
                const advTheme = ADVOCATE_THEMES[item.advocate] || {
                  avatarBg: '#475569',
                  tagColor: '#1e293b',
                  btnBg: '#475569'
                };

                return (
                  <tr
                    key={idx}
                    className="hover:bg-amber-50/60 transition-colors"
                  >
                    <td 
                      style={{ backgroundColor: '#fefce8' }}
                      className="px-3.5 py-2.5 font-mono font-black text-amber-950 whitespace-nowrap"
                    >
                      <span 
                        style={{ backgroundColor: '#fef08a', color: '#713f12', border: '1.5px solid #facc15' }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold shadow-2xs"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-800" />
                        <span>{item.hearingDate}</span>
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-bold">
                      <span 
                        style={{
                          backgroundColor: item.sheetKey === 'HC CASE' ? '#dbeafe' : item.sheetKey === 'LABOUR CASE' ? '#d1fae5' : '#f3e8ff',
                          color: item.sheetKey === 'HC CASE' ? '#1e40af' : item.sheetKey === 'LABOUR CASE' ? '#065f46' : '#6b21a8',
                          border: '1px solid currentColor'
                        }}
                        className="px-2 py-0.5 rounded-md font-bold"
                      >
                        {item.court}
                      </span>
                    </td>
                    <td 
                      style={{ backgroundColor: '#f0f9ff', color: '#0369a1' }}
                      className="px-3.5 py-2.5 font-black text-sm"
                    >
                      {item.caseNo}
                    </td>
                    <td className="px-3.5 py-2.5 font-black" style={{ color: advTheme.tagColor }}>
                      <span 
                        style={{ backgroundColor: '#ffffff', border: `1.5px solid ${advTheme.btnBg}` }}
                        className="px-2 py-0.5 rounded-md shadow-2xs"
                      >
                        {item.advocate}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-800 font-semibold max-w-xs truncate">
                      {item.applicant}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        style={{
                          backgroundColor: statusCat.type === 'final_hearing' ? '#ffedd5' : statusCat.type === 'disposed' ? '#d1fae5' : '#e0f2fe',
                          color: statusCat.type === 'final_hearing' ? '#9a3412' : statusCat.type === 'disposed' ? '#065f46' : '#0369a1',
                          border: '1.5px solid currentColor'
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold"
                      >
                        <span className={`w-2 h-2 rounded-full ${statusCat.dotClass}`} />
                        <span>{statusCat.label.split(' ')[0]}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
