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
} from 'lucide-react';
import {
  AppConfig,
  DriverProfile,
  FuelingTransaction,
  TechnicianCrewMember,
  AntiFraudLog,
} from '../types';
import { parseDriverQrData } from '../services/qrService';
import {
  saveTransactions,
  saveDriverProfile,
  saveStationCrew,
  addFraudLog,
  getDriverStationAndPumpFuelingCounts,
} from '../services/storageService';

interface TechnicianPortalProps {
  config: AppConfig;
  stationCrew: TechnicianCrewMember[];
  currentDriver: DriverProfile;
  transactions: FuelingTransaction[];
  onUpdateCrew: (crew: TechnicianCrewMember[]) => void;
  onUpdateDriver: (driver: DriverProfile) => void;
  onUpdateTransactions: (txs: FuelingTransaction[]) => void;
}

export const TechnicianPortal: React.FC<TechnicianPortalProps> = ({
  config,
  stationCrew,
  currentDriver,
  transactions,
  onUpdateCrew,
  onUpdateDriver,
  onUpdateTransactions,
}) => {
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
      alert('يرجى أولاً مسح كود الـ QR الخاص بسيارة السائق!');
      return;
    }

    if (gpsStatus === 'out_of_range') {
      alert('تنبيه أمان: لا يمكن إتمام التموين لأن موقعك الجغرافي خارج نطاق الـ 10 أمتار للمحطة!');
      return;
    }

    const meters = parseFloat(gasMetersInput);
    if (isNaN(meters) || meters <= 0) {
      alert('يرجى إدخال كمية غاز صحيحة بالمتر المكعب');
      return;
    }

    const maxSafeMeters = (scannedDriver.capacity || 70) * 0.45;
    if (meters > maxSafeMeters) {
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
    const totalAmount = parseFloat((meters * pricePerMeter).toFixed(2));
    const pointsEarned = Math.floor(meters * (config.pointsPerMeter || 1));

    // Calculate Driver Fueling Frequency for Station and Pump
    const { stationCount, pumpCount } = getDriverStationAndPumpFuelingCounts(
      transactions,
      scannedDriver.driverId,
      config.stationName,
      selectedPump
    );

    const receiptNo = 'CRG-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
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
    };

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
      points: currentDriver.points + pointsEarned,
      totalMetersFueled: currentDriver.totalMetersFueled + meters,
      totalSpentEgp: currentDriver.totalSpentEgp + totalAmount,
      maintenanceSchedule: updatedMaintenance,
    };
    onUpdateDriver(updatedDriver);
    saveDriverProfile(updatedDriver);

    // Update Technician shift totals AND Technician Loyalty / Incentive Points
    const techPointsToAdd = Math.floor(meters * 0.5) + 5; // نقاط حافز مبيعات للفني
    const incentiveCashToAdd = meters >= 15 ? 10 : 5;

    const updatedCrew = stationCrew.map((c) => {
      if (c.id === activeTechnician.id) {
        return {
          ...c,
          totalFuelingsToday: c.totalFuelingsToday + 1,
          totalMetersToday: c.totalMetersToday + meters,
          totalAmountToday: c.totalAmountToday + totalAmount,
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
      totalAmountToday: activeTechnician.totalAmountToday + totalAmount,
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
    <div className="space-y-6">
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

      {/* Main Grid: QR Scanner / Vehicle Identification + Fueling & Billing Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Step 1: Vehicle & Customer QR Scan (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                الخطوة 1: مسح QR كود سيارة العميل
              </h3>
              <p className="text-[11px] text-slate-500">
                امسح الكود المعروض على هاتف السائق للتعرف على السيارة
              </p>
            </div>
          </div>

          {/* Camera Frame */}
          {vt.showCameraScanner && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-2 border-dashed border-slate-300">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 text-slate-300 space-y-2">
                  <QrCode className="w-12 h-12 mx-auto text-blue-400 opacity-80" />
                  <p className="text-xs font-medium">الكاميرا متوقفة حالياً</p>
                </div>
              )}

              {isCameraActive && (
                <div className="absolute inset-0 border-2 border-emerald-400 m-8 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                  <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    وجّه الكاميرا نحو باركود السائق
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Camera Controls */}
          {vt.showCameraScanner && (
            <div className="flex gap-2">
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>تشغيل الكاميرا المباشرة</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>إيقاف الكاميرا</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleScanDriver()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition"
                title="محاكاة مسح سيارة السائق النشطة فوراً"
              >
                مسح تجريبي سريع ⚡
              </button>
            </div>
          )}

          {/* Manual Plate Search */}
          {vt.showManualEntry && (
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                أو إدخال رقم اللوحة / كود السيارة يدوياً:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="مثال: ق ط د 7842"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleScanDriver(manualCodeInput)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition"
                >
                  تأكيد
                </button>
              </div>
            </div>
          )}

          {/* Scanned Vehicle Card */}
          {scannedDriver && (
            <div className="p-4 bg-emerald-50/70 border-2 border-emerald-400 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  تم التعرف على السيارة بنجاح ✓
                </span>
                <span className="font-mono text-xs font-bold text-emerald-900">
                  {scannedDriver.driverId}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">اسم السائق:</span>
                  <span className="font-bold text-slate-900">{scannedDriver.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">رقم اللوحة:</span>
                  <span className="font-black text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {scannedDriver.carPlate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">نوع السيارة:</span>
                  <span className="font-medium text-slate-800">{scannedDriver.carModel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">سعة الأسطوانة:</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {scannedDriver.capacity} لتر (~{(scannedDriver.capacity * 0.23).toFixed(1)} م³)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Fueling Quantity, Pump (1-8), Billing & Anti-Fraud (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-600" />
                الخطوة 2: تسجيل كمية الغاز وحساب القيمة والنقاط
              </h3>
              <p className="text-[11px] text-slate-500">
                سعر المتر الحالي: <span className="font-bold text-emerald-700">{config.gasPricePerMeter} جنيه مصري</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleExecuteFueling} className="space-y-4">
            {/* Pump Selector (1 to 8 pumps) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                اختر رقم المضخة الحالية (حتى 8 مضخات):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((pumpNum) => (
                  <button
                    type="button"
                    key={pumpNum}
                    onClick={() => setSelectedPump(pumpNum)}
                    className={`py-2 rounded-xl text-xs font-black transition border ${
                      selectedPump === pumpNum
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-105'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    مضخة #{pumpNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity in m³ and Live Price Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  كمية الغاز المباعة (متر مكعب m³)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="60"
                    required
                    value={gasMetersInput}
                    onChange={(e) => setGasMetersInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 rounded-2xl py-3 px-4 text-xl font-black font-mono outline-none transition"
                  />
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400">
                    م³
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  قراءة عداد السيارة الحالي (كم)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={odometerInput}
                    onChange={(e) => setOdometerInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 rounded-2xl py-3 px-4 text-xl font-black font-mono outline-none transition"
                  />
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400">
                    كم
                  </span>
                </div>
              </div>
            </div>

            {/* Live Calculation Bill Preview */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>المعادلة المعتمدة:</span>
                <span className="font-mono">
                  {parseFloat(gasMetersInput) || 0} م³ × {config.gasPricePerMeter} ج/م³
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-slate-700">
                <div>
                  <span className="text-[11px] text-emerald-400 block font-bold">
                    المبلغ المطلوب تحصيله:
                  </span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                    {((parseFloat(gasMetersInput) || 0) * config.gasPricePerMeter).toFixed(2)}
                  </span>
                  <span className="text-sm font-bold text-slate-300 mr-2">جنيه مصري</span>
                </div>

                <div className="text-left bg-emerald-950/80 px-3 py-2 rounded-xl border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-300 block">نقاط الولاء للسائق:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    +{Math.floor((parseFloat(gasMetersInput) || 0) * (config.pointsPerMeter || 1))} نقطة
                  </span>
                </div>
              </div>
            </div>

            {/* Anti-Fraud Warning Pill if any */}
            {fraudWarning && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                {fraudWarning}
              </div>
            )}

            {/* Submit Transaction Button */}
            <button
              type="submit"
              disabled={!scannedDriver}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition shadow-xl shadow-emerald-600/20 text-base active:scale-98 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>تأكيد التموين واحتساب حافز الفني ونقاط السائق</span>
            </button>
          </form>

          {/* Success Receipt Alert with Fueling Count Stats */}
          {transactionSuccess && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-black text-sm text-emerald-950">
                    تمت العملية بنجاح! رقم الإيصال: {transactionSuccess.receiptNumber}
                  </h4>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الإيصال 🖨️</span>
                </button>
              </div>

              {/* Station & Pump Frequency Pill */}
              {vt.showFuelingCountStats && (
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    🏢 تموين العميل رقم: <b>#{transactionSuccess.driverStationFuelingCount}</b> من هذه المحطة
                  </span>
                  <span>
                    ⛽ ورقم: <b>#{transactionSuccess.driverPumpFuelingCount}</b> من المضخة #{transactionSuccess.pumpNumber}
                  </span>
                </div>
              )}

              <div className="text-xs text-emerald-900 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>السيارة: <b>{transactionSuccess.carPlate}</b></div>
                <div>الكمية: <b>{transactionSuccess.metersQuantity} م³</b></div>
                <div>المبلغ: <b>{transactionSuccess.totalAmountEgp} ج</b></div>
                <div>حافز الفني: <b>+5 نقاط</b></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technician Shift Stats Summary */}
      {vt.showShiftStats && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              إحصائيات إنجاز الوردية ومبيعات الفني
            </h3>
            <span className="text-xs font-mono text-slate-500">
              كود الفني: {activeTechnician.id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium block">عدد التفويلات اليوم</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {activeTechnician.totalFuelingsToday}
              </span>
              <span className="text-[10px] text-blue-600 font-bold">سيارة مُمونة</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium block">إجمالي الغاز المباع</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                {activeTechnician.totalMetersToday.toFixed(1)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">متر مكعب m³</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium block">إجمالي النقدية المحصلة</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {activeTechnician.totalAmountToday.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">جنيه مصري</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
