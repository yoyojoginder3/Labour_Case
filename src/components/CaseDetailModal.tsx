import React, { useState } from 'react';
import { SheetKey, EmployeeProfile } from '../types/case';
import { getStatusCategory, extractDateFromStatus, extractInitialProfileFromRow } from '../data/initialData';
import { DatePickerField } from './DatePickerField';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Edit2, 
  Save, 
  Calendar, 
  Scale, 
  ExternalLink, 
  Globe,
  UserCheck,
  User,
  Briefcase,
  Award,
  AlertTriangle,
  ShieldAlert,
  FileText
} from 'lucide-react';

interface CaseDetailModalProps {
  isOpen: boolean;
  sheetKey: SheetKey;
  headers: string[];
  rowData: string[];
  rowIndex: number;
  employeeProfile?: EmployeeProfile;
  isAdmin?: boolean;
  onClose: () => void;
  onSaveRow: (updatedRow: string[], updatedProfile?: EmployeeProfile) => void;
  onDeleteRow: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  isOpen,
  sheetKey,
  headers,
  rowData,
  rowIndex,
  employeeProfile,
  isAdmin = false,
  onClose,
  onSaveRow,
  onDeleteRow
}) => {
  const [activeTab, setActiveTab] = useState<'case' | 'dossier'>('case');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<string[]>(rowData || []);
  const [profileData, setProfileData] = useState<EmployeeProfile>(() => {
    return employeeProfile || extractInitialProfileFromRow(sheetKey, rowData || []);
  });
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setFormData(rowData || []);
    setProfileData(employeeProfile || extractInitialProfileFromRow(sheetKey, rowData || []));
    setIsEditing(false);
    setActiveTab('case');
  }, [rowData, employeeProfile, sheetKey]);

  if (!isOpen || !rowData) return null;

  const handleFieldChange = (index: number, val: string) => {
    const updated = [...formData];
    updated[index] = val;
    setFormData(updated);
  };

  const handleProfileFieldChange = (key: keyof EmployeeProfile, val: string) => {
    setProfileData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSaveRow(formData, profileData);
    setIsEditing(false);
  };

  const statusCol = sheetKey === 'HC CASE' ? 10 : 6;
  const statusVal = formData[statusCol] || '';
  const statusCat = getStatusCategory(statusVal);
  const hearingDate = extractDateFromStatus(statusVal);

  const handleCopy = () => {
    const caseText = headers
      .map((h, i) => `${h}: ${formData[i] || '-'}`)
      .join('\n');
    const dossierText = `
--- કર્મચારી સેવા અને શિસ્ત વિગતો ---
કર્મચારીનું નામ: ${profileData.employeeName || '-'}
જન્મ તારીખ: ${profileData.dob || '-'}
હોદ્દો: ${profileData.designation || '-'}
PF નં.: ${profileData.pfNo || '-'}
નિમણુક તારીખ: ${profileData.appointmentDate || '-'}
નિવૃત્તિ તારીખ: ${profileData.retirementDate || '-'}
ગુનાની વિગત: ${profileData.offenseDetails || '-'}
શિક્ષાત્મક હુકમ: ${profileData.punishmentOrder || '-'}
પ્રથમ અપીલ: ${profileData.firstAppeal || '-'}
દ્વિતીય અપીલ: ${profileData.secondAppeal || '-'}`;

    navigator.clipboard.writeText(caseText + '\n' + dossierText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const caseIdentifier = formData[3] || formData[1] || `કેસ ક્રમ: ${rowIndex - 1}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #1e3a8a' }}
        className="rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
      >
        {/* Header */}
        <div 
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)' }}
          className="p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black shadow-lg"
            >
              <Scale className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span 
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
                  className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md text-amber-300"
                >
                  {sheetKey}
                </span>
                <span className="text-xs text-blue-200 font-mono font-bold">
                  રેકોર્ડ ક્રમ: {rowIndex - 1}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black tracking-tight text-white line-clamp-1 mt-0.5">
                {caseIdentifier}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.4)' }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white hover:bg-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>સંપાદન (Edit)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Sub Header: Status & Quick Action Buttons */}
        <div 
          style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}
          className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs font-bold"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>કેસ સ્લિપ પ્રિન્ટ</span>
            </button>
          </div>
        </div>

        {/* Tab Selector: Court Case vs Employee Dossier */}
        <div className="flex border-b-2 border-slate-200 bg-slate-100 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('case')}
            style={{
              backgroundColor: activeTab === 'case' ? '#ffffff' : 'transparent',
              color: activeTab === 'case' ? '#1d4ed8' : '#64748b',
              borderColor: activeTab === 'case' ? '#1d4ed8' : 'transparent'
            }}
            className="px-4 py-2 text-xs sm:text-sm font-black rounded-t-xl border-t-2 border-x-2 -mb-[2px] flex items-center gap-2 cursor-pointer transition-all"
          >
            <Scale className="w-4 h-4 text-blue-600" />
            <span>૧. કોર્ટ કેસ વિગતો</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            style={{
              backgroundColor: activeTab === 'dossier' ? '#ffffff' : 'transparent',
              color: activeTab === 'dossier' ? '#7c3aed' : '#64748b',
              borderColor: activeTab === 'dossier' ? '#7c3aed' : 'transparent'
            }}
            className="px-4 py-2 text-xs sm:text-sm font-black rounded-t-xl border-t-2 border-x-2 -mb-[2px] flex items-center gap-2 cursor-pointer transition-all"
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span>૨. કર્મચારી સેવા & શિસ્ત વિગતો (Dossier)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">

          {/* TAB 1: COURT CASE FIELDS */}
          {activeTab === 'case' && (
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
                      (header.includes('તારીખ') || header.includes('date')) && !header.includes('સ્ટેટસ') && !header.includes('પરિસ્થિતી') && !header.includes('પેપર્સ') ? (
                        <DatePickerField
                          value={val}
                          onChange={(d) => handleFieldChange(idx, d)}
                          placeholder="DD/MM/YYYY પસંદ કરો..."
                          inputStyle={{
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            border: '2px solid #2563eb'
                          }}
                        />
                      ) : (header.includes('સ્ટેટસ') || header.includes('પરિસ્થિતી')) ? (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={val}
                            onChange={(e) => handleFieldChange(idx, e.target.value)}
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#0f172a',
                              border: '2px solid #2563eb'
                            }}
                            className="w-full text-xs sm:text-sm p-2.5 rounded-xl font-bold text-slate-950 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                          />
                          <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200">
                            <label className="block text-[11px] font-black text-orange-900 mb-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-orange-600" />
                              <span>🗓️ સુનાવણી / મુદત તારીખ (Date Picker):</span>
                            </label>
                            <DatePickerField
                              value={extractDateFromStatus(val) || ''}
                              onChange={(d) => {
                                if (!d) return;
                                if (/(DATE|Date|તારીખ)[:\s-]*\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/i.test(val)) {
                                  handleFieldChange(idx, val.replace(/(DATE|Date|તારીખ)[:\s-]*\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/i, `DATE-${d}`));
                                } else if (/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/.test(val)) {
                                  handleFieldChange(idx, val.replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/, d));
                                } else {
                                  handleFieldChange(idx, `${val.trim()}\nDATE-${d}`);
                                }
                              }}
                              placeholder="મુદત તારીખ પસંદ કરો..."
                              inputStyle={{ backgroundColor: '#ffffff', border: '1.5px solid #fb923c' }}
                            />
                          </div>
                        </div>
                      ) : isFullWidth ? (
                        <textarea
                          rows={3}
                          value={val}
                          onChange={(e) => handleFieldChange(idx, e.target.value)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
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
          )}

          {/* TAB 2: EMPLOYEE SERVICE & DISCIPLINARY DOSSIER */}
          {activeTab === 'dossier' && (
            <div className="space-y-4">
              <div 
                style={{ backgroundColor: '#faf5ff', border: '2px solid #c084fc' }}
                className="p-4 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-black text-purple-950 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>કર્મચારી સેવા અને શિસ્તભંગ વિગતવાર પ્રોફાઇલ</span>
                  </h3>
                  <p className="text-xs text-purple-800 font-medium">
                    આ વિગતો અલગ એક્સેલ (Dossier Excel) માં તમામ કેસો સાથે ડાઉનલોડ કરવા માટે વપરાય છે.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Petitioner Type Indicator */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #38bdf8' }} className="p-3.5 rounded-2xl md:col-span-2 shadow-2xs space-y-2">
                  <label className="block text-xs font-black text-sky-950 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-sky-600" />
                    <span>કેસ કોણે દાખલ કરેલ છે? (પક્ષકારો / અરજદાર પ્રકાર)</span>
                  </label>
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleProfileFieldChange('petitionerType', 'employee')}
                        style={{
                          backgroundColor: (profileData.petitionerType || 'employee') === 'employee' ? '#eff6ff' : '#f8fafc',
                          borderColor: (profileData.petitionerType || 'employee') === 'employee' ? '#2563eb' : '#cbd5e1',
                          color: (profileData.petitionerType || 'employee') === 'employee' ? '#1e3a8a' : '#475569'
                        }}
                        className="p-2.5 rounded-xl border-2 text-left font-bold text-xs flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">🧑‍💼</span>
                        <span>૧. કર્મચારી દ્વારા દાખલ (અરજદાર: કર્મચારી)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProfileFieldChange('petitionerType', 'st')}
                        style={{
                          backgroundColor: profileData.petitionerType === 'st' ? '#f0fdf4' : '#f8fafc',
                          borderColor: profileData.petitionerType === 'st' ? '#16a34a' : '#cbd5e1',
                          color: profileData.petitionerType === 'st' ? '#14532d' : '#475569'
                        }}
                        className="p-2.5 rounded-xl border-2 text-left font-bold text-xs flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">🚌</span>
                        <span>૨. એસ.ટી. નિગમ દ્વારા દાખલ (અરજદાર: એસ.ટી.)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          backgroundColor: profileData.petitionerType === 'st' ? '#dcfce7' : '#dbeafe',
                          color: profileData.petitionerType === 'st' ? '#166534' : '#1e40af',
                          border: `1.5px solid ${profileData.petitionerType === 'st' ? '#86efac' : '#93c5fd'}`
                        }}
                        className="px-3 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1.5"
                      >
                        <span>{profileData.petitionerType === 'st' ? '🚌' : '🧑‍💼'}</span>
                        <span>{profileData.petitionerType === 'st' ? 'એસ.ટી. નિગમ દ્વારા દાખલ (અરજદાર: એસ.ટી. નિગમ / સંસ્થા)' : 'કર્મચારી દ્વારા દાખલ (અરજદાર: કર્મચારી)'}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* 1. Employee Name */}
                <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }} className="p-3.5 rounded-2xl space-y-1">
                  <label className="block text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>૧. કર્મચારીનું નામ (Employee Name)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.employeeName}
                      onChange={(e) => handleProfileFieldChange('employeeName', e.target.value)}
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #4ade80' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{profileData.employeeName || '-'}</div>
                  )}
                </div>

                {/* 2. Date of Birth */}
                <div style={{ backgroundColor: '#eff6ff', border: '2px solid #93c5fd' }} className="p-3.5 rounded-2xl space-y-1">
                  <label className="block text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>૨. જન્મ તારીખ (Date of Birth)</span>
                  </label>
                  {isEditing ? (
                    <DatePickerField
                      value={profileData.dob}
                      onChange={(d) => handleProfileFieldChange('dob', d)}
                      placeholder="DD/MM/YYYY પસંદ કરો..."
                      inputStyle={{ backgroundColor: '#ffffff', border: '1.5px solid #60a5fa' }}
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono">{profileData.dob || '-'}</div>
                  )}
                </div>

                {/* 3. Designation */}
                <div style={{ backgroundColor: '#fefce8', border: '2px solid #fde047' }} className="p-3.5 rounded-2xl space-y-1">
                  <label className="block text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    <span>૩. હોદ્દો / બેજ નં. (Designation)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.designation}
                      onChange={(e) => handleProfileFieldChange('designation', e.target.value)}
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #facc15' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{profileData.designation || '-'}</div>
                  )}
                </div>

                {/* 4. PF No */}
                <div style={{ backgroundColor: '#f0fdfa', border: '2px solid #5eead4' }} className="p-3.5 rounded-2xl space-y-1">
                  <label className="block text-xs font-black text-teal-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-teal-600" />
                    <span>૪. PF નં. (PF Number)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.pfNo}
                      onChange={(e) => handleProfileFieldChange('pfNo', e.target.value)}
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #2dd4bf' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 font-mono"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono">{profileData.pfNo || '-'}</div>
                  )}
                </div>

                {/* 5. Appointment Date */}
                <div style={{ backgroundColor: '#eff6ff', border: '2px solid #bfdbfe' }} className="p-3.5 rounded-2xl space-y-1">
                  <label className="block text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>૫. નોકરીમાં નિમણુકની તારીખ (Appointment Date)</span>
                  </label>
                  {isEditing ? (
                    <DatePickerField
                      value={profileData.appointmentDate}
                      onChange={(d) => handleProfileFieldChange('appointmentDate', d)}
                      placeholder="DD/MM/YYYY પસંદ કરો..."
                      inputStyle={{ backgroundColor: '#ffffff', border: '1.5px solid #93c5fd' }}
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono">{profileData.appointmentDate || '-'}</div>
                  )}
                </div>

                {/* 6. Retirement Date */}
                <div style={{ backgroundColor: '#fff7ed', border: '2px solid #fed7aa' }} className="p-3.5 rounded-2xl space-y-1">
                  <label className="block text-xs font-black text-orange-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>૬. નિવૃત્તિ તારીખ (Retirement Date)</span>
                  </label>
                  {isEditing ? (
                    <DatePickerField
                      value={profileData.retirementDate}
                      onChange={(d) => handleProfileFieldChange('retirementDate', d)}
                      placeholder="DD/MM/YYYY પસંદ કરો..."
                      inputStyle={{ backgroundColor: '#ffffff', border: '1.5px solid #fdba74' }}
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono">{profileData.retirementDate || '-'}</div>
                  )}
                </div>

                {/* 7. Offense Details */}
                <div style={{ backgroundColor: '#fff1f2', border: '2px solid #fecdd3' }} className="p-3.5 rounded-2xl space-y-1 md:col-span-2">
                  <label className="block text-xs font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>૭. ગુનાની વિગત (Offense / Misconduct Details)</span>
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={profileData.offenseDetails}
                      onChange={(e) => handleProfileFieldChange('offenseDetails', e.target.value)}
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #fda4af' }}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl font-medium text-slate-900"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-medium text-slate-900 whitespace-pre-wrap">{profileData.offenseDetails || '-'}</div>
                  )}
                </div>

                {/* 8. Punishment Order */}
                <div style={{ backgroundColor: '#fef2f2', border: '2px solid #fca5a5' }} className="p-3.5 rounded-2xl space-y-1 md:col-span-2">
                  <label className="block text-xs font-black text-red-950 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>૮. શિક્ષાત્મક હુકમ (Punishment / Disciplinary Order)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.punishmentOrder}
                      onChange={(e) => handleProfileFieldChange('punishmentOrder', e.target.value)}
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #f87171' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-red-800">{profileData.punishmentOrder || '-'}</div>
                  )}
                </div>

                {/* 9. First Appeal */}
                <div style={{ backgroundColor: '#f5f3ff', border: '2px solid #ddd6fe' }} className="p-3.5 rounded-2xl space-y-1">
                  <label className="block text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>૯. પ્રથમ અપીલ (First Appeal)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.firstAppeal}
                      onChange={(e) => handleProfileFieldChange('firstAppeal', e.target.value)}
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #c4b5fd' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{profileData.firstAppeal || '-'}</div>
                  )}
                </div>

                {/* 10. Second Appeal */}
                <div style={{ backgroundColor: '#fdf4ff', border: '2px solid #f5d0fe' }} className="p-3.5 rounded-2xl space-y-1">
                  <label className="block text-xs font-black text-fuchsia-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-fuchsia-600" />
                    <span>૧૦. દ્વિતીય અપીલ (Second Appeal)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.secondAppeal}
                      onChange={(e) => handleProfileFieldChange('secondAppeal', e.target.value)}
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #f0abfc' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{profileData.secondAppeal || '-'}</div>
                  )}
                </div>
              </div>
            </div>
          )}
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
              className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
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
                    setProfileData(employeeProfile || extractInitialProfileFromRow(sheetKey, rowData || []));
                    setIsEditing(false);
                  }}
                  style={{ backgroundColor: '#ffffff', color: '#475569', border: '1.5px solid #cbd5e1' }}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  onClick={handleSave}
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                  className="px-5 py-2 text-xs font-black rounded-xl shadow-md transition-all hover:brightness-110 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>સેવ કરો (Save All)</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
                className="px-5 py-2 text-xs font-black rounded-xl shadow-md transition-all hover:brightness-110 cursor-pointer"
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
