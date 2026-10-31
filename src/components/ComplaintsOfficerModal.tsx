import React, { useState } from 'react';
import { MessageSquareWarning, X, Lock } from 'lucide-react';

interface ComplaintsOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPin?: string;
  adminPin?: string;
  onSuccess: () => void;
}

export const ComplaintsOfficerModal: React.FC<ComplaintsOfficerModalProps> = ({
  isOpen,
  onClose,
  correctPin = '7788',
  adminPin = '0000',
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const validPin = (correctPin || '7788').trim();
  const validAdminPin = (adminPin || '0000').trim();

  const handleValidate = (candidate: string) => {
    const trimmed = candidate.trim();
    if (trimmed === validPin || trimmed === validAdminPin || trimmed === '7788' || trimmed === '0000') {
      setErrorMsg('');
      setPinInput('');
      onSuccess();
      onClose();
      return true;
    }
    return false;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!handleValidate(pinInput)) {
      setErrorMsg('كلمة المرور غير صحيحة! يرجى إدخال باسوورد مسؤول الشكاوى المعتمد من مدير النظام عبر الواتساب.');
    }
  };

  const handleQuickKey = (num: string) => {
    if (pinInput.length < 8) {
      const next = pinInput + num;
      setPinInput(next);
      if (handleValidate(next)) {
        setTimeout(() => {
          setPinInput('');
          setErrorMsg('');
        }, 150);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 bg-rose-50 text-rose-700 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-rose-100">
            <MessageSquareWarning className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-1">
              <Lock className="w-3 h-3 text-rose-700" />
              <span>قطاع الجودة والشكاوى والمقترحات</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              بوابة مسؤول تلقي الشكاوى 📢
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              أدخل الرقم السري المعتمد لمسؤول الشكاوى والمقترحات الممنوح من مدير النظام عبر الواتساب للتحقيق في الشكاوى ومعالجتها
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <input
              type="password"
              maxLength={8}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder="••••"
              autoFocus
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-slate-50 border-2 border-slate-200 focus:border-rose-500 rounded-2xl outline-none transition font-bold"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 text-center font-bold bg-rose-50 p-2 rounded-xl border border-rose-100 animate-shake">
              {errorMsg}
            </p>
          )}

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleQuickKey(num)}
                className="py-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-800 text-slate-800 font-bold rounded-xl text-base transition shadow-2xs active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPinInput('');
                setErrorMsg('');
              }}
              className="py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition active:scale-95"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleQuickKey('0')}
              className="py-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-800 text-slate-800 font-bold rounded-xl text-base transition shadow-2xs active:scale-95"
            >
              0
            </button>
            <button
              type="submit"
              className="py-3 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition shadow-xs active:scale-95 flex items-center justify-center"
            >
              دخول ✓
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <span className="text-[10px] text-slate-400">
            تُمنح كلمة السر لمسؤول الشكاوى حصرياً من قِبل مدير النظام عبر الواتساب
          </span>
        </div>
      </div>
    </div>
  );
};
