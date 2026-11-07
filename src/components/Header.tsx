import React, { useState } from 'react';
import { Fuel, Moon, Sun, Lock, ShieldCheck, UserCheck, Wrench, Sparkles, CheckCircle2, DollarSign, Headphones } from 'lucide-react';
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
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md transition-all group-hover:rotate-6 group-hover:scale-105 overflow-hidden bg-emerald-50 border border-emerald-400/30"
                >
                  <img
                    src={config.appLogoUrl || '/assets/cargas-master-logo.png'}
                    alt="لوجو كارجاس"
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/cargas-logo.png';
                    }}
                  />
                </div>
                {clickCount > 0 && clickCount < 5 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow animate-ping">
                    {clickCount}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {config.showAppName !== false && (
                    <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                      {config.appName && config.appName.includes('طريقنا واحد') ? config.appName : 'كارجاس - طريقنا واحد'}
                    </h1>
                  )}
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    طريقنا واحد 🇪🇬
                  </span>
                </div>
                {(config.showCompanyName !== false || config.showDeveloperName !== false) && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    {config.showCompanyName !== false ? config.companyName : ''}
                    {config.showCompanyName !== false && config.showDeveloperName !== false ? ' • ' : ''}
                    {config.showDeveloperName !== false ? `م. ${config.developerName}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Admin Trigger: Hidden from regular users, secret 5-clicks on logo is the entrance */}
          </div>

          {/* Right Action Bar: Theme Toggle, and Role Controls */}
          <div className="flex items-center gap-2">
            {/* Admin Controls Toolbar (VISIBLE ONLY WHEN ADMIN IS UNLOCKED) */}
            {isAdminUnlocked ? (
              <div className="bg-slate-900 text-white p-1 rounded-2xl flex items-center gap-1 border border-slate-700 shadow-md overflow-x-auto no-scrollbar max-w-[85vw] sm:max-w-none">
                <span className="text-[10px] text-emerald-400 font-bold px-2 hidden lg:inline">
                  👑 وضع المدير:
                </span>
                
                {/* Admin Portal Tab */}
                <button
                  onClick={() => onRoleChange('admin')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    currentRole === 'admin'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="لوحة تحكم المدير"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الإدارة</span>
                </button>

                {/* Financial Portal Tab */}
                <button
                  onClick={() => onRoleChange('finance')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    currentRole === 'finance'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="صفحة الإدارة المالية"
                >
                  <DollarSign className="w-3.5 h-3.5 text-teal-300" />
                  <span className="hidden sm:inline">المالية</span>
                </button>

                {/* Customer Service & Bookings Tab */}
                <button
                  onClick={() => onRoleChange('customer_service')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    currentRole === 'customer_service'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="صفحة خدمة العملاء ومتابعة الحجوزات"
                >
                  <Headphones className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">خدمة العملاء</span>
                </button>

                {/* Cylinder Inspection Portal Tab */}
                <button
                  onClick={() => onRoleChange('cylinder_inspection')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    currentRole === 'cylinder_inspection'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="بوابة فحص واختبار أسطوانات الغاز"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="hidden sm:inline">فحص الأسطوانات</span>
                </button>

                {/* Complaints Officer Tab */}
                <button
                  onClick={() => onRoleChange('complaints_officer')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    currentRole === 'complaints_officer'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="بوابة مسؤول تلقي الشكاوى والمقترحات"
                >
                  <span className="text-xs">📢</span>
                  <span className="hidden sm:inline">الشكاوى</span>
                </button>

                {/* Preview Driver View */}
                <button
                  onClick={() => onRoleChange('driver')}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentRole === 'driver'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="معاينة صفحة العميل"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">العميل</span>
                </button>

                {/* Preview Technician View */}
                <button
                  onClick={() => onRoleChange('technician')}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentRole === 'technician'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="معاينة صفحة الفني"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">الفني</span>
                </button>
              </div>
            ) : null}



            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
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
