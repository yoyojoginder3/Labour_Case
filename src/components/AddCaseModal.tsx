import React, { useState } from 'react';
import { SheetKey } from '../types/case';
import { SHEET_CONFIGS } from '../data/initialData';
import { X, Plus, Scale, Sparkles, Landmark, Gavel, CheckCircle2, User, Tag } from 'lucide-react';

interface AddCaseModalProps {
  isOpen: boolean;
  currentSheetKey: SheetKey;
  advocateList: string[];
  onClose: () => void;
  onSubmit: (targetSheet: SheetKey, newRow: string[]) => void;
}

export const AddCaseModal: React.FC<AddCaseModalProps> = ({
  isOpen,
  currentSheetKey,
  advocateList,
  onClose,
  onSubmit
}) => {
  const [targetSheet, setTargetSheet] = useState<SheetKey>(currentSheetKey);
  const [formData, setFormData] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setTargetSheet(currentSheetKey);
      setFormData({});
    }
  }, [isOpen, currentSheetKey]);

  if (!isOpen) return null;

  const currentConfig = SHEET_CONFIGS[targetSheet];
  const headers = currentConfig.headers;

  const handleFieldChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleApplyDisputePreset = (presetText: string) => {
    const summaryHeader = headers.find((h) => h.includes('વિગત')) || '';
    if (summaryHeader) {
      setFormData((prev) => ({
        ...prev,
        [summaryHeader]: presetText
      }));
    }
  };

  const handleApplyStatusPreset = (statusText: string) => {
    const statusHeader = headers.find((h) => h.includes('સ્ટેટસ') || h.includes('પરિસ્થિતી')) || '';
    if (statusHeader) {
      setFormData((prev) => ({
        ...prev,
        [statusHeader]: statusText
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRow = headers.map((h, idx) => {
      if (idx === 0) return '1';
      return formData[h] || '';
    });

    onSubmit(targetSheet, newRow);
    onClose();
  };

  const disputePresets = [
    { label: '🎟️ ટીકીટ ઉચાપત', bg: '#fef3c7', text: '#92400e', border: '#f59e0b', textContent: 'ટીકીટ ગેરરીતી / ઉચાપત બાબતે બરતરફ કરતા પુનઃસ્થાપિત કરવા માટે પીટીશન દાખલ કરેલ છે.' },
    { label: '🚗 ફેટલ અકસ્માત', bg: '#ffe4e6', text: '#9f1239', border: '#f43f5e', textContent: 'ફેટલ અકસ્માત (મુસાફર તેમજ ડ્રાયવર સંયુક્ત જવાબદાર છે).' },
    { label: '🚫 ગેરહાજરી', bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7', textContent: 'કોઈપણ ઉપલા અધિકારીશ્રીની પૂર્વ મંજુરી વગર મનસ્વીપણે ગેરહાજર રહેતાં રીમુવ ફોર્મ સર્વીસીસ કરેલ.' },
    { label: '💼 નવી નિમણુંક', bg: '#e0f2fe', text: '#0369a1', border: '#0ea5e9', textContent: 'ડ્રાયવર / કંડકટર નવી નિમણુંક બાબત.' },
    { label: '💰 રજા પગાર', bg: '#dcfce7', text: '#065f46', border: '#10b981', textContent: 'રજાનો પગાર તથા અન્ય નિવૃતી અંગેના લાભો મેળવવા બાબતની રીકવરી અરજી.' },
    { label: '🍺 કેફીપીણું/દારૂ', bg: '#ffedd5', text: '#9a3412', border: '#f97316', textContent: 'ચાલુ ફરજે કેફીપીણાનું સેવન કરી અતિ ગંભીર પ્રકારની ગેરશિષ્ટ આચરી નિગમની પ્રતિષ્ઠાને હાની પહોંચાડવા બાબત.' }
  ];

  const isHighCourt = targetSheet === 'HC CASE';
  const statusPresets = isHighCourt
    ? [
        { label: '🔥 અંતિમ સુનાવણી (Final Hearing)', value: '182-FOR FINAL HEARING\nDATE-20/10/2026', bg: '#ffedd5', color: '#9a3412', border: '#fb923c' },
        { label: '📋 નોટિસ / મુલતવી (Notice & Adjourned)', value: '192-NOTICE & ADJOURNED MATTERS\nDATE-15/11/2026', bg: '#e0f2fe', color: '#0369a1', border: '#38bdf8' },
        { label: '🎯 એડમિશન બોર્ડ (Admission)', value: '529-FOR ADMISSION DATE-01/11/2026', bg: '#f3e8ff', color: '#6b21a8', border: '#c084fc' },
        { label: '⚡ ફાઇનલ ડિસ્પોઝલ (Final Disposal)', value: '181- FOR FINAL DISPOSAL\nDATE-10/11/2026', bg: '#fef3c7', color: '#854d0e', border: '#facc15' },
        { label: '✅ ચુકાદો (Case Disposed)', value: 'Case Disposed', bg: '#d1fae5', color: '#065f46', border: '#34d399' }
      ]
    : [
        { label: '⚖️ દલીલ - પક્ષકાર (First Party Argument)', value: 'For Argument of First Party\nDate- 20/10/2026', bg: '#ffedd5', color: '#9a3412', border: '#fb923c' },
        { label: '⚖️ દલીલ - અરજદાર (Applicant Argument)', value: 'For Argument of Applicant\nDate- 15/10/2026', bg: '#e0f2fe', color: '#0369a1', border: '#38bdf8' },
        { label: '📝 ક્લેઇમ સ્ટેટમેન્ટ (Statement of Claim)', value: 'For Statement of claim\nDate- 18/10/2026', bg: '#fef3c7', color: '#854d0e', border: '#facc15' },
        { label: '💬 સામાવાળાનો જવાબ (Reply of Opponent)', value: 'For Reply of opponent\nDate- 22/10/2026', bg: '#f3e8ff', color: '#6b21a8', border: '#c084fc' },
        { label: '📜 પુરાવા રજૂઆત (Evidence of Opponent)', value: 'For Evidence of Opponent\nDate- 25/10/2026', bg: '#e0e7ff', color: '#3730a3', border: '#818cf8' },
        { label: '✅ નિકાલ થયેલ (Case Disposed)', value: 'Case Disposed', bg: '#d1fae5', color: '#065f46', border: '#34d399' }
      ];

  const advocateHeader = headers.find((h) => h.includes('એડવોકેટ')) || '';
  const statusHeader = headers.find((h) => h.includes('સ્ટેટસ') || h.includes('પરિસ્થિતી')) || '';
  const courtHeader = headers.find((h) => h.includes('લેબરકોર્ટ')) || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #6366f1' }}
        className="rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Colorful Gradient Header */}
        <div 
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #7c3aed 100%)' }}
          className="text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0 shadow-md"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div 
              style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black shadow-md shrink-0"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                  નવો કેસ ઉમેરો (Add Case)
                </h2>
                <span 
                  style={{ backgroundColor: '#fef08a', color: '#713f12', border: '1.5px solid #facc15' }}
                  className="text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs"
                >
                  {targetSheet}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-100 font-semibold mt-0.5">
                GSRTC લેબર શાખા • નવો કેસ સૌથી ઉપર ક્રમ નં. ૧ પર ઉમેરાશે
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            className="p-1.5 sm:p-2 text-white hover:bg-white/30 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Court Selection Strip */}
        <div 
          style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}
          className="px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0"
        >
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">કોર્ટ પસંદ કરો:</span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setTargetSheet('HC CASE');
                setFormData({});
              }}
              style={{
                backgroundColor: targetSheet === 'HC CASE' ? '#1d4ed8' : '#ffffff',
                color: targetSheet === 'HC CASE' ? '#ffffff' : '#1e3a8a',
                border: '2px solid #1d4ed8'
              }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>હાઈકોર્ટ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetSheet('LABOUR CASE');
                setFormData({});
              }}
              style={{
                backgroundColor: targetSheet === 'LABOUR CASE' ? '#059669' : '#ffffff',
                color: targetSheet === 'LABOUR CASE' ? '#ffffff' : '#065f46',
                border: '2px solid #059669'
              }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>લેબર કોર્ટ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetSheet('IT CASE');
                setFormData({});
              }}
              style={{
                backgroundColor: targetSheet === 'IT CASE' ? '#7c3aed' : '#ffffff',
                color: targetSheet === 'IT CASE' ? '#ffffff' : '#581c87',
                border: '2px solid #7c3aed'
              }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>ઔદ્યોગિક (IT)</span>
            </button>
          </div>
        </div>

        {/* Quick Dispute Presets Strip */}
        <div 
          style={{ backgroundColor: '#fffbeb', borderBottom: '2px solid #fde047' }}
          className="px-3 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs"
        >
          <span className="font-black text-amber-950 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">પ્રિસેટ્સ:</span>
          </span>
          {disputePresets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleApplyDisputePreset(p.textContent)}
              style={{
                backgroundColor: p.bg,
                color: p.text,
                border: `1.5px solid ${p.border}`
              }}
              className="text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-xl transition-all hover:scale-105 shadow-xs whitespace-nowrap shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Main Form Fields */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {headers.map((header, idx) => {
                if (idx === 0) return null;

                const val = formData[header] || '';
                const isFullWidth =
                  header.includes('વિગત') ||
                  header.includes('ચુકાદા') ||
                  header.includes('સ્ટેટસ') ||
                  header.includes('પરિસ્થિતી');

                // 1. Advocate Selection
                if (header === advocateHeader) {
                  return (
                    <div 
                      key={idx}
                      style={{ backgroundColor: '#f5f3ff', border: '2px solid #c084fc' }}
                      className="space-y-1.5 p-3 sm:p-3.5 rounded-2xl shadow-xs"
                    >
                      <label style={{ color: '#581c87' }} className="block text-xs font-black flex items-center gap-1.5">
                        <User className="w-4 h-4 text-purple-600" />
                        <span>{header}</span> <span className="text-rose-600">*</span>
                      </label>
                      <div className="space-y-2">
                        <select
                          value={advocateList.includes(val) ? val : ''}
                          onChange={(e) => handleFieldChange(header, e.target.value)}
                          style={{ backgroundColor: '#ffffff', border: '1.5px solid #a855f7', color: '#3b0764' }}
                          className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">👤 પેનલ એડવોકેટ પસંદ કરો...</option>
                          {advocateList.map((adv) => (
                            <option key={adv} value={adv}>
                              {adv}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleFieldChange(header, e.target.value)}
                          placeholder="અથવા અન્ય એડવોકેટ લખો..."
                          style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1' }}
                          className="w-full text-xs sm:text-sm p-2 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
                        />
                      </div>
                    </div>
                  );
                }

                // 2. Court Location (Labour/IT)
                if (header === courtHeader) {
                  return (
                    <div 
                      key={idx}
                      style={{ backgroundColor: '#f0fdfa', border: '2px solid #5eead4' }}
                      className="space-y-1.5 p-3 sm:p-3.5 rounded-2xl shadow-xs"
                    >
                      <label style={{ color: '#134e4a' }} className="block text-xs font-black flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-teal-600" />
                        <span>{header}</span> <span className="text-rose-600">*</span>
                      </label>
                      <div className="flex gap-2">
                        {['સુરત', 'અમદાવાદ'].map((court) => (
                          <button
                            key={court}
                            type="button"
                            onClick={() => handleFieldChange(header, court)}
                            style={{
                              backgroundColor: val === court ? '#0d9488' : '#ffffff',
                              color: val === court ? '#ffffff' : '#134e4a',
                              border: '2px solid #0d9488'
                            }}
                            className="flex-1 py-1.5 sm:py-2 text-xs font-black rounded-xl transition-all shadow-xs"
                          >
                            {court}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleFieldChange(header, e.target.value)}
                        placeholder="અથવા અન્ય કોર્ટ દાખલ કરો..."
                        style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1' }}
                        className="w-full text-xs sm:text-sm p-2 rounded-xl focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  );
                }

                // 3. Status Presets
                if (header === statusHeader) {
                  return (
                    <div 
                      key={idx}
                      style={{ backgroundColor: '#fff7ed', border: '2px solid #fdba74' }}
                      className="space-y-1.5 md:col-span-2 p-3 sm:p-4 rounded-2xl shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <label style={{ color: '#7c2d12' }} className="block text-xs font-black flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-orange-600" />
                          <span>{header}</span> <span className="text-rose-600">*</span>
                        </label>
                        <span style={{ color: '#c2410c' }} className="text-[11px] sm:text-xs font-extrabold">પ્રિસેટ્સ:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 my-1.5">
                        {statusPresets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleApplyStatusPreset(preset.value)}
                            style={{
                              backgroundColor: preset.bg,
                              color: preset.color,
                              border: `1.5px solid ${preset.border}`
                            }}
                            className="text-[11px] sm:text-xs font-extrabold px-2.5 py-1 rounded-xl transition-all hover:scale-105 shadow-xs"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={val}
                        onChange={(e) => handleFieldChange(header, e.target.value)}
                        placeholder="ઉદા. 182-FOR FINAL HEARING DATE-20/10/2026..."
                        style={{ backgroundColor: '#ffffff', border: '2px solid #fdba74' }}
                        className="w-full text-xs sm:text-sm p-2 sm:p-2.5 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  );
                }

                // 4. Large Textarea Fields
                if (isFullWidth) {
                  return (
                    <div 
                      key={idx}
                      style={{ backgroundColor: '#fefce8', border: '2px solid #fde047' }}
                      className="space-y-1 md:col-span-2 p-3 rounded-2xl shadow-xs"
                    >
                      <label style={{ color: '#713f12' }} className="block text-xs font-black">
                        {header}
                      </label>
                      <textarea
                        rows={3}
                        value={val}
                        onChange={(e) => handleFieldChange(header, e.target.value)}
                        placeholder={`${header} વિગતવાર લખો...`}
                        style={{ backgroundColor: '#ffffff', border: '1.5px solid #facc15' }}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 leading-relaxed font-medium text-slate-900"
                      />
                    </div>
                  );
                }

                // 5. Standard Inputs
                return (
                  <div 
                    key={idx}
                    style={{ backgroundColor: '#f0f9ff', border: '2px solid #bae6fd' }}
                    className="space-y-1 p-3 rounded-2xl shadow-xs"
                  >
                    <label style={{ color: '#0369a1' }} className="block text-xs font-black">
                      {header}
                    </label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleFieldChange(header, e.target.value)}
                      placeholder={`${header}...`}
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #7dd3fc' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div 
            style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}
            className="px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shrink-0"
          >
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#ffffff', color: '#dc2626', border: '2px solid #f87171' }}
              className="px-4 py-2 text-xs font-black rounded-xl hover:bg-rose-50 transition-colors shadow-xs"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff'
              }}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>✓ કેસ ઉમેરો (Save)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
