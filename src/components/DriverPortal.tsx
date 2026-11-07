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
  Info,
  Send,
  Eye,
  EyeOff,
  Settings,
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
  CustomerViewMode,
  CustomerDataUpdateRequest,
  DriverQuickIconsVisibility,
} from '../types';
import { generateQrDataUrl, encodeDriverQrData, encodeRewardRedemptionQrData } from '../services/qrService';
import {
  saveDriverProfile,
  getRedemptions,
  saveRedemptions,
  getDriverStationAndPumpFuelingCounts,
  calculateDistanceKm,
  DEFAULT_DRIVER_SECTIONS,
  DEFAULT_DRIVER_SECTIONS_ORDER,
  getCustomerViewMode,
  saveCustomerViewMode,
  CUSTOMER_VIEW_MODE_EVENT,
  getCustomerDataUpdateRequests,
  submitCustomerDataUpdateRequest,
  getDriverQuickIconsVisibility,
  saveDriverQuickIconsVisibility,
  DRIVER_QUICK_ICONS_EVENT,
  DEFAULT_DRIVER_QUICK_ICONS_VISIBILITY,
} from '../services/storageService';
import {
  playNavigationVoice,
  generateVoiceGuidanceSpeech,
  stopNavigationVoice,
  NAVIGATION_VOICES,
  NavigationVoiceId,
} from '../services/voiceNavigationService';
import { CargasStationsMap } from './CargasStationsMap';
import { InlineNearestStationMap } from './InlineNearestStationMap';
import { CargasNavApp } from '../navigation/CargasNavApp';
import { speechService } from '../navigation/services/speechService';
import { CustomerFeedbackModal } from './CustomerFeedbackModal';
import { AppointmentBookingModal } from './AppointmentBookingModal';
import { CustomerMessagingModal } from './CustomerMessagingModal';
import { CustomerChatChannel } from '../types';

import {
  DynamicInPageLayoutEditor,
  SectionEditControls,
  AdminPinVerifyModal,
} from './DynamicInPageLayoutEditor';
import { SectionLayoutItem, SectionColSpan, SectionHeightMode } from '../types';

interface DriverPortalProps {
  config: AppConfig;
  driver: DriverProfile;
  rewards: RewardItem[];
  transactions: FuelingTransaction[];
  stations: CargasStationLocation[];
  crew: TechnicianCrewMember[];
  onUpdateDriver: (driver: DriverProfile) => void;
  onRefreshData: () => void;
  onUpdateConfig?: (config: AppConfig) => void;
  isAdminPreview?: boolean;
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
  onUpdateConfig,
  isAdminPreview = false,
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
  const [targetNavigationStationId, setTargetNavigationStationId] = useState<string | null>(null);
  const [navKey, setNavKey] = useState<number>(0);
  const [isNavActiveRequested, setIsNavActiveRequested] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Cancel any hanging speech on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }, []);

  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [messagingInitialChannel, setMessagingInitialChannel] = useState<CustomerChatChannel>('customer_service');

  // Customer Data Update Request State (طلب تعديل بيانات العميل والسيارة المرسل لخدمة العملاء ومدير النظام)
  const [isUpdateRequestModalOpen, setIsUpdateRequestModalOpen] = useState(false);
  const [customerRequests, setCustomerRequests] = useState<CustomerDataUpdateRequest[]>(() =>
    getCustomerDataUpdateRequests().filter((r) => r.driverId === driver.id)
  );
  const [reqName, setReqName] = useState(driver.name);
  const [reqPhone, setReqPhone] = useState(driver.phone);
  const [reqPlate, setReqPlate] = useState(driver.carPlate);
  const [reqModel, setReqModel] = useState(driver.carModel);
  const [reqCapacity, setReqCapacity] = useState(driver.cngCylinderCapacity || 70);
  const [reqOdo, setReqOdo] = useState(driver.odometerKm || 0);
  const [reqNotes, setReqNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqSuccessMsg, setReqSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleRequestsUpdate = () => {
      setCustomerRequests(getCustomerDataUpdateRequests().filter((r) => r.driverId === driver.id));
    };
    window.addEventListener('cargas_customer_requests_updated', handleRequestsUpdate);
    return () => {
      window.removeEventListener('cargas_customer_requests_updated', handleRequestsUpdate);
    };
  }, [driver.id]);

  useEffect(() => {
    setReqName(driver.name);
    setReqPhone(driver.phone);
    setReqPlate(driver.carPlate);
    setReqModel(driver.carModel);
    setReqCapacity(driver.cngCylinderCapacity || 70);
    setReqOdo(driver.odometerKm || 0);
  }, [driver]);

  const latestDriverRequest = customerRequests[0] || null;

  const handleSubmitCustomerRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReq(true);
    try {
      submitCustomerDataUpdateRequest({
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        currentCarPlate: driver.carPlate,
        currentCarModel: driver.carModel,
        currentCngCylinderCapacity: driver.cngCylinderCapacity || 70,
        currentOdometerKm: driver.odometerKm || 0,
        requestedName: reqName.trim(),
        requestedPhone: reqPhone.trim(),
        requestedCarPlate: reqPlate.trim(),
        requestedCarModel: reqModel.trim(),
        requestedCngCylinderCapacity: Number(reqCapacity),
        requestedOdometerKm: Number(reqOdo),
        requestNotes: reqNotes.trim(),
      });
      setCustomerRequests(getCustomerDataUpdateRequests().filter((r) => r.driverId === driver.id));
      setReqSuccessMsg('✅ تم إرسال طلب تعديل البيانات لخدمة العملاء ومدير النظام بنجاح!');
      setTimeout(() => {
        setReqSuccessMsg(null);
        setIsUpdateRequestModalOpen(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Dynamic In-Page Layout Customization State (5-Clicks Gesture by Admin)
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  // Top Navigation Bar Controls (حل مشكلة اختفاء الأيقونات في شريط العميل)
  const navTabsRef = React.useRef<HTMLDivElement>(null);
  const [isNavTabsExpanded, setIsNavTabsExpanded] = useState(false);

  const scrollNavTabs = (direction: 'left' | 'right') => {
    if (navTabsRef.current) {
      const amount = direction === 'left' ? -220 : 220;
      navTabsRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // User View Mode: 'all_integrated' | 'navigation_only' | 'loyalty_only'
  // تحكم حصري لمدير النظام: عندما يخفي نظاماً تختفي كافة أيقوناته من صفحة العميل بدون أن يعلم
  const [customerViewMode, setCustomerViewMode] = useState<CustomerViewMode>(
    () => config.customerViewMode || getCustomerViewMode()
  );

  // Sync when config changes
  useEffect(() => {
    if (config.customerViewMode) {
      setCustomerViewMode(config.customerViewMode);
    }
  }, [config.customerViewMode]);

  // Listen for admin changes dispatched across windows/tabs
  useEffect(() => {
    const handleModeUpdate = (e: any) => {
      const mode = e?.detail || getCustomerViewMode();
      setCustomerViewMode(mode);
    };
    window.addEventListener(CUSTOMER_VIEW_MODE_EVENT, handleModeUpdate);
    window.addEventListener('storage', handleModeUpdate);
    return () => {
      window.removeEventListener(CUSTOMER_VIEW_MODE_EVENT, handleModeUpdate);
      window.removeEventListener('storage', handleModeUpdate);
    };
  }, []);

  // إخفاء التحليل الاستشاري الذكي لمُعِين عن العميل وعرض الوصف التسويقي النظيف
  const getCustomerRewardDescription = (rew: RewardItem): string => {
    const shouldHide = config.hideAiAuditFromCustomers !== false;
    if (shouldHide) {
      if (
        rew.description?.includes('تحليل استشاري') ||
        rew.description?.includes('مُعِين') ||
        rew.description?.includes('تقييم التسعير السوقي') ||
        rew.description?.includes('توصية لوكا ووضاح')
      ) {
        return (
          rew.marketingDescription ||
          `استبدل ${rew.pointsCost} نقطة ولاء مجمعة في كارتك الذهبي واحصل فوراً على ${rew.title} بقيمة ${
            rew.estimatedEgpValue || Math.round(rew.pointsCost * 0.15)
          } جنيه صالحة لدى كارجاس والشركاء المعتمدين.`
        );
      }
    }
    return rew.marketingDescription || rew.description;
  };

  // Quick Service Icons Visibility State (مضبوطة حصرياً من قبل مدير النظام)
  const [quickIconsVis, setQuickIconsVis] = useState<DriverQuickIconsVisibility>(() =>
    getDriverQuickIconsVisibility()
  );

  // Sync when changed from storage or admin portal
  useEffect(() => {
    const handleQuickIconsUpdate = (e: any) => {
      if (e?.detail) {
        setQuickIconsVis(e.detail);
      } else {
        setQuickIconsVis(getDriverQuickIconsVisibility());
      }
    };
    window.addEventListener(DRIVER_QUICK_ICONS_EVENT, handleQuickIconsUpdate);
    window.addEventListener('storage', handleQuickIconsUpdate);
    return () => {
      window.removeEventListener(DRIVER_QUICK_ICONS_EVENT, handleQuickIconsUpdate);
      window.removeEventListener('storage', handleQuickIconsUpdate);
    };
  }, []);

  // Auto-redirect if admin hides the currently opened page
  useEffect(() => {
    if (customerViewMode === 'loyalty_only' && activePage === 'map') {
      setActivePage('home');
    }
  }, [customerViewMode, activePage]);

  // Sections State (التحكم المباشر في ترتيب ومقاسات وإظهار/إخفاء المساحات)
  const [driverSections, setDriverSections] = useState<SectionLayoutItem[]>(() => {
    const saved = config.layoutSettings?.driverSections;
    if (saved && saved.length > 0) {
      const existingIds = new Set(saved.map((s) => s.id));
      const missing = DEFAULT_DRIVER_SECTIONS.filter((s) => !existingIds.has(s.id));
      const merged = missing.length > 0 ? [...saved, ...missing] : saved;
      return merged
        .map((s) => (s.id === 'wasalny_hero' ? { ...s, colSpan: 12 as SectionColSpan } : s))
        .sort((a, b) => a.order - b.order);
    }
    return DEFAULT_DRIVER_SECTIONS;
  });

  useEffect(() => {
    if (config.layoutSettings?.driverSections && config.layoutSettings.driverSections.length > 0) {
      const saved = config.layoutSettings.driverSections;
      const existingIds = new Set(saved.map((s) => s.id));
      const missing = DEFAULT_DRIVER_SECTIONS.filter((s) => !existingIds.has(s.id));
      if (missing.length > 0) {
        setDriverSections([...saved, ...missing].sort((a, b) => a.order - b.order));
      } else {
        setDriverSections(saved);
      }
    }
  }, [config.layoutSettings?.driverSections]);

  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);

  // 10-Clicks Handler on Any Page Space (مخصص حصرياً لمدير النظام أثناء المعاينة، ملغي تماماً للعملاء العاديين)
  const handlePageTapGesture = (e: React.MouseEvent) => {
    if (!isAdminPreview) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a, [draggable]')) return;

    const now = Date.now();
    if (now - lastClickTime < 3000) {
      const nextCount = clickCount + 1;
      setClickCount(nextCount);
      if (nextCount >= 10) {
        setClickCount(0);
        setIsAdminPinModalOpen(true);
      }
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  // Section Ordering & Resizing Handlers
  const handleMoveUp = (id: string) => {
    const sorted = [...driverSections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === id);
    if (index <= 0) return;
    const prev = sorted[index - 1];
    const curr = sorted[index];
    const prevOrder = prev.order;
    prev.order = curr.order;
    curr.order = prevOrder;
    setDriverSections([...driverSections]);
  };

  const handleMoveDown = (id: string) => {
    const sorted = [...driverSections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === id);
    if (index === -1 || index >= sorted.length - 1) return;
    const next = sorted[index + 1];
    const curr = sorted[index];
    const nextOrder = next.order;
    next.order = curr.order;
    curr.order = nextOrder;
    setDriverSections([...driverSections]);
  };

  const handleChangeColSpan = (id: string, colSpan: SectionColSpan) => {
    setDriverSections(driverSections.map((s) => (s.id === id ? { ...s, colSpan } : s)));
  };

  const handleChangeHeightMode = (id: string, heightMode: SectionHeightMode) => {
    setDriverSections(driverSections.map((s) => (s.id === id ? { ...s, heightMode } : s)));
  };

  const handleToggleVisibility = (id: string) => {
    setDriverSections(driverSections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  const handleDragStart = (id: string) => {
    setDraggedSectionId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedSectionId || draggedSectionId === targetId) return;
    const sorted = [...driverSections].sort((a, b) => a.order - b.order);
    const sourceIndex = sorted.findIndex((s) => s.id === draggedSectionId);
    const targetIndex = sorted.findIndex((s) => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const [moved] = sorted.splice(sourceIndex, 1);
    sorted.splice(targetIndex, 0, moved);
    const reordered = sorted.map((s, idx) => ({ ...s, order: idx + 1 }));
    setDriverSections(reordered);
    setDraggedSectionId(null);
  };

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

  // Navigation Voice Guidance (ملغى تماماً بناء على طلب العميل)
  const currentVoiceId: NavigationVoiceId = 'silent';
  const isDriverSpeaking = false;

  const speakWadahVoice = (_text?: string) => {
    return;
  };

  const handlePlayWadahGuidance = () => {
    return;
  };

  // Direct 1-Click Navigation to Nearest Cargas Station (وصلني — كارجاس طريقنا واحد)
  // توجيه مباشر وفوري إلى نظام الملاحة في خرائط جوجل مع إجبار جوجل على إحداثيات GPS الدقيقة للعميل والمحطة
  const handleWasalnyDirectNavigate = (targetStation?: CargasStationLocation) => {
    let station = targetStation || gpsNearestStation || activeDetectedStation || stations[0];

    const launchGoogleMaps = (userCoords?: { lat: number; lng: number } | null) => {
      // إذا توفر موقع العميل ولم يتم تحديد محطة بعينها، نحسب أدق وأقرب محطة فورياً
      if (userCoords && stations && stations.length > 0 && !targetStation) {
        let closest = stations[0];
        let minD = calculateDistanceKm(userCoords.lat, userCoords.lng, closest.latitude, closest.longitude);
        for (let i = 1; i < stations.length; i++) {
          const d = calculateDistanceKm(userCoords.lat, userCoords.lng, stations[i].latitude, stations[i].longitude);
          if (d < minD) {
            minD = d;
            closest = stations[i];
          }
        }
        station = closest;
        setGpsNearestStation(closest);
        setGpsDistanceKm(Number(minD.toFixed(1)));
      }

      if (!station) return;

      const originParam = userCoords && userCoords.lat && userCoords.lng
        ? `&origin=${userCoords.lat},${userCoords.lng}`
        : '';
      const destinationParam = `destination=${station.latitude},${station.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1${originParam}&${destinationParam}&travelmode=driving&dir_action=navigate`;

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // 1. إذا كانت إحداثيات الـ GPS مسجلة مسبقاً، نطلق الملاحة فوراً
    if (driverGpsLocation && driverGpsLocation.lat && driverGpsLocation.lng) {
      launchGoogleMaps(driverGpsLocation);
      return;
    }

    // 2. التحقق السريع من الـ GPS بدقة عالية
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverGpsLocation(coords);
          launchGoogleMaps(coords);
        },
        () => {
          // في حال عدم توفر إذن الـ GPS نوجه لموقع المحطة مباشرة
          launchGoogleMaps(null);
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 5000 }
      );
    } else {
      launchGoogleMaps(null);
    }
  };

  const handleCancelNavigation = () => {
    setIsNavActiveRequested(false);
    setTargetNavigationStationId(null);
    setNavKey((k) => k + 1);
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

    const calculatedEgp = reward.estimatedEgpValue || reward.pointsCost * 0.5;

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
      label: 'وصّلني (كارجاس طريقنا واحد)',
      sub: 'الملاحة الفورية لأقرب محطة كارجاس لموقعك',
      icon: <Navigation className="w-4 h-4 text-emerald-400" />,
      visible: customerViewMode !== 'loyalty_only' && v.showNearestStationMap,
      badge: 'طريقنا واحد',
    },
    {
      id: 'loyalty' as DriverPageView,
      label: 'كارت الولاء وبنك الهدايا',
      sub: `${driver.points} نقطة متاحة`,
      icon: <CreditCard className="w-4 h-4" />,
      visible: customerViewMode !== 'navigation_only' && ((v.showGoldenCard && quickIconsVis.golden_card) || v.showRewardsBank),
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
      id: 'complaints' as DriverPageView,
      label: 'صندوق الشكاوى والمقترحات',
      sub: 'تواصل مباشر مع الإدارة 19058 📨',
      icon: <MessageSquare className="w-4 h-4 text-rose-500" />,
      visible: v.showComplaintsBox,
    },
  ];

  // تعريف الأيقونات والخدمات السريعة الـ 10 لصفحة العميل (دون أي تكرار مع التحكم الكامل في إظهارها وإخفائها)
  const quickIconsList = [
    {
      key: 'qr_code' as const,
      label: 'كود التموين QR 📱',
      description: 'كود الـ QR للتموين السريع لمسحه عبر جهاز الفني بالمحطة',
      badgeClass: 'bg-slate-900 hover:bg-slate-800 text-white',
      borderClass: 'border-slate-800',
      icon: <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
      action: () => setIsQrModalOpen(true),
    },
    {
      key: 'navigation' as const,
      label: 'أقرب محطة كارجاس 🧭',
      description: 'الملاحة الفورية لأقرب محطة كارجاس عبر خرائط جوجل بأدق إحداثيات GPS',
      badgeClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
      borderClass: 'border-emerald-600',
      icon: <Navigation className="w-3.5 h-3.5 text-emerald-200 shrink-0" />,
      action: () => handleWasalnyDirectNavigate(),
    },
    {
      key: 'golden_card' as const,
      label: 'كارت الولاء الذهبي 💳',
      description: 'كارت الولاء الذهبي ورصيد النقاط والخصومات',
      badgeClass: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black',
      borderClass: 'border-amber-500',
      icon: <CreditCard className="w-3.5 h-3.5 text-slate-950 shrink-0" />,
      action: () => setActivePage('loyalty'),
    },
    {
      key: 'rewards' as const,
      label: 'استبدال النقاط 🎁',
      description: 'استبدال نقاط الولاء بهدايا وباقات مجانية',
      badgeClass: 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800',
      borderClass: 'border-slate-200',
      icon: <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
      action: () => setActivePage('loyalty'),
    },
    {
      key: 'maintenance' as const,
      label: 'جدول الصيانة 🔧',
      description: 'جدول الصيانة الدورية وفحص أسطوانة الغاز',
      badgeClass: 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800',
      borderClass: 'border-slate-200',
      icon: <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
      action: () => setActivePage('maintenance'),
    },
    {
      key: 'history' as const,
      label: 'سجل التموينات 📋',
      description: 'سجل التموينات السابقة والوفر المالي',
      badgeClass: 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800',
      borderClass: 'border-slate-200',
      icon: <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
      action: () => setActivePage('history'),
    },
    {
      key: 'rating' as const,
      label: 'تقييم الفني ⭐',
      description: 'تقييم الفني وجودة الخدمة بالمحطة',
      badgeClass: 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900',
      borderClass: 'border-amber-200',
      icon: <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />,
      action: () => {
        setFeedbackInitialTab('rating');
        setIsFeedbackModalOpen(true);
      },
    },
    {
      key: 'complaints' as const,
      label: 'خدمة العملاء 19058 📨',
      description: 'صندوق الشكاوى والمقترحات والخط الساخن 19058',
      badgeClass: 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900',
      borderClass: 'border-rose-200',
      icon: <MessageSquare className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
      action: () => {
        setFeedbackInitialTab('complaint');
        setIsFeedbackModalOpen(true);
      },
    },
    {
      key: 'chat' as const,
      label: 'شات الدعم 💬',
      description: 'مراسلة خدمة العملاء والدعم الفني المباشر',
      badgeClass: 'bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900',
      borderClass: 'border-blue-200',
      icon: <Headphones className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
      action: () => {
        setMessagingInitialChannel('customer_service');
        setIsMessagingModalOpen(true);
      },
    },
    {
      key: 'update_profile' as const,
      label: 'طلب تعديل بياناتي ✏️',
      description: 'إرسال طلب تعديل بيانات العميل أو السيارة لخدمة العملاء ومدير النظام',
      badgeClass: 'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-500/50 text-emerald-950 font-black',
      borderClass: 'border-emerald-500',
      icon: <Edit3 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      action: () => setIsUpdateRequestModalOpen(true),
    },
  ];

  return (
    <div className="space-y-6" onClick={handlePageTapGesture}>
      {/* In-Page Dynamic Layout Editor Toolbar (مخصص حصرياً لمدير النظام أثناء المعاينة) */}
      {isAdminPreview && (
        <DynamicInPageLayoutEditor
          pageType="driver"
          config={config}
          onUpdateConfig={onUpdateConfig}
          onSectionsChange={(updated) => setDriverSections(updated)}
          currentSections={driverSections}
          isEditMode={isLayoutEditMode}
          onToggleEditMode={(enabled) => setIsLayoutEditMode(enabled)}
        />
      )}

      {/* Floating Click Progress Counter for Admin Tap Gesture (10 نقرات متتالية لفتح كلمة سر مدير النظام - للمدير فقط) */}
      {isAdminPreview && clickCount >= 3 && clickCount < 10 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-amber-300 border-2 border-amber-400 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce text-xs font-black">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
          <span>🔐 نقرات وضع التحرير لمدير النظام: {clickCount} من 10 (اضغط {10 - clickCount} مرات إضافية)</span>
        </div>
      )}
      {/* Main Layout with Unified Viewport and Direct Maximized Map */}
      <div className="space-y-6">
          
          {/* Prominent Return Bar whenever viewing any subpage */}
          {activePage !== 'home' && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-4 rounded-3xl shadow-xl border-2 border-emerald-400/60 flex flex-wrap items-center justify-between gap-3 sticky top-4 z-40 backdrop-blur-md animate-in slide-in-from-top-4">
              <button
                type="button"
                onClick={() => {
                  setActivePage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-6 py-3 rounded-2xl transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 group"
                title="الرجوع إلى الخريطة والصفحة الرئيسية"
              >
                <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition" />
                <span>العودة للرئيسية (الخريطة والخدمات) ↩</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-200">أنت الآن في:</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black px-3.5 py-1.5 rounded-xl">
                  {activePage === 'loyalty' && '🎁 استبدال النقاط وبنك الهدايا'}
                  {activePage === 'maintenance' && '🔧 جدول الصيانة الذكي'}
                  {activePage === 'history' && '⛽ سجل التموينات'}
                  {activePage === 'map' && '🧭 كارجاس طريقنا واحد'}
                </span>
              </div>
            </div>
          )}

          {/* المساحة البيضاء الترحيبية: أهلاً بك صديق كارجاس وتستوعب كافة الأيقونات على صفين بحجم صغير */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/90 flex flex-col gap-4">
            {/* Top Bar: Greeting, Car Info, Points & Request Status */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/20 shrink-0">
                  🚗
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      أهلاً بك صديق كارجاس، {driver.name}
                    </h2>
                    <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 font-mono">
                      لوحة: {driver.carPlate}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      {driver.carModel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    سعة الأسطوانة: {driver.cngCylinderCapacity || 70} لتر • العداد: {driver.odometerKm?.toLocaleString()} كم
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                {/* Status of customer update request if pending or recent */}
                {latestDriverRequest && (
                  <div
                    onClick={() => setIsUpdateRequestModalOpen(true)}
                    className={`cursor-pointer px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition hover:scale-102 ${
                      latestDriverRequest.status === 'pending'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                        : latestDriverRequest.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                    title="انقر لعرض تفاصيل طلب تعديل البيانات"
                  >
                    <span>{latestDriverRequest.status === 'pending' ? '⏳' : latestDriverRequest.status === 'approved' ? '✓' : '✖'}</span>
                    <span className="font-bold">
                      {latestDriverRequest.status === 'pending'
                        ? 'طلب تعديل بياناتك قيد مراجعة خدمة العملاء'
                        : latestDriverRequest.status === 'approved'
                        ? 'تم اعتماد وتحديث بياناتك بنجاح'
                        : 'تم الرد على طلب التعديل'}
                    </span>
                  </div>
                )}

                {/* Points Badge (يظهر فقط إذا كان برنامج الولاء أو المكافآت مفعلاً من قبل مدير النظام) */}
                {(quickIconsVis.golden_card || quickIconsVis.rewards) && (
                  <div
                    onClick={() => setActivePage('loyalty')}
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-black text-emerald-800 flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                    title="عرض كارت الولاء واستبدال النقاط"
                  >
                    <span className="text-sm">🪙</span>
                    <span>{driver.points} نقطة ولاء</span>
                  </div>
                )}
              </div>
            </div>

            {/* شبكة الأيقونات والخدمات المتاحة للمستخدم كما حددها مدير النظام (بدون أي تكرار وبدون أدوات تحكم) */}
            <div className="pt-3 border-t border-slate-100 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                  <span>خدمات وتطبيقات كارجاس:</span>
                </span>
              </div>

              {quickIconsList.filter((item) => quickIconsVis[item.key] !== false).length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  <span>كافة الخدمات تحت الصيانة الدورية حالياً.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full">
                  {quickIconsList
                    .filter((item) => quickIconsVis[item.key] !== false)
                    .map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={item.action}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition active:scale-95 shadow-xs text-right cursor-pointer ${item.badgeClass}`}
                        title={item.description}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Content Viewport (Full Width) */}
          <div className="space-y-6">

            {/* View 1: Dynamic Home Sections Driven by In-Page Layout Customizer */}
            {activePage === 'home' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in">
                {[...driverSections]
                  .sort((a, b) => a.order - b.order)
                  .filter((sec) => {
                    if (isLayoutEditMode) return true;
                    if (!sec.visible) return false;
                    // الفصل المستقل بتحكم مدير النظام: إخفاء النظام تماماً بدون أن يعلم العميل
                    if (customerViewMode === 'navigation_only') {
                      if (sec.id === 'golden_loyalty_card' || sec.id === 'rewards_bank' || sec.id === 'promotional_banner') return false;
                    }
                    if (customerViewMode === 'loyalty_only') {
                      if (sec.id === 'wasalny_hero' || sec.id === 'nearest_station_repeat_bar') return false;
                    }
                    // إخفاء كارت كارجاس الذهبي من الرئيسية إذا اختار العميل إخفاءه
                    if (!quickIconsVis.golden_card && (sec.id === 'golden_loyalty_card' || sec.id === 'golden_card')) {
                      return false;
                    }
                    return true;
                  })
                  .map((section) => {
                    const colClass =
                      section.colSpan === 12
                        ? 'col-span-12'
                        : section.colSpan === 7
                        ? 'col-span-12 md:col-span-7'
                        : section.colSpan === 6
                        ? 'col-span-12 md:col-span-6'
                        : section.colSpan === 5
                        ? 'col-span-12 md:col-span-5'
                        : 'col-span-12 md:col-span-4';

                    const isDragging = draggedSectionId === section.id;

                    return (
                      <div
                        key={section.id}
                        id={`section-${section.id}`}
                        className={`${colClass} scroll-mt-24 transition-all duration-200 ${
                          isLayoutEditMode
                            ? 'p-3 rounded-3xl border-2 border-dashed border-amber-400/90 bg-amber-50/15 shadow-md relative'
                            : ''
                        } ${!section.visible && isLayoutEditMode ? 'opacity-40 grayscale' : ''} ${
                          isDragging ? 'opacity-40 scale-98' : ''
                        }`}
                        onDragOver={(e) => {
                          if (isLayoutEditMode) {
                            e.preventDefault();
                          }
                        }}
                        onDrop={() => {
                          if (isLayoutEditMode) {
                            handleDrop(section.id);
                          }
                        }}
                      >
                        {/* Section Edit Header Overlay (سحب وإفلات وتكبير وتصغير وإخفاء) */}
                        <SectionEditControls
                          section={section}
                          isEditMode={isLayoutEditMode}
                          onMoveUp={() => handleMoveUp(section.id)}
                          onMoveDown={() => handleMoveDown(section.id)}
                          onChangeColSpan={(span) => handleChangeColSpan(section.id, span)}
                          onChangeHeightMode={(mode) => handleChangeHeightMode(section.id, mode)}
                          onToggleVisibility={() => handleToggleVisibility(section.id)}
                          onDragStart={() => handleDragStart(section.id)}
                        />
                        {/* 0. المساحة الخضراء: بانر الترحيب الرئيسي وبيانات السائق (قابلة للنقل والتحجيم والتنسيق) */}
                        {section.id === 'driver_welcome_banner' && (
                          <div
                            className={`bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between ${
                              section.heightMode === 'compact'
                                ? 'p-4 sm:p-5'
                                : section.heightMode === 'expanded'
                                ? 'p-8 sm:p-10'
                                : 'p-6'
                            }`}
                          >
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col gap-3.5 h-full">
                              {/* Driver greeting & status bar */}
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                <div className="space-y-1.5">
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
                                    <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                      🪙 {driver.points} نقطة
                                    </span>
                                  </div>

                                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                                    أهلاً بك، {driver.name} 🚗
                                  </h2>
                                  <p className="text-xs sm:text-sm text-emerald-100 font-light leading-relaxed">
                                    {config.customTexts.welcomeDriver}
                                  </p>
                                </div>

                                {/* Status of customer update request if pending or recent */}
                                {latestDriverRequest && (
                                  <div
                                    onClick={() => setIsUpdateRequestModalOpen(true)}
                                    className={`cursor-pointer p-2.5 rounded-2xl border text-xs flex items-center gap-2 transition hover:scale-102 ${
                                      latestDriverRequest.status === 'pending'
                                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 shadow-sm'
                                        : latestDriverRequest.status === 'approved'
                                        ? 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200'
                                        : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                                    }`}
                                    title="انقر لعرض تفاصيل طلب تعديل البيانات"
                                  >
                                    <span className="text-base shrink-0">
                                      {latestDriverRequest.status === 'pending' ? '⏳' : latestDriverRequest.status === 'approved' ? '✓' : '✖'}
                                    </span>
                                    <div className="text-right">
                                      <div className="font-bold flex items-center gap-1.5">
                                        <span>
                                          {latestDriverRequest.status === 'pending'
                                            ? 'طلب تعديل بياناتك قيد مراجعة خدمة العملاء'
                                            : latestDriverRequest.status === 'approved'
                                            ? 'تم اعتماد وتحديث بياناتك بنجاح'
                                            : 'تم الرد على طلب التعديل'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] opacity-80 block">
                                        انقر لعرض التفاصيل وتتبع حالة طلبك 🔍
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* شريط معلوماتي مختصر دون تكرار الأيقونات */}
                              <div className="pt-2 border-t border-emerald-700/40 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200/90 font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>كافة الخدمات والتطبيقات متاحة بشريط التحكم الأبيض المدمج بالأعلى ☝️</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-emerald-300/80">
                                  <span>الخط الساخن: 19058</span>
                                  <span>•</span>
                                  <span>كارجاس رائدة الغاز الطبيعي للمركبات</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 0.1 المساحة الزرقاء: شريط رصد أقرب محطة وتكرار التموين GPS (قابلة للنقل والتحجيم والتنسيق) */}
                        {section.id === 'nearest_station_repeat_bar' && v.showFuelingCountStats && (
                          <div
                            className={`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg border border-slate-700/80 h-full ${
                              section.heightMode === 'compact'
                                ? 'p-3.5 sm:p-4'
                                : section.heightMode === 'expanded'
                                ? 'p-6 sm:p-7'
                                : 'p-4 sm:p-5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                                ⛽
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] text-slate-400 block font-medium">
                                    كارجاس أقرب لك (رصد تلقائي عبر GPS 🛰️):
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

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-700">
                              <div className="text-right">
                                <span className="text-[10px] text-emerald-400 block font-normal">مرات تموينك من هذه المحطة:</span>
                                <span className="text-sm sm:text-base font-black font-mono text-white">
                                  {currentStationCounts.stationCount} مرات تموين
                                </span>
                              </div>

                              <div className="text-right border-r border-slate-700 pr-3 sm:pr-4">
                                <span className="text-[10px] text-amber-400 block font-normal">مرات تموينك من نفس الطلمبة:</span>
                                <span className="text-sm sm:text-base font-black font-mono text-white">
                                  {currentStationCounts.pumpCount} مرات
                                </span>
                              </div>

                              {/* زر الملاحة المباشر لأقرب محطة */}
                              <button
                                type="button"
                                onClick={() => handleWasalnyDirectNavigate(activeDetectedStation || undefined)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-3.5 py-2 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition active:scale-95 border border-emerald-400/40 shrink-0 cursor-pointer"
                                title="الملاحة الفورية لأقرب محطة"
                              >
                                <Navigation className="w-3.5 h-3.5 text-amber-300" />
                                <span>الملاحة للمحطة 📍</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 1. Wasalny Live Direct Application (كارجاس طريقنا واحد — خريطة مكبرة وملاحة حية مدمجة) */}
                        {section.id === 'wasalny_hero' && v.showNearestStationMap && (
                          <div id="cargas-maximized-map" className="bg-slate-950 rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl relative flex flex-col scroll-mt-24">
                            {/* Prominent Header Card for Maximized Map */}
                            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-4 sm:p-5 border-b border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center text-2xl font-black shrink-0 shadow-lg">
                                  🧭
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-base sm:text-xl font-black text-white">
                                      كارجاس طريقنا واحد
                                    </h3>
                                    <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold">
                                      خريطة مكبرة وملاحة حية مباشرة
                                    </span>
                                  </div>
                                  <p className="text-xs text-emerald-100 font-light mt-0.5">
                                    الملاحة الذكية والتوجيه المباشر لأقرب محطة غاز كارجاس لموقعك الحالي 🚗
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                                {/* The Single Primary Action: أقرب محطة كارجاس */}
                                <button
                                  type="button"
                                  onClick={() => handleWasalnyDirectNavigate()}
                                  className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl transition shadow-xl shadow-emerald-500/20 flex items-center gap-2 active:scale-95 cursor-pointer ring-2 ring-emerald-300/40"
                                  title="بدء الملاحة المباشرة لأقرب محطة كارجاس عبر خرائط جوجل"
                                >
                                  <Navigation className="w-4 h-4 text-slate-950 fill-slate-950" />
                                  <span>أقرب محطة كارجاس 📍</span>
                                </button>

                                {/* Reset button when navigation is active */}
                                {isNavActiveRequested && (
                                  <button
                                    type="button"
                                    onClick={handleCancelNavigation}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 active:scale-95"
                                    title="العودة لنظرة عامة على الخريطة"
                                  >
                                    <X className="w-4 h-4 text-slate-400" />
                                    <span>إلغاء الملاحة</span>
                                  </button>
                                )}
                              </div>
                            </div>

                              <div className="h-[580px] sm:h-[680px] w-full relative">
                               <CargasNavApp
                                 key={navKey}
                                 autoStartNearest={false}
                                 startNavigationDirectly={isNavActiveRequested}
                                 initialTargetStationId={targetNavigationStationId || undefined}
                                 isPermanentMuted={true}
                               />
                             </div>
                          </div>
                        )}

                        {/* 2. QR Vehicle Card */}
                        {section.id === 'qr_vehicle_card' && (
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col items-center justify-between space-y-4 text-center h-full">
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
                        )}

                        {/* 3. Golden Loyalty Card */}
                        {section.id === 'golden_card' && v.showGoldenCard && quickIconsVis.golden_card && (
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
                                <span className="text-[10px] text-amber-100 block">فئة العضوية:</span>
                                <span className="text-base font-extrabold text-white">
                                  {driver.points >= 500 ? 'عضوية بلاتينية VIP ⭐' : driver.points >= 200 ? 'عضوية ذهبية 🌟' : 'عضوية فضية ✨'}
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

                        {/* 4. Fueling Count Stats & Total Savings */}
                        {section.id === 'fueling_count_stats' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                            {v.showFuelingCountStats && (
                              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 p-4 rounded-2xl border border-emerald-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                                    🔄
                                  </div>
                                  <div>
                                    <h4 className="font-black text-xs sm:text-sm text-slate-900">
                                      تكرار التموين في محطة {activeStationName}
                                    </h4>
                                    <p className="text-[11px] text-slate-600">
                                      تم التموين من هذه المحطة <span className="font-bold text-emerald-700 font-mono">#{currentStationCounts.stationCount}</span> مرة
                                    </p>
                                  </div>
                                </div>
                                <span className="bg-white px-3 py-1 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800">
                                  عميل كارجاس الوفي ⭐
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 5. Rewards Bank Quick Strip */}
                        {section.id === 'rewards_bank' && v.showRewardsBank && (
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <Gift className="w-5 h-5 text-emerald-600" />
                                <div>
                                  <h3 className="font-black text-sm text-slate-900">بنك مكافآت وأمتار كارجاس المجانية</h3>
                                  <p className="text-[11px] text-slate-500">استبدل نقاطك بأمتار غاز أو هدايا معتمدة</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setActivePage('loyalty')}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                              >
                                <span>عرض الكل</span>
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {rewards
                                .filter((r) => r.isActive !== false)
                                .slice(0, 3)
                                .map((r) => {
                                  const canAfford = driver.points >= r.pointsCost;
                                  return (
                                    <div key={r.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
                                      <div>
                                        <h4 className="font-black text-xs text-slate-900">{r.title}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[11px] text-amber-700 font-black">{r.pointsCost} نقطة ولاء</span>
                                          {r.valueText && (
                                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                              {r.valueText}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleRedeemReward(r)}
                                        disabled={!canAfford}
                                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition ${
                                          canAfford ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                      >
                                        {canAfford ? 'استبدال' : 'غير كافٍ'}
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* 6. Maintenance Schedule Quick Summary */}
                        {section.id === 'maintenance_schedule' && v.showMaintenanceSchedule && (
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                <div>
                                  <h3 className="font-black text-sm text-slate-900">جدول الصيانة الدورية وتنبيهات الأمان</h3>
                                  <p className="text-[11px] text-slate-500">حالة دورات صيانة الغاز الطبيعي والسيارة</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsBookingModalOpen(true)}
                                  className="text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1 active:scale-95"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>حجز موعد فحص/صيانة 📅</span>
                                </button>
                                <button
                                  onClick={() => setActivePage('maintenance')}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                  <span>الجدول</span>
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {driver.maintenanceSchedule.slice(0, 2).map((item) => {
                                const kmRemaining = item.nextDueKm - driver.odometerKm;
                                return (
                                  <div key={item.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-800">{item.name}</span>
                                      <span className={`font-mono text-[11px] font-bold ${kmRemaining <= 500 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                        {kmRemaining > 0 ? `متبقي ${kmRemaining.toLocaleString()} كم` : 'موعد الصيانة حان'}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${kmRemaining <= 500 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, Math.max(10, 100 - (kmRemaining / item.intervalKm) * 100))}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 7. Fueling History Quick Preview */}
                        {section.id === 'fueling_history' && v.showFuelingHistory && (
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                <div>
                                  <h3 className="font-black text-sm text-slate-900">سجل آخر التفويلات</h3>
                                  <p className="text-[11px] text-slate-500">أحدث عمليات تموين الغاز المسجلة</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setActivePage('history')}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                              >
                                <span>السجل بالكامل</span>
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="divide-y divide-slate-100">
                              {transactions.slice(0, 3).map((tx) => (
                                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                      ⛽
                                    </span>
                                    <div>
                                      <span className="font-bold text-slate-800">{tx.stationName} (مضخة #{tx.pumpNumber})</span>
                                      <span className="text-[10px] text-slate-400 block font-mono">
                                        {new Date(tx.timestamp).toLocaleDateString('ar-EG')}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-left font-mono">
                                    <span className="font-black text-slate-900">{tx.metersQuantity} م³</span>
                                    <span className="text-[10px] text-emerald-600 font-bold block">+{tx.pointsEarned} نقطة</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 8. Promotional Banner (بانر العروض الترويجية والمسابقات - قابل للتحريك وإعادة الترتيب) */}
                        {section.id === 'promotional_banner' && v.showPromotionalBanner && activeCampaigns.length > 0 && (
                          <div className="relative overflow-hidden rounded-3xl shadow-xl border border-slate-700/50 h-full">
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
                                  className={`text-white bg-gradient-to-r ${camp.bannerGradient || 'from-indigo-950 via-slate-900 to-slate-950'} transition-all duration-500 relative h-full flex flex-col justify-between ${
                                    section.heightMode === 'compact'
                                      ? 'p-4 sm:p-5'
                                      : section.heightMode === 'expanded'
                                      ? 'p-8 sm:p-9'
                                      : 'p-6 sm:p-7'
                                  }`}
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
                                          <span>مكافأة فورية: +{camp.pointsReward} نقطة ولاء 🪙</span>
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
                                    <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 w-full lg:w-auto shrink-0">
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

                        {/* 9. Service Rating Card */}
                        {section.id === 'service_rating' && v.showServiceRating && (
                          <div
                            onClick={() => {
                              setFeedbackInitialTab('rating');
                              setIsFeedbackModalOpen(true);
                            }}
                            className="bg-gradient-to-tr from-amber-50 to-yellow-50 p-5 rounded-3xl border border-amber-200 shadow-xs cursor-pointer hover:shadow-md transition flex items-center justify-between h-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shrink-0">
                                ⭐
                              </div>
                              <div>
                                <h4 className="font-black text-sm text-slate-900">تقييم الفني والخدمة</h4>
                                <p className="text-xs text-slate-600">شاركنا رأيك في تجربة التموين وساهم في تحسين الخدمة</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shrink-0">
                              قيّم الآن ←
                            </span>
                          </div>
                        )}

                        {/* 10. Complaints Box Card */}
                        {section.id === 'complaints_box' && v.showComplaintsBox && (
                          <div
                            onClick={() => {
                              setFeedbackInitialTab('complaint');
                              setIsFeedbackModalOpen(true);
                            }}
                            className="bg-gradient-to-tr from-rose-50 to-pink-50 p-5 rounded-3xl border border-rose-200 shadow-xs cursor-pointer hover:shadow-md transition flex items-center justify-between h-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl font-black shrink-0">
                                📨
                              </div>
                              <div>
                                <h4 className="font-black text-sm text-slate-900">صندوق الشكاوى والمقترحات</h4>
                                <p className="text-xs text-slate-600">صوتك مسموع مباشرة لدى إدارة شركة كارجاس</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-rose-800 bg-white px-3 py-1.5 rounded-xl border border-rose-300 shrink-0">
                              إرسال مقترح ←
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* View 2: Loyalty & Rewards Bank */}
            {activePage === 'loyalty' && v.showRewardsBank && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePage('home');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                      title="العودة للصفحة الرئيسية"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>العودة للرئيسية ↩</span>
                    </button>
                    <div>
                      <h3 className="font-black text-base text-slate-900">
                        استبدال نقاط الولاء بهدايا ومكافآت كارجاس 🎁
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        اختر المكافأة التي تناسبك واستبدلها فوراً بكود معتمد صالح في جميع محطات ومراكز كارجاس
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 shrink-0">
                    رصيدك الحالي: {driver.points} نقطة ولاء 🪙
                  </span>
                </div>

                {/* Financial Endorsement Banner for Rewards Bank */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💼</span>
                    <span className="font-black text-emerald-950">
                      معتمد رسمياً من الإدارة المالية لكارجاس:
                    </span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      تكلفة النقطة {config.loyaltyCostModel?.costPerPointEgp || 0.15} ج/نقطة
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    جميع نقاط الهدايا محسوبة بدقة وتتغير تلقائياً مع قرارات الإدارة المالية
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
                  {rewards
                    .filter((r) => r.isActive !== false)
                    .map((reward) => {
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
                              <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                                {reward.pointsCost} نقطة ولاء
                              </span>
                            </div>
                            <h4 className="font-black text-sm text-slate-900">{reward.title}</h4>
                            {reward.valueText && (
                              <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {reward.valueText}
                              </span>
                            )}
                            <p className="text-xs text-slate-500 leading-relaxed">{getCustomerRewardDescription(reward)}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-700">مكافأة معتمدة ✓</span>
                            <button
                              onClick={() => handleRedeemReward(reward)}
                              disabled={!canAfford}
                              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                                canAfford
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95'
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

                {/* Active Vouchers & Coupons List */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span>قسائم الهدايا وكوبونات الخصم ومنتجات الصيانة الخاصة بك (كود الصرف لدى المحطة والشركاء)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      إجمالي القسائم: {redemptions.length}
                    </span>
                  </div>

                  {redemptions.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500">
                      لم تقم باستبدال أي قسائم بعد. عندما تجمع نقاطاً وتستبدلها بهدايا أو زيوت أو كوبونات خصم ستظهر قسيمتك هنا مع كود الصرف الخاص بك.
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
                                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    هدية / كوبون معتمد 🎁
                                  </span>
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

                {/* Return Button at Bottom of Loyalty Page */}
                <div className="pt-6 border-t border-slate-200 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-8 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة للصفحة الرئيسية والخريطة ↩</span>
                  </button>
                </div>
              </div>
            )}

            {/* View 3: Maintenance Schedule */}
            {activePage === 'maintenance' && v.showMaintenanceSchedule && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePage('home');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                      title="العودة للصفحة الرئيسية"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>العودة للرئيسية ↩</span>
                    </button>
                    <div>
                      <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        جدول الصيانة الذكي وتنبيهات الأمان
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {config.customTexts.maintenanceNotice}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(true)}
                      className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>حجز موعد فحص أسطوانة أو صيانة 📅</span>
                    </button>
                    <a
                      href={`https://wa.me/201012345678?text=${encodeURIComponent('مرحباً خدمة عملاء كارجاس 19058، أود الاستفسار وتأكيد مواعيد الصيانة وفحص أسطوانة سيارتي.')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                      title="تواصل مباشرة مع خدمة العملاء للتأكيد أو الاستفسار"
                    >
                      <Headphones className="w-4 h-4 text-emerald-600" />
                      <span>خدمة العملاء 19058 🎧</span>
                    </a>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-slate-500">العداد الحالي:</span>
                      <span className="font-mono font-black text-slate-900">
                        {driver.odometerKm.toLocaleString()} كم
                      </span>
                    </div>
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

                {/* Return Button at Bottom of Maintenance Page */}
                <div className="pt-6 border-t border-slate-200 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-8 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة للصفحة الرئيسية والخريطة ↩</span>
                  </button>
                </div>
              </div>
            )}

            {/* View 4: Fueling History */}
            {activePage === 'history' && v.showFuelingHistory && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePage('home');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                      title="العودة للصفحة الرئيسية"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>العودة للرئيسية ↩</span>
                    </button>
                    <div>
                      <h3 className="font-black text-base text-slate-900">
                        سجل تفويلات ومعاملات الغاز الطبيعي
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        تتبع كميات الغاز المستهلكة، رقم التموين من كل محطة وطلمبة، والنقاط المكتسبة
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-amber-100 transition shrink-0"
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

                {/* Return Button at Bottom of History Page */}
                <div className="pt-6 border-t border-slate-200 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-8 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة للصفحة الرئيسية والخريطة ↩</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Floating Return Button at bottom of screen when on any subpage */}
      {activePage !== 'home' && (
        <button
          type="button"
          onClick={() => {
            setActivePage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-2xl border-2 border-white/50 flex items-center gap-2 active:scale-95 cursor-pointer animate-in fade-in"
          title="الرجوع للرئيسية فوراً"
        >
          <ArrowRight className="w-5 h-5" />
          <span>الرجوع للرئيسية ↩</span>
        </button>
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
              {customerViewMode !== 'navigation_only' && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-black">رصيد الولاء:</span>
                  <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md">
                    {driver.points} نقطة
                  </span>
                </div>
              )}
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
                        } else if (item.id === 'map') {
                          handleWasalnyDirectNavigate();
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
                  handleWasalnyDirectNavigate(activeDetectedStation || undefined);
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

              {/* Option 4: Smart Delivery / Dispatch (Strictly Controlled by System Admin) */}
              {config.wasalnyConfig?.enableSmartDeliveryForCustomers && (
                <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚀</span>
                      <span className="font-black text-xs text-teal-900">خدمة التوصيل الذكي (مفعلة بإذن مدير النظام)</span>
                    </div>
                    <span className="text-[10px] bg-teal-200 text-teal-900 font-bold px-2 py-0.5 rounded-full">
                      مصرّح رسمياً
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    {config.wasalnyConfig.smartDeliveryNoteForCustomers || 'خدمة التوصيل الذكي لنقل أو صيانة الأسطوانات متاحة بتوجيه الإدارة.'}
                  </p>
                  <button
                    onClick={() => {
                      setIsStationNavModalOpen(false);
                      setActivePage('map');
                    }}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition"
                  >
                    فتح مسار التوصيل والتحرك للموقع 📍
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
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

      {/* Service Appointments & Smart Reallocation Modal */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        driver={driver}
        stations={stations}
      />

      {/* 2-Way Direct Customer Messaging Modal */}
      <CustomerMessagingModal
        isOpen={isMessagingModalOpen}
        onClose={() => setIsMessagingModalOpen(false)}
        driver={driver}
        initialChannel={messagingInitialChannel}
      />

      {/* 10-Clicks Admin Verification Modal (التحقق الأمني لتفعيل التحرير بالسحب والإفلات - خاص بمعاينة المدير فقط) */}
      {isAdminPreview && (
        <AdminPinVerifyModal
          isOpen={isAdminPinModalOpen}
          onClose={() => setIsAdminPinModalOpen(false)}
          correctPin={config.adminPin || '0000'}
          onSuccess={() => {
            setIsAdminPinModalOpen(false);
            setIsLayoutEditMode(true);
          }}
        />
      )}

      {/* Standalone Fueling QR Modal (نافذة مستقلة لإظهار كود الـ QR للتموين وإغلاقها فور الانتهاء) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative border-2 border-blue-500 animate-in zoom-in-95">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-black shadow-md">
              📱
            </div>

            <div>
              <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black px-3 py-1 rounded-full">
                كود التموين السريع المعتمد لكارجاس
              </span>
              <h3 className="text-base font-black text-slate-900 mt-2">
                امسح الكود عبر جهاز فني التموين
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {driver.name} • {driver.carPlate}
              </p>
            </div>

            {/* The QR Image */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-blue-300 inline-block shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Customer Fueling QR"
                  className="w-56 h-56 mx-auto rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                  جارٍ توليد الكود...
                </div>
              )}
            </div>

            <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold">
              🪙 رصيدك الحالي: {driver.points} نقطة ولاء
            </div>

            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-2xl transition text-xs shadow-md active:scale-95"
            >
              إغلاق النافذة بعد الانتهاء من المسح ✕
            </button>
          </div>
        </div>
      )}

      {/* Customer Data Update Request Modal (طلب تعديل بيانات العميل لخدمة العملاء ومدير النظام) */}
      {isUpdateRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative border-2 border-emerald-500 animate-in zoom-in-95 text-right">
            <button
              onClick={() => setIsUpdateRequestModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-md shrink-0">
                ✏️
              </div>
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  خدمة العملاء ومدير النظام
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  طلب تعديل بيانات العميل والسيارة
                </h3>
                <p className="text-xs text-slate-500">
                  كود العميل: {driver.id} • لوحة: {driver.carPlate}
                </p>
              </div>
            </div>

            {reqSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold animate-in fade-in flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reqSuccessMsg}</span>
              </div>
            )}

            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-emerald-950 mb-1">
                <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>كيف يعمل تعديل البيانات؟</span>
              </p>
              أدخل البيانات الجديدة التي تريد تحديثها في المنظومة. سيصل طلبك فوراً إلى مكتب خدمة العملاء ومدير النظام، وسيقومون بمراجعته واعتماده لتحديث بياناتك في الحال.
            </div>

            {/* Recent Requests History by Customer */}
            {customerRequests.length > 0 && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    طلباتك السابقة ({customerRequests.length}):
                  </span>
                  <span className="text-[10px] text-slate-500">تحديث تلقائي</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {customerRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          طلب رقم #{req.id.slice(-6)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {req.status === 'pending'
                            ? 'قيد المراجعة ⏳'
                            : req.status === 'approved'
                            ? 'تم الاعتماد والتحديث ✓'
                            : 'مرفوض ✖'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {req.requestedCarPlate !== req.currentCarPlate && (
                          <span className="ml-2 font-mono">اللوحة: {req.requestedCarPlate}</span>
                        )}
                        {req.requestedCarModel !== req.currentCarModel && (
                          <span className="ml-2">السيارة: {req.requestedCarModel}</span>
                        )}
                        {req.requestedPhone !== req.driverPhone && (
                          <span className="ml-2">الهاتف: {req.requestedPhone}</span>
                        )}
                      </div>
                      {req.adminNotes && (
                        <div className="text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-slate-700">
                          <span className="font-bold text-slate-900">رد خدمة العملاء:</span> {req.adminNotes}
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400">
                        {new Date(req.submittedAt).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update Request Submission Form */}
            <form onSubmit={handleSubmitCustomerRequest} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم العميل المطلوب:
                  </label>
                  <input
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف الجديد:
                  </label>
                  <input
                    type="tel"
                    required
                    value={reqPhone}
                    onChange={(e) => setReqPhone(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم لوحة السيارة الجديد:
                  </label>
                  <input
                    type="text"
                    required
                    value={reqPlate}
                    onChange={(e) => setReqPlate(e.target.value)}
                    placeholder="مثال: س ر ع 1 2 3"
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نوع / موديل السيارة:
                  </label>
                  <input
                    type="text"
                    required
                    value={reqModel}
                    onChange={(e) => setReqModel(e.target.value)}
                    placeholder="مثال: هيونداي فيرنا 2022"
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعة أسطوانة الغاز (لتر):
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="140"
                    value={reqCapacity}
                    onChange={(e) => setReqCapacity(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    قراءة العداد الحالية (كم):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reqOdo}
                    onChange={(e) => setReqOdo(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب التعديل أو ملاحظات لخدمة العملاء:
                </label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="مثال: تم تجديد رخصة السيارة وتغيير اللوحات، أو تم تغيير أسطوانة الغاز لأخرى 80 لتر..."
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 rounded-2xl transition shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReq ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التعديل لخدمة العملاء 📤'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUpdateRequestModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
