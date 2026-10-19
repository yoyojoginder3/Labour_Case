import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { SheetKey, SheetDataMap } from '../types/case';
import { SHEET_CONFIGS, isValidCaseRow } from '../data/initialData';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  RefreshCw, 
  PlusCircle, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  Eye,
  Download
} from 'lucide-react';

interface ExcelUploadModalProps {
  isOpen: boolean;
  currentActiveSheet: SheetKey | 'SUMMARY' | 'CALENDAR';
  existingData: SheetDataMap;
  isAdmin: boolean;
  onAdminLoginRequired: () => void;
  onConfirmImport: (newSheetData: SheetDataMap, mode: 'replace' | 'merge') => void;
  onClose: () => void;
}

interface ParsedSheetInfo {
  sheetName: string;
  targetKey: SheetKey;
  rowCount: number;
  previewRows: string[][];
  headers: string[];
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  currentActiveSheet,
  existingData,
  isAdmin,
  onAdminLoginRequired,
  onConfirmImport,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedSheets, setParsedSheets] = useState<ParsedSheetInfo[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [rawWorkbookData, setRawWorkbookData] = useState<SheetDataMap | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  // Intelligently map sheet names
  const resolveTargetKey = (sheetName: string, index: number): SheetKey => {
    const s = sheetName.toUpperCase().trim();
    if (s.includes('HC') || s.includes('HIGH') || s.includes('હાઈ') || s.includes('હાઇ')) {
      return 'HC CASE';
    }
    if (s.includes('LABOUR') || s.includes('લેબર') || s.includes('મજૂર')) {
      return 'LABOUR CASE';
    }
    if (s.includes('IT') || s.includes('INDUS') || s.includes('ઔદ્યોગિક') || s.includes('ટ્રિબ્યુનલ')) {
      return 'IT CASE';
    }
    if (s.includes('DISPOSED') || s.includes('નિકાલ') || s.includes('ARCHIVE') || s.includes('ચુકાદો')) {
      return 'DISPOSED ARCHIVE';
    }

    // If current tab is a valid sheet, map to it for single-sheet file
    if (currentActiveSheet !== 'SUMMARY' && currentActiveSheet !== 'CALENDAR') {
      return currentActiveSheet;
    }

    // Default fallback by index
    if (index === 0) return 'HC CASE';
    if (index === 1) return 'LABOUR CASE';
    if (index === 2) return 'IT CASE';
    return 'HC CASE';
  };

  const handleFile = (file: File) => {
    setErrorMsg('');
    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataBuffer = e.target?.result;
        const wb = XLSX.read(dataBuffer, { type: 'array' });

        const extractedWorkbook: SheetDataMap = {};
        const sheetDetails: ParsedSheetInfo[] = [];

        wb.SheetNames.forEach((sheetName, idx) => {
          const ws = wb.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
          const clean = raw
            .map((row, rIdx) => row.map((cell) => {
              const str = String(cell ?? '').trim();
              return rIdx === 1 ? str.replace(/\s+/g, ' ') : str;
            }))
            .filter((row, rIdx) => rIdx < 2 || isValidCaseRow(row));

          if (clean.length > 0) {
            const targetKey = resolveTargetKey(sheetName, idx);
            extractedWorkbook[targetKey] = clean;

            const caseRowCount = Math.max(0, clean.length - 2);
            sheetDetails.push({
              sheetName,
              targetKey,
              rowCount: caseRowCount,
              previewRows: clean.slice(2, 5),
              headers: clean[1] || SHEET_CONFIGS[targetKey].headers
            });
          }
        });

        if (sheetDetails.length === 0) {
          setErrorMsg('આ એક્સેલ ફાઈલમાં કોઈ ઉપયોગી કેસ ડેટા મળ્યો નથી.');
        } else {
          setRawWorkbookData(extractedWorkbook);
          setParsedSheets(sheetDetails);
        }
      } catch (err) {
        setErrorMsg('Excel ફાઈલ વાંચવામાં ભૂલ થઈ. કૃપા કરીને માન્ય .xlsx અથવા .xls ફાઈલ પસંદ કરો.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('ફાઈલ લોડ કરવામાં અડચણ આવી.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleApply = () => {
    if (!rawWorkbookData) {
      setErrorMsg('પહેલા એક એક્સેલ ફાઈલ અપલોડ કરો.');
      return;
    }

    // Verify admin access
    if (!isAdmin) {
      if (adminPin === '1234' || adminPin === 'admin123' || adminPin === 'gsrtc@123' || adminPin === 'admin') {
        onAdminLoginRequired();
      } else {
        setPinError('ડેટા અપડેટ કરવા માટે સાચો એડમિન PIN (1234) દાખલ કરો.');
        return;
      }
    }

    onConfirmImport(rawWorkbookData, importMode);
    onClose();
  };

  const totalCasesDetected = parsedSheets.reduce((sum, s) => sum + s.rowCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #059669' }}
        className="rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div 
          style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #0d9488 100%)' }}
          className="p-5 text-white flex items-center justify-between shrink-0 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: '#fef08a', color: '#713f12' }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0"
            >
              <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Excel ફાઈલ અપલોડ & ડેટા અપડેટ (Excel Import)
              </h2>
              <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                GSRTC સુરત લેબર શાખા • નવી એક્સેલ ફાઈલ અપલોડ કરી કેસો અપડેટ કરો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            className="p-2 text-white hover:bg-white/30 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div 
              style={{ backgroundColor: '#fff1f2', color: '#9f1239', border: '1.5px solid #f43f5e' }}
              className="p-3 rounded-2xl text-xs font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          {!rawWorkbookData ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: '#f0fdf4',
                borderColor: '#34d399',
                borderStyle: 'dashed'
              }}
              className="border-3 rounded-3xl p-8 sm:p-10 text-center cursor-pointer hover:bg-emerald-50/80 transition-all flex flex-col items-center justify-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <div 
                style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md"
              >
                <Upload className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                Excel ફાઈલ અહીં ડ્રેગ કરો અથવા ક્લિક કરીને પસંદ કરો
              </h3>
              <p className="text-xs text-slate-500 font-semibold max-w-sm mb-3">
                તમારી કોમ્પ્યુટર કે મોબાઈલમાંથી <strong className="text-emerald-700">.xlsx</strong> અથવા <strong className="text-emerald-700">.xls</strong> ફાઈલ સિલેક્ટ કરો
              </p>
              <span 
                style={{ backgroundColor: '#059669', color: '#ffffff' }}
                className="px-4 py-2 rounded-xl text-xs font-black shadow-md inline-flex items-center gap-1.5"
              >
                <span>ફાઈલ પસંદ કરો (Browse File)</span>
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Banner */}
              <div 
                style={{ backgroundColor: '#ecfdf5', border: '2px solid #6ee7b7' }}
                className="p-4 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: '#059669', color: '#ffffff' }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950 truncate max-w-xs">
                      {selectedFile?.name}
                    </h4>
                    <p className="text-xs text-emerald-800 font-bold">
                      શોધાયેલ શીટ્સ: {parsedSheets.length} • કુલ કેસો: <strong className="font-mono text-sm">{totalCasesDetected}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setRawWorkbookData(null);
                    setParsedSheets([]);
                  }}
                  style={{ backgroundColor: '#ffffff', color: '#dc2626', border: '1.5px solid #fecdd3' }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors"
                >
                  બીજી ફાઈલ પસંદ કરો
                </button>
              </div>

              {/* Detected Sheets Details */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  અપડેટ થનાર શીટ્સ અને કેસોની સંખ્યા:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {parsedSheets.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '2px solid #cbd5e1'
                      }}
                      className="p-3 rounded-2xl flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          style={{
                            backgroundColor: s.targetKey === 'HC CASE' ? '#dbeafe' : s.targetKey === 'LABOUR CASE' ? '#d1fae5' : '#f3e8ff',
                            color: s.targetKey === 'HC CASE' ? '#1e40af' : s.targetKey === 'LABOUR CASE' ? '#065f46' : '#6b21a8'
                          }}
                          className="text-[11px] font-black px-2 py-0.5 rounded-lg"
                        >
                          {s.targetKey}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {s.sheetName}
                        </span>
                      </div>
                      <div className="text-lg font-black font-mono text-slate-900 mt-1">
                        {s.rowCount} <span className="text-xs text-slate-500 font-bold">કેસો</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Mode Radio Options */}
              <div 
                style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0' }}
                className="p-3.5 rounded-2xl space-y-2.5"
              >
                <label className="block text-xs font-black text-slate-800">
                  અપડેટ કરવાનો પ્રકાર પસંદ કરો:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    onClick={() => setImportMode('replace')}
                    style={{
                      backgroundColor: importMode === 'replace' ? '#ecfdf5' : '#ffffff',
                      borderColor: importMode === 'replace' ? '#059669' : '#cbd5e1'
                    }}
                    className="border-2 p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all shadow-xs"
                  >
                    <input
                      type="radio"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-900 block flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>સંપૂર્ણ ડેટા બદલો (Full Replace)</span>
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                        હાલના કેસોની જગ્યાએ આ એક્સેલનો નવો ડેટા આવી જશે
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('merge')}
                    style={{
                      backgroundColor: importMode === 'merge' ? '#eff6ff' : '#ffffff',
                      borderColor: importMode === 'merge' ? '#2563eb' : '#cbd5e1'
                    }}
                    className="border-2 p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all shadow-xs"
                  >
                    <input
                      type="radio"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-900 block flex items-center gap-1">
                        <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>નવા કેસો મર્જ કરો (Append/Merge)</span>
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                        હાલના કેસો રહેશે અને એક્સેલના નવા કેસો ઉમેરાઈ જશે
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Admin Security Verification if Not Admin */}
              {!isAdmin && (
                <div 
                  style={{ backgroundColor: '#fffbeb', border: '2px solid #fde047' }}
                  className="p-3.5 rounded-2xl space-y-2"
                >
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>સુરક્ષા પાસવર્ડ (Admin Access Required):</span>
                  </div>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="એડમિન PIN દાખલ કરો (દા.ત. 1234)..."
                    style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1' }}
                    className="w-full p-2 text-xs font-bold rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {pinError && (
                    <span className="text-[11px] text-rose-600 font-bold block">{pinError}</span>
                  )}
                  <span className="text-[10px] text-slate-500 block">
                    ડેમો પાસવર્ડ: <strong>1234</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div 
          style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}
          className="p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0"
        >
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#ffffff', color: '#475569', border: '1.5px solid #cbd5e1' }}
            className="px-4 py-2.5 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            બંધ કરો
          </button>

          <button
            type="button"
            disabled={!rawWorkbookData || isProcessing}
            onClick={handleApply}
            style={{
              background: !rawWorkbookData 
                ? '#94a3b8' 
                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff'
            }}
            className="px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-black rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>✓ એક્સેલ ડેટા અપડેટ કરો ({totalCasesDetected} કેસો)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
