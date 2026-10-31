import React, { useState, useEffect } from 'react';
import {
  WasalnyConfig,
  WasalnyServiceItem,
  WasalnyCaptain,
  CargasStationLocation,
  AppConfig,
  MapFacilityFilterItem,
  CustomerViewMode,
  StationActivity,
} from '../types';
import {
  getWasalnyFullConfig,
  saveWasalnyFullConfig,
  DEFAULT_WASALNY_CONFIG,
  DEFAULT_WASALNY_SERVICES,
  DEFAULT_WASALNY_CAPTAINS,
  getMasterStationMapLogo,
  setMasterStationMapLogo,
  getMapFacilityFilters,
  saveMapFacilityFilters,
  DEFAULT_MAP_FACILITY_FILTERS,
  getCustomerViewMode,
  saveCustomerViewMode,
  saveStationLocations,
  getStationLocations,
} from '../services/storageService';
import {
  Car,
  Truck,
  LifeBuoy,
  Wrench,
  Users,
  Navigation,
  Compass,
  MapPin,
  Save,
  RotateCcw,
  Upload,
  Plus,
  Trash2,
  Edit,
  Check,
  Star,
  Phone,
  DollarSign,
  Sparkles,
  Sliders,
  Shield,
  Layers,
  Smartphone,
  Eye,
  CheckCircle2,
  XCircle,
  Volume2,
  Share2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  Palette,
  Info,
  Award,
  Lock,
  Unlock,
  EyeOff,
  Search,
} from 'lucide-react';

interface WasalnyAdminDashboardProps {
  config: AppConfig;
  stations: CargasStationLocation[];
  onUpdateConfig: (newConfig: AppConfig) => void;
  isStandaloneModal?: boolean;
  onCloseStandalone?: () => void;
}

// شعارات جاهزة ومعتمدة لتطبيق وصلني
const PRESET_WASALNY_LOGOS = [
  {
    id: 'eco_green',
    title: 'الأخضر البيئي والغاز الطبيعي (الافتراضي)',
    url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=240&q=80',
    color: '#059669',
  },
  {
    id: 'royal_blue',
    title: 'الأزرق الملكي لأسطول كارجاس',
    url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=240&q=80',
    color: '#0284c7',
  },
  {
    id: 'speed_taxi',
    title: 'التاكسي والسرعة الذكية (عنبري وذهبي)',
    url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=240&q=80',
    color: '#d97706',
  },
  {
    id: 'cng_shield',
    title: 'درع الأمان والإنقاذ السريع SOS',
    url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=240&q=80',
    color: '#dc2626',
  },
  {
    id: 'corporate_fleet',
    title: 'أسطول الشركات ورجال الأعمال',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=240&q=80',
    color: '#475569',
  },
];

// شعارات جاهزة ومعتمدة لدبابيس وماركرز المحطات على الخريطة (طريقنا واحد)
export const PRESET_STATION_MAP_LOGOS = [
  {
    id: 'cargas_official',
    title: 'شعار كارجاس الرسمي (الأخضر والذهبي NGV)',
    url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=240&q=80',
    color: '#059669',
    badgeText: 'CARGAS',
  },
  {
    id: 'cargas_bp',
    title: 'كارجاس وشريك الزيوت المعتمد BP',
    url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=240&q=80',
    color: '#16a34a',
    badgeText: 'BP • كارجاس',
  },
  {
    id: 'cargas_shell',
    title: 'كارجاس وزيوت شل العالمية (Shell CNG)',
    url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=240&q=80',
    color: '#d97706',
    badgeText: 'SHELL',
  },
  {
    id: 'cargas_total',
    title: 'كارجاس وتوتال إنرجيز TotalEnergies',
    url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=240&q=80',
    color: '#dc2626',
    badgeText: 'TOTAL',
  },
  {
    id: 'cng_flame_eco',
    title: 'شعلة الغاز الطبيعي البيئية النظيفة ECO Flame',
    url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=240&q=80',
    color: '#047857',
    badgeText: 'ECO CNG',
  },
  {
    id: 'royal_cargas_badge',
    title: 'كارجاس الأزرق الكحلي الملكي (طريقنا واحد)',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=240&q=80',
    color: '#1e3a8a',
    badgeText: 'طريقنا واحد',
  },
];

export const WasalnyAdminDashboard: React.FC<WasalnyAdminDashboardProps> = ({
  config,
  stations,
  onUpdateConfig,
  isStandaloneModal = false,
  onCloseStandalone,
}) => {
  // Master Wasalny Config State
  const [wasalny, setWasalny] = useState<WasalnyConfig>(() => {
    const saved = getWasalnyFullConfig();
    return {
      ...saved,
      ...(config.wasalnyConfig || {}),
    };
  });

  // Active Sub-Tab within Wasalny Admin
  const [activeTab, setActiveTab] = useState<
    | 'branding_logo'
    | 'station_map_logos'
    | 'facility_filters'
    | 'delivery_access'
    | 'services_tariffs'
    | 'captains_fleet'
    | 'cargas_loyalty'
    | 'routing_gps'
    | 'simulator'
  >('branding_logo');

  // Map Facility Filters State (التحكم في الأيقونات الخمسة لخدمات المحطات أسفل الخريطة)
  const [adminFacilityFilters, setAdminFacilityFilters] = useState<MapFacilityFilterItem[]>(() => getMapFacilityFilters());
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);

  // طريقة عرض النظام للعميل ومراحل الإطلاق التشغيلية (تحكم حصري لمدير النظام)
  const [adminCustomerViewMode, setAdminCustomerViewMode] = useState<CustomerViewMode>(
    () => config.customerViewMode || getCustomerViewMode()
  );

  const handleUpdateCustomerViewMode = (mode: CustomerViewMode) => {
    setAdminCustomerViewMode(mode);
    saveCustomerViewMode(mode);
    const updatedAppConfig: AppConfig = {
      ...config,
      customerViewMode: mode,
    };
    onUpdateConfig(updatedAppConfig);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Station Logos State
  const [stationLogoSearch, setStationLogoSearch] = useState('');
  const [stationFilterLogoMode, setStationFilterLogoMode] = useState<'all' | 'custom' | 'default'>('all');
  const [selectedPreviewStationId, setSelectedPreviewStationId] = useState<string>(stations[0]?.id || '');

  // New Captain Form State
  const [isAddCaptainModalOpen, setIsAddCaptainModalOpen] = useState(false);
  const [newCapName, setNewCapName] = useState('');
  const [newCapPhone, setNewCapPhone] = useState('010');
  const [newCapPlate, setNewCapPlate] = useState('س ف ر 1 2 3 4');
  const [newCapModel, setNewCapModel] = useState('شيري أريزو 5 (غاز طبيعي)');
  const [newCapCity, setNewCapCity] = useState('القاهرة - شبرا');

  // New Service Form State
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvDesc, setNewSrvDesc] = useState('');
  const [newSrvBase, setNewSrvBase] = useState(20);
  const [newSrvPerKm, setNewSrvPerKm] = useState(5.0);
  const [newSrvMin, setNewSrvMin] = useState(30);
  const [newSrvCommission, setNewSrvCommission] = useState(15);
  const [newSrvIcon, setNewSrvIcon] = useState('Car');

  // Simulator Test Trip State
  const [simKm, setSimKm] = useState<number>(12);
  const [simWaitMins, setSimWaitMins] = useState<number>(5);
  const [simSelectedService, setSimSelectedService] = useState<string>('srv-ride');
  const [simApplyPoints, setSimApplyPoints] = useState<boolean>(true);
  const [simDriverPoints, setSimDriverPoints] = useState<number>(85);

  // Success Save Toast Banner
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Save all settings persistently
  const handleSaveAll = (updated?: WasalnyConfig) => {
    const target = updated || wasalny;
    saveWasalnyFullConfig(target);
    const updatedAppConfig: AppConfig = {
      ...config,
      wasalnyConfig: target,
    };
    onUpdateConfig(updatedAppConfig);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Upload Custom Logo with Compression
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.9);
          const updated = { ...wasalny, wasalnyLogoUrl: compressed };
          setWasalny(updated);
          handleSaveAll(updated);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Upload Unified Station Logo for Map
  const handleUnifiedStationLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 240;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.9);
          setMasterStationMapLogo(compressed);
          const updated = {
            ...wasalny,
            stationUnifiedLogoUrl: compressed,
            stationMarkerLogoMode: 'unified_cargas' as const,
          };
          setWasalny(updated);
          handleSaveAll(updated);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Upload Custom Logo for an Individual Station
  const handleStationCustomLogoUpload = (stationId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 180;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.9);
          const updatedCustomLogos = {
            ...(wasalny.stationCustomLogos || {}),
            [stationId]: compressed,
          };
          const updated = {
            ...wasalny,
            stationCustomLogos: updatedCustomLogos,
            stationMarkerLogoMode: 'individual_station' as const,
          };
          setWasalny(updated);
          handleSaveAll(updated);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Apply Preset Logo to Single Station
  const handleApplyPresetToStation = (stationId: string, logoUrl: string) => {
    const updatedCustomLogos = {
      ...(wasalny.stationCustomLogos || {}),
      [stationId]: logoUrl,
    };
    const updated = {
      ...wasalny,
      stationCustomLogos: updatedCustomLogos,
      stationMarkerLogoMode: 'individual_station' as const,
    };
    setWasalny(updated);
    handleSaveAll(updated);
  };

  // Apply Preset Logo to ALL Stations as Unified Logo
  const handleApplyPresetToAll = (logoUrl: string) => {
    setMasterStationMapLogo(logoUrl);
    const updated = {
      ...wasalny,
      stationUnifiedLogoUrl: logoUrl,
      stationMarkerLogoMode: 'unified_cargas' as const,
    };
    setWasalny(updated);
    handleSaveAll(updated);
  };

  // Reset Individual Station to Default/Unified Logo
  const handleResetStationCustomLogo = (stationId: string) => {
    const copy = { ...(wasalny.stationCustomLogos || {}) };
    delete copy[stationId];
    const updated = {
      ...wasalny,
      stationCustomLogos: copy,
    };
    setWasalny(updated);
    handleSaveAll(updated);
  };

  // Add Captain
  const handleAddCaptain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapName.trim()) return;

    const newCap: WasalnyCaptain = {
      id: 'CAP-' + Date.now().toString().slice(-4),
      name: newCapName.trim(),
      phone: newCapPhone.trim(),
      carPlate: newCapPlate.trim(),
      carModel: newCapModel.trim(),
      city: newCapCity.trim(),
      rating: 5.0,
      totalTrips: 0,
      totalEarningsEgp: 0,
      status: 'active',
      joinedDate: new Date().toISOString().slice(0, 10),
      cngConverted: true,
    };

    const updatedCaptains = [newCap, ...(wasalny.captains || [])];
    const updated = { ...wasalny, captains: updatedCaptains };
    setWasalny(updated);
    handleSaveAll(updated);
    setIsAddCaptainModalOpen(false);
    setNewCapName('');
    alert(`✅ تم اعتماد وإضافة الكابتن [ ${newCap.name} ] إلى أسطول وصلني بنجاح!`);
  };

  // Toggle Captain Status
  const handleToggleCaptainStatus = (id: string) => {
    const updatedCaptains = (wasalny.captains || []).map((c) =>
      c.id === id ? { ...c, status: c.status === 'active' ? ('suspended' as const) : ('active' as const) } : c
    );
    const updated = { ...wasalny, captains: updatedCaptains };
    setWasalny(updated);
    handleSaveAll(updated);
  };

  // Delete Captain
  const handleDeleteCaptain = (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الكابتن [ ${name} ] من أسطول وصلني؟`)) return;
    const updatedCaptains = (wasalny.captains || []).filter((c) => c.id !== id);
    const updated = { ...wasalny, captains: updatedCaptains };
    setWasalny(updated);
    handleSaveAll(updated);
  };

  // Add Custom Service
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim()) return;

    const newSrv: WasalnyServiceItem = {
      id: 'srv-' + Date.now().toString().slice(-4),
      name: newSrvName.trim(),
      description: newSrvDesc.trim() || 'خدمة مخصصة معتمدة من إدارة وصلني',
      icon: newSrvIcon,
      isActive: true,
      baseFareEgp: Number(newSrvBase),
      perKmRateEgp: Number(newSrvPerKm),
      perMinuteRateEgp: 0.8,
      minFareEgp: Number(newSrvMin),
      commissionPct: Number(newSrvCommission),
    };

    const updatedServices = [...(wasalny.services || []), newSrv];
    const updated = { ...wasalny, services: updatedServices };
    setWasalny(updated);
    handleSaveAll(updated);
    setIsAddServiceModalOpen(false);
    setNewSrvName('');
    setNewSrvDesc('');
    alert(`✅ تمت إضافة الخدمة [ ${newSrv.name} ] إلى قائمة خدمات تطبيق وصلني!`);
  };

  // Toggle Service Active
  const handleToggleService = (id: string) => {
    const updatedServices = (wasalny.services || []).map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    const updated = { ...wasalny, services: updatedServices };
    setWasalny(updated);
    handleSaveAll(updated);
  };

  // Delete Service
  const handleDeleteService = (id: string) => {
    if (!confirm('هل ترغب في حذف هذه الخدمة من تطبيق وصلني؟')) return;
    const updatedServices = (wasalny.services || []).filter((s) => s.id !== id);
    const updated = { ...wasalny, services: updatedServices };
    setWasalny(updated);
    handleSaveAll(updated);
  };

  // Map Facility Filters Handlers (تعديل وحفظ الأيقونات الخمسة أسفل الخريطة)
  const handleUpdateFacilityFilter = (id: string, updates: Partial<MapFacilityFilterItem>) => {
    const updated = adminFacilityFilters.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setAdminFacilityFilters(updated);
    saveMapFacilityFilters(updated);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleResetFacilityFiltersToDefault = () => {
    if (!confirm('هل ترغب في استعادة أسماء وأيقونات الخدمات الخمسة الافتراضية لكارجاس؟')) return;
    setAdminFacilityFilters(DEFAULT_MAP_FACILITY_FILTERS);
    saveMapFacilityFilters(DEFAULT_MAP_FACILITY_FILTERS);
    alert('✅ تم استعادة الأيقونات الخمسة الافتراضية المعتمدة لكارجاس بنجاح!');
  };

  // Test Egyptian Voice Guidance
  const handleTestWadahVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        'يا مساء الورد والياسمين يا صاحب صاحبي! مرحب بيك في تطبيق وصّلني التابع لكارجاس وعزوتي.. رحلتك معانا أمان وتوفير حقيقي، ومعاك وضاح خطوة بخطوة لحد ما نوصل بالسلامة!'
      );
      utterance.lang = 'ar-EG';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('نظام التوجيه الصوتي يعمل عبر المتصفح تلقائياً.');
    }
  };

  // Calculate Simulator Estimated Fare
  const activeSimService = (wasalny.services || []).find((s) => s.id === simSelectedService) || (wasalny.services || [])[0];
  const baseTripCost = activeSimService
    ? Math.max(activeSimService.minFareEgp, activeSimService.baseFareEgp + simKm * activeSimService.perKmRateEgp + simWaitMins * activeSimService.perMinuteRateEgp)
    : 30;
  
  const discountRate = wasalny.pointsToEgpDiscountRate || 0.5;
  const maxDiscount = wasalny.maxDiscountPerTripEgp || 50;
  const pointsDiscountEgp = simApplyPoints && wasalny.pointsDiscountEnabled
    ? Math.min(maxDiscount, Math.round(simDriverPoints * discountRate))
    : 0;
  const finalSimTripCost = Math.max(10, Number((baseTripCost - pointsDiscountEgp).toFixed(1)));
  const companyCommissionEgp = Number(((finalSimTripCost * (activeSimService?.commissionPct || 15)) / 100).toFixed(1));
  const captainNetEgp = Number((finalSimTripCost - companyCommissionEgp).toFixed(1));

  return (
    <div className={`space-y-6 ${isStandaloneModal ? 'p-6 bg-slate-900 min-h-screen text-slate-100' : ''}`}>
      
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>✅ تم حفظ كافة تعديلات وبيانات تطبيق وصّلني في قاعدة البيانات والمنظومة بنجاح!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-emerald-600/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Live Wasalny Logo Badge */}
            <div className={`w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-slate-900/80 border-2 border-emerald-400/60 shadow-lg overflow-hidden ${
              wasalny.wasalnyLogoShape === 'circle' ? 'rounded-full' : wasalny.wasalnyLogoShape === 'square' ? 'rounded-lg' : 'rounded-2xl'
            }`}>
              {wasalny.wasalnyLogoUrl ? (
                <img src={wasalny.wasalnyLogoUrl} alt="Wasalny Logo" className="w-full h-full object-cover rounded-inherit" />
              ) : (
                <div className="text-2xl">🚗</div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {wasalny.appName || 'تطبيق وصّلني - Cargas Wasalny'}
                </h2>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  wasalny.appStatus === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : wasalny.appStatus === 'maintenance'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}>
                  {wasalny.appStatus === 'active' ? '● التشغيل نشط' : wasalny.appStatus === 'maintenance' ? '⚠️ تحت الصيانة' : '🧪 إصدار تجريبي'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {wasalny.appVersion || 'v3.5'}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 max-w-2xl leading-relaxed">
                {wasalny.appSlogan || 'مشوارك أسرع مع غاز كارجاس وأنظف للبيئة • تحكم كامل في اللوجو، الخدمات، الكباتن، التعريفة، والملاحة من لوحة مدير النظام'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSaveAll()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتثبيت تعديلات وصّلني 💾</span>
            </button>

            {onCloseStandalone && (
              <button
                onClick={onCloseStandalone}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl transition"
              >
                إغلاق النافذة ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-emerald-800/40 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">إجمالي الكباتن:</span>
            <span className="font-mono font-black text-emerald-400">{wasalny.captains?.length || 0} كابتن</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">الخدمات النشطة:</span>
            <span className="font-mono font-black text-blue-400">
              {wasalny.services?.filter((s) => s.isActive).length || 0} من {wasalny.services?.length || 0}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">خصم نقاط كارجاس:</span>
            <span className="font-mono font-black text-amber-400">
              {wasalny.pointsDiscountEnabled ? 'مفعل ومربوط' : 'معطل'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">المحطات المربوطة:</span>
            <span className="font-mono font-black text-cyan-400">{stations.length} محطة</span>
          </div>
        </div>
      </div>

      {/* Wasalny Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl shadow-xs gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('branding_logo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'branding_logo'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>تعديل اللوجو والهوية البصرية 🎨</span>
        </button>

        <button
          onClick={() => setActiveTab('station_map_logos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'station_map_logos'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
              : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>لوجوهات وشارات المحطات على الخريطة 📍</span>
        </button>

        <button
          onClick={() => setActiveTab('facility_filters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'facility_filters'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
              : 'text-teal-800 hover:text-teal-950 bg-teal-50/70 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-600" />
          <span>أيقونات خدمات المحطات أسفل الخريطة (الخمسة) 🏷️</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery_access')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'delivery_access'
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
              : 'text-rose-800 hover:text-rose-950 bg-rose-50/70 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-600" />
          <span>حصرية الخدمات والتوصيل الذكي لمدير النظام 🔒</span>
        </button>

        <button
          onClick={() => setActiveTab('services_tariffs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'services_tariffs'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>الخدمات والتعريفة والأسعار (مقتصرة على المدير) 💵</span>
        </button>

        <button
          onClick={() => setActiveTab('captains_fleet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'captains_fleet'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة كباتن وأسطول وصلني ({wasalny.captains?.length || 0}) 🚖</span>
        </button>

        <button
          onClick={() => setActiveTab('cargas_loyalty')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'cargas_loyalty'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>ربط برنامج ولاء كارجاس واستبدال النقاط 🪙</span>
        </button>

        <button
          onClick={() => setActiveTab('routing_gps')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'routing_gps'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>التوجيه الملاحي والمحطات وGPS 🗺️</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100'
          }`}
        >
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span>محاكي تطبيق وصلني المباشر 📱</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Logo & Visual Identity */}
      {/* ========================================================================= */}
      {activeTab === 'branding_logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          
          {/* Logo Editor Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 lg:col-span-2">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  <span>تعديل وتحميل لوجو تطبيق وصّلني</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تحكم كامل في مظهر وأبعاد ولوجو التطبيق المعروض للسائقين والعملاء
                </p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                لوجو ديناميكي 100%
              </span>
            </div>

            {/* Current Logo Preview & Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative group">
                <div className={`w-32 h-32 flex items-center justify-center p-2 bg-white border-2 border-emerald-500 shadow-md overflow-hidden ${
                  wasalny.wasalnyLogoShape === 'circle' ? 'rounded-full' : wasalny.wasalnyLogoShape === 'square' ? 'rounded-lg' : 'rounded-3xl'
                }`}>
                  {wasalny.wasalnyLogoUrl ? (
                    <img src={wasalny.wasalnyLogoUrl} alt="Logo" className="w-full h-full object-cover rounded-inherit" />
                  ) : (
                    <div className="text-4xl">🚗</div>
                  )}
                </div>
                <label
                  htmlFor="wasalnyLogoFileInput"
                  className="absolute bottom-1 right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full cursor-pointer shadow-md transition"
                  title="رفع صورة لوجو جديدة من الجهاز"
                >
                  <Upload className="w-4 h-4" />
                </label>
                <input
                  type="file"
                  id="wasalnyLogoFileInput"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              <div className="space-y-3 flex-1 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رابط مباشر للوجو (Image URL):</label>
                  <input
                    type="url"
                    value={wasalny.wasalnyLogoUrl || ''}
                    onChange={(e) => setWasalny({ ...wasalny, wasalnyLogoUrl: e.target.value })}
                    placeholder="https://example.com/wasalny-logo.png"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">شكل إطار اللوجو:</label>
                    <select
                      value={wasalny.wasalnyLogoShape || 'rounded'}
                      onChange={(e) => setWasalny({ ...wasalny, wasalnyLogoShape: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold"
                    >
                      <option value="rounded">حواف دائرية عصرية (Rounded-2xl)</option>
                      <option value="circle">دائري كروي (Circle)</option>
                      <option value="square">مربع هندسي (Square)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">إجراءات سريعة:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...wasalny, wasalnyLogoUrl: PRESET_WASALNY_LOGOS[0].url };
                          setWasalny(updated);
                          handleSaveAll(updated);
                        }}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold py-2 rounded-xl transition"
                      >
                        الافتراضي 🔄
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...wasalny, wasalnyLogoUrl: '' };
                          setWasalny(updated);
                          handleSaveAll(updated);
                        }}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold px-3 py-2 rounded-xl transition"
                      >
                        مسح ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Presets Gallery */}
            <div className="space-y-3">
              <label className="block font-bold text-slate-800 text-xs">
                اختر من النماذج المعتمدة لشعار وهوية وصلني:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_WASALNY_LOGOS.map((preset) => {
                  const isSelected = wasalny.wasalnyLogoUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        const updated = {
                          ...wasalny,
                          wasalnyLogoUrl: preset.url,
                          wasalnyThemeColor: preset.color,
                        };
                        setWasalny(updated);
                        handleSaveAll(updated);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 text-xs block truncate">{preset.title}</span>
                        <span className="text-[10px] text-slate-500 block">اضغط للتطبيق الفوري</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* App Branding Text Customization */}
            <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">نصوص وهوية التطبيق:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم التطبيق:</label>
                  <input
                    type="text"
                    value={wasalny.appName || ''}
                    onChange={(e) => setWasalny({ ...wasalny, appName: e.target.value })}
                    placeholder="تطبيق وصّلني - Cargas Wasalny"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة تشغيل التطبيق:</label>
                  <select
                    value={wasalny.appStatus || 'active'}
                    onChange={(e) => setWasalny({ ...wasalny, appStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="active">🟢 متاح ونشط لجميع السائقين والركاب</option>
                    <option value="maintenance">🔴 مغلق مؤقتاً لأعمال الصيانة والتحديث</option>
                    <option value="beta">🟡 تجريبي ومخصص لكباتن كارجاس المعتمدين فقط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شعار التطبيق والرسالة الترويجية:</label>
                <input
                  type="text"
                  value={wasalny.appSlogan || ''}
                  onChange={(e) => setWasalny({ ...wasalny, appSlogan: e.target.value })}
                  placeholder="مشوارك أسرع مع غاز كارجاس وأنظف للبيئة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Color & Theme Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 text-xs">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ألوان الواجهة وشاشات العملاء</span>
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">اللون الرئيسي (Primary Brand):</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={wasalny.wasalnyThemeColor || '#059669'}
                  onChange={(e) => setWasalny({ ...wasalny, wasalnyThemeColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={wasalny.wasalnyThemeColor || '#059669'}
                  onChange={(e) => setWasalny({ ...wasalny, wasalnyThemeColor: e.target.value })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">اللون الثانوي (Accent Glow):</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={wasalny.wasalnyAccentColor || '#0284c7'}
                  onChange={(e) => setWasalny({ ...wasalny, wasalnyAccentColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={wasalny.wasalnyAccentColor || '#0284c7'}
                  onChange={(e) => setWasalny({ ...wasalny, wasalnyAccentColor: e.target.value })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold"
                />
              </div>
            </div>

            {/* Live Color Card Preview */}
            <div
              className="p-4 rounded-2xl text-white shadow-md space-y-2"
              style={{
                background: `linear-gradient(135deg, ${wasalny.wasalnyThemeColor || '#059669'} 0%, ${wasalny.wasalnyAccentColor || '#0284c7'} 100%)`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm">{wasalny.appName || 'وصّلني'}</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">معاينة مباشرة</span>
              </div>
              <p className="text-[11px] text-white/90 leading-relaxed">
                {wasalny.appSlogan || 'مشوارك أسرع مع غاز كارجاس'}
              </p>
            </div>

            <button
              onClick={() => handleSaveAll()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 rounded-xl transition text-xs shadow-md"
            >
              اعتماد الألوان واللوجو فوراً 💾
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: Station Map Logos & Custom Markers (طريقنا واحد - وصّلني) */}
      {/* ========================================================================= */}
      {activeTab === 'station_map_logos' && (
        <div className="space-y-6 animate-in fade-in text-xs">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-3xl border border-emerald-500/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                📍
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">
                  التحكم في لوجوهات وشارات المحطات على الخريطة (طريقنا واحد - وصّلني)
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  تحكم كامل من مدير النظام في الشعار الظاهر على دبابيس المحطات (لوجو كارجاس موحد، أو لوجو مستقل لكل محطة، أو لوجوهات الشركاء: شل، بي بي، توتال، الشعلة البيئية)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-xl font-bold text-xs">
                {stations.length} محطة مربوطة بالخريطة
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Strategy & Style Controls */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 lg:col-span-1">
              <h4 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>إستراتيجية ونمط الشعار على الماركر</span>
              </h4>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">نظام تطبيق اللوجو على الخريطة:</label>
                <div className="space-y-2">
                  <label className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition ${
                    (wasalny.stationMarkerLogoMode || 'unified_cargas') === 'unified_cargas'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div>
                      <span className="font-black block">لوجو موحد معمم على كافة المحطات</span>
                      <span className="text-[10px] text-slate-500">شعار واحد يظهر على جميع محطات كارجاس</span>
                    </div>
                    <input
                      type="radio"
                      name="logoMode"
                      checked={(wasalny.stationMarkerLogoMode || 'unified_cargas') === 'unified_cargas'}
                      onChange={() => {
                        const updated = { ...wasalny, stationMarkerLogoMode: 'unified_cargas' as const };
                        setWasalny(updated);
                        handleSaveAll(updated);
                      }}
                      className="w-4 h-4 text-emerald-600"
                    />
                  </label>

                  <label className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition ${
                    wasalny.stationMarkerLogoMode === 'individual_station'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div>
                      <span className="font-black block">تخصيص لوجو منفصل لكل محطة على حدة</span>
                      <span className="text-[10px] text-slate-500">يتيح رفع أو اختيار لوجو مستقل لكل محطة (بي بي، شل، كارجاس)</span>
                    </div>
                    <input
                      type="radio"
                      name="logoMode"
                      checked={wasalny.stationMarkerLogoMode === 'individual_station'}
                      onChange={() => {
                        const updated = { ...wasalny, stationMarkerLogoMode: 'individual_station' as const };
                        setWasalny(updated);
                        handleSaveAll(updated);
                      }}
                      className="w-4 h-4 text-emerald-600"
                    />
                  </label>
                </div>
              </div>

              {/* Marker Pin Style */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">شكل وتصميم الماركر على الخريطة:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cargas_badge', title: 'شارة دائرية مضيئة', desc: 'إطار كارجاس الأخضر الملكي' },
                    { id: 'royal_pin', title: 'دبوس ملاحي ملكي', desc: 'رأس ملاحي أزرق كحلي' },
                    { id: 'shield_badge', title: 'درع الأمان والسلامة', desc: 'شارة STOP والسلامة' },
                    { id: 'clean_logo', title: 'لوجو ناصع ومباشر', desc: 'بدون إطار إضافي' },
                  ].map((styleItem) => {
                    const isSelected = (wasalny.stationMarkerStyle || 'cargas_badge') === styleItem.id;
                    return (
                      <button
                        type="button"
                        key={styleItem.id}
                        onClick={() => {
                          const updated = { ...wasalny, stationMarkerStyle: styleItem.id as any };
                          setWasalny(updated);
                          handleSaveAll(updated);
                        }}
                        className={`p-2.5 rounded-xl border text-right transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="font-black block text-[11px]">{styleItem.title}</span>
                        <span className={`text-[9px] block ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {styleItem.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Marker Glow Color */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">لون التوهج والإطار:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={wasalny.stationMarkerGlowColor || '#059669'}
                    onChange={(e) => {
                      const updated = { ...wasalny, stationMarkerGlowColor: e.target.value };
                      setWasalny(updated);
                      handleSaveAll(updated);
                    }}
                    className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={wasalny.stationMarkerGlowColor || '#059669'}
                    onChange={(e) => {
                      const updated = { ...wasalny, stationMarkerGlowColor: e.target.value };
                      setWasalny(updated);
                      handleSaveAll(updated);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Live Marker Preview on Map Canvas */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center space-y-3">
                <span className="text-[10px] text-slate-400 font-bold block">معاينة حية للماركر على الخريطة:</span>
                
                <div className="relative inline-flex flex-col items-center justify-center p-3">
                  {/* Station Name Badge */}
                  <div className="bg-slate-900 text-white border border-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>محطة كارجاس شبرا النموذجية</span>
                  </div>

                  {/* Marker Body */}
                  <div
                    style={{
                      borderColor: wasalny.stationMarkerGlowColor || '#059669',
                    }}
                    className={`w-12 h-12 bg-white rounded-full p-1 border-3 shadow-2xl flex items-center justify-center overflow-hidden transition-transform hover:scale-110 ${
                      (wasalny.stationMarkerStyle || 'cargas_badge') === 'royal_pin'
                        ? 'bg-gradient-to-b from-slate-900 to-indigo-950 border-indigo-400'
                        : ''
                    }`}
                  >
                    {wasalny.stationUnifiedLogoUrl ? (
                      <img
                        src={wasalny.stationUnifiedLogoUrl}
                        alt="لوجو المعاينة"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-[9px]">
                        CARGAS
                      </div>
                    )}
                  </div>

                  {/* Pin tail */}
                  <div
                    style={{
                      borderTopColor: wasalny.stationMarkerGlowColor || '#059669',
                    }}
                    className="w-0 h-0 border-x-4 border-x-transparent border-t-6 -mt-0.5"
                  />
                </div>

                <p className="text-[10px] text-slate-400">
                  {wasalny.stationMarkerLogoMode === 'individual_station'
                    ? 'وضع اللوجو المستقل: تعرض كل محطة شعارها المحدد أدناه'
                    : 'وضع اللوجو المعمم: يظهر هذا الشعار على كافة المحطات'}
                </p>
              </div>
            </div>

            {/* Unified Logo Upload & Presets */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 lg:col-span-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>تخصيص اللوجو الموحد للمحطات أو اختيار شعار الشريك المعتمد</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ارفع لوجو مخصص أو اختر بنقرة واحدة من شعارات كارجاس والشركاء لتعميمه على كافة المحطات
                  </p>
                </div>

                {wasalny.stationUnifiedLogoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...wasalny, stationUnifiedLogoUrl: '' };
                      setWasalny(updated);
                      handleSaveAll(updated);
                    }}
                    className="text-rose-600 hover:text-rose-700 text-xs font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition"
                  >
                    استعادة شعار كارجاس الافتراضي ✕
                  </button>
                )}
              </div>

              {/* Upload Input */}
              <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 transition flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0">
                    {wasalny.stationUnifiedLogoUrl ? (
                      <img src={wasalny.stationUnifiedLogoUrl} alt="اللوجو الموحد" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-xl">⛽</div>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">رفع لوجو محطات كارجاس المخصص (PNG / JPG / WebP)</span>
                    <span className="text-[11px] text-slate-500">يتم ضغط الصورة تلقائياً للحفاظ على سرعة تحميل الخريطة</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    id="unifiedStationLogoInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUnifiedStationLogoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('unifiedStationLogoInput')?.click()}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>رفع لوجو المحطات 📤</span>
                  </button>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="space-y-3">
                <label className="block font-bold text-slate-800 text-xs">شعارات جاهزة للتعميم الفوري على جميع المحطات:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {PRESET_STATION_MAP_LOGOS.map((preset) => {
                    const isSelected = wasalny.stationUnifiedLogoUrl === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyPresetToAll(preset.url)}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-11 h-11 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-black text-slate-900 text-xs block truncate">{preset.title}</span>
                          <span className="text-[10px] text-emerald-700 font-bold block">{preset.badgeText}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Station Logos Table */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span>قائمة المحطات والتخصيص الفردي لكل محطة على حدة:</span>
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      يمكنك تحديد لوجو خاص لكل محطة بشكل مستقل عند الرغبة في تمييز محطات الشركاء (BP, Shell, Total)
                    </p>
                  </div>

                  {/* Filter and Search */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                      <input
                        type="text"
                        value={stationLogoSearch}
                        onChange={(e) => setStationLogoSearch(e.target.value)}
                        placeholder="بحث عن محطة..."
                        className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                    </div>

                    <select
                      value={stationFilterLogoMode}
                      onChange={(e) => setStationFilterLogoMode(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-xs font-bold"
                    >
                      <option value="all">كل المحطات ({stations.length})</option>
                      <option value="custom">لها لوجو مخصص</option>
                      <option value="default">اللوجو الافتراضي</option>
                    </select>
                  </div>
                </div>

                {/* Stations List */}
                <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {stations
                    .filter((st) => {
                      const q = stationLogoSearch.trim().toLowerCase();
                      const matchesSearch = !q || st.name.toLowerCase().includes(q) || st.city.toLowerCase().includes(q) || st.code.toLowerCase().includes(q);
                      const hasCustom = Boolean(wasalny.stationCustomLogos?.[st.id] || st.customLogoUrl);
                      if (stationFilterLogoMode === 'custom') return matchesSearch && hasCustom;
                      if (stationFilterLogoMode === 'default') return matchesSearch && !hasCustom;
                      return matchesSearch;
                    })
                    .map((st) => {
                      const customLogo = wasalny.stationCustomLogos?.[st.id] || st.customLogoUrl;
                      const activeLogo = wasalny.stationMarkerLogoMode === 'individual_station' && customLogo
                        ? customLogo
                        : (wasalny.stationUnifiedLogoUrl || customLogo);

                      return (
                        <div key={st.id} className="p-3 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Logo Thumbnail */}
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-0.5 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
                              {activeLogo ? (
                                <img src={activeLogo} alt={st.name} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-xs">⛽</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <span className="font-black text-slate-900 block truncate">{st.name}</span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                                <span>{st.code}</span>
                                <span>•</span>
                                <span>{st.city}</span>
                                {customLogo && (
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-sans font-bold">لوجو مخصص ✓</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Hidden file input for this station */}
                            <input
                              type="file"
                              id={`file-st-${st.id}`}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleStationCustomLogoUpload(st.id, e)}
                            />

                            {/* Upload Button */}
                            <button
                              type="button"
                              onClick={() => document.getElementById(`file-st-${st.id}`)?.click()}
                              className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 transition text-[11px] flex items-center gap-1"
                              title="رفع لوجو خاص لهذه المحطة"
                            >
                              <Upload className="w-3 h-3" />
                              <span>رفع لوجو</span>
                            </button>

                            {/* Quick Preset Dropdown */}
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleApplyPresetToStation(st.id, e.target.value);
                              }}
                              defaultValue=""
                              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold"
                            >
                              <option value="" disabled>اختر شريك...</option>
                              {PRESET_STATION_MAP_LOGOS.map((p) => (
                                <option key={p.id} value={p.url}>
                                  {p.badgeText}
                                </option>
                              ))}
                            </select>

                            {/* Reset Button */}
                            {customLogo && (
                              <button
                                type="button"
                                onClick={() => handleResetStationCustomLogo(st.id)}
                                className="text-rose-600 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200 transition"
                                title="إلغاء اللوجو المخصص والعودة للعام"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: Facility Filter Icons Under Map (التحكم في أيقونات خدمات المحطات الخمسة أسفل الخريطة) */}
      {/* ========================================================================= */}
      {activeTab === 'facility_filters' && (
        <div className="space-y-6 animate-in fade-in text-xs">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 rounded-3xl border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg shrink-0">
                  🏷️
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    التحكم في أيقونات خدمات محطات كارجاس أسفل الخريطة (الخمسة)
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    تحكم كامل لمدير النظام في مسميات، أيقونات، وأوصاف الخدمات الخمسة المعروضة للعميل أسفل الخريطة (تموين غاز ومركز زيوت - زيوت أسفل المظلة - مراكز تحويل وصيانة - مراكز فحص الاسطوانات - قريباً 2027) وتفعيل أو تعطيل أي منها فورياً.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetFacilityFiltersToDefault}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span>استعادة الافتراضي 🔄</span>
              </button>
            </div>
          </div>

          {/* Cards for each of the 5 Facility Icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminFacilityFilters.map((fac, idx) => (
              <div
                key={fac.id}
                className={`bg-white p-5 rounded-3xl border-2 transition shadow-sm space-y-4 ${
                  fac.isActive ? 'border-emerald-500/40' : 'border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <span className="text-2xl">{fac.iconText}</span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm">{fac.label}</h4>
                      <span className="font-mono text-[10px] text-slate-400">ID: {fac.key}</span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-700">
                      {fac.isActive ? 'مفعل' : 'مخفي'}
                    </span>
                    <input
                      type="checkbox"
                      checked={fac.isActive}
                      onChange={(e) => handleUpdateFacilityFilter(fac.id, { isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم الخدمة / النشاط المعروض:</label>
                    <input
                      type="text"
                      value={fac.label}
                      onChange={(e) => handleUpdateFacilityFilter(fac.id, { label: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block font-bold text-slate-700 mb-1">الأيقونة / الرمز:</label>
                      <input
                        type="text"
                        value={fac.iconText}
                        onChange={(e) => handleUpdateFacilityFilter(fac.id, { iconText: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-lg focus:bg-white focus:border-emerald-500 transition"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">شرح مختصر للخدمة:</label>
                      <input
                        type="text"
                        value={fac.description || ''}
                        onChange={(e) => handleUpdateFacilityFilter(fac.id, { description: e.target.value })}
                        placeholder="شرح الخدمة والمميزات..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:bg-white focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">معاينة شكل الزر للعميل:</span>
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-emerald-400 flex items-center gap-1.5 shadow-sm">
                    <span>{fac.iconText}</span>
                    <span className="font-bold text-xs">{fac.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: Access Control & Smart Delivery Lock (حصرية الخدمات والتوصيل لمدير النظام) */}
      {/* ========================================================================= */}
      {activeTab === 'delivery_access' && (
        <div className="space-y-6 animate-in fade-in text-xs">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 text-white p-6 rounded-3xl border border-rose-500/40 shadow-xl space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shadow-lg shrink-0">
                🔒
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  منظومة الحصرية والتحكم في إتاحة التوصيل الذكي للعملاء
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  قصر ظهور منظومة الخدمات والتعريفة والأسعار وفكرة تطبيق وصّلني على مدير النظام فقط، وعدم تفعيل فكرة التوصيل الذكي في صفحات العملاء إلا بقرار معتمد من مدير النظام.
                </p>
              </div>
            </div>
          </div>

          {/* Master Stage Mode Controller (التحكم الحصري لمدير النظام في مراحل إطلاق التطبيق للعملاء) */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border-2 border-indigo-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-800/50 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                  🎛️
                </div>
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <span>مراحل إطلاق وعرض التطبيق للعملاء (تحكم حصري لمدير النظام)</span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                      خفي تماماً عن العميل 🔒
                    </span>
                  </h4>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    يمكنك كمدير للنظام إخفاء أي نظام بالكامل فتختفي كافة الأيقونات الخاصة به من صفحة العميل تلقائياً بدون أن يشعر أو يعلم، للبدء بمرحلة الملاحة أولاً ثم إطلاق برنامج الولاء لاحقاً.
                  </p>
                </div>
              </div>

              <span className="bg-white/10 px-3 py-1 rounded-xl text-xs font-bold text-amber-300 border border-white/15 shrink-0">
                الوضع المفعل الآن: {
                  adminCustomerViewMode === 'navigation_only'
                    ? '🚗 الملاحة فقط (المرحلة 1)'
                    : adminCustomerViewMode === 'loyalty_only'
                    ? '🎁 الولاء والهدايا فقط (المرحلة 2)'
                    : '✨ المنظومة المدمجة الشاملة'
                }
              </span>
            </div>

            {/* 3 Interactive Mode Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Mode 1: Navigation Only */}
              <div
                onClick={() => handleUpdateCustomerViewMode('navigation_only')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition text-right flex flex-col justify-between gap-2.5 active:scale-95 ${
                  adminCustomerViewMode === 'navigation_only'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-300 text-white shadow-lg ring-2 ring-emerald-400/40'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🚗</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    adminCustomerViewMode === 'navigation_only' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {adminCustomerViewMode === 'navigation_only' ? '● نشط حالياً' : 'اختيار لتفعيل'}
                  </span>
                </div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm">المرحلة 1: تطبيق الملاحة وأقرب محطة "وصّلني" فقط</h5>
                  <p className="text-[11px] opacity-85 mt-1 leading-relaxed">
                    يظهر للعميل خريطة كارجاس والملاحة وأقرب محطة فقط. <strong className="text-amber-300">تختفي كافة أيقونات وتفاصيل برنامج الولاء وبنك الهدايا والكارت الذهبي تماماً وبدون أن يعلم العميل.</strong>
                  </p>
                </div>
              </div>

              {/* Mode 2: Loyalty Only */}
              <div
                onClick={() => handleUpdateCustomerViewMode('loyalty_only')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition text-right flex flex-col justify-between gap-2.5 active:scale-95 ${
                  adminCustomerViewMode === 'loyalty_only'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-300 text-slate-950 shadow-lg ring-2 ring-amber-400/40 font-black'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🎁</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    adminCustomerViewMode === 'loyalty_only' ? 'bg-slate-950 text-amber-300 font-black' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {adminCustomerViewMode === 'loyalty_only' ? '● نشط حالياً' : 'اختيار لتفعيل'}
                  </span>
                </div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm">المرحلة 2: برنامج الولاء وبنك الهدايا فقط</h5>
                  <p className="text-[11px] opacity-85 mt-1 leading-relaxed">
                    يظهر للعميل الكارت الذهبي وبنك الهدايا والنقاط التراكمية فقط. <strong className="text-amber-950">تختفي خريطة الملاحة وأقرب محطة تماماً.</strong>
                  </p>
                </div>
              </div>

              {/* Mode 3: Integrated Full Suite */}
              <div
                onClick={() => handleUpdateCustomerViewMode('all_integrated')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition text-right flex flex-col justify-between gap-2.5 active:scale-95 ${
                  adminCustomerViewMode === 'all_integrated'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-indigo-300 text-white shadow-lg ring-2 ring-indigo-400/40'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">✨</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    adminCustomerViewMode === 'all_integrated' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {adminCustomerViewMode === 'all_integrated' ? '● نشط حالياً' : 'اختيار لتفعيل'}
                  </span>
                </div>
                <div>
                  <h5 className="font-black text-xs sm:text-sm">المنظومة المدمجة الشاملة (الملاحة + الولاء)</h5>
                  <p className="text-[11px] opacity-85 mt-1 leading-relaxed">
                    إتاحة خريطة الملاحة "وصّلني" وأقرب محطة مع كارت الولاء وبنك الهدايا في آن واحد بشكل مدمج ومتناسق.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Rule 1: Services & Tariffs Exclusivity */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-black text-sm text-slate-900">
                    حصر منظومة الخدمات والتعريفة على مدير النظام
                  </h4>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  wasalny.showServicesAndTariffsOnlyToAdmin !== false
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {wasalny.showServicesAndTariffsOnlyToAdmin !== false ? '● مقتصرة على المدير (الوضع الآمن)' : 'مفتوحة للجميع'}
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed">
                يضمن هذا الخيار إخفاء قوائم الخدمات، تسعيرة الكيلومتر، فتح العداد، عمولة الرحلات، وجداول الأسطول التجاري عن واجهات وقوائم السائقين والعملاء، بحيث يقتصر دور تطبيق الخريطة في واجهة العميل على <strong>الملاحة النقية وتوجيه المسار لأقرب محطة غاز كارجاس (طريقنا واحد)</strong> دون إبراز أنشطة النقل التجاري.
              </p>

              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 cursor-pointer transition">
                <div>
                  <span className="font-black text-slate-900 block text-xs">
                    قصر ظهور منظومة الخدمات والتعريفة والأسعار وفكرة وصّلني على مدير النظام فقط
                  </span>
                  <span className="text-[11px] text-slate-500">
                    إخفاء كافة التسعيرات والخدمات من واجهات العملاء وحفظ سريتها
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={wasalny.showServicesAndTariffsOnlyToAdmin !== false}
                  onChange={(e) => {
                    const updated = {
                      ...wasalny,
                      showServicesAndTariffsOnlyToAdmin: e.target.checked,
                    };
                    setWasalny(updated);
                    handleSaveAll(updated);
                  }}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
              </label>

              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 text-[11px] text-indigo-900 space-y-1">
                <span className="font-black block">💡 الجدوى التجارية والأمنية:</span>
                <p>
                  عملاء المحطة وسائقو التاكسي والملاكي يستخدمون التطبيق لجمع نقاط الولاء والملاحة السريعة لمحطات الغاز. حصر تفاصيل منظومة الخدمات والأسعار لمدير النظام يحفظ خصوصية خطط التوسع التجاري لشركة كارجاس وعزوتي.
                </p>
              </div>
            </div>

            {/* Rule 2: Smart Delivery Access Control */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-600" />
                  <h4 className="font-black text-sm text-slate-900">
                    تفعيل فكرة التوصيل الذكي في صفحات العملاء
                  </h4>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  wasalny.enableSmartDeliveryForCustomers
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {wasalny.enableSmartDeliveryForCustomers ? '🟢 مفعل في صفحات العملاء' : '🔴 موقوف ومقفل لمدير النظام'}
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed">
                بموجب القاعدة الصارمة: <strong>لا تفعل فكرة التوصيل الذكي وطلب الرحلات أو أسطوانات الغاز فى صفحات العملاء إلا من خلال مدير النظام</strong>. الوضع الافتراضي هو الإيقاف التام؛ ولا يتاح خيار طلب التوصيل أو المشوار للعميل إلا إذا قمت بتمكينه يدوياً هنا.
              </p>

              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 cursor-pointer transition">
                <div>
                  <span className="font-black text-slate-900 block text-xs">
                    تفعيل فكرة التوصيل الذكي في صفحات العملاء (Smart Delivery & Ride Dispatch)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    تمكين العملاء من طلب توصيل أسطوانات غاز أو مشاوير تاكسي ذكية عبر وصّلني
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={wasalny.enableSmartDeliveryForCustomers === true}
                  onChange={(e) => {
                    const updated = {
                      ...wasalny,
                      enableSmartDeliveryForCustomers: e.target.checked,
                    };
                    setWasalny(updated);
                    handleSaveAll(updated);
                  }}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
              </label>

              {/* Status Alert */}
              <div className={`p-3.5 rounded-2xl border text-xs font-bold ${
                wasalny.enableSmartDeliveryForCustomers
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                {wasalny.enableSmartDeliveryForCustomers ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تم تفعيل خدمة التوصيل الذكي في صفحات العملاء بموافقة مدير النظام.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>خدمة التوصيل الذكي موقوفة عن العملاء؛ صفحات العميل تركز حصرياً على ملاحة محطات كارجاس.</span>
                  </div>
                )}
              </div>

              {/* Customer Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رسالة الإشعار التوضيحية للعميل عند الاستفسار عن التوصيل:
                </label>
                <textarea
                  rows={2}
                  value={wasalny.smartDeliveryNoteForCustomers || ''}
                  onChange={(e) => {
                    const updated = { ...wasalny, smartDeliveryNoteForCustomers: e.target.value };
                    setWasalny(updated);
                  }}
                  placeholder="خدمة التوصيل الذكي تحت التطوير والإطلاق التجريبي عبر إدارة كارجاس..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSaveAll()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 rounded-xl transition text-xs shadow-md"
              >
                حفظ واعتماد صلاحيات التوصيل الذكي 💾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Services & Tariffs */}
      {/* ========================================================================= */}
      {activeTab === 'services_tariffs' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Security & Access Restriction Notice */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-950 font-bold">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="block font-black">منظومة الخدمات والتعريفة محصورة حصرياً بمدير النظام 🛡️</span>
              <span className="font-normal text-[11px] text-amber-900 block mt-0.5">
                كافة الخدمات والتسعيرات أدناه مخفية تماماً عن صفحات وحسابات العملاء، ومقتصرة على لوحة تحكم الإدارة المركزية لكارجاس وعزوتي.
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>باقة خدمات تطبيق وصّلني والتعريفة الاقتصادية (مقتصرة على المدير)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تحكم كامل في فتح العداد، سعر الكيلومتر، نسبة العمولة، وتفعيل أو إيقاف أي خدمة
                </p>
              </div>

              <button
                onClick={() => setIsAddServiceModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة خدمة جديدة</span>
              </button>
            </div>

            {/* Services Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(wasalny.services || []).map((srv) => (
                <div
                  key={srv.id}
                  className={`bg-white rounded-2xl border p-4 space-y-3 transition flex flex-col justify-between shadow-2xs ${
                    srv.isActive ? 'border-slate-200 hover:border-emerald-400' : 'border-rose-200 bg-rose-50/20 opacity-75'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                          {srv.icon === 'Truck' ? '🚚' : srv.icon === 'LifeBuoy' ? '🛟' : srv.icon === 'Wrench' ? '🔧' : srv.icon === 'Users' ? '👥' : '🚖'}
                        </span>
                        <div>
                          <h4 className="font-black text-slate-900 text-xs">{srv.name}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${srv.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {srv.isActive ? 'نشطة ومتاحة' : 'موقوفة'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleService(srv.id)}
                          className={`p-1 rounded-lg text-xs font-bold ${srv.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          title={srv.isActive ? 'إيقاف الخدمة' : 'تفعيل الخدمة'}
                        >
                          {srv.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                          title="حذف الخدمة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  {/* Tariff Details */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs border border-slate-100 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">فتح العداد:</span>
                      <span className="font-black text-slate-900">{srv.baseFareEgp} ج</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">سعر الكيلو:</span>
                      <span className="font-black text-emerald-700">{srv.perKmRateEgp} ج/كم</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">الحد الأدنى:</span>
                      <span className="font-black text-slate-900">{srv.minFareEgp} ج</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">عمولة التطبيق:</span>
                      <span className="font-black text-blue-700">{srv.commissionPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Captains & Fleet Management */}
      {/* ========================================================================= */}
      {activeTab === 'captains_fleet' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>إدارة كباتن وأسطول سيارات وصلني ({wasalny.captains?.length || 0} كابتن معتمد)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  بيانات الكباتن، لوحات السيارات، أرقام التواصل بالواتساب، والتقييمات
                </p>
              </div>

              <button
                onClick={() => setIsAddCaptainModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ تسجيل كابتن جديد</span>
              </button>
            </div>

            {/* Captains Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">الكابتن والمدينة</th>
                    <th className="p-3">رقم اللوحة والسيارة</th>
                    <th className="p-3">الهاتف والواتساب</th>
                    <th className="p-3 text-center">التقييم</th>
                    <th className="p-3 text-center">الرحلات المنفذة</th>
                    <th className="p-3 text-center">إجمالي الأرباح</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(wasalny.captains || []).map((cap) => (
                    <tr key={cap.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{cap.name}</div>
                        <div className="text-[10px] text-slate-500">{cap.city} • انضم {cap.joinedDate}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[11px]">
                          {cap.carPlate}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{cap.carModel}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        <div>{cap.phone}</div>
                        <a
                          href={`https://wa.me/2${cap.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `مرحباً كابتن ${cap.name} من إدارة تطبيق وصّلني ومنظومة كارجاس.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold inline-flex items-center gap-1 mt-0.5"
                        >
                          <span>واتساب 💬</span>
                        </a>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{cap.rating}</span>
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {cap.totalTrips} رحلة
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700">
                        {cap.totalEarningsEgp.toLocaleString()} ج
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cap.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {cap.status === 'active' ? 'نشط 🟢' : 'موقوف 🔴'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCaptainStatus(cap.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition ${
                              cap.status === 'active' ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={cap.status === 'active' ? 'إيقاف حساب الكابتن' : 'تنشيط الكابتن'}
                          >
                            {cap.status === 'active' ? 'إيقاف' : 'تنشيط'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCaptain(cap.id, cap.name)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                            title="حذف الكابتن"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: Cargas Loyalty Sync */}
      {/* ========================================================================= */}
      {activeTab === 'cargas_loyalty' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-xs animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>تكامل برنامج ولاء كارجاس: تحويل نقاط الغاز لخصومات رحلات وصّلني</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ميزة حصرية لرواد كارجاس: استبدال نقاط التموين المكتسبة برصيد مشاوير مجانية وتخفيضات فورية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-black text-slate-900 block text-xs">تفعيل خصم نقاط كارجاس في تطبيق وصلني</span>
                  <span className="text-[11px] text-slate-500">تمكين الركاب من دفع قيمة الرحلة أو جزء منها بنقاطهم</span>
                </div>
                <input
                  type="checkbox"
                  checked={wasalny.pointsDiscountEnabled ?? true}
                  onChange={(e) => setWasalny({ ...wasalny, pointsDiscountEnabled: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
              </label>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">قيمة استبدال النقطة بالجنيه في وصلني:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    value={wasalny.pointsToEgpDiscountRate ?? 0.5}
                    onChange={(e) => setWasalny({ ...wasalny, pointsToEgpDiscountRate: Number(e.target.value) })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-emerald-800"
                  />
                  <span className="text-slate-500 text-xs">جنية لكل نقطة (مثال: 100 نقطة = 50 ج)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الحد الأقصى للخصم بالنقاط للرحلة الواحدة (جنية):</label>
                <input
                  type="number"
                  value={wasalny.maxDiscountPerTripEgp ?? 50}
                  onChange={(e) => setWasalny({ ...wasalny, maxDiscountPerTripEgp: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">حد نقاط المشوار المجاني الكامل (Free Ride Threshold):</label>
                <input
                  type="number"
                  value={wasalny.freeRidePointsThreshold ?? 100}
                  onChange={(e) => setWasalny({ ...wasalny, freeRidePointsThreshold: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>
            </div>

            {/* Loyalty Integration Live Explainer */}
            <div className="bg-gradient-to-br from-amber-50 to-emerald-50 p-5 rounded-2xl border border-amber-200 space-y-3">
              <h4 className="font-black text-amber-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>كيف يعمل التكامل بين كارجاس ووصّلني؟</span>
              </h4>
              <ul className="space-y-2 text-slate-700 text-xs list-disc list-inside leading-relaxed">
                <li>السائق يمون غاز طبيعي في أي محطة كارجاس ويكتسب نقاط ولاء.</li>
                <li>يفتح تطبيق وصّلني لطلب تاكسي أو طلب أسطوانة غاز أو إنقاذ SOS.</li>
                <li>يتم خصم {wasalny.pointsToEgpDiscountRate || 0.5} جنيه لكل نقطة متاحة من حسابه.</li>
                <li>يحصل الكابتن على كامل أجرته، وتقوم كارجاس بتسوية فارق النقاط من موازنة الترويج.</li>
              </ul>
              <button
                onClick={() => handleSaveAll()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl transition text-xs shadow-sm"
              >
                حفظ إعدادات تكامل النقاط 💾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: Routing, GPS & Stations */}
      {/* ========================================================================= */}
      {activeTab === 'routing_gps' && (
        <div className="space-y-6 animate-in fade-in text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Guidance & Voice */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>الصوت المرشد والإرشاد الصوتي في وصّلني</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اختيار نبرة الصوت المرشد:</label>
                  <select
                    value={wasalny.voiceGuidance}
                    onChange={(e) => setWasalny({ ...wasalny, voiceGuidance: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="wadah_egyptian">🔊 صوت وضاح المصري (ودود، ابن بلد، مجاني) [موصى به]</option>
                    <option value="moen_advisor">🎙️ صوت مُعِين الاستشاري الذكي</option>
                    <option value="standard_arabic">📢 لغة عربية رسمية</option>
                    <option value="silent">🔇 بدون إرشاد صوتي</option>
                  </select>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950 block">تجربة نبرة صوت وضاح المصري</span>
                    <span className="text-[10px] text-emerald-800">صوت محلي مصري ودود يرحب بالعميل</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestWadahVoice}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition text-xs"
                  >
                    تجربة الصوت 🔊
                  </button>
                </div>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">التشغيل الصوتي التلقائي فور فتح وصلني</span>
                    <span className="text-[11px] text-slate-500">يرشد السائق فوراً دون الحاجة للمس الشاشة</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wasalny.autoVoiceOnOpen}
                    onChange={(e) => setWasalny({ ...wasalny, autoVoiceOnOpen: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded"
                  />
                </label>
              </div>
            </div>

            {/* GPS & Radar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>إعدادات الملاحة ورادار الاقتراب من المحطات</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">استراتيجية توجيه السائقين:</label>
                  <select
                    value={wasalny.targetStationMode}
                    onChange={(e) => setWasalny({ ...wasalny, targetStationMode: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="auto_gps">🛰️ أقرب محطة حقيقية تلقائياً عبر GPS</option>
                    <option value="featured_station">⭐ محطة مستهدفة محددة لدعم مبيعاتها</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مسافة رادار تنبيه الوصول:</label>
                  <select
                    value={wasalny.arrivalAlertDistanceMeters}
                    onChange={(e) => setWasalny({ ...wasalny, arrivalAlertDistanceMeters: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono"
                  >
                    <option value={50}>50 متر (محيط المضخة)</option>
                    <option value={100}>100 متر (مدخل المحطة)</option>
                    <option value={150}>150 متر (قياسي) [موصى به]</option>
                    <option value={300}>300 متر (الشارع المؤدي)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مزود الملاحة الافتراضي:</label>
                  <select
                    value={wasalny.navigationProvider}
                    onChange={(e) => setWasalny({ ...wasalny, navigationProvider: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="google_maps">فتح خرائط جوجل مباشرة (Google Maps)</option>
                    <option value="in_app">الخريطة التفاعلية داخل التطبيق</option>
                    <option value="ask_user">سؤال السائق وتخييره</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: Interactive Wasalny Mobile Simulator */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          
          {/* Simulator Settings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs lg:col-span-1">
            <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>معايير تجربة المشوار في المحاكي</span>
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">اختر الخدمة للتجربة:</label>
              <select
                value={simSelectedService}
                onChange={(e) => setSimSelectedService(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
              >
                {(wasalny.services || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.perKmRateEgp} ج/كم)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">مسافة المشوار التقديرية (كم):</label>
              <input
                type="number"
                min="1"
                max="100"
                value={simKm}
                onChange={(e) => setSimKm(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">دقائق الانتظار أو الزحام:</label>
              <input
                type="number"
                min="0"
                max="60"
                value={simWaitMins}
                onChange={(e) => setSimWaitMins(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رصيد نقاط العميل للتجربة:</label>
              <input
                type="number"
                value={simDriverPoints}
                onChange={(e) => setSimDriverPoints(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-amber-700"
              />
            </div>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <span className="font-bold text-slate-800">تطبيق خصم نقاط كارجاس</span>
              <input
                type="checkbox"
                checked={simApplyPoints}
                onChange={(e) => setSimApplyPoints(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>

            {/* Fare Breakdown */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 font-mono">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>الأجرة الأساسية:</span>
                <span>{baseTripCost} ج</span>
              </div>
              {pointsDiscountEgp > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-400">
                  <span>خصم نقاط كارجاس:</span>
                  <span>- {pointsDiscountEgp} ج</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-2 text-amber-400">
                <span>المبلغ المطلوب من العميل:</span>
                <span>{finalSimTripCost} ج</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                <span>صافي الكابتن: {captainNetEgp} ج</span>
                <span>عمولة وصلني: {companyCommissionEgp} ج</span>
              </div>
            </div>
          </div>

          {/* Smartphone Mockup */}
          <div className="lg:col-span-2 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-950 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 relative">
              {/* Speaker notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

              {/* Screen Area */}
              <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 text-white min-h-[520px] flex flex-col justify-between p-4 space-y-4">
                
                {/* Simulated Top App Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 flex items-center justify-center bg-slate-800 border border-emerald-500 overflow-hidden ${
                      wasalny.wasalnyLogoShape === 'circle' ? 'rounded-full' : wasalny.wasalnyLogoShape === 'square' ? 'rounded-md' : 'rounded-xl'
                    }`}>
                      {wasalny.wasalnyLogoUrl ? (
                        <img src={wasalny.wasalnyLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span>🚗</span>
                      )}
                    </div>
                    <div>
                      <span className="font-black text-xs block text-white">{wasalny.appName || 'وصّلني'}</span>
                      <span className="text-[9px] text-emerald-400">غاز طبيعي • موفر وبيئي</span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                    رصيدك: {simDriverPoints} نقطة
                  </span>
                </div>

                {/* Simulated Map Area */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-center relative overflow-hidden min-h-[160px] flex flex-col items-center justify-center">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="relative z-10 space-y-1">
                    <span className="text-3xl animate-bounce inline-block">🚖</span>
                    <span className="font-bold text-xs block text-emerald-300">أقرب كابتن يبعد 3 دقائق عنك</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      كابتن / أحمد فوزي • شيري أريزو (غاز)
                    </span>
                  </div>
                </div>

                {/* Selected Service Bar */}
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚖</span>
                    <div>
                      <span className="font-bold text-xs block">{activeSimService?.name || 'مشاوير الركاب'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">المسافة: {simKm} كم</span>
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-black text-emerald-400 text-sm block">{finalSimTripCost} ج</span>
                    {pointsDiscountEgp > 0 && (
                      <span className="text-[9px] text-amber-400 line-through">{baseTripCost} ج</span>
                    )}
                  </div>
                </div>

                {/* Simulated Request Button */}
                <button
                  type="button"
                  onClick={() => alert(`🚀 تم محاكاة طلب رحلة بنجاح!\n• الخدمة: ${activeSimService?.name}\n• القيمة: ${finalSimTripCost} ج\n• خصم النقاط: ${pointsDiscountEgp} ج`)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 rounded-2xl transition shadow-lg text-xs flex items-center justify-center gap-2"
                >
                  <span>طلب الرحلة الآن مع كارجاس 🚀</span>
                </button>
              </div>

              {/* Bottom home indicator */}
              <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Add New Captain */}
      {/* ========================================================================= */}
      {isAddCaptainModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>تسجيل كابتن جديد في أسطول وصّلني</span>
              </h3>
              <button
                onClick={() => setIsAddCaptainModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCaptain} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الكابتن الثلاثي:</label>
                <input
                  type="text"
                  required
                  value={newCapName}
                  onChange={(e) => setNewCapName(e.target.value)}
                  placeholder="كابتن / محمد إبراهيم حسن"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف (الواتساب):</label>
                <input
                  type="tel"
                  required
                  value={newCapPhone}
                  onChange={(e) => setNewCapPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم اللوحة المعدنية:</label>
                <input
                  type="text"
                  required
                  value={newCapPlate}
                  onChange={(e) => setNewCapPlate(e.target.value)}
                  placeholder="س ف ر 1 2 3 4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">موديل ونوع السيارة:</label>
                <input
                  type="text"
                  required
                  value={newCapModel}
                  onChange={(e) => setNewCapModel(e.target.value)}
                  placeholder="شيري أريزو 5 (غاز طبيعي)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المحافظة والمنطقة:</label>
                <input
                  type="text"
                  required
                  value={newCapCity}
                  onChange={(e) => setNewCapCity(e.target.value)}
                  placeholder="القاهرة - شبرا"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCaptainModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded-xl transition shadow-md"
                >
                  تسجيل واعتماد الكابتن 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Add New Service */}
      {/* ========================================================================= */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>إضافة خدمة جديدة لتطبيق وصّلني</span>
              </h3>
              <button
                onClick={() => setIsAddServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الخدمة:</label>
                <input
                  type="text"
                  required
                  value={newSrvName}
                  onChange={(e) => setNewSrvName(e.target.value)}
                  placeholder="مثال: توصيل غاز سريع للشركات"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شرح الخدمة ومزاياها:</label>
                <textarea
                  rows={2}
                  value={newSrvDesc}
                  onChange={(e) => setNewSrvDesc(e.target.value)}
                  placeholder="اكتب شرحاً موجزاً..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">فتح العداد (ج):</label>
                  <input
                    type="number"
                    value={newSrvBase}
                    onChange={(e) => setNewSrvBase(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر الكيلو (ج):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSrvPerKm}
                    onChange={(e) => setNewSrvPerKm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحد الأدنى (ج):</label>
                  <input
                    type="number"
                    value={newSrvMin}
                    onChange={(e) => setNewSrvMin(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نسبة العمولة (%):</label>
                  <input
                    type="number"
                    value={newSrvCommission}
                    onChange={(e) => setNewSrvCommission(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded-xl transition shadow-md"
                >
                  إضافة الخدمة فوراً 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
