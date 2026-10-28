import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { CargasStationLocation, AppConfig } from '../types';

interface InlineNearestStationMapProps {
  station: CargasStationLocation;
  allStations: CargasStationLocation[];
  userLocation: { lat: number; lng: number } | null;
  distanceKm: number | null;
  config: AppConfig;
  onNavigateToMapPage: () => void;
  onPlayVoiceGuidance?: () => void;
  onLocateUser?: () => void;
}

export const InlineNearestStationMap: React.FC<InlineNearestStationMapProps> = ({
  station,
  allStations,
  userLocation,
  distanceKm,
  config,
  onNavigateToMapPage,
  onPlayVoiceGuidance,
  onLocateUser,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);

  // External Google Maps directions URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

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
        center: [station.latitude, station.longitude],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Add zoom control to top-left to avoid covering RTL overlays
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // CartoDB Voyager or OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
      setIsMapReady(true);

      // Handle resize
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

  // Update markers and route when station or user location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Draw nearby Cargas stations with subtle markers
    allStations.forEach((st) => {
      if (st.id === station.id) return; // skip nearest, drawn with primary badge
      const otherIcon = L.divIcon({
        className: 'other-station-marker',
        html: `
          <div style="background-color: #0f766e; color: white; width: 28px; height: 28px; border-radius: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white; font-size: 13px; transform: rotate(-3deg);">
            ⛽
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: otherIcon });
      marker.bindTooltip(`<b>${st.name}</b><br/><span style="font-size:10px;">محطة كارجاس CNG</span>`, {
        direction: 'top',
        className: 'cargas-mini-tooltip',
      });
      group.addLayer(marker);
    });

    // 2. Draw Target / Nearest Cargas Station with grand pulsating badge
    const nearestIcon = L.divIcon({
      className: 'target-station-marker',
      html: `
        <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; width: 44px; height: 44px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.6); border: 3px solid white;">
            <span style="font-size: 18px; line-height: 1;">⛽</span>
            <span style="font-size: 8px; font-weight: 900; color: #fef08a; letter-spacing: -0.5px;">CARGAS</span>
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    const nearestMarker = L.marker([station.latitude, station.longitude], { icon: nearestIcon });
    nearestMarker.bindTooltip(
      `
      <div style="text-align: right; font-family: Cairo, sans-serif; padding: 4px;">
        <b style="color: #065f46; font-size: 13px;">${station.name}</b>
        <div style="font-size: 11px; color: #475569;">${station.address}</div>
        <div style="font-size: 10px; color: #059669; font-weight: bold; margin-top: 2px;">⚡ أقرب محطة كارجاس لك</div>
      </div>
    `,
      { permanent: false, direction: 'top', offset: [0, -20] }
    );
    group.addLayer(nearestMarker);

    // 3. User Location Marker + Navigation Path
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-car-marker',
        html: `
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(37, 99, 235, 0.8); border: 3px solid white; font-size: 18px;">
            🚗
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindTooltip('<b>موقعك الحالي</b><br/>تم تحديد مكانك بدقة GPS', { direction: 'top' });
      group.addLayer(userMarker);

      // Draw dashed guidance path between user and station
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }
      const polyline = L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [station.latitude, station.longitude],
        ],
        {
          color: '#059669',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
        }
      ).addTo(map);
      routePolylineRef.current = polyline;

      // Fit bounds to show both user and station nicely
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [station.latitude, station.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([station.latitude, station.longitude], 14);
    }
  }, [station, allStations, userLocation]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-emerald-500/40 relative overflow-hidden flex flex-col justify-between space-y-4 group">
      
      {/* Header: Nearest Station info & Badges */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
        
        <div className="flex items-start gap-3.5">
          {/* Cargas Logo Box */}
          <div
            onClick={onNavigateToMapPage}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-700 to-emerald-500 p-2 border-2 border-emerald-400/60 shadow-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition shrink-0 relative group/icon"
            title="اضغط لفتح خريطة الملاحة الحية الكاملة"
          >
            {config.wasalnyConfig?.cargasLogoBadgeUrl || config.stationLogoUrl ? (
              <img src={config.wasalnyConfig?.cargasLogoBadgeUrl || config.stationLogoUrl} alt="شعار كارجاس" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center">
                <span className="text-2xl block group-hover/icon:rotate-12 transition">⛽</span>
                <span className="text-[8px] font-black text-amber-300 font-mono tracking-tighter">CARGAS</span>
              </div>
            )}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-slate-900"></span>
            </span>
          </div>

          <div className="space-y-1 text-right">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>أقرب محطة كارجاس CNG • رادار حي</span>
              </span>

              {distanceKm !== null && (
                <span className="bg-teal-500/25 text-teal-200 border border-teal-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  على بُعد {distanceKm} كم 📍
                </span>
              )}

              {station.crowdLevel && (
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  الزحام: {station.crowdLevel} 🟢
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>{config.wasalnyConfig?.buttonLabel || 'أقرب محطة'}:</span>
              <span className="text-emerald-300">{station.name}</span>
            </h3>

            <p className="text-xs text-slate-300 font-light flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{station.address || 'مصر — شبكة محطات كارجاس CNG الوطنية'}</span>
              {station.city && <span className="text-slate-400">({station.city})</span>}
            </p>
          </div>
        </div>

        {/* Quick Voice & Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {config.wasalnyConfig?.voiceGuidance !== 'silent' && onPlayVoiceGuidance && (
            <button
              type="button"
              onClick={onPlayVoiceGuidance}
              className="flex items-center gap-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95"
              title="استمع لإرشاد وضاح الصوتي باللهجة المصرية"
            >
              <Volume2 className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">صوت وضاح 🗣️</span>
            </button>
          )}

          {onLocateUser && (
            <button
              type="button"
              onClick={onLocateUser}
              className="flex items-center gap-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/40 text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95"
              title="تحديد موقعي الآن عبر GPS"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">موقعي 📍</span>
            </button>
          )}
        </div>
      </div>

      {/* LIVE INTERACTIVE LEAFLET MAP CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-inner bg-slate-950 min-h-[300px] sm:min-h-[340px]">
        {/* The Leaflet Mount DOM Node */}
        <div ref={mapContainerRef} className="w-full h-[300px] sm:h-[340px] z-10" />

        {/* Map Top Floating Overlay Info */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none flex flex-col gap-1.5 items-end">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-lg text-[11px] font-black text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>خريطة كارجاس الحية التفاعلية</span>
          </div>
          {distanceKm !== null && (
            <div className="bg-emerald-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-400/40 text-[10px] font-bold text-emerald-200">
              الوقت المقدر: ~{Math.max(2, Math.round(distanceKm * 2))} دقيقة بالسيارة ⏱️
            </div>
          )}
        </div>

        {/* Map Bottom Interactive Controls */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md backdrop-blur-md"
              title="الانتقال للمسار في خرائط جوجل الخارجية"
            >
              <ExternalLink className="w-3 h-3 text-amber-300" />
              <span>Google Maps 🚗</span>
            </a>
          </div>

          <button
            onClick={onNavigateToMapPage}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-xl flex items-center gap-1.5 active:scale-95"
            title="تكبير الخريطة وفتح الملاحة والتوجيه خطوة بخطوة"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>تكبير الخريطة والملاحة "وصّلني" 🗺️</span>
          </button>
        </div>
      </div>

      {/* Services Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-emerald-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-white/10 px-2.5 py-1 rounded-xl">تموين غاز سريع ⚡</span>
          <span className="bg-white/10 px-2.5 py-1 rounded-xl">زيوت معتمدة 🛢️</span>
          <span className="bg-white/10 px-2.5 py-1 rounded-xl">فحص الأسطوانات 🛡️</span>
          <span className="bg-white/10 px-2.5 py-1 rounded-xl">خدمة 24/7 ⏱️</span>
        </div>

        <button
          onClick={onNavigateToMapPage}
          className="text-xs text-amber-300 hover:text-amber-200 font-bold underline underline-offset-4 flex items-center gap-1 transition"
        >
          <span>عرض شبكة كافة المحطات ({allStations.length})</span>
          <span>←</span>
        </button>
      </div>
    </div>
  );
};
