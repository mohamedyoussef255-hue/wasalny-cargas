import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Gift,
  Fuel,
  Car,
  X,
  Upload,
  Zap,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  AppConfig,
  DriverProfile,
  FuelingSession,
  RewardRedemption,
  TechnicianCrewMember,
} from '../types';
import { parseDriverQrData } from '../services/qrService';
import {
  createFuelingSession,
  getRedemptions,
  saveRedemptions,
  getTransactions,
  saveTransactions,
  getDriverStationAndPumpFuelingCounts,
  saveDriverProfile,
  getDriverProfile,
} from '../services/storageService';

interface TechnicianQrScannerProps {
  config: AppConfig;
  activeTechnician: TechnicianCrewMember;
  currentDriver: DriverProfile;
  onSessionStarted: (session: FuelingSession) => void;
  onRedemptionCompleted: (redemption: RewardRedemption) => void;
  onClose?: () => void;
}

export const TechnicianQrScanner: React.FC<TechnicianQrScannerProps> = ({
  config,
  activeTechnician,
  currentDriver,
  onSessionStarted,
  onRedemptionCompleted,
}) => {
  // Mode: Fueling Scan (Car -> Hose) vs Points Redemption Scan
  const [scanMode, setScanMode] = useState<'fueling' | 'redemption'>('fueling');

  // Fueling Scan Step: 1 = Car QR, 2 = Hose QR
  const [fuelingStep, setFuelingStep] = useState<1 | 2>(1);
  const [scannedCarData, setScannedCarData] = useState<{
    driverId: string;
    driverName: string;
    carPlate: string;
    carModel: string;
    capacity: number;
    odometer: number;
  } | null>(null);

  // Selected Hose / Pump for Step 2
  const [selectedHoseId, setSelectedHoseId] = useState<string>('HOSE-PUMP-01-A');
  const [selectedPumpNumber, setSelectedPumpNumber] = useState<number>(1);

  // Redemption voucher details
  const [scannedVoucher, setScannedVoucher] = useState<RewardRedemption | null>(null);
  const [voucherError, setVoucherError] = useState<string>('');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isScanningLoopActive, setIsScanningLoopActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Start Real Mobile Camera
  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Play error:', err));
      }

      // Start Barcode Detection Loop
      startScanningLoop();
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('تعذر الوصول لكاميرا الهاتف مباشرة (يرجى السماح بصلاحيات الكاميرا أو استخدام المسح التجريبي)');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsScanningLoopActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Continuous Barcode Scanning using BarcodeDetector if available
  const startScanningLoop = () => {
    setIsScanningLoopActive(true);
    const win = window as any;

    if ('BarcodeDetector' in win) {
      const barcodeDetector = new win.BarcodeDetector({ formats: ['qr_code'] });

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleBarcodeScanned(rawValue);
            }
          }
        } catch (e) {
          // ignore frame errors
        }
      }, 500);
    }
  };

  // Process raw text scanned from camera or manual input
  const handleBarcodeScanned = (rawText: string) => {
    if (scanMode === 'fueling') {
      if (fuelingStep === 1) {
        // Step 1: Customer Car QR
        const parsed = parseDriverQrData(rawText);
        if (parsed.isValid && !parsed.isRewardRedemption) {
          setScannedCarData({
            driverId: parsed.driverId || currentDriver.id,
            driverName: parsed.name || currentDriver.name,
            carPlate: parsed.carPlate || currentDriver.carPlate,
            carModel: parsed.carModel || currentDriver.carModel,
            capacity: parsed.capacity || currentDriver.cngCylinderCapacity || 70,
            odometer: parsed.odometer || currentDriver.odometerKm,
          });
          setFuelingStep(2); // move to step 2: Hose QR
          setManualCodeInput('');
        } else if (parsed.isRewardRedemption) {
          // Auto switch to redemption mode if driver showed reward voucher
          setScanMode('redemption');
          handleVoucherLookup(parsed.redemptionCode || parsed.redemptionId || rawText);
        } else {
          // Fallback parsing as plate string
          setScannedCarData({
            driverId: currentDriver.id,
            driverName: currentDriver.name,
            carPlate: rawText.slice(0, 15),
            carModel: currentDriver.carModel,
            capacity: 70,
            odometer: currentDriver.odometerKm,
          });
          setFuelingStep(2);
        }
      } else if (fuelingStep === 2) {
        // Step 2: Hose / Pump QR
        let hoseId = rawText.trim();
        let pumpNum = 1;
        try {
          const json = JSON.parse(rawText);
          if (json.pump) pumpNum = Number(json.pump);
          if (json.hoseId) hoseId = json.hoseId;
          else hoseId = `HOSE-PUMP-0${pumpNum}-A`;
        } catch {
          const match = rawText.match(/\d+/);
          if (match) pumpNum = parseInt(match[0]);
          hoseId = `HOSE-PUMP-0${pumpNum}-A`;
        }

        setSelectedHoseId(hoseId);
        setSelectedPumpNumber(pumpNum);
        handleStartFuelingSession(hoseId, pumpNum);
      }
    } else {
      // Redemption Mode
      handleVoucherLookup(rawText);
    }
  };

  // Lookup Voucher for Redemption Mode
  const handleVoucherLookup = (code: string) => {
    setVoucherError('');
    const allReds = getRedemptions();
    const clean = code.trim().toLowerCase();

    const found = allReds.find(
      (r) =>
        r.redemptionCode.toLowerCase() === clean ||
        r.id.toLowerCase() === clean ||
        code.includes(r.redemptionCode)
    );

    if (found) {
      setScannedVoucher(found);
      setManualCodeInput('');
    } else {
      // Create simulated voucher for test convenience if not found
      const simulated: RewardRedemption = {
        id: 'REW-' + Date.now(),
        rewardId: 'gift-oil-extra',
        rewardTitle: 'جركن زيت كارجاس سينتك إكسترا 4 لتر (هدية الولاء المعتمدة)',
        driverId: currentDriver.id,
        driverName: currentDriver.name,
        carPlate: currentDriver.carPlate,
        carModel: currentDriver.carModel,
        pointsSpent: 100,
        redemptionCode: code.toUpperCase() || 'RW-OIL-EXTRA',
        createdAt: new Date().toISOString(),
        isUsed: false,
        category: 'oil',
        calculatedEgpValue: 490,
      };
      setScannedVoucher(simulated);
    }
  };

  // Execute Points / Reward Redemption (Gifts, Oils, Maintenance, Inspection, & Partner Coupons)
  const handleConfirmRedeemReward = () => {
    if (!scannedVoucher) return;
    if (scannedVoucher.isUsed) {
      alert('هذه القسيمة تم استخدامها وصرفها مسبقاً!');
      return;
    }

    // Update Voucher in Storage
    const allReds = getRedemptions();
    const existingIndex = allReds.findIndex((r) => r.id === scannedVoucher.id);
    const updatedVoucher: RewardRedemption = {
      ...scannedVoucher,
      isUsed: true,
      usedAt: new Date().toISOString(),
      usedAtStation: config.stationName,
      dispensedByTechnicianId: activeTechnician.id,
      dispensedByTechnicianName: activeTechnician.name,
      pumpNumber: selectedPumpNumber,
    };

    if (existingIndex >= 0) {
      allReds[existingIndex] = updatedVoucher;
    } else {
      allReds.unshift(updatedVoucher);
    }
    saveRedemptions(allReds);

    onRedemptionCompleted(updatedVoucher);
    stopCamera();
    alert(`🎉 تم صرف وتسليم المكافأة بنجاح: [${scannedVoucher.rewardTitle}] للعميل (${scannedVoucher.driverName})!`);
  };

  // Start Fueling Session (Transitions to Live SCADA Waiting Screen)
  const handleStartFuelingSession = (hoseIdToUse?: string, pumpNum?: number) => {
    if (!scannedCarData) {
      alert('يرجى أولاً مسح كود سيارة العميل!');
      return;
    }

    const hose = hoseIdToUse || selectedHoseId;
    const pump = pumpNum || selectedPumpNumber;

    const newSession = createFuelingSession({
      session_id: 'SES-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      station_id: config.stationCode || 'CARGAS-SHUBRA-01',
      station_name: config.stationName,
      hose_id: hose,
      user_id: scannedCarData.driverId,
      driver_name: scannedCarData.driverName,
      car_plate: scannedCarData.carPlate,
      car_model: scannedCarData.carModel,
      status: 'IN_PROGRESS',
      unit_price: config.gasPricePerMeter || 13,
      technician_id: activeTechnician.id,
      technician_name: activeTechnician.name,
      odometer_km: scannedCarData.odometer,
    });

    stopCamera();
    onSessionStarted(newSession);
  };

  // Quick preset test triggers for instant simulation
  const handleSimulateQuickScan = (type: 'car' | 'hose' | 'voucher') => {
    if (type === 'car') {
      setScannedCarData({
        driverId: currentDriver.id,
        driverName: currentDriver.name,
        carPlate: currentDriver.carPlate,
        carModel: currentDriver.carModel,
        capacity: currentDriver.cngCylinderCapacity || 70,
        odometer: currentDriver.odometerKm,
      });
      setFuelingStep(2);
    } else if (type === 'hose') {
      setSelectedHoseId('HOSE-PUMP-01-A');
      setSelectedPumpNumber(1);
      handleStartFuelingSession('HOSE-PUMP-01-A', 1);
    } else {
      handleVoucherLookup('RW-CARGAS-10M');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-5">
      
      {/* Scanner Mode Switcher (تموين غاز مع السكادا VS ماسح استبدال النقاط) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <span>ماسح كاميرا الموبايل والباركود الذكي 📷</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            الربط التلقائي بين سيارة السائق، مسدس التموين، وبدء جلسة السكادا
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setScanMode('fueling');
              setFuelingStep(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              scanMode === 'fueling'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>مسح تموين الغاز (SCADA)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScanMode('redemption');
              setScannedVoucher(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              scanMode === 'redemption'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>ماسح استبدال النقاط والمكافآت 🎁</span>
          </button>
        </div>
      </div>

      {/* Fueling Steps Progress Bar */}
      {scanMode === 'fueling' && (
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition ${
              fuelingStep === 1
                ? 'bg-emerald-500 text-white font-bold shadow-xs'
                : scannedCarData
                ? 'bg-emerald-100 text-emerald-900 font-bold'
                : 'text-slate-400'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
              1
            </div>
            <div className="truncate">
              <span className="text-[10px] block opacity-80">الخطوة الأولى:</span>
              <span className="text-xs truncate">مسح كود سيارة العميل</span>
            </div>
            {scannedCarData && <Check className="w-4 h-4 ml-auto text-emerald-700 shrink-0" />}
          </div>

          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition ${
              fuelingStep === 2
                ? 'bg-emerald-500 text-white font-bold shadow-xs'
                : 'text-slate-400'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
              2
            </div>
            <div className="truncate">
              <span className="text-[10px] block opacity-80">الخطوة الثانية:</span>
              <span className="text-xs truncate">مسح كود مسدس التموين (الهوز)</span>
            </div>
          </div>
        </div>
      )}

      {/* Camera Live Viewport */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border-2 border-dashed border-emerald-500/40 shadow-inner">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 text-slate-300 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-white/10 mx-auto flex items-center justify-center text-3xl">
              {scanMode === 'fueling' ? '⛽' : '🎁'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">كاميرا الموبايل جاهزة للمسح المباشر</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {scanMode === 'fueling'
                  ? fuelingStep === 1
                    ? 'اضغط زر تشغيل الكاميرا لتوجيهها نحو باركود سيارة السائق'
                    : 'وجّه الكاميرا نحو كود مسدس التموين (الهوز)'
                  : 'وجّه الكاميرا نحو كود قسيمة المكافأة أو الأمتار المجانية للعميل'}
              </p>
            </div>
          </div>
        )}

        {/* Viewfinder Overlay Reticle */}
        {isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
            <div className="w-64 h-64 border-2 border-emerald-400 rounded-3xl relative animate-pulse flex items-center justify-center">
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></div>
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></div>
              <span className="bg-slate-900/80 text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                {scanMode === 'fueling'
                  ? fuelingStep === 1
                    ? 'امسح كود سيارة العميل'
                    : 'امسح كود مسدس التموين'
                  : 'امسح كود قسيمة الهدية'}
              </span>
            </div>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Camera Controls & Quick Simulation Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!isCameraActive ? (
          <button
            type="button"
            onClick={startCamera}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-98"
          >
            <Camera className="w-4 h-4" />
            <span>تشغيل كاميرا الهاتف لمسح الباركود</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-98"
          >
            <span>إيقاف الكاميرا</span>
          </button>
        )}

        {/* Quick Simulation Triggers for Fast Demo/Testing */}
        {scanMode === 'fueling' && fuelingStep === 1 && (
          <button
            type="button"
            onClick={() => handleSimulateQuickScan('car')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-4 py-3 rounded-2xl text-xs border border-emerald-300 transition active:scale-95"
          >
            مسح تجريبي لسيارة السائق ⚡
          </button>
        )}

        {scanMode === 'fueling' && fuelingStep === 2 && (
          <button
            type="button"
            onClick={() => handleSimulateQuickScan('hose')}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold px-4 py-3 rounded-2xl text-xs border border-indigo-300 transition active:scale-95"
          >
            مسح تجريبي لمسدس الطلمبة #1 ⚡
          </button>
        )}

        {scanMode === 'redemption' && (
          <button
            type="button"
            onClick={() => handleSimulateQuickScan('voucher')}
            className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-4 py-3 rounded-2xl text-xs border border-amber-300 transition active:scale-95"
          >
            مسح تجريبي لقسيمة 10 م³ مجاني 🎁
          </button>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
          {scanMode === 'fueling'
            ? fuelingStep === 1
              ? 'أو إدخال رقم اللوحة يدوياً:'
              : 'أو إدخال كود مسدس التموين (الهوز):'
            : 'أو إدخال كود قسيمة المكافأة (مثلاً RW-FREE-10M):'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCodeInput}
            onChange={(e) => setManualCodeInput(e.target.value)}
            placeholder={
              scanMode === 'fueling'
                ? fuelingStep === 1
                  ? 'مثال: ق ط د 7842'
                  : 'مثال: HOSE-PUMP-01-A'
                : 'كود القسيمة: RW-XXXXXX'
            }
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => {
              if (manualCodeInput.trim()) {
                handleBarcodeScanned(manualCodeInput.trim());
              }
            }}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            تأكيد
          </button>
        </div>
      </div>

      {/* Step 2 Hose Selection UI if Car Scanned */}
      {scanMode === 'fueling' && fuelingStep === 2 && scannedCarData && (
        <div className="bg-indigo-50/80 rounded-2xl p-4 border border-indigo-200 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
            <div>
              <span className="text-[10px] text-indigo-700 font-bold block">تم التعرف على السيارة:</span>
              <h4 className="text-sm font-black text-slate-900">
                {scannedCarData.carPlate} ({scannedCarData.driverName}) — {scannedCarData.carModel}
              </h4>
            </div>
            <button
              onClick={() => {
                setFuelingStep(1);
                setScannedCarData(null);
              }}
              className="text-xs text-indigo-600 hover:underline font-bold"
            >
              تغيير السيارة
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر مسدس التموين (الهوز) لبدء الضخ واستقبال قراءة السكادا:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => {
                    const hose = `HOSE-PUMP-0${num}-A`;
                    setSelectedHoseId(hose);
                    setSelectedPumpNumber(num);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                    selectedPumpNumber === num
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-black scale-102'
                      : 'bg-white text-slate-700 hover:bg-indigo-100 border-indigo-200'
                  }`}
                >
                  <span className="block text-[10px] opacity-75">طلمبة</span>
                  <span className="text-sm font-black font-mono">#{num}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleStartFuelingSession()}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
          >
            <Fuel className="w-4 h-4" />
            <span>بدء جلسة التموين (الهوز #{selectedPumpNumber}) وبانتظار عداد السكادا ⛽⚡</span>
          </button>
        </div>
      )}

      {/* Scanned Voucher Card (Redemption Mode) */}
      {scanMode === 'redemption' && scannedVoucher && (
        <div className={`p-5 rounded-2xl border-2 space-y-4 animate-in fade-in ${
          scannedVoucher.isUsed
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-amber-50 border-amber-400 text-slate-900'
        }`}>
          <div className="flex items-center justify-between border-b border-inherit pb-2">
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
              scannedVoucher.isUsed
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {scannedVoucher.isUsed ? '❌ قسيمة مستخدمة مسبقاً' : '✓ قسيمة صالحة للاستخدام الفوري'}
            </span>
            <span className="font-mono text-xs font-black">{scannedVoucher.redemptionCode}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-bold">اسم المكافأة:</span>
              <span className="font-black text-slate-900 text-sm">{scannedVoucher.rewardTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-bold">العميل المستحق:</span>
              <span className="font-bold text-slate-900">{scannedVoucher.driverName} ({scannedVoucher.carPlate || currentDriver.carPlate})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-bold">نوع المكافأة / المنتج / الكوبون:</span>
              <span className="font-mono font-black text-emerald-800 text-xs bg-white px-2.5 py-1 rounded-lg border border-amber-300">
                {scannedVoucher.category === 'oil'
                  ? 'منتجات الزيوت والفلاتر 🛢️'
                  : scannedVoucher.category === 'maintenance'
                  ? 'صيانة وبوجيهات معتمدة 🔧'
                  : scannedVoucher.category === 'inspection'
                  ? 'فحص دوري وصلاحية أسطوانة 🛡️'
                  : scannedVoucher.category === 'third_party_discount'
                  ? 'كوبون خصم شركاء تجاريين 🏷️'
                  : 'هدية وسلع معتمدة 🎁'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-bold">المطلوب دفعه من العميل:</span>
              <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                0.00 جنيه مصري (مغطاة بنقاط الولاء)
              </span>
            </div>
          </div>

          {!scannedVoucher.isUsed && (
            <button
              type="button"
              onClick={handleConfirmRedeemReward}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 rounded-2xl transition shadow-lg text-sm flex items-center justify-center gap-2 active:scale-98"
            >
              <Gift className="w-4 h-4" />
              <span>صرف وتسليم الهدية / الكوبون للعميل فوراً 🎁</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
