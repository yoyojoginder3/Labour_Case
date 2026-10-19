import React, { useState } from 'react';
import { SheetKey, EmployeeProfile } from '../types/case';
import { SHEET_CONFIGS } from '../data/initialData';
import { 
  X, 
  Plus, 
  Scale, 
  Sparkles, 
  Landmark, 
  Gavel, 
  CheckCircle2, 
  User, 
  Tag,
  Calendar,
  Briefcase,
  FileText,
  AlertTriangle,
  Award,
  ShieldAlert,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface AddCaseModalProps {
  isOpen: boolean;
  currentSheetKey: SheetKey;
  advocateList: string[];
  customHeaders?: string[];
  onClose: () => void;
  onSubmit: (targetSheet: SheetKey, newRow: string[], employeeProfile?: EmployeeProfile) => void;
}

export const AddCaseModal: React.FC<AddCaseModalProps> = ({
  isOpen,
  currentSheetKey,
  advocateList,
  customHeaders,
  onClose,
  onSubmit
}) => {
  const [targetSheet, setTargetSheet] = useState<SheetKey>(currentSheetKey);
  const [activeFormTab, setActiveFormTab] = useState<'case' | 'employee'>('case');

  // Court Case Form Fields
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Employee Service & Disciplinary Profile Fields (બધી ૧૦ વિગતો)
  const [empProfile, setEmpProfile] = useState<EmployeeProfile>({
    employeeName: '',
    dob: '',
    designation: 'કંડકટર',
    pfNo: '',
    appointmentDate: '',
    retirementDate: '',
    offenseDetails: '',
    punishmentOrder: '',
    firstAppeal: '',
    secondAppeal: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      setTargetSheet(currentSheetKey);
      setFormData({});
      setEmpProfile({
        employeeName: '',
        dob: '',
        designation: 'કંડકટર',
        pfNo: '',
        appointmentDate: '',
        retirementDate: '',
        offenseDetails: '',
        punishmentOrder: '',
        firstAppeal: '',
        secondAppeal: ''
      });
      setActiveFormTab('case');
    }
  }, [isOpen, currentSheetKey]);

  if (!isOpen) return null;

  const currentConfig = SHEET_CONFIGS[targetSheet];
  const headers = (targetSheet === currentSheetKey && customHeaders && customHeaders.length > 0)
    ? customHeaders
    : currentConfig.headers;

  const handleFieldChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleProfileChange = (key: keyof EmployeeProfile, val: string) => {
    setEmpProfile((prev) => ({ ...prev, [key]: val }));

    // Also auto-populate corresponding table fields
    if (key === 'employeeName' || key === 'designation' || key === 'pfNo') {
      const partyHeader = headers.find((h) => h.includes('કર્મચારી') || h.includes('કામદાર') || h.includes('અરજદાર')) || '';
      if (partyHeader) {
        const fullPartyText = targetSheet === 'HC CASE'
          ? `અરજદારઃ- ${key === 'employeeName' ? val : empProfile.employeeName} (${key === 'designation' ? val : empProfile.designation}) સામાવાળાઃ- એસ.ટી.સંસ્થા`
          : `${key === 'employeeName' ? val : empProfile.employeeName}\n${key === 'designation' ? val : empProfile.designation} ${key === 'pfNo' ? `PF:${val}` : (empProfile.pfNo ? `PF:${empProfile.pfNo}` : '')}`;
        setFormData((prev) => ({ ...prev, [partyHeader]: fullPartyText }));
      }
    }

    if (key === 'offenseDetails' || key === 'punishmentOrder') {
      const summaryHeader = headers.find((h) => h.includes('વિગત') || h.includes('ચુકાદા')) || '';
      if (summaryHeader) {
        const off = key === 'offenseDetails' ? val : empProfile.offenseDetails;
        const pun = key === 'punishmentOrder' ? val : empProfile.punishmentOrder;
        const combined = pun ? `${off} (${pun})` : off;
        setFormData((prev) => ({ ...prev, [summaryHeader]: combined }));
      }
    }
  };

  const handleApplyDisputePreset = (presetText: string) => {
    handleProfileChange('offenseDetails', presetText);
    const summaryHeader = headers.find((h) => h.includes('વિગત')) || '';
    if (summaryHeader) {
      setFormData((prev) => ({
        ...prev,
        [summaryHeader]: presetText
      }));
    }
  };

  const handleApplyPunishmentPreset = (preset: string) => {
    handleProfileChange('punishmentOrder', preset);
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

    // Ensure employee name and summary are synced to row if user only filled the employee profile tab
    const employeeHeader = headers.find((h) => h.includes('કર્મચારી') || h.includes('કામદાર') || h.includes('અરજદાર')) || '';
    const summaryHeader = headers.find((h) => h.includes('વિગત')) || '';

    const newFormData = { ...formData };

    if (employeeHeader && !newFormData[employeeHeader] && empProfile.employeeName) {
      newFormData[employeeHeader] = targetSheet === 'HC CASE'
        ? `અરજદારઃ- ${empProfile.employeeName} (${empProfile.designation}) સામાવાળાઃ- એસ.ટી.સંસ્થા`
        : `${empProfile.employeeName}\n${empProfile.designation} ${empProfile.pfNo ? `PF:${empProfile.pfNo}` : ''}`;
    }

    if (summaryHeader && !newFormData[summaryHeader] && empProfile.offenseDetails) {
      newFormData[summaryHeader] = empProfile.punishmentOrder 
        ? `${empProfile.offenseDetails} (${empProfile.punishmentOrder})`
        : empProfile.offenseDetails;
    }

    const newRow = headers.map((h, idx) => {
      if (idx === 0) return '1';
      return newFormData[h] || '';
    });

    onSubmit(targetSheet, newRow, empProfile);
    onClose();
  };

  const disputePresets = [
    { label: '🎟️ ટીકીટ ઉચાપત', bg: '#fef3c7', text: '#92400e', border: '#f59e0b', textContent: '૫-એફ.સી. ટીકીટ રૂ|.૫૦/- લેખે ટીકીટ ભાડુ વસુલ કરી ટીકીટ ન આપી નાણાંની ઉચાપત.' },
    { label: '🚗 ફેટલ અકસ્માત', bg: '#ffe4e6', text: '#9f1239', border: '#f43f5e', textContent: 'ફેટલ અકસ્માત (મુસાફર તેમજ ડ્રાયવર સંયુક્ત જવાબદાર છે).' },
    { label: '🚫 ગેરહાજરી', bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7', textContent: 'કોઈપણ ઉપલા અધિકારીશ્રીની પૂર્વ મંજુરી વગર મનસ્વીપણે ગેરહાજર રહેતાં શિસ્તભંગ કાર્યવાહી.' },
    { label: '💼 નવી નિમણુંક', bg: '#e0f2fe', text: '#0369a1', border: '#0ea5e9', textContent: 'ડ્રાયવર / કંડકટર નવી નિમણુંક અથવા જાતિ ખરાઈ બાબત.' },
    { label: '💰 રજા પગાર', bg: '#dcfce7', text: '#065f46', border: '#10b981', textContent: 'રજાનો પગાર તથા અન્ય નિવૃતી અંગેના લાભો મેળવવા બાબતની રીકવરી અરજી.' },
    { label: '🍺 કેફીપીણું/ગેરશિસ્ત', bg: '#ffedd5', text: '#9a3412', border: '#f97316', textContent: 'ચાલુ ફરજે કેફીપીણાનું સેવન કરી અતિ ગંભીર પ્રકારની ગેરશિષ્ટ આચરી નિગમની પ્રતિષ્ઠાને હાની પહોંચાડવા બાબત.' }
  ];

  const punishmentPresets = [
    'નોકરીમાંથી બરતરફ (Dismissal)',
    'રીમુવ ફોર્મ સર્વીસીસ (Removal)',
    'પગાર ધોરણમાં ૨ સ્ટેપ ઘટાડો (Reduction in Pay)',
    'વાર્ષિક ઈજાફો કાયમ માટે અટકાવવો (Stoppage of Increment)',
    'દંડ / રીકવરી આદેશ',
    'સેન્સર / ઠપકો (Censure)'
  ];

  const designationPresets = [
    'ડ્રાયવર',
    'કંડકટર',
    'જુ.કલાર્ક',
    'આર્ટિસન / મિકેનિક',
    'હેલ્પર',
    'એ.ટી.આઈ. (ATI)',
    'ટી.સી. (TC)',
    'સિક્યુરિટી ગાર્ડ',
    'ડેપો મેનેજર'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #6366f1' }}
        className="rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
      >
        {/* Colorful Gradient Header */}
        <div 
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #7c3aed 100%)' }}
          className="text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shrink-0 shadow-md"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div 
              style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
              className="p-2 sm:p-2.5 rounded-2xl shadow-md font-black"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>નવો કેસ દાખલ કરો</span>
                <span 
                  style={{ backgroundColor: 'rgba(253, 224, 71, 0.25)', color: '#fde047', border: '1px solid #facc15' }}
                  className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full"
                >
                  સેવા & શિસ્ત Dossier સાથે
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-blue-100 font-medium">
                કોર્ટ કેસ તેમજ કર્મચારીની જન્મ તારીખ, PF, નિમણુક, શિક્ષા, અપીલ તમામ વિગતો ભરો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Target Court Selection Strip */}
        <div style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }} className="p-3 sm:p-4">
          <label className="block text-xs font-black text-slate-800 mb-2">
            કઈ કોર્ટમાં કેસ ઉમેરવો છે તે પસંદ કરો:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['HC CASE', 'LABOUR CASE', 'IT CASE'] as SheetKey[]).map((key) => {
              const isSelected = targetSheet === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTargetSheet(key)}
                  style={{
                    backgroundColor: isSelected 
                      ? key === 'HC CASE' ? '#1d4ed8' : key === 'LABOUR CASE' ? '#059669' : '#7c3aed'
                      : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    borderColor: isSelected 
                      ? key === 'HC CASE' ? '#1e40af' : key === 'LABOUR CASE' ? '#047857' : '#6d28d9'
                      : '#cbd5e1'
                  }}
                  className="p-2.5 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {key === 'HC CASE' ? <Landmark className="w-4 h-4" /> : key === 'LABOUR CASE' ? <Scale className="w-4 h-4" /> : <Gavel className="w-4 h-4" />}
                  <span>{key === 'HC CASE' ? 'હાઈકોર્ટ (HC)' : key === 'LABOUR CASE' ? 'લેબર કોર્ટ' : 'ઔદ્યોગિક (IT)'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Navigation Tabs: Court Info vs Employee Dossier */}
        <div className="flex border-b-2 border-slate-200 bg-slate-100 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveFormTab('case')}
            style={{
              backgroundColor: activeFormTab === 'case' ? '#ffffff' : 'transparent',
              color: activeFormTab === 'case' ? '#1e3a8a' : '#64748b',
              borderColor: activeFormTab === 'case' ? '#1e3a8a' : 'transparent'
            }}
            className="px-4 py-2 text-xs sm:text-sm font-black rounded-t-xl border-t-2 border-x-2 -mb-[2px] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Scale className="w-4 h-4 text-blue-600" />
            <span>૧. કોર્ટ કેસ વિગત</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('employee')}
            style={{
              backgroundColor: activeFormTab === 'employee' ? '#ffffff' : 'transparent',
              color: activeFormTab === 'employee' ? '#6b21a8' : '#64748b',
              borderColor: activeFormTab === 'employee' ? '#6b21a8' : 'transparent'
            }}
            className="px-4 py-2 text-xs sm:text-sm font-black rounded-t-xl border-t-2 border-x-2 -mb-[2px] flex items-center gap-2 transition-all cursor-pointer relative"
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span>૨. કર્મચારી સેવા & શિસ્ત વિગતો (Dossier)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </button>
        </div>

        {/* Main Form Fields */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">

            {/* TAB 1: COURT CASE FIELDS */}
            {activeFormTab === 'case' && (
              <div className="space-y-4">
                {/* Dispute Presets Strip */}
                <div style={{ backgroundColor: '#fffbeb', border: '1.5px solid #fde047' }} className="p-3 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>કેસ વિવાદ પ્રિસેટ પસંદ કરો (Auto-fill Summary):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {disputePresets.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleApplyDisputePreset(p.textContent)}
                        style={{ backgroundColor: p.bg, color: p.text, borderColor: p.border }}
                        className="border px-2.5 py-1 rounded-xl text-[11px] font-bold hover:scale-105 active:scale-95 transition-all shadow-2xs"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {headers.map((header, idx) => {
                    if (idx === 0) return null; // skip serial no
                    const val = formData[header] || '';
                    const isFullWidth =
                      header.includes('વિગત') ||
                      header.includes('ચુકાદા') ||
                      header.includes('સ્ટેટસ') ||
                      header.includes('પરિસ્થિતી');

                    // Advocate Selection
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

                    // Court Location (Labour/IT)
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
                                className="flex-1 py-1.5 sm:py-2 text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
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

                    // Status Presets
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
                                className="text-[11px] sm:text-xs font-extrabold px-2.5 py-1 rounded-xl transition-all hover:scale-105 shadow-xs cursor-pointer"
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

                    // Large Textarea
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

                    // Standard Inputs
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

                {/* Switch to Employee Dossier Tab Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('employee')}
                    style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1.5px solid #c084fc' }}
                    className="px-4 py-2 rounded-xl text-xs font-black hover:bg-purple-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>કર્મચારી સેવા & શિસ્ત વિગતો ભરો (જન્મ તારીખ, PF, નિમણુક, શિક્ષા, અપીલ)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: EMPLOYEE SERVICE & DISCIPLINARY PROFILE (૧૦ વિગતો) */}
            {activeFormTab === 'employee' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div 
                  style={{ backgroundColor: '#faf5ff', border: '2px solid #c084fc' }}
                  className="p-4 rounded-2xl space-y-1"
                >
                  <h3 className="text-sm font-black text-purple-950 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>કર્મચારી સેવા અને શિસ્તભંગ કાર્યવાહી પ્રોફાઇલ (Dossier)</span>
                  </h3>
                  <p className="text-xs text-purple-800 font-medium">
                    આ વિગતો કેસ સાથે સાચવવામાં આવશે અને સ્પેશિયલ <strong>"કર્મચારી Dossier Excel"</strong> માં તમામ વિગતો એક સાથે ડાઉનલોડ થશે.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 1. Employee Name */}
                  <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }} className="p-3.5 rounded-2xl space-y-1">
                    <label className="block text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>૧. કર્મચારીનું નામ (Employee Name)</span>
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={empProfile.employeeName}
                      onChange={(e) => handleProfileChange('employeeName', e.target.value)}
                      placeholder="ઉદા. શ્રી રમેશભાઈ કે. પટેલ..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #4ade80' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 2. Date of Birth */}
                  <div style={{ backgroundColor: '#eff6ff', border: '2px solid #93c5fd' }} className="p-3.5 rounded-2xl space-y-1">
                    <label className="block text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>૨. જન્મ તારીખ (Date of Birth)</span>
                    </label>
                    <input
                      type="text"
                      value={empProfile.dob}
                      onChange={(e) => handleProfileChange('dob', e.target.value)}
                      placeholder="ઉદા. 15/06/1975 અથવા YYYY-MM-DD..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #60a5fa' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  {/* 3. Designation with quick pills */}
                  <div style={{ backgroundColor: '#fefce8', border: '2px solid #fde047' }} className="p-3.5 rounded-2xl space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-amber-600" />
                      <span>૩. હોદ્દો / કેડર / બેજ નં. (Designation & Badge No.)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {designationPresets.map((des) => (
                        <button
                          key={des}
                          type="button"
                          onClick={() => handleProfileChange('designation', des)}
                          style={{
                            backgroundColor: empProfile.designation === des ? '#ca8a04' : '#ffffff',
                            color: empProfile.designation === des ? '#ffffff' : '#854d0e',
                            border: '1.5px solid #eab308'
                          }}
                          className="px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          {des}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={empProfile.designation}
                      onChange={(e) => handleProfileChange('designation', e.target.value)}
                      placeholder="ઉદા. કંડકટર બેજ નં. ૪૭૫૨ / સુરત ડેપો..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #facc15' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* 4. PF Number */}
                  <div style={{ backgroundColor: '#f0fdfa', border: '2px solid #5eead4' }} className="p-3.5 rounded-2xl space-y-1">
                    <label className="block text-xs font-black text-teal-950 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-teal-600" />
                      <span>૪. PF નં. (Provident Fund Number)</span>
                    </label>
                    <input
                      type="text"
                      value={empProfile.pfNo}
                      onChange={(e) => handleProfileChange('pfNo', e.target.value)}
                      placeholder="ઉદા. PF/SRT/12485..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #2dd4bf' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>

                  {/* 5. Appointment Date */}
                  <div style={{ backgroundColor: '#eff6ff', border: '2px solid #bfdbfe' }} className="p-3.5 rounded-2xl space-y-1">
                    <label className="block text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>૫. નોકરીમાં નિમણુકની તારીખ (Appointment Date)</span>
                    </label>
                    <input
                      type="text"
                      value={empProfile.appointmentDate}
                      onChange={(e) => handleProfileChange('appointmentDate', e.target.value)}
                      placeholder="ઉદા. 01/08/1998..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #93c5fd' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  {/* 6. Retirement Date */}
                  <div style={{ backgroundColor: '#fff7ed', border: '2px solid #fed7aa' }} className="p-3.5 rounded-2xl space-y-1">
                    <label className="block text-xs font-black text-orange-950 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span>૬. નિવૃત્તિ તારીખ (Retirement Date)</span>
                    </label>
                    <input
                      type="text"
                      value={empProfile.retirementDate}
                      onChange={(e) => handleProfileChange('retirementDate', e.target.value)}
                      placeholder="ઉદા. 30/06/2033..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #fdba74' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                  </div>

                  {/* 7. Offense / Misconduct Details */}
                  <div style={{ backgroundColor: '#fff1f2', border: '2px solid #fecdd3' }} className="p-3.5 rounded-2xl space-y-1 md:col-span-2">
                    <label className="block text-xs font-black text-rose-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>૭. ગુનાની વિગત (Offense / Misconduct Details)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={empProfile.offenseDetails}
                      onChange={(e) => handleProfileChange('offenseDetails', e.target.value)}
                      placeholder="ઉદા. તા. ૧૫/૦૮/૨૦૨૩ ના રોજ બસ ચેક થતાં ટિકિટના નાણાં ઉચાપત અથવા ફેટલ અકસ્માત..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #fda4af' }}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* 8. Punishment / Disciplinary Order with presets */}
                  <div style={{ backgroundColor: '#fef2f2', border: '2px solid #fca5a5' }} className="p-3.5 rounded-2xl space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-red-950 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>૮. શિક્ષાત્મક હુકમ (Punishment / Disciplinary Order)</span>
                      </label>
                      <span className="text-[11px] font-bold text-red-700">પ્રિસેટ્સ:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {punishmentPresets.map((pun) => (
                        <button
                          key={pun}
                          type="button"
                          onClick={() => handleApplyPunishmentPreset(pun)}
                          style={{
                            backgroundColor: empProfile.punishmentOrder === pun ? '#dc2626' : '#ffffff',
                            color: empProfile.punishmentOrder === pun ? '#ffffff' : '#991b1b',
                            border: '1.5px solid #f87171'
                          }}
                          className="px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          {pun}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={empProfile.punishmentOrder}
                      onChange={(e) => handleProfileChange('punishmentOrder', e.target.value)}
                      placeholder="ઉદા. પત્ર નં. ૪૨૫, તા. ૨૦/૦૨/૨૦૨૪ થી નોકરીમાંથી બરતરફ (Dismissal)..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #f87171' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* 9. First Appeal */}
                  <div style={{ backgroundColor: '#f5f3ff', border: '2px solid #ddd6fe' }} className="p-3.5 rounded-2xl space-y-1">
                    <label className="block text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>૯. પ્રથમ અપીલ (First Appeal)</span>
                    </label>
                    <input
                      type="text"
                      value={empProfile.firstAppeal}
                      onChange={(e) => handleProfileChange('firstAppeal', e.target.value)}
                      placeholder="ઉદા. વિભાગીય નિયામકશ્રી સમક્ષ તા. ૧૫/૦૪/૨૪ (નામંજૂર)..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #c4b5fd' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* 10. Second Appeal */}
                  <div style={{ backgroundColor: '#fdf4ff', border: '2px solid #f5d0fe' }} className="p-3.5 rounded-2xl space-y-1">
                    <label className="block text-xs font-black text-fuchsia-950 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-fuchsia-600" />
                      <span>૧૦. દ્વિતીય અપીલ (Second Appeal)</span>
                    </label>
                    <input
                      type="text"
                      value={empProfile.secondAppeal}
                      onChange={(e) => handleProfileChange('secondAppeal', e.target.value)}
                      placeholder="ઉદા. મધ્યસ્થ અપીલ સમિતિ સમક્ષ તા. ૨૨/૦૮/૨૪ (બહાલ રાખેલ)..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #f0abfc' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-fuchsia-500"
                    />
                  </div>
                </div>

                {/* Back to Court Case Tab Button */}
                <div className="pt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('case')}
                    style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1.5px solid #93c5fd' }}
                    className="px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
                  >
                    ← કોર્ટ કેસ વિગતો ચકાસો
                  </button>
                </div>
              </div>
            )}
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
              className="px-4 py-2 text-xs font-black rounded-xl hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff'
              }}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>✓ કેસ અને સેવા વિગત સાચવો (Save Case & Dossier)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
