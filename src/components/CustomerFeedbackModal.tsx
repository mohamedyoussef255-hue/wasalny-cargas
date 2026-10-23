import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Smile,
  Shield,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react';
import {
  AppConfig,
  DriverProfile,
  FuelingTransaction,
  StationRating,
  CustomerComplaint,
  TechnicianCrewMember,
} from '../types';
import { addStationRating, addCustomerComplaint } from '../services/storageService';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  driver: DriverProfile;
  lastTransaction?: FuelingTransaction;
  crew: TechnicianCrewMember[];
  initialTab?: 'rating' | 'complaint';
  onRatingSubmitted?: () => void;
  onComplaintSubmitted?: () => void;
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  onClose,
  config,
  driver,
  lastTransaction,
  crew,
  initialTab = 'rating',
  onRatingSubmitted,
  onComplaintSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<'rating' | 'complaint'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Rating State
  const [selectedTechName, setSelectedTechName] = useState(
    lastTransaction?.technicianName || crew[0]?.name || 'محمود الشناوي'
  );
  const [behaviorRating, setBehaviorRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [speedRating, setSpeedRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Complaint State
  const [complaintCategory, setComplaintCategory] = useState<CustomerComplaint['category']>('معاملة فني');
  const [complaintMessage, setComplaintMessage] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedTech = crew.find((c) => c.name === selectedTechName);

    addStationRating({
      transactionId: lastTransaction?.id,
      driverId: driver.id,
      driverName: driver.name,
      carPlate: driver.carPlate,
      technicianId: matchedTech?.id || 'TECH-01',
      technicianName: selectedTechName,
      stationName: lastTransaction?.stationName || config.stationName,
      pumpNumber: lastTransaction?.pumpNumber || 1,
      overallRating,
      behaviorRating,
      speedRating,
      comment: ratingComment.trim() || 'خدمة ممتازة ومعاملة راقية من الفني',
    });

    setRatingSuccess(true);
    if (onRatingSubmitted) onRatingSubmitted();
    setTimeout(() => {
      setRatingSuccess(false);
      onClose();
    }, 1800);
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintMessage.trim()) return;

    addCustomerComplaint({
      driverName: driver.name,
      phone: driver.phone,
      carPlate: driver.carPlate,
      stationName: config.stationName,
      category: complaintCategory,
      message: complaintMessage.trim(),
    });

    setComplaintSuccess(true);
    if (onComplaintSubmitted) onComplaintSubmitted();
    setTimeout(() => {
      setComplaintSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-black">
            💬
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900">
              صوت العميل • التقييم والشكاوى
            </h3>
            <p className="text-xs text-slate-500">
              رأيك يبني كفاءة خدمات كارجاس ويكافئ الفنيين المتميزين
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('rating')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'rating' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>تقييم الفني والخدمة</span>
          </button>
          <button
            onClick={() => setActiveTab('complaint')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'complaint' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-rose-500" />
            <span>إرسال شكوى أو مقترح</span>
          </button>
        </div>

        {/* Tab 1: Rating Form */}
        {activeTab === 'rating' && (
          <form onSubmit={handleRatingSubmit} className="space-y-4 text-xs">
            {ratingSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-300">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 animate-bounce" />
                <h4 className="font-black text-base text-emerald-950">
                  شكراً جزيلاً لتقييمك الراقي!
                </h4>
                <p className="text-xs text-emerald-800">
                  تم تسجيل تقييمك وحسن المعاملة للفني وإيداع حافز في محفظته.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    الفني المسؤول عن التموين
                  </label>
                  <select
                    value={selectedTechName}
                    onChange={(e) => setSelectedTechName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                  >
                    {crew.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.role} - {c.stationName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating 1: Behavior & Courteous Treatment */}
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-amber-600" />
                      سلوك ومعاملة الفني وحسن الاستقبال:
                    </span>
                    <span className="font-bold text-amber-700 font-mono text-sm">
                      {behaviorRating} / 5
                    </span>
                  </div>
                  <div className="flex gap-2 justify-center py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setBehaviorRating(star)}
                        className="text-2xl transition hover:scale-125"
                      >
                        <span className={star <= behaviorRating ? 'text-amber-500' : 'text-slate-200'}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating 2: Overall Service & Gas Pressure */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      ضغط الغاز وجودة الخدمة بالمحطة:
                    </span>
                    <span className="font-bold text-slate-700 font-mono text-sm">
                      {overallRating} / 5
                    </span>
                  </div>
                  <div className="flex gap-2 justify-center py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setOverallRating(star)}
                        className="text-2xl transition hover:scale-125"
                      >
                        <span className={star <= overallRating ? 'text-emerald-500' : 'text-slate-200'}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    كلمة شكر أو ملاحظات إضافية
                  </label>
                  <textarea
                    rows={2}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="اكتب ملاحظاتك عن الخدمة أو المعاملة الطيبة للفني..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition shadow-md"
                >
                  إرسال التقييم واعتماد حافز الفني ✓
                </button>
              </>
            )}
          </form>
        )}

        {/* Tab 2: Complaints & Official Contacts */}
        {activeTab === 'complaint' && (
          <div className="space-y-4 text-xs">
            {/* Official Support Channels Hotline & WhatsApp */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-black text-slate-900 block text-xs">
                قنوات التواصل المباشرة المعتمدة مع إدارة كارجاس:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href={`tel:${config.supportContacts.hotline}`}
                  className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 transition"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">الرقم المختصر</span>
                    <span className="font-black text-slate-900 font-mono">{config.supportContacts.hotline}</span>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${config.supportContacts.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('مرحباً كارجاس، أود التواصل بشأن خدمة التموين والولاء')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">واتساب الدعم السريع</span>
                    <span className="font-black text-slate-900 font-mono">تواصل فوري</span>
                  </div>
                </a>
              </div>
            </div>

            {complaintSuccess ? (
              <div className="p-6 text-center space-y-2 bg-rose-50 rounded-2xl border border-rose-300">
                <CheckCircle2 className="w-12 h-12 mx-auto text-rose-600 animate-bounce" />
                <h4 className="font-black text-base text-rose-950">
                  تم استلام رسالتك باهتمام وسرية تامة!
                </h4>
                <p className="text-xs text-rose-800">
                  تم إحالة الموضوع لإدارة خدمة العملاء والمشرف العام للمتابعة الفورية.
                </p>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    تصنيف الموضوع
                  </label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-rose-500"
                  >
                    <option value="معاملة فني">معاملة وسلوك الفني</option>
                    <option value="جودة وضغط الغاز">ضغط الغاز وسرعة التموين</option>
                    <option value="صيانة وزيوت">خدمات الزيوت والصيانة</option>
                    <option value="تأخير في الوردية">تأخير أو ازدحام في الوردية</option>
                    <option value="اقتراح تطوير">اقتراح تطوير وتكريم</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    تفاصيل الرسالة أو الشكوى
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={complaintMessage}
                    onChange={(e) => setComplaintMessage(e.target.value)}
                    placeholder="اكتب تفاصيل ما حدث معك بأمانة، وسيتم الرد عليك والتواصل معك سريعاً..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-2xl transition shadow-md"
                >
                  إرسال الشكوى للإدارة العليا ✉️
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
