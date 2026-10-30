import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Phone, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Landmark, 
  Scale, 
  Gavel, 
  User, 
  Share2, 
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { SheetKey } from '../types/case';

export interface HearingItemForMsg {
  sheetKey: SheetKey;
  originalIndex: number;
  caseNo: string;
  fileNo?: string;
  advocate: string;
  applicant: string;
  court: string;
  summary: string;
  status: string;
  rawDate: string;
  dayKey?: string;
}

interface HearingMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // e.g. "20/10/2026" or "આજની તારીખ"
  fullDateGujarati?: string;
  hearings: HearingItemForMsg[];
  initialCaseIndex?: number | null; // index inside hearings array, or null for entire board
}

const STORAGE_PHONE_KEY = 'gsrtc_officer_mobile_number';

export function formatSingleCaseMessage(h: HearingItemForMsg): string {
  let msg = `🏛️ *GSRTC સુરત વિભાગ • લેબર શાખા* 🏛️\n`;
  msg += `⚖️ *કોર્ટ કેસ મુદત એલર્ટ (Court Hearing Alert)*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📌 *કેસ નં:* ${h.caseNo}\n`;
  msg += `📅 *મુદત તારીખ:* ${h.rawDate}\n`;
  msg += `🏛️ *અદાલત:* ${h.court}\n`;
  msg += `👤 *પેનલ એડવોકેટ:* ${h.advocate || 'અનિર્ણિત'}\n`;
  msg += `👥 *કર્મચારી / અરજદાર:* ${h.applicant || 'માહિતી ઉપલબ્ધ નથી'}\n`;
  if (h.fileNo) {
    msg += `📁 *ફાઈલ નં:* ${h.fileNo}\n`;
  }
  if (h.summary) {
    msg += `📝 *કેસ વિગત:* ${h.summary}\n`;
  }
  msg += `⚖️ *હાલની સ્થિતિ / સ્ટેજ:* ${h.status.split('\n')[0]}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📌 *સંદેશ:* ઉપરોક્ત કેસની સુનાવણી નિયત તારીખે હોવાથી જરૂરી કેસ ફાઇલ અને આધાર પુરાવા સાથે કોર્ટમાં સમયસર હાજર રહેવા વિનંતી.\n`;
  msg += `🌐 *GSRTC લેબર શાખા સુરત કેસ પોર્ટલ*`;
  return msg;
}

export function formatBoardMessage(hearings: HearingItemForMsg[], dateLabel: string): string {
  let msg = `🏛️ *GSRTC સુરત વિભાગ • લેબર શાખા* 🏛️\n`;
  msg += `📋 *દૈનિક કોર્ટ મુદત સમયપત્રક (Daily Cause List)*\n`;
  msg += `📅 *તારીખ:* ${dateLabel}\n`;
  msg += `📊 *કુલ કેસો:* ${hearings.length}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (hearings.length === 0) {
    msg += `આ તારીખે કોઈ કેસની કોર્ટ મુદત નથી.\n\n`;
  } else {
    hearings.forEach((h, idx) => {
      msg += `*${idx + 1}. કેસ નં:* ${h.caseNo}\n`;
      msg += `   📅 *તારીખ:* ${h.rawDate}\n`;
      msg += `   🏛️ *કોર્ટ:* ${h.court}\n`;
      msg += `   👤 *એડવોકેટ:* ${h.advocate || 'અનિર્ણિત'}\n`;
      msg += `   👥 *પક્ષકાર:* ${h.applicant || '—'}\n`;
      msg += `   ⚖️ *સ્ટેજ:* ${h.status.split('\n')[0]}\n\n`;
    });
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📌 *સૂચના:* સંબંધિત અધિકારી/સ્ટાફે જરૂરી ફાઇલો તૈયાર રાખી સમયસર કોર્ટમાં ઉપસ્થિત રહેવું.\n`;
  msg += `🌐 *GSRTC લેબર શાખા સુરત પોર્ટલ*`;
  return msg;
}

export const HearingMessageModal: React.FC<HearingMessageModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  fullDateGujarati,
  hearings,
  initialCaseIndex = null
}) => {
  const [recipientPhone, setRecipientPhone] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_PHONE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [messageMode, setMessageMode] = useState<'board' | 'single'>(
    initialCaseIndex !== null && initialCaseIndex !== undefined ? 'single' : 'board'
  );
  
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(
    initialCaseIndex !== null && initialCaseIndex !== undefined && initialCaseIndex >= 0 && initialCaseIndex < hearings.length 
      ? initialCaseIndex 
      : 0
  );

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string>('');

  useEffect(() => {
    if (initialCaseIndex !== null && initialCaseIndex !== undefined && initialCaseIndex >= 0 && initialCaseIndex < hearings.length) {
      setMessageMode('single');
      setSelectedCaseIdx(initialCaseIndex);
    } else {
      setMessageMode('board');
    }
  }, [initialCaseIndex, hearings.length, isOpen]);

  const handlePhoneChange = (val: string) => {
    setRecipientPhone(val);
    try {
      localStorage.setItem(STORAGE_PHONE_KEY, val);
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  // Selected item if single mode
  const currentCase = hearings[selectedCaseIdx] || hearings[0];

  const generatedText = messageMode === 'single' && currentCase
    ? formatSingleCaseMessage(currentCase)
    : formatBoardMessage(hearings, fullDateGujarati || dateStr);

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generatedText);
    let url = `https://api.whatsapp.com/send?text=${text}`;
    if (recipientPhone && recipientPhone.trim()) {
      const cleanPhone = recipientPhone.replace(/\D/g, '');
      const formatted = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url = `https://api.whatsapp.com/send?phone=${formatted}&text=${text}`;
    }
    window.open(url, '_blank');
    setStatusFeedback('✅ WhatsApp સફળતાપૂર્વક ઓપન થયું!');
    setTimeout(() => setStatusFeedback(''), 4000);
  };

  const handleSendSMS = () => {
    const text = encodeURIComponent(generatedText);
    const cleanPhone = recipientPhone ? recipientPhone.replace(/\D/g, '') : '';
    const url = cleanPhone ? `sms:${cleanPhone}?body=${text}` : `sms:?body=${text}`;
    window.open(url, '_blank');
    setStatusFeedback('✅ SMS એપ સફળતાપૂર્વક ઓપન થઈ!');
    setTimeout(() => setStatusFeedback(''), 4000);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setIsCopied(true);
      setStatusFeedback('✅ મેસેજ ક્લિપબોર્ડમાં કોપી થઈ ગયો!');
      setTimeout(() => {
        setIsCopied(false);
        setStatusFeedback('');
      }, 3000);
    } catch {
      setStatusFeedback('⚠️ કોપી કરવામાં ક્ષતિ આવી.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        style={{ backgroundColor: '#ffffff', border: '3px solid #16a34a' }}
        className="rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div 
          style={{ background: 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #059669 100%)' }}
          className="p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: '#dcfce7', color: '#14532d' }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0"
            >
              <MessageSquare className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>મુદત WhatsApp & SMS સંદેશ (Hearing Alerts)</span>
              </h2>
              <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                GSRTC સુરત લેબર શાખા • કેલેન્ડર મુદતો સીધી વોટ્સએપ અથવા ટેક્સ્ટ SMS પર મોકલો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            className="p-2 text-white hover:bg-white/30 rounded-xl transition-colors cursor-pointer"
            title="બંધ કરો"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {statusFeedback && (
            <div 
              style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1.5px solid #6ee7b7' }}
              className="p-3 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800">
              સંદેશનો પ્રકાર પસંદ કરો (Select Message Type):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMessageMode('board')}
                style={{
                  backgroundColor: messageMode === 'board' ? '#15803d' : '#f8fafc',
                  color: messageMode === 'board' ? '#ffffff' : '#334155',
                  border: messageMode === 'board' ? '2px solid #166534' : '2px solid #cbd5e1'
                }}
                className="py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>સંપૂર્ણ તારીખનું બોર્ડ ({hearings.length} કેસો)</span>
              </button>

              <button
                type="button"
                onClick={() => setMessageMode('single')}
                disabled={hearings.length === 0}
                style={{
                  backgroundColor: messageMode === 'single' ? '#15803d' : '#f8fafc',
                  color: messageMode === 'single' ? '#ffffff' : '#334155',
                  border: messageMode === 'single' ? '2px solid #166534' : '2px solid #cbd5e1',
                  opacity: hearings.length === 0 ? 0.5 : 1
                }}
                className="py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Scale className="w-4 h-4" />
                <span>માત્ર એક ચોક્કસ કેસ</span>
              </button>
            </div>
          </div>

          {/* If Single Case Mode: Dropdown to pick case */}
          {messageMode === 'single' && hearings.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-1.5">
              <label className="block text-xs font-black text-amber-950">
                કયો કેસ મોકલવો છે? (Select Specific Case):
              </label>
              <select
                value={selectedCaseIdx}
                onChange={(e) => setSelectedCaseIdx(Number(e.target.value))}
                style={{ backgroundColor: '#ffffff', border: '1.5px solid #f59e0b' }}
                className="w-full p-2 text-xs font-bold rounded-xl text-slate-900 cursor-pointer"
              >
                {hearings.map((h, i) => (
                  <option key={i} value={i}>
                    {i + 1}. {h.caseNo} — {h.advocate} ({h.applicant ? h.applicant.substring(0, 25) : h.court})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recipient Phone Number */}
          <div 
            style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}
            className="p-3.5 sm:p-4 rounded-2xl space-y-2"
          >
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>મોબાઈલ નંબર / WhatsApp નંબર (ઓપ્શનલ):</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-bold">
                આપોઆપ સેવ થશે
              </span>
            </div>
            
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="દા.ત. 9825012345 (ખાલી રાખશો તો સંપર્ક/ગ્રુપ પસંદ કરી શકાશે)"
              style={{ backgroundColor: '#ffffff', border: '1.5px solid #4ade80' }}
              className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <p className="text-[11px] text-emerald-800 font-medium">
              💡 <strong>ટિપ:</strong> જો નંબર ખાલી રાખશો, તો સીધું WhatsApp ઓપન થશે અને તમે તમારા ફોન/કોમ્પ્યુટરમાંથી કોઈપણ વ્યક્તિ કે વકીલ/સ્ટાફના ગ્રુપમાં આ મેસેજ ફોરવર્ડ કરી શકશો.
            </p>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>સંદેશ પ્રિવ્યૂ (Message Preview):</span>
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                style={{
                  backgroundColor: isCopied ? '#dcfce7' : '#f1f5f9',
                  color: isCopied ? '#15803d' : '#334155',
                  border: isCopied ? '1.5px solid #86efac' : '1.5px solid #cbd5e1'
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all hover:bg-slate-200"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'કોપી થઈ ગયું!' : 'ટેક્સ્ટ કોપી કરો'}</span>
              </button>
            </div>

            <div 
              style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              className="p-3.5 rounded-2xl max-h-56 overflow-y-auto text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner"
            >
              {generatedText}
            </div>
          </div>
        </div>

        {/* Modal Footer with Primary Action Buttons */}
        <div 
          style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}
          className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black text-slate-700 bg-slate-200 hover:bg-slate-300 transition-all cursor-pointer text-center"
          >
            બંધ કરો (Close)
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendSMS}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff'
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="ટેક્સ્ટ SMS મોકલો"
            >
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
              <span>ટેક્સ્ટ SMS</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff'
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="વોટ્સએપ પર મેસેજ મોકલો"
            >
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
              <span>🟢 WhatsApp પર મોકલો</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
