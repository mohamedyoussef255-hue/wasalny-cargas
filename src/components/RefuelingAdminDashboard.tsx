import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Database,
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Fuel,
  DollarSign,
  TrendingUp,
  Car,
  Calendar,
  Layers,
  Save,
  ShieldCheck,
  Check,
  Info,
  Server,
  Zap,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSettings } from '../context/SettingsContext';
import {
  fetchRefuelingTransactionsFromDb,
  RefuelingFilters,
} from '../services/supabaseClient';
import { RefuelingTransaction } from '../types/database';
import { FULL_SUPABASE_SQL_SCRIPT } from '../services/sqlSchemaScript';

export const RefuelingAdminDashboard: React.FC = () => {
  const {
    settings,
    gasPrice,
    stationName,
    stationId,
    vatPercentage,
    currency,
    updateSetting,
    refreshSettings,
    configureSupabase,
    isSupabaseConfigured,
    supabaseUrl,
  } = useSettings();

  const [activeSection, setActiveSection] = useState<'reports' | 'settings' | 'sql_architecture'>('reports');

  // Transactions & Reports State
  const [transactions, setTransactions] = useState<RefuelingTransaction[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('today');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [carTypeFilter, setCarTypeFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchPlate, setSearchPlate] = useState('');

  // Settings Edit State
  const [editPrice, setEditPrice] = useState<number>(gasPrice);
  const [editStationName, setEditStationName] = useState<string>(stationName);
  const [editStationId, setEditStationId] = useState<string>(stationId);
  const [editVat, setEditVat] = useState<number>(vatPercentage);
  const [isMaintenance, setIsMaintenance] = useState<boolean>(Boolean(settings.app_maintenance));
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Supabase Connection State
  const [supaUrlInput, setSupaUrlInput] = useState(supabaseUrl || '');
  const [supaKeyInput, setSupaKeyInput] = useState('');
  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [supaStatusMessage, setSupaStatusMessage] = useState<{ text: string; success: boolean } | null>(null);

  // SQL Script Copy State
  const [isSqlCopied, setIsSqlCopied] = useState(false);

  // Sync state when settings change
  useEffect(() => {
    setEditPrice(gasPrice);
    setEditStationName(stationName);
    setEditStationId(stationId);
    setEditVat(vatPercentage);
    setIsMaintenance(Boolean(settings.app_maintenance));
  }, [gasPrice, stationName, stationId, vatPercentage, settings.app_maintenance]);

  // Load Transactions with Filters
  const loadTransactions = async () => {
    setIsLoadingTxs(true);
    try {
      const filters: RefuelingFilters = {};

      if (dateFilter === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        filters.startDate = d.toISOString();
      } else if (dateFilter === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        filters.startDate = d.toISOString();
      } else if (dateFilter === 'month') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        filters.startDate = d.toISOString();
      }

      if (stationFilter !== 'ALL') filters.station_id = stationFilter;
      if (carTypeFilter !== 'ALL') filters.car_type = carTypeFilter;
      if (paymentFilter !== 'ALL') filters.payment_method = paymentFilter;
      if (searchPlate.trim()) filters.car_plate = searchPlate.trim();

      const data = await fetchRefuelingTransactionsFromDb(filters, 'admin');
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load refueling transactions:', err);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [dateFilter, stationFilter, carTypeFilter, paymentFilter, searchPlate]);

  // Aggregated KPIs
  const metrics = useMemo(() => {
    const totalCount = transactions.length;
    const totalM3 = transactions.reduce((sum, t) => sum + (t.cubic_meters || 0), 0);
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const avgPerCar = totalCount > 0 ? totalM3 / totalCount : 0;

    return {
      totalCount,
      totalM3: Number(totalM3.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgPerCar: Number(avgPerCar.toFixed(2)),
    };
  }, [transactions]);

  // Handle Saving Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);

    try {
      await updateSetting('gas_cubic_price', Number(editPrice), 'admin-user');
      await updateSetting('station_name', editStationName.trim(), 'admin-user');
      await updateSetting('station_id', editStationId.trim(), 'admin-user');
      await updateSetting('vat_percentage', Number(editVat), 'admin-user');
      await updateSetting('app_maintenance', Boolean(isMaintenance), 'admin-user');

      setSettingsSaveSuccess(true);
      setTimeout(() => setSettingsSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (transactions.length === 0) return;

    const dataToExport = transactions.map((t, idx) => ({
      'م': idx + 1,
      'رقم الحركة': t.id,
      'التاريخ والوقت': new Date(t.created_at).toLocaleString('ar-EG'),
      'المحطة': t.station_name || t.station_id,
      'اسم الفني': t.technician_name || t.technician_id,
      'لوحة السيارة': t.car_plate,
      'فئة المركبة': t.car_type,
      'قراءة البداية': t.meter_start,
      'قراءة النهاية': t.meter_end,
      'الكمية (م³)': t.cubic_meters,
      'سعر المتر (ج.م)': t.unit_price,
      'الإجمالي (ج.م)': t.total_amount,
      'طريقة الدفع': t.payment_method,
      'ملاحظات': t.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'حركات التموين');
    XLSX.writeFile(workbook, `سجل_تموين_كارجاس_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ['ID,Date,Station,Technician,CarPlate,CarType,MeterStart,MeterEnd,CubicMeters,UnitPrice,TotalAmount,PaymentMethod'];
    const rows = transactions.map((t) =>
      [
        t.id,
        `"${new Date(t.created_at).toISOString()}"`,
        `"${t.station_id}"`,
        `"${t.technician_name || t.technician_id}"`,
        `"${t.car_plate}"`,
        `"${t.car_type}"`,
        t.meter_start,
        t.meter_end,
        t.cubic_meters,
        t.unit_price,
        t.total_amount,
        `"${t.payment_method}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cargas_refueling_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy SQL script
  const handleCopySql = () => {
    navigator.clipboard.writeText(FULL_SUPABASE_SQL_SCRIPT);
    setIsSqlCopied(true);
    setTimeout(() => setIsSqlCopied(false), 2500);
  };

  // Connect Supabase
  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupa(true);
    setSupaStatusMessage(null);

    try {
      const res = await configureSupabase(supaUrlInput.trim(), supaKeyInput.trim());
      setSupaStatusMessage({ text: res.message, success: res.success });
      if (res.success) {
        await loadTransactions();
      }
    } catch (err: any) {
      setSupaStatusMessage({ text: err.message || 'فشل الاتصال', success: false });
    } finally {
      setIsTestingSupa(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Subtabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
                منظومة إدارة المحطات والأسعار المركزية
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              إدارة الإعدادات الدائمة (system_settings) والتقارير الحية لحركات التموين (refueling_transactions) مع أمان RLS.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveSection('reports')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeSection === 'reports'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>التقارير الحية والعمليات</span>
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeSection === 'settings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>إعدادات النظام والأسعار</span>
            </button>

            <button
              onClick={() => setActiveSection('sql_architecture')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeSection === 'sql_architecture'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>معمارية Supabase & RLS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. REPORTS & LIVE OPERATIONS SECTION */}
      {/* ===================================================================== */}
      {activeSection === 'reports' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between opacity-80 text-xs mb-1">
                <span>إجمالي كمية الغاز</span>
                <Fuel className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black font-mono mt-1">{metrics.totalM3}</div>
              <p className="text-[11px] opacity-80 mt-1">متر مكعب (م³)</p>
            </div>

            <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between opacity-80 text-xs mb-1">
                <span>إجمالي الإيرادات المحصلة</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black font-mono mt-1">{metrics.totalRevenue}</div>
              <p className="text-[11px] opacity-80 mt-1">{currency} (شامل القيمة الحالية)</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>عدد العمليات المسجلة</span>
                <Car className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1">
                {metrics.totalCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">سيارة تم تموينها</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>متوسط استهلاك التفويلة</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1">
                {metrics.avgPerCar}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">م³ لكل سيارة</p>
            </div>
          </div>

          {/* Filter Bar & Export Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                  تصفية حركات التموين:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  disabled={transactions.length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>تصدير إكسيل (XLSX)</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  disabled={transactions.length === 0}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة التقرير</span>
                </button>
                <button
                  onClick={loadTransactions}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 dark:border-slate-700"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTxs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {/* Date Filter */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">الفترة الزمنية</label>
                <select
                  value={dateFilter}
                  onChange={(e: any) => setDateFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="today">اليوم الحالي (الوردية الحالية)</option>
                  <option value="week">آخر 7 أيام</option>
                  <option value="month">آخر 30 يوماً</option>
                  <option value="all">كافة العمليات المسجلة</option>
                </select>
              </div>

              {/* Vehicle Type Filter */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">فئة المركبة</label>
                <select
                  value={carTypeFilter}
                  onChange={(e) => setCarTypeFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">جميع فئات المركبات</option>
                  <option value="ملاكي">ملاكي</option>
                  <option value="تاكسي أبيض">تاكسي أبيض</option>
                  <option value="ميكروباص">ميكروباص</option>
                  <option value="نقل خفيف">نقل خفيف / جامبو</option>
                  <option value="أتوبيس">أتوبيس / ميني باص</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">طريقة السداد</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">كافة طرق الدفع</option>
                  <option value="cash">نقدي (كاش)</option>
                  <option value="e_wallet">محفظة إلكترونية</option>
                  <option value="visa">فيزا / بطاقة بنكية</option>
                  <option value="fleet_card">كارت شركة / أسطول</option>
                </select>
              </div>

              {/* Station Filter */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">المحطة</label>
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">كافة المحطات التابعة</option>
                  <option value="CARGAS-CAI-01">محطة كارجاس - النيل (CARGAS-CAI-01)</option>
                  <option value="CARGAS-GZ-02">محطة كارجاس - فيصل (CARGAS-GZ-02)</option>
                  <option value="CARGAS-ALX-01">محطة كارجاس - الإسكندرية (CARGAS-ALX-01)</option>
                </select>
              </div>

              {/* Search by Car Plate */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">بحث برقم اللوحة</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value)}
                    placeholder="ابحث باللوحة..."
                    className="w-full p-2 pr-2 pl-7 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Transactions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                جدول الحركات التفصيلي ({transactions.length} حركة)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Car className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-semibold">لا توجد حركات تموين مطابقة للتصفية المحددة.</p>
                <p className="text-xs mt-1">قم بتغيير خيارات التصفية أو تسجيل حركات جديدة عبر واجهة الفني.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                    <tr>
                      <th className="py-3 px-4">رقم الحركة</th>
                      <th className="py-3 px-4">التاريخ والوقت</th>
                      <th className="py-3 px-4">المحطة</th>
                      <th className="py-3 px-4">الفني المسؤول</th>
                      <th className="py-3 px-4">لوحة السيارة</th>
                      <th className="py-3 px-4">النوع</th>
                      <th className="py-3 px-4">قراءة البداية</th>
                      <th className="py-3 px-4">قراءة النهاية</th>
                      <th className="py-3 px-4">الكمية (م³)</th>
                      <th className="py-3 px-4">سعر المتر</th>
                      <th className="py-3 px-4">الإجمالي</th>
                      <th className="py-3 px-4">طريقة الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {t.id.slice(0, 10)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {new Date(t.created_at).toLocaleString('ar-EG', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                          {t.station_name || t.station_id}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {t.technician_name || t.technician_id}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {t.car_plate}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {t.car_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{t.meter_start}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{t.meter_end}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.cubic_meters} م³
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {t.unit_price} ج
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-amber-600 dark:text-amber-400">
                          {t.total_amount} {currency}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {t.payment_method === 'cash'
                              ? 'نقدي'
                              : t.payment_method === 'e_wallet'
                              ? 'محفظة'
                              : t.payment_method === 'visa'
                              ? 'فيزا'
                              : 'كارت شركة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. GENERAL SYSTEM SETTINGS MANAGER (system_settings) */}
      {/* ===================================================================== */}
      {activeSection === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                إدارة الإعدادات العامة للمنظومة (جدول system_settings)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                جميع التعديلات هنا تُحفظ بشكل دائم في قاعدة البيانات وتنعكس فوراً (Optimistic UI) على شاشات كافة الفنيين دون الحاجة لإعادة التشغيل.
              </p>
            </div>
            <div className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-mono">
              صلاحية: المدير العام (Admin)
            </div>
          </div>

          {settingsSaveSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>تم حفظ وتحديث الإعدادات بنجاح وترحيلها لجدول system_settings بقاعدة البيانات!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gas Cubic Price (Highlight) */}
              <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Fuel className="w-4 h-4" />
                    <span>سعر متر الغاز الطبيعي (gas_cubic_price)</span>
                  </label>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                    حقل رئيسي
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  السعر المعتمد الذي يُسحب آلياً وبشكل محمي (Read-only) في بوابة الفني لحساب قيمة التفويلة.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-emerald-400 rounded-xl font-mono font-black text-lg text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{currency}</span>
                </div>
              </div>

              {/* Station Name */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                  اسم المحطة النموذجية (station_name)
                </label>
                <p className="text-xs text-slate-500">
                  الاسم الظاهر في الترويسة، وبوابة الفني، وعلى إيصالات التموين المطبوعة للعملاء.
                </p>
                <input
                  type="text"
                  value={editStationName}
                  onChange={(e) => setEditStationName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none"
                  required
                />
              </div>

              {/* Station ID Code */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                  كود المحطة الموحد (station_id)
                </label>
                <p className="text-xs text-slate-500">
                  الكود الإداري الذي يُربط به جدول عمليات التموين refueling_transactions.
                </p>
                <input
                  type="text"
                  value={editStationId}
                  onChange={(e) => setEditStationId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100 outline-none"
                  required
                />
              </div>
            </div>

            {/* Operational Toggles */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                ضوابط التشغيل والصيانة (Operational Controls)
              </h4>
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                    وضع صيانة المنظومة (app_maintenance)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    عند التفعيل يُعرض إشعار صيانة دورية للمستخدمين ويُقيد التسجيل مؤقتاً.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMaintenance}
                    onChange={(e) => setIsMaintenance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>

            {/* Submit Save */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 text-sm transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'جارٍ الحفظ والترحيل...' : 'حفظ التعديلات في system_settings'}</span>
              </button>
              <button
                type="button"
                onClick={refreshSettings}
                className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold"
              >
                إعادة تحميل الإعدادات من السيرفر
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SUPABASE ARCHITECTURE, SQL SCRIPT & RLS SETUP */}
      {/* ===================================================================== */}
      {activeSection === 'sql_architecture' && (
        <div className="space-y-6">
          {/* Live Supabase Connection Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSupabaseConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    حالة الربط بمشروع Supabase السحابي
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${
                      isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-xs text-slate-500">
                      {isSupabaseConfigured
                        ? `متصل بمشروع Supabase: ${supabaseUrl.slice(0, 30)}...`
                        : 'يعمل حالياً بنظام المحاكاة المحلية الموثوقة (LocalStorage Emulator + RLS Ready)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supabase Connection Form */}
            <form onSubmit={handleConnectSupabase} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supaUrlInput}
                    onChange={(e) => setSupaUrlInput(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={supaKeyInput}
                    onChange={(e) => setSupaKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              {supaStatusMessage && (
                <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  supaStatusMessage.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}>
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{supaStatusMessage.text}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isTestingSupa}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isTestingSupa ? 'جارٍ الفحص والاتصال...' : 'حفظ واختبار الاتصال بـ Supabase'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Full Production SQL Script Card */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>سكربت SQL الكامل لإنشاء الجداول وسياسات الأمان (RLS) وحقن الصلاحيات دفعة واحدة</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  قم بنسخ هذا الكود وتشغيله في Supabase SQL Editor لإنشاء جداول system_settings و refueling_transactions فوراً.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                {isSqlCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ للحافظة!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ سكربت SQL كاملاً</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed bg-slate-950 text-emerald-300">
              <pre>{FULL_SUPABASE_SQL_SCRIPT}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
