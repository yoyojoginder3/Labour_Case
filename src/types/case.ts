export type SheetKey = 'HC CASE' | 'LABOUR CASE' | 'IT CASE' | 'DISPOSED ARCHIVE';
export type ActiveTab = SheetKey | 'TOTAL' | 'SUMMARY' | 'CALENDAR';

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
  petitionerType?: 'all' | 'employee' | 'st';
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

export interface EmployeeProfile {
  employeeName: string;      // કર્મચારીનું નામ
  dob: string;               // જન્મ તારીખ
  designation: string;       // હોદ્દો / બેજ નં.
  pfNo: string;              // PF નં.
  appointmentDate: string;   // નોકરીમાં નિમણુકની તારીખ
  retirementDate: string;    // નિવૃત્તિ તારીખ
  offenseDetails: string;    // ગુનાની વિગત
  punishmentOrder: string;   // શિક્ષાત્મક હુકમ
  firstAppeal: string;       // પ્રથમ અપીલ
  secondAppeal: string;      // દ્વિતીય અપીલ
  petitionerType?: 'employee' | 'st'; // કેસ કોણે કર્યો: 'employee' (કર્મચારી) કે 'st' (એસ.ટી. નિગમ)
}

export type EmployeeProfileMap = Record<string, EmployeeProfile>;
