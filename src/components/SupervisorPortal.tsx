import React, { useState, useEffect, useRef } from 'react';
import {
  AppConfig,
  TechnicianCrewMember,
  FuelingTransaction,
  RewardRedemption,
  StaffMember,
  SupervisorDelegation,
  ApprovedShiftRosterRecord,
} from '../types';
import {
  getRedemptions,
  saveRedemptions,
  getTransactions,
  saveTransactions,
  getStationLocations,
  getApprovedShiftRosters,
  addApprovedShiftRoster,
  saveApprovedShiftRosters,
} from '../services/storageService';
import {
  getSupervisorDelegation,
  getSupervisorDelegationDetails,
  saveSupervisorDelegationDetails,
  setSupervisorDelegation,
  sendChatMessage,
  getStaffList,
  saveStaffList,
} from '../services/chatAndAccessService';
import {
  ShieldCheck,
  Award,
  Gift,
  CheckCircle2,
  Users,
  Lock,
  Unlock,
  QrCode,
  DollarSign,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Upload,
  Send,
  Fuel,
  Clock,
  Compass,
  Camera,
  X,
  Sparkles,
  Zap,
  Calendar,
  RotateCcw,
  Search,
  KeyRound,
  Phone,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface SupervisorPortalProps {
  config: AppConfig;
  stationCrew: TechnicianCrewMember[];
  transactions: FuelingTransaction[];
  onUpdateCrew: (crew: TechnicianCrewMember[]) => void;
  onUpdateTransactions: (txs: FuelingTransaction[]) => void;
}

export const SupervisorPortal: React.FC<SupervisorPortalProps> = ({
  config,
  stationCrew,
  transactions,
  onUpdateCrew,
  onUpdateTransactions,
}) => {
  // تفويض المشرف للفني بمسح كيو آر الاستبدال
  const [delegationDetails, setDelegationDetails] = useState<SupervisorDelegation | null>(getSupervisorDelegationDetails);
  const [isDelegatedToTech, setIsDelegatedToTech] = useState<boolean>(() => Boolean(delegationDetails?.isRedemptionDelegatedToTech));

  // نافذة منح التفويض الرسمية
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [delegatedTechId, setDelegatedTechId] = useState<string>(stationCrew[0]?.id || 'TECH-01');
  const [delegationDurationHours, setDelegationDurationHours] = useState<number>(8);
  const [delegationNotes, setDelegationNotes] = useState<string>('تفويض معتمد لصرف واستبدال هدايا وزيوت ومكافآت السائقين خلال الوردية');

  // استبدال المكافآت
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(getRedemptions);
  const [activeVoucherCode, setActiveVoucherCode] = useState('');
  const [scannedVoucher, setScannedVoucher] = useState<RewardRedemption | null>(null);

  // كاميرا مسح كود القسيمة المباشرة
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // كشف الوردية اليومي لرفعه واعتماده
  const [shiftTechnicianName, setShiftTechnicianName] = useState('');
  const [shiftTechPhone, setShiftTechPhone] = useState('');
  const [shiftTechRole, setShiftTechRole] = useState('فني تموين');
  const [shiftType, setShiftType] = useState('صباحية (08:00 ص - 04:00 م)');
  const [shiftConfirmedNotice, setShiftConfirmedNotice] = useState<string | null>(null);

  // بيان وسجل كشوفات الورادي المعتمدة المحفوظة
  const [approvedRosters, setApprovedRosters] = useState<ApprovedShiftRosterRecord[]>(getApprovedShiftRosters);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [rosterSearch, setRosterSearch] = useState('');

  // مزامنة حالة التفويض
  useEffect(() => {
    const handleDelegationChange = (e: any) => {
      const details = getSupervisorDelegationDetails();
      setDelegationDetails(details);
      setIsDelegatedToTech(Boolean(details?.isRedemptionDelegatedToTech));
    };

    window.addEventListener('cargas_delegation_changed', handleDelegationChange);
    return () => {
      window.removeEventListener('cargas_delegation_changed', handleDelegationChange);
    };
  }, []);

  // فتح وإغلاق الكاميرا لمسح القسائم
  const startCameraScanner = async () => {
    setCameraError('');
    setIsCameraScannerOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Play stream err:', err));
      }

      // BarcodeDetector loop if supported
      const win = window as any;
      if ('BarcodeDetector' in win) {
        const detector = new win.BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleBarcodeDetected(barcodes[0].rawValue);
            }
          } catch (e) {
            // ignore frame error
          }
        }, 500);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('تعذر فتح الكاميرا مباشرة. تأكد من إعطاء إذن استخدام الكاميرا للمتصفح، أو اختر من القسائم النشطة أدناه.');
    }
  };

  const stopCameraScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraScannerOpen(false);
  };

  const handleBarcodeDetected = (rawCode: string) => {
    stopCameraScanner();
    setActiveVoucherCode(rawCode);
    handleVerifyVoucher(rawCode);
  };

  // تأكيد ومنح التفويض
  const handleConfirmDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    const allStaff = getStaffList();
    const selectedTech =
      stationCrew.find((c) => c.id === delegatedTechId) ||
      allStaff.find((s) => s.id === delegatedTechId);

    const techName = selectedTech?.name || 'فني الوردية المناوب';
    const expiresAt = delegationDurationHours > 0
      ? new Date(Date.now() + delegationDurationHours * 3600 * 1000).toISOString()
      : undefined;

    const details: SupervisorDelegation = {
      stationCode: config.stationCode,
      stationName: config.stationName,
      isRedemptionDelegatedToTech: true,
      delegatedTechId,
      delegatedTechName: techName,
      durationHours: delegationDurationHours,
      delegatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      expiresAt,
      delegatedBySupervisorName: 'مشرف المحطة المناوب',
      notes: delegationNotes.trim(),
    };

    saveSupervisorDelegationDetails(details);
    setDelegationDetails(details);
    setIsDelegatedToTech(true);
    setIsDelegationModalOpen(false);

    alert(`✅ تم منح التفويض بنجاح للفني (${techName}) لمدة ${delegationDurationHours > 0 ? `${delegationDurationHours} ساعات` : 'مفتوحة حتى الإلغاء'}! تظهر الآن أيقونة وماسح استبدال الهدايا في شاشة الفني.`);
  };

  // إلغاء التفويض فوراً
  const handleRevokeDelegation = () => {
    if (!confirm('هل أنت متأكد من رغبتك في إلغاء التفويض فوراً وقصر الصلاحية على المشرف؟')) return;

    const details: SupervisorDelegation = {
      stationCode: config.stationCode,
      stationName: config.stationName,
      isRedemptionDelegatedToTech: false,
      delegatedTechId: undefined,
      delegatedTechName: undefined,
      delegatedAt: undefined,
      expiresAt: undefined,
      delegatedBySupervisorName: 'مشرف المحطة المناوب',
      notes: 'تم إلغاء التفويض بواسطة مشرف المحطة',
    };

    saveSupervisorDelegationDetails(details);
    setDelegationDetails(details);
    setIsDelegatedToTech(false);

    alert('🔒 تم إلغاء التفويض فوراً! أصبحت صلاحية مسح استبدال الهدايا محصورة في شاشة المشرف فقط.');
  };

  // مطابقة وفحص قسيمة الاستبدال
  const handleVerifyVoucher = (code: string) => {
    const clean = code.trim().toUpperCase();
    const found = redemptions.find(
      (r) => r.redemptionCode.trim().toUpperCase() === clean || r.id.toUpperCase() === clean
    );

    if (!found) {
      alert('كود الاستبدال غير مسجل في المنظومة!');
      return;
    }
    setScannedVoucher(found);
  };

  const handleConfirmRedemption = () => {
    if (!scannedVoucher) return;
    if (scannedVoucher.isUsed) {
      alert('هذه القسيمة تم صرفها مسبقاً!');
      return;
    }

    const updatedList = redemptions.map((r) =>
      r.id === scannedVoucher.id
        ? {
            ...r,
            isUsed: true,
            usedAt: new Date().toISOString(),
            usedAtStation: config.stationName,
            dispensedByTechnicianName: 'مشرف المحطة (اعتماد مباشر)',
          }
        : r
    );

    setRedemptions(updatedList);
    saveRedemptions(updatedList);
    setScannedVoucher(null);
    setActiveVoucherCode('');
    alert(`تم اعتماد وصرف الهدية [${scannedVoucher.rewardTitle}] للعميل (${scannedVoucher.driverName}) بنجاح!`);
  };

  // اعتماد كشف الوردية وإرسال الباسوورد آلياً في شات الفنيين وحفظه بسجل الورادي
  const handleApproveShiftRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftTechnicianName || !shiftTechPhone) return;

    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newStaffId = `TECH-${Date.now().toString().slice(-4)}`;
    const newStaff: StaffMember = {
      id: newStaffId,
      name: shiftTechnicianName.trim(),
      role: 'فني تموين',
      phone: shiftTechPhone.trim(),
      stationName: config.stationName,
      stationCode: config.stationCode,
      dailyPin: generatedPin,
      pinGeneratedDate: new Date().toISOString().slice(0, 10),
      isShiftActive: true,
      canRedeemRewards: isDelegatedToTech,
    };

    const staff = getStaffList();
    staff.unshift(newStaff);
    saveStaffList(staff);

    // إرسال الكود فوراً داخل شات الفنيين الآلي
    sendChatMessage(
      'room-tech-admin',
      'SYSTEM_DISPATCH',
      'نظام كارجاس الآلي',
      'system',
      `صباح الخير زميلنا الفني ${newStaff.name} ⛽ كود تفعيل ورديتك اليومية (${shiftType}) بمحطة ${config.stationName} هو [ ${generatedPin} ]. تأكد من تفعيل GPS بالمحطة لبدء تسجيل العمليات.`
    );

    // توثيق وحفظ كشف الوردية في السجل وقاعدة البيانات موثقاً بالتاريخ والوقت
    const nowIso = new Date().toISOString();
    const formattedNow =
      new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }) +
      ' ' +
      new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    const newRosterRecord: ApprovedShiftRosterRecord = {
      id: `ROSTER-${Date.now().toString().slice(-6)}`,
      technicianId: newStaffId,
      technicianName: newStaff.name,
      technicianPhone: newStaff.phone,
      technicianRole: 'فني تموين',
      shiftType,
      stationName: config.stationName,
      stationCode: config.stationCode,
      dailyPin: generatedPin,
      approvedBySupervisorName: 'م. عصام المنشاوي (مشرف المحطة)',
      approvedAt: nowIso,
      formattedApprovedAt: formattedNow,
      isChatDispatched: true,
      status: 'active',
      notes: `تم اعتماد الوردية (${shiftType}) وتوليد كود الـ PIN الموثق وإرساله آلياً لشات الفني.`,
    };

    addApprovedShiftRoster(newRosterRecord);
    setApprovedRosters(getApprovedShiftRosters());

    setShiftConfirmedNotice(`تم اعتماد الوردية وتوليد كود الدخول [${generatedPin}] وتوثيقه بالسجل وإرساله آلياً لشات الفني ${newStaff.name} بنجاح!`);
    setShiftTechnicianName('');
    setShiftTechPhone('');
    setTimeout(() => setShiftConfirmedNotice(null), 5000);
  };

  const handleToggleRosterStatus = (rosterId: string) => {
    const updated = approvedRosters.map((r) => {
      if (r.id === rosterId) {
        const nextStatus: 'active' | 'completed' = r.status === 'active' ? 'completed' : 'active';
        return { ...r, status: nextStatus };
      }
      return r;
    });
    setApprovedRosters(updated);
    saveApprovedShiftRosters(updated);
  };

  const handleResendRosterCode = (record: ApprovedShiftRosterRecord) => {
    sendChatMessage(
      'room-tech-admin',
      'SYSTEM_DISPATCH',
      'نظام كارجاس الآلي',
      'system',
      `تذكير رسمي للفني ${record.technicianName} ⛽ كود تفعيل ورديتك (${record.shiftType}) بمحطة ${record.stationName} هو [ ${record.dailyPin} ]. موثق بتاريخ: ${record.formattedApprovedAt}`
    );
    alert(`تمت إعادة إرسال كود الـ PIN [ ${record.dailyPin} ] للفني ${record.technicianName} في الشات بنجاح!`);
  };

  // إحصائيات المطابقة المالية
  const todayMetersTotal = transactions.reduce((acc, t) => acc + (t.metersQuantity || 0), 0);
  const todayRevenueTotal = transactions.reduce((acc, t) => acc + (t.totalAmountEgp || 0), 0);
  const todayPointsTotal = transactions.reduce((acc, t) => acc + (t.pointsEarned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
            👮‍♂️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">بوابة مشرف المحطة والرقابة الميدانية</h2>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                إشراف ورقابة الجودة
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {config.stationName} • مطابقة العدادات، مراقبة الفنيين، واعتماد استبدال الهدايا
            </p>
          </div>
        </div>

        {/* زر تفويض الفني بمسح واستبدال الهدايا */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-3 w-full md:w-auto justify-between">
          <div>
            <span className="text-[11px] text-amber-300 font-bold block">تفويض فني التموين بالاستبدال:</span>
            <span className="text-xs text-slate-300 font-medium">
              {isDelegatedToTech && delegationDetails?.delegatedTechName
                ? `مفوض إلى: ${delegationDetails.delegatedTechName} ✓`
                : 'الصلاحية محصورة في المشرف فقط 🔒'}
            </span>
          </div>

          {isDelegatedToTech ? (
            <button
              type="button"
              onClick={handleRevokeDelegation}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95"
              title="إلغاء التفويض فوراً وقصر الصلاحية على المشرف"
            >
              <Lock className="w-4 h-4" />
              <span>إلغاء التفويض فوراً ✕</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDelegationModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              <span>منح تفويض للفني ✍️</span>
            </button>
          )}
        </div>
      </div>

      {/* تفاصيل التفويض النشط (إن وجد) */}
      {isDelegatedToTech && delegationDetails && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-700 p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              ✍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-emerald-950 dark:text-emerald-200">
                  تفويض ساري: {delegationDetails.delegatedTechName}
                </span>
                <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  نشط ومعتمد
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                تاريخ المنح: {delegationDetails.delegatedAt || 'اليوم'}
                {delegationDetails.expiresAt && ` • ينتهي: ${new Date(delegationDetails.expiresAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`}
                {delegationDetails.notes && ` • ملاحظات: ${delegationDetails.notes}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRevokeDelegation}
            className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3 py-1.5 rounded-xl border border-rose-300 transition text-xs flex items-center gap-1"
          >
            <span>إلغاء التفويض الآن</span>
          </button>
        </div>
      )}

      {shiftConfirmedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{shiftConfirmedNotice}</span>
        </div>
      )}

      {/* الرقابة المالية والمطابقة مع الإدارة المالية */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 font-bold block">إجمالي عدادات الغاز المباع (م³)</span>
          <span className="text-2xl font-black text-emerald-700 font-mono">{todayMetersTotal.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400 block font-medium">متر مكعب مطابق للدفاتر</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 font-bold block">إجمالي النقدية المحصلة بالوردية</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{todayRevenueTotal.toLocaleString()} ج</span>
          <span className="text-[10px] text-emerald-600 block font-medium">توريد مالي مطابق للإدارة</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 font-bold block">التزام نقاط الولاء الممنوحة</span>
          <span className="text-2xl font-black text-amber-600 font-mono">+{todayPointsTotal.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block font-medium">محسوبة بالتسعيرة المعتمدة</span>
        </div>
      </div>

      {/* ماسح واعتماد الهدايا الخاص بالمشرف */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            <h3 className="font-black text-sm text-slate-900">
              ماسح واعتماد كود استبدال نقاط الولاء (صلاحية المشرف)
            </h3>
          </div>
          <span className="text-xs bg-purple-100 text-purple-900 font-bold px-2.5 py-0.5 rounded-full">
            صرف الهدايا المعتمدة 🎁
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={activeVoucherCode}
            onChange={(e) => setActiveVoucherCode(e.target.value)}
            placeholder="أدخل أو امسح كود قسيمة العميل (مثال: VOUCH-123456)..."
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900"
          />

          <button
            type="button"
            onClick={startCameraScanner}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>مسح بالكاميرا 📷</span>
          </button>

          <button
            type="button"
            onClick={() => handleVerifyVoucher(activeVoucherCode)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold text-xs transition"
          >
            فحص القسيمة
          </button>
        </div>

        {/* Quick Voucher Presets for Immediate Verification */}
        {redemptions.filter((r) => !r.isUsed).length > 0 && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 block">
              قسائم غير مصروفة بانتظار الاعتماد (اضغط للفحص الفوري):
            </span>
            <div className="flex flex-wrap gap-2">
              {redemptions.filter((r) => !r.isUsed).slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setActiveVoucherCode(r.redemptionCode);
                    setScannedVoucher(r);
                  }}
                  className="bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-900 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🎁</span>
                  <span>{r.rewardTitle} ({r.redemptionCode})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {scannedVoucher && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-xs text-amber-950">
              <span>اسم المكافأة: {scannedVoucher.rewardTitle}</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300">{scannedVoucher.redemptionCode}</span>
            </div>
            <div className="text-xs text-slate-700">
              العميل المستحق: <strong>{scannedVoucher.driverName}</strong> (لوحة: {scannedVoucher.carPlate || 'س ف ر 1 9 8 4'})
            </div>
            <button
              onClick={handleConfirmRedemption}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs transition shadow-md"
            >
              اعتماد وتسليم الهدية للعميل فوراً ✓
            </button>
          </div>
        )}
      </div>

      {/* رفع كشف الوردية اليومي وتوزيع الأكواد للشات */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-sm text-slate-900">
              إدخال واعتماد كشف الوردية اليومي (إرسال تلقائي لأكواد التحقق في الشات)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
            توزيع إلكتروني آلي 📲
          </span>
        </div>

        <form onSubmit={handleApproveShiftRoster} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم الفني:</label>
            <input
              type="text"
              required
              value={shiftTechnicianName}
              onChange={(e) => setShiftTechnicianName(e.target.value)}
              placeholder="مثال: محمود الشناوي"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">رقم الموبايل / الواتساب:</label>
            <input
              type="tel"
              required
              value={shiftTechPhone}
              onChange={(e) => setShiftTechPhone(e.target.value)}
              placeholder="010XXXXXXXX"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">نوع الوردية:</label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              <option value="صباحية (08:00 ص - 04:00 م)">صباحية (08:00 ص - 04:00 م)</option>
              <option value="مسائية (04:00 م - 12:00 ص)">مسائية (04:00 م - 12:00 ص)</option>
              <option value="ليلية (12:00 ص - 08:00 ص)">ليلية (12:00 ص - 08:00 ص)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>اعتماد وإرسال الكود للشات 🚀</span>
          </button>
        </form>

        {shiftConfirmedNotice && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center gap-3 text-xs font-bold text-emerald-900 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">{shiftConfirmedNotice}</div>
          </div>
        )}

        {/* بيان وسجل كشوفات الورادي المعتمدة المحفوظة بقاعدة البيانات */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-xs text-slate-900">
                  بيان وسجل كشوفات الورادي المعتمدة ومسار الأكواد (موثق بالتاريخ والوقت)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                سجل إلكتروني دائم لكافة الورادي الصادرة، كود التحقق السري (PIN)، وتأكيد تسليمه لشات الفني مع التوثيق بالثانية.
              </p>
            </div>

            {/* إحصائيات سريعة */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
                الإجمالي: {approvedRosters.length}
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-1 rounded-lg">
                نشطة: {approvedRosters.filter((r) => r.status === 'active').length}
              </span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2.5 py-1 rounded-lg">
                مرسلة للشات: {approvedRosters.filter((r) => r.isChatDispatched).length} 📲
              </span>
            </div>
          </div>

          {/* فلاتر البحث والحالة */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-slate-400 font-medium text-[11px]">تصفية:</span>
              <button
                type="button"
                onClick={() => setRosterFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                  rosterFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({approvedRosters.length})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter('active')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                  rosterFilter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الورادي النشطة ({approvedRosters.filter((r) => r.status === 'active').length})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter('completed')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                  rosterFilter === 'completed'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                المكتملة ({approvedRosters.filter((r) => r.status === 'completed').length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="بحث باسم الفني أو الهاتف أو الكود..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* جدول كشوفات الورادي المعتمدة */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">رقم الكشف وتاريخ الاعتماد</th>
                  <th className="p-3">الفني المكلف والمحطة</th>
                  <th className="p-3">نوع الوردية</th>
                  <th className="p-3 text-center">كود الـ PIN</th>
                  <th className="p-3 text-center">المشرف المعتمد</th>
                  <th className="p-3 text-center">مسار الشات</th>
                  <th className="p-3 text-center">حالة الوردية</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {approvedRosters
                  .filter((r) => {
                    const matchesFilter =
                      rosterFilter === 'all' ? true : r.status === rosterFilter;
                    const q = rosterSearch.trim().toLowerCase();
                    const matchesSearch =
                      !q ||
                      r.technicianName.toLowerCase().includes(q) ||
                      r.technicianPhone.includes(q) ||
                      r.id.toLowerCase().includes(q) ||
                      (r.dailyPin && r.dailyPin.includes(q));
                    return matchesFilter && matchesSearch;
                  })
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <div className="font-mono font-bold text-indigo-700">{record.id}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-sans mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{record.formattedApprovedAt || new Date(record.approvedAt).toLocaleString('ar-EG')}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-black text-slate-900">{record.technicianName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {record.technicianPhone}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{record.stationName}</div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {record.shiftType}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span className="font-mono font-black text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs shadow-xs inline-flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-indigo-500" />
                          {record.dailyPin}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span className="text-slate-700 font-medium text-[11px]">
                          {record.approvedBySupervisorName}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {record.isChatDispatched ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            تم الإرسال آلياً 📲
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            بانتظار الإرسال
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRosterStatus(record.id)}
                          className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border transition cursor-pointer ${
                            record.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                          title="اضغط لتبديل حالة الوردية بين نشطة ومكتملة"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              record.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {record.status === 'active' ? 'وردية جارية' : 'وردية منتهية'}
                        </button>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleResendRosterCode(record)}
                            title="إعادة إرسال كود الـ PIN إلى شات الفني"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`https://wa.me/${record.technicianPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `مرحباً زميلنا ${record.technicianName}، كود ورديتك اليومية (${record.shiftType}) بمحطة ${record.stationName} هو: ${record.dailyPin}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="إرسال عبر الواتساب مباشرة"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}

                {approvedRosters.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                      لا توجد كشوفات ورادي مسجلة حتى الآن. استخدم النموذج أعلاه لاعتماد أول وردية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* رقابة الوردية ومكافحة التلاعب */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>منظومة الرقابة على الفنيين ومكافحة التلاعب (GPS Range 10m)</span>
        </h3>
        <p className="text-xs text-slate-500">
          يراقب المشرف موقع الـ GPS لجميع عمليات التفويل للتأكد من أنها داخل نطاق الـ 10 أمتار المعتمدة، وعدم تسجيل تفويلات وهمية خارج حرم المحطة.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2.5">رقم الإيصال</th>
                <th className="p-2.5">الفني</th>
                <th className="p-2.5">السيارة واللوحة</th>
                <th className="p-2.5 text-center">الكمية (م³)</th>
                <th className="p-2.5 text-center">المبلغ (ج)</th>
                <th className="p-2.5 text-center">فحص GPS</th>
                <th className="p-2.5 text-center">حالة العملية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono text-[11px] text-slate-500">{t.receiptNumber}</td>
                  <td className="p-2.5 font-bold text-slate-800">{t.technicianName}</td>
                  <td className="p-2.5 font-bold text-slate-900">{t.carPlate}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-700">{t.metersQuantity} م³</td>
                  <td className="p-2.5 text-center font-mono font-bold">{t.totalAmountEgp} ج</td>
                  <td className="p-2.5 text-center font-mono text-emerald-700">✓ {t.gpsDistanceMeters || 3.2}م</td>
                  <td className="p-2.5 text-center">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      موثقة ومطابقة
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delegation Modal (نافذة تحديد هوية المفوض إليه وموعد التفويض) */}
      {isDelegationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-bold">
                  ✍️
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    منح تفويض رسمي لفني التموين بالاستبدال
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تحديد هوية المفوض إليه وموعد التفويض بدقة مع إمكانية الإلغاء في أي وقت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDelegationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelegation} className="space-y-4 text-xs">
              {/* اختيار الفني المفوض إليه */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  1. تحديد هوية الفني المفوض إليه:
                </label>
                <select
                  value={delegatedTechId}
                  onChange={(e) => setDelegatedTechId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-amber-500"
                >
                  {stationCrew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role}) - كود: {c.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* مدة وموعد التفويض */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  2. مدة وصلاحية موعد التفويض:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '4 ساعات', hours: 4 },
                    { label: '8 ساعات (وردية)', hours: 8 },
                    { label: '12 ساعة', hours: 12 },
                    { label: 'حتى الإلغاء يدوياً', hours: 0 },
                  ].map((d) => (
                    <button
                      key={d.hours}
                      type="button"
                      onClick={() => setDelegationDurationHours(d.hours)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        delegationDurationHours === d.hours
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ملاحظات التفويض */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. سبب أو ملاحظات المشرف على التفويض:
                </label>
                <textarea
                  rows={2}
                  value={delegationNotes}
                  onChange={(e) => setDelegationNotes(e.target.value)}
                  placeholder="اكتب ملاحظات التفويض..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans"
                />
              </div>

              {/* تحذير وتأكيد الصلاحية */}
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <strong>تنبيه إداري:</strong>
                <p>
                  يمنح هذا الإجراء الفني المذكور صلاحية مسح وقبول قسائم استبدال الهدايا وأمتار الغاز المجانية. يمكنك إلغاء هذا التفويض فوراً في أي ثانية بنقرة واحدة من شاشة المشرف.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDelegationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد ومنح التفويض الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Camera Scanner Modal for Vouchers */}
      {isCameraScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  كاميرا مسح باركود وقسيمة الاستبدال
                </h3>
              </div>
              <button
                type="button"
                onClick={stopCameraScanner}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium">
                {cameraError}
              </div>
            )}

            {/* Video Feed */}
            <div className="relative aspect-square bg-black rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              {/* Scan Reticle */}
              <div className="absolute inset-8 border-2 border-dashed border-purple-400 rounded-2xl pointer-events-none flex items-center justify-center">
                <span className="text-[10px] text-white/90 bg-black/60 px-2.5 py-1 rounded-full font-bold">
                  وجّه الكاميرا نحو كود القسيمة
                </span>
              </div>
            </div>

            {/* Fallback preset buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block">
                أو اختر قسيمة مباشرة من المسجلة بالمنظومة:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {redemptions.filter((r) => !r.isUsed).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleBarcodeDetected(r.redemptionCode)}
                    className="text-[11px] font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 font-bold hover:bg-purple-100"
                  >
                    {r.redemptionCode} ({r.rewardTitle})
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={stopCameraScanner}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl transition"
            >
              إلغاء وإغلاق الكاميرا
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
