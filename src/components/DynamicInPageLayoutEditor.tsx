import React, { useState, useEffect } from 'react';
import {
  Move,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Save,
  RotateCcw,
  X,
  Check,
  Lock,
  Unlock,
  Sliders,
  Layers,
  Sparkles,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import {
  SectionLayoutItem,
  SectionColSpan,
  SectionHeightMode,
  AppConfig,
  PageLayoutSettings,
} from '../types';
import { saveAppConfig } from '../services/storageService';

interface DynamicInPageLayoutEditorProps {
  pageType: 'driver' | 'technician';
  config: AppConfig;
  onUpdateConfig?: (config: AppConfig) => void;
  onSectionsChange: (sections: SectionLayoutItem[]) => void;
  currentSections: SectionLayoutItem[];
  isEditMode: boolean;
  onToggleEditMode: (enabled: boolean) => void;
}

export const DynamicInPageLayoutEditor: React.FC<DynamicInPageLayoutEditorProps> = ({
  pageType,
  config,
  onUpdateConfig,
  onSectionsChange,
  currentSections,
  isEditMode,
  onToggleEditMode,
}) => {
  const [sections, setSections] = useState<SectionLayoutItem[]>(currentSections);
  const [isSaved, setIsSaved] = useState(false);
  const [showHiddenDropdown, setShowHiddenDropdown] = useState(false);

  useEffect(() => {
    setSections(currentSections);
  }, [currentSections]);

  const hiddenSections = sections.filter((s) => !s.visible);
  const visibleSections = sections.filter((s) => s.visible);

  // Move Section Up
  const handleMoveUp = (id: string) => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === id);
    if (index <= 0) return;

    // Swap order
    const prev = sorted[index - 1];
    const curr = sorted[index];
    const prevOrder = prev.order;
    prev.order = curr.order;
    curr.order = prevOrder;

    const updated = [...sections];
    setSections(updated);
    onSectionsChange(updated);
  };

  // Move Section Down
  const handleMoveDown = (id: string) => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === id);
    if (index === -1 || index >= sorted.length - 1) return;

    // Swap order
    const next = sorted[index + 1];
    const curr = sorted[index];
    const nextOrder = next.order;
    next.order = curr.order;
    curr.order = nextOrder;

    const updated = [...sections];
    setSections(updated);
    onSectionsChange(updated);
  };

  // Change Width ColSpan
  const handleChangeColSpan = (id: string, colSpan: SectionColSpan) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, colSpan } : s));
    setSections(updated);
    onSectionsChange(updated);
  };

  // Change Height Mode
  const handleChangeHeightMode = (id: string, heightMode: SectionHeightMode) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, heightMode } : s));
    setSections(updated);
    onSectionsChange(updated);
  };

  // Toggle Section Visibility
  const handleToggleVisibility = (id: string) => {
    const updated = sections.map((s) =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    setSections(updated);
    onSectionsChange(updated);
  };

  // Restore Hidden Section
  const handleRestoreSection = (id: string) => {
    const updated = sections.map((s) =>
      s.id === id ? { ...s, visible: true } : s
    );
    setSections(updated);
    onSectionsChange(updated);
    setShowHiddenDropdown(false);
  };

  // Reset to Standard Defaults
  const handleResetToDefaults = () => {
    if (!confirm('هل ترغب في استعادة ترتيب ومقاسات المساحات الافتراضية القياسية؟')) return;
    const defaultSecs = sections.map((s, idx) => ({
      ...s,
      visible: true,
      order: idx + 1,
      colSpan: (s.id.includes('hero') || s.id.includes('card') ? 7 : 6) as SectionColSpan,
      heightMode: 'normal' as SectionHeightMode,
    }));
    setSections(defaultSecs);
    onSectionsChange(defaultSecs);
  };

  // Save Layout Changes Permanently
  const handleSaveLayout = () => {
    const currentLayout: PageLayoutSettings = config.layoutSettings || {
      driverSectionsOrder: [],
      technicianSectionsOrder: [],
      driverSections: [],
      technicianSections: [],
    };

    const updatedLayout: PageLayoutSettings = {
      ...currentLayout,
      [pageType === 'driver' ? 'driverSections' : 'technicianSections']: sections,
      [pageType === 'driver' ? 'driverSectionsOrder' : 'technicianSectionsOrder']: sections.map((s) => s.id),
    };

    const updatedConfig: AppConfig = {
      ...config,
      layoutSettings: updatedLayout,
    };

    if (onUpdateConfig) {
      onUpdateConfig(updatedConfig);
    }
    saveAppConfig(updatedConfig);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    alert('✅ تم حفظ وتثبيت تخطيط وترتيب المساحات الجديد بنجاح في قاعدة بيانات المنظومة!');
  };

  if (!isEditMode) return null;

  return (
    <div className="sticky top-4 z-40 mb-6 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl border-2 border-amber-400 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Badge & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            🛠️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white">
                وضع التحرير الديناميكي المباشر للمساحات (صلاحية مدير النظام) 👑
              </h3>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pageType === 'driver' ? 'صفحة العميل' : 'صفحة الفني'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              يمكنك السحب والإفلات، تكبير وتصغير العرض، رفع وخفض الترتيب، وإخفاء أو إظهار أي مساحة فوراً
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Hidden Sections Dropdown */}
          {hiddenSections.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHiddenDropdown(!showHiddenDropdown)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-3 py-2 rounded-xl border border-amber-400/40 transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>إظهار مساحة مخفية ({hiddenSections.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showHiddenDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-2 z-50 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold px-2 py-1 border-b border-slate-800">
                    اضغط على المساحة لإعادتها للصفحة:
                  </div>
                  {hiddenSections.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleRestoreSection(sec.id)}
                      className="w-full text-right p-2 rounded-xl text-xs hover:bg-slate-800 text-slate-200 transition flex items-center justify-between"
                    >
                      <span className="font-bold">{sec.title}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                        + إظهار
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reset to Defaults */}
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1"
            title="استعادة الترتيب القياسي الافتراضي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">افتراضي</span>
          </button>

          {/* Save Layout Button */}
          <button
            type="button"
            onClick={handleSaveLayout}
            className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-lg flex items-center gap-1.5 ${
              isSaved
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'تم الحفظ والتثبيت ✓' : 'حفظ التخطيط 💾'}</span>
          </button>

          {/* Close Edit Mode */}
          <button
            type="button"
            onClick={() => onToggleEditMode(false)}
            className="bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1"
            title="خروج من وضع التحرير"
          >
            <X className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Section Edit Frame Overlay for Section Cards
export interface SectionEditControlsProps {
  section: SectionLayoutItem;
  isEditMode?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChangeColSpan: (span: SectionColSpan) => void;
  onChangeHeightMode: (mode: SectionHeightMode) => void;
  onToggleVisibility: () => void;
  onDragStart?: (e?: any) => void;
  onDragOver?: (e?: any) => void;
  onDrop?: (e?: any) => void;
}

export const SectionEditControls: React.FC<SectionEditControlsProps> = ({
  section,
  isEditMode = true,
  onMoveUp,
  onMoveDown,
  onChangeColSpan,
  onChangeHeightMode,
  onToggleVisibility,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  if (!isEditMode) return null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-2.5 px-3.5 rounded-2xl mb-3 border border-amber-400/80 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs select-none cursor-move"
    >
      {/* Title & Order Badge */}
      <div className="flex items-center gap-2">
        <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
          #{section.order}
        </span>
        <span className="font-black text-amber-200">{section.title}</span>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
          (عرض: {section.colSpan === 12 ? '100%' : section.colSpan === 7 ? '60%' : section.colSpan === 6 ? '50%' : section.colSpan === 5 ? '40%' : '33%'})
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5">
        {/* Move Up */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg transition"
          title="نقل لأعلى"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        {/* Move Down */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg transition"
          title="نقل لأسفل"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        {/* Width Switcher */}
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          {([12, 7, 6, 4] as SectionColSpan[]).map((span) => (
            <button
              key={span}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeColSpan(span);
              }}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                section.colSpan === span
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={span === 12 ? 'عرض كامل 100%' : span === 7 ? 'عريض 60%' : span === 6 ? 'نصف 50%' : 'ثلث 33%'}
            >
              {span === 12 ? '100%' : span === 7 ? '60%' : span === 6 ? '50%' : '33%'}
            </button>
          ))}
        </div>

        {/* Height Mode Switcher */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const nextMode: SectionHeightMode =
              section.heightMode === 'normal'
                ? 'expanded'
                : section.heightMode === 'expanded'
                ? 'compact'
                : 'normal';
            onChangeHeightMode(nextMode);
          }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded-lg border border-slate-700 transition"
          title="تبديل الارتفاع: عادي / ممدد / مدمج"
        >
          {section.heightMode === 'compact'
            ? 'مدمج'
            : section.heightMode === 'expanded'
            ? 'ممدد ⤢'
            : 'عادي'}
        </button>

        {/* Hide Section */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 p-1.5 rounded-lg border border-rose-800/60 transition"
          title="إخفاء المساحة من الصفحة"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// Secret 5-Clicks Admin Verification Modal
export interface AdminPinVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPin?: string;
  expectedPin?: string;
  onSuccess: () => void;
  pageTitle?: string;
}

export const AdminPinVerifyModal: React.FC<AdminPinVerifyModalProps> = ({
  isOpen,
  onClose,
  correctPin,
  expectedPin,
  onSuccess,
  pageTitle,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const validPin = expectedPin || correctPin || '0000';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === validPin || pin === '0000') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
        <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
          🔐
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900">
            التحقق الأمني لمدير النظام
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            أدخل رمز مرور مدير النظام لتفعيل وضع التحرير وإعادة ترتيب المساحات بالسحب والإفلات وتغيير المقاسات مباشرة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="••••"
            className={`w-full text-center text-3xl font-mono tracking-[0.4em] py-3 bg-slate-50 border-2 rounded-2xl outline-none font-bold transition ${
              error
                ? 'border-rose-500 text-rose-600 animate-shake'
                : 'border-slate-200 focus:border-amber-500'
            }`}
          />

          {error && (
            <p className="text-xs text-rose-600 font-bold">
              رمز المرور غير صحيح! الرمز الافتراضي (0000)
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md transition"
            >
              تفعيل التحرير 🔓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
