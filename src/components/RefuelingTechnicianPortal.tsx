import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Fuel,
  Gauge,
  Car,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Printer,
  History,
  RotateCcw,
  Sparkles,
  User,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  ChevronDown,
  Info,
  QrCode,
  X,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '../context/SettingsContext';
import {
  insertRefuelingTransactionToDb,
  fetchRefuelingTransactionsFromDb,
} from '../services/supabaseClient';
import { RefuelingTransaction, PaymentMethod } from '../types/database';
import { TechnicianCrewMember } from '../types';

interface RefuelingTechnicianPortalProps {
  activeTechnician?: TechnicianCrewMember | null;
  onOpenScanner?: () => void;
  onOpenDriverLookup?: () => void;
}

export const RefuelingTechnicianPortal: React.FC<RefuelingTechnicianPortalProps> = ({
  activeTechnician,
}) => {
  const { gasPrice, stationName, stationId, currency, isSupabaseConfigured } = useSettings();

  // Active technician identity (from session or default)
  const currentTech = useMemo(() => {
    return {
      id: activeTechnician?.id || 'tech-001',
      name: activeTechnician?.name || 'محمود السيد (فني أول)',
      role: activeTechnician?.role || 'فني تموين',
    };
  }, [activeTechnician]);

  // Form inputs
  const [carPlate, setCarPlate] = useState('');
  const [carType, setCarType] = useState('ملاكي');
  const [meterStart, setMeterStart] = useState<string>('14250.0');
  const [meterEnd, setMeterEnd] = useState<string>('14268.5');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<RefuelingTransaction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [todayTransactions, setTodayTransactions] = useState<RefuelingTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastReceiptTx, setLastReceiptTx] = useState<RefuelingTransaction | null>(null);

  // Meter calculations (Live Computed)
  const numericStart = parseFloat(meterStart) || 0;
  const numericEnd = parseFloat(meterEnd) || 0;
  const cubicMeters = useMemo(() => {
    if (numericEnd > numericStart && numericStart > 0) {
      return Number((numericEnd - numericStart).toFixed(2));
    }
    return 0;
  }, [numericStart, numericEnd]);

  const totalAmount = useMemo(() => {
    return Number((cubicMeters * gasPrice).toFixed(2));
  }, [cubicMeters, gasPrice]);

  // Load technician's shift transactions
  const loadShiftTransactions = async () => {
    setIsLoadingHistory(true);
    try {
      const txs = await fetchRefuelingTransactionsFromDb(
        {},
        'technician',
        currentTech.id
      );
      setTodayTransactions(txs);
      
      // Auto-update meterStart with the end reading of the last transaction
      if (txs.length > 0 && txs[0].meter_end) {
        setMeterStart(String(txs[0].meter_end));
        setMeterEnd(String(Number(txs[0].meter_end + 18.0).toFixed(1)));
      }
    } catch (err) {
      console.error('Error loading shift transactions:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadShiftTransactions();
  }, [currentTech.id]);

  // Shift metrics
  const shiftMetrics = useMemo(() => {
    const count = todayTransactions.length;
    const totalM3 = todayTransactions.reduce((acc, t) => acc + (t.cubic_meters || 0), 0);
    const totalRevenue = todayTransactions.reduce((acc, t) => acc + (t.total_amount || 0), 0);
    return {
      count,
      totalM3: Number(totalM3.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
    };
  }, [todayTransactions]);

  // Handle Form Submit
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!carPlate.trim()) {
      setErrorMessage('يرجى إدخال رقم أو حروف لوحة السيارة.');
      return;
    }
    if (numericStart <= 0) {
      setErrorMessage('يرجى التأكد من كتابة قراءة العداد الابتدائية بشكل صحيح.');
      return;
    }
    if (numericEnd <= numericStart) {
      setErrorMessage('قراءة العداد النهائية يجب أن تكون أكبر من قراءة البداية.');
      return;
    }
    if (cubicMeters <= 0) {
      setErrorMessage('كمية الغاز المحسوبة غير صحيحة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const savedTx = await insertRefuelingTransactionToDb({
        station_id: stationId,
        station_name: stationName,
        technician_id: currentTech.id,
        technician_name: currentTech.name,
        car_plate: carPlate.trim(),
        car_type: carType,
        meter_start: numericStart,
        meter_end: numericEnd,
        cubic_meters: cubicMeters,
        unit_price: gasPrice,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        notes: notes.trim(),
      });

      // Confetti & Feedback
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
      });

      setSubmitSuccess(savedTx);
      setLastReceiptTx(savedTx);
      setShowReceiptModal(true);

      // Auto update list
      setTodayTransactions((prev) => [savedTx, ...prev]);

      // Reset fields for the next vehicle
      setCarPlate('');
      setNotes('');
      // Advance meters to next car
      setMeterStart(String(numericEnd));
      setMeterEnd(String(Number(numericEnd + 17.5).toFixed(1)));

      setTimeout(() => {
        setSubmitSuccess(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(`حدث خطأ أثناء الحفظ: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick preset helper for car plate letters
  const addPlateChar = (char: string) => {
    setCarPlate((prev) => (prev ? `${prev} ${char}` : char));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Shift Status Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-700/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Fuel className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-semibold border border-emerald-400/30">
                  وردية نشطة
                </span>
                <span className="text-xs text-emerald-200/80">كود: {stationId}</span>
              </div>
              <h2 className="text-lg font-bold">{stationName}</h2>
              <div className="flex items-center gap-2 text-xs text-emerald-100 mt-0.5">
                <User className="w-3.5 h-3.5" />
                <span>الفني المسجل: <strong className="text-white">{currentTech.name}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-4 bg-white/10 backdrop-blur-sm p-2 sm:p-3 rounded-xl border border-white/15">
            <div className="text-center px-2">
              <p className="text-[11px] text-emerald-200">سيارات الوردية</p>
              <p className="text-lg font-black text-white">{shiftMetrics.count}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <p className="text-[11px] text-emerald-200">الكمية (م³)</p>
              <p className="text-lg font-black text-emerald-300">{shiftMetrics.totalM3}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <p className="text-[11px] text-emerald-200">الإيراد</p>
              <p className="text-lg font-black text-amber-300">{shiftMetrics.totalRevenue} {currency}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Refueling Entry Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              تسجيل عملية تموين جديدة (قراءات العدادات)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
              <span>سعر المتر المعتمد:</span>
              <strong className="text-sm font-black">{gasPrice.toFixed(2)}</strong>
              <span>{currency}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveTransaction} className="p-6 space-y-6">
          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{errorMessage}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>
                  تم تسجيل العملية بنجاح للسيارة ({submitSuccess.car_plate}) بقيمة {submitSuccess.total_amount} {currency}!
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLastReceiptTx(submitSuccess);
                  setShowReceiptModal(true);
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الإيصال</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Vehicle Identification */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                1. بيانات السيارة واللوحة المعدنية
              </label>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  رقم وحروف اللوحة المعدنية <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value)}
                    placeholder="مثال: س ر ق 4 5 1 2"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    autoFocus
                  />
                  <Car className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>
                {/* Quick Egyptian Plate letters helpers */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs text-slate-500">
                  <span className="text-[11px] text-slate-400">إضافة سريعة:</span>
                  {['أ', 'ب', 'ج', 'د', 'ر', 'س', 'ص', 'ط', 'ع', 'ف', 'ق', 'م', 'ن', 'هـ', 'و', 'ي'].slice(0, 8).map((ltr) => (
                    <button
                      key={ltr}
                      type="button"
                      onClick={() => addPlateChar(ltr)}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-700 dark:text-slate-300 rounded font-semibold border border-slate-200 dark:border-slate-700 transition"
                    >
                      {ltr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  نوع وفئة المركبة
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['ملاكي', 'تاكسي أبيض', 'ميكروباص', 'نقل خفيف', 'أتوبيس', 'أخرى'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCarType(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition ${
                        carType === type
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Meter Readings & Automatic Calculations */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                2. قراءات العداد والكمية المستهلكة
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    قراءة البداية (م³) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={meterStart}
                    onChange={(e) => setMeterStart(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    قراءة النهاية (م³) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={meterEnd}
                    onChange={(e) => setMeterEnd(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Live Reactive Calculation Result Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 rounded-xl border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
                  <span>حساب الكمية والقيمة آلياً:</span>
                  <span className="font-mono text-emerald-400">سعر المتر: {gasPrice} {currency}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-xs text-slate-400 block">كمية الغاز المستهلكة</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {cubicMeters > 0 ? cubicMeters : '0.0'}
                      </span>
                      <span className="text-xs text-slate-400">متر مكعب (م³)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">إجمالي الحساب المطلوب</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-amber-400 font-mono">
                        {totalAmount > 0 ? totalAmount : '0.00'}
                      </span>
                      <span className="text-xs text-slate-400">{currency}</span>
                    </div>
                  </div>
                </div>

                {numericEnd > 0 && numericEnd <= numericStart && (
                  <p className="mt-2 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                    <Info className="w-3.5 h-3.5" />
                    <span>تنبيه: قراءة النهاية يجب أن تتجاوز قراءة البداية.</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              3. طريقة التحصيل والدفع
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'cash', label: 'نقدي (كاش)', icon: Banknote },
                { id: 'e_wallet', label: 'محفظة / إنستاباي', icon: Smartphone },
                { id: 'visa', label: 'فيزا / بنك', icon: CreditCard },
                { id: 'fleet_card', label: 'كارت شركة / أسطول', icon: ShieldCheck },
              ].map((m) => {
                const IconComponent = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || cubicMeters <= 0}
              className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-base transition-all transform active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isSubmitting ? 'جارٍ الحفظ والترحيل...' : `تأكيد التموين وتحصيل ${totalAmount} ${currency}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCarPlate('');
                setNotes('');
              }}
              className="px-4 py-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تفريغ الحقول للسيارة التالية</span>
            </button>
          </div>
        </form>
      </div>

      {/* Technician Shift Log (Recent Fuelings Today) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              سجل تموينات ورديتي اليومية (خاص بالفني: {currentTech.name})
            </h3>
          </div>
          <button
            type="button"
            onClick={loadShiftTransactions}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            <span>تحديث السجل</span>
          </button>
        </div>

        {todayTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Fuel className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-medium">لم يتم تسجيل عمليات تموين في هذه الوردية بعد.</p>
            <p className="text-xs mt-1">ابدأ بإدخال قراءات العداد واللوحة أعلاه للحفظ المباشر.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">التوقيت</th>
                  <th className="py-3 px-4">لوحة السيارة</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">قراءة البداية</th>
                  <th className="py-3 px-4">قراءة النهاية</th>
                  <th className="py-3 px-4">الكمية (م³)</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">الدفع</th>
                  <th className="py-3 px-4">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {todayTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {new Date(tx.created_at).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                      {tx.car_plate}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                        {tx.car_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{tx.meter_start}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{tx.meter_end}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {tx.cubic_meters} م³
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {tx.total_amount} {currency}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {tx.payment_method === 'cash'
                          ? 'كاش'
                          : tx.payment_method === 'e_wallet'
                          ? 'محفظة'
                          : tx.payment_method === 'visa'
                          ? 'فيزا'
                          : 'كارت شركة'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          setLastReceiptTx(tx);
                          setShowReceiptModal(true);
                        }}
                        className="text-slate-500 hover:text-emerald-600 transition p-1"
                        title="طباعة إيصال"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {showReceiptModal && lastReceiptTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-4">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Fuel className="w-6 h-6" />
              </div>
              <h4 className="font-black text-base text-slate-800 dark:text-slate-100">
                شركة كارجاس للغاز الطبيعي
              </h4>
              <p className="text-xs text-slate-500">{stationName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">إيصال تموين إلكتروني معتمد</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">رقم الحركة:</span>
                <span className="font-bold">{lastReceiptTx.id.slice(0, 14)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">التاريخ والوقت:</span>
                <span>{new Date(lastReceiptTx.created_at).toLocaleString('ar-EG')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">لوحة السيارة:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {lastReceiptTx.car_plate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">نوع المركبة:</span>
                <span>{lastReceiptTx.car_type}</span>
              </div>
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>قراءة العداد الابتدائية:</span>
                  <span>{lastReceiptTx.meter_start} م³</span>
                </div>
                <div className="flex justify-between">
                  <span>قراءة العداد النهائية:</span>
                  <span>{lastReceiptTx.meter_end} م³</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>الكمية المعبأة:</span>
                  <span>{lastReceiptTx.cubic_meters} م³</span>
                </div>
                <div className="flex justify-between">
                  <span>سعر المتر:</span>
                  <span>{lastReceiptTx.unit_price} {currency}</span>
                </div>
              </div>
              <div className="border-t-2 border-slate-800 dark:border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>المبلغ الإجمالي المسدد:</span>
                <span>{lastReceiptTx.total_amount} {currency}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>طريقة السداد:</span>
                <span>{lastReceiptTx.payment_method}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>فني المحطة:</span>
                <span>{lastReceiptTx.technician_name}</span>
              </div>
            </div>

            <div className="pt-2 text-center border-t border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-[10px] text-slate-400">
                كارجاس تتمنى لكم رحلة آمنة • خط الشكاوى: 19058
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                نظام إدارة المحطات - تطوير شركة عزوتي (م/ محمد عبد الرحمن يوسف)
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الإيصال (حراري)</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
