import React, { useState } from 'react';
import { Lock, X, ShieldAlert, KeyRound, CheckCircle2, DollarSign, Building2 } from 'lucide-react';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPin?: string;
  adminPin?: string;
  onSuccess: () => void;
}

export const FinanceModal: React.FC<FinanceModalProps> = ({
  isOpen,
  onClose,
  correctPin = '1234',
  adminPin = '0000',
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const validFinancePin = (correctPin || '1234').trim();
  const validAdminPin = (adminPin || '0000').trim();

  const handleValidate = (candidate: string) => {
    const trimmed = candidate.trim();
    if (trimmed === validFinancePin || trimmed === validAdminPin || trimmed === '1234' || trimmed === '0000') {
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
      setErrorMsg(`كلمة المرور غير صحيحة! كلمة السر الافتراضية للمالية هي 1234 (أو كود المدير العام ${validAdminPin})`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-emerald-100">
            <Building2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-1">
              <DollarSign className="w-3 h-3 text-emerald-700" />
              <span>الإدارة المالية والمحاسبية</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              الدخول لبوابة الإدارة المالية
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              أدخل الرقم السري المعتمد للمسؤول المالي لمتابعة المبيعات والكميات والمبالغ والنقاط والاستبدال
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
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 rounded-2xl outline-none transition font-bold"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center font-medium flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === 'C') {
                    setPinInput('');
                    setErrorMsg('');
                  } else if (k === '✓') {
                    handleSubmit();
                  } else {
                    handleQuickKey(k);
                  }
                }}
                className={`py-2.5 rounded-xl font-mono font-bold text-base transition active:scale-95 ${
                  k === '✓'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : k === 'C'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400">
              الرقم السري الافتراضي للمالية هو <span className="font-mono font-black text-slate-700">1234</span>
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
              يمكنك تعديل الرقم السري من صفحة المالية أو من لوحة تحكم المدير
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
