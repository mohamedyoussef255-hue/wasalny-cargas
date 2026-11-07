import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Compass,
  Volume2,
  Maximize2,
  ExternalLink,
  Car,
  Clock,
  Sparkles,
  Layers,
  Phone,
  Fuel,
  ShieldCheck,
  RotateCcw,
  Check,
  X,
  ChevronLeft,
} from 'lucide-react';
import { CargasStationLocation, AppConfig, MapFacilityFilterItem } from '../types';
import {
  getWasalnyFullConfig,
  getMasterStationMapLogo,
  MASTER_MAP_LOGO_EVENT,
  getMapFacilityFilters,
  buildAccurateNavigationUrl,
  getStoredUserLocation,
  calculateDistanceKm,
  isStationMatchingFacilityFilter,
  getStationLocations,
} from '../services/storageService';

interface InlineNearestStationMapProps {
  station: CargasStationLocation;
  allStations?: CargasStationLocation[];
  userLocation?: { lat: number; lng: number } | null;
  distanceKm?: number | null;
  config: AppConfig;
  carPlate?: string;
  onNavigateToMapPage?: () => void;
  onPlayVoiceGuidance?: (st?: CargasStationLocation) => void;
  onLocateUser?: () => void;
  onFilterFacility?: (facilityKey: string) => void;
}

// Preset vibrant gradient styles for each facility key (مطابق تماماً لنمط الكبسولات المتدرجة)
const FACILITY_GRADIENTS: Record<string, { gradient: string; activeRing: string; iconGlow: string }> = {
  cng_fueling: {
    gradient: 'from-emerald-600 via-teal-700 to-emerald-950',
    activeRing: 'ring-2 ring-emerald-400 shadow-emerald-500/40',
    iconGlow: 'text-emerald-300',
  },
  oil_centers: {
    gradient: 'from-amber-600 via-yellow-600 to-stone-900',
    activeRing: 'ring-2 ring-amber-400 shadow-amber-500/40',
    iconGlow: 'text-amber-200',
  },
  canopy_oil: {
    gradient: 'from-orange-600 via-amber-600 to-slate-900',
    activeRing: 'ring-2 ring-orange-400 shadow-orange-500/40',
    iconGlow: 'text-orange-200',
  },
  conversion_and_maint: {
    gradient: 'from-blue-700 via-indigo-700 to-slate-950',
    activeRing: 'ring-2 ring-blue-400 shadow-blue-500/40',
    iconGlow: 'text-cyan-200',
  },
  cylinder_testing: {
    gradient: 'from-rose-600 via-pink-700 to-slate-950',
    activeRing: 'ring-2 ring-rose-400 shadow-rose-500/40',
    iconGlow: 'text-rose-200',
  },
  coming_soon_2027: {
    gradient: 'from-purple-600 via-indigo-800 to-slate-950',
    activeRing: 'ring-2 ring-purple-400 shadow-purple-500/40',
    iconGlow: 'text-purple-200',
  },
  cng_and_oil: {
    gradient: 'from-emerald-600 via-teal-700 to-slate-900',
    activeRing: 'ring-2 ring-emerald-400 shadow-emerald-500/40',
    iconGlow: 'text-emerald-200',
  },
};

export const InlineNearestStationMap: React.FC<InlineNearestStationMapProps> = ({
  station,
  allStations = [],
  userLocation,
  distanceKm,
  config,
  carPlate,
  onNavigateToMapPage,
  onLocateUser,
  onFilterFacility,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);

  // Dynamic Facilities state (separated CNG vs Oil Centers)
  const [facilityFilters, setFacilityFilters] = useState<MapFacilityFilterItem[]>(() => getMapFacilityFilters());
  const [activeFacilityKey, setActiveFacilityKey] = useState<string | null>(null);

  // Stations synced state (real-time updates from Admin Portal & Storage)
  const [currentStations, setCurrentStations] = useState<CargasStationLocation[]>(() => {
    if (allStations && allStations.length > 0) return allStations;
    return getStationLocations();
  });

  useEffect(() => {
    if (allStations && allStations.length > 0) {
      setCurrentStations(allStations);
    }
  }, [allStations]);

  // Listen for admin changes to stations & facility filters in real time
  useEffect(() => {
    const handleFiltersUpdate = () => {
      setFacilityFilters(getMapFacilityFilters());
    };
    const handleStationsUpdate = () => {
      setCurrentStations(getStationLocations());
    };

    window.addEventListener('cargas_facility_filters_updated', handleFiltersUpdate);
    window.addEventListener('cargas_stations_updated', handleStationsUpdate);
    window.addEventListener('storage', handleFiltersUpdate);
    window.addEventListener('storage', handleStationsUpdate);

    return () => {
      window.removeEventListener('cargas_facility_filters_updated', handleFiltersUpdate);
      window.removeEventListener('cargas_stations_updated', handleStationsUpdate);
      window.removeEventListener('storage', handleFiltersUpdate);
      window.removeEventListener('storage', handleStationsUpdate);
    };
  }, []);

  // Retrieve effective car plate number from props or local storage
  const effectivePlate = useMemo(() => {
    if (carPlate && carPlate.trim().length > 0) return carPlate.trim();
    try {
      const raw = localStorage.getItem('cargas_driver_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.carPlate) return parsed.carPlate.trim();
      }
    } catch {
      // fallback
    }
    return 'مصر | EGY';
  }, [carPlate]);

  // Guaranteed Accurate GPS Origin: uses real userLocation or stored Egypt location
  const effectiveOrigin = useMemo(() => {
    if (userLocation && typeof userLocation.lat === 'number' && userLocation.lat !== 0) {
      return userLocation;
    }
    return getStoredUserLocation();
  }, [userLocation]);

  // 1. FILTERED STATIONS: When user clicks "مراكز الزيوت", strictly only stations with oil centers appear!
  const filteredStations = useMemo(() => {
    if (!activeFacilityKey || activeFacilityKey === 'all') {
      return currentStations;
    }
    return currentStations.filter((st) => isStationMatchingFacilityFilter(st, activeFacilityKey));
  }, [currentStations, activeFacilityKey]);

  // 2. ACTIVE FILTER INFO: Current filter metadata
  const activeFilterInfo = useMemo(() => {
    if (!activeFacilityKey) return null;
    return facilityFilters.find((f) => f.key === activeFacilityKey) || null;
  }, [facilityFilters, activeFacilityKey]);

  // 3. TARGET / NEAREST MATCHING STATION:
  // If active station matches filter, keep it. Otherwise calculate closest matching station to user's GPS!
  const effectiveTargetStation = useMemo(() => {
    if (filteredStations.length === 0) return station;

    // Check if current target station matches
    const isTargetMatching = isStationMatchingFacilityFilter(station, activeFacilityKey);
    if (isTargetMatching) return station;

    // Pick closest station in filtered list
    let closest = filteredStations[0];
    let minD = calculateDistanceKm(
      effectiveOrigin.lat,
      effectiveOrigin.lng,
      closest.latitude,
      closest.longitude
    );

    for (let i = 1; i < filteredStations.length; i++) {
      const d = calculateDistanceKm(
        effectiveOrigin.lat,
        effectiveOrigin.lng,
        filteredStations[i].latitude,
        filteredStations[i].longitude
      );
      if (d < minD) {
        minD = d;
        closest = filteredStations[i];
      }
    }
    return closest;
  }, [filteredStations, station, activeFacilityKey, effectiveOrigin]);

  // 4. Effective Distance
  const effectiveDistanceKm = useMemo(() => {
    if (!activeFacilityKey && distanceKm !== null && distanceKm !== undefined) {
      return distanceKm;
    }
    return Number(
      calculateDistanceKm(
        effectiveOrigin.lat,
        effectiveOrigin.lng,
        effectiveTargetStation.latitude,
        effectiveTargetStation.longitude
      ).toFixed(1)
    );
  }, [effectiveOrigin, effectiveTargetStation, activeFacilityKey, distanceKm]);

  // 5. Accurate URLs for navigation pointing directly to effectiveTargetStation
  const googleMapsUrl = buildAccurateNavigationUrl(
    effectiveOrigin,
    { lat: effectiveTargetStation.latitude, lng: effectiveTargetStation.longitude },
    'google_maps'
  );
  const wazeUrl = buildAccurateNavigationUrl(
    effectiveOrigin,
    { lat: effectiveTargetStation.latitude, lng: effectiveTargetStation.longitude },
    'waze'
  );

  // Listen for real-time master logo changes across the entire app
  useEffect(() => {
    const handleLogoUpdate = () => {
      setLogoRefreshKey((k) => k + 1);
    };
    window.addEventListener(MASTER_MAP_LOGO_EVENT, handleLogoUpdate);
    window.addEventListener('storage', handleLogoUpdate);
    return () => {
      window.removeEventListener(MASTER_MAP_LOGO_EVENT, handleLogoUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
    };
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const container = mapContainerRef.current as any;
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    try {
      const map = L.map(container, {
        center: [effectiveTargetStation.latitude, effectiveTargetStation.longitude],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topleft' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
      setIsMapReady(true);

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }, 250);
    } catch (err) {
      console.error('Failed to init inline map:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }
    };
  }, []);

  // Update markers, route, and fit bounds when filtered stations, target station, or GPS change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const wasalnyCfg = getWasalnyFullConfig();
    const glowColor = wasalnyCfg.stationMarkerGlowColor || '#059669';

    // 1. Draw all matching stations with custom logo markers
    filteredStations.forEach((st) => {
      if (st.id === effectiveTargetStation.id) return;
      const stLogo = getMasterStationMapLogo(st.id, st.customLogoUrl);

      const otherIcon = L.divIcon({
        className: 'other-station-marker',
        html: `
          <div style="background-color: white; border: 2px solid ${glowColor}; width: 34px; height: 34px; border-radius: 11px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); overflow: hidden; transform: rotate(-1deg); padding: 2px;">
            <img src="${stLogo}" alt="${st.name}" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: otherIcon });
      const actsText = (st.activities || ['تموين']).join(' • ');
      marker.bindTooltip(
        `<div style="text-align: right; font-family: Cairo, sans-serif; padding: 2px;">
          <b>${st.name}</b><br/>
          <span style="font-size:10px; color: #059669;">${actsText}</span><br/>
          <span style="font-size:9.5px; color: #64748b;">${st.address}</span>
        </div>`,
        { direction: 'top', className: 'cargas-mini-tooltip' }
      );
      group.addLayer(marker);
    });

    // 2. Draw Target / Nearest Station with grand pulsating badge
    const effectiveTargetLogo = getMasterStationMapLogo(effectiveTargetStation.id, effectiveTargetStation.customLogoUrl);

    const logoInner = effectiveTargetLogo
      ? `<img src="${effectiveTargetLogo}" alt="${effectiveTargetStation.name}" style="width: 28px; height: 28px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" /><span style="font-size: 7.5px; font-weight: 900; color: #fef08a; letter-spacing: -0.3px; line-height: 1;">CARGAS</span>`
      : `<span style="font-size: 18px; line-height: 1;">⛽</span><span style="font-size: 8px; font-weight: 900; color: #fef08a; letter-spacing: -0.5px;">CARGAS</span>`;

    const nearestIcon = L.divIcon({
      className: 'target-station-marker',
      html: `
        <div style="position: relative; width: 54px; height: 54px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: ${glowColor}66; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; background: linear-gradient(135deg, ${glowColor} 0%, #064e3b 100%); color: white; width: 50px; height: 50px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.45); border: 3px solid white; gap: 2px;">
            ${logoInner}
          </div>
        </div>
      `,
      iconSize: [54, 54],
      iconAnchor: [27, 27],
    });

    const nearestMarker = L.marker([effectiveTargetStation.latitude, effectiveTargetStation.longitude], {
      icon: nearestIcon,
    });
    nearestMarker.bindTooltip(
      `
      <div style="text-align: right; font-family: Cairo, sans-serif; padding: 4px;">
        <b style="color: #065f46; font-size: 13px;">${effectiveTargetStation.name}</b>
        <div style="font-size: 11px; color: #475569;">${effectiveTargetStation.address}</div>
        <div style="font-size: 10px; color: #059669; font-weight: bold; margin-top: 2px;">
          ⚡ ${activeFilterInfo ? `الأقرب لخدمة: ${activeFilterInfo.label}` : 'كارجاس أقرب لك'}
        </div>
      </div>
    `,
      { permanent: false, direction: 'top', offset: [0, -20] }
    );
    group.addLayer(nearestMarker);

    // 3. User Location Marker with Egyptian License Plate Badge
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-car-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.45));">
            <div style="background: white; border: 2px solid #1e3a8a; border-radius: 7px; overflow: hidden; display: flex; flex-direction: column; min-width: 76px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
              <div style="background: #2563eb; color: white; font-size: 7.5px; font-weight: 900; padding: 1px 4px; display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px;">
                <span>EGY</span>
                <span style="font-size: 8px;">مِصْر</span>
              </div>
              <div style="color: #0f172a; font-weight: 900; font-size: 10.5px; padding: 1.5px 5px; font-family: Cairo, monospace; letter-spacing: 1px; white-space: nowrap;">
                ${effectivePlate}
              </div>
            </div>
            <div style="background: #2563eb; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: -3px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size: 11px;">
              🚗
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #2563eb; margin-top: -1px;"></div>
          </div>
        `,
        iconSize: [80, 56],
        iconAnchor: [40, 56],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindTooltip(
        `<div style="text-align: right; font-family: Cairo, sans-serif;"><b>موقع سيارتك الحالي</b><br/><span style="font-size: 10px; color: #2563eb;">${effectivePlate}</span></div>`,
        { direction: 'top' }
      );
      group.addLayer(userMarker);

      // 4. Smooth Polyline connecting user to effective target station
      const pathCoordinates: [number, number][] = [
        [userLocation.lat, userLocation.lng],
        [effectiveTargetStation.latitude, effectiveTargetStation.longitude],
      ];

      if (routePolylineRef.current) {
        try {
          routePolylineRef.current.remove();
        } catch {
          // ignore
        }
      }

      const polyline = L.polyline(pathCoordinates, {
        color: '#059669',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(group);

      routePolylineRef.current = polyline;
    }

    // 5. Fit bounds to display the matching stations and target
    try {
      const bounds = L.latLngBounds([
        [effectiveTargetStation.latitude, effectiveTargetStation.longitude],
      ]);
      filteredStations.forEach((st) => bounds.extend([st.latitude, st.longitude]));
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    } catch {
      map.setView([effectiveTargetStation.latitude, effectiveTargetStation.longitude], 13);
    }
  }, [
    filteredStations,
    effectiveTargetStation,
    userLocation,
    effectivePlate,
    logoRefreshKey,
    activeFacilityKey,
    activeFilterInfo,
  ]);

  // Handle click on a facility filter
  const handleFacilityClick = (facKey: string) => {
    const nextKey = activeFacilityKey === facKey ? null : facKey;
    setActiveFacilityKey(nextKey);
    if (onFilterFacility) {
      onFilterFacility(nextKey || '');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-emerald-950/70 to-slate-900 rounded-3xl p-3.5 sm:p-5 text-white border-2 border-emerald-500/40 shadow-xl space-y-3 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER BAR: Closest Station Target & Navigation */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10">
        {/* Left: Station Identity & Live Distance */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-emerald-950 flex items-center justify-center text-xl shadow-lg font-black shrink-0">
            {activeFilterInfo ? activeFilterInfo.iconText : '⛽'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {activeFilterInfo ? `أقرب مركز: ${activeFilterInfo.label} 🎯` : 'أقرب محطة لموقعك الحالي 🎯'}
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/30 px-2 py-0.5 rounded-md">
                كود: {effectiveTargetStation.code}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
              {effectiveTargetStation.name}
            </h3>
            <p className="text-xs text-slate-300 font-light line-clamp-1">{effectiveTargetStation.address}</p>
          </div>
        </div>

        {/* Right: Distance Badge & Navigation Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
          <div className="bg-black/40 border border-emerald-400/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span className="text-xs font-black text-emerald-300 font-mono">
              {effectiveDistanceKm} كم
            </span>
          </div>

          {/* Primary "وصّلني" Capsule Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm py-2.5 px-5 rounded-full transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 group cursor-pointer border border-emerald-300/40"
            title="بدء الملاحة الحية المباشرة في خرائط جوجل"
          >
            <Navigation className="w-4 h-4 text-slate-950 group-hover:rotate-45 transition transform" />
            <span>🚗 وصّلني (Google Maps)</span>
          </a>

          {/* Waze Link Capsule */}
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-700 via-cyan-700 to-slate-900 hover:from-blue-600 hover:to-cyan-600 border border-cyan-400/30 text-white rounded-full px-3.5 py-2 text-xs font-black transition active:scale-95 flex items-center gap-1 shadow-md"
            title="فتح المسار في تطبيق Waze"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Waze</span>
          </a>

          {/* Recenter GPS Capsule */}
          <button
            type="button"
            onClick={onLocateUser}
            className="bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 hover:from-indigo-600 hover:to-purple-600 border border-purple-400/30 text-white rounded-full px-3.5 py-2 text-xs font-black transition active:scale-95 flex items-center gap-1 shadow-md"
            title="تحديث وإعادة رصد موقعي GPS"
          >
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">GPS 📍</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6 SEPARATED FACILITY BUTTONS DIRECTLY ABOVE THE MAP */}
      {/* 1. تموين غاز | 2. مراكز الزيوت | 3. زيوت أسفل المظلة | 4. تحويل وصيانة | 5. فحص أسطوانات | 6. قريباً 2027 */}
      {/* ======================================================== */}
      <div className="relative z-10 space-y-2 bg-slate-900/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-emerald-500/30">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
            <span>🏷️</span>
            <span>أنشطة وخدمات محطات كارجاس (فلترة وتوجيه مباشر على الخريطة):</span>
          </span>
          <span className="text-[10px] text-slate-300 font-medium">
            {activeFacilityKey ? '⚡ فلتر نشط (اضغط للإلغاء)' : 'اضغط على أي نشاط لعرض مواقعه فقط'}
          </span>
        </div>

        {/* The 6 Separated Facility Buttons in responsive grid that never hides any icon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {facilityFilters.map((fac) => {
            const isSelected = activeFacilityKey === fac.key;
            // Calculate count of matching stations for each filter
            const count = currentStations.filter((s) => isStationMatchingFacilityFilter(s, fac.key)).length;

            return (
              <button
                key={fac.id}
                type="button"
                onClick={() => handleFacilityClick(fac.key)}
                className={`py-2 px-2.5 rounded-xl text-right transition-all duration-150 active:scale-95 shadow-sm flex items-center justify-between gap-1.5 border cursor-pointer select-none ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-300 shadow-md shadow-emerald-900/50 ring-2 ring-emerald-400'
                    : 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-emerald-500/60'
                }`}
                title={`${fac.label} (${count} موقع متوفر)`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">
                    {fac.iconText}
                  </span>
                  <span className="font-bold text-[11px] sm:text-xs truncate">
                    {fac.label}
                  </span>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="w-4 h-4 rounded-full bg-white text-emerald-800 flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-emerald-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700/80">
                      {count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE FILTER NOTIFICATION PILL (تنبيه الفلترة المباشرة) */}
      {activeFilterInfo && (
        <div className={`relative z-10 flex items-center justify-between gap-3 p-2.5 px-4 rounded-2xl sm:rounded-full border shadow-md text-xs animate-in slide-in-from-top duration-200 ${
          filteredStations.length > 0
            ? 'bg-gradient-to-r from-emerald-900/90 via-slate-900/90 to-teal-900/90 border-emerald-400/40 text-white'
            : 'bg-amber-950/90 border-amber-500/50 text-amber-200'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{activeFilterInfo.iconText}</span>
            <span className="font-black">
              فلترة: <span className="text-amber-300 font-bold">{activeFilterInfo.label}</span>
            </span>
            {filteredStations.length > 0 ? (
              <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                عُثر على {filteredStations.length} موقع متاح على الخريطة
              </span>
            ) : (
              <span className="bg-rose-500/20 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-400/30">
                لا توجد محطات مسجلة لهذا النشاط حالياً (يمكن تفعيله بنقرة واحدة من لوحة المدير)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleFacilityClick(activeFilterInfo.key)}
            className="bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1 transition border border-white/20 active:scale-95 shrink-0"
            title="إلغاء الفلتر واستعادة كل المحطات"
          >
            <X className="w-3.5 h-3.5" />
            <span>عرض كل المحطات</span>
          </button>
        </div>
      )}

      {/* LIVE INTERACTIVE LEAFLET MAP CONTAINER */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-500/40 shadow-2xl bg-slate-950 min-h-[290px] sm:min-h-[330px]">
        {/* Leaflet Mount Container */}
        <div ref={mapContainerRef} className="w-full h-[290px] sm:h-[330px] z-10" />

        {/* Map Top Floating Overlay Info */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none flex flex-col gap-1 items-end">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40 text-[10px] font-black text-white flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {activeFilterInfo ? `خريطة: ${activeFilterInfo.label} (${filteredStations.length})` : 'خريطة كارجاس الحية 🎯'}
            </span>
          </div>
          <div className="bg-emerald-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-400/40 text-[9.5px] font-bold text-emerald-200 shadow-md">
            لوحة سيارتك: {effectivePlate}
          </div>
        </div>

        {/* Map Bottom Compact Navigation Action */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-auto">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900/95 hover:bg-emerald-700 text-white border border-emerald-400/50 text-xs font-black px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow-lg backdrop-blur-md active:scale-95"
            title="الانتقال للمسار في خرائط جوجل بدقة إحداثيات تامة"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-300" />
            <span>🚗 وصّلني الآن</span>
          </a>

          {onNavigateToMapPage && (
            <button
              onClick={onNavigateToMapPage}
              className="bg-white/95 hover:bg-white text-slate-950 font-black text-xs px-4 py-2 rounded-full transition shadow-lg flex items-center gap-1.5 active:scale-95 border border-slate-300"
              title="تكبير الخريطة وفتح دليل كارجاس الكامل بالمحافظات"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>تكبير الخريطة 🗺️</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK MATCHING STATIONS CAROUSEL (شريط المحطات المطابقة للفلتر) */}
      {activeFilterInfo && filteredStations.length > 1 && (
        <div className="relative z-10 pt-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold px-1">
            <span>المحطات والمراكز المتوفرة لـ ({activeFilterInfo.label}):</span>
            <span className="text-[10px] text-emerald-300 font-mono">مرتبة حسب الأقرب لموقعك</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filteredStations.map((st) => {
              const dKm = Number(
                calculateDistanceKm(effectiveOrigin.lat, effectiveOrigin.lng, st.latitude, st.longitude).toFixed(1)
              );
              const isSelected = st.id === effectiveTargetStation.id;
              const directNav = buildAccurateNavigationUrl(effectiveOrigin, { lat: st.latitude, lng: st.longitude });

              return (
                <div
                  key={st.id}
                  className={`min-w-[210px] sm:min-w-[240px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-800/80 to-teal-900/80 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-xs truncate">{st.name}</span>
                    <span className="font-mono text-[10px] font-bold text-amber-300 shrink-0 bg-black/40 px-1.5 py-0.5 rounded-md">
                      {dKm} كم
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 line-clamp-1">{st.address}</p>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <a
                      href={directNav}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10.5px] py-1.5 px-2.5 rounded-full flex items-center justify-center gap-1 transition shadow-xs"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>وصّلني</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

