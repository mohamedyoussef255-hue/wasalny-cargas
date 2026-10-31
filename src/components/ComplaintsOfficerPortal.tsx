import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Send,
  UserCheck,
  Building2,
  Car,
  ChevronDown,
  RefreshCw,
  PlusCircle,
  X,
  FileText,
} from 'lucide-react';
import { CustomerComplaint } from '../types';
import {
  getCustomerComplaints,
  updateCustomerComplaint,
  addCustomerComplaint,
} from '../services/storageService';

export const ComplaintsOfficerPortal: React.FC = () => {
  const [complaints, setComplaints] = useState<CustomerComplaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New manual complaint modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCarPlate, setNewCarPlate] = useState('');
  const [newStationName, setNewStationName] = useState('محطة كارجاس شبرا');
  const [newCategory, setNewCategory] = useState<CustomerComplaint['category']>('معاملة فني');
  const [newMessage, setNewMessage] = useState('');

  const loadData = () => {
    const list = getCustomerComplaints();
    setComplaints(list);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleStatusChange = (id: string, status: CustomerComplaint['status']) => {
    updateCustomerComplaint(id, { status });
    showToast(`تم تحديث حالة الشكوى إلى (${status}) بنجاح`);
    loadData();
  };

  const handleSaveResponse = (id: string) => {
    if (!responseText.trim()) return;
    updateCustomerComplaint(id, {
      adminResponse: responseText.trim(),
      status: 'تم الحل',
    });
    setEditingResponseId(null);
    setResponseText('');
    showToast('تم حفظ رد الإدارة والاعتماد بنجاح');
    loadData();
  };

  const handleCreateManualComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim() || !newPhone.trim() || !newMessage.trim()) {
      alert('يرجى استيفاء البيانات الإلزامية');
      return;
    }

    addCustomerComplaint({
      driverName: newDriverName.trim(),
      phone: newPhone.trim(),
      carPlate: newCarPlate.trim() || 'غير محدد',
      stationName: newStationName,
      category: newCategory,
      message: newMessage.trim(),
    });

    setIsNewModalOpen(false);
    setNewDriverName('');
    setNewPhone('');
    setNewCarPlate('');
    setNewMessage('');
    showToast('تم تسجيل الشكوى بنجاح في المنظومة');
    loadData();
  };

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.carPlate.includes(searchQuery) ||
      c.stationName.includes(searchQuery) ||
      c.message.includes(searchQuery);

    const matchesStatus =
      selectedStatus === 'all' || c.status === selectedStatus;

    const matchesCategory =
      selectedCategory === 'all' || c.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalCount = complaints.length;
  const newCount = complaints.filter((c) => c.status === 'جديدة').length;
  const inProgressCount = complaints.filter((c) => c.status === 'قيد المتابعة').length;
  const resolvedCount = complaints.filter((c) => c.status === 'تم الحل').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 text-sm font-bold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-red-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/30">
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
              <span>قطاع الجودة والشكاوى والمقترحات • كارجاس</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              بوابة مسؤول تلقي ومتابعة الشكاوى 📢
            </h1>
            <p className="text-sm text-rose-100/80 max-w-2xl leading-relaxed">
              إدارة شكاوى رواد محطات كارجاس للغاز الطبيعي ومتابعتها لحظياً، التحقيق في البلاغات، والتواصل المباشر مع العملاء عبر الهاتف والواتساب لضمان أعلى معايير رضاء العملاء.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل شكوى واردة 19058</span>
            </button>
            <button
              onClick={loadData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition backdrop-blur-sm active:scale-95 cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Counter KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-rose-800/40">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-rose-200/80 font-medium">إجمالي الشكاوى</div>
            <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          </div>
          <div className="bg-rose-500/20 backdrop-blur-md rounded-2xl p-4 border border-rose-400/30">
            <div className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>شكاوى جديدة</span>
            </div>
            <div className="text-2xl font-black text-rose-200 mt-1">{newCount}</div>
          </div>
          <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-4 border border-amber-400/30">
            <div className="text-xs text-amber-300 font-bold">قيد المتابعة والتحقيق</div>
            <div className="text-2xl font-black text-amber-200 mt-1">{inProgressCount}</div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30">
            <div className="text-xs text-emerald-300 font-bold">تم الحل والرد بنجاح</div>
            <div className="text-2xl font-black text-emerald-200 mt-1">{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف، اللوحة، المحطة..."
            className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({totalCount})
            </button>
            <button
              onClick={() => setSelectedStatus('جديدة')}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedStatus === 'جديدة'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جديدة ({newCount})
            </button>
            <button
              onClick={() => setSelectedStatus('قيد المتابعة')}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedStatus === 'قيد المتابعة'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              متابعة ({inProgressCount})
            </button>
            <button
              onClick={() => setSelectedStatus('تم الحل')}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedStatus === 'تم الحل'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              محلولة ({resolvedCount})
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-rose-500 transition"
          >
            <option value="all">جميع التصنيفات</option>
            <option value="معاملة فني">معاملة فني</option>
            <option value="جودة وضغط الغاز">جودة وضغط الغاز</option>
            <option value="صيانة وزيوت">صيانة وزيوت</option>
            <option value="تأخير في الوردية">تأخير في الوردية</option>
            <option value="اقتراح تطوير">اقتراح تطوير</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              📂
            </div>
            <h3 className="text-base font-bold text-slate-800">لا توجد شكاوى مطابقة</h3>
            <p className="text-xs text-slate-500">لا توجد بلاغات تطابق معايير البحث والتصفية المحددة حالياً.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isResolved = item.status === 'تم الحل';
            const isInProgress = item.status === 'قيد المتابعة';
            const isNew = item.status === 'جديدة';

            // WhatsApp message link
            const whatsappText = encodeURIComponent(
              `مرحباً أستاذ ${item.driverName}، بخصوص شكواك المسجلة لدى شركة كارجاس برقم (${item.id}) المتعلقة بـ (${item.category}) بمحطة (${item.stationName})، نود إحاطتك بأنه تم فحص البلاغ وجارٍ معالجته فوراً لضمان رضاكم التام. للاستفسار نسعد بتواصلك معنا.`
            );
            const waUrl = `https://wa.me/2${item.phone.replace(/\D/g, '')}?text=${whatsappText}`;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 shadow-sm border transition-all hover:shadow-md ${
                  isNew
                    ? 'border-rose-200 ring-2 ring-rose-100'
                    : isInProgress
                    ? 'border-amber-200'
                    : 'border-slate-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Top Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {item.id}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isNew
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isInProgress
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-auto">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.timestamp).toLocaleString('ar-EG')}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium pt-1">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900">
                        <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                        <span>{item.driverName}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span dir="ltr">{item.phone}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.carPlate}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.stationName}</span>
                      </span>
                    </div>

                    {/* Complaint Message */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium mt-2">
                      {item.message}
                    </div>

                    {/* Admin / Officer Response */}
                    {item.adminResponse && (
                      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-xs text-emerald-900 leading-relaxed font-medium mt-2 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-emerald-800 mb-0.5">رد وقرار الإدارة المعتمد:</div>
                          <div>{item.adminResponse}</div>
                        </div>
                      </div>
                    )}

                    {/* Inline edit response */}
                    {editingResponseId === item.id && (
                      <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-200 space-y-2 mt-2">
                        <div className="text-xs font-bold text-rose-900">تدوين رد وقرار مسؤول الشكاوى:</div>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="اكتب الإجراء المتخذ وتفاصيل حل الشكوى والتواصل مع العميل..."
                          rows={3}
                          className="w-full p-2.5 text-xs bg-white border border-rose-200 rounded-xl outline-none focus:border-rose-500 font-medium"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingResponseId(null);
                              setResponseText('');
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={() => handleSaveResponse(item.id)}
                            className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>حفظ واعتماد الحل</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                    {/* Status Dropdown */}
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value as CustomerComplaint['status'])
                      }
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500 transition cursor-pointer"
                    >
                      <option value="جديدة">جديدة 🔴</option>
                      <option value="قيد المتابعة">قيد المتابعة 🟡</option>
                      <option value="تم الحل">تم الحل 🟢</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      {/* Direct Call Button */}
                      <a
                        href={`tel:${item.phone}`}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        title="اتصال هاتفي بالشاكي"
                      >
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </a>

                      {/* Direct WhatsApp Button */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
                        title="مراسلة عبر الواتساب"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </a>

                      {/* Add/Edit Response Button */}
                      <button
                        onClick={() => {
                          setEditingResponseId(item.id);
                          setResponseText(item.adminResponse || '');
                        }}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition"
                        title="تدوين رد الإدارة"
                      >
                        <FileText className="w-4 h-4 text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Complaint Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <MessageSquareWarning className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تسجيل بلاغ أو شكوى جديدة</h3>
                <p className="text-xs text-slate-500">استقبال شكوى عبر الخط الساخن 19058 أو الحضور الميداني</p>
              </div>
            </div>

            <form onSubmit={handleCreateManualComplaint} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder="مثال: محمد مصطفى"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل *</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم اللوحة</label>
                  <input
                    type="text"
                    value={newCarPlate}
                    onChange={(e) => setNewCarPlate(e.target.value)}
                    placeholder="مثال: ق ن ل 1 2 3"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المحطة المعنية</label>
                  <input
                    type="text"
                    value={newStationName}
                    onChange={(e) => setNewStationName(e.target.value)}
                    placeholder="محطة كارجاس..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف الشكوى</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 font-medium"
                >
                  <option value="معاملة فني">معاملة فني</option>
                  <option value="جودة وضغط الغاز">جودة وضغط الغاز</option>
                  <option value="صيانة وزيوت">صيانة وزيوت</option>
                  <option value="تأخير في الوردية">تأخير في الوردية</option>
                  <option value="اقتراح تطوير">اقتراح تطوير</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص وتفاصيل الشكوى *</label>
                <textarea
                  required
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="سرد المشكلة بدقة كما ذكرها العميل..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
                >
                  حفظ الشكوى بالمنظومة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
