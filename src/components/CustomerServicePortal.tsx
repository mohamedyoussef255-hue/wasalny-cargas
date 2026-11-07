import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Headphones,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Wrench,
  Fuel,
  Car,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Building2,
  RefreshCw,
  Send,
  Sparkles,
  Info,
  ShieldAlert,
  MessageCircle,
  CheckCheck,
  User,
  Edit3,
  Edit,
  CheckCircle,
} from 'lucide-react';
import {
  AppConfig,
  CargasStationLocation,
  ServiceAppointment,
  AppointmentStatus,
  CustomerDirectMessage,
  CustomerDataUpdateRequest,
} from '../types';
import {
  getServiceAppointments,
  updateServiceAppointment,
  getCustomerDirectMessages,
  sendCustomerDirectMessage,
  markCustomerMessagesRead,
  getCustomerDataUpdateRequests,
  approveCustomerDataUpdateRequest,
  rejectCustomerDataUpdateRequest,
  getDriverProfile,
} from '../services/storageService';

interface CustomerServicePortalProps {
  config: AppConfig;
  stations: CargasStationLocation[];
  onBackToMain?: () => void;
}

export const CustomerServicePortal: React.FC<CustomerServicePortalProps> = ({
  config,
  stations,
  onBackToMain,
}) => {
  const [appointments, setAppointments] = useState<ServiceAppointment[]>(() =>
    getServiceAppointments()
  );
  const [activeTab, setActiveTab] = useState<'maintenance' | 'messages' | 'customer_requests'>('maintenance');

  // Customer Data Update Requests State & Handlers
  const [customerRequests, setCustomerRequests] = useState<CustomerDataUpdateRequest[]>(() =>
    getCustomerDataUpdateRequests()
  );
  const [selectedReqForReview, setSelectedReqForReview] = useState<CustomerDataUpdateRequest | null>(null);
  const [reviewEditName, setReviewEditName] = useState('');
  const [reviewEditPhone, setReviewEditPhone] = useState('');
  const [reviewEditPlate, setReviewEditPlate] = useState('');
  const [reviewEditModel, setReviewEditModel] = useState('');
  const [reviewEditCapacity, setReviewEditCapacity] = useState<number>(70);
  const [reviewEditOdo, setReviewEditOdo] = useState<number>(0);
  const [reviewAdminNotes, setReviewAdminNotes] = useState('');

  useEffect(() => {
    const handleRequestsUpdate = () => {
      setCustomerRequests(getCustomerDataUpdateRequests());
    };
    window.addEventListener('cargas_customer_requests_updated', handleRequestsUpdate);
    return () => {
      window.removeEventListener('cargas_customer_requests_updated', handleRequestsUpdate);
    };
  }, []);

  const pendingRequestsCount = customerRequests.filter((r) => r.status === 'pending').length;

  const handleOpenReviewModal = (req: CustomerDataUpdateRequest) => {
    setSelectedReqForReview(req);
    setReviewEditName(req.requestedName);
    setReviewEditPhone(req.requestedPhone);
    setReviewEditPlate(req.requestedCarPlate);
    setReviewEditModel(req.requestedCarModel);
    setReviewEditCapacity(req.requestedCngCylinderCapacity);
    setReviewEditOdo(req.requestedOdometerKm);
    setReviewAdminNotes(req.adminNotes || '');
  };

  const handleApproveRequest = (reqId: string, customData?: any) => {
    const dataToApply = customData || {
      name: reviewEditName || undefined,
      phone: reviewEditPhone || undefined,
      carPlate: reviewEditPlate || undefined,
      carModel: reviewEditModel || undefined,
      cngCylinderCapacity: reviewEditCapacity || undefined,
      odometerKm: reviewEditOdo || undefined,
    };
    approveCustomerDataUpdateRequest(
      reqId,
      dataToApply,
      `${agentName}`,
      reviewAdminNotes || 'تم مراجعة الطلب وتعديل وتحديث البيانات بنجاح من مكتب خدمة العملاء'
    );
    setCustomerRequests(getCustomerDataUpdateRequests());
    setSelectedReqForReview(null);
    showToast('✅ تم اعتماد طلب التعديل وتحديث بيانات العميل والسيارة بنجاح!');
  };

  const handleDirectApprove = (req: CustomerDataUpdateRequest) => {
    approveCustomerDataUpdateRequest(
      req.id,
      {
        name: req.requestedName,
        phone: req.requestedPhone,
        carPlate: req.requestedCarPlate,
        carModel: req.requestedCarModel,
        cngCylinderCapacity: req.requestedCngCylinderCapacity,
        odometerKm: req.requestedOdometerKm,
      },
      `${agentName}`,
      'تم الاعتماد الفوري من خدمة العملاء'
    );
    setCustomerRequests(getCustomerDataUpdateRequests());
    showToast('✅ تم اعتماد وتطبيق التعديل في المنظومة فوراً!');
  };

  const handleRejectRequest = (reqId: string) => {
    const reason = prompt('يرجى كتابة سبب رفض طلب التعديل لإعلام العميل به:', 'البيانات غير مطابقة');
    if (!reason) return;
    rejectCustomerDataUpdateRequest(reqId, reason, `${agentName}`);
    setCustomerRequests(getCustomerDataUpdateRequests());
    setSelectedReqForReview(null);
    showToast('تم تسجيل رفض الطلب مع السبب.');
  };

  // Customer Service Agent Identity
  const [agentName, setAgentName] = useState<string>('سارة ممدوح (خدمة العملاء)');

  // Filters & Search for Maintenance Bookings
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal for Confirming/Editing Appointment
  const [selectedAppointmentForAction, setSelectedAppointmentForAction] = useState<ServiceAppointment | null>(null);
  const [csNotesInput, setCsNotesInput] = useState<string>('');
  const [callStatusInput, setCallStatusInput] = useState<NonNullable<ServiceAppointment['customerServiceCallStatus']>>('called_confirmed');

  // Customer Direct Messages State
  const [directMessages, setDirectMessages] = useState<CustomerDirectMessage[]>(() =>
    getCustomerDirectMessages('customer_service')
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [replyTextInput, setReplyTextInput] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const refreshList = () => {
    setAppointments(getServiceAppointments());
    setDirectMessages(getCustomerDirectMessages('customer_service'));
  };

  useEffect(() => {
    const handleMessageUpdate = () => {
      setDirectMessages(getCustomerDirectMessages('customer_service'));
    };
    window.addEventListener('cargas_customer_message_sent', handleMessageUpdate);
    const interval = setInterval(() => {
      setDirectMessages(getCustomerDirectMessages('customer_service'));
    }, 4000);
    return () => {
      window.removeEventListener('cargas_customer_message_sent', handleMessageUpdate);
      clearInterval(interval);
    };
  }, []);

  // Filtered Maintenance Appointments ONLY (فحص الأسطوانات مفصول تماماً لبوابة الفحص المستقلة)
  const maintenanceAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Exclude pure cylinder inspection bookings (which belong strictly to Cylinder Center)
      const isCyl =
        app.bookingCategory === 'cylinder_inspection' ||
        app.serviceType.includes('فحص واختبار أسطوانة') ||
        app.serviceType.includes('شهادة المرور');
      if (isCyl) return false;

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
        const matchId = app.id.toLowerCase().includes(q);
        if (!matchName && !matchPlate && !matchPhone && !matchId) return false;
      }

      return true;
    });
  }, [appointments, selectedStationFilter, selectedStatusFilter, searchQuery]);

  // Group direct messages by driver
  const conversationsByDriver = useMemo(() => {
    const map = new Map<string, { driverName: string; carPlate: string; driverPhone: string; messages: CustomerDirectMessage[]; unreadCount: number }>();
    directMessages.forEach((msg) => {
      const key = msg.driverId || msg.driverPhone;
      if (!map.has(key)) {
        map.set(key, {
          driverName: msg.driverName || 'عميل كارجاس',
          carPlate: msg.carPlate || 'لوحة غير مسجلة',
          driverPhone: msg.driverPhone || '',
          messages: [],
          unreadCount: 0,
        });
      }
      const entry = map.get(key)!;
      entry.messages.push(msg);
      if (msg.senderRole === 'driver' && !msg.readByStaff) {
        entry.unreadCount += 1;
      }
    });
    return Array.from(map.entries()).map(([driverId, data]) => ({
      driverId,
      ...data,
      lastMessage: data.messages[data.messages.length - 1],
    }));
  }, [directMessages]);

  const activeConversation = useMemo(() => {
    if (!selectedDriverId && conversationsByDriver.length > 0) {
      return conversationsByDriver[0];
    }
    return conversationsByDriver.find((c) => c.driverId === selectedDriverId) || null;
  }, [conversationsByDriver, selectedDriverId]);

  // Format Egyptian Phone for WhatsApp
  const formatWhatsAppUrl = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, '');
    let target = clean;
    if (clean.startsWith('01')) target = '2' + clean;
    return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
  };

  // Open CS Action Modal
  const openActionModal = (app: ServiceAppointment) => {
    setSelectedAppointmentForAction(app);
    setCsNotesInput(app.customerServiceNotes || app.notes || '');
    setCallStatusInput(app.customerServiceCallStatus || 'called_confirmed');
  };

  // Save CS Confirmation Action
  const handleSaveCsConfirmation = (statusOverride?: AppointmentStatus) => {
    if (!selectedAppointmentForAction) return;

    const targetStatus =
      statusOverride ||
      (callStatusInput === 'called_confirmed' ? 'confirmed_by_driver' : selectedAppointmentForAction.status);

    updateServiceAppointment(selectedAppointmentForAction.id, {
      status: targetStatus,
      confirmedByCustomerService: true,
      confirmedByAgentName: agentName,
      customerServiceNotes: csNotesInput,
      customerServiceCallStatus: callStatusInput,
      confirmedAt: new Date().toISOString(),
    });

    showToast(`تم حفظ وتأكيد الحجز (${selectedAppointmentForAction.id}) بنجاح!`);
    setSelectedAppointmentForAction(null);
    refreshList();
  };

  // Send Reply from Customer Service Agent to Driver
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTextInput.trim() || !activeConversation) return;

    sendCustomerDirectMessage({
      channel: 'customer_service',
      driverId: activeConversation.driverId,
      driverName: activeConversation.driverName,
      carPlate: activeConversation.carPlate,
      driverPhone: activeConversation.driverPhone,
      senderRole: 'customer_service',
      senderName: agentName,
      messageText: replyTextInput.trim(),
      readByCustomer: false,
      readByStaff: true,
      serviceType: 'دعم ومتابعة خدمة العملاء',
      statusBadge: 'رد من خدمة العملاء 🎧',
    });

    setReplyTextInput('');
    setDirectMessages(getCustomerDirectMessages('customer_service'));
    showToast(`تم إرسال الرد للعميل (${activeConversation.driverName}) بنجاح!`);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: AppointmentStatus, csConfirmed?: boolean) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          تم التنفيذ بالمركز ✅
        </span>
      );
    }
    if (csConfirmed || status === 'confirmed_by_driver') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          مؤكد من خدمة العملاء 💬
        </span>
      );
    }
    if (status === 'awaiting_confirmation') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          بانتظار التأكيد (أولوية اتصال) ⏳
        </span>
      );
    }
    if (status === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          حجز مجدول قيد المراجعة
        </span>
      );
    }
    if (status === 'cancelled_by_driver' || status === 'auto_cancelled_no_show') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          حجز ملغي / شاغر
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
        {status}
      </span>
    );
  };

  // KPI calculations
  const totalCount = maintenanceAppointments.length;
  const pendingCount = maintenanceAppointments.filter(
    (a) => !a.confirmedByCustomerService && a.status !== 'completed' && a.status !== 'cancelled_by_driver'
  ).length;
  const confirmedCount = maintenanceAppointments.filter(
    (a) => a.confirmedByCustomerService || a.status === 'confirmed_by_driver'
  ).length;
  const totalUnreadMessages = directMessages.filter((m) => m.senderRole === 'driver' && !m.readByStaff).length;

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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    مركز خدمة عملاء كارجاس وتأكيد الحجوزات
                  </h1>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    مباشر 19058 🎧
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  متابعة وتأكيد حجوزات الصيانة والتحويل والزيوت هاتفياً وعبر الواتساب مع الرد الفوري على استفسارات السائقين
                </p>
              </div>
            </div>
          </div>

          {/* Quick CS Agent Controls & Hotline */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">مسؤول خدمة العملاء:</span>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white border-none outline-none p-0 w-44 focus:ring-0"
                />
              </div>
            </div>

            <a
              href={`tel:${config.supportContacts?.hotline || '19058'}`}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition"
            >
              <Phone className="w-4 h-4" />
              <span>الخط الساخن: {config.supportContacts?.hotline || '19058'}</span>
            </a>

            {onBackToMain && (
              <button
                onClick={onBackToMain}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-700 transition"
              >
                العودة للرئيسية
              </button>
            )}
          </div>
        </div>

        {/* Notice of Cylinder Testing Separation */}
        <div className="mt-5 p-3 rounded-2xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>فصل إداري وفني تام:</strong> تم إخراج مراكز فحص واختبار أسطوانات الغاز (300 بار) كلياً من خدمة العملاء وتخصيص بوابة مستقلة لها بكلمة سر خاصة لمدير الفحص المعتمد.
            </span>
          </div>
          <span className="text-[11px] bg-indigo-800/80 px-2.5 py-0.5 rounded-full font-bold text-amber-300">
            فصل تام معتمد ✅
          </span>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/50 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-bold block">إجمالي حجوزات الصيانة</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-white">{totalCount}</span>
              <Calendar className="w-5 h-5 text-indigo-400" />
            </div>
          </div>

          <div className="bg-amber-950/40 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-800/40">
            <span className="text-[11px] text-amber-300 font-bold block">بانتظار الاتصال والتأكيد</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-amber-400">{pendingCount}</span>
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="bg-blue-950/40 backdrop-blur-xs p-3.5 rounded-2xl border border-blue-800/40">
            <span className="text-[11px] text-blue-300 font-bold block">مؤكد من خدمة العملاء</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-blue-400">{confirmedCount}</span>
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-800/40">
            <span className="text-[11px] text-emerald-300 font-bold block">محادثات العملاء واستفساراتهم</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-400">{conversationsByDriver.length}</span>
              <div className="relative">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                    {totalUnreadMessages}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Customer Service Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Tab 1: Maintenance & Conversion Bookings */}
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'maintenance'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>1. حجوزات الصيانة والتحويل والزيوت العامة</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'maintenance' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {maintenanceAppointments.length}
            </span>
          </button>

          {/* Tab 2: Direct Customer Conversations & Inquiries */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'messages'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>2. محادثات واستفسارات العملاء المباشرة 💬</span>
            {totalUnreadMessages > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500 text-white animate-pulse">
                {totalUnreadMessages} جديد
              </span>
            ) : (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'messages' ? 'bg-emerald-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {conversationsByDriver.length}
              </span>
            )}
          </button>

          {/* Tab 3: Customer Data Update Requests */}
          <button
            onClick={() => setActiveTab('customer_requests')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'customer_requests'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>3. طلبات تعديل بيانات العملاء 📝</span>
            {pendingRequestsCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400 text-slate-950 animate-pulse">
                {pendingRequestsCount} جديد
              </span>
            ) : (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'customer_requests' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {customerRequests.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={refreshList}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1 text-xs font-bold self-end sm:self-auto"
          title="تحديث قائمة الحجوزات والمراسلات"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث</span>
        </button>
      </div>

      {/* TAB 1: Maintenance & Conversion Bookings */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                placeholder="ابحث باسم السائق، رقم اللوحة، الهاتف، أو كود الحجز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedStationFilter}
                onChange={(e) => setSelectedStationFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="all">كل المحطات والمراكز</option>
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="all">جميع الحالات</option>
                <option value="awaiting_confirmation">بانتظار التأكيد (أولوية)</option>
                <option value="confirmed_by_driver">مؤكد</option>
                <option value="scheduled">حجز جديد</option>
                <option value="completed">تم التنفيذ</option>
                <option value="cancelled_by_driver">ملغي</option>
              </select>
            </div>
          </div>

          {/* Bookings Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase">
                    <th className="p-3.5">كود الحجز / العميل</th>
                    <th className="p-3.5">المركبة واللوحة</th>
                    <th className="p-3.5">المركز / المحطة</th>
                    <th className="p-3.5">نوع الخدمة</th>
                    <th className="p-3.5">الموعد والتوقيت</th>
                    <th className="p-3.5">حالة الاتصال والتأكيد</th>
                    <th className="p-3.5 text-center">إجراء خدمة العملاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {maintenanceAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        لا توجد حجوزات صيانة مطابقة لمعايير البحث الحالية.
                      </td>
                    </tr>
                  ) : (
                    maintenanceAppointments.map((app) => {
                      const isHighPriority =
                        app.status === 'awaiting_confirmation' && !app.confirmedByCustomerService;
                      return (
                        <tr
                          key={app.id}
                          className={`hover:bg-slate-50 transition ${
                            isHighPriority ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-indigo-600 block text-[11px]">
                              {app.id}
                            </span>
                            <span className="font-black text-slate-900 block">{app.driverName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{app.phone}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[11px] inline-block">
                              {app.carPlate}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-700">{app.stationName}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 text-[11px] inline-block">
                              {app.serviceType}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800 block">{app.appointmentDate}</span>
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {app.timeSlot}
                            </span>
                          </td>
                          <td className="p-3.5">{renderStatusBadge(app.status, app.confirmedByCustomerService)}</td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Direct Call Button */}
                              <a
                                href={`tel:${app.phone}`}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition shadow-xs"
                                title={`اتصال هاتفي بالعميل ${app.driverName}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>

                              {/* WhatsApp Direct Confirmation */}
                              <a
                                href={formatWhatsAppUrl(
                                  app.phone,
                                  `مرحباً أستاذ ${app.driverName}، معك خدمة عملاء شركة كارجاس 🎧.\nنؤكد على موعدكم الكريم لحجز (${app.serviceType}) في (${app.stationName}) يوم ${app.appointmentDate} توقيت (${app.timeSlot}) لسيارتكم (${app.carPlate}).\nيرجى تأكيد الحضور، ونحن في خدمتكم دائماً!`
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-xl transition shadow-xs"
                                title="مراسلة العميل وتأكيد الحجز عبر الواتساب"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>

                              {/* CS Action Modal Trigger */}
                              <button
                                onClick={() => openActionModal(app)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition shadow-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>تأكيد الحجز</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Direct Customer Conversations & Live Inquiries */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Drivers Conversation List (4 Cols) */}
          <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[560px]">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">قائمة استفسارات السائقين ({conversationsByDriver.length})</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                قناة خدمة العملاء
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {conversationsByDriver.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs">
                  لا توجد محادثات واردة من العملاء حتى الآن.
                </div>
              ) : (
                conversationsByDriver.map((conv) => {
                  const isSelected = (activeConversation?.driverId === conv.driverId);
                  return (
                    <button
                      key={conv.driverId}
                      onClick={() => {
                        setSelectedDriverId(conv.driverId);
                        markCustomerMessagesRead('customer_service', 'staff', conv.driverId);
                      }}
                      className={`w-full text-right p-3.5 transition flex items-start gap-3 ${
                        isSelected ? 'bg-blue-50/80 border-r-4 border-blue-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-slate-900 text-xs truncate">{conv.driverName}</span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                              {conv.unreadCount} جديد
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{conv.carPlate}</span>
                          <span>•</span>
                          <span>{conv.driverPhone}</span>
                        </div>
                        {conv.lastMessage && (
                          <p className="text-[11px] text-slate-600 truncate mt-1">
                            {conv.lastMessage.senderRole === 'customer_service' ? 'أنت: ' : ''}
                            {conv.lastMessage.messageText}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Conversation View (8 Cols) */}
          <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[560px] overflow-hidden">
            {activeConversation ? (
              <>
                {/* Chat Top Bar */}
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{activeConversation.driverName}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>اللوحة: {activeConversation.carPlate}</span>
                      <span>•</span>
                      <span>الهاتف: {activeConversation.driverPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${activeConversation.driverPhone}`}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </a>
                    <a
                      href={formatWhatsAppUrl(
                        activeConversation.driverPhone,
                        `مرحباً أستاذ ${activeConversation.driverName}، معك خدمة عملاء كارجاس 🎧.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </a>
                  </div>
                </div>

                {/* Messages Bubbles Container */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                  {activeConversation.messages.map((m) => {
                    const isFromStaff = m.senderRole === 'customer_service';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isFromStaff ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                            isFromStaff
                              ? 'bg-blue-600 text-white rounded-bl-none'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-br-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold opacity-80">{m.senderName}</span>
                            <span className="text-[9px] opacity-70 font-mono">
                              {new Date(m.timestamp).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">
                            {m.messageText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Send Reply Input Bar */}
                <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    placeholder={`اكتب ردك للعميل (${activeConversation.driverName})...`}
                    value={replyTextInput}
                    onChange={(e) => setReplyTextInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyTextInput.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الرد</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageCircle className="w-12 h-12 text-slate-300 mb-2" />
                <span className="text-xs font-bold">اختر محادثة من القائمة للرد على العميل مباشرة.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Customer Data Update Requests (مراجعة وتعديل طلبات بيانات العملاء والسيارات) */}
      {activeTab === 'customer_requests' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Section Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-600 text-xl font-black">
                📝
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  طلبات تعديل بيانات العملاء والسيارات الواردة
                </h3>
                <p className="text-xs text-slate-500">
                  يمكن لموظف خدمة العملاء تعديل أي بيان حسب رغبة العميل واعتماده ليطبق فوراً في المنظومة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full text-xs">
                {pendingRequestsCount} طلب بانتظار المراجعة
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-bold block">إجمالي الطلبات</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{customerRequests.length}</span>
            </div>
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-center">
              <span className="text-[11px] text-amber-800 font-bold block">بانتظار المراجعة</span>
              <span className="text-xl font-black text-amber-900 mt-0.5 block">{pendingRequestsCount}</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[11px] text-emerald-800 font-bold block">معتمدة ومحدثة</span>
              <span className="text-xl font-black text-emerald-900 mt-0.5 block">
                {customerRequests.filter((r) => r.status === 'approved').length}
              </span>
            </div>
            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-center">
              <span className="text-[11px] text-rose-800 font-bold block">طلبات مرفوضة</span>
              <span className="text-xl font-black text-rose-900 mt-0.5 block">
                {customerRequests.filter((r) => r.status === 'rejected').length}
              </span>
            </div>
          </div>

          {/* Requests Cards List */}
          <div className="space-y-3">
            {customerRequests.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                <Edit3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold">لا توجد طلبات تعديل بيانات واردة حالياً من العملاء.</p>
              </div>
            ) : (
              customerRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';

                return (
                  <div
                    key={req.id}
                    className={`bg-white p-5 rounded-2xl border transition shadow-xs space-y-3 text-xs ${
                      isPending ? 'border-amber-300 bg-amber-50/20' : isApproved ? 'border-emerald-300' : 'border-slate-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">طلب رقم #{req.id.slice(-6)}</span>
                        <span className="font-mono text-slate-500 text-[11px]">كود: {req.driverId}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isPending ? 'قيد المراجعة ⏳' : isApproved ? 'تم الاعتماد والتطبيق ✓' : 'مرفوض ✖'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(req.submittedAt).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="space-y-1 text-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">البيانات الحالية:</span>
                        <p><span className="font-bold text-slate-500">الاسم:</span> {req.driverName}</p>
                        <p><span className="font-bold text-slate-500">الهاتف:</span> <span className="font-mono">{req.driverPhone}</span></p>
                        <p><span className="font-bold text-slate-500">اللوحة:</span> <span className="font-mono font-bold">{req.currentCarPlate}</span></p>
                        <p><span className="font-bold text-slate-500">السيارة:</span> {req.currentCarModel}</p>
                        <p><span className="font-bold text-slate-500">السعة/العداد:</span> <span className="font-mono">{req.currentCngCylinderCapacity}L • {req.currentOdometerKm?.toLocaleString()} كم</span></p>
                      </div>

                      <div className="space-y-1 text-slate-800">
                        <span className="text-[10px] font-bold text-emerald-700 block uppercase">البيانات الجديدة المطلوبة:</span>
                        <p className={req.requestedName !== req.driverName ? 'font-bold text-emerald-700' : ''}>
                          <span className="font-bold text-slate-500">الاسم:</span> {req.requestedName}
                        </p>
                        <p className={req.requestedPhone !== req.driverPhone ? 'font-bold text-emerald-700 font-mono' : 'font-mono'}>
                          <span className="font-bold text-slate-500 font-sans">الهاتف:</span> {req.requestedPhone}
                        </p>
                        <p className={req.requestedCarPlate !== req.currentCarPlate ? 'font-bold text-emerald-900' : ''}>
                          <span className="font-bold text-slate-500">اللوحة:</span>{' '}
                          <span className="font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
                            {req.requestedCarPlate}
                          </span>
                        </p>
                        <p className={req.requestedCarModel !== req.currentCarModel ? 'font-bold text-emerald-700' : ''}>
                          <span className="font-bold text-slate-500">السيارة:</span> {req.requestedCarModel}
                        </p>
                        <p className="font-mono">
                          <span className="font-bold text-slate-500 font-sans">السعة/العداد:</span>{' '}
                          <span>{req.requestedCngCylinderCapacity}L • {req.requestedOdometerKm?.toLocaleString()} كم</span>
                        </p>
                      </div>
                    </div>

                    {/* Customer Notes */}
                    {req.requestNotes && (
                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-xs">
                        <span className="font-bold text-amber-950 block mb-0.5">سبب التعديل المرسل من العميل:</span>
                        <p className="text-amber-900">{req.requestNotes}</p>
                      </div>
                    )}

                    {/* Review Notes if Reviewed */}
                    {req.reviewedAt && (
                      <div className="bg-slate-100 p-2 rounded-xl text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                        <span>تمت المراجعة بواسطة: <b>{req.reviewedBy}</b></span>
                        {req.adminNotes && <span>ملاحظات: {req.adminNotes}</span>}
                      </div>
                    )}

                    {/* Action Buttons for Customer Service */}
                    {isPending && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleDirectApprove(req)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl transition text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>اعتماد وتطبيق فوراً ✓</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(req)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl transition text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل البيانات حسب رغبة العميل ✏️</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold px-3 py-2 rounded-xl transition text-xs mr-auto"
                        >
                          رفض الطلب ✖
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Review & Edit Request Before Approval by CS */}
      {selectedReqForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-black">
                  ✏️
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    تعديل بيانات العميل واعتمادها #{selectedReqForReview.id.slice(-6)}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    يمكنك تعديل أي بيان يريده العميل قبل حفظ التغييرات وتطبيقها
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReqForReview(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApproveRequest(selectedReqForReview.id);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم العميل:</label>
                  <input
                    type="text"
                    required
                    value={reviewEditName}
                    onChange={(e) => setReviewEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    required
                    value={reviewEditPhone}
                    onChange={(e) => setReviewEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم لوحة السيارة:</label>
                  <input
                    type="text"
                    required
                    value={reviewEditPlate}
                    onChange={(e) => setReviewEditPlate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع وموديل السيارة:</label>
                  <input
                    type="text"
                    required
                    value={reviewEditModel}
                    onChange={(e) => setReviewEditModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعة أسطوانة الغاز (لتر):</label>
                  <input
                    type="number"
                    min="30"
                    max="140"
                    value={reviewEditCapacity}
                    onChange={(e) => setReviewEditCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">قراءة العداد الحالية (كم):</label>
                  <input
                    type="number"
                    min="0"
                    value={reviewEditOdo}
                    onChange={(e) => setReviewEditOdo(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ملاحظات خدمة العملاء للطلب:
                </label>
                <input
                  type="text"
                  value={reviewAdminNotes}
                  onChange={(e) => setReviewAdminNotes(e.target.value)}
                  placeholder="مثال: تم التواصل مع العميل واعتماد اللوحة الجديدة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl transition shadow-md active:scale-95"
                >
                  اعتماد وتطبيق التعديل في المنظومة فوراً ✓
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReqForReview(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: CS Action & Confirmation Notes */}
      {selectedAppointmentForAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">تأكيد حجز العميل وتوثيق الاتصال</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    كود: {selectedAppointmentForAction.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointmentForAction(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-black text-slate-900">{selectedAppointmentForAction.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">رقم اللوحة:</span>
                <span className="font-mono font-bold text-slate-900">{selectedAppointmentForAction.carPlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الهاتف:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedAppointmentForAction.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الخدمة والمركز:</span>
                <span className="font-bold text-blue-800">
                  {selectedAppointmentForAction.serviceType} - {selectedAppointmentForAction.stationName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الموعد:</span>
                <span className="font-bold text-slate-800">
                  {selectedAppointmentForAction.appointmentDate} ({selectedAppointmentForAction.timeSlot})
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نتيجة الاتصال بالعميل:
              </label>
              <select
                value={callStatusInput}
                onChange={(e) => setCallStatusInput(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="called_confirmed">تم الاتصال هاتفياً وتأكيد الحضور من العميل ✅</option>
                <option value="whatsapp_sent">تم إرسال رسالة واتساب بالتفاصيل والموقع 📱</option>
                <option value="called_no_answer">تم الاتصال ولم يرد (إعادة المحاولة لاحقاً) ⏳</option>
                <option value="cancelled">العميل اعتذر عن الموعد وطلب الإلغاء ❌</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ملاحظات خدمة العملاء:
              </label>
              <textarea
                rows={3}
                value={csNotesInput}
                onChange={(e) => setCsNotesInput(e.target.value)}
                placeholder="أدخل أي ملاحظات إضافية بخصوص رغبات العميل أو موعد وصوله..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAppointmentForAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleSaveCsConfirmation()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md transition"
              >
                حفظ واعتماد الحجز
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
