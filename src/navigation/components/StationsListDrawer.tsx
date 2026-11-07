import React, { useState, useMemo } from 'react';
import { Station, CongestionLevel } from '../types';
import { CARGAS_FACILITY_META, getCongestionBadge } from '../utils/companyAssets';
import { CARGAS_LOGO_SVG } from '../utils/cargasLogo';
import { getDistanceMeters, formatDistance } from '../services/routingService';
import { getMasterStationMapLogo } from '../../services/storageService';
import { 
  ChevronUp, 
  ChevronDown, 
  Navigation, 
  Fuel, 
  ShieldCheck, 
  Clock, 
  Gauge, 
  CheckCircle2,
  MapPin,
  List,
  Wrench,
  Droplets,
  Building2,
  Layers,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface StationsListDrawerProps {
  stations: Station[];
  userLocation: [number, number];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  onStartNavigation: (station: Station) => void;
  customAppLogoUrl?: string;
}

// Helper to determine the Egyptian Governorate for each station
export function detectGovernorate(name: string = '', address: string = ''): string {
  const text = `${name} ${address}`.toLowerCase();
  if (text.includes('جيزة') || text.includes('هرم') || text.includes('فيصل') || text.includes('دقي') || text.includes('عجوزة') || text.includes('أكتوبر') || text.includes('زايد') || text.includes('رماية') || text.includes('بين السرايات') || text.includes('منيب') || text.includes('بدرشين') || text.includes('صفط') || text.includes('عمرانية') || text.includes('بولاق الدكرور')) return 'الجيزة';
  if (text.includes('إسكندرية') || text.includes('اسكندرية') || text.includes('سموحة') || text.includes('عجمي') || text.includes('برج العرب') || text.includes('سيدي جابر') || text.includes('محرم بك') || text.includes('ميامي') || text.includes('الرمل') || text.includes('المنتزه') || text.includes('أبي قير') || text.includes('كرموز')) return 'الإسكندرية';
  if (text.includes('قليوبية') || text.includes('شبرا الخيمة') || text.includes('بنها') || text.includes('قليوب') || text.includes('طوخ') || text.includes('الخانكة') || text.includes('قها') || text.includes('شبرا الخيمه') || text.includes('بهتيم') || text.includes('مسطرد')) return 'القليوبية';
  if (text.includes('سويس') || text.includes('العين السخنة') || text.includes('الأربعين')) return 'السويس';
  if (text.includes('بورسعيد') || text.includes('بورفؤاد')) return 'بورسعيد';
  if (text.includes('إسماعيلية') || text.includes('اسماعيلية') || text.includes('فايد') || text.includes('التل الكبير')) return 'الإسماعيلية';
  if (text.includes('غربية') || text.includes('طنطا') || text.includes('المحلة') || text.includes('كفر الزيات') || text.includes('زفتى') || text.includes('سمنود')) return 'الغربية';
  if (text.includes('دقهلية') || text.includes('منصورة') || text.includes('ميت غمر') || text.includes('بلقاس') || text.includes('شربين') || text.includes('دكرنس') || text.includes('طلخا')) return 'الدقهلية';
  if (text.includes('شرقية') || text.includes('زقازيق') || text.includes('العاشر') || text.includes('بلبيس') || text.includes('فاقوس') || text.includes('منيا القمح') || text.includes('العاشر من رمضان')) return 'الشرقية';
  if (text.includes('بحيرة') || text.includes('دمنهور') || text.includes('كفر الدوار') || text.includes('إيتاي البارود') || text.includes('كوم حمادة') || text.includes('وادي النطرون')) return 'البحيرة';
  if (text.includes('منوفية') || text.includes('شبين الكوم') || text.includes('قويسنا') || text.includes('منوف') || text.includes('السادات') || text.includes('أشمون')) return 'المنوفية';
  if (text.includes('كفر الشيخ') || text.includes('دسوق') || text.includes('بلطيم')) return 'كفر الشيخ';
  if (text.includes('دمياط') || text.includes('رأس البر')) return 'دمياط';
  if (text.includes('فيوم') || text.includes('إطسا') || text.includes('سنورس')) return 'الفيوم';
  if (text.includes('بني سويف') || text.includes('الواسطى') || text.includes('ببا')) return 'بني سويف';
  if (text.includes('منيا') || text.includes('ملوي') || text.includes('بني مزار') || text.includes('مغاغة')) return 'المنيا';
  if (text.includes('أسيوط') || text.includes('اسيوط') || text.includes('ديروط') || text.includes('منفلوط')) return 'أسيوط';
  if (text.includes('سوهاج') || text.includes('جرجا') || text.includes('طهطا') || text.includes('أخميم')) return 'سوهاج';
  if (text.includes('قنا') || text.includes('نجع حمادي') || text.includes('قوص')) return 'قنا';
  if (text.includes('أقصر') || text.includes('اقصر') || text.includes('إسنا')) return 'الأقصر';
  if (text.includes('أسوان') || text.includes('اسوان') || text.includes('كوم أمبو') || text.includes('إدفو')) return 'أسوان';
  if (text.includes('بحر أحمر') || text.includes('غردقة') || text.includes('سفاجا') || text.includes('شرم') || text.includes('طور') || text.includes('رأس غارب') || text.includes('القصير')) return 'البحر الأحمر';
  if (text.includes('مطروح') || text.includes('علمين') || text.includes('الضبعة') || text.includes('مرسى مطروح')) return 'مطروح';
  return 'القاهرة'; // Default
}

export const StationsListDrawer: React.FC<StationsListDrawerProps> = ({
  stations,
  userLocation,
  selectedStation,
  onSelectStation,
  onStartNavigation,
  customAppLogoUrl,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [isGroupedView, setIsGroupedView] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract master unified logo
  const masterLogo = getMasterStationMapLogo();

  // Attach detected governorate and distance to each station
  const processedStations = useMemo(() => {
    return stations.map((st) => {
      const distM = getDistanceMeters(userLocation[0], userLocation[1], st.lat, st.lng);
      const gov = detectGovernorate(st.name, st.address);
      return {
        ...st,
        governorate: gov,
        distanceMeters: distM,
      };
    });
  }, [stations, userLocation]);

  // List of all unique governorates with station counts
  const governoratesList = useMemo(() => {
    const counts: Record<string, number> = {};
    processedStations.forEach((st) => {
      counts[st.governorate] = (counts[st.governorate] || 0) + 1;
    });

    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));

    // Prioritize Cairo, Giza, Alex, Qalyubia then alphabetically
    const priority = ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'السويس', 'بورسعيد', 'الإسماعيلية'];
    return list.sort((a, b) => {
      const idxA = priority.indexOf(a.name);
      const idxB = priority.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.count - a.count;
    });
  }, [processedStations]);

  // Filter stations based on selected governorate and search query
  const filteredStations = useMemo(() => {
    return processedStations.filter((st) => {
      const matchGov = selectedGovernorate === 'all' || st.governorate === selectedGovernorate;
      const matchSearch =
        !searchQuery.trim() ||
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.governorate.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGov && matchSearch;
    }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [processedStations, selectedGovernorate, searchQuery]);

  // Group stations by governorate
  const stationsByGovernorate = useMemo(() => {
    const groups: Record<string, typeof filteredStations> = {};
    filteredStations.forEach((st) => {
      if (!groups[st.governorate]) {
        groups[st.governorate] = [];
      }
      groups[st.governorate].push(st);
    });
    return groups;
  }, [filteredStations]);

  return (
    <div
      className={`absolute bottom-0 inset-x-0 z-[500] pointer-events-none transition-all duration-300 ${
        isExpanded ? 'h-[85%] max-h-[85%]' : 'h-14 md:h-16'
      }`}
    >
      <div className="max-w-3xl mx-auto h-full p-2 md:p-3 flex flex-col justify-end">
        <div className="pointer-events-auto w-full h-full bg-slate-900/98 border-t-2 border-x-2 border-emerald-500/80 rounded-t-3xl shadow-2xl backdrop-blur-2xl flex flex-col text-white overflow-hidden">
          
          {/* Header Bar - Requested: كارجاس أقرب لك */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-3 px-4 flex items-center justify-between text-xs font-black text-slate-200 hover:text-white cursor-pointer bg-slate-800/90 border-b border-slate-700/80 shrink-0 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg overflow-hidden bg-white p-0.5 border border-emerald-500 shrink-0 flex items-center justify-center shadow-xs">
                {masterLogo ? (
                  <img src={masterLogo} alt="كارجاس" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs">⛽</span>
                )}
              </div>
              <span className="text-emerald-400 font-black text-sm flex items-center gap-1.5">
                <span>كارجاس أقرب لك</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  {filteredStations.length} موقع مصنف
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="text-[11px] bg-slate-700/70 px-2.5 py-1 rounded-xl">
                {isExpanded ? 'تصغير الخريطة' : 'عرض المحطات مصنفة بالمحافظة'}
              </span>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </button>

          {/* Drawer Body */}
          {isExpanded && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Controls Strip: Governorate Pills & Search */}
              <div className="p-3 bg-slate-850/90 border-b border-slate-700/80 space-y-2.5 shrink-0">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المحطة أو الحي أو المحافظة..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 pr-9 text-xs text-white placeholder:text-slate-400 outline-none focus:border-emerald-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>

                {/* Governorate Filter Pills (مصنفة حسب المحافظة) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0 ml-1">🏛️ المحافظة:</span>
                  
                  {/* All Governorates Tab */}
                  <button
                    onClick={() => setSelectedGovernorate('all')}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center gap-1 border ${
                      selectedGovernorate === 'all'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <span>كل المحافظات</span>
                    <span className="text-[9px] opacity-80 font-mono">({processedStations.length})</span>
                  </button>

                  {/* Individual Governorate Tabs */}
                  {governoratesList.map((gov) => {
                    const isSelected = selectedGovernorate === gov.name;
                    return (
                      <button
                        key={gov.name}
                        onClick={() => setSelectedGovernorate(gov.name)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <span>{gov.name}</span>
                        <span className="text-[9px] opacity-80 font-mono">({gov.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stations List Body with Governorate Grouping */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {Object.keys(stationsByGovernorate).length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
                    لا توجد محطات مطابقة للبحث في المحافظة المحددة
                  </div>
                ) : (
                  Object.entries(stationsByGovernorate).map(([govName, stationsInGov]) => (
                    <div key={govName} className="space-y-2">
                      {/* Governorate Section Heading */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950/70 to-slate-800/60 border border-emerald-500/30 rounded-xl px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <h4 className="font-black text-xs text-emerald-300">
                            محافظة {govName}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold font-mono">
                          {stationsInGov.length} موقع كارجاس
                        </span>
                      </div>

                      {/* Station Cards in this Governorate */}
                      <div className="space-y-2">
                        {stationsInGov.map((station) => {
                          const facility = CARGAS_FACILITY_META[station.facilityType] || CARGAS_FACILITY_META.station;
                          const congestion = getCongestionBadge(station.congestionLevel, station.waitTimeMinutes);
                          const isSelected = selectedStation?.id === station.id;
                          const stationItemLogo = getMasterStationMapLogo(station.id, station.customLogoUrl);

                          return (
                            <div
                              key={station.id}
                              onClick={() => onSelectStation(station)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/70 border-emerald-500/90 ring-2 ring-emerald-500 shadow-md'
                                  : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 hover:border-emerald-600'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  {/* Unified Station Logo */}
                                  <div className="w-10 h-10 rounded-xl bg-white p-1 border-2 border-emerald-500 shrink-0 overflow-hidden shadow mt-0.5 flex items-center justify-center">
                                    <img
                                      src={stationItemLogo}
                                      alt={station.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-black text-xs sm:text-sm text-white">{station.name}</span>
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full border ${facility.badgeBg}`}>
                                        {facility.title}
                                      </span>
                                      <span className="text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                                        🏛️ {station.governorate}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">{station.address}</p>
                                  </div>
                                </div>

                                {/* Distance & ETA Badge */}
                                <div className="text-left shrink-0">
                                  <div className="text-xs font-black text-emerald-400 font-mono">
                                    {formatDistance(station.distanceMeters)}
                                  </div>
                                  <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border mt-1 ${congestion.color}`}>
                                    {congestion.label} (~{station.waitTimeMinutes} د)
                                  </div>
                                </div>
                              </div>

                              {/* Action Footer: ETA + Direct Wasalny Navigation */}
                              <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                                <div className="flex items-center gap-2 text-[10px]">
                                  {station.cng && <span>⛽ غاز طبيعي</span>}
                                  {station.conversionCenter && <span className="text-amber-300">🛠️ تحويل</span>}
                                  {station.oilCenter && <span className="text-blue-300">🛢️ زيوت معتمدة</span>}
                                  <span>•</span>
                                  <span className="text-emerald-300 font-mono">
                                    ⏱️ ~{Math.max(2, Math.round(station.distanceMeters / 600))} دقيقة
                                  </span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStartNavigation(station);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
                                  title="بدء الملاحة الحية فوراً"
                                >
                                  <Navigation className="w-3.5 h-3.5 text-slate-950" />
                                  <span>🚗 وصّلني</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
