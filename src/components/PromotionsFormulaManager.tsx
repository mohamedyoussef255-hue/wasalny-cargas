import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  RefreshCw,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Hash,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export interface FormulaVariable {
  id: string;
  key: string;
  name: string;
  value: number;
  unit: string;
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'none';
  isCore?: boolean;
  description?: string;
}

export interface MasterFormulaData {
  formulaName: string;
  formulaDescription: string;
  costPerPointEgp: number;
  roundingMode: 'round' | 'ceil' | 'floor';
  minPointsThreshold: number;
  variables: FormulaVariable[];
}

const DEFAULT_VARIABLES: FormulaVariable[] = [
  {
    id: 'var-cost',
    key: 'cost_per_point',
    name: 'تكلفة النقطة الواحدة على الشركة',
    value: 0.35,
    unit: 'جنية/نقطة',
    operation: 'divide',
    isCore: true,
    description: 'القيمة المالية التقديرية للنقطة الواحدة المحملة على موازنة التسويق',
  },
  {
    id: 'var-budget',
    key: 'budget_item',
    name: 'المخصص المالي للبند الترويجي',
    value: 20000,
    unit: 'جنية',
    operation: 'none',
    isCore: true,
    description: 'المبلغ المالي المعتمد من الموازنة الترويجية المخصصة لهذا العرض أو المسابقة',
  },
  {
    id: 'var-drivers',
    key: 'target_drivers',
    name: 'عدد العملاء والسائقين المستهدفين',
    value: 500,
    unit: 'سائق',
    operation: 'divide',
    isCore: true,
    description: 'العدد المتوقع للمشاركين في الحملة لتقسيم الموازنة عليهم بالتساوي',
  },
  {
    id: 'var-multiplier',
    key: 'promo_multiplier',
    name: 'مضاعف التحفيز والمحطة (Multiplier)',
    value: 1.25,
    unit: 'معامل (X)',
    operation: 'multiply',
    isCore: false,
    description: 'مضاعف إضافي لتنشيط المحطات منخفضة المبيعات أو أوقات غير الذروة',
  },
  {
    id: 'var-bonus',
    key: 'welcome_bonus',
    name: 'بونص نقاط ترحيبي إضافي',
    value: 25,
    unit: 'نقطة',
    operation: 'add',
    isCore: false,
    description: 'نقاط هدية تضاف مباشرة لرصيد السائق لتشجيعه على التفويل فوراً',
  },
  {
    id: 'var-margin',
    key: 'expected_margin',
    name: 'نسبة هامش العائد المتوقع من الولاء',
    value: 28,
    unit: '%',
    operation: 'none',
    isCore: false,
    description: 'نسبة الزيادة المتوقعة في تردد وسحب السائقين من محطات كارجاس',
  },
];

const STORAGE_FORMULA_KEY = 'cargas_master_loyalty_formula';

export const PromotionsFormulaManager: React.FC = () => {
  const { updateSetting, getSetting } = useSettings();

  // Load persistent master formula from storage or context
  const [formulaData, setFormulaData] = useState<MasterFormulaData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_FORMULA_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      formulaName: 'معادلة كارجاس القياسية لتوزيع الموازنة ومكافآت النقاط',
      formulaDescription: 'المعادلة الرئيسية لحساب عدد نقاط الولاء الممنوحة للسائق والقيمة المالية المعادلة بالجنية بناءً على الموازنة وتكلفة النقطة.',
      costPerPointEgp: 0.35,
      roundingMode: 'round',
      minPointsThreshold: 20,
      variables: DEFAULT_VARIABLES,
    };
  });

  // Edit Variable State Modal/Inline
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('');
  const [editOp, setEditOp] = useState<FormulaVariable['operation']>('none');
  const [editDesc, setEditDesc] = useState('');

  // Add Variable State Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState<number>(10);
  const [newUnit, setNewUnit] = useState('نقطة');
  const [newOp, setNewOp] = useState<FormulaVariable['operation']>('add');
  const [newDesc, setNewDesc] = useState('');

  // Save feedback state
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Simulator state
  const [simBudget, setSimBudget] = useState(formulaData.variables.find((v) => v.key === 'budget_item')?.value || 20000);
  const [simDrivers, setSimDrivers] = useState(formulaData.variables.find((v) => v.key === 'target_drivers')?.value || 500);
  const [simMultiplier, setSimMultiplier] = useState(formulaData.variables.find((v) => v.key === 'promo_multiplier')?.value || 1.25);
  const [simBonus, setSimBonus] = useState(formulaData.variables.find((v) => v.key === 'welcome_bonus')?.value || 25);

  // Update costPerPoint in formula when cost variable changes
  const costPerPoint = formulaData.costPerPointEgp;

  // Persist formula data whenever changed
  const saveFormula = async (updated: MasterFormulaData) => {
    setFormulaData(updated);
    try {
      localStorage.setItem(STORAGE_FORMULA_KEY, JSON.stringify(updated));
      // Save permanently to system_settings in Supabase
      await updateSetting('master_loyalty_formula', updated, 'admin-user');
      await updateSetting('loyalty_cost_per_point', updated.costPerPointEgp, 'admin-user');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving master formula:', e);
    }
  };

  // Change cost per point
  const handleCostPerPointChange = (newCost: number) => {
    const cleanCost = Math.max(0.01, Number(newCost.toFixed(3)));
    const updatedVars = formulaData.variables.map((v) =>
      v.key === 'cost_per_point' ? { ...v, value: cleanCost } : v
    );
    const updated: MasterFormulaData = {
      ...formulaData,
      costPerPointEgp: cleanCost,
      variables: updatedVars,
    };
    saveFormula(updated);
  };

  // Start editing a variable
  const handleStartEdit = (v: FormulaVariable) => {
    setEditingVarId(v.id);
    setEditName(v.name);
    setEditValue(v.value);
    setEditUnit(v.unit);
    setEditOp(v.operation);
    setEditDesc(v.description || '');
  };

  // Save edited variable
  const handleSaveEdit = () => {
    if (!editingVarId) return;
    const updatedVars = formulaData.variables.map((v) => {
      if (v.id === editingVarId) {
        return {
          ...v,
          name: editName.trim() || v.name,
          value: Number(editValue),
          unit: editUnit.trim() || v.unit,
          operation: editOp,
          description: editDesc.trim(),
        };
      }
      return v;
    });

    const isCostVar = formulaData.variables.find((v) => v.id === editingVarId)?.key === 'cost_per_point';
    const updated: MasterFormulaData = {
      ...formulaData,
      costPerPointEgp: isCostVar ? Number(editValue) : formulaData.costPerPointEgp,
      variables: updatedVars,
    };

    saveFormula(updated);
    setEditingVarId(null);
  };

  // Delete a variable
  const handleDeleteVariable = (id: string) => {
    const target = formulaData.variables.find((v) => v.id === id);
    if (!target) return;
    if (target.isCore) {
      alert(`⚠️ المتغير "${target.name}" متغير جوهري في النظام ولا يمكن حذفه بالكامل، ولكن يمكنك تعديل اسمه وقيمته.`);
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف المتغير "${target.name}" من المعادلة الرئيسية؟`)) return;

    const updatedVars = formulaData.variables.filter((v) => v.id !== id);
    const updated: MasterFormulaData = {
      ...formulaData,
      variables: updatedVars,
    };
    saveFormula(updated);
  };

  // Add new custom variable
  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newVar: FormulaVariable = {
      id: 'var-' + Date.now(),
      key: newKey.trim() || 'custom_' + Date.now().toString(36),
      name: newName.trim(),
      value: Number(newValue),
      unit: newUnit.trim() || 'نقطة',
      operation: newOp,
      isCore: false,
      description: newDesc.trim() || 'متغير مخصص محدد من مدير النظام',
    };

    const updatedVars = [...formulaData.variables, newVar];
    const updated: MasterFormulaData = {
      ...formulaData,
      variables: updatedVars,
    };
    saveFormula(updated);
    setIsAddModalOpen(false);
    setNewName('');
    setNewKey('');
    setNewValue(10);
    setNewDesc('');
  };

  // Dynamic Equation Text Display
  const equationFormulaText = useMemo(() => {
    const budgetName = formulaData.variables.find((v) => v.key === 'budget_item')?.name || 'المخصص المالي للبند';
    const driversName = formulaData.variables.find((v) => v.key === 'target_drivers')?.name || 'عدد العملاء المستهدفين';
    const costName = formulaData.variables.find((v) => v.key === 'cost_per_point')?.name || 'تكلفة النقطة';
    const mulName = formulaData.variables.find((v) => v.key === 'promo_multiplier')?.name || 'مضاعف التحفيز';
    const bonusName = formulaData.variables.find((v) => v.key === 'welcome_bonus')?.name || 'بونص ترحيبي';

    return `[مكافأة النقاط للسائق] = ((([${budgetName}] ÷ [${driversName}]) × [${mulName}]) ÷ [${costName}]) + [${bonusName}]`;
  }, [formulaData]);

  // Live Simulator Calculation
  const simulationResult = useMemo(() => {
    const cost = formulaData.costPerPointEgp > 0 ? formulaData.costPerPointEgp : 0.35;
    const drivers = simDrivers > 0 ? simDrivers : 1;
    const perDriverCash = simBudget / drivers;
    const afterMulCash = perDriverCash * simMultiplier;
    const calculatedPointsRaw = afterMulCash / cost;

    let points = Math.round(calculatedPointsRaw + (simBonus || 0));
    if (formulaData.roundingMode === 'ceil') points = Math.ceil(calculatedPointsRaw + (simBonus || 0));
    if (formulaData.roundingMode === 'floor') points = Math.floor(calculatedPointsRaw + (simBonus || 0));

    points = Math.max(formulaData.minPointsThreshold, points);
    const equivEgp = Number((points * cost).toFixed(2));
    const totalCampaignCost = Number((points * drivers * cost).toFixed(2));

    return {
      perDriverCash: Number(perDriverCash.toFixed(2)),
      afterMulCash: Number(afterMulCash.toFixed(2)),
      points,
      equivEgp,
      totalCampaignCost,
    };
  }, [simBudget, simDrivers, simMultiplier, simBonus, formulaData]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border-2 border-indigo-700/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-xs">
                تحكم استراتيجي كامل ⚡
              </span>
              <span className="text-xs text-indigo-200 font-mono">
                محرك احتساب النقاط وتكلفة الولاء والموازنة
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              هندسة المعادلة الرئيسية والتحكم في تكلفة النقطة ومتغيراتها
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              هنا يمتلك مدير النظام السلطة الكاملة لضبط قيمة تكلفة النقطة (ج.م)، وتعديل صياغة المعادلة الرئيسية وأرقامها، وإضافة متغيرات وثوابت جديدة أو حذفها وتعديل مسمياتها لتعكس بدقة سياسة شركة كارجاس وعزوتي.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center shrink-0 w-full lg:w-auto">
            <span className="text-[11px] text-indigo-200 block">تكلفة النقطة المعتمدة حالياً</span>
            <div className="flex items-baseline justify-center gap-1.5 mt-1">
              <span className="text-3xl font-black text-amber-300 font-mono">
                {costPerPoint}
              </span>
              <span className="text-xs text-slate-300 font-bold">جنية / نقطة</span>
            </div>
            <span className="text-[10px] text-emerald-300 block mt-1 font-mono">
              (كل 1000 نقطة = {(costPerPoint * 1000).toLocaleString()} ج.م)
            </span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ تحديثات المعادلة والمتغيرات وتكلفة النقطة بنجاح في قاعدة البيانات وتطبيقها فوراً!</span>
        </div>
      )}

      {/* 1. Cost Per Point Interactive Controller Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>1. وحدة التحكم المباشر في قيمة تكلفة النقطة (Cost Per Point)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              تحدد هذه القيمة التكلفة المحملة على ميزانية التسويق لكل نقطة ولاء يكتسبها السائق ويتم الاستبدال بها
            </p>
          </div>

          <span className="text-xs bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full font-bold">
            حقل استراتيجي مباشر
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main numeric input */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              القيمة المالية للنقطة الواحدة بالجنية المصري (EGP):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="10"
                value={costPerPoint}
                onChange={(e) => handleCostPerPointChange(parseFloat(e.target.value) || 0.35)}
                className="w-full p-3 bg-slate-50 border-2 border-emerald-500 rounded-2xl font-mono font-black text-xl text-slate-900 outline-none focus:bg-white"
              />
              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">جنية / نقطة</span>
            </div>
            <p className="text-[11px] text-slate-400">
              يمكنك كتابة أي رقم مثل 0.25 أو 0.35 أو 0.50 أو 1.00
            </p>
          </div>

          {/* Quick Presets */}
          <div className="md:col-span-7 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              نماذج وأرقام تسعير سريعة جاهزة للاختيار بنقرة واحدة:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { label: '0.20 ج', val: 0.20, desc: 'اقتصادي' },
                { label: '0.25 ج', val: 0.25, desc: 'تحفيزي' },
                { label: '0.35 ج', val: 0.35, desc: 'القياسي' },
                { label: '0.50 ج', val: 0.50, desc: 'مضاعف' },
                { label: '1.00 ج', val: 1.00, desc: 'شراكات VIP' },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleCostPerPointChange(p.val)}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    costPerPoint === p.val
                      ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 font-bold'
                  }`}
                >
                  <span className="block font-mono text-xs">{p.label}</span>
                  <span className="text-[9px] opacity-80 block">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Economic Conversion Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
            <span className="text-[11px] text-emerald-800 font-semibold block">متر الغاز الطبيعي المجاني (13 ج):</span>
            <span className="text-base font-black font-mono text-emerald-950 mt-0.5 block">
              يساوي {Math.round(13 / costPerPoint)} نقطة ولاء
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
            <span className="text-[11px] text-amber-800 font-semibold block">باقة الـ 100 نقطة للسائق:</span>
            <span className="text-base font-black font-mono text-amber-950 mt-0.5 block">
              تكلف الشركة {(costPerPoint * 100).toFixed(1)} جنية
            </span>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
            <span className="text-[11px] text-blue-800 font-semibold block">باقة الـ 1000 نقطة (السحب والمسابقات):</span>
            <span className="text-base font-black font-mono text-blue-950 mt-0.5 block">
              تكلف الشركة {(costPerPoint * 1000).toLocaleString()} جنية
            </span>
          </div>
        </div>
      </div>

      {/* 2. Formula Definition & Text Expression Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <span>2. المعادلة الرئيسية للمنظومة (صياغة التعبير الرياضي والمسميات)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكن لمدير النظام تعديل مسمى المعادلة وضوابط التقريب والحد الأدنى
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة متغير أو ثابت جديد للمعادلة ➕</span>
          </button>
        </div>

        {/* Formula Name & Rounding */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          <div className="md:col-span-6 space-y-1">
            <label className="font-bold text-slate-700 block">
              مسمى المعادلة الرئيسية:
            </label>
            <input
              type="text"
              value={formulaData.formulaName}
              onChange={(e) => {
                const updated = { ...formulaData, formulaName: e.target.value };
                saveFormula(updated);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:bg-white"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="font-bold text-slate-700 block">
              قاعدة تقريب الناتج:
            </label>
            <select
              value={formulaData.roundingMode}
              onChange={(e: any) => {
                const updated = { ...formulaData, roundingMode: e.target.value };
                saveFormula(updated);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
            >
              <option value="round">تقريب قياسي لأقرب رقم صحيح (Round)</option>
              <option value="ceil">تقريب تصاعدي للأعلى لصالح العميل (Ceil)</option>
              <option value="floor">تقريب تنازلي للأسفل (Floor)</option>
            </select>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="font-bold text-slate-700 block">
              الحد الأدنى لمكافأة النقاط:
            </label>
            <input
              type="number"
              value={formulaData.minPointsThreshold}
              onChange={(e) => {
                const updated = { ...formulaData, minPointsThreshold: Number(e.target.value) };
                saveFormula(updated);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800 outline-none"
            />
          </div>
        </div>

        {/* Formula Math Expression Box */}
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>التعبير الرياضي المباشر للمعادلة (يتم احتسابه حياً في كافة العروض):</span>
            <span className="font-mono text-amber-400 text-[11px]">جاهز ومفعل تلقائياً</span>
          </div>
          <div className="font-mono font-bold text-sm sm:text-base text-emerald-300 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto text-left" dir="ltr">
            {equationFormulaText}
          </div>
        </div>
      </div>

      {/* 3. Variables & Constants Table (Edit, Delete, Add, Rename) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              <span>3. جدول المتغيرات والثوابت الحسابية (تعديل الأرقام، المسميات، والإضافة والحذف)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكنك تعديل أي مسمى، وتغيير أي رقم أو عملية، أو حذف المتغيرات المخصصة
            </p>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            عدد المتغيرات: {formulaData.variables.length} متغير
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">مسمى المتغير (قابل للتعديل)</th>
                <th className="p-3">الرمز البرمجي</th>
                <th className="p-3 text-center">الرقم / القيمة</th>
                <th className="p-3 text-center">الوحدة</th>
                <th className="p-3 text-center">العملية الحسابية</th>
                <th className="p-3">الشرح والدور في المعادلة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formulaData.variables.map((v) => {
                const isEditing = editingVarId === v.id;

                if (isEditing) {
                  return (
                    <tr key={v.id} className="bg-amber-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-400 rounded-lg font-bold text-xs"
                        />
                      </td>
                      <td className="p-2 font-mono text-slate-500 text-[11px]">{v.key}</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                          className="w-24 p-2 bg-white border border-amber-400 rounded-lg font-mono font-bold text-xs text-center"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="text"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-20 p-2 bg-white border border-amber-400 rounded-lg text-xs text-center"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={editOp}
                          onChange={(e: any) => setEditOp(e.target.value)}
                          className="p-2 bg-white border border-amber-400 rounded-lg text-xs font-bold"
                        >
                          <option value="none">بدون عملية مباشرة (أساسي)</option>
                          <option value="divide">قسمة (÷)</option>
                          <option value="multiply">ضرب (×)</option>
                          <option value="add">جمع (+)</option>
                          <option value="subtract">طرح (-)</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-400 rounded-lg text-xs text-slate-600"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg text-xs font-bold"
                            title="حفظ التعديل"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingVarId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded-lg text-xs"
                            title="إلغاء"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{v.name}</span>
                        {v.isCore && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            جوهري
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{v.key}</td>
                    <td className="p-3 text-center font-mono font-black text-slate-900 text-sm">
                      {v.value.toLocaleString()}
                    </td>
                    <td className="p-3 text-center text-slate-600 font-semibold">{v.unit}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                        {v.operation === 'divide'
                          ? 'قسمة (÷)'
                          : v.operation === 'multiply'
                          ? 'ضرب (×)'
                          : v.operation === 'add'
                          ? 'جمع (+)'
                          : v.operation === 'subtract'
                          ? 'طرح (-)'
                          : 'أساسي'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] max-w-xs">{v.description || '—'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(v)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="تعديل المسمى أو القيمة أو العملية"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!v.isCore && (
                          <button
                            onClick={() => handleDeleteVariable(v.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="حذف هذا المتغير"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Live Interactive Formula Simulator Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-black text-base text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>4. محاكي المعادلة الحي (Live Formula Simulator & Audit)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              غيّر الأرقام والمتغيرات أدناه لترى النتيجة اللحظية بالنقاط وبالجنيه وتأثير تكلفة النقطة ({costPerPoint} ج)
            </p>
          </div>

          <span className="text-xs bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full font-mono font-bold">
            محاكاة فورية
          </span>
        </div>

        {/* Simulator Sliders / Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 font-semibold block">المخصص المالي للبند (جنية):</span>
            <input
              type="number"
              step="1000"
              value={simBudget}
              onChange={(e) => setSimBudget(Number(e.target.value))}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono font-bold text-white outline-none"
            />
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 font-semibold block">عدد السائقين المستهدفين:</span>
            <input
              type="number"
              step="50"
              value={simDrivers}
              onChange={(e) => setSimDrivers(Number(e.target.value))}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono font-bold text-white outline-none"
            />
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 font-semibold block">مضاعف التحفيز (Multiplier):</span>
            <input
              type="number"
              step="0.05"
              value={simMultiplier}
              onChange={(e) => setSimMultiplier(Number(e.target.value))}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono font-bold text-white outline-none"
            />
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 font-semibold block">بونص نقاط إضافي:</span>
            <input
              type="number"
              step="5"
              value={simBonus}
              onChange={(e) => setSimBonus(Number(e.target.value))}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono font-bold text-white outline-none"
            />
          </div>
        </div>

        {/* Step-by-Step Simulation Result */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-xs text-amber-300 font-bold">
            خطوات الاحتساب التفصيلية وفقاً للمعادلة:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white/5 rounded-xl">
              <span className="text-slate-400 block text-[11px]">1. نصيب السائق المالي المباشر</span>
              <span className="font-mono font-bold text-sm text-slate-200 mt-1 block">
                {simulationResult.perDriverCash} ج
              </span>
              <span className="text-[10px] text-slate-500">({simBudget} ÷ {simDrivers})</span>
            </div>

            <div className="p-3 bg-white/5 rounded-xl">
              <span className="text-slate-400 block text-[11px]">2. بعد مضاعف التحفيز ({simMultiplier}x)</span>
              <span className="font-mono font-bold text-sm text-amber-300 mt-1 block">
                {simulationResult.afterMulCash} ج
              </span>
              <span className="text-[10px] text-slate-500">قيمة نقدية موازية</span>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
              <span className="text-emerald-300 block text-[11px] font-bold">3. نقاط الولاء الممنوحة للسائق</span>
              <span className="font-mono font-black text-xl text-emerald-400 mt-0.5 block">
                +{simulationResult.points} نقطة
              </span>
              <span className="text-[10px] text-emerald-200/80">تعادل {simulationResult.equivEgp} ج للسائق</span>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
              <span className="text-indigo-300 block text-[11px] font-bold">4. إجمالي التكلفة على الموازنة</span>
              <span className="font-mono font-black text-xl text-indigo-200 mt-0.5 block">
                {simulationResult.totalCampaignCost.toLocaleString()} ج
              </span>
              <span className="text-[10px] text-indigo-300/80">لكافة الـ {simDrivers} سائق</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Variable */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-base text-slate-900">
                إضافة متغير أو ثابت جديد للمعادلة الرئيسية
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVariable} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  اسم المتغير (المسمى الظاهر لمدير النظام):
                </label>
                <input
                  type="text"
                  placeholder="مثال: حافز تموين أوقات غير الذروة"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    الرمز البرمجي (Key):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. offpeak_incentive"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    الرقم / القيمة العددية:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newValue}
                    onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    الوحدة:
                  </label>
                  <input
                    type="text"
                    placeholder="نقطة، جنية، %، معامل"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    العملية الحسابية:
                  </label>
                  <select
                    value={newOp}
                    onChange={(e: any) => setNewOp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="add">جمع (+)</option>
                    <option value="multiply">ضرب (×)</option>
                    <option value="divide">قسمة (÷)</option>
                    <option value="subtract">طرح (-)</option>
                    <option value="none">بدون عملية مباشرة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  شرح وملاحظات المتغير:
                </label>
                <textarea
                  rows={2}
                  placeholder="اكتب ملاحظات عن دور هذا المتغير في المعادلة..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition"
                >
                  إضافة المتغير وحفظ المعادلة ✓
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
