export type SheetKey = 'HC CASE' | 'LABOUR CASE' | 'IT CASE' | 'DISPOSED ARCHIVE';

export interface SheetConfig {
  key: SheetKey;
  label: string;
  badge: string;
  iconName: string;
  title: string;
  headers: string[];
  columnWidths?: number[];
}

export interface CaseFilter {
  searchQuery: string;
  advocate: string;
  court: string;
  statusType: string;
  disposedOnly: 'all' | 'pending' | 'disposed';
}

export interface SheetDataMap {
  [sheetName: string]: string[][];
}

export interface SheetMetaMap {
  [sheetName: string]: {
    widths?: number[];
    merges?: string[];
  };
}

export interface AdvocateStat {
  name: string;
  total: number;
  hcCount: number;
  labourCount: number;
  itCount: number;
  disposedCount: number;
}

export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  designation: string;
}

export interface DisposedRecord {
  originalSheet: string;
  caseNo: string;
  advocate: string;
  parties: string;
  summary: string;
  disposedDate: string;
  outcome: string;
  fullRow: string[];
}
