import React, { useState } from 'react';
import { SheetKey } from '../types/case';
import { getStatusCategory, extractDateFromStatus } from '../data/initialData';
import { X, Printer, Copy, Check, Edit2, Save, Calendar, Scale, ExternalLink, Globe } from 'lucide-react';

interface CaseDetailModalProps {
  isOpen: boolean;
  sheetKey: SheetKey;
  headers: string[];
  rowData: string[];
  rowIndex: number;
  isAdmin?: boolean;
  onClose: () => void;
  onSaveRow: (updatedRow: string[]) => void;
  onDeleteRow: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  isOpen,
  sheetKey,
  headers,
  rowData,
  rowIndex,
  isAdmin = false,
  onClose,
  onSaveRow,
  onDeleteRow
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<string[]>(rowData || []);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setFormData(rowData || []);
    setIsEditing(false);
  }, [rowData]);

  if (!isOpen || !rowData) return null;

  const handleFieldChange = (index: number, val: string) => {
    const updated = [...formData];
    updated[index] = val;
    setFormData(updated);
  };

  const handleSave = () => {
    onSaveRow(formData);
    setIsEditing(false);
  };

  const statusCol = sheetKey === 'HC CASE' ? 10 : 6;
  const statusVal = formData[statusCol] || '';
  const statusCat = getStatusCategory(statusVal);
  const hearingDate = extractDateFromStatus(statusVal);

  const handleCopy = () => {
    const text = headers
      .map((h, i) => `${h}: ${formData[i] || '-'}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #3b82f6' }}
        className="rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header Strip with Royal Gradient */}
        <div 
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}
          className="text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-sm"
            >
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-100 font-bold">
                <span>{sheetKey}</span>
                <span>·</span>
                <span>કેસ ક્રમ #{rowIndex - 1}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                કેસ ડોકેટ વિગત (Legal Case File)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin && (
              !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ backgroundColor: '#ffffff', color: '#1e3a8a' }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-xl transition-all hover:bg-blue-50 shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>સુધારો (Edit)</span>
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-xl transition-all shadow-md hover:brightness-110"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>સેવ કરો</span>
                </button>
              )
            )}

            <button
              onClick={onClose}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              className="p-1.5 text-white hover:bg-white/30 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Callout Banner */}
        <div 
          style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}
          className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <span
              style={{
                backgroundColor: statusCat.type === 'final_hearing' ? '#ffedd5' : statusCat.type === 'disposed' ? '#d1fae5' : '#e0f2fe',
                color: statusCat.type === 'final_hearing' ? '#9a3412' : statusCat.type === 'disposed' ? '#065f46' : '#0369a1',
                border: '2px solid currentColor'
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-xs"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${statusCat.dotClass}`} />
              <span>{statusCat.label}</span>
            </span>

            {hearingDate && (
              <span 
                style={{ backgroundColor: '#fef08a', color: '#713f12', border: '2px solid #facc15' }}
                className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-xl font-mono font-black tabular-nums shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-800" />
                <span>મુદત તારીખ: {hearingDate}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1.5px solid #93c5fd' }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span className="text-emerald-700">કોપી થઈ ગયું</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>કોપી વિગત</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrintSlip}
              style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1.5px solid #fcd34d' }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>કેસ સ્લિપ પ્રિન્ટ</span>
            </button>
          </div>
        </div>

        {/* Content Body with Color-Coded Cards */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {headers.map((header, idx) => {
              const val = formData[idx] || '';
              const isFullWidth =
                header.includes('વિગત') ||
                header.includes('ચુકાદા') ||
                header.includes('પરિસ્થિતી') ||
                header.includes('સ્ટેટસ');

              let cardBg = '#f0f9ff';
              let borderCol = '#bae6fd';
              let labelCol = '#0369a1';

              if (header.includes('એડવોકેટ')) {
                cardBg = '#f5f3ff';
                borderCol = '#c084fc';
                labelCol = '#581c87';
              } else if (header.includes('કર્મચારી') || header.includes('પાર્ટી')) {
                cardBg = '#ecfdf5';
                borderCol = '#6ee7b7';
                labelCol = '#065f46';
              } else if (header.includes('વિગત') || header.includes('ચુકાદા')) {
                cardBg = '#fefce8';
                borderCol = '#fde047';
                labelCol = '#713f12';
              } else if (header.includes('સ્ટેટસ') || header.includes('પરિસ્થિતી')) {
                cardBg = '#fff7ed';
                borderCol = '#fdba74';
                labelCol = '#9a3412';
              }

              return (
                <div
                  key={idx}
                  style={{ backgroundColor: cardBg, border: `2px solid ${borderCol}` }}
                  className={`p-3.5 rounded-2xl shadow-xs ${isFullWidth ? 'md:col-span-2' : ''}`}
                >
                  <label style={{ color: labelCol }} className="block text-xs font-black uppercase tracking-wider mb-1">
                    {header}
                  </label>

                  {isEditing ? (
                    isFullWidth ? (
                      <textarea
                        rows={3}
                        value={val}
                        onChange={(e) => handleFieldChange(idx, e.target.value)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          caretColor: '#1d4ed8',
                          border: '2px solid #2563eb'
                        }}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl font-bold text-slate-950 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleFieldChange(idx, e.target.value)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          caretColor: '#1d4ed8',
                          border: '2px solid #2563eb'
                        }}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl font-bold text-slate-950 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                      />
                    )
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900 whitespace-pre-wrap leading-relaxed">
                      {val || <span className="text-slate-400 font-normal italic">ખાલી</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div 
          style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}
          className="px-6 py-3.5 flex items-center justify-between shrink-0"
        >
          {isAdmin ? (
            <button
              onClick={() => {
                if (confirm('શું તમે આ કેસ ખરેખર ડિલીટ કરવા માંગો છો?')) {
                  onDeleteRow();
                  onClose();
                }
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800"
            >
              કેસ ડિલીટ કરો
            </button>
          ) : (
            <span className="text-xs font-bold text-slate-500">
              વાંચન મોડ (View Only)
            </span>
          )}

          <div className="flex items-center gap-2.5">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setFormData(rowData || []);
                    setIsEditing(false);
                  }}
                  style={{ backgroundColor: '#ffffff', color: '#475569', border: '1.5px solid #cbd5e1' }}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  રદ કરો
                </button>
                <button
                  onClick={handleSave}
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                  className="px-5 py-2 text-xs font-black rounded-xl shadow-md transition-all hover:brightness-110"
                >
                  સેવ કરો
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
                className="px-5 py-2 text-xs font-black rounded-xl shadow-md transition-all hover:brightness-110"
              >
                બંધ કરો
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
