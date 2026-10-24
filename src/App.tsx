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
} from './services/storageService';
import { Header } from './components/Header';
import { AdminModal } from './components/AdminModal';
import { DriverPortal } from './components/DriverPortal';
import { TechnicianPortal } from './components/TechnicianPortal';
import { AdminPortal } from './components/AdminPortal';
import { MoenAssistant } from './components/MoenAssistant';
import { ShieldCheck, Sparkles, Fuel, Car, Wrench, Heart, RotateCcw, MapPin } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(getAppConfig);
  const [driver, setDriver] = useState<DriverProfile>(getDriverProfile);
  const [crew, setCrew] = useState<TechnicianCrewMember[]>(getStationCrew);
  const [rewards, setRewards] = useState<RewardItem[]>(getRewards);
  const [transactions, setTransactions] = useState<FuelingTransaction[]>(getTransactions);
  const [stations, setStations] = useState<CargasStationLocation[]>(getStationLocations);

  const [currentRole, setCurrentRole] = useState<UserRole>('driver');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (config.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.isDarkMode]);

  // Check URL parameters for direct role routing (e.g. WhatsApp message sent to technician)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const techIdParam = params.get('techId');
      if (roleParam === 'technician' || techIdParam) {
        setCurrentRole('technician');
      }
    } catch {}
  }, []);

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
    setCurrentRole(role);
  };

  const handleAdminSuccess = () => {
    setIsAdminUnlocked(true);
    setCurrentRole('admin');
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
          />
        )}

        {/* Super Admin Control Center */}
        {currentRole === 'admin' && (
          <AdminPortal
            config={config}
            rewards={rewards}
            stationCrew={crew}
            stations={stations}
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
      </main>

      {/* Secret Admin Authentication Modal (0000) */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        correctPin={config.adminPin}
        onSuccess={handleAdminSuccess}
      />

      {/* Egyptian Voice & Interactive Assistant "مُعِين" */}
      <MoenAssistant
        config={config}
        currentRole={currentRole}
        onNavigateTo={handleRoleChange}
      />

      {/* Footer with Intellectual Property & Rights */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-slate-700 font-bold">
            <span>منظومة كارجاس المتكاملة لإدارة المحطات وبرنامج الولاء الذكي</span>
            <span>•</span>
            <span className="text-emerald-700">شركة عزوتي للبرمجيات وتكنولوجيا المعلومات</span>
            <span>•</span>
            <span className="text-slate-900">المطور: محمد عبد الرحمن يوسف</span>
          </div>
          <p className="text-[11px] text-slate-400">
            كافة حقوق الملكية الفكرية وتصميم المنظومة وبرمجتها ومساعدها الذكي "مُعين" تعود بالكامل وبشكل حصري لـ "شركة عزوتي للبرمجيات وتكنولوجيا المعلومات" والمالك والمطور "محمد عبد الرحمن يوسف".
          </p>
          <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-center gap-2">
            <span>سعر المتر: {config.gasPricePerMeter} ج</span>
            <span>•</span>
            <span>نطاق الأمان: 10 أمتار GPS</span>
            <span>•</span>
            <span>النسخة: v2.8 Enterprise 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
