import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { SheetKey, SheetDataMap, ActiveTab } from '../types/case';
import { SHEET_CONFIGS, isValidCaseRow, excelSerialToDateStr, detectSheetColumns, gujaratiToEnglishDigits } from '../data/initialData';
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
  Download,
  Heading
} from 'lucide-react';

interface ExcelUploadModalProps {
  isOpen: boolean;
  currentActiveSheet: ActiveTab;
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
  title: string;
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
  const resolveTargetKey = (sheetName: string, index: number, sampleRows?: string[][]): SheetKey => {
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

    // Inspect content of the sheet to detect court type if sheet name is generic (like "Sheet1")
    if (sampleRows && sampleRows.length > 0) {
      const sampleText = sampleRows.slice(0, 8).map(r => r.join(' ')).join(' ').toLowerCase();
      if (sampleText.includes('sca') || sampleText.includes('lpa') || sampleText.includes('hce') || sampleText.includes('હાઈકોર્ટ')) {
        return 'HC CASE';
      }
      if (sampleText.includes('ઔદ્યોગિક') || sampleText.includes('આઈ.ટી.') || sampleText.includes('it ref')) {
        return 'IT CASE';
      }
      if (sampleText.includes('લેબરકોર્ટ') || sampleText.includes('લેબર') || sampleText.includes('lcs')) {
        return 'LABOUR CASE';
      }
    }

    // If current tab is a valid sheet, map to it for single-sheet file
    if (currentActiveSheet !== 'SUMMARY' && currentActiveSheet !== 'CALENDAR' && currentActiveSheet !== 'TOTAL') {
      return currentActiveSheet;
    }

    // Default fallback by index
    if (index === 0) return 'HC CASE';
    if (index === 1) return 'LABOUR CASE';
    if (index === 2) return 'IT CASE';
    return 'HC CASE';
  };

  /**
   * Intelligently normalize uploaded sheet rows:
   * 1. Detect if row 0 has a banner Title
   * 2. Detect column headers (row 0, 1, or 2) by scoring keyword presence
   * 3. Normalize into: [TitleRow, HeadersRow, ...DataRows]
   */
  const processSheetRows = (
    rawRows: string[][],
    targetKey: SheetKey
  ): {
    normalizedRows: string[][];
    headers: string[];
    title: string;
  } => {
    const cleanRows = rawRows
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some((c) => c !== ''));

    const defaultTitle = SHEET_CONFIGS[targetKey]?.title || `${targetKey} કેસોની માહિતી`;
    const defaultHeaders = SHEET_CONFIGS[targetKey]?.headers || [];

    if (cleanRows.length === 0) {
      return {
        normalizedRows: [],
        headers: defaultHeaders,
        title: defaultTitle
      };
    }

    // Find the header row by scoring legal/administrative column keywords
    let headerRowIdx = -1;
    let maxScore = 0;

    for (let r = 0; r < Math.min(cleanRows.length, 6); r++) {
      const row = cleanRows[r];
      // Skip if first cell is already a pure case serial number like 1, 2, 3
      const firstCol = gujaratiToEnglishDigits(row[0] || '').trim();
      if (/^\d+$/.test(firstCol) && parseInt(firstCol, 10) > 0 && r > 0) {
        continue;
      }

      const joined = row.join(' ').toLowerCase();
      let score = 0;
      if (joined.includes('ક્રમ') || joined.includes('sr') || joined.includes('no.')) score += 2;
      if (joined.includes('કેસ') || joined.includes('sca') || joined.includes('lpa') || joined.includes('રેફ') || joined.includes('ref')) score += 2;
      if (joined.includes('એડવોકેટ') || joined.includes('વકીલ') || joined.includes('advocate')) score += 2;
      if (joined.includes('કામદાર') || joined.includes('કર્મચારી') || joined.includes('અરજદાર') || joined.includes('પાર્ટી') || joined.includes('પક્ષકાર')) score += 2;
      if (joined.includes('સ્ટેટસ') || joined.includes('status') || joined.includes('પરિસ્થિતી') || joined.includes('સ્થિતિ')) score += 2;
      if (joined.includes('વિગત') || joined.includes('summary')) score += 1;
      if (joined.includes('કોર્ટ') || joined.includes('લેબરકોર્ટ')) score += 1;

      if (score > maxScore && score >= 2) {
        maxScore = score;
        headerRowIdx = r;
      }
    }

    // Fallback if no high score row found
    if (headerRowIdx === -1) {
      const row0 = cleanRows[0];
      const row0NonEmptyCount = row0.filter((c) => c !== '').length;
      const row0FirstText = (row0[0] || '').trim();
      const row0LooksLikeTitle =
        row0NonEmptyCount <= 3 && (row0FirstText.length > 15 || row0FirstText.includes('માહિતી') || row0FirstText.includes('સુધી') || row0FirstText.includes('કેસો') || row0FirstText.includes('GSRTC'));

      if (row0LooksLikeTitle && cleanRows.length > 1) {
        headerRowIdx = 1;
      } else {
        headerRowIdx = 0;
      }
    }

    let title = defaultTitle;
    if (headerRowIdx > 0) {
      const titleCandidate = (cleanRows[0][0] || '').trim();
      if (titleCandidate.length > 8) {
        title = titleCandidate;
      }
    }

    const rawHeaders = cleanRows[headerRowIdx] || defaultHeaders;
    let lastIdx = -1;
    for (let i = rawHeaders.length - 1; i >= 0; i--) {
      if (rawHeaders[i]) {
        lastIdx = i;
        break;
      }
    }
    const headers = lastIdx >= 0 ? rawHeaders.slice(0, lastIdx + 1) : defaultHeaders;
    const dataRows = cleanRows.slice(headerRowIdx + 1).filter((r) => isValidCaseRow(r));

    const titleRow = [title, ...Array(Math.max(0, headers.length - 1)).fill('')];
    return {
      normalizedRows: [titleRow, headers, ...dataRows],
      headers,
      title
    };
  };

  const handleFile = (file: File) => {
    setErrorMsg('');
    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataBuffer = e.target?.result;
        // Parse workbook with complete date recognition and formatting options
        const wb = XLSX.read(dataBuffer, { 
          type: 'array',
          cellDates: true,
          cellNF: true,
          dateNF: 'dd/mm/yyyy'
        });

        const extractedWorkbook: SheetDataMap = {};
        const sheetDetails: ParsedSheetInfo[] = [];

        wb.SheetNames.forEach((sheetName, idx) => {
          const ws = wb.Sheets[sheetName];
          // Read with raw: false so Excel applies dateNF (dd/mm/yyyy) to date cells
          const raw = XLSX.utils.sheet_to_json<any[]>(ws, { 
            header: 1, 
            defval: '',
            raw: false,
            dateNF: 'dd/mm/yyyy'
          });
          
          if (raw.length > 0) {
            // Clean and format cell values
            const cleanRows: string[][] = raw.map((row: any[]) => {
              return (Array.isArray(row) ? row : []).map((cell: any) => {
                if (cell === null || cell === undefined) return '';
                if (cell instanceof Date) {
                  const d = String(cell.getDate()).padStart(2, '0');
                  const m = String(cell.getMonth() + 1).padStart(2, '0');
                  const y = cell.getFullYear();
                  return `${d}/${m}/${y}`;
                }
                if (typeof cell === 'number') {
                  if (cell >= 30000 && cell <= 65000) {
                    const d = excelSerialToDateStr(cell);
                    if (d) return d;
                  }
                  return cell.toString();
                }
                const str = String(cell).trim();
                // Check if string is a 5-digit number representing an Excel date serial
                if (/^\d{5}$/.test(str)) {
                  const num = parseInt(str, 10);
                  if (num >= 35000 && num <= 65000) {
                    const d = excelSerialToDateStr(num);
                    if (d) return d;
                  }
                }
                // Check for embedded serial in "DATE- 45585"
                if (/(?:date|તા|મુદત)[^\d]*(3\d{4}|4\d{4}|5\d{4})/i.test(str)) {
                  const m = str.match(/(?:date|તા|મુદત)[^\d]*(3\d{4}|4\d{4}|5\d{4})/i);
                  if (m) {
                    const num = parseInt(m[1], 10);
                    const d = excelSerialToDateStr(num);
                    if (d) {
                      return str.replace(m[1], d);
                    }
                  }
                }
                return str;
              });
            });

            const targetKey = resolveTargetKey(sheetName, idx, cleanRows);
            const { normalizedRows, headers, title } = processSheetRows(cleanRows, targetKey);

            if (normalizedRows.length > 0) {
              extractedWorkbook[targetKey] = normalizedRows;
              const caseRowCount = Math.max(0, normalizedRows.length - 2);

              sheetDetails.push({
                sheetName,
                targetKey,
                rowCount: caseRowCount,
                previewRows: normalizedRows.slice(2, 5),
                headers,
                title
              });
            }
          }
        });

        if (sheetDetails.length === 0) {
          setErrorMsg('આ એક્સેલ ફાઈલમાં કોઈ ઉપયોગી કેસ ડેટા મળ્યો નથી.');
        } else {
          setRawWorkbookData(extractedWorkbook);
          setParsedSheets(sheetDetails);
        }
      } catch (err) {
        console.error('Excel parse error:', err);
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
        setPinError('ખોટો એડમિન PIN. એક્સેલ અપડેટ કરવા માટે સાચો PIN જરૂરી છે.');
        return;
      }
    }

    onConfirmImport(rawWorkbookData, importMode);
    setSelectedFile(null);
    setParsedSheets([]);
    setRawWorkbookData(null);
    setErrorMsg('');
    onClose();
  };

  const totalCasesDetected = parsedSheets.reduce((sum, s) => sum + s.rowCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
        className="rounded-3xl border-2 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div 
          style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
          className="p-5 flex items-center justify-between shrink-0 border-b border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              className="p-2.5 rounded-2xl shadow-md"
            >
              <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Excel ફાઈલ અપલોડ / અપડેટ કરો</span>
                <span 
                  style={{ backgroundColor: '#10b981', color: '#064e3b' }}
                  className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase"
                >
                  Legal Landscape
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                નવી એક્સેલ શીટ અપલોડ કરી હેડિંગ, સ્તંભ શીર્ષકો અને કેસોનો ડેટા તાત્કાલિક અપડેટ કરો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {errorMsg && (
            <div 
              style={{ backgroundColor: '#fef2f2', border: '2px solid #f87171' }}
              className="p-3.5 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-bold"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
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
                style={{ backgroundColor: '#ecfdf5', border: '2px solid #a7f3d0' }}
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

              {/* Detected Sheets Details with Titles & Headers preview */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  અપડેટ થનાર શીટ્સ, હેડિંગ અને કેસોની સંખ્યા:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {parsedSheets.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '2px solid #cbd5e1'
                      }}
                      className="p-3.5 rounded-2xl flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
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

                      {/* Detected Heading & Columns info */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] space-y-1">
                        <div className="font-bold text-slate-800 line-clamp-2" title={s.title}>
                          <span className="text-blue-700 font-black">હેડિંગ:</span> {s.title}
                        </div>
                        <div className="text-slate-500 font-medium truncate" title={s.headers.join(', ')}>
                          <span className="text-slate-700 font-bold">સ્તંભો ({s.headers.length}):</span> {s.headers.slice(0, 3).join(', ')}...
                        </div>
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
                        <span>સંપૂર્ણ ડેટા અને હેડિંગ બદલો (Full Replace)</span>
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                        હાલના કેસો અને જૂના હેડિંગની જગ્યાએ આ એક્સેલનો નવો ડેટા તથા નવું હેડિંગ આવી જશે
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
                        <span>નવા કેસો ઉમેરો અને હેડિંગ અપડેટ કરો (Merge)</span>
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                        હાલના કેસો રહેશે, નવા કેસો ઉમેરાશે અને નવું હેડિંગ અપડેટ થશે
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
            <span>✓ એક્સેલ ડેટા અને હેડિંગ અપડેટ કરો ({totalCasesDetected} કેસો)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
