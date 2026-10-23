import React, { useState } from 'react';
import { SheetKey, EmployeeProfileMap } from '../types/case';
import { getStatusCategory, extractDateFromStatus, getCaseKey } from '../data/initialData';
import { Calendar, User, Eye, Trash2, Copy, Check, FileText, ArrowRight, Briefcase, Award } from 'lucide-react';

interface CardsViewProps {
  sheetKey: SheetKey;
  rows: Array<{ originalIndex: number; data: string[] }>;
  selectedRowIndex: number | null;
  employeeProfiles?: EmployeeProfileMap;
  onSelectRow: (originalIndex: number) => void;
  onViewDetails: (originalIndex: number) => void;
  onDeleteRow: (originalIndex: number) => void;
}

const ADVOCATE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'સેજલ માંડવીયા': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'હેમંત મુન્સા': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'હિમેશ નાયડું': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  'વ્યોમા ઝવેરી': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  'ટી. એલ. હાલારી': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'પી.એફ. ઝવેરી': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  'રૂતુરાજ મીના': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'હાર્દિક રાવલ': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'રાકેશ પટેલ': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' }
};

export const CardsView: React.FC<CardsViewProps> = ({
  sheetKey,
  rows,
  selectedRowIndex,
  employeeProfiles,
  onSelectRow,
  onViewDetails,
  onDeleteRow
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopySummary = (originalIndex: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(originalIndex);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-base font-bold text-slate-700">કોઈ કેસ મળ્યો નથી</p>
        <p className="text-xs text-slate-400 mt-1">ફિલ્ટર્સ રીસેટ કરીને ફરી પ્રયાસ કરો</p>
      </div>
    );
  }

  // Top color border per sheet
  const topBorderClass =
    sheetKey === 'HC CASE'
      ? 'from-blue-600 to-indigo-600'
      : sheetKey === 'LABOUR CASE'
      ? 'from-emerald-600 to-teal-600'
      : 'from-purple-600 to-fuchsia-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map(({ originalIndex, data: rowData }) => {
        const isSelected = selectedRowIndex === originalIndex;

        // Extract normalized fields based on sheet
        let caseNo = '';
        let fileNo = '';
        let advocate = '';
        let applicant = '';
        let summary = '';
        let status = '';
        let courtName = '';

        if (sheetKey === 'HC CASE') {
          fileNo = rowData[1] || '';
          caseNo = rowData[3] || '';
          advocate = (rowData[4] || '').trim();
          applicant = rowData[5] || '';
          summary = rowData[6] || '';
          status = rowData[10] || '';
        } else {
          caseNo = rowData[1] || '';
          courtName = rowData[2] || '';
          advocate = (rowData[3] || '').trim();
          applicant = rowData[4] || '';
          summary = rowData[5] || '';
          status = rowData[6] || '';
        }

        const statusCat = getStatusCategory(status);
        const hearingDate = extractDateFromStatus(status);
        const advColor = ADVOCATE_COLORS[advocate] || {
          bg: 'bg-slate-100',
          text: 'text-slate-800',
          border: 'border-slate-200'
        };

        const fullCopyText = `[${sheetKey}]
કેસ / રેફ. નં: ${caseNo}
ફાઈલ નં: ${fileNo || '-'}
એડવોકેટ: ${advocate}
પાર્ટી / કર્મચારી: ${applicant}
ટૂંકી વિગત: ${summary}
સ્ટેટસ: ${status}`;

        return (
          <div
            key={originalIndex}
            onClick={() => onSelectRow(originalIndex)}
            className={`relative overflow-hidden bg-white rounded-xl border p-4 transition-all flex flex-col justify-between hover:shadow-lg cursor-pointer ${
              isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Top Colored Accent Stripe */}
            <div className={`h-1.5 bg-gradient-to-r ${topBorderClass} absolute top-0 inset-x-0`} />

            {/* Top metadata strip */}
            <div className="pt-1">
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <span className="font-mono text-slate-900 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded-sm">
                      #{originalIndex - 1}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-slate-600">{sheetKey}</span>
                    {courtName && (
                      <>
                        <span>·</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-200">
                          {courtName}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
                    {caseNo ? `કેસ: ${caseNo}` : `ફાઈલ: ${fileNo || 'અજ્ઞાત'}`}
                  </h3>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 shadow-2xs ${statusCat.badgeClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusCat.dotClass}`} />
                  <span>{statusCat.label.split(' ')[0]}</span>
                </span>
              </div>

              {/* Advocate & Applicant Info */}
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${advColor.bg} ${advColor.text} ${advColor.border}`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{advocate || 'અનિર્ણિત એડવોકેટ'}</span>
                  </span>
                </div>

                <div className="text-slate-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 leading-snug space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>કર્મચારી / અરજદાર:</span>
                    </span>
                  </div>
                  {(() => {
                    const caseKey = getCaseKey(sheetKey, rowData, originalIndex);
                    const profile = employeeProfiles?.[caseKey] || Object.values(employeeProfiles || {}).find(p => 
                      (p.employeeName && applicant.includes(p.employeeName)) || (p.pfNo && applicant.includes(p.pfNo))
                    );

                    const empName = profile?.employeeName || (applicant ? (
                      applicant.includes('અરજદારઃ-') ? applicant.split('અરજદારઃ-')[1].split('(')[0].replace(/સામાવાળા.*/, '').trim() : applicant.split('\n')[0]
                    ) : '-');

                    const des = profile?.designation || (applicant.includes('\n') 
                      ? applicant.split('\n')[1].replace(/\[.*\]/, '').replace(/PF:.*/, '').trim()
                      : (applicant.includes('(') ? applicant.split('(')[1]?.split(')')[0] : ''));

                    const pf = profile?.pfNo || (applicant.match(/PF:?\s*([^|\n\]]+)/i)?.[1]?.trim() || '');
                    const dob = profile?.dob || (applicant.match(/જન્મ:?\s*([^|\n\]]+)/)?.[1]?.trim() || '');
                    const dor = profile?.retirementDate || (applicant.match(/નિવૃત્તિ:?\s*([^|\n\]]+)/)?.[1]?.trim() || '');

                    return (
                      <>
                        <div className="font-black text-slate-950 text-xs sm:text-sm">
                          {empName}
                        </div>
                        {des && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Briefcase className="w-3 h-3 text-amber-700" />
                              <span>{des}</span>
                            </span>
                          </div>
                        )}
                        {(pf || dob || dor) && (
                          <div className="flex flex-wrap gap-1 text-[10px] font-mono font-bold pt-1">
                            {pf && (
                              <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-300">
                                PF: {pf}
                              </span>
                            )}
                            {dob && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-300">
                                જન્મ: {dob}
                              </span>
                            )}
                            {dor && (
                              <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-300">
                                નિવૃત્તિ: {dor}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Summary snippet */}
                <div className="pt-1 text-slate-600 leading-relaxed text-xs line-clamp-3">
                  <span className="font-bold text-slate-800">વિગત: </span>
                  {summary || 'કોઈ વિગત નોંધાયેલ નથી.'}
                </div>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {hearingDate ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-900 font-mono font-bold tabular-nums bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>{hearingDate}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 font-medium">મુદત / તારીખ નથી</div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopySummary(originalIndex, fullCopyText);
                  }}
                  title="કેસ વિગત કોપી કરો"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  {copiedId === originalIndex ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(originalIndex);
                  }}
                  title="સંપૂર્ણ કેસ ડોકેટ જુઓ"
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-2xs"
                >
                  <span>જુઓ</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRow(originalIndex);
                  }}
                  title="કેસ ડિલીટ કરો"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
