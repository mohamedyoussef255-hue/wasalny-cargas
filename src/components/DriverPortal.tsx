import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Fuel,
  Sparkles,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  Phone,
  Hash,
  ChevronRight,
  TrendingUp,
  Droplet,
  Zap,
  Thermometer,
  Gauge,
  ShieldCheck,
  Edit3,
  Share2,
  Maximize2,
  X,
  Gift,
  Check,
  MapPin,
  Star,
  MessageSquare,
  Repeat,
  Navigation,
  Home,
  ArrowRight,
  CreditCard,
  Headphones,
  Sliders,
  Coins,
  ChevronLeft,
  Trophy,
  ChevronDown,
  Menu,
  LayoutGrid,
  Compass,
  Volume2,
} from 'lucide-react';
import {
  AppConfig,
  DriverProfile,
  FuelingTransaction,
  RewardItem,
  RewardRedemption,
  MaintenanceItem,
  CargasStationLocation,
  TechnicianCrewMember,
} from '../types';
import { generateQrDataUrl, encodeDriverQrData, encodeRewardRedemptionQrData } from '../services/qrService';
import {
  saveDriverProfile,
  getRedemptions,
  saveRedemptions,
  getDriverStationAndPumpFuelingCounts,
  calculateDistanceKm,
  DEFAULT_DRIVER_SECTIONS_ORDER,
} from '../services/storageService';
import { CargasStationsMap } from './CargasStationsMap';
import { CargasNavApp } from '../navigation/CargasNavApp';
import { CustomerFeedbackModal } from './CustomerFeedbackModal';

interface DriverPortalProps {
  config: AppConfig;
  driver: DriverProfile;
  rewards: RewardItem[];
  transactions: FuelingTransaction[];
  stations: CargasStationLocation[];
  crew: TechnicianCrewMember[];
  onUpdateDriver: (driver: DriverProfile) => void;
  onRefreshData: () => void;
}

export type DriverPageView = 'home' | 'map' | 'loyalty' | 'maintenance' | 'history' | 'feedback' | 'complaints';

export const DriverPortal: React.FC<DriverPortalProps> = ({
  config,
  driver,
  rewards,
  transactions,
  stations,
  crew,
  onUpdateDriver,
  onRefreshData,
}) => {
  const [activePage, setActivePage] = useState<DriverPageView>('home');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackInitialTab, setFeedbackInitialTab] = useState<'rating' | 'complaint'>('rating');
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [redeemedAlert, setRedeemedAlert] = useState<RewardRedemption | null>(null);

  // Free Meters Redemption QR State
  const [selectedRedemptionForQr, setSelectedRedemptionForQr] = useState<RewardRedemption | null>(null);
  const [redemptionQrDataUrl, setRedemptionQrDataUrl] = useState<string>('');

  // Station Navigation Modal State (Wasalny Hero Popup)
  const [isStationNavModalOpen, setIsStationNavModalOpen] = useState(false);

  // GPS Auto-detected nearest station state
  const [driverGpsLocation, setDriverGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsNearestStation, setGpsNearestStation] = useState<CargasStationLocation | null>(null);
  const [gpsDistanceKm, setGpsDistanceKm] = useState<number | null>(null);

  // Auto-detect GPS nearest station for driver
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverGpsLocation(coords);
        if (stations && stations.length > 0) {
          let closest = stations[0];
          let minD = calculateDistanceKm(coords.lat, coords.lng, closest.latitude, closest.longitude);
          for (let i = 1; i < stations.length; i++) {
            const d = calculateDistanceKm(coords.lat, coords.lng, stations[i].latitude, stations[i].longitude);
            if (d < minD) {
              minD = d;
              closest = stations[i];
            }
          }
          setGpsNearestStation(closest);
          setGpsDistanceKm(Number(minD.toFixed(1)));
        }
      },
      (err) => {
        console.warn('Driver GPS Geolocation:', err);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  }, [stations]);

  // Detected station name and stats
  const activeDetectedStation = gpsNearestStation || stations[0] || null;
  const activeStationName = activeDetectedStation ? activeDetectedStation.name : config.stationName;

  // Edit form state
  const [editName, setEditName] = useState(driver.name);
  const [editPhone, setEditPhone] = useState(driver.phone);
  const [editPlate, setEditPlate] = useState(driver.carPlate);
  const [editModel, setEditModel] = useState(driver.carModel);
  const [editOdo, setEditOdo] = useState(driver.odometerKm);
  const [editCapacity, setEditCapacity] = useState(driver.cngCylinderCapacity || 70);

  // Fueling counts based on GPS nearest station
  const currentStationCounts = getDriverStationAndPumpFuelingCounts(
    transactions,
    driver.id,
    activeStationName,
    transactions[0]?.pumpNumber || 1
  );

  // Egyptian Wadah Voice Guidance Helper
  const speakWadahVoice = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayWadahGuidance = () => {
    const target = activeDetectedStation || stations[0];
    if (!target) return;
    const dist = gpsDistanceKm !== null ? `على بُعد ${gpsDistanceKm} كيلو منك، ` : '';
    const crowd = target.crowdLevel ? `وحالة الزحام دلوقتي ${target.crowdLevel}، ` : 'والمحطة رايقة، ';
    const speech = `يا هلا بيك يا باشا! أنا وضاح، معاك على الطريق... أقرب محطة كارجاس ليك هي محطة ${target.name}، ${dist}${crowd}اضغط على تكبير الخريطة ووصّلني ويلا بينا نتحرك سوا على الملاحة!`;
    speakWadahVoice(speech);
  };

  // Active promotional campaigns for carousel banner
  const activeCampaigns = (config.promotionalCampaigns || []).filter((c) => c.isActive);
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);

  useEffect(() => {
    if (activeCampaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentCampaignIndex((prev) => (prev + 1) % activeCampaigns.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [activeCampaigns.length]);

  useEffect(() => {
    const textToEncode = encodeDriverQrData({
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      carPlate: driver.carPlate,
      carModel: driver.carModel,
      cngCylinderCapacity: driver.cngCylinderCapacity,
      odometerKm: driver.odometerKm,
    });

    generateQrDataUrl(textToEncode, { width: 320 }).then((url) => {
      setQrDataUrl(url);
    });

    setRedemptions(getRedemptions().filter((r) => r.driverId === driver.id));
  }, [driver]);

  // Generate QR for Free Meters Redemption Voucher
  useEffect(() => {
    if (!selectedRedemptionForQr) {
      setRedemptionQrDataUrl('');
      return;
    }
    const qrPayload = encodeRewardRedemptionQrData({
      id: selectedRedemptionForQr.id,
      redemptionCode: selectedRedemptionForQr.redemptionCode,
      rewardId: selectedRedemptionForQr.rewardId,
      rewardTitle: selectedRedemptionForQr.rewardTitle,
      freeMeters: selectedRedemptionForQr.freeMeters || 10,
      driverId: selectedRedemptionForQr.driverId,
      driverName: selectedRedemptionForQr.driverName,
      carPlate: selectedRedemptionForQr.carPlate || driver.carPlate,
      carModel: selectedRedemptionForQr.carModel || driver.carModel,
      pointsSpent: selectedRedemptionForQr.pointsSpent,
    });

    generateQrDataUrl(qrPayload, { width: 340 }).then((url) => {
      setRedemptionQrDataUrl(url);
    });
  }, [selectedRedemptionForQr, driver]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DriverProfile = {
      ...driver,
      name: editName,
      phone: editPhone,
      carPlate: editPlate,
      carModel: editModel,
      odometerKm: Number(editOdo),
      cngCylinderCapacity: Number(editCapacity),
    };
    onUpdateDriver(updated);
    saveDriverProfile(updated);
    setIsEditProfileOpen(false);
  };

  const handleRedeemReward = (reward: RewardItem) => {
    if (driver.points < reward.pointsCost) {
      alert(`رصيد نقاطك (${driver.points}) لا يكفي لاستبدال هذه المكافأة (${reward.pointsCost} نقطة).`);
      return;
    }

    if (!confirm(`هل ترغب في استبدال ${reward.pointsCost} نقطة بـ "${reward.title}"؟`)) {
      return;
    }

    const isFreeMeters = reward.category === 'meters' || reward.title.includes('متر') || reward.title.includes('أمتار');
    const freeMetersCount = reward.freeMetersEquivalent || (isFreeMeters ? Math.max(5, Math.round(reward.pointsCost / 10)) : 0);
    const gasPrice = config.gasPricePerMeter || 13;
    const calculatedEgp = freeMetersCount > 0 ? freeMetersCount * gasPrice : (reward.estimatedEgpValue || reward.pointsCost * 0.5);

    const redemptionCode = 'VOUCH-' + Math.floor(100000 + Math.random() * 900000);
    const newRedemption: RewardRedemption = {
      id: 'RED-' + Date.now(),
      rewardId: reward.id,
      rewardTitle: reward.title,
      driverId: driver.id,
      driverName: driver.name,
      carPlate: driver.carPlate,
      carModel: driver.carModel,
      pointsSpent: reward.pointsCost,
      redemptionCode,
      createdAt: new Date().toISOString(),
      isUsed: false,
      category: reward.category,
      freeMeters: freeMetersCount,
      calculatedEgpValue: calculatedEgp,
    };

    const updatedDriver: DriverProfile = {
      ...driver,
      points: driver.points - reward.pointsCost,
    };

    onUpdateDriver(updatedDriver);
    saveDriverProfile(updatedDriver);

    const allRedemptions = [newRedemption, ...getRedemptions()];
    saveRedemptions(allRedemptions);
    setRedemptions(allRedemptions.filter((r) => r.driverId === driver.id));
    setRedeemedAlert(newRedemption);
    setSelectedRedemptionForQr(newRedemption);

    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#fbbf24', '#3b82f6'],
      });
    } catch (e) {}
  };

  const handleResetMaintenance = (item: MaintenanceItem) => {
    if (!confirm(`هل قمت بإجراء صيانة "${item.name}" وتود تصفير العداد الحالي؟`)) return;

    const currentOdo = driver.odometerKm;
    const updatedSchedule = driver.maintenanceSchedule.map((sched) => {
      if (sched.id === item.id) {
        return {
          ...sched,
          lastKm: currentOdo,
          nextDueKm: currentOdo + sched.intervalKm,
          status: 'ok' as const,
        };
      }
      return sched;
    });

    const updated: DriverProfile = {
      ...driver,
      maintenanceSchedule: updatedSchedule,
    };

    onUpdateDriver(updated);
    saveDriverProfile(updated);
  };

  const renderMaintenanceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Droplet':
        return <Droplet className="w-5 h-5 text-amber-500" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-indigo-500" />;
      case 'Thermometer':
        return <Thermometer className="w-5 h-5 text-rose-500" />;
      case 'Gauge':
        return <Gauge className="w-5 h-5 text-emerald-500" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-blue-500" />;
    }
  };

  const v = config.visibility.driver;

  // Sidebar navigation menu items
  const navMenuItems = [
    {
      id: 'home' as DriverPageView,
      label: 'الرئيسية والباركود',
      sub: 'كود التموين والسيارة',
      icon: <Home className="w-4 h-4" />,
      visible: true,
    },
    {
      id: 'map' as DriverPageView,
      label: 'أقرب محطة وخريطة كارجاس',
      sub: 'توجيه الملاحة "وصّلني"',
      icon: <MapPin className="w-4 h-4" />,
      visible: v.showNearestStationMap,
      badge: 'مباشر',
    },
    {
      id: 'loyalty' as DriverPageView,
      label: 'كارت الولاء وبنك الهدايا',
      sub: `${driver.points} نقطة متاحة`,
      icon: <CreditCard className="w-4 h-4" />,
      visible: v.showGoldenCard || v.showRewardsBank,
    },
    {
      id: 'maintenance' as DriverPageView,
      label: 'جدول الصيانة الذكي',
      sub: 'الزيت، البوجيهات، الفلاتر',
      icon: <Calendar className="w-4 h-4" />,
      visible: v.showMaintenanceSchedule,
    },
    {
      id: 'history' as DriverPageView,
      label: 'سجل التموينات وتكرار الطلمبات',
      sub: `${transactions.length} تفويلة مسجلة`,
      icon: <Clock className="w-4 h-4" />,
      visible: v.showFuelingHistory,
    },
    {
      id: 'feedback' as DriverPageView,
      label: 'تقييم الفني والخدمة',
      sub: 'حسن المعاملة وسرعة التموين ⭐',
      icon: <Star className="w-4 h-4 text-amber-500" />,
      visible: v.showServiceRating,
    },
    {
      id: 'maintenance' as DriverPageView, // Used for routing complaints in handler
      label: 'صندوق الشكاوى والمقترحات',
      sub: 'تواصل مباشر مع الإدارة 19058 📨',
      icon: <MessageSquare className="w-4 h-4 text-rose-500" />,
      visible: v.showComplaintsBox,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Bars: Only shown when NOT in enlarged map view */}
      {activePage !== 'map' && (
        <>
          {/* 1. Station Repeat Fueling Stats Bar - Directly ABOVE Welcome Banner (GPS-driven) */}
          {v.showFuelingCountStats && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg border border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                  ⛽
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      المحطة الأقرب لموقعك (رصد تلقائي عبر GPS 🛰️):
                    </span>
                    {gpsDistanceKm !== null && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        تبعد عنك {gpsDistanceKm} كم
                      </span>
                    )}
                    {activeDetectedStation?.crowdLevel && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        حالة الزحام: {activeDetectedStation.crowdLevel} 🟢
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-black text-slate-100 mt-0.5">
                    {activeStationName} {activeDetectedStation?.city ? `(${activeDetectedStation.city})` : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-700">
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 block font-normal">مرات تموينك من هذه المحطة:</span>
                  <span className="text-sm sm:text-base font-black font-mono text-white">
                    {currentStationCounts.stationCount} مرات تموين
                  </span>
                </div>

                <div className="text-right border-r border-slate-700 pr-4">
                  <span className="text-[10px] text-amber-400 block font-normal">مرات تموينك من نفس الطلمبة:</span>
                  <span className="text-sm sm:text-base font-black font-mono text-white">
                    {currentStationCounts.pumpCount} مرات
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Top Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              {/* Driver greeting info */}
              <div className="space-y-2 max-w-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs px-3 py-0.5 rounded-full font-bold">
                    برنامج ولاء عملاء كارجاس CNG
                  </span>
                  <span className="text-xs text-emerald-200">
                    سعر المتر: {config.gasPricePerMeter} ج
                  </span>
                  <span className="bg-white/10 text-white text-xs px-2.5 py-0.5 rounded-full font-mono">
                    لوحة: {driver.carPlate}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  أهلاً بك، {driver.name} 🚗
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 font-light leading-relaxed">
                  {config.customTexts.welcomeDriver}
                </p>
              </div>

              {/* أيقونة برنامج وصلني في المساحة بين كلمة أهلاً بك وبين أيقونات تقييم الفني وصندوق الشكاوى */}
              {v.showNearestStationMap && config.wasalnyConfig?.enabled !== false && (
                <div
                  onClick={() => setIsStationNavModalOpen(true)}
                  className="flex items-center gap-3.5 bg-white/15 hover:bg-white/25 border-2 border-emerald-400/50 backdrop-blur-md px-4 sm:px-5 py-3 rounded-3xl cursor-pointer transition transform hover:scale-[1.03] active:scale-95 group shadow-xl shrink-0"
                  title="اضغط هنا لتفاصيل أقرب محطة كارجاس وبدء الملاحة"
                >
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 flex items-center justify-center text-2xl shadow-md shrink-0 group-hover:rotate-12 transition">
                    <span>🚗</span>
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400"></span>
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-white">
                        {config.wasalnyConfig?.buttonLabel || 'وصلني لأقرب محطة'}
                      </span>
                      <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                        GPS 🛰️
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-200 block font-medium mt-0.5">
                      {activeStationName} {gpsDistanceKm !== null ? `(${gpsDistanceKm} كم)` : ''}
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                      اضغط لتفاصيل المحطة وبدء الملاحة 🗺️
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons stacked on left: Clean and non-duplicated */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                {/* 1. تقييم الفني والخدمة */}
                {v.showServiceRating && (
                  <button
                    onClick={() => {
                      setFeedbackInitialTab('rating');
                      setIsFeedbackModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-2xl transition shadow-md active:scale-95"
                  >
                    <Star className="w-4 h-4 fill-slate-950" />
                    <span>تقييم الفني والخدمة ⭐</span>
                  </button>
                )}

                {/* 2. صندوق الشكاوى والمقترحات */}
                {v.showComplaintsBox && (
                  <button
                    onClick={() => {
                      setFeedbackInitialTab('complaint');
                      setIsFeedbackModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-2.5 rounded-2xl border border-white/20 backdrop-blur-md transition shadow-xs active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4 text-rose-300" />
                    <span>صندوق الشكاوى والمقترحات 📨</span>
                  </button>
                )}

                {/* 3. تعديل الملف والسيارة */}
                {v.showEditProfile && (
                  <button
                    onClick={() => {
                      setEditName(driver.name);
                      setEditPhone(driver.phone);
                      setEditPlate(driver.carPlate);
                      setEditModel(driver.carModel);
                      setEditOdo(driver.odometerKm);
                      setEditCapacity(driver.cngCylinderCapacity);
                      setIsEditProfileOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 text-xs font-bold px-4 py-2 rounded-2xl border border-emerald-500/30 transition shadow-xs active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل بيانات السيارة ✏️</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Promotional Banner Carousel (العروض والمسابقات وشرح برنامج الولاء) */}
      {v.showPromotionalBanner && activeCampaigns.length > 0 && activePage !== 'map' && (
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-slate-700/50">
          {(() => {
            const camp = activeCampaigns[currentCampaignIndex] || activeCampaigns[0];
            const handleAction = () => {
              if (camp.buttonAction === 'navigate_map') {
                setActivePage('map');
              } else if (camp.buttonAction === 'view_rewards') {
                setActivePage('loyalty');
              } else {
                setActivePage('home');
              }
            };

            return (
              <div
                className={`p-6 sm:p-7 text-white bg-gradient-to-r ${camp.bannerGradient || 'from-indigo-950 via-slate-900 to-slate-950'} transition-all duration-500 relative`}
              >
                {/* Decorative background glows */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Content Section */}
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-xs">
                        {camp.badge || 'عرض خاص 🏆'}
                      </span>
                      <span className="bg-white/15 backdrop-blur-md text-amber-200 border border-white/10 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>مكافأة فورية: +{camp.pointsReward} نقطة ولاء (تعادل {camp.financialEquivalentEgp} ج)</span>
                      </span>
                      <span className="text-[11px] text-slate-300 font-mono">
                        عرض {currentCampaignIndex + 1} من {activeCampaigns.length}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {camp.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed">
                      {camp.aiGeneratedCopy || camp.subtitle}
                    </p>

                    {/* Loyalty Explanation Box */}
                    {camp.explanationOfLoyalty && (
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-xs text-slate-200 flex items-start gap-2.5">
                        <span className="text-base">💡</span>
                        <div>
                          <span className="font-bold text-amber-300 block mb-0.5">
                            برنامج كارجاس للولاء وتقدير السائقين:
                          </span>
                          <p className="text-[11px] text-slate-300 font-light leading-relaxed">
                            {camp.explanationOfLoyalty}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Call to Action Button & Navigation Controls */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 w-full lg:w-auto">
                    <button
                      onClick={handleAction}
                      className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span>{camp.buttonText || 'فول واكسب الآن ⛽'}</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Carousel navigation controls if more than 1 campaign */}
                    {activeCampaigns.length > 1 && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() =>
                            setCurrentCampaignIndex(
                              (prev) => (prev - 1 + activeCampaigns.length) % activeCampaigns.length
                            )
                          }
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-xs transition"
                          title="العرض السابق"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1.5 px-2">
                          {activeCampaigns.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentCampaignIndex(idx)}
                              className={`h-2 rounded-full transition-all ${
                                idx === currentCampaignIndex
                                  ? 'w-6 bg-amber-400'
                                  : 'w-2 bg-white/30 hover:bg-white/60'
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentCampaignIndex((prev) => (prev + 1) % activeCampaigns.length)
                          }
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-xs transition"
                          title="العرض التالي"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      {/* Standalone Map Page View ("وصّلني") with One-Click Back to Dashboard */}
      {activePage === 'map' && v.showNearestStationMap ? (
        <div className="space-y-4 animate-in fade-in">
          {/* Prominent Back Button to Return to Main Customer Dashboard */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-emerald-950 flex items-center justify-center text-2xl shadow-lg font-black shrink-0">
                🚗
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  {config.wasalnyConfig?.buttonLabel || 'تطبيق الملاحة والمسارات المباشرة "وصّلني"'}
                </h2>
                <p className="text-xs text-emerald-100 font-light">
                  شبكة محطات ومراكز كارجاس الوطنية CNG — الملاحة الحية وتوجيه المسار لأقرب محطة
                </p>
              </div>
            </div>

            <button
              onClick={() => setActivePage('home')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl transition shadow-lg flex items-center gap-2 active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرجوع للنافذة الرئيسية للعميل ↩️</span>
            </button>
          </div>

          <div className="rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl bg-slate-950 min-h-[680px]">
            <CargasNavApp onBack={() => setActivePage('home')} autoStartNearest={true} />
          </div>
        </div>
      ) : (
        /* Main Layout with Customer Menu Icon and Full-Width Viewport */
        <div className="space-y-6">
          
          {/* Top Customer Navigation Bar featuring the "قائمة العميل" Icon */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
            
            {/* The Main "قائمة العميل" Icon Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCustomerMenuOpen(true)}
                className="flex items-center gap-2.5 sm:gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white px-4 sm:px-5 py-2.5 rounded-2xl shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-95 group border border-emerald-400/30"
                title="اضغط هنا لفتح قائمة العميل وإظهار كافة الأيقونات والخدمات"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg group-hover:rotate-12 transition">
                  🚗
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black">قائمة العميل</span>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                      اضغط لعرض الأيقونات ⚡
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-100 block font-light">
                    انقر لإظهار باقي الأيقونات والخدمات
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-emerald-200 mr-1 group-hover:translate-y-0.5 transition" />
              </button>
            </div>

            {/* Active Section Label & Quick Stats */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700">
                <span className="text-slate-400 text-[11px] hidden sm:inline">الصفحة المعروضة:</span>
                <span className="text-emerald-700 font-black flex items-center gap-1.5">
                  {navMenuItems.find((m) => m.id === activePage)?.icon}
                  <span>{navMenuItems.find((m) => m.id === activePage)?.label}</span>
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-xs font-black text-emerald-800 flex items-center gap-1.5">
                <span className="text-sm">🪙</span>
                <span>{driver.points} نقطة ولاء</span>
              </div>
            </div>
          </div>

          {/* Dynamic Content Viewport (Full Width) */}
          <div className="space-y-6">

            {/* View 1: Home & Quick QR */}
            {activePage === 'home' && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* Personal QR + Stats */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* QR Card */}
                  <div className="md:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col items-center justify-between space-y-4 text-center">
                    <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="text-right">
                        <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          كود الـ QR للتموين السريع
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          اعرض هذا الكود لفني التموين لمسحه
                        </p>
                      </div>
                      <button
                        onClick={() => setIsQrModalOpen(true)}
                        className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-slate-50 transition"
                        title="تكبير الكود"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 bg-gradient-to-tr from-emerald-50 via-teal-50 to-slate-50 rounded-2xl border-2 border-dashed border-emerald-300 flex items-center justify-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR كارجاس السائق"
                          className="w-52 h-52 rounded-xl shadow-xs"
                        />
                      ) : (
                        <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                          جارٍ التوليد...
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs text-right">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">رقم اللوحة:</span>
                        <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {driver.carPlate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">السيارة:</span>
                        <span className="font-bold text-slate-800">{driver.carModel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">سعة الأسطوانة / العداد:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {driver.cngCylinderCapacity}L • {driver.odometerKm.toLocaleString()} كم
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs"
                    >
                      عرض الكود بملء الشاشة 🔍
                    </button>
                  </div>

                  {/* Grand Wasalny Station Card raised to fill the space beside QR Code */}
                  <div className="md:col-span-7 bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-emerald-500/40 relative overflow-hidden flex flex-col justify-between space-y-4 group">
                    {/* Map Graphic Preview Background */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity filter saturate-150 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                      style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80')`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-emerald-950/80 pointer-events-none" />

                    {/* Header: Cargas Logo Badge + Nearest Station Specs */}
                    <div className="relative z-10 flex items-start gap-4">
                      <div
                        onClick={() => setIsStationNavModalOpen(true)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-700 to-emerald-500 p-2 border-2 border-emerald-400/60 shadow-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition shrink-0 relative group/icon"
                        title="اضغط لمعاينة تفاصيل المحطة وبدء الملاحة"
                      >
                        {config.wasalnyConfig?.logoUrl ? (
                          <img src={config.wasalnyConfig.logoUrl} alt="شعار كارجاس" className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-center">
                            <span className="text-2xl sm:text-3xl block group-hover/icon:rotate-12 transition">⛽</span>
                            <span className="text-[9px] font-black text-amber-300 font-mono tracking-tighter">CARGAS</span>
                          </div>
                        )}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-slate-900"></span>
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 text-right">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Compass className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                            <span>أكبر محطة كارجاس CNG • رادار حي</span>
                          </span>
                          {gpsDistanceKm !== null && (
                            <span className="bg-teal-500/20 text-teal-200 border border-teal-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              على بُعد {gpsDistanceKm} كم 📍
                            </span>
                          )}
                          {activeDetectedStation?.crowdLevel && (
                            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              الزحام: {activeDetectedStation.crowdLevel} 🟢
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                          <span>{config.wasalnyConfig?.buttonLabel || 'وصلني لأقرب محطة'}:</span>
                          <span className="text-emerald-300">{activeStationName}</span>
                        </h3>
                        <p className="text-xs text-slate-300 font-light flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{activeDetectedStation?.address || 'مصر — شبكة محطات كارجاس CNG الوطنية'}</span>
                          {activeDetectedStation?.city && <span className="text-slate-400">({activeDetectedStation.city})</span>}
                        </p>
                      </div>
                    </div>

                    {/* Services Strip */}
                    <div className="relative z-10 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/80 text-[11px] text-emerald-200">
                      <span className="bg-white/10 px-2.5 py-1 rounded-xl">تموين غاز سريع ⚡</span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-xl">زيوت معتمدة 🛢️</span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-xl">فحص الأسطوانات 🛡️</span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-xl">خدمة 24/7 ⏱️</span>
                    </div>

                    {/* Actions */}
                    <div className="relative z-10 flex flex-wrap items-center gap-2.5 pt-2">
                      {config.wasalnyConfig?.voiceGuidance !== 'silent' && (
                        <button
                          type="button"
                          onClick={handlePlayWadahGuidance}
                          className="flex items-center gap-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-xs font-bold px-3 py-2.5 rounded-2xl transition active:scale-95"
                          title="استمع لإرشاد وضاح الصوتي باللهجة المصرية"
                        >
                          <Volume2 className="w-4 h-4 text-amber-300" />
                          <span>صوت وضاح 🗣️</span>
                        </button>
                      )}

                      <button
                        onClick={() => setIsStationNavModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl transition-all shadow-xl active:scale-95 group/btn"
                      >
                        <Navigation className="w-4 h-4 text-slate-950 group-hover/btn:translate-x-1 transition" />
                        <span>ابدأ الملاحة وتفاصيل المحطة 🗺️</span>
                      </button>

                      <button
                        onClick={() => setActivePage('map')}
                        className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold px-3 py-2.5 rounded-2xl transition active:scale-95 flex items-center gap-1.5"
                        title="تكبير الخريطة وفتح تطبيق وصّلني"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">تكبير الخريطة ⛶</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Golden Card & Metrics directly below the top QR + Wasalny row */}
                <div className="space-y-4">
                  {v.showGoldenCard && (
                    <div className="bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-amber-300">
                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-black/20 px-2.5 py-1 rounded-full border border-white/30">
                            CARGAS VIP LOYALTY CARD
                          </span>
                          <p className="text-2xl font-black mt-2 tracking-tight">
                            كارت كارجاس الذهبي
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/40">
                          ⛽
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10">
                        <div>
                          <p className="text-xs text-amber-100 font-medium">
                            {config.customTexts.pointsBannerTitle}
                          </p>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                              {driver.points}
                            </span>
                            <span className="text-sm font-bold text-amber-100">نقطة كارجاس</span>
                          </div>
                        </div>

                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-right">
                          <span className="text-[10px] text-amber-100 block">القيمة التقديرية:</span>
                          <span className="text-base font-extrabold text-white">
                            تعادل {(driver.points * 1.3).toFixed(0)} جنيه
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-amber-100 font-medium relative z-10">
                        <span>كود العميل: {driver.id}</span>
                        <button
                          onClick={() => setActivePage('loyalty')}
                          className="bg-black/20 hover:bg-black/30 text-white font-bold px-3 py-1 rounded-xl transition text-[11px]"
                        >
                          استبدال الهدايا ←
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">إجمالي الغاز المُمون</span>
                      <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                        {driver.totalMetersFueled.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold block">متر مكعب m³</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">إجمالي الإنفاق</span>
                      <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                        {driver.totalSpentEgp.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold block">جنيه مصري</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">الوفورات المحققة</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
                        ~{(driver.totalMetersFueled * 6.5).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">جنيه وفر!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Loyalty & Rewards Bank */}
            {activePage === 'loyalty' && v.showRewardsBank && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-black text-base text-slate-900">
                      استبدال نقاط الولاء بهدايا وأمتار مجانية
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      اختر المكافأة التي تناسبك واستبدلها فوراً بكود معتمد صالح في جميع محطات ومراكز كارجاس
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    رصيدك الحالي: {driver.points} نقطة
                  </span>
                </div>

                {redeemedAlert && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl">
                        ✓
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-emerald-950">
                          ألف مبروك! تم استبدال مكافأة "{redeemedAlert.rewardTitle}"
                        </h4>
                        <p className="text-xs text-emerald-800">
                          كود القسيمة: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">{redeemedAlert.redemptionCode}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRedeemedAlert(null)}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                    >
                      إغلاق
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => {
                    const canAfford = driver.points >= reward.pointsCost;
                    return (
                      <div
                        key={reward.id}
                        className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                          canAfford
                            ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'
                            : 'bg-slate-50/60 border-slate-200/60 opacity-80'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">🎁</span>
                            <span className="text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-200">
                              {reward.pointsCost} نقطة
                            </span>
                          </div>
                          <h4 className="font-black text-sm text-slate-900">{reward.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{reward.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{reward.valueText}</span>
                          <button
                            onClick={() => handleRedeemReward(reward)}
                            disabled={!canAfford}
                            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                              canAfford
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'استبدال الآن' : `ينقصك ${reward.pointsCost - driver.points} نقطة`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active Vouchers & Free Meters Redemption QR Codes */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span>قسائم الهدايا والأمتار المجانية الخاصة بك (كود الصرف لدى فني التموين)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      إجمالي القسائم: {redemptions.length}
                    </span>
                  </div>

                  {redemptions.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500">
                      لم تقم باستبدال أي قسائم بعد. عندما تجمع نقاطاً وتستبدلها بأمتار مجانية ستظهر قسيمتك هنا مع كود الـ QR الخاص بالصرف.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {redemptions.map((red) => {
                        return (
                          <div
                            key={red.id}
                            className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                              red.isUsed
                                ? 'bg-slate-50/70 border-slate-200 opacity-75'
                                : 'bg-gradient-to-tr from-emerald-50/60 to-teal-50/40 border-emerald-300 shadow-xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sm text-slate-900">{red.rewardTitle}</span>
                                  {red.freeMeters ? (
                                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                      {red.freeMeters} م³ مجاناً ⛽
                                    </span>
                                  ) : null}
                                </div>
                                <span className="font-mono text-xs font-bold text-slate-600 mt-1 block">
                                  كود القسيمة: <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{red.redemptionCode}</span>
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                  red.isUsed
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {red.isUsed ? 'تم الصرف ✓' : 'جاهزة للصرف ⚡'}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                              <span className="text-slate-500 text-[11px]">
                                {red.isUsed && red.usedAt
                                  ? `صُرفت في ${red.usedAtStation || 'المحطة'} (${red.dispensedByTechnicianName || 'الفني'})`
                                  : `خصم ${red.pointsSpent} نقطة`}
                              </span>

                              {!red.isUsed && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRedemptionForQr(red)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs active:scale-95"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>عرض QR الصرف للفني 📱</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View 3: Maintenance Schedule */}
            {activePage === 'maintenance' && v.showMaintenanceSchedule && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      جدول الصيانة الذكي والتنبيهات المانعة للتلاعب
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {config.customTexts.maintenanceNotice}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs">
                    <span className="text-slate-500">العداد الحالي:</span>
                    <span className="font-mono font-black text-slate-900">
                      {driver.odometerKm.toLocaleString()} كم
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {driver.maintenanceSchedule.map((item) => {
                    const kmSinceLast = driver.odometerKm - item.lastKm;
                    const kmRemaining = item.nextDueKm - driver.odometerKm;
                    const progressPct = Math.min(100, Math.max(0, (kmSinceLast / item.intervalKm) * 100));

                    let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    let barColor = 'bg-emerald-500';
                    let statusLabel = 'الحالة ممتازة';

                    if (kmRemaining <= 0) {
                      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
                      barColor = 'bg-rose-600';
                      statusLabel = 'حان موعد التغيير الآن!';
                    } else if (kmRemaining <= 1000) {
                      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      barColor = 'bg-amber-500';
                      statusLabel = 'اقترب الموعد';
                    }

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                              {renderMaintenanceIcon(item.icon)}
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-slate-900">{item.name}</h4>
                              <p className="text-xs text-slate-500">{item.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                              {statusLabel}
                            </span>
                            <button
                              onClick={() => handleResetMaintenance(item)}
                              className="text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition"
                            >
                              تأكيد الصيانة ✓
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>آخر تغيير: {item.lastKm.toLocaleString()} كم</span>
                            <span className="font-bold text-slate-700">
                              {kmRemaining > 0 ? `متبقي ${kmRemaining.toLocaleString()} كم` : 'تجاوزت الموعد!'}
                            </span>
                            <span>الموعد القادم: {item.nextDueKm.toLocaleString()} كم</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View 4: Fueling History */}
            {activePage === 'history' && v.showFuelingHistory && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base text-slate-900">
                      سجل تفويلات ومعاملات الغاز الطبيعي
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تتبع كميات الغاز المستهلكة، رقم التموين من كل محطة وطلمبة، والنقاط المكتسبة
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-amber-100 transition"
                  >
                    ⭐ تقييم آخر تفويلة أو إرسال شكوى
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-mono">رقم الإيصال</th>
                        <th className="p-3">التاريخ والوقت</th>
                        <th className="p-3">المحطة والمضخة</th>
                        <th className="p-3">الكمية (م³)</th>
                        <th className="p-3">المبلغ (ج)</th>
                        <th className="p-3">النقاط</th>
                        <th className="p-3">تكرار التموين</th>
                        <th className="p-3">الفني والـ GPS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 font-mono font-bold text-slate-900">{tx.receiptNumber}</td>
                          <td className="p-3 text-slate-500">
                            {new Date(tx.timestamp).toLocaleString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {tx.stationName} <span className="text-emerald-700">(مضخة #{tx.pumpNumber})</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {tx.metersQuantity} م³
                            {tx.isRewardRedemption && (
                              <span className="block text-[10px] text-emerald-600 font-bold">هدية ولاء مجانية</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold">
                            {tx.isRewardRedemption ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                                0 ج (استبدال نقاط) 🎁
                              </span>
                            ) : (
                              <span className="text-slate-900">{tx.totalAmountEgp} ج</span>
                            )}
                          </td>
                          <td className="p-3">
                            {tx.isRewardRedemption ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                هدية منصرفة
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                +{tx.pointsEarned} نقطة
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {v.showFuelingCountStats ? (
                              <div className="text-[10px] space-y-0.5">
                                <span className="text-slate-600 block">المحطة: #{tx.driverStationFuelingCount || 1}</span>
                                <span className="text-emerald-700 font-bold block">الطلمبة: #{tx.driverPumpFuelingCount || 1}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            {tx.technicianName} • <span className="text-emerald-600 font-bold">GPS موثق ({tx.gpsDistanceMeters}م)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pt-2">
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                كود كارجاس للتموين المباشر
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">{driver.name}</h3>
              <p className="text-xs text-slate-500">{driver.carPlate} • {driver.carModel}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-emerald-500 inline-block shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="كود السائق" className="w-64 h-64 mx-auto rounded-xl" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-xs text-slate-400">
                  جارٍ التوليد...
                </div>
              )}
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl text-xs hover:bg-slate-800 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && v.showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs no-print animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">تعديل بيانات العميل والسيارة</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم السائق / العميل</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف (الواتساب)</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم اللوحة المرورية</label>
                  <input
                    type="text"
                    required
                    value={editPlate}
                    onChange={(e) => setEditPlate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">نوع وموديل السيارة</label>
                  <input
                    type="text"
                    required
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعة الأسطوانة (لتر)</label>
                  <input
                    type="number"
                    required
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">قراءة عداد الكيلومترات الحالي (كم)</label>
                <input
                  type="number"
                  required
                  value={editOdo}
                  onChange={(e) => setEditOdo(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition"
                >
                  حفظ البيانات وتحديث الـ QR
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Menu Icon Modal - Reveals all remaining icons when clicked */}
      {isCustomerMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 no-print"
          onClick={() => setIsCustomerMenuOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-600/30">
                  🚗
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    قائمة العميل — كافة الأيقونات والخدمات
                  </h3>
                  <p className="text-xs text-slate-500 font-light">
                    اضغط على أي أيقونة للانتقال الفوري للخدمة أو الصفحة المطلوبة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomerMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                title="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Driver Quick Info Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">السائق:</span>
                <span className="font-black text-white">{driver.name}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md font-mono text-emerald-300">
                  {driver.carPlate}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-black">رصيد الولاء:</span>
                <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md">
                  {driver.points} نقطة
                </span>
              </div>
            </div>

            {/* Grid of All Customer Action Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {navMenuItems
                .filter((item) => item.visible)
                .map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'feedback') {
                          setFeedbackInitialTab('rating');
                          setIsFeedbackModalOpen(true);
                        } else if (item.id === 'complaints') {
                          setFeedbackInitialTab('complaint');
                          setIsFeedbackModalOpen(true);
                        } else {
                          setActivePage(item.id);
                        }
                        setIsCustomerMenuOpen(false);
                      }}
                      className={`text-right p-3.5 sm:p-4 rounded-2xl font-bold transition flex items-center justify-between gap-3.5 border transform active:scale-95 group ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-lg shadow-emerald-600/25'
                          : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200/90 hover:border-emerald-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition group-hover:scale-110 shadow-xs shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-white text-emerald-600 border border-slate-200'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="block font-black text-xs sm:text-sm leading-tight">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] sm:text-[11px] block leading-tight font-light mt-0.5 ${
                              isActive ? 'text-emerald-100' : 'text-slate-500'
                            }`}
                          >
                            {item.sub}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                          الحالية ✓
                        </span>
                      ) : (
                        <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-1 transition shrink-0" />
                      )}
                    </button>
                  );
                })}

              {/* Extra Icon: Edit Profile */}
              {v.showEditProfile && (
                <button
                  onClick={() => {
                    setEditName(driver.name);
                    setEditPhone(driver.phone);
                    setEditPlate(driver.carPlate);
                    setEditModel(driver.carModel);
                    setEditOdo(driver.odometerKm);
                    setEditCapacity(driver.cngCylinderCapacity);
                    setIsCustomerMenuOpen(false);
                    setIsEditProfileOpen(true);
                  }}
                  className="text-right p-3.5 sm:p-4 rounded-2xl font-bold transition flex items-center justify-between gap-3.5 border bg-slate-50 hover:bg-blue-50 border-slate-200/90 hover:border-blue-300 text-slate-800 transform active:scale-95 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center text-lg transition group-hover:scale-110 shadow-xs shrink-0">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-black text-xs sm:text-sm leading-tight">
                        تعديل الملف والسيارة ✏️
                      </span>
                      <span className="text-[10px] sm:text-[11px] block leading-tight font-light text-slate-500 mt-0.5">
                        اللوحة، العداد، والسعة
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition shrink-0" />
                </button>
              )}
            </div>

            {/* Bottom Dismiss Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-light">
                منظومة ولاء عملاء وسائقي كارجاس مصر الغاز الطبيعي
              </span>
              <button
                onClick={() => setIsCustomerMenuOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Floating Customer Menu Icon (FAB) */}
      <div className="fixed bottom-6 left-6 z-40 print:hidden">
        <button
          onClick={() => setIsCustomerMenuOpen((prev) => !prev)}
          className="relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-white/40 backdrop-blur-md group"
          title="قائمة العميل — اضغط لإظهار كافة الأيقونات"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg group-hover:rotate-12 transition">
            🚗
          </div>
          <div className="text-right">
            <span className="block text-[9px] text-emerald-200 font-normal">قائمة العميل</span>
            <span className="block text-xs font-black">عرض الأيقونات ⚡</span>
          </div>
          <span className="flex h-2.5 w-2.5 relative mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          </span>
        </button>
      </div>

      {/* Free Meters Reward Redemption QR Modal */}
      {selectedRedemptionForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative border-2 border-emerald-500">
            <button
              onClick={() => setSelectedRedemptionForQr(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">
              🎁
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                كود صرف معتمد — برنامج ولاء كارجاس
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1.5">
                {selectedRedemptionForQr.rewardTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                أظهر هذا الكود لفني التموين ليقوم بمسحه من كاميرا الطلمبة وصرف الأمتار فوراً
              </p>
            </div>

            <div className="p-3 bg-gradient-to-tr from-emerald-50 via-teal-50 to-slate-50 rounded-2xl border-2 border-dashed border-emerald-400 flex items-center justify-center">
              {redemptionQrDataUrl ? (
                <img
                  src={redemptionQrDataUrl}
                  alt="كود كيو آر للاستبدال"
                  className="w-56 h-56 rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                  جارٍ التوليد...
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1.5 text-right">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">كود القسيمة:</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {selectedRedemptionForQr.redemptionCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">الكمية المستحقة:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {selectedRedemptionForQr.freeMeters || 10} متر مكعب m³ مجاني
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">المبلغ المطلوب من العميل:</span>
                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  0 جنيه (مجاني بالكامل)
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedRedemptionForQr(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition"
            >
              تم وإغلاق النافذة
            </button>
          </div>
        </div>
      )}

      {/* Station Navigation Modal ("وصّلني" — تفاصيل المحطة وبدء الملاحة المدمجة أو جوجل ماب) */}
      {isStationNavModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-right relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                  ⛽
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      تطبيق وصّلني — رادار كارجاس CNG
                    </span>
                    {gpsDistanceKm !== null && (
                      <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {gpsDistanceKm} كم من موقعك
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 mt-1">
                    {activeStationName} {activeDetectedStation?.city ? `(${activeDetectedStation.city})` : ''}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsStationNavModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Station Specs */}
            <div className="space-y-2.5 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-medium shrink-0">العنوان الدقيق:</span>
                <span className="font-bold text-slate-900 text-left">
                  {activeDetectedStation?.address || 'جمهورية مصر العربية — شبكة كارجاس الوطنية'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">المسافة الحالية عنك:</span>
                <span className="font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {gpsDistanceKm !== null ? `${gpsDistanceKm} كم` : 'تم الرصد عبر GPS 🛰️'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">حالة الزحام الآن:</span>
                <span className="font-bold text-slate-800 bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-200">
                  {activeDetectedStation?.crowdLevel || 'هادئ ومتاح للتموين الفوري 🟢'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">ساعات العمل:</span>
                <span className="font-bold text-slate-800">خدمة مستمرة 24 ساعة على مدار اليوم ⏱️</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">الخدمات المتوفرة:</span>
                <span className="font-bold text-emerald-800">
                  تموين غاز CNG • زيوت معتمدة • فحص وصيانة أسطوانات
                </span>
              </div>
            </div>

            {/* Navigation Options - In-App vs Google Maps vs Hotline */}
            <div className="space-y-2.5 pt-1">
              {/* Option 1: In-App Cargas Navigation (وصلني المدمجة المجانية) */}
              <button
                onClick={() => {
                  setIsStationNavModalOpen(false);
                  setActivePage('map');
                }}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                    🗺️
                  </div>
                  <div className="text-right">
                    <span>الملاحة بخرائط التطبيق المجانية (وصّلني المدمجة)</span>
                    <span className="block text-[10px] text-emerald-100 font-normal">
                      توجيه حي ومباشر بدون استهلاك باقة الإنترنت أو مغادرة التطبيق
                    </span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-emerald-200 group-hover:-translate-x-1 transition" />
              </button>

              {/* Option 2: Google Maps External */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeDetectedStation?.latitude || 30.0444},${activeDetectedStation?.longitude || 31.2357}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                    🌐
                  </div>
                  <div className="text-right">
                    <span>التوجه إلى خرائط جوجل (Google Maps)</span>
                    <span className="block text-[10px] text-slate-300 font-normal">
                      فتح تطبيق خرائط جوجل وتوجيه القيادة خطوة بخطوة بالصوت
                    </span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition" />
              </a>

              {/* Option 3: Hotline Call 19058 */}
              <a
                href="tel:19058"
                className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>الاتصال بالخط الساخن كارجاس (19058) 📞</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-600">خدمة العملاء 24/7</span>
              </a>
            </div>

            {/* Wadah Voice & Dismiss */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {config.wasalnyConfig?.voiceGuidance !== 'silent' && (
                <button
                  type="button"
                  onClick={handlePlayWadahGuidance}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl transition"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>استمع لإرشاد وضاح الصوتي 🗣️</span>
                </button>
              )}

              <button
                onClick={() => setIsStationNavModalOpen(false)}
                className="mr-auto px-4 py-2 text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Feedback & Rating Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        config={config}
        driver={driver}
        lastTransaction={transactions[0]}
        crew={crew}
        initialTab={feedbackInitialTab}
        onRatingSubmitted={onRefreshData}
        onComplaintSubmitted={onRefreshData}
      />
    </div>
  );
};
