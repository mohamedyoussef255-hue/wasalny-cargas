import React, { useState } from 'react';
import {
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Check,
  RotateCcw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  MapPin,
  QrCode,
  Fuel,
  CreditCard,
  Gift,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Camera,
  Gauge,
  TrendingUp,
  Award,
  Coins,
} from 'lucide-react';
import { AppConfig, SectionLayoutItem, SectionColSpan, SectionHeightMode, PageLayoutSettings } from '../types';
import { DEFAULT_DRIVER_SECTIONS, DEFAULT_TECHNICIAN_SECTIONS } from '../services/storageService';

interface DynamicLayoutManagerProps {
  config: AppConfig;
  onUpdateConfig: (updated: AppConfig) => void;
}

export const DynamicLayoutManager: React.FC<DynamicLayoutManagerProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'driver' | 'technician'>('driver');

  // Working copy of layout sections
  const [driverSections, setDriverSections] = useState<SectionLayoutItem[]>(() => {
    return (
      config.layoutSettings?.driverSections && config.layoutSettings.driverSections.length > 0
        ? config.layoutSettings.driverSections
        : DEFAULT_DRIVER_SECTIONS
    );
  });

  const [techSections, setTechSections] = useState<SectionLayoutItem[]>(() => {
    return (
      config.layoutSettings?.technicianSections && config.layoutSettings.technicianSections.length > 0
        ? config.layoutSettings.technicianSections
        : DEFAULT_TECHNICIAN_SECTIONS
    );
  });

  const [hasSaved, setHasSaved] = useState(false);

  // Active list based on selected tab
  const currentSections = activeTab === 'driver' ? driverSections : techSections;
  const setCurrentSections = activeTab === 'driver' ? setDriverSections : setTechSections;

  // Move section UP
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...currentSections];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    // update order numbers
    items.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setCurrentSections(items);
  };

  // Move section DOWN
  const handleMoveDown = (index: number) => {
    if (index === currentSections.length - 1) return;
    const items = [...currentSections];
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;
    // update order numbers
    items.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setCurrentSections(items);
  };

  // Update ColSpan for a section
  const handleColSpanChange = (id: string, colSpan: SectionColSpan) => {
    setCurrentSections((prev) =>
      prev.map((item) => (item.id === id ? { ...item, colSpan } : item))
    );
  };

  // Update Height Mode for a section
  const handleHeightModeChange = (id: string, heightMode: SectionHeightMode) => {
    setCurrentSections((prev) =>
      prev.map((item) => (item.id === id ? { ...item, heightMode } : item))
    );
  };

  // Toggle Visibility
  const handleToggleVisibility = (id: string) => {
    setCurrentSections((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item))
    );
  };

  // Save changes
  const handleSaveLayout = () => {
    const updatedSettings: PageLayoutSettings = {
      driverSectionsOrder: driverSections.map((s) => s.id),
      technicianSectionsOrder: techSections.map((s) => s.id),
      driverSections,
      technicianSections: techSections,
    };

    const updatedConfig: AppConfig = {
      ...config,
      layoutSettings: updatedSettings,
    };

    onUpdateConfig(updatedConfig);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 3000);
  };

  // Reset to default
  const handleReset = () => {
    if (confirm('هل ترغب في استعادة ترتيب وتوزيع المساحات الافتراضي؟')) {
      if (activeTab === 'driver') {
        setDriverSections(DEFAULT_DRIVER_SECTIONS);
      } else {
        setTechSections(DEFAULT_TECHNICIAN_SECTIONS);
      }
    }
  };

  // Icon mapping
  const renderIcon = (id: string) => {
    switch (id) {
      case 'wasalny_hero':
        return <MapPin className="w-4 h-4 text-emerald-600" />;
      case 'qr_vehicle_card':
        return <QrCode className="w-4 h-4 text-emerald-600" />;
      case 'promotional_banner':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'golden_card':
        return <CreditCard className="w-4 h-4 text-amber-500" />;
      case 'fueling_count_stats':
        return <Fuel className="w-4 h-4 text-cyan-600" />;
      case 'rewards_bank':
        return <Gift className="w-4 h-4 text-rose-500" />;
      case 'maintenance_schedule':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'fueling_history':
        return <Clock className="w-4 h-4 text-slate-600" />;
      case 'service_rating':
        return <Star className="w-4 h-4 text-amber-400" />;
      case 'complaints_box':
        return <MessageSquare className="w-4 h-4 text-rose-400" />;
      case 'camera_scanner':
        return <Camera className="w-4 h-4 text-emerald-600" />;
      case 'scada_live_sessions':
        return <Gauge className="w-4 h-4 text-amber-500" />;
      case 'reward_redemption_scanner':
        return <Gift className="w-4 h-4 text-rose-500" />;
      case 'shift_stats':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'welcome_bonus':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'manual_entry':
        return <Fuel className="w-4 h-4 text-slate-600" />;
      case 'gps_radar':
        return <MapPin className="w-4 h-4 text-rose-500" />;
      case 'technician_incentives':
        return <Coins className="w-4 h-4 text-amber-500" />;
      default:
        return <LayoutGrid className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-400 flex items-center justify-center text-3xl shadow-lg shrink-0">
            <LayoutGrid className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                نظام إدارة وترتيب المساحات والأيقونات المرن
              </h2>
              <span className="bg-teal-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                تحكم ديناميكي 📐
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-light mt-1 max-w-2xl">
              تحكم كامل في موضع كل مساحة، ترتيب ظهورها في مقدمة أو مؤخرة الصفحة، تغيير حجمها وعرضها (عرض كامل، نصف، ثلث)، وتفعيل أو إخفاء أي مساحة على شاشتي العميل والفني.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-3 rounded-2xl border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>الترتيب الافتراضي</span>
          </button>

          <button
            onClick={handleSaveLayout}
            className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-black px-6 py-3 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
          >
            {hasSaved ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{hasSaved ? 'تم حفظ التخطيط ✓' : 'حفظ واعتماد التخطيط'}</span>
          </button>
        </div>
      </div>

      {/* Tabs: Driver Screen vs Technician Screen */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('driver')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'driver'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>تخطيط شاشة العميل (Driver Portal) — {driverSections.length} مساحات</span>
        </button>

        <button
          onClick={() => setActiveTab('technician')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'technician'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>تخطيط شاشة الفني (Technician Portal) — {techSections.length} مساحات</span>
        </button>
      </div>

      {/* Interactive Visual Preview Grid */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-white flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            معاينة حية لتوزيع شبكة الـ 12 عموداً (Live 12-Column Grid Layout):
          </span>
          <span className="text-[11px]">يتم تطبيق العرض والترتيب مباشرة على الشاشات</span>
        </div>

        <div className="grid grid-cols-12 gap-2.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
          {currentSections
            .filter((s) => s.visible)
            .map((item, idx) => {
              const colClass =
                item.colSpan === 12
                  ? 'col-span-12'
                  : item.colSpan === 7
                  ? 'col-span-12 md:col-span-7'
                  : item.colSpan === 6
                  ? 'col-span-12 md:col-span-6'
                  : item.colSpan === 5
                  ? 'col-span-12 md:col-span-5'
                  : 'col-span-12 md:col-span-4';

              return (
                <div
                  key={item.id}
                  className={`${colClass} bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex items-center justify-between text-xs transition hover:border-amber-400/60`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400">
                      {idx + 1}
                    </span>
                    <span className="truncate font-bold text-white">{item.title}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded shrink-0">
                    {item.colSpan} / 12
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Reorderable & Resizable Sections List */}
      <div className="space-y-3">
        {currentSections.map((item, index) => {
          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-4 sm:p-5 border transition shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                item.visible ? 'border-slate-200/90' : 'border-slate-200/60 bg-slate-50/60 opacity-60'
              }`}
            >
              {/* Order Badge + Icon + Title */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition ${
                      index === 0
                        ? 'text-slate-300 cursor-not-allowed bg-slate-100'
                        : 'text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === currentSections.length - 1}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition ${
                      index === currentSections.length - 1
                        ? 'text-slate-300 cursor-not-allowed bg-slate-100'
                        : 'text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                  {renderIcon(item.id)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 truncate">{item.title}</h4>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>

              {/* Controls: Width Selector + Height + Visibility Toggle */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                
                {/* Column Width Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">العرض:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {([12, 7, 6, 5, 4] as SectionColSpan[]).map((cols) => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => handleColSpanChange(item.id, cols)}
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg transition ${
                          item.colSpan === cols
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                        title={
                          cols === 12
                            ? 'عرض كامل (100%)'
                            : cols === 7
                            ? 'عريض (60%)'
                            : cols === 6
                            ? 'نصف الشاشة (50%)'
                            : cols === 5
                            ? 'مائل (40%)'
                            : 'ثلث الشاشة (33%)'
                        }
                      >
                        {cols}c
                      </button>
                    ))}
                  </div>
                </div>

                {/* Density Mode */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">النمط:</span>
                  <select
                    value={item.heightMode}
                    onChange={(e) =>
                      handleHeightModeChange(item.id, e.target.value as SectionHeightMode)
                    }
                    className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <option value="normal">عادي</option>
                    <option value="compact">مضغوط</option>
                    <option value="expanded">موسع</option>
                  </select>
                </div>

                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    item.visible
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  {item.visible ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>ظاهر</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>مخفي</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
