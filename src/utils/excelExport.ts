import ExcelJS from 'exceljs';
import { SheetKey, SheetDataMap, EmployeeProfileMap } from '../types/case';
import { OFFICIAL_GSRTC_LOGO_BASE64 } from './officialLogo';
import { extractDateFromStatus, extractDateFromRow, detectSheetColumns } from '../data/initialData';

export interface ExcelExportOptions {
  mode: 'all' | 'current' | 'pending' | 'disposed' | 'dossier';
  activeSheet?: SheetKey | string;
  stats?: {
    total: number;
    hcCount: number;
    labourCount: number;
    itCount: number;
    disposedCount: number;
  };
}

// Lightweight Color Palette for Official GSRTC Spreadsheets
const COLORS = {
  navyHeader: 'FF1E3A8A',     // Deep Navy
  navyHeaderLight: 'FF2563EB',// Royal Blue
  goldAccent: 'FFF59E0B',     // Golden Amber
  bannerBg: 'FFEFF6FF',       // Soft Ice Blue
  zebraLight: 'FFF8FAFC',     // Slate 50
  white: 'FFFFFFFF',
  cellBorder: 'FFCBD5E1',     // Slate 300
  textDark: 'FF0F172A',       // Slate 900
  textMuted: 'FF475569',      // Slate 600
  // Status categories
  disposedBg: 'FFDCFCE7',     // Emerald 100
  disposedText: 'FF166534',   // Emerald 800
  hearingBg: 'FFFEF3C7',      // Amber 100
  hearingText: 'FF92400E',    // Amber 800
  noticeBg: 'FFE0F2FE',       // Sky 100
  noticeText: 'FF0369A1'       // Sky 800
};

/** Extracts pure status without date prefix or suffix */
export function cleanStatusOnly(rawStatusText: string): string {
  if (!rawStatusText) return '-';
  const raw = String(rawStatusText).trim();

  let cleaned = raw
    .replace(/(?:DATE|Date|Decision Date|તારીખ|નિ\.તા\.)\s*[-:—]?\s*[\d\/\.\-]+/gi, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned === '-' || cleaned === '--') {
    const lower = raw.toLowerCase();
    if (lower.includes('disposed') || raw.includes('નિકાલ')) {
      return 'નિકાલ થયેલ (Disposed)';
    }
    if (lower.includes('hearing') || raw.includes('સુનાવણી')) {
      return 'સુનાવણી હેઠળ';
    }
    return raw.replace(/\n+/g, ' ').trim() || '-';
  }
  return cleaned;
}

/** Extracts both clean status text and normalized date */
export function extractCleanStatusAndDate(rawStatusText: string): { status: string; date: string } {
  if (!rawStatusText) return { status: '-', date: '-' };
  const raw = String(rawStatusText).trim();
  const dateStr = extractDateFromStatus(raw) || '';
  const statusStr = cleanStatusOnly(raw);

  return {
    status: statusStr,
    date: dateStr || '-'
  };
}

// Helper to determine status styling in Excel
function getStatusCellFillAndFont(statusText: string): { bg?: string; fg?: string; bold?: boolean } {
  const s = (statusText || '').toLowerCase();
  if (s.includes('નિકાલ') || s.includes('disposed') || s.includes('dismissed') || s.includes('રદ') || s.includes('ચુકાદો')) {
    return { bg: COLORS.disposedBg, fg: COLORS.disposedText, bold: true };
  }
  if (s.includes('ફાઇનલ') || s.includes('final') || s.includes('દલીલ') || s.includes('પુરાવા') || s.includes('પુરાવો') || s.includes('સાક્ષી') || s.includes('order')) {
    return { bg: COLORS.hearingBg, fg: COLORS.hearingText, bold: true };
  }
  if (s.includes('નોટીસ') || s.includes('notice') || s.includes('નવી મુદત') || s.includes('મુદત')) {
    return { bg: COLORS.noticeBg, fg: COLORS.noticeText, bold: true };
  }
  return {};
}

// Format a single worksheet with professional branding, logo, banner, and styled data rows
function formatStyledWorksheet(
  worksheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  headers: string[],
  rowsData: string[][],
  columnWidths: number[],
  logoImageId: number | null,
  statsSummary?: string
) {
  const colCount = Math.max(headers.length, 7);

  // 1. Column Widths - Set directly on columns to prevent phantom rows
  columnWidths.forEach((w, idx) => {
    worksheet.getColumn(idx + 1).width = w || 18;
  });

  // 2. Page Setup for Landscape Legal Printing (Valid OpenXML schema without fitToHeight: 0)
  worksheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 5, // 5 = Legal (8.5 x 14 in)
    fitToPage: true,
    fitToWidth: 1,
    showGridLines: true,
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.45,
      bottom: 0.45,
      header: 0.25,
      footer: 0.25
    }
  };

  // 3. Insert Corporate Header Banner (Rows 1, 2, 3, 4) in contiguous order
  const r1 = worksheet.addRow(['', '', 'ગુજરાત રાજ્ય માર્ગ વાહન વ્યવહાર નિગમ (GSRTC) • સુરત વિભાગ']);
  r1.height = 26;

  const r2 = worksheet.addRow(['', '', `${subtitle} • ${title}`]);
  r2.height = 20;

  const currentDateStr = new Date().toLocaleDateString('gu-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const r3 = worksheet.addRow(['', '', `📅 રિપોર્ટ તારીખ: ${currentDateStr} | ${statsSummary || 'લેબર શાખા - કાનૂની વિભાગ'} | કુલ રેકોર્ડ: ${rowsData.length}`]);
  r3.height = 18;

  const r4 = worksheet.addRow(['']);
  r4.height = 6;

  // Merge Banner Text Columns (Col C to Col End)
  worksheet.mergeCells(1, 3, 1, colCount);
  worksheet.mergeCells(2, 3, 2, colCount);
  worksheet.mergeCells(3, 3, 3, colCount);

  // Row 1 Title Styling
  const cellR1 = worksheet.getCell(1, 3);
  cellR1.font = { name: 'Arial', size: 14, bold: true, color: { argb: COLORS.navyHeader } };
  cellR1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cellR1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bannerBg } };

  // Row 2 Subtitle Styling
  const cellR2 = worksheet.getCell(2, 3);
  cellR2.font = { name: 'Arial', size: 11, bold: true, color: { argb: COLORS.textDark } };
  cellR2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cellR2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bannerBg } };

  // Row 3 Stats & Date Info Styling
  const cellR3 = worksheet.getCell(3, 3);
  cellR3.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.textMuted } };
  cellR3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cellR3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bannerBg } };

  // Fill Background for Col A & B in rows 1-3 to match banner
  for (let r = 1; r <= 3; r++) {
    worksheet.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bannerBg } };
    worksheet.getCell(r, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bannerBg } };
  }

  // 4. Add Reusable Compact Logo with Schema-Compliant twoCellAnchor
  if (logoImageId !== null) {
    try {
      worksheet.addImage(logoImageId, {
        tl: { col: 0.1, row: 0.15 },
        br: { col: 1.85, row: 3.4 }
      } as any);
    } catch (err) {
      console.warn('Failed to attach logo to sheet:', err);
    }
  }

  // 5. Table Header Row (Row 5)
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 30;

  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = {
      name: 'Arial',
      size: 10.5,
      bold: true,
      color: { argb: COLORS.white }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.navyHeader }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.navyHeader } },
      bottom: { style: 'medium', color: { argb: COLORS.goldAccent } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } }
    };
  });

  // 6. Freeze Panes: Lock rows 1-5 so header stays visible while scrolling
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 5, activeCell: 'A6' }
  ];

  // 7. Data Rows (Row 6 onwards) - Set styles ONLY on populated cells to keep KB size tiny
  rowsData.forEach((rowValues, rIdx) => {
    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 26;

    const isEven = rIdx % 2 === 0;
    const defaultBg = isEven ? COLORS.white : COLORS.zebraLight;

    // Detect status text to apply badge styling
    const statusColIdx = headers.findIndex(h => h.includes('સ્ટેટસ') || h.includes('પરિસ્થિતી') || h.includes('પરિણામ'));
    const statusVal = statusColIdx >= 0 ? String(rowValues[statusColIdx] || '') : '';
    const statusStyle = getStatusCellFillAndFont(statusVal);

    dataRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // Determine alignment
      let hAlign: 'left' | 'center' | 'right' = 'left';
      if (colNumber === 1 || colNumber === 2) {
        hAlign = 'center'; // Serial no & Code centered
      } else if (headers[colNumber - 1]?.includes('તારીખ') || headers[colNumber - 1]?.includes('Date')) {
        hAlign = 'center'; // Dates centered
      } else if (colNumber === statusColIdx + 1) {
        hAlign = 'center'; // Status centered
      }

      const isStatusCol = colNumber === statusColIdx + 1;
      const cellBg = (isStatusCol && statusStyle.bg) ? statusStyle.bg : defaultBg;
      const cellFg = (isStatusCol && statusStyle.fg) ? statusStyle.fg : COLORS.textDark;
      const cellBold = isStatusCol && statusStyle.bold ? true : (colNumber === 1);

      cell.font = {
        name: 'Arial',
        size: 9.5,
        bold: cellBold,
        color: { argb: cellFg }
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: cellBg }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: hAlign,
        wrapText: true
      };

      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.cellBorder } },
        bottom: { style: 'thin', color: { argb: COLORS.cellBorder } },
        left: { style: 'thin', color: { argb: COLORS.cellBorder } },
        right: { style: 'thin', color: { argb: COLORS.cellBorder } }
      };
    });
  });

  // Ensure minimum column widths
  worksheet.columns.forEach((col, idx) => {
    if (!col.width || col.width < (columnWidths[idx] || 15)) {
      col.width = columnWidths[idx] || 15;
    }
  });
}

// Download workbook buffer as file in browser (Clean blob release)
async function saveWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

// Main Export Entry Point
export async function exportStyledExcelWithLogo(
  data: SheetDataMap,
  employeeProfiles: EmployeeProfileMap,
  options: ExcelExportOptions
): Promise<string> {
  const { mode, activeSheet, stats } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GSRTC સુરત વિભાગ • લેબર શાખા';
  workbook.lastModifiedBy = 'GSRTC લીગલ પોર્ટલ';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Register the compact logo ONCE in the workbook so all sheets share the single 6KB media entry!
  let logoImageId: number | null = null;
  try {
    logoImageId = workbook.addImage({
      base64: OFFICIAL_GSRTC_LOGO_BASE64,
      extension: 'png'
    });
  } catch (err) {
    console.warn('Failed to register logo image in workbook:', err);
  }

  const statsSummary = stats
    ? `કુલ પેન્ડિંગ: ${stats.total} | હાઈકોર્ટ: ${stats.hcCount} | લેબર: ${stats.labourCount} | ઔદ્યોગિક: ${stats.itCount} | નિકાલ: ${stats.disposedCount}`
    : 'સુરત વિભાગ • લેબર શાખા કાનૂની અદાલતી કેસ સંચાલન';

  // 1. DOSSIER EXPORT MODE (Includes BOTH Status and Hearing Date)
  if (mode === 'dossier') {
    const ws = workbook.addWorksheet('કર્મચારી સેવા & કેસ Dossier');

    const headers = [
      'ક્રમ નં.',
      'કોર્ટ પ્રકાર',
      'કેસ / SCA / રેફ. નં.',
      'HCE / ફાઈલ નં.',
      'પેનલ એડવોકેટનું નામ',
      'કર્મચારીનું નામ',
      'જન્મ તારીખ',
      'હોદ્દો / બેજ નં.',
      'PF નં.',
      'નિમણુક તારીખ',
      'નિવૃત્તિ તારીખ',
      'ગુનાની વિગત',
      'શિક્ષાત્મક હુકમ',
      'પ્રથમ અપીલ',
      'દ્વિતીય અપીલ',
      'કેસની ટૂંકી વિગત',
      'નીચલી કોર્ટ ચુકાદો',
      'હાલની પરિસ્થિતી / સ્ટેટસ',
      'સુનાવણી / મુદત તારીખ'
    ];

    const columnWidths = [8, 16, 20, 14, 22, 28, 14, 18, 14, 16, 16, 42, 28, 24, 24, 42, 26, 28, 18];

    const rowsData: string[][] = [];
    let serialCount = 1;
    const allSheetKeys: SheetKey[] = ['HC CASE', 'LABOUR CASE', 'IT CASE', 'DISPOSED ARCHIVE'];

    allSheetKeys.forEach((sKey) => {
      const rows = data[sKey] || [];
      const cols = detectSheetColumns(rows[1], sKey);
      for (let rIdx = 2; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        if (!row || !row[0] || row[0] === 'ક્રમ નં.') continue;

        const caseKey = `${sKey}_${rIdx}_${row[1] || ''}`;
        const profile = employeeProfiles[caseKey] || {
          employeeName: '',
          dob: '',
          designation: '',
          pfNo: '',
          appointmentDate: '',
          retirementDate: '',
          offenseDetails: '',
          punishmentOrder: '',
          firstAppeal: '',
          secondAppeal: ''
        };

        const isHC = sKey === 'HC CASE';
        const isLabour = sKey === 'LABOUR CASE' || sKey === 'IT CASE';
        const courtType = isHC ? 'હાઈકોર્ટ (HC)' : isLabour ? (sKey === 'LABOUR CASE' ? 'લેબર કોર્ટ' : 'ઔદ્યોગિક ટ્રિબ્યુનલ (IT)') : `નિકાલ (${row[1] || 'Disposed'})`;

        const caseNo = (isHC ? row[3] : row[1]) || '-';
        const fileNo = isHC ? (row[1] || '-') : '-';
        const advocate = (isHC ? row[4] : row[3]) || '-';
        const employeeName = profile.employeeName || (isHC ? row[5] : row[4]) || '-';
        const caseSummary = (isHC ? row[6] : row[5]) || '-';
        const rawStatus = (row[cols.statusCol] || row[row.length - 1] || '-').trim();
        const lowerCourt = isHC ? (row[2] || '-') : (row[2] || 'સુરત');

        // Extract BOTH Status and Hearing Date
        const statusDateInfo = extractCleanStatusAndDate(rawStatus);
        const fallbackDate = extractDateFromRow(row, cols.statusCol);
        const finalHearingDate = statusDateInfo.date !== '-' ? statusDateInfo.date : (fallbackDate || '-');

        rowsData.push([
          serialCount.toString(),
          courtType,
          caseNo,
          fileNo,
          advocate,
          employeeName,
          profile.dob || '-',
          profile.designation || '-',
          profile.pfNo || '-',
          profile.appointmentDate || '-',
          profile.retirementDate || '-',
          profile.offenseDetails || caseSummary,
          profile.punishmentOrder || '-',
          profile.firstAppeal || '-',
          profile.secondAppeal || '-',
          caseSummary,
          lowerCourt,
          statusDateInfo.status,
          finalHearingDate
        ]);
        serialCount++;
      }
    });

    formatStyledWorksheet(
      ws,
      'કર્મચારી સેવા, શિસ્તભંગ કાર્યવાહી & કોર્ટ કેસોની સંપૂર્ણ Dossier યાદી',
      'લેબર શાખા - સુરત વિભાગ',
      headers,
      rowsData,
      columnWidths,
      logoImageId,
      `કુલ વિગતવાર Dossier રેકોર્ડ: ${rowsData.length}`
    );

    const filename = 'GSRTC_સુરત_કર્મચારી_સેવા_શિસ્ત_અને_કોર્ટ_કેસ_Dossier.xlsx';
    await saveWorkbook(workbook, filename);
    return filename;
  }

  // 2. DISPOSED CASES SEPARATE EXPORT (Includes Both Date and Result)
  if (mode === 'disposed') {
    const ws = workbook.addWorksheet('નિકાલ થયેલા કેસો (Disposed)');
    const rows = data['DISPOSED ARCHIVE'] || [];
    const headers = [
      'ક્રમ નં.',
      'મૂળ અદાલત',
      'કેસ નં. / SCA નં.',
      'એડવોકેટનું નામ',
      'કર્મચારી / પક્ષકારનું નામ',
      'કેસની ટૂંકી વિગત',
      'ચુકાદો / નિકાલ તારીખ',
      'આખરી પરિણામ / સ્ટેટસ'
    ];
    const columnWidths = [8, 16, 20, 22, 28, 55, 20, 22];
    const rowsData: string[][] = [];

    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;

      const dateField = r[6] || '';
      const outcomeField = r[7] || '';
      const extractedDate = extractDateFromStatus(dateField) || dateField.replace(/Decision Date:?/i, '').replace(/Date:?/i, '').trim();

      rowsData.push([
        (rowsData.length + 1).toString(),
        r[1] || 'લેબર શાખા',
        r[2] || '-',
        r[3] || '-',
        r[4] || '-',
        r[5] || '-',
        extractedDate || '-',
        outcomeField || 'નિકાલ થયેલ / Disposed'
      ]);
    }

    formatStyledWorksheet(
      ws,
      'નિકાલ થયેલા કેસોનું કાયમી દફતર / આર્કાઇવ યાદી',
      'લેબર શાખા - સુરત વિભાગ',
      headers,
      rowsData,
      columnWidths,
      logoImageId,
      `કુલ નિકાલ થયેલ કેસો: ${rowsData.length}`
    );

    const filename = 'GSRTC_સુરત_લેબર_શાખા_નિકાલ_થયેલ_કેસો_Disposed.xlsx';
    await saveWorkbook(workbook, filename);
    return filename;
  }

  // 3. PENDING CASES ONLY (HC, Labour, IT)
  if (mode === 'pending') {
    const pendingSheets: SheetKey[] = ['HC CASE', 'LABOUR CASE', 'IT CASE'];
    pendingSheets.forEach((sKey) => {
      addIndividualSheetToWorkbook(workbook, data, sKey, logoImageId, statsSummary);
    });

    const filename = 'GSRTC_સુરત_લેબર_શાખા_પેન્ડિંગ_કેસો_Pending.xlsx';
    await saveWorkbook(workbook, filename);
    return filename;
  }

  // 4. CURRENT ACTIVE SHEET
  if (mode === 'current' && activeSheet && activeSheet !== 'SUMMARY' && activeSheet !== 'CALENDAR' && activeSheet !== 'TOTAL') {
    addIndividualSheetToWorkbook(workbook, data, activeSheet as SheetKey, logoImageId, statsSummary);
    const filename = `GSRTC_સુરત_લેબર_શાખા_${activeSheet}_કેસો.xlsx`;
    await saveWorkbook(workbook, filename);
    return filename;
  }

  // 5. MASTER EXPORT (All sheets: HC, Labour, IT, Disposed Archive)
  const allSheets: SheetKey[] = ['HC CASE', 'LABOUR CASE', 'IT CASE', 'DISPOSED ARCHIVE'];
  allSheets.forEach((sKey) => {
    addIndividualSheetToWorkbook(workbook, data, sKey, logoImageId, statsSummary);
  });

  const filename = 'GSRTC_સુરત_લેબર_શાખા_સંપૂર્ણ_માસ્ટર_એક્સેલ.xlsx';
  await saveWorkbook(workbook, filename);
  return filename;
}

// Helper to add an individual sheet (HC, Labour, IT, Disposed) to the workbook with full styling and BOTH Status + Date
function addIndividualSheetToWorkbook(
  workbook: ExcelJS.Workbook,
  data: SheetDataMap,
  sheetKey: SheetKey,
  logoImageId: number | null,
  statsSummary?: string
) {
  const rows = data[sheetKey] || [];
  const cols = detectSheetColumns(rows[1], sheetKey);
  let sheetTitle = 'હાઈકોર્ટ કેસોની વિગત';
  let tabName: string = sheetKey;
  let headers: string[] = [];
  let columnWidths: number[] = [];

  if (sheetKey === 'HC CASE') {
    sheetTitle = 'માન. ગુજરાત હાઈકોર્ટ ખાતે પેન્ડિંગ કેસોની વિગત';
    tabName = 'હાઈકોર્ટ (HC CASE)';
    headers = [
      'ક્રમ નં.',
      'HCE ફાઈલ No.',
      'નીચલી કોર્ટના ચુકાદા વિગત',
      'SCA/LPA No.',
      'એડવોકેટનું નામ',
      'પક્ષકારનું નામ',
      'કેસની ટૂંકી વિગત',
      'પેપર્સ સુપ્રત તારીખ',
      'વચગાળાના ચુકાદા',
      'એફિડેવિટ તારીખ',
      'કેસનું હાલનું સ્ટેટસ',
      'મુદત / સુનાવણી તારીખ'
    ];
    columnWidths = [8, 14, 24, 18, 22, 28, 52, 20, 20, 20, 28, 18];
  } else if (sheetKey === 'LABOUR CASE') {
    sheetTitle = 'સુરત લેબર કોર્ટ ખાતે પેન્ડિંગ કેસોની વિગત';
    tabName = 'લેબર કોર્ટ (LABOUR)';
    headers = [
      'ક્રમ નં.',
      'રેફ. નંબર',
      'લેબરકોર્ટ',
      'એડવોકેટનું નામ',
      'કર્મચારીનું નામ',
      'કેસની ટૂંકી વિગત',
      'હાલનું સ્ટેટસ / પરિસ્થિતી',
      'મુદત / સુનાવણી તારીખ'
    ];
    columnWidths = [8, 16, 15, 24, 28, 62, 28, 18];
  } else if (sheetKey === 'IT CASE') {
    sheetTitle = 'સુરત ઔદ્યોગિક અદાલત (IT) ખાતે પેન્ડિંગ કેસોની વિગત';
    tabName = 'ઔદ્યોગિક (IT CASE)';
    headers = [
      'ક્રમ નં.',
      'રેફ. નંબર / IT નં.',
      'ઔદ્યોગિક કોર્ટ',
      'એડવોકેટનું નામ',
      'કર્મચારીનું નામ',
      'કેસની ટૂંકી વિગત',
      'હાલનું સ્ટેટસ / પરિસ્થિતી',
      'મુદત / સુનાવણી તારીખ'
    ];
    columnWidths = [8, 16, 15, 24, 28, 62, 28, 18];
  } else if (sheetKey === 'DISPOSED ARCHIVE') {
    sheetTitle = 'નિકાલ થયેલા કેસોનું કાયમી આર્કાઇવ દફતર';
    tabName = 'નિકાલ આર્કાઇવ';
    headers = [
      'ક્રમ નં.',
      'મૂળ કોર્ટ',
      'કેસ નં.',
      'એડવોકેટ',
      'કર્મચારી',
      'ટૂંકી વિગત',
      'ચુકાદો / નિકાલ તારીખ',
      'આખરી પરિણામ / સ્ટેટસ'
    ];
    columnWidths = [8, 16, 18, 22, 28, 55, 20, 22];
  }

  const ws = workbook.addWorksheet(tabName);
  const rowsData: string[][] = [];

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || r[0] === 'ક્રમ નં.' || (r[0] === '1' && r[1] === 'HCE No.')) continue;

    if (sheetKey === 'HC CASE') {
      const rawStatus = (r[cols.statusCol] || r[r.length - 1] || '').trim();
      const statusDate = extractCleanStatusAndDate(rawStatus);

      rowsData.push([
        (rowsData.length + 1).toString(),
        r[1] || '-',
        r[2] || '-',
        r[3] || '-',
        r[4] || '-',
        r[5] || '-',
        r[6] || '-',
        r[7] || '-',
        r[8] || '-',
        r[9] || '-',
        statusDate.status,
        statusDate.date
      ]);
    } else if (sheetKey === 'LABOUR CASE' || sheetKey === 'IT CASE') {
      const rawStatus = (r[cols.statusCol] || r[r.length - 1] || '').trim();
      const statusDate = extractCleanStatusAndDate(rawStatus);

      rowsData.push([
        (rowsData.length + 1).toString(),
        r[1] || '-',
        r[2] || 'સુરત',
        r[3] || '-',
        r[4] || '-',
        r[5] || '-',
        statusDate.status,
        statusDate.date
      ]);
    } else if (sheetKey === 'DISPOSED ARCHIVE') {
      const dateField = r[6] || '';
      const outcomeField = r[7] || '';
      const extractedDate = extractDateFromStatus(dateField) || dateField.replace(/Decision Date:?/i, '').replace(/Date:?/i, '').trim();

      rowsData.push([
        (rowsData.length + 1).toString(),
        r[1] || 'લેબર શાખા',
        r[2] || '-',
        r[3] || '-',
        r[4] || '-',
        r[5] || '-',
        extractedDate || '-',
        outcomeField || 'નિકાલ થયેલ / Disposed'
      ]);
    }
  }

  formatStyledWorksheet(
    ws,
    sheetTitle,
    'લેબર શાખા - સુરત વિભાગ',
    headers,
    rowsData,
    columnWidths,
    logoImageId,
    statsSummary
  );
}
