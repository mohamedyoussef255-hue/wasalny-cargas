import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Coins,
  Fuel,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Check,
  RotateCcw,
  Layers,
  ArrowRight,
  Info,
  DollarSign,
  Award,
  Zap,
} from 'lucide-react';
import { AppConfig, PointsFormulaConfig } from '../types';
import { calculatePointsFromFormula, DEFAULT_POINTS_FORMULA } from '../services/storageService';

interface PointsCalculatorProps {
  config: AppConfig;
  onUpdateConfig: (updated: AppConfig) => void;
  onClose?: () => void;
}

export const PointsCalculator: React.FC<PointsCalculatorProps> = ({
  config,
  onUpdateConfig,
  onClose,
}) => {
  // Current working formula state
  const initialFormula = config.pointsFormula || DEFAULT_POINTS_FORMULA;
  const [formula, setFormula] = useState<PointsFormulaConfig>(initialFormula);
  const [costPerPointEgp, setCostPerPointEgp] = useState<number>(
    config.loyaltyCostModel?.costPerPointEgp || 0.35
  );
  const [gasPrice, setGasPrice] = useState<number>(config.gasPricePerMeter || 13);
  const [hasSaved, setHasSaved] = useState(false);

  // Simulator Test Inputs
  const [simMeters, setSimMeters] = useState<number>(20);
  const [simTier, setSimTier] = useState<'bronze' | 'silver' | 'gold'>('bronze');
  const [isPromotionalStation, setIsPromotionalStation] = useState(false);

  // Live simulation computation
  const simResults = useMemo(() => {
    let tierMultiplier = formula.tierBronzeMultiplier || 1.0;
    if (simTier === 'silver') tierMultiplier = formula.tierSilverMultiplier || 1.5;
    if (simTier === 'gold') tierMultiplier = formula.tierGoldMultiplier || 2.0;

    const promoMul = isPromotionalStation ? 1.5 : 1.0;
    const effectivePoints = calculatePointsFromFormula(
      simMeters,
      formula,
      tierMultiplier,
      promoMul
    );

    const totalInvoiceEgp = simMeters * gasPrice;
    const companyCostEgp = effectivePoints * costPerPointEgp;
    const customerValueEgp = effectivePoints * (formula.pointsToEgpRedemptionRatio || costPerPointEgp);
    const loyaltyCostPct = totalInvoiceEgp > 0 ? (companyCostEgp / totalInvoiceEgp) * 100 : 0;

    return {
      effectivePoints,
      totalInvoiceEgp: Number(totalInvoiceEgp.toFixed(2)),
      companyCostEgp: Number(companyCostEgp.toFixed(2)),
      customerValueEgp: Number(customerValueEgp.toFixed(2)),
      loyaltyCostPct: Number(loyaltyCostPct.toFixed(1)),
    };
  }, [simMeters, simTier, isPromotionalStation, formula, costPerPointEgp, gasPrice]);

  // Save changes to Global Config
  const handleSave = () => {
    const updated: AppConfig = {
      ...config,
      gasPricePerMeter: gasPrice,
      pointsPerMeter: formula.basePointsPerMeter,
      pointsFormula: {
        ...formula,
        gasPricePerMeter: gasPrice,
      },
      loyaltyCostModel: {
        ...config.loyaltyCostModel,
        costPerPointEgp,
      },
    };

    onUpdateConfig(updated);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 3000);
  };

  // Reset to default Cargas formula
  const handleResetDefaults = () => {
    if (confirm('هل ترغب في استعادة إعدادات المعادلة الافتراضية المعتمدة لكارجاس؟')) {
      setFormula(DEFAULT_POINTS_FORMULA);
      setCostPerPointEgp(0.35);
      setGasPrice(13);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center text-3xl shadow-lg shrink-0">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                حاسبة ومعادلة احتساب النقاط وتكلفة الولاء
              </h2>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                إدارة مالية معتمدة 💼
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-light mt-1 max-w-2xl">
              التحكم المركزي الكامل في تكلفة النقطة على شركة كارجاس، وضبط متغيرات المعادلة الرئيسية، ومعاينة نتائج احتساب النقاط تلقائياً في جلسات السكادا وكافة أرجاء المنظومة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleResetDefaults}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-3 rounded-2xl border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>القيم الافتراضية</span>
          </button>

          <button
            onClick={handleSave}
            className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-black px-6 py-3 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
          >
            {hasSaved ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{hasSaved ? 'تم الحفظ والاعتماد ✓' : 'اعتماد وحفظ المعادلة'}</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns - Formula Controls & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Parameters & Cost Controller */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. الشركة وتكلفة النقطة (Company Cost Controller) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  💰
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    التحكم في تكلفة النقطة وسعر متر الغاز
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    المحدد الأساسي للأثر المالي على موازنة الترويج
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                {costPerPointEgp} ج / نقطة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* تكلفة النقطة على الشركة */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>تكلفة النقطة على الشركة (جنية):</span>
                  <span className="text-[10px] text-emerald-600 font-normal">المعيار المالي</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="5.0"
                    value={costPerPointEgp}
                    onChange={(e) => setCostPerPointEgp(parseFloat(e.target.value) || 0.35)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج.م</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  مثلاً: 0.35 ج تعني أن كل 100 نقطة تمنح للعميل تكلف الشركة 35 جنيهاً.
                </p>
              </div>

              {/* سعر متر الغاز المعتمد */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>سعر متر الغاز الطبيعي (CNG):</span>
                  <span className="text-[10px] text-emerald-600 font-normal">تسعيرة الدولة</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={gasPrice}
                    onChange={(e) => setGasPrice(parseFloat(e.target.value) || 13)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج / م³</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  السعر الرسمي المعتمد لمحطات كارجاس (حالياً 13 ج/م³).
                </p>
              </div>
            </div>
          </div>

          {/* 2. متغيرات المعادلة الرئيسية (Main Formula Variables) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  ⚙️
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    متغيرات معادلة احتساب النقاط الأساسية
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تعديل الأرقام والنسب ومضاعفات الشرائح وبونص الكميات
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* النظام المرن لحساب نسبة النقاط (كل 1 م³ = X نقطة أو كل X م³ = 1 نقطة) */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚖️</span>
                    <div>
                      <h4 className="text-xs font-black text-amber-950">
                        طرق ونماذج احتساب النقاط المرنة (النسبة والاتجاه)
                      </h4>
                      <p className="text-[10px] text-amber-800">
                        يمكنك جعل 1 م³ يعادل نقطة، أو كل 5 أو 10 م³ تعادل نقطة واحدة، أو مضاعفات مخصصة
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    مرونة مطلقة 🔄
                  </span>
                </div>

                {/* أزرار قوالب سريعة */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        ...formula,
                        ratioMode: 'points_per_meter',
                        basePointsPerMeter: 1,
                      })
                    }
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition ${
                      formula.ratioMode !== 'meters_per_point' && formula.basePointsPerMeter === 1
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    كل 1 م³ = 1 نقطة
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        ...formula,
                        ratioMode: 'meters_per_point',
                        metersPerPointUnit: 5,
                      })
                    }
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition ${
                      formula.ratioMode === 'meters_per_point' && (formula.metersPerPointUnit || 5) === 5
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    كل 5 م³ = 1 نقطة
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        ...formula,
                        ratioMode: 'meters_per_point',
                        metersPerPointUnit: 10,
                      })
                    }
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition ${
                      formula.ratioMode === 'meters_per_point' && formula.metersPerPointUnit === 10
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    كل 10 م³ = 1 نقطة
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        ...formula,
                        ratioMode: 'points_per_meter',
                        basePointsPerMeter: 2,
                      })
                    }
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition ${
                      formula.ratioMode !== 'meters_per_point' && formula.basePointsPerMeter === 2
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    كل 1 م³ = 2 نقطة (2X)
                  </button>
                </div>

                {/* الحقول التفصيلية للنمط */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800">طريقة المعادلة:</label>
                    <select
                      value={formula.ratioMode || 'points_per_meter'}
                      onChange={(e) =>
                        setFormula({
                          ...formula,
                          ratioMode: e.target.value as 'points_per_meter' | 'meters_per_point',
                        })
                      }
                      className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                    >
                      <option value="points_per_meter">عدد النقاط لكل 1 متر (مثلاً: 1 م³ = 1 أو 2 نقطة)</option>
                      <option value="meters_per_point">كمية الأمتار المطلوبة لنيل 1 نقطة (مثلاً: كل 5 أو 10 م³ = 1 نقطة)</option>
                    </select>
                  </div>

                  {formula.ratioMode === 'meters_per_point' ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800">
                        كل كم متر مكعب غاز = 1 نقطة؟
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max="100"
                          value={formula.metersPerPointUnit || 5}
                          onChange={(e) =>
                            setFormula({
                              ...formula,
                              metersPerPointUnit: Math.max(1, parseInt(e.target.value) || 5),
                            })
                          }
                          className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-mono font-black text-slate-900"
                        />
                        <span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold">م³ / نقطة</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800">
                        عدد النقاط لكل 1 متر مكعب:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          max="100"
                          value={formula.basePointsPerMeter}
                          onChange={(e) =>
                            setFormula({
                              ...formula,
                              basePointsPerMeter: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-mono font-black text-slate-900"
                        />
                        <span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold">نقطة / م³</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* أساس الحساب ومعدل الأساس */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">أساس احتساب النقاط:</label>
                  <select
                    value={formula.calculationBasis}
                    onChange={(e) =>
                      setFormula({
                        ...formula,
                        calculationBasis: e.target.value as 'meters' | 'egp',
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="meters">بناءً على كمية الأمتار المكعبة (م³)</option>
                    <option value="egp">بناءً على إجمالي القيمة النقدية (جنية)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    قيمة استبدال النقطة بالهدايا (ج.م):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={formula.pointsToEgpRedemptionRatio || 0.35}
                    onChange={(e) =>
                      setFormula({
                        ...formula,
                        pointsToEgpRedemptionRatio: parseFloat(e.target.value) || 0.35,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-black text-slate-900"
                  />
                </div>
              </div>

              {/* مضاعفات الشرائح (Bronze / Silver / Gold) */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  مضاعفات شرائح العملاء (VIP Multipliers):
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">البرونزية (عادية):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      value={formula.tierBronzeMultiplier}
                      onChange={(e) =>
                        setFormula({
                          ...formula,
                          tierBronzeMultiplier: parseFloat(e.target.value) || 1.0,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">الفضية (1.5x):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      value={formula.tierSilverMultiplier}
                      onChange={(e) =>
                        setFormula({
                          ...formula,
                          tierSilverMultiplier: parseFloat(e.target.value) || 1.5,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-center text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">الذهبية (2.0x):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      value={formula.tierGoldMultiplier}
                      onChange={(e) =>
                        setFormula({
                          ...formula,
                          tierGoldMultiplier: parseFloat(e.target.value) || 2.0,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-center text-amber-700"
                    />
                  </div>
                </div>
              </div>

              {/* بونص التموين الكبير ورصيد الفني الترحيبي */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    بونص التموين الكبير (حجم إضافي):
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 block">عند التموين فوق:</span>
                      <input
                        type="number"
                        value={formula.volumeBonusThresholdM3}
                        onChange={(e) =>
                          setFormula({
                            ...formula,
                            volumeBonusThresholdM3: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                        placeholder="م³"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 block">يمنح بونص:</span>
                      <input
                        type="number"
                        value={formula.volumeBonusPoints}
                        onChange={(e) =>
                          setFormula({
                            ...formula,
                            volumeBonusPoints: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-emerald-700"
                        placeholder="نقطة"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    رصيد النقاط الترحيبية للفني بالوردية:
                  </label>
                  <input
                    type="number"
                    value={formula.technicianWelcomePointsPerShift}
                    onChange={(e) =>
                      setFormula({
                        ...formula,
                        technicianWelcomePointsPerShift: parseInt(e.target.value) || 350,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-indigo-700"
                  />
                  <p className="text-[10px] text-slate-500">
                    حصة الفني المتاحة في الوردية لتوزيعها كهدية للعملاء الجدد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Interactive Calculator & Simulator */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/40 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">محاكي احتساب النقاط الفوري</h3>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                حساب لحظي ⚡
              </span>
            </div>

            {/* Simulation Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span className="font-bold">كمية التموين التجريبية:</span>
                  <span className="font-mono font-black text-amber-300 text-sm">{simMeters} م³</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={simMeters}
                  onChange={(e) => setSimMeters(parseInt(e.target.value) || 20)}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['bronze', 'silver', 'gold'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSimTier(tier)}
                    className={`py-2 px-1 rounded-xl font-bold transition text-center ${
                      simTier === tier
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {tier === 'bronze' ? 'شريحة برونزية' : tier === 'silver' ? 'شريحة فضية' : 'شريحة ذهبية'}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-white/5 p-2.5 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  checked={isPromotionalStation}
                  onChange={(e) => setIsPromotionalStation(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded"
                />
                <span>محطة ترويجية منخفضة المبيعات (مضاعف 1.5x)</span>
              </label>
            </div>

            {/* Results Card */}
            <div className="bg-slate-950/70 rounded-2xl p-5 border border-indigo-400/30 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs text-slate-400">إجمالي فاتورة التموين:</span>
                <span className="font-mono font-black text-white text-base">
                  {simResults.totalInvoiceEgp} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs text-amber-300 font-bold">النقاط المكتسبة للعميل:</span>
                <span className="font-mono font-black text-amber-400 text-xl">
                  {simResults.effectivePoints} نقطة ⭐
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs text-rose-300">تكلفة هذه النقاط على الشركة:</span>
                <span className="font-mono font-bold text-rose-400">
                  {simResults.companyCostEgp} ج.م ({simResults.loyaltyCostPct}% من الفاتورة)
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs text-emerald-300">قيمة التوفير للعميل:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {simResults.customerValueEgp} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300">قيمة الهدايا وقسائم الشركاء المستحقة:</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  {simResults.customerValueEgp} ج.م (هدايا وزيوت وكوبونات 🎁)
                </span>
              </div>
            </div>

            {/* Formula Textual Legend */}
            <div className="bg-white/5 rounded-2xl p-3.5 text-[11px] text-slate-300 space-y-1.5 border border-white/10 font-mono text-right">
              <p className="text-amber-300 font-bold font-sans">معادلة احتساب النقاط المعتمدة:</p>
              <p>
                {formula.ratioMode === 'meters_per_point'
                  ? `النقاط = [الأمتار (${simMeters}) ÷ ${formula.metersPerPointUnit || 5}] × مضاعف الشريحة + بونص الحجم`
                  : `النقاط = ${formula.calculationBasis === 'meters' ? `الأمتار (${simMeters})` : `المبلغ (${simResults.totalInvoiceEgp})`} × ${formula.basePointsPerMeter} × مضاعف الشريحة + بونص الحجم`}
              </p>
              <p className="text-slate-400 font-sans">التكلفة المالية على الشركة = النقاط المكتسبة × {costPerPointEgp} ج</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
