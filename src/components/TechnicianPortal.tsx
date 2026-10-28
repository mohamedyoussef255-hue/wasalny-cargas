import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  QrCode,
  MapPin,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Fuel,
  Printer,
  ShieldCheck,
  User,
  Car,
  Phone,
  RefreshCw,
  LogOut,
  Smartphone,
  Check,
  Hash,
  Clock,
  Compass,
  Award,
  Star,
  TrendingUp,
  Smile,
  Coins,
  Medal,
  Gauge,
  Zap,
  Gift,
} from 'lucide-react';
import {
  AppConfig,
  DriverProfile,
  FuelingTransaction,
  TechnicianCrewMember,
  AntiFraudLog,
  FuelingSession,
  RewardRedemption,
  SectionLayoutItem,
  SectionColSpan,
  SectionHeightMode,
} from '../types';
import { parseDriverQrData } from '../services/qrService';
import {
  saveTransactions,
  saveDriverProfile,
  getDriverProfile,
  saveStationCrew,
  addFraudLog,
  getDriverStationAndPumpFuelingCounts,
  getRedemptions,
  saveRedemptions,
  getFuelingSessions,
  saveFuelingSessions,
  DEFAULT_TECHNICIAN_SECTIONS,
  getTransactions,
} from '../services/storageService';
import { RefuelingTechnicianPortal } from './RefuelingTechnicianPortal';
import { TechnicianQrScanner } from './TechnicianQrScanner';
import { ScadaLiveFuelingScreen } from './ScadaLiveFuelingScreen';
import { simulateScadaSignal } from '../services/scadaService';
import {
  DynamicInPageLayoutEditor,
  SectionEditControls,
  AdminPinVerifyModal,
} from './DynamicInPageLayoutEditor';

interface TechnicianPortalProps {
  config: AppConfig;
  stationCrew: TechnicianCrewMember[];
  currentDriver: DriverProfile;
  transactions: FuelingTransaction[];
  onUpdateCrew: (crew: TechnicianCrewMember[]) => void;
  onUpdateDriver: (driver: DriverProfile) => void;
  onUpdateTransactions: (txs: FuelingTransaction[]) => void;
  onUpdateConfig?: (config: AppConfig) => void;
}

export const TechnicianPortal: React.FC<TechnicianPortalProps> = ({
  config,
  stationCrew,
  currentDriver,
  transactions,
  onUpdateCrew,
  onUpdateDriver,
  onUpdateTransactions,
  onUpdateConfig,
}) => {
  // Dynamic In-Page Layout Customization State (5-Clicks Gesture by Admin)
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Sections State (التحكم المباشر في ترتيب ومقاسات وإظهار/إخفاء المساحات)
  const [techSections, setTechSections] = useState<SectionLayoutItem[]>(() => {
    return config.layoutSettings?.technicianSections && config.layoutSettings.technicianSections.length > 0
      ? config.layoutSettings.technicianSections
      : DEFAULT_TECHNICIAN_SECTIONS;
  });

  useEffect(() => {
    if (config.layoutSettings?.technicianSections && config.layoutSettings.technicianSections.length > 0) {
      setTechSections(config.layoutSettings.technicianSections);
    }
  }, [config.layoutSettings?.technicianSections]);

  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  // 5-Clicks Handler on Any Page Space (بالضغط على الصفحة خمس مرات متتالية)
  const handlePageTapGesture = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a, [draggable]')) return;

    const now = Date.now();
    if (now - lastClickTime < 2500) {
      const nextCount = clickCount + 1;
      setClickCount(nextCount);
      if (nextCount >= 5) {
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
    const sorted = [...techSections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === id);
    if (index <= 0) return;
    const prev = sorted[index - 1];
    const curr = sorted[index];
    const prevOrder = prev.order;
    prev.order = curr.order;
    curr.order = prevOrder;
    setTechSections([...techSections]);
  };

  const handleMoveDown = (id: string) => {
    const sorted = [...techSections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === id);
    if (index === -1 || index >= sorted.length - 1) return;
    const next = sorted[index + 1];
    const curr = sorted[index];
    const nextOrder = next.order;
    next.order = curr.order;
    curr.order = nextOrder;
    setTechSections([...techSections]);
  };

  const handleChangeColSpan = (id: string, colSpan: SectionColSpan) => {
    setTechSections(techSections.map((s) => (s.id === id ? { ...s, colSpan } : s)));
  };

  const handleChangeHeightMode = (id: string, heightMode: SectionHeightMode) => {
    setTechSections(techSections.map((s) => (s.id === id ? { ...s, heightMode } : s)));
  };

  const handleToggleVisibility = (id: string) => {
    setTechSections(techSections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  const handleDragStart = (id: string) => {
    setDraggedSectionId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedSectionId || draggedSectionId === targetId) return;
    const sorted = [...techSections].sort((a, b) => a.order - b.order);
    const sourceIndex = sorted.findIndex((s) => s.id === draggedSectionId);
    const targetIndex = sorted.findIndex((s) => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const [moved] = sorted.splice(sourceIndex, 1);
    sorted.splice(targetIndex, 0, moved);
    const reordered = sorted.map((s, idx) => ({ ...s, order: idx + 1 }));
    setTechSections(reordered);
    setDraggedSectionId(null);
  };

  // Session & Shift State
  const [activeTechnician, setActiveTechnician] = useState<TechnicianCrewMember | null>(() => {
    return stationCrew.find((c) => c.isShiftActive) || null;
  });
  const [selectedTechId, setSelectedTechId] = useState(stationCrew[0]?.id || '');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // GPS Verification State (10 meters limit)
  const [gpsDistance, setGpsDistance] = useState<number>(3.8); // Default safe simulated distance
  const [isSimulatedGps, setIsSimulatedGps] = useState<boolean>(true);
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'verified' | 'out_of_range'>('verified');

  // Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scannedDriver, setScannedDriver] = useState<any | null>(null);

  // SCADA Active Session & History State
  const [activeScadaSession, setActiveScadaSession] = useState<FuelingSession | null>(() => {
    const all = getFuelingSessions();
    return all.find((s) => s.status === 'IN_PROGRESS') || null;
  });
  const [recentSessions, setRecentSessions] = useState<FuelingSession[]>(getFuelingSessions);

  // Listen to SCADA session updates in real-time
  useEffect(() => {
    const handleSessionsChange = () => {
      const all = getFuelingSessions();
      setRecentSessions(all);
      const active = all.find((s) => s.status === 'IN_PROGRESS') || null;
      setActiveScadaSession(active);
    };

    window.addEventListener('cargas_sessions_updated', handleSessionsChange);
    window.addEventListener('cargas_scada_session_completed', handleSessionsChange);

    return () => {
      window.removeEventListener('cargas_sessions_updated', handleSessionsChange);
      window.removeEventListener('cargas_scada_session_completed', handleSessionsChange);
    };
  }, []);

  // Fueling Transaction Form
  const [selectedPump, setSelectedPump] = useState<number>(1);
  const [gasMetersInput, setGasMetersInput] = useState<string>('18.0');
  const [odometerInput, setOdometerInput] = useState<string>(
    String(currentDriver.odometerKm || 85400)
  );
  const [transactionSuccess, setTransactionSuccess] = useState<FuelingTransaction | null>(null);
  const [fraudWarning, setFraudWarning] = useState<string>('');

  // Video element ref for real camera feed
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // View Mode: Direct Meter Fueling (Supabase DB) vs QR Loyalty Scanner
  const [technicianActiveView, setTechnicianActiveView] = useState<'refueling_meter' | 'loyalty_scanner'>('refueling_meter');

  const vt = config.visibility.technician;

  // Real or Simulated Geolocation
  const checkGeolocation = () => {
    if (isSimulatedGps) {
      setGpsDistance(3.8);
      setGpsStatus('verified');
      return;
    }

    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم التحقق من الموقع الجغرافي');
      setGpsStatus('out_of_range');
      return;
    }

    setGpsStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Haversine distance formula to station coordinates
        const R = 6371e3; // metres
        const φ1 = (latitude * Math.PI) / 180;
        const φ2 = (config.stationLat * Math.PI) / 180;
        const Δφ = ((config.stationLat - latitude) * Math.PI) / 180;
        const Δλ = ((config.stationLng - longitude) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        setGpsDistance(Number(distance.toFixed(1)));
        if (distance <= config.maxGpsRadiusMeters) {
          setGpsStatus('verified');
        } else {
          setGpsStatus('out_of_range');
          addFraudLog({
            type: 'distance_alert',
            severity: 'high',
            message: `محاولة تسجيل تموين خارج نطاق الـ 10 أمتار (المسافة: ${distance.toFixed(1)}م)`,
            details: `الفني: ${activeTechnician?.name || 'غير معروف'}`,
          });
        }
      },
      (err) => {
        console.warn('Geolocation error, falling back to simulated station GPS', err);
        setIsSimulatedGps(true);
        setGpsDistance(3.8);
        setGpsStatus('verified');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  useEffect(() => {
    checkGeolocation();
  }, [isSimulatedGps]);

  // Clean camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle Technician Shift Login
  const handleShiftLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const tech = stationCrew.find((c) => c.id === selectedTechId);
    if (!tech) {
      setLoginError('يرجى اختيار اسم الفني');
      return;
    }

    if (pinInput.trim() !== tech.dailyPin.trim()) {
      setLoginError(`الرقم السري غير صحيح! راجع رسالة الواتساب اليومية لكود الوردية.`);
      addFraudLog({
        type: 'unauthorized_pin',
        severity: 'medium',
        message: `محاولة إدخال رقم سري غير صحيح للفني ${tech.name}`,
        details: `PIN المدخل: ${pinInput}`,
      });
      return;
    }

    // Success login
    const updatedCrew = stationCrew.map((c) =>
      c.id === tech.id ? { ...c, isShiftActive: true } : c
    );
    setActiveTechnician({ ...tech, isShiftActive: true });
    onUpdateCrew(updatedCrew);
    saveStationCrew(updatedCrew);
    setPinInput('');
    setLoginError('');
  };

  const handleEndShift = () => {
    if (!activeTechnician) return;
    if (!confirm('هل تود إنهاء الوردية الحالية وإغلاق الحساب؟')) return;

    const updatedCrew = stationCrew.map((c) =>
      c.id === activeTechnician.id ? { ...c, isShiftActive: false } : c
    );
    setActiveTechnician(null);
    onUpdateCrew(updatedCrew);
    saveStationCrew(updatedCrew);
  };

  // Start Camera
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Unable to access camera hardware:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Scan or Inject Driver Data
  const handleScanDriver = (rawInput?: string) => {
    const text = rawInput || manualCodeInput;
    if (!text) {
      // Simulate scanning current driver
      setScannedDriver({
        isValid: true,
        driverId: currentDriver.id,
        name: currentDriver.name,
        phone: currentDriver.phone,
        carPlate: currentDriver.carPlate,
        carModel: currentDriver.carModel,
        capacity: currentDriver.cngCylinderCapacity || 70,
        odometer: currentDriver.odometerKm,
      });
      setOdometerInput(String(currentDriver.odometerKm + 120));
      stopCamera();
      return;
    }

    const parsed = parseDriverQrData(text);
    if (parsed.isValid) {
      setScannedDriver(parsed);
      if (parsed.isRewardRedemption && parsed.freeMeters) {
        setGasMetersInput(String(parsed.freeMeters));
      }
      setOdometerInput(String(parsed.odometer || currentDriver.odometerKm));
      setManualCodeInput('');
      stopCamera();
    } else {
      alert('كود الـ QR غير صالح أو غير مقروء');
    }
  };

  // Execute Fueling Transaction
  const handleExecuteFueling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTechnician) return;
    if (!scannedDriver) {
      alert('يرجى أولاً مسح كود الـ QR الخاص بسيارة السائق أو كود استبدال الهدية!');
      return;
    }

    if (gpsStatus === 'out_of_range') {
      alert('تنبيه أمان: لا يمكن إتمام التموين لأن موقعك الجغرافي خارج نطاق الـ 10 أمتار للمحطة!');
      return;
    }

    const isRedemption = Boolean(scannedDriver.isRewardRedemption);
    const meters = isRedemption
      ? (Number(scannedDriver.freeMeters) || parseFloat(gasMetersInput) || 10)
      : parseFloat(gasMetersInput);

    if (isNaN(meters) || meters <= 0) {
      alert('يرجى إدخال كمية غاز صحيحة بالمتر المكعب');
      return;
    }

    const maxSafeMeters = (scannedDriver.capacity || 70) * 0.45;
    if (!isRedemption && meters > maxSafeMeters) {
      const warn = `تنبيه أمان: الكمية المدخلة (${meters} م³) تتجاوز السعة القصوى لأسطوانة السيارة (${scannedDriver.capacity} لتر)!`;
      setFraudWarning(warn);
      addFraudLog({
        type: 'high_volume',
        severity: 'high',
        message: warn,
        details: `سيارة: ${scannedDriver.carPlate}، الفني: ${activeTechnician.name}`,
      });
      if (!confirm(`${warn}\nهل ترغب في التأكيد الإجباري ومسؤولية الفني؟`)) {
        return;
      }
    } else {
      setFraudWarning('');
    }

    const currentOdo = parseInt(odometerInput) || scannedDriver.odometer || 0;
    const pricePerMeter = config.gasPricePerMeter || 13;
    // For free meters redemption: Driver pays 0 EGP, full value calculated for technician & station credit
    const totalAmount = isRedemption ? 0 : parseFloat((meters * pricePerMeter).toFixed(2));
    const calculatedCreditEgp = parseFloat((meters * pricePerMeter).toFixed(2));
    const pointsEarned = isRedemption ? 0 : Math.floor(meters * (config.pointsPerMeter || 1));

    // Calculate Driver Fueling Frequency for Station and Pump
    const { stationCount, pumpCount } = getDriverStationAndPumpFuelingCounts(
      transactions,
      scannedDriver.driverId,
      config.stationName,
      selectedPump
    );

    const receiptNo = (isRedemption ? 'GIFT-' : 'CRG-') + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newTx: FuelingTransaction = {
      id: 'TX-' + Date.now(),
      receiptNumber: receiptNo,
      timestamp: new Date().toISOString(),
      driverId: scannedDriver.driverId,
      driverName: scannedDriver.name,
      carPlate: scannedDriver.carPlate,
      carModel: scannedDriver.carModel,
      technicianId: activeTechnician.id,
      technicianName: activeTechnician.name,
      stationName: config.stationName,
      pumpNumber: selectedPump,
      metersQuantity: meters,
      pricePerMeter,
      totalAmountEgp: totalAmount,
      pointsEarned,
      odometerReading: currentOdo,
      gpsDistanceMeters: gpsDistance,
      verifiedGps: true,
      driverStationFuelingCount: stationCount + 1,
      driverPumpFuelingCount: pumpCount + 1,
      isRewardRedemption: isRedemption,
      rewardRedemptionId: scannedDriver.redemptionId || scannedDriver.redemptionCode,
      rewardTitle: scannedDriver.rewardTitle,
    };

    // If free meters redemption, mark the voucher as used in storage
    if (isRedemption) {
      const allReds = getRedemptions();
      const updatedReds = allReds.map((r) => {
        if (
          (scannedDriver.redemptionId && r.id === scannedDriver.redemptionId) ||
          (scannedDriver.redemptionCode && r.redemptionCode === scannedDriver.redemptionCode)
        ) {
          return {
            ...r,
            isUsed: true,
            usedAt: new Date().toISOString(),
            usedAtStation: config.stationName,
            dispensedByTechnicianId: activeTechnician.id,
            dispensedByTechnicianName: activeTechnician.name,
            pumpNumber: selectedPump,
            fuelingTransactionId: newTx.id,
          };
        }
        return r;
      });
      saveRedemptions(updatedReds);
    }

    // Update transactions list
    const updatedTxs = [newTx, ...transactions];
    onUpdateTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    // Update Driver Profile Points & Maintenance
    const updatedMaintenance = currentDriver.maintenanceSchedule.map((item) => {
      const nextDue = item.nextDueKm;
      const kmRemaining = nextDue - currentOdo;
      let status: 'ok' | 'due_soon' | 'overdue' = 'ok';
      if (kmRemaining <= 0) status = 'overdue';
      else if (kmRemaining <= 1000) status = 'due_soon';
      return { ...item, status };
    });

    const updatedDriver: DriverProfile = {
      ...currentDriver,
      odometerKm: Math.max(currentDriver.odometerKm, currentOdo),
      points: isRedemption ? currentDriver.points : currentDriver.points + pointsEarned,
      totalMetersFueled: currentDriver.totalMetersFueled + meters,
      totalSpentEgp: currentDriver.totalSpentEgp + totalAmount,
      maintenanceSchedule: updatedMaintenance,
    };
    onUpdateDriver(updatedDriver);
    saveDriverProfile(updatedDriver);

    // Update Technician shift totals AND Technician Loyalty / Incentive Points
    const techPointsToAdd = isRedemption ? 20 : (Math.floor(meters * 0.5) + 5);
    const incentiveCashToAdd = isRedemption ? 15 : (meters >= 15 ? 10 : 5);

    const updatedCrew = stationCrew.map((c) => {
      if (c.id === activeTechnician.id) {
        return {
          ...c,
          totalFuelingsToday: c.totalFuelingsToday + 1,
          totalMetersToday: c.totalMetersToday + meters,
          totalAmountToday: c.totalAmountToday + (isRedemption ? calculatedCreditEgp : totalAmount),
          technicianPoints: (c.technicianPoints || 300) + techPointsToAdd,
          totalCustomersServed: (c.totalCustomersServed || 0) + 1,
          incentiveBonusEgp: (c.incentiveBonusEgp || 0) + incentiveCashToAdd,
        };
      }
      return c;
    });

    const nextActiveTech = {
      ...activeTechnician,
      totalFuelingsToday: activeTechnician.totalFuelingsToday + 1,
      totalMetersToday: activeTechnician.totalMetersToday + meters,
      totalAmountToday: activeTechnician.totalAmountToday + (isRedemption ? calculatedCreditEgp : totalAmount),
      technicianPoints: (activeTechnician.technicianPoints || 300) + techPointsToAdd,
      totalCustomersServed: (activeTechnician.totalCustomersServed || 0) + 1,
      incentiveBonusEgp: (activeTechnician.incentiveBonusEgp || 0) + incentiveCashToAdd,
    };

    setActiveTechnician(nextActiveTech);
    onUpdateCrew(updatedCrew);
    saveStationCrew(updatedCrew);

    setTransactionSuccess(newTx);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#0284c7', '#059669', '#38bdf8'],
      });
    } catch {}
  };

  // If shift is not yet unlocked with daily PIN
  if (!activeTechnician) {
    const selectedTech = stationCrew.find((c) => c.id === selectedTechId);

    return (
      <div className="max-w-md mx-auto my-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-inner border border-blue-100">
            🔐
          </div>
          <div>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
              بوابة فني التموين والوردية
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              تفعيل الوردية بالرقم السري اليومي
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              يتم إرسال كود الـ PIN السري يومياً عبر الواتساب من قِبل مشرف المحطة
            </p>
          </div>
        </div>

        <form onSubmit={handleShiftLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              اختر اسم الفني / رئيس الوردية
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => {
                setSelectedTechId(e.target.value);
                setLoginError('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold outline-none focus:border-blue-500"
            >
              {stationCrew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>كود الـ PIN السري لليوم</span>
              {selectedTech && (
                <span className="text-[10px] text-blue-600 font-mono">
                  (كود تجريبي: {selectedTech.dailyPin})
                </span>
              )}
            </label>
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setLoginError('');
              }}
              placeholder="••••"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl outline-none font-bold"
            />
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {loginError}
            </div>
          )}

          {/* GPS Proximity Quick Status */}
          {vt.showGpsRadar && (
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-700 font-bold">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>فحص الـ GPS: {gpsDistance} متر من المحطة</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-medium">
                ✓ ضمن المحيط الأمني المصرح به (أقل من 10 أمتار)
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-blue-600/20 text-sm active:scale-98"
          >
            تفعيل الوردية وبدء التموين ⛽
          </button>
        </form>
      </div>
    );
  }

  // Active Technician Workspace
  return (
    <div className="space-y-6" onClick={handlePageTapGesture}>
      {/* In-Page Dynamic Layout Editor Toolbar (نشط بالضغط 5 مرات متتالية لمدير النظام) */}
      <DynamicInPageLayoutEditor
        pageType="technician"
        config={config}
        onUpdateConfig={onUpdateConfig}
        onSectionsChange={(updated) => setTechSections(updated)}
        currentSections={techSections}
        isEditMode={isLayoutEditMode}
        onToggleEditMode={(enabled) => setIsLayoutEditMode(enabled)}
      />

      {/* Shift Status Header */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
            👷‍♂️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base text-slate-900">
                الفني: {activeTechnician.name}
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                الوردية نشطة وموثقة
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {config.stationName} • الدور: {activeTechnician.role}
            </p>
          </div>
        </div>

        {/* GPS Radar Pill & Shift End */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {vt.showGpsRadar && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                gpsStatus === 'verified'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>نطاق GPS: {gpsDistance}م (الحد: 10م)</span>
              <button
                onClick={() => setIsSimulatedGps(!isSimulatedGps)}
                className="text-[9px] underline text-slate-500 hover:text-slate-800"
                title="تبديل بين GPS الحقيقي والمحاكي للاختبار"
              >
                {isSimulatedGps ? 'محاكي' : 'مباشر'}
              </button>
            </div>
          )}

          <button
            onClick={handleEndShift}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>إنهاء الوردية</span>
          </button>
        </div>
      </div>

      {/* Technician Incentive Wallet & Courtesy Rating Banner */}
      {vt.showTechnicianIncentives && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white rounded-3xl p-5 shadow-lg border border-amber-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/40">
                🏆
              </div>
              <div>
                <span className="text-[10px] bg-black/20 px-2.5 py-0.5 rounded-full font-bold">
                  محفظة حوافز ونقاط ولاء الفني
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  {activeTechnician.rankTitle || 'فني كارجاس المتميز'}
                </h3>
                <p className="text-xs text-amber-100">
                  مكافآت مبيعات الوردية وتقييمات حسن المعاملة من السائقين
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="bg-black/20 backdrop-blur-md p-2.5 px-3.5 rounded-2xl text-center">
                <span className="text-[10px] text-amber-200 block">نقاط حوافزك:</span>
                <span className="text-lg font-black font-mono">{activeTechnician.technicianPoints || 300} نقطة</span>
              </div>

              <div className="bg-black/20 backdrop-blur-md p-2.5 px-3.5 rounded-2xl text-center">
                <span className="text-[10px] text-amber-200 block">تقييم حسن المعاملة:</span>
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span className="text-lg font-black font-mono">{activeTechnician.averageBehaviorRating || 4.9}</span>
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-md p-2.5 px-3.5 rounded-2xl text-center">
                <span className="text-[10px] text-amber-200 block">الحافز المالي المستحق:</span>
                <span className="text-lg font-black font-mono text-emerald-200">
                  {activeTechnician.incentiveBonusEgp || 450} ج
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab View Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTechnicianActiveView('refueling_meter')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              technicianActiveView === 'refueling_meter'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Fuel className="w-4 h-4" />
            <span>تسجيل التموين الفوري (قراءات العدادات واللوحات) ⚡</span>
          </button>

          <button
            type="button"
            onClick={() => setTechnicianActiveView('loyalty_scanner')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              technicianActiveView === 'loyalty_scanner'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>ماسح QR وكارت الولاء للسائقين 📷</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          معمارية Supabase PostgreSQL (RLS Active)
        </span>
      </div>

      {/* Render Direct Refueling Portal */}
      {technicianActiveView === 'refueling_meter' && (
        <RefuelingTechnicianPortal activeTechnician={activeTechnician} />
      )}

      {/* Render Dynamic Technician Sections Layout & SCADA Engine */}
      {technicianActiveView === 'loyalty_scanner' && (
        <div className="space-y-6">
          
          {/* Active SCADA Fueling Session Screen (If active) */}
          {activeScadaSession && (
            <ScadaLiveFuelingScreen
              session={activeScadaSession}
              config={config}
              onDone={() => {
                setActiveScadaSession(null);
                setScannedDriver(null);
              }}
            />
          )}

          {/* Dynamic 12-Column Responsive Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {[...techSections]
              .sort((a, b) => a.order - b.order)
              .filter((sec) => sec.visible || isLayoutEditMode)
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
                    className={`${colClass} transition-all duration-200 ${
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
                    {/* In-Page Edit Controls for Admin on this section */}
                    {isLayoutEditMode && (
                      <SectionEditControls
                        section={section}
                        onMoveUp={() => handleMoveUp(section.id)}
                        onMoveDown={() => handleMoveDown(section.id)}
                        onChangeColSpan={(span) => handleChangeColSpan(section.id, span)}
                        onChangeHeightMode={(h) => handleChangeHeightMode(section.id, h)}
                        onToggleVisibility={() => handleToggleVisibility(section.id)}
                        onDragStart={() => handleDragStart(section.id)}
                      />
                    )}

                    {/* Section 1: Mobile Camera & Barcode Scanner */}
                    {section.id === 'camera_scanner' && (
                      <TechnicianQrScanner
                        config={config}
                        activeTechnician={activeTechnician}
                        currentDriver={currentDriver}
                        onSessionStarted={(session) => {
                          setActiveScadaSession(session);
                        }}
                        onRedemptionCompleted={() => {
                          onUpdateTransactions(getTransactions());
                        }}
                      />
                    )}

                    {/* Section 2: SCADA Live Fueling Sessions Monitor */}
                    {section.id === 'scada_live_sessions' && (
                      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-indigo-500/30 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <Gauge className="w-5 h-5 text-amber-400" />
                            <div>
                              <h3 className="font-black text-sm text-white">
                                نظام السكادا وجلسات التموين الحية
                              </h3>
                              <p className="text-[10px] text-slate-400">
                                استقبال قراءات العدادات التلقائية (SCADA Webhook)
                              </p>
                            </div>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            مفعل ومتصل ⚡
                          </span>
                        </div>

                        {/* Endpoint Info */}
                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                          <span className="text-amber-400 font-bold">POST</span>
                          <span className="text-slate-300 truncate">/api/scada/complete-transaction</span>
                          <span className="text-[10px] text-slate-400">JSON</span>
                        </div>

                        {/* Recent Sessions Table */}
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {recentSessions.length === 0 ? (
                            <div className="p-4 bg-white/5 rounded-2xl text-center text-xs text-slate-400">
                              لا توجد جلسات مسجلة بعد. عند مسح كود السيارة والمسدس تبدأ الجلسة فوراً.
                            </div>
                          ) : (
                            recentSessions.slice(0, 5).map((s) => (
                              <div
                                key={s.session_id}
                                className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs transition"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-white">{s.car_plate}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">[{s.hose_id}]</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(s.created_at).toLocaleTimeString('ar-EG', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                <div className="text-left space-y-0.5">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full block ${
                                      s.status === 'COMPLETED'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-amber-500/20 text-amber-300 animate-pulse'
                                    }`}
                                  >
                                    {s.status === 'COMPLETED'
                                      ? `${s.volume_m3 || 0} م³ ✓`
                                      : 'جاري الضخ ⏳'}
                                  </span>
                                  {s.points_earned ? (
                                    <span className="text-[10px] text-amber-400 font-bold block">
                                      +{s.points_earned} نقطة
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Test Signal Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const res = simulateScadaSignal(
                              config.stationCode || 'CARGAS-SHUBRA-01',
                              'HOSE-PUMP-01-A',
                              18.5
                            );
                            alert(res.message);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-2xl text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>محاكاة إرسال قراءة السكادا (18.5 م³) ⚡</span>
                        </button>
                      </div>
                    )}

                    {/* Section 3: Points Redemption Scanner & Records */}
                    {section.id === 'reward_redemption_scanner' && (
                      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-slate-950 rounded-3xl p-6 shadow-md border border-amber-300 space-y-4">
                        <div className="flex items-center justify-between border-b border-black/10 pb-3">
                          <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-slate-950" />
                            <h3 className="font-black text-sm text-slate-950">
                              صرف واستبدال نقاط الولاء والأمتار المجانية
                            </h3>
                          </div>
                          <span className="text-xs bg-slate-950 text-amber-300 font-black px-2.5 py-0.5 rounded-full">
                            مكافآت السائقين 🎁
                          </span>
                        </div>

                        <p className="text-xs text-slate-900 leading-relaxed font-medium">
                          يستطيع السائق إبراز كود الـ QR الخاص بقسيمة الأمتار المجانية أو هدايا الزيوت من كارت الولاء الذهبي. عند مسح الكود يتم صرف الغاز للعميل بـ 0 جنيه وتحميل القيمة بالكامل على مبيعات ورديتك مع إضافة +20 نقطة حافز لورديتك.
                        </p>

                        <div className="flex items-center gap-3 bg-white/40 p-3 rounded-2xl text-xs font-bold justify-between">
                          <span>إجمالي القسائم المنفذة بالوردية:</span>
                          <span className="text-sm font-mono font-black">
                            {getRedemptions().filter((r) => r.isUsed).length} قسيمة معتمدة
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Section 4: Shift Stats */}
                    {section.id === 'shift_stats' && (
                      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            إحصائيات إنجاز الوردية ومبيعات الفني
                          </h3>
                          <span className="text-xs font-mono text-slate-500">
                            كود الفني: {activeTechnician.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                            <span className="text-xs text-slate-500 font-medium block">
                              عدد التفويلات اليوم
                            </span>
                            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                              {activeTechnician.totalFuelingsToday}
                            </span>
                            <span className="text-[10px] text-blue-600 font-bold">سيارة مُمونة</span>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                            <span className="text-xs text-slate-500 font-medium block">
                              إجمالي الغاز المباع
                            </span>
                            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                              {activeTechnician.totalMetersToday.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              متر مكعب m³
                            </span>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                            <span className="text-xs text-slate-500 font-medium block">
                              إجمالي النقدية المحصلة
                            </span>
                            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                              {activeTechnician.totalAmountToday.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">جنيه مصري</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 5: Welcome Points Bonus Quota */}
                    {section.id === 'welcome_bonus' && (
                      <div className="bg-indigo-950 text-white rounded-3xl p-6 shadow-sm border border-indigo-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-400" />
                            <h3 className="font-black text-sm text-white">
                              رصيد النقاط الترحيبية لجذب السائقين
                            </h3>
                          </div>
                          <span className="text-xs bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                            حصة الفني 🎁
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-indigo-300 block">الرصيد المتاح بوردية اليوم:</span>
                            <span className="text-3xl font-black font-mono text-amber-400">
                              {activeTechnician.welcomePointsQuota ?? 350} نقطة
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const quota = activeTechnician.welcomePointsQuota ?? 350;
                              if (quota < 50) {
                                alert('رصيد النقاط الترحيبية المتاح بوردية اليوم غير كافٍ');
                                return;
                              }
                              const updatedTech = {
                                ...activeTechnician,
                                welcomePointsQuota: quota - 50,
                                welcomePointsDistributed: (activeTechnician.welcomePointsDistributed || 0) + 50,
                              };
                              const updatedCrew = stationCrew.map((c) =>
                                c.id === activeTechnician.id ? updatedTech : c
                              );
                              setActiveTechnician(updatedTech);
                              onUpdateCrew(updatedCrew);
                              saveStationCrew(updatedCrew);

                              // Credit to current driver
                              const d = getDriverProfile();
                              const updatedD = { ...d, points: d.points + 50 };
                              onUpdateDriver(updatedD);
                              saveDriverProfile(updatedD);
                              alert('🎉 تم إهداء 50 نقطة ترحيبية فورية للسيارة الحالية بنجاح!');
                            }}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl transition shadow-md active:scale-95"
                          >
                            إهداء 50 نقطة للسيارة 🎁
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Section 6: Manual Entry Fallback Form */}
                    {section.id === 'manual_entry' && (
                      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                            <Fuel className="w-4 h-4 text-slate-700" />
                            <span>التسجيل اليدوي للتموين (احتياطي)</span>
                          </h3>
                        </div>

                        <form onSubmit={handleExecuteFueling} className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              كمية الغاز بالمتر المكعب (م³):
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={gasMetersInput}
                              onChange={(e) => setGasMetersInput(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-sm"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <span>المبلغ المحسوب:</span>
                            <span className="font-mono text-base font-black text-emerald-700">
                              {((parseFloat(gasMetersInput) || 0) * (config.gasPricePerMeter || 13)).toFixed(2)} ج.م
                            </span>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition"
                          >
                            تسجيل التفويلة يدوياً
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Section 7: GPS Radar 10m Verification */}
                    {section.id === 'gps_radar' && (
                      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            <h3 className="font-black text-sm text-slate-900">
                              رادار الموقع الجغرافي (10 أمتار)
                            </h3>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              gpsStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {gpsStatus === 'verified' ? 'ضمن النطاق ✓' : 'خارج النطاق ⚠️'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          المسافة الحالية من إحداثيات محطة كارجاس: <b className="font-mono">{gpsDistance} متر</b> (الحد الأقصى المصرح به: {config.maxGpsRadiusMeters}م).
                        </p>

                        <button
                          type="button"
                          onClick={() => setIsSimulatedGps(!isSimulatedGps)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl transition"
                        >
                          تبديل وضع GPS ({isSimulatedGps ? 'محاكي آمن' : 'حقيقي مباشر'})
                        </button>
                      </div>
                    )}

                    {/* Section 8: Technician Incentives Banner */}
                    {section.id === 'technician_incentives' && (
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-white/20 pb-2">
                          <h3 className="font-black text-sm flex items-center gap-2">
                            <Coins className="w-4 h-4 text-amber-300" />
                            <span>حوافز ومكافآت حسن المعاملة</span>
                          </h3>
                          <span className="text-xs font-mono font-black text-amber-300">
                            {activeTechnician.technicianPoints || 300} نقطة
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-black/20 p-2.5 rounded-xl text-center">
                            <span className="text-[10px] text-emerald-200 block">متوسط التقييم:</span>
                            <span className="font-black text-base font-mono">{activeTechnician.averageBehaviorRating || 4.9} ⭐</span>
                          </div>
                          <div className="bg-black/20 p-2.5 rounded-xl text-center">
                            <span className="text-[10px] text-emerald-200 block">الحافز المالي:</span>
                            <span className="font-black text-base font-mono">{activeTechnician.incentiveBonusEgp || 450} ج</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Admin PIN Verification Modal for 5-Tap Gesture */}
      <AdminPinVerifyModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setIsAdminPinModalOpen(false);
          setIsLayoutEditMode(true);
        }}
        expectedPin={config.adminPin || '0000'}
        pageTitle="شاشة فني المحطة"
      />
    </div>
  );
};
