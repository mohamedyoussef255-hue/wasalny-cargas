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
  StationDailySalesRecord,
  SalesSystemStage,
  TechnicianCrewMember,
  TechnicianIncentiveConfig,
} from '../types';
import {
  saveStationLocations,
  saveAppConfig,
  getStationLocations,
  getRedemptions,
  getStationDailySales,
  saveStationDailySales,
  recordStationDailySale,
  getStationCrew,
  saveStationCrew,
  getTechnicianIncentiveConfig,
  saveTechnicianIncentiveConfig,
  calculateTechnicianFinancialIncentive,
  getMasterStationMapLogo,
  getMapFacilityFilters,
  recalculateSystemForFinancialPointCost,
} from '../services/storageService';
import { syncCurrentStateToCodebase } from '../services/codebaseSyncService';

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
    'sales_overview' | 'matrix' | 'daily_sales_movement' | 'redemptions_gifts' | 'live_audit' | 'security_pin' | 'technician_incentives'
  >('daily_sales_movement');

  // Technician Incentives & Rating Translation State
  const [crewList, setCrewList] = useState<TechnicianCrewMember[]>(() => getStationCrew());
  const [incentiveConfig, setIncentiveConfig] = useState<TechnicianIncentiveConfig>(() =>
    config.technicianIncentiveConfig || getTechnicianIncentiveConfig()
  );
  const [isSavingIncentives, setIsSavingIncentives] = useState(false);
  const [incentiveSaveSuccess, setIncentiveSaveSuccess] = useState(false);

  // Daily Station Sales Movement State (حركة المبيعات اليومية للمحطات)
  const [dailySalesRecords, setDailySalesRecords] = useState<StationDailySalesRecord[]>(() => {
    const existing = getStationDailySales();
    if (existing.length > 0) return existing;
    // Seed initial realistic sales movement for Cargas stations
    const sampleRecord: StationDailySalesRecord = {
      id: 'DSR-' + Date.now(),
      stationId: stations[0]?.id || 'st-1',
      stationName: stations[0]?.name || 'محطة ألماظة - طريق النصر',
      stationCode: stations[0]?.code || 'CAIRO-01',
      salesDate: new Date().toISOString().slice(0, 10),
      shiftType: 'morning',
      supervisorName: 'م. أحمد الشناوي',
      systemStage: 'stage1_manual',
      manualDetails: {
        startMeterReading: 124500,
        endMeterReading: 128950,
        gasVolumeSoldM3: 4450,
        gasPricePerMeter: config.gasPricePerMeter || 13,
        gasRevenueEgp: 4450 * (config.gasPricePerMeter || 13),
        oilBottlesSold: 18,
        oilRevenueEgp: 6300,
        cashPaymentEgp: 41250,
        visaCardPaymentEgp: 14600,
        fleetCardPaymentEgp: 8300,
        totalSalesEgp: 4450 * (config.gasPricePerMeter || 13) + 6300,
        cashBankDeposited: true,
        depositSlipNumber: 'DEP-883491-NBE',
        shiftDiscrepancyEgp: 0,
        supervisorSignature: 'أحمد الشناوي - معتمد',
        notes: 'انتظام كامل في ضغط الغاز وتوريد النقدية للبنك الأهلي المصري',
      },
      status: 'audited_by_finance',
      auditedByFinanceAt: new Date().toISOString(),
      auditedByFinanceName: 'المراجع المالي المركزي',
      createdAt: new Date().toISOString(),
    };
    saveStationDailySales([sampleRecord]);
    return [sampleRecord];
  });

  // Daily Sales Form State
  const [formStationId, setFormStationId] = useState<string>(stations[0]?.id || '');
  const [formSalesDate, setFormSalesDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formShiftType, setFormShiftType] = useState<'morning' | 'evening' | 'night' | 'full_day'>('morning');
  const [formSupervisorName, setFormSupervisorName] = useState<string>('مشرف الوردية');
  const [formStage, setFormStage] = useState<SalesSystemStage>('stage1_manual');
  
  // Manual Form Inputs
  const [manualStartMeter, setManualStartMeter] = useState<number>(100000);
  const [manualEndMeter, setManualEndMeter] = useState<number>(103500);
  const [manualOilBottles, setManualOilBottles] = useState<number>(12);
  const [manualOilRevenue, setManualOilRevenue] = useState<number>(4200);
  const [manualCashEgp, setManualCashEgp] = useState<number>(35000);
  const [manualVisaEgp, setManualVisaEgp] = useState<number>(10500);
  const [manualFleetEgp, setManualFleetEgp] = useState<number>(4200);
  const [manualDepositSlip, setManualDepositSlip] = useState<string>('DEP-10294-BDC');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [isSalesSaveSuccess, setIsSalesSaveSuccess] = useState<boolean>(false);

  // SCADA Telemetry Form Inputs
  const [scadaDispenserId, setScadaDispenserId] = useState<string>('DISP-01');
  const [scadaFlowM3, setScadaFlowM3] = useState<number>(4820);
  const [scadaInletBar, setScadaInletBar] = useState<number>(220);
  const [scadaCompressorHours, setScadaCompressorHours] = useState<number>(8.5);
  const [scadaTankBar, setScadaTankBar] = useState<number>(245);
  const [scadaVarianceM3, setScadaVarianceM3] = useState<number>(0);

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
  const [bulkCostPerPoint, setBulkCostPerPoint] = useState<number>(() => config.loyaltyCostModel?.costPerPointEgp ?? 0.15);
  const [bulkPointsRate, setBulkPointsRate] = useState<number>(() => config.pointsPerMeter || 1.0);
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

  const defaultCost = config.loyaltyCostModel?.costPerPointEgp ?? 0.15;

  // Total Points Financial Liability = sum(points * stationCostPerPoint)
  const totalLiabilityEgp = transactions.reduce((acc, t) => {
    const cost = t.stationCostPerPointEgp ?? defaultCost;
    return acc + (t.pointsEarned || 0) * cost;
  }, 0);

  // Total Redemptions Metrics (استبدال النقاط والهدايا)
  const totalRedemptionsCount = redemptionsList.length;
  const totalPointsSpentOnRewards = redemptionsList.reduce((acc, r) => acc + (r.pointsSpent || 0), 0);
  const totalRewardsEgpValue = redemptionsList.reduce((acc, r) => acc + (r.calculatedEgpValue || 0), 0);

  const weightedCostPerPoint =
    totalPointsEarned > 0 ? totalLiabilityEgp / totalPointsEarned : defaultCost;
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

  // Bulk Apply for Whole Region OR All Stations & Generalize Across Entire App
  const handleApplyBulkRegion = () => {
    const isAll = bulkRegion === 'all';
    const costValue = Number(bulkCostPerPoint) || 0.15;

    // اعتماد وتعميم التكلفة على بنك الهدايا والمكافآت (100+ هدية) واستوديو الأفكار وحاسبة النقاط والعروض
    const { config: syncedCfg } = recalculateSystemForFinancialPointCost(costValue);

    const updated = stationList.map((st) => {
      const stRegion = st.region || st.city || 'القاهرة الكبرى';
      if (isAll || stRegion === bulkRegion) {
        return {
          ...st,
          costPerPointEgp: costValue,
          pointsAwardRatePerMeter: Number(bulkPointsRate),
          isLoyaltyProgramActive: bulkActiveStatus,
          financialApprovedByAdmin: true,
        };
      }
      return st;
    });

    setStationList(updated);
    onUpdateStations(updated);
    saveStationLocations(updated);

    // تعميم النسبة وتكلفة النقطة التي حددتها الإدارة المالية على كامل إعدادات المنظومة
    const updatedConfig: AppConfig = {
      ...syncedCfg,
      pointsPerMeter: Number(bulkPointsRate),
      loyaltyCostModel: {
        ...syncedCfg.loyaltyCostModel,
        costPerPointEgp: costValue,
        officialCostPerPoint: costValue,
      },
      pointsFormula: {
        ...(config.pointsFormula || {}),
        ratioMode: syncedCfg.pointsFormula?.ratioMode ?? config.pointsFormula?.ratioMode ?? 'points_per_meter',
        metersPerPointUnit: syncedCfg.pointsFormula?.metersPerPointUnit ?? config.pointsFormula?.metersPerPointUnit ?? 5,
        basePointsPerMeter: syncedCfg.pointsFormula?.basePointsPerMeter ?? config.pointsFormula?.basePointsPerMeter ?? 1,
        gasPricePerMeter: syncedCfg.pointsFormula?.gasPricePerMeter ?? config.pointsFormula?.gasPricePerMeter ?? 13,
        calculationBasis: syncedCfg.pointsFormula?.calculationBasis ?? config.pointsFormula?.calculationBasis ?? 'meters',
        tierBronzeMultiplier: syncedCfg.pointsFormula?.tierBronzeMultiplier ?? config.pointsFormula?.tierBronzeMultiplier ?? 1.0,
        tierSilverMultiplier: syncedCfg.pointsFormula?.tierSilverMultiplier ?? config.pointsFormula?.tierSilverMultiplier ?? 1.5,
        tierGoldMultiplier: syncedCfg.pointsFormula?.tierGoldMultiplier ?? config.pointsFormula?.tierGoldMultiplier ?? 2.0,
        volumeBonusThresholdM3: syncedCfg.pointsFormula?.volumeBonusThresholdM3 ?? config.pointsFormula?.volumeBonusThresholdM3 ?? 30,
        volumeBonusPoints: syncedCfg.pointsFormula?.volumeBonusPoints ?? config.pointsFormula?.volumeBonusPoints ?? 10,
        technicianWelcomePointsPerShift: syncedCfg.pointsFormula?.technicianWelcomePointsPerShift ?? config.pointsFormula?.technicianWelcomePointsPerShift ?? 350,
        pointsToEgpRedemptionRatio: costValue,
      },
    };
    onUpdateConfig(updatedConfig);
    saveAppConfig(updatedConfig);

    // مزامنة فورية في الخلفية مع ملفات كود المشروع على القرص لاعتمادها لـ GitHub و Vercel
    syncCurrentStateToCodebase({
      navStations: getStationLocations().map((s) => ({
        ...s,
        cng: true,
      })) as any,
      stationLocations: updated,
      config: updatedConfig,
      crew: crewList,
      mapFilters: getMapFacilityFilters(),
      logoUrl: getMasterStationMapLogo() || config.stationLogoUrl,
    }).catch((err) => console.warn('Financial codebase sync notice:', err));

    setIsBulkSuccess(true);
    setTimeout(() => setIsBulkSuccess(false), 5000);
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

  // Save Daily Sales Movement Entry (يدوي المرحلة 1 أو سكادا المرحلة 2)
  const handleSaveDailySales = (e: React.FormEvent) => {
    e.preventDefault();
    const st = stationList.find((s) => s.id === formStationId) || stationList[0];
    if (!st) return;

    const gasPrice = config.gasPricePerMeter || 13;
    let newRecord: StationDailySalesRecord;

    if (formStage === 'stage1_manual') {
      const gasVol = Math.max(0, manualEndMeter - manualStartMeter);
      const gasRev = gasVol * gasPrice;
      const totalRev = gasRev + Number(manualOilRevenue);
      const totalPaid = Number(manualCashEgp) + Number(manualVisaEgp) + Number(manualFleetEgp);
      const discrepancy = totalPaid - totalRev;

      newRecord = {
        id: 'DSR-' + Date.now(),
        stationId: st.id,
        stationName: st.name,
        stationCode: st.code,
        salesDate: formSalesDate,
        shiftType: formShiftType,
        supervisorName: formSupervisorName || 'مشرف الوردية',
        systemStage: 'stage1_manual',
        manualDetails: {
          startMeterReading: Number(manualStartMeter),
          endMeterReading: Number(manualEndMeter),
          gasVolumeSoldM3: gasVol,
          gasPricePerMeter: gasPrice,
          gasRevenueEgp: gasRev,
          oilBottlesSold: Number(manualOilBottles),
          oilRevenueEgp: Number(manualOilRevenue),
          cashPaymentEgp: Number(manualCashEgp),
          visaCardPaymentEgp: Number(manualVisaEgp),
          fleetCardPaymentEgp: Number(manualFleetEgp),
          totalSalesEgp: totalRev,
          cashBankDeposited: !!manualDepositSlip,
          depositSlipNumber: manualDepositSlip,
          shiftDiscrepancyEgp: discrepancy,
          supervisorSignature: formSupervisorName,
          notes: manualNotes,
        },
        status: 'audited_by_finance',
        auditedByFinanceAt: new Date().toISOString(),
        auditedByFinanceName: 'المراجع المالي المركزي',
        createdAt: new Date().toISOString(),
      };
    } else {
      const scadaRev = Number(scadaFlowM3) * gasPrice;
      newRecord = {
        id: 'DSR-' + Date.now(),
        stationId: st.id,
        stationName: st.name,
        stationCode: st.code,
        salesDate: formSalesDate,
        shiftType: formShiftType,
        supervisorName: formSupervisorName || 'مشرف الربط الآلي',
        systemStage: 'stage2_scada',
        scadaDetails: {
          dispenserId: scadaDispenserId,
          totalFlowAccumulatedM3: Number(scadaFlowM3),
          averageInletPressureBar: Number(scadaInletBar),
          compressorRunHours: Number(scadaCompressorHours),
          liveTankPressureBar: Number(scadaTankBar),
          scadaCalculatedRevenueEgp: scadaRev,
          autoReconciledStatus: Number(scadaVarianceM3) === 0 ? 'matched' : 'variance_detected',
          varianceVolumeM3: Number(scadaVarianceM3),
          telemetryTimestamp: new Date().toISOString(),
          gatewayStatus: 'online',
        },
        status: 'audited_by_finance',
        auditedByFinanceAt: new Date().toISOString(),
        auditedByFinanceName: 'نظام سكادا المركزي - كارجاس',
        createdAt: new Date().toISOString(),
      };
    }

    recordStationDailySale(newRecord);
    setDailySalesRecords(getStationDailySales());
    setIsSalesSaveSuccess(true);
    setTimeout(() => setIsSalesSaveSuccess(false), 4000);
  };

  // Export Daily Sales Movement to CSV
  const handleExportDailySales = () => {
    const headers = [
      'كود الحركة',
      'التاريخ',
      'المحطة',
      'الوردية',
      'المرحلة والنظام',
      'المشرف المسئول',
      'كمية الغاز (م³)',
      'إيراد الغاز (ج)',
      'إيراد الزيوت (ج)',
      'إجمالي المبيعات (ج)',
      'تحصيل كاش (ج)',
      'تحصيل فيزا (ج)',
      'تحصيل أسطول (ج)',
      'إيصال الإيداع البنكي',
      'الحالة',
    ];

    const rows = dailySalesRecords.map((r) => {
      const gasVol = r.systemStage === 'stage1_manual' ? r.manualDetails?.gasVolumeSoldM3 : r.scadaDetails?.totalFlowAccumulatedM3;
      const gasRev = r.systemStage === 'stage1_manual' ? r.manualDetails?.gasRevenueEgp : r.scadaDetails?.scadaCalculatedRevenueEgp;
      const oilRev = r.manualDetails?.oilRevenueEgp || 0;
      const totalRev = r.manualDetails?.totalSalesEgp || gasRev;
      return [
        r.id,
        r.salesDate,
        `"${r.stationName}"`,
        r.shiftType === 'morning' ? 'صباحية' : r.shiftType === 'evening' ? 'مسائية' : r.shiftType === 'night' ? 'ليلية' : 'يوم كامل',
        r.systemStage === 'stage1_manual' ? 'المرحلة 1: يدوي' : 'المرحلة 2: سكادا آلي',
        `"${r.supervisorName}"`,
        gasVol || 0,
        gasRev || 0,
        oilRev,
        totalRev || 0,
        r.manualDetails?.cashPaymentEgp || 0,
        r.manualDetails?.visaCardPaymentEgp || 0,
        r.manualDetails?.fleetCardPaymentEgp || 0,
        `"${r.manualDetails?.depositSlipNumber || '-'}"`,
        r.status === 'audited_by_finance' ? 'معتمد مالياً' : 'قيد المراجعة',
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `حركة_المبيعات_اليومية_كارجاس_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
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

    const rows = transactions.map((tx) => {
      const pointCost = tx.stationCostPerPointEgp ?? defaultCost;
      return [
        tx.receiptNumber,
        new Date(tx.timestamp).toLocaleString('ar-EG'),
        `"${tx.stationName}"`,
        `"${tx.regionName || 'القاهرة الكبرى'}"`,
        tx.metersQuantity,
        tx.pricePerMeter,
        tx.totalAmountEgp,
        tx.pointsEarned,
        pointCost,
        (tx.financialLiabilityEgp ?? (tx.pointsEarned * pointCost)).toFixed(2),
        `"${tx.driverName}"`,
        `"${tx.carPlate}"`,
      ];
    });

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
    const costPerPoint = st.costPerPointEgp ?? defaultCost;
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
            onClick={() => setActiveSubTab('daily_sales_movement')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'daily_sales_movement'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
            <span>حركة المبيعات اليومية (المرحلة 1: يدوي | المرحلة 2: سكادا) ({dailySalesRecords.length})</span>
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
            onClick={() => setActiveSubTab('technician_incentives')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'technician_incentives'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>حوافز ومكافآت الفنيين وتقييمات العملاء 🎖️ ({crewList.length})</span>
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

      {/* ========================================================================= */}
      {/* 3.1 Tab: Daily Sales Movement Registration (تسجيل حركة المبيعات اليومية) */}
      {/* يدعم النظامين: المرحلة الأولى (النظام اليدوي) والمرحلة الثانية (نظام سكادا) */}
      {/* ========================================================================= */}
      {activeSubTab === 'daily_sales_movement' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Executive Daily Sales KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold block">إجمالي الورديات</span>
              <span className="text-lg font-black text-slate-900 font-mono">{dailySalesRecords.length}</span>
              <span className="text-[10px] text-slate-400 block">حركة مسجلة</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold block">إجمالي كميات الغاز</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {dailySalesRecords.reduce((acc, r) => {
                  const vol = r.systemStage === 'stage1_manual' ? r.manualDetails?.gasVolumeSoldM3 : r.scadaDetails?.totalFlowAccumulatedM3;
                  return acc + (vol || 0);
                }, 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 block">متر مكعب m³</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold block">إجمالي المبيعات</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {dailySalesRecords.reduce((acc, r) => {
                  const rev = r.systemStage === 'stage1_manual' ? r.manualDetails?.totalSalesEgp : r.scadaDetails?.scadaCalculatedRevenueEgp;
                  return acc + (rev || 0);
                }, 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">جنيه مصري</span>
            </div>

            <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-[11px] text-blue-800 font-bold block">المرحلة 1: النظام اليدوي</span>
              <span className="text-lg font-black text-blue-900 font-mono">
                {dailySalesRecords.filter((r) => r.systemStage === 'stage1_manual').length}
              </span>
              <span className="text-[10px] text-blue-700 block">وردية مدخلة يدوياً</span>
            </div>

            <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 shadow-xs">
              <span className="text-[11px] text-purple-800 font-bold block">المرحلة 2: نظام سكادا</span>
              <span className="text-lg font-black text-purple-900 font-mono">
                {dailySalesRecords.filter((r) => r.systemStage === 'stage2_scada').length}
              </span>
              <span className="text-[10px] text-purple-700 block">ربط حساسات وتدفق رقمي</span>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] text-emerald-800 font-bold block">التوريدات البنكية</span>
              <span className="text-lg font-black text-emerald-900 font-mono">
                {dailySalesRecords.filter((r) => r.manualDetails?.cashBankDeposited).length}
              </span>
              <span className="text-[10px] text-emerald-700 block">مطابقة بإيصال بنكي ✓</span>
            </div>
          </div>

          {/* Registration Form: Stage 1 Manual vs Stage 2 SCADA */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>تسجيل حركة المبيعات اليومية لمحطات كارجاس</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  نموذج مالي متكامل يدعم الانتقال المؤسسي بين المرحلة الأولى (النظام اليدوي) والمرحلة الثانية (نظام سكادا الآلي)
                </p>
              </div>

              {/* Stage Switcher Buttons */}
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 self-start sm:self-auto border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormStage('stage1_manual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    formStage === 'stage1_manual'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📝 المرحلة الأولى: النظام اليدوي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormStage('stage2_scada')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    formStage === 'stage2_scada'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>⚡ المرحلة الثانية: نظام سكادا SCADA</span>
                </button>
              </div>
            </div>

            {/* Daily Sales Entry Form */}
            <form onSubmit={handleSaveDailySales} className="space-y-4">
              {/* General Station & Shift Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المحطة المستهدفة:</label>
                  <select
                    value={formStationId}
                    onChange={(e) => setFormStationId(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  >
                    {stationList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code}) - {st.region || st.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">تاريخ المبيعات:</label>
                  <input
                    type="date"
                    value={formSalesDate}
                    onChange={(e) => setFormSalesDate(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الوردية:</label>
                  <select
                    value={formShiftType}
                    onChange={(e) => setFormShiftType(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  >
                    <option value="morning">الوردية الصباحية (07:00 ص - 03:00 م)</option>
                    <option value="evening">الوردية المسائية (03:00 م - 11:00 م)</option>
                    <option value="night">الوردية الليلية (11:00 م - 07:00 ص)</option>
                    <option value="full_day">إجمالي اليوم بالكامل (24 ساعة)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">مشرف المحطة / المسؤول:</label>
                  <input
                    type="text"
                    value={formSupervisorName}
                    onChange={(e) => setFormSupervisorName(e.target.value)}
                    placeholder="اسم المشرف أو المسؤول المالي"
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* ======================================================= */}
              {/* STAGE 1: MANUAL SYSTEM SPECIFIC FORM FIELDS (النظام اليدوي) */}
              {/* ======================================================= */}
              {formStage === 'stage1_manual' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200/50 pb-2">
                      <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                        <span>📝</span>
                        <span>بيانات قراءات العدادات ومبيعات الغاز الطبيعي (م³):</span>
                      </span>
                      <span className="text-[11px] font-bold text-blue-700">سعر المتر المعتمد: {config.gasPricePerMeter} ج</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">قراءة عداد البدء:</label>
                        <input
                          type="number"
                          value={manualStartMeter}
                          onChange={(e) => setManualStartMeter(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">قراءة عداد النهاية:</label>
                        <input
                          type="number"
                          value={manualEndMeter}
                          onChange={(e) => setManualEndMeter(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">إجمالي الغاز المباع (م³):</label>
                        <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-black text-xs text-emerald-800">
                          {Math.max(0, manualEndMeter - manualStartMeter).toLocaleString()} م³
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">إيراد الغاز المستحق (ج):</label>
                        <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-black text-xs text-slate-900">
                          {(Math.max(0, manualEndMeter - manualStartMeter) * (config.gasPricePerMeter || 13)).toLocaleString()} ج
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lube Oils & Breakdown of Payment Collections */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>🛢️</span>
                        <span>مبيعات الزيوت وطرق التحصيل (نقدية + إلكتروني + أسطول):</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-700">
                        إجمالي المبيعات المطلوبة: {(Math.max(0, manualEndMeter - manualStartMeter) * (config.gasPricePerMeter || 13) + Number(manualOilRevenue)).toLocaleString()} ج
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">عبوات زيوت مباعة:</label>
                        <input
                          type="number"
                          value={manualOilBottles}
                          onChange={(e) => setManualOilBottles(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">إيراد الزيوت (ج):</label>
                        <input
                          type="number"
                          value={manualOilRevenue}
                          onChange={(e) => setManualOilRevenue(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">تحصيل نقدية كاش (ج):</label>
                        <input
                          type="number"
                          value={manualCashEgp}
                          onChange={(e) => setManualCashEgp(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">تحصيل بطاقات فيزا (ج):</label>
                        <input
                          type="number"
                          value={manualVisaEgp}
                          onChange={(e) => setManualVisaEgp(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">بطاقات أسطول حكومي (ج):</label>
                        <input
                          type="number"
                          value={manualFleetEgp}
                          onChange={(e) => setManualFleetEgp(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">رقم إيصال الإيداع البنكي (قسيمة التوريد):</label>
                        <input
                          type="text"
                          value={manualDepositSlip}
                          onChange={(e) => setManualDepositSlip(e.target.value)}
                          placeholder="مثال: DEP-99382-NBE"
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">ملاحظات تسليم الوردية:</label>
                        <input
                          type="text"
                          value={manualNotes}
                          onChange={(e) => setManualNotes(e.target.value)}
                          placeholder="أي ملاحظات حول الصيانة أو الفحص أو حركة الطلمبات"
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================= */}
              {/* STAGE 2: SCADA SYSTEM SMART TELEMETRY (نظام سكادا الآلي) */}
              {/* ======================================================= */}
              {formStage === 'stage2_scada' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-purple-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-black text-purple-200">
                          نظام سكادا المركزي لكارجاس — الربط الآلي لحساسات التدفق والضغوط (IoT Telemetry)
                        </span>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        بوابة السكادا متصلة Online ⚡
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="text-[10.5px] text-purple-200 font-bold block mb-1">كود الطلمبة / الموزع:</label>
                        <input
                          type="text"
                          value={scadaDispenserId}
                          onChange={(e) => setScadaDispenserId(e.target.value)}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] text-purple-200 font-bold block mb-1">التدفق التراكمي (م³):</label>
                        <input
                          type="number"
                          value={scadaFlowM3}
                          onChange={(e) => setScadaFlowM3(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] text-purple-200 font-bold block mb-1">ضغط الدخول (Bar):</label>
                        <input
                          type="number"
                          value={scadaInletBar}
                          onChange={(e) => setScadaInletBar(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] text-purple-200 font-bold block mb-1">ساعات تشغيل الكومبريسور:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={scadaCompressorHours}
                          onChange={(e) => setScadaCompressorHours(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] text-purple-200 font-bold block mb-1">ضغط بنك الخزانات (Bar):</label>
                        <input
                          type="number"
                          value={scadaTankBar}
                          onChange={(e) => setScadaTankBar(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] text-purple-200 font-bold block mb-1">انحراف التسوية (م³):</label>
                        <input
                          type="number"
                          value={scadaVarianceM3}
                          onChange={(e) => setScadaVarianceM3(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                      <span className="text-purple-300">
                        الإيراد الآلي المحتسب بالسكادا: <span className="font-mono font-black text-white">{(scadaFlowM3 * (config.gasPricePerMeter || 13)).toLocaleString()} ج</span>
                      </span>
                      <span className="text-emerald-300 font-bold">
                        حالة المطابقة: {Number(scadaVarianceM3) === 0 ? 'مطابقة تامة 100% ✓' : 'يوجد انحراف حجمي يحتاج مراجعة ⚠️'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Notification Alert */}
              {isSalesSaveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✅ تم حفظ وتوثيق حركة المبيعات اليومية للمحطة في قاعدة البيانات بنجاح!</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs px-6 py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وتوثيق حركة المبيعات في سجل المالية 💾</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDailySales}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>تصدير شيت المبيعات اليومية Excel/CSV 📥</span>
                </button>
              </div>
            </form>
          </div>

          {/* Historical Daily Sales Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-3 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  سجل حركات المبيعات اليومية المعتمدة للمحطات ({dailySalesRecords.length})
                </h4>
                <p className="text-xs text-slate-500">
                  بيانات الورديات وقراءات العدادات ونظام التحصيل ومطابقة السكادا
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportDailySales}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1.5 rounded-xl border border-emerald-300 transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>تصدير السجل الكامل ({dailySalesRecords.length})</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود الحركة والتاريخ</th>
                    <th className="p-3">المحطة</th>
                    <th className="p-3 text-center">الوردية</th>
                    <th className="p-3 text-center">المرحلة والنظام</th>
                    <th className="p-3 text-center">كمية الغاز (م³)</th>
                    <th className="p-3 text-center">إجمالي المبيعات (ج)</th>
                    <th className="p-3 text-center">التحصيل (كاش / فيزا / أسطول)</th>
                    <th className="p-3 text-center">الإيداع البنكي</th>
                    <th className="p-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {dailySalesRecords.map((rec) => {
                    const isManual = rec.systemStage === 'stage1_manual';
                    const gasVol = isManual ? rec.manualDetails?.gasVolumeSoldM3 : rec.scadaDetails?.totalFlowAccumulatedM3;
                    const totalRev = isManual ? rec.manualDetails?.totalSalesEgp : rec.scadaDetails?.scadaCalculatedRevenueEgp;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-900 block">{rec.id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rec.salesDate}</span>
                        </td>

                        <td className="p-3">
                          <span className="font-black text-slate-900 block">{rec.stationName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{rec.stationCode} | {rec.supervisorName}</span>
                        </td>

                        <td className="p-3 text-center">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-[10.5px] font-bold">
                            {rec.shiftType === 'morning' ? 'صباحية ☀️' : rec.shiftType === 'evening' ? 'مسائية 🌇' : rec.shiftType === 'night' ? 'ليلية 🌙' : 'يوم كامل ⏱️'}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black border ${
                              isManual
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            {isManual ? 'المرحلة 1: يدوي 📝' : 'المرحلة 2: سكادا ⚡'}
                          </span>
                        </td>

                        <td className="p-3 text-center font-mono font-black text-emerald-800">
                          {gasVol?.toLocaleString()} م³
                        </td>

                        <td className="p-3 text-center font-mono font-black text-slate-900">
                          {totalRev?.toLocaleString()} ج
                        </td>

                        <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                          {isManual ? (
                            <div>
                              <span>كاش: {rec.manualDetails?.cashPaymentEgp?.toLocaleString()} ج</span>
                              <span className="block text-[10px] text-slate-400">
                                فيزا: {rec.manualDetails?.visaCardPaymentEgp?.toLocaleString()} ج | أسطول: {rec.manualDetails?.fleetCardPaymentEgp?.toLocaleString()} ج
                              </span>
                            </div>
                          ) : (
                            <span className="text-purple-700 font-bold">مطابقة تدفق رقمي للسكادا</span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {rec.manualDetails?.depositSlipNumber ? (
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-mono font-bold">
                              {rec.manualDetails.depositSlipNumber} ✓
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">
                              {isManual ? 'قيد التوريد' : 'ربط آلي'}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300">
                            معتمد مالياً ✓
                          </span>
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
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white p-5 sm:p-6 rounded-3xl border border-teal-700/50 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BadgePercent className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-black text-sm text-white">
                    تعديل واعتماد تكلفة نقطة الولاء وتعميمها على كامل المنظومة
                  </h3>
                  <p className="text-[11px] text-teal-200 mt-0.5">
                    القرار المالي المعتمد يغير تلقائياً نقاط كافة الهدايا (100+ هدية) واستوديو الأفكار بالذكاء الاصطناعي وحاسبة النقاط
                  </p>
                </div>
              </div>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shrink-0">
                اعتماد الإدارة المالية المباشر 💼
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-[11px] text-teal-200 font-bold block mb-1">
                  المنطقة المستهدفة:
                </label>
                <select
                  value={bulkRegion}
                  onChange={(e) => setBulkRegion(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-teal-500/40 rounded-xl px-3 py-2 text-white font-bold outline-none"
                >
                  <option value="all">🌟 جميع المحطات والجمهورية بالكامل (تطبيق وتعميم على الكل)</option>
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
                      ? 'اعتماد وتعميم على المنظومة بالكامل ⚡'
                      : 'تطبيق على محطات المنطقة'}
                  </span>
                </button>
              </div>
            </div>

            {/* Live Financial Dynamic Impact Preview */}
            <div className="bg-slate-950/70 rounded-2xl p-3 border border-teal-500/30 text-xs">
              <span className="text-[10px] font-black text-teal-300 block mb-2">
                📊 الأثر المالي اللحظي لتكلفة النقطة المقترحة ({Number(bulkCostPerPoint || 0.15).toFixed(2)} ج/نقطة) على كامل التطبيق:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">جركن زيت 4L (520 ج):</span>
                  <span className="font-mono font-black text-amber-300">
                    {Math.round(520 / (Number(bulkCostPerPoint) || 0.15))} نقطة
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">فحص أسطوانة (350 ج):</span>
                  <span className="font-mono font-black text-cyan-300">
                    {Math.round(350 / (Number(bulkCostPerPoint) || 0.15))} نقطة
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">استوديو الأفكار (50 ج موازنة):</span>
                  <span className="font-mono font-black text-emerald-300">
                    {Math.round(50 / (Number(bulkCostPerPoint) || 0.15))} نقطة مكافأة
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">حاسبة ومعادلة النقاط:</span>
                  <span className="font-mono font-black text-teal-300">
                    {Number(bulkCostPerPoint || 0.15).toFixed(2)} ج/نقطة استبدال
                  </span>
                </div>
              </div>
            </div>

            {isBulkSuccess && (
              <div className="mt-3 p-3.5 bg-emerald-500/25 text-emerald-100 rounded-2xl text-xs font-bold border border-emerald-400/60 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block font-black text-white">
                    ✅ تم اعتماد وتعميم تكلفة النقطة ({bulkCostPerPoint} ج) بنجاح على مستوى المنظومة بالكامل!
                  </span>
                  <p className="text-[11px] text-emerald-200 leading-relaxed font-normal">
                    تم التحديث اللحظي لـ: بنك الهدايا والمكافآت (100+ هدية تغيرت نقاطها ديناميكياً)، استوديو توليد الأفكار بالذكاء الاصطناعي، حاسبة ومعادلة النقاط، وجميع عروض ومسابقات السائقين.
                  </p>
                </div>
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
                    const costPerPoint = st.costPerPointEgp ?? defaultCost;
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
                                  costPerPointEgp: parseFloat(e.target.value) || defaultCost,
                                })
                              }
                              className="w-18 text-center bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-slate-900 outline-none"
                            />
                            <span className="text-[10px] text-slate-500 font-bold">ج</span>
                            <button
                              type="button"
                              title="اعتماد وتعميم تكلفة هذه المحطة على بنك الهدايا واستوديو الأفكار وكامل المنظومة"
                              onClick={() => {
                                setBulkCostPerPoint(costPerPoint);
                                const { config: syncedCfg } = recalculateSystemForFinancialPointCost(costPerPoint);
                                onUpdateConfig(syncedCfg);
                                setIsBulkSuccess(true);
                                setTimeout(() => setIsBulkSuccess(false), 5000);
                              }}
                              className="p-1 rounded-md text-teal-600 hover:bg-teal-100 hover:text-teal-800 transition"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
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
                  const costPerPoint = tx.stationCostPerPointEgp ?? defaultCost;
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

      {/* 6. Tab: Technician Incentives & Rating Translation (حوافز الفنيين والترجمة المالية للنقاط وتقييمات العملاء) */}
      {activeSubTab === 'technician_incentives' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Policy Control Card */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 border border-emerald-800/60 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-emerald-900/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">
                      سياسة حوافز الفنيين وترجمة النقاط وتقييمات العملاء المعتمدة 🎖️
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      إدارة مالية ونظام عام
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    تحكم مشترك للمدير المالي ومدير النظام في قيمة النقطة بالجنيه، مكافآت حسن المعاملة، وبونص التميز الشهري
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSavingIncentives(true);
                    saveTechnicianIncentiveConfig(incentiveConfig);
                    const updatedCfg: AppConfig = {
                      ...config,
                      technicianIncentiveConfig: incentiveConfig,
                    };
                    onUpdateConfig(updatedCfg);
                    saveAppConfig(updatedCfg);

                    // مزامنة فورية في الخلفية لسياسة حوافز ونقاط ولاء العاملين في كود المشروع
                    syncCurrentStateToCodebase({
                      navStations: getStationLocations().map((s) => ({ ...s, cng: true })) as any,
                      stationLocations: stationList,
                      config: updatedCfg,
                      crew: crewList,
                      mapFilters: getMapFacilityFilters(),
                      logoUrl: getMasterStationMapLogo() || config.stationLogoUrl,
                    }).catch((err) => console.warn('Incentives codebase sync notice:', err));

                    setTimeout(() => {
                      setIsSavingIncentives(false);
                      setIncentiveSaveSuccess(true);
                      setTimeout(() => setIncentiveSaveSuccess(false), 3500);
                    }, 400);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingIncentives ? 'جاري الحفظ...' : 'حفظ واعتماد سياسة الحوافز 💾'}</span>
                </button>
              </div>
            </div>

            {incentiveSaveSuccess && (
              <div className="p-3 bg-emerald-900/60 border border-emerald-400 text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم حفظ وتحديث سياسة الحوافز المالية للفنيين بنجاح وبثها فورياً لكافة المحطات وشاشات الفنيين!</span>
              </div>
            )}

            {/* Interactive Policy Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-900/40">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  قيمة النقطة للفني بالجنيه (EGP / Point):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={incentiveConfig.pointValueEgp}
                    onChange={(e) =>
                      setIncentiveConfig({ ...incentiveConfig, pointValueEgp: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-emerald-700/50 rounded-xl p-2.5 text-sm font-mono font-black text-emerald-400 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">ج/نقطة</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">مثال: 400 نقطة = 100 جنيه</span>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-900/40">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  مكافأة تقييم 5 نجوم (معاملة ممتازة):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={incentiveConfig.rating5StarRewardEgp}
                    onChange={(e) =>
                      setIncentiveConfig({ ...incentiveConfig, rating5StarRewardEgp: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-emerald-700/50 rounded-xl p-2.5 text-sm font-mono font-black text-amber-400 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">جنية</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">مكافأة مباشرة لكل تقييم ممتاز</span>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-900/40">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  مكافأة تقييم 4 نجوم (معاملة جيدة جداً):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={incentiveConfig.rating4StarRewardEgp}
                    onChange={(e) =>
                      setIncentiveConfig({ ...incentiveConfig, rating4StarRewardEgp: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-emerald-700/50 rounded-xl p-2.5 text-sm font-mono font-black text-amber-300 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">جنية</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">مكافأة معاملة حسنة</span>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-900/40">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  بونص التميز (سفير الابتسامة 4.8+):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={incentiveConfig.highRatingMonthlyBonusEgp}
                    onChange={(e) =>
                      setIncentiveConfig({
                        ...incentiveConfig,
                        highRatingMonthlyBonusEgp: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-900 border border-emerald-700/50 rounded-xl p-2.5 text-sm font-mono font-black text-emerald-300 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">جنية</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">بونص إضافي لكبار الفنيين</span>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-900/40">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  الحد الأدنى لتفويلات الوردية:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={incentiveConfig.minFuelingsShiftQuota}
                    onChange={(e) =>
                      setIncentiveConfig({ ...incentiveConfig, minFuelingsShiftQuota: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-emerald-700/50 rounded-xl p-2.5 text-sm font-mono font-black text-slate-200 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">تفويلة</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">شرط استحقاق الحافز في الوردية</span>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-900/40">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  حد بونص حجم المبيعات (م³):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={incentiveConfig.volumeBonusThresholdM3}
                    onChange={(e) =>
                      setIncentiveConfig({
                        ...incentiveConfig,
                        volumeBonusThresholdM3: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-900 border border-emerald-700/50 rounded-xl p-2.5 text-sm font-mono font-black text-slate-200 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">م³</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">تجاوز هذا الحجم يمنح مكافأة</span>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-900/40">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  قيمة مكافأة حجم المبيعات:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={incentiveConfig.volumeBonusRewardEgp}
                    onChange={(e) =>
                      setIncentiveConfig({ ...incentiveConfig, volumeBonusRewardEgp: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-emerald-700/50 rounded-xl p-2.5 text-sm font-mono font-black text-emerald-400 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">جنية</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">تضاف للحافز الإجمالي</span>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-emerald-900/40 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-300 block mb-1">حالة تفعيل نظام الحوافز:</span>
                <label className="flex items-center gap-3 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={incentiveConfig.isEnabled}
                    onChange={(e) => setIncentiveConfig({ ...incentiveConfig, isEnabled: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded"
                  />
                  <span className="text-xs font-black text-emerald-300">
                    {incentiveConfig.isEnabled ? 'نظام الحوافز مفعل ونشط ✅' : 'نظام الحوافز معطل مؤقتاً ⏸️'}
                  </span>
                </label>
                <span className="text-[10px] text-slate-400 mt-1 block">إيقاف مؤقت أو تفعيل فوري</span>
              </div>
            </div>
          </div>

          {/* Payroll Summary Table & Audit Sheet */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>مسير كشف حوافز ومكافآت الفنيين المالي المعتمد</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    {crewList.length} فني ومشرف
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  احتساب دقيق للحوافز المالية بناء على: (النقاط × {incentiveConfig.pointValueEgp} ج) + مكافآت تقييمات العملاء وحسن المعاملة
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الكشف</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-black text-slate-600">
                    <th className="p-3.5">الفني / الوظيفة</th>
                    <th className="p-3.5">المحطة</th>
                    <th className="p-3.5 text-center">تموينات الوردية</th>
                    <th className="p-3.5 text-center">نقاط الفني</th>
                    <th className="p-3.5 text-center">حافز النقاط (ج)</th>
                    <th className="p-3.5 text-center">تقييم العملاء ⭐</th>
                    <th className="p-3.5 text-center">مكافأة التقييم (ج)</th>
                    <th className="p-3.5 text-center bg-emerald-50 text-emerald-950 font-black">
                      إجمالي الحافز المستحق (ج)
                    </th>
                    <th className="p-3.5 text-center">الاعتماد المالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {crewList.map((tech) => {
                    const calc = calculateTechnicianFinancialIncentive(tech, incentiveConfig);
                    return (
                      <tr key={tech.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5">
                          <span className="font-black text-slate-900 block">{tech.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {tech.role} • {tech.phone}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-700">{tech.stationName}</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="font-mono font-bold text-slate-900">{tech.totalFuelingsToday || 0} تفويلة</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {tech.totalMetersToday || 0} م³
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            {tech.technicianPoints || 0} نقطة
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-slate-800">
                          {calc.pointIncentiveEgp.toFixed(2)} ج
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-900 font-bold font-mono">
                            <span className="text-amber-500">★</span>
                            <span>{tech.averageBehaviorRating || tech.averageOverallRating || 4.8}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {tech.totalCustomersServed || tech.totalFuelingsToday || 0} عميل
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-amber-700">
                          +{calc.ratingBonusEgp.toFixed(2)} ج
                        </td>
                        <td className="p-3.5 text-center bg-emerald-50/60">
                          <span className="font-mono font-black text-emerald-800 text-sm">
                            {calc.totalIncentiveEgp.toFixed(2)} ج
                          </span>
                          {!calc.isEligible && (
                            <span className="text-[9px] text-rose-600 block font-bold">لم يستوفِ الكوتا</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedCrew = crewList.map((c) =>
                                c.id === tech.id ? { ...c, incentiveBonusEgp: calc.totalIncentiveEgp } : c
                              );
                              setCrewList(updatedCrew);
                              saveStationCrew(updatedCrew);
                              alert(`✅ تم اعتماد وصرف الحافز المالي للفني (${tech.name}) بمبلغ (${calc.totalIncentiveEgp} ج) بنجاح!`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition"
                          >
                            اعتماد وصرف ✅
                          </button>
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
