import React, { useState } from 'react';
import { SheetKey } from '../types/case';
import { Archive, Download, Search, CheckCircle2, RotateCcw, Trash2, Eye, Calendar, User, Building2, Scale, Gavel } from 'lucide-react';

interface DisposedArchiveViewProps {
  rows: string[][];
  headers: string[];
  onRestoreCase: (archiveIndex: number) => void;
  onDeleteArchiveCase: (archiveIndex: number) => void;
  onExportDisposedExcel: () => void;
  isAdmin: boolean;
}

export const DisposedArchiveView: React.FC<DisposedArchiveViewProps> = ({
  rows,
  headers,
  onRestoreCase,
  onDeleteArchiveCase,
  onExportDisposedExcel,
  isAdmin
}) => {
  const [search, setSearch] = useState('');
  const [courtFilter, setCourtFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState<{ index: number; data: string[] } | null>(null);

  // Extract case rows (excluding 2 title/header rows)
  const caseRows = rows.slice(2);

  const filteredRows = caseRows
    .map((row, idx) => ({ originalIndex: idx + 2, data: row }))
    .filter(({ data }) => {
      const query = search.toLowerCase().trim();
      if (query) {
        const fullText = data.join(' ').toLowerCase();
        if (!fullText.includes(query)) return false;
      }
      if (courtFilter) {
        const court = (data[1] || '').trim();
        if (court !== courtFilter) return false;
      }
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Top Banner with Rich Green / Emerald Gradient */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #0f766e 100%)',
          boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)'
        }}
        className="text-white rounded-3xl p-6 shadow-xl border-2 border-emerald-400/30"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ backgroundColor: '#fef08a', color: '#713f12' }} className="p-2 rounded-xl">
                <Archive className="w-6 h-6 stroke-[2.5]" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                નિકાલ થયેલ કેસો (Disposed Cases)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 font-semibold mt-1">
              જે કેસોનો આખરી ચુકાદો આવી ગયો છે અને મૂળ પેન્ડિંગ લિસ્ટમાંથી હટાવી અલગ રાખવામાં આવ્યા છે
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}
              className="px-4 py-2 rounded-2xl text-center backdrop-blur-md"
            >
              <span className="text-[11px] font-bold block text-emerald-100">કુલ નિકાલ કેસો</span>
              <span className="font-mono text-2xl font-black text-white tabular-nums">
                {caseRows.length}
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={onExportDisposedExcel}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff'
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>નિકાલ એક્સેલ ડાઉનલોડ (.xlsx)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div 
        style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}
        className="p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="નિકાલ કેસ શોધો (પાર્ટી, કેસ નં, એડવોકેટ, તારીખ...)"
            style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac' }}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            style={{ backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1' }}
            className="px-3 py-2 text-xs font-bold rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">તમામ મૂળ કોર્ટ</option>
            <option value="HC CASE">હાઈકોર્ટ (HC)</option>
            <option value="LABOUR CASE">લેબર કોર્ટ</option>
            <option value="IT CASE">ઔદ્યોગિક (IT)</option>
          </select>

          <span className="text-xs font-bold text-slate-600 shrink-0">
            પરિણામ: <strong className="text-emerald-700 font-mono text-sm">{filteredRows.length}</strong>
          </span>
        </div>
      </div>

      {/* Disposed Cases Table */}
      <div 
        style={{ backgroundColor: '#ffffff', border: '2.5px solid #059669' }}
        className="rounded-3xl overflow-hidden shadow-xl"
      >
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] min-h-[380px] scrollbar-thin">
          <table className="w-full text-left text-xs sm:text-[13px] border-collapse">
            <thead style={{ backgroundColor: '#064e3b', color: '#ffffff' }} className="sticky top-0 z-10 shadow-md">
              <tr>
                <th style={{ backgroundColor: '#0f172a', color: '#fde047' }} className="px-3 py-3.5 text-center font-black w-14 shrink-0">
                  ક્રમ
                </th>
                <th className="px-3.5 py-3.5 font-extrabold whitespace-nowrap">મૂળ કોર્ટ</th>
                <th className="px-3.5 py-3.5 font-extrabold whitespace-nowrap">કેસ / SCA નં.</th>
                <th className="px-3.5 py-3.5 font-extrabold whitespace-nowrap">પેનલ એડવોકેટ</th>
                <th className="px-3.5 py-3.5 font-extrabold whitespace-nowrap">કર્મચારી / અરજદાર</th>
                <th className="px-3.5 py-3.5 font-extrabold">કેસની ટૂંકી વિગત</th>
                <th className="px-3.5 py-3.5 font-extrabold whitespace-nowrap">ચુકાદો / નિકાલ તારીખ</th>
                <th className="px-3.5 py-3.5 font-extrabold text-center w-28 shrink-0">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 bg-emerald-50/20">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                    <p className="text-base font-bold text-slate-800">નિકાલ લિસ્ટમાં કોઈ કેસ નથી</p>
                    <p className="text-xs text-slate-500 mt-1">
                      કોઈપણ કેસ નિકાલ થાય ત્યારે તેને 'નિકાલમાં ખસેડો' બટન દબાવવાથી તે અહીં સુરક્ષિત થઈ જશે
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ originalIndex, data: row }, rIdx) => {
                  const originalCourt = row[1] || 'HC CASE';
                  const caseNo = row[2] || '';
                  const advocate = row[3] || '';
                  const applicant = row[4] || '';
                  const summary = row[5] || '';
                  const decisionInfo = row[6] || '';

                  return (
                    <tr 
                      key={originalIndex}
                      className="hover:bg-emerald-50/60 transition-colors"
                    >
                      <td 
                        style={{ backgroundColor: '#e2e8f0', color: '#0f172a' }}
                        className="px-2 py-3 text-center font-mono text-xs font-black"
                      >
                        {rIdx + 1}
                      </td>

                      <td className="px-3.5 py-3 font-bold whitespace-nowrap">
                        <span 
                          style={{
                            backgroundColor: originalCourt.includes('HC') ? '#dbeafe' : originalCourt.includes('LABOUR') ? '#d1fae5' : '#f3e8ff',
                            color: originalCourt.includes('HC') ? '#1e40af' : originalCourt.includes('LABOUR') ? '#065f46' : '#6b21a8',
                            border: '1.5px solid currentColor'
                          }}
                          className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold inline-block"
                        >
                          {originalCourt}
                        </span>
                      </td>

                      <td 
                        style={{ backgroundColor: '#f0fdf4', color: '#166534' }}
                        className="px-3.5 py-3 font-black text-sm"
                      >
                        {caseNo}
                      </td>

                      <td className="px-3.5 py-3 font-bold text-slate-900 whitespace-nowrap">
                        <span 
                          style={{ backgroundColor: '#ffffff', border: '1.5px solid #86efac' }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs shadow-2xs"
                        >
                          <User className="w-3 h-3 text-emerald-600" />
                          <span>{advocate}</span>
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-slate-800 font-semibold max-w-xs truncate">
                        {applicant}
                      </td>

                      <td className="px-3.5 py-3 text-slate-700 text-xs leading-relaxed max-w-sm">
                        {summary}
                      </td>

                      <td className="px-3.5 py-3 font-bold text-emerald-950 whitespace-nowrap">
                        <span 
                          style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1.5px solid #34d399' }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{decisionInfo}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-3 text-center shrink-0">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`શું આ કેસ (${caseNo}) ને ફરીથી મૂળ પેન્ડિંગ શીટમાં પુનઃસ્થાપિત (Restore) કરવો છે?`)) {
                                  onRestoreCase(originalIndex);
                                }
                              }}
                              title="મૂળ પેન્ડિંગ શીટમાં પુનઃસ્થાપિત કરો"
                              style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd' }}
                              className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`શું આ આર્કાઇવ કેસ (${caseNo}) ને કાયમ માટે કાઢી નાખવો છે?`)) {
                                  onDeleteArchiveCase(originalIndex);
                                }
                              }}
                              title="કાયમ માટે ડિલીટ કરો"
                              style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }}
                              className="p-1.5 rounded-lg hover:bg-rose-100 transition-colors shadow-2xs"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
