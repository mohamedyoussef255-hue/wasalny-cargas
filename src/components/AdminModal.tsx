import React, { useState } from 'react';
import { Lock, X, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPin: string;
  onSuccess: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  correctPin,
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === correctPin.trim()) {
      setErrorMsg('');
      setPinInput('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('كلمة المرور غير صحيحة! كلمة السر الافتراضية هي 0000');
    }
  };

  const handleQuickKey = (num: string) => {
    if (pinInput.length < 8) {
      const next = pinInput + num;
      setPinInput(next);
      if (next === correctPin.trim()) {
        setTimeout(() => {
          setPinInput('');
          setErrorMsg('');
          onSuccess();
          onClose();
        }, 150);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner border border-rose-100">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              الدخول السري لمدير النظام
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              أدخل كلمة المرور المعتمدة لإدارة وتخصيص المنظومة
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
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-slate-50 border-2 border-slate-200 focus:border-rose-600 rounded-2xl outline-none transition font-bold"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center font-medium flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((k) => (
              <button
                type="button"
                key={k}
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
                className={`py-2.5 rounded-xl text-sm font-bold transition active:scale-95 ${
                  k === '✓'
                    ? 'bg-rose-600 text-white hover:bg-rose-700 font-black'
                    : k === 'C'
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-center text-[11px] text-amber-800">
            <span className="font-bold">ملاحظة أمان:</span> كلمة السر الافتراضية هي <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">0000</span> ويمكنك تغييرها من لوحة التحكم.
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-2xl transition shadow-lg shadow-rose-600/20 active:scale-98 text-sm"
          >
            تأكيد وفتح لوحة الإدارة
          </button>
        </form>
      </div>
    </div>
  );
};
