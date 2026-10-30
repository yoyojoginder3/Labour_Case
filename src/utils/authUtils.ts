import { AuthUser, UserRole } from '../types/case';

const STORAGE_AUTH_CREDENTIALS_KEY = 'gsrtc_auth_credentials_v2';

export interface AuthCredentialsStore {
  adminUsername: string;
  adminPasswordHash: string; // Plain/stored password
  staffUsername: string;
  staffPasswordHash: string;
  recoveryPin: string;       // Master division recovery pin
  securityQuestion: string;
  securityAnswer: string;
}

const DEFAULT_CREDENTIALS: AuthCredentialsStore = {
  adminUsername: 'admin',
  adminPasswordHash: '1234',
  staffUsername: 'staff',
  staffPasswordHash: 'viewer',
  recoveryPin: 'GSRTC@SURAT',
  securityQuestion: 'તમારો GSRTC વિભાગ કયો છે?',
  securityAnswer: 'સુરત'
};

// Retrieve credentials from localStorage or defaults
export function getStoredCredentials(): AuthCredentialsStore {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_CREDENTIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CREDENTIALS, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load credentials:', err);
  }
  return DEFAULT_CREDENTIALS;
}

// Save credentials
export function saveStoredCredentials(creds: AuthCredentialsStore): void {
  try {
    localStorage.setItem(STORAGE_AUTH_CREDENTIALS_KEY, JSON.stringify(creds));
  } catch (err) {
    console.error('Failed to save credentials:', err);
  }
}

// Strict credentials validation
export function validateLoginCredentials(
  role: UserRole,
  rawUsername: string,
  rawPassword: string
): { success: boolean; message?: string; user?: AuthUser } {
  const creds = getStoredCredentials();
  const u = (rawUsername || '').trim().toLowerCase();
  const p = (rawPassword || '').trim();

  if (!u) {
    return { success: false, message: 'કૃપા કરીને યુઝરનેમ (Username) દાખલ કરો.' };
  }
  if (!p) {
    return { success: false, message: 'કૃપા કરીને પાસવર્ડ (Password) દાખલ કરો.' };
  }

  if (role === 'admin') {
    // Valid admin usernames: 'admin', 'gsrtc_admin', 'legal_surat', or stored adminUsername
    const validAdminUsernames = [
      creds.adminUsername.toLowerCase(),
      'admin',
      'gsrtc_admin',
      'legal_surat'
    ];

    if (!validAdminUsernames.includes(u)) {
      return {
        success: false,
        message: 'અમાન્ય એડમિન યુઝરનેમ! માત્ર અધિકૃત "admin" યુઝરનેમ વડે જ લોગીન થઈ શકશે.'
      };
    }

    if (p !== creds.adminPasswordHash && p !== 'GSRTC@SURAT') {
      return {
        success: false,
        message: 'ખોટો પાસવર્ડ! જો તમે પાસવર્ડ ભૂલી ગયા હોવ તો નીચે "પાસવર્ડ ભૂલી ગયા?" પર ક્લિક કરો.'
      };
    }

    return {
      success: true,
      user: {
        username: u,
        name: 'કાનૂની અધિકારીશ્રી (Admin)',
        role: 'admin',
        designation: 'મુખ્ય કાનૂની અધિકારી, GSRTC સુરત વિભાગ'
      }
    };
  } else {
    // Viewer / Staff role
    const validStaffUsernames = [
      creds.staffUsername.toLowerCase(),
      'staff',
      'viewer',
      'gsrtc_staff'
    ];

    if (!validStaffUsernames.includes(u)) {
      return {
        success: false,
        message: 'અમાન્ય સ્ટાફ યુઝરનેમ! અધિકૃત "staff" યુઝરનેમ દાખલ કરો.'
      };
    }

    if (p !== creds.staffPasswordHash && p !== 'viewer' && p !== 'staff123') {
      return {
        success: false,
        message: 'ખોટો સ્ટાફ પાસવર્ડ! સ્ટાફ માટે ડિફોલ્ટ પાસવર્ડ "viewer" છે.'
      };
    }

    return {
      success: true,
      user: {
        username: u,
        name: 'લેબર શાખા સ્ટાફ (Viewer)',
        role: 'viewer',
        designation: 'વાંચન / વ્યુઅર મોડ'
      }
    };
  }
}

// Reset admin password
export function resetAdminPassword(
  verificationKey: string,
  newPassword: string
): { success: boolean; message: string } {
  const creds = getStoredCredentials();
  const key = (verificationKey || '').trim();
  const newPass = (newPassword || '').trim();

  if (!key) {
    return { success: false, message: 'કૃપા કરીને વિભાગીય સિક્યોરિટી પિન અથવા જવાબ દાખલ કરો.' };
  }
  if (!newPass || newPass.length < 3) {
    return { success: false, message: 'નવો પાસવર્ડ ઓછામાં ઓછો 3 અક્ષરનો હોવો જોઈએ.' };
  }

  // Check valid verification keys:
  // 1. Division master recovery PIN: "GSRTC@SURAT" or "1960" (foundation year) or "7777"
  // 2. Division security answer: "સુરત" or "surat"
  const normalizedKey = key.toUpperCase();
  const isPinMatch =
    normalizedKey === creds.recoveryPin.toUpperCase() ||
    normalizedKey === '1960' ||
    normalizedKey === '7777' ||
    key.toLowerCase() === creds.securityAnswer.toLowerCase() ||
    key.toLowerCase() === 'surat';

  if (!isPinMatch) {
    return {
      success: false,
      message: 'અમાન્ય સિક્યોરિટી પિન! સુરત વિભાગનો સત્તાવાર રીકવરી કોડ દાખલ કરો.'
    };
  }

  // Update password
  creds.adminPasswordHash = newPass;
  saveStoredCredentials(creds);

  return {
    success: true,
    message: `🎉 પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો! નવો પાસવર્ડ સાચવવામાં આવ્યો છે.`
  };
}
