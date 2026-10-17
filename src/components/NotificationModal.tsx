import React, { useState, useEffect } from 'react';
import { SheetDataMap, SheetKey } from '../types/case';
import { extractDateFromStatus, getStatusCategory } from '../data/initialData';
import { 
  Bell, 
  X, 
  Send, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Landmark, 
  Scale, 
  Gavel, 
  ShieldCheck, 
  ExternalLink,
  Smartphone,
  Share2
} from 'lucide-react';

export interface UrgentHearing {
  sheetKey: SheetKey;
  originalIndex: number;
  caseNo: string;
  advocate: string;
  applicant: string;
  court: string;
  summary: string;
  status: string;
  rawDate: string;
  parsedDate: Date | null;
  dayDiff: number; // 0 = today, 1 = tomorrow, etc.
}

interface NotificationModalProps {
  isOpen: boolean;
  data: SheetDataMap;
  onClose: () => void;
  onSelectCase: (sheetKey: SheetKey, originalIndex: number) => void;
}

const STORAGE_PHONE_KEY = 'gsrtc_officer_mobile_number';

export function parseHearingDateObj(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/-/g, '/').trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  data,
  onClose,
  onSelectCase
}) => {
  const [officerPhone, setOfficerPhone] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_PHONE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPushEnabled(Notification.permission === 'granted');
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSavePhone = (phone: string) => {
    setOfficerPhone(phone);
    try {
      localStorage.setItem(STORAGE_PHONE_KEY, phone);
    } catch {
      // Ignore
    }
  };

  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      alert('આ બ્રાઉઝરમાં વેબ નોટિફિકેશન સપોર્ટ નથી.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setPushEnabled(true);
      new Notification('🔔 GSRTC સુરત લેબર શાખા એલર્ટ સક્રિય!', {
        body: 'હવે કોર્ટ મુદતના ૧ દિવસ પહેલા તમને નોટિફિકેશન મળશે.',
        icon: '/favicon.ico'
      });
      setNotificationMsg('✅ નોટિફિકેશન સફળતાપૂર્વક ચાલુ થઈ ગયું!');
    } else {
      setNotificationMsg('⚠️ નોટિફિકેશન મંજૂર નથી મળ્યું.');
    }
  };

  // Extract hearings and calculate day differences
  // Note: Baseline date can be current date. If testing in 2026 dataset, we compute relative to upcoming dates.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allUpcomingHearings: UrgentHearing[] = [];

  (['HC CASE', 'LABOUR CASE', 'IT CASE'] as SheetKey[]).forEach((sheetKey) => {
    const rows = data[sheetKey] || [];
    const isHC = sheetKey === 'HC CASE';
    const statusCol = isHC ? 10 : 6;
    const caseNoCol = isHC ? 3 : 1;
    const advCol = isHC ? 4 : 3;
    const applicantCol = isHC ? 5 : 4;
    const summaryCol = isHC ? 6 : 5;
    const courtCol = isHC ? undefined : 2;

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const status = row[statusCol] || '';
      const dateStr = extractDateFromStatus(status);
      if (dateStr) {
        const parsed = parseHearingDateObj(dateStr);
        let dayDiff = 999;
        if (parsed) {
          const diffTime = parsed.getTime() - today.getTime();
          dayDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        allUpcomingHearings.push({
          sheetKey,
          originalIndex: i,
          caseNo: row[caseNoCol] || row[1] || 'SCA',
          advocate: (row[advCol] || '').trim() || 'અનિર્ણિત',
          applicant: row[applicantCol] || '',
          court: isHC ? 'હાઈકોર્ટ (HC)' : `${sheetKey === 'LABOUR CASE' ? 'લેબર કોર્ટ' : 'ઔદ્યોગિક IT'} (${row[courtCol!] || 'સુરત'})`,
          summary: row[summaryCol] || '',
          status,
          rawDate: dateStr,
          parsedDate: parsed,
          dayDiff
        });
      }
    }
  });

  // Sort by date
  allUpcomingHearings.sort((a, b) => {
    if (!a.parsedDate) return 1;
    if (!b.parsedDate) return -1;
    return a.parsedDate.getTime() - b.parsedDate.getTime();
  });

  // 1 Day before (Tomorrow) hearings or nearest next hearing date
  const tomorrowHearings = allUpcomingHearings.filter(h => h.dayDiff === 1);
  const todayHearings = allUpcomingHearings.filter(h => h.dayDiff === 0);
  
  // Nearest upcoming list if today/tomorrow have none in static dataset
  const nearestHearings = allUpcomingHearings.slice(0, 5);
  const targetAlertList = tomorrowHearings.length > 0 ? tomorrowHearings : (todayHearings.length > 0 ? todayHearings : nearestHearings);
  const alertTargetDate = targetAlertList[0]?.rawDate || 'આગામી તારીખ';

  // Generate WhatsApp Message text
  const generateWhatsAppMessage = () => {
    let msg = `🏛️ *GSRTC સુરત વિભાગ • લેબર શાખા* 🏛️\n`;
    msg += `⚠️ *કોર્ટ મુદત એલર્ટ (Court Hearing Reminder)*\n`;
    msg += `📅 *તારીખ:* ${alertTargetDate}\n`;
    msg += `📊 *કુલ કેસો:* ${targetAlertList.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    targetAlertList.forEach((h, idx) => {
      msg += `*${idx + 1}. કેસ નં:* ${h.caseNo}\n`;
      msg += `   🏛️ *કોર્ટ:* ${h.court}\n`;
      msg += `   👤 *એડવોકેટ:* ${h.advocate}\n`;
      msg += `   👥 *પક્ષકાર:* ${h.applicant}\n`;
      msg += `   ⚖️ *સ્ટેજ:* ${h.status.split('\n')[0]}\n\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📌 *સંદેશ:* કૃપા કરીને જરૂરી ફાઈલો તૈયાર રાખી સમયસર કોર્ટમાં ઉપસ્થિત રહેવું.\n`;
    msg += `🌐 *GSRTC લેબર શાખા કેસ મેનેજમેન્ટ પોર્ટલ*`;

    return msg;
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    let url = `https://api.whatsapp.com/send?text=${text}`;
    if (officerPhone && officerPhone.trim()) {
      const cleanPhone = officerPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`;
    }
    window.open(url, '_blank');
  };

  const handleSendSMS = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    const url = officerPhone ? `sms:${officerPhone}?body=${text}` : `sms:?body=${text}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #f59e0b' }}
        className="rounded-3xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Strip with Glowing Alert Gradient */}
        <div 
          style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #ea580c 100%)' }}
          className="p-5 text-white flex items-center justify-between shrink-0 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: '#fef08a', color: '#78350f' }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0 animate-bounce"
            >
              <Bell className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  મુદત એલર્ટ & મોબાઈલ મેસેજ (Hearing Alerts)
                </h2>
              </div>
              <p className="text-xs text-amber-100 font-semibold mt-0.5">
                GSRTC સુરત લેબર શાખા • ૧ દિવસ પહેલા મોબાઈલ પર મેસેજ અને નોટિફિકેશન
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {notificationMsg && (
            <div 
              style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1.5px solid #6ee7b7' }}
              className="p-3 rounded-2xl text-xs font-black flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notificationMsg}</span>
            </div>
          )}

          {/* 1-Click WhatsApp & Mobile Reminder Section */}
          <div 
            style={{ backgroundColor: '#f0fdf4', border: '2.5px solid #22c55e' }}
            className="p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <span style={{ backgroundColor: '#22c55e', color: '#ffffff' }} className="p-1.5 rounded-xl shadow-xs">
                  <Smartphone className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-emerald-950">
                    ૧ દિવસ પહેલા મોબાઈલમાં મેસેજ (Mobile Reminder)
                  </h3>
                  <p className="text-xs text-emerald-800 font-bold">
                    આવતીકાલની મુદત: <strong className="font-mono text-emerald-950 underline">{alertTargetDate}</strong> ({targetAlertList.length} કેસો)
                  </p>
                </div>
              </div>

              <span 
                style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1.5px solid #86efac' }}
                className="text-[11px] font-black px-2.5 py-1 rounded-xl self-start sm:self-auto"
              >
                સક્રિય એલર્ટ
              </span>
            </div>

            {/* Mobile Number Setup */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <label className="block text-xs font-black text-emerald-900 mb-1">
                  અધિકારી / સ્ટાફ મોબાઈલ નંબર (Mobile / WhatsApp No):
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700" />
                  <input
                    type="tel"
                    value={officerPhone}
                    onChange={(e) => handleSavePhone(e.target.value)}
                    placeholder="દા.ત. 9825012345 (૧૦ આંકડાનો નંબર)"
                    style={{ backgroundColor: '#ffffff', border: '2px solid #86efac' }}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sm:col-span-4 flex items-end gap-1.5">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  style={{
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff'
                  }}
                  className="w-full py-2.5 px-3 text-xs font-black rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  title="વોટ્સએપ પર આવતીકાલના કેસોનો મેસેજ મોકલો"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp મોકલો</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-emerald-800 font-bold">
              <span>💡 ૧-ક્લિકમાં આવતીકાલનું આખું કોર્ટ બોર્ડ વોટ્સએપ પર જશે.</span>
              <button
                type="button"
                onClick={handleSendSMS}
                className="underline hover:text-emerald-950 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>SMS મેસેજ મોકલો</span>
              </button>
            </div>
          </div>

          {/* Browser Push Notification Toggle */}
          <div 
            style={{ backgroundColor: '#eff6ff', border: '2px solid #93c5fd' }}
            className="p-4 rounded-2xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <span style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="p-2 rounded-xl">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-blue-950">
                  મોબાઈલ / કમ્પ્યુટર પર પોપઅપ નોટિફિકેશન
                </h4>
                <p className="text-[11px] text-blue-800 font-semibold">
                  {pushEnabled ? 'નોટિફિકેશન મંજૂરી સક્રિય છે.' : 'આવતીકાલની મુદત માટે સ્ક્રીન નોટિફિકેશન મેળવો'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestPush}
              style={{
                backgroundColor: pushEnabled ? '#15803d' : '#1d4ed8',
                color: '#ffffff'
              }}
              className="px-3.5 py-1.5 text-xs font-black rounded-xl shadow-xs transition-all whitespace-nowrap hover:scale-105"
            >
              {pushEnabled ? '✓ ચાલુ છે' : '🔔 નોટિફિકેશન ઓન કરો'}
            </button>
          </div>

          {/* Immediate Hearings List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>મુદત યાદી ({alertTargetDate} ના રોજ {targetAlertList.length} કેસો):</span>
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                કોર્ટમાં જવા માટે તૈયારી કરો
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {targetAlertList.map((h, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectCase(h.sheetKey, h.originalIndex);
                    onClose();
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #e2e8f0'
                  }}
                  className="p-3 rounded-2xl hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        style={{
                          backgroundColor: h.sheetKey === 'HC CASE' ? '#dbeafe' : '#d1fae5',
                          color: h.sheetKey === 'HC CASE' ? '#1e40af' : '#065f46'
                        }}
                        className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                      >
                        {h.court}
                      </span>
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {h.caseNo}
                      </span>
                      <span 
                        style={{ backgroundColor: '#fef08a', color: '#713f12' }}
                        className="text-[10px] font-black px-2 py-0.5 rounded-md font-mono"
                      >
                        {h.rawDate}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-bold truncate">
                      એડવોકેટ: <strong className="text-purple-900">{h.advocate}</strong> • પક્ષકાર: <strong className="text-slate-900">{h.applicant}</strong>
                    </div>

                    <div className="text-[11px] text-amber-900 font-extrabold truncate">
                      સ્ટેજ: {h.status.split('\n')[0]}
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
                    className="p-2 rounded-xl text-xs font-bold shrink-0 hover:bg-blue-700"
                    title="કેસ ફાઈલ જુઓ"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}
          className="p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0"
        >
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#ffffff', color: '#475569', border: '1.5px solid #cbd5e1' }}
            className="px-4 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            બંધ કરો
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff'
            }}
            className="px-5 py-2 text-xs sm:text-sm font-black rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>વોટ્સએપ પર યાદી મોકલો</span>
          </button>
        </div>
      </div>
    </div>
  );
};
