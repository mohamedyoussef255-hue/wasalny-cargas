import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Fuel,
  Wrench,
  Droplet,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Compass,
  Sparkles,
  Maximize2,
  Layers,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  Car,
} from 'lucide-react';
import { CargasStationLocation, StationFacilityType, AppConfig } from '../types';
import {
  calculateDistanceKm,
  getWasalnyFullConfig,
  getMasterStationMapLogo,
  MASTER_MAP_LOGO_EVENT,
} from '../services/storageService';
import {
  playNavigationVoice,
  generateVoiceGuidanceSpeech,
  stopNavigationVoice,
  NAVIGATION_VOICES,
  NavigationVoiceId,
} from '../services/voiceNavigationService';

// Helper to detect Egyptian Governorate for a station
export function detectGovernorate(name: string = '', address: string = '', city: string = ''): string {
  const text = `${city} ${name} ${address}`.toLowerCase();
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
  return 'القاهرة';
}

interface CargasStationsMapProps {
  config: AppConfig;
  stations: CargasStationLocation[];
  onSelectStation?: (station: CargasStationLocation) => void;
  onBack?: () => void;
  isStandalone?: boolean;
}

export const CargasStationsMap: React.FC<CargasStationsMapProps> = ({
  config,
  stations,
  onSelectStation,
  onBack,
  isStandalone = false,
}) => {
  const [selectedType, setSelectedType] = useState<StationFacilityType | 'all'>('all');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [isGroupedView, setIsGroupedView] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [nearestStation, setNearestStation] = useState<CargasStationLocation | null>(null);
  const [selectedStation, setSelectedStation] = useState<CargasStationLocation | null>(stations[0] || null);
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);

  // Retrieve customer car plate number for map pin
  const effectivePlate = useMemo(() => {
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
  }, []);

  // Listen for permanent master station logo changes across the whole app
  useEffect(() => {
    const handleLogoUpdate = () => {
      iconCacheRef.current = {};
      setLogoRefreshKey((k) => k + 1);
    };
    window.addEventListener(MASTER_MAP_LOGO_EVENT, handleLogoUpdate);
    window.addEventListener('storage', handleLogoUpdate);
    return () => {
      window.removeEventListener(MASTER_MAP_LOGO_EVENT, handleLogoUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
    };
  }, []);

  // Voice Search State
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string>('');
  const [isSpeakingAnswer, setIsSpeakingAnswer] = useState(false);
  // Active Navigation Voice (شاكر المصري / حامد العربي / وضاح)
  const [activeVoiceId, setActiveVoiceId] = useState<NavigationVoiceId>(
    (config.wasalnyConfig?.voiceGuidance as NavigationVoiceId) || 'shakir_egyptian'
  );

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const iconCacheRef = useRef<Record<string, L.DivIcon>>({});

  // Trigger GPS Geolocation
  const locateUser = () => {
    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(userCoords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 13);
          
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
            userMarkerRef.current = null;
          }

          const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.45));">
                <!-- Egyptian License Plate Badge -->
                <div style="background: white; border: 2px solid #1e3a8a; border-radius: 7px; overflow: hidden; display: flex; flex-direction: column; min-width: 76px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
                  <div style="background: #2563eb; color: white; font-size: 7.5px; font-weight: 900; padding: 1px 4px; display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px;">
                    <span>EGY</span>
                    <span style="font-size: 8px;">مِصْر</span>
                  </div>
                  <div style="padding: 2px 5px; font-weight: 900; font-size: 10.5px; color: #0f172a; direction: ltr; letter-spacing: 0.5px; background: #f8fafc; font-family: monospace, Cairo, sans-serif;">
                    ${effectivePlate}
                  </div>
                </div>

                <!-- Car Circle with Glowing Pulse -->
                <div style="margin-top: 2px; position: relative;">
                  <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(37,99,235,0.4); animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
                  <div style="position: relative; background: linear-gradient(135deg, #1e40af, #2563eb); color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(30,64,175,0.5); border: 2.5px solid white; font-size: 16px;">
                    🚗
                  </div>
                </div>

                <!-- Pointer Arrow -->
                <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #1e40af; margin-top: -1px;"></div>
              </div>
            `,
            iconSize: [86, 76],
            iconAnchor: [43, 76],
          });
          const marker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>موقع سيارتك الحالي 🚗</b><br>لوحة: <b>${effectivePlate}</b><br>تم تحديد موقعك بدقة GPS`)
            .openPopup();
          userMarkerRef.current = marker;
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation failed, falling back to Cairo center:', err);
        const defaultUser = { lat: 30.0444, lng: 31.2357 };
        setUserLocation(defaultUser);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Calculate distance and governorate with useMemo
  const processedStations = useMemo(() => {
    return stations.map((st) => {
      let distance = st.distanceFromUserKm;
      if (userLocation) {
        distance = calculateDistanceKm(userLocation.lat, userLocation.lng, st.latitude, st.longitude);
      }
      const gov = detectGovernorate(st.name, st.address, st.city);
      return { ...st, distanceFromUserKm: distance, governorate: gov };
    });
  }, [stations, userLocation]);

  const sortedStations = useMemo(() => {
    return [...processedStations].sort((a, b) => {
      if (a.distanceFromUserKm !== undefined && b.distanceFromUserKm !== undefined) {
        return a.distanceFromUserKm - b.distanceFromUserKm;
      }
      return 0;
    });
  }, [processedStations]);

  // List of all unique governorates with station counts
  const governoratesList = useMemo(() => {
    const counts: Record<string, number> = {};
    processedStations.forEach((st) => {
      const g = st.governorate || 'القاهرة';
      counts[g] = (counts[g] || 0) + 1;
    });

    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));

    const priority = ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'السويس', 'بورسعيد', 'الإسماعيلية', 'الغربية', 'الدقهلية', 'الشرقية', 'البحيرة', 'المنوفية'];
    return list.sort((a, b) => {
      const idxA = priority.indexOf(a.name);
      const idxB = priority.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.count - a.count;
    });
  }, [processedStations]);

  useEffect(() => {
    if (userLocation && sortedStations.length > 0) {
      setNearestStation(sortedStations[0]);
      if (!selectedStation) {
        setSelectedStation(sortedStations[0]);
      }
    }
  }, [userLocation, sortedStations]);

  const filteredStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortedStations.filter((st) => {
      const matchesGov = selectedGovernorate === 'all' || st.governorate === selectedGovernorate;
      if (!matchesGov) return false;

      const matchesType =
        selectedType === 'all' ||
        st.facilityType === selectedType ||
        (st.activities &&
          st.activities.some((act) => {
            if (selectedType === 'cng_station' && act === 'تموين') return true;
            if (selectedType === 'conversion_center' && (act === 'تحويل' || act === 'صيانة')) return true;
            if (selectedType === 'oil_center' && act === 'زيوت') return true;
            if (selectedType === 'canopy_oil' && (act === 'زيوت أسفل المظلة' || (act === 'زيوت' && st.facilityType === 'canopy_oil'))) return true;
            if (selectedType === 'cylinder_inspection' && act === 'فحص اسطوانات') return true;
            return false;
          }));

      if (!matchesType) return false;
      if (!query) return true;

      return (
        st.name.toLowerCase().includes(query) ||
        st.city.toLowerCase().includes(query) ||
        st.address.toLowerCase().includes(query) ||
        st.code.toLowerCase().includes(query) ||
        (st.governorate && st.governorate.toLowerCase().includes(query)) ||
        (st.activities && st.activities.some((act) => act.toLowerCase().includes(query)))
      );
    });
  }, [sortedStations, selectedType, selectedGovernorate, searchQuery]);

  // Group stations by governorate
  const stationsByGovernorate = useMemo(() => {
    const groups: Record<string, typeof filteredStations> = {};
    filteredStations.forEach((st) => {
      const g = st.governorate || 'القاهرة';
      if (!groups[g]) {
        groups[g] = [];
      }
      groups[g].push(st);
    });
    return groups;
  }, [filteredStations]);

  // Center on selected station
  const focusStationOnMap = (st: CargasStationLocation) => {
    setSelectedStation(st);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([st.latitude, st.longitude], 14, {
        animate: true,
      });
      const marker = markersRef.current[st.id];
      if (marker) {
        marker.openPopup();
      }
    }
    if (onSelectStation) onSelectStation(st);
  };

  // Egyptian & Arabic Human Voice Guidance (شاكر المصري / حامد العربي / وضاح)
  const speakWadahVoice = (text: string) => {
    if (activeVoiceId === 'silent') return;
    playNavigationVoice(text, activeVoiceId, {
      onStart: () => setIsSpeakingAnswer(true),
      onEnd: () => setIsSpeakingAnswer(false),
      onError: () => setIsSpeakingAnswer(false),
    });
  };

  const handlePlayWadahGuidance = (st?: CargasStationLocation | null) => {
    if (isSpeakingAnswer) {
      stopNavigationVoice();
      setIsSpeakingAnswer(false);
      return;
    }
    const target = st || nearestStation || selectedStation || sortedStations[0];
    if (!target) return;
    const speech = generateVoiceGuidanceSpeech(target, activeVoiceId);
    setVoiceNotice(speech);
    speakWadahVoice(speech);
  };

  // Voice speech feedback
  const speakText = (text: string) => {
    speakWadahVoice(text);
  };

  // Voice Search / Voice Command with Strict Competitor Exclusion Guard
  const handleVoiceCommand = (command: string) => {
    const q = command.toLowerCase().trim();
    setSearchQuery('');

    // Competitor check (Exclude non-Cargas stations)
    const competitors = ['طاقة', 'غازتك', 'taqa', 'gastec', 'شل', 'shell', 'توتال', 'total', 'موبيل', 'mobil', 'وطنية', 'wataniya', 'chillout', 'تشيل اوت', 'امارات مصر', 'امارات'];
    const matchedCompetitor = competitors.find((c) => q.includes(c));

    if (matchedCompetitor) {
      const msg = 'عفواً يا فندم، تطبيق كارجاس مخصص حصرياً لشبكة محطات ومراكز كارجاس المعتمدة فقط. تم توجيهك لأقرب محطة كارجاس تخدمك بأعلى جودة وضغط غاز!';
      setVoiceNotice(msg);
      speakWadahVoice(msg);

      // Still route user to nearest Cargas station
      if (sortedStations.length > 0) {
        focusStationOnMap(sortedStations[0]);
      }
      return;
    }

    // Identify target facility category
    let targetType: StationFacilityType | 'all' = 'all';
    if (q.includes('تحويل') || q.includes('مركز تحويل')) {
      targetType = 'conversion_center';
    } else if (q.includes('زيت') || q.includes('زيوت') || q.includes('تغيير زيت')) {
      targetType = 'oil_center';
    } else if (q.includes('مظلة') || q.includes('سريع')) {
      targetType = 'canopy_oil';
    } else if (q.includes('فحص') || q.includes('اسطوان') || q.includes('أسطوان')) {
      targetType = 'cylinder_inspection';
    } else if (q.includes('محطة') || q.includes('غاز') || q.includes('تموين')) {
      targetType = 'cng_station';
    }

    setSelectedType(targetType);

    // Filter relevant stations
    const targetPool = sortedStations.filter(
      (s) => targetType === 'all' || s.facilityType === targetType
    );

    // Also check if user specified a city or neighborhood
    const matchingCity = targetPool.find(
      (s) => q.includes(s.city.toLowerCase()) || q.includes(s.name.toLowerCase()) || q.includes(s.address.toLowerCase())
    );

    const bestMatch = matchingCity || targetPool[0] || sortedStations[0];

    if (bestMatch) {
      focusStationOnMap(bestMatch);
      const distanceText = bestMatch.distanceFromUserKm !== undefined ? `على بُعد ${bestMatch.distanceFromUserKm} كم` : '';
      const reply = `أقرب موقع طلبته هو ${bestMatch.name} في ${bestMatch.address} ${distanceText}. اضغط على أيقونة وصّلني لبدء مسار الملاحة فوراً.`;
      setVoiceNotice(reply);
      speakText(reply);
    }
  };

  // Toggle Microphone
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('ميزة التحدث الصوتي بالميكروفون تتطلب متصفح كروم أو إيدج حديث.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleVoiceCommand(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Helper to get or create cached icon for facility type to prevent memory allocation spikes
  const getMarkerIcon = (facilityType: StationFacilityType, stationItem?: CargasStationLocation) => {
    const wasalnyCfg = config.wasalnyConfig || getWasalnyFullConfig();
    const stationCustomLogo = stationItem
      ? (wasalnyCfg.stationCustomLogos?.[stationItem.id] || wasalnyCfg.stationCustomLogos?.[stationItem.code] || stationItem.customLogoUrl)
      : undefined;
    const effectiveLogo = getMasterStationMapLogo(stationItem?.id, stationCustomLogo);

    const hasLogo = Boolean(effectiveLogo && effectiveLogo.trim().length > 0);
    const glowColor = wasalnyCfg.stationMarkerGlowColor || '#059669';
    const markerStyle = wasalnyCfg.stationMarkerStyle || 'cargas_badge';
    const cacheKey = `${facilityType}_${stationItem?.id || 'gen'}_${hasLogo ? effectiveLogo : 'no'}_${markerStyle}`;

    if (iconCacheRef.current[cacheKey]) {
      return iconCacheRef.current[cacheKey];
    }

    let bg = glowColor; // Dynamic glow
    let icon = '⛽';
    if (facilityType === 'conversion_center') {
      bg = '#2563eb';
      icon = '🔧';
    } else if (facilityType === 'oil_center') {
      bg = '#d97706';
      icon = '🛢️';
    } else if (facilityType === 'canopy_oil') {
      bg = '#7c3aed';
      icon = '☂️';
    } else if (facilityType === 'cylinder_inspection') {
      bg = '#dc2626';
      icon = '🛡️';
    }

    let newIcon: L.DivIcon;
    if (hasLogo) {
      const radiusStyle = markerStyle === 'shield_badge'
        ? 'border-radius: 10px 10px 18px 18px;'
        : markerStyle === 'royal_pin'
        ? 'border-radius: 50%;'
        : 'border-radius: 14px;';

      newIcon = L.divIcon({
        className: 'cargas-custom-logo-pin',
        html: `
          <div style="background-color: white; border: 3px solid ${bg}; width: 44px; height: 44px; ${radiusStyle} display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); overflow: hidden; transform: rotate(-2deg); aspect-ratio: 1/1;">
            <img src="${effectiveLogo}" alt="لوجو كارجاس" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
    } else {
      newIcon = L.divIcon({
        className: 'cargas-pin',
        html: `
          <div style="background-color: ${bg}; color: white; width: 42px; height: 42px; border-radius: 13px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid white; font-size: 19px; transform: rotate(-4deg); transition: transform 0.2s;">
            ${icon}
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
    }

    iconCacheRef.current[cacheKey] = newIcon;
    return newIcon;
  };

  // Auto-play voice guidance on open if enabled in wasalnyConfig
  useEffect(() => {
    if (config.wasalnyConfig?.autoVoiceOnOpen && config.wasalnyConfig?.voiceGuidance !== 'silent' && activeVoiceId !== 'silent') {
      const defaultMsg =
        activeVoiceId === 'shakir_egyptian'
          ? 'أهلاً بحضرتك يا فندم في تطبيق وصّلني كارجاس! معاك شاكر، جاري توجيهك لأقرب محطة غاز طبيعي.'
          : activeVoiceId === 'hamed_arabic'
          ? 'مرحباً بك في تطبيق وصّلني كارجاس. معك حامد، جاري توجيهك لأقرب محطة غاز طبيعي.'
          : 'أهلاً بيك يا باشا في تطبيق وصّلني كارجاس! معاك وضاح، جاري توجيهك لأقرب محطة غاز طبيعي.';
      const welcome = config.wasalnyConfig.customWelcomeMessage || defaultMsg;
      const timer = setTimeout(() => {
        speakWadahVoice(welcome);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activeVoiceId]);

  // Initialize Leaflet Map once with proper cleanup and size invalidation
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const container = mapContainerRef.current as any;
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    // Determine initial target station (featured or nearest/first)
    let initialStation = stations[0];
    if (config.wasalnyConfig?.targetStationMode === 'featured_station' && config.wasalnyConfig?.featuredStationId) {
      const featured = stations.find((s) => s.id === config.wasalnyConfig?.featuredStationId);
      if (featured) initialStation = featured;
    }

    const initialLat = initialStation?.latitude || 30.0884;
    const initialLng = initialStation?.longitude || 31.2468;

    try {
      const map = L.map(container, {
        center: [initialLat, initialLng],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; كارجاس مصر - منظومة الغاز الطبيعي',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size after DOM mount
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {
          // ignore
        }
      }, 300);
    } catch (err) {
      console.error('Error initializing map:', err);
    }

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }
    };
  }, []);

  // Update Markers when filteredStations, stationLogoUrl, or master logo changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const wasalnyCfg = getWasalnyFullConfig();

    // Invalidate icon cache if stationLogoUrl or logoRefreshKey changed
    iconCacheRef.current = {};

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add markers using cached icons and lazy popups
    filteredStations.forEach((st) => {
      const marker = L.marker([st.latitude, st.longitude], {
        icon: getMarkerIcon(st.facilityType, st),
      }).addTo(map);

      // Lazy popup evaluation — constructed only when user opens the popup
      marker.bindPopup(() => {
        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`;
        const providerName = 'خرائط جوجل';
        const effectiveStationLogo = getMasterStationMapLogo(st.id, st.customLogoUrl);
        const logoSection = effectiveStationLogo
          ? `
            <div style="text-align: center; margin-bottom: 8px;">
              <a href="${navUrl}" target="_blank" title="اضغط على اللوجو للانتقال لنظام الملاحة في ${providerName}" style="display: inline-block;">
                <img src="${effectiveStationLogo}" alt="${st.name}" style="height: 38px; max-width: 110px; object-fit: contain; cursor: pointer; border-radius: 8px; border: 2px solid ${wasalnyCfg.stationMarkerGlowColor || '#059669'}; padding: 2px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);" />
              </a>
              <span style="display: block; font-size: 9px; color: #059669; font-weight: bold; margin-top: 2px;">(اضغط على اللوجو للانتقال لـ ${providerName} 🚗)</span>
            </div>
          `
          : '';

        const crowdSection = st.crowdLevel
          ? `
            <div style="margin-bottom: 6px; font-size: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 3px 6px; color: #065f46; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
              <span>📹 حالة الزحام: [${st.crowdLevel}]</span>
              <span>~${st.crowdEstimatedWaitMinutes || 3} دقيقة</span>
            </div>
          `
          : '';

        const activitiesSection = (st.activities || ['تموين', 'زيوت'])
          .map(
            (act) =>
              `<span style="background: #f8fafc; color: #334155; font-size: 9px; font-weight: bold; padding: 2px 5px; border-radius: 4px; border: 1px solid #cbd5e1;">${
                act === 'تموين' ? '⛽ تموين' : act === 'تحويل' ? '🔧 تحويل' : act === 'صيانة' ? '⚙️ صيانة' : act === 'زيوت' ? '🛢️ زيوت' : '🛡️ فحص اسطوانات'
              }</span>`
          )
          .join('');

        return `
          <div style="font-family: Cairo, sans-serif; text-align: right; direction: rtl; min-width: 260px; padding: 6px;">
            ${logoSection}
            <h4 style="font-weight: 900; font-size: 15px; margin: 0 0 4px; color: #0f172a;">${st.name}</h4>
            <p style="font-size: 11px; color: #64748b; margin: 0 0 6px;">${st.address}</p>
            ${crowdSection}
            <div style="font-size: 10px; margin-bottom: 6px;">
              <span style="background: #ecfdf5; color: #059669; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                ${st.workingHours}
              </span>
              ${st.promotionalPointsMultiplier > 1 ? `<span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 4px;">نقاط ولاء ${st.promotionalPointsMultiplier}x</span>` : ''}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
              ${activitiesSection}
            </div>
            <a href="${navUrl}" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 6px; background: #059669; color: white; padding: 8px 12px; border-radius: 10px; text-decoration: none; font-size: 12px; font-weight: 900; box-shadow: 0 2px 8px rgba(5,150,105,0.4);">
              <span>🚗 وصّلني (الملاحة فى جوجل)</span>
            </a>
          </div>
        `;
      });

      marker.on('click', () => {
        setSelectedStation(st);
        if (onSelectStation) onSelectStation(st);
      });

      markersRef.current[st.id] = marker;
    });
  }, [filteredStations, config.stationLogoUrl, logoRefreshKey]);

  const getFacilityBadge = (type: StationFacilityType) => {
    switch (type) {
      case 'conversion_center':
        return { label: 'مركز تحويل سيارات', bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: '🔧' };
      case 'oil_center':
        return { label: 'مركز زيوت كارجاس', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: '🛢️' };
      case 'canopy_oil':
        return { label: 'زيوت أسفل المظلة', bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: '☂️' };
      case 'cylinder_inspection':
        return { label: 'فحص واختبار أسطوانات', bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: '🛡️' };
      default:
        return { label: 'محطة تموين غاز CNG', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: '⛽' };
    }
  };

  return (
    <div className={`space-y-5 ${isStandalone ? 'bg-white rounded-3xl p-5 sm:p-8 shadow-md border border-slate-200' : ''}`}>
      
      {/* Standalone Top Bar with Back Button */}
      {isStandalone && onBack && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black px-5 py-2.5 rounded-2xl transition shadow-md active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرجوع للنافذة الرئيسية للعميل ↩️</span>
          </button>

          <div className="flex items-center gap-2">
            {config.stationLogoUrl && (
              <img src={config.stationLogoUrl} alt="لوجو كارجاس" className="h-8 max-w-[80px] object-contain rounded" />
            )}
            <span className="text-xs font-bold text-slate-500">
              شبكة كارجاس الوطنية المعتمدة
            </span>
          </div>
        </div>
      )}

      {/* Direct GPS Quick Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-black text-lg">
            📍
          </div>
          <div>
            <h4 className="font-black text-sm text-white">
              نظام الملاحة الذكي لأقرب محطة كارجاس
            </h4>
            <p className="text-xs text-slate-300 font-light mt-0.5">
              تحديد فوري لأقرب محطة غاز طبيعي وتوجيه مباشر عبر خرائط جوجل (Google Maps)
            </p>
          </div>
        </div>

        {/* GPS Locate Button */}
        <button
          onClick={locateUser}
          disabled={isLocating}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Compass className={`w-4 h-4 text-amber-300 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'جارٍ فحص الـ GPS...' : '📍 تحديد موقعي الحالي بالـ GPS'}</span>
        </button>
      </div>

      {/* Nearest Station Highlight Alert Card if found */}
      {nearestStation && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-400 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            {/* Clickable Logo navigating to Google Maps */}
            <div
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${nearestStation.latitude},${nearestStation.longitude}`, '_blank')}
              className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shrink-0 shadow-md cursor-pointer hover:scale-105 transition border-2 border-white group/logo relative overflow-hidden"
              title="اضغط على اللوجو للانتقال إلى نظام ملاحة خرائط جوجل 🚗"
            >
              {config.stationLogoUrl ? (
                <img src={config.stationLogoUrl} alt="كارجاس" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                '⛽'
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black bg-emerald-700 text-white px-2.5 py-0.5 rounded-full">
                  أقرب محطة كارجاس لموقعك الآن 🎯
                </span>
                {nearestStation.distanceFromUserKm !== undefined && (
                  <span className="text-xs font-black text-emerald-950 bg-white/90 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                    على بُعد {nearestStation.distanceFromUserKm} كم فقط
                  </span>
                )}
                {nearestStation.crowdLevel && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                    📹 الزحام: {nearestStation.crowdLevel} (~{nearestStation.crowdEstimatedWaitMinutes || 3} د)
                  </span>
                )}
              </div>
              <h4 className="font-black text-base text-slate-900 mt-1">
                {nearestStation.name}
              </h4>
              <p className="text-xs text-slate-600">{nearestStation.address}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Egyptian & Arabic Human Voice Guidance with Live Selector */}
            <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-2xl border border-amber-300 shadow-2xs">
              <button
                type="button"
                onClick={() => handlePlayWadahGuidance(nearestStation)}
                className={`flex-1 sm:flex-initial text-xs font-black px-3.5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap cursor-pointer ${
                  isSpeakingAnswer
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
                title={isSpeakingAnswer ? 'إيقاف الصوت ⏹️' : `استمع للإرشاد الصوتي بصوت ${NAVIGATION_VOICES[activeVoiceId]?.shortName || 'شاكر'}`}
              >
                {isSpeakingAnswer ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-slate-950" />}
                <span>{isSpeakingAnswer ? 'إيقاف الصوت ⏹️' : `${NAVIGATION_VOICES[activeVoiceId]?.shortName || 'شاكر المصري'} 🔊`}</span>
              </button>

              <select
                value={activeVoiceId}
                onChange={(e) => {
                  const newVoice = e.target.value as NavigationVoiceId;
                  setActiveVoiceId(newVoice);
                  if (newVoice !== 'silent') {
                    const sample =
                      newVoice === 'shakir_egyptian'
                        ? 'أهلاً بحضرتك يا فندم، أنا شاكر معاك على الطريق.'
                        : newVoice === 'hamed_arabic'
                        ? 'مرحباً بك، معك حامد مرشدك الذكي.'
                        : 'يا هلا بيك يا باشا، معاك وضاح في كارجاس!';
                    setVoiceNotice(sample);
                    playNavigationVoice(sample, newVoice, {
                      onStart: () => setIsSpeakingAnswer(true),
                      onEnd: () => setIsSpeakingAnswer(false),
                      onError: () => setIsSpeakingAnswer(false),
                    });
                  } else {
                    stopNavigationVoice();
                    setIsSpeakingAnswer(false);
                  }
                }}
                className="bg-white text-slate-800 text-[11px] font-bold py-2 px-2 rounded-xl border border-amber-200 outline-hidden cursor-pointer"
                title="تغيير نبرة الصوت البشري (شاكر المصري / حامد العربي / وضاح)"
              >
                <option value="shakir_egyptian">🎙️ شاكر (مصري بشري)</option>
                <option value="hamed_arabic">🔊 حامد (عربي فصيح)</option>
                <option value="wadah_egyptian">📢 وضاح (مصري شعبي)</option>
                <option value="moen_advisor">🤖 مُعِين (استشاري)</option>
                <option value="silent">🔇 كتم الصوت</option>
              </select>
            </div>

            <button
              onClick={() => focusStationOnMap(nearestStation)}
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300 transition"
            >
              عرض في الخريطة 🔍
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestStation.latitude},${nearestStation.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>🚗 وصّلني (بدء الملاحة)</span>
            </a>
          </div>
        </div>
      )}

      {/* Categories Filter Pills in Normal Standard Colors */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'all', label: `الكل (${stations.length})`, icon: '🏢' },
          { id: 'cng_station', label: 'محطات غاز CNG', icon: '⛽' },
          { id: 'conversion_center', label: 'مراكز التحويل والصيانة', icon: '🔧' },
          { id: 'oil_center', label: 'مراكز الزيوت المعتمدة', icon: '🛢️' },
          { id: 'canopy_oil', label: 'زيوت أسفل المظلة', icon: '☂️' },
          { id: 'cylinder_inspection', label: 'فحص الأسطوانات', icon: '🛡️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id as any)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-2xl font-bold transition flex items-center gap-1.5 border ${
              selectedType === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم المحطة، المدينة (القاهرة، الجيزة، الإسكندرية...) أو العنوان"
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pr-11 text-xs outline-none focus:border-emerald-500 transition shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      {/* Main Map & Interactive List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Leaflet Map Frame (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-slate-200 shadow-inner relative min-h-[380px] sm:min-h-[460px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] sm:min-h-[460px] z-10" />
          
          {/* Map Overlay Badge */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-md text-[11px] font-bold text-slate-900 flex items-center gap-2">
            <img src={getMasterStationMapLogo()} alt="كارجاس" className="h-5 max-w-[65px] object-contain" />
            <span>محطات ومراكز كارجاس ({filteredStations.length})</span>
          </div>
        </div>

        {/* Stations Side List (5 cols) with "كارجاس أقرب لك" and Governorate Classification */}
        <div className="lg:col-span-5 space-y-3.5 flex flex-col">
          {/* Header Card: Requested phrase "كارجاس أقرب لك" and Governorate Categories */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-3.5 sm:p-4 border border-emerald-500/40 shadow-md space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white p-0.5 border border-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                  <img src={getMasterStationMapLogo()} alt="كارجاس" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-emerald-300 flex items-center gap-1.5">
                    <span>كارجاس أقرب لك</span>
                    <span className="text-xs">📍</span>
                  </h3>
                  <p className="text-[10px] text-slate-300">
                    دليل المحطات والمراكز مصنف حسب المحافظة ({filteredStations.length} موقع)
                  </p>
                </div>
              </div>

              {/* Toggle Grouped by Governorate vs Flat List */}
              <button
                type="button"
                onClick={() => setIsGroupedView(!isGroupedView)}
                className="bg-white/10 hover:bg-white/20 text-emerald-200 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-white/15 transition flex items-center gap-1 shrink-0"
                title="تبديل طريقة العرض (مصنفة بالمحافظات / قائمة موحدة)"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isGroupedView ? 'عرض مصنف' : 'عرض بسيط'}</span>
              </button>
            </div>

            {/* Quick Governorate Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10.5px]">
              <button
                type="button"
                onClick={() => setSelectedGovernorate('all')}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition border ${
                  selectedGovernorate === 'all'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                    : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20'
                }`}
              >
                🏛️ كل المحافظات ({processedStations.length})
              </button>
              {governoratesList.map((gov) => (
                <button
                  key={gov.name}
                  type="button"
                  onClick={() => setSelectedGovernorate(gov.name)}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition border ${
                    selectedGovernorate === gov.name
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                      : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20'
                  }`}
                >
                  {gov.name} ({gov.count})
                </button>
              ))}
            </div>
          </div>

          {/* Stations List Body with Governorate Grouping */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {isGroupedView && selectedGovernorate === 'all' ? (
              // Grouped by Governorate View
              Object.entries(stationsByGovernorate).map(([govName, govStations]) => (
                <div key={govName} className="space-y-2">
                  <div className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-md text-emerald-300 border border-slate-700 px-3.5 py-1.5 rounded-2xl flex items-center justify-between text-xs font-black shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>محافظة {govName}</span>
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] px-2 py-0.2 rounded-full font-bold">
                      {govStations.length} موقع كارجاس
                    </span>
                  </div>

                  {govStations.map((st) => {
                    const badge = getFacilityBadge(st.facilityType);
                    const isSelected = selectedStation?.id === st.id;
                    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`;
                    const itemLogo = getMasterStationMapLogo(st.id, st.customLogoUrl);

                    return (
                      <div
                        key={st.id}
                        onClick={() => focusStationOnMap(st)}
                        className={`p-3.5 sm:p-4 rounded-3xl border transition cursor-pointer space-y-2.5 ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(navUrl, '_blank');
                              }}
                              className="cursor-pointer group/logo relative"
                              title="اضغط على اللوجو للانتقال لمسار خرائط جوجل 🚗"
                            >
                              {itemLogo ? (
                                <img
                                  src={itemLogo}
                                  alt="كارجاس"
                                  className="w-8 h-8 rounded-lg object-contain border-2 border-emerald-500 p-0.5 shrink-0 group-hover/logo:scale-110 transition shadow-2xs"
                                />
                              ) : (
                                <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm border border-slate-200">
                                  {badge.icon}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                  🏛️ {st.governorate || govName}
                                </span>
                              </div>
                              <h4 className="font-black text-xs sm:text-sm text-slate-900 mt-0.5">
                                {st.name}
                              </h4>
                            </div>
                          </div>

                          {st.distanceFromUserKm !== undefined && (
                            <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg whitespace-nowrap">
                              {st.distanceFromUserKm} كم
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-1">{st.address}</p>

                        {/* CCTV Stream & Crowd Level Badge */}
                        {st.crowdLevel && (
                          <div className="flex items-center justify-between text-[10px] bg-emerald-50/70 border border-emerald-200 px-2 py-1 rounded-lg text-emerald-900">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>رصد كاميرات المراقبة: [{st.crowdLevel}]</span>
                            </div>
                            <span className="font-mono text-emerald-700">~{st.crowdEstimatedWaitMinutes || 3} دقيقة</span>
                          </div>
                        )}

                        {/* Activities Badges */}
                        <div className="flex flex-wrap gap-1">
                          {(st.activities || ['تموين', 'زيوت']).map((act) => {
                            let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                            let icon = '⛽';
                            if (act === 'تموين') {
                              badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                              icon = '⛽';
                            } else if (act === 'تحويل') {
                              badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                              icon = '🔧';
                            } else if (act === 'صيانة') {
                              badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                              icon = '⚙️';
                            } else if (act === 'زيوت') {
                              badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                              icon = '🛢️';
                            } else if (act === 'فحص اسطوانات') {
                              badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                              icon = '🛡️';
                            }
                            return (
                              <span key={act} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                {icon} {act}
                              </span>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {st.workingHours}
                          </span>

                          <div className="flex items-center gap-1">
                            <a
                              href={navUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs active:scale-95 text-xs"
                              title="فتح مسار الملاحة فى خرائط جوجل"
                            >
                              <span>🚗 وصّلني</span>
                              <Navigation className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              // Flat List View
              filteredStations.map((st) => {
                const badge = getFacilityBadge(st.facilityType);
                const isSelected = selectedStation?.id === st.id;
                const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`;
                const itemLogo = getMasterStationMapLogo(st.id, st.customLogoUrl);

                return (
                  <div
                    key={st.id}
                    onClick={() => focusStationOnMap(st)}
                    className={`p-3.5 sm:p-4 rounded-3xl border transition cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(navUrl, '_blank');
                          }}
                          className="cursor-pointer group/logo relative"
                          title="اضغط على اللوجو للانتقال لمسار خرائط جوجل 🚗"
                        >
                          {itemLogo ? (
                            <img
                              src={itemLogo}
                              alt="كارجاس"
                              className="w-8 h-8 rounded-lg object-contain border-2 border-emerald-500 p-0.5 shrink-0 group-hover/logo:scale-110 transition shadow-2xs"
                            />
                          ) : (
                            <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm border border-slate-200">
                              {badge.icon}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              🏛️ {st.governorate || 'القاهرة'}
                            </span>
                          </div>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 mt-0.5">
                            {st.name}
                          </h4>
                        </div>
                      </div>

                      {st.distanceFromUserKm !== undefined && (
                        <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg whitespace-nowrap">
                          {st.distanceFromUserKm} كم
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1">{st.address}</p>

                    {/* CCTV Stream & Crowd Level Badge */}
                    {st.crowdLevel && (
                      <div className="flex items-center justify-between text-[10px] bg-emerald-50/70 border border-emerald-200 px-2 py-1 rounded-lg text-emerald-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>رصد كاميرات المراقبة: [{st.crowdLevel}]</span>
                        </div>
                        <span className="font-mono text-emerald-700">~{st.crowdEstimatedWaitMinutes || 3} دقيقة</span>
                      </div>
                    )}

                    {/* Activities Badges */}
                    <div className="flex flex-wrap gap-1">
                      {(st.activities || ['تموين', 'زيوت']).map((act) => {
                        let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                        let icon = '⛽';
                        if (act === 'تموين') {
                          badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                          icon = '⛽';
                        } else if (act === 'تحويل') {
                          badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                          icon = '🔧';
                        } else if (act === 'صيانة') {
                          badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                          icon = '⚙️';
                        } else if (act === 'زيوت') {
                          badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                          icon = '🛢️';
                        } else if (act === 'فحص اسطوانات') {
                          badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                          icon = '🛡️';
                        }
                        return (
                          <span key={act} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                            {icon} {act}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {st.workingHours}
                      </span>

                      {st.promotionalPointsMultiplier > 1 && (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          🎁 نقاط {st.promotionalPointsMultiplier}x
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <a
                          href={navUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs active:scale-95 text-xs"
                          title="فتح مسار الملاحة فى خرائط جوجل"
                        >
                          <span>🚗 وصّلني</span>
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {filteredStations.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                لا توجد محطات مطابقة لبحثك في هذه المحافظة
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
