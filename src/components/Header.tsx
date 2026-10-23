import React, { useState } from 'react';
import { Fuel, Moon, Sun, Lock, ShieldCheck, UserCheck, Wrench, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppConfig, UserRole } from '../types';

interface HeaderProps {
  config: AppConfig;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onTriggerAdminModal: () => void;
  isAdminUnlocked: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentRole,
  onRoleChange,
  onTriggerAdminModal,
  isAdminUnlocked,
  onToggleTheme,
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    // Reset if more than 2.5 seconds between clicks
    if (now - lastClickTime > 2500) {
      setClickCount(1);
      setLastClickTime(now);
      return;
    }

    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    setLastClickTime(now);

    if (nextCount >= 5) {
      setClickCount(0);
      onTriggerAdminModal();
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & 5-Click Trigger */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div
              onClick={handleLogoClick}
              className="group flex items-center gap-3 cursor-pointer select-none active:scale-95 transition duration-150"
              title="انقر 5 مرات للدخول السري للوحة تحكم المدير"
            >
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md transition-all group-hover:rotate-6 group-hover:scale-105 overflow-hidden"
                  style={{ backgroundColor: config.themeColor || '#059669' }}
                >
                  {config.appLogoUrl ? (
                    <img src={config.appLogoUrl} alt="لوجو كارجاس" className="w-full h-full object-cover" />
                  ) : (
                    <span>⛽</span>
                  )}
                </div>
                {clickCount > 0 && clickCount < 5 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow animate-ping">
                    {clickCount}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                    {config.appName}
                  </h1>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    كارجاس CNG
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {config.appSubtitle}
                </p>
              </div>
            </div>

            {/* Mobile Admin Trigger Quick Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={onTriggerAdminModal}
                className="p-2 text-slate-600 hover:text-emerald-700 rounded-xl bg-slate-100 text-xs font-bold flex items-center gap-1"
                title="لوحة الإدارة"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Role Navigation Buttons (Driver vs Technician vs Admin) */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80">
              {/* Driver Tab */}
              <button
                onClick={() => onRoleChange('driver')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentRole === 'driver'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>بوابة العميل (السائق)</span>
              </button>

              {/* Technician Tab */}
              <button
                onClick={() => onRoleChange('technician')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentRole === 'technician'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>فني التموين (الوردية)</span>
              </button>

              {/* Admin Portal Tab (shown if unlocked or direct toggle) */}
              {isAdminUnlocked && (
                <button
                  onClick={() => onRoleChange('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    currentRole === 'admin'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>لوحة مدير النظام</span>
                </button>
              )}
            </div>

            {/* Quick Admin Unlock Button */}
            {!isAdminUnlocked && (
              <button
                onClick={onTriggerAdminModal}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-200"
                title="تسجيل دخول المدير (0000 أو 5 نقرات على اللوجو)"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">دخول المدير</span>
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="تبديل الوضع الليلي / النهاري"
            >
              {config.isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* 5-Click helper tip banner if clicked */}
        {clickCount > 0 && clickCount < 5 && (
          <div className="mt-2 text-center text-xs text-amber-700 bg-amber-50 py-1 px-3 rounded-lg border border-amber-200 animate-pulse">
            🔑 اضغط {5 - clickCount} مرات إضافية على اللوجو لفتح بوابة الإدارة السرية!
          </div>
        )}
      </div>
    </header>
  );
};
