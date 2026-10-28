import { Search, X, LayoutGrid, TableProperties, RotateCcw, Filter, Sparkles, Check, FileSpreadsheet, UserCheck, Building2, User, Users, Scale } from 'lucide-react';
import { CaseFilter } from '../types/case';

interface FiltersBarProps {
  filter: CaseFilter;
  onFilterChange: (newFilter: CaseFilter) => void;
  advocateOptions: string[];
  courtOptions: string[];
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  filteredCount: number;
  totalInCurrentSheet: number;
  petitionerCounts?: { total: number; st: number; employee: number };
  activeSheet?: string;
  onExportDossier?: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filter,
  onFilterChange,
  advocateOptions,
  courtOptions,
  viewMode,
  onViewModeChange,
  filteredCount,
  totalInCurrentSheet,
  petitionerCounts,
  activeSheet,
  onExportDossier
}) => {
  const isFiltered =
    Boolean(filter.searchQuery) ||
    Boolean(filter.advocate) ||
    Boolean(filter.court) ||
    Boolean(filter.statusType) ||
    (Boolean(filter.petitionerType) && filter.petitionerType !== 'all') ||
    filter.disposedOnly !== 'all';

  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      advocate: '',
      court: '',
      statusType: '',
      disposedOnly: 'all',
      petitionerType: 'all'
    });
  };

  // Quick preset keyword filters
  const quickKeywords = [
    { label: '🔥 Final Hearing', query: 'final hearing' },
    { label: '📋 નોટિસ/મુલતવી', query: 'notice' },
    { label: '🎯 એડમિશન', query: 'admission' },
    { label: '⚖️ દલીલ/પુરાવા', query: 'argument' },
    { label: '🎟️ ટીકીટ ઉચાપત', query: 'ટીકીટ' },
    { label: '🚗 અકસ્માત', query: 'અકસ્માત' },
    { label: '🚫 ગેરહાજરી', query: 'ગેરહાજર' },
    { label: '💰 રજા પગાર', query: 'પગાર' },
    { label: '🍺 કેફીપીણું', query: 'દારૂ' }
  ];

  return (
    <div 
      style={{ backgroundColor: '#ffffff', border: '2.5px solid #93c5fd' }}
      className="rounded-3xl p-4 sm:p-5 mb-5 shadow-lg space-y-3.5"
    >
      {/* Search Input Row with High Contrast and Clear Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-blue-600">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            placeholder="લાઈવ સર્ચ કરો: કેસ નં, ફાઈલ નં, કર્મચારી, એડવોકેટ, અકસ્માત, ટીકીટ ઉચાપત, તારીખ..."
            style={{ backgroundColor: '#f0f9ff', border: '2px solid #38bdf8' }}
            className="w-full pl-11 pr-24 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-400/20 focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
          {filter.searchQuery ? (
            <button
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-rose-200 transition-colors flex items-center gap-1 text-xs font-bold"
              title="શોધ સાફ કરો"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">સાફ</span>
            </button>
          ) : (
            <span 
              style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-black font-mono hidden sm:inline"
            >
              લાઈવ સર્ચ
            </span>
          )}
        </div>

        {/* Action Controls: Reset & View Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {isFiltered && (
            <button
              onClick={resetFilters}
              style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1.5px solid #fecdd3' }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl hover:bg-rose-100 transition-colors shadow-2xs"
              title="તમામ ફિલ્ટર રીસેટ કરો"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>રીસેટ ({filteredCount}/{totalInCurrentSheet})</span>
            </button>
          )}

          {onExportDossier && (
            <button
              type="button"
              onClick={onExportDossier}
              style={{ backgroundColor: '#faf5ff', color: '#6b21a8', border: '1.5px solid #c084fc' }}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-black rounded-xl hover:bg-purple-100 transition-all shadow-2xs cursor-pointer shrink-0"
              title="કર્મચારી સેવા અને શિસ્ત વિગતો સાથે અલગ એક્સેલ ડાઉનલોડ કરો"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">📋 Dossier Excel</span>
              <span className="sm:hidden">Dossier</span>
            </button>
          )}
          {/* View Toggle */}
          <div 
            style={{ backgroundColor: '#f1f5f9', border: '1.5px solid #cbd5e1' }}
            className="flex items-center p-1 rounded-xl"
          >
            <button
              onClick={() => onViewModeChange('table')}
              style={{
                backgroundColor: viewMode === 'table' ? '#1d4ed8' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#475569'
              }}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1"
              title="ટેબલ સ્પ્રેડશીટ વ્યુ"
            >
              <TableProperties className="w-4 h-4" />
              <span className="hidden sm:inline">ટેબલ</span>
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              style={{
                backgroundColor: viewMode === 'cards' ? '#1d4ed8' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : '#475569'
              }}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1"
              title="કાર્ડ્સ વ્યુ"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">કાર્ડ્સ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Search Chips Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0 mr-1 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>ઝડપી સર્ચ:</span>
        </span>
        {quickKeywords.map((kw) => {
          const isActive = filter.searchQuery.toLowerCase().includes(kw.query);
          return (
            <button
              key={kw.label}
              type="button"
              onClick={() => {
                if (isActive) {
                  onFilterChange({ ...filter, searchQuery: '' });
                } else {
                  onFilterChange({ ...filter, searchQuery: kw.query });
                }
              }}
              style={{
                backgroundColor: isActive ? '#1d4ed8' : '#f8fafc',
                color: isActive ? '#ffffff' : '#334155',
                border: isActive ? '1.5px solid #1e40af' : '1.5px solid #e2e8f0'
              }}
              className="px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all hover:scale-105 shadow-2xs shrink-0 text-[11px]"
            >
              {kw.label}
            </button>
          );
        })}
      </div>

      {/* High Court & All Courts: Petitioner Type Quick Filter Bar (પ્રથમ પક્ષકાર: એસ.ટી. નિગમ vs કર્મચારી) */}
      <div 
        style={{
          background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1.5px solid #cbd5e1'
        }}
        className="p-2.5 sm:p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-xs"
      >
        <div className="flex items-center gap-2">
          <div 
            style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
            className="w-7 h-7 rounded-lg flex items-center justify-center font-black shadow-xs shrink-0"
          >
            <Scale className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>પ્રથમ પક્ષકાર / પિટિશનર ફિલ્ટર</span>
              {activeSheet === 'HC CASE' && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                  હાઈકોર્ટ કેસ વિશેષ
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              કેસ કોણે દાખલ કર્યો છે તે મુજબ અલગ યાદી જુઓ:
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filter, petitionerType: 'all' })}
            style={{
              backgroundColor: (!filter.petitionerType || filter.petitionerType === 'all') ? '#0f172a' : '#ffffff',
              color: (!filter.petitionerType || filter.petitionerType === 'all') ? '#fde047' : '#334155',
              border: '2px solid ' + ((!filter.petitionerType || filter.petitionerType === 'all') ? '#0f172a' : '#cbd5e1')
            }}
            className="px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>તમામ કેસો ({petitionerCounts?.total ?? totalInCurrentSheet})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange({ ...filter, petitionerType: 'st' })}
            style={{
              backgroundColor: filter.petitionerType === 'st' ? '#1d4ed8' : '#ffffff',
              color: filter.petitionerType === 'st' ? '#ffffff' : '#1e40af',
              border: '2px solid #2563eb'
            }}
            className="px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer hover:bg-blue-50 whitespace-nowrap active:scale-95"
            title="પ્રથમ પક્ષકાર એસ.ટી. નિગમ હોય તેવા કેસો (એસ.ટી. દ્વારા દાખલ)"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-300" />
            <span>🚌 પ્રથમ પક્ષકાર: એસ.ટી. નિગમ ({petitionerCounts?.st ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange({ ...filter, petitionerType: 'employee' })}
            style={{
              backgroundColor: filter.petitionerType === 'employee' ? '#059669' : '#ffffff',
              color: filter.petitionerType === 'employee' ? '#ffffff' : '#065f46',
              border: '2px solid #059669'
            }}
            className="px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-50 whitespace-nowrap active:scale-95"
            title="કર્મચારી દ્વારા દાખલ થયેલ કેસો (પ્રથમ પક્ષકાર: કર્મચારી)"
          >
            <User className="w-3.5 h-3.5" />
            <span>🧑‍💼 પ્રથમ પક્ષકાર: કર્મચારી દ્વારા દાખલ ({petitionerCounts?.employee ?? 0})</span>
          </button>
        </div>
      </div>

      {/* Secondary Dropdown Filter Strip */}
      <div 
        style={{ borderTop: '1.5px solid #f1f5f9' }}
        className="pt-3 flex flex-wrap items-center justify-between gap-2.5 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Advocate Dropdown */}
          <select
            value={filter.advocate}
            onChange={(e) => onFilterChange({ ...filter, advocate: e.target.value })}
            style={{ backgroundColor: '#f5f3ff', border: '1.5px solid #c084fc', color: '#581c87' }}
            className="px-3 py-1.5 rounded-xl font-bold focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
          >
            <option value="">👤 તમામ એડવોકેટ ({advocateOptions.length})</option>
            {advocateOptions.map((adv) => (
              <option key={adv} value={adv}>
                {adv}
              </option>
            ))}
          </select>

          {/* Court Dropdown */}
          {courtOptions.length > 0 && (
            <select
              value={filter.court}
              onChange={(e) => onFilterChange({ ...filter, court: e.target.value })}
              style={{ backgroundColor: '#ecfdf5', border: '1.5px solid #6ee7b7', color: '#065f46' }}
              className="px-3 py-1.5 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="">🏛️ તમામ કોર્ટ સ્થળ ({courtOptions.join(', ')})</option>
              {courtOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Status Type Dropdown */}
          <select
            value={filter.statusType}
            onChange={(e) => onFilterChange({ ...filter, statusType: e.target.value })}
            style={{ backgroundColor: '#fff7ed', border: '1.5px solid #fdba74', color: '#9a3412' }}
            className="px-3 py-1.5 rounded-xl font-bold focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-2xs"
          >
            <option value="">⚖️ તમામ કેસ સ્ટેટસ</option>
            <option value="final_hearing">🔥 Final Hearing (અંતિમ સુનાવણી)</option>
            <option value="notice_adjourned">📋 Notice & Adjourned (નોટિસ / મુલતવી)</option>
            <option value="admission">🎯 Admission (એડમિશન)</option>
            <option value="argument">📜 દલીલ / પુરાવા (Argument)</option>
            <option value="disposed">✅ નિકાલ થયેલ (Disposed)</option>
          </select>

          {/* Petitioner Type (કેસ કોણે કર્યો) Dropdown */}
          <select
            value={filter.petitionerType || 'all'}
            onChange={(e) => onFilterChange({ ...filter, petitionerType: e.target.value as any })}
            style={{ backgroundColor: '#eff6ff', border: '1.5px solid #60a5fa', color: '#1e40af' }}
            className="px-3 py-1.5 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            title="કેસ કોણે દાખલ કર્યો છે તે મુજબ ફિલ્ટર કરો (કર્મચારી અથવા એસ.ટી. નિગમ)"
          >
            <option value="all">👥 તમામ પક્ષકારો (કર્મચારી + એસ.ટી.)</option>
            <option value="employee">🧑‍💼 કર્મચારી દ્વારા દાખલ (By Workman)</option>
            <option value="st">🚌 એસ.ટી. નિગમ દ્વારા દાખલ (By GSRTC)</option>
          </select>
        </div>

        {/* Filter Results Counter */}
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-600 ml-auto">
          <span>પરિણામ:</span>
          <span 
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="px-2.5 py-0.5 rounded-lg font-black text-xs shadow-2xs"
          >
            {filteredCount} / {totalInCurrentSheet}
          </span>
        </div>
      </div>
    </div>
  );
};
