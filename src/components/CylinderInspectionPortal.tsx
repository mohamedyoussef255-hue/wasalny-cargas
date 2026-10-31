import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Building2,
  Phone,
  Send,
  Printer,
  FileCheck2,
  RefreshCw,
  Sparkles,
  Lock,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import {
  AppConfig,
  CargasStationLocation,
  ServiceAppointment,
  AppointmentStatus,
} from '../types';
import {
  getServiceAppointments,
  updateServiceAppointment,
  isStationCylinderTestingCenter,
} from '../services/storageService';

interface CylinderInspectionPortalProps {
  config: AppConfig;
  stations: CargasStationLocation[];
  onBackToMain?: () => void;
  onLogout?: () => void;
}

export const CylinderInspectionPortal: React.FC<CylinderInspectionPortalProps> = ({
  config,
  stations,
  onBackToMain,
  onLogout,
}) => {
  const [appointments, setAppointments] = useState<ServiceAppointment[]>(() =>
    getServiceAppointments()
  );

  // Inspector Engineer Identity
  const [inspectorName, setInspectorName] = useState<string>('م. حسام الدين عبد الله (مدير الفحص المعتمد)');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal for Technical Inspection & Certificate Issuance
  const [selectedAppointmentForInspection, setSelectedAppointmentForInspection] = useState<ServiceAppointment | null>(null);
  const [cylinderSerialInput, setCylinderSerialInput] = useState<string>('');
  const [cylinderCapacityInput, setCylinderCapacityInput] = useState<number>(70);
  const [cylinderTestPressureInput, setCylinderTestPressureInput] = useState<number>(300);
  const [cylinderTestResultInput, setCylinderTestResultInput] = useState<'passed' | 'failed'>('passed');
  const [cylinderCertNumberInput, setCylinderCertNumberInput] = useState<string>('');
  const [cylinderCertExpiryInput, setCylinderCertExpiryInput] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().split('T')[0];
  });
  const [technicalNotesInput, setTechnicalNotesInput] = useState<string>('');

  // Certificate Print Preview Modal
  const [printedCertificateApp, setPrintedCertificateApp] = useState<ServiceAppointment | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const refreshList = () => {
    setAppointments(getServiceAppointments());
  };

  // Stations with cylinder inspection capability
  const cylinderStations = useMemo(() => {
    return stations.filter(isStationCylinderTestingCenter);
  }, [stations]);

  // Cylinder inspection appointments only
  const cylinderAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Must be cylinder inspection
      const isCyl =
        app.bookingCategory === 'cylinder_inspection' ||
        app.serviceType.includes('فحص واختبار أسطوانة') ||
        app.serviceType.includes('شهادة المرور');
      if (!isCyl) return false;

      // Station filter
      if (selectedStationFilter !== 'all' && app.stationId !== selectedStationFilter) return false;

      // Status filter
      if (selectedStatusFilter !== 'all' && app.status !== selectedStatusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = app.driverName.toLowerCase().includes(q);
        const matchPlate = app.carPlate.toLowerCase().includes(q);
        const matchPhone = app.phone.toLowerCase().includes(q);
        const matchSerial = (app.cylinderSerialNumber || '').toLowerCase().includes(q);
        const matchId = app.id.toLowerCase().includes(q);
        if (!matchName && !matchPlate && !matchPhone && !matchSerial && !matchId) return false;
      }

      return true;
    });
  }, [appointments, selectedStationFilter, selectedStatusFilter, searchQuery]);

  // WhatsApp Helper
  const formatWhatsAppUrl = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, '');
    let target = clean;
    if (clean.startsWith('01')) target = '2' + clean;
    return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
  };

  // Open Technical Execution Modal
  const openTechnicalModal = (app: ServiceAppointment) => {
    setSelectedAppointmentForInspection(app);
    setCylinderSerialInput(app.cylinderSerialNumber || `CYL-EG-${Math.floor(100000 + Math.random() * 900000)}`);
    setCylinderCapacityInput(app.cylinderWaterCapacityL || 70);
    setCylinderTestPressureInput(app.cylinderTestPressureBar || 300);
    setCylinderTestResultInput(app.cylinderTestResult === 'failed' ? 'failed' : 'passed');
    setCylinderCertNumberInput(app.cylinderCertificateNumber || `CRG-CERT-${Math.floor(1000 + Math.random() * 9000)}`);
    setTechnicalNotesInput(app.customerServiceNotes || '');
  };

  // Save Technical Inspection & Issue Certificate
  const handleSaveInspectionResult = () => {
    if (!selectedAppointmentForInspection) return;

    const isPassed = cylinderTestResultInput === 'passed';

    updateServiceAppointment(selectedAppointmentForInspection.id, {
      status: 'completed',
      cylinderSerialNumber: cylinderSerialInput,
      cylinderWaterCapacityL: cylinderCapacityInput,
      cylinderTestPressureBar: cylinderTestPressureInput,
      cylinderTestResult: cylinderTestResultInput,
      cylinderCertificateNumber: isPassed ? cylinderCertNumberInput : undefined,
      cylinderCertificateExpiryDate: isPassed ? cylinderCertExpiryInput : undefined,
      inspectedAtStationId: selectedAppointmentForInspection.stationId,
      inspectedAtStationName: selectedAppointmentForInspection.stationName,
      inspectionEngineerName: inspectorName,
      customerServiceNotes: technicalNotesInput || `تم إجراء الاختبار الهيدروستاتيكي بضغط ${cylinderTestPressureInput} بار - النتيجة: [${isPassed ? 'ناجح وصالح للاستخدام 3 سنوات' : 'راسب وغير صالح للإعادة'}].`,
    });

    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    showToast(`تم توثيق فحص الأسطوانة وإصدار شهادة الصلاحية برقم (${cylinderCertNumberInput}) بنجاح!`);
    setSelectedAppointmentForInspection(null);
    refreshList();
  };

  // Print Certificate Helper
  const handlePrintCertificate = (app: ServiceAppointment) => {
    setPrintedCertificateApp(app);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: AppointmentStatus) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          تم الفحص وإصدار الشهادة ✅
        </span>
      );
    }
    if (status === 'confirmed_by_driver') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          حضور مؤكد بالمعمل 🛡️
        </span>
      );
    }
    if (status === 'awaiting_confirmation') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          موعد قريب بانتظار العميل ⏳
        </span>
      );
    }
    if (status === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          حجز فحص مجدول
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
        {status}
      </span>
    );
  };

  // KPI Calculations
  const totalCylCount = cylinderAppointments.length;
  const passedCertCount = cylinderAppointments.filter((a) => a.cylinderTestResult === 'passed').length;
  const pendingCylCount = cylinderAppointments.filter((a) => a.status !== 'completed').length;

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-5 h-5 text-emerald-300 animate-spin" />
          <span className="text-sm font-black">{toastMessage}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    مراكز فحص واختبار أسطوانات الغاز المعتمدة 🛡️
                  </h1>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    شهادات المرور الرسمية 📜
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  فحص الضغط الهيدروستاتيكي 300 بار، اختبار صمامات الأمان، وتوثيق شهادات الصلاحية لـ 3 سنوات
                </p>
              </div>
            </div>
          </div>

          {/* Inspector Engineer Profile & Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-800/50 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">مدير الفحص المعتمد:</span>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white border-none outline-none p-0 w-44 focus:ring-0"
                />
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>قفل والخروج</span>
              </button>
            )}

            {onBackToMain && (
              <button
                onClick={onBackToMain}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition"
              >
                الرئيسية
              </button>
            )}
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-bold block">إجمالي حجوزات فحص الأسطوانات</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-white">{totalCylCount}</span>
              <Calendar className="w-5 h-5 text-teal-400" />
            </div>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-800/40">
            <span className="text-[11px] text-emerald-300 font-bold block">شهادات المرور الصادرة (ناجح)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-400">{passedCertCount}</span>
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="bg-amber-950/40 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-800/40">
            <span className="text-[11px] text-amber-300 font-bold block">حجوزات بانتظار الفحص بالمحطة</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-amber-400">{pendingCylCount}</span>
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Station Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم السيارة، اسم العميل، رقم الأسطوانة المحفور، أو كود الحجز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Station Filter: Strictly restricted to stations with cylinder testing */}
          <select
            value={selectedStationFilter}
            onChange={(e) => setSelectedStationFilter(e.target.value)}
            className="flex-1 md:w-64 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">كل مراكز فحص الأسطوانات المعتمدة 🛡️</option>
            {cylinderStations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.city})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">كل الحالات</option>
            <option value="scheduled">حجز جديد</option>
            <option value="awaiting_confirmation">بانتظار التأكيد</option>
            <option value="confirmed_by_driver">مؤكد الحضور</option>
            <option value="completed">تم الفحص وإصدار الشهادة</option>
          </select>

          <button
            onClick={refreshList}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cylinder Bookings Cards Grid */}
      {cylinderAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-700">لا توجد حجوزات فحص أسطوانات مطابقة لمعايير البحث</h3>
          <p className="text-xs text-slate-500">
            تأكد من اختيار مركز الفحص المناسب أو مراجعة معايير التصفية أعلاه
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cylinderAppointments.map((app) => {
            const isPassed = app.cylinderTestResult === 'passed';
            const hasCert = Boolean(app.cylinderCertificateNumber);

            const testWhatsappMessage = `عزيزنا العميل أستاذ ${app.driverName}، تم توثيق نتيجة الفحص الهيدروستاتيكي لأسطوانة سيارتكم (${app.carPlate}) بمركز كارجاس المعتمد (${app.stationName}) بنجاح. رقم الأسطوانة: (${app.cylinderSerialNumber || 'معتمد'})، ضغط الاختبار: 300 بار، ورقم شهادة الصلاحية للمرور: (${app.cylinderCertificateNumber || 'ساري 3 سنوات'}). شكراً لثقتكم بشركة كارجاس 19058.`;
            const testWhatsappUrl = formatWhatsAppUrl(app.phone, testWhatsappMessage);

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-5 border-2 border-emerald-100 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar with ID & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-black text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      #{app.id} • فحص أسطوانات
                    </span>
                    {renderStatusBadge(app.status)}
                  </div>

                  {/* Driver & Car Box */}
                  <div className="flex items-start justify-between gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{app.driverName}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">
                        {app.phone}
                      </p>
                    </div>
                    <div className="bg-white border-2 border-slate-800 rounded-lg px-2.5 py-1 text-center shadow-xs">
                      <span className="text-[9px] text-slate-400 font-bold block border-b border-slate-200">
                        مصر EGYPT
                      </span>
                      <span className="text-xs font-black text-slate-900 tracking-wider">
                        {app.carPlate}
                      </span>
                    </div>
                  </div>

                  {/* Technical Testing Details */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">مركز الفحص المعتمد:</span>
                      <span className="font-black text-slate-800">{app.stationName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">الموعد المحدد:</span>
                      <span className="font-mono text-slate-800">
                        {app.appointmentDate} • {app.timeSlot}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">رقم الأسطوانة المحفور:</span>
                      <span className="font-mono font-black text-slate-900">
                        {app.cylinderSerialNumber || 'بانتظار تسجيل الرقم عند الفحص'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">السعة المائية للأسطوانة:</span>
                      <span className="font-bold text-slate-800">
                        {app.cylinderWaterCapacityL ? `${app.cylinderWaterCapacityL} لتر` : '70 لتر (قياسي)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">ضغط الاختبار الهيدروستاتيكي:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {app.cylinderTestPressureBar ? `${app.cylinderTestPressureBar} Bar` : '300 Bar (المعيار الدولي)'}
                      </span>
                    </div>

                    {hasCert && (
                      <div className="bg-emerald-100/90 text-emerald-950 p-3 rounded-xl border border-emerald-300 space-y-1 mt-2">
                        <div className="flex items-center justify-between font-black">
                          <span>شهادة المرور المعتمدة:</span>
                          <span className="font-mono text-emerald-900">{app.cylinderCertificateNumber}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-800">
                          <span>سارية حتى تاريخ:</span>
                          <span className="font-bold">{app.cylinderCertificateExpiryDate} (3 سنوات)</span>
                        </div>
                        {app.inspectionEngineerName && (
                          <div className="text-[10px] text-emerald-700 pt-1 border-t border-emerald-200">
                            مهندس الفحص: {app.inspectionEngineerName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions for Cylinder Inspection */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* WhatsApp Result to Driver */}
                    <a
                      href={testWhatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition"
                      title="إرسال إشعار وشهادة الفحص للعميل عبر الواتساب"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال الشهادة واتساب 📲</span>
                    </a>

                    <a
                      href={`tel:${app.phone}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>اتصال</span>
                    </a>

                    {hasCert && (
                      <button
                        type="button"
                        onClick={() => handlePrintCertificate(app)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        title="طباعة شهادة المرور الرسمية"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-700" />
                        <span>طباعة الشهادة</span>
                      </button>
                    )}
                  </div>

                  {/* Open Technical Execution Modal */}
                  <button
                    onClick={() => openTechnicalModal(app)}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-4 h-4 text-emerald-300" />
                    <span>{hasCert ? 'تحديث نتيجة الفحص' : 'تسجيل الفحص وإصدار الشهادة'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TECHNICAL EXECUTION & CERTIFICATE ISSUANCE MODAL */}
      {/* ========================================================================= */}
      {selectedAppointmentForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  فحص هيدروستاتيكي • #{selectedAppointmentForInspection.id}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  توثيق فحص الأسطوانة وإصدار شهادة المرور 🛡️
                </h3>
                <p className="text-xs text-slate-500">
                  مركز: {selectedAppointmentForInspection.stationName}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointmentForInspection(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Car & Driver Summary */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{selectedAppointmentForInspection.driverName}</span>
                  <span className="text-slate-500">{selectedAppointmentForInspection.phone}</span>
                </div>
                <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-300 font-black text-slate-900">
                  {selectedAppointmentForInspection.carPlate}
                </div>
              </div>

              {/* Cylinder Serial Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  رقم أسطوانة الغاز المحفور على جسم الأسطوانة:
                </label>
                <input
                  type="text"
                  value={cylinderSerialInput}
                  onChange={(e) => setCylinderSerialInput(e.target.value)}
                  placeholder="مثال: CYL-EG-2022-88123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Capacity & Pressure */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    السعة المائية للأسطوانة:
                  </label>
                  <select
                    value={cylinderCapacityInput}
                    onChange={(e) => setCylinderCapacityInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={60}>60 لتر</option>
                    <option value={70}>70 لتر (شائعة)</option>
                    <option value={80}>80 لتر</option>
                    <option value={90}>90 لتر</option>
                    <option value={100}>100 لتر</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ضغط الاختبار الهيدروستاتيكي:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={cylinderTestPressureInput}
                      onChange={(e) => setCylinderTestPressureInput(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      Bar
                    </span>
                  </div>
                </div>
              </div>

              {/* Test Result */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  نتيجة الاختبار الهيدروستاتيكي وفحص صمام الأمان:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCylinderTestResultInput('passed')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition ${
                      cylinderTestResultInput === 'passed'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ناجح (صالح للاستخدام) ✅</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCylinderTestResultInput('failed')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition ${
                      cylinderTestResultInput === 'failed'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>راسب (كهنة وإعدام) ❌</span>
                  </button>
                </div>
              </div>

              {/* Certificate Details if Passed */}
              {cylinderTestResultInput === 'passed' && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>بيانات شهادة الصلاحية للمرور (3 سنوات معتمدة)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block mb-1">رقم الشهادة الرسمي:</span>
                      <input
                        type="text"
                        value={cylinderCertNumberInput}
                        onChange={(e) => setCylinderCertNumberInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block mb-1">تاريخ انتهاء الشهادة:</span>
                      <input
                        type="date"
                        value={cylinderCertExpiryInput}
                        onChange={(e) => setCylinderCertExpiryInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-emerald-950"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ملاحظات الفحص الفني:
                </label>
                <textarea
                  rows={2}
                  value={technicalNotesInput}
                  onChange={(e) => setTechnicalNotesInput(e.target.value)}
                  placeholder="سجل أية تفاصيل عن صمام الأمان أو جسم الأسطوانة..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppointmentForInspection(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveInspectionResult}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4 text-emerald-300" />
                <span>توثيق الفحص وإصدار الشهادة الرسمية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Print View */}
      {printedCertificateApp && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 text-black print:p-0">
          <div className="border-4 border-slate-900 p-8 rounded-3xl max-w-xl w-full text-center space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <span className="font-bold text-sm">جمهورية مصر العربية</span>
              <span className="font-black text-lg text-emerald-800">شركة كارجاس CARGAS</span>
              <span className="font-bold text-sm">وزارة البترول والثروة المعدنية</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black">شهادة فحص واختبار أسطوانة غاز طبيعي مضغوط (CNG)</h2>
              <p className="text-xs text-slate-600">معتمدة للإدارة العامة للمرور لتجديد رخصة التسيير</p>
              <div className="text-sm font-mono font-black text-emerald-700 bg-emerald-50 py-1 px-4 rounded-xl inline-block border border-emerald-300">
                رقم الشهادة: {printedCertificateApp.cylinderCertificateNumber || 'CRG-CERT-9901'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-right border-y-2 border-slate-200 py-4">
              <div><strong>اسم المالك:</strong> {printedCertificateApp.driverName}</div>
              <div><strong>رقم اللوحة:</strong> {printedCertificateApp.carPlate}</div>
              <div><strong>رقم الأسطوانة:</strong> {printedCertificateApp.cylinderSerialNumber || 'معتمد'}</div>
              <div><strong>سعة الأسطوانة:</strong> {printedCertificateApp.cylinderWaterCapacityL || 70} لتر</div>
              <div><strong>ضغط الاختبار:</strong> 300 بار هيدروستاتيكي</div>
              <div><strong>تاريخ الفحص:</strong> {printedCertificateApp.appointmentDate}</div>
              <div><strong>مركز الفحص:</strong> {printedCertificateApp.stationName}</div>
              <div><strong>تاريخ الانتهاء:</strong> {printedCertificateApp.cylinderCertificateExpiryDate || '2029-10-30'}</div>
            </div>

            <div className="flex items-center justify-between pt-4 text-xs font-bold">
              <div>مهندس الفحص المعتمد: {printedCertificateApp.inspectionEngineerName || inspectorName}</div>
              <div>خاتم شعار الشركة المعتمد</div>
            </div>

            <div className="no-print pt-4">
              <button
                onClick={() => setPrintedCertificateApp(null)}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-bold"
              >
                إغلاق الطباعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
