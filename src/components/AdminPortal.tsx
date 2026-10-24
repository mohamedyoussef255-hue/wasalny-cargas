import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Printer,
  FileSpreadsheet,
  Upload,
  Download,
  Send,
  Plus,
  Trash2,
  Edit,
  Save,
  KeyRound,
  Shield,
  Palette,
  Bot,
  Settings,
  Fuel,
  Smartphone,
  Share2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Coins,
  RefreshCw,
  MapPin,
  TrendingDown,
  TrendingUp,
  Sliders,
  RotateCcw,
  Star,
  MessageSquare,
  DollarSign,
  PieChart,
  Layers,
  Phone,
  Mail,
  Sparkles,
  Calculator,
  Percent,
  Divide,
  Lightbulb,
  Link,
  Copy,
  ExternalLink,
  Check,
  Search,
  Gift,
  Tag,
  ArrowRight,
  Info,
  Navigation,
  Volume2,
  Compass,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  AppConfig,
  PumpQrInfo,
  RewardItem,
  TechnicianCrewMember,
  AntiFraudLog,
  CargasStationLocation,
  CustomerComplaint,
  StationRating,
  StationSalesRecord,
  StationFacilityType,
  StationActivity,
  ALL_STATION_ACTIVITIES,
  CustomComputedColumn,
  MathOperation,
  PromotionalCampaign,
  IdeaBankItem,
  RawSalesSheetData,
  WasalnyConfig,
  PointsFormulaConfig,
  PageLayoutSettings,
} from '../types';
import { generateQrDataUrl } from '../services/qrService';
import {
  saveAppConfig,
  saveRewards,
  saveStationCrew,
  saveStationLocations,
  getStationLocations,
  downloadCrewSampleExcel,
  parseCrewExcelFile,
  downloadStationsSampleExcel,
  parseStationsExcelFile,
  parseStationsKmzOrKmlFile,
  downloadSalesSampleExcel,
  parseSalesExcelFile,
  exportSalesMatrixExcel,
  getSalesRecords,
  saveSalesRecords,
  getRawSalesSheet,
  saveRawSalesSheet,
  clearSalesAndSheetData,
  restoreDefaultSalesData,
  getCustomerComplaints,
  saveCustomerComplaints,
  getStationRatings,
  generateRandomPin,
  getFraudLogs,
  saveCurrentStateSnapshot,
  restoreClassicV1Snapshot,
  getCustomSalesColumns,
  saveCustomSalesColumn,
  deleteCustomSalesColumn,
  getPromotionalCampaigns,
  savePromotionalCampaign,
  deletePromotionalCampaign,
  togglePromotionalCampaignActive,
  aiFormulateCampaignCopy,
  computeCustomColumnValue,
  computeCorporateCustomColumnValue,
  syncSheetCoordinatesWithKmzAndMap,
  CoordinateSyncResult,
  getIdeasBank,
  saveIdeaBankItem,
  deleteIdeaBankItem,
  aiAuditAndGenerateReward,
  AiAuditRewardResult,
  DEFAULT_WASALNY_CONFIG,
  DEFAULT_POINTS_FORMULA,
  DEFAULT_DRIVER_SECTIONS_ORDER,
  DEFAULT_TECHNICIAN_SECTIONS_ORDER,
  DEFAULT_LAYOUT_SETTINGS,
} from '../services/storageService';

interface AdminPortalProps {
  config: AppConfig;
  rewards: RewardItem[];
  stationCrew: TechnicianCrewMember[];
  stations: CargasStationLocation[];
  onUpdateConfig: (config: AppConfig) => void;
  onUpdateRewards: (rewards: RewardItem[]) => void;
  onUpdateCrew: (crew: TechnicianCrewMember[]) => void;
  onUpdateStations: (stations: CargasStationLocation[]) => void;
  onRollbackToClassic: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  config,
  rewards,
  stationCrew,
  stations,
  onUpdateConfig,
  onUpdateRewards,
  onUpdateCrew,
  onUpdateStations,
  onRollbackToClassic,
}) => {
  const [activeTab, setActiveTab] = useState<
    'pumps' | 'crew' | 'rewards' | 'stations_map' | 'wasalny_control' | 'visibility' | 'sales_budget' | 'promotions_studio' | 'ideas_bank' | 'complaints' | 'moen' | 'cms' | 'rollback'
  >('wasalny_control');

  // Pump & Store QR State
  const [stationCodeInput, setStationCodeInput] = useState(config.stationCode);
  const [pumpCount, setPumpCount] = useState<number>(8);
  const [pumpsList, setPumpsList] = useState<PumpQrInfo[]>([]);
  const [googlePlayQr, setGooglePlayQr] = useState<string>('');
  const [appStoreQr, setAppStoreQr] = useState<string>('');
  const [printingItem, setPrintingItem] = useState<{ title: string; qrUrl: string; sub: string } | null>(null);

  // Store URLs inputs
  const [playUrlInput, setPlayUrlInput] = useState(config.googlePlayUrl);
  const [iosUrlInput, setIosUrlInput] = useState(config.appStoreUrl);

  // Rewards CMS State
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState(50);
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardValue, setNewRewardValue] = useState('قيمة 65 ج');
  const [newRewardCat, setNewRewardCat] = useState<'meters' | 'oil' | 'spark_plugs' | 'car_wash' | 'discount'>('meters');

  // Rewards AI Auditor & Generator State (جديد: ذكاء اصطناعي لبنك الهدايا والمكافآت)
  const [aiRewardGiftName, setAiRewardGiftName] = useState('');
  const [aiRewardPriceEgp, setAiRewardPriceEgp] = useState<number>(350);
  const [aiRewardCategory, setAiRewardCategory] = useState<RewardItem['category']>('oil');
  const [aiRewardTargetDrivers, setAiRewardTargetDrivers] = useState<number>(200);
  const [isAuditingAiReward, setIsAuditingAiReward] = useState(false);
  const [aiRewardAuditResult, setAiRewardAuditResult] = useState<AiAuditRewardResult | null>(null);

  // Configuration Edit State
  const [editAppName, setEditAppName] = useState(config.appName);
  const [editAppSub, setEditAppSub] = useState(config.appSubtitle);
  const [editAppLogoUrl, setEditAppLogoUrl] = useState(config.appLogoUrl || '');
  const [editStationLogoUrl, setEditStationLogoUrl] = useState(config.stationLogoUrl || '');
  const [editGasPrice, setEditGasPrice] = useState(config.gasPricePerMeter);
  const [editPointsRatio, setEditPointsRatio] = useState(config.pointsPerMeter);
  const [editAdminPin, setEditAdminPin] = useState(config.adminPin);
  const [editThemeColor, setEditThemeColor] = useState(config.themeColor);
  const [editWelcomeDriver, setEditWelcomeDriver] = useState(config.customTexts.welcomeDriver);
  const [editWelcomeTech, setEditWelcomeTech] = useState(config.customTexts.welcomeTech);
  const [editNotice, setEditNotice] = useState(config.customTexts.maintenanceNotice);

  const compressImageFile = (file: File, maxDim = 160, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', quality));
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAppLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 160, 0.85);
      setEditAppLogoUrl(compressedDataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditAppLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStationLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 160, 0.85);
      setEditStationLogoUrl(compressedDataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditStationLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Contacts
  const [editHotline, setEditHotline] = useState(config.supportContacts?.hotline || '19058');
  const [editWhatsapp, setEditWhatsapp] = useState(config.supportContacts?.whatsappNumber || '201012345678');
  const [editEmail, setEditEmail] = useState(config.supportContacts?.email || 'customercare@cargas.com.eg');

  // Wasalny Application Master Control State (تحكم كامل في تطبيق وصلني)
  const defaultWasalny = config.wasalnyConfig || DEFAULT_WASALNY_CONFIG;
  const [wasalnyEnabled, setWasalnyEnabled] = useState(defaultWasalny.enabled);
  const [wasalnyVoice, setWasalnyVoice] = useState(defaultWasalny.voiceGuidance);
  const [wasalnyAutoVoice, setWasalnyAutoVoice] = useState(defaultWasalny.autoVoiceOnOpen);
  const [wasalnyProvider, setWasalnyProvider] = useState(defaultWasalny.navigationProvider);
  const [wasalnyTargetMode, setWasalnyTargetMode] = useState(defaultWasalny.targetStationMode);
  const [wasalnyFeaturedStationId, setWasalnyFeaturedStationId] = useState(
    defaultWasalny.featuredStationId || stations[0]?.id || ''
  );
  const [wasalnyAlertDistance, setWasalnyAlertDistance] = useState(defaultWasalny.arrivalAlertDistanceMeters);
  const [wasalnyWelcomeMsg, setWasalnyWelcomeMsg] = useState(
    defaultWasalny.customWelcomeMessage ||
      'أهلاً بك يا كابتن في تطبيق وصّلني! تم تحديد أقرب محطة كارجاس لموقعك مع توفر تموين الغاز والزيوت أسفل المظلة بدون انتظار.'
  );
  const [wasalnyShowCrowd, setWasalnyShowCrowd] = useState(defaultWasalny.showCrowdStatus);
  const [wasalnyBtnLabel, setWasalnyBtnLabel] = useState(
    defaultWasalny.buttonLabel || 'وصلني لأقرب محطة كارجاس ⛽'
  );
  const [wasalnySubtitle, setWasalnySubtitle] = useState(
    defaultWasalny.subtitle || 'توجيه ذكي وملاحة فورية لأقرب محطة تموين كارجاس CNG مجهزة وسريعة'
  );
  const [wasalnyCoverImage, setWasalnyCoverImage] = useState(defaultWasalny.mapCoverImageUrl || '');
  const [wasalnyLogoBadge, setWasalnyLogoBadge] = useState(defaultWasalny.cargasLogoBadgeUrl || '');

  const handleWasalnyCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.85);
      setWasalnyCoverImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => setWasalnyCoverImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleWasalnyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 200, 0.9);
      setWasalnyLogoBadge(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => setWasalnyLogoBadge(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadStationsSheetForWasalny = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (Array.isArray(json) && json.length > 0) {
          const formatted: CargasStationLocation[] = json.map((item: any, idx: number) => ({
            id: item.id || `ST-MAP-${idx + 1}`,
            name: item.name || item['اسم المحطة'] || item['اسم المركز'] || `محطة كارجاس ${idx + 1}`,
            city: item.city || item['المحافظة'] || item['المدينة'] || 'القاهرة',
            address: item.address || item['العنوان'] || 'مصر',
            latitude: Number(item.latitude || item.lat || item['خط العرض'] || 30.0884),
            longitude: Number(item.longitude || item.lng || item['خط الطول'] || 31.2468),
            operatingHours: item.operatingHours || item['مواعيد العمل'] || '24 ساعة',
            pumpsCount: Number(item.pumpsCount || item['عدد الطلمبات'] || 8),
            crowdLevel: item.crowdLevel || 'خفيف',
            supportedVehicles: ['تاكسي', 'ميكروباص', 'ملاكي', 'نقل'],
            activities: ['تموين غاز طبيعي', 'زيوت كارجاس'],
          }));
          onUpdateStations(formatted);
          saveStationLocations(formatted);
          alert(`✅ تم استيراد وتحديث ${formatted.length} محطة على خريطة وصّلني وتطبيق الملاحة بنجاح!`);
        }
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);
        if (jsonRows.length === 0) {
          alert('الملف فارغ أو لا يحتوي على صفوف بيانات صالحة.');
          return;
        }
        const parsedStations: CargasStationLocation[] = jsonRows.map((r, idx) => {
          const name = r['اسم المركز (المحطة)'] || r['اسم المحطة'] || r['المحطة'] || r.name || `محطة كارجاس ${idx + 1}`;
          const city = r['المحافظة'] || r['المدينة'] || r.city || 'القاهرة';
          const address = r['العنوان'] || r.address || 'مصر';
          const lat = parseFloat(r['الإحداثيات Y'] || r['خط العرض'] || r.latitude || r.lat || 30.0884);
          const lng = parseFloat(r['الإحداثيات X'] || r['خط الطول'] || r.longitude || r.lng || 31.2468);
          return {
            id: `ST-XLS-${idx + 1}`,
            name,
            city,
            address,
            latitude: isNaN(lat) ? 30.0884 : lat,
            longitude: isNaN(lng) ? 31.2468 : lng,
            operatingHours: r['مواعيد العمل'] || '24 ساعة',
            pumpsCount: parseInt(r['عدد الطلمبات'] || 8, 10),
            crowdLevel: 'خفيف',
            supportedVehicles: ['تاكسي', 'ميكروباص', 'ملاكي', 'نقل'],
            activities: ['تموين غاز طبيعي', 'زيوت كارجاس'],
          };
        });
        onUpdateStations(parsedStations);
        saveStationLocations(parsedStations);
        alert(`✅ تم قراءة وتحديث ${parsedStations.length} موقع ومحطة على خريطة وصلني وتطبيق الملاحة بنجاح!`);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء قراءة ملف المحطات. تأكد من صحة الملف.');
    }
  };

  const handleSaveWasalnySettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedWasalny: WasalnyConfig = {
      enabled: wasalnyEnabled,
      voiceGuidance: wasalnyVoice,
      autoVoiceOnOpen: wasalnyAutoVoice,
      navigationProvider: wasalnyProvider,
      targetStationMode: wasalnyTargetMode,
      featuredStationId: wasalnyFeaturedStationId,
      arrivalAlertDistanceMeters: Number(wasalnyAlertDistance),
      customWelcomeMessage: wasalnyWelcomeMsg.trim(),
      showCrowdStatus: wasalnyShowCrowd,
      buttonLabel: wasalnyBtnLabel.trim() || 'وصلني لأقرب محطة كارجاس ⛽',
      subtitle: wasalnySubtitle.trim() || 'توجيه ذكي وملاحة فورية لأقرب محطة تموين كارجاس CNG مجهزة وسريعة',
      mapCoverImageUrl: wasalnyCoverImage,
      cargasLogoBadgeUrl: wasalnyLogoBadge,
      cardLayout: 'banner_top',
    };
    const updatedConfig: AppConfig = {
      ...config,
      wasalnyConfig: updatedWasalny,
    };
    onUpdateConfig(updatedConfig);
    saveAppConfig(updatedConfig);
    alert('✅ تم حفظ كافة إعدادات وتحكم تطبيق "وصّلني" وتحديث خيارات الملاحة والتوجيه الصوتي وصور الواجهة فوراً!');
  };

  const handleTestWadahVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('متصفحك لا يدعم خاصية التحدث الصوتي.');
      return;
    }
    window.speechSynthesis.cancel();
    const testStation = stations.find((s) => s.id === wasalnyFeaturedStationId) || stations[0];
    const text = `يا هلا بيك يا باشا! أنا وضاح، معاك في الطريق خطوة بخطوة... إحنا دلوقتي متوجهين لمحطة ${testStation?.name || 'كارجاس شبرا'}، الطريق سالك ومفيش زحام، ضغط الغاز ممتاز ومتوفر غسيل وزيوت، دوس على وصّلني ويلا بينا نتحرك سوا على خرائط جوجل!`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find((v) => v.lang.includes('ar-EG') || v.lang.startsWith('ar'));
    if (arVoice) utterance.voice = arVoice;
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Visibility Matrix State & Layout Reorder Mode
  const [driverVis, setDriverVis] = useState(config.visibility.driver);
  const [techVis, setTechVis] = useState(config.visibility.technician);
  const [visibilitySubTab, setVisibilitySubTab] = useState<'reorder_layout' | 'checkboxes'>('reorder_layout');


  // Loyalty Model & Budget State
  const [loyaltyModel, setLoyaltyModel] = useState(config.loyaltyCostModel);
  const [salesRecords, setSalesRecords] = useState<StationSalesRecord[]>(getSalesRecords);
  const [rawSheetData, setRawSheetData] = useState<RawSalesSheetData | null>(getRawSalesSheet);

  // Promotions Studio Sub-Tabs State (دمج استوديو العروض وبنك الهدايا والأفكار والحاسبة)
  const [promoSubTab, setPromoSubTab] = useState<'campaigns' | 'calculator' | 'rewards' | 'ideas'>('campaigns');

  // Loyalty Points Calculator State (طبقا لمعادلات كارجاس وحاسبة نقاط الولاء.html)
  const [calcFuelMeters, setCalcFuelMeters] = useState<number>(1200);
  const [calcMultiplier, setCalcMultiplier] = useState<number>(1.0);
  const [calcGasPrice, setCalcGasPrice] = useState<number>(config.gasPricePerMeter || 13.0);
  const [calcCostPerPoint, setCalcCostPerPoint] = useState<number>(config.loyaltyCostModel?.costPerPointEgp || 0.35);
  const [calcGasolineSavingsPerMeter, setCalcGasolineSavingsPerMeter] = useState<number>(10.5);
  const [calcPresetType, setCalcPresetType] = useState<'taxi' | 'microbus' | 'centennial' | 'fleet' | 'station' | 'custom'>('taxi');

  // Sales Analytical Columns Toggles (لإضافة الخانات التحليلية المفيدة في قراءة الشيت المرفوع)
  const [showSalesAchievementCol, setShowSalesAchievementCol] = useState(true);
  const [showSalesMonthlyAvgCol, setShowSalesMonthlyAvgCol] = useState(true);
  const [showSalesRevenueCol, setShowSalesRevenueCol] = useState(true);
  const [showSalesVarianceCol, setShowSalesVarianceCol] = useState(true);
  const [showSalesGradeCol, setShowSalesGradeCol] = useState(true);

  // زر مسح بيانات تجريبية أو مرفوعة سابقاً لتصفير الشيت
  const handleClearSalesData = () => {
    if (
      !confirm(
        '⚠️ هل أنت متأكد من رغبتك في مسح كافة بيانات الشيت الحالية (سواء تجريبية أو مرفوعة سابقاً) للبدء برفع شيت جديد ونظيف تماماً؟'
      )
    ) {
      return;
    }
    clearSalesAndSheetData();
    setSalesRecords([]);
    setRawSheetData(null);
    alert('🗑️ تم مسح وتصفير كافة بيانات الشيت بنجاح! يمكنك الآن رفع ملف الإكسيل الجديد ليظهر كما هو وبنفس مسمياته الأصلية دون أي تعديل.');
  };

  // استعادة الشيت النموذجي الافتراضي
  const handleRestoreDefaultSalesData = () => {
    if (!confirm('هل ترغب في استعادة بيانات الشيت النموذجي الافتراضي لكارجاس؟')) return;
    const defaults = restoreDefaultSalesData();
    setSalesRecords(defaults);
    setRawSheetData(null);
    alert('✅ تمت استعادة شيت المبيعات النموذجي الافتراضي بنجاح.');
  };

  // Custom Computed Columns State
  const [customColumns, setCustomColumns] = useState<CustomComputedColumn[]>(() => {
    return config.customSalesColumns || getCustomSalesColumns();
  });
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState('');
  const [newColOperand1Key, setNewColOperand1Key] = useState('annualActualM3');
  const [newColOperand1Label, setNewColOperand1Label] = useState('إجمالي الفعلي السنوي (م³)');
  const [newColOperation, setNewColOperation] = useState<MathOperation>('subtract');
  const [newColOperand2Type, setNewColOperand2Type] = useState<'column' | 'constant'>('column');
  const [newColOperand2Key, setNewColOperand2Key] = useState('annualTargetM3');
  const [newColOperand2Label, setNewColOperand2Label] = useState('المستهدف السنوي (م³)');
  const [newColOperand2Constant, setNewColOperand2Constant] = useState<number>(13);
  const [newColUnit, setNewColUnit] = useState('م³');
  const [newColFormat, setNewColFormat] = useState<'standard' | 'signed' | 'percentage' | 'currency'>('signed');

  // Coordinates vs KMZ comparison state & modal
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [coordinateSyncReport, setCoordinateSyncReport] = useState<CoordinateSyncResult | null>(null);

  // Ideas Bank State (Super Admin Only)
  const [ideasBank, setIdeasBank] = useState<IdeaBankItem[]>(() => {
    return config.ideasBank || getIdeasBank();
  });
  const [ideaSearchQuery, setIdeaSearchQuery] = useState('');
  const [selectedIdeaCategory, setSelectedIdeaCategory] = useState<string>('all');
  const [isAddIdeaModalOpen, setIsAddIdeaModalOpen] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaCategory, setNewIdeaCategory] = useState<IdeaBankItem['category']>('مسابقة');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  const [newIdeaUrl, setNewIdeaUrl] = useState('');
  const [newIdeaEgp, setNewIdeaEgp] = useState<number>(350);
  const [newIdeaParticipants, setNewIdeaParticipants] = useState<number>(200);
  const [newIdeaTags, setNewIdeaTags] = useState('');
  const [copiedIdeaId, setCopiedIdeaId] = useState<string | null>(null);

  // Promotional Campaigns & AI Studio State
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>(() => {
    return config.promotionalCampaigns || getPromotionalCampaigns();
  });
  const [rawIdeaInput, setRawIdeaInput] = useState('');
  const [campaignCategory, setCampaignCategory] = useState<PromotionalCampaign['category']>('مسابقة');
  const [campaignBudgetItemEgp, setCampaignBudgetItemEgp] = useState<number>(20000);
  const [campaignTargetDrivers, setCampaignTargetDrivers] = useState<number>(500);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  // Promotional Campaigns Editing State
  const [editingCampaign, setEditingCampaign] = useState<PromotionalCampaign | null>(null);

  // Master Points Formula & Budget Criteria State
  const [pointsFormula, setPointsFormula] = useState<PointsFormulaConfig>(
    config.pointsFormula || DEFAULT_POINTS_FORMULA
  );

  // Dynamic Layout Reordering State for Driver and Technician Pages
  const [driverSectionsOrder, setDriverSectionsOrder] = useState<string[]>(
    config.layoutSettings?.driverSectionsOrder || DEFAULT_DRIVER_SECTIONS_ORDER
  );
  const [techSectionsOrder, setTechSectionsOrder] = useState<string[]>(
    config.layoutSettings?.technicianSectionsOrder || DEFAULT_TECHNICIAN_SECTIONS_ORDER
  );

  // Handlers for Custom Columns

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) {
      alert('يرجى كتابة اسم الخانة / العمود الحسابي.');
      return;
    }

    if (editingColumnId) {
      const updated = customColumns.map((c) =>
        c.id === editingColumnId
          ? {
              ...c,
              name: newColName.trim(),
              operand1Key: newColOperand1Key,
              operand1Label: newColOperand1Label,
              operation: newColOperation,
              operand2Type: newColOperand2Type,
              operand2Key: newColOperand2Type === 'column' ? newColOperand2Key : undefined,
              operand2Label: newColOperand2Type === 'column' ? newColOperand2Label : undefined,
              operand2Constant: newColOperand2Type === 'constant' ? Number(newColOperand2Constant) : undefined,
              unit: newColUnit.trim(),
              displayFormat: newColFormat,
            }
          : c
      );
      setCustomColumns(updated);
      const updatedCol = updated.find((c) => c.id === editingColumnId)!;
      saveCustomSalesColumn(updatedCol);
      onUpdateConfig({ ...config, customSalesColumns: updated });
      setIsAddColumnModalOpen(false);
      setEditingColumnId(null);
      setNewColName('');
      alert(`✅ تم تحديث الخانة الحسابية "${updatedCol.name}" بنجاح!`);
      return;
    }

    const newCol: CustomComputedColumn = {
      id: 'col-' + Date.now(),
      name: newColName.trim(),
      operand1Key: newColOperand1Key,
      operand1Label: newColOperand1Label,
      operation: newColOperation,
      operand2Type: newColOperand2Type,
      operand2Key: newColOperand2Type === 'column' ? newColOperand2Key : undefined,
      operand2Label: newColOperand2Type === 'column' ? newColOperand2Label : undefined,
      operand2Constant: newColOperand2Type === 'constant' ? Number(newColOperand2Constant) : undefined,
      unit: newColUnit.trim(),
      displayFormat: newColFormat,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [...customColumns, newCol];
    setCustomColumns(updated);
    saveCustomSalesColumn(newCol);
    onUpdateConfig({ ...config, customSalesColumns: updated });
    setIsAddColumnModalOpen(false);
    setNewColName('');
    alert(`✅ تم إضافة الخانة الحسابية "${newCol.name}" بنجاح إلى جدول المبيعات ونظام تصدير الإكسيل!`);
  };

  const handleStartEditColumn = (col: CustomComputedColumn) => {
    setEditingColumnId(col.id);
    setNewColName(col.name);
    setNewColOperand1Key(col.operand1Key);
    setNewColOperand1Label(col.operand1Label);
    setNewColOperation(col.operation);
    setNewColOperand2Type(col.operand2Type);
    setNewColOperand2Key(col.operand2Key || 'annualTargetM3');
    setNewColOperand2Label(col.operand2Label || 'المستهدف السنوي');
    setNewColOperand2Constant(col.operand2Constant ?? 13);
    setNewColUnit(col.unit || '');
    setNewColFormat(col.displayFormat);
    setIsAddColumnModalOpen(true);
  };

  const handleQuickAddPreset = (preset: 'variance' | 'achievement' | 'revenue' | 'monthly_avg') => {
    let col: CustomComputedColumn;
    if (preset === 'variance') {
      col = {
        id: 'col-var-' + Date.now(),
        name: 'الانحراف (+/-)',
        operand1Key: 'annualActualM3',
        operand1Label: 'إجمالي الفعلي السنوي',
        operation: 'subtract',
        operand2Type: 'column',
        operand2Key: 'annualTargetM3',
        operand2Label: 'المستهدف السنوي',
        unit: 'م³',
        displayFormat: 'signed',
        createdAt: new Date().toISOString().slice(0, 10),
      };
    } else if (preset === 'achievement') {
      col = {
        id: 'col-ach-' + Date.now(),
        name: 'معدل الإنجاز %',
        operand1Key: 'annualActualM3',
        operand1Label: 'إجمالي الفعلي السنوي',
        operation: 'percentage',
        operand2Type: 'column',
        operand2Key: 'annualTargetM3',
        operand2Label: 'المستهدف السنوي',
        unit: '%',
        displayFormat: 'percentage',
        createdAt: new Date().toISOString().slice(0, 10),
      };
    } else if (preset === 'revenue') {
      col = {
        id: 'col-rev-' + Date.now(),
        name: 'القيمة بالجنيه (13 ج/م³)',
        operand1Key: 'annualActualM3',
        operand1Label: 'إجمالي الفعلي السنوي',
        operation: 'multiply',
        operand2Type: 'constant',
        operand2Constant: 13,
        unit: 'جنية',
        displayFormat: 'currency',
        createdAt: new Date().toISOString().slice(0, 10),
      };
    } else {
      col = {
        id: 'col-avg-' + Date.now(),
        name: 'المتوسط الشهري (م³)',
        operand1Key: 'annualActualM3',
        operand1Label: 'إجمالي الفعلي السنوي',
        operation: 'divide',
        operand2Type: 'constant',
        operand2Constant: 12,
        unit: 'م³/شهر',
        displayFormat: 'standard',
        createdAt: new Date().toISOString().slice(0, 10),
      };
    }

    const updated = [...customColumns, col];
    setCustomColumns(updated);
    saveCustomSalesColumn(col);
    onUpdateConfig({ ...config, customSalesColumns: updated });
    alert(`✅ تم إضافة الخانة الحسابية "${col.name}" بنجاح للجدول والإكسيل!`);
  };

  const handleDeleteCustomColumn = (colId: string) => {
    if (!confirm('هل ترغب في حذف هذه الخانة الحسابية المخصصة من الجدول؟')) return;
    const updated = customColumns.filter((c) => c.id !== colId);
    setCustomColumns(updated);
    deleteCustomSalesColumn(colId);
    onUpdateConfig({ ...config, customSalesColumns: updated });
  };

  // مواءمة ومقارنة الإحداثيات مع ملف KMZ وقاعدة بيانات الخريطة
  const handleSyncCoordinatesWithKmzAndMap = () => {
    const report = syncSheetCoordinatesWithKmzAndMap(salesRecords, stations);
    setCoordinateSyncReport(report);
    setIsSyncModalOpen(true);
    const updated = getStationLocations();
    onUpdateStations(updated);
  };

  // Handlers for Promotional Campaigns & AI Studio
  const handleGenerateAiCampaign = async () => {
    if (!rawIdeaInput.trim()) {
      alert('يرجى إدخال فكرة العرض أو المسابقة ليصيغها الذكاء الاصطناعي.');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const costPerPoint = config.loyaltyCostModel?.costPerPointEgp || 0.35;
      const drafted = await aiFormulateCampaignCopy({
        rawIdea: rawIdeaInput,
        category: campaignCategory,
        allocatedBudgetItemEgp: Number(campaignBudgetItemEgp),
        targetDriversCount: Number(campaignTargetDrivers),
        costPerPointEgp: costPerPoint,
      });
      setAiDraftCampaign(drafted);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الصياغة بالذكاء الاصطناعي.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePublishAiCampaign = () => {
    if (!aiDraftCampaign || !aiDraftCampaign.title) return;
    const newCampaign: PromotionalCampaign = {
      id: 'CAMP-' + Date.now(),
      title: aiDraftCampaign.title || 'عرض ترويجي جديد',
      subtitle: aiDraftCampaign.subtitle || '',
      category: (aiDraftCampaign.category as any) || campaignCategory,
      badge: aiDraftCampaign.badge || 'عرض خاص ⭐',
      pointsReward: aiDraftCampaign.pointsReward || 100,
      financialEquivalentEgp: aiDraftCampaign.financialEquivalentEgp || 35,
      allocatedBudgetItemEgp: Number(campaignBudgetItemEgp),
      targetDriversCount: Number(campaignTargetDrivers),
      rawIdea: rawIdeaInput,
      aiGeneratedCopy: aiDraftCampaign.aiGeneratedCopy || '',
      explanationOfLoyalty: aiDraftCampaign.explanationOfLoyalty || '',
      buttonText: aiDraftCampaign.buttonText || 'فول واكسب الآن ⛽',
      buttonAction: (aiDraftCampaign.buttonAction as any) || 'navigate_map',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      isActive: true,
      bannerGradient: aiDraftCampaign.bannerGradient || 'from-blue-900 via-indigo-900 to-slate-900',
      icon: aiDraftCampaign.icon || 'Trophy',
    };

    const updated = [newCampaign, ...campaigns];
    setCampaigns(updated);
    savePromotionalCampaign(newCampaign);
    onUpdateConfig({ ...config, promotionalCampaigns: updated });
    setAiDraftCampaign(null);
    setRawIdeaInput('');
    alert(`🚀 تم نشر الحملة الترويجية بنجاح! البانر الآن معروض لكافة السائقين في صفحتهم الرئيسية.`);
  };

  const handleToggleCampaign = (id: string) => {
    const updated = campaigns.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    setCampaigns(updated);
    togglePromotionalCampaignActive(id);
    onUpdateConfig({ ...config, promotionalCampaigns: updated });
  };

  const handleDeleteCampaign = (id: string) => {
    if (!confirm('هل ترغب في حذف هذه الحملة من النظام؟')) return;
    const updated = campaigns.filter((c) => c.id !== id);
    setCampaigns(updated);
    deletePromotionalCampaign(id);
  };

  // Campaign Edit Handlers
  const handleStartEditCampaign = (camp: PromotionalCampaign) => {
    setEditingCampaign({ ...camp });
  };

  const handleSaveEditedCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    const updated = campaigns.map((c) => (c.id === editingCampaign.id ? editingCampaign : c));
    setCampaigns(updated);
    savePromotionalCampaign(editingCampaign);
    onUpdateConfig({ ...config, promotionalCampaigns: updated });
    alert(`✅ تم تحديث وحفظ بيانات الحملة/المسابقة "${editingCampaign.title}" بنجاح!`);
    setEditingCampaign(null);
  };

  // Layout Reordering Handlers for Driver & Technician Pages
  const moveDriverSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...driverSectionsOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setDriverSectionsOrder(newOrder);
  };

  const moveTechSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...techSectionsOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setTechSectionsOrder(newOrder);
  };

  const handleResetLayoutToDefault = () => {
    if (!confirm('هل ترغب في استعادة الترتيب النموذجي الافتراضي لكافة عناصر صفحات العميل والفني؟')) return;
    setDriverSectionsOrder(DEFAULT_DRIVER_SECTIONS_ORDER);
    setTechSectionsOrder(DEFAULT_TECHNICIAN_SECTIONS_ORDER);
    const updatedConfig: AppConfig = {
      ...config,
      layoutSettings: {
        driverSectionsOrder: DEFAULT_DRIVER_SECTIONS_ORDER,
        technicianSectionsOrder: DEFAULT_TECHNICIAN_SECTIONS_ORDER,
      },
    };
    onUpdateConfig(updatedConfig);
    saveAppConfig(updatedConfig);
    alert('✅ تمت استعادة الترتيب النموذجي بنجاح!');
  };

  const handleSaveLayoutSettings = () => {
    const updatedLayout: PageLayoutSettings = {
      driverSectionsOrder,
      technicianSectionsOrder: techSectionsOrder,
    };
    const updatedConfig: AppConfig = {
      ...config,
      layoutSettings: updatedLayout,
      visibility: {
        driver: driverVis,
        technician: techVis,
      },
    };
    onUpdateConfig(updatedConfig);
    saveAppConfig(updatedConfig);
    alert('✅ تم حفظ ترتيب ومواضع عناصر وبنرات ومساحات صفحتي العميل والفني بنجاح!');
  };

  // Moen Config State
  const [moenEnabled, setMoenEnabled] = useState(config.assistantEnabled);
  const [moenOnlyAdmin, setMoenOnlyAdmin] = useState(config.assistantOnlyAdmin);
  const [moenAllowedTopics, setMoenAllowedTopics] = useState<string[]>(config.assistantAllowedTopics);
  const [newTopicInput, setNewTopicInput] = useState('');

  // Complaints & Ratings
  const [complaints, setComplaints] = useState<CustomerComplaint[]>(getCustomerComplaints);
  const [ratings, setRatings] = useState<StationRating[]>(getStationRatings);

  // Station Activities & Details Edit Modal State
  const [editingStation, setEditingStation] = useState<CargasStationLocation | null>(null);
  const [isAddingStation, setIsAddingStation] = useState<boolean>(false);
  const [stationForm, setStationForm] = useState<Partial<CargasStationLocation>>({
    name: '',
    code: '',
    city: 'القاهرة',
    address: '',
    facilityType: 'cng_station',
    latitude: 30.0444,
    longitude: 31.2357,
    phone: '19058',
    workingHours: '24 ساعة',
    pumpCount: 6,
    activities: ['تموين', 'زيوت'],
    promotionalPointsMultiplier: 1.0,
    promotionalBudgetEgp: 0,
    salesVolumeStatus: 'medium',
    servicesAvailable: ['تموين غاز طبيعي', 'خدمات سيارات كارجاس'],
  });

  // Sales Monthly Matrix & Budget State - default to raw sheet view as requested
  const [salesSubTab, setSalesSubTab] = useState<'sheet_raw' | 'matrix' | 'allocation'>('sheet_raw');
  const [salesSearchQuery, setSalesSearchQuery] = useState<string>('');
  const [expandedSalesRecordId, setExpandedSalesRecordId] = useState<string | null>(null);

  // Handlers for AI Rewards Auditor (ذكاء اصطناعي لبنك المكافآت)
  const handleAiAuditReward = async () => {
    if (!aiRewardGiftName.trim()) {
      alert('يرجى كتابة اسم الهدية أو الخدمة للتدقيق والاحتساب بالذكاء الاصطناعي.');
      return;
    }
    setIsAuditingAiReward(true);
    try {
      const res = await aiAuditAndGenerateReward({
        giftName: aiRewardGiftName.trim(),
        estimatedEgpValue: Number(aiRewardPriceEgp) || 350,
        category: aiRewardCategory,
        targetParticipantsCount: Number(aiRewardTargetDrivers) || 200,
        gasPricePerMeter: config.gasPricePerMeter,
        costPerPointEgp: config.loyaltyCostModel?.costPerPointEgp || 0.35,
      });
      setAiRewardAuditResult(res);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تدقيق الهدية بالذكاء الاصطناعي.');
    } finally {
      setIsAuditingAiReward(false);
    }
  };

  const handleAdoptAiReward = () => {
    if (!aiRewardAuditResult) return;
    const item: RewardItem = {
      id: 'REW-' + Date.now(),
      title: aiRewardAuditResult.marketingTitle,
      description: aiRewardAuditResult.aiAuditNotes,
      pointsCost: aiRewardAuditResult.pointsCost,
      valueText: `${aiRewardAuditResult.verifiedFairPriceEgp} ج (${aiRewardAuditResult.freeMetersEquivalent} م³ غاز)`,
      category: aiRewardCategory,
      icon: aiRewardCategory === 'meters' ? 'Fuel' : aiRewardCategory === 'oil' ? 'Droplets' : 'Gift',
      isActive: true,
      estimatedEgpValue: aiRewardAuditResult.verifiedFairPriceEgp,
      freeMetersEquivalent: aiRewardAuditResult.freeMetersEquivalent,
      aiAuditNotes: aiRewardAuditResult.aiAuditNotes,
    };
    const updated = [item, ...rewards];
    onUpdateRewards(updated);
    saveRewards(updated);
    alert(`✅ تم اعتماد وإضافة "${item.title}" (${item.pointsCost} نقطة) لبنك مكافآت السائقين بنجاح!`);
    setAiRewardAuditResult(null);
    setAiRewardGiftName('');
  };

  // Handlers for Ideas Bank (بنك الأفكار لمدير النظام)
  const handleOpenAddIdea = () => {
    setEditingIdeaId(null);
    setNewIdeaTitle('');
    setNewIdeaCategory('مسابقة');
    setNewIdeaDesc('');
    setNewIdeaUrl('');
    setNewIdeaEgp(350);
    setNewIdeaParticipants(200);
    setNewIdeaTags('');
    setIsAddIdeaModalOpen(true);
  };

  const handleOpenEditIdea = (item: IdeaBankItem) => {
    setEditingIdeaId(item.id);
    setNewIdeaTitle(item.title);
    setNewIdeaCategory(item.category);
    setNewIdeaDesc(item.description);
    setNewIdeaUrl(item.referenceUrl || '');
    setNewIdeaEgp(item.estimatedEgpValue);
    setNewIdeaParticipants(item.targetParticipants);
    setNewIdeaTags((item.tags || []).join('، '));
    setIsAddIdeaModalOpen(true);
  };

  const handleSaveIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) {
      alert('يرجى كتابة عنوان الفكرة.');
      return;
    }
    const tagsArray = newIdeaTags
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);

    let updated: IdeaBankItem[];
    if (editingIdeaId) {
      updated = ideasBank.map((it) =>
        it.id === editingIdeaId
          ? {
              ...it,
              title: newIdeaTitle.trim(),
              category: newIdeaCategory,
              description: newIdeaDesc.trim(),
              referenceUrl: newIdeaUrl.trim() || undefined,
              estimatedEgpValue: Number(newIdeaEgp) || 0,
              targetParticipants: Number(newIdeaParticipants) || 100,
              tags: tagsArray,
            }
          : it
      );
      alert(`✅ تم تحديث الفكرة "${newIdeaTitle}" بنجاح!`);
    } else {
      const newIdea: IdeaBankItem = {
        id: 'IDEA-' + Date.now(),
        title: newIdeaTitle.trim(),
        category: newIdeaCategory,
        description: newIdeaDesc.trim(),
        referenceUrl: newIdeaUrl.trim() || undefined,
        estimatedEgpValue: Number(newIdeaEgp) || 0,
        targetParticipants: Number(newIdeaParticipants) || 100,
        tags: tagsArray,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      updated = [newIdea, ...ideasBank];
      alert(`✅ تم حفظ الفكرة الجديدة والرابط المرجعي في بنك الأفكار بنجاح!`);
    }

    setIdeasBank(updated);
    if (updated[0]) saveIdeaBankItem(updated[0]);
    onUpdateConfig({ ...config, ideasBank: updated });
    setIsAddIdeaModalOpen(false);
    setEditingIdeaId(null);
  };

  const handleDeleteIdea = (id: string) => {
    if (!confirm('هل ترغب في حذف هذه الفكرة من بنك الأفكار؟')) return;
    const updated = ideasBank.filter((it) => it.id !== id);
    setIdeasBank(updated);
    deleteIdeaBankItem(id);
    onUpdateConfig({ ...config, ideasBank: updated });
  };

  const handleCopyIdea = (item: IdeaBankItem) => {
    const textToCopy = `📌 [فكرة من بنك أفكار كارجاس]\nالعنوان: ${item.title}\nالتصنيف: ${item.category}\nالوصف: ${item.description}\nالقيمة المقدرة: ${item.estimatedEgpValue} ج\nعدد المشاركين: ${item.targetParticipants}\nالموازنة المقدرة: ${(item.estimatedEgpValue * item.targetParticipants).toLocaleString()} ج${item.referenceUrl ? `\nالرابط المرجعي: ${item.referenceUrl}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIdeaId(item.id);
    setTimeout(() => setCopiedIdeaId(null), 2500);
  };

  const handleTransferIdeaToPromotions = (item: IdeaBankItem) => {
    setRawIdeaInput(`${item.title}: ${item.description}${item.referenceUrl ? ` (مرجع: ${item.referenceUrl})` : ''}`);
    setCampaignCategory(item.category as any);
    setCampaignBudgetItemEgp(item.estimatedEgpValue * item.targetParticipants);
    setCampaignTargetDrivers(item.targetParticipants);
    setActiveTab('promotions_studio');
  };

  const handleTransferIdeaToRewards = (item: IdeaBankItem) => {
    setAiRewardGiftName(item.title);
    setAiRewardPriceEgp(item.estimatedEgpValue);
    setAiRewardTargetDrivers(item.targetParticipants);
    const catMap: Record<string, RewardItem['category']> = {
      'هدية عينية': 'spark_plugs',
      'كوبون وخصم': 'discount',
      'غاز مجاني': 'meters',
      'زيوت وفلاتر': 'oil',
      'صيانة وخدمات': 'spark_plugs',
      'مسابقة': 'meters',
    };
    setAiRewardCategory(catMap[item.category] || 'meters');
    setActiveTab('rewards');
  };

  const [copiedCctvStationId, setCopiedCctvStationId] = useState<string | null>(null);

  const handleOpenEditStation = (st: CargasStationLocation) => {
    setEditingStation(st);
    setIsAddingStation(false);
    const codeClean = (st.code || 'ST').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const defaultStreamCode = st.cctvStreamCode || `CARGAS-CCTV-${codeClean}-${Math.floor(1000 + Math.random() * 9000)}`;
    setStationForm({
      ...st,
      activities: st.activities || ['تموين', 'زيوت'],
      cctvStreamCode: defaultStreamCode,
      cctvStatus: st.cctvStatus || 'live',
      crowdLevel: st.crowdLevel || 'فاضية وسريعة',
      crowdEstimatedWaitMinutes: st.crowdEstimatedWaitMinutes || 3,
    });
  };

  const handleOpenAddStation = () => {
    setEditingStation(null);
    setIsAddingStation(true);
    const newCode = `CARGAS-${(stations.length + 10).toString()}`;
    setStationForm({
      name: '',
      code: newCode,
      city: 'القاهرة',
      address: '',
      facilityType: 'cng_station',
      latitude: 30.0444,
      longitude: 31.2357,
      phone: '19058',
      workingHours: '24 ساعة',
      pumpCount: 6,
      activities: ['تموين', 'زيوت'],
      promotionalPointsMultiplier: 1.0,
      promotionalBudgetEgp: 0,
      salesVolumeStatus: 'medium',
      servicesAvailable: ['تموين غاز طبيعي', 'خدمات سيارات كارجاس'],
      cctvStreamCode: `CARGAS-CCTV-${newCode}-${Math.floor(1000 + Math.random() * 9000)}`,
      cctvStatus: 'live',
      crowdLevel: 'فاضية وسريعة',
      crowdEstimatedWaitMinutes: 3,
    });
  };

  const toggleStationActivity = (act: StationActivity) => {
    const current = stationForm.activities || [];
    const exists = current.includes(act);
    const updated = exists ? current.filter((a) => a !== act) : [...current, act];
    setStationForm({ ...stationForm, activities: updated });
  };

  const handleSaveStationActivities = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationForm.name || !stationForm.code) {
      alert('يرجى إدخال اسم المحطة/المركز والكود الخاص بها');
      return;
    }

    let updated: CargasStationLocation[];
    if (editingStation) {
      updated = stations.map((st) => (st.id === editingStation.id ? ({ ...st, ...stationForm } as CargasStationLocation) : st));
      alert(`تم تحديث أنشطة وبيانات [${stationForm.name}] بنجاح!`);
    } else {
      const newSt: CargasStationLocation = {
        id: 'ST-' + Date.now(),
        name: stationForm.name!,
        code: stationForm.code!,
        city: stationForm.city || 'القاهرة',
        address: stationForm.address || 'طريق المحطة',
        facilityType: stationForm.facilityType || 'cng_station',
        latitude: Number(stationForm.latitude) || 30.0444,
        longitude: Number(stationForm.longitude) || 31.2357,
        phone: stationForm.phone || '19058',
        workingHours: stationForm.workingHours || '24 ساعة',
        pumpCount: Number(stationForm.pumpCount) || 6,
        activities: stationForm.activities || ['تموين', 'زيوت'],
        salesVolumeStatus: stationForm.salesVolumeStatus || 'medium',
        promotionalPointsMultiplier: Number(stationForm.promotionalPointsMultiplier) || 1.0,
        promotionalBudgetEgp: Number(stationForm.promotionalBudgetEgp) || 0,
        servicesAvailable: stationForm.servicesAvailable || ['تموين غاز طبيعي'],
        cctvStreamCode: stationForm.cctvStreamCode || `CARGAS-CCTV-${stationForm.code}`,
        cctvStatus: stationForm.cctvStatus || 'live',
        crowdLevel: stationForm.crowdLevel || 'فاضية وسريعة',
        crowdEstimatedWaitMinutes: Number(stationForm.crowdEstimatedWaitMinutes) || 3,
      };
      updated = [newSt, ...stations];
      alert(`تمت إضافة [${newSt.name}] وتحديد أنشطتها المعتمدة بنجاح!`);
    }

    onUpdateStations(updated);
    saveStationLocations(updated);
    setEditingStation(null);
    setIsAddingStation(false);
  };

  const handleDeleteStation = (id: string) => {
    if (!confirm('هل ترغب في حذف هذا الموقع/المحطة من المنظومة والخريطة التفاعلية؟')) return;
    const updated = stations.filter((st) => st.id !== id);
    onUpdateStations(updated);
    saveStationLocations(updated);
    alert('تم حذف المحطة بنجاح.');
  };

  // Generate Pump & Store QRs
  const generateAllQrs = async () => {
    const playQr = await generateQrDataUrl(playUrlInput, { width: 280 });
    const iosQr = await generateQrDataUrl(iosUrlInput, { width: 280 });
    setGooglePlayQr(playQr);
    setAppStoreQr(iosQr);

    const list: PumpQrInfo[] = [];
    for (let i = 1; i <= pumpCount; i++) {
      const payload = JSON.stringify({
        station: stationCodeInput,
        name: config.stationName,
        pump: i,
        gasPrice: config.gasPricePerMeter,
        playUrl: playUrlInput,
        iosUrl: iosUrlInput,
      });
      const qrUrl = await generateQrDataUrl(payload, { width: 280 });
      list.push({
        stationCode: stationCodeInput,
        stationName: config.stationName,
        pumpNumber: i,
        qrDataUrl: qrUrl,
        directUrl: `${window.location.origin}?pump=${i}&station=${encodeURIComponent(stationCodeInput)}`,
      });
    }
    setPumpsList(list);
  };

  useEffect(() => {
    generateAllQrs();
    setSalesRecords(getSalesRecords());
    setComplaints(getCustomerComplaints());
    setRatings(getStationRatings());
  }, [stationCodeInput, pumpCount, config.gasPricePerMeter]);

  // Handle Stations Excel or KMZ/KML Upload
  const handleStationsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let parsedStations: CargasStationLocation[] = [];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.kmz') || fileName.endsWith('.kml')) {
        parsedStations = await parseStationsKmzOrKmlFile(file);
      } else {
        parsedStations = await parseStationsExcelFile(file);
      }

      if (parsedStations.length === 0) {
        alert('لم يتم العثور على محطات أو مراكز صالحة في الملف.');
        return;
      }

      onUpdateStations(parsedStations);
      saveStationLocations(parsedStations);
      alert(`تم استيراد ${parsedStations.length} موقع ومحطة كارجاس وتحديث الخريطة التفاعلية بنجاح!`);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء قراءة ملف المحطات: ' + (err?.message || 'تأكد من صيغة الملف'));
    }
  };

  // Handle Station Sales Excel Upload (Flexible Headers: Name, Coordinates X/Y, Months, Daily, Annual)
  const handleSalesFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const records = await parseSalesExcelFile(file);
      if (records.length === 0) {
        alert('لم يتم العثور على بيانات مبيعات صالحة في الملف.');
        return;
      }
      setSalesRecords(records);
      saveSalesRecords(records);
      setRawSheetData(getRawSalesSheet());

      // Automatically update promotional multiplier and coordinates for matched stations
      let matchedCount = 0;
      let coordsCount = 0;

      const updatedStations = stations.map((st) => {
        const matched = records.find(
          (r) =>
            (r.stationCode && st.code && r.stationCode.toLowerCase() === st.code.toLowerCase()) ||
            r.stationName.includes(st.name) ||
            st.name.includes(r.stationName)
        );
        if (matched) {
          matchedCount++;
          const hasNewCoords = matched.latitude !== undefined && matched.longitude !== undefined;
          if (hasNewCoords) coordsCount++;

          return {
            ...st,
            latitude: hasNewCoords ? matched.latitude! : st.latitude,
            longitude: hasNewCoords ? matched.longitude! : st.longitude,
            promotionalPointsMultiplier: matched.promotionalPointsMultiplier,
            promotionalBudgetEgp: matched.allocatedBudgetEgp,
            salesVolumeStatus: (matched.achievementRatioPct < 70 ? 'low' : matched.achievementRatioPct > 90 ? 'high' : 'medium') as any,
          };
        }
        return st;
      });

      onUpdateStations(updatedStations);
      saveStationLocations(updatedStations);

      const periodLabel = records[0]?.periodLabel || 'بيان مبيعات';
      alert(
        `✅ تم رفع وقراءة شيت مبيعات ${records.length} محطة/مركز بنجاح!\n` +
        `• نوع البيان: [ ${periodLabel} ]\n` +
        `• تم تحديث وتوجيه الموازنة والمضاعف الترويجي لـ ${matchedCount} محطة.\n` +
        (coordsCount > 0 ? `• تم تحديث إحداثيات (X و Y) لـ ${coordsCount} محطة على الخريطة التفاعلية بنجاح!` : '')
      );
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء قراءة ملف مبيعات المحطات.');
    }
  };

  // Crew Excel Upload
  const handleCrewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedCrew = await parseCrewExcelFile(file);
      if (parsedCrew.length === 0) {
        alert('لم يتم العثور على بيانات صالحة في ملف الإكسيل');
        return;
      }
      onUpdateCrew(parsedCrew);
      saveStationCrew(parsedCrew);
      alert(`تم استيراد ${parsedCrew.length} من أفراد طاقم المحطة وتوليد أكواد PIN سرية جديدة لهم بنجاح!`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء قراءة ملف الإكسيل. تأكد من مطابقة أسماء الأعمدة للنموذج التجريبي.');
    }
  };

  const sendPinViaWhatsApp = (member: TechnicianCrewMember) => {
    const cleanPhone = member.phone.replace(/\D/g, '');
    const techLoginUrl = `${window.location.origin}${window.location.pathname}?role=technician&techId=${member.id}&pin=${member.dailyPin}`;
    const message = `مرحباً يا بطل كارجاس ${member.name} (${member.role}) ⛽\nتم إرسال رابط الدخول وتفعيل ورديتك في منظومة كارجاس للولاء:\n\n• كود الفني: ${member.id}\n• رقم الـ PIN السري لليوم: [ ${member.dailyPin} ]\n• المحطة: ${config.stationName}\n\n👇 اضغط على الرابط التالي للدخول فوراً وبدء الوردية وتسجيل التموينات واستبدال الأمتار المجانية:\n${techLoginUrl}\n\nمنظومة كارجاس وعزوتي للبرمجيات وتكنولوجيا المعلومات - م. محمد عبد الرحمن يوسف.`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyTechnicianLoginLink = (member: TechnicianCrewMember) => {
    const techLoginUrl = `${window.location.origin}${window.location.pathname}?role=technician&techId=${member.id}&pin=${member.dailyPin}`;
    navigator.clipboard.writeText(techLoginUrl);
    alert(`✅ تم نسخ رابط دخول الفني ${member.name} إلى الحافظة بنجاح:\n${techLoginUrl}`);
  };

  const regenerateAllDailyPins = () => {
    if (!confirm('هل ترغب في توليد أرقام سرية (PINs) جديدة لكافة الفنيين ورؤساء الورادي اليوم؟')) return;
    const updated = stationCrew.map((c) => ({
      ...c,
      dailyPin: generateRandomPin(),
      pinGeneratedDate: new Date().toISOString().slice(0, 10),
    }));
    onUpdateCrew(updated);
    saveStationCrew(updated);
    alert('تم توليد أرقام سرية جديدة لطاقم المحطة! يمكنك الآن إرسالها بنقرة واحدة عبر الواتساب.');
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle) return;

    const newReward: RewardItem = {
      id: 'rew-' + Date.now(),
      title: newRewardTitle,
      pointsCost: Number(newRewardPoints),
      description: newRewardDesc || 'مكافأة معتمدة من برنامج ولاء كارجاس',
      valueText: newRewardValue || `${newRewardPoints} ج`,
      category: newRewardCat,
      icon: 'Gift',
      isActive: true,
    };

    const updated = [newReward, ...rewards];
    onUpdateRewards(updated);
    saveRewards(updated);

    setNewRewardTitle('');
    setNewRewardDesc('');
    alert('تمت إضافة المكافأة الجديدة إلى بنك الهدايا بنجاح!');
  };

  const handleDeleteReward = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المكافأة من بنك الهدايا؟')) return;
    const updated = rewards.filter((r) => r.id !== id);
    onUpdateRewards(updated);
    saveRewards(updated);
  };

  // Save All CMS & Visibility Settings
  const handleSaveAllSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedConfig: AppConfig = {
      ...config,
      appName: editAppName,
      appSubtitle: editAppSub,
      appLogoUrl: editAppLogoUrl,
      stationLogoUrl: editStationLogoUrl,
      gasPricePerMeter: Number(editGasPrice),
      pointsPerMeter: Number(editPointsRatio),
      adminPin: editAdminPin.trim() || '0000',
      themeColor: editThemeColor,
      stationCode: stationCodeInput,
      googlePlayUrl: playUrlInput,
      appStoreUrl: iosUrlInput,
      customTexts: {
        ...config.customTexts,
        welcomeDriver: editWelcomeDriver,
        welcomeTech: editWelcomeTech,
        maintenanceNotice: editNotice,
      },
      visibility: {
        driver: driverVis,
        technician: techVis,
      },
      supportContacts: {
        hotline: editHotline,
        whatsappNumber: editWhatsapp,
        email: editEmail,
      },
      loyaltyCostModel: loyaltyModel,
      assistantEnabled: moenEnabled,
      assistantOnlyAdmin: moenOnlyAdmin,
      assistantAllowedTopics: moenAllowedTopics,
      wasalnyConfig: {
        enabled: wasalnyEnabled,
        voiceGuidance: wasalnyVoice,
        autoVoiceOnOpen: wasalnyAutoVoice,
        navigationProvider: wasalnyProvider,
        targetStationMode: wasalnyTargetMode,
        featuredStationId: wasalnyFeaturedStationId,
        arrivalAlertDistanceMeters: Number(wasalnyAlertDistance),
        customWelcomeMessage: wasalnyWelcomeMsg.trim(),
        showCrowdStatus: wasalnyShowCrowd,
        buttonLabel: wasalnyBtnLabel.trim() || 'وصلني لأقرب محطة كارجاس ⛽',
        subtitle: wasalnySubtitle.trim() || 'توجيه ذكي وملاحة فورية لأقرب محطة تموين كارجاس CNG مجهزة وسريعة',
        mapCoverImageUrl: wasalnyCoverImage,
        cargasLogoBadgeUrl: wasalnyLogoBadge,
        cardLayout: 'banner_top',
      },
      layoutSettings: {
        driverSectionsOrder,
        technicianSectionsOrder: techSectionsOrder,
      },
      pointsFormula: {
        ...pointsFormula,
        pointsToEgpRedemptionRatio: Number(loyaltyModel.costPerPointEgp),
      },
    };

    onUpdateConfig(updatedConfig);
    saveAppConfig(updatedConfig);
    alert('✅ تم حفظ وتحديث كافة إعدادات المنظومة وترتيب الواجهات ومصفوفة الظهور وتطبيق وصّلني وتكلفة النقاط بنجاح!');

  };

  const handlePrintCard = (item: { title: string; qrUrl: string; sub: string }) => {
    setPrintingItem(item);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Printable Zone when window.print() is executed */}
      {printingItem && (
        <div className="hidden print:block printable-area text-center p-8 bg-white text-black">
          <div className="border-4 border-black p-8 rounded-3xl max-w-sm mx-auto space-y-4">
            <h1 className="text-2xl font-black">{config.appName}</h1>
            <p className="text-sm font-bold">{config.stationName}</p>
            <div className="my-4">
              {printingItem.qrUrl ? (
                <img src={printingItem.qrUrl} alt="QR Code" className="w-56 h-56 mx-auto border-2 border-black p-2" />
              ) : null}
            </div>
            <h2 className="text-xl font-black bg-black text-white py-1 px-3 rounded-lg inline-block">
              {printingItem.title}
            </h2>
            <p className="text-xs font-mono">{printingItem.sub}</p>
            <p className="text-[10px] text-gray-600">امسح الكود عبر كاميرا الهاتف لتحميل التطبيق أو التموين</p>
          </div>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-rose-800/40 no-print flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                لوحة تحكم مدير النظام الشاملة (Super Admin)
              </h2>
              <span className="text-[10px] bg-rose-500/30 text-rose-300 px-2.5 py-0.5 rounded-full font-bold border border-rose-400/40">
                تحكم كامل 100%
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-1">
              إدارة الإحداثيات وKMZ • مصفوفة إظهار وإخفاء المحتويات • موازنة مبيعات المحطات • بنك الولاء • حوافز الفنيين
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-300">
          <button
            onClick={() => setActiveTab('rollback')}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl transition shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>النسخ الاحتياطي والعودة للنسخة الأصلية</span>
          </button>
          <span className="font-mono bg-slate-800 text-amber-400 px-3 py-1.5 rounded-xl border border-slate-700">
            PIN: {config.adminPin}
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden no-print">
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('pumps')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'pumps' ? 'bg-white text-rose-700 shadow-sm border border-slate-200' : 'text-slate-600'
            }`}
          >
            <QrCode className="w-4 h-4 text-rose-600" />
            <span>أكواد المضخات والمتاجر والطباعة</span>
          </button>

          <button
            onClick={() => setActiveTab('stations_map')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'stations_map' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-600'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>إحداثيات المحطات ورفع KMZ/إكسيل ({stations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wasalny_control')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'wasalny_control'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm font-black'
                : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/70 border border-emerald-200'
            }`}
          >
            <Navigation className="w-4 h-4 text-emerald-600" />
            <span>تحكم تطبيق وصّلني والملاحة 🚗</span>
          </button>

          <button
            onClick={() => setActiveTab('visibility')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'visibility' ? 'bg-white text-purple-700 shadow-sm border border-slate-200' : 'text-slate-600'
            }`}
          >
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>التحكم في إظهار وإخفاء عناصر العميل والفني</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_budget')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'sales_budget' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600'
            }`}
          >
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span>شيت مبيعات المحطات والإحداثيات والتحليل 📊</span>
          </button>

          <button
            onClick={() => setActiveTab('promotions_studio')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'promotions_studio' || activeTab === 'rewards' || activeTab === 'ideas_bank'
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-sm font-black'
                : 'text-amber-800 hover:text-amber-950 bg-amber-50/70 border border-amber-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>استوديو العروض والذكاء الاصطناعي وبنك الهدايا والأفكار والحاسبة 🤖</span>
          </button>

          <button
            onClick={() => setActiveTab('crew')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'crew' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>طاقم العمل والواتساب ({stationCrew.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'complaints' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-600'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span>الشكاوى وتقييم الفنيين ({complaints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('moen')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'moen' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-600'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>المساعد مُعين وحفظ الأسرار</span>
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'cms' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600'
            }`}
          >
            <Palette className="w-4 h-4 text-slate-800" />
            <span>تخصيص الكلمات والأسعار</span>
          </button>

          <button
            onClick={() => setActiveTab('rollback')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
              activeTab === 'rollback' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 bg-rose-50 border border-rose-200'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>استعادة النسخة والنسخ الاحتياطي 🔄</span>
          </button>
        </div>

        {/* Tab: Stations Map & KMZ/Excel Coordinates Upload */}
        {activeTab === 'stations_map' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  إدارة إحداثيات ومواقع محطات كارجاس (رفع إكسيل أو ملف KMZ/KML)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ارفع ملف إكسيل (.xlsx) أو ملف KMZ/KML يحتوي على مواقع المحطات، مراكز التحويل، مراكز الزيوت، فحص الأسطوانات
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  id="stationsFileInput"
                  accept=".xlsx, .xls, .kmz, .kml"
                  className="hidden"
                  onChange={handleStationsFileUpload}
                />
                <button
                  onClick={() => document.getElementById('stationsFileInput')?.click()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>رفع ملف إكسيل أو KMZ / KML</span>
                </button>

                <button
                  onClick={downloadStationsSampleExcel}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل نموذج إكسيل الإحداثيات</span>
                </button>

                <button
                  onClick={handleOpenAddStation}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة محطة / مركز جديد</span>
                </button>
              </div>
            </div>

            {/* Station Logo Customization Card for Map */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-emerald-500 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1">
                  {editStationLogoUrl ? (
                    <img src={editStationLogoUrl} alt="Station Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                      CARGAS
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">شعار محطات كارجاس المعمم على الخريطة</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    يظهر هذا اللوجو كرمز موحد لكافة دبابيس المحطات في الخريطة، وينبثق منه زر [🚗 وصّلني] لنظام الملاحة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <input
                  type="file"
                  id="stationLogoMapInput"
                  accept="image/*"
                  className="hidden"
                  onChange={handleStationLogoUpload}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('stationLogoMapInput')?.click()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع لوجو للمحطات</span>
                </button>
                {editStationLogoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditStationLogoUrl('');
                    }}
                    className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold py-2 px-3 rounded-xl transition"
                    title="استعادة الشعار الافتراضي"
                  >
                    حذف
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveAllSettings()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition shadow-xs"
                >
                  تعميم وحفظ 💾
                </button>
              </div>
            </div>

            {/* Modal / Form for editing station activities and details */}
            {(editingStation || isAddingStation) && (
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 border-2 border-emerald-500 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div>
                    <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                      <Edit className="w-5 h-5 text-emerald-600" />
                      {editingStation ? `تعديل أنشطة وبيانات: ${editingStation.name}` : 'إضافة موقع أو محطة كارجاس جديدة'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      حدد الأنشطة المعتمدة في هذا الموقع (تموين - تحويل - صيانة - زيوت - فحص اسطوانات) والإحداثيات
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingStation(null);
                      setIsAddingStation(false);
                    }}
                    className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg text-xs"
                  >
                    ✕ إغلاق
                  </button>
                </div>

                <form onSubmit={handleSaveStationActivities} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">اسم المركز ( المحطة ) *</label>
                      <input
                        type="text"
                        required
                        value={stationForm.name || ''}
                        onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                        placeholder="مثال: محطة كارجاس المعادي"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">كود المركز (المحطة) *</label>
                      <input
                        type="text"
                        required
                        value={stationForm.code || ''}
                        onChange={(e) => setStationForm({ ...stationForm, code: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold"
                        placeholder="مثال: CARGAS-MAADI-01"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">المحافظة</label>
                      <input
                        type="text"
                        value={stationForm.city || ''}
                        onChange={(e) => setStationForm({ ...stationForm, city: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs"
                        placeholder="القاهرة / الجيزة / الإسكندرية..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-800 mb-1">العنوان التفصيلي</label>
                      <input
                        type="text"
                        value={stationForm.address || ''}
                        onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs"
                        placeholder="الشارع، المعلم الرئيسي، بجوار..."
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">التصنيف الأساسي للمنشأة</label>
                      <select
                        value={stationForm.facilityType || 'cng_station'}
                        onChange={(e) => setStationForm({ ...stationForm, facilityType: e.target.value as any })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                      >
                        <option value="cng_station">⛽ محطة تموين غاز طبيعي</option>
                        <option value="conversion_center">🔧 مركز تحويل سيارات</option>
                        <option value="oil_center">🛢️ مركز خدمات وزيوت كارجاس</option>
                        <option value="canopy_oil">☂️ زيوت سريعة أسفل المظلة</option>
                        <option value="cylinder_inspection">🛡️ مركز فحص واختبار أسطوانات</option>
                      </select>
                    </div>
                  </div>

                  {/* Coordinates X & Y */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">خط العرض Y (Latitude)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={stationForm.latitude || 30.0444}
                        onChange={(e) => setStationForm({ ...stationForm, latitude: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">خط الطول X (Longitude)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={stationForm.longitude || 31.2357}
                        onChange={(e) => setStationForm({ ...stationForm, longitude: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">مواعيد العمل والهاتف</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={stationForm.workingHours || '24 ساعة'}
                          onChange={(e) => setStationForm({ ...stationForm, workingHours: e.target.value })}
                          className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px]"
                          placeholder="24 ساعة"
                        />
                        <input
                          type="text"
                          value={stationForm.phone || '19058'}
                          onChange={(e) => setStationForm({ ...stationForm, phone: e.target.value })}
                          className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px] font-mono"
                          placeholder="الهاتف"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Activities Selection (The core request: تموين - تحويل - صيانة - زيوت - فحص اسطوانات) */}
                  <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 space-y-2">
                    <label className="block font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-emerald-700" />
                      أنشطة وخدمات المحطة المعتمدة (تحكم كامل وتعديل من مدير النظام):
                    </label>
                    <p className="text-[11px] text-slate-600">
                      اضغط لتفعيل أو إلغاء أي نشاط في هذا الفرع؛ يتحدث تلقائياً على الخريطة وفلاتر البحث وبوابات السائقين:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                      {[
                        { id: 'تموين' as StationActivity, label: '⛽ تموين', desc: 'تموين غاز طبيعي CNG' },
                        { id: 'تحويل' as StationActivity, label: '🔧 تحويل', desc: 'تحويل سيارات للغاز' },
                        { id: 'صيانة' as StationActivity, label: '⚙️ صيانة', desc: 'صيانة أطقم الحقن والغاز' },
                        { id: 'زيوت' as StationActivity, label: '🛢️ زيوت', desc: 'معتمدة وأسفل المظلة' },
                        { id: 'فحص اسطوانات' as StationActivity, label: '🛡️ فحص اسطوانات', desc: 'اختبار واعتماد أسطوانات' },
                      ].map((item) => {
                        const isChecked = (stationForm.activities || []).includes(item.id);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => toggleStationActivity(item.id)}
                            className={`p-3 rounded-2xl border-2 text-right transition flex flex-col justify-between ${
                              isChecked
                                ? 'bg-white border-emerald-600 shadow-sm text-emerald-950 ring-2 ring-emerald-400/20'
                                : 'bg-white/60 border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-xs">{item.label}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Multiplier & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">مضاعف نقاط الولاء الترويجي</label>
                      <select
                        value={stationForm.promotionalPointsMultiplier || 1.0}
                        onChange={(e) => setStationForm({ ...stationForm, promotionalPointsMultiplier: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold"
                      >
                        <option value="1.0">1.0x (افتراضي للمحطات المستقرة)</option>
                        <option value="1.2">1.2x (ترويج خفيف)</option>
                        <option value="1.5">1.5x (ترويج متوسط للمحطات)</option>
                        <option value="2.0">2.0x (نقاط مضاعفة 2x للمحطات منخفضة المبيعات)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">حالة حجم المبيعات</label>
                      <select
                        value={stationForm.salesVolumeStatus || 'medium'}
                        onChange={(e) => setStationForm({ ...stationForm, salesVolumeStatus: e.target.value as any })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                      >
                        <option value="high">مرتفعة (مستقرة)</option>
                        <option value="medium">متوسطة</option>
                        <option value="low">منخفضة (تحتاج لتنشيط وترويج مكثف)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">الموازنة الترويجية المخصصة (جنية)</label>
                      <input
                        type="number"
                        value={stationForm.promotionalBudgetEgp || 0}
                        onChange={(e) => setStationForm({ ...stationForm, promotionalBudgetEgp: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* CCTV Unified Camera Connection & Crowd Level (Requested by User) */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base">
                          📹
                        </span>
                        <div>
                          <h5 className="font-black text-xs text-white">
                            كود ربط كاميرات المراقبة الموحد ورصد حالة زحام المحطة
                          </h5>
                          <p className="text-[10px] text-slate-400">
                            توزيع الكود الموحد على فنيي كاميرات المراقبة بالمحطة لرصد الزحام وبث الحالة للسائقين
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                          RTSP / IoT Ready
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      {/* CCTV Stream Code input & copy */}
                      <div className="sm:col-span-6 space-y-1">
                        <label className="block font-bold text-slate-300 text-[11px]">
                          كود ربط الكاميرات الموحد للمحطة (CCTV Code):
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={stationForm.cctvStreamCode || ''}
                            onChange={(e) => setStationForm({ ...stationForm, cctvStreamCode: e.target.value })}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-cyan-300"
                            placeholder="CARGAS-CCTV-01"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (stationForm.cctvStreamCode) {
                                navigator.clipboard.writeText(stationForm.cctvStreamCode);
                                setCopiedCctvStationId('modal');
                                setTimeout(() => setCopiedCctvStationId(null), 2500);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs whitespace-nowrap transition flex items-center gap-1"
                            title="نسخ كود الكاميرات الموحد"
                          >
                            {copiedCctvStationId === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCctvStationId === 'modal' ? 'تم النسخ!' : 'نسخ الكود'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanCode = (stationForm.code || 'ST').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                              const newCode = `CARGAS-CCTV-${cleanCode}-${Math.floor(1000 + Math.random() * 9000)}`;
                              setStationForm({ ...stationForm, cctvStreamCode: newCode });
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl border border-slate-700"
                            title="توليد كود جديد"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Crowd Level */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block font-bold text-slate-300 text-[11px]">
                          حالة زحام المحطة المرصودة:
                        </label>
                        <select
                          value={stationForm.crowdLevel || 'فاضية وسريعة'}
                          onChange={(e) => setStationForm({ ...stationForm, crowdLevel: e.target.value as any })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-bold text-emerald-300"
                        >
                          <option value="فاضية وسريعة">🟢 فاضية وسريعة (2-4 د)</option>
                          <option value="متوسطة">🟡 متوسطة (5-10 د)</option>
                          <option value="مزدحمة (طابور)">🔴 مزدحمة طابور (15+ د)</option>
                        </select>
                      </div>

                      {/* Estimated wait time */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block font-bold text-slate-300 text-[11px]">
                          وقت الانتظار التقديري (دقيقة):
                        </label>
                        <input
                          type="number"
                          value={stationForm.crowdEstimatedWaitMinutes || 3}
                          onChange={(e) => setStationForm({ ...stationForm, crowdEstimatedWaitMinutes: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-amber-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ الأنشطة والتعديلات فوراً 💾</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStation(null);
                        setIsAddingStation(false);
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Stations Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">الكود</th>
                    <th className="p-3">اسم المحطة / المركز</th>
                    <th className="p-3">الأنشطة المعتمدة</th>
                    <th className="p-3">المحافظة والعنوان</th>
                    <th className="p-3 font-mono">الإحداثيات (X, Y)</th>
                    <th className="p-3 text-center">المبيعات / الترويج</th>
                    <th className="p-3 text-center">مضاعف النقاط</th>
                    <th className="p-3 text-center">كاميرات المراقبة / الزحام</th>
                    <th className="p-3 text-center">تعديل الأنشطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stations.map((st) => {
                    const currentActs = st.activities || ['تموين', 'زيوت'];
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono font-bold text-slate-700">{st.code}</td>
                        <td className="p-3 font-bold text-slate-900">{st.name}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {currentActs.map((act) => {
                              let badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
                              let icon = '⛽';
                              if (act === 'تموين') {
                                badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                icon = '⛽';
                              } else if (act === 'تحويل') {
                                badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                                icon = '🔧';
                              } else if (act === 'صيانة') {
                                badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                                icon = '⚙️';
                              } else if (act === 'زيوت') {
                                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                                icon = '🛢️';
                              } else if (act === 'فحص اسطوانات') {
                                badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                                icon = '🛡️';
                              }
                              return (
                                <span
                                  key={act}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}
                                >
                                  {icon} {act}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">{st.city} - {st.address}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-500" dir="ltr">
                          {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              st.salesVolumeStatus === 'low'
                                ? 'bg-rose-100 text-rose-800'
                                : st.salesVolumeStatus === 'high'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {st.salesVolumeStatus === 'low' ? 'منخفضة المبيعات' : st.salesVolumeStatus === 'high' ? 'مرتفعة' : 'متوسطة'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {st.promotionalPointsMultiplier}x
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="space-y-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                st.crowdLevel === 'مزدحمة (طابور)'
                                  ? 'bg-rose-100 text-rose-800'
                                  : st.crowdLevel === 'متوسطة'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {st.crowdLevel || 'فاضية وسريعة 🟢'} (~{st.crowdEstimatedWaitMinutes || 3} د)
                            </span>
                            {st.cctvStreamCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(st.cctvStreamCode!);
                                  setCopiedCctvStationId(st.id);
                                  setTimeout(() => setCopiedCctvStationId(null), 2500);
                                }}
                                className="block mx-auto font-mono text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition border border-slate-200"
                                title="نسخ كود كاميرات المراقبة"
                              >
                                {copiedCctvStationId === st.id ? '✓ تم نسخ الكود' : `📹 ${st.cctvStreamCode}`}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditStation(st)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition flex items-center gap-1 shadow-2xs"
                              title="تعديل الأنشطة (تموين، تحويل، صيانة، زيوت، فحص اسطوانات)"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>تعديل الأنشطة</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStation(st.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                              title="حذف المحطة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Wasalny Application Master Control Center (تحكم كامل في تطبيق وصلني) */}
        {activeTab === 'wasalny_control' && (
          <div className="p-6 space-y-6 animate-in fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-3xl shadow-md shrink-0">
                  🚗
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">
                      لوحة التحكم الشاملة لتطبيق "وصّلني" والملاحة
                    </h3>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                      تحكم كامل 100%
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">
                    التحكم في تفعيل وصّلني • اختيار الصوت المرشد (صوت وضاح المصري) • استراتيجية توجيه السائقين للمحطات • الربط مع خرائط جوجل • رادار المسافة
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTestWadahVoice}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md active:scale-95"
                  title="استمع لتجربة صوت وضاح المصري"
                >
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>🔊 تجربة صوت وضاح المصري</span>
                </button>

                <button
                  onClick={() => handleSaveWasalnySettings()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ إعدادات وصّلني 💾</span>
                </button>
              </div>
            </div>

            {/* Grid of Control Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* 1. General Status & Activation */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚙️</span>
                    <h4 className="font-black text-sm text-slate-900">حالة التفعيل والظهور للعملاء</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${wasalnyEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {wasalnyEnabled ? 'مفعل وشغال' : 'معطل ومخفي'}
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">تفعيل تطبيق "وصّلني" للعملاء والسائقين</span>
                      <span className="text-[11px] text-slate-500">إتاحة أيقونة وصّلني والتوجيه الملاحي للمحطات</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={wasalnyEnabled}
                      onChange={(e) => setWasalnyEnabled(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded"
                    />
                  </label>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      مسمى أيقونة وبطاقة وصّلني في واجهة العميل:
                    </label>
                    <input
                      type="text"
                      value={wasalnyBtnLabel}
                      onChange={(e) => setWasalnyBtnLabel(e.target.value)}
                      placeholder="وصلني لأقرب محطة كارجاس ⛽"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      النص التوضيحي تحت "وصلني لأقرب محطة":
                    </label>
                    <input
                      type="text"
                      value={wasalnySubtitle}
                      onChange={(e) => setWasalnySubtitle(e.target.value)}
                      placeholder="توجيه ذكي وملاحة فورية لأقرب محطة تموين كارجاس CNG مجهزة وسريعة"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800"
                    />
                  </div>

                  {/* Logo & Cover Image Customization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    {/* Cargas Logo on Map */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">شعار كارجاس على الخريطة:</span>
                        {wasalnyLogoBadge && (
                          <button
                            type="button"
                            onClick={() => setWasalnyLogoBadge('')}
                            className="text-[10px] text-rose-600 font-bold hover:underline"
                          >
                            إزالة
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {wasalnyLogoBadge ? (
                            <img src={wasalnyLogoBadge} alt="Cargas Badge" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-lg">⛽</span>
                          )}
                        </div>
                        <input
                          type="file"
                          id="wasalnyLogoInput"
                          accept="image/*"
                          className="hidden"
                          onChange={handleWasalnyLogoUpload}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('wasalnyLogoInput')?.click()}
                          className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <Upload className="w-3 h-3 text-emerald-600" />
                          <span>رفع لوجو كارجاس</span>
                        </button>
                      </div>
                    </div>

                    {/* Map Background Image */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">صورة خلفية بطاقة الخريطة:</span>
                        {wasalnyCoverImage && (
                          <button
                            type="button"
                            onClick={() => setWasalnyCoverImage('')}
                            className="text-[10px] text-rose-600 font-bold hover:underline"
                          >
                            استعادة الافتراضية
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {wasalnyCoverImage ? (
                            <img src={wasalnyCoverImage} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">🗺️</span>
                          )}
                        </div>
                        <input
                          type="file"
                          id="wasalnyCoverInput"
                          accept="image/*"
                          className="hidden"
                          onChange={handleWasalnyCoverUpload}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('wasalnyCoverInput')?.click()}
                          className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <Upload className="w-3 h-3 text-blue-600" />
                          <span>رفع خلفية الخريطة</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Upload Stations Locations File (Excel/JSON) */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                        <span>تغذية وتحديث محطات كارجاس والخريطة:</span>
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                        {stations.length} محطة مسجلة
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      ارفع ملف إكسيل (.xlsx) أو JSON يحتوي على أسماء المحطات والإحداثيات (خط العرض وخط الطول) لتحديث قاعدة بيانات الملاحة وخريطة وصّلني فوراً!
                    </p>
                    <input
                      type="file"
                      id="wasalnyStationsSheetInput"
                      accept=".xlsx, .xls, .json"
                      className="hidden"
                      onChange={handleUploadStationsSheetForWasalny}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('wasalnyStationsSheetInput')?.click()}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع شيت إكسيل أو JSON لمحطات كارجاس 📍</span>
                    </button>
                  </div>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">إظهار حالة زحام المحطات وكاميرات المراقبة</span>
                      <span className="text-[11px] text-slate-500">عرض حالة الزحام الخضراء ووقت الانتظار التقديري داخل وصّلني</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={wasalnyShowCrowd}
                      onChange={(e) => setWasalnyShowCrowd(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* 2. Voice Guidance Settings */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎙️</span>
                    <h4 className="font-black text-sm text-slate-900">الصوت المرشد والإرشاد الصوتي</h4>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    صوت مصري أصيل
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      اختيار نبرة الصوت المرشد في وصّلني:
                    </label>
                    <select
                      value={wasalnyVoice}
                      onChange={(e) => setWasalnyVoice(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    >
                      <option value="wadah_egyptian">🔊 صوت وضاح المصري الأصيل (ودود وشبابي ومجاني) [موصى به]</option>
                      <option value="moen_advisor">🎙️ صوت مُعِين الاستشاري الذكي (خبير الأعمال والغاز)</option>
                      <option value="standard_arabic">📢 لغة عربية فصحى رسمية</option>
                      <option value="silent">🔇 كتم الصوت (صامت بدون إرشاد صوتي)</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">التشغيل الصوتي التلقائي فور فتح وصّلني</span>
                      <span className="text-[11px] text-slate-500">تحدث المرشد فوراً لراحة السائق أثناء القيادة دون الحاجة للضغط</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={wasalnyAutoVoice}
                      onChange={(e) => setWasalnyAutoVoice(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded"
                    />
                  </label>

                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div className="text-emerald-950">
                      <span className="font-bold block text-xs">صوت وضاح المصري جاهز ومجاني 100%</span>
                      <span className="text-[10px] text-emerald-800">يعمل عبر متصفح الهاتف والكمبيوتر فوراً بدون اشتراكات مدفوعة</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestWadahVoice}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3 py-1.5 rounded-xl transition shrink-0"
                    >
                      تجربة الصوت 🔊
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Driver Routing Strategy & Priority Station */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h4 className="font-black text-sm text-slate-900">استراتيجية توجيه السائقين للمحطات</h4>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    ذكاء المبيعات
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      طريقة تحديد المحطة المستهدفة للسائق:
                    </label>
                    <select
                      value={wasalnyTargetMode}
                      onChange={(e) => setWasalnyTargetMode(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    >
                      <option value="auto_gps">🛰️ رصد تلقائي لأقرب محطة حقيقية لموقع السائق عبر GPS</option>
                      <option value="featured_station">⭐ توجيه ترويجي ذكي لمحطة معينة لدعم مبيعاتها وزيادة الإقبال</option>
                    </select>
                  </div>

                  {wasalnyTargetMode === 'featured_station' && (
                    <div className="space-y-1 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                      <label className="block font-bold text-amber-950 text-[11px]">
                        اختر المحطة المستهدفة لتوجيه السائقين إليها:
                      </label>
                      <select
                        value={wasalnyFeaturedStationId}
                        onChange={(e) => setWasalnyFeaturedStationId(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                      >
                        {stations.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.city}) — مضاعف نقاط {st.promotionalPointsMultiplier || 1}x
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-amber-800 block mt-1">
                        سيقوم تطبيق وصّلني بإبراز هذه المحطة كأولوية قصوى ودعوة السائقين لزيارتها!
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      مسافة رادار تنبيه الوصول للمحطة:
                    </label>
                    <select
                      value={wasalnyAlertDistance}
                      onChange={(e) => setWasalnyAlertDistance(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 font-mono"
                    >
                      <option value={50}>50 متر (دقة محيط المضخة)</option>
                      <option value={100}>100 متر (مدخل المحطة)</option>
                      <option value={150}>150 متر (اقتراب قياسي) [افتراضي]</option>
                      <option value={300}>300 متر (الشارع المؤدي للمحطة)</option>
                      <option value={500}>500 متر (نطاق نصف كيلو)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Navigation & Maps Provider */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🗺️</span>
                    <h4 className="font-black text-sm text-slate-900">مزود الخرائط والملاحة</h4>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                    خرائط جوجل + تفاعلية
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      التصرف التلقائي عند الضغط على "وصّلني":
                    </label>
                    <select
                      value={wasalnyProvider}
                      onChange={(e) => setWasalnyProvider(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    >
                      <option value="google_maps">🚗 فتح نظام الملاحة التفاعلي لخرائط جوجل (Google Maps) فوراً</option>
                      <option value="in_app">📱 فتح الخريطة التفاعلية المجانية داخل التطبيق</option>
                      <option value="ask_user">❓ سؤال السائق وتخييره بين الخريطة الداخلية وجوجل مابس</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">
                      رسالة الترحيب والتوجيه المخصصة التي تظهر للسائق داخل وصّلني:
                    </label>
                    <textarea
                      rows={3}
                      value={wasalnyWelcomeMsg}
                      onChange={(e) => setWasalnyWelcomeMsg(e.target.value)}
                      placeholder="اكتب التوجيهات المخصصة هنا..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 leading-relaxed resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h5 className="font-black text-slate-900 text-xs">حفظ كافة تعديلات تطبيق وصّلني</h5>
                  <p className="text-[11px] text-slate-500">يتم تطبيق التعديلات لحظياً على كافة السائقين والصفحات</p>
                </div>
              </div>

              <button
                onClick={() => handleSaveWasalnySettings()}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs py-3 px-8 rounded-2xl transition shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتعميم إعدادات وصّلني فوراً 💾</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab: Visibility & Layout Reordering Control (ترتيب ومواضع عناصر صفحتي العميل والفني) */}
        {activeTab === 'visibility' && (() => {
          const DRIVER_SECTION_META: Record<string, { title: string; icon: string; desc: string; visKey?: keyof typeof driverVis }> = {
            wasalny_hero: { title: 'بطاقة تطبيق وصّلني وملاحة أقرب محطة (في صدر الصفحة)', icon: '🚗', desc: 'ملاحة فورية، زر التوجيه الصوتي، واختيار خرائط كارجاس أو جوجل' },
            promotional_banner: { title: 'بانر العروض والمسابقات وشرح برنامج الولاء', icon: '✨', desc: 'بانر العروض الترويجية والمسابقات وصياغة الذكاء الاصطناعي (معين)', visKey: 'showPromotionalBanner' },
            golden_card: { title: 'كارت كارجاس الذهبي والباركود ونقاط الولاء', icon: '💳', desc: 'بطاقة العضوية والـ QR للتموين ورصيد النقاط والشريحة', visKey: 'showGoldenCard' },
            rewards_bank: { title: 'بنك الهدايا والمكافآت واستبدال الأمتار المجانية', icon: '🎁', desc: 'استبدال النقاط بأمتار غاز وزيوت وكوبونات مع كود الـ QR للفني', visKey: 'showRewardsBank' },
            fueling_count_stats: { title: 'إحصائيات التردد وعدد مرات التموين', icon: '⛽', desc: 'عدد مرات التموين من المحطة ومن الطلمبة لبناء الارتباط', visKey: 'showFuelingCountStats' },
            maintenance_schedule: { title: 'جدول الصيانة الدورية الذكي للسيارة', icon: '🔧', desc: 'متابعة مواعيد غيار الزيت والبوجيهات وفلاتر الغاز الطبيعي', visKey: 'showMaintenanceSchedule' },
            fueling_history: { title: 'سجل التموينات السابقة والإيصالات', icon: '📜', desc: 'سجل العمليات السابقة مع تفاصيل التاريخ والكمية والنقاط', visKey: 'showFuelingHistory' },
            service_rating: { title: 'تقييم الخدمة ومعاملة الفني', icon: '⭐', desc: 'تقييم النجوم والسرعة والسلوك ونموذج الشكاوى', visKey: 'showServiceRating' },
            complaints_box: { title: 'صندوق الشكاوى والمقترحات المباشرة', icon: '📨', desc: 'إرسال مقترح أو شكوى مباشرة لإدارة كارجاس', visKey: 'showComplaintsBox' },
          };

          const TECH_SECTION_META: Record<string, { title: string; icon: string; desc: string; visKey?: keyof typeof techVis }> = {
            shift_stats: { title: 'بطاقة الوردية وإحصائيات المبيعات والأمتار اليومية', icon: '📊', desc: 'إجمالي الأمتار والمبيعات والعمليات المنفذة في وردية الفني', visKey: 'showShiftStats' },
            welcome_bonus: { title: 'بنك النقاط الترحيبية المتاح للفني لتوزيعه (+25, +50, +100)', icon: '🎁', desc: 'حصة الوردية من النقاط الترحيبية لبناء ولاء العميل للفني والمحطة' },
            camera_scanner: { title: 'كاميرا مسح كود الـ QR لسيارة العميل واستبدال الهدايا', icon: '📷', desc: 'الماسح الضوئي الذكي لقراءة بيانات السائق أو كود الأمتار المجانية', visKey: 'showCameraScanner' },
            manual_entry: { title: 'حقل الإدخال اليدوي لرقم اللوحة أو كود الاستبدال', icon: '🔢', desc: 'إمكانية إدخال رقم لوحة السيارة يدوياً في حال تعذر المسح', visKey: 'showManualEntry' },
            fueling_form: { title: 'نموذج تنفيذ التموين (الطلمبة، الأمتار، العداد الاختياري)', icon: '⛽', desc: 'اختيار رقم الطلمبة وإدخال كمية الأمتار وإتمام التموين أو الاستبدال' },
            gps_radar: { title: 'رادار فحص نطاق الـ 10 أمتار للـ GPS', icon: '📍', desc: 'التحقق الصارم من التواجد الفعلي داخل المحطة لمنع التلاعب', visKey: 'showGpsRadar' },
            technician_incentives: { title: 'نظام حوافز ومكافآت ونقاط الفني والدرجات', icon: '🏅', desc: 'حافز التموين ومكافآت السلوك الممتاز', visKey: 'showTechnicianIncentives' },
          };

          return (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-purple-600" />
                    التحكم في ترتيب ومواضع عناصر وبنرات ومساحات صفحة العميل والفني ومصفوفة الظهور 📱
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تحكم كامل لمدير النظام: نقل وتحريك العناصر للأعلى والأسفل وتحديد الترتيب الدقيق لكل مساحة وبانر في التطبيق
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setVisibilitySubTab('reorder_layout')}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      visibilitySubTab === 'reorder_layout'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>🎯 ترتيب ومواضع العناصر (تحريك ونقل)</span>
                  </button>
                  <button
                    onClick={() => setVisibilitySubTab('checkboxes')}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      visibilitySubTab === 'checkboxes'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>👁️ مصفوفة الإظهار والإخفاء السريعة</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Visual Reordering & Layout Manager */}
              {visibilitySubTab === 'reorder_layout' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        ↕️
                      </span>
                      <div>
                        <span className="font-bold text-purple-950 block">
                          لوحة تحريك ونقل ترتيب العناصر في الموبايل
                        </span>
                        <span className="text-[11px] text-purple-700">
                          استخدم أسهم (▲ تحريك لأعلى) و (▼ تحريك لأسفل) لتغيير موضع أي قسم وبانر كما تراه مناسباً
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleResetLayoutToDefault}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                        title="استعادة الترتيب النموذجي الافتراضي"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>استعادة الترتيب النموذجي</span>
                      </button>
                      <button
                        onClick={handleSaveLayoutSettings}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ الترتيب 💾</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Driver Portal Section Reorder */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🚗</span>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm">
                              ترتيب عناصر صفحة العميل (السائق)
                            </h4>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({driverSectionsOrder.length} عناصر مرتبة من الأعلى للأسفل)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {driverSectionsOrder.map((sectionKey, index) => {
                          const meta = DRIVER_SECTION_META[sectionKey] || {
                            title: sectionKey,
                            icon: '📦',
                            desc: 'قسم مخصص',
                          };
                          const isVis = meta.visKey ? driverVis[meta.visKey] : true;

                          return (
                            <div
                              key={sectionKey}
                              className={`bg-white p-3 rounded-2xl border transition shadow-2xs flex items-center justify-between gap-3 ${
                                isVis ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-900 font-mono font-black text-xs flex items-center justify-center shrink-0">
                                  {index + 1}
                                </span>
                                <span className="text-base shrink-0">{meta.icon}</span>
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 text-xs block truncate">
                                    {meta.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {meta.desc}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {meta.visKey && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDriverVis({
                                        ...driverVis,
                                        [meta.visKey!]: !isVis,
                                      })
                                    }
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                      isVis
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}
                                    title={isVis ? 'ظاهر للعميل' : 'مخفي عن العميل'}
                                  >
                                    {isVis ? 'ظاهر' : 'مخفي'}
                                  </button>
                                )}

                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveDriverSection(index, 'up')}
                                    className="p-1 rounded bg-slate-100 hover:bg-purple-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-slate-100 transition"
                                    title="تحريك لأعلى"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === driverSectionsOrder.length - 1}
                                    onClick={() => moveDriverSection(index, 'down')}
                                    className="p-1 rounded bg-slate-100 hover:bg-purple-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-slate-100 transition"
                                    title="تحريك لأسفل"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Technician Portal Section Reorder */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">👷‍♂️</span>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm">
                              ترتيب عناصر صفحة فني التموين (الوردية)
                            </h4>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({techSectionsOrder.length} عناصر مرتبة من الأعلى للأسفل)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {techSectionsOrder.map((sectionKey, index) => {
                          const meta = TECH_SECTION_META[sectionKey] || {
                            title: sectionKey,
                            icon: '📦',
                            desc: 'قسم مخصص',
                          };
                          const isVis = meta.visKey ? techVis[meta.visKey] : true;

                          return (
                            <div
                              key={sectionKey}
                              className={`bg-white p-3 rounded-2xl border transition shadow-2xs flex items-center justify-between gap-3 ${
                                isVis ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-900 font-mono font-black text-xs flex items-center justify-center shrink-0">
                                  {index + 1}
                                </span>
                                <span className="text-base shrink-0">{meta.icon}</span>
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 text-xs block truncate">
                                    {meta.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {meta.desc}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {meta.visKey && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTechVis({
                                        ...techVis,
                                        [meta.visKey!]: !isVis,
                                      })
                                    }
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                      isVis
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}
                                    title={isVis ? 'ظاهر للفني' : 'مخفي عن الفني'}
                                  >
                                    {isVis ? 'ظاهر' : 'مخفي'}
                                  </button>
                                )}

                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveTechSection(index, 'up')}
                                    className="p-1 rounded bg-slate-100 hover:bg-purple-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-slate-100 transition"
                                    title="تحريك لأعلى"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === techSectionsOrder.length - 1}
                                    onClick={() => moveTechSection(index, 'down')}
                                    className="p-1 rounded bg-slate-100 hover:bg-purple-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-slate-100 transition"
                                    title="تحريك لأسفل"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500">
                      يتم حفظ ترتيب العناصر فورياً وتطبيقه في واجهات العميل والفني بالموبايل
                    </span>
                    <button
                      onClick={handleSaveLayoutSettings}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-2xl text-xs transition shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ ترتيب ومواضع الواجهات فوراً 💾</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Checkboxes Grid (مصفوفة الإظهار والإخفاء) */}
              {visibilitySubTab === 'checkboxes' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Driver Portal Controls */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <h4 className="font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                        <span>🚗 محتويات صفحة العميل (السائق):</span>
                      </h4>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">أيقونة تعديل بيانات السيارة والملف</span>
                          <span className="text-[10px] text-slate-500">مطلوب افتراضياً إخفاؤها لمنع تعديل السائق لبياناته</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showEditProfile}
                          onChange={(e) => setDriverVis({ ...driverVis, showEditProfile: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">خريطة وأيقونة أقرب محطة كارجاس</span>
                          <span className="text-[10px] text-slate-500">إظهار الخريطة ومحدد أقرب محطة وتوجيه GPS</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showNearestStationMap}
                          onChange={(e) => setDriverVis({ ...driverVis, showNearestStationMap: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">كارت الولاء الذهبي والرصيد</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showGoldenCard}
                          onChange={(e) => setDriverVis({ ...driverVis, showGoldenCard: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">بنك الهدايا واستبدال النقاط</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showRewardsBank}
                          onChange={(e) => setDriverVis({ ...driverVis, showRewardsBank: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">جدول الصيانة الدورية الذكي</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showMaintenanceSchedule}
                          onChange={(e) => setDriverVis({ ...driverVis, showMaintenanceSchedule: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">سجل التموينات السابقة</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showFuelingHistory}
                          onChange={(e) => setDriverVis({ ...driverVis, showFuelingHistory: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">تقييم الخدمة ومعاملة الفني وقسم الشكاوى</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showServiceRating}
                          onChange={(e) => setDriverVis({ ...driverVis, showServiceRating: e.target.checked, showComplaintsBox: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">رقم مرات التموين من المحطة ومن الطلمبة</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showFuelingCountStats}
                          onChange={(e) => setDriverVis({ ...driverVis, showFuelingCountStats: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">بانر العروض والمسابقات وشرح برنامج الولاء للعملاء</span>
                          <span className="text-[10px] text-slate-500">إظهار البانر التفاعلي أعلى شاشة السائق بالعروض المصاغة بالذكاء الاصطناعي</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={driverVis.showPromotionalBanner}
                          onChange={(e) => setDriverVis({ ...driverVis, showPromotionalBanner: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>
                    </div>

                    {/* Technician Portal Controls */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <h4 className="font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                        <span>👷‍♂️ محتويات صفحة فني التموين (الوردية):</span>
                      </h4>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">كاميرا مسح باركود السيارات المباشرة</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={techVis.showCameraScanner}
                          onChange={(e) => setTechVis({ ...techVis, showCameraScanner: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">حقل الإدخال اليدوي لرقم اللوحة</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={techVis.showManualEntry}
                          onChange={(e) => setTechVis({ ...techVis, showManualEntry: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">نظام حوافز ومكافآت ونقاط الفني</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={techVis.showTechnicianIncentives}
                          onChange={(e) => setTechVis({ ...techVis, showTechnicianIncentives: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">رادار فحص نطاق الـ 10 أمتار للـ GPS</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={techVis.showGpsRadar}
                          onChange={(e) => setTechVis({ ...techVis, showGpsRadar: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">إحصائيات إنجاز الوردية وإجمالي المبيعات</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={techVis.showShiftStats}
                          onChange={(e) => setTechVis({ ...techVis, showShiftStats: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900 block">رقم مرات التموين من المحطة ومن الطلمبة</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={techVis.showFuelingCountStats}
                          onChange={(e) => setTechVis({ ...techVis, showFuelingCountStats: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveAllSettings()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-2xl text-xs transition shadow-md"
                  >
                    حفظ مصفوفة الظهور والإخفاء فوراً 💾
                  </button>
                </div>
              )}
            </div>
          );
        })()}


        {/* Tab: Station Sales, ROI, & Promotion Budget Allocation */}
        {activeTab === 'sales_budget' && (() => {
          // استخراج كافة الشهور المتوفرة في سجلات المبيعات
          const allMonthsSet = new Set<string>();
          salesRecords.forEach((r) => {
            if (r.monthlyBreakdown) {
              Object.keys(r.monthlyBreakdown).forEach((m) => allMonthsSet.add(m));
            }
          });
          const monthOrder = [
            'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
          ].filter((m) => allMonthsSet.has(m));
          const matrixMonths = monthOrder.length > 0 ? monthOrder : Array.from(allMonthsSet);

          // حساب الإجماليات السنوية العامة لكافة محطات الشركة
          const corporateTotals = salesRecords.reduce(
            (acc, r) => {
              const act = r.annualActualM3 ?? r.currentSalesM3 ?? 0;
              const tgt = r.annualTargetM3 ?? r.targetSalesM3 ?? 0;
              const dev = r.annualVarianceM3 ?? (act - tgt);
              return {
                annualActual: acc.annualActual + act,
                annualTarget: acc.annualTarget + tgt,
                annualVariance: acc.annualVariance + dev,
                achievedCount: acc.achievedCount + (act >= tgt ? 1 : 0),
                deficitCount: acc.deficitCount + (act < tgt ? 1 : 0),
                totalBudget: acc.totalBudget + r.allocatedBudgetEgp,
              };
            },
            { annualActual: 0, annualTarget: 0, annualVariance: 0, achievedCount: 0, deficitCount: 0, totalBudget: 0 }
          );

          const corporateAchievementPct = corporateTotals.annualTarget > 0
            ? Number(((corporateTotals.annualActual / corporateTotals.annualTarget) * 100).toFixed(1))
            : 100;
          const corporateVariancePct = corporateTotals.annualTarget > 0
            ? Number(((corporateTotals.annualVariance / corporateTotals.annualTarget) * 100).toFixed(1))
            : 0;

          // إجماليات كل شهر على مستوى الشركة بالكامل
          const monthlyCorporateTotals: Record<string, { actual: number; target: number; variance: number; variancePct: number }> = {};
          matrixMonths.forEach((m) => {
            let mAct = 0;
            let mTgt = 0;
            salesRecords.forEach((r) => {
              const metric = r.monthlyMetrics?.[m];
              mAct += metric?.actual ?? r.monthlyBreakdown?.[m] ?? 0;
              mTgt += metric?.target ?? r.monthlyTargets?.[m] ?? 0;
            });
            const mVar = mAct - mTgt;
            const mVarPct = mTgt > 0 ? Number(((mVar / mTgt) * 100).toFixed(1)) : 0;
            monthlyCorporateTotals[m] = { actual: mAct, target: mTgt, variance: mVar, variancePct: mVarPct };
          });

          // تصفية المحطات حسب البحث
          const filteredSalesRecords = salesRecords.filter((r) => {
            if (!salesSearchQuery) return true;
            const q = salesSearchQuery.toLowerCase();
            return (
              r.stationName.toLowerCase().includes(q) ||
              r.city.toLowerCase().includes(q) ||
              (r.stationCode && r.stationCode.toLowerCase().includes(q))
            );
          });

          return (
            <div className="p-6 space-y-6">
              {/* Header & Main Actions */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    شيت مبيعات المحطات التفصيلي (الشهور والمستهدف والانحراف والسنوي)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    عرض دقيق لشيت الإكسيل المرفوع بمصفوفة الشهور والفعلي والمستهدف والانحراف وإجمالي مبيعات العام
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => exportSalesMatrixExcel(salesRecords, customColumns)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    title="تحميل مصفوفة الشهور والانحرافات السنوية كملف إكسيل كامل"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير مصفوفة المبيعات (.xlsx)</span>
                  </button>

                  <input
                    type="file"
                    id="salesFileInput"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleSalesFileUpload}
                  />
                  <button
                    onClick={() => document.getElementById('salesFileInput')?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>رفع شيت مبيعات جديد (Excel)</span>
                  </button>

                  {/* زر مسح بيانات تجريبية أو مرفوعة سابقاً */}
                  <button
                    onClick={handleClearSalesData}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                    title="مسح البيانات التجريبية أو المرفوعة سابقاً لتصفير الشيت ورفع ملف جديد نظيف تماماً"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>مسح بيانات تجريبية أو مرفوعة سابقاً 🗑️</span>
                  </button>

                  <button
                    onClick={handleRestoreDefaultSalesData}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center gap-1 border border-slate-200"
                    title="استعادة الشيت النموذجي الافتراضي لكارجاس"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الشيت النموذجي</span>
                  </button>

                  <button
                    onClick={downloadSalesSampleExcel}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center gap-1 border border-slate-200"
                    title="تحميل نموذج شيت إكسيل فارغ"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل نموذج الشيت</span>
                  </button>
                </div>
              </div>

              {/* Sub-view Switcher Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setSalesSubTab('sheet_raw')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    salesSubTab === 'sheet_raw'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>عرض الشيت كما هو بجميع الأعمدة والخانات 📑 (الأصل)</span>
                </button>

                <button
                  onClick={() => setSalesSubTab('matrix')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    salesSubTab === 'matrix'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>مصفوفة الشهور والتحليل والمستهدف 📊</span>
                </button>

                <button
                  onClick={() => setSalesSubTab('allocation')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    salesSubTab === 'allocation'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>توزيع الموازنة ومضاعف نقاط الولاء ودراسة الجدوى 💰</span>
                </button>
              </div>

              {/* Sub-view 0: Pure Raw Sheet View Exactly As Uploaded (الشهور الـ 12 والإحداثيات والخانات المخصصة) */}
              {salesSubTab === 'sheet_raw' && (
                <div className="space-y-4">
                  {/* Info Banner with KMZ & Map Sync */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-950 text-sm">
                          📑 شيت مبيعات مراكز كارجاس بالكامل (يناير حتى ديسمبر + الإحداثيات)
                        </span>
                        <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                          المظهر الأصلي المعتمد
                        </span>
                      </div>
                      <p className="text-slate-600">
                        يعرض الجدول كافة المراكز (المحطات) وإحداثيات X و Y والشهور الـ 12، مع إمكانية إضافة وتعديل أي خانات حسابية حرة (+، -، ×، ÷، %).
                      </p>
                    </div>

                    <button
                      onClick={handleSyncCoordinatesWithKmzAndMap}
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black py-2.5 px-4 rounded-xl shadow-sm transition flex items-center gap-2 shrink-0"
                    >
                      <MapPin className="w-4 h-4 text-emerald-200" />
                      <span>مقارنة الإحداثيات بـ KMZ والمزامنة على الخريطة 🗺️</span>
                    </button>
                  </div>

                  {/* Analytical Columns Toggle Bar & Search */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-800 flex items-center gap-1.5 ml-1">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>أعمدة التحليل المالي الذكي (إظهار/إخفاء):</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowSalesAchievementCol(!showSalesAchievementCol)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                          showSalesAchievementCol
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{showSalesAchievementCol ? '✓' : '○'} نسبة التحقيق %</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSalesMonthlyAvgCol(!showSalesMonthlyAvgCol)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                          showSalesMonthlyAvgCol
                            ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{showSalesMonthlyAvgCol ? '✓' : '○'} المتوسط الشهري (م³)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSalesRevenueCol(!showSalesRevenueCol)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                          showSalesRevenueCol
                            ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{showSalesRevenueCol ? '✓' : '○'} القيمة بالجنيه (13 ج/م³)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSalesVarianceCol(!showSalesVarianceCol)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                          showSalesVarianceCol
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{showSalesVarianceCol ? '✓' : '○'} الانحراف (+/-)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSalesGradeCol(!showSalesGradeCol)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                          showSalesGradeCol
                            ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{showSalesGradeCol ? '✓' : '○'} تصنيف الأداء (أ/ب/ج)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap">بحث في الشيت:</span>
                      <input
                        type="text"
                        value={salesSearchQuery}
                        onChange={(e) => setSalesSearchQuery(e.target.value)}
                        placeholder="ابحث بأي مركز أو محافظة أو كلمة..."
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs w-full md:w-56 font-sans"
                      />
                    </div>
                  </div>

                  {/* Empty State when data has been cleared */}
                  {salesRecords.length === 0 && (!rawSheetData || rawSheetData.rows.length === 0) ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center shadow-xs space-y-4">
                      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-black">
                        🗑️
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-slate-900">
                          تم مسح وتصفير كافة بيانات الشيت التجريبية والمرفوعة سابقاً بنجاح
                        </h4>
                        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                          الشيت الآن فارغ ونظيف 100%. عند رفع ملف الإكسيل الجديد الخاص بك سيتم قراءته وعرضه هنا في هذا الجدول فوراً كما هو تماماً بجميع أعمدته الأصلية وبنفس المسميات دون أي تعديل أو اختصار.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => document.getElementById('salesFileInput')?.click()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2.5 px-5 rounded-2xl transition flex items-center gap-2 shadow-sm active:scale-95"
                        >
                          <Upload className="w-4 h-4" />
                          <span>رفع ملف الإكسيل الجديد الآن (.xlsx)</span>
                        </button>
                        <button
                          onClick={handleRestoreDefaultSalesData}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-2xl transition flex items-center gap-2 border border-slate-200 active:scale-95"
                        >
                          <RotateCcw className="w-4 h-4 text-slate-500" />
                          <span>استعادة الشيت النموذجي الافتراضي</span>
                        </button>
                      </div>
                    </div>
                  ) : rawSheetData && rawSheetData.headers && rawSheetData.headers.length > 0 ? (
                    /* Display Raw Uploaded Sheet Exactly As Is with Original Headers & Names */
                    <div className="space-y-3">
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="font-black text-emerald-950">
                            📑 تم عرض الشيت المرفوع ({rawSheetData.fileName || 'ملف الإكسيل'}) كما هو تماماً دون أي تعديل وبنفس المسميات الأصلية:
                          </span>
                          <span className="bg-emerald-700 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                            {rawSheetData.headers.length} عمود أصلي • {rawSheetData.rows.length} صف
                          </span>
                        </div>
                        {rawSheetData.uploadedAt && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            تاريخ الرفع: {new Date(rawSheetData.uploadedAt).toLocaleString('ar-EG')}
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                            <tr>
                              <th className="p-3 border-l border-slate-200 w-12 text-center bg-slate-200/60 font-black">
                                م
                              </th>
                              {rawSheetData.headers.map((headerName, hIdx) => (
                                <th
                                  key={hIdx}
                                  className={`p-3 border-l border-slate-200 text-center font-black whitespace-nowrap min-w-[110px] ${
                                    hIdx === 0 ? 'bg-slate-200/40 text-slate-900 sticky right-0 z-20 shadow-2xs' : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {headerName}
                                </th>
                              ))}
                              {/* Analytical Columns Headers */}
                              {showSalesAchievementCol && (
                                <th className="p-2.5 border-l border-emerald-200 min-w-[110px] text-center bg-emerald-50 font-black text-emerald-950">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>نسبة التحقيق</span>
                                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded">تحليلي</span>
                                  </div>
                                </th>
                              )}
                              {showSalesMonthlyAvgCol && (
                                <th className="p-2.5 border-l border-blue-200 min-w-[110px] text-center bg-blue-50 font-black text-blue-950">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>المتوسط الشهري</span>
                                    <span className="text-[9px] bg-blue-200 text-blue-900 px-1 rounded">تحليلي</span>
                                  </div>
                                </th>
                              )}
                              {showSalesRevenueCol && (
                                <th className="p-2.5 border-l border-purple-200 min-w-[120px] text-center bg-purple-50 font-black text-purple-950">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>القيمة بالجنيه</span>
                                    <span className="text-[9px] bg-purple-200 text-purple-900 px-1 rounded">13 ج/م³</span>
                                  </div>
                                </th>
                              )}
                              {showSalesVarianceCol && (
                                <th className="p-2.5 border-l border-amber-200 min-w-[110px] text-center bg-amber-50 font-black text-amber-950">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>الانحراف (+/-)</span>
                                    <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded">تحليلي</span>
                                  </div>
                                </th>
                              )}
                              {showSalesGradeCol && (
                                <th className="p-2.5 min-w-[120px] text-center bg-teal-50 font-black text-teal-950">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>تصنيف المركز</span>
                                    <span className="text-[9px] bg-teal-200 text-teal-900 px-1 rounded">أ/ب/ج</span>
                                  </div>
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(() => {
                              const filteredRawRows = rawSheetData.rows.filter((row) => {
                                if (!salesSearchQuery.trim()) return true;
                                const q = salesSearchQuery.trim().toLowerCase();
                                return Object.values(row).some((val) =>
                                  String(val ?? '').toLowerCase().includes(q)
                                );
                              });

                              if (filteredRawRows.length === 0) {
                                return (
                                  <tr>
                                    <td
                                      colSpan={rawSheetData.headers.length + 6}
                                      className="p-8 text-center text-slate-400 font-bold"
                                    >
                                      لا توجد صفوف مطابقة لبحثك "{salesSearchQuery}"
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredRawRows.map((row, rIdx) => {
                                const matchingRecord = salesRecords[rIdx];
                                const act = matchingRecord?.annualActualM3 || matchingRecord?.currentSalesM3 || 0;
                                const tgt = matchingRecord?.annualTargetM3 || matchingRecord?.targetSalesM3 || 0;
                                const achPct = tgt > 0 ? Number(((act / tgt) * 100).toFixed(1)) : 100;
                                const monthlyAvg = Number((act / 12).toFixed(0));
                                const revenueEgp = act * 13;
                                const variance = act - tgt;

                                return (
                                  <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                                    <td className="p-2.5 text-center font-mono text-slate-400 border-l border-slate-200">
                                      {rIdx + 1}
                                    </td>
                                    {rawSheetData.headers.map((headerName, hIdx) => {
                                      const rawVal = row[headerName];
                                      let displayVal = '—';
                                      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                                        if (typeof rawVal === 'number') {
                                          displayVal = Number.isInteger(rawVal)
                                            ? rawVal.toLocaleString()
                                            : rawVal.toLocaleString(undefined, { maximumFractionDigits: 4 });
                                        } else {
                                          const str = String(rawVal).trim();
                                          const num = Number(str);
                                          if (str !== '' && !isNaN(num) && /^-?\d+(\.\d+)?$/.test(str)) {
                                            displayVal = Number.isInteger(num)
                                              ? num.toLocaleString()
                                              : num.toLocaleString(undefined, { maximumFractionDigits: 4 });
                                          } else {
                                            displayVal = str;
                                          }
                                        }
                                      }

                                      return (
                                        <td
                                          key={hIdx}
                                          className={`p-2.5 text-center font-mono border-l border-slate-100 whitespace-nowrap text-slate-800 ${
                                            hIdx === 0 ? 'font-bold text-slate-900 sticky right-0 bg-white z-10 shadow-2xs' : ''
                                          }`}
                                        >
                                          {displayVal}
                                        </td>
                                      );
                                    })}

                                    {/* Analytical Columns Cells */}
                                    {showSalesAchievementCol && (
                                      <td className="p-2.5 text-center font-mono font-bold border-l border-emerald-100 bg-emerald-50/20 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${achPct >= 100 ? 'bg-emerald-100 text-emerald-800' : achPct >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                          %{achPct}
                                        </span>
                                      </td>
                                    )}
                                    {showSalesMonthlyAvgCol && (
                                      <td className="p-2.5 text-center font-mono font-bold border-l border-blue-100 bg-blue-50/20 whitespace-nowrap text-blue-900">
                                        {monthlyAvg.toLocaleString()} م³
                                      </td>
                                    )}
                                    {showSalesRevenueCol && (
                                      <td className="p-2.5 text-center font-mono font-bold border-l border-purple-100 bg-purple-50/20 whitespace-nowrap text-purple-900">
                                        {revenueEgp.toLocaleString()} ج
                                      </td>
                                    )}
                                    {showSalesVarianceCol && (
                                      <td className="p-2.5 text-center font-mono font-bold border-l border-amber-100 bg-amber-50/20 whitespace-nowrap">
                                        <span className={variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                          {variance >= 0 ? '+' : ''}{variance.toLocaleString()} م³
                                        </span>
                                      </td>
                                    )}
                                    {showSalesGradeCol && (
                                      <td className="p-2.5 text-center font-mono font-bold bg-teal-50/20 whitespace-nowrap">
                                        {achPct >= 100 ? (
                                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            فئة (أ) ⭐ ممتاز
                                          </span>
                                        ) : achPct >= 80 ? (
                                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            فئة (ب) 🟡 جيد
                                          </span>
                                        ) : (
                                          <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            فئة (ج) 🔴 تنشيط
                                          </span>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                          {/* Footer with column sums for numeric columns */}
                          <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                            <tr>
                              <td className="p-3 text-center border-l border-slate-800 text-amber-300 font-black">
                                ∑
                              </td>
                              {rawSheetData.headers.map((headerName, hIdx) => {
                                if (hIdx === 0) {
                                  return (
                                    <td
                                      key={hIdx}
                                      className="p-3 text-center border-l border-slate-800 text-amber-300 font-black whitespace-nowrap sticky right-0 bg-slate-900 z-10"
                                    >
                                      ★ إجمالي الشيت المرفوع ({rawSheetData.rows.length} صف)
                                    </td>
                                  );
                                }

                                // Calculate sum if numeric
                                let sum = 0;
                                let numericCount = 0;
                                rawSheetData.rows.forEach((r) => {
                                  const v = r[headerName];
                                  if (typeof v === 'number' && !isNaN(v)) {
                                    sum += v;
                                    numericCount++;
                                  } else if (typeof v === 'string' && v.trim() !== '') {
                                    const parsed = parseFloat(v.replace(/,/g, ''));
                                    if (!isNaN(parsed) && /^-?\d+(\.\d+)?$/.test(v.trim())) {
                                      sum += parsed;
                                      numericCount++;
                                    }
                                  }
                                });

                                const isNumericCol = numericCount > 0 && numericCount >= rawSheetData.rows.length * 0.35;
                                return (
                                  <td
                                    key={hIdx}
                                    className="p-2.5 text-center font-mono border-l border-slate-800 whitespace-nowrap text-amber-300"
                                  >
                                    {isNumericCol ? (Number.isInteger(sum) ? sum.toLocaleString() : sum.toLocaleString(undefined, { maximumFractionDigits: 2 })) : '—'}
                                  </td>
                                );
                              })}
                              {showSalesAchievementCol && (
                                <td className="p-2.5 text-center font-mono font-bold text-emerald-300 border-l border-slate-800 bg-slate-950 whitespace-nowrap">
                                  %{corporateAchievementPct}
                                </td>
                              )}
                              {showSalesMonthlyAvgCol && (
                                <td className="p-2.5 text-center font-mono font-bold text-blue-300 border-l border-slate-800 bg-slate-950 whitespace-nowrap">
                                  {Number((corporateTotals.annualActual / 12).toFixed(0)).toLocaleString()} م³
                                </td>
                              )}
                              {showSalesRevenueCol && (
                                <td className="p-2.5 text-center font-mono font-bold text-purple-300 border-l border-slate-800 bg-slate-950 whitespace-nowrap">
                                  {(corporateTotals.annualActual * 13).toLocaleString()} ج
                                </td>
                              )}
                              {showSalesVarianceCol && (
                                <td className="p-2.5 text-center font-mono font-bold text-amber-300 border-l border-slate-800 bg-slate-950 whitespace-nowrap">
                                  {corporateTotals.annualVariance >= 0 ? '+' : ''}{corporateTotals.annualVariance.toLocaleString()} م³
                                </td>
                              )}
                              {showSalesGradeCol && (
                                <td className="p-2 text-center border-slate-800 bg-slate-950 text-teal-300 font-bold">
                                  {corporateTotals.achievedCount} فئة أ
                                </td>
                              )}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* Default Demo Fallback Table */
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-3 border-l border-slate-200 w-10 text-center">م</th>
                            <th className="p-3 border-l border-slate-200 min-w-[200px] sticky right-0 bg-slate-100 z-20">
                              اسم المركز ( المحطة )
                            </th>
                            <th className="p-3 border-l border-slate-200 min-w-[95px] text-center font-mono">
                              كود المركز
                            </th>
                            <th className="p-3 border-l border-slate-200 min-w-[90px] text-center">
                              المحافظة
                            </th>
                            <th className="p-3 border-l border-slate-200 min-w-[100px] text-center font-mono" dir="ltr">
                              الاحداثيات (X)
                            </th>
                            <th className="p-3 border-l border-slate-200 min-w-[100px] text-center font-mono" dir="ltr">
                              الاحداثيات (Y)
                            </th>
                            {/* 12 Months: يناير حتى ديسمبر */}
                            {[
                              'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
                              'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                            ].map((month) => (
                              <th key={month} className="p-2.5 border-l border-slate-200 min-w-[85px] text-center bg-blue-50/70 text-blue-950 font-bold">
                                {month} (م³)
                              </th>
                            ))}
                            <th className="p-2.5 border-l border-indigo-200 min-w-[110px] text-center bg-indigo-50 font-black text-indigo-950">
                              إجمالي مبيعات العام (م³)
                            </th>
                            <th className="p-2.5 border-l border-indigo-200 min-w-[110px] text-center bg-indigo-50 font-black text-indigo-950">
                              المستهدف السنوي (م³)
                            </th>
                            {/* Analytical Columns Headers */}
                            {showSalesAchievementCol && (
                              <th className="p-2.5 border-l border-emerald-200 min-w-[110px] text-center bg-emerald-50 font-black text-emerald-950">
                                <div className="flex items-center justify-center gap-1">
                                  <span>نسبة التحقيق</span>
                                  <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded">تحليلي</span>
                                </div>
                              </th>
                            )}
                            {showSalesMonthlyAvgCol && (
                              <th className="p-2.5 border-l border-blue-200 min-w-[110px] text-center bg-blue-50 font-black text-blue-950">
                                <div className="flex items-center justify-center gap-1">
                                  <span>المتوسط الشهري</span>
                                  <span className="text-[9px] bg-blue-200 text-blue-900 px-1 rounded">تحليلي</span>
                                </div>
                              </th>
                            )}
                            {showSalesRevenueCol && (
                              <th className="p-2.5 border-l border-purple-200 min-w-[120px] text-center bg-purple-50 font-black text-purple-950">
                                <div className="flex items-center justify-center gap-1">
                                  <span>القيمة بالجنيه</span>
                                  <span className="text-[9px] bg-purple-200 text-purple-900 px-1 rounded">13 ج/م³</span>
                                </div>
                              </th>
                            )}
                            {showSalesVarianceCol && (
                              <th className="p-2.5 border-l border-amber-200 min-w-[110px] text-center bg-amber-50 font-black text-amber-950">
                                <div className="flex items-center justify-center gap-1">
                                  <span>الانحراف (+/-)</span>
                                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded">تحليلي</span>
                                </div>
                              </th>
                            )}
                            {showSalesGradeCol && (
                              <th className="p-2.5 min-w-[120px] text-center bg-teal-50 font-black text-teal-950">
                                <div className="flex items-center justify-center gap-1">
                                  <span>تصنيف المركز</span>
                                  <span className="text-[9px] bg-teal-200 text-teal-900 px-1 rounded">أ/ب/ج</span>
                                </div>
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredSalesRecords.map((r, index) => {
                            const annualActual = r.annualActualM3 ?? r.currentSalesM3 ?? 0;
                            const annualTarget = r.annualTargetM3 ?? r.targetSalesM3 ?? 0;
                            const achPct = annualTarget > 0 ? Number(((annualActual / annualTarget) * 100).toFixed(1)) : 100;
                            const monthlyAvg = Number((annualActual / 12).toFixed(0));
                            const revenueEgp = annualActual * 13;
                            const variance = annualActual - annualTarget;
                            const monthsList = [
                              'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
                              'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                            ];

                            return (
                              <tr key={r.id} className="hover:bg-slate-50/80 transition">
                                <td className="p-2.5 text-center font-mono text-slate-400 border-l border-slate-200">
                                  {index + 1}
                                </td>
                                <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200 sticky right-0 bg-white z-10 shadow-2xs">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                                      C
                                    </div>
                                    <span>{r.stationName}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center font-mono text-[11px] text-slate-600 border-l border-slate-200">
                                  {r.stationCode || '—'}
                                </td>
                                <td className="p-2.5 text-center text-slate-700 border-l border-slate-200">
                                  {r.city}
                                </td>
                                <td className="p-2.5 text-center font-mono text-[11px] border-l border-slate-200 text-slate-600" dir="ltr">
                                  {r.longitude !== undefined ? r.longitude.toFixed(5) : '—'}
                                </td>
                                <td className="p-2.5 text-center font-mono text-[11px] border-l border-slate-200 text-slate-600" dir="ltr">
                                  {r.latitude !== undefined ? r.latitude.toFixed(5) : '—'}
                                </td>
                                {/* 12 Months Cells */}
                                {monthsList.map((m) => {
                                  const val = r.monthlyBreakdown?.[m] ?? r.monthlyMetrics?.[m]?.actual ?? 0;
                                  return (
                                    <td key={m} className="p-2 text-center font-mono border-l border-slate-100 text-slate-800">
                                      {val > 0 ? val.toLocaleString() : '—'}
                                    </td>
                                  );
                                })}
                                {/* Annual Totals */}
                                <td className="p-2.5 text-center font-mono font-black text-slate-950 border-l border-indigo-100 bg-indigo-50/20">
                                  {annualActual.toLocaleString()}
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-l border-indigo-100 bg-indigo-50/20">
                                  {annualTarget.toLocaleString()}
                                </td>
                                {/* Analytical Columns Cells */}
                                {showSalesAchievementCol && (
                                  <td className="p-2.5 text-center font-mono font-bold border-l border-emerald-100 bg-emerald-50/20 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${achPct >= 100 ? 'bg-emerald-100 text-emerald-800' : achPct >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                      %{achPct}
                                    </span>
                                  </td>
                                )}
                                {showSalesMonthlyAvgCol && (
                                  <td className="p-2.5 text-center font-mono font-bold border-l border-blue-100 bg-blue-50/20 whitespace-nowrap text-blue-900">
                                    {monthlyAvg.toLocaleString()} م³
                                  </td>
                                )}
                                {showSalesRevenueCol && (
                                  <td className="p-2.5 text-center font-mono font-bold border-l border-purple-100 bg-purple-50/20 whitespace-nowrap text-purple-900">
                                    {revenueEgp.toLocaleString()} ج
                                  </td>
                                )}
                                {showSalesVarianceCol && (
                                  <td className="p-2.5 text-center font-mono font-bold border-l border-amber-100 bg-amber-50/20 whitespace-nowrap">
                                    <span className={variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                      {variance >= 0 ? '+' : ''}{variance.toLocaleString()} م³
                                    </span>
                                  </td>
                                )}
                                {showSalesGradeCol && (
                                  <td className="p-2.5 text-center font-mono font-bold bg-teal-50/20 whitespace-nowrap">
                                    {achPct >= 100 ? (
                                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        فئة (أ) ⭐ ممتاز
                                      </span>
                                    ) : achPct >= 80 ? (
                                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        فئة (ب) 🟡 جيد
                                      </span>
                                    ) : (
                                      <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        فئة (ج) 🔴 تنشيط
                                      </span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Footer Row */}
                        <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                          <tr>
                            <td colSpan={6} className="p-3 text-center border-l border-slate-800 text-amber-300 font-black">
                              ★ الإجمالي العام لكافة مراكز ومحطات كارجاس (م³)
                            </td>
                            {[
                              'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
                              'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                            ].map((m) => {
                              let totalMonth = 0;
                              salesRecords.forEach((r) => {
                                totalMonth += r.monthlyBreakdown?.[m] ?? r.monthlyMetrics?.[m]?.actual ?? 0;
                              });
                              return (
                                <td key={m} className="p-2 text-center font-mono text-amber-300 border-l border-slate-800">
                                  {totalMonth > 0 ? totalMonth.toLocaleString() : '—'}
                                </td>
                              );
                            })}
                            <td className="p-2.5 text-center font-mono font-black text-amber-300 border-l border-slate-800 bg-slate-950">
                              {corporateTotals.annualActual.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-300 border-l border-slate-800 bg-slate-950">
                              {corporateTotals.annualTarget.toLocaleString()}
                            </td>
                            {showSalesAchievementCol && (
                              <td className="p-2.5 text-center font-mono font-bold text-emerald-300 border-l border-slate-800 bg-slate-950 whitespace-nowrap">
                                %{corporateAchievementPct}
                              </td>
                            )}
                            {showSalesMonthlyAvgCol && (
                              <td className="p-2.5 text-center font-mono font-bold text-blue-300 border-l border-slate-800 bg-slate-950 whitespace-nowrap">
                                {Number((corporateTotals.annualActual / 12).toFixed(0)).toLocaleString()} م³
                              </td>
                            )}
                            {showSalesRevenueCol && (
                              <td className="p-2.5 text-center font-mono font-bold text-purple-300 border-l border-slate-800 bg-slate-950 whitespace-nowrap">
                                {(corporateTotals.annualActual * 13).toLocaleString()} ج
                              </td>
                            )}
                            {showSalesVarianceCol && (
                              <td className="p-2.5 text-center font-mono font-bold text-amber-300 border-l border-slate-800 bg-slate-950 whitespace-nowrap">
                                {corporateTotals.annualVariance >= 0 ? '+' : ''}{corporateTotals.annualVariance.toLocaleString()} م³
                              </td>
                            )}
                            {showSalesGradeCol && (
                              <td className="p-2 text-center border-slate-800 bg-slate-950 text-teal-300 font-bold">
                                {corporateTotals.achievedCount} فئة أ
                              </td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-view 1: Monthly Detailed Matrix View */}
              {salesSubTab === 'matrix' && (
                <div className="space-y-5">
                  {/* Executive Corporate KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm border border-blue-800">
                      <span className="text-[11px] font-bold text-blue-200 block">إجمالي مبيعات العام الفعلية</span>
                      <div className="text-xl font-mono font-black mt-1 text-white">
                        {corporateTotals.annualActual.toLocaleString()} <span className="text-xs font-normal text-blue-300">م³</span>
                      </div>
                      <span className="text-[10px] text-blue-300 mt-1 block">كافة محطات ومراكز كارجاس</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-bold text-slate-600 block">إجمالي المستهدف السنوي للعام</span>
                      <div className="text-xl font-mono font-black mt-1 text-slate-900">
                        {corporateTotals.annualTarget.toLocaleString()} <span className="text-xs font-normal text-slate-400">م³</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">الهدف المخطط للشركة</span>
                    </div>

                    <div className={`p-4 rounded-2xl border shadow-xs ${
                      corporateTotals.annualVariance >= 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}>
                      <span className="text-[11px] font-bold block">
                        صافي الانحراف السنوي العام
                      </span>
                      <div className="text-xl font-mono font-black mt-1">
                        {corporateTotals.annualVariance >= 0 ? '+' : ''}
                        {corporateTotals.annualVariance.toLocaleString()} <span className="text-xs font-normal">م³</span>
                      </div>
                      <span className={`text-[10px] font-bold mt-1 inline-block px-1.5 py-0.5 rounded ${
                        corporateTotals.annualVariance >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                      }`}>
                        {corporateTotals.annualVariance >= 0 ? 'فائض عام +' : 'عجز عام '}
                        {corporateVariancePct}%
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-bold text-slate-600 block">نسبة التحقيق العامة للشركة</span>
                      <div className="text-xl font-mono font-black mt-1 text-blue-700">
                        {corporateAchievementPct}%
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full ${corporateAchievementPct >= 90 ? 'bg-emerald-500' : corporateAchievementPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(corporateAchievementPct, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-bold text-slate-600 block">موقف أداء المحطات</span>
                      <div className="text-sm font-black mt-1.5 space-y-1">
                        <div className="text-emerald-700 flex items-center justify-between">
                          <span>محطات محققة للمستهدف:</span>
                          <span className="font-mono">{corporateTotals.achievedCount}</span>
                        </div>
                        <div className="text-rose-700 flex items-center justify-between">
                          <span>محطات بها عجز مبيعات:</span>
                          <span className="font-mono">{corporateTotals.deficitCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search & Period Info */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-slate-500 font-bold">🔍 تصفية الجدول:</span>
                      <input
                        type="text"
                        value={salesSearchQuery}
                        onChange={(e) => setSalesSearchQuery(e.target.value)}
                        placeholder="ابحث باسم المحطة، الكود، أو المحافظة..."
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-full sm:w-72 font-sans"
                      />
                      {salesSearchQuery && (
                        <button
                          onClick={() => setSalesSearchQuery('')}
                          className="text-slate-400 hover:text-slate-600 font-bold px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                      <span>📅 الشهور المرصودة بالشيت:</span>
                      <div className="flex flex-wrap gap-1">
                        {matrixMonths.map((m) => (
                          <span key={m} className="bg-white text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Active Custom Columns Pill Bar */}
                  {customColumns.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs">
                      <span className="font-bold text-purple-900 flex items-center gap-1.5">
                        <Calculator className="w-4 h-4 text-purple-600" />
                        <span>الخانات الحسابية المخصصة النشطة بالشيت:</span>
                      </span>
                      {customColumns.map((col) => {
                        const opSign =
                          col.operation === 'add'
                            ? '+'
                            : col.operation === 'subtract'
                            ? '-'
                            : col.operation === 'multiply'
                            ? '×'
                            : col.operation === 'divide'
                            ? '÷'
                            : '%';
                        const op2Text =
                          col.operand2Type === 'constant'
                            ? col.operand2Constant
                            : col.operand2Label || col.operand2Key;
                        return (
                          <div
                            key={col.id}
                            className="bg-white px-2.5 py-1 rounded-xl border border-purple-200 text-purple-950 flex items-center gap-2 shadow-2xs font-sans"
                          >
                            <span className="font-black text-purple-900">{col.name}</span>
                            <span className="text-[10px] text-purple-700 font-mono bg-purple-100/70 px-1.5 py-0.5 rounded">
                              [{col.operand1Label || col.operand1Key}] {opSign} [{op2Text}]
                            </span>
                            <button
                              onClick={() => handleDeleteCustomColumn(col.id)}
                              title="حذف هذه الخانة المخصصة"
                              className="text-rose-400 hover:text-rose-700 font-bold text-xs px-1 transition"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => setIsAddColumnModalOpen(true)}
                        className="text-purple-700 hover:text-purple-900 underline font-bold text-[11px] mr-auto"
                      >
                        + إضافة خانة جديدة
                      </button>
                    </div>
                  )}

                  {/* The Detailed Excel Sheet Matrix Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        {/* Top Group Row */}
                        <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-800">
                          <th rowSpan={2} className="p-3 border-l border-slate-200 min-w-[210px] sticky right-0 bg-slate-100 z-20">
                            اسم المركز ( المحطة )
                          </th>
                          <th rowSpan={2} className="p-3 border-l border-slate-200 min-w-[90px]">
                            المحافظة
                          </th>
                          <th rowSpan={2} className="p-3 border-l border-slate-200 min-w-[125px] font-mono">
                            الإحداثيات
                          </th>
                          {matrixMonths.map((m) => (
                            <th
                              key={m}
                              colSpan={3}
                              className="p-2 text-center border-l border-slate-200 bg-blue-50/80 font-black text-blue-950"
                            >
                              شهر {m}
                            </th>
                          ))}
                          <th
                            colSpan={5}
                            className="p-2 text-center bg-indigo-50 font-black text-indigo-950 border-r border-indigo-200"
                          >
                            📊 إجمالي مبيعات العام والانحراف السنوي
                          </th>
                          {customColumns.length > 0 && (
                            <th
                              colSpan={customColumns.length}
                              className="p-2 text-center bg-purple-50 font-black text-purple-950 border-r border-purple-200"
                            >
                              🧮 الخانات الحسابية المخصصة (+ - * / %)
                            </th>
                          )}
                        </tr>
                        {/* Sub Columns Row */}
                        <tr className="bg-slate-50 text-[11px] text-slate-600 border-b border-slate-200">
                          {matrixMonths.map((m) => (
                            <React.Fragment key={m}>
                              <th className="p-2 text-center border-l border-slate-100 min-w-[85px] font-bold text-slate-900 bg-blue-50/30">
                                الفعلي (م³)
                              </th>
                              <th className="p-2 text-center border-l border-slate-100 min-w-[85px] font-bold text-slate-500 bg-blue-50/30">
                                المستهدف (م³)
                              </th>
                              <th className="p-2 text-center border-l border-slate-200 min-w-[105px] font-black text-slate-900 bg-blue-100/40">
                                الانحراف (م³ / %)
                              </th>
                            </React.Fragment>
                          ))}
                          {/* Annual Total Sub Columns */}
                          <th className="p-2 text-center border-l border-indigo-100 min-w-[110px] font-black text-slate-900 bg-indigo-50/50">
                            إجمالي الفعلي (م³)
                          </th>
                          <th className="p-2 text-center border-l border-indigo-100 min-w-[110px] font-bold text-slate-600 bg-indigo-50/50">
                            المستهدف السنوي (م³)
                          </th>
                          <th className="p-2 text-center border-l border-indigo-100 min-w-[125px] font-black text-slate-950 bg-indigo-100/60">
                            الانحراف السنوي (م³)
                          </th>
                          <th className="p-2 text-center border-l border-indigo-100 min-w-[85px] font-bold text-center bg-indigo-50/50">
                            نسبة التحقيق %
                          </th>
                          <th className="p-2 text-center min-w-[120px] font-bold text-center bg-indigo-50/50">
                            حالة الأداء
                          </th>
                          {/* Custom Columns Sub Headers */}
                          {customColumns.map((col) => {
                            const opSign =
                              col.operation === 'add'
                                ? '+'
                                : col.operation === 'subtract'
                                ? '-'
                                : col.operation === 'multiply'
                                ? '×'
                                : col.operation === 'divide'
                                ? '÷'
                                : '%';
                            return (
                              <th
                                key={col.id}
                                className="p-2 text-center border-l border-purple-100 min-w-[130px] font-black text-purple-950 bg-purple-50/80"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>{col.name}</span>
                                  <button
                                    onClick={() => handleDeleteCustomColumn(col.id)}
                                    title="حذف الخانة الحسابية"
                                    className="text-rose-400 hover:text-rose-700 font-bold text-xs p-0.5 rounded transition"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="text-[9px] font-mono text-purple-700 font-normal mt-0.5">
                                  ({opSign} {col.operand2Type === 'constant' ? col.operand2Constant : col.operand2Label || col.operand2Key})
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredSalesRecords.map((r) => {
                          const annualActual = r.annualActualM3 ?? r.currentSalesM3;
                          const annualTarget = r.annualTargetM3 ?? r.targetSalesM3;
                          const annualVariance = r.annualVarianceM3 ?? (annualActual - annualTarget);
                          const annualVariancePct =
                            r.annualVariancePct ??
                            (annualTarget > 0 ? Number(((annualVariance / annualTarget) * 100).toFixed(1)) : 0);
                          const achievementPct =
                            annualTarget > 0 ? Number(((annualActual / annualTarget) * 100).toFixed(1)) : 100;
                          const isSurplus = annualVariance >= 0;

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 font-bold text-slate-900 border-l border-slate-200 sticky right-0 bg-white z-10 shadow-2xs">
                                <div>{r.stationName}</div>
                                {r.stationCode && (
                                  <div className="text-[10px] font-mono text-slate-400">{r.stationCode}</div>
                                )}
                              </td>
                              <td className="p-3 text-slate-600 border-l border-slate-200">{r.city}</td>
                              <td className="p-3 font-mono text-[11px] border-l border-slate-200" dir="ltr">
                                {r.latitude !== undefined && r.longitude !== undefined ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold text-[10px]">
                                    {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">—</span>
                                )}
                              </td>

                              {/* Monthly Metric Columns */}
                              {matrixMonths.map((m) => {
                                const metric = r.monthlyMetrics?.[m];
                                const actual = metric?.actual ?? r.monthlyBreakdown?.[m] ?? 0;
                                const target = metric?.target ?? r.monthlyTargets?.[m] ?? 0;
                                const variance = metric?.variance ?? (actual - target);
                                const variancePct =
                                  metric?.variancePct ??
                                  (target > 0 ? Number(((variance / target) * 100).toFixed(1)) : 0);
                                const mSurplus = variance >= 0;

                                return (
                                  <React.Fragment key={m}>
                                    <td className="p-2.5 text-center font-mono font-bold text-slate-900 border-l border-slate-100">
                                      {actual.toLocaleString()}
                                    </td>
                                    <td className="p-2.5 text-center font-mono text-slate-500 border-l border-slate-100">
                                      {target.toLocaleString()}
                                    </td>
                                    <td
                                      className={`p-2 text-center font-mono font-bold border-l border-slate-200 ${
                                        mSurplus ? 'bg-emerald-50/40 text-emerald-800' : 'bg-rose-50/40 text-rose-800'
                                      }`}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-[11px]">
                                          {mSurplus ? '+' : ''}{variance.toLocaleString()}
                                        </span>
                                        <span
                                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-bold ${
                                            mSurplus
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}
                                        >
                                          {mSurplus ? '▲ +' : '▼ '}{variancePct}%
                                        </span>
                                      </div>
                                    </td>
                                  </React.Fragment>
                                );
                              })}

                              {/* Annual Totals for Station */}
                              <td className="p-2.5 text-center font-mono font-black text-slate-950 border-l border-indigo-100 bg-indigo-50/20">
                                {annualActual.toLocaleString()} م³
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-600 border-l border-indigo-100 bg-indigo-50/20">
                                {annualTarget.toLocaleString()} م³
                              </td>
                              <td
                                className={`p-2.5 text-center font-mono font-black border-l border-indigo-100 ${
                                  isSurplus ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                                }`}
                              >
                                <div className="flex flex-col items-center">
                                  <span>{isSurplus ? '+' : ''}{annualVariance.toLocaleString()} م³</span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold ${
                                      isSurplus ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
                                    }`}
                                  >
                                    {isSurplus ? 'فائض +' : 'عجز '}{annualVariancePct}%
                                  </span>
                                </div>
                              </td>
                              <td className="p-2 text-center border-l border-indigo-100 bg-indigo-50/20">
                                <span
                                  className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                                    achievementPct < 70
                                      ? 'bg-rose-100 text-rose-800'
                                      : achievementPct >= 90
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {achievementPct}%
                                </span>
                              </td>
                              <td className="p-2 text-center bg-indigo-50/20">
                                {isSurplus ? (
                                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <span>✔️</span> <span>محقق وفائض</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <span>⚠️</span> <span>عجز (يتطلب ترويج)</span>
                                  </span>
                                )}
                              </td>

                              {/* Custom Computed Column Cells for Station Row */}
                              {customColumns.map((col) => {
                                const computed = computeCustomColumnValue(col, r);
                                return (
                                  <td
                                    key={col.id}
                                    className="p-2.5 text-center font-mono font-bold border-l border-purple-100 bg-purple-50/20"
                                  >
                                    <span
                                      className={
                                        col.displayFormat === 'signed'
                                          ? computed.isPositive
                                            ? 'text-emerald-700'
                                            : 'text-rose-700'
                                          : 'text-purple-950'
                                      }
                                    >
                                      {computed.formattedText}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Corporate Grand Total Footer */}
                      <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                        <tr>
                          <td className="p-3 sticky right-0 bg-slate-900 z-20 border-l border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400 text-sm">★</span>
                              <span className="text-white font-black">الإجمالي العام للشركة (كافة المحطات)</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-300 border-l border-slate-800">مصر (عام)</td>
                          <td className="p-3 text-slate-400 border-l border-slate-800 font-mono text-[10px]">—</td>

                          {matrixMonths.map((m) => {
                            const mTotals = monthlyCorporateTotals[m] || { actual: 0, target: 0, variance: 0, variancePct: 0 };
                            const mSurplus = mTotals.variance >= 0;
                            return (
                              <React.Fragment key={m}>
                                <td className="p-2.5 text-center font-mono text-amber-300 border-l border-slate-800">
                                  {mTotals.actual.toLocaleString()}
                                </td>
                                <td className="p-2.5 text-center font-mono text-slate-400 border-l border-slate-800">
                                  {mTotals.target.toLocaleString()}
                                </td>
                                <td
                                  className={`p-2 text-center font-mono font-bold border-l border-slate-800 ${
                                    mSurplus ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                                  }`}
                                >
                                  <div>{mSurplus ? '+' : ''}{mTotals.variance.toLocaleString()}</div>
                                  <div className="text-[9px] font-sans opacity-85">
                                    ({mSurplus ? '+' : ''}{mTotals.variancePct}%)
                                  </div>
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Annual Corporate Totals */}
                          <td className="p-2.5 text-center font-mono font-black text-amber-300 border-l border-slate-800 bg-slate-950">
                            {corporateTotals.annualActual.toLocaleString()} م³
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-300 border-l border-slate-800 bg-slate-950">
                            {corporateTotals.annualTarget.toLocaleString()} م³
                          </td>
                          <td
                            className={`p-2.5 text-center font-mono font-black border-l border-slate-800 ${
                              corporateTotals.annualVariance >= 0
                                ? 'text-emerald-400 bg-emerald-950/60'
                                : 'text-rose-400 bg-rose-950/60'
                            }`}
                          >
                            <div>
                              {corporateTotals.annualVariance >= 0 ? '+' : ''}
                              {corporateTotals.annualVariance.toLocaleString()} م³
                            </div>
                            <div className="text-[10px] font-sans font-bold">
                              {corporateTotals.annualVariance >= 0 ? 'صافي فائض +' : 'صافي عجز '}
                              {corporateVariancePct}%
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-mono text-cyan-300 border-l border-slate-800 bg-slate-950">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                              {corporateAchievementPct}%
                            </span>
                          </td>
                          <td className="p-2.5 text-center bg-slate-950 text-slate-300 text-[11px]">
                            {corporateTotals.achievedCount} محققة / {corporateTotals.deficitCount} عجز
                          </td>

                          {/* Corporate Totals for Custom Columns */}
                          {customColumns.map((col) => {
                            const corpVal = computeCorporateCustomColumnValue(
                              col,
                              filteredSalesRecords,
                              corporateTotals.annualActual,
                              corporateTotals.annualTarget,
                              corporateTotals.annualVariance
                            );
                            return (
                              <td
                                key={col.id}
                                className="p-2.5 text-center font-mono font-bold text-amber-300 border-l border-slate-800 bg-slate-950"
                              >
                                {corpVal.formattedText}
                              </td>
                            );
                          })}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-view 2: Budget Allocation & ROI Settings */}
              {salesSubTab === 'allocation' && (
                <div className="space-y-6">
                  {/* Master Budget Criteria & Points Formula Control Box */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/60 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                            معايير الموازنة الرسمية
                          </span>
                          <span className="text-xs font-bold text-indigo-200">
                            التحكم الكامل في تكلفة النقطة والمعادلة الشاملة
                          </span>
                        </div>
                        <h4 className="text-base font-black text-white mt-1">
                          معادلة احتساب نقاط الولاء وتكلفة النقطة على الشركة 🧮
                        </h4>
                      </div>
                      <span className="font-mono bg-white/10 text-amber-300 font-bold px-3 py-1 rounded-xl text-xs border border-white/10">
                        تكلفة النقطة: {loyaltyModel.costPerPointEgp} ج | سعر المتر: {pointsFormula.gasPricePerMeter} ج
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <label className="block font-bold text-amber-300 text-[11px]">
                          قيمة تكلفة النقطة بالجنيه (Cost/Point):
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={loyaltyModel.costPerPointEgp}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLoyaltyModel({ ...loyaltyModel, costPerPointEgp: val });
                            setPointsFormula({ ...pointsFormula, pointsToEgpRedemptionRatio: val });
                          }}
                          className="w-full bg-slate-900 text-amber-300 border border-amber-400/30 rounded-xl p-2 font-mono font-black text-sm"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          تعتمد عليها كافة معادلات الموازنة واستبدال الهدايا
                        </span>
                      </div>

                      <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <label className="block font-bold text-slate-200 text-[11px]">
                          إجمالي موازنة الترويج المعتمدة (جنية):
                        </label>
                        <input
                          type="number"
                          value={loyaltyModel.totalPromotionalBudgetEgp}
                          onChange={(e) =>
                            setLoyaltyModel({ ...loyaltyModel, totalPromotionalBudgetEgp: Number(e.target.value) })
                          }
                          className="w-full bg-slate-900 text-emerald-300 border border-white/20 rounded-xl p-2 font-mono font-black text-sm"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          الموازنة الإجمالية الموجهة للمحطات والحملات
                        </span>
                      </div>

                      <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <label className="block font-bold text-slate-200 text-[11px]">
                          سعر متر الغاز الطبيعي المعتمد (جنية):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={pointsFormula.gasPricePerMeter}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPointsFormula({ ...pointsFormula, gasPricePerMeter: val });
                            setEditGasPrice(val);
                          }}
                          className="w-full bg-slate-900 text-white border border-white/20 rounded-xl p-2 font-mono font-black text-sm"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          السعر الرسمي للمتر (13 ج/م³)
                        </span>
                      </div>

                      <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <label className="block font-bold text-slate-200 text-[11px]">
                          معدل النقاط الأساسي لكل متر:
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={pointsFormula.basePointsPerMeter}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPointsFormula({ ...pointsFormula, basePointsPerMeter: val });
                            setEditPointsRatio(val);
                          }}
                          className="w-full bg-slate-900 text-white border border-white/20 rounded-xl p-2 font-mono font-black text-sm"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          المعيار الأساسي (1 متر = 1 نقطة)
                        </span>
                      </div>

                      <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <label className="block font-bold text-slate-200 text-[11px]">
                          مضاعف الشريحة البرونزية / العادية:
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={pointsFormula.tierBronzeMultiplier}
                          onChange={(e) =>
                            setPointsFormula({ ...pointsFormula, tierBronzeMultiplier: Number(e.target.value) })
                          }
                          className="w-full bg-slate-900 text-white border border-white/20 rounded-xl p-2 font-mono font-bold"
                        />
                      </div>

                      <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <label className="block font-bold text-slate-200 text-[11px]">
                          مضاعف الشريحة الفضية:
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={pointsFormula.tierSilverMultiplier}
                          onChange={(e) =>
                            setPointsFormula({ ...pointsFormula, tierSilverMultiplier: Number(e.target.value) })
                          }
                          className="w-full bg-slate-900 text-white border border-white/20 rounded-xl p-2 font-mono font-bold"
                        />
                      </div>

                      <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <label className="block font-bold text-amber-300 text-[11px]">
                          مضاعف كارت الولاء الذهبي:
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={pointsFormula.tierGoldMultiplier}
                          onChange={(e) =>
                            setPointsFormula({ ...pointsFormula, tierGoldMultiplier: Number(e.target.value) })
                          }
                          className="w-full bg-slate-900 text-amber-300 border border-amber-400/30 rounded-xl p-2 font-mono font-bold"
                        />
                      </div>

                      <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <label className="block font-bold text-emerald-300 text-[11px]">
                          رصيد نقاط الترحيب للفني / وردية:
                        </label>
                        <input
                          type="number"
                          value={pointsFormula.technicianWelcomePointsPerShift}
                          onChange={(e) =>
                            setPointsFormula({
                              ...pointsFormula,
                              technicianWelcomePointsPerShift: Number(e.target.value),
                            })
                          }
                          className="w-full bg-slate-900 text-emerald-300 border border-emerald-400/30 rounded-xl p-2 font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          حصة الفني لتوزيعها (+25، +50، +100)
                        </span>
                      </div>
                    </div>
                  </div>


                  {/* Detected Period & File Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        📊
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">
                          نوع بيان المبيعات المرصود: {salesRecords[0]?.periodLabel || 'بيان مبيعات شهري تفصيلي'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          يتم توجيه موازنة الترويج ومضاعف نقاط الولاء للمحطات ذات العجز في المستهدف لزيادة روادها
                        </span>
                      </div>
                    </div>
                    <span className="bg-white text-blue-800 font-mono font-bold px-3 py-1 rounded-xl border border-blue-200">
                      {salesRecords.length} محطة / مركز مسجل
                    </span>
                  </div>

                  {/* Allocation Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">اسم المركز ( المحطة )</th>
                          <th className="p-3">المحافظة</th>
                          <th className="p-3 font-mono">الإحداثيات (X, Y)</th>
                          <th className="p-3">المبيعات الفعلية (م³)</th>
                          <th className="p-3">المبيعات المستهدفة (م³)</th>
                          <th className="p-3 text-center">نسبة التحقيق %</th>
                          <th className="p-3 text-center">مستوى الأولوية</th>
                          <th className="p-3 text-center">الموازنة الموجهة (ج)</th>
                          <th className="p-3 text-center">مضاعف نقاط الولاء</th>
                          <th className="p-3 text-center">تفاصيل الشهور</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredSalesRecords.map((r) => {
                          const isExpanded = expandedSalesRecordId === r.id;
                          const hasMonths = r.monthlyBreakdown && Object.keys(r.monthlyBreakdown).length > 0;
                          return (
                            <React.Fragment key={r.id}>
                              <tr className="hover:bg-slate-50/70 transition">
                                <td className="p-3 font-bold text-slate-900">
                                  <div>{r.stationName}</div>
                                  {r.stationCode && <div className="text-[10px] font-mono text-slate-400">{r.stationCode}</div>}
                                </td>
                                <td className="p-3 text-slate-600">{r.city}</td>
                                <td className="p-3 font-mono text-[11px]" dir="ltr">
                                  {r.latitude !== undefined && r.longitude !== undefined ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1 font-bold">
                                      <span>📍</span>
                                      <span>{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">غير محدد</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-900">
                                  {(r.annualActualM3 ?? r.currentSalesM3 ?? r.currentMonthlySalesM3).toLocaleString()} م³
                                </td>
                                <td className="p-3 font-mono text-slate-600">
                                  {(r.annualTargetM3 ?? r.targetSalesM3 ?? r.targetMonthlySalesM3).toLocaleString()} م³
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                                      r.achievementRatioPct < 70
                                        ? 'bg-rose-100 text-rose-800'
                                        : r.achievementRatioPct >= 90
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {r.achievementRatioPct}%
                                  </span>
                                </td>
                                <td className="p-3 text-center font-bold">
                                  {r.priorityLevel === 'عالي جداً' ? (
                                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                      عالي جداً (ترويج مكثف)
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">{r.priorityLevel}</span>
                                  )}
                                </td>
                                <td className="p-3 text-center font-mono font-black text-emerald-800">
                                  {r.allocatedBudgetEgp.toLocaleString()} ج
                                </td>
                                <td className="p-3 text-center">
                                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    {r.promotionalPointsMultiplier}x
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  {hasMonths ? (
                                    <button
                                      onClick={() => setExpandedSalesRecordId(isExpanded ? null : r.id)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                                        isExpanded
                                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                          : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                                      }`}
                                    >
                                      {isExpanded ? 'إخفاء الشهور ▲' : `عرض الشهور (${Object.keys(r.monthlyBreakdown!).length}) ▼`}
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">بيان إجمالي</span>
                                  )}
                                </td>
                              </tr>

                              {/* Expandable Monthly Breakdown Sub-row */}
                              {isExpanded && r.monthlyBreakdown && (
                                <tr className="bg-blue-50/50">
                                  <td colSpan={10} className="p-3 border-t border-b border-blue-100">
                                    <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-2">
                                      <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-slate-100 pb-1.5">
                                        <span>📅 تفاصيل مبيعات الشهور المسجلة لـ [{r.stationName}]:</span>
                                        <span className="text-[11px] text-slate-500 font-mono">
                                          المجموع الفعلي: {(r.annualActualM3 ?? r.currentSalesM3).toLocaleString()} م³
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                        {Object.entries(r.monthlyBreakdown).map(([month, val]) => {
                                          const tgt = r.monthlyTargets?.[month] ?? Math.round(val * 1.1);
                                          const dev = val - tgt;
                                          return (
                                            <div key={month} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                                              <span className="block text-[10px] font-bold text-slate-600">{month}</span>
                                              <span className="font-mono font-black text-xs text-blue-800 block">{val.toLocaleString()} م³</span>
                                              <span className={`text-[10px] font-mono block ${dev >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {dev >= 0 ? '+' : ''}{dev.toLocaleString()}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => handleSaveAllSettings()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-sm"
                  >
                    حفظ نموذج تكلفة النقاط والموازنة
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab: AI Promotions Studio, Loyalty Calculator, Rewards Bank & Ideas Bank */}
        {(activeTab === 'promotions_studio' || activeTab === 'rewards' || activeTab === 'ideas_bank') && (() => {
          const effectivePromoTab = activeTab === 'rewards' ? 'rewards' : activeTab === 'ideas_bank' ? 'ideas' : promoSubTab;

          return (
            <div className="p-6 space-y-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>استوديو العروض والذكاء الاصطناعي وبنك الهدايا والأفكار والحاسبة 🤖</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    منظومة متكاملة لمدير النظام: صياغة المسابقات بالذكاء الاصطناعي (معين)، حاسبة نقاط الولاء ودراسة الجدوى الاقتصادية، بنك الهدايا والمكافآت، وبنك الأفكار.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1.5 rounded-full border border-amber-300">
                    {campaigns.filter((c) => c.isActive).length} حملات نشطة
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1.5 rounded-full border border-emerald-300">
                    {rewards.length} هدايا معتمدة
                  </span>
                </div>
              </div>

              {/* Sub-Tabs Switcher */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('promotions_studio');
                    setPromoSubTab('campaigns');
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    effectivePromoTab === 'campaigns'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ورشة العروض والمسابقات بالذكاء الاصطناعي ({campaigns.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('promotions_studio');
                    setPromoSubTab('calculator');
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    effectivePromoTab === 'calculator'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Calculator className="w-4 h-4 text-emerald-500" />
                  <span>حاسبة نقاط الولاء ودراسة الجدوى الاقتصادية 🧮 (باقة المئوية وفر 10.5 ج)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('promotions_studio');
                    setPromoSubTab('rewards');
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    effectivePromoTab === 'rewards'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>بنك الهدايا والمكافآت والتدقيق الذكي للأسعار 🎁 ({rewards.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('promotions_studio');
                    setPromoSubTab('ideas');
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                    effectivePromoTab === 'ideas'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-violet-500" />
                  <span>بنك الأفكار والمراجع التسويقية والروابط 💡 ({ideasBank.length})</span>
                </button>
              </div>

              {/* Sub-Tab 1: Campaigns */}
              {effectivePromoTab === 'campaigns' && (
                <div className="space-y-8 animate-in fade-in">
                  {/* Financial Budget & Points Conversion Governance Bar */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-900/60 shadow-md">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                      معايير الموازنة الصارمة
                    </span>
                    <span className="text-xs font-bold text-indigo-200">
                      معادلة تحويل ومكافأة النقاط المعتمدة
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    مكافأة النقاط للسائق = (المبلغ المالي المخصص للبند ÷ عدد العملاء المستهدفين) ÷ تكلفة النقطة بالجنية ({loyaltyModel.costPerPointEgp} ج)
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto text-xs">
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-slate-400 block">تكلفة النقطة بالجنيه</span>
                    <span className="font-mono font-black text-amber-300 text-sm">{loyaltyModel.costPerPointEgp} ج/نقطة</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-slate-400 block">الموازنة الترويجية المعتمدة</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">{loyaltyModel.totalPromotionalBudgetEgp.toLocaleString()} ج</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block">إجمالي مخصص الحملات</span>
                    <span className="font-mono font-black text-cyan-300 text-sm">
                      {campaigns.reduce((sum, c) => sum + (c.allocatedBudgetItemEgp || 0), 0).toLocaleString()} ج
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Campaign Formulator Workshop */}
            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">
                      ورشة صياغة الأفكار بالذكاء الاصطناعي (مُعِين)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      اكتب فكرتك أو اختر قالباً وسيقوم الذكاء الاصطناعي بصياغة بانر ترويجي جذاب وترجمته فورياً لنقاط
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-bold">أفكار مقترحة:</span>
                  <button
                    onClick={() => {
                      setRawIdeaInput('تحدي تموين 50 متر غاز طبيعي أسبوعياً للدخول في سحب فوري');
                      setCampaignCategory('مسابقة');
                      setCampaignBudgetItemEgp(20000);
                      setCampaignTargetDrivers(500);
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-200 transition font-medium"
                  >
                    🏆 مسابقة تموين أسبوعية
                  </button>
                  <button
                    onClick={() => {
                      setRawIdeaInput('مضاعفة نقاط الولاء 2X في المحطات منخفضة المبيعات بالدقي وسموحة');
                      setCampaignCategory('مضاعفة نقاط');
                      setCampaignBudgetItemEgp(25000);
                      setCampaignTargetDrivers(600);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-200 transition font-medium"
                  >
                    ⭐ نقاط مضاعفة 2X
                  </button>
                  <button
                    onClick={() => {
                      setRawIdeaInput('تحويل السيارات للغاز الطبيعي بالتقسيط المريح وبونص ترحيبي عالي');
                      setCampaignCategory('عرض ترويجي');
                      setCampaignBudgetItemEgp(30000);
                      setCampaignTargetDrivers(300);
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-900 px-2 py-0.5 rounded-lg border border-blue-200 transition font-medium"
                  >
                    🚗 تحويل سيارات بالتقسيط
                  </button>
                  <button
                    onClick={() => {
                      setRawIdeaInput('خصم 15% على تغيير زيوت كارجاس المعتمدة وفحص مجاني للأسطوانة');
                      setCampaignCategory('خصم خدمات');
                      setCampaignBudgetItemEgp(15000);
                      setCampaignTargetDrivers(400);
                    }}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200 transition font-medium"
                  >
                    🔧 خصم زيوت وصيانة
                  </button>
                </div>
              </div>

              {/* Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                {/* Idea text */}
                <div className="md:col-span-6 space-y-1">
                  <label className="font-bold text-slate-800 block">
                    فكرة العرض أو المسابقة (سرد حر أو فكرة تسويقية):
                  </label>
                  <textarea
                    rows={4}
                    value={rawIdeaInput}
                    onChange={(e) => setRawIdeaInput(e.target.value)}
                    placeholder="مثال: عاوزين نعمل مسابقة تشجع السائقين يفولوا 50 متر غاز، ونديهم نقاط إضافية على كارت الولاء الذهبي ونفهمهم إن ده بيوفرلهم 60%..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-amber-500 font-sans"
                  />
                </div>

                {/* Parameters */}
                <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      تصنيف العرض الترويجي:
                    </label>
                    <select
                      value={campaignCategory}
                      onChange={(e) => setCampaignCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="مسابقة">مسابقة وتحدي 🏆</option>
                      <option value="مضاعفة نقاط">مضاعفة نقاط الولاء ⭐</option>
                      <option value="عرض ترويجي">عرض ترويجي خاص 🔥</option>
                      <option value="خصم خدمات">خصومات الزيوت والصيانة 🔧</option>
                      <option value="شرح برنامج الولاء">شرح برنامج ولاء كارجاس 💎</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      المخصص المالي للبند (جنية):
                    </label>
                    <input
                      type="number"
                      value={campaignBudgetItemEgp}
                      onChange={(e) => setCampaignBudgetItemEgp(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-black"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      عدد العملاء المستهدفين:
                    </label>
                    <input
                      type="number"
                      value={campaignTargetDrivers}
                      onChange={(e) => setCampaignTargetDrivers(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Real-time Math Preview */}
                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 flex flex-col justify-center">
                    <span className="text-[10px] text-amber-800 font-bold block">
                      حساب المكافأة آلياً بالموازنة:
                    </span>
                    {(() => {
                      const costPerPoint = loyaltyModel.costPerPointEgp || 0.35;
                      const count = campaignTargetDrivers > 0 ? campaignTargetDrivers : 1;
                      const perDriver = campaignBudgetItemEgp / count;
                      const pts = Math.max(25, Math.round(perDriver / costPerPoint));
                      const equiv = Number((pts * costPerPoint).toFixed(1));
                      return (
                        <div className="text-xs font-mono mt-0.5">
                          <span className="font-black text-amber-950 text-sm">+{pts} نقطة</span>
                          <span className="text-slate-500 text-[10px] block">
                            (تعادل {equiv} ج لكل سائق)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Trigger AI Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  سيتم توليد الصياغة المصرية لـ "مُعين" وحساب النقاط بدقة فور الضغط على الزر.
                </span>

                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAiCampaign}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>{isGeneratingAi ? 'جاري صياغة العرض بالذكاء الاصطناعي...' : 'صياغة العرض بالذكاء الاصطناعي وحساب النقاط 🤖'}</span>
                </button>
              </div>

              {/* AI Draft Result Preview & Publish Card */}
              {aiDraftCampaign && (
                <div className="p-5 bg-gradient-to-br from-slate-50 to-amber-50/40 rounded-2xl border-2 border-amber-400 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-black text-sm text-slate-900">
                        معاينة العرض المصاغ بواسطة الذكاء الاصطناعي:
                      </span>
                    </div>
                    <span className="text-xs bg-amber-200 text-amber-950 px-3 py-1 rounded-full font-bold">
                      جاهز للنشر المباشر في البانر
                    </span>
                  </div>

                  {/* Banner Card Live Visual Preview */}
                  <div className={`p-5 rounded-2xl text-white shadow-lg bg-gradient-to-r ${aiDraftCampaign.bannerGradient || 'from-blue-900 to-slate-900'} relative overflow-hidden`}>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-2 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            {aiDraftCampaign.badge}
                          </span>
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            مكافأة: +{aiDraftCampaign.pointsReward} نقطة ({aiDraftCampaign.financialEquivalentEgp} ج)
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-white">{aiDraftCampaign.title}</h4>
                        <p className="text-xs text-slate-200 leading-relaxed font-light">{aiDraftCampaign.aiGeneratedCopy}</p>
                        <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-[11px] text-slate-300">
                          <span className="text-amber-300 font-bold block mb-0.5">💡 شرح برنامج كارجاس للولاء المرتبط بالعرض:</span>
                          {aiDraftCampaign.explanationOfLoyalty}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                        <button className="w-full md:w-auto bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md">
                          {aiDraftCampaign.buttonText}
                        </button>
                        <span className="text-[10px] text-slate-300">مخصص مالي: {campaignBudgetItemEgp.toLocaleString()} ج</span>
                      </div>
                    </div>
                  </div>

                  {/* Publish Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setAiDraftCampaign(null)}
                      className="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200"
                    >
                      إلغاء المسودة
                    </button>
                    <button
                      onClick={handlePublishAiCampaign}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2 rounded-xl text-xs transition shadow-md flex items-center gap-2 active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>نشر العرض فوراً في بانر العملاء 🚀</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List of Active & Existing Promotional Campaigns */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span>📢 الحملات والمسابقات المسجلة بالنظام:</span>
                  <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-md">
                    {campaigns.length}
                  </span>
                </h4>
                <span className="text-xs text-slate-500">
                  يمكنك تفعيل أو إخفاء أي عرض من البانر التفاعلي فوراً
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className={`bg-white rounded-3xl border ${
                      camp.isActive ? 'border-slate-300 shadow-sm' : 'border-slate-200 opacity-60'
                    } overflow-hidden flex flex-col justify-between transition`}
                  >
                    {/* Card Top Preview Header */}
                    <div className={`p-4 bg-gradient-to-r ${camp.bannerGradient} text-white space-y-1.5`}>
                      <div className="flex items-center justify-between">
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {camp.badge}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            camp.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {camp.isActive ? 'معروض بالبانر ✔️' : 'مخفي ⚪'}
                        </span>
                      </div>
                      <h5 className="font-black text-sm text-white line-clamp-2">{camp.title}</h5>
                      <span className="text-[11px] text-slate-300 block font-light line-clamp-1">{camp.subtitle}</span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Points & Budget Equivalence */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
                          <div>
                            <span className="text-[10px] text-slate-500 block">المكافأة للعميل</span>
                            <span className="font-black font-mono text-amber-700 text-sm">
                              +{camp.pointsReward} نقطة
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              ({camp.financialEquivalentEgp} ج)
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">المخصص المالي</span>
                            <span className="font-black font-mono text-slate-900 text-sm">
                              {camp.allocatedBudgetItemEgp?.toLocaleString() || '—'} ج
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              لـ {camp.targetDriversCount} سائق
                            </span>
                          </div>
                        </div>

                        {/* Copy snippet */}
                        <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                          {camp.aiGeneratedCopy || camp.rawIdea}
                        </p>

                        {/* Loyalty explanation */}
                        <div className="bg-amber-50/60 p-2 rounded-xl text-[10px] text-amber-950 border border-amber-100">
                          <span className="font-bold block text-amber-900 mb-0.5">شرح الولاء:</span>
                          <span className="line-clamp-2">{camp.explanationOfLoyalty}</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleCampaign(camp.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                              camp.isActive
                                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {camp.isActive ? 'إخفاء من البانر' : 'تفعيل بالبانر 🚀'}
                          </button>

                          <button
                            onClick={() => handleStartEditCampaign(camp)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition flex items-center gap-1"
                            title="تعديل تفاصيل الحملة أو المسابقة"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل ✏️</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg transition"
                          title="حذف العرض"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit Campaign Modal */}
            {editingCampaign && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-base">
                        ✏️
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">
                          تعديل الحملة / المسابقة المسجلة
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          تعديل فوري لكافة نصوص وبيانات وموازنة ومكافأة الحملة المعروضة للعميل
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingCampaign(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditedCampaign} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          عنوان العرض / المسابقة البارز:
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCampaign.title}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          الشرح الترويجي المختصر (Subtitle):
                        </label>
                        <input
                          type="text"
                          value={editingCampaign.subtitle}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, subtitle: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">التصنيف:</label>
                        <select
                          value={editingCampaign.category}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, category: e.target.value as any })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                        >
                          <option value="مسابقة">مسابقة وتحدي 🏆</option>
                          <option value="مضاعفة نقاط">مضاعفة نقاط الولاء ⭐</option>
                          <option value="عرض ترويجي">عرض ترويجي خاص 🔥</option>
                          <option value="خصم خدمات">خصومات الزيوت والصيانة 🔧</option>
                          <option value="شرح برنامج الولاء">شرح برنامج ولاء كارجاس 💎</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">شارة البانر (Badge):</label>
                        <input
                          type="text"
                          value={editingCampaign.badge}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, badge: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                          placeholder="مثلاً: مسابقة نشطة 🏆 أو عرض خاص 🔥"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          عدد نقاط المكافأة للسائق:
                        </label>
                        <input
                          type="number"
                          required
                          value={editingCampaign.pointsReward}
                          onChange={(e) => {
                            const pts = Number(e.target.value);
                            const costPerPoint = loyaltyModel.costPerPointEgp || 0.35;
                            const equiv = Number((pts * costPerPoint).toFixed(1));
                            setEditingCampaign({
                              ...editingCampaign,
                              pointsReward: pts,
                              financialEquivalentEgp: equiv,
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-amber-700"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          المقابل المالي بالجنية (معايير الموازنة):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingCampaign.financialEquivalentEgp}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, financialEquivalentEgp: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          المخصص المالي للبند (جنية):
                        </label>
                        <input
                          type="number"
                          value={editingCampaign.allocatedBudgetItemEgp}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, allocatedBudgetItemEgp: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          عدد العملاء المستهدفين:
                        </label>
                        <input
                          type="number"
                          value={editingCampaign.targetDriversCount}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, targetDriversCount: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          نص الصياغة الإعلانية والترويجية الكاملة:
                        </label>
                        <textarea
                          rows={3}
                          value={editingCampaign.aiGeneratedCopy || editingCampaign.rawIdea}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, aiGeneratedCopy: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 leading-relaxed"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          شرح برنامج كارجاس للولاء المرتبط بالعرض:
                        </label>
                        <textarea
                          rows={2}
                          value={editingCampaign.explanationOfLoyalty}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, explanationOfLoyalty: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">نص زر التفاعل:</label>
                        <input
                          type="text"
                          value={editingCampaign.buttonText}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, buttonText: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">إجراء الزر التفاعلي:</label>
                        <select
                          value={editingCampaign.buttonAction}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, buttonAction: e.target.value as any })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                        >
                          <option value="navigate_map">التوجه لأقرب محطة (وصلني) 🗺️</option>
                          <option value="view_rewards">فتح بنك المكافآت 🎁</option>
                          <option value="open_fueling">كود التموين والولاء ⛽</option>
                          <option value="view_details">عرض تفاصيل العرض ℹ️</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">تاريخ البدء:</label>
                        <input
                          type="date"
                          value={editingCampaign.startDate}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">تاريخ الانتهاء:</label>
                        <input
                          type="date"
                          value={editingCampaign.endDate}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingCampaign.isActive}
                            onChange={(e) => setEditingCampaign({ ...editingCampaign, isActive: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span className="font-bold text-slate-900">
                            تفعيل العرض وإظهاره فوراً في بانر صفحة العميل الرئيسية
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingCampaign(null)}
                        className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold transition"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>حفظ التعديلات فوراً ✅</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Sub-Tab 2: Loyalty Points Calculator & Economic Feasibility (حاسبة نقاط الولاء.html) */}
        {effectivePromoTab === 'calculator' && (() => {
          const totalPoints = Math.round(calcFuelMeters * calcMultiplier);
          const cargasCostEgp = Number((totalPoints * calcCostPerPoint).toFixed(2));
          const customerRewardValueEgp = Number((totalPoints * 0.50).toFixed(2));
          const freeMetersEquivalent = Number((customerRewardValueEgp / calcGasPrice).toFixed(1));
          const cargasTotalRevenueEgp = Number((calcFuelMeters * calcGasPrice).toFixed(2));
          const driverSavingsVsGasolineEgp = Number((calcFuelMeters * calcGasolineSavingsPerMeter).toFixed(2));
          const loyaltyCostPct = cargasTotalRevenueEgp > 0 ? Number(((cargasCostEgp / cargasTotalRevenueEgp) * 100).toFixed(2)) : 0;
          const corporateMarginGainPct = 28;

          return (
            <div className="space-y-6 animate-in fade-in">
              {/* Centennial Package & Core Economics Hero Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border border-emerald-800/60 shadow-lg space-y-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-emerald-800/40 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        المعيار الاقتصادي الرسمي لكارجاس
                      </span>
                      <span className="text-emerald-300 font-mono text-xs">معايير ملف حاسبة نقاط الولاء</span>
                    </div>
                    <h4 className="text-lg font-black text-white">
                      🧮 حاسبة نقاط الولاء والجدوى الاقتصادية (13 ج/م³ • 0.35 ج/نقطة • وفر 10.5 ج/م³)
                    </h4>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      نموذج مالي واقتصادي دقيق: كل متر غاز طبيعي يمنح نقطة ولاء (أو أكثر حسب مضاعف المحطة)، وتكلفة النقطة 0.35 ج فقط على الشركة، بينما يحقق السائق وفراً حقيقياً قدره 10.50 ج لكل متر مقارنة ببنزين 92/95، مع باقة المئوية المعتمدة (108 م³ / 100 نقطة) ونمو ربحي مستهدف +28%.
                    </p>
                  </div>

                  <div className="bg-emerald-900/40 border border-emerald-500/40 p-3 rounded-2xl text-center shrink-0">
                    <span className="text-[10px] text-emerald-200 block">نمو هامش أرباح الشركة</span>
                    <span className="font-mono font-black text-amber-300 text-xl">+{corporateMarginGainPct}%</span>
                    <span className="text-[10px] text-slate-300 block">Margin Gain</span>
                  </div>
                </div>

                {/* Centennial Package Special Callout */}
                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-xl shrink-0 font-black">
                      💯
                    </div>
                    <div>
                      <span className="font-black text-amber-300 text-sm block">باقة المئوية المعتمدة (Centennial Loyalty Tier):</span>
                      <span className="text-slate-200 text-xs">
                        استهلاك <strong className="text-white">108 متر غاز</strong> يمنح السائق <strong className="text-amber-300">100 نقطة</strong> (هدية بقيمة 50 ج أو 3.85 م³ غاز مجاني)، بتكلفة فعلية على كارجاس <strong className="text-emerald-300">35 ج فقط</strong> (2.49% من المبيعات)، مع وفر صافٍ للسائق قدره <strong className="text-cyan-300">1,134 ج</strong> مقارنة بالبنزين!
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCalcFuelMeters(108);
                      setCalcMultiplier(0.9259);
                      setCalcPresetType('centennial');
                    }}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shrink-0 shadow-sm"
                  >
                    تطبيق باقة المئوية 💯
                  </button>
                </div>
              </div>

              {/* Preset Quick Switcher */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                  <span>⚡ سيناريوهات وأنماط التموين الجاهزة للحساب:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCalcFuelMeters(1200);
                      setCalcMultiplier(1.0);
                      setCalcPresetType('taxi');
                    }}
                    className={`p-3 rounded-2xl font-bold transition flex flex-col items-center gap-1 border ${
                      calcPresetType === 'taxi'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-lg">🚕</span>
                    <span className="font-black">تاكسي أجرة</span>
                    <span className="text-[10px] opacity-80 font-mono">1,200 م³/شهر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcFuelMeters(3500);
                      setCalcMultiplier(1.0);
                      setCalcPresetType('microbus');
                    }}
                    className={`p-3 rounded-2xl font-bold transition flex flex-col items-center gap-1 border ${
                      calcPresetType === 'microbus'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-lg">🚐</span>
                    <span className="font-black">ميكروباص خطوط</span>
                    <span className="text-[10px] opacity-80 font-mono">3,500 م³/شهر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcFuelMeters(108);
                      setCalcMultiplier(0.9259);
                      setCalcPresetType('centennial');
                    }}
                    className={`p-3 rounded-2xl font-bold transition flex flex-col items-center gap-1 border ${
                      calcPresetType === 'centennial'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-lg">💯</span>
                    <span className="font-black">باقة المئوية</span>
                    <span className="text-[10px] opacity-80 font-mono">108 م³ / 100 نقطة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcFuelMeters(25000);
                      setCalcMultiplier(1.0);
                      setCalcPresetType('fleet');
                    }}
                    className={`p-3 rounded-2xl font-bold transition flex flex-col items-center gap-1 border ${
                      calcPresetType === 'fleet'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-lg">🚛</span>
                    <span className="font-black">أسطول شركات</span>
                    <span className="text-[10px] opacity-80 font-mono">25,000 م³/شهر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcFuelMeters(150000);
                      setCalcMultiplier(1.0);
                      setCalcPresetType('station');
                    }}
                    className={`p-3 rounded-2xl font-bold transition flex flex-col items-center gap-1 border ${
                      calcPresetType === 'station'
                        ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-lg">⛽</span>
                    <span className="font-black">محطة كاملة</span>
                    <span className="text-[10px] opacity-80 font-mono">150,000 م³/شهر</span>
                  </button>
                </div>
              </div>

              {/* Interactive Controls & Live Sliders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inputs */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                  <h4 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>مدخلات التموين والأسعار التفاعلية</span>
                    <span className="text-xs text-slate-500 font-normal">قم بتحريك المؤشر أو كتابة القيمة</span>
                  </h4>

                  {/* Fuel Meters Slider & Number Input */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                        <Fuel className="w-4 h-4 text-emerald-600" />
                        <span>كمية استهلاك الغاز الطبيعي (م³):</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="1000000"
                          value={calcFuelMeters}
                          onChange={(e) => {
                            setCalcFuelMeters(Math.max(1, Number(e.target.value)));
                            setCalcPresetType('custom');
                          }}
                          className="w-32 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-mono font-black text-slate-950 text-right text-sm"
                        />
                        <span className="text-xs font-bold text-slate-600">م³</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="100000"
                      step="10"
                      value={calcFuelMeters > 100000 ? 100000 : calcFuelMeters}
                      onChange={(e) => {
                        setCalcFuelMeters(Number(e.target.value));
                        setCalcPresetType('custom');
                      }}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>10 م³</span>
                      <span>1,200 م³ (تاكسي)</span>
                      <span>3,500 م³ (ميكروباص)</span>
                      <span>25,000 م³ (أسطول)</span>
                      <span>100,000 م³</span>
                    </div>
                  </div>

                  {/* Multiplier Selector */}
                  <div className="space-y-2">
                    <label className="font-black text-slate-800 text-xs block">
                      معامل مضاعف نقاط الولاء (Points Multiplier):
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { val: 1.0, title: '1.0x عادي قياسي', desc: 'تموين طبيعي (1 م³ = 1 نقطة)' },
                        { val: 1.5, title: '1.5x ترويجي', desc: 'محطات مستهدفة وفترات الهدوء' },
                        { val: 2.0, title: '2.0x مضاعف', desc: 'محطات منخفضة المبيعات وتحديات' },
                      ].map((m) => (
                        <button
                          key={m.val}
                          type="button"
                          onClick={() => {
                            setCalcMultiplier(m.val);
                            setCalcPresetType('custom');
                          }}
                          className={`p-3 rounded-2xl border text-right transition ${
                            Math.abs(calcMultiplier - m.val) < 0.01
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs font-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-bold'
                          }`}
                        >
                          <span className="block text-sm font-black">{m.title}</span>
                          <span className="text-[10px] opacity-80 block">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Financial Parameters Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">سعر المتر غاز (جنيه):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={calcGasPrice}
                        onChange={(e) => setCalcGasPrice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-black text-sm"
                      />
                      <span className="text-[9px] text-slate-400 block">السعر الرسمي (13.00 ج)</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">تكلفة النقطة لكارجاس (جنيه):</label>
                      <input
                        type="number"
                        step="0.05"
                        value={calcCostPerPoint}
                        onChange={(e) => setCalcCostPerPoint(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-black text-sm"
                      />
                      <span className="text-[9px] text-slate-400 block">التكلفة المالية (0.35 ج)</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">وفر المتر مقابل البنزين (جنيه):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={calcGasolineSavingsPerMeter}
                        onChange={(e) => setCalcGasolineSavingsPerMeter(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-black text-sm"
                      />
                      <span className="text-[9px] text-slate-400 block">مقارنة ببنزين 92/95 (10.5 ج)</span>
                    </div>
                  </div>
                </div>

                {/* Instant Financial Yield & ROI Card */}
                <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white p-6 rounded-3xl border border-emerald-700/50 shadow-md flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
                      <span className="text-xs font-bold text-emerald-300">ملخص الجدوى والربحية</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30">
                        مباشر ودقيق
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                        <span className="text-[10px] text-emerald-200 block">مبيعات الغاز الإجمالية لكارجاس</span>
                        <span className="font-mono font-black text-xl text-white">
                          {cargasTotalRevenueEgp.toLocaleString()} ج
                        </span>
                        <span className="text-[10px] text-slate-300 block font-mono">
                          ({calcFuelMeters.toLocaleString()} م³ × {calcGasPrice} ج)
                        </span>
                      </div>

                      <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                        <span className="text-[10px] text-amber-200 block">تكلفة نقاط الولاء على كارجاس</span>
                        <span className="font-mono font-black text-xl text-amber-300">
                          {cargasCostEgp.toLocaleString()} ج
                        </span>
                        <span className="text-[10px] text-slate-300 block font-mono">
                          (نسبة {loyaltyCostPct}% فقط من إجمالي المبيعات)
                        </span>
                      </div>

                      <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                        <span className="text-[10px] text-cyan-200 block">صافي وفر السائق مقارنة بالبنزين</span>
                        <span className="font-mono font-black text-xl text-cyan-300">
                          {driverSavingsVsGasolineEgp.toLocaleString()} ج
                        </span>
                        <span className="text-[10px] text-slate-300 block font-mono">
                          (وفر 10.50 ج في كل متر تموّن)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-300">معدل العائد والجاذبية:</span>
                    <span className="text-amber-400 font-black">عالي جداً (ROI ممتاز) ✓</span>
                  </div>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-slate-500 text-[11px] block">إجمالي النقاط المكتسبة</span>
                  <span className="font-mono font-black text-amber-600 text-2xl block">
                    {totalPoints.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">نقطة ولاء للعميل</span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-slate-500 text-[11px] block">القيمة السوقية للهدية / الغاز</span>
                  <span className="font-mono font-black text-emerald-600 text-2xl block">
                    {customerRewardValueEgp.toLocaleString()} ج
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    (أو {freeMetersEquivalent} م³ غاز مجاني)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-slate-500 text-[11px] block">التكلفة الفعلية لكارجاس</span>
                  <span className="font-mono font-black text-rose-600 text-2xl block">
                    {cargasCostEgp.toLocaleString()} ج
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ({calcCostPerPoint} ج/نقطة)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-slate-500 text-[11px] block">نسبة تكلفة الولاء من الدخل</span>
                  <span className="font-mono font-black text-blue-600 text-2xl block">
                    %{loyaltyCostPct}
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-bold">
                    نمو ربحي +{corporateMarginGainPct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Sub-Tab 3: Rewards Bank & AI Pricing Auditor */}
        {effectivePromoTab === 'rewards' && (
          <div className="space-y-6 animate-in fade-in">
            {/* AI Reward Auditor & Pricing Engine (مُعِين) */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white p-5 rounded-3xl border border-emerald-700/50 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-700/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl">
                    🧠
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white flex items-center gap-2">
                      <span>الذكاء الاصطناعي لتدقيق الهدايا واحتساب النقاط والموازنة (مُعِين)</span>
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                        ذكي ومربوط بالموازنة
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-200">
                      اكتب اسم الهدية وقيمتها التقديرية بالجنيه، وسيقوم الذكاء الاصطناعي بالتحري عن دقة السعر، واحتساب النقاط المكافئة، وكمية الغاز المجاني، والموازنة لعدد المشاركين!
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-emerald-200 mb-1">اسم الهدية / الخدمة / الكوبون</label>
                  <input
                    type="text"
                    value={aiRewardGiftName}
                    onChange={(e) => setAiRewardGiftName(e.target.value)}
                    placeholder="مثال: غيار زيت موبيل 5000 كم، طقم بوجيهات أصلي، 40 متر غاز، كابون كارفور..."
                    className="w-full bg-slate-900/80 border border-emerald-600/40 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-200 mb-1">القيمة المقدرة (جنية)</label>
                  <input
                    type="number"
                    value={aiRewardPriceEgp}
                    onChange={(e) => setAiRewardPriceEgp(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-emerald-600/40 rounded-xl p-2.5 text-xs font-mono font-bold text-amber-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-200 mb-1">عدد المشاركين المستهدف</label>
                  <input
                    type="number"
                    value={aiRewardTargetDrivers}
                    onChange={(e) => setAiRewardTargetDrivers(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-emerald-600/40 rounded-xl p-2.5 text-xs font-mono font-bold text-cyan-300"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-200 font-bold">التصنيف:</span>
                  <select
                    value={aiRewardCategory}
                    onChange={(e) => setAiRewardCategory(e.target.value as any)}
                    className="bg-slate-900 border border-emerald-600/40 rounded-xl px-3 py-1.5 text-xs text-emerald-100 font-bold"
                  >
                    <option value="meters">غاز طبيعي مجاني (أمتار)</option>
                    <option value="oil">زيوت وفلاتر</option>
                    <option value="spark_plugs">بوجيهات وقطع صيانة</option>
                    <option value="car_wash">غسيل وخدمات سيارات</option>
                    <option value="discount">كوبونات وخصومات شركاء</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isAuditingAiReward}
                  onClick={handleAiAuditReward}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-2.5 px-5 rounded-xl text-xs transition shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isAuditingAiReward ? 'جارٍ التحري والتدقيق واحتساب النقاط...' : 'تدقيق السعر واحتساب النقاط والموازنة بالذكاء الاصطناعي 🧠'}</span>
                </button>
              </div>

              {/* AI Audit Result Box */}
              {aiRewardAuditResult && (
                <div className="bg-slate-900/95 border-2 border-amber-400/70 p-4 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-black text-sm">💡 نتيجة التدقيق الاستشاري لـ "مُعِين":</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        {aiRewardAuditResult.pricingStatus}
                      </span>
                    </div>

                    <button
                      onClick={handleAdoptAiReward}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>اعتماد وإضافة الهدية لبنك السائقين فوراً ✓</span>
                    </button>
                  </div>

                  {/* Calculated Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">السعر المعتمد:</span>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {aiRewardAuditResult.verifiedFairPriceEgp} ج
                      </span>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">النقاط المحتسبة للعميل:</span>
                      <span className="font-mono font-black text-cyan-300 text-sm">
                        {aiRewardAuditResult.pointsCost} نقطة
                      </span>
                      <span className="text-[9px] text-slate-400 block">(تكلفة النقطة 0.35 ج)</span>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">ما يعادله بالغاز الطبيعي:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {aiRewardAuditResult.freeMetersEquivalent} م³ غاز
                      </span>
                      <span className="text-[9px] text-slate-400 block">(سعر المتر 13 ج)</span>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">الموازنة لـ {aiRewardTargetDrivers} سائق:</span>
                      <span className="font-mono font-black text-white text-sm">
                        {aiRewardAuditResult.totalRequiredBudgetEgp.toLocaleString()} ج
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed font-sans whitespace-pre-line">
                    {aiRewardAuditResult.aiAuditNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Standard Manual Reward Add Form */}
            <form onSubmit={handleAddReward} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                إضافة مكافأة يدوية سريعة إلى بنك الولاء
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم الهدية</label>
                  <input
                    type="text"
                    required
                    value={newRewardTitle}
                    onChange={(e) => setNewRewardTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">النقاط المطلوبة</label>
                  <input
                    type="number"
                    required
                    value={newRewardPoints}
                    onChange={(e) => setNewRewardPoints(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القيمة التقديرية</label>
                  <input
                    type="text"
                    required
                    value={newRewardValue}
                    onChange={(e) => setNewRewardValue(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition"
              >
                إضافة الهدية للبنك ✓
              </button>
            </form>

            {/* Active Rewards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rewards.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900">{r.title}</span>
                      <span className="bg-amber-100 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full">
                        {r.pointsCost} نقطة
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                    {r.freeMetersEquivalent && (
                      <span className="inline-block mt-2 text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        ⛽ يعادل {r.freeMetersEquivalent} م³ غاز طبيعي
                      </span>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">{r.valueText}</span>
                    <button
                      onClick={() => handleDeleteReward(r.id)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tab 4: Ideas Bank & References for Super Admin Only */}
        {effectivePromoTab === 'ideas' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-violet-600" />
                    بنك الأفكار والهدايا والمراجع التسويقية (خاص بمدير النظام فقط)
                  </h3>
                  <span className="text-[10px] bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full font-bold border border-violet-200">
                    🔒 محمي وسري للمدير
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  احتفظ هنا بكافة الأفكار التسويقية والروابط المرجعية، وانسخها بنقرة واحدة لتمريرها فوراً للذكاء الاصطناعي لاحتساب الموازنة والنقاط.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddIdea}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة فكرة جديدة / حفظ رابط مرجعي 💡</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 font-bold ml-1">التصنيف:</span>
                {['all', 'مسابقة', 'هدية عينية', 'كوبون وخصم', 'غاز مجاني', 'زيوت وفلاتر', 'صيانة وخدمات'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedIdeaCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      selectedIdeaCategory === cat
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'جميع الأفكار' : cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={ideaSearchQuery}
                  onChange={(e) => setIdeaSearchQuery(e.target.value)}
                  placeholder="ابحث في الأفكار أو الروابط..."
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-56 font-sans"
                />
              </div>
            </div>

            {/* Ideas Grid */}
            {(() => {
              const filteredIdeas = ideasBank.filter((it) => {
                const matchCat = selectedIdeaCategory === 'all' || it.category === selectedIdeaCategory;
                const matchQuery =
                  !ideaSearchQuery ||
                  it.title.toLowerCase().includes(ideaSearchQuery.toLowerCase()) ||
                  it.description.toLowerCase().includes(ideaSearchQuery.toLowerCase()) ||
                  (it.tags && it.tags.some((t) => t.toLowerCase().includes(ideaSearchQuery.toLowerCase())));
                return matchCat && matchQuery;
              });

              if (filteredIdeas.length === 0) {
                return (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mx-auto text-xl">
                      💡
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">لا توجد أفكار مطابقة للبحث</h4>
                    <p className="text-xs text-slate-500">أضف فكرة جديدة أو رابط مرجعي لحفظها في البنك</p>
                    <button
                      onClick={handleOpenAddIdea}
                      className="bg-violet-600 text-white text-xs font-bold py-2 px-4 rounded-xl"
                    >
                      + إضافة فكرة الآن
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredIdeas.map((item) => {
                    const totalBudget = item.estimatedEgpValue * item.targetParticipants;
                    const isCopied = copiedIdeaId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-violet-400 transition flex flex-col justify-between p-5 space-y-4 group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="bg-violet-50 text-violet-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-violet-200">
                              {item.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditIdea(item)}
                                className="text-slate-400 hover:text-slate-700 p-1"
                                title="تعديل الفكرة"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteIdea(item.id)}
                                className="text-rose-400 hover:text-rose-600 p-1"
                                title="حذف الفكرة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-black text-slate-900 text-sm group-hover:text-violet-900 transition">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Reference URL */}
                          {item.referenceUrl && (
                            <a
                              href={item.referenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline bg-blue-50/60 px-2.5 py-1 rounded-lg border border-blue-100 max-w-full truncate"
                            >
                              <Link className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate" dir="ltr">{item.referenceUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {item.tags.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Financial Estimation Bar */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 p-2 rounded-xl">
                            <div>
                              <span className="text-[10px] text-slate-500 block">القيمة المقدرة:</span>
                              <span className="font-mono font-black text-xs text-slate-900">
                                {item.estimatedEgpValue.toLocaleString()} ج
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">إجمالي الموازنة ({item.targetParticipants} سائق):</span>
                              <span className="font-mono font-black text-xs text-emerald-700">
                                {totalBudget.toLocaleString()} ج
                              </span>
                            </div>
                          </div>

                          {/* Actions: Copy & Send to AI */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <button
                              onClick={() => handleCopyIdea(item)}
                              className={`flex-1 text-xs font-bold py-1.5 px-2 rounded-xl border transition flex items-center justify-center gap-1 ${
                                isCopied
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                              title="نسخ نص الفكرة لخانة الإدخال"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? 'تم النسخ!' : 'نسخ الفكرة'}</span>
                            </button>

                            <button
                              onClick={() => handleTransferIdeaToPromotions(item)}
                              className="text-[11px] font-bold py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition flex items-center gap-1"
                              title="إرسال الفكرة لاستوديو العروض الترويجية والبانر"
                            >
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>للعروض 🤖</span>
                            </button>

                            <button
                              onClick={() => handleTransferIdeaToRewards(item)}
                              className="text-[11px] font-bold py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl transition flex items-center gap-1"
                              title="إرسال الفكرة للذكاء الاصطناعي لاحتساب النقاط وتدقيق السعر"
                            >
                              <Coins className="w-3 h-3 text-emerald-600" />
                              <span>لبنك الهدايا 🎁</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  })()}

        {/* Tab: Complaints & Technician Courtesy Ratings */}
        {activeTab === 'complaints' && (
          <div className="p-6 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                سجل الشكاوى ومقترحات العملاء وتقييمات الفنيين
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة تقييمات السائقين لسلوك ومعاملة الفنيين، والشكاوى الواردة عبر التطبيق
              </p>
            </div>

            {/* Ratings Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  أحدث تقييمات الفنيين وحسن المعاملة:
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {ratings.map((rt) => (
                    <div key={rt.id} className="bg-white p-2.5 rounded-xl border border-amber-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rt.technicianName} ({rt.stationName})</span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          معاملة: {rt.behaviorRating} / 5 ⭐
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{rt.comment}</p>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        السائق: {rt.driverName} • {new Date(rt.timestamp).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaints List */}
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  الشكاوى والمقترحات الواردة ({complaints.length}):
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {complaints.map((cmp) => (
                    <div key={cmp.id} className="bg-white p-2.5 rounded-xl border border-rose-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-950">[{cmp.category}] {cmp.driverName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {cmp.status}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px]">{cmp.message}</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                        <span>هاتف: {cmp.phone} • لوحة: {cmp.carPlate}</span>
                        <button
                          onClick={() => {
                            const updated = complaints.map((c) =>
                              c.id === cmp.id ? { ...c, status: 'تم الحل' as const } : c
                            );
                            setComplaints(updated);
                            saveCustomerComplaints(updated);
                          }}
                          className="text-emerald-700 hover:underline font-bold"
                        >
                          تحديد كـ "تم الحل" ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Version Snapshot, Backup & Rollback Manager */}
        {activeTab === 'rollback' && (
          <div className="p-6 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                إدارة النسخ الاحتياطية وإمكانية العودة للنسخة الكلاسيكية السابقة
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تتيح لك هذه اللوحة الرجوع للنسخة الكلاسيكية الأصلية ومسح التعديلات لو لم تناسبك، أو أخذ نسخة احتياطية فورية
              </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-4 text-xs text-amber-950">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛡️</span>
                <div>
                  <h4 className="font-black text-sm">ضمان استقرار المنظومة والعودة للنسخة الأصلية</h4>
                  <p className="text-xs text-amber-900 mt-0.5">
                    النسخة الحالية تدعم كافة الميزات الموسعة (الخريطة، KMZ، تقييم الفنيين، حوافز الرواد، تكلفة النقاط، الموازنة). يمكنك الرجوع للوضع الكلاسيكي بضغطة واحدة.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    saveCurrentStateSnapshot();
                    alert('تم حفظ لقطة احتياطية كاملة (Snapshot) لكافة بيانات المنظومة الحالية بنجاح!');
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs shadow-xs"
                >
                  حفظ نسخة احتياطية فورية (Snapshot) 📸
                </button>

                <button
                  onClick={() => {
                    if (confirm('هل أنت متأكد من رغبتك في العودة للنسخة الكلاسيكية ومسح التعديلات المؤقتة؟')) {
                      restoreClassicV1Snapshot();
                      onRollbackToClassic();
                      alert('تمت استعادة النسخة الكلاسيكية بنجاح وإعادة تشغيل المنظومة.');
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 px-5 rounded-xl transition text-xs shadow-md"
                >
                  العودة للنسخة الكلاسيكية ومسح التعديلات 🔄
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Tab: Pumps & Stores */}
        {activeTab === 'pumps' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    📱 ملصقات تحميل التطبيق (جوجل بلاي / أبل ستور)
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رابط Google Play</label>
                    <input
                      type="url"
                      value={playUrlInput}
                      onChange={(e) => setPlayUrlInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رابط Apple App Store</label>
                    <input
                      type="url"
                      value={iosUrlInput}
                      onChange={(e) => setIosUrlInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <button
                    onClick={generateAllQrs}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    تحديث وتوليد الأكواد 🔄
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                    {googlePlayQr ? (
                      <img src={googlePlayQr} alt="Google Play QR" className="w-28 h-28 mx-auto" />
                    ) : (
                      <div className="w-28 h-28 mx-auto flex items-center justify-center text-[10px] text-slate-400 bg-slate-50 rounded-lg">
                        جارٍ التوليد...
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-800 block">ملصق أندرويد</span>
                    <button
                      onClick={() => handlePrintCard({ title: 'تحميل كارجاس - أندرويد', qrUrl: googlePlayQr, sub: playUrlInput })}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1 rounded-lg transition"
                    >
                      طباعة 🖨️
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                    {appStoreQr ? (
                      <img src={appStoreQr} alt="App Store QR" className="w-28 h-28 mx-auto" />
                    ) : (
                      <div className="w-28 h-28 mx-auto flex items-center justify-center text-[10px] text-slate-400 bg-slate-50 rounded-lg">
                        جارٍ التوليد...
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-800 block">ملصق آيفون</span>
                    <button
                      onClick={() => handlePrintCard({ title: 'تحميل كارجاس - آيفون', qrUrl: appStoreQr, sub: iosUrlInput })}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1 rounded-lg transition"
                    >
                      طباعة 🖨️
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 lg:col-span-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-emerald-600" />
                    ⛽ ترميز وتوليد أكواد المضخات الفريدة (حتى 8 مضخات)
                  </h3>

                  <button
                    onClick={() => {
                      setPrintingItem({
                        title: `ملصقات مضخات ${config.stationName}`,
                        qrUrl: pumpsList[0]?.qrDataUrl || '',
                        sub: `إجمالي ${pumpCount} مضخات رقمية`,
                      });
                      setTimeout(() => window.print(), 150);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة حزمة المضخات 🖨️</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">كود المحطة</label>
                    <input
                      type="text"
                      value={stationCodeInput}
                      onChange={(e) => setStationCodeInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">عدد المضخات</label>
                    <select
                      value={pumpCount}
                      onChange={(e) => setPumpCount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold"
                    >
                      <option value="4">4 مضخات</option>
                      <option value="6">6 مضخات</option>
                      <option value="8">8 مضخات رقمية</option>
                    </select>
                  </div>
                  <button
                    onClick={generateAllQrs}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    تحديث توليد المضخات
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {pumpsList.map((pump) => (
                    <div
                      key={pump.pumpNumber}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1.5 group hover:border-emerald-500 transition"
                    >
                      <div className="bg-emerald-50 text-emerald-800 text-[10px] font-black py-0.5 rounded-md">
                        مضخة رقم #{pump.pumpNumber}
                      </div>
                      {pump.qrDataUrl ? (
                        <img
                          src={pump.qrDataUrl}
                          alt={`مضخة ${pump.pumpNumber}`}
                          className="w-24 h-24 mx-auto border border-slate-100 rounded-lg p-1 group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-24 h-24 mx-auto flex items-center justify-center text-[10px] text-slate-400 bg-slate-50 rounded-lg">
                          جارٍ التوليد...
                        </div>
                      )}
                      <div className="flex gap-1 pt-1">
                        <button
                          onClick={() =>
                            handlePrintCard({
                              title: `كارجاس - مضخة رقم #${pump.pumpNumber}`,
                              qrUrl: pump.qrDataUrl,
                              sub: `${pump.stationName} | ${pump.stationCode}`,
                            })
                          }
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1 rounded-lg transition"
                        >
                          طباعة 🖨️
                        </button>
                        <button
                          onClick={() => {
                            const msg = `كود مضخة رقم #${pump.pumpNumber} في ${pump.stationName}.\nالرابط: ${pump.directUrl}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 p-1 rounded-lg transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing Tab: Crew & WhatsApp */}
        {activeTab === 'crew' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  إدارة طاقم عمل المحطة وتوزيع أكواد الوردية عبر الواتساب
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  id="excelCrewFileInput"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleCrewFileUpload}
                />
                <button
                  onClick={() => document.getElementById('excelCrewFileInput')?.click()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>رفع شيت إكسيل (Excel)</span>
                </button>

                <button
                  onClick={downloadCrewSampleExcel}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل نموذج إكسيل</span>
                </button>

                <button
                  onClick={regenerateAllDailyPins}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>توليد أرقام سرية جديدة للكل</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود الفني</th>
                    <th className="p-3">الاسم بالكامل</th>
                    <th className="p-3">الدور الوظيفي</th>
                    <th className="p-3 font-mono">رقم الواتساب</th>
                    <th className="p-3 text-center">كود الـ PIN لليوم</th>
                    <th className="p-3 text-center">نقاط الحافز والمعاملة</th>
                    <th className="p-3 text-center">إجراءات الإرسال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stationCrew.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-bold text-slate-700">{member.id}</td>
                      <td className="p-3 font-bold text-slate-900">{member.name}</td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                          {member.role}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600" dir="ltr">
                        +{member.phone}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-sm bg-slate-100 text-slate-900 px-3 py-1 rounded-lg">
                        {member.dailyPin}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-amber-700">{member.technicianPoints || 300} نقطة</span>
                        <span className="text-[10px] text-slate-500 block">⭐ {member.averageBehaviorRating || 4.9}</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => sendPinViaWhatsApp(member)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center justify-center gap-1 shadow-xs"
                            title="إرسال رابط الوردية اليومية عبر الواتساب"
                          >
                            <Send className="w-3 h-3" />
                            <span>واتساب 📲</span>
                          </button>
                          <button
                            onClick={() => copyTechnicianLoginLink(member)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-2 py-1.5 rounded-xl transition flex items-center justify-center gap-1 border border-slate-200"
                            title="نسخ رابط الدخول المباشر للفني"
                          >
                            <Copy className="w-3 h-3" />
                            <span>نسخ الرابط 📋</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Existing Tab: Moen */}
        {activeTab === 'moen' && (
          <div className="p-6 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-600" />
                التحكم في المساعد الذكي "مُعِين" ومراجعة أداءه وسرية الأفكار
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moenEnabled}
                    onChange={(e) => setMoenEnabled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">تفعيل المساعد "مُعين" في التطبيق</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moenOnlyAdmin}
                    onChange={(e) => setMoenOnlyAdmin(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">حصر مُعين لمدير النظام فقط (إخفاؤه عن السائق والفني)</span>
                  </div>
                </label>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800">الموضوعات المعتمدة لمُعين:</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {moenAllowedTopics.map((topic, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-800">{topic}</span>
                      <button
                        onClick={() => setMoenAllowedTopics(moenAllowedTopics.filter((_, i) => i !== idx))}
                        className="text-rose-500 font-bold text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="موضوع مصرح جديد..."
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs"
                  />
                  <button
                    onClick={() => {
                      if (newTopicInput.trim()) {
                        setMoenAllowedTopics([...moenAllowedTopics, newTopicInput.trim()]);
                        setNewTopicInput('');
                      }
                    }}
                    className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSaveAllSettings()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition"
            >
              حفظ إعدادات المساعد مُعين
            </button>
          </div>
        )}

        {/* Existing Tab: CMS */}
        {activeTab === 'cms' && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleSaveAllSettings} className="space-y-6 text-xs">
              {/* Visual Identity & Logos Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    إدارة الهوية البصرية وشعارات كارجاس (لوجو التطبيق + لوجو المحطات الموحد)
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    يمكنك رفع لوجو التطبيق وشعار المحطات من جهازك، أو وضع رابط الصورة مباشرة لتعميمهما فوراً.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* App Logo */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <label className="block font-bold text-slate-800">
                      1. لوجو التطبيق الرئيسي (يظهر في الهيدر وصفحات النظام)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                        {editAppLogoUrl ? (
                          <img src={editAppLogoUrl} alt="App Logo" className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-[10px] font-bold text-slate-400 text-center">لا يوجد لوجو مخصص</div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="appLogoCmsInput"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAppLogoUpload}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('appLogoCmsInput')?.click()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة</span>
                          </button>
                          {editAppLogoUrl && (
                            <button
                              type="button"
                              onClick={() => setEditAppLogoUrl('')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-2.5 rounded-xl transition"
                            >
                              استعادة الافتراضي
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="أو الصق رابط صورة اللوجو هنا..."
                          value={editAppLogoUrl}
                          onChange={(e) => setEditAppLogoUrl(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stations General Logo */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <label className="block font-bold text-slate-800">
                      2. لوجو المحطات المعمم على الخريطة (لكافة فروع كارجاس)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                        {editStationLogoUrl ? (
                          <img src={editStationLogoUrl} alt="Station Logo" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
                            CARGAS
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="stationLogoCmsInput"
                            accept="image/*"
                            className="hidden"
                            onChange={handleStationLogoUpload}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('stationLogoCmsInput')?.click()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة</span>
                          </button>
                          {editStationLogoUrl && (
                            <button
                              type="button"
                              onClick={() => setEditStationLogoUrl('')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-2.5 rounded-xl transition"
                            >
                              استعادة الافتراضي
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="أو الصق رابط صورة لوجو المحطات هنا..."
                          value={editStationLogoUrl}
                          onChange={(e) => setEditStationLogoUrl(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المنظومة</label>
                  <input
                    type="text"
                    value={editAppName}
                    onChange={(e) => setEditAppName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العنوان الفرعي</label>
                  <input
                    type="text"
                    value={editAppSub}
                    onChange={(e) => setEditAppSub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كلمة سر المدير (0000)</label>
                  <input
                    type="text"
                    value={editAdminPin}
                    onChange={(e) => setEditAdminPin(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-rose-300 rounded-xl p-2.5 text-xs font-mono font-bold text-center tracking-widest text-rose-700"
                  />
                </div>
              </div>

              {/* Support Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم المختصر للاتصال (Hotline)</label>
                  <input
                    type="text"
                    value={editHotline}
                    onChange={(e) => setEditHotline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الواتساب الرسمي للشكاوى</label>
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني للشكاوى</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر متر الغاز (13 ج)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editGasPrice}
                    onChange={(e) => setEditGasPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">معدل النقاط لكل متر</label>
                  <input
                    type="number"
                    value={editPointsRatio}
                    onChange={(e) => setEditPointsRatio(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">لون السمة الرئيسي</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={editThemeColor}
                      onChange={(e) => setEditThemeColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editThemeColor}
                      onChange={(e) => setEditThemeColor(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl text-xs transition shadow-md"
              >
                حفظ كافة التعديلات والتخصيصات فوراً 💾
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal: Add Custom Computed Column (جمع، طرح، ضرب، قسمة، نسبة مئوية) */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    إضافة خانة / عمود حسابي مخصص لشيت المبيعات
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    يمكنك تحديد العملية الحسابية (جمع، طرح، ضرب، قسمة، نسبة مئوية) وتسمية العمود
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddColumnModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomColumn} className="space-y-4 text-xs">
              {/* Column Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  اسم الخانة / العمود المخصص (مثلاً: الانحراف +/-):
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="مثال: الانحراف (+/-) أو معدل الإنجاز % أو القيمة بالجنيه أو المتوسط اليومي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Operand 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    المعامل الأول (الخانة الأساسية):
                  </label>
                  <select
                    value={newColOperand1Key}
                    onChange={(e) => {
                      setNewColOperand1Key(e.target.value);
                      const opt = e.target.selectedOptions[0]?.text;
                      if (opt) setNewColOperand1Label(opt);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="annualActualM3">إجمالي الفعلي السنوي (م³)</option>
                    <option value="annualTargetM3">المستهدف السنوي (م³)</option>
                    <option value="annualVarianceM3">الانحراف السنوي (م³)</option>
                    <option value="allocatedBudgetEgp">الموازنة الترويجية المخصصة (ج)</option>
                    <option value="promotionalPointsMultiplier">مضاعف نقاط الولاء</option>
                    <option value="يناير">شهر يناير - فعلي (م³)</option>
                    <option value="فبراير">شهر فبراير - فعلي (م³)</option>
                    <option value="مارس">شهر مارس - فعلي (م³)</option>
                    <option value="إبريل">شهر إبريل - فعلي (م³)</option>
                    <option value="مايو">شهر مايو - فعلي (م³)</option>
                    <option value="يونيو">شهر يونيو - فعلي (م³)</option>
                  </select>
                </div>

                {/* Math Operation */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    العملية الحسابية:
                  </label>
                  <select
                    value={newColOperation}
                    onChange={(e) => setNewColOperation(e.target.value as MathOperation)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-purple-900"
                  >
                    <option value="add">جمع (+) [Operand 1 + Operand 2]</option>
                    <option value="subtract">طرح (-) [Operand 1 - Operand 2]</option>
                    <option value="multiply">ضرب (×) [Operand 1 × Operand 2]</option>
                    <option value="divide">قسمة (÷) [Operand 1 ÷ Operand 2]</option>
                    <option value="percentage">نسبة مئوية (%) [(Operand 1 ÷ Operand 2) × 100]</option>
                  </select>
                </div>
              </div>

              {/* Operand 2: Column vs Constant */}
              <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-purple-950">نوع المعامل الثاني:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="op2Type"
                      checked={newColOperand2Type === 'column'}
                      onChange={() => setNewColOperand2Type('column')}
                    />
                    <span>عمود آخر من الشيت</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="op2Type"
                      checked={newColOperand2Type === 'constant'}
                      onChange={() => setNewColOperand2Type('constant')}
                    />
                    <span>رقم ثابت (مثل 13 ج أو 180 يوم)</span>
                  </label>
                </div>

                {newColOperand2Type === 'column' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      اختر العمود الثاني:
                    </label>
                    <select
                      value={newColOperand2Key}
                      onChange={(e) => {
                        setNewColOperand2Key(e.target.value);
                        const opt = e.target.selectedOptions[0]?.text;
                        if (opt) setNewColOperand2Label(opt);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="annualTargetM3">المستهدف السنوي (م³)</option>
                      <option value="annualActualM3">إجمالي الفعلي السنوي (م³)</option>
                      <option value="annualVarianceM3">الانحراف السنوي (م³)</option>
                      <option value="allocatedBudgetEgp">الموازنة الترويجية المخصصة (ج)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      القيمة الرقمية الثابتة:
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newColOperand2Constant}
                      onChange={(e) => setNewColOperand2Constant(Number(e.target.value))}
                      placeholder="مثال: 13 (لسعر الغاز) أو 30 أو 0.35"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-black"
                    />
                  </div>
                )}
              </div>

              {/* Unit and Display Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    وحدة القياس الملحقة:
                  </label>
                  <input
                    type="text"
                    value={newColUnit}
                    onChange={(e) => setNewColUnit(e.target.value)}
                    placeholder="م³ ، جنية ، % ، نقطة ، يوم"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    طريقة التنسيق والعرض:
                  </label>
                  <select
                    value={newColFormat}
                    onChange={(e) => setNewColFormat(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="signed">إشارة موجب وسالب (+1,500 / -800) مع تلوين أخضر/أحمر</option>
                    <option value="percentage">نسبة مئوية (95.4%)</option>
                    <option value="currency">قيمة مالية / عملة (1,500 ج)</option>
                    <option value="standard">رقم قياسي عادي (1,500)</option>
                  </select>
                </div>
              </div>

              {/* Live Formula Preview */}
              <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 font-sans font-bold">معاينة المعادلة:</span>
                <span className="font-bold text-purple-900" dir="ltr">
                  [{newColName || 'العمود الجديد'}] = [{newColOperand1Label}] {newColOperation === 'add' ? '+' : newColOperation === 'subtract' ? '-' : newColOperation === 'multiply' ? '×' : newColOperation === 'divide' ? '÷' : '%'} [{newColOperand2Type === 'constant' ? newColOperand2Constant : newColOperand2Label || newColOperand2Key}]
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingColumnId ? 'حفظ تعديلات الخانة ✓' : 'حفظ وإضافة الخانة للجدول والإكسيل ✓'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Coordinate Comparison & KMZ / Map Sync Report */}
      {isSyncModalOpen && coordinateSyncReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">
                  🗺️
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    تقرير مطابقة الإحداثيات مع ملف KMZ ومزامنة الخريطة
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تمت قراءة خانات الإحداثيات (X و Y) بالجدول ومقارنتها بمواقع KMZ والخريطة
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Sync Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">إجمالي محطات الشيت:</span>
                <span className="font-mono font-black text-lg text-slate-900">
                  {coordinateSyncReport.totalSheetStations}
                </span>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                <span className="text-[10px] text-blue-700 block">محطات متطابقة مع KMZ:</span>
                <span className="font-mono font-black text-lg text-blue-900">
                  {coordinateSyncReport.matchedExistingCount}
                </span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block">محطات جديدة أضيفت للخريطة:</span>
                <span className="font-mono font-black text-lg text-emerald-900">
                  +{coordinateSyncReport.newAddedStationsCount}
                </span>
              </div>
              <div className="bg-slate-900 text-white p-3 rounded-2xl">
                <span className="text-[10px] text-slate-300 block">إجمالي محطات الخريطة الآن:</span>
                <span className="font-mono font-black text-lg text-amber-400">
                  {coordinateSyncReport.allMapStationsCount || stations.length}
                </span>
              </div>
            </div>

            {/* Feedback Badge */}
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-900">
                  تم وضع لوجو كارجاس الموحد وتسمية كل محطة بالاسم الظاهر بالجدول تحت عنوان "اسم المركز"
                </div>
                <div className="text-[11px] text-emerald-800">
                  تم ربط الإحداثيات الجغرافية بدقة لتسهيل وصول عملاء كارجاس لأقرب محطة تموين غاز طبيعي على الخريطة التفاعلية.
                </div>
              </div>
            </div>

            {/* List of Added Stations */}
            {coordinateSyncReport.newAddedStations && coordinateSyncReport.newAddedStations.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-xs text-slate-800 block">
                  المحطات والمراكز الجديدة التي تمت إضافتها للخريطة التفاعلية:
                </span>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50 text-xs">
                  {coordinateSyncReport.newAddedStations.map((st: CargasStationLocation, i: number) => (
                    <div key={i} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          C
                        </span>
                        <div>
                          <span className="font-bold text-slate-900">{st.name}</span>
                          <span className="text-[10px] text-slate-500 mr-2 font-mono">({st.code})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200" dir="ltr">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                نظام المقارنة الذكي - عزوتي للبرمجيات
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  إغلاق النافذة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSyncModalOpen(false);
                    setActiveTab('stations_map');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>معاينة الخريطة التفاعلية الآن 🗺️</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Idea in Ideas Bank */}
      {isAddIdeaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center text-xl">
                  💡
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {editingIdeaId ? 'تعديل الفكرة المحفوظة' : 'إضافة فكرة جديدة / حفظ رابط مرجعي'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    خاص بمدير النظام - بنك الأفكار الترويجية والهدايا والمراجع
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddIdeaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIdea} className="space-y-4 text-xs">
              {/* Idea Title */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  عنوان الفكرة أو المبادرة:
                </label>
                <input
                  type="text"
                  required
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  placeholder="مثال: مسابقة تحدي 1000 متر شهرياً، خصومات تغيير الزيوت، نقاط ولاء مضاعفة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">التصنيف:</label>
                  <select
                    value={newIdeaCategory}
                    onChange={(e) => setNewIdeaCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="مسابقة">مسابقة وتحديات</option>
                    <option value="هدية عينية">هدية عينية ملموسة</option>
                    <option value="كوبون وخصم">كوبون خصم شركاء</option>
                    <option value="غاز مجاني">غاز طبيعي مجاني</option>
                    <option value="زيوت وفلاتر">زيوت وفلاتر</option>
                    <option value="صيانة وخدمات">صيانة وخدمات سيارات</option>
                  </select>
                </div>

                {/* Reference URL */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    رابط مرجعي للمصدر (URL):
                  </label>
                  <input
                    type="url"
                    value={newIdeaUrl}
                    onChange={(e) => setNewIdeaUrl(e.target.value)}
                    placeholder="https://example.com/reference..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-blue-700"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  شرح وتفاصيل الفكرة:
                </label>
                <textarea
                  rows={3}
                  required
                  value={newIdeaDesc}
                  onChange={(e) => setNewIdeaDesc(e.target.value)}
                  placeholder="اشرح الفكرة وكيفية تطبيقها، والشريحة المستهدفة من السائقين..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Financial Estimates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    القيمة التقديرية بالجنيه (للفرد):
                  </label>
                  <input
                    type="number"
                    required
                    value={newIdeaEgp}
                    onChange={(e) => setNewIdeaEgp(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    عدد المشاركين المستهدف:
                  </label>
                  <input
                    type="number"
                    required
                    value={newIdeaParticipants}
                    onChange={(e) => setNewIdeaParticipants(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-black"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  الوسوم والكلمات المفتاحية (مفصولة بفواصل):
                </label>
                <input
                  type="text"
                  value={newIdeaTags}
                  onChange={(e) => setNewIdeaTags(e.target.value)}
                  placeholder="تاكسي، مبيعات منخفضة، رمضان، بنك الهدايا، ولاء"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              {/* Projected Budget Preview */}
              <div className="bg-violet-50 p-3 rounded-2xl border border-violet-200 flex items-center justify-between text-xs">
                <span className="font-bold text-violet-950">إجمالي الموازنة التقديرية للفكرة:</span>
                <span className="font-mono font-black text-violet-900 text-sm">
                  {((Number(newIdeaEgp) || 0) * (Number(newIdeaParticipants) || 0)).toLocaleString()} جنية مصري
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddIdeaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingIdeaId ? 'حفظ تعديلات الفكرة' : 'حفظ في بنك الأفكار ✓'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
