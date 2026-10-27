import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { SheetKey, SheetDataMap, SheetMetaMap, CaseFilter, AuthUser, EmployeeProfile, EmployeeProfileMap, ActiveTab } from './types/case';
import {
  SHEET_CONFIGS,
  RAW_INITIAL_DATA,
  INITIAL_METADATA,
  getStatusCategory,
  extractDateFromStatus,
  isValidCaseRow,
  isHeaderRow,
  isInvalidAdvocateName,
  normalizeAdvocateName,
  getCaseKey,
  extractInitialProfileFromRow,
  getPetitionerType
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
import { Check, AlertCircle, Info, Plus, Download, Landmark, Scale, Gavel, Archive, ShieldCheck, Lock, Bell, MessageSquare, Smartphone, Pencil, FileSpreadsheet, UserCheck, Layers } from 'lucide-react';

const TOTAL_COLUMNS = [
  'ક્રમ નં.',
  'અદાલત / કોર્ટ પ્રકાર',
  'કેસ / SCA / રેફ. નં.',
  'HCE / ફાઈલ / સ્થળ',
  'નિગમના પેનલ એડવોકેટનું નામ',
  'કર્મચારીનું નામ હોદ્દો/બેજ નં',
  'કેસની ટૂંકી વિગત',
  'હાલની છેલ્લામાં છેલ્લી પરિસ્થિતી / સ્ટેટસ'
];

const STORAGE_KEY = 'gsrtc_court_cases_data_v3';
const STORAGE_META_KEY = 'gsrtc_court_cases_meta_v3';
const STORAGE_USER_KEY = 'gsrtc_court_cases_user_v3';
const STORAGE_PROFILES_KEY = 'gsrtc_court_cases_profiles_v1';

export default function App() {
  // Always require login whenever any user opens the link
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Clear any previously persisted user session so login page always shows first
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      sessionStorage.removeItem(STORAGE_USER_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');

  // Employee Service & Disciplinary Dossier profiles state
  const [employeeProfiles, setEmployeeProfiles] = useState<EmployeeProfileMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {};
  });

  // Load data from localStorage or fallback to default, cleaning any stray header rows
  const [data, setData] = useState<SheetDataMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((k) => {
          const sheetKey = k as SheetKey;
          if (Array.isArray(parsed[sheetKey])) {
            parsed[sheetKey] = parsed[sheetKey].filter((r: string[], idx: number) => {
              if (idx < 2) return true;
              return isValidCaseRow(r) && !isHeaderRow(r);
            });
          }
        });
        return parsed;
      }
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

  const [activeSheet, setActiveSheet] = useState<ActiveTab>('TOTAL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [detailModalIndex, setDetailModalIndex] = useState<number | null>(null);
  const [detailModalSheetKey, setDetailModalSheetKey] = useState<SheetKey>('HC CASE');

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

  // Persistent storage sync for case data, metadata, and employee profiles
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(employeeProfiles));
    } catch {
      // Ignore quota errors
    }
  }, [data, meta, employeeProfiles]);

  const isAdmin = currentUser?.role === 'admin';

  // Filters State
  const [filter, setFilter] = useState<CaseFilter>({
    searchQuery: '',
    advocate: '',
    court: '',
    statusType: '',
    disposedOnly: 'all',
    petitionerType: 'all'
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

  // Extract advocate and court options dynamically without duplicates or headers
  const { advocateOptions, courtOptions } = useMemo(() => {
    const advocatesMap = new Map<string, string>(); // lowercase key -> single standardized display name
    const courtsMap = new Map<string, string>();

    const extract = (sheetKey: SheetKey, advCol: number, courtCol?: number) => {
      const rows = data[sheetKey] || [];
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !isValidCaseRow(row) || isHeaderRow(row)) continue;
        const rawAdv = row[advCol] || '';
        if (isInvalidAdvocateName(rawAdv)) continue;
        const cleanAdv = normalizeAdvocateName(rawAdv);
        const lowerKey = cleanAdv.toLowerCase();
        if (cleanAdv && !advocatesMap.has(lowerKey)) {
          advocatesMap.set(lowerKey, cleanAdv);
        }

        if (courtCol && row[courtCol]) {
          const rawCourt = row[courtCol] || '';
          const cleanCourt = rawCourt.replace(/\s+/g, ' ').trim();
          if (cleanCourt && cleanCourt !== '-' && !cleanCourt.includes('લેબરકોર્ટ') && !cleanCourt.includes('કોર્ટ')) {
            const courtKey = cleanCourt.toLowerCase();
            if (!courtsMap.has(courtKey)) {
              courtsMap.set(courtKey, cleanCourt);
            }
          }
        }
      }
    };

    extract('HC CASE', 4);
    extract('LABOUR CASE', 3, 2);
    extract('IT CASE', 3, 2);

    return {
      advocateOptions: Array.from(advocatesMap.values()).sort((a, b) => a.localeCompare(b, 'gu')),
      courtOptions: Array.from(courtsMap.values()).sort((a, b) => a.localeCompare(b, 'gu'))
    };
  }, [data]);

  // Filtered rows for current active sheet
  const currentSheetRows = useMemo(() => {
    if (activeSheet === 'SUMMARY' || activeSheet === 'DISPOSED ARCHIVE' || activeSheet === 'CALENDAR') return [];

    const query = filter.searchQuery.toLowerCase().trim();
    const result: Array<{ originalIndex: number; sheetKey: SheetKey; data: string[] }> = [];

    if (activeSheet === 'TOTAL') {
      const allCourtSheets: SheetKey[] = ['HC CASE', 'LABOUR CASE', 'IT CASE'];
      let serial = 1;

      allCourtSheets.forEach((sKey) => {
        const rawRows = data[sKey] || [];
        const isHC = sKey === 'HC CASE';
        const advCol = isHC ? 4 : 3;
        const courtCol = isHC ? undefined : 2;
        const statusCol = isHC ? 10 : 6;
        const empCol = isHC ? 5 : 4;
        const courtLabel = isHC ? 'હાઈકોર્ટ' : sKey === 'LABOUR CASE' ? 'લેબર કોર્ટ' : 'ઔદ્યોગિક (IT)';

        for (let i = 2; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || !isValidCaseRow(row) || isHeaderRow(row)) continue;

          if (query) {
            const text = (row.join(' ') + ' ' + courtLabel).toLowerCase();
            if (!text.includes(query)) continue;
          }

          if (filter.advocate) {
            const rawAdv = row[advCol] || '';
            const cleanAdv = normalizeAdvocateName(rawAdv);
            if (cleanAdv !== filter.advocate) continue;
          }

          if (filter.court) {
            const court = (courtCol !== undefined ? (row[courtCol] || '') : 'અમદાવાદ').trim();
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

          if (filter.petitionerType && filter.petitionerType !== 'all') {
            const partyText = row[empCol] || '';
            const caseKey = getCaseKey(sKey, row, i);
            const profile = employeeProfiles[caseKey];
            const pType = getPetitionerType(partyText, profile);
            if (pType !== filter.petitionerType) continue;
          }

          // Build unified 8-column row representation
          const caseNo = isHC ? (row[3] || row[1] || '-') : (row[1] || '-');
          const fileOrLoc = isHC ? (row[1] ? `HCE: ${row[1]}` : '-') : (row[2] || 'સુરત');
          const adv = row[advCol] || '-';
          const emp = row[empCol] || '-';
          const summary = isHC ? (row[6] || '-') : (row[5] || '-');
          const status = row[statusCol] || '-';

          const unifiedRow = [
            serial.toString(),
            courtLabel,
            caseNo,
            fileOrLoc,
            adv,
            emp,
            summary,
            status
          ];

          result.push({ originalIndex: i, sheetKey: sKey, data: unifiedRow });
          serial++;
        }
      });

      return result;
    }

    // Individual sheet (HC CASE, LABOUR CASE, IT CASE)
    const rawRows = data[activeSheet] || [];
    const isHC = activeSheet === 'HC CASE';
    const advCol = isHC ? 4 : 3;
    const courtCol = isHC ? undefined : 2;
    const statusCol = isHC ? 10 : 6;

    for (let i = 2; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || !isValidCaseRow(row)) continue;

      if (query) {
        const text = row.join(' ').toLowerCase();
        if (!text.includes(query)) continue;
      }

      if (filter.advocate) {
        const rawAdv = row[advCol] || '';
        const cleanAdv = normalizeAdvocateName(rawAdv);
        if (cleanAdv !== filter.advocate) continue;
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

      if (filter.petitionerType && filter.petitionerType !== 'all') {
        const empCol = isHC ? 5 : 4;
        const partyText = row[empCol] || '';
        const caseKey = getCaseKey(activeSheet, row, i);
        const profile = employeeProfiles[caseKey];
        const pType = getPetitionerType(partyText, profile);
        if (pType !== filter.petitionerType) continue;
      }

      result.push({ originalIndex: i, sheetKey: activeSheet, data: row });
    }

    return result;
  }, [data, activeSheet, filter, employeeProfiles]);

  // Cell Change Handler (Only permitted for Admin)
  const handleCellChange = (originalIndex: number, colIndex: number, newValue: string, rowSheetKey?: SheetKey) => {
    if (!isAdmin) {
      showToast('સેલમાં ફેરફાર કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      return;
    }
    const sheetName = (rowSheetKey || activeSheet) as string;
    if (sheetName === 'SUMMARY' || sheetName === 'DISPOSED ARCHIVE' || sheetName === 'TOTAL' || sheetName === 'CALENDAR') return;
    const targetSheet = sheetName as SheetKey;

    setData((prev) => {
      const sheet = prev[targetSheet];
      if (!sheet || !sheet[originalIndex]) return prev;

      const newSheet = [...sheet];
      const newRow = [...newSheet[originalIndex]];
      newRow[colIndex] = newValue;
      newSheet[originalIndex] = newRow;

      return {
        ...prev,
        [targetSheet]: newSheet
      };
    });
  };

  // Add New Case Handler (Protected: Only Admin can add)
  const handleAddCase = (targetSheet: SheetKey, newRowData: string[], profile?: EmployeeProfile) => {
    if (!isAdmin) {
      showToast('નવો કેસ ઉમેરવા માટે એડમિન તરીકે લોગીન કરો.', 'error');
      setIsLoginModalOpen(true);
      return;
    }

    const caseKey = getCaseKey(targetSheet, newRowData, 2);
    if (profile) {
      setEmployeeProfiles((prev) => {
        const next = { ...prev, [caseKey]: profile };
        try {
          localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
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
  const handleDeleteRow = (originalIndex: number, rowSheetKey?: SheetKey) => {
    if (!isAdmin) {
      showToast('કેસ ડિલીટ કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      setIsLoginModalOpen(true);
      return;
    }
    const sheetName = (rowSheetKey || activeSheet) as string;
    if (sheetName === 'SUMMARY' || sheetName === 'DISPOSED ARCHIVE' || sheetName === 'TOTAL' || sheetName === 'CALENDAR') return;
    const targetSheet = sheetName as SheetKey;

    if (!confirm('શું તમે આ કેસ રેકોર્ડ ખરેખર કાઢી નાખવા માંગો છો?')) return;

    setData((prev) => {
      const sheet = [...(prev[targetSheet] || [])];
      sheet.splice(originalIndex, 1);

      for (let i = 2; i < sheet.length; i++) {
        sheet[i][0] = (i - 1).toString();
      }

      return {
        ...prev,
        [targetSheet]: sheet
      };
    });

    if (selectedRowIndex === originalIndex) setSelectedRowIndex(null);
    showToast('કેસ રેકોર્ડ સફળતાપૂર્વક ડિલીટ થયો.', 'info');
  };

  // MOVE TO DISPOSED ARCHIVE HANDLER:
  // "case nikal thaya pachi agal excel bane and orignal excel mathi delet kari skay"
  const handleMoveToDisposedArchive = (originalIndex: number, rowSheetKey?: SheetKey) => {
    if (!isAdmin) {
      showToast('આર્કાઇવમાં ખસેડવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      setIsLoginModalOpen(true);
      return;
    }
    const sheetName = (rowSheetKey || activeSheet) as string;
    if (sheetName === 'SUMMARY' || sheetName === 'DISPOSED ARCHIVE' || sheetName === 'TOTAL' || sheetName === 'CALENDAR') return;
    const sourceSheet = sheetName as SheetKey;

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
  const handleSaveModalRow = (updatedRow: string[], updatedProfile?: EmployeeProfile) => {
    if (!isAdmin) {
      showToast('સુધારો કરવા માટે એડમિન એક્સેસ જરૂરી છે.', 'error');
      return;
    }
    if (detailModalIndex === null) return;
    const targetSheet = detailModalSheetKey;

    const caseKey = getCaseKey(targetSheet, updatedRow, detailModalIndex);
    if (updatedProfile) {
      setEmployeeProfiles((prev) => {
        const next = { ...prev, [caseKey]: updatedProfile };
        try {
          localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    }

    setData((prev) => {
      const sheet = [...(prev[targetSheet] || [])];
      sheet[detailModalIndex] = updatedRow;
      return {
        ...prev,
        [targetSheet]: sheet
      };
    });

    showToast('✏️ કેસ અને કર્મચારી વિગતો સફળતાપૂર્વક અપડેટ થઈ ગઈ!', 'success');
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
  const handleExportExcel = (mode: 'all' | 'current' | 'pending' | 'disposed' | 'dossier' = 'all') => {
    try {
      const wb = XLSX.utils.book_new();

      if (mode === 'dossier') {
        // Comprehensive Employee Service & Disciplinary Dossier Excel Export
        const dossierRows: string[][] = [
          [
            'ગુજરાત રાજ્ય માર્ગ વાહન વ્યવહાર નિગમ (GSRTC) - સુરત વિભાગ • લેબર શાખા',
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
          ],
          [
            'કર્મચારી સેવા, શિસ્તભંગ કાર્યવાહી અને નામદાર કોર્ટ પડતર કેસોની સંપૂર્ણ વિગતવાર Dossier યાદી',
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
          ],
          [
            'ક્રમ નં.',
            'કોર્ટ પ્રકાર',
            'કેસ / SCA / રેફ. નં.',
            'HCE / ફાઈલ નં.',
            'નિગમના પેનલ એડવોકેટનું નામ',
            'કર્મચારીનું નામ',
            'જન્મ તારીખ',
            'હોદ્દો / બેજ નં.',
            'PF નં.',
            'નોકરીમાં નિમણુકની તારીખ',
            'નિવૃત્તિ તારીખ',
            'ગુનાની વિગત',
            'શિક્ષાત્મક હુકમ',
            'પ્રથમ અપીલ',
            'દ્વિતીય અપીલ',
            'કેસની ટૂંકી વિગત',
            'નીચલી કોર્ટ / વચગાળાનો ચુકાદો',
            'હાલની છેલ્લામાં છેલ્લી પરિસ્થિતી / સ્ટેટસ',
            'સુનાવણી તારીખ'
          ]
        ];

        let serialCount = 1;
        const allSheetKeys: SheetKey[] = ['HC CASE', 'LABOUR CASE', 'IT CASE', 'DISPOSED ARCHIVE'];

        allSheetKeys.forEach((sKey) => {
          const rows = data[sKey] || [];
          for (let rIdx = 2; rIdx < rows.length; rIdx++) {
            const row = rows[rIdx];
            if (!row || !isValidCaseRow(row) || isHeaderRow(row)) continue;

            const caseKey = getCaseKey(sKey, row, rIdx);
            const savedProfile = employeeProfiles[caseKey] || extractInitialProfileFromRow(sKey, row);

            const isHC = sKey === 'HC CASE';
            const isLabour = sKey === 'LABOUR CASE' || sKey === 'IT CASE';

            const courtType = isHC ? 'હાઈકોર્ટ (HC)' : isLabour ? (sKey === 'LABOUR CASE' ? 'લેબર કોર્ટ' : 'ઔદ્યોગિક ટ્રિબ્યુનલ (IT)') : `નિકાલ (${row[1] || 'Disposed'})`;
            const caseNo = isHC ? (row[3] || '-') : isLabour ? (row[1] || '-') : (row[2] || '-');
            const fileNo = isHC ? (row[1] || '-') : '-';
            const advocate = isHC ? (row[4] || '-') : isLabour ? (row[3] || '-') : (row[3] || '-');
            const status = isHC ? (row[10] || '-') : isLabour ? (row[6] || '-') : (row[7] || row[6] || '-');
            const hearingDate = extractDateFromStatus(status) || '-';
            const lowerCourtOrder = isHC ? (row[2] || row[8] || '-') : (row[2] || '-');
            const caseSummary = isHC ? (row[6] || '-') : isLabour ? (row[5] || '-') : (row[5] || '-');

            dossierRows.push([
              serialCount.toString(),
              courtType,
              caseNo,
              fileNo,
              advocate,
              savedProfile.employeeName || (isHC ? row[5] : isLabour ? row[4] : row[4]) || '-',
              savedProfile.dob || '-',
              savedProfile.designation || '-',
              savedProfile.pfNo || '-',
              savedProfile.appointmentDate || '-',
              savedProfile.retirementDate || '-',
              savedProfile.offenseDetails || caseSummary,
              savedProfile.punishmentOrder || '-',
              savedProfile.firstAppeal || '-',
              savedProfile.secondAppeal || '-',
              caseSummary,
              lowerCourtOrder,
              status,
              hearingDate
            ]);
            serialCount++;
          }
        });

        const ws = XLSX.utils.aoa_to_sheet(dossierRows);
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 18 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 18 } }
        ];
        ws['!cols'] = [
          { wch: 6 },  // 1. ક્રમ નં.
          { wch: 16 }, // 2. કોર્ટ પ્રકાર
          { wch: 18 }, // 3. કેસ નં.
          { wch: 12 }, // 4. ફાઈલ નં.
          { wch: 20 }, // 5. એડવોકેટ
          { wch: 26 }, // 6. કર્મચારી નામ
          { wch: 14 }, // 7. જન્મ તારીખ
          { wch: 18 }, // 8. હોદ્દો
          { wch: 14 }, // 9. PF નં.
          { wch: 16 }, // 10. નિમણુક તારીખ
          { wch: 16 }, // 11. નિવૃત્તિ તારીખ
          { wch: 45 }, // 12. ગુનાની વિગત
          { wch: 28 }, // 13. શિક્ષાત્મક હુકમ
          { wch: 24 }, // 14. પ્રથમ અપીલ
          { wch: 24 }, // 15. દ્વિતીય અપીલ
          { wch: 40 }, // 16. કેસની ટૂંકી વિગત
          { wch: 24 }, // 17. નીચલી કોર્ટ ચુકાદો
          { wch: 28 }, // 18. સ્ટેટસ
          { wch: 15 }  // 19. સુનાવણી તારીખ
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'કર્મચારી સેવા & કેસ Dossier');
        XLSX.writeFile(wb, 'GSRTC_સુરત_કર્મચારી_સેવા_શિસ્ત_અને_કોર્ટ_કેસ_Dossier.xlsx');
        showToast('📋 કર્મચારી સેવા & શિસ્ત વિગતો સાથે Dossier Excel સફળતાપૂર્વક ડાઉનલોડ થઈ!', 'success');
        return;
      }
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
          // Ensure new heading (row 0) and column headers (row 1) from incoming Excel are applied
          if (incomingRows[0]?.[0]?.trim()) {
            currentRows[0] = [...incomingRows[0]];
          }
          if (incomingRows[1]?.some((c) => c && c.trim() !== '')) {
            currentRows[1] = [...incomingRows[1]];
          }
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

  const isSheetConfigKey = activeSheet !== 'SUMMARY' && activeSheet !== 'CALENDAR' && activeSheet !== 'TOTAL';
  const sheetRows = (isSheetConfigKey && data[activeSheet as SheetKey]) || [];

  // Dynamic Title: read from row 0 if available, else fallback to default
  const currentSheetTitle = useMemo(() => {
    if (activeSheet === 'TOTAL') {
      return 'કુલ તમામ પેન્ડિંગ કેસોની સંયુક્ત યાદી (હાઈકોર્ટ + લેબર કોર્ટ + ઔદ્યોગિક ટ્રિબ્યુનલ)';
    }
    if (sheetRows.length > 0 && sheetRows[0]?.[0]?.trim()) {
      return sheetRows[0][0].trim();
    }
    return isSheetConfigKey ? SHEET_CONFIGS[activeSheet as SheetKey]?.title || '' : '';
  }, [sheetRows, isSheetConfigKey, activeSheet]);

  // Dynamic Column Headers: read from row 1 if available, else fallback to default
  const currentHeaders = useMemo(() => {
    if (activeSheet === 'TOTAL') {
      return TOTAL_COLUMNS;
    }
    if (sheetRows.length > 1 && sheetRows[1]) {
      const rowHeaders = sheetRows[1].map((h) => String(h ?? '').trim());
      let lastNonEmpty = -1;
      for (let i = rowHeaders.length - 1; i >= 0; i--) {
        if (rowHeaders[i]) {
          lastNonEmpty = i;
          break;
        }
      }
      if (lastNonEmpty >= 0) {
        return rowHeaders.slice(0, lastNonEmpty + 1).map((h, i) => h || `સ્તંભ ${i + 1}`);
      }
    }
    return isSheetConfigKey ? SHEET_CONFIGS[activeSheet as SheetKey]?.headers || [] : [];
  }, [sheetRows, isSheetConfigKey, activeSheet]);

  const handleSaveTitle = (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed || !isSheetConfigKey) return;
    setData((prev) => {
      const updated: SheetDataMap = { ...prev };
      const currentList = updated[activeSheet as SheetKey] ? [...updated[activeSheet as SheetKey]] : [];
      if (currentList.length > 0) {
        const titleRow = [...currentList[0]];
        titleRow[0] = trimmed;
        currentList[0] = titleRow;
      } else {
        currentList[0] = [trimmed];
      }
      updated[activeSheet as SheetKey] = currentList;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save title:', err);
      }
      return updated;
    });
    setIsEditingTitle(false);
    showToast('✏️ હેડિંગ સફળતાપૂર્વક અપડેટ થયું!', 'success');
  };

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={(user) => {
          setCurrentUser(user);
          setActiveSheet('TOTAL');
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
        currentSheetTitle={currentSheetTitle}
        stats={stats}
        isEditingTitle={isEditingTitle}
        titleEditValue={titleEditValue}
        setTitleEditValue={setTitleEditValue}
        setIsEditingTitle={setIsEditingTitle}
        onSaveTitle={handleSaveTitle}
        isSheetConfigKey={isSheetConfigKey}
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
            headers={data['DISPOSED ARCHIVE']?.[1] || SHEET_CONFIGS['DISPOSED ARCHIVE'].headers}
            onRestoreCase={handleRestoreFromArchive}
            onDeleteArchiveCase={handleDeleteArchiveCase}
            onExportDisposedExcel={() => handleExportExcel('disposed')}
            isAdmin={isAdmin}
          />
        ) : (
          <div>
            {/* Filter and Search Bar */}
            <FiltersBar
              filter={filter}
              onFilterChange={setFilter}
              advocateOptions={advocateOptions}
              courtOptions={courtOptions}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              filteredCount={currentSheetRows.length}
              totalInCurrentSheet={activeSheet === 'TOTAL' ? stats.total : (data[activeSheet]?.length ? data[activeSheet].length - 2 : 0)}
              onExportDossier={() => handleExportExcel('dossier')}
            />

            {/* Data View */}
            {viewMode === 'table' ? (
              <TableView
                sheetKey={activeSheet}
                headers={currentHeaders}
                rows={currentSheetRows}
                selectedRowIndex={selectedRowIndex}
                employeeProfiles={employeeProfiles}
                onSelectRow={setSelectedRowIndex}
                onCellChange={(rowIndex, colIndex, val, rowSheetKey) => {
                  handleCellChange(rowIndex, colIndex, val, rowSheetKey);
                }}
                onViewDetails={(idx, rowSheetKey) => {
                  setDetailModalSheetKey(rowSheetKey || (activeSheet === 'TOTAL' ? 'HC CASE' : activeSheet as SheetKey));
                  setDetailModalIndex(idx);
                }}
                onDeleteRow={(idx, rowSheetKey) => {
                  handleDeleteRow(idx, rowSheetKey);
                }}
                onMoveToArchive={(idx, rowSheetKey) => {
                  handleMoveToDisposedArchive(idx, rowSheetKey);
                }}
                isAdmin={isAdmin}
              />
            ) : (
              <CardsView
                sheetKey={activeSheet}
                rows={currentSheetRows}
                selectedRowIndex={selectedRowIndex}
                employeeProfiles={employeeProfiles}
                onSelectRow={setSelectedRowIndex}
                onViewDetails={(idx, rowSheetKey) => {
                  setDetailModalSheetKey(rowSheetKey || (activeSheet === 'TOTAL' ? 'HC CASE' : activeSheet as SheetKey));
                  setDetailModalIndex(idx);
                }}
                onDeleteRow={(idx, rowSheetKey) => {
                  handleDeleteRow(idx, rowSheetKey);
                }}
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
      {detailModalIndex !== null && data[detailModalSheetKey]?.[detailModalIndex] && (
        <CaseDetailModal
          isOpen={detailModalIndex !== null}
          sheetKey={detailModalSheetKey}
          headers={SHEET_CONFIGS[detailModalSheetKey]?.headers || []}
          rowData={data[detailModalSheetKey][detailModalIndex]}
          rowIndex={detailModalIndex}
          employeeProfile={employeeProfiles[getCaseKey(detailModalSheetKey, data[detailModalSheetKey][detailModalIndex], detailModalIndex)] || extractInitialProfileFromRow(detailModalSheetKey, data[detailModalSheetKey][detailModalIndex])}
          isAdmin={isAdmin}
          onClose={() => setDetailModalIndex(null)}
          onSaveRow={handleSaveModalRow}
          onDeleteRow={() => {
            handleDeleteRow(detailModalIndex, detailModalSheetKey);
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
          customHeaders={currentHeaders}
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
