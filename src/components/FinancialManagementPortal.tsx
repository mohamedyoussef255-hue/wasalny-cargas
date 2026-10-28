import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
  Search,
  Filter,
  Download,
  Printer,
  ShieldCheck,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  Info,
  BadgePercent,
  RefreshCw,
  Edit3,
  Gift,
  KeyRound,
  Lock,
  LogOut,
  Car,
  Fuel,
  FileSpreadsheet,
  Calendar,
  Tag,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  AppConfig,
  CargasStationLocation,
  FuelingTransaction,
  RewardRedemption,
  StationFinancialConfig,
} from '../types';
import {
  saveStationLocations,
  saveAppConfig,
  getStationLocations,
  getRedemptions,
} from '../services/storageService';

interface FinancialManagementPortalProps {
  config: AppConfig;
  stations: CargasStationLocation[];
  transactions: FuelingTransaction[];
  redemptions?: RewardRedemption[];
  onUpdateStations: (stations: CargasStationLocation[]) => void;
  onUpdateConfig: (config: AppConfig) => void;
  isStandalone?: boolean;
  onLogoutFinance?: () => void;
}

export const FinancialManagementPortal: React.FC<FinancialManagementPortalProps> = ({
  config,
  stations,
  transactions,
  redemptions: propRedemptions,
  onUpdateStations,
  onUpdateConfig,
  isStandalone = false,
  onLogoutFinance,
}) => {
  const [stationList, setStationList] = useState<CargasStationLocation[]>(stations);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<
    'sales_overview' | 'matrix' | 'redemptions_gifts' | 'live_audit' | 'security_pin'
  >('sales_overview');

  // Redemptions list state
  const [redemptionsList, setRedemptionsList] = useState<RewardRedemption[]>(() => {
    return propRedemptions || getRedemptions();
  });

  useEffect(() => {
    if (propRedemptions) {
      setRedemptionsList(propRedemptions);
    } else {
      setRedemptionsList(getRedemptions());
    }
  }, [propRedemptions]);

  // Bulk Region Update State (يشمل التعميم على جميع المحطات بالكامل أو منطقة محددة)
  const [bulkRegion, setBulkRegion] = useState<string>('all');
  const [bulkCostPerPoint, setBulkCostPerPoint] = useState<number>(0.15);
  const [bulkPointsRate, setBulkPointsRate] = useState<number>(1.0);
  const [bulkActiveStatus, setBulkActiveStatus] = useState<boolean>(true);
  const [isBulkSuccess, setIsBulkSuccess] = useState<boolean>(false);

  // Financial PIN Management State (تعديل الرقم السري من داخل صفحة المالية)
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinChangeError, setPinChangeError] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string>('');

  // Filter stations based on Region and Search query
  const regions = Array.from(
    new Set(stationList.map((s) => s.region || s.city || 'القاهرة الكبرى'))
  );

  const filteredStations = stationList.filter((st) => {
    const stRegion = st.region || st.city || 'القاهرة الكبرى';
    const matchRegion = selectedRegion === 'all' || stRegion === selectedRegion;
    const matchQuery =
      !searchQuery.trim() ||
      st.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      st.code.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      st.city.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchRegion && matchQuery;
  });

  // Calculate Executive Financial Metrics
  const totalVolumeM3 = transactions.reduce((acc, t) => acc + (t.metersQuantity || 0), 0);
  const totalRevenueEgp = transactions.reduce((acc, t) => acc + (t.totalAmountEgp || 0), 0);
  const totalPointsEarned = transactions.reduce((acc, t) => acc + (t.pointsEarned || 0), 0);

  // Total Points Financial Liability = sum(points * stationCostPerPoint)
  const totalLiabilityEgp = transactions.reduce((acc, t) => {
    const cost = t.stationCostPerPointEgp ?? 0.35;
    return acc + (t.pointsEarned || 0) * cost;
  }, 0);

  // Total Redemptions Metrics (استبدال النقاط والهدايا)
  const totalRedemptionsCount = redemptionsList.length;
  const totalPointsSpentOnRewards = redemptionsList.reduce((acc, r) => acc + (r.pointsSpent || 0), 0);
  const totalRewardsEgpValue = redemptionsList.reduce((acc, r) => acc + (r.calculatedEgpValue || 0), 0);

  const weightedCostPerPoint =
    totalPointsEarned > 0 ? totalLiabilityEgp / totalPointsEarned : 0.35;
  const loyaltyCostRatioPct =
    totalRevenueEgp > 0 ? (totalLiabilityEgp / totalRevenueEgp) * 100 : 0;

  const activeProgramStationsCount = stationList.filter(
    (s) => s.isLoyaltyProgramActive !== false
  ).length;

  // Single Station Price Update Handler
  const handleUpdateStationFinancial = (
    stationId: string,
    updates: Partial<CargasStationLocation>
  ) => {
    const updated = stationList.map((st) => {
      if (st.id === stationId) {
        return {
          ...st,
          ...updates,
          financialApprovedByAdmin: false, // requires admin re-approval upon rate edit
        };
      }
      return st;
    });
    setStationList(updated);
    onUpdateStations(updated);
    saveStationLocations(updated);
  };

  // Bulk Apply for Whole Region OR All Stations
  const handleApplyBulkRegion = () => {
    const isAll = bulkRegion === 'all';
    const updated = stationList.map((st) => {
      const stRegion = st.region || st.city || 'القاهرة الكبرى';
      if (isAll || stRegion === bulkRegion) {
        return {
          ...st,
          costPerPointEgp: Number(bulkCostPerPoint),
          pointsAwardRatePerMeter: Number(bulkPointsRate),
          isLoyaltyProgramActive: bulkActiveStatus,
          financialApprovedByAdmin: false,
        };
      }
      return st;
    });

    setStationList(updated);
    onUpdateStations(updated);
    saveStationLocations(updated);

    setIsBulkSuccess(true);
    setTimeout(() => setIsBulkSuccess(false), 4000);
  };

  // Admin Approve Station Pricing
  const handleAdminApprovePricing = (stationId: string) => {
    const updated = stationList.map((st) => {
      if (st.id === stationId) {
        return {
          ...st,
          financialApprovedByAdmin: true,
          financialApprovedAt: new Date().toISOString(),
          financialApprovedBy: 'مدير عام المنظومة',
        };
      }
      return st;
    });

    setStationList(updated);
    onUpdateStations(updated);
    saveStationLocations(updated);
  };

  // Approve ALL Pending Stations in Region
  const handleApproveAllInRegion = () => {
    const updated = stationList.map((st) => {
      const stRegion = st.region || st.city || 'القاهرة الكبرى';
      if (selectedRegion === 'all' || stRegion === selectedRegion) {
        return {
          ...st,
          financialApprovedByAdmin: true,
          financialApprovedAt: new Date().toISOString(),
          financialApprovedBy: 'مدير عام المنظومة (اعتماد مجمع)',
        };
      }
      return st;
    });

    setStationList(updated);
    onUpdateStations(updated);
    saveStationLocations(updated);
    alert('✅ تم اعتماد كافة تسعيرات النقاط للمحطات المحددة بنجاح من مدير النظام.');
  };

  // Change Financial PIN Handler (تعديل الرقم السري)
  const handleChangeFinancialPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    setPinChangeSuccess('');

    const currentActualPin = config.financePin || '1234';
    const adminActualPin = config.adminPin || '0000';

    if (
      currentPinInput.trim() !== currentActualPin.trim() &&
      currentPinInput.trim() !== adminActualPin.trim()
    ) {
      setPinChangeError('الرقم السري الحالي غير صحيح! يمكنك استخدام كود الإدارة المالية أو كود مدير النظام العام.');
      return;
    }

    if (!newPinInput.trim() || newPinInput.trim().length < 4) {
      setPinChangeError('الرقم السري الجديد يجب ألا يقل عن 4 أرقام.');
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinChangeError('الرقم السري الجديد وتأكيده غير متطابقين!');
      return;
    }

    const updatedConfig: AppConfig = {
      ...config,
      financePin: newPinInput.trim(),
    };

    onUpdateConfig(updatedConfig);
    saveAppConfig(updatedConfig);

    setPinChangeSuccess(`✅ تم تحديث الرقم السري للإدارة المالية بنجاح إلى [${newPinInput.trim()}]!`);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  // Export Sales Report to CSV/Excel
  const handleExportSalesReport = () => {
    const headers = [
      'رقم الإيصال',
      'التاريخ والوقت',
      'اسم المحطة',
      'المنطقة الجغرافية',
      'كمية الغاز (م³)',
      'سعر المتر (ج)',
      'المبلغ الإجمالي (ج)',
      'النقاط الممنوحة',
      'تكلفة النقطة للمحطة (ج)',
      'الالتزام المالي للنقاط (ج)',
      'اسم السائق',
      'رقم اللوحة',
    ];

    const rows = transactions.map((tx) => [
      tx.receiptNumber,
      new Date(tx.timestamp).toLocaleString('ar-EG'),
      `"${tx.stationName}"`,
      `"${tx.regionName || 'القاهرة الكبرى'}"`,
      tx.metersQuantity,
      tx.pricePerMeter,
      tx.totalAmountEgp,
      tx.pointsEarned,
      tx.stationCostPerPointEgp ?? 0.35,
      (tx.financialLiabilityEgp ?? (tx.pointsEarned * (tx.stationCostPerPointEgp ?? 0.35))).toFixed(2),
      `"${tx.driverName}"`,
      `"${tx.carPlate}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_مبيعات_ونقاط_كارجاس_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Station-wise aggregation for Sales Overview
  const stationSalesAggregation = stationList.map((st) => {
    const stTx = transactions.filter((t) => t.stationName === st.name || t.stationName === st.code);
    const volume = stTx.reduce((sum, t) => sum + (t.metersQuantity || 0), 0);
    const revenue = stTx.reduce((sum, t) => sum + (t.totalAmountEgp || 0), 0);
    const points = stTx.reduce((sum, t) => sum + (t.pointsEarned || 0), 0);
    const costPerPoint = st.costPerPointEgp ?? 0.35;
    const liability = points * costPerPoint;
    return {
      station: st,
      txCount: stTx.length,
      volume,
      revenue,
      points,
      costPerPoint,
      liability,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Standalone Header Bar (عند الدخول المباشر كمسؤول مالي) */}
      {isStandalone && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              💼
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white">
                  بوابة الإدارة المالية والمحاسبية لشركة كارجاس
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  المسؤول المالي المعتمد
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                رصد ومتابعة مبيعات الغاز الطبيعي (م³)، الإيرادات، النقاط المستحقة، وتسعير تكلفة النقاط لكل محطة، وسجل استبدال الهدايا
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={handleExportSalesReport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition shadow-md flex items-center gap-2 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير إكسل 📊</span>
            </button>

            {onLogoutFinance && (
              <button
                onClick={onLogoutFinance}
                className="bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج ↩️</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Header Banner & Executive Financial Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-teal-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-black text-2xl shadow-inner">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  رصد المبيعات وتكلفة النقاط واستبدال الهدايا
                </h2>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold font-mono">
                  معتمد الإدارة المالية
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تحديد تكلفة النقاط لكل محطة ومنطقة جغرافية، وتتبع الإيرادات، والكميات، والهدايا المصروفة
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSalesReport}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/15 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير تقرير الإكسل</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/15 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* 6 Core Executive KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          {/* KPI 1: مبيعات الغاز */}
          <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>إجمالي الكميات</span>
              <Fuel className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-emerald-300">
              {totalVolumeM3.toLocaleString()} <span className="text-xs">م³</span>
            </p>
            <span className="text-[10px] text-slate-400 block">غاز طبيعي CNG</span>
          </div>

          {/* KPI 2: الإيرادات والمبالغ */}
          <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>إجمالي المبالغ</span>
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-white">
              {totalRevenueEgp.toLocaleString()} <span className="text-xs">ج</span>
            </p>
            <span className="text-[10px] text-slate-400 block">
              سعر المتر: {config.gasPricePerMeter} ج
            </span>
          </div>

          {/* KPI 3: النقاط المستحقة */}
          <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>النقاط المستحقة</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-amber-300">
              {totalPointsEarned.toLocaleString()} <span className="text-xs">نقطة</span>
            </p>
            <span className="text-[10px] text-slate-400 block">ممنوحة للسائقين</span>
          </div>

          {/* KPI 4: التكلفة المالية للنقاط */}
          <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>الالتزام المالي للنقاط</span>
              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-rose-300">
              {totalLiabilityEgp.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-xs">ج</span>
            </p>
            <span className="text-[10px] text-slate-400 block">
              {loyaltyCostRatioPct.toFixed(2)}% من الإيراد
            </span>
          </div>

          {/* KPI 5: الهدايا والاستبدال */}
          <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>الهدايا المصروفة</span>
              <Gift className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-purple-300">
              {totalRedemptionsCount} <span className="text-xs">هدية</span>
            </p>
            <span className="text-[10px] text-slate-400 block">
              قيمة {totalRewardsEgpValue.toLocaleString()} ج
            </span>
          </div>

          {/* KPI 6: محطات البرنامج */}
          <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>تغطية المحطات</span>
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-blue-300">
              {activeProgramStationsCount} / {stationList.length}
            </p>
            <span className="text-[10px] text-slate-400 block">محطات مفعلة بالبرنامج</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('sales_overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'sales_overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Fuel className="w-3.5 h-3.5 text-emerald-500" />
            <span>المبيعات والكميات والمبالغ ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'matrix'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-teal-500" />
            <span>مصفوفة تسعير تكلفة النقاط بالمحطات ({stationList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('redemptions_gifts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'redemptions_gifts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-purple-500" />
            <span>سجل استبدال النقاط والهدايا ({totalRedemptionsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('live_audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'live_audit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>الرصد المالي لعمليات التموين</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('security_pin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'security_pin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-rose-500" />
            <span>الرقم السري للمالية 🔑</span>
          </button>
        </div>

        {/* Global Regional Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none"
          >
            <option value="all">جميع المناطق الجغرافية</option>
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                منطقة: {reg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Tab 1: Sales, Quantities, & Revenues Overview (المبيعات والكميات والمبالغ) */}
      {activeSubTab === 'sales_overview' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top Summary Stats for Sales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                ⛽
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  إجمالي الغاز الممون الموثق
                </span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {totalVolumeM3.toLocaleString()} م³
                </span>
                <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">
                  معدل التموين: {transactions.length > 0 ? (totalVolumeM3 / transactions.length).toFixed(1) : 0} م³/سيارة
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl">
                💵
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  إجمالي المتحصلات والمبيعات
                </span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {totalRevenueEgp.toLocaleString()} ج
                </span>
                <span className="text-[11px] text-teal-600 block mt-0.5 font-medium">
                  السعر الرسمي: {config.gasPricePerMeter} جنيه للمتر المكعب
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
                ⭐
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  إجمالي التزامات النقاط الصادرة
                </span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {totalLiabilityEgp.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ج
                </span>
                <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">
                  متوسط تكلفة النقطة بالشركة: {weightedCostPerPoint.toFixed(2)} ج
                </span>
              </div>
            </div>
          </div>

          {/* Aggregated Station Sales Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>توزيع المبيعات والكميات والمبالغ والنقاط حسب المحطة</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  رصد دقيق لكميات المتر المكعب والإيرادات الإجمالية وتكلفة النقاط المعتمدة لكل محطة
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث باسم المحطة أو الكود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pr-8 pl-3 py-1.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود واسم المحطة</th>
                    <th className="p-3">المنطقة الجغرافية</th>
                    <th className="p-3 text-center">عدد العمليات</th>
                    <th className="p-3 text-center">الكمية الإجمالية (م³)</th>
                    <th className="p-3 text-center">المبالغ المحصلة (ج)</th>
                    <th className="p-3 text-center">النقاط الممنوحة</th>
                    <th className="p-3 text-center">تكلفة النقطة المقررة</th>
                    <th className="p-3 text-center">التكلفة المالية للنقاط (ج)</th>
                    <th className="p-3 text-center">نسبة تكلفة الولاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stationSalesAggregation
                    .filter((row) => {
                      const stRegion = row.station.region || row.station.city || 'القاهرة الكبرى';
                      const matchRegion = selectedRegion === 'all' || stRegion === selectedRegion;
                      const matchQuery =
                        !searchQuery.trim() ||
                        row.station.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                        row.station.code.toLowerCase().includes(searchQuery.trim().toLowerCase());
                      return matchRegion && matchQuery;
                    })
                    .map((row) => {
                      const costRatio = row.revenue > 0 ? (row.liability / row.revenue) * 100 : 0;
                      return (
                        <tr key={row.station.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3">
                            <span className="font-black text-slate-900 block">{row.station.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{row.station.code}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {row.station.region || row.station.city || 'القاهرة الكبرى'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700">
                            {row.txCount} تفويلة
                          </td>
                          <td className="p-3 text-center font-mono font-black text-slate-900">
                            {row.volume.toLocaleString()} م³
                          </td>
                          <td className="p-3 text-center font-mono font-black text-emerald-700">
                            {row.revenue.toLocaleString()} ج
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-600">
                            +{row.points.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-mono font-black text-slate-900">
                            {row.costPerPoint.toFixed(2)} ج
                          </td>
                          <td className="p-3 text-center font-mono font-black text-rose-700 bg-rose-50/30">
                            {row.liability.toFixed(2)} ج
                          </td>
                          <td className="p-3 text-center font-mono text-[11px]">
                            {costRatio.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab 2: Pricing Matrix & Station Point Customization (مصفوفة تسعير تكلفة النقاط) */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Bulk Region Update Tool */}
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white p-5 rounded-3xl border border-teal-700/50 shadow-md">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <BadgePercent className="w-5 h-5 text-teal-400" />
              <h3 className="font-black text-sm text-white">
                تعديل جماعي لتكلفة ومعدل النقاط لمنطقة جغرافية بالكامل
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 items-end">
              <div>
                <label className="text-[11px] text-teal-200 font-bold block mb-1">
                  المنطقة المستهدفة:
                </label>
                <select
                  value={bulkRegion}
                  onChange={(e) => setBulkRegion(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-teal-500/40 rounded-xl px-3 py-2 text-white font-bold outline-none"
                >
                  <option value="all">🌟 جميع المحطات والجمهورية بالكامل (تطبيق على الكل)</option>
                  {regions.map((reg) => (
                    <option key={reg} value={reg}>
                      منطقة: {reg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-teal-200 font-bold block mb-1">
                  تكلفة النقطة المقررة (ج/نقطة):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="5.0"
                  value={bulkCostPerPoint}
                  onChange={(e) => setBulkCostPerPoint(parseFloat(e.target.value) || 0.15)}
                  className="w-full text-xs bg-slate-800 border border-teal-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-teal-200 font-bold block mb-1">
                  معدل المنح (نقطة لكل م³ غاز):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10.0"
                  value={bulkPointsRate}
                  onChange={(e) => setBulkPointsRate(parseFloat(e.target.value) || 1.0)}
                  className="w-full text-xs bg-slate-800 border border-teal-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-teal-200 font-bold block mb-1">
                  حالة برنامج النقاط بالمحطات:
                </label>
                <select
                  value={bulkActiveStatus ? 'active' : 'inactive'}
                  onChange={(e) => setBulkActiveStatus(e.target.value === 'active')}
                  className="w-full text-xs bg-slate-800 border border-teal-500/40 rounded-xl px-3 py-2 text-white font-bold outline-none"
                >
                  <option value="active">مفعل بالكامل 🟢</option>
                  <option value="inactive">موقف مؤقتاً 🔴</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleApplyBulkRegion}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {bulkRegion === 'all'
                      ? 'تطبيق وتعميم على كافة المحطات ⚡'
                      : 'تطبيق على محطات المنطقة'}
                  </span>
                </button>
              </div>
            </div>

            {isBulkSuccess && (
              <div className="mt-3 p-3 bg-emerald-500/25 text-emerald-200 rounded-xl text-xs font-bold border border-emerald-400/50 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {bulkRegion === 'all'
                    ? `✅ تم تطبيق تكلفة النقطة (${bulkCostPerPoint} ج) ومعدل المنح بنجاح على جميع محطات الجمهورية بالكامل دفعة واحدة! ويمكنك تعديل أي محطة منفردة أدناه حسب رغبتك.`
                    : `✅ تم تحديث تكلفة النقاط ومعدل المنح بنجاح لجميع محطات منطقة (${bulkRegion})، ويمكنك تعديل أي محطة منفردة أدناه.`}
                </span>
              </div>
            )}
          </div>

          {/* Matrix Controls & Search */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  مصفوفة تسعير واعتماد تكلفة النقاط لكل محطة (المحطة والموقع الجغرافي)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  تحدد الإدارة المالية تكلفة النقطة ومعدل المنح، وتعتمد في منظومة كارجاس بختم مدير النظام
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApproveAllInRegion}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>اعتماد جماعي لمحطات المنطقة ({selectedRegion === 'all' ? 'الكل' : selectedRegion}) ✍️</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">اسم المحطة والكود</th>
                    <th className="p-3">المنطقة الجغرافية</th>
                    <th className="p-3 text-center">تكلفة النقطة (ج)</th>
                    <th className="p-3 text-center">معدل المنح (نقطة/م³)</th>
                    <th className="p-3 text-center">برنامج النقاط</th>
                    <th className="p-3 text-center">الموازنة المقدرة (ج)</th>
                    <th className="p-3 text-center">حالة الاعتماد</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStations.map((st) => {
                    const costPerPoint = st.costPerPointEgp ?? 0.35;
                    const awardRate = st.pointsAwardRatePerMeter ?? 1.0;
                    const isActive = st.isLoyaltyProgramActive !== false;
                    const isApproved = Boolean(st.financialApprovedByAdmin);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <span className="font-black text-slate-900 block">{st.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{st.code}</span>
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={st.region || st.city || 'القاهرة الكبرى'}
                            onChange={(e) =>
                              handleUpdateStationFinancial(st.id, { region: e.target.value })
                            }
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none w-28"
                          />
                        </td>

                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              step="0.05"
                              min="0.05"
                              max="5"
                              value={costPerPoint}
                              onChange={(e) =>
                                handleUpdateStationFinancial(st.id, {
                                  costPerPointEgp: parseFloat(e.target.value) || 0.35,
                                })
                              }
                              className="w-18 text-center bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-slate-900 outline-none"
                            />
                            <span className="text-[10px] text-slate-500 font-bold">ج</span>
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="10"
                              value={awardRate}
                              onChange={(e) =>
                                handleUpdateStationFinancial(st.id, {
                                  pointsAwardRatePerMeter: parseFloat(e.target.value) || 1.0,
                                })
                              }
                              className="w-16 text-center bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-slate-900 outline-none"
                            />
                            <span className="text-[10px] text-slate-500 font-bold">ن/م³</span>
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStationFinancial(st.id, {
                                isLoyaltyProgramActive: !isActive,
                              })
                            }
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isActive ? 'مفعل بالمحطة 🟢' : 'معطل 🔴'}
                          </button>
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="number"
                            step="5000"
                            min="0"
                            value={st.promotionalBudgetEgp || 25000}
                            onChange={(e) =>
                              handleUpdateStationFinancial(st.id, {
                                promotionalBudgetEgp: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-22 text-center bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-slate-900 outline-none"
                          />
                        </td>

                        <td className="p-3 text-center">
                          {isApproved ? (
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>معتمد رسمياً</span>
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>في انتظار الاعتماد</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {!isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleAdminApprovePricing(st.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition shadow-xs flex items-center gap-1 mx-auto"
                            >
                              <Check className="w-3 h-3" />
                              <span>اعتماد</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {st.financialApprovedAt
                                ? new Date(st.financialApprovedAt).toLocaleDateString('ar-EG')
                                : 'معتمد'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 3: Redemptions & Gifts Ledger (سجل استبدال النقاط والهدايا والمنتجات) */}
      {activeSubTab === 'redemptions_gifts' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top Redemptions Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
                🎁
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  إجمالي المكافآت والهدايا المصروفة
                </span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {totalRedemptionsCount} عملية
                </span>
                <span className="text-[11px] text-purple-600 block mt-0.5 font-medium">
                  زيوت، صيانة، فحص، وكوبونات شركاء
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
                ⭐
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  إجمالي النقاط المستهلكة بالاستبدال
                </span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {totalPointsSpentOnRewards.toLocaleString()} نقطة
                </span>
                <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">
                  تم خصمها من محافظ العملاء
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                💳
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  القيمة المالية المقدرة للهدايا المصروفة
                </span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {totalRewardsEgpValue.toLocaleString()} ج
                </span>
                <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">
                  القيمة السوقية الموفرة للعملاء
                </span>
              </div>
            </div>
          </div>

          {/* Redemptions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-600" />
                  <span>سجل حركات صرف واستبدال الهدايا والمكافآت المعتمدة</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  تتبع كل هدية مصروفة، النقاط المستبدلة، القيمة بالجنيه، السائق المستفيد، وفني المحطة
                </p>
              </div>

              <div className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                إجمالي الحركات: <span className="text-purple-700 font-black">{totalRedemptionsCount}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود الاستبدال</th>
                    <th className="p-3">اسم المكافأة / المنتج</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">السائق والسيارة</th>
                    <th className="p-3 text-center">النقاط المستبدلة</th>
                    <th className="p-3 text-center">القيمة التقديرية (ج)</th>
                    <th className="p-3 text-center">تاريخ الصرف</th>
                    <th className="p-3">المحطة المنفذة والفني</th>
                    <th className="p-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {redemptionsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                        لا توجد عمليات استبدال هدايا مسجلة حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    redemptionsList.map((red) => (
                      <tr key={red.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono font-black text-purple-900 bg-purple-50/30">
                          {red.redemptionCode}
                        </td>
                        <td className="p-3">
                          <span className="font-black text-slate-900 block">{red.rewardTitle}</span>
                          {red.partnerName && (
                            <span className="text-[10px] text-slate-500">
                              الشريك: {red.partnerName}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            {red.category === 'oil'
                              ? 'زيوت كارجاس 🛢️'
                              : red.category === 'maintenance'
                              ? 'صيانة وبوجيهات 🔧'
                              : red.category === 'inspection'
                              ? 'فحص أسطوانات 🛡️'
                              : red.category === 'discount_coupon'
                              ? 'كوبون خصم 🏷️'
                              : red.category === 'third_party_discount'
                              ? 'خصم شركاء 🤝'
                              : 'خدمات وسلع 🎁'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{red.driverName}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {red.carPlate || 'لوحة مسجلة'} {red.carModel ? `(${red.carModel})` : ''}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-amber-600">
                          {red.pointsSpent} نقطة
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/30">
                          {red.calculatedEgpValue || 0} ج
                        </td>
                        <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                          {new Date(red.createdAt).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-slate-600">
                          <span className="font-bold block text-slate-900">
                            {red.usedAtStation || config.stationName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            الفني: {red.dispensedByTechnicianName || 'فني كارجاس معتمد'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {red.isUsed ? (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              تم الصرف ✓
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              جاهز للصرف
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 4: Live Transaction Financial Audit (سجل الرصد المالي لعمليات التموين) */}
      {activeSubTab === 'live_audit' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h4 className="font-black text-sm text-slate-900">
                سجل الرصد المالي لعمليات التموين الحية المعتمدة
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                تتبع آلي لكل تفويلة، كمية الغاز، المبلغ، النقاط الممنوحة طبقاً لجدول المحطة، والتكلفة المالية للشركة
              </p>
            </div>

            <div className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              إجمالي الحركات: <span className="text-slate-900">{transactions.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-xs bg-white">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">رقم الإيصال</th>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">المحطة والمنطقة</th>
                  <th className="p-3">الكمية (م³)</th>
                  <th className="p-3">المبلغ (ج)</th>
                  <th className="p-3">النقاط الممنوحة</th>
                  <th className="p-3 text-center">تكلفة النقطة (ج)</th>
                  <th className="p-3 text-center">الالتزام المالي للنقاط (ج)</th>
                  <th className="p-3">السائق واللوحة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {transactions.map((tx) => {
                  const costPerPoint = tx.stationCostPerPointEgp ?? 0.35;
                  const liabilityEgp = tx.financialLiabilityEgp ?? (tx.pointsEarned * costPerPoint);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{tx.receiptNumber}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{tx.stationName}</span>
                        <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 w-fit">
                          {tx.regionName || 'القاهرة الكبرى'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-black text-slate-900">{tx.metersQuantity} م³</td>
                      <td className="p-3 font-mono font-black text-slate-900">{tx.totalAmountEgp} ج</td>
                      <td className="p-3">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                          +{tx.pointsEarned} نقطة
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {costPerPoint.toFixed(2)} ج
                      </td>
                      <td className="p-3 text-center font-mono font-black text-amber-900 bg-amber-50/40">
                        {liabilityEgp.toFixed(2)} ج
                      </td>
                      <td className="p-3 text-slate-600">
                        <span className="font-bold block text-slate-900">{tx.driverName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{tx.carPlate}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab 5: Financial Security & PIN Change (الرقم السري للمالية وأمان البوابة) */}
      {activeSubTab === 'security_pin' && (
        <div className="max-w-xl mx-auto space-y-5 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
                <KeyRound className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900">
                  تعديل الرقم السري لبوابة الإدارة المالية
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  تغيير كلمة المرور الخاصة بدخول المسؤول المالي مع صلاحية الإشراف الكامل لمدير النظام
                </p>
              </div>
            </div>

            <form onSubmit={handleChangeFinancialPin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  الرقم السري الحالي (أو كود مدير النظام العام):
                </label>
                <input
                  type="password"
                  placeholder="أدخل الكود الحالي (الافتراضي 1234)"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  className="w-full text-sm font-mono font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  الرقم السري الجديد (4 أرقام فأكثر):
                </label>
                <input
                  type="password"
                  placeholder="أدخل الرقم السري الجديد"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="w-full text-sm font-mono font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  تأكيد الرقم السري الجديد:
                </label>
                <input
                  type="password"
                  placeholder="أعد إدخال الرقم السري الجديد للتأكيد"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  className="w-full text-sm font-mono font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              {pinChangeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              {pinChangeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{pinChangeSuccess}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 active:scale-98"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>حفظ وتثبيت الرقم السري الجديد للمالية 💾</span>
                </button>
              </div>
            </form>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>ملاحظة أمنية وميثاق الصلاحيات:</span>
              </div>
              <p>
                الرقم السري الحالي المسجل في النظام هو: <span className="font-mono font-black text-slate-900">{config.financePin || '1234'}</span>.
                يمتلك مدير النظام دائماً إمكانية التعديل والإشراف المباشر على هذا الكود من لوحة تحكم المدير الرئيسية لضمان عدم توقف العمل.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
