import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Fuel,
  Gauge,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Printer,
  Hash,
  Car,
} from 'lucide-react';
import { FuelingSession, AppConfig } from '../types';
import { simulateScadaSignal } from '../services/scadaService';
import { getFuelingSessions } from '../services/storageService';

interface ScadaLiveFuelingScreenProps {
  session: FuelingSession;
  config: AppConfig;
  onDone: () => void;
}

export const ScadaLiveFuelingScreen: React.FC<ScadaLiveFuelingScreenProps> = ({
  session,
  config,
  onDone,
}) => {
  const [currentSession, setCurrentSession] = useState<FuelingSession>(session);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [customTestVolume, setCustomTestVolume] = useState<number>(18.5);

  // Timer for elapsed fueling duration
  useEffect(() => {
    if (currentSession.status === 'COMPLETED') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession.status]);

  // Listen to live broadcast events from SCADA webhook or simulation
  useEffect(() => {
    const handleScadaComplete = (e: any) => {
      const detail = e.detail;
      if (
        detail?.session?.session_id === currentSession.session_id ||
        (detail?.session?.hose_id === currentSession.hose_id &&
          detail?.session?.station_id === currentSession.station_id)
      ) {
        setCurrentSession(detail.session);
        triggerSuccessCelebration();
      }
    };

    const handleSessionsUpdated = () => {
      const all = getFuelingSessions();
      const match = all.find((s) => s.session_id === currentSession.session_id);
      if (match && match.status !== currentSession.status) {
        setCurrentSession(match);
        if (match.status === 'COMPLETED') {
          triggerSuccessCelebration();
        }
      }
    };

    window.addEventListener('cargas_scada_session_completed', handleScadaComplete);
    window.addEventListener('cargas_sessions_updated', handleSessionsUpdated);

    return () => {
      window.removeEventListener('cargas_scada_session_completed', handleScadaComplete);
      window.removeEventListener('cargas_sessions_updated', handleSessionsUpdated);
    };
  }, [currentSession.session_id, currentSession.hose_id, currentSession.station_id]);

  const triggerSuccessCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#06b6d4'],
      });
    } catch {}
  };

  // Immediate simulation button click
  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = simulateScadaSignal(
        currentSession.station_id,
        currentSession.hose_id,
        customTestVolume
      );
      setIsSimulating(false);
      if (res.session) {
        setCurrentSession(res.session);
        triggerSuccessCelebration();
      }
    }, 600);
  };

  const isCompleted = currentSession.status === 'COMPLETED';

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Main Container Card */}
      <div className={`rounded-3xl p-6 sm:p-8 border-2 transition-all shadow-2xl relative overflow-hidden ${
        isCompleted
          ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-emerald-400 text-white'
          : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border-indigo-500/50 text-white'
      }`}>
        
        {/* Pulsing visual glow */}
        <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isCompleted ? 'bg-emerald-400' : 'bg-indigo-400 animate-pulse'
        }`}></div>

        {/* Header Status Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-400/40 animate-pulse'
            }`}>
              {isCompleted ? '✓' : '⛽'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isCompleted
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-400 text-slate-950 animate-pulse'
                }`}>
                  {isCompleted ? 'تم الإنجاز والاعتماد ✓' : 'جلسة تموين نشطة ومفتوحة ⚡'}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {currentSession.session_id}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {isCompleted
                  ? 'تم التموين بنجاح واحتساب النقاط تلقائياً ✓'
                  : 'جاري التموين وضخ الغاز... بانتظار قراءة العداد من نظام SCADA ⛽⚡'}
              </h2>
            </div>
          </div>

          {/* Timer Display */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">وقت التموين:</span>
            <span className="text-base font-black text-white">
              {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Middle Stage: Waiting vs Completed */}
        <div className="py-8">
          {!isCompleted ? (
            /* Live Waiting Flow Animation */
            <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto">
              
              {/* Animated Gas Flow Pump Icon */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-indigo-600/20 border-2 border-indigo-400 flex items-center justify-center text-5xl animate-bounce">
                  ⛽
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400/40 animate-ping pointer-events-none"></div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">
                  مسدس التموين [{currentSession.hose_id}] متصل بالسيارة [{currentSession.car_plate}]
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-light">
                  النظام يستمع لحظياً لقراءة العداد الفعلي المرسلة عبر واجهة السكادا المركزية
                  <code className="text-amber-300 font-mono text-[11px] block mt-1">
                    POST /api/scada/complete-transaction
                  </code>
                </p>
              </div>

              {/* Session Meta Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full text-xs font-mono">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">المحطة:</span>
                  <span className="font-bold text-white truncate block">
                    {currentSession.station_name || currentSession.station_id}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">مسدس التموين:</span>
                  <span className="font-black text-amber-300 block">{currentSession.hose_id}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">رقم اللوحة:</span>
                  <span className="font-black text-white block">{currentSession.car_plate}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">سعر المتر:</span>
                  <span className="font-bold text-emerald-400 block">{currentSession.unit_price} ج/م³</span>
                </div>
              </div>

              {/* Instant Test Simulator Trigger Box */}
              <div className="w-full bg-slate-900/90 rounded-2xl p-4 border border-amber-400/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    اختبار ومحاكاة إشارة السكادا فوراً (Test Webhook Trigger):
                  </span>
                  <span className="text-[10px] text-slate-400">بدون انتظار أجهزة المحطة</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="60"
                      value={customTestVolume}
                      onChange={(e) => setCustomTestVolume(parseFloat(e.target.value) || 18.5)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm font-mono font-black text-white outline-none focus:border-amber-400"
                    />
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">م³</span>
                  </div>

                  <button
                    type="button"
                    disabled={isSimulating}
                    onClick={handleTriggerSimulation}
                    className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>{isSimulating ? 'جارٍ الإرسال...' : 'إرسال قراءة السكادا الآن ⚡'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Completed Fueling Summary View */
            <div className="space-y-6 animate-in zoom-in-95 max-w-2xl mx-auto">
              
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 flex items-center justify-center text-4xl mx-auto shadow-lg">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-white">تم استلام قراءة العداد وإغلاق الجلسة</h3>
                <p className="text-xs text-emerald-200">
                  تمت مزامنة البيانات مع محفظة العميل وتحديث سجل الوردية بنجاح
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center space-y-1">
                  <span className="text-[11px] text-slate-300 block">كمية الغاز الفعلية:</span>
                  <span className="text-2xl font-black font-mono text-emerald-300">
                    {currentSession.volume_m3} م³
                  </span>
                  <span className="text-[10px] text-slate-400 block">قراءة السكادا المعتمدة</span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center space-y-1">
                  <span className="text-[11px] text-slate-300 block">المبلغ المطلوب تحصيله:</span>
                  <span className="text-2xl font-black font-mono text-white">
                    {currentSession.total_amount} ج.م
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ({currentSession.unit_price} ج / متر)
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center space-y-1">
                  <span className="text-[11px] text-amber-300 block">نقاط الولاء المكتسبة:</span>
                  <span className="text-2xl font-black font-mono text-amber-400">
                    +{currentSession.points_earned} نقطة ⭐
                  </span>
                  <span className="text-[10px] text-slate-400 block">محسوبة بالمعادلة المعتمدة</span>
                </div>
              </div>

              {/* Receipt & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-2xl border border-white/20 transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة إيصال التموين</span>
                </button>

                <button
                  type="button"
                  onClick={onDone}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-7 py-3 rounded-2xl transition shadow-xl flex items-center justify-center gap-2 active:scale-95"
                >
                  <Car className="w-4 h-4" />
                  <span>بدء تموين سيارة أخرى 🚗</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
