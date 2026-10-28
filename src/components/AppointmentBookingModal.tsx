import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  Car,
  Phone,
  Zap,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Bell,
  Check,
  Ban,
} from 'lucide-react';
import {
  CargasStationLocation,
  DriverProfile,
  ServiceAppointment,
  AppointmentServiceType,
  AppointmentStatus,
} from '../types';
import {
  getServiceAppointments,
  bookServiceAppointment,
  confirmServiceAppointment,
  cancelServiceAppointment,
  triggerTwoHourReminderSimulation,
  autoCancelNoShowAppointment,
  claimVacantReallocatedSlot,
} from '../services/storageService';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverProfile;
  stations: CargasStationLocation[];
}

const AVAILABLE_SERVICES: AppointmentServiceType[] = [
  'فحص واختبار أسطوانة الغاز وصمام الأمان (شهادة المرور)',
  'صيانة دورية وتغيير طقم فلاتر الغاز',
  'تغيير زيت المحرك وفحص الفلتر أسفل المظلة',
  'تغيير طقم بوجيهات بوش وضبط فجوة الإشعال',
  'فحص تسريب الغاز ومعايرة منظم الضغط والرشاشات',
  'صيانة سريعة عامة وضبط محبس الأمان',
];

const TIME_SLOTS = [
  '09:00 ص - 09:30 ص',
  '10:00 ص - 10:30 ص',
  '11:00 ص - 11:30 ص',
  '12:00 م - 12:30 م',
  '01:00 م - 01:30 م',
  '02:30 م - 03:00 م',
  '04:00 م - 04:30 م',
];

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  driver,
  stations,
}) => {
  const [activeTab, setActiveTab] = useState<'my_appointments' | 'new_booking'>('my_appointments');
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);

  // New Booking Form State
  const [selectedService, setSelectedService] = useState<AppointmentServiceType>(AVAILABLE_SERVICES[0]);
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || 'ST-01');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[1]);
  const [driverNotes, setDriverNotes] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load appointments
  const refreshAppointments = () => {
    setAppointments(getServiceAppointments());
  };

  useEffect(() => {
    if (isOpen) {
      refreshAppointments();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Selected station object
  const chosenStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  // Check for vacant / cancelled slots that can be claimed by this driver (Auto-Reallocation opportunity)
  const vacantSlots = appointments.filter(
    (a) => a.status === 'auto_cancelled_no_show' && a.driverId !== driver.id
  );

  // Filter current driver's appointments
  const myAppointments = appointments.filter((a) => a.driverId === driver.id);

  // Handlers
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp = bookServiceAppointment({
      driverId: driver.id,
      driverName: driver.name,
      carPlate: driver.carPlate,
      phone: driver.phone,
      stationId: chosenStation?.id || 'ST-01',
      stationName: chosenStation?.name || 'محطة كارجاس',
      serviceType: selectedService,
      appointmentDate: selectedDate,
      timeSlot: selectedSlot,
      notes: driverNotes || 'حجز عبر تطبيق عملاء كارجاس',
    });

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setSuccessToast(`تم حجز موعدك بنجاح برقم (${newApp.id}) في ${newApp.stationName}`);
    refreshAppointments();
    setActiveTab('my_appointments');
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleConfirmAttendance = (appId: string) => {
    confirmServiceAppointment(appId);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setSuccessToast('تم تأكيد حضورك بنجاح! موعدك مؤكد ومحجوز في المحطة.');
    refreshAppointments();
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCancelAppointment = (appId: string) => {
    if (confirm('هل أنت متأكد من رغبتك في إلغاء هذا الموعد وفتحه لسائق آخر؟')) {
      cancelServiceAppointment(appId, 'ألغاه السائق');
      setSuccessToast('تم إلغاء الموعد بنجاح.');
      refreshAppointments();
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const handleClaimVacantSlot = (vacantApp: ServiceAppointment) => {
    claimVacantReallocatedSlot(
      vacantApp.id,
      driver.id,
      driver.name,
      driver.carPlate,
      driver.phone
    );

    confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    setSuccessToast(`عظيم يا بطل! تم تقديم موعدك وشغل المكان الشاغر فوراً في (${vacantApp.stationName})!`);
    refreshAppointments();
    setActiveTab('my_appointments');
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleSimulate2HrAlert = (appId: string) => {
    triggerTwoHourReminderSimulation(appId);
    setSuccessToast('تمت محاكاة إرسال إشعار التأكيد قبل الموعد بساعتين مع مهلة ساعة للرد ⏰');
    refreshAppointments();
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSimulateNoShowExpire = (appId: string) => {
    autoCancelNoShowAppointment(appId);
    setSuccessToast('انقضت مهلة الساعة دون رد! تم إلغاء الحجز تلقائياً وفتح المكان لعملاء قائمة الانتظار.');
    refreshAppointments();
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
              📅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black">
                  حجز مواعيد الصيانة وفحص أسطوانات كارجاس
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  نظام التدوير الذكي ⚡
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-light mt-0.5">
                تأكيد الوصول قبل ساعتين، وتدوير فوري للأماكن الشاغرة لعملاء الانتظار
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-50 border-y border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center justify-between px-6 animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('my_appointments')}
            className={`pb-3 px-4 text-xs font-black border-b-2 transition flex items-center gap-2 ${
              activeTab === 'my_appointments'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>مواعيدي المحجوزة ({myAppointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('new_booking')}
            className={`pb-3 px-4 text-xs font-black border-b-2 transition flex items-center gap-2 ${
              activeTab === 'new_booking'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>حجز موعد جديد ⚡</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Smart Standby Vacant Slots Notification Banner (فرصة تقديم الموعد فوراً) */}
          {vacantSlots.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-400/80 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <span className="text-xl">🔔</span>
                  <h4 className="font-black text-xs sm:text-sm">
                    فرصة لتقديم موعدك! تم خلو مواعيد أبكر بالمحطة لعدم تأكيد الحجز:
                  </h4>
                </div>
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  متاح فوراً ({vacantSlots.length})
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                قام النظام الذكي بإلغاء حجز لم يتم تأكيده قبل الموعد بساعتين، ويمكنك الآن شغل هذا المكان الشاغر وتقديم دورك فوراً بضغطة واحدة دون انتظار!
              </p>

              <div className="space-y-2 pt-1">
                {vacantSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-white rounded-xl p-3 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{slot.serviceType}</span>
                        <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                          {slot.timeSlot}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        📍 {slot.stationName} • التاريخ: {slot.appointmentDate}
                      </p>
                    </div>

                    <button
                      onClick={() => handleClaimVacantSlot(slot)}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>تقديم موعدي وشغل المكان فوراً 🚀</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 1: MY APPOINTMENTS */}
          {activeTab === 'my_appointments' && (
            <div className="space-y-4">
              {myAppointments.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl mx-auto">
                    📅
                  </div>
                  <h4 className="font-black text-sm text-slate-800">لا توجد لديك مواعيد محجوزة حالياً</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    احجز موعد فحص أسطوانة لتجديد الرخصة أو صيانة منظومة الغاز وتغيير الزيت لتفادي الانتظار بالمحطة.
                  </p>
                  <button
                    onClick={() => setActiveTab('new_booking')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
                  >
                    احجز موعدك الأول الآن ←
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myAppointments.map((app) => {
                    const isAwaitingConfirmation = app.status === 'awaiting_confirmation';
                    const isConfirmed = app.status === 'confirmed_by_driver';
                    const isReallocated = app.status === 'reallocated_to_standby';
                    const isCancelled = app.status === 'cancelled_by_driver' || app.status === 'auto_cancelled_no_show';

                    return (
                      <div
                        key={app.id}
                        className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 space-y-3 ${
                          isAwaitingConfirmation
                            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-md'
                            : isConfirmed || isReallocated
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : isCancelled
                            ? 'bg-slate-50 border-slate-200 opacity-70'
                            : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        {/* Status bar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              #{app.id}
                            </span>
                            <h4 className="font-black text-sm text-slate-900">{app.serviceType}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            {isAwaitingConfirmation && (
                              <span className="bg-amber-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>مطلوب تأكيد الحضور (تنبيه قبل ساعتين ⏰)</span>
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="bg-emerald-100 text-emerald-800 font-black text-[11px] px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>تم تأكيد حضورك بنجاح ✓</span>
                              </span>
                            )}
                            {isReallocated && (
                              <span className="bg-teal-100 text-teal-900 font-black text-[11px] px-3 py-1 rounded-full border border-teal-300 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                                <span>موعد مقدم (شغل مكان شاغر ⚡)</span>
                              </span>
                            )}
                            {app.status === 'scheduled' && (
                              <span className="bg-blue-100 text-blue-800 font-black text-[11px] px-3 py-1 rounded-full border border-blue-200">
                                مجدول ومؤكد مبدئياً 📅
                              </span>
                            )}
                            {isCancelled && (
                              <span className="bg-rose-100 text-rose-800 font-black text-[11px] px-3 py-1 rounded-full border border-rose-200">
                                ملغي
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-medium">المحطة:</span>
                            <span className="font-bold text-slate-900">{app.stationName}</span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-medium">التاريخ والموعد:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {app.appointmentDate} • {app.timeSlot}
                            </span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-medium">بيانات السيارة:</span>
                            <span className="font-bold text-slate-900 font-mono">{app.carPlate}</span>
                          </div>
                        </div>

                        {/* Special Prompt for Confirmation before 2 hours */}
                        {isAwaitingConfirmation && (
                          <div className="bg-white p-3.5 rounded-xl border border-amber-300 space-y-3">
                            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                              <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                              <span>تنبيه هام: موعدك بعد ساعتين! يرجى تأكيد حضورك لتثبيت الحجز وعدم تمريره لسائق آخر.</span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              في حالة عدم تأكيد الحضور خلال <span className="font-black text-rose-600">ساعة واحدة</span> من وصول التنبيه، يعتبر الحجز لاغياً وينتقل الدور تلقائياً لعميل آخر من قائمة الانتظار.
                            </p>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                onClick={() => handleConfirmAttendance(app.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
                              >
                                <Check className="w-4 h-4" />
                                <span>نعم، أؤكد حضوري الآن في الموعد ✓</span>
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(app.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl transition"
                              >
                                إلغاء الحجز واعتذار
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Actions & Simulation Bar */}
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-[11px] text-slate-400">
                            رقم هاتف المتابعة: <span className="font-mono font-bold text-slate-600">{app.phone}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Simulator Buttons for easy testing of 2-hour & 1-hour expiration flows */}
                            {app.status === 'scheduled' && (
                              <button
                                type="button"
                                onClick={() => handleSimulate2HrAlert(app.id)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-300 transition"
                                title="محاكاة إرسال إشعار التأكيد قبل الموعد بساعتين"
                              >
                                ⏰ محاكاة تنبيه (قبل الموعد بساعتين)
                              </button>
                            )}

                            {isAwaitingConfirmation && (
                              <button
                                type="button"
                                onClick={() => handleSimulateNoShowExpire(app.id)}
                                className="bg-rose-100 hover:bg-rose-200 text-rose-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-rose-300 transition"
                                title="محاكاة انقضاء مهلة الساعة دون رد"
                              >
                                ⏱️ محاكاة انتهاء مهلة الساعة (No-Show)
                              </button>
                            )}

                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(app.id)}
                                className="text-slate-400 hover:text-rose-600 text-[11px] font-medium transition"
                              >
                                إلغاء الحجز
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: NEW BOOKING FORM */}
          {activeTab === 'new_booking' && (
            <form onSubmit={handleCreateBooking} className="space-y-4">
              
              {/* 1. نوع الخدمة المطلوبة */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>نوع الخدمة المطلوبة:</span>
                  <span className="text-[10px] text-emerald-600 font-bold">معتمد لدى المرور وكارجاس</span>
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value as AppointmentServiceType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {AVAILABLE_SERVICES.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. اختيار المحطة */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">المحطة أو مركز الخدمة:</label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.city || 'القاهرة'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  📍 العنوان: {chosenStation?.address || 'شارع شبرا الرئيسي، القاهرة'}
                </p>
              </div>

              {/* 3. التاريخ والفترة الزمنية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800">تاريخ الموعد:</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800">الفترة الزمنية المتاحة:</label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. بيانات السائق المؤكدة تلقائياً */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">اسم السائق:</span>
                  <span className="font-bold text-slate-900">{driver.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">رقم اللوحة:</span>
                  <span className="font-mono font-bold text-slate-900">{driver.carPlate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">رقم الموبايل:</span>
                  <span className="font-mono font-bold text-slate-900">{driver.phone}</span>
                </div>
              </div>

              {/* 5. ملاحظات اختيارية */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">ملاحظات إضافية للفني أو مهندس الفحص:</label>
                <input
                  type="text"
                  placeholder="مثلاً: صوت تكتكة في المنظم، أو الفحص بغرض الفحص الفني بالمرور..."
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>تأكيد تسجيل وحجز الموعد الآن 📅</span>
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>نظام كارجاس المعتمد لإدارة المواعيد وحماية وقت السائقين</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold px-3 py-1 rounded-lg"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
