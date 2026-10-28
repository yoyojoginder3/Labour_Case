import React from 'react';
import { SheetKey, EmployeeProfileMap } from '../types/case';
import { getStatusCategory, extractDateFromStatus, getCaseKey, getPetitionerType } from '../data/initialData';
import { Eye, Trash2, Calendar, FileText, User, Archive, Lock, Briefcase, Award, Landmark, Scale, Gavel, Layers } from 'lucide-react';

interface TableViewProps {
  sheetKey: SheetKey | 'TOTAL';
  headers: string[];
  rows: Array<{ originalIndex: number; sheetKey?: SheetKey; data: string[] }>;
  selectedRowIndex: number | null;
  employeeProfiles?: EmployeeProfileMap;
  onSelectRow: (originalIndex: number) => void;
  onCellChange: (originalIndex: number, colIndex: number, newValue: string, rowSheetKey?: SheetKey) => void;
  onViewDetails: (originalIndex: number, rowSheetKey?: SheetKey) => void;
  onDeleteRow: (originalIndex: number, rowSheetKey?: SheetKey) => void;
  onMoveToArchive?: (originalIndex: number, rowSheetKey?: SheetKey) => void;
  isAdmin: boolean;
}

const ADVOCATE_STYLES: Record<string, { background: string; color: string; border: string }> = {
  'સેજલ માંડવીયા': { background: '#e0e7ff', color: '#3730a3', border: '1.5px solid #818cf8' },
  'હેમંત મુન્સા': { background: '#fef3c7', color: '#92400e', border: '1.5px solid #fbbf24' },
  'હિમેશ નાયડું': { background: '#cffafe', color: '#155e75', border: '1.5px solid #22d3ee' },
  'વ્યોમા ઝવેરી': { background: '#ffe4e6', color: '#9f1239', border: '1.5px solid #fb7185' },
  'ટી. એલ. હાલારી': { background: '#d1fae5', color: '#065f46', border: '1.5px solid #34d399' },
  'પી.એફ. ઝવેરી': { background: '#ccfbf1', color: '#115e59', border: '1.5px solid #2dd4bf' },
  'રૂતુરાજ મીના': { background: '#f3e8ff', color: '#6b21a8', border: '1.5px solid #c084fc' },
  'હાર્દિક રાવલ': { background: '#dbeafe', color: '#1e40af', border: '1.5px solid #60a5fa' },
  'રાકેશ પટેલ': { background: '#ffedd5', color: '#9a3412', border: '1.5px solid #fb923c' }
};

export const TableView: React.FC<TableViewProps> = ({
  sheetKey,
  headers,
  rows,
  selectedRowIndex,
  employeeProfiles,
  onSelectRow,
  onCellChange,
  onViewDetails,
  onDeleteRow,
  onMoveToArchive,
  isAdmin
}) => {
  const statusColIndex = React.useMemo(() => {
    const idx = headers.findIndex((h) => 
      h.includes('સ્ટેટસ') || h.includes('પરિસ્થિતી') || h.toLowerCase().includes('status')
    );
    return idx !== -1 ? idx : (sheetKey === 'HC CASE' ? 10 : 6);
  }, [headers, sheetKey]);

  const advocateColIndex = React.useMemo(() => {
    const idx = headers.findIndex((h) => 
      h.includes('એડવોકેટ') || h.toLowerCase().includes('advocate')
    );
    return idx !== -1 ? idx : (sheetKey === 'HC CASE' ? 4 : 3);
  }, [headers, sheetKey]);

  const employeeColIndex = React.useMemo(() => {
    const idx = headers.findIndex((h) => 
      h.includes('કર્મચારી') || h.includes('કામદાર') || h.includes('અરજદાર') || h.includes('પાર્ટી') || h.includes('પક્ષકાર')
    );
    return idx !== -1 ? idx : (sheetKey === 'HC CASE' ? 5 : 4);
  }, [headers, sheetKey]);

  const headerBg =
    sheetKey === 'TOTAL'
      ? '#0f172a'
      : sheetKey === 'HC CASE'
      ? '#1e3a8a'
      : sheetKey === 'LABOUR CASE'
      ? '#065f46'
      : '#581c87';

  return (
    <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="rounded-2xl border-2 overflow-hidden shadow-xl">
      <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[440px] scrollbar-thin">
        <table className="w-full border-collapse text-left text-xs sm:text-[13px]">
          <thead style={{ backgroundColor: headerBg, color: '#ffffff' }} className="sticky top-0 z-20 shadow-md">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    backgroundColor: i === 0 ? '#0f172a' : undefined,
                    color: i === 0 ? '#fde047' : '#ffffff',
                    borderRight: '2px solid rgba(255,255,255,0.2)',
                    textAlign: i === 0 ? 'center' : 'left'
                  }}
                  className={`px-3.5 py-3.5 font-extrabold whitespace-pre-wrap leading-snug tracking-tight ${
                    i === 0 ? 'w-16 shrink-0 font-black' : ''
                  }`}
                >
                  {h}
                </th>
              ))}
              <th
                style={{ backgroundColor: '#0f172a', color: '#fde047' }}
                className="px-3 py-3.5 text-center font-black w-28 shrink-0"
              >
                ક્રિયા
              </th>
            </tr>
          </thead>
          <tbody style={{ borderColor: '#cbd5e1' }} className="divide-y font-normal">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  style={{ backgroundColor: '#fffbeb', color: '#78350f' }}
                  className="px-6 py-14 text-center font-bold"
                >
                  <FileText className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                  <p className="text-base">કોઈ કેસ મળ્યો નથી</p>
                  <p className="text-xs text-slate-500 mt-1">
                    ફિલ્ટર અથવા શોધ શબ્દ બદલીને ફરી પ્રયાસ કરો
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const { originalIndex, data: rowData } = row;
                const isSelected = selectedRowIndex === originalIndex;
                const statusVal = rowData[statusColIndex] || '';
                const advocateVal = (rowData[advocateColIndex] || '').trim();
                const statusCat = getStatusCategory(statusVal);
                const hearingDate = extractDateFromStatus(statusVal);
                const isDisposed = statusCat.type === 'disposed';
                const advStyle = ADVOCATE_STYLES[advocateVal] || {
                  background: '#f1f5f9',
                  color: '#0f172a',
                  border: '1.5px solid #94a3b8'
                };

                return (
                  <tr
                    key={`${row.sheetKey || sheetKey}-${originalIndex}`}
                    onClick={() => onSelectRow(originalIndex)}
                    onDoubleClick={() => onViewDetails(originalIndex, row.sheetKey)}
                    style={{
                      backgroundColor: isSelected ? '#dbeafe' : undefined,
                      outline: isSelected ? '2px solid #2563eb' : undefined
                    }}
                    className="transition-colors group cursor-pointer hover:brightness-95"
                  >
                    {headers.map((_, cIdx) => {
                      const val = rowData[cIdx] || '';
                      const isStatusCol = cIdx === statusColIndex;
                      const isAdvocateCol = cIdx === advocateColIndex;
                      const isEmployeeCol = cIdx === employeeColIndex;

                      let cellStyle: React.CSSProperties = { backgroundColor: '#ffffff', color: '#1e293b' };

                      if (cIdx === 0) {
                        cellStyle = {
                          backgroundColor: isSelected ? '#bfdbfe' : '#e2e8f0',
                          color: '#0f172a',
                          textAlign: 'center',
                          fontWeight: '900',
                          fontFamily: 'monospace'
                        };
                      } else if (sheetKey === 'TOTAL') {
                        if (cIdx === 1) cellStyle = { backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 'bold' };
                        else if (cIdx === 2) cellStyle = { backgroundColor: '#eff6ff', color: '#1e40af', fontWeight: 'bold' };
                        else if (cIdx === 3) cellStyle = { backgroundColor: '#fefce8', color: '#854d0e' };
                        else if (cIdx === 4) cellStyle = { backgroundColor: '#f3e8ff', color: '#581c87' };
                        else if (cIdx === 5) cellStyle = { backgroundColor: '#dcfce7', color: '#14532d', fontWeight: '600' };
                        else if (cIdx === 6) cellStyle = { backgroundColor: '#ffffff', color: '#0f172a' };
                        else if (cIdx === 7) cellStyle = { backgroundColor: '#fff7ed' };
                      } else if (sheetKey === 'HC CASE') {
                        if (cIdx === 1) cellStyle = { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' };
                        else if (cIdx === 2) cellStyle = { backgroundColor: '#fef3c7', color: '#92400e' };
                        else if (cIdx === 3) cellStyle = { backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 'bold' };
                        else if (cIdx === 4) cellStyle = { backgroundColor: '#f3e8ff', color: '#581c87' };
                        else if (cIdx === 5) cellStyle = { backgroundColor: '#dcfce7', color: '#14532d', fontWeight: '600' };
                        else if (cIdx === 6) cellStyle = { backgroundColor: '#fefce8', color: '#0f172a' };
                        else if (cIdx === 10) cellStyle = { backgroundColor: '#fff7ed' };
                      } else {
                        if (cIdx === 1) cellStyle = { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' };
                        else if (cIdx === 2) cellStyle = { backgroundColor: '#ccfbf1', color: '#115e59', fontWeight: 'bold' };
                        else if (cIdx === 3) cellStyle = { backgroundColor: '#f3e8ff', color: '#581c87' };
                        else if (cIdx === 4) cellStyle = { backgroundColor: '#dcfce7', color: '#14532d', fontWeight: '600' };
                        else if (cIdx === 5) cellStyle = { backgroundColor: '#fefce8', color: '#0f172a' };
                        else if (cIdx === 6) cellStyle = { backgroundColor: '#fff7ed' };
                      }

                      const isCourtCol = sheetKey === 'TOTAL' && cIdx === 1;

                      return (
                        <td
                          key={cIdx}
                          style={{
                            ...cellStyle,
                            borderRight: '1px solid #cbd5e1'
                          }}
                          className={`px-3 py-2 align-top ${cIdx === 0 ? 'w-16 text-center' : 'max-w-xs break-words'}`}
                        >
                          {cIdx === 0 ? (
                            <div className="text-center font-mono font-black text-xs py-0.5">
                              {val || (originalIndex - 1)}
                            </div>
                          ) : isCourtCol ? (
                            <div>
                              <span
                                style={{
                                  backgroundColor: val.includes('હાઈકોર્ટ') ? '#dbeafe' : val.includes('લેબર') ? '#d1fae5' : '#ede9fe',
                                  color: val.includes('હાઈકોર્ટ') ? '#1e40af' : val.includes('લેબર') ? '#065f46' : '#5b21b6',
                                  border: `1.5px solid ${val.includes('હાઈકોર્ટ') ? '#93c5fd' : val.includes('લેબર') ? '#6ee7b7' : '#c4b5fd'}`
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs"
                              >
                                {val.includes('હાઈકોર્ટ') ? <Landmark className="w-3.5 h-3.5 text-blue-700" /> : val.includes('લેબર') ? <Scale className="w-3.5 h-3.5 text-emerald-700" /> : <Gavel className="w-3.5 h-3.5 text-purple-700" />}
                                <span>{val}</span>
                              </span>
                            </div>
                          ) : isAdvocateCol ? (
                            <div>
                              <span
                                style={{
                                  backgroundColor: advStyle.background,
                                  color: advStyle.color,
                                  border: advStyle.border
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black shadow-xs"
                              >
                                <User className="w-3.5 h-3.5" />
                                <span>{val || 'અનિર્ણિત'}</span>
                              </span>
                            </div>
                          ) : isEmployeeCol ? (
                            <div className="space-y-1.5 py-0.5">
                              {(() => {
                                const originSheet = row.sheetKey || (sheetKey === 'TOTAL' ? (rowData[1]?.includes('હાઈકોર્ટ') ? 'HC CASE' : rowData[1]?.includes('લેબર') ? 'LABOUR CASE' : 'IT CASE') : sheetKey);
                                const caseKey = getCaseKey(originSheet, rowData, originalIndex);
                                const profile = employeeProfiles?.[caseKey] || Object.values(employeeProfiles || {}).find(p => 
                                  (p.employeeName && val.includes(p.employeeName)) || (p.pfNo && val.includes(p.pfNo))
                                );

                                const empName = profile?.employeeName || (() => {
                                  const isST = getPetitionerType(val, profile) === 'st';
                                  if (isST) {
                                    const rawOpp = val.split(/સામાવાળા[\s:ઃ\.-]*/)[1] || '';
                                    if (rawOpp) {
                                      return rawOpp.split('(')[0].replace(/^[\s:ઃ\.-]+/, '').trim() || val.split('\n')[0];
                                    }
                                    const oppCol = headers.findIndex(h => /સામાવાળા|બીજા\s*પક્ષકાર|દ્વિતીય|opponent|respondent/i.test(h));
                                    if (oppCol >= 0 && rowData[oppCol]) {
                                      return rowData[oppCol].split('(')[0].replace(/^[\s:ઃ\.-]+/, '').trim();
                                    }
                                    return val.split('\n')[0] || val;
                                  }
                                  if (val.includes('અરજદાર')) {
                                    const raw = val.split(/અરજદાર[\s:ઃ\.-]*/)[1] || '';
                                    return raw.split('(')[0].replace(/સામાવાળા.*/, '').replace(/^[\s:ઃ\.-]+/, '').trim() || val.split('\n')[0];
                                  }
                                  return val.split('\n')[0] || val;
                                })();

                                const des = profile?.designation || (() => {
                                  if (val.includes('\n')) {
                                    return val.split('\n')[1].replace(/\[.*\]/, '').replace(/PF:.*/, '').trim();
                                  }
                                  return val.includes('(') ? val.split('(')[1]?.split(')')[0] : '';
                                })();

                                const pf = profile?.pfNo || (val.match(/PF:?\s*([^|\n\]]+)/i)?.[1]?.trim() || '');
                                const dob = profile?.dob || (val.match(/જન્મ:?\s*([^|\n\]]+)/)?.[1]?.trim() || '');
                                const dor = profile?.retirementDate || (val.match(/નિવૃત્તિ:?\s*([^|\n\]]+)/)?.[1]?.trim() || '');
                                const doa = profile?.appointmentDate || (val.match(/નિમણૂક:?\s*([^|\n\]]+)/)?.[1]?.trim() || '');

                                const otherLines = val.split('\n').filter(line => 
                                  !line.includes('PF:') && !line.includes('જન્મ:') && !line.includes('નિવૃત્તિ:') &&
                                  line !== empName && line !== des && !line.startsWith('અરજદારઃ-')
                                ).join('\n');

                                return (
                                  <>
                                    {/* ૧. કર્મચારીનું નામ (Employee Name) */}
                                    <div className="font-black text-slate-950 text-xs sm:text-[13px] flex items-center gap-1.5 leading-snug">
                                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-300">
                                        <User className="w-3 h-3 text-emerald-800" />
                                      </div>
                                      <span className="break-words font-black tracking-tight text-slate-900">
                                        {empName || 'કર્મચારી'}
                                      </span>
                                    </div>

                                    {/* ૨. હોદ્દો / બેજ નં. (Designation & Badge) */}
                                    {des && (
                                      <div className="flex items-center gap-1">
                                        <span 
                                          style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}
                                          className="px-2 py-0.5 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs"
                                        >
                                          <Briefcase className="w-3 h-3 text-amber-700" />
                                          <span>{des}</span>
                                        </span>
                                      </div>
                                    )}

                                    {/* ૩. PF નં., ૪. જન્મ તારીખ, ૫. નિવૃત્તિ તારીખ - બધી વિગતો એક સાથે */}
                                    {(pf || dob || dor || doa) && (
                                      <div className="flex flex-wrap gap-1 text-[10.5px] font-mono font-bold pt-0.5">
                                        {pf && (
                                          <span 
                                            style={{ backgroundColor: '#ccfbf1', color: '#115e59', border: '1px solid #5eead4' }}
                                            className="px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1"
                                            title="PF નંબર"
                                          >
                                            <Award className="w-3 h-3 text-teal-700" />
                                            <span>PF: {pf}</span>
                                          </span>
                                        )}
                                        {dob && (
                                          <span 
                                            style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}
                                            className="px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1"
                                            title="જન્મ તારીખ"
                                          >
                                            <Calendar className="w-3 h-3 text-sky-700" />
                                            <span>જન્મ: {dob}</span>
                                          </span>
                                        )}
                                        {dor && (
                                          <span 
                                            style={{ backgroundColor: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' }}
                                            className="px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1"
                                            title="નિવૃત્તિ તારીખ"
                                          >
                                            <Calendar className="w-3 h-3 text-orange-700" />
                                            <span>નિવૃત્તિ: {dor}</span>
                                          </span>
                                        )}
                                        {doa && (
                                          <span 
                                            style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
                                            className="px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1"
                                            title="નોકરીમાં નિમણૂક તારીખ"
                                          >
                                            <Calendar className="w-3 h-3 text-indigo-700" />
                                            <span>નિમણૂક: {doa}</span>
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {otherLines && (
                                      <div className="text-[11px] text-slate-500 font-medium whitespace-pre-wrap pt-0.5">
                                        {otherLines}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : isStatusCol ? (
                            <div className="space-y-1.5">
                              {isAdmin ? (
                                <div
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) =>
                                    onCellChange(originalIndex, cIdx, e.currentTarget.innerText)
                                  }
                                  style={{
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    caretColor: '#1d4ed8',
                                    border: '1.5px solid #2563eb'
                                  }}
                                  className="outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-600 p-1.5 rounded-md text-xs font-bold leading-relaxed whitespace-pre-wrap text-slate-950 shadow-2xs"
                                >
                                  {val}
                                </div>
                              ) : (
                                <div className="text-xs font-bold whitespace-pre-wrap text-slate-900">
                                  {val}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span
                                  style={{
                                    backgroundColor: isDisposed ? '#d1fae5' : statusCat.type === 'final_hearing' ? '#ffedd5' : '#e0f2fe',
                                    color: isDisposed ? '#065f46' : statusCat.type === 'final_hearing' ? '#9a3412' : '#0369a1',
                                    border: '1.5px solid currentColor'
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-black shadow-xs"
                                >
                                  <span className={`w-2 h-2 rounded-full ${statusCat.dotClass}`} />
                                  <span>{statusCat.label.split(' ')[0]}</span>
                                </span>
                                {hearingDate && (
                                  <span
                                    style={{ backgroundColor: '#fef08a', color: '#713f12', border: '1.5px solid #facc15' }}
                                    className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md font-mono tabular-nums shadow-xs"
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-amber-800" />
                                    <span>{hearingDate}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              contentEditable={isAdmin}
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                isAdmin && onCellChange(originalIndex, cIdx, e.currentTarget.innerText, row.sheetKey)
                              }
                              style={{
                                color: '#0f172a',
                                caretColor: '#1d4ed8'
                              }}
                              className={`outline-hidden ${isAdmin ? 'focus:bg-white focus:ring-2 focus:ring-blue-600 focus:text-slate-950 focus:border-blue-600' : ''} p-1 rounded-md leading-relaxed whitespace-pre-wrap font-medium text-slate-900`}
                            >
                              {val}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {/* Actions column with Archive & Delete buttons */}
                    <td
                      style={{ backgroundColor: '#f8fafc', borderLeft: '1px solid #cbd5e1' }}
                      className="px-2 py-2.5 text-center align-top shrink-0"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(originalIndex, row.sheetKey);
                          }}
                          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                          title="કેસ વિગત જુઓ"
                          className="p-1.5 rounded-lg transition-all shadow-xs hover:brightness-110 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Dedicated "Archive / Move to Disposed" button */}
                        {isAdmin && onMoveToArchive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`શું આ કેસ (${rowData[3] || rowData[1]}) નિકાલ થયેલ છે? તેને નિકાલ આર્કાઇવમાં ખસેડી મૂળ પેન્ડિંગ શીટમાંથી ડિલીટ કરવો છે?`)) {
                                onMoveToArchive(originalIndex, row.sheetKey);
                              }
                            }}
                            style={{ backgroundColor: '#059669', color: '#ffffff' }}
                            title="નિકાલ આર્કાઇવમાં ખસેડો (Move to Disposed Archive)"
                            className="p-1.5 rounded-lg transition-all shadow-xs hover:brightness-110 cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRow(originalIndex, row.sheetKey);
                            }}
                            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                            title="કેસ ડિલીટ કરો"
                            className="p-1.5 rounded-lg transition-all shadow-xs hover:brightness-110 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span title="ડિલીટ કરવા માટે એડમિન એક્સેસ જરૂરી છે" className="p-1 text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
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
      <div
        style={{ background: 'linear-gradient(to right, #fef3c7, #e0f2fe, #d1fae5)', borderTop: '2px solid #cbd5e1' }}
        className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-900 font-bold"
      >
        <div className="flex items-center gap-2">
          <span style={{ backgroundColor: '#059669' }} className="w-3 h-3 rounded-full animate-pulse"></span>
          <span>
            {isAdmin 
              ? '👑 એડમિન મોડ: સેલ પર ક્લિક કરી એડિટ કરો • કર્મચારી ખાનામાં નામ, હોદ્દો, PF, જન્મ અને નિવૃત્તિ તમામ વિગત એક સાથે દેખાય છે' 
              : '👁️ સ્ટાફ મોડ: કેસો સુરક્ષિત રીતે માત્ર વાંચવા માટે ઉપલબ્ધ છે'}
          </span>
        </div>
        <div>
          <span style={{ color: '#1e40af' }} className="font-black">ડબલ-ક્લિક કરવાથી સંપૂર્ણ ફાઈલ ખુલે છે</span>
        </div>
      </div>
    </div>
  );
};
