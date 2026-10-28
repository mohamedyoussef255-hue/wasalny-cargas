import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  X,
  MessageCircle,
  Shield,
  HelpCircle,
  Wrench,
  Fuel,
  QrCode,
  Mic,
  MicOff,
} from 'lucide-react';
import { AppConfig, UserRole } from '../types';

interface MoenAssistantProps {
  config: AppConfig;
  currentRole: UserRole;
  onNavigateTo?: (role: UserRole) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'moen';
  text: string;
  timestamp: string;
  badge?: string;
}

export const MoenAssistant: React.FC<MoenAssistantProps> = ({
  config,
  currentRole,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(!config.assistantAutoSpeak);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize initial welcoming message with authentic Egyptian warmth
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText =
        'يا مرحب بيك يا بطل! أنا "مُعِين"، مساعدك الشخصي الذكي والمطور حصرياً بواسطة شركة عِزوتي للبرمجيات وتكنولوجيا المعلومات والمهندس محمد عبد الرحمن يوسف. مِتولِّف بروح وضاح الجدع وعقل كابتن لوكا وإنجازه السريع.. أؤمرني: عايز تفهم تفاصيل التموين ونقاط الولاء؟ ولا مسح الـ QR والـ GPS؟ ولا شرح تطبيق ستوب للسلامة ومتابعة محطات كارجاس؟ أنا في ضهرك دايماً!';
      
      setMessages([
        {
          id: 'msg-welcome',
          sender: 'moen',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          badge: 'عزوتي الذكية',
        },
      ]);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Voice Speech Synthesis (Web Speech API)
  const speakText = (text: string) => {
    if (isMuted) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // stop any ongoing speech

    // Clean text from symbols for smoother speech
    const cleanSpeech = text
      .replace(/[#*`_~]/g, '')
      .replace(/https?:\/\/\S+/g, 'الرابط');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'ar-EG';
    utterance.rate = 1.02;
    utterance.pitch = 1.0;

    // Pick best Arabic voice available
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find((v) => v.lang.includes('ar') || v.lang.includes('EG'));
    if (arVoice) {
      utterance.voice = arVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Speech Recognition (Microphone)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('ميزة التحدث الصوتي بالميكروفون تتطلب متصفح كروم أو إيدج حديث.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Intelligent Response Generation in authentic Egyptian Dialect
  const generateMoenReply = (query: string): string => {
    const q = query.toLowerCase();

    // 0. Refueling Meters & Gas Station Operations
    if (q.includes('تموين') || q.includes('عداد') || q.includes('قراءة') || q.includes('متر') || q.includes('تسجيل') || q.includes('سيارة')) {
      return 'يا بطل تسجيل التموين بقى في ثواني معدودة! الفني بيفتح واجهة العدادات، يكتب قراءة البداية وقراءة النهاية للعداد، والسيستم بيحسب أوتوماتيك كمية الغاز بالأمتار المكعبة (م³) وإجمالي الفلوس المطلوبة بسعر المتر المعتمد اللي نازل من الإدارة. بتختار نوع العربية ورقم اللوحة وتدوس حفظ، والعملية بتتسجل فوراً في قاعدة بيانات Supabase مع إيصال حراري فوري!';
    }

    // 0.1 Pricing & System Settings
    if (q.includes('سعر') || q.includes('تسعير') || q.includes('تعديل السعر') || q.includes('اعدادات') || q.includes('إعدادات') || q.includes('settings')) {
      return 'سعر متر الغاز الطبيعي ده إعداد مركزي ومحمي في جدول system_settings في قاعدة البيانات. الفني مقفول عليه التعديل (Read-only) عشان الدقة، ومدير النظام (Admin) بس هو اللي يقدر يغير السعر أو نسبة الضريبة أو اسم المحطة من لوحة التحكم، والتعديل بيسمّع في لحظتها وبشكل دائم على شاشات كل الفنيين!';
    }

    // 0.2 Supabase & PostgreSQL & RLS Security
    if (q.includes('supabase') || q.includes('سوبابيز') || q.includes('rls') || q.includes('امان') || q.includes('أمان') || q.includes('قاعدة بيانات') || q.includes('sql')) {
      return 'المعمارية مبنية على أعلى معايير الأمان باستخدام Supabase PostgreSQL مع تفعيل سياسات Row Level Security (RLS): جدول إعدادات النظام مفيش مخلوق يقدر يعدل فيه غير المدير، وجدول التموينات الفني يقدر يضيف فيه ويشوف ورديته هو بس، والمدير بيشوف كافة التقارير والحركات ويصدرها إكسيل بضغطة زر!';
    }

    // 1. Loyalty & Points
    if (q.includes('نقط') || q.includes('ولاء') || q.includes('نقاط') || q.includes('مكافأ') || q.includes('هدية') || q.includes('هدايا')) {
      return 'يا باشا برنامج الولاء معمول عشان يكافئك على كل متر غاز! مع كل متر غاز بتفوِّله بتاخد نقطة، وسعر المتر حالياً ' + config.gasPricePerMeter + ' جنيه. النقط دي بتتحوش في محفظتك وتقدر تبدلها بـ 5 أو 15 متر غاز مجاني، أو غسيل كيماوي، أو خصم نص القيمة على تغيير الزيت، أو طقم بوجيهات أصلي. كل اللي عليك تعرض الـ QR كود بتاعك للفني وهو بيمسحه في ثانية!';
    }

    // 2. Technician & GPS & PIN
    if (q.includes('فني') || q.includes('عامل') || q.includes('وردية') || q.includes('pin') || q.includes('رقم سري') || q.includes('كود')) {
      return 'الفني عندنا يا فندم ليه نظام محكم جداً وممنوع فيه أي تلاعب: المشرف بيولد له كود PIN سري بيتغير يومياً وبيتبعت له على الواتساب عشان يبدأ الوردية. ومستحيل الفني يفوِّل أو يفتح السيستم إلا لو كان الـ GPS بتاعه داخل محيط المحطة الحقيقي بمسافة ما تزيدش عن 10 أمتار! وده لضمان إن التموين بيتم جوه المحطة مش من برة.';
    }

    // 3. QR Code & Scanning
    if (q.includes('كيو ار') || q.includes('qr') || q.includes('باركود') || q.includes('مسح') || q.includes('كاميرا')) {
      return 'كود الـ QR ده السر كله! السائق بيفتح صفحته بيلاقي كود QR مشفر فيه بياناته ورقم العربية ونوعها وسعة الأسطوانة. الفني بيفتح كاميرا التطبيق ويمسح الكود في لمح البصر؛ البيانات بتظهر له أوتوماتيك، بيحدد رقم المضخة (من 1 لـ 8) وكمية الغاز، ويطبع الإيصال والنقط بتنزل لحساب السائق فوراً.';
    }

    // 4. STOP Safety System
    if (q.includes('ستوب') || q.includes('stop') || q.includes('سلامة') || q.includes('امان') || q.includes('أمان')) {
      return 'تطبيق "ستوب" (STOP) هو درع الأمان في كارجاس وعزوتي! مصمم لرصد الملاحظات الآمنة وغير الآمنة في بيئة العمل، وفحص محابس الطوارئ (ESD)، والتأكد من مطابقة أسطوانات الغاز، وتأريض خراطيم التموين لمنع الكهرباء الاستاتيكية. السلامة عندنا مش خيار، دي أول خطوة في كل تفويلة!';
    }

    // 5. Maintenance & Oil & Spark Plugs
    if (q.includes('صيانة') || q.includes('زيت') || q.includes('بوجيه') || q.includes('ردياتير') || q.includes('مياه') || q.includes('فلتر')) {
      return 'عربيات الغاز الطبيعي زي الفل وموفرة جداً، بس ليها شوية أصول: الزيت بيتغير كل 5,000 كم بنوع مخصص للغاز، والبوجيهات كل 20,000 كم بفجوة دقيقة، ومياه الردياتير وفلاتر الغاز كل 15,000 كم. والتطبيق هنا ذكي بيحسب الكيلومترات مع كل تفويلة ويديك إنذار بالألوان (أخضر، أصفر، أحمر) أول ما يقرب ميعاد التغيير عشان تحمي مكنتك!';
    }

    // 6. Admin 5-click easter egg
    if (q.includes('مدير') || q.includes('ادمن') || q.includes('admin') || q.includes('0000') || q.includes('لوجو')) {
      return 'لوحة مدير النظام بتفتح بطريقة ذكية وسرية: اضغط 5 مرات متتالية ورا بعض على لوجو المحطة فوق في الهيدر، هيطلب منك كلمة السر الافتراضية وهى (0000). من جوة هتقدر تعدل أي كلمة في التطبيق، وتغير سعر المتر، وتولد أكواد المضخات والمتاجر وتطبعها، وترفع شيت إكسيل الطاقم وتبعت لهم على الواتساب!';
    }

    // 7. Identity & Ezouti & Mohamed Youssef
    if (q.includes('مين انت') || q.includes('عزوتي') || q.includes('محمد عبد الرحمن') || q.includes('مين طورك') || q.includes('حقوق')) {
      return 'أنا "مُعِين"، المساعد الذكي الحصري لشركة عزوتي للبرمجيات وتكنولوجيا المعلومات ومبتكري ومالكي هو المطور والمهندس محمد عبد الرحمن يوسف. كافة حقوق الملكية وتصميم المنظومة وبرمجتها ملكية حصرية بالكامل لشركة عزوتي ومحمد عبد الرحمن يوسف، ومصمم لخدمة كارجاس بأعلى معايير الحوكمة والذكاء.';
    }

    // Default friendly answer
    return 'تحت أمرك يا طيب! تقدر تسألني عن أي حاجة في التطبيق: طريقة التموين وكسب النقط، جدول صيانة سيارتك، نظام الـ GPS والـ PIN للفنيين، أو طباعة أكواد المضخات للمدير. قول لي وأنا أظبطك!';
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Generate response
    setTimeout(() => {
      const replyText = generateMoenReply(query);
      const moenMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'moen',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        badge: 'مُعين الجدع',
      };
      setMessages((prev) => [...prev, moenMsg]);
      speakText(replyText);
    }, 400);
  };

  const quickQuestions = [
    { label: 'إزاي أكسب وأبدل النقط؟', query: 'كيف اكسب واستبدل نقاط الولاء؟' },
    { label: 'كود الوردية والـ GPS للفني', query: 'شرح كود الوردية السري ونطاق الـ 10 أمتار للجي بي اس' },
    { label: 'جدول صيانة الزيت والبوجيهات', query: 'مواعيد صيانة الزيت والبوجيهات وفلاتر الغاز' },
    { label: 'شرح تطبيق ستوب (STOP)', query: 'اشرح لي تطبيق ستوب للسلامة المهنية' },
  ];

  // Only render if assistant is enabled and role permission is met
  if (!config.assistantEnabled || (config.assistantOnlyAdmin && currentRole !== 'admin')) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-50 no-print">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && messages.length > 0) {
              // speak the last moen message if opened
              const lastMoen = [...messages].reverse().find((m) => m.sender === 'moen');
              if (lastMoen && !isMuted) speakText(lastMoen.text);
            }
          }}
          className="relative group flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-emerald-300/40"
          title="تحدث مع مُعين - المساعد الذكي"
        >
          <div className="relative">
            <span className="text-xl">🤖</span>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
              </span>
            )}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black tracking-tight leading-none">مُعِين الذكي</p>
            <p className="text-[10px] text-emerald-100 font-medium leading-tight">مستشارك الصوتي الأول</p>
          </div>
          <span className="bg-emerald-800/80 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
            عزوتي
          </span>
        </button>
      </div>

      {/* Slide-over / Modal Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-4 sm:left-6 w-[94vw] sm:w-[420px] max-h-[82vh] h-[640px] bg-white rounded-3xl shadow-2xl border border-emerald-100 z-50 flex flex-col overflow-hidden no-print animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 text-white p-4 flex items-center justify-between border-b border-emerald-800/40">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-2xl shadow-lg border border-white/20">
                🤖
                {isSpeaking && (
                  <span className="absolute -bottom-1 -left-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white">مُعِين | Moen AI</h3>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-400/30">
                    عزوتي ©
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-light flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  روح وضاح • عقل لوكا • إنجاز سريع
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    const lastMoen = [...messages].reverse().find((m) => m.sender === 'moen');
                    if (lastMoen) speakText(lastMoen.text);
                  }
                  setIsMuted(!isMuted);
                }}
                className={`p-2 rounded-xl transition ${
                  isMuted
                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-emerald-500 text-white shadow-md'
                }`}
                title={isMuted ? 'تشغيل الصوت الناطق' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
              </button>

              <button
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader info: Intellectual Property badge */}
          <div className="bg-emerald-50 px-3.5 py-1.5 border-b border-emerald-100 flex items-center justify-between text-[10px] text-emerald-900">
            <span className="font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600" />
              مبتكر ومنفذ بواسطة: م. محمد عبد الرحمن يوسف
            </span>
            <span className="text-emerald-700 font-mono">v2.6 Enterprise</span>
          </div>

          {/* Quick Questions Chips */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200/80 overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.query)}
                className="whitespace-nowrap text-[11px] font-bold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-full transition shadow-xs"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-50/50 to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed relative ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-slate-100'
                  }`}
                >
                  {msg.badge && (
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100 text-[10px] text-emerald-700 font-bold">
                      <span>🤖 {msg.badge}</span>
                      <button
                        onClick={() => speakText(msg.text)}
                        className="text-slate-400 hover:text-emerald-600 p-0.5 rounded"
                        title="إعادة الاستماع للصوت"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1.5 font-sans ${
                      msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Audio Visualizer Strip if speaking */}
          {isSpeaking && (
            <div className="bg-emerald-900/90 text-emerald-200 text-[11px] px-3 py-1 flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                مُعين يتحدث الآن باللهجة المصرية...
              </span>
              <button
                onClick={stopSpeaking}
                className="underline text-[10px] hover:text-white"
              >
                إيقاف الصوت
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-2xl transition border ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-700 animate-bounce'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title={isListening ? 'جارٍ الاستماع...' : 'تحدث بالصوت (ميكروفون)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="اسأل مُعين عن الولاء، المحطات، الصيانة..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-3.5 py-2 text-xs outline-none transition"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-2.5 rounded-2xl shadow-md transition"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
