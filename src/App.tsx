import React, { useState, useEffect } from 'react';
import {
  AppConfig,
  DriverProfile,
  FuelingTransaction,
  RewardItem,
  TechnicianCrewMember,
  CargasStationLocation,
  UserRole,
} from './types';
import {
  getAppConfig,
  getDriverProfile,
  getStationCrew,
  getTransactions,
  getRewards,
  getStationLocations,
  saveAppConfig,
  saveDriverProfile,
  saveStationCrew,
  saveTransactions,
  saveRewards,
  saveStationLocations,
  restoreClassicV1Snapshot,
  storeUserLocation,
  DEFAULT_EGYPT_COORDS,
} from './services/storageService';
import { Header } from './components/Header';
import { AdminModal } from './components/AdminModal';
import { DriverPortal } from './components/DriverPortal';
import { TechnicianPortal } from './components/TechnicianPortal';
import { AdminPortal } from './components/AdminPortal';
import { FinancialManagementPortal } from './components/FinancialManagementPortal';
import { FinanceModal } from './components/FinanceModal';
import { MoenAssistant } from './components/MoenAssistant';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SupervisorPortal } from './components/SupervisorPortal';
import { CustomerRegistrationModal } from './components/CustomerRegistrationModal';
import { CustomerServicePortal } from './components/CustomerServicePortal';
import { CustomerServiceModal } from './components/CustomerServiceModal';
import { CylinderInspectionPortal } from './components/CylinderInspectionPortal';
import { CylinderInspectionModal } from './components/CylinderInspectionModal';
import { ComplaintsOfficerPortal } from './components/ComplaintsOfficerPortal';
import { ComplaintsOfficerModal } from './components/ComplaintsOfficerModal';
import { InternalChatModal } from './components/InternalChatModal';
import {
  getCylinderInspectionPin,
  getCustomerServicePin,
  getComplaintsOfficerPin,
} from './services/storageService';
import { ShieldCheck, Sparkles, Fuel, Car, Wrench, Heart, RotateCcw, MapPin, DollarSign, MessageCircle, Users, Headphones } from 'lucide-react';

export default function App() {
  return (
    <SettingsProvider>
      <MainAppContent />
    </SettingsProvider>
  );
}

function MainAppContent() {
  const { gasPrice, stationName, updateSetting } = useSettings();

  const [config, setConfig] = useState<AppConfig>(() => {
    const initial = getAppConfig();
    return {
      ...initial,
      gasPricePerMeter: gasPrice || initial.gasPricePerMeter,
      stationName: stationName || initial.stationName,
    };
  });
  const [driver, setDriver] = useState<DriverProfile>(getDriverProfile);
  const [crew, setCrew] = useState<TechnicianCrewMember[]>(getStationCrew);
  const [rewards, setRewards] = useState<RewardItem[]>(getRewards);
  const [transactions, setTransactions] = useState<FuelingTransaction[]>(getTransactions);
  const [stations, setStations] = useState<CargasStationLocation[]>(getStationLocations);

  // Customer First-Time Registration Modal
  const [isCustomerRegOpen, setIsCustomerRegOpen] = useState<boolean>(() => {
    return !localStorage.getItem('cargas_driver_profile_registered');
  });

  // Internal In-App Chat Modal
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Sync settings context gasPrice and stationName to config
  useEffect(() => {
    if (gasPrice && config.gasPricePerMeter !== gasPrice) {
      setConfig((prev) => ({ ...prev, gasPricePerMeter: gasPrice }));
    }
    if (stationName && config.stationName !== stationName) {
      setConfig((prev) => ({ ...prev, stationName }));
    }
  }, [gasPrice, stationName]);

  // Keep stations state synced across the whole app when admin toggles activities
  useEffect(() => {
    const handleStationsUpdate = () => {
      setStations(getStationLocations());
    };
    window.addEventListener('cargas_stations_updated', handleStationsUpdate);
    window.addEventListener('storage', handleStationsUpdate);
    return () => {
      window.removeEventListener('cargas_stations_updated', handleStationsUpdate);
      window.removeEventListener('storage', handleStationsUpdate);
    };
  }, []);

  // Keep driver state synced when admin, customer service or user modifies profile
  useEffect(() => {
    const handleDriverUpdate = (e: any) => {
      if (e?.detail) {
        setDriver(e.detail);
      } else {
        setDriver(getDriverProfile());
      }
    };
    window.addEventListener('cargas_driver_profile_updated', handleDriverUpdate);
    return () => {
      window.removeEventListener('cargas_driver_profile_updated', handleDriverUpdate);
    };
  }, []);

  // Keep app config and rewards dynamically synced when Financial Management updates point cost
  useEffect(() => {
    const handleFinancialUpdate = (e: any) => {
      if (e?.detail?.config) {
        setConfig(e.detail.config);
      } else {
        setConfig(getAppConfig());
      }
      if (e?.detail?.rewards) {
        setRewards(e.detail.rewards);
      } else {
        setRewards(getRewards());
      }
    };
    window.addEventListener('cargas_financial_rate_updated', handleFinancialUpdate);
    return () => {
      window.removeEventListener('cargas_financial_rate_updated', handleFinancialUpdate);
    };
  }, []);

  const [currentRole, setCurrentRole] = useState<UserRole>('driver');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isFinanceUnlocked, setIsFinanceUnlocked] = useState(false);
  const [isCustomerServiceModalOpen, setIsCustomerServiceModalOpen] = useState(false);
  const [isCustomerServiceUnlocked, setIsCustomerServiceUnlocked] = useState(false);
  const [isCylinderInspectionModalOpen, setIsCylinderInspectionModalOpen] = useState(false);
  const [isCylinderInspectionUnlocked, setIsCylinderInspectionUnlocked] = useState(false);
  const [isComplaintsOfficerModalOpen, setIsComplaintsOfficerModalOpen] = useState(false);
  const [isComplaintsOfficerUnlocked, setIsComplaintsOfficerUnlocked] = useState(false);

  // Auto-GPS on launch: query device location and store accurate coordinates
  useEffect(() => {
    // Default fallback stored immediately
    if (!localStorage.getItem('cargas_accurate_user_gps')) {
      storeUserLocation(DEFAULT_EGYPT_COORDS);
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          if (uLat !== 0 && uLng !== 0) {
            storeUserLocation({ lat: uLat, lng: uLng });
          }
          if (stations && stations.length > 0) {
            let nearest = stations[0];
            let minD = 9999999;
            stations.forEach((st) => {
              const dLat = (st.latitude - uLat) * (Math.PI / 180);
              const dLon = (st.longitude - uLng) * (Math.PI / 180);
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(uLat * (Math.PI / 180)) *
                  Math.cos(st.latitude * (Math.PI / 180)) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distKm = 6371 * c;
              if (distKm < minD) {
                minD = distKm;
                nearest = st;
              }
            });
            if (nearest && nearest.name && config.stationName !== nearest.name) {
              setConfig((prev) => {
                const updated = {
                  ...prev,
                  stationName: nearest.name,
                  stationCode: nearest.code || prev.stationCode,
                  stationLat: nearest.latitude,
                  stationLng: nearest.longitude,
                };
                saveAppConfig(updated);
                return updated;
              });
            }
          }
        },
        (err) => {
          // Fallback to default Egypt Cargas central coordinates
          storeUserLocation(DEFAULT_EGYPT_COORDS);
        },
        { timeout: 7000, maximumAge: 60000, enableHighAccuracy: true }
      );
    }
  }, [stations]);

  // Sync dark mode class
  useEffect(() => {
    if (config.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.isDarkMode]);

  const handleToggleTheme = () => {
    const updated = { ...config, isDarkMode: !config.isDarkMode };
    setConfig(updated);
    saveAppConfig(updated);
  };

  const handleRoleChange = (role: UserRole) => {
    if (role === 'admin' && !isAdminUnlocked) {
      setIsAdminModalOpen(true);
      return;
    }
    if (role === 'finance' && !isFinanceUnlocked && !isAdminUnlocked) {
      setIsFinanceModalOpen(true);
      return;
    }
    if (role === 'customer_service' && !isCustomerServiceUnlocked && !isAdminUnlocked) {
      setIsCustomerServiceModalOpen(true);
      return;
    }
    if (role === 'cylinder_inspection' && !isCylinderInspectionUnlocked && !isAdminUnlocked) {
      setIsCylinderInspectionModalOpen(true);
      return;
    }
    if (role === 'complaints_officer' && !isComplaintsOfficerUnlocked && !isAdminUnlocked) {
      setIsComplaintsOfficerModalOpen(true);
      return;
    }
    setCurrentRole(role);
  };

  const handleAdminSuccess = () => {
    setIsAdminUnlocked(true);
    setCurrentRole('admin');
  };

  const handleFinanceSuccess = () => {
    setIsFinanceUnlocked(true);
    setCurrentRole('finance');
  };

  const handleCustomerServiceSuccess = () => {
    setIsCustomerServiceUnlocked(true);
    setCurrentRole('customer_service');
  };

  const handleCylinderInspectionSuccess = () => {
    setIsCylinderInspectionUnlocked(true);
    setCurrentRole('cylinder_inspection');
  };

  const handleComplaintsOfficerSuccess = () => {
    setIsComplaintsOfficerUnlocked(true);
    setCurrentRole('complaints_officer');
  };

  const refreshAllData = () => {
    setConfig(getAppConfig());
    setDriver(getDriverProfile());
    setCrew(getStationCrew());
    setRewards(getRewards());
    setTransactions(getTransactions());
    setStations(getStationLocations());
  };

  const handleRollback = () => {
    restoreClassicV1Snapshot();
    refreshAllData();
  };

  const handleSaveRegisteredDriver = (newDriver: DriverProfile) => {
    setDriver(newDriver);
    saveDriverProfile(newDriver);
    localStorage.setItem('cargas_driver_profile_registered', 'true');
    setIsCustomerRegOpen(false);
  };

  return (
    <div className={`min-h-screen flex flex-col ${config.isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Top Header with 5-Click Admin Easter Egg */}
      <Header
        config={config}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onTriggerAdminModal={() => setIsAdminModalOpen(true)}
        isAdminUnlocked={isAdminUnlocked}
        onToggleTheme={handleToggleTheme}
      />

      {/* Role Navigation Quick Bar: SHOWN ONLY TO SYSTEM ADMIN (محجوب بالكامل عن صفحة العميل ومقتصر على مدير النظام) */}
      {isAdminUnlocked && (
        <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto no-scrollbar shadow-inner animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-black flex items-center gap-1.5 px-2">
              <span>👑</span>
              <span className="hidden sm:inline">تبديل الواجهة (صلاحية مدير النظام):</span>
            </span>
            
            <button
              onClick={() => handleRoleChange('driver')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentRole === 'driver' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{config.customTexts?.welcomeDriverLabel || 'صديق كارجاس'}</span>
            </button>

            <button
              onClick={() => handleRoleChange('technician')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentRole === 'technician' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>فني التموين</span>
            </button>

            <button
              onClick={() => handleRoleChange('supervisor')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentRole === 'supervisor' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مشرف المحطة 👮‍♂️</span>
            </button>

            <button
              onClick={() => handleRoleChange('finance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentRole === 'finance' ? 'bg-teal-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>الإدارة المالية 💼</span>
            </button>

            <button
              onClick={() => handleRoleChange('customer_service')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentRole === 'customer_service' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>خدمة العملاء 🎧</span>
            </button>

            <button
              onClick={() => handleRoleChange('cylinder_inspection')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentRole === 'cylinder_inspection' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>فحص الأسطوانات 🛡️</span>
            </button>

            <button
              onClick={() => handleRoleChange('complaints_officer')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentRole === 'complaints_officer' ? 'bg-rose-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="text-xs">📢</span>
              <span>الشكاوى</span>
            </button>

            <button
              onClick={() => handleRoleChange('admin')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentRole === 'admin' ? 'bg-rose-700 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>لوحة تحكم المدير</span>
            </button>
          </div>

          {/* In-App Chat Trigger Button */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>المحادثات والشات الداخلي 💬</span>
          </button>
        </div>
      )}

      {/* Floating Chat Button for Staff Portals when not Admin */}
      {!isAdminUnlocked && currentRole !== 'driver' && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black p-3.5 rounded-2xl shadow-xl flex items-center gap-2 transition active:scale-95 border border-emerald-400/40"
          title="فتح شات المحادثات الداخلي"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs hidden sm:inline">شات المحطة الداخلي</span>
        </button>
      )}


      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Driver / Customer Portal */}
        {currentRole === 'driver' && (
          <DriverPortal
            config={config}
            driver={driver}
            rewards={rewards}
            transactions={transactions}
            stations={stations}
            crew={crew}
            onUpdateDriver={(d) => {
              setDriver(d);
              saveDriverProfile(d);
            }}
            onRefreshData={refreshAllData}
            onUpdateConfig={(cfg) => {
              setConfig(cfg);
              saveAppConfig(cfg);
            }}
          />
        )}

        {/* Technician Shift & Fueling Scanner Portal */}
        {currentRole === 'technician' && (
          <TechnicianPortal
            config={config}
            stationCrew={crew}
            currentDriver={driver}
            transactions={transactions}
            onUpdateCrew={(c) => {
              setCrew(c);
              saveStationCrew(c);
            }}
            onUpdateDriver={(d) => {
              setDriver(d);
              saveDriverProfile(d);
            }}
            onUpdateTransactions={(txs) => {
              setTransactions(txs);
              saveTransactions(txs);
            }}
            onUpdateConfig={(cfg) => {
              setConfig(cfg);
              saveAppConfig(cfg);
            }}
          />
        )}

        {/* Super Admin Control Center */}
        {currentRole === 'admin' && (
          <AdminPortal
            config={config}
            rewards={rewards}
            stationCrew={crew}
            stations={stations}
            transactions={transactions}
            onUpdateConfig={(cfg) => {
              setConfig(cfg);
              saveAppConfig(cfg);
            }}
            onUpdateRewards={(rews) => {
              setRewards(rews);
              saveRewards(rews);
            }}
            onUpdateCrew={(crw) => {
              setCrew(crw);
              saveStationCrew(crw);
            }}
            onUpdateStations={(sts) => {
              setStations(sts);
              saveStationLocations(sts);
            }}
            onRollbackToClassic={handleRollback}
          />
        )}

        {/* Dedicated Standalone Financial Management Portal (بوابة الإدارة المالية المعتمدة) */}
        {currentRole === 'finance' && (
          <FinancialManagementPortal
            config={config}
            stations={stations}
            transactions={transactions}
            onUpdateStations={(sts) => {
              setStations(sts);
              saveStationLocations(sts);
            }}
            onUpdateConfig={(cfg) => {
              setConfig(cfg);
              saveAppConfig(cfg);
            }}
            isStandalone={true}
            onLogoutFinance={() => {
              setCurrentRole('driver');
              setIsFinanceUnlocked(false);
            }}
          />
        )}

        {/* Dedicated Customer Service & Booking Confirmation Portal */}
        {currentRole === 'customer_service' && (
          <CustomerServicePortal
            config={config}
            stations={stations}
            onBackToMain={() => setCurrentRole('driver')}
          />
        )}

        {/* Dedicated Standalone Cylinder Testing & Hydrostatic Inspection Portal (بوابة فحص واختبار أسطوانات الغاز) */}
        {currentRole === 'cylinder_inspection' && (
          <CylinderInspectionPortal
            config={config}
            stations={stations}
            onBackToMain={() => setCurrentRole('driver')}
            onLogout={() => {
              setCurrentRole('driver');
              setIsCylinderInspectionUnlocked(false);
            }}
          />
        )}

        {/* Dedicated Standalone Complaints & Suggestions Officer Portal (بوابة مسؤول تلقي الشكاوى والمقترحات) */}
        {currentRole === 'complaints_officer' && (
          <ComplaintsOfficerPortal />
        )}

        {/* Supervisor Station Control & Audit Portal */}
        {currentRole === 'supervisor' && (
          <SupervisorPortal
            config={config}
            stationCrew={crew}
            transactions={transactions}
            onUpdateCrew={(c) => {
              setCrew(c);
              saveStationCrew(c);
            }}
            onUpdateTransactions={(txs) => {
              setTransactions(txs);
              saveTransactions(txs);
            }}
          />
        )}
      </main>

      {/* Customer First-Time Registration Modal (Splash + Form) */}
      <CustomerRegistrationModal
        isOpen={isCustomerRegOpen}
        config={config}
        onSaveDriver={handleSaveRegisteredDriver}
        onClose={() => setIsCustomerRegOpen(false)}
      />

      {/* Internal In-App Chat Modal */}
      <InternalChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentRole={currentRole}
        config={config}
        currentUserName={
          currentRole === 'admin' ? 'مدير عام المنظومة' :
          currentRole === 'finance' ? 'مسؤول الإدارة المالية' :
          currentRole === 'supervisor' ? 'مشرف المحطة' : 'فني التموين'
        }
      />

      {/* Secret Admin Authentication Modal (0000) */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        correctPin={config.adminPin}
        onSuccess={handleAdminSuccess}
      />

      {/* Financial Management Authentication Modal (1234) */}
      <FinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        correctPin={config.financePin || '1234'}
        adminPin={config.adminPin || '0000'}
        onSuccess={handleFinanceSuccess}
      />

      {/* Customer Service Authentication Modal (5566) */}
      <CustomerServiceModal
        isOpen={isCustomerServiceModalOpen}
        onClose={() => setIsCustomerServiceModalOpen(false)}
        correctPin={config.customerServicePin || getCustomerServicePin() || '5566'}
        adminPin={config.adminPin || '0000'}
        onSuccess={handleCustomerServiceSuccess}
      />

      {/* Cylinder Inspection Technical Authentication Modal (8899) */}
      <CylinderInspectionModal
        isOpen={isCylinderInspectionModalOpen}
        onClose={() => setIsCylinderInspectionModalOpen(false)}
        correctPin={config.cylinderInspectionPin || getCylinderInspectionPin() || '8899'}
        adminPin={config.adminPin || '0000'}
        onSuccess={handleCylinderInspectionSuccess}
      />

      {/* Complaints Officer Authentication Modal (7788) */}
      <ComplaintsOfficerModal
        isOpen={isComplaintsOfficerModalOpen}
        onClose={() => setIsComplaintsOfficerModalOpen(false)}
        correctPin={config.complaintsOfficerPin || getComplaintsOfficerPin() || '7788'}
        adminPin={config.adminPin || '0000'}
        onSuccess={handleComplaintsOfficerSuccess}
      />

      {/* Egyptian Voice & Interactive Assistant "مُعِين" */}
      <MoenAssistant
        config={config}
        currentRole={currentRole}
        onNavigateTo={handleRoleChange}
      />

      {/* Footer with Intellectual Property & Rights (Respects showAppName, showCompanyName, showDeveloperName) */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-slate-700 font-bold">
            <span>{config.appName || 'منظومة كارجاس المتكاملة لإدارة المحطات وبرنامج الولاء الذكي'}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            جميع الحقوق محفوظة لشركة كارجاس للغاز الطبيعي للسيارات (ش.م.م) © 2026
          </p>
          <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-center gap-2">
            <span>سعر المتر: {config.gasPricePerMeter} ج</span>
            <span>•</span>
            <span>نطاق الأمان: 10 أمتار GPS</span>
            <span>•</span>
            <span>النسخة: v3.0 Enterprise 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
