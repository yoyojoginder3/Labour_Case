import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { SheetKey, SheetDataMap, SheetMetaMap, CaseFilter, AuthUser } from './types/case';
import {
  SHEET_CONFIGS,
  RAW_INITIAL_DATA,
  INITIAL_METADATA,
  getStatusCategory,
  extractDateFromStatus,
  isValidCaseRow
} from './data/initialData';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { FiltersBar } from './components/FiltersBar';
import { TableView } from './components/TableView';
import { CardsView } from './components/CardsView';
import { AdvocateSummaryView } from './components/AdvocateSummaryView';
import { DisposedArchiveView } from './components/DisposedArchiveView';
import { HearingCalendarView } from './components/HearingCalendarView';
import { CaseDetailModal } from './components/CaseDetailModal';
import { AddCaseModal } from './components/AddCaseModal';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { NotificationModal } from './components/NotificationModal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { Check, AlertCircle, Info, Plus, Download, Landmark, Scale, Gavel, Archive, ShieldCheck, Lock, Bell, MessageSquare, Smartphone } from 'lucide-react';

const STORAGE_KEY = 'gsrtc_court_cases_data_v3';
const STORAGE_META_KEY = 'gsrtc_court_cases_meta_v3';
const STORAGE_USER_KEY = 'gsrtc_court_cases_user_v3';

export default function App() {
  // Current user authentication
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      if (savedUser) return JSON.parse(savedUser);
    } catch {
      // Fallback
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Load data from localStorage or fallback to default
  const [data, setData] = useState<SheetDataMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return RAW_INITIAL_DATA;
  });

  const [meta, setMeta] = useState<SheetMetaMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_META_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_METADATA;
  });

  const [activeSheet, setActiveSheet] = useState<SheetKey | 'SUMMARY' | 'CALENDAR'>('HC CASE');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [detailModalIndex, setDetailModalIndex] = useState<number | null>(null);

  // Urgent upcoming hearings count
  const urgentHearingsList = useMemo(() => {
    const list: Array<{ caseNo: string; rawDate: string; sheetKey: SheetKey; originalIndex: number }> = [];
    (['HC CASE', 'LABOUR CASE', 'IT CASE'] as SheetKey[]).forEach((sheetKey) => {
      const rows = data[sheetKey] || [];
      const isHC = sheetKey === 'HC CASE';
      const statusCol = isHC ? 10 : 6;
      const caseNoCol = isHC ? 3 : 1;
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const status = row[statusCol] || '';
        const dateStr = extractDateFromStatus(status);
        if (dateStr) {
          list.push({
            caseNo: row[caseNoCol] || row[1] || 'SCA',
            rawDate: dateStr,
            sheetKey,
            originalIndex: i
          });
        }
      }
    });
    return list;
  }, [data]);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3800);
  };

  // Persistent storage sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
      if (currentUser) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    } catch {
      // Ignore quota errors
    }
  }, [data, meta, currentUser]);

  const isAdmin = currentUser?.role === 'admin';

  // Filters State
  const [filter, setFilter] = useState<CaseFilter>({
    searchQuery: '',
    advocate: '',
    court: '',
    statusType: '',
    disposedOnly: 'all'
  });

  // Calculate statistics across all sheets
  const stats = useMemo(() => {
    let hcCount = 0;
    let labourCount = 0;
    let itCount = 0;
    let finalHearingCount = 0;
    let disposedCount = (data['DISPOSED ARCHIVE']?.length || 2) - 2;

    const checkRows = (sheetKey: SheetKey, statusColIdx: number) => {
      const rows = data[sheetKey] || [];
      let count = 0;
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !isValidCaseRow(row)) continue;
        count++;
        const status = row[statusColIdx] || '';
        const cat = getStatusCategory(status);
        if (cat.type === 'final_hearing') finalHearingCount++;
        if (cat.type === 'disposed') disposedCount++;
      }
      return count;
    };

    hcCount = checkRows('HC CASE', 10);
    labourCount = checkRows('LABOUR CASE', 6);
    itCount = checkRows('IT CASE', 6);

    return {
      hcCount,
      labourCount,
      itCount,
      finalHearingCount,
      disposedCount,
      total: hcCount + labourCount + itCount
    };
  }, [data]);

  // Extract advocate and court options dynamically
  const { advocateOptions, courtOptions } = useMemo(() => {
    const advocates = new Set<string>();
    const courts = new Set<string>();

    const extract = (sheetKey: SheetKey, advCol: number, courtCol?: number) => {
      const rows = data[sheetKey] || [];
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !isValidCaseRow(row)) continue;
        const adv = (row[advCol] || '').trim();
        if (adv) advocates.add(adv);
        if (courtCol && row[courtCol]) {
          const court = (row[courtCol] || '').trim();
          if (court) courts.add(court);
        }
      }
    };

    extract('HC CASE', 4);
    extract('LABOUR CASE', 3, 2);
    extract('IT CASE', 3, 2);

    return {
      advocateOptions: Array.from(advocates).sort(),
      courtOptions: Array.from(courts).sort()
    };
  }, [data]);

  // Filtered rows for current active sheet
  const currentSheetRows = useMemo(() => {
    if (activeSheet === 'SUMMARY' || activeSheet === 'DISPOSED ARCHIVE' || activeSheet === 'CALENDAR') return [];

    const rawRows = data[activeSheet] || [];
    const isHC = activeSheet === 'HC CASE';
    const advCol = isHC ? 4 : 3;
    const courtCol = isHC ? undefined : 2;
    const statusCol = isHC ? 10 : 6;

    const query = filter.searchQuery.toLowerCase().trim();

    const result: Array<{ originalIndex: number; data: string[] }> = [];

    for (let i = 2; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || !isValidCaseRow(row)) continue;

      if (query) {
        const text = row.join(' ').toLowerCase();
        if (!text.includes(query)) continue;
      }

      if (filter.advocate) {
        const adv = (row[advCol] || '').trim();
        if (adv !== filter.advocate) continue;
      }

      if (filter.court && courtCol !== undefined) {
        const court = (row[courtCol] || '').trim();
        if (court !== filter.court) continue;
      }

      if (filter.statusType) {
        const status = row[statusCol] || '';
        const cat = getStatusCategory(status);
        if (cat.type !== filter.statusType) continue;
      }

      if (filter.disposedOnly !== 'all') {
        const status = row[statusCol] || '';
        const cat = getStatusCategory(status);
        if (filter.disposedOnly === 'disposed' && cat.type !== 'disposed') continue;
        if (filter.disposedOnly === 'pending' && cat.type === 'disposed') continue;
      }

      result.push({ originalIndex: i, data: row });
    }

    return result;
  }, [data, activeSheet, filter]);

  // Cell Change Handler (Only permitted for Admin)
  const handleCellChange = (originalIndex: number, colIndex: number, newValue: string) => {
    if (!isAdmin) {
      showToast('સેલમાં ફેરફાર કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      return;
    }
    if (activeSheet === 'SUMMARY' || activeSheet === 'DISPOSED ARCHIVE') return;

    setData((prev) => {
      const sheet = prev[activeSheet];
      if (!sheet || !sheet[originalIndex]) return prev;

      const newSheet = [...sheet];
      const newRow = [...newSheet[originalIndex]];
      newRow[colIndex] = newValue;
      newSheet[originalIndex] = newRow;

      return {
        ...prev,
        [activeSheet]: newSheet
      };
    });
  };

  // Add New Case Handler (Protected: Only Admin can add)
  const handleAddCase = (targetSheet: SheetKey, newRowData: string[]) => {
    if (!isAdmin) {
      showToast('નવો કેસ ઉમેરવા માટે એડમિન તરીકે લોગીન કરો.', 'error');
      setIsLoginModalOpen(true);
      return;
    }

    setData((prev) => {
      const sheet = prev[targetSheet] ? [...prev[targetSheet]] : [];
      newRowData[0] = '1';
      sheet.splice(2, 0, newRowData);

      for (let i = 2; i < sheet.length; i++) {
        sheet[i][0] = (i - 1).toString();
      }

      return {
        ...prev,
        [targetSheet]: sheet
      };
    });

    setActiveSheet(targetSheet);
    setSelectedRowIndex(2);
    showToast(`🎉 નવો કેસ "${targetSheet}" માં સફળતાપૂર્વક ઉમેરાયો!`, 'success');

    setTimeout(() => {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }, 100);
  };

  // Delete Case Handler (Protected: Only Admin can delete)
  const handleDeleteRow = (originalIndex: number) => {
    if (!isAdmin) {
      showToast('કેસ ડિલીટ કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      setIsLoginModalOpen(true);
      return;
    }
    if (activeSheet === 'SUMMARY' || activeSheet === 'DISPOSED ARCHIVE') return;

    if (!confirm('શું તમે આ કેસ રેકોર્ડ ખરેખર કાઢી નાખવા માંગો છો?')) return;

    setData((prev) => {
      const sheet = [...(prev[activeSheet] || [])];
      sheet.splice(originalIndex, 1);

      for (let i = 2; i < sheet.length; i++) {
        sheet[i][0] = (i - 1).toString();
      }

      return {
        ...prev,
        [activeSheet]: sheet
      };
    });

    if (selectedRowIndex === originalIndex) setSelectedRowIndex(null);
    showToast('કેસ રેકોર્ડ સફળતાપૂર્વક ડિલીટ થયો.', 'info');
  };

  // MOVE TO DISPOSED ARCHIVE HANDLER:
  // "case nikal thaya pachi agal excel bane and orignal excel mathi delet kari skay"
  const handleMoveToDisposedArchive = (originalIndex: number) => {
    if (!isAdmin) {
      showToast('આર્કાઇવમાં ખસેડવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      setIsLoginModalOpen(true);
      return;
    }
    if (activeSheet === 'SUMMARY' || activeSheet === 'DISPOSED ARCHIVE') return;

    const sourceSheet = activeSheet;
    const rowToArchive = data[sourceSheet]?.[originalIndex];
    if (!rowToArchive) return;

    let caseNo = '';
    let advocate = '';
    let applicant = '';
    let summary = '';
    let decisionInfo = '';

    if (sourceSheet === 'HC CASE') {
      caseNo = rowToArchive[3] || rowToArchive[1] || 'અજ્ઞાત';
      advocate = rowToArchive[4] || '';
      applicant = rowToArchive[5] || '';
      summary = rowToArchive[6] || '';
      decisionInfo = rowToArchive[10] || 'નિકાલ થયેલ / Disposed';
    } else {
      caseNo = rowToArchive[1] || 'અજ્ઞાત';
      advocate = rowToArchive[3] || '';
      applicant = rowToArchive[4] || '';
      summary = rowToArchive[5] || '';
      decisionInfo = rowToArchive[6] || 'નિકાલ થયેલ / Disposed';
    }

    setData((prev) => {
      // 1. Add to DISPOSED ARCHIVE
      const archiveSheet = prev['DISPOSED ARCHIVE'] ? [...prev['DISPOSED ARCHIVE']] : [];
      const newArchiveRow = [
        '1',
        sourceSheet,
        caseNo,
        advocate,
        applicant,
        summary,
        decisionInfo,
        'ચુકાદો / Disposed'
      ];
      archiveSheet.splice(2, 0, newArchiveRow);
      for (let i = 2; i < archiveSheet.length; i++) {
        archiveSheet[i][0] = (i - 1).toString();
      }

      // 2. Remove from original sheet
      const originalSheet = [...(prev[sourceSheet] || [])];
      originalSheet.splice(originalIndex, 1);
      for (let i = 2; i < originalSheet.length; i++) {
        originalSheet[i][0] = (i - 1).toString();
      }

      return {
        ...prev,
        'DISPOSED ARCHIVE': archiveSheet,
        [sourceSheet]: originalSheet
      };
    });

    showToast(`✅ કેસ (${caseNo}) નિકાલ આર્કાઇવમાં ખસેડાયો અને મૂળ શીટમાંથી ડિલીટ થયો!`, 'success');
  };

  // RESTORE CASE FROM ARCHIVE BACK TO PENDING SHEET:
  const handleRestoreFromArchive = (archiveIndex: number) => {
    if (!isAdmin) {
      showToast('પુનઃસ્થાપિત કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      return;
    }

    const archiveRow = data['DISPOSED ARCHIVE']?.[archiveIndex];
    if (!archiveRow) return;

    const targetSheet = (archiveRow[1] as SheetKey) || 'HC CASE';
    const caseNo = archiveRow[2] || '';

    setData((prev) => {
      // 1. Remove from archive
      const archiveSheet = [...(prev['DISPOSED ARCHIVE'] || [])];
      archiveSheet.splice(archiveIndex, 1);
      for (let i = 2; i < archiveSheet.length; i++) {
        archiveSheet[i][0] = (i - 1).toString();
      }

      // 2. Insert back into original pending sheet
      const destSheet = prev[targetSheet] ? [...prev[targetSheet]] : [];
      let restoredRow: string[] = [];
      if (targetSheet === 'HC CASE') {
        restoredRow = ['1', '', '', caseNo, archiveRow[3], archiveRow[4], archiveRow[5], '', '', '', archiveRow[6]];
      } else {
        restoredRow = ['1', caseNo, 'સુરત', archiveRow[3], archiveRow[4], archiveRow[5], archiveRow[6]];
      }
      destSheet.splice(2, 0, restoredRow);
      for (let i = 2; i < destSheet.length; i++) {
        destSheet[i][0] = (i - 1).toString();
      }

      return {
        ...prev,
        'DISPOSED ARCHIVE': archiveSheet,
        [targetSheet]: destSheet
      };
    });

    showToast(`🔄 કેસ (${caseNo}) મૂળ શીટ (${targetSheet}) માં પુનઃસ્થાપિત થયો!`, 'info');
  };

  // Delete from archive permanently
  const handleDeleteArchiveCase = (archiveIndex: number) => {
    if (!isAdmin) {
      showToast('ડિલીટ કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      return;
    }

    setData((prev) => {
      const archiveSheet = [...(prev['DISPOSED ARCHIVE'] || [])];
      archiveSheet.splice(archiveIndex, 1);
      for (let i = 2; i < archiveSheet.length; i++) {
        archiveSheet[i][0] = (i - 1).toString();
      }
      return {
        ...prev,
        'DISPOSED ARCHIVE': archiveSheet
      };
    });

    showToast('આર્કાઇવ કેસ કાયમ માટે ડિલીટ થયો.', 'info');
  };

  // Save full row edit from modal
  const handleSaveModalRow = (updatedRow: string[]) => {
    if (!isAdmin) {
      showToast('સુધારો કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      return;
    }
    if (activeSheet === 'SUMMARY' || detailModalIndex === null) return;

    setData((prev) => {
      const sheet = [...(prev[activeSheet] || [])];
      sheet[detailModalIndex] = updatedRow;
      return {
        ...prev,
        [activeSheet]: sheet
      };
    });

    showToast('કેસની વિગત સફળતાપૂર્વક અપડેટ થઈ.', 'success');
  };

  // Reset to default data
  const handleResetData = () => {
    if (!isAdmin) {
      showToast('ડેટા રિસેટ કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      return;
    }
    if (confirm('શું તમે તમામ ફેરફારો રદ કરી મૂળ કેસ ડેટા ફરીથી લોડ કરવા માંગો છો?')) {
      setData(RAW_INITIAL_DATA);
      setMeta(INITIAL_METADATA);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_META_KEY);
      setSelectedRowIndex(null);
      showToast('મૂળ ડેટા સફળતાપૂર્વક રિસેટ થયો.', 'info');
    }
  };

  // Helper to format worksheets for Legal Paper & Landscape Print
  const setupWorksheetLegalLandscape = (ws: XLSX.WorkSheet, sheetName: SheetKey) => {
    // 1. Page setup: Legal Paper Size (paperSize: 5 = Legal: 8.5 x 14 in), Landscape Orientation
    ws['!pageSetup'] = {
      orientation: 'landscape',
      paperSize: 5, // 5 = Legal (8.5 x 14 inches)
      fitToWidth: 1, // Fit all columns onto 1 page width
      fitToHeight: 0, // Multi-page height
      scale: 85
    };

    // 2. Margins (0.35 in for wide legal landscape spread)
    ws['!margins'] = {
      left: 0.35,
      right: 0.35,
      top: 0.45,
      bottom: 0.45,
      header: 0.25,
      footer: 0.25
    };

    // 3. Merged banner row & custom column widths
    if (sheetName === 'HC CASE') {
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
      ws['!cols'] = [
        { wch: 6 },  // ક્રમ નં.
        { wch: 11 }, // HCE ફાઈલ No.
        { wch: 22 }, // નીચલી કોર્ટના ચુકાદા
        { wch: 16 }, // SCA/LPA No.
        { wch: 18 }, // એડવોકેટનું નામ
        { wch: 28 }, // પક્ષકારનું નામ
        { wch: 50 }, // કેસની ટૂંકી વિગત
        { wch: 22 }, // પેપર્સ સુપ્રત તારીખ
        { wch: 18 }, // વચગાળાના ચુકાદા
        { wch: 18 }, // એફિડેવિટ તારીખ
        { wch: 26 }  // કેસનું સ્ટેટસ
      ];
    } else if (sheetName === 'LABOUR CASE' || sheetName === 'IT CASE') {
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
      ws['!cols'] = [
        { wch: 6 },  // ક્રમ નં.
        { wch: 14 }, // રેફ. નંબર
        { wch: 13 }, // લેબરકોર્ટ
        { wch: 20 }, // એડવોકેટનું નામ
        { wch: 26 }, // કર્મચારીનું નામ
        { wch: 65 }, // કેસની ટૂંકી વિગત
        { wch: 26 }  // હાલની પરિસ્થિતી
      ];
    } else if (sheetName === 'DISPOSED ARCHIVE') {
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
      ws['!cols'] = [
        { wch: 6 },  // ક્રમ નં.
        { wch: 14 }, // મૂળ કોર્ટ
        { wch: 18 }, // કેસ નં.
        { wch: 20 }, // એડવોકેટ
        { wch: 26 }, // કર્મચારી
        { wch: 55 }, // ટૂંકી વિગત
        { wch: 24 }, // ચુકાદો તારીખ
        { wch: 18 }  // પરિણામ
      ];
    }
  };

  // Export to Excel with distinct modes and Legal Landscape print setup
  const handleExportExcel = (mode: 'all' | 'current' | 'pending' | 'disposed' = 'all') => {
    try {
      const wb = XLSX.utils.book_new();

      if (mode === 'disposed') {
        // Disposed Cases Separate Excel
        const sheetData = data['DISPOSED ARCHIVE'] || [];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        setupWorksheetLegalLandscape(ws, 'DISPOSED ARCHIVE');
        XLSX.utils.book_append_sheet(wb, ws, 'DISPOSED CASES');
        XLSX.writeFile(wb, 'GSRTC_સુરત_લેબર_શાખા_નિકાલ_થયેલ_કેસો_Disposed.xlsx');
        showToast('📁 નિકાલ થયેલ કેસોની Legal Landscape Excel ફાઈલ ડાઉનલોડ થઈ!', 'success');
      } else if (mode === 'pending') {
        // Pending Cases Only (HC, Labour, IT)
        (['HC CASE', 'LABOUR CASE', 'IT CASE'] as SheetKey[]).forEach((sheetName) => {
          const sheetData = data[sheetName] || [];
          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          setupWorksheetLegalLandscape(ws, sheetName);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        XLSX.writeFile(wb, 'GSRTC_સુરત_લેબર_શાખા_પેન્ડિંગ_કેસો_Pending.xlsx');
        showToast('🏛️ માત્ર પેન્ડિંગ કેસોની Legal Landscape Excel ફાઈલ ડાઉનલોડ થઈ!', 'success');
      } else if (mode === 'current' && activeSheet !== 'SUMMARY' && activeSheet !== 'CALENDAR') {
        // Current Active Sheet
        const sheetData = data[activeSheet] || [];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        setupWorksheetLegalLandscape(ws, activeSheet as SheetKey);
        XLSX.utils.book_append_sheet(wb, ws, activeSheet);
        XLSX.writeFile(wb, `GSRTC_સુરત_લેબર_શાખા_${activeSheet}_કેસો.xlsx`);
        showToast(`📊 "${activeSheet}" Legal Landscape Excel ફાઈલ ડાઉનલોડ થઈ!`, 'success');
      } else {
        // Master Excel: All Sheets (HC, Labour, IT, Disposed Archive)
        (['HC CASE', 'LABOUR CASE', 'IT CASE', 'DISPOSED ARCHIVE'] as SheetKey[]).forEach((sheetName) => {
          const sheetData = data[sheetName] || [];
          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          setupWorksheetLegalLandscape(ws, sheetName);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        XLSX.writeFile(wb, 'GSRTC_સુરત_લેબર_શાખા_સંપૂર્ણ_માસ્ટર_એક્સેલ.xlsx');
        showToast('📊 સંપૂર્ણ માસ્ટર Excel ફાઈલ (Legal Landscape બધી શીટ્સ) ડાઉનલોડ થઈ!', 'success');
      }
    } catch {
      showToast('Excel ફાઈલ ડાઉનલોડ કરવામાં અડચણ આવી.', 'error');
    }
  };

  // Import and update all details from Excel
  const handleConfirmExcelImport = (newSheetData: SheetDataMap, mode: 'replace' | 'merge') => {
    setData((prev) => {
      const updated: SheetDataMap = { ...prev };

      Object.keys(newSheetData).forEach((sheetKey) => {
        const incomingRows = newSheetData[sheetKey];
        if (!incomingRows || incomingRows.length < 2) return;

        if (mode === 'replace') {
          // Replace: take incoming rows and re-index serial numbers
          const cleanRows = incomingRows.map((r, idx) => {
            if (idx >= 2) {
              const newRow = [...r];
              newRow[0] = (idx - 1).toString();
              return newRow;
            }
            return r;
          });
          updated[sheetKey] = cleanRows;
        } else {
          // Merge: append new rows
          const currentRows = updated[sheetKey] ? [...updated[sheetKey]] : [incomingRows[0], incomingRows[1]];
          const existingIdentifiers = new Set(
            currentRows.slice(2).map((r) => (r[3] || r[1] || '').trim().toLowerCase())
          );

          incomingRows.slice(2).forEach((newRow) => {
            const id = (newRow[3] || newRow[1] || '').trim().toLowerCase();
            if (!id || !existingIdentifiers.has(id)) {
              currentRows.push([...newRow]);
              if (id) existingIdentifiers.add(id);
            }
          });

          for (let i = 2; i < currentRows.length; i++) {
            currentRows[i][0] = (i - 1).toString();
          }

          updated[sheetKey] = currentRows;
        }
      });

      return updated;
    });

    setSelectedRowIndex(null);
    showToast(
      mode === 'replace'
        ? '🎉 Excel ફાઈલ સફળતાપૂર્વક અપલોડ થઈ! તમામ કેસો અપડેટ થઈ ગયા.'
        : '🎉 નવા કેસો સફળતાપૂર્વક મર્જ થઈ ગયા!',
      'success'
    );
  };

  const handlePrintCauseList = () => {
    window.print();
  };

  const isSheetConfigKey = activeSheet !== 'SUMMARY' && activeSheet !== 'CALENDAR';
  const currentHeaders = isSheetConfigKey ? SHEET_CONFIGS[activeSheet as SheetKey]?.headers || [] : [];
  const currentSheetTitle = isSheetConfigKey ? SHEET_CONFIGS[activeSheet as SheetKey]?.title || '' : '';

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={(user) => {
          setCurrentUser(user);
          showToast(`સ્વાગત છે! ${user.name} તરીકે સફળતાપૂર્વક લોગીન થયા.`, 'success');
        }}
        stats={{
          total: stats.total,
          hcCount: stats.hcCount,
          labourCount: stats.labourCount,
          itCount: stats.itCount,
          disposedCount: stats.disposedCount
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          style={{ backgroundColor: '#0f172a', border: '2px solid #334155' }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-2xl transition-all animate-in slide-in-from-bottom-4"
        >
          {toastMessage.type === 'success' && <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-400 stroke-[2.5]" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 stroke-[2.5]" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header with Auth and Navigation */}
      <Header
        activeSheet={activeSheet}
        onSelectTab={setActiveSheet}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenExcelUpload={() => setIsExcelUploadModalOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        urgentNotificationCount={urgentHearingsList.length}
        onExportExcel={handleExportExcel}
        onImportExcel={(file) => {
          setIsExcelUploadModalOpen(true);
        }}
        onPrintCauseList={handlePrintCauseList}
        onResetData={handleResetData}
        totalCases={stats.total}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_USER_KEY);
          showToast('સફળતાપૂર્વક લોગઆઉટ થયા! લોગીન પેજ પર રીટર્ન આવ્યા.', 'info');
        }}
      />

      {/* Main Viewport */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex-1">
        {/* Hearing Notification & 1-Day Before WhatsApp Alert Banner */}
        {urgentHearingsList.length > 0 && (
          <div 
            style={{
              background: 'linear-gradient(135deg, #78350f 0%, #c2410c 50%, #ea580c 100%)',
              border: '2px solid #fbbf24'
            }}
            className="mb-5 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in"
          >
            <div className="flex items-center gap-3">
              <div 
                style={{ backgroundColor: '#fef08a', color: '#78350f' }}
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-md shrink-0 animate-bounce"
              >
                <Bell className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    🚨 મુદત એલર્ટ: નજીકની તારીખે {urgentHearingsList.length} કેસોની કોર્ટ સુનાવણી છે!
                  </h3>
                  <span style={{ backgroundColor: '#fde047', color: '#713f12' }} className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    ૧ દિવસ પહેલા રિમાઇન્ડર
                  </span>
                </div>
                <p className="text-xs text-amber-100 font-semibold mt-0.5">
                  કોર્ટમાં જવા માટે તૈયારી કરો • ૧-ક્લિકમાં આવતીકાલની યાદી વોટ્સએપ પર મેળવો
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                className="flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>મોબાઈલ મેસેજ / WhatsApp</span>
              </button>
              <button
                onClick={() => setActiveSheet('CALENDAR')}
                style={{ backgroundColor: '#ffffff', color: '#78350f' }}
                className="flex-1 md:flex-initial px-3.5 py-2 text-xs font-black rounded-xl shadow-md hover:bg-amber-50 active:scale-95 transition-all whitespace-nowrap"
              >
                કોર્ટ બોર્ડ જુઓ 📅
              </button>
            </div>
          </div>
        )}
        {/* Statistics Metric Cards */}
        <StatsCards
          hcCount={stats.hcCount}
          labourCount={stats.labourCount}
          itCount={stats.itCount}
          finalHearingCount={stats.finalHearingCount}
          disposedCount={stats.disposedCount}
          activeSheet={activeSheet}
          onSelectTab={setActiveSheet}
          onFilterStatus={(st) => {
            setFilter((prev) => ({ ...prev, statusType: st }));
            if (activeSheet === 'SUMMARY' || activeSheet === 'DISPOSED ARCHIVE') setActiveSheet('HC CASE');
          }}
        />

        {/* View Switcher based on Active Tab */}
        {activeSheet === 'SUMMARY' ? (
          <AdvocateSummaryView
            data={data}
            onSelectAdvocate={(advName) => {
              setFilter((prev) => ({ ...prev, advocate: advName }));
              setActiveSheet('HC CASE');
            }}
          />
        ) : activeSheet === 'CALENDAR' ? (
          <HearingCalendarView
            data={data}
            onSelectCase={(sheetKey, originalIndex) => {
              setActiveSheet(sheetKey);
              setDetailModalIndex(originalIndex);
            }}
          />
        ) : activeSheet === 'DISPOSED ARCHIVE' ? (
          <DisposedArchiveView
            rows={data['DISPOSED ARCHIVE'] || []}
            headers={SHEET_CONFIGS['DISPOSED ARCHIVE'].headers}
            onRestoreCase={handleRestoreFromArchive}
            onDeleteArchiveCase={handleDeleteArchiveCase}
            onExportDisposedExcel={() => handleExportExcel('disposed')}
            isAdmin={isAdmin}
          />
        ) : (
          <div>
            {/* Sheet Title Bar */}
            <div 
              style={{
                backgroundColor: activeSheet === 'HC CASE' ? '#eff6ff' : activeSheet === 'LABOUR CASE' ? '#ecfdf5' : '#faf5ff',
                borderColor: activeSheet === 'HC CASE' ? '#93c5fd' : activeSheet === 'LABOUR CASE' ? '#6ee7b7' : '#c084fc'
              }}
              className="rounded-2xl border-2 px-5 py-3.5 mb-4 shadow-sm flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div 
                  style={{
                    backgroundColor: activeSheet === 'HC CASE' ? '#1d4ed8' : activeSheet === 'LABOUR CASE' ? '#059669' : '#7c3aed',
                    color: '#ffffff'
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-xs"
                >
                  {activeSheet === 'HC CASE' ? <Landmark className="w-5 h-5" /> : activeSheet === 'LABOUR CASE' ? <Scale className="w-5 h-5" /> : <Gavel className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {currentSheetTitle}
                  </h2>
                  <p className="text-xs font-bold text-slate-600">
                    {activeSheet} • પેન્ડિંગ કેસો: <strong className="text-blue-900 font-mono text-sm">{data[activeSheet]?.length ? data[activeSheet].length - 2 : 0}</strong>
                  </p>
                </div>
              </div>

              {/* Quick Tab Switcher Pills */}
              <div className="flex items-center gap-2 text-xs font-black">
                <button
                  onClick={() => setActiveSheet('HC CASE')}
                  style={{
                    backgroundColor: activeSheet === 'HC CASE' ? '#1d4ed8' : '#ffffff',
                    color: activeSheet === 'HC CASE' ? '#ffffff' : '#1e3a8a',
                    border: '2px solid #1d4ed8'
                  }}
                  className="px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>હાઈકોર્ટ ({stats.hcCount})</span>
                </button>
                <button
                  onClick={() => setActiveSheet('LABOUR CASE')}
                  style={{
                    backgroundColor: activeSheet === 'LABOUR CASE' ? '#059669' : '#ffffff',
                    color: activeSheet === 'LABOUR CASE' ? '#ffffff' : '#065f46',
                    border: '2px solid #059669'
                  }}
                  className="px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>લેબર ({stats.labourCount})</span>
                </button>
                <button
                  onClick={() => setActiveSheet('IT CASE')}
                  style={{
                    backgroundColor: activeSheet === 'IT CASE' ? '#7c3aed' : '#ffffff',
                    color: activeSheet === 'IT CASE' ? '#ffffff' : '#581c87',
                    border: '2px solid #7c3aed'
                  }}
                  className="px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>ઔદ્યોગિક ({stats.itCount})</span>
                </button>
                <button
                  onClick={() => setActiveSheet('CALENDAR')}
                  style={{
                    backgroundColor: '#fff7ed',
                    color: '#c2410c',
                    border: '2px solid #ea580c'
                  }}
                  className="px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 hover:bg-orange-100"
                >
                  <span>📅 મુદત કેલેન્ડર</span>
                </button>
                <button
                  onClick={() => setActiveSheet('SUMMARY')}
                  style={{
                    backgroundColor: '#fffbeb',
                    color: '#92400e',
                    border: '2px solid #f59e0b'
                  }}
                  className="px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 hover:bg-amber-100"
                >
                  <span>👤 એડવોકેટ</span>
                </button>
                <button
                  onClick={() => setActiveSheet('DISPOSED ARCHIVE')}
                  style={{
                    backgroundColor: '#f0fdfa',
                    color: '#0f766e',
                    border: '2px solid #0d9488'
                  }}
                  className="px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 hover:bg-teal-100"
                >
                  <span>📁 નિકાલ ({stats.disposedCount})</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <FiltersBar
              filter={filter}
              onFilterChange={setFilter}
              advocateOptions={advocateOptions}
              courtOptions={courtOptions}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              filteredCount={currentSheetRows.length}
              totalInCurrentSheet={data[activeSheet]?.length ? data[activeSheet].length - 2 : 0}
            />

            {/* Data View */}
            {viewMode === 'table' ? (
              <TableView
                sheetKey={activeSheet}
                headers={currentHeaders}
                rows={currentSheetRows}
                selectedRowIndex={selectedRowIndex}
                onSelectRow={setSelectedRowIndex}
                onCellChange={handleCellChange}
                onViewDetails={(idx) => setDetailModalIndex(idx)}
                onDeleteRow={handleDeleteRow}
                onMoveToArchive={handleMoveToDisposedArchive}
                isAdmin={isAdmin}
              />
            ) : (
              <CardsView
                sheetKey={activeSheet}
                rows={currentSheetRows}
                selectedRowIndex={selectedRowIndex}
                onSelectRow={setSelectedRowIndex}
                onViewDetails={(idx) => setDetailModalIndex(idx)}
                onDeleteRow={handleDeleteRow}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Action Buttons for Admin Only */}
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #7c3aed 100%)',
              color: '#ffffff'
            }}
            className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all ring-4 ring-blue-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>➕ નવો કેસ ઉમેરો</span>
          </button>

          <button
            onClick={() => handleExportExcel('all')}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff'
            }}
            className="inline-flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-black rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all ring-4 ring-emerald-500/20"
            title="તમામ કેસોની એક્સેલ ડાઉનલોડ કરો"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Excel</span>
          </button>
        </div>
      )}

      {/* Case Detail Modal */}
      {detailModalIndex !== null && isSheetConfigKey && data[activeSheet]?.[detailModalIndex] && (
        <CaseDetailModal
          isOpen={detailModalIndex !== null}
          sheetKey={activeSheet as SheetKey}
          headers={currentHeaders}
          rowData={data[activeSheet][detailModalIndex]}
          rowIndex={detailModalIndex}
          isAdmin={isAdmin}
          onClose={() => setDetailModalIndex(null)}
          onSaveRow={handleSaveModalRow}
          onDeleteRow={() => {
            handleDeleteRow(detailModalIndex);
            setDetailModalIndex(null);
          }}
        />
      )}

      {/* Add Case Modal */}
      {isAddModalOpen && (
        <AddCaseModal
          isOpen={isAddModalOpen}
          currentSheetKey={(activeSheet === 'SUMMARY' || activeSheet === 'DISPOSED ARCHIVE' || activeSheet === 'CALENDAR') ? 'HC CASE' : (activeSheet as SheetKey)}
          advocateList={advocateOptions}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddCase}
        />
      )}

      {/* Excel Upload and Update Modal */}
      {isExcelUploadModalOpen && (
        <ExcelUploadModal
          isOpen={isExcelUploadModalOpen}
          currentActiveSheet={activeSheet}
          existingData={data}
          isAdmin={isAdmin}
          onAdminLoginRequired={() => {
            setCurrentUser({
              username: 'admin',
              name: 'લેબર શાખા અધિકારીશ્રી (Labour Officer)',
              role: 'admin',
              designation: 'લેબર ઓફિસર, GSRTC સુરત વિભાગ'
            });
          }}
          onConfirmImport={handleConfirmExcelImport}
          onClose={() => setIsExcelUploadModalOpen(false)}
        />
      )}

      {/* Notification and 1-Day Before Mobile Reminder Modal */}
      {isNotificationModalOpen && (
        <NotificationModal
          isOpen={isNotificationModalOpen}
          data={data}
          onClose={() => setIsNotificationModalOpen(false)}
          onSelectCase={(sheetKey, originalIndex) => {
            setActiveSheet(sheetKey);
            setDetailModalIndex(originalIndex);
          }}
        />
      )}

      {/* Login Authentication Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          currentUser={currentUser}
          onLogin={(user) => {
            setCurrentUser(user);
            showToast(`સફળતાપૂર્વક લોગીન: ${user.name}`, 'success');
          }}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto py-5 bg-white border-t-2 border-slate-300 text-center text-xs text-slate-600 font-bold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ગુજરાત રાજ્ય માર્ગ વાહન વ્યવહાર નિગમ (GSRTC) • સુરત વિભાગ • લેબર શાખા (Labour Branch)
          </div>
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2">
            <span>સુરક્ષિત કેસ સંચાલન પ્રણાલી</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">સિક્યોરિટી & આર્કાઇવ સક્રિય</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
