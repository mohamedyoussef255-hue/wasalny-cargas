import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Headphones,
  ShieldCheck,
  MessageCircle,
  Phone,
  CheckCheck,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { CustomerChatChannel, CustomerDirectMessage, DriverProfile } from '../types';
import {
  getCustomerDirectMessages,
  sendCustomerDirectMessage,
  markCustomerMessagesRead,
} from '../services/storageService';

interface CustomerMessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverProfile;
  initialChannel?: CustomerChatChannel;
}

export const CustomerMessagingModal: React.FC<CustomerMessagingModalProps> = ({
  isOpen,
  onClose,
  driver,
  initialChannel = 'customer_service',
}) => {
  const [activeChannel, setActiveChannel] = useState<CustomerChatChannel>(initialChannel);
  const [messages, setMessages] = useState<CustomerDirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialChannel) {
      setActiveChannel(initialChannel);
    }
  }, [initialChannel]);

  const loadMessages = () => {
    const all = getCustomerDirectMessages(activeChannel, driver.id);
    setMessages(all);
    markCustomerMessagesRead(activeChannel, 'driver', driver.id);
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeChannel, driver.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    sendCustomerDirectMessage({
      channel: activeChannel,
      driverId: driver.id,
      driverName: driver.name,
      carPlate: driver.carPlate,
      driverPhone: driver.phone,
      senderRole: 'driver',
      senderName: driver.name,
      messageText: inputText.trim(),
      readByCustomer: true,
      readByStaff: false,
      stationName: activeChannel === 'cylinder_center' ? 'مركز فحص واختبار ألماظة' : 'محطة كارجاس شبرا',
      serviceType:
        activeChannel === 'cylinder_center'
          ? 'استفسار فحص واختبار أسطوانات'
          : 'استفسار خدمة العملاء والصيانة',
    });

    setInputText('');
    loadMessages();
  };

  const isCylinder = activeChannel === 'cylinder_center';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[620px] max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md ${
                  isCylinder
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isCylinder ? <ShieldCheck className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <span>منظومة المحادثة المباشرة</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-300">
                  تواصل رسمي موثق مع مسؤولي كارجاس ({driver.name} - {driver.carPlate})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Channel Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => setActiveChannel('customer_service')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                !isCylinder
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>خدمة العملاء والصيانة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel('cylinder_center')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                isCylinder
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>مركز فحص الأسطوانات</span>
            </button>
          </div>
        </div>

        {/* Channel Info Banner */}
        <div
          className={`px-4 py-2 text-xs font-medium border-b flex items-center justify-between shrink-0 ${
            isCylinder
              ? 'bg-teal-50 text-teal-900 border-teal-100'
              : 'bg-amber-50 text-amber-900 border-amber-100'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 shrink-0 text-current" />
            <span>
              {isCylinder
                ? 'فحص هيدروستاتيكي 300 بار، شهادة المرور المعتمدة 3 سنوات، واختبار الصمامات'
                : 'حجوزات الصيانة الدورية، تحويل السيارات، مواعيد تغيير الزيت والرد على الاستفسارات'}
            </span>
          </div>
          <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded-full font-bold">
            متاح يومياً
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
                💬
              </div>
              <p className="text-xs font-bold text-slate-600">لا توجد رسائل سابقة في هذه القناة</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                ابدأ محادثتك الآن مع مسؤولي {isCylinder ? 'مركز فحص الأسطوانات' : 'خدمة العملاء'} وسيتم الرد عليك فوراً.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderRole === 'driver';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                    isMe ? 'mr-auto' : 'ml-auto'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    <span className="font-bold text-slate-600">{m.senderName}</span>
                    <span>•</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs font-medium ${
                      isMe
                        ? 'bg-slate-900 text-white rounded-tl-xs'
                        : isCylinder
                        ? 'bg-white text-slate-800 border border-teal-200 rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-amber-200 rounded-tr-xs'
                    }`}
                  >
                    {m.messageText}

                    {m.statusBadge && (
                      <div className="mt-2 pt-1 border-t border-slate-200/40 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{m.statusBadge}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isCylinder
                ? 'استفسر عن موعد فحص الأسطوانة أو تجديد شهادة المرور...'
                : 'اكتب استفسارك لخدمة العملاء ومتابعة الصيانة...'
            }
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-800 font-medium transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-3 rounded-2xl text-white font-bold transition shadow-md flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
              isCylinder
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
