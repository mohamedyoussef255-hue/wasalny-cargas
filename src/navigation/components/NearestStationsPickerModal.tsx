import React from 'react';
import { Station, CargasFacilityType } from '../types';
import { CARGAS_LOGO_SVG } from '../utils/cargasLogo';
import { getCongestionBadge } from '../utils/companyAssets';
import { 
  X, 
  Navigation, 
  MapPin, 
  Clock, 
  Wrench, 
  Droplets, 
  Fuel, 
  Search, 
  ExternalLink,
  ChevronLeft,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface NearestStationsPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[]; // Ordered from closest to farthest
  facilityType: CargasFacilityType | 'all';
  facilityTitle: string;
  userLocation: [number, number];
  onSelectStationOnMap: (station: Station) => void;
  onNavigateToGoogleMaps: (station: Station) => void;
  customAppLogoUrl?: string;
}

export const NearestStationsPickerModal: React.FC<NearestStationsPickerModalProps> = ({
  isOpen,
  onClose,
  stations,
  facilityType,
  facilityTitle,
  userLocation,
  onSelectStationOnMap,
  onNavigateToGoogleMaps,
  customAppLogoUrl
}) => {
  if (!isOpen) return null;

  // We show up to the closest 3 stations
  const topStations = stations.slice(0, 3);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return {
        label: 'الأقرب لموقعك (الخيار الأول 🥇)',
        badgeClass: 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300',
        cardBorder: 'border-2 border-emerald-500 shadow-xl shadow-emerald-950/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40',
        starIcon: '⭐ الأقرب'
      };
    }
    if (index === 1) {
      return {
        label: 'الخيار الثاني 🥈',
        badgeClass: 'bg-teal-700 text-teal-100 border-teal-500',
        cardBorder: 'border border-slate-700 hover:border-emerald-500/60 bg-slate-900/90',
        starIcon: 'خيار بديل'
      };
    }
    return {
      label: 'الخيار الثالث 🥉',
      badgeClass: 'bg-slate-700 text-slate-200 border-slate-600',
      cardBorder: 'border border-slate-800 hover:border-slate-700 bg-slate-900/80',
      starIcon: 'خيار بديل'
    };
  };

  const getFacilityIcon = (type: CargasFacilityType | 'all') => {
    switch (type) {
      case 'conversion_center':
        return <Wrench className="w-5 h-5 text-amber-400" />;
      case 'oil_center':
        return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'cylinder_testing':
        return <Search className="w-5 h-5 text-purple-400" />;
      default:
        return <Fuel className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/70 rounded-3xl shadow-2xl text-white max-h-[92vh] flex flex-col overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center shadow-inner shrink-0">
              {getFacilityIcon(facilityType)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] md:text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  رادار كارجاس — إحداثيات GPS حية 🛰️
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  مرتبة من الأقرب للأبعد
                </span>
              </div>
              <h3 className="font-black text-base md:text-lg text-white mt-1">
                أقرب 3 {facilityTitle} لموقعك الحالي 📍
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 px-4 py-2.5 border-b border-emerald-500/20 text-xs text-emerald-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>اختر المحطة أو المركز المناسب لك، وبالضغط عليها ستتوجه فوراً للملاحة عبر خرائط جوجل 🚗</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
            {topStations.length} نتائج
          </span>
        </div>

        {/* Stations List */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-3.5 flex-1">
          {topStations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
              <p className="text-sm font-bold">لم يتم العثور على مواقع مطابقة حالياً</p>
            </div>
          ) : (
            topStations.map((station, index) => {
              const rank = getRankBadge(index);
              const congestion = getCongestionBadge(station.congestionLevel, station.waitTimeMinutes);
              const logoToShow = station.customLogoUrl || customAppLogoUrl;

              return (
                <div
                  key={station.id}
                  className={`rounded-2xl p-4 transition duration-200 ${rank.cardBorder} flex flex-col gap-3 group`}
                >
                  {/* Top Bar of Station Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Station Logo */}
                      <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-emerald-500 shadow-md shrink-0 overflow-hidden flex items-center justify-center">
                        {logoToShow ? (
                          <img src={logoToShow} alt={station.name} className="w-full h-full object-contain" />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: CARGAS_LOGO_SVG }} className="w-full h-full" />
                        )}
                      </div>

                      {/* Station Title & Address */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rank.badgeClass}`}>
                            {rank.label}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            كارجاس معتمدة
                          </span>
                        </div>

                        <h4 className="font-black text-sm md:text-base text-white leading-tight">
                          {station.name}
                        </h4>

                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{station.address}</span>
                        </p>
                      </div>
                    </div>

                    {/* Distance Badge */}
                    <div className="text-left shrink-0">
                      <div className="font-black font-mono text-base md:text-lg text-emerald-400">
                        {station.distanceKm ? `${station.distanceKm.toFixed(1)} كم` : 'قريب جداً'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        <span>انتظار: {station.waitTimeMinutes} د</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges / Services */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 text-[10px]">
                    {station.cng && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                        ⛽ تموين غاز طبيعي
                      </span>
                    )}
                    {station.conversionCenter && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-lg font-bold">
                        🛠️ تحويل وصيانة
                      </span>
                    )}
                    {station.oilCenter && (
                      <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-lg font-bold">
                        🛢️ زيوت معتمدة (BP)
                      </span>
                    )}
                    {station.cylinderInspection && (
                      <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-lg font-bold">
                        🔍 فحص أسطوانات
                      </span>
                    )}
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg font-mono">
                      {station.cngNozzles} مسدسات غاز
                    </span>
                  </div>

                  {/* Actions: Direct Deep Linking to Google Maps or Waze (0 API cost) & Show on Leaflet Map */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToGoogleMaps(station);
                        }}
                        className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs md:text-sm rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 border border-emerald-400"
                        title="فتح المسار وبدء التوجيه في تطبيق Google Maps المثبت على هاتفك (Deep Linking مجاني)"
                      >
                        <Navigation className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                        <span>بدء التوجيه (Google Maps) 🚀</span>
                      </button>

                      <a
                        href={`https://waze.com/ul?ll=${station.lat},${station.lng}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onClose()}
                        className="py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black text-xs md:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 border border-cyan-400"
                        title="فتح المسار وبدء التوجيه في تطبيق Waze المثبت على هاتفك"
                      >
                        <span className="text-base">🚗</span>
                        <span>بدء التوجيه (تطبيق Waze)</span>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectStationOnMap(station);
                      }}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>عرض وتكبير الموقع على خريطة التطبيق (محرك Leaflet) 🗺️</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Technical Architecture Bar */}
        <div className="px-4 py-2 bg-slate-950/95 border-t border-slate-800 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-md font-bold">
              🗺️ محرك Leaflet.js (&lt;40KB)
            </span>
            <span className="bg-teal-950/80 text-teal-300 border border-teal-700/60 px-2 py-0.5 rounded-md font-bold">
              ⚡ قاعدة GeoJSON مدمجة (350+ محطة)
            </span>
            <span className="bg-blue-950/80 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded-md font-bold">
              🔗 Deep Linking مجاني 100%
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold transition text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
