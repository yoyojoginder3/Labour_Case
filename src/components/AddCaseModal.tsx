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
  Award,
  AlertTriangle,
  ShieldAlert,
  FileText,
  UserCheck,
  Building2,
  FileSpreadsheet
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
  const [targetSheet, setTargetSheet] = useState<SheetKey>(
    currentSheetKey === 'DISPOSED ARCHIVE' ? 'HC CASE' : currentSheetKey
  );

  // Court Case Details
  const [caseNo, setCaseNo] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [advocate, setAdvocate] = useState('');
  const [courtLocation, setCourtLocation] = useState('સુરત');
  const [statusVal, setStatusVal] = useState('182-FOR FINAL HEARING\nDATE-20/10/2026');
  const [lowerCourtOrder, setLowerCourtOrder] = useState('');

  // 10 Employee Service & Disciplinary Profile Fields (કર્મચારી સેવા & શિસ્ત વિગતો)
  const [empProfile, setEmpProfile] = useState<EmployeeProfile>({
    employeeName: '',
    dob: '',
    designation: 'કંડકટર',
    pfNo: '',
    appointmentDate: '',
    retirementDate: '',
    offenseDetails: '',
    punishmentOrder: 'નોકરીમાંથી બરતરફ (Dismissal)',
    firstAppeal: '',
    secondAppeal: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      setTargetSheet(currentSheetKey === 'DISPOSED ARCHIVE' ? 'HC CASE' : currentSheetKey);
      setCaseNo('');
      setFileNo('');
      setAdvocate(advocateList[0] || '');
      setCourtLocation('સુરત');
      setStatusVal(
        currentSheetKey === 'HC CASE' 
          ? '182-FOR FINAL HEARING\nDATE-20/10/2026'
          : 'For Argument of First Party\nDate- 20/10/2026'
      );
      setLowerCourtOrder('');
      setEmpProfile({
        employeeName: '',
        dob: '',
        designation: 'કંડકટર',
        pfNo: '',
        appointmentDate: '',
        retirementDate: '',
        offenseDetails: '',
        punishmentOrder: 'નોકરીમાંથી બરતરફ (Dismissal)',
        firstAppeal: '',
        secondAppeal: ''
      });
    }
  }, [isOpen, currentSheetKey, advocateList]);

  if (!isOpen) return null;

  const currentConfig = SHEET_CONFIGS[targetSheet];
  const headers = (targetSheet === currentSheetKey && customHeaders && customHeaders.length > 0)
    ? customHeaders
    : currentConfig.headers;

  const handleProfileChange = (key: keyof EmployeeProfile, val: string) => {
    setEmpProfile((prev) => ({ ...prev, [key]: val }));
  };

  const disputePresets = [
    { label: '🎟️ ટીકીટ ઉચાપત', text: '૫-એફ.સી. ટીકીટ રૂ|.૫૦/- લેખે ટીકીટ ભાડુ વસુલ કરી ટીકીટ ન આપી નાણાંની ઉચાપત.' },
    { label: '🚗 ફેટલ અકસ્માત', text: 'ફેટલ અકસ્માત (મુસાફર તેમજ ડ્રાયવર સંયુક્ત જવાબદાર છે).' },
    { label: '🚫 ગેરહાજરી', text: 'કોઈપણ ઉપલા અધિકારીશ્રીની પૂર્વ મંજુરી વગર મનસ્વીપણે ગેરહાજર રહેતાં શિસ્તભંગ કાર્યવાહી.' },
    { label: '💼 નવી નિમણુંક', text: 'ડ્રાયવર / કંડકટર નવી નિમણુંક અથવા જાતિ પ્રમાણપત્ર ખરાઈ બાબત.' },
    { label: '💰 રજા પગાર', text: 'રજાનો પગાર તથા અન્ય નિવૃતી અંગેના લાભો મેળવવા બાબતની રીકવરી અરજી.' },
    { label: '🍺 કેફીપીણું/ગેરશિસ્ત', text: 'ચાલુ ફરજે કેફીપીણાનું સેવન કરી અતિ ગંભીર પ્રકારની ગેરશિષ્ટ આચરી નિગમની પ્રતિષ્ઠાને હાની પહોંચાડવા બાબત.' }
  ];

  const punishmentPresets = [
    'નોકરીમાંથી બરતરફ (Dismissal)',
    'રીમુવ ફોર્મ સર્વીસીસ (Removal)',
    'પગાર ધોરણમાં ઘટાડો (Reduction in Pay)',
    'વાર્ષિક ઈજાફો અટકાવવો (Stoppage of Increment)',
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

  const statusPresets = targetSheet === 'HC CASE'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const empName = empProfile.employeeName.trim() || 'કર્મચારી';
    const des = empProfile.designation.trim() || 'કંડકટર';
    const pf = empProfile.pfNo.trim();
    const dob = empProfile.dob.trim();
    const dor = empProfile.retirementDate.trim();

    const infoParts: string[] = [];
    if (pf) infoParts.push(`PF: ${pf}`);
    if (dob) infoParts.push(`જન્મ: ${dob}`);
    if (dor) infoParts.push(`નિવૃત્તિ: ${dor}`);
    const infoLine = infoParts.length > 0 ? infoParts.join(' | ') : '';

    const offense = empProfile.offenseDetails.trim() || 'કેસ બાબત';
    const punishment = empProfile.punishmentOrder.trim();
    const caseSummary = punishment ? `${offense} (${punishment})` : offense;

    let newRow: string[] = [];

    if (targetSheet === 'HC CASE') {
      newRow = [
        '1',                                                                   // 0: ક્રમ નં.
        fileNo || '-',                                                         // 1: HCE ફાઈલ No.
        lowerCourtOrder || '-',                                                // 2: નીચલી કોર્ટના ચુકાદા
        caseNo || 'SCA-',                                                      // 3: SCA/LPA No.
        advocate || 'પેનલ એડવોકેટ',                                            // 4: નિગમના પેનલ એડવોકેટનું નામ
        `અરજદારઃ- ${empName} (${des})${infoLine ? `\n[${infoLine}]` : ''} સામાવાળાઃ- એસ.ટી.સંસ્થા`, // 5: કામદાર/અરજદારનું નામ
        caseSummary,                                                           // 6: કેસની ટૂંકી વિગત
        '-',                                                                   // 7: પેપર્સ સુપ્રત તારીખ
        '-',                                                                   // 8: વચગાળાના ચુકાદા
        '-',                                                                   // 9: એફિડેવિટ તારીખ
        statusVal || '182-FOR FINAL HEARING\nDATE-20/10/2026'                  // 10: કેસનું સ્ટેટસ
      ];
    } else {
      // LABOUR CASE or IT CASE
      newRow = [
        '1',                                                                   // 0: ક્રમ નં.
        caseNo || 'રેફ.નં.-',                                                  // 1: રેફ. નંબર
        courtLocation || 'સુરત',                                               // 2: લેબરકોર્ટ
        advocate || 'પેનલ એડવોકેટ',                                            // 3: નિગમના પેનલ એડવોકેટનું નામ
        `${empName}\n${des}${infoLine ? `\n${infoLine}` : ''}`,                 // 4: કર્મચારીનું નામ હોદ્દો/બેજ નં
        caseSummary,                                                           // 5: કેસની ટૂંકી વિગત
        statusVal || 'For Argument of First Party\nDate- 20/10/2026'           // 6: હાલની પરિસ્થિતી
      ];
    }

    // Ensure rows match the headers length
    while (newRow.length < headers.length) {
      newRow.push('');
    }

    onSubmit(targetSheet, newRow, empProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #4338ca' }}
        className="rounded-3xl shadow-2xl w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
      >
        {/* Colorful Gradient Header */}
        <div 
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6b21a8 100%)' }}
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
                  કર્મચારી સેવા & શિસ્ત વિગતો સાથે
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-blue-100 font-medium">
                કર્મચારીનું નામ, જન્મ તારીખ, PF, નિમણુક, શિક્ષા, અપીલ તેમજ કોર્ટ કેસની તમામ વિગતો એક સાથે ભરો
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
        <div style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }} className="p-3 sm:p-4 shrink-0">
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

        {/* Scrollable Form Body with Unified Direct Sections */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3.5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">

            {/* ============================================================== */}
            {/* SECTION 1: EMPLOYEE SERVICE & DISCIPLINARY DOSSIER (૧૦ વિગતો) */}
            {/* ============================================================== */}
            <div 
              style={{ backgroundColor: '#faf5ff', border: '2.5px solid #c084fc' }}
              className="p-4 sm:p-5 rounded-3xl space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-purple-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div 
                    style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black"
                  >
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-purple-950 flex items-center gap-2">
                      <span>૧. કર્મચારી સેવા & શિસ્તભંગ વિગતો (Employee Dossier)</span>
                      <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md font-bold">
                        ૧૦ વિગતો
                      </span>
                    </h3>
                    <p className="text-[11px] text-purple-800 font-medium">
                      આ વિગતો કેસ સાથે સાચવવામાં આવશે અને <strong>"Dossier Excel"</strong> માં પણ એક સાથે ડાઉનલોડ થશે
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Employee Name */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #86efac' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                  <label className="block text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>૧. કર્મચારીનું નામ (Employee Name)</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={empProfile.employeeName}
                    onChange={(e) => handleProfileChange('employeeName', e.target.value)}
                    placeholder="ઉદા. શ્રી રમેશભાઈ કે. પટેલ..."
                    style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #4ade80' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 2. Date of Birth */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #93c5fd' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                  <label className="block text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>૨. જન્મ તારીખ (Date of Birth)</span>
                  </label>
                  <input
                    type="text"
                    value={empProfile.dob}
                    onChange={(e) => handleProfileChange('dob', e.target.value)}
                    placeholder="ઉદા. 15/06/1975..."
                    style={{ backgroundColor: '#eff6ff', border: '1.5px solid #60a5fa' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* 3. Designation with quick select pills */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #fde047' }} className="p-3 rounded-2xl space-y-1.5 md:col-span-2 shadow-2xs">
                  <label className="block text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    <span>૩. હોદ્દો / કેડર / બેજ નં. (Designation & Badge No.)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {designationPresets.map((des) => (
                      <button
                        key={des}
                        type="button"
                        onClick={() => handleProfileChange('designation', des)}
                        style={{
                          backgroundColor: empProfile.designation === des ? '#ca8a04' : '#fefce8',
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
                    placeholder="ઉદા. કંડકટર બેજ નં. ૪૭૫૨..."
                    style={{ backgroundColor: '#fffbeb', border: '1.5px solid #facc15' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* 4. PF Number */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #5eead4' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                  <label className="block text-xs font-black text-teal-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-teal-600" />
                    <span>૪. PF નં. (Provident Fund Number)</span>
                  </label>
                  <input
                    type="text"
                    value={empProfile.pfNo}
                    onChange={(e) => handleProfileChange('pfNo', e.target.value)}
                    placeholder="ઉદા. PF/SRT/12485..."
                    style={{ backgroundColor: '#f0fdfa', border: '1.5px solid #2dd4bf' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                {/* 5. Appointment Date */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #bfdbfe' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                  <label className="block text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>૫. નોકરીમાં નિમણુકની તારીખ (Appointment Date)</span>
                  </label>
                  <input
                    type="text"
                    value={empProfile.appointmentDate}
                    onChange={(e) => handleProfileChange('appointmentDate', e.target.value)}
                    placeholder="ઉદા. 01/08/1998..."
                    style={{ backgroundColor: '#eff6ff', border: '1.5px solid #93c5fd' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* 6. Retirement Date */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #fed7aa' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                  <label className="block text-xs font-black text-orange-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>૬. નિવૃત્તિ તારીખ (Retirement Date)</span>
                  </label>
                  <input
                    type="text"
                    value={empProfile.retirementDate}
                    onChange={(e) => handleProfileChange('retirementDate', e.target.value)}
                    placeholder="ઉદા. 30/06/2033..."
                    style={{ backgroundColor: '#fff7ed', border: '1.5px solid #fdba74' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>

                {/* 7. Offense Details with Presets */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #fecdd3' }} className="p-3 rounded-2xl space-y-1.5 md:col-span-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-rose-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>૭. ગુનાની વિગત (Offense / Misconduct Details)</span>
                    </label>
                    <span className="text-[11px] font-bold text-rose-700">ઝડપી પ્રિસેટ્સ:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {disputePresets.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleProfileChange('offenseDetails', p.text)}
                        style={{ backgroundColor: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3' }}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition-all shadow-2xs cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={empProfile.offenseDetails}
                    onChange={(e) => handleProfileChange('offenseDetails', e.target.value)}
                    placeholder="ઉદા. તા. ૧૫/૦૮/૨૦૨૩ ના રોજ બસ ચેક થતાં ટિકિટના નાણાં ઉચાપત અથવા ફેટલ અકસ્માત..."
                    style={{ backgroundColor: '#fff1f2', border: '1.5px solid #fda4af' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* 8. Punishment Order with Presets */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #fca5a5' }} className="p-3 rounded-2xl space-y-1.5 md:col-span-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-red-950 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>૮. શિક્ષાત્મક હુકમ (Punishment / Disciplinary Order)</span>
                    </label>
                    <span className="text-[11px] font-bold text-red-700">ઝડપી પ્રિસેટ્સ:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {punishmentPresets.map((pun) => (
                      <button
                        key={pun}
                        type="button"
                        onClick={() => handleProfileChange('punishmentOrder', pun)}
                        style={{
                          backgroundColor: empProfile.punishmentOrder === pun ? '#dc2626' : '#fef2f2',
                          color: empProfile.punishmentOrder === pun ? '#ffffff' : '#991b1b',
                          border: '1.5px solid #fca5a5'
                        }}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
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
                    style={{ backgroundColor: '#fef2f2', border: '1.5px solid #f87171' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* 9. First Appeal */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #ddd6fe' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                  <label className="block text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>૯. પ્રથમ અપીલ (First Appeal)</span>
                  </label>
                  <input
                    type="text"
                    value={empProfile.firstAppeal}
                    onChange={(e) => handleProfileChange('firstAppeal', e.target.value)}
                    placeholder="ઉદા. વિભાગીય નિયામકશ્રી સમક્ષ તા. ૧૫/૦૪/૨૪ (નામંજૂર)..."
                    style={{ backgroundColor: '#f5f3ff', border: '1.5px solid #c4b5fd' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 10. Second Appeal */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #f5d0fe' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                  <label className="block text-xs font-black text-fuchsia-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-fuchsia-600" />
                    <span>૧૦. દ્વિતીય અપીલ (Second Appeal)</span>
                  </label>
                  <input
                    type="text"
                    value={empProfile.secondAppeal}
                    onChange={(e) => handleProfileChange('secondAppeal', e.target.value)}
                    placeholder="ઉદા. મધ્યસ્થ અપીલ સમિતિ સમક્ષ તા. ૨૨/૦૮/૨૪ (બહાલ રાખેલ)..."
                    style={{ backgroundColor: '#fdf4ff', border: '1.5px solid #f0abfc' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* SECTION 2: COURT CASE INFORMATION (કોર્ટ કેસ વિગતો) */}
            {/* ============================================================== */}
            <div 
              style={{ backgroundColor: '#f0f9ff', border: '2.5px solid #7dd3fc' }}
              className="p-4 sm:p-5 rounded-3xl space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-2 border-b border-sky-200 pb-2.5">
                <div 
                  style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-black"
                >
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-sky-950">
                    ૨. નામદાર કોર્ટ કેસ વિગતો ({targetSheet === 'HC CASE' ? 'હાઈકોર્ટ' : targetSheet === 'LABOUR CASE' ? 'લેબર કોર્ટ' : 'ઔદ્યોગિક અદાલત'})
                  </h3>
                  <p className="text-[11px] text-sky-800 font-medium">
                    કેસ નંબર, ફાઈલ નંબર, પેનલ એડવોકેટ અને કેસની વર્તમાન સ્થિતિ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Case / SCA / Ref No */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #bae6fd' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                  <label className="block text-xs font-black text-sky-950 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-sky-600" />
                    <span>{targetSheet === 'HC CASE' ? 'SCA / LPA / FA No.' : 'રેફરન્સ / કેસ નંબર'}</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={caseNo}
                    onChange={(e) => setCaseNo(e.target.value)}
                    placeholder={targetSheet === 'HC CASE' ? 'ઉદા. ૧૨૨૯૨/૨૦૨૩...' : 'ઉદા. ૩૦૪/૨૦૨૨...'}
                    style={{ backgroundColor: '#f0f9ff', border: '1.5px solid #38bdf8' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                {/* File No / HCE No (HC Case) or Court Location (Labour/IT) */}
                {targetSheet === 'HC CASE' ? (
                  <div style={{ backgroundColor: '#ffffff', border: '2px solid #bae6fd' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                    <label className="block text-xs font-black text-sky-950 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                      <span>HCE ફાઈલ નંબર (File No.)</span>
                    </label>
                    <input
                      type="text"
                      value={fileNo}
                      onChange={(e) => setFileNo(e.target.value)}
                      placeholder="ઉદા. ૮૦૩૯..."
                      style={{ backgroundColor: '#f0f9ff', border: '1.5px solid #38bdf8' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#ffffff', border: '2px solid #5eead4' }} className="p-3 rounded-2xl space-y-1 shadow-2xs">
                    <label className="block text-xs font-black text-teal-950 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>કોર્ટ સ્થળ (Court Location)</span>
                      <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      {['સુરત', 'અમદાવાદ'].map((court) => (
                        <button
                          key={court}
                          type="button"
                          onClick={() => setCourtLocation(court)}
                          style={{
                            backgroundColor: courtLocation === court ? '#0d9488' : '#f0fdfa',
                            color: courtLocation === court ? '#ffffff' : '#134e4a',
                            border: '1.5px solid #0d9488'
                          }}
                          className="flex-1 py-1.5 text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          {court}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advocate Selection */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #c084fc' }} className="p-3 rounded-2xl space-y-1.5 md:col-span-2 shadow-2xs">
                  <label className="block text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>નિગમના પેનલ એડવોકેટનું નામ</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={advocateList.includes(advocate) ? advocate : ''}
                      onChange={(e) => setAdvocate(e.target.value)}
                      style={{ backgroundColor: '#f5f3ff', border: '1.5px solid #a855f7', color: '#3b0764' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="">👤 પેનલ લિસ્ટમાંથી પસંદ કરો...</option>
                      {advocateList.map((adv) => (
                        <option key={adv} value={adv}>
                          {adv}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={advocate}
                      onChange={(e) => setAdvocate(e.target.value)}
                      placeholder="અથવા નવું એડવોકેટનું નામ લખો..."
                      style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1' }}
                      className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Case Status & Hearing Date with Presets */}
                <div style={{ backgroundColor: '#ffffff', border: '2px solid #fdba74' }} className="p-3 rounded-2xl space-y-1.5 md:col-span-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-orange-950 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-orange-600" />
                      <span>કેસનું સ્ટેટસ અને સુનાવણી તારીખ (Status & Hearing Date)</span>
                      <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-orange-700">ઝડપી પ્રિસેટ્સ:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {statusPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setStatusVal(preset.value)}
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
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    placeholder="ઉદા. 182-FOR FINAL HEARING DATE-20/10/2026..."
                    style={{ backgroundColor: '#fff7ed', border: '1.5px solid #fdba74' }}
                    className="w-full text-xs sm:text-sm p-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions Footer */}
          <div 
            style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}
            className="px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0"
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
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-black rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>✓ નવો કેસ અને કર્મચારી સેવા વિગતો સાચવો</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
