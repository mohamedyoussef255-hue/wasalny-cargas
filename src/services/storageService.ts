import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  AppConfig,
  DriverProfile,
  FuelingTransaction,
  RewardItem,
  RewardRedemption,
  TechnicianCrewMember,
  AntiFraudLog,
  MaintenanceItem,
  CargasStationLocation,
  StationRating,
  CustomerComplaint,
  StationSalesRecord,
  MonthSalesMetric,
  VisibilitySettings,
  StationFacilityType,
  StationActivity,
  CustomComputedColumn,
  MathOperation,
  PromotionalCampaign,
  IdeaBankItem,
  RawSalesSheetData,
  WasalnyConfig,
  PointsFormulaConfig,
  PageLayoutSettings,
  FuelingSession,
  ScadaTransactionPayload,
  ScadaConfig,
  SectionLayoutItem,
  SectionColSpan,
  SectionHeightMode,
  ServiceAppointment,
  AppointmentServiceType,
  AppointmentStatus,
  WasalnyServiceItem,
  WasalnyCaptain,
  ApprovedShiftRosterRecord,
  TechnicianDeviceSession,
  MapFacilityFilterItem,
  StationDailySalesRecord,
  SalesSystemStage,
  CustomerViewMode,
  CustomerChatChannel,
  CustomerDirectMessage,
  TechnicianIncentiveConfig,
} from '../types';
import { REWARDS_100_CATALOG } from '../data/rewardsCatalog';

const CONFIG_KEY = 'cargas_app_config';
const DRIVER_KEY = 'cargas_driver_profile';
const CREW_KEY = 'cargas_station_crew';
const TRANSACTIONS_KEY = 'cargas_transactions';
const REWARDS_KEY = 'cargas_rewards';
const APPOINTMENTS_KEY = 'cargas_service_appointments';
const REDEMPTIONS_KEY = 'cargas_redemptions';
const FRAUD_LOGS_KEY = 'cargas_fraud_logs';
const STATIONS_LOCATIONS_KEY = 'cargas_stations_locations';
const RATINGS_KEY = 'cargas_station_ratings';
const COMPLAINTS_KEY = 'cargas_customer_complaints';
const SALES_RECORDS_KEY = 'cargas_sales_records';
const RAW_SALES_SHEET_KEY = 'cargas_raw_sales_sheet';
const BACKUP_V1_KEY = 'cargas_backup_v1_classic';
const SESSIONS_KEY = 'cargas_fueling_sessions';

export const DEFAULT_VISIBILITY: VisibilitySettings = {
  driver: {
    showEditProfile: false,         // مخفي افتراضياً بناء على طلب المستخدم
    showNearestStationMap: true,   // إظهار أقرب محطة وخريطة كارجاس
    showGoldenCard: true,
    showRewardsBank: true,
    showMaintenanceSchedule: true,
    showFuelingHistory: true,
    showServiceRating: true,       // إتاحة تقييم الفني والخدمة
    showComplaintsBox: true,       // إتاحة نموذج الشكاوى وأرقام التواصل
    showFuelingCountStats: true,   // إظهار مرات التموين من المحطة والطلمبة
    showPromotionalBanner: true,   // إظهار بانر العروض والمسابقات وشرح برنامج كارجاس للولاء
  },
  technician: {
    showCameraScanner: true,
    showManualEntry: true,
    showShiftStats: true,
    showGpsRadar: true,
    showTechnicianIncentives: true,// نظام حوافز ونقاط الفنيين
    showFuelingCountStats: true,   // إظهار مرات التموين من المحطة والطلمبة
  },
};

// الخانات والأعمدة الحسابية المخصصة الافتراضية
export const DEFAULT_CUSTOM_COLUMNS: CustomComputedColumn[] = [
  {
    id: 'col-variance-calc',
    name: 'الانحراف (+/-)',
    operand1Key: 'annualActualM3',
    operand1Label: 'إجمالي الفعلي السنوي',
    operation: 'subtract',
    operand2Type: 'column',
    operand2Key: 'annualTargetM3',
    operand2Label: 'المستهدف السنوي',
    unit: 'م³',
    displayFormat: 'signed',
    createdAt: '2026-01-01',
  },
  {
    id: 'col-achievement-rate',
    name: 'معدل الإنجاز %',
    operand1Key: 'annualActualM3',
    operand1Label: 'إجمالي الفعلي السنوي',
    operation: 'percentage',
    operand2Type: 'column',
    operand2Key: 'annualTargetM3',
    operand2Label: 'المستهدف السنوي',
    unit: '%',
    displayFormat: 'percentage',
    createdAt: '2026-01-01',
  },
  {
    id: 'col-sales-revenue',
    name: 'القيمة بالجنيه (13 ج/م³)',
    operand1Key: 'annualActualM3',
    operand1Label: 'إجمالي الفعلي السنوي',
    operation: 'multiply',
    operand2Type: 'constant',
    operand2Constant: 13,
    unit: 'جنية',
    displayFormat: 'currency',
    createdAt: '2026-01-01',
  },
  {
    id: 'col-monthly-avg',
    name: 'المتوسط الشهري (م³)',
    operand1Key: 'annualActualM3',
    operand1Label: 'إجمالي الفعلي السنوي',
    operation: 'divide',
    operand2Type: 'constant',
    operand2Constant: 12,
    unit: 'م³/شهر',
    displayFormat: 'standard',
    createdAt: '2026-01-01',
  },
];

// الحملات الترويجية والمسابقات الافتراضية للبانر وشرح برنامج الولاء
export const DEFAULT_PROMOTIONAL_CAMPAIGNS: PromotionalCampaign[] = [
  {
    id: 'CAMP-01',
    title: 'تحدي كارجاس الأسبوعي: فول 50 متر غاز واكسب 100 نقطة إضافية!',
    subtitle: 'كل ما تفول غاز طبيعي أكتر، نقاطك بتزيد وتتحول فوراً لخصومات نقدية على الزيوت وأمتار غاز مجانية.',
    category: 'مسابقة',
    badge: 'مسابقة نشطة 🏆',
    pointsReward: 100,
    financialEquivalentEgp: 35,
    allocatedBudgetItemEgp: 15000,
    targetDriversCount: 400,
    rawIdea: 'مسابقة أسبوعية للسائقين لتشجيع التموين الكامل للغاز بالسيارة',
    aiGeneratedCopy: 'يا بطل الطريق! فول عربيتك غاز طبيعي بـ 50 متر أو أكتر خلال الأسبوع ده وادخل السحب على 100 نقطة هدية بتنزل في محفظتك فوراً تعادل 35 جنيه رصيد مجاني!',
    explanationOfLoyalty: 'برنامج ولاء كارجاس بيقدر تعبك وشغلك: كل متر بتمونه بتاخد عليه نقطة، والنقاط دي تقدر تبدلها بأمتار غاز أو غسيل عربية أو خصومات زيوت معتمدة.',
    buttonText: 'فول واكسب الآن ⛽',
    buttonAction: 'navigate_map',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    isActive: true,
    bannerGradient: 'from-blue-900 via-indigo-900 to-slate-900',
    icon: 'Trophy',
  },
  {
    id: 'CAMP-02',
    title: 'مضاعفة النقاط 2X في محطات الدقي وسموحة أسفل المظلة!',
    subtitle: 'تموينك وزيوتك بنقاط مضاعفة طوال الشهر في المحطات الترويجية لدعم السائقين.',
    category: 'مضاعفة نقاط',
    badge: 'نقاط مضاعفة 2X ⭐',
    pointsReward: 150,
    financialEquivalentEgp: 52.5,
    allocatedBudgetItemEgp: 25000,
    targetDriversCount: 500,
    rawIdea: 'تنشيط مبيعات محطة الدقي وسموحة بمضاعفة نقاط الولاء للرواد',
    aiGeneratedCopy: 'عرض خاص ومضاعف! زور محطة كارجاس بالدقي أو سموحة واستمتع بضعف النقاط على كل متر غاز وتغيير زيت أسفل المظلة، جمع نقاطك أسرع ووفر أكتر!',
    explanationOfLoyalty: 'وفر 60% من تكلفة الوقود مقارنة بالبنزين، وفوق التوفير بنكافأك بنقاط ولاء مضاعفة تقدر تصرفها في أي وقت.',
    buttonText: 'المحطات على الخريطة 📍',
    buttonAction: 'navigate_map',
    startDate: '2026-10-15',
    endDate: '2026-12-31',
    isActive: true,
    bannerGradient: 'from-emerald-900 via-teal-900 to-slate-900',
    icon: 'Sparkles',
  },
  {
    id: 'CAMP-03',
    title: 'عرض تحويل السيارات للغاز بالتقسيط وبونص 300 نقطة ترحيبية!',
    subtitle: 'حول سيارتك للغاز الطبيعي بأحدث أطقم الحقن المتزامن الإيطالية مع كارت الولاء الذهبي.',
    category: 'عرض ترويجي',
    badge: 'وفر 60% من تكلفة البنزين 🚗',
    pointsReward: 300,
    financialEquivalentEgp: 105,
    allocatedBudgetItemEgp: 30000,
    targetDriversCount: 300,
    rawIdea: 'تشجيع تحويل السيارات للغاز الطبيعي بمنح بونص نقاط ترحيبي عالي',
    aiGeneratedCopy: 'احسبها صح ووفر آلاف الجنيهات شهرياً! حول سيارتك للغاز الطبيعي في مراكز كارجاس المعتمدة بالتقسيط المريح وبدون فوائد، واستلم كارت الولاء الذهبي محمل بـ 300 نقطة هدية ترحيبية فورية!',
    explanationOfLoyalty: 'الغاز الطبيعي وقود المستقبل الأكثر أماناً واقتصادية، ومع كارجاس استثمارك مضمون بصيانة وفحص مجاني دائم.',
    buttonText: 'مراكز التحويل المعتمدة 🔧',
    buttonAction: 'navigate_map',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    isActive: true,
    bannerGradient: 'from-purple-950 via-slate-900 to-indigo-950',
    icon: 'Fuel',
  },
];

// بنك الأفكار والهدايا والعروض الترويجية والروابط المرجعية الخاصة بمدير النظام
export const DEFAULT_IDEAS_BANK: IdeaBankItem[] = [
  {
    id: 'IDEA-USER-01',
    title: 'باقة حوافز كارجاس الترويجية المئوية (108 / 100 / 50)',
    category: 'عرض ترويجي',
    description: 'نظام متقدم لتصنيف حوافز مبيعات الغاز الطبيعي والولاء التراكمي بشرائح: 108 م³ تموين شهري، 100 نقطة ولاء فورية، و50 جنيه كاش باك أو أمتار مجانية للمحطات ذات الأولوية.',
    referenceUrl: 'file:///C:/Users/M.Rahman/Downloads/2027_108_100_50(4).html',
    estimatedEgpValue: 350,
    targetParticipants: 350,
    tags: ['2027', 'باقة_108_100_50', 'حوافز_سائقين', 'عروض_كارجاس'],
    notes: 'مرجع معتمد من الإدارة لدراسة نسب تحفيز أبطال النقل والتاكسي وتحقيق قفزات مبيعات.',
    createdAt: '2026-10-22',
  },
  {
    id: 'IDEA-USER-02',
    title: 'استراتيجية منظومة كارجاس للغاز الطبيعي 2027 (CNG Strategy 2027)',
    category: 'عرض ترويجي',
    description: 'دراسة استراتيجية شاملة وتوسعية لمحطات ومراكز كارجاس حتى عام 2027، وربطها بنظام نقاط الولاء الذكي ومضاعفة مبيعات المحطات المستهدفة.',
    referenceUrl: 'file:///C:/Users/M.Rahman/Downloads/cargas_cng_2027(4).html',
    estimatedEgpValue: 500,
    targetParticipants: 500,
    tags: ['استراتيجية_2027', 'توسعات_كارجاس', 'مستقبل_الغاز', 'موازنة_تسويقية'],
    notes: 'المرجع الرئيسي لخطط كارجاس المستقبلية وتنسيق مبادرات التحول للغاز الطبيعي.',
    createdAt: '2026-10-22',
  },
  {
    id: 'IDEA-USER-03',
    title: 'لائحة ومنظومة كارت الولاء الذهبي ونظام احتساب النقاط',
    category: 'عرض ترويجي',
    description: 'الميثاق المالي لتحويل كل متر غاز ممون لنقاط معتمدة (1 متر = 1 نقطة)، ودراسة تكلفة النقطة 0.35 ج، ومعايير الاستبدال الفوري بالزيوت والصيانة والكوبونات.',
    referenceUrl: 'file:///C:/Users/M.Rahman/Desktop/all%20desktop/%D9%86%D8%B8%D8%A7%D9%85%20%D8%A7%D9%84%D9%86%D9%82%D8%A7%D8%B7.html',
    estimatedEgpValue: 260,
    targetParticipants: 600,
    tags: ['نظام_النقاط', 'الكارت_الذهبي', 'قواعد_الولاء', 'تكلفة_النقطة'],
    notes: 'وثيقة نظام النقاط الأساسية لضبط حسابات الموازنة وعدم وجود أي عجز مالي.',
    createdAt: '2026-10-22',
  },
  {
    id: 'IDEA-USER-04',
    title: 'باقة الـ 150 نقطة الترحيبية وتخفيضات أطقم الزيوت السريعة',
    category: 'مسابقة',
    description: 'منح 150 نقطة بونص فوري لكل عميل جديد أو منتظم يلتزم بتموين 150 متر غاز، مع خصومات حصرية على غيار الزيوت المعتمدة أسفل المظلة.',
    referenceUrl: 'file:///C:/Users/M.Rahman/Downloads/150.html',
    estimatedEgpValue: 150,
    targetParticipants: 400,
    tags: ['باقة_150', 'نقاط_ترحيبية', 'زيوت_المظلة', 'كاش_باك'],
    notes: 'نموذج سريع وسهل التطبيق ينشط حركة التموين في المحطات الفرعية.',
    createdAt: '2026-10-22',
  },
  {
    id: 'IDEA-USER-05',
    title: 'مبادرة باقة كبار العملاء لأساطيل السيارات والتاكسي',
    category: 'شراكة تجارية',
    description: 'مكافأة السائقين أصحاب أعلى معدلات تردد بكوبونات صيانة وزيوت مجانية لدعم مصاريف التشغيل وتأكيد شراكة كارجاس مع رواد الطريق.',
    referenceUrl: 'file:///C:/Users/M.Rahman/Downloads/100_cng.html',
    estimatedEgpValue: 1300,
    targetParticipants: 150,
    tags: ['أساطيل', 'تاكسي_العاصمة', 'امتيازات_حصرية', 'صيانة'],
    notes: 'أقوى وسيلة لبناء ولاء أسطول التاكسي والشركات بضمان توفير حقيقي.',
    createdAt: '2026-10-22',
  },
  {
    id: 'IDEA-01',
    title: 'تحدي تموين 50 متر غاز أسبوعياً لدخول سحب على طقم صيانة مجاني',
    category: 'مسابقة',
    description: 'تحفيز سائقي التاكسي والملاكي على التموين الكامل للغاز من محطات كارجاس لدخول سحب دوري على طقم صيانة وفلاتر وبوجيهات مجانية.',
    referenceUrl: 'https://cargas.com.eg/services/cng-fueling',
    estimatedEgpValue: 450,
    targetParticipants: 300,
    tags: ['سائقين', 'تموين', 'سحب_أسبوعي', 'صيانة'],
    notes: 'فكرة مثبتة لرفع مبيعات المحطات ذات المعدلات المنخفضة وزيادة تردد الرواد.',
    createdAt: '2026-10-10',
  },
  {
    id: 'IDEA-02',
    title: 'قسائم وكوبونات خدمات فحص وصيانة دورية مجانية',
    category: 'كوبون خدمة',
    description: 'منح السائقين كوبونات صيانة وفحص أسطوانات دوري معتمد مقابل النقاط المجمعة في كارت الولاء الذهبي.',
    referenceUrl: 'https://cargas.com.eg/promotions/gas-meters',
    estimatedEgpValue: 195,
    targetParticipants: 500,
    tags: ['أمتار_مجانية', 'كاش_باك', 'تموين_فوري'],
    notes: 'الهدية الأكثر طلباً من السائقين ومحسوبة بدقة 13 جنيه لكل متر مكعب.',
    createdAt: '2026-10-12',
  },
  {
    id: 'IDEA-03',
    title: 'طقم بوجيهات بوش ألماني أصلي لمحركات الغاز الطبيعي',
    category: 'هدية عينية',
    description: 'توفير بوجيهات شمعات احتراق أصلية ذات فجوة مخصصة للغاز لتقليل استهلاك الوقود ومنع التنتيش وتحسين سحب الموتور.',
    referenceUrl: 'https://cargas.com.eg/maintenance/spark-plugs',
    estimatedEgpValue: 480,
    targetParticipants: 150,
    tags: ['بوجيهات', 'قطع_غيار', 'أصلي', 'كفاءة_المحرك'],
    notes: 'تمنح السائق انطباعاً عالياً بالجودة والأمان.',
    createdAt: '2026-10-14',
  },
];

// خدمات تطبيق وصلني الافتراضية
export const DEFAULT_WASALNY_SERVICES: WasalnyServiceItem[] = [
  {
    id: 'srv-ride',
    name: 'مشاوير الركاب والتاكسي الذكي (Wasalny Ride)',
    description: 'توصيل ركاب سريع بسيارات تعمل بالغاز الطبيعي مع خصم مباشر بنقاط كارجاس.',
    icon: 'Car',
    isActive: true,
    baseFareEgp: 15,
    perKmRateEgp: 5.5,
    perMinuteRateEgp: 0.8,
    minFareEgp: 25,
    commissionPct: 15,
  },
  {
    id: 'srv-gas-delivery',
    name: 'توصيل أسطوانات الغاز للمنازل (Wasalny Gas Delivery)',
    description: 'توصيل سريع لأسطوانات الغاز وتركيبها بواسطة فنيين معتمدين من كارجاس.',
    icon: 'Truck',
    isActive: true,
    baseFareEgp: 20,
    perKmRateEgp: 4.0,
    perMinuteRateEgp: 0.5,
    minFareEgp: 30,
    commissionPct: 10,
  },
  {
    id: 'srv-sos',
    name: 'الإغاثة والإنقاذ على الطريق (Roadside SOS)',
    description: 'إنقاذ سريع لأعطال الطريق وتزويد متنقل بالوقود ورفع السيارات ونقلها.',
    icon: 'LifeBuoy',
    isActive: true,
    baseFareEgp: 50,
    perKmRateEgp: 8.0,
    perMinuteRateEgp: 1.5,
    minFareEgp: 80,
    commissionPct: 12,
  },
  {
    id: 'srv-mobile-inspection',
    name: 'الصيانة والفحص المتنقل (Mobile CNG Inspection)',
    description: 'فحص دوري ومعايرة أجهزة الغاز واختبار التسريب أمام المنزل أو العمل.',
    icon: 'Wrench',
    isActive: true,
    baseFareEgp: 60,
    perKmRateEgp: 6.0,
    perMinuteRateEgp: 1.0,
    minFareEgp: 100,
    commissionPct: 15,
  },
  {
    id: 'srv-carpool',
    name: 'الرحلات التشاركية الموفرة (Wasalny Carpool)',
    description: 'مشاركة مقاعد الرحلات اليومية بين المحافظات بأقل تكلفة ممكنة.',
    icon: 'Users',
    isActive: true,
    baseFareEgp: 10,
    perKmRateEgp: 3.5,
    perMinuteRateEgp: 0.4,
    minFareEgp: 20,
    commissionPct: 8,
  },
];

// كباتن وأسطول سيارات تطبيق وصلني
export const DEFAULT_WASALNY_CAPTAINS: WasalnyCaptain[] = [
  {
    id: 'CAP-01',
    name: 'كابتن / أحمد فوزي الدسوقي',
    phone: '01012345678',
    carPlate: 'س ف ر 1 9 8 4',
    carModel: 'شيري أريزو 5 (غاز طبيعي)',
    city: 'القاهرة - شبرا',
    rating: 4.9,
    totalTrips: 412,
    totalEarningsEgp: 18450,
    status: 'active',
    joinedDate: '2026-01-15',
    cngConverted: true,
  },
  {
    id: 'CAP-02',
    name: 'كابتن / إسلام مدحت النجار',
    phone: '01198765432',
    carPlate: 'ب ط ل 3 4 5 6',
    carModel: 'بي واي دي F3 (غاز طبيعي)',
    city: 'الجيزة - الدقي',
    rating: 4.8,
    totalTrips: 289,
    totalEarningsEgp: 12600,
    status: 'active',
    joinedDate: '2026-02-10',
    cngConverted: true,
  },
  {
    id: 'CAP-03',
    name: 'كابتن / محمود عبد الفتاح عويس',
    phone: '01234567890',
    carPlate: 'ص ق ر 7 8 9 0',
    carModel: 'نيسان صني N17 (غاز طبيعي)',
    city: 'القليوبية - بنها',
    rating: 5.0,
    totalTrips: 520,
    totalEarningsEgp: 24300,
    status: 'active',
    joinedDate: '2025-11-20',
    cngConverted: true,
  },
  {
    id: 'CAP-04',
    name: 'كابتن / حسن رجب البسيوني',
    phone: '01555667788',
    carPlate: 'ع ل م 2 3 4 5',
    carModel: 'تويوتا كورولا (غاز طبيعي)',
    city: 'الإسكندرية - سموحة',
    rating: 4.7,
    totalTrips: 195,
    totalEarningsEgp: 8900,
    status: 'active',
    joinedDate: '2026-03-01',
    cngConverted: true,
  },
];

const WASALNY_STORAGE_KEY = 'cargas_wasalny_full_config';

// إعدادات تطبيق وصّلني الافتراضية
export const DEFAULT_WASALNY_CONFIG: WasalnyConfig = {
  enabled: true,
  appName: 'تطبيق وصّلني - Cargas Wasalny',
  appSlogan: 'مشوارك أسرع مع غاز كارجاس وأنظف للبيئة',
  appStatus: 'active',
  appVersion: 'v3.5 Enterprise',
  wasalnyLogoUrl: '',
  wasalnyLogoShape: 'rounded',
  wasalnyThemeColor: '#059669',
  wasalnyAccentColor: '#0284c7',
  voiceGuidance: 'wadah_egyptian',
  autoVoiceOnOpen: true,
  navigationProvider: 'google_maps',
  targetStationMode: 'auto_gps',
  arrivalAlertDistanceMeters: 150,
  customWelcomeMessage: 'أهلاً بك يا كابتن في تطبيق وصّلني! تم تحديد أقرب محطة كارجاس لموقعك مع توفر تموين الغاز والزيوت أسفل المظلة بدون انتظار.',
  showCrowdStatus: true,
  buttonLabel: 'وصلني لأقرب محطة كارجاس ⛽',
  subtitle: 'توجيه ذكي وملاحة فورية لأقرب محطة تموين كارجاس CNG مجهزة وسريعة',
  cardLayout: 'banner_top',
  services: DEFAULT_WASALNY_SERVICES,
  captains: DEFAULT_WASALNY_CAPTAINS,
  pointsDiscountEnabled: true,
  pointsToEgpDiscountRate: 0.5,
  freeRidePointsThreshold: 100,
  maxDiscountPerTripEgp: 50,
  // التحكم في لوجوهات المحطات على الخريطة
  stationMarkerLogoMode: 'unified_cargas',
  stationUnifiedLogoUrl: '',
  stationMarkerStyle: 'cargas_badge',
  stationCustomLogos: {},
  stationMarkerGlowColor: '#059669',
  // قصر منظومة الخدمات والتعريفة والتوصيل الذكي على مدير النظام فقط
  showServicesAndTariffsOnlyToAdmin: true,
  enableSmartDeliveryForCustomers: false,
  smartDeliveryNoteForCustomers: 'خدمة التوصيل الذكي تحت الإطلاق التجريبي ومقتصرة على توجيهات مدير النظام.',
};

export function getWasalnyFullConfig(): WasalnyConfig {
  try {
    const raw = localStorage.getItem(WASALNY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_WASALNY_CONFIG,
        ...parsed,
        services: parsed.services || DEFAULT_WASALNY_SERVICES,
        captains: parsed.captains || DEFAULT_WASALNY_CAPTAINS,
      };
    }
  } catch (e) {
    console.error('Failed to load Wasalny full config', e);
  }
  return DEFAULT_WASALNY_CONFIG;
}

export function saveWasalnyFullConfig(cfg: WasalnyConfig): void {
  try {
    localStorage.setItem(WASALNY_STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.error('Failed to save Wasalny full config', e);
  }
}

// المعادلة النموذجية المعتمدة لاحتساب نقاط الولاء
export const DEFAULT_POINTS_FORMULA: PointsFormulaConfig = {
  ratioMode: 'points_per_meter',
  metersPerPointUnit: 5,
  basePointsPerMeter: 1,
  gasPricePerMeter: 13,
  calculationBasis: 'meters',
  tierBronzeMultiplier: 1.0,
  tierSilverMultiplier: 1.5,
  tierGoldMultiplier: 2.0,
  volumeBonusThresholdM3: 30,
  volumeBonusPoints: 10,
  technicianWelcomePointsPerShift: 350,
  pointsToEgpRedemptionRatio: 0.35,
};

// احتساب النقاط وتكلفتها اعتماداً على ما تقره وتعتمد الإدارة المالية وبمرونة كاملة في النسب
export function calculateStationLoyaltyPoints(
  meters: number,
  stationIdOrName?: string,
  config?: AppConfig
): {
  points: number;
  ratePerMeter: number;
  costPerPointEgp: number;
  totalLiabilityEgp: number;
  isProgramActive: boolean;
  stationName: string;
  region: string;
} {
  const stations = getStationLocations();
  const matched =
    stations.find(
      (s) =>
        stationIdOrName &&
        (s.id === stationIdOrName ||
          s.code === stationIdOrName ||
          s.name.includes(stationIdOrName) ||
          stationIdOrName.includes(s.name))
    ) || stations[0];

  const isProgramActive = matched ? matched.isLoyaltyProgramActive !== false : true;
  const ratePerMeter = matched?.pointsAwardRatePerMeter ?? (config?.pointsPerMeter || 1.0);
  const costPerPointEgp = matched?.costPerPointEgp ?? 0.35;

  let points = 0;
  if (isProgramActive && meters > 0) {
    // دعم النظام المرن: (نقاط لكل متر) أو (أمتار لكل نقطة: مثلاً كل 5 م³ أو 10 م³ = 1 نقطة)
    if (config?.pointsFormula?.ratioMode === 'meters_per_point') {
      const unit = config.pointsFormula.metersPerPointUnit || 5;
      points = Math.floor(meters / unit);
    } else {
      points = Math.round(meters * ratePerMeter);
    }
  }

  const totalLiabilityEgp = parseFloat((points * costPerPointEgp).toFixed(2));

  return {
    points,
    ratePerMeter,
    costPerPointEgp,
    totalLiabilityEgp,
    isProgramActive,
    stationName: matched?.name || config?.stationName || 'محطة كارجاس',
    region: matched?.region || 'القاهرة الكبرى',
  };
}

// دالة احتساب النقاط في كافة أرجاء التطبيق اعتماداً على تسعيرة الإدارة المالية والمعادلة المرنة
export function calculateFuelingPoints(
  meters: number,
  config: AppConfig,
  stationMultiplier: number = 1.0,
  driverTier: 'bronze' | 'silver' | 'gold' = 'bronze',
  stationIdOrName?: string
): number {
  if (config?.pointsFormula) {
    let tierMul = config.pointsFormula.tierBronzeMultiplier || 1.0;
    if (driverTier === 'silver') tierMul = config.pointsFormula.tierSilverMultiplier || 1.5;
    if (driverTier === 'gold') tierMul = config.pointsFormula.tierGoldMultiplier || 2.0;

    return calculatePointsFromFormula(
      meters,
      config.pointsFormula,
      tierMul,
      stationMultiplier,
      stationIdOrName
    );
  }
  return calculateStationLoyaltyPoints(meters, stationIdOrName, config).points;
}

// دالة متوافقة لاحتساب النقاط تدعم نمط (كل 5 م³ أو 10 م³ = 1 نقطة) أو (كل 1 م³ = X نقطة)
export function calculatePointsFromFormula(
  meters: number,
  formula?: PointsFormulaConfig,
  tierMultiplier: number = 1.0,
  stationMultiplier: number = 1.0,
  stationIdOrName?: string
): number {
  if (formula) {
    let base = 0;
    if (formula.ratioMode === 'meters_per_point') {
      const unit = formula.metersPerPointUnit || 5;
      base = Math.floor(meters / unit);
    } else {
      base = Math.round(meters * (formula.basePointsPerMeter || 1.0));
    }

    let calculated = Math.round(base * tierMultiplier * stationMultiplier);
    if (formula.volumeBonusThresholdM3 && meters >= formula.volumeBonusThresholdM3) {
      calculated += formula.volumeBonusPoints || 0;
    }
    return calculated;
  }
  return calculateStationLoyaltyPoints(meters, stationIdOrName).points;
}

// تعريفات المساحات الافتراضية لشاشتي العميل والفني (نظام التخطيط الديناميكي المرن)
export const DEFAULT_DRIVER_SECTIONS: SectionLayoutItem[] = [
  {
    id: 'driver_welcome_banner',
    title: 'المساحة الخضراء (بانر الترحيب الرئيسي وبيانات السائق)',
    description: 'ترحيب السائق الأخضر، رقم اللوحة، سعر المتر، زر وصّلني، وأيقونات التقييم والشكاوى',
    colSpan: 12,
    heightMode: 'normal',
    visible: true,
    order: 1,
    icon: 'Sparkles',
  },
  {
    id: 'nearest_station_repeat_bar',
    title: 'المساحة الزرقاء (رصد أقرب محطة وتكرار التموين GPS)',
    description: 'الشريط الأزرق الداكن لرصد أقرب محطة بالـ GPS وتكرار التموين من المحطة والمضخة',
    colSpan: 12,
    heightMode: 'compact',
    visible: true,
    order: 2,
    icon: 'Fuel',
  },
  {
    id: 'promotional_banner',
    title: 'بانر العروض الترويجية والمسابقات',
    description: 'عروض كارجاس الحصرية ومسابقات مضاعفة نقاط الولاء والتوفير',
    colSpan: 12,
    heightMode: 'normal',
    visible: true,
    order: 3,
    icon: 'Award',
  },
  {
    id: 'wasalny_hero',
    title: 'خريطة ومحدد أقرب محطة كارجاس (وصّلني)',
    description: 'توجيه الملاحة الحية ورصد أقرب محطة مع رادار ومحيط الـ GPS',
    colSpan: 7,
    heightMode: 'normal',
    visible: true,
    order: 4,
    icon: 'MapPin',
  },
  {
    id: 'qr_vehicle_card',
    title: 'كود الـ QR للتموين السريع وبيانات السيارة',
    description: 'باركود السائق السريع لمسحه بواسطة فني المحطة وبيانات اللوحة والسعة',
    colSpan: 5,
    heightMode: 'normal',
    visible: true,
    order: 5,
    icon: 'QrCode',
  },
  {
    id: 'golden_card',
    title: 'كارت كارجاس الذهبي وبنك النقاط',
    description: 'بطاقة العضوية VIP، رصيد النقاط المتاحة، والتوفير بالجنيه',
    colSpan: 12,
    heightMode: 'normal',
    visible: true,
    order: 6,
    icon: 'CreditCard',
  },
  {
    id: 'fueling_count_stats',
    title: 'بطاقات إجمالي الغاز المُمون والوفورات',
    description: 'إحصائيات إجمالي الغاز الممون وإجمالي الإنفاق والوفورات المحققة بالجنيه',
    colSpan: 12,
    heightMode: 'compact',
    visible: true,
    order: 7,
    icon: 'TrendingUp',
  },
  {
    id: 'rewards_bank',
    title: 'بنك الهدايا والمكافآت وكوبونات الخصم',
    description: 'استبدال النقاط بهدايا الزيوت والصيانة والفحص وكوبونات الشركاء',
    colSpan: 12,
    heightMode: 'normal',
    visible: true,
    order: 8,
    icon: 'Gift',
  },
  {
    id: 'maintenance_schedule',
    title: 'جدول الصيانة الدورية وحجز المواعيد',
    description: 'مواعيد فحص الأسطوانات وتغيير الزيت والفلاتر مع حجز موعد فوري',
    colSpan: 12,
    heightMode: 'normal',
    visible: true,
    order: 9,
    icon: 'Calendar',
  },
  {
    id: 'fueling_history',
    title: 'سجل التموينات السابقة وإيصالات كارجاس',
    description: 'تاريخ الفواتير وكميات الغاز والنقاط المكتسبة',
    colSpan: 12,
    heightMode: 'normal',
    visible: true,
    order: 10,
    icon: 'Clock',
  },
  {
    id: 'service_rating',
    title: 'تقييم الفني وسرعة الخدمة بالمحطة',
    description: 'تقييم تجربة التموين وحسن المعاملة',
    colSpan: 6,
    heightMode: 'normal',
    visible: true,
    order: 11,
    icon: 'Star',
  },
  {
    id: 'complaints_box',
    title: 'صندوق الشكاوى والمقترحات والخط الساخن',
    description: 'التواصل المباشر مع إدارة كارجاس 19058',
    colSpan: 6,
    heightMode: 'normal',
    visible: true,
    order: 12,
    icon: 'MessageSquare',
  },
];

export const DEFAULT_TECHNICIAN_SECTIONS: SectionLayoutItem[] = [
  {
    id: 'camera_scanner',
    title: 'كاميرا مسح كود السيارة ومسدس التموين',
    description: 'ماسح الـ QR الذكي لربط سيارة السائق بمسدس الطلمبة وبدء التموين',
    colSpan: 7,
    heightMode: 'normal',
    visible: true,
    order: 1,
    icon: 'Camera',
  },
  {
    id: 'scada_live_sessions',
    title: 'شاشة السكادا وجلسات التموين الحية',
    description: 'متابعة تدفق الغاز واستقبال قراءة العداد التلقائية لحظياً من SCADA',
    colSpan: 5,
    heightMode: 'normal',
    visible: true,
    order: 2,
    icon: 'Gauge',
  },
  {
    id: 'reward_redemption_scanner',
    title: 'ماسح كود استبدال النقاط والمكافآت',
    description: 'صرف قسائم وهدايا أمتار الغاز المجانية والزيوت للعميل',
    colSpan: 12,
    heightMode: 'normal',
    visible: true,
    order: 3,
    icon: 'Gift',
  },
  {
    id: 'shift_stats',
    title: 'إحصائيات الوردية والأمتار والإيراد',
    description: 'ملخص مبيعات الفني وإجمالي التموينات والتحصيل اليومي',
    colSpan: 12,
    heightMode: 'compact',
    visible: true,
    order: 4,
    icon: 'TrendingUp',
  },
  {
    id: 'welcome_bonus',
    title: 'توزيع رصيد النقاط الترحيبية للعملاء',
    description: 'رصيد الفني المعتمد لجذب السائقين الجدد للمحطة',
    colSpan: 6,
    heightMode: 'normal',
    visible: true,
    order: 5,
    icon: 'Award',
  },
  {
    id: 'manual_entry',
    title: 'التسجيل اليدوي الاحتياطي للتموين',
    description: 'تسجيل قراءة العداد يدوي في حالات الطوارئ أو أعطال الماسح',
    colSpan: 6,
    heightMode: 'normal',
    visible: true,
    order: 6,
    icon: 'Fuel',
  },
  {
    id: 'gps_radar',
    title: 'رادار التحقق من النطاق الجغرافي (10 أمتار)',
    description: 'التحقق الصارم من وجود الفني داخل محطة كارجاس لمنع الاحتيال',
    colSpan: 6,
    heightMode: 'normal',
    visible: true,
    order: 7,
    icon: 'MapPin',
  },
  {
    id: 'technician_incentives',
    title: 'حوافز ونقاط الفني وتقييم الرواد',
    description: 'رصيد حوافز الفني ومكافآت حسن المعاملة مع رواد المحطة',
    colSpan: 6,
    heightMode: 'normal',
    visible: true,
    order: 8,
    icon: 'Coins',
  },
];

export const DEFAULT_DRIVER_SECTIONS_ORDER = DEFAULT_DRIVER_SECTIONS.map((s) => s.id);
export const DEFAULT_TECHNICIAN_SECTIONS_ORDER = DEFAULT_TECHNICIAN_SECTIONS.map((s) => s.id);

export const DEFAULT_LAYOUT_SETTINGS: PageLayoutSettings = {
  driverSectionsOrder: DEFAULT_DRIVER_SECTIONS_ORDER,
  technicianSectionsOrder: DEFAULT_TECHNICIAN_SECTIONS_ORDER,
  driverSections: DEFAULT_DRIVER_SECTIONS,
  technicianSections: DEFAULT_TECHNICIAN_SECTIONS,
};

export const DEFAULT_SCADA_CONFIG: ScadaConfig = {
  enabled: true,
  apiKey: 'cargas_scada_secret_2026',
  webhookEndpoint: '/api/scada/complete-transaction',
  autoWindowMinutes: 10,
  simulationDelaySeconds: 3,
};

export const DEFAULT_TECHNICIAN_INCENTIVE_CONFIG: TechnicianIncentiveConfig = {
  pointValueEgp: 0.25,
  rating5StarRewardEgp: 10,
  rating4StarRewardEgp: 5,
  highRatingBonusThreshold: 4.8,
  highRatingMonthlyBonusEgp: 250,
  minFuelingsShiftQuota: 10,
  volumeBonusThresholdM3: 500,
  volumeBonusRewardEgp: 50,
  isEnabled: true,
};

export const DEFAULT_CONFIG: AppConfig = {
  appName: 'منظومة كارجاس وبرنامج الولاء الذكي',
  appSubtitle: 'لوحة التحكم والتموين الرقمي الشامل - محطة شبرا النموذجية',
  companyName: 'شركة عزوتي للبرمجيات وتكنولوجيا المعلومات',
  developerName: 'محمد عبد الرحمن يوسف',
  gasPricePerMeter: 13, // 13 EGP per cubic meter
  pointsPerMeter: 1, // 1 point per 1 m3
  adminPin: '0000',
  financePin: '1234',
  stationCode: 'CARGAS-SHUBRA-01',
  stationName: 'محطة كارجاس شبرا - القاهرة',
  stationLat: 30.0884, // Cairo coordinates
  stationLng: 31.2468,
  maxGpsRadiusMeters: 10, // strict 10 meter boundary
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.ezouti.cargas.loyalty',
  appStoreUrl: 'https://apps.apple.com/app/cargas-smart-loyalty/id123456789',
  themeColor: '#059669', // Emerald
  isDarkMode: false,
  language: 'ar',
  assistantEnabled: true,
  assistantOnlyAdmin: false,
  assistantAutoSpeak: true,
  assistantAllowedTopics: [
    'شرح برنامج الولاء وكيفية جمع النقاط',
    'طريقة مسح كود الـ QR للسائق بالمحطة',
    'جدول صيانة الزيت والبوجيهات وفلاتر الغاز',
    'نظام التحقق بالـ GPS للوردية (10 أمتار)',
    'شرح تطبيق ستوب (STOP) للسلامة وبيئة العمل',
    'منظومة كارجاس للأصول وتكويد الباركود والمشاريع',
    'الخريطة التفاعلية والوصول لأقرب محطة كارجاس',
    'نظام تقييم الفنيين وخدمة العملاء والشكاوى',
  ],
  customTexts: {
    welcomeDriver: 'أهلاً بيك يا بطل! كودك جاهز لكل تفويلة عشان تكسب نقط وهدايا فورية.',
    welcomeTech: 'مرحباً زميلنا الفني في الوردية. جاهز لتموين سيارات كارجاس والمسح الذكي.',
    cngSlogan: 'وفر فلوسك وحافظ على محرك سيارتك مع الغاز الطبيعي كارجاس',
    pointsBannerTitle: 'رصيد نقاط الولاء الذهبي',
    maintenanceNotice: 'احرص على متابعة مواعيد صيانة الزيت والبوجيهات لضمان أطول عمر لمحرك سيارتك.',
  },
  visibility: DEFAULT_VISIBILITY,
  supportContacts: {
    hotline: '19058',
    whatsappNumber: '201012345678',
    email: 'customercare@cargas.com.eg',
  },
  loyaltyCostModel: {
    activeModelName: 'ترويجي للمحطات المنخفضة',
    costPerPointEgp: 0.35,
    expectedMarginGainPct: 28,
    totalPromotionalBudgetEgp: 150000,
    allocatedBudgetSumEgp: 95000,
    officialGasPrice: 13,
    officialCostPerPoint: 0.35,
    officialGasolineSavingsPerMeter: 10.5,
    officialMarginGainPct: 28,
    centennialMeters: 108,
    centennialPoints: 100,
    centennialRewardValueEgp: 50,
    customerRewardPerPointEgp: 0.50,
  },
  customSalesColumns: DEFAULT_CUSTOM_COLUMNS,
  promotionalCampaigns: DEFAULT_PROMOTIONAL_CAMPAIGNS,
  ideasBank: DEFAULT_IDEAS_BANK,
  wasalnyConfig: DEFAULT_WASALNY_CONFIG,
  pointsFormula: DEFAULT_POINTS_FORMULA,
  layoutSettings: DEFAULT_LAYOUT_SETTINGS,
  scadaConfig: DEFAULT_SCADA_CONFIG,
  fuelingModeDisplay: 'both',
  cylinderInspectionPin: '8899',
  customerServicePin: '5566',
  complaintsOfficerPin: '7788',
  showDeveloperName: true,
  showCompanyName: true,
  showAppName: true,
  technicianIncentiveConfig: DEFAULT_TECHNICIAN_INCENTIVE_CONFIG,
};


export const DEFAULT_MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: 'oil',
    name: 'تغيير زيت المحرك والفلتر',
    intervalKm: 5000,
    lastKm: 82000,
    nextDueKm: 87000,
    status: 'ok',
    icon: 'Droplet',
    description: 'ينصح باستخدام زيت معتمد لمحركات الغاز الطبيعي لتقليل الاحتكاك والحرارة.',
  },
  {
    id: 'spark_plugs',
    name: 'تغيير البوجيهات (شمعات الاحتراق)',
    intervalKm: 20000,
    lastKm: 70000,
    nextDueKm: 90000,
    status: 'due_soon',
    icon: 'Zap',
    description: 'محركات الغاز الطبيعي تحتاج شمعات احتراق ذات فجوة مضبوطة وبكفاءة عالية.',
  },
  {
    id: 'coolant',
    name: 'مياه الردياتير والتبريد',
    intervalKm: 15000,
    lastKm: 75000,
    nextDueKm: 90000,
    status: 'ok',
    icon: 'Thermometer',
    description: 'الحفاظ على سائل تبريد أصلي يمنع غليان المحرك وارتفاع درجة حرارته.',
  },
  {
    id: 'cng_filters',
    name: 'صيانة فلاتر الغاز ومنظم الضغط',
    intervalKm: 15000,
    lastKm: 72000,
    nextDueKm: 87000,
    status: 'ok',
    icon: 'Gauge',
    description: 'تنظيف فلاتر الغاز يحمي رشاشات الغاز ومنظم الضغط من الشوائب والزيوت العالقة.',
  },
  {
    id: 'cylinder_check',
    name: 'الفحص الدوري لأسطوانة الغاز',
    intervalKm: 30000,
    lastKm: 60000,
    nextDueKm: 90000,
    status: 'ok',
    icon: 'ShieldCheck',
    description: 'اختبار ضغط وصمامات الأمان لأسطوانة الغاز وفقاً لتعليمات كارجاس والسلامة.',
  },
];

export const DEFAULT_DRIVER: DriverProfile = {
  id: 'DRV-10294',
  name: 'أحمد ربيع السعيد',
  phone: '01012345678',
  carPlate: 'ق ط د 7842',
  carModel: 'نيسان صني - 2022',
  cngCylinderCapacity: 70, // 70L cylinder
  odometerKm: 85400,
  points: 185,
  totalMetersFueled: 640,
  totalSpentEgp: 8320,
  registeredAt: '2025-01-10',
  maintenanceSchedule: DEFAULT_MAINTENANCE_ITEMS,
};

// شبكة مواقع ومحطات ومراكز كارجاس الافتراضية
export const DEFAULT_STATIONS_LOCATIONS: CargasStationLocation[] = [
  {
    id: 'ST-01',
    name: 'محطة كارجاس شبرا النموذجية',
    code: 'CARGAS-SHUBRA-01',
    city: 'القاهرة',
    address: 'شارع شبرا الرئيسي، بجوار مستشفى الراعي الصالح',
    facilityType: 'cng_station',
    latitude: 30.0884,
    longitude: 31.2468,
    phone: '0224567890',
    workingHours: '24 ساعة متواصلة',
    pumpCount: 8,
    servicesAvailable: ['تموين غاز طبيعي', 'زيوت سريعة أسفل المظلة', 'دفع إلكتروني', 'كافتيريا ومصلى'],
    activities: ['تموين', 'زيوت', 'صيانة'],
    salesVolumeStatus: 'high',
    promotionalPointsMultiplier: 1.0,
    promotionalBudgetEgp: 0,
    region: 'القاهرة الكبرى',
    costPerPointEgp: 0.30,
    pointsAwardRatePerMeter: 1.0,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
    financialApprovedAt: '2026-10-25 10:00',
    financialApprovedBy: 'مدير عام الإدارة المالية',
    financialNotes: 'محطة رئيسية نموذجية ذات كثافة تشغيل مستقرة',
  },
  {
    id: 'ST-02',
    name: 'محطة كارجاس مدينة نصر والوفاء',
    code: 'CARGAS-NASR-02',
    city: 'القاهرة',
    address: 'شارع مصطفى النحاس، تقاطع مكرم عبيد، مدينة نصر',
    facilityType: 'cng_station',
    latitude: 30.0561,
    longitude: 31.3412,
    phone: '0222718900',
    workingHours: '24 ساعة',
    pumpCount: 6,
    servicesAvailable: ['تموين غاز CNG', 'زيوت أسفل المظلة', 'غسيل سريع'],
    activities: ['تموين', 'زيوت'],
    salesVolumeStatus: 'medium',
    promotionalPointsMultiplier: 1.2,
    promotionalBudgetEgp: 15000,
    region: 'القاهرة الكبرى',
    costPerPointEgp: 0.35,
    pointsAwardRatePerMeter: 1.2,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
    financialApprovedAt: '2026-10-25 10:00',
    financialApprovedBy: 'مدير عام الإدارة المالية',
    financialNotes: 'إقبال تجاري ونقاط تحفيزية لسيارات التاكسي',
  },
  {
    id: 'ST-03',
    name: 'مركز كارجاس الرئيسي لتحويل السيارات - ألماظة',
    code: 'CARGAS-ALMAZA-CTR',
    city: 'القاهرة',
    address: 'طريق النصر، خلف سنترال ألماظة، مصر الجديدة',
    facilityType: 'conversion_center',
    latitude: 30.0921,
    longitude: 31.3456,
    phone: '0222904561',
    workingHours: '8:00 ص - 6:00 م',
    servicesAvailable: ['تحويل سيارات للغاز', 'تركيب أطقم حقن متزامن', 'قطع غيار إيطالية معتمدة', 'تقسيط بدون فوائد'],
    activities: ['تحويل', 'صيانة'],
    salesVolumeStatus: 'high',
    promotionalPointsMultiplier: 1.5,
    promotionalBudgetEgp: 20000,
    region: 'القاهرة الكبرى',
    costPerPointEgp: 0.40,
    pointsAwardRatePerMeter: 1.5,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
    financialApprovedAt: '2026-10-25 10:00',
    financialApprovedBy: 'مدير عام الإدارة المالية',
    financialNotes: 'حافز مضاعف لتحويل المركبات وتركيب الأطقم',
  },
  {
    id: 'ST-04',
    name: 'محطة ومركز زيوت كارجاس الدقي',
    code: 'CARGAS-DOKKI-03',
    city: 'الجيزة',
    address: 'شارع التحرير، ميدان الدقي، أمام محطة المترو',
    facilityType: 'oil_center',
    latitude: 30.0385,
    longitude: 31.2119,
    phone: '0233378901',
    workingHours: '24 ساعة',
    pumpCount: 4,
    servicesAvailable: ['تغيير زيوت معتمدة', 'صيانة فلاتر وبوجيهات', 'فحص سوائل المحرك', 'زيوت أسفل المظلة'],
    activities: ['تموين', 'زيوت', 'صيانة'],
    salesVolumeStatus: 'low',
    promotionalPointsMultiplier: 2.0,
    promotionalBudgetEgp: 30000,
    region: 'الجيزة والقاهرة الكبرى',
    costPerPointEgp: 0.45,
    pointsAwardRatePerMeter: 2.0,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
    financialApprovedAt: '2026-10-25 10:00',
    financialApprovedBy: 'مدير عام الإدارة المالية',
    financialNotes: 'تنشيط مبيعات الزيوت بمضاعف نقاط مضاعف (2 نقطة/م³)',
  },
  {
    id: 'ST-05',
    name: 'مركز فحص واختبار أسطوانات الغاز - مسطرد',
    code: 'CARGAS-MOSTOROD-CYL',
    city: 'القليوبية',
    address: 'منطقة مسطرد البترولية، بجوار مجمع شركات البترول',
    facilityType: 'cylinder_inspection',
    latitude: 30.1345,
    longitude: 31.3082,
    phone: '0222541230',
    workingHours: '8:00 ص - 4:00 م',
    servicesAvailable: ['اختبار ضغط هيدروستاتيكي', 'فحص صمامات الأمان', 'إصدار شهادات صلاحية معتمدة للمرور'],
    activities: ['فحص اسطوانات', 'صيانة'],
    salesVolumeStatus: 'medium',
    promotionalPointsMultiplier: 1.5,
    promotionalBudgetEgp: 10000,
    region: 'القليوبية والدلتا',
    costPerPointEgp: 0.35,
    pointsAwardRatePerMeter: 1.5,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
    financialApprovedAt: '2026-10-25 10:00',
    financialApprovedBy: 'مدير عام الإدارة المالية',
    financialNotes: 'دعم فحوصات الأمان وصلاحية المرور الدورية',
  },
  {
    id: 'ST-06',
    name: 'محطة كارجاس سموحة النموذجية',
    code: 'CARGAS-ALEX-SMOUHA',
    city: 'الإسكندرية',
    address: 'شارع مصطفى كامل، ميدان فيكتور عمانويل، سموحة',
    facilityType: 'cng_station',
    latitude: 31.2156,
    longitude: 29.9553,
    phone: '034256789',
    workingHours: '24 ساعة',
    pumpCount: 8,
    servicesAvailable: ['تموين غاز طبيعي', 'زيوت كارجاس', 'فحص ضغط الإطارات مجاناً'],
    activities: ['تموين', 'زيوت'],
    salesVolumeStatus: 'low',
    promotionalPointsMultiplier: 2.0,
    promotionalBudgetEgp: 25000,
    region: 'الإسكندرية والساحل',
    costPerPointEgp: 0.50,
    pointsAwardRatePerMeter: 2.0,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
    financialApprovedAt: '2026-10-25 10:00',
    financialApprovedBy: 'مدير عام الإدارة المالية',
    financialNotes: 'محطة استراتيجية ساحلية بنقاط ترويجية مضاعفة',
  },
  {
    id: 'ST-07',
    name: 'خدمة زيوت أسفل المظلة كارجاس - المهندسين',
    code: 'CARGAS-MOHAND-CNP',
    city: 'الجيزة',
    address: 'شارع جامعة الدول العربية، محطة شل/كارجاس',
    facilityType: 'canopy_oil',
    latitude: 30.0521,
    longitude: 31.2001,
    phone: '0237612345',
    workingHours: '24 ساعة',
    servicesAvailable: ['تغيير زيت سريع دون انتظار', 'تزويد مياه الردياتير', 'فحص فلاتر الهواء والغاز'],
    activities: ['زيوت'],
    salesVolumeStatus: 'medium',
    promotionalPointsMultiplier: 1.5,
    promotionalBudgetEgp: 10000,
    region: 'الجيزة والقاهرة الكبرى',
    costPerPointEgp: 0.35,
    pointsAwardRatePerMeter: 1.5,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
    financialApprovedAt: '2026-10-25 10:00',
    financialApprovedBy: 'مدير عام الإدارة المالية',
    financialNotes: 'خدمات سريعة أسفل المظلة',
  },
  {
    id: 'ST-08',
    name: 'مركز كارجاس المتكامل لخدمات وزيوت المحركات - شيراتون',
    code: 'CARGAS-SHERATON-OIL',
    city: 'القاهرة',
    address: 'شارع سيد زكريا، مساكن شيراتون، النزهة',
    facilityType: 'oil_center',
    latitude: 30.1085,
    longitude: 31.3789,
    phone: '0222684512',
    workingHours: '8:00 ص - 10:00 م',
    servicesAvailable: ['مركز متكامل للزيوت', 'تغيير زيوت معتمدة', 'صيانة دورية للمحركات', 'فلاتر وبوجيهات'],
    activities: ['زيوت', 'صيانة'],
    salesVolumeStatus: 'high',
    promotionalPointsMultiplier: 1.5,
    promotionalBudgetEgp: 20000,
    region: 'القاهرة الكبرى',
    costPerPointEgp: 0.35,
    pointsAwardRatePerMeter: 1.5,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
  },
  {
    id: 'ST-09',
    name: 'مركز كارجاس المتخصص لخدمات الزيوت - المعادي',
    code: 'CARGAS-MAADI-OIL',
    city: 'القاهرة',
    address: 'شارع النصر، المعادي الجديدة، أمام المركز الأولمبي',
    facilityType: 'oil_center',
    latitude: 29.9734,
    longitude: 31.2856,
    phone: '0225197845',
    workingHours: '8:00 ص - 11:00 م',
    servicesAvailable: ['تغيير زيوت معتمدة', 'مركز متكامل للزيوت', 'غسيل محركات', 'فحص تسريب السوائل'],
    activities: ['زيوت'],
    salesVolumeStatus: 'medium',
    promotionalPointsMultiplier: 1.2,
    promotionalBudgetEgp: 15000,
    region: 'القاهرة الكبرى',
    costPerPointEgp: 0.35,
    pointsAwardRatePerMeter: 1.2,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
  },
  {
    id: 'ST-10',
    name: 'مركز كارجاس المعتمد لتحويل وصيانة السيارات - غيط العنب',
    code: 'CARGAS-ALEX-GHEIT-CTR',
    city: 'الإسكندرية',
    address: 'محور المحمودية، منطقة غيط العنب، كرموز',
    facilityType: 'conversion_center',
    latitude: 31.1823,
    longitude: 29.9145,
    phone: '033924512',
    workingHours: '8:00 ص - 6:00 م',
    servicesAvailable: ['تحويل سيارات للغاز', 'صيانة أطقم الغاز وضبط المنظم', 'قطع غيار إيطالية معتمدة'],
    activities: ['تحويل', 'صيانة'],
    salesVolumeStatus: 'high',
    promotionalPointsMultiplier: 1.5,
    promotionalBudgetEgp: 25000,
    region: 'الإسكندرية والساحل',
    costPerPointEgp: 0.40,
    pointsAwardRatePerMeter: 1.5,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
  },
  {
    id: 'ST-11',
    name: 'مركز كارجاس لفحص واختبار أسطوانات الغاز - العامرية',
    code: 'CARGAS-AMREYA-CYL',
    city: 'الإسكندرية',
    address: 'طريق الإسكندرية / القاهرة الصحراوي، مجمع كارجاس العامرية',
    facilityType: 'cylinder_inspection',
    latitude: 31.0234,
    longitude: 29.8145,
    phone: '034481230',
    workingHours: '8:00 ص - 4:00 م',
    servicesAvailable: ['فحص واختبار أسطوانة الغاز وصمام الأمان (شهادة المرور)', 'اختبار ضغط هيدروستاتيكي 300 بار'],
    activities: ['فحص اسطوانات'],
    salesVolumeStatus: 'medium',
    promotionalPointsMultiplier: 1.5,
    promotionalBudgetEgp: 15000,
    region: 'الإسكندرية والساحل',
    costPerPointEgp: 0.35,
    pointsAwardRatePerMeter: 1.5,
    isLoyaltyProgramActive: true,
    financialApprovedByAdmin: true,
  },
  {
    id: 'ST-12',
    name: 'محطة كارجاس الكبرى - العاصمة الإدارية الجديدة (قريباً 2027)',
    code: 'CARGAS-NEWCAPITAL-2027',
    city: 'القاهرة',
    address: 'الحي المالي والحكومي، بجوار مجمع الوزارات، العاصمة الإدارية',
    facilityType: 'cng_station',
    latitude: 30.0125,
    longitude: 31.7456,
    phone: '19058',
    workingHours: 'تاريخ الافتتاح المستهدف: 2027',
    pumpCount: 12,
    servicesAvailable: ['محطة عملاقة قريباً 2027', 'تموين غاز فائق السرعة', 'مركز زيوت متكامل', 'محطة شحن كهربائي'],
    activities: ['تموين', 'زيوت', 'صيانة'],
    salesVolumeStatus: 'medium',
    promotionalPointsMultiplier: 2.0,
    promotionalBudgetEgp: 50000,
    region: 'القاهرة الكبرى',
    costPerPointEgp: 0.35,
    pointsAwardRatePerMeter: 2.0,
    isLoyaltyProgramActive: false,
    financialApprovedByAdmin: true,
  },
  {
    id: 'ST-13',
    name: 'محطة كارجاس النموذجية - العلمين الجديدة (قريباً 2027)',
    code: 'CARGAS-ALAMEIN-2027',
    city: 'مطروح',
    address: 'الطريق الساحلي الدولي، مدخل مدينة العلمين الجديدة',
    facilityType: 'cng_station',
    latitude: 30.8345,
    longitude: 28.9456,
    phone: '19058',
    workingHours: 'تاريخ الافتتاح المستهدف: 2027',
    pumpCount: 10,
    servicesAvailable: ['خطة التوسع القومي قريباً 2027', 'تموين غاز طبيعي CNG', 'مركز زيوت أسفل المظلة'],
    activities: ['تموين', 'زيوت'],
    salesVolumeStatus: 'medium',
    promotionalPointsMultiplier: 2.0,
    promotionalBudgetEgp: 30000,
    region: 'الإسكندرية والساحل',
    costPerPointEgp: 0.40,
    pointsAwardRatePerMeter: 2.0,
    isLoyaltyProgramActive: false,
    financialApprovedByAdmin: true,
  },
];

export const DEFAULT_REWARDS: RewardItem[] = REWARDS_100_CATALOG;

export const DEFAULT_CREW: TechnicianCrewMember[] = [
  {
    id: 'TECH-01',
    name: 'محمود الشناوي',
    role: 'فني تموين',
    phone: '201098765432',
    stationName: 'محطة كارجاس شبرا',
    dailyPin: '7391',
    pinGeneratedDate: new Date().toISOString().slice(0, 10),
    isShiftActive: true,
    totalFuelingsToday: 14,
    totalMetersToday: 320,
    totalAmountToday: 4160,
    technicianPoints: 460,
    totalCustomersServed: 348,
    averageBehaviorRating: 4.9,
    averageOverallRating: 4.85,
    rankTitle: 'بطل مبيعات الوردية ⭐',
    incentiveBonusEgp: 550,
  },
  {
    id: 'TECH-02',
    name: 'إبراهيم عبد الله مرعي',
    role: 'رئيس وردية',
    phone: '201123456789',
    stationName: 'محطة كارجاس شبرا',
    dailyPin: '8402',
    pinGeneratedDate: new Date().toISOString().slice(0, 10),
    isShiftActive: false,
    totalFuelingsToday: 0,
    totalMetersToday: 0,
    totalAmountToday: 0,
    technicianPoints: 320,
    totalCustomersServed: 280,
    averageBehaviorRating: 4.8,
    averageOverallRating: 4.75,
    rankTitle: 'سفير الابتسامة والأمان',
    incentiveBonusEgp: 400,
  },
  {
    id: 'TECH-03',
    name: 'م. عصام المنشاوي',
    role: 'مشرف محطة',
    phone: '201234567890',
    stationName: 'محطة كارجاس شبرا',
    dailyPin: '9153',
    pinGeneratedDate: new Date().toISOString().slice(0, 10),
    isShiftActive: true,
    totalFuelingsToday: 0,
    totalMetersToday: 0,
    totalAmountToday: 0,
    technicianPoints: 500,
    totalCustomersServed: 510,
    averageBehaviorRating: 5.0,
    averageOverallRating: 4.95,
    rankTitle: 'مشرف الجودة الذهبي',
    incentiveBonusEgp: 800,
  },
];

export const DEFAULT_TRANSACTIONS: FuelingTransaction[] = [
  {
    id: 'TX-9081',
    receiptNumber: 'CRG-2026-9081',
    timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    driverId: 'DRV-10294',
    driverName: 'أحمد ربيع السعيد',
    carPlate: 'ق ط د 7842',
    carModel: 'نيسان صني - 2022',
    technicianId: 'TECH-01',
    technicianName: 'محمود الشناوي',
    stationName: 'محطة كارجاس شبرا - القاهرة',
    pumpNumber: 3,
    metersQuantity: 18.5,
    pricePerMeter: 13,
    totalAmountEgp: 240.5,
    pointsEarned: 18,
    odometerReading: 85400,
    gpsDistanceMeters: 3.4,
    verifiedGps: true,
    driverStationFuelingCount: 14,
    driverPumpFuelingCount: 5,
  },
  {
    id: 'TX-9042',
    receiptNumber: 'CRG-2026-9042',
    timestamp: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    driverId: 'DRV-10294',
    driverName: 'أحمد ربيع السعيد',
    carPlate: 'ق ط د 7842',
    carModel: 'نيسان صني - 2022',
    technicianId: 'TECH-01',
    technicianName: 'محمود الشناوي',
    stationName: 'محطة كارجاس شبرا - القاهرة',
    pumpNumber: 1,
    metersQuantity: 16.0,
    pricePerMeter: 13,
    totalAmountEgp: 208.0,
    pointsEarned: 16,
    odometerReading: 84980,
    gpsDistanceMeters: 4.1,
    verifiedGps: true,
    driverStationFuelingCount: 13,
    driverPumpFuelingCount: 4,
  },
];

export const DEFAULT_RATINGS: StationRating[] = [
  {
    id: 'RAT-01',
    transactionId: 'TX-9081',
    driverId: 'DRV-10294',
    driverName: 'أحمد ربيع السعيد',
    carPlate: 'ق ط د 7842',
    technicianId: 'TECH-01',
    technicianName: 'محمود الشناوي',
    stationName: 'محطة كارجاس شبرا - القاهرة',
    pumpNumber: 3,
    overallRating: 5,
    behaviorRating: 5,
    speedRating: 5,
    comment: 'خدمة سريعة جداً والفني محمود في قمة الاحترام والذوق وضغط الغاز ممتاز.',
    timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
  },
];

export const DEFAULT_COMPLAINTS: CustomerComplaint[] = [
  {
    id: 'CMP-101',
    driverName: 'أحمد ربيع السعيد',
    phone: '01012345678',
    carPlate: 'ق ط د 7842',
    stationName: 'محطة كارجاس شبرا - القاهرة',
    category: 'اقتراح تطوير',
    message: 'نرجو زيادة عدد مسدسات التموين في ساعات الذروة الصباحية وتوفير مظلة إضافية.',
    status: 'تم الحل',
    timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    adminResponse: 'شكراً لمقترحك يا فندم، تم جدولتها ضمن خطة تطوير محطة شبرا بالربع الحالي.',
  },
];

export const DEFAULT_SALES_RECORDS: StationSalesRecord[] = [
  {
    id: 'SALES-01',
    stationName: 'محطة كارجاس شبرا النموذجية',
    stationCode: 'CARGAS-SHUBRA-01',
    city: 'القاهرة',
    latitude: 30.0884,
    longitude: 31.2468,
    reportPeriodType: 'monthly',
    periodLabel: 'بيان شهري سنوي تفصيلي (12 شهر)',
    currentSalesM3: 298000,
    targetSalesM3: 300000,
    currentMonthlySalesM3: 298000,
    targetMonthlySalesM3: 300000,
    achievementRatioPct: 99.3,
    allocatedBudgetEgp: 15000,
    promotionalPointsMultiplier: 1.0,
    priorityLevel: 'مستقر',
    monthlyBreakdown: {
      يناير: 23500,
      فبراير: 24200,
      مارس: 25100,
      إبريل: 23800,
      مايو: 24000,
      يونيو: 24400,
      يوليو: 25300,
      أغسطس: 25600,
      سبتمبر: 24800,
      أكتوبر: 25500,
      نوفمبر: 25800,
      ديسمبر: 26000,
    },
    monthlyTargets: {
      يناير: 25000,
      فبراير: 25000,
      مارس: 25000,
      إبريل: 25000,
      مايو: 25000,
      يونيو: 25000,
      يوليو: 25000,
      أغسطس: 25000,
      سبتمبر: 25000,
      أكتوبر: 25000,
      نوفمبر: 25000,
      ديسمبر: 25000,
    },
    monthlyMetrics: {
      يناير: { actual: 23500, target: 25000, variance: -1500, variancePct: -6.0 },
      فبراير: { actual: 24200, target: 25000, variance: -800, variancePct: -3.2 },
      مارس: { actual: 25100, target: 25000, variance: 100, variancePct: 0.4 },
      إبريل: { actual: 23800, target: 25000, variance: -1200, variancePct: -4.8 },
      مايو: { actual: 24000, target: 25000, variance: -1000, variancePct: -4.0 },
      يونيو: { actual: 24400, target: 25000, variance: -600, variancePct: -2.4 },
      يوليو: { actual: 25300, target: 25000, variance: 300, variancePct: 1.2 },
      أغسطس: { actual: 25600, target: 25000, variance: 600, variancePct: 2.4 },
      سبتمبر: { actual: 24800, target: 25000, variance: -200, variancePct: -0.8 },
      أكتوبر: { actual: 25500, target: 25000, variance: 500, variancePct: 2.0 },
      نوفمبر: { actual: 25800, target: 25000, variance: 800, variancePct: 3.2 },
      ديسمبر: { actual: 26000, target: 25000, variance: 1000, variancePct: 4.0 },
    },
    annualActualM3: 298000,
    annualTargetM3: 300000,
    annualVarianceM3: -2000,
    annualVariancePct: -0.7,
  },
  {
    id: 'SALES-02',
    stationName: 'محطة ومركز زيوت كارجاس الدقي',
    stationCode: 'CARGAS-DOKKI-03',
    city: 'الجيزة',
    latitude: 30.0385,
    longitude: 31.2119,
    reportPeriodType: 'monthly',
    periodLabel: 'بيان شهري سنوي تفصيلي (12 شهر)',
    currentSalesM3: 132000,
    targetSalesM3: 220000,
    currentMonthlySalesM3: 132000,
    targetMonthlySalesM3: 220000,
    achievementRatioPct: 60.0, // منخفضة المبيعات - تتطلب تركيز موازنة وترويج
    allocatedBudgetEgp: 45000,
    promotionalPointsMultiplier: 2.0, // نقاط مضاعفة 2x لجذب السائقين
    priorityLevel: 'عالي جداً',
    monthlyBreakdown: {
      يناير: 9800,
      فبراير: 10200,
      مارس: 10500,
      إبريل: 10100,
      مايو: 10600,
      يونيو: 10800,
      يوليو: 11200,
      أغسطس: 11500,
      سبتمبر: 11400,
      أكتوبر: 11800,
      نوفمبر: 12000,
      ديسمبر: 12100,
    },
    monthlyTargets: {
      يناير: 18000,
      فبراير: 18000,
      مارس: 18500,
      إبريل: 18500,
      مايو: 18500,
      يونيو: 18500,
      يوليو: 18500,
      أغسطس: 18500,
      سبتمبر: 18500,
      أكتوبر: 18500,
      نوفمبر: 18500,
      ديسمبر: 18500,
    },
    monthlyMetrics: {
      يناير: { actual: 9800, target: 18000, variance: -8200, variancePct: -45.6 },
      فبراير: { actual: 10200, target: 18000, variance: -7800, variancePct: -43.3 },
      مارس: { actual: 10500, target: 18500, variance: -8000, variancePct: -43.2 },
      إبريل: { actual: 10100, target: 18500, variance: -8400, variancePct: -45.4 },
      مايو: { actual: 10600, target: 18500, variance: -7900, variancePct: -42.7 },
      يونيو: { actual: 10800, target: 18500, variance: -7700, variancePct: -41.6 },
      يوليو: { actual: 11200, target: 18500, variance: -7300, variancePct: -39.5 },
      أغسطس: { actual: 11500, target: 18500, variance: -7000, variancePct: -37.8 },
      سبتمبر: { actual: 11400, target: 18500, variance: -7100, variancePct: -38.4 },
      أكتوبر: { actual: 11800, target: 18500, variance: -6700, variancePct: -36.2 },
      نوفمبر: { actual: 12000, target: 18500, variance: -6500, variancePct: -35.1 },
      ديسمبر: { actual: 12100, target: 18500, variance: -6400, variancePct: -34.6 },
    },
    annualActualM3: 132000,
    annualTargetM3: 220000,
    annualVarianceM3: -88000,
    annualVariancePct: -40.0,
  },
  {
    id: 'SALES-03',
    stationName: 'محطة كارجاس سموحة النموذجية',
    stationCode: 'CARGAS-ALEX-SMOUHA',
    city: 'الإسكندرية',
    latitude: 31.2156,
    longitude: 29.9553,
    reportPeriodType: 'monthly',
    periodLabel: 'بيان شهري سنوي تفصيلي (12 شهر)',
    currentSalesM3: 148000,
    targetSalesM3: 240000,
    currentMonthlySalesM3: 148000,
    targetMonthlySalesM3: 240000,
    achievementRatioPct: 61.7, // منخفضة المبيعات
    allocatedBudgetEgp: 40000,
    promotionalPointsMultiplier: 2.0,
    priorityLevel: 'عالي جداً',
    monthlyBreakdown: {
      يناير: 11200,
      فبراير: 11800,
      مارس: 12100,
      إبريل: 11900,
      مايو: 12000,
      يونيو: 12000,
      يوليو: 12500,
      أغسطس: 13000,
      سبتمبر: 12600,
      أكتوبر: 13200,
      نوفمبر: 13800,
      ديسمبر: 13900,
    },
    monthlyTargets: {
      يناير: 20000,
      فبراير: 20000,
      مارس: 20000,
      إبريل: 20000,
      مايو: 20000,
      يونيو: 20000,
      يوليو: 20000,
      أغسطس: 20000,
      سبتمبر: 20000,
      أكتوبر: 20000,
      نوفمبر: 20000,
      ديسمبر: 20000,
    },
    monthlyMetrics: {
      يناير: { actual: 11200, target: 20000, variance: -8800, variancePct: -44.0 },
      فبراير: { actual: 11800, target: 20000, variance: -8200, variancePct: -41.0 },
      مارس: { actual: 12100, target: 20000, variance: -7900, variancePct: -39.5 },
      إبريل: { actual: 11900, target: 20000, variance: -8100, variancePct: -40.5 },
      مايو: { actual: 12000, target: 20000, variance: -8000, variancePct: -40.0 },
      يونيو: { actual: 12000, target: 20000, variance: -8000, variancePct: -40.0 },
      يوليو: { actual: 12500, target: 20000, variance: -7500, variancePct: -37.5 },
      أغسطس: { actual: 13000, target: 20000, variance: -7000, variancePct: -35.0 },
      سبتمبر: { actual: 12600, target: 20000, variance: -7400, variancePct: -37.0 },
      أكتوبر: { actual: 13200, target: 20000, variance: -6800, variancePct: -34.0 },
      نوفمبر: { actual: 13800, target: 20000, variance: -6200, variancePct: -31.0 },
      ديسمبر: { actual: 13900, target: 20000, variance: -6100, variancePct: -30.5 },
    },
    annualActualM3: 148000,
    annualTargetM3: 240000,
    annualVarianceM3: -92000,
    annualVariancePct: -38.3,
  },
  {
    id: 'SALES-04',
    stationName: 'محطة كارجاس مدينة نصر والوفاء',
    stationCode: 'CARGAS-NASR-02',
    city: 'القاهرة',
    latitude: 30.0561,
    longitude: 31.3412,
    reportPeriodType: 'monthly',
    periodLabel: 'بيان شهري سنوي تفصيلي (12 شهر)',
    currentSalesM3: 261000,
    targetSalesM3: 280000,
    currentMonthlySalesM3: 261000,
    targetMonthlySalesM3: 280000,
    achievementRatioPct: 93.2,
    allocatedBudgetEgp: 20000,
    promotionalPointsMultiplier: 1.2,
    priorityLevel: 'متوسط',
    monthlyBreakdown: {
      يناير: 21000,
      فبراير: 21500,
      مارس: 21200,
      إبريل: 21300,
      مايو: 21400,
      يونيو: 21600,
      يوليو: 22000,
      أغسطس: 22200,
      سبتمبر: 22100,
      أكتوبر: 22400,
      نوفمبر: 22100,
      ديسمبر: 22200,
    },
    monthlyTargets: {
      يناير: 23000,
      فبراير: 23000,
      مارس: 23500,
      إبريل: 23500,
      مايو: 23500,
      يونيو: 23500,
      يوليو: 23500,
      أغسطس: 23500,
      سبتمبر: 23500,
      أكتوبر: 23500,
      نوفمبر: 23500,
      ديسمبر: 23500,
    },
    monthlyMetrics: {
      يناير: { actual: 21000, target: 23000, variance: -2000, variancePct: -8.7 },
      فبراير: { actual: 21500, target: 23000, variance: -1500, variancePct: -6.5 },
      مارس: { actual: 21200, target: 23500, variance: -2300, variancePct: -9.8 },
      إبريل: { actual: 21300, target: 23500, variance: -2200, variancePct: -9.4 },
      مايو: { actual: 21400, target: 23500, variance: -2100, variancePct: -8.9 },
      يونيو: { actual: 21600, target: 23500, variance: -1900, variancePct: -8.1 },
      يوليو: { actual: 22000, target: 23500, variance: -1500, variancePct: -6.4 },
      أغسطس: { actual: 22200, target: 23500, variance: -1300, variancePct: -5.5 },
      سبتمبر: { actual: 22100, target: 23500, variance: -1400, variancePct: -6.0 },
      أكتوبر: { actual: 22400, target: 23500, variance: -1100, variancePct: -4.7 },
      نوفمبر: { actual: 22100, target: 23500, variance: -1400, variancePct: -6.0 },
      ديسمبر: { actual: 22200, target: 23500, variance: -1300, variancePct: -5.5 },
    },
    annualActualM3: 261000,
    annualTargetM3: 280000,
    annualVarianceM3: -19000,
    annualVariancePct: -6.8,
  },
  {
    id: 'SALES-05',
    stationName: 'محطة كارجاس المعادي الجديدة - الأوتوستراد',
    stationCode: 'CARGAS-MAADI-AUTO',
    city: 'القاهرة',
    latitude: 29.9654,
    longitude: 31.2891,
    reportPeriodType: 'monthly',
    periodLabel: 'بيان شهري سنوي تفصيلي (12 شهر)',
    currentSalesM3: 185000,
    targetSalesM3: 260000,
    currentMonthlySalesM3: 185000,
    targetMonthlySalesM3: 260000,
    achievementRatioPct: 71.2,
    allocatedBudgetEgp: 30000,
    promotionalPointsMultiplier: 1.5,
    priorityLevel: 'متوسط',
    monthlyBreakdown: {
      يناير: 14200,
      فبراير: 14800,
      مارس: 15100,
      إبريل: 15000,
      مايو: 15400,
      يونيو: 15500,
      يوليو: 15800,
      أغسطس: 16100,
      سبتمبر: 15700,
      أكتوبر: 16000,
      نوفمبر: 15900,
      ديسمبر: 15500,
    },
    monthlyTargets: {
      يناير: 21500,
      فبراير: 21500,
      مارس: 21500,
      إبريل: 21500,
      مايو: 21500,
      يونيو: 21500,
      يوليو: 22000,
      أغسطس: 22000,
      سبتمبر: 22000,
      أكتوبر: 22000,
      نوفمبر: 22000,
      ديسمبر: 22000,
    },
    annualActualM3: 185000,
    annualTargetM3: 260000,
    annualVarianceM3: -75000,
    annualVariancePct: -28.8,
  },
  {
    id: 'SALES-06',
    stationName: 'محطة كارجاس العاشر من رمضان - المنطقة الصناعية',
    stationCode: 'CARGAS-10TH-IND',
    city: 'الشرقية',
    latitude: 30.2981,
    longitude: 31.7412,
    reportPeriodType: 'monthly',
    periodLabel: 'بيان شهري سنوي تفصيلي (12 شهر)',
    currentSalesM3: 118000,
    targetSalesM3: 210000,
    currentMonthlySalesM3: 118000,
    targetMonthlySalesM3: 210000,
    achievementRatioPct: 56.2,
    allocatedBudgetEgp: 35000,
    promotionalPointsMultiplier: 2.0,
    priorityLevel: 'عالي جداً',
    monthlyBreakdown: {
      يناير: 9100,
      فبراير: 9400,
      مارس: 9800,
      إبريل: 9600,
      مايو: 9900,
      يونيو: 10100,
      يوليو: 10300,
      أغسطس: 10500,
      سبتمبر: 10200,
      أكتوبر: 10400,
      نوفمبر: 9900,
      ديسمبر: 8800,
    },
    monthlyTargets: {
      يناير: 17500,
      فبراير: 17500,
      مارس: 17500,
      إبريل: 17500,
      مايو: 17500,
      يونيو: 17500,
      يوليو: 17500,
      أغسطس: 17500,
      سبتمبر: 17500,
      أكتوبر: 17500,
      نوفمبر: 17500,
      ديسمبر: 17500,
    },
    annualActualM3: 118000,
    annualTargetM3: 210000,
    annualVarianceM3: -92000,
    annualVariancePct: -43.8,
  },
];

// Helper Functions
export function getAppConfig(): AppConfig {
  const data = localStorage.getItem(CONFIG_KEY);
  if (!data) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      visibility: {
        ...DEFAULT_VISIBILITY,
        ...(parsed.visibility || {}),
        driver: { ...DEFAULT_VISIBILITY.driver, ...(parsed.visibility?.driver || {}) },
        technician: { ...DEFAULT_VISIBILITY.technician, ...(parsed.visibility?.technician || {}) },
      },
      supportContacts: {
        ...DEFAULT_CONFIG.supportContacts,
        ...(parsed.supportContacts || {}),
      },
      loyaltyCostModel: {
        ...DEFAULT_CONFIG.loyaltyCostModel,
        ...(parsed.loyaltyCostModel || {}),
      },
      customSalesColumns: parsed.customSalesColumns || DEFAULT_CUSTOM_COLUMNS,
      promotionalCampaigns: parsed.promotionalCampaigns || DEFAULT_PROMOTIONAL_CAMPAIGNS,
      ideasBank: parsed.ideasBank || DEFAULT_IDEAS_BANK,
      wasalnyConfig: {
        ...DEFAULT_WASALNY_CONFIG,
        ...(parsed.wasalnyConfig || {}),
      },
      pointsFormula: {
        ...DEFAULT_POINTS_FORMULA,
        ...(parsed.pointsFormula || {}),
      },
      layoutSettings: {
        driverSectionsOrder: parsed.layoutSettings?.driverSectionsOrder || DEFAULT_DRIVER_SECTIONS_ORDER,
        technicianSectionsOrder: parsed.layoutSettings?.technicianSectionsOrder || DEFAULT_TECHNICIAN_SECTIONS_ORDER,
        driverSections: (parsed.layoutSettings?.driverSections && parsed.layoutSettings.driverSections.length > 0)
          ? parsed.layoutSettings.driverSections
          : DEFAULT_DRIVER_SECTIONS,
        technicianSections: (parsed.layoutSettings?.technicianSections && parsed.layoutSettings.technicianSections.length > 0)
          ? parsed.layoutSettings.technicianSections
          : DEFAULT_TECHNICIAN_SECTIONS,
      },
      scadaConfig: {
        ...DEFAULT_SCADA_CONFIG,
        ...(parsed.scadaConfig || {}),
      },
      customerViewMode: parsed.customerViewMode || getCustomerViewMode(),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveAppConfig(config: AppConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// ==================== SCADA & Fueling Sessions Store ====================

export function getFuelingSessions(): FuelingSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse fueling sessions from storage:', err);
    return [];
  }
}

export function saveFuelingSessions(sessions: FuelingSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    // Emit real-time event for UI listeners
    window.dispatchEvent(new CustomEvent('cargas_sessions_updated', { detail: sessions }));
  } catch (err) {
    console.error('Failed to save fueling sessions:', err);
  }
}

export function createFuelingSession(data: Omit<FuelingSession, 'created_at'>): FuelingSession {
  const sessions = getFuelingSessions();
  const newSession: FuelingSession = {
    ...data,
    created_at: new Date().toISOString(),
  };
  sessions.unshift(newSession);
  if (sessions.length > 60) sessions.length = 60;
  saveFuelingSessions(sessions);
  return newSession;
}

export function getActiveFuelingSession(
  stationId: string,
  hoseId: string,
  windowMinutes: number = 10
): FuelingSession | null {
  const sessions = getFuelingSessions();
  const now = Date.now();
  const maxAgeMs = windowMinutes * 60 * 1000;

  return (
    sessions.find((s) => {
      if (s.status !== 'IN_PROGRESS') return false;
      const sId = (s.station_id || '').trim().toLowerCase();
      const targetStation = (stationId || '').trim().toLowerCase();
      const stationMatch =
        !targetStation ||
        sId === targetStation ||
        (s.station_name && s.station_name.toLowerCase().includes(targetStation));

      const hId = (s.hose_id || '').trim().toLowerCase();
      const targetHose = (hoseId || '').trim().toLowerCase();
      const hoseMatch = !targetHose || hId === targetHose;

      if (!stationMatch || !hoseMatch) return false;

      const createdTime = new Date(s.created_at).getTime();
      return now - createdTime <= maxAgeMs;
    }) || null
  );
}

export function updateFuelingSession(
  sessionId: string,
  updates: Partial<FuelingSession>
): FuelingSession | null {
  const sessions = getFuelingSessions();
  const index = sessions.findIndex((s) => s.session_id === sessionId);
  if (index === -1) return null;

  sessions[index] = { ...sessions[index], ...updates };
  saveFuelingSessions(sessions);
  return sessions[index];
}

export function getDriverProfile(): DriverProfile {
  const data = localStorage.getItem(DRIVER_KEY);
  if (!data) return DEFAULT_DRIVER;
  try {
    return { ...DEFAULT_DRIVER, ...JSON.parse(data) };
  } catch {
    return DEFAULT_DRIVER;
  }
}

export function saveDriverProfile(driver: DriverProfile): void {
  localStorage.setItem(DRIVER_KEY, JSON.stringify(driver));
}

export function getStationCrew(): TechnicianCrewMember[] {
  const data = localStorage.getItem(CREW_KEY);
  if (!data) return DEFAULT_CREW;
  try {
    const list: TechnicianCrewMember[] = JSON.parse(data);
    return list.map((c, i) => ({
      ...DEFAULT_CREW[i % DEFAULT_CREW.length],
      ...c,
    }));
  } catch {
    return DEFAULT_CREW;
  }
}

export function saveStationCrew(crew: TechnicianCrewMember[]): void {
  localStorage.setItem(CREW_KEY, JSON.stringify(crew));
}

export function getTransactions(): FuelingTransaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  if (!data) return DEFAULT_TRANSACTIONS;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_TRANSACTIONS;
  }
}

export function saveTransactions(txs: FuelingTransaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
}

export function getRewards(): RewardItem[] {
  const data = localStorage.getItem(REWARDS_KEY);
  if (!data) return DEFAULT_REWARDS;
  try {
    const parsed = JSON.parse(data);
    // إذا كان الكتالوج القديم به أقل من 20 مكافأة، يتم الترقية فوراً لكتالوج الـ 100 هدية الجديد
    if (!Array.isArray(parsed) || parsed.length < 20) {
      localStorage.setItem(REWARDS_KEY, JSON.stringify(DEFAULT_REWARDS));
      return DEFAULT_REWARDS;
    }
    return parsed;
  } catch {
    return DEFAULT_REWARDS;
  }
}

export function saveRewards(rewards: RewardItem[]): void {
  localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
}

// ==================== Service Appointments & Smart Reallocation Store ====================

export const DEFAULT_APPOINTMENTS: ServiceAppointment[] = [
  {
    id: 'APP-101',
    driverId: 'DRV-10294',
    driverName: 'أحمد ربيع السعيد',
    carPlate: 'ق ط د 7842',
    phone: '01012345678',
    stationId: 'ST-05',
    stationName: 'مركز فحص واختبار أسطوانات الغاز - مسطرد',
    serviceType: 'فحص واختبار أسطوانة الغاز وصمام الأمان (شهادة المرور)',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '10:00 ص - 10:30 ص',
    status: 'awaiting_confirmation',
    createdAt: new Date().toISOString(),
    alertSentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    confirmationDeadline: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    notes: 'فحص دوري واستخراج شهادة صلاحية المرور المعتمدة 3 سنوات',
    bookingCategory: 'cylinder_inspection',
    cylinderSerialNumber: 'CYL-EG-2021-99812',
    cylinderWaterCapacityL: 70,
    cylinderTestResult: 'pending',
    customerServiceCallStatus: 'pending_call',
  },
  {
    id: 'APP-102',
    driverId: 'DRV-99881',
    driverName: 'محمود عبد الفتاح السيد',
    carPlate: 'س ر م 5124',
    phone: '01223344556',
    stationId: 'ST-01',
    stationName: 'محطة كارجاس شبرا النموذجية',
    serviceType: 'صيانة دورية وتغيير طقم فلاتر الغاز',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '01:00 م - 01:30 م',
    status: 'confirmed_by_driver',
    confirmedByCustomerService: true,
    confirmedByAgentName: 'سارة ممدوح (خدمة العملاء)',
    customerServiceCallStatus: 'called_confirmed',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notes: 'تم التواصل هاتفياً وتأكيد حضور العميل في الموعد المحدد',
    bookingCategory: 'maintenance_conversion',
  },
  {
    id: 'APP-103',
    driverId: 'DRV-33412',
    driverName: 'كابتن ياسر الجوهري',
    carPlate: 'أ ب ج 9831',
    phone: '01122334455',
    stationId: 'ST-02',
    stationName: 'محطة كارجاس ألماظة - النزهة',
    serviceType: 'تغيير زيت المحرك وفحص الفلتر أسفل المظلة',
    appointmentDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: '11:00 ص - 11:30 ص',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    notes: 'حجز غيار زيت شل هيلكس الترا لمحركات الغاز',
    bookingCategory: 'maintenance_conversion',
    customerServiceCallStatus: 'pending_call',
  },
  {
    id: 'APP-104',
    driverId: 'DRV-55610',
    driverName: 'طارق عبد الرازق حسن',
    carPlate: 'ي ن ع 4521',
    phone: '01099887766',
    stationId: 'ST-05',
    stationName: 'مركز فحص واختبار أسطوانات الغاز - مسطرد',
    serviceType: 'فحص واختبار أسطوانة الغاز وصمام الأمان (شهادة المرور)',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:00 ص - 09:30 ص',
    status: 'completed',
    confirmedByCustomerService: true,
    confirmedByAgentName: 'م. إيهاب شاكر (خدمة العملاء)',
    customerServiceCallStatus: 'called_confirmed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    notes: 'تم فحص واختبار الأسطوانة بنجاح بضغط 300 بار وتم إصدار شهادة المرور المعتمدة رقم CRG-CERT-9481',
    bookingCategory: 'cylinder_inspection',
    cylinderSerialNumber: 'CYL-IT-884210',
    cylinderWaterCapacityL: 80,
    cylinderTestResult: 'passed',
    cylinderTestPressureBar: 300,
    cylinderCertificateNumber: 'CRG-CERT-9481',
    cylinderCertificateExpiryDate: '2029-10-30',
    inspectionEngineerName: 'م. حسام الدين عبد الله (مدير الفحص)',
  },
];

export function getServiceAppointments(): ServiceAppointment[] {
  const data = localStorage.getItem(APPOINTMENTS_KEY);
  if (!data) return DEFAULT_APPOINTMENTS;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_APPOINTMENTS;
  }
}

export function saveServiceAppointments(appointments: ServiceAppointment[]): void {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  window.dispatchEvent(new CustomEvent('cargas_appointments_updated', { detail: appointments }));
}

export function bookServiceAppointment(
  data: Omit<ServiceAppointment, 'id' | 'createdAt' | 'status'>
): ServiceAppointment {
  const appointments = getServiceAppointments();
  const newApp: ServiceAppointment = {
    ...data,
    id: `APP-${Date.now().toString().slice(-5)}`,
    createdAt: new Date().toISOString(),
    status: 'scheduled',
  };
  appointments.unshift(newApp);
  saveServiceAppointments(appointments);
  return newApp;
}

export function confirmServiceAppointment(id: string): ServiceAppointment | null {
  const appointments = getServiceAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  appointments[idx] = {
    ...appointments[idx],
    status: 'confirmed_by_driver',
    confirmedAt: new Date().toISOString(),
  };
  saveServiceAppointments(appointments);
  return appointments[idx];
}

export function updateServiceAppointment(
  id: string,
  updates: Partial<ServiceAppointment>
): ServiceAppointment | null {
  const appointments = getServiceAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  appointments[idx] = {
    ...appointments[idx],
    ...updates,
  };
  saveServiceAppointments(appointments);
  return appointments[idx];
}

export const CYLINDER_INSPECTION_PIN_KEY = 'cargas_cylinder_inspection_pin';

export function getCylinderInspectionPin(): string {
  if (typeof window === 'undefined') return '8899';
  try {
    const saved = localStorage.getItem(CYLINDER_INSPECTION_PIN_KEY);
    if (saved && saved.trim().length > 0) return saved.trim();
    const appCfg = getAppConfig();
    if (appCfg.cylinderInspectionPin && appCfg.cylinderInspectionPin.trim().length > 0) {
      return appCfg.cylinderInspectionPin.trim();
    }
  } catch (e) {
    console.warn('Error reading cylinder PIN:', e);
  }
  return '8899';
}

export function saveCylinderInspectionPin(pin: string): void {
  if (typeof window === 'undefined') return;
  const targetPin = (pin || '8899').trim();
  try {
    localStorage.setItem(CYLINDER_INSPECTION_PIN_KEY, targetPin);
    const appCfg = getAppConfig();
    saveAppConfig({
      ...appCfg,
      cylinderInspectionPin: targetPin,
    });
  } catch (e) {
    console.error('Error saving cylinder PIN:', e);
  }
}

export const CUSTOMER_SERVICE_PIN_KEY = 'cargas_customer_service_pin';

export function getCustomerServicePin(): string {
  if (typeof window === 'undefined') return '5566';
  try {
    const saved = localStorage.getItem(CUSTOMER_SERVICE_PIN_KEY);
    if (saved && saved.trim().length > 0) return saved.trim();
    const appCfg = getAppConfig();
    if (appCfg.customerServicePin && appCfg.customerServicePin.trim().length > 0) {
      return appCfg.customerServicePin.trim();
    }
  } catch (e) {
    console.warn('Error reading customer service PIN:', e);
  }
  return '5566';
}

export function saveCustomerServicePin(pin: string): void {
  if (typeof window === 'undefined') return;
  const targetPin = (pin || '5566').trim();
  try {
    localStorage.setItem(CUSTOMER_SERVICE_PIN_KEY, targetPin);
    const appCfg = getAppConfig();
    saveAppConfig({
      ...appCfg,
      customerServicePin: targetPin,
    });
  } catch (e) {
    console.error('Error saving customer service PIN:', e);
  }
}

// ==========================================
// باسوورد مسؤول تلقي الشكاوى والمقترحات (يرسله مدير النظام عبر الواتساب)
// ==========================================
export const COMPLAINTS_OFFICER_PIN_KEY = 'cargas_complaints_officer_pin';

export function getComplaintsOfficerPin(): string {
  if (typeof window === 'undefined') return '7788';
  try {
    const saved = localStorage.getItem(COMPLAINTS_OFFICER_PIN_KEY);
    if (saved && saved.trim().length > 0) return saved.trim();
    const appCfg = getAppConfig();
    if (appCfg.complaintsOfficerPin && appCfg.complaintsOfficerPin.trim().length > 0) {
      return appCfg.complaintsOfficerPin.trim();
    }
  } catch (e) {
    console.warn('Error reading complaints officer PIN:', e);
  }
  return '7788';
}

export function saveComplaintsOfficerPin(pin: string): void {
  if (typeof window === 'undefined') return;
  const targetPin = (pin || '7788').trim();
  try {
    localStorage.setItem(COMPLAINTS_OFFICER_PIN_KEY, targetPin);
    const appCfg = getAppConfig();
    saveAppConfig({
      ...appCfg,
      complaintsOfficerPin: targetPin,
    });
  } catch (e) {
    console.error('Error saving complaints officer PIN:', e);
  }
}

// ==========================================
// نظام المراسلة المباشرة بين العميل وخدمة العملاء ومركز فحص الأسطوانات
// ==========================================
export const CUSTOMER_DIRECT_MESSAGES_KEY = 'cargas_customer_direct_messages';

export const DEFAULT_CUSTOMER_MESSAGES: CustomerDirectMessage[] = [
  {
    id: 'MSG-001',
    channel: 'customer_service',
    driverId: 'drv-01',
    driverName: 'أحمد محمود رضوان',
    carPlate: 'س ق ج 4 5 6 7',
    driverPhone: '01012345678',
    senderRole: 'customer_service',
    senderName: 'فريق خدمة عملاء كارجاس',
    messageText: 'أهلاً بك يا أستاذ أحمد في خدمة عملاء كارجاس! موعدك لصيانة وفحص طقم الفلاتر بمحطة شبرا مجدول غداً الساعة 10:30 صباحاً.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    readByCustomer: true,
    readByStaff: true,
    stationName: 'محطة كارجاس شبرا',
    serviceType: 'صيانة دورية وتغيير طقم فلاتر الغاز',
    statusBadge: 'موعد مؤكد ✔️',
  },
  {
    id: 'MSG-002',
    channel: 'customer_service',
    driverId: 'drv-01',
    driverName: 'أحمد محمود رضوان',
    carPlate: 'س ق ج 4 5 6 7',
    driverPhone: '01012345678',
    senderRole: 'driver',
    senderName: 'أحمد محمود رضوان',
    messageText: 'شكراً جزيلاً، هل يشمل ذلك فحص وضبط محبس الأمان؟',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    readByCustomer: true,
    readByStaff: false,
    stationName: 'محطة كارجاس شبرا',
    serviceType: 'صيانة دورية وتغيير طقم فلاتر الغاز',
  },
  {
    id: 'MSG-003',
    channel: 'cylinder_center',
    driverId: 'drv-01',
    driverName: 'أحمد محمود رضوان',
    carPlate: 'س ق ج 4 5 6 7',
    driverPhone: '01012345678',
    senderRole: 'cylinder_center',
    senderName: 'م. حسام الدين (مركز فحص أسطوانات ألماظة)',
    messageText: 'مرحباً أستاذ أحمد. نود تذكيرك بأن موعد الفحص الدوري لأسطوانة سيارتك مستحق لتجديد شهادة المرور الرسمية. المركز يعمل يومياً حتى 5 مساءً بجهاز الضغط الهيدروستاتيكي 300 بار.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    readByCustomer: true,
    readByStaff: true,
    stationName: 'محطة ألماظة - طريق النصر',
    serviceType: 'فحص واختبار أسطوانة الغاز وصمام الأمان (شهادة المرور)',
    statusBadge: 'شهادة المرور 🛡️',
  },
];

export function getCustomerDirectMessages(
  channel?: CustomerChatChannel,
  driverId?: string
): CustomerDirectMessage[] {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMER_MESSAGES;
  try {
    const raw = localStorage.getItem(CUSTOMER_DIRECT_MESSAGES_KEY);
    let list: CustomerDirectMessage[] = [];
    if (raw) {
      list = JSON.parse(raw);
    } else {
      list = DEFAULT_CUSTOMER_MESSAGES;
      localStorage.setItem(CUSTOMER_DIRECT_MESSAGES_KEY, JSON.stringify(list));
    }

    if (channel) {
      list = list.filter((m) => m.channel === channel);
    }
    if (driverId) {
      list = list.filter((m) => m.driverId === driverId);
    }
    return list;
  } catch (e) {
    console.error('Error fetching customer direct messages:', e);
    return DEFAULT_CUSTOMER_MESSAGES;
  }
}

export function sendCustomerDirectMessage(
  msg: Omit<CustomerDirectMessage, 'id' | 'timestamp'>
): CustomerDirectMessage {
  const current = getCustomerDirectMessages();
  const newMsg: CustomerDirectMessage = {
    ...msg,
    id: `MSG-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const updated = [...current, newMsg];
  try {
    localStorage.setItem(CUSTOMER_DIRECT_MESSAGES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cargas_customer_message_sent', { detail: newMsg }));
  } catch (e) {
    console.error('Error saving direct message:', e);
  }
  return newMsg;
}

export function markCustomerMessagesRead(
  channel: CustomerChatChannel,
  readerRole: 'driver' | 'staff',
  driverId?: string
): void {
  try {
    const current = getCustomerDirectMessages();
    const updated = current.map((m) => {
      if (m.channel !== channel) return m;
      if (driverId && m.driverId !== driverId) return m;
      if (readerRole === 'driver') {
        return { ...m, readByCustomer: true };
      } else {
        return { ...m, readByStaff: true };
      }
    });
    localStorage.setItem(CUSTOMER_DIRECT_MESSAGES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error marking messages as read:', e);
  }
}


/**
 * فحص هل المحطة بها مركز معتمد لفحص واختبار أسطوانات الغاز
 */
export function isStationCylinderTestingCenter(station: CargasStationLocation): boolean {
  if (!station) return false;
  if (station.facilityType === 'cylinder_inspection') return true;
  if (station.activities && station.activities.includes('فحص اسطوانات')) return true;
  const nameNorm = (station.name || '').toLowerCase();
  const servicesNorm = (station.servicesAvailable || []).join(' ').toLowerCase();
  return (
    nameNorm.includes('فحص') ||
    nameNorm.includes('اسطوان') ||
    nameNorm.includes('أسطوان') ||
    servicesNorm.includes('فحص') ||
    servicesNorm.includes('اسطوان')
  );
}

export function cancelServiceAppointment(id: string, reason?: string): ServiceAppointment | null {
  const appointments = getServiceAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  appointments[idx] = {
    ...appointments[idx],
    status: 'cancelled_by_driver',
    notes: reason ? `${appointments[idx].notes || ''} [إلغاء: ${reason}]` : appointments[idx].notes,
  };
  saveServiceAppointments(appointments);
  return appointments[idx];
}

export function triggerTwoHourReminderSimulation(id: string): ServiceAppointment | null {
  const appointments = getServiceAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const now = new Date();
  const deadline = new Date(now.getTime() + 60 * 60 * 1000); // مهلة ساعة واحدة
  appointments[idx] = {
    ...appointments[idx],
    status: 'awaiting_confirmation',
    alertSentAt: now.toISOString(),
    confirmationDeadline: deadline.toISOString(),
  };
  saveServiceAppointments(appointments);
  return appointments[idx];
}

export function autoCancelNoShowAppointment(id: string): ServiceAppointment | null {
  const appointments = getServiceAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  appointments[idx] = {
    ...appointments[idx],
    status: 'auto_cancelled_no_show',
    notes: (appointments[idx].notes || '') + ' [أُلغي تلقائياً لعدم التأكيد خلال مهلة 1 ساعة]',
  };
  saveServiceAppointments(appointments);
  return appointments[idx];
}

export function claimVacantReallocatedSlot(
  appointmentId: string,
  newDriverId: string,
  newDriverName: string,
  newCarPlate: string,
  newPhone: string
): ServiceAppointment | null {
  const appointments = getServiceAppointments();
  const idx = appointments.findIndex((a) => a.id === appointmentId);
  if (idx === -1) return null;
  appointments[idx] = {
    ...appointments[idx],
    status: 'reallocated_to_standby',
    reallocatedToDriverId: newDriverId,
    reallocatedToDriverName: newDriverName,
    reallocatedToCarPlate: newCarPlate,
    driverId: newDriverId,
    driverName: newDriverName,
    carPlate: newCarPlate,
    phone: newPhone,
    confirmedAt: new Date().toISOString(),
    notes: `تم شغل المكان الشاغر وتقديم الموعد بنجاح للعميل (${newDriverName} - ${newCarPlate}) فور خلو الموعد`,
  };
  saveServiceAppointments(appointments);
  return appointments[idx];
}

export function getRedemptions(): RewardRedemption[] {
  const data = localStorage.getItem(REDEMPTIONS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveRedemptions(redemptions: RewardRedemption[]): void {
  localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(redemptions));
}

export function getStationLocations(): CargasStationLocation[] {
  if (typeof window === 'undefined') return DEFAULT_STATIONS_LOCATIONS;
  const data = localStorage.getItem(STATIONS_LOCATIONS_KEY);
  if (!data) return DEFAULT_STATIONS_LOCATIONS;
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STATIONS_LOCATIONS;
  } catch {
    return DEFAULT_STATIONS_LOCATIONS;
  }
}

export function saveStationLocations(stations: CargasStationLocation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATIONS_LOCATIONS_KEY, JSON.stringify(stations));
    // إرسال إشعار فوري وتحديث كافة الخرائط والشاشات في كامل التطبيق
    window.dispatchEvent(new CustomEvent('cargas_stations_updated', { detail: stations }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Failed to save stations locations:', err);
  }
}

export function getStationRatings(): StationRating[] {
  const data = localStorage.getItem(RATINGS_KEY);
  if (!data) return DEFAULT_RATINGS;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_RATINGS;
  }
}

export function saveStationRatings(ratings: StationRating[]): void {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

export function addStationRating(rating: Omit<StationRating, 'id' | 'timestamp'>): void {
  const ratings = getStationRatings();
  const newRating: StationRating = {
    id: 'RAT-' + Math.floor(Math.random() * 90000 + 10000),
    timestamp: new Date().toISOString(),
    ...rating,
  };
  ratings.unshift(newRating);
  saveStationRatings(ratings);

  // تحديث تقييم الفني في طاقم العمل تلقائياً
  const crew = getStationCrew();
  const techIndex = crew.findIndex((c) => c.id === rating.technicianId || c.name === rating.technicianName);
  if (techIndex !== -1) {
    const tech = crew[techIndex];
    const techRatings = ratings.filter((r) => r.technicianId === tech.id || r.technicianName === tech.name);
    const avgBehavior = techRatings.reduce((sum, r) => sum + r.behaviorRating, 0) / techRatings.length;
    const avgOverall = techRatings.reduce((sum, r) => sum + r.overallRating, 0) / techRatings.length;

    crew[techIndex] = {
      ...tech,
      averageBehaviorRating: Number(avgBehavior.toFixed(2)),
      averageOverallRating: Number(avgOverall.toFixed(2)),
      technicianPoints: tech.technicianPoints + 20, // إضافة نقاط تقدير لحسن المعاملة
      incentiveBonusEgp: tech.incentiveBonusEgp + (rating.behaviorRating >= 4 ? 25 : 0),
    };
    saveStationCrew(crew);
  }
}

export function getCustomerComplaints(): CustomerComplaint[] {
  const data = localStorage.getItem(COMPLAINTS_KEY);
  if (!data) return DEFAULT_COMPLAINTS;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_COMPLAINTS;
  }
}

export function saveCustomerComplaints(complaints: CustomerComplaint[]): void {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
}

export function addCustomerComplaint(complaint: Omit<CustomerComplaint, 'id' | 'timestamp' | 'status'>): void {
  const complaints = getCustomerComplaints();
  const newComplaint: CustomerComplaint = {
    id: 'CMP-' + Math.floor(Math.random() * 90000 + 10000),
    timestamp: new Date().toISOString(),
    status: 'جديدة',
    ...complaint,
  };
  complaints.unshift(newComplaint);
  saveCustomerComplaints(complaints);
}

export function updateCustomerComplaint(
  id: string,
  updates: Partial<CustomerComplaint>
): CustomerComplaint | null {
  const complaints = getCustomerComplaints();
  const idx = complaints.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  complaints[idx] = {
    ...complaints[idx],
    ...updates,
  };
  saveCustomerComplaints(complaints);
  return complaints[idx];
}


// دالة إثراء وحساب مقاييس الشهور والمستهدفات والانحرافات السنوية لكل محطة
export function enrichSalesRecordMetrics(record: Partial<StationSalesRecord>): StationSalesRecord {
  const monthlyBreakdown = record.monthlyBreakdown || {};
  const monthKeys = Object.keys(monthlyBreakdown);
  const monthlyTargets: Record<string, number> = { ...(record.monthlyTargets || {}) };
  const monthlyMetrics: Record<string, MonthSalesMetric> = {};

  const totalTarget = record.targetSalesM3 || record.targetMonthlySalesM3 || 100000;
  const count = monthKeys.length;

  let sumActual = 0;
  let sumTarget = 0;

  if (count > 0) {
    for (const m of monthKeys) {
      const act = monthlyBreakdown[m] || 0;
      let tgt = monthlyTargets[m];
      if (tgt === undefined || isNaN(tgt) || tgt <= 0) {
        tgt = count > 0 ? Math.round(totalTarget / count) : Math.round(act * 1.15);
      }
      monthlyTargets[m] = tgt;
      const variance = act - tgt;
      const variancePct = tgt > 0 ? Number(((variance / tgt) * 100).toFixed(1)) : 0;
      monthlyMetrics[m] = {
        actual: act,
        target: tgt,
        variance,
        variancePct,
      };
      sumActual += act;
      sumTarget += tgt;
    }
  } else {
    sumActual = record.currentSalesM3 || record.currentMonthlySalesM3 || 0;
    sumTarget = totalTarget;
  }

  const annualActual = record.annualActualM3 !== undefined && record.annualActualM3 > 0 ? record.annualActualM3 : sumActual;
  const annualTarget = record.annualTargetM3 !== undefined && record.annualTargetM3 > 0 ? record.annualTargetM3 : (sumTarget > 0 ? sumTarget : Math.round(annualActual * 1.2));
  const annualVariance = annualActual - annualTarget;
  const annualVariancePct = annualTarget > 0 ? Number(((annualVariance / annualTarget) * 100).toFixed(1)) : 0;
  const ratio = annualTarget > 0 ? Number(((annualActual / annualTarget) * 100).toFixed(1)) : 100;

  return {
    id: record.id || `SALES-${Date.now()}`,
    stationName: record.stationName || 'محطة كارجاس',
    stationCode: record.stationCode || 'CARGAS-ST',
    city: record.city || 'القاهرة',
    latitude: record.latitude,
    longitude: record.longitude,
    reportPeriodType: record.reportPeriodType || (count > 0 ? 'monthly' : 'custom'),
    periodLabel: record.periodLabel || (count > 0 ? `بيان شهري تفصيلي (${count} شهور)` : 'بيان مبيعات'),
    currentSalesM3: annualActual,
    targetSalesM3: annualTarget,
    currentMonthlySalesM3: annualActual,
    targetMonthlySalesM3: annualTarget,
    achievementRatioPct: ratio,
    allocatedBudgetEgp: record.allocatedBudgetEgp ?? 20000,
    promotionalPointsMultiplier: record.promotionalPointsMultiplier ?? (ratio < 70 ? 2.0 : ratio >= 90 ? 1.0 : 1.2),
    priorityLevel: record.priorityLevel ?? (ratio < 70 ? 'عالي جداً' : ratio >= 90 ? 'مستقر' : 'متوسط'),
    monthlyBreakdown: count > 0 ? monthlyBreakdown : undefined,
    monthlyTargets: count > 0 ? monthlyTargets : undefined,
    monthlyMetrics: count > 0 ? (record.monthlyMetrics || monthlyMetrics) : undefined,
    annualActualM3: annualActual,
    annualTargetM3: annualTarget,
    annualVarianceM3: annualVariance,
    annualVariancePct: annualVariancePct,
    dailyBreakdown: record.dailyBreakdown,
    detectedHeaders: record.detectedHeaders,
  };
}

export function getSalesRecords(): StationSalesRecord[] {
  const data = localStorage.getItem(SALES_RECORDS_KEY);
  if (data === null) return DEFAULT_SALES_RECORDS.map(enrichSalesRecordMetrics);
  try {
    const list: StationSalesRecord[] = JSON.parse(data);
    return Array.isArray(list) ? list.map(enrichSalesRecordMetrics) : [];
  } catch {
    return DEFAULT_SALES_RECORDS.map(enrichSalesRecordMetrics);
  }
}

export function saveSalesRecords(records: StationSalesRecord[]): void {
  localStorage.setItem(SALES_RECORDS_KEY, JSON.stringify(records));
}

// إدارة شيت الإكسيل الأصلي المرفوع كما هو دون أي تعديل
export function getRawSalesSheet(): RawSalesSheetData | null {
  const data = localStorage.getItem(RAW_SALES_SHEET_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveRawSalesSheet(sheetData: RawSalesSheetData | null): void {
  if (!sheetData) {
    localStorage.removeItem(RAW_SALES_SHEET_KEY);
  } else {
    localStorage.setItem(RAW_SALES_SHEET_KEY, JSON.stringify(sheetData));
  }
}

// مسح البيانات التجريبية أو المرفوعة سابقاً لتصفير الشيت
export function clearSalesAndSheetData(): void {
  localStorage.setItem(SALES_RECORDS_KEY, '[]');
  localStorage.removeItem(RAW_SALES_SHEET_KEY);
}

// استعادة البيانات النموذجية الافتراضية
export function restoreDefaultSalesData(): StationSalesRecord[] {
  const defaults = DEFAULT_SALES_RECORDS.map(enrichSalesRecordMetrics);
  saveSalesRecords(defaults);
  saveRawSalesSheet(null);
  return defaults;
}

export function getFraudLogs(): AntiFraudLog[] {
  const data = localStorage.getItem(FRAUD_LOGS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addFraudLog(log: Omit<AntiFraudLog, 'id' | 'timestamp'>): void {
  const logs = getFraudLogs();
  const newLog: AntiFraudLog = {
    id: 'LOG-' + Math.floor(Math.random() * 90000 + 10000),
    timestamp: new Date().toISOString(),
    ...log,
  };
  logs.unshift(newLog);
  localStorage.setItem(FRAUD_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
}

// حساب عدد مرات التموين من نفس المحطة ونفس الطلمبة
export function getDriverStationAndPumpFuelingCounts(
  transactions: FuelingTransaction[],
  driverId: string,
  stationName: string,
  pumpNumber?: number
): { stationCount: number; pumpCount: number } {
  const driverTx = transactions.filter((t) => t.driverId === driverId);
  const stationCount = driverTx.filter((t) => t.stationName.includes(stationName) || stationName.includes(t.stationName)).length;
  const pumpCount = pumpNumber
    ? driverTx.filter(
        (t) =>
          (t.stationName.includes(stationName) || stationName.includes(t.stationName)) &&
          t.pumpNumber === pumpNumber
      ).length
    : 0;

  return {
    stationCount: stationCount || 1,
    pumpCount: pumpCount || 1,
  };
}

// Generate 4-digit PIN for daily shift
export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// حساب المسافة الجغرافية بالكيلومتر بين نقطتين (Haversine formula)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// تحميل نموذج إكسيل لمحطات كارجاس ومراكز الخدمة
export function downloadStationsSampleExcel(): void {
  const sample = [
    {
      'اسم المحطة / المركز': 'محطة كارجاس شبرا النموذجية',
      'كود المحطة': 'CARGAS-SHUBRA-01',
      'المحافظة / المدينة': 'القاهرة',
      'العنوان التفصيلي': 'شارع شبرا الرئيسي، أمام محطة المترو',
      'النوع': 'محطة تموين غاز طبيعي', // خيارات: محطة تموين غاز طبيعي | مركز تحويل سيارات | مركز زيوت | زيوت أسفل المظلة | مركز فحص أسطوانات
      'خط العرض (Latitude)': 30.0884,
      'خط الطول (Longitude)': 31.2468,
      'رقم التليفون': '0224567890',
      'مواعيد العمل': '24 ساعة',
      'عدد المضخات': 8,
      'حالة المبيعات': 'مرتفعة', // منخفضة | متوسطة | مرتفعة
      'مضاعف نقاط الولاء': 1.0,
      'موازنة الترويج المخصصة (جنية)': 0,
    },
    {
      'اسم المحطة / المركز': 'مركز كارجاس ألماظة لتحويل السيارات',
      'كود المحطة': 'CARGAS-ALMAZA-CTR',
      'المحافظة / المدينة': 'القاهرة',
      'العنوان التفصيلي': 'طريق النصر، خلف سنترال ألماظة',
      'النوع': 'مركز تحويل سيارات',
      'خط العرض (Latitude)': 30.0921,
      'خط الطول (Longitude)': 31.3456,
      'رقم التليفون': '0222904561',
      'مواعيد العمل': '8:00 ص - 6:00 م',
      'عدد المضخات': 0,
      'حالة المبيعات': 'متوسطة',
      'مضاعف نقاط الولاء': 1.5,
      'موازنة الترويج المخصصة (جنية)': 20000,
    },
    {
      'اسم المحطة / المركز': 'محطة ومركز زيوت كارجاس الدقي',
      'كود المحطة': 'CARGAS-DOKKI-03',
      'المحافظة / المدينة': 'الجيزة',
      'العنوان التفصيلي': 'شارع التحرير، ميدان الدقي',
      'النوع': 'مركز زيوت',
      'خط العرض (Latitude)': 30.0385,
      'خط الطول (Longitude)': 31.2119,
      'رقم التليفون': '0233378901',
      'مواعيد العمل': '24 ساعة',
      'عدد المضخات': 4,
      'حالة المبيعات': 'منخفضة',
      'مضاعف نقاط الولاء': 2.0,
      'موازنة الترويج المخصصة (جنية)': 35000,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'محطات ومراكز كارجاس');
  XLSX.writeFile(wb, 'نموذج_محطات_ومراكز_كارجاس_الاحداثيات.xlsx');
}

// قراءة ملف إكسيل لمحطات كارجاس والإحداثيات
export async function parseStationsExcelFile(file: File): Promise<CargasStationLocation[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const stations: CargasStationLocation[] = rows.map((row, index) => {
          const rawType = String(row['النوع'] || row['Type'] || '');
          let facilityType: StationFacilityType = 'cng_station';
          if (rawType.includes('تحويل')) facilityType = 'conversion_center';
          else if (rawType.includes('مظلة')) facilityType = 'canopy_oil';
          else if (rawType.includes('زيوت')) facilityType = 'oil_center';
          else if (rawType.includes('فحص') || rawType.includes('أسطوان')) facilityType = 'cylinder_inspection';

          const salesStatusRaw = String(row['حالة المبيعات'] || '');
          let salesStatus: 'low' | 'medium' | 'high' = 'medium';
          if (salesStatusRaw.includes('منخفض')) salesStatus = 'low';
          else if (salesStatusRaw.includes('مرتفع')) salesStatus = 'high';

          // استخراج وتحديد أنشطة المحطة (تموين - تحويل - صيانة - زيوت - فحص اسطوانات)
          const acts: StationActivity[] = [];
          const rawActs = String(row['الأنشطة'] || row['الانشطة'] || row['الخدمات'] || row['Activities'] || '');
          if (rawActs.includes('تموين') || rawType.includes('تموين') || facilityType === 'cng_station') acts.push('تموين');
          if (rawActs.includes('تحويل') || rawType.includes('تحويل') || facilityType === 'conversion_center') acts.push('تحويل');
          if (rawActs.includes('صيانة') || rawActs.includes('صيانه') || rawType.includes('تحويل') || facilityType === 'conversion_center') acts.push('صيانة');
          if (rawActs.includes('زيوت') || rawType.includes('زيوت') || rawType.includes('مظلة') || facilityType === 'oil_center' || facilityType === 'canopy_oil') acts.push('زيوت');
          if (rawActs.includes('فحص') || rawActs.includes('اسطوان') || rawType.includes('فحص') || facilityType === 'cylinder_inspection') acts.push('فحص اسطوانات');
          if (acts.length === 0) acts.push('تموين', 'زيوت');

          return {
            id: 'ST-' + (index + 10).toString().padStart(2, '0'),
            name: row['اسم المحطة / المركز'] || row['اسم المركز ( المحطة )'] || row['الاسم'] || row['Name'] || `محطة كارجاس ${index + 1}`,
            code: row['كود المحطة'] || row['كود المركز'] || row['الكود'] || `CARGAS-${index + 10}`,
            city: row['المحافظة / المدينة'] || row['المحافظة'] || row['المدينة'] || 'القاهرة',
            address: row['العنوان التفصيلي'] || row['العنوان'] || 'طريق المحطة',
            facilityType,
            latitude: parseFloat(row['خط العرض (Latitude)'] || row['Latitude'] || row['lat'] || 30.0444),
            longitude: parseFloat(row['خط الطول (Longitude)'] || row['Longitude'] || row['lng'] || 31.2357),
            phone: String(row['رقم التليفون'] || row['Phone'] || '19058'),
            workingHours: String(row['مواعيد العمل'] || '24 ساعة'),
            pumpCount: parseInt(row['عدد المضخات']) || 6,
            servicesAvailable: [rawType || 'تموين غاز طبيعي', 'خدمات سيارات كارجاس'],
            activities: acts,
            salesVolumeStatus: salesStatus,
            promotionalPointsMultiplier: parseFloat(row['مضاعف نقاط الولاء']) || (salesStatus === 'low' ? 2.0 : 1.0),
            promotionalBudgetEgp: parseFloat(row['موازنة الترويج المخصصة (جنية)']) || (salesStatus === 'low' ? 30000 : 0),
          };
        });

        resolve(stations);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// قراءة ملف KML أو KMZ لمواقع كارجاس
export async function parseStationsKmzOrKmlFile(file: File): Promise<CargasStationLocation[]> {
  let kmlContent = '';

  if (file.name.toLowerCase().endsWith('.kmz')) {
    const zip = await JSZip.loadAsync(file);
    const kmlFile = Object.keys(zip.files).find((f) => f.toLowerCase().endsWith('.kml'));
    if (!kmlFile) throw new Error('الملف المضغوط KMZ لا يحتوي على ملف doc.kml');
    kmlContent = await zip.files[kmlFile].async('text');
  } else {
    kmlContent = await file.text();
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');
  const placemarks = Array.from(xmlDoc.getElementsByTagName('Placemark'));

  if (placemarks.length === 0) {
    throw new Error('لم يتم العثور على علامات مواقع (Placemarks) داخل ملف KMZ/KML');
  }

  const stations: CargasStationLocation[] = placemarks.map((pm, index) => {
    const name = pm.getElementsByTagName('name')[0]?.textContent?.trim() || `محطة كارجاس ${index + 1}`;
    const desc = pm.getElementsByTagName('description')[0]?.textContent?.trim() || '';
    const coordsText = pm.getElementsByTagName('coordinates')[0]?.textContent?.trim() || '';
    
    // KML coordinates are: longitude,latitude,altitude
    const [lngStr, latStr] = coordsText.split(',');
    const lng = parseFloat(lngStr) || 31.2357;
    const lat = parseFloat(latStr) || 30.0444;

    let facilityType: StationFacilityType = 'cng_station';
    if (name.includes('تحويل') || desc.includes('تحويل')) facilityType = 'conversion_center';
    else if (name.includes('مظلة') || desc.includes('مظلة')) facilityType = 'canopy_oil';
    else if (name.includes('زيوت') || desc.includes('زيوت')) facilityType = 'oil_center';
    else if (name.includes('فحص') || desc.includes('أسطوان')) facilityType = 'cylinder_inspection';

    return {
      id: 'KMZ-ST-' + (index + 1).toString().padStart(2, '0'),
      name,
      code: `CARGAS-KMZ-${index + 1}`,
      city: 'مصر',
      address: desc || 'موقع مسجل بملف KMZ',
      facilityType,
      latitude: lat,
      longitude: lng,
      phone: '19058',
      workingHours: '24 ساعة',
      pumpCount: 6,
      servicesAvailable: [facilityType === 'cng_station' ? 'تموين غاز طبيعي' : 'خدمات كارجاس المتكاملة'],
      salesVolumeStatus: 'medium',
      promotionalPointsMultiplier: 1.0,
      promotionalBudgetEgp: 15000,
    };
  });

  return stations;
}

export interface CoordinateSyncResult {
  totalSheetStations: number;
  totalWithCoords: number;
  matchedExistingCount: number;
  newAddedStationsCount: number;
  newAddedStations: CargasStationLocation[];
  allMapStationsCount: number;
  reportDetails: Array<{
    sheetStationName: string;
    stationCode?: string;
    city: string;
    latitude: number;
    longitude: number;
    isNew: boolean;
    statusText: string;
  }>;
}

// مقارنة إحداثيات الجدول مع ملف KMZ وقاعدة بيانات الخريطة وإضافة المحطات الجديدة مباشرة باللوجو وباسم المركز
export function syncSheetCoordinatesWithKmzAndMap(
  salesRecords: StationSalesRecord[],
  kmzStations?: CargasStationLocation[]
): CoordinateSyncResult {
  const currentStations = getStationLocations();
  const validRecords = salesRecords.filter(
    (r) => r.latitude !== undefined && r.longitude !== undefined && !isNaN(r.latitude) && !isNaN(r.longitude)
  );

  const updatedStations = [...currentStations];
  const newAddedStations: CargasStationLocation[] = [];
  const reportDetails: CoordinateSyncResult['reportDetails'] = [];

  let matchedExistingCount = 0;

  for (const record of validRecords) {
    const lat = record.latitude!;
    const lng = record.longitude!;

    // فحص هل المحطة مسجلة مسبقاً على الخريطة أو في ملف KMZ
    // معايير التطابق: قرب جغرافي (< 250 متر) أو تطابق كود المحطة أو تطابق الاسم الطبيعي
    const matchIndex = updatedStations.findIndex((st) => {
      const dist = calculateDistanceKm(st.latitude, st.longitude, lat, lng);
      const isClose = dist < 0.25;
      const codeMatch = Boolean(
        st.code &&
        record.stationCode &&
        st.code.trim().toLowerCase() === record.stationCode.trim().toLowerCase()
      );
      const nameMatch =
        normalizeHeaderKey(st.name) === normalizeHeaderKey(record.stationName) ||
        st.name.includes(record.stationName) ||
        record.stationName.includes(st.name);
      return isClose || codeMatch || nameMatch;
    });

    if (matchIndex >= 0) {
      matchedExistingCount++;
      const existing = updatedStations[matchIndex];
      // تحديث الإحداثيات الدقيقة من الشيت ومطابقة اسم المركز
      updatedStations[matchIndex] = {
        ...existing,
        name: record.stationName || existing.name, // تسمية المحطة بالاسم الظاهر بالجدول تحت عنوان اسم المركز
        latitude: lat,
        longitude: lng,
        salesVolumeStatus:
          record.achievementRatioPct < 70 ? 'low' : record.achievementRatioPct > 90 ? 'high' : 'medium',
        promotionalPointsMultiplier: record.promotionalPointsMultiplier || existing.promotionalPointsMultiplier || 1.0,
        promotionalBudgetEgp: record.allocatedBudgetEgp || existing.promotionalBudgetEgp || 10000,
      };
      reportDetails.push({
        sheetStationName: record.stationName,
        stationCode: record.stationCode || existing.code,
        city: record.city || existing.city,
        latitude: lat,
        longitude: lng,
        isNew: false,
        statusText: `متطابقة مع الخريطة/KMZ [${existing.name}] - تم تحديث الإحداثيات وبيانات المبيعات`,
      });
    } else {
      // محطة جديدة مرصودة في الشيت بإحداثياتها وغير موجودة في الخريطة أو KMZ!
      // إضافتها فوراً إلى الخريطة مع وضع اللوجو وتسمية المحطة بالاسم الظاهر بالجدول تحت عنوان اسم المركز
      const newStation: CargasStationLocation = {
        id: `ST-SHEET-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: record.stationName, // بالاسم الظاهر بالجدول تحت عنوان اسم المركز
        code: record.stationCode || `CARGAS-SH-${updatedStations.length + 1}`,
        city: record.city || 'القاهرة',
        address: `${record.stationName} - ${record.city || 'موقع مسجل بشيت المبيعات'}`,
        facilityType: 'cng_station',
        latitude: lat,
        longitude: lng,
        phone: '19058',
        workingHours: '24 ساعة',
        pumpCount: 6,
        servicesAvailable: ['تموين غاز طبيعي', 'زيوت كارجاس المعتمدة', 'محطة مضافة من شيت الإكسيل'],
        activities: ['تموين', 'زيوت'],
        salesVolumeStatus:
          record.achievementRatioPct < 70 ? 'low' : record.achievementRatioPct > 90 ? 'high' : 'medium',
        promotionalPointsMultiplier: record.promotionalPointsMultiplier || 1.0,
        promotionalBudgetEgp: record.allocatedBudgetEgp || 15000,
      };

      updatedStations.push(newStation);
      newAddedStations.push(newStation);
      reportDetails.push({
        sheetStationName: record.stationName,
        stationCode: record.stationCode,
        city: record.city,
        latitude: lat,
        longitude: lng,
        isNew: true,
        statusText: 'محطة جديدة مضافة فوراً إلى الخريطة باللوجو باسم المركز الظاهر بالجدول 🚀',
      });
    }
  }

  // فحص إضافي لمحطات ملف KMZ إذا تم تمريرها:
  if (kmzStations && kmzStations.length > 0) {
    for (const kmzSt of kmzStations) {
      const exists = updatedStations.some((st) => {
        const dist = calculateDistanceKm(st.latitude, st.longitude, kmzSt.latitude, kmzSt.longitude);
        return dist < 0.25 || normalizeHeaderKey(st.name) === normalizeHeaderKey(kmzSt.name);
      });
      if (!exists) {
        updatedStations.push(kmzSt);
      }
    }
  }

  saveStationLocations(updatedStations);

  return {
    totalSheetStations: salesRecords.length,
    totalWithCoords: validRecords.length,
    matchedExistingCount,
    newAddedStationsCount: newAddedStations.length,
    newAddedStations,
    allMapStationsCount: updatedStations.length,
    reportDetails,
  };
}

// تطبيع رؤوس الجداول لمطابقة المسميات بمرونة تامة
function normalizeHeaderKey(str: string): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[_\-()[\]/\\,;:]/g, ' ')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو',
  'يوليو', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'
];

// تحميل نموذج إكسيل شامل لمبيعات المحطات لتوجيه الموازنة (يدعم الشهور من يناير حتى ديسمبر والمستهدفات والانحرافات والإحداثيات)
export function downloadSalesSampleExcel(): void {
  const sample = [
    {
      'اسم المركز ( المحطة )': 'محطة كارجاس شبرا النموذجية',
      'كود المركز (المحطة)': 'CARGAS-SHUBRA-01',
      'المحافظة': 'القاهرة',
      'الاحداثيات اكس وواي': '30.0884, 31.2468',
      'يناير - فعلي (م³)': 23500,
      'يناير - مستهدف (م³)': 25000,
      'فبراير - فعلي (م³)': 24200,
      'فبراير - مستهدف (م³)': 25000,
      'مارس - فعلي (م³)': 25100,
      'مارس - مستهدف (م³)': 25000,
      'إبريل - فعلي (م³)': 23800,
      'إبريل - مستهدف (م³)': 25000,
      'مايو - فعلي (م³)': 24000,
      'مايو - مستهدف (م³)': 25000,
      'يونيو - فعلي (م³)': 24400,
      'يونيو - مستهدف (م³)': 25000,
      'يوليو - فعلي (م³)': 25300,
      'يوليو - مستهدف (م³)': 25000,
      'أغسطس - فعلي (م³)': 25600,
      'أغسطس - مستهدف (م³)': 25000,
      'سبتمبر - فعلي (م³)': 24800,
      'سبتمبر - مستهدف (م³)': 25000,
      'أكتوبر - فعلي (م³)': 25500,
      'أكتوبر - مستهدف (م³)': 25000,
      'نوفمبر - فعلي (م³)': 25800,
      'نوفمبر - مستهدف (م³)': 25000,
      'ديسمبر - فعلي (م³)': 26000,
      'ديسمبر - مستهدف (م³)': 25000,
      'المبيعات الإجمالية الحالية (م³)': 298000,
      'المبيعات المستهدفة (م³)': 300000,
      'الموازنة الترويجية الموجهة (جنية)': 15000,
      'مضاعف نقاط الولاء المقترح': 1.0,
      'مستوى الأولوية': 'مستقر',
    },
    {
      'اسم المركز ( المحطة )': 'محطة ومركز زيوت كارجاس الدقي',
      'كود المركز (المحطة)': 'CARGAS-DOKKI-03',
      'المحافظة': 'الجيزة',
      'الاحداثيات اكس وواي': '30.0385, 31.2119',
      'يناير - فعلي (م³)': 9800,
      'يناير - مستهدف (م³)': 18000,
      'فبراير - فعلي (م³)': 10200,
      'فبراير - مستهدف (م³)': 18000,
      'مارس - فعلي (م³)': 10500,
      'مارس - مستهدف (م³)': 18500,
      'إبريل - فعلي (م³)': 10100,
      'إبريل - مستهدف (م³)': 18500,
      'مايو - فعلي (م³)': 10600,
      'مايو - مستهدف (م³)': 18500,
      'يونيو - فعلي (م³)': 10800,
      'يونيو - مستهدف (م³)': 18500,
      'يوليو - فعلي (م³)': 11200,
      'يوليو - مستهدف (م³)': 18500,
      'أغسطس - فعلي (م³)': 11500,
      'أغسطس - مستهدف (م³)': 18500,
      'سبتمبر - فعلي (م³)': 11400,
      'سبتمبر - مستهدف (م³)': 18500,
      'أكتوبر - فعلي (م³)': 11800,
      'أكتوبر - مستهدف (م³)': 18500,
      'نوفمبر - فعلي (م³)': 12000,
      'نوفمبر - مستهدف (م³)': 18500,
      'ديسمبر - فعلي (م³)': 12100,
      'ديسمبر - مستهدف (م³)': 18500,
      'المبيعات الإجمالية الحالية (م³)': 132000,
      'المبيعات المستهدفة (م³)': 220000,
      'الموازنة الترويجية الموجهة (جنية)': 45000,
      'مضاعف نقاط الولاء المقترح': 2.0,
      'مستوى الأولوية': 'عالي جداً',
    },
    {
      'اسم المركز ( المحطة )': 'محطة كارجاس سموحة النموذجية',
      'كود المركز (المحطة)': 'CARGAS-ALEX-SMOUHA',
      'المحافظة': 'الإسكندرية',
      'الاحداثيات اكس وواي': '31.2156, 29.9553',
      'يناير - فعلي (م³)': 11200,
      'يناير - مستهدف (م³)': 20000,
      'فبراير - فعلي (م³)': 11800,
      'فبراير - مستهدف (م³)': 20000,
      'مارس - فعلي (م³)': 12100,
      'مارس - مستهدف (م³)': 20000,
      'إبريل - فعلي (م³)': 11900,
      'إبريل - مستهدف (م³)': 20000,
      'مايو - فعلي (م³)': 12000,
      'مايو - مستهدف (م³)': 20000,
      'يونيو - فعلي (م³)': 12000,
      'يونيو - مستهدف (م³)': 20000,
      'يوليو - فعلي (م³)': 12500,
      'يوليو - مستهدف (م³)': 20000,
      'أغسطس - فعلي (م³)': 13000,
      'أغسطس - مستهدف (م³)': 20000,
      'سبتمبر - فعلي (م³)': 12600,
      'سبتمبر - مستهدف (م³)': 20000,
      'أكتوبر - فعلي (م³)': 13200,
      'أكتوبر - مستهدف (م³)': 20000,
      'نوفمبر - فعلي (م³)': 13800,
      'نوفمبر - مستهدف (م³)': 20000,
      'ديسمبر - فعلي (م³)': 13900,
      'ديسمبر - مستهدف (م³)': 20000,
      'المبيعات الإجمالية الحالية (م³)': 148000,
      'المبيعات المستهدفة (م³)': 240000,
      'الموازنة الترويجية الموجهة (جنية)': 40000,
      'مضاعف نقاط الولاء المقترح': 2.0,
      'مستوى الأولوية': 'عالي جداً',
    },
    {
      'اسم المركز ( المحطة )': 'محطة كارجاس المعادي الجديدة - الأوتوستراد',
      'كود المركز (المحطة)': 'CARGAS-MAADI-AUTO',
      'المحافظة': 'القاهرة',
      'الاحداثيات اكس وواي': '29.9654, 31.2891',
      'يناير - فعلي (م³)': 14200,
      'يناير - مستهدف (م³)': 21500,
      'فبراير - فعلي (م³)': 14800,
      'فبراير - مستهدف (م³)': 21500,
      'مارس - فعلي (م³)': 15100,
      'مارس - مستهدف (م³)': 21500,
      'إبريل - فعلي (م³)': 15000,
      'إبريل - مستهدف (م³)': 21500,
      'مايو - فعلي (م³)': 15400,
      'مايو - مستهدف (م³)': 21500,
      'يونيو - فعلي (م³)': 15500,
      'يونيو - مستهدف (م³)': 21500,
      'يوليو - فعلي (م³)': 15800,
      'يوليو - مستهدف (م³)': 22000,
      'أغسطس - فعلي (م³)': 16100,
      'أغسطس - مستهدف (م³)': 22000,
      'سبتمبر - فعلي (م³)': 15700,
      'سبتمبر - مستهدف (م³)': 22000,
      'أكتوبر - فعلي (م³)': 16000,
      'أكتوبر - مستهدف (م³)': 22000,
      'نوفمبر - فعلي (م³)': 15900,
      'نوفمبر - مستهدف (م³)': 22000,
      'ديسمبر - فعلي (م³)': 15500,
      'ديسمبر - مستهدف (م³)': 22000,
      'المبيعات الإجمالية الحالية (م³)': 185000,
      'المبيعات المستهدفة (م³)': 260000,
      'الموازنة الترويجية الموجهة (جنية)': 30000,
      'مضاعف نقاط الولاء المقترح': 1.5,
      'مستوى الأولوية': 'متوسط',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'مبيعات المحطات والموازنة');
  XLSX.writeFile(wb, 'نموذج_مبيعات_محطات_كارجاس_والمستهدف_الشهري.xlsx');
}

// قراءة ملف إكسيل لمبيعات المحطات والتعامل مع رؤوس الجداول بمسمياتها بمرونة
export async function parseSalesExcelFile(file: File): Promise<StationSalesRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows || rows.length === 0) {
          resolve([]);
          return;
        }

        // استخراج كافة الأعمدة الأصلية الفريدة من الشيت كما هي دون أي حذف
        const allKeysSet = new Set<string>();
        rows.forEach((r) => Object.keys(r).forEach((k) => allKeysSet.add(k)));
        const rawHeaders = Array.from(allKeysSet);

        // حفظ الشيت الأصلي كما هو تماماً لتمكين العرض بنسبة 100% بنفس المسميات
        saveRawSalesSheet({
          headers: rawHeaders,
          rows: rows,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        });

        const records: StationSalesRecord[] = rows.map((row, index) => {
          const keys = Object.keys(row);

          // 1. البحث المرن عن اسم المركز / المحطة
          let stationName = '';
          for (const k of keys) {
            const norm = normalizeHeaderKey(k);
            if (
              norm.includes('اسم المركز المحطه') ||
              norm.includes('اسم المحطه المركز') ||
              norm.includes('اسم المركز') ||
              norm.includes('اسم المحطه') ||
              norm.includes('المركز المحطه') ||
              norm.includes('المحطه المركز') ||
              norm.includes('اسم الموقع') ||
              norm === 'المحطه' ||
              norm === 'المركز' ||
              norm === 'station' ||
              norm === 'center' ||
              norm === 'name' ||
              norm === 'facility'
            ) {
              if (row[k]) {
                stationName = String(row[k]).trim();
                break;
              }
            }
          }
          if (!stationName) {
            stationName = row['اسم المحطة'] || row['الاسم'] || row['Station'] || `محطة/مركز كارجاس #${index + 1}`;
          }

          // 2. كود المحطة / المركز
          let stationCode = '';
          for (const k of keys) {
            const norm = normalizeHeaderKey(k);
            if (norm.includes('كود') || norm === 'code' || norm === 'id') {
              if (row[k]) {
                stationCode = String(row[k]).trim();
                break;
              }
            }
          }

          // 3. المحافظة / المدينة
          let city = 'القاهرة';
          for (const k of keys) {
            const norm = normalizeHeaderKey(k);
            if (norm.includes('محافظه') || norm.includes('مدينه') || norm === 'city') {
              if (row[k]) {
                city = String(row[k]).trim();
                break;
              }
            }
          }

          // 4. قراءة الإحداثيات (اكس وواي)
          let latitude: number | undefined;
          let longitude: number | undefined;

          // فحص عمود مجمع (الاحداثيات اكس وواي)
          for (const k of keys) {
            const norm = normalizeHeaderKey(k);
            if (norm.includes('احداثيات') || norm.includes('coordinates') || norm.includes('coords')) {
              const val = String(row[k] || '');
              const parts = val.split(/[,;\s]+/).filter(Boolean).map((p) => parseFloat(p));
              if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                let p1 = parts[0];
                let p2 = parts[1];
                // في مصر خط العرض (Lat) بين 22 و 32، وخط الطول (Lng) بين 25 و 37
                if (p1 >= 22 && p1 <= 32 && p2 >= 25 && p2 <= 37) {
                  latitude = p1;
                  longitude = p2;
                } else if (p2 >= 22 && p2 <= 32 && p1 >= 25 && p1 <= 37) {
                  latitude = p2;
                  longitude = p1;
                } else {
                  latitude = p1;
                  longitude = p2;
                }
              }
              break;
            }
          }

          // فحص أعمدة منفصلة لـ X و Y إذا لم تكن موجودة في العمود المجمع
          if (latitude === undefined || longitude === undefined) {
            let valX: number | undefined;
            let valY: number | undefined;

            for (const k of keys) {
              const norm = normalizeHeaderKey(k);
              if (
                norm === 'اكس' ||
                norm === 'x' ||
                norm.includes('خط الطول') ||
                norm.includes('longitude') ||
                norm.includes('lng')
              ) {
                const parsed = parseFloat(row[k]);
                if (!isNaN(parsed)) valX = parsed;
              } else if (
                norm === 'واي' ||
                norm === 'y' ||
                norm.includes('خط العرض') ||
                norm.includes('latitude') ||
                norm.includes('lat')
              ) {
                const parsed = parseFloat(row[k]);
                if (!isNaN(parsed)) valY = parsed;
              }
            }

            if (valX !== undefined && valY !== undefined) {
              // تحقق من ترتيب مصر الجغرافي
              if (valY >= 22 && valY <= 32 && valX >= 25 && valX <= 37) {
                latitude = valY;
                longitude = valX;
              } else if (valX >= 22 && valX <= 32 && valY >= 25 && valY <= 37) {
                latitude = valX;
                longitude = valY;
              } else {
                latitude = valY;
                longitude = valX;
              }
            }
          }

          // 5. استخراج مبيعات ومستهدفات الشهور (يناير، فبراير، مارس، إلخ)
          const monthlyBreakdown: Record<string, number> = {};
          const monthlyTargets: Record<string, number> = {};
          let hasMonthlyColumns = false;
          let sumMonthsSales = 0;
          let sumMonthsTarget = 0;

          const monthAliases: Record<string, string> = {
            يناير: 'يناير',
            فبراير: 'فبراير',
            مارس: 'مارس',
            ابريل: 'إبريل',
            مايو: 'مايو',
            يونيو: 'يونيو',
            يوليو: 'يوليو',
            اغسطس: 'أغسطس',
            سبتمبر: 'سبتمبر',
            اكتوبر: 'أكتوبر',
            نوفمبر: 'نوفمبر',
            ديسمبر: 'ديسمبر',
          };

          for (const k of keys) {
            const norm = normalizeHeaderKey(k);
            for (const monthKey of MONTH_NAMES_AR) {
              if (norm.includes(monthKey)) {
                const val = parseFloat(row[k]);
                if (!isNaN(val)) {
                  const standardLabel = monthAliases[monthKey] || monthKey;
                  // فحص هل هذا العمود يمثل المستهدف للشهر أم المبيعات الفعلية؟
                  if (norm.includes('مستهدف') || norm.includes('هدف') || norm.includes('target')) {
                    monthlyTargets[standardLabel] = val;
                    sumMonthsTarget += val;
                  } else {
                    monthlyBreakdown[standardLabel] = val;
                    sumMonthsSales += val;
                    hasMonthlyColumns = true;
                  }
                }
                break;
              }
            }
          }

          // 6. تحديد نوع البيان (شهري، يومي، سنوي)
          let reportPeriodType: 'daily' | 'monthly' | 'yearly' | 'custom' = 'monthly';
          let periodLabel = 'بيان مبيعات شهري';

          if (hasMonthlyColumns) {
            reportPeriodType = 'monthly';
            const count = Object.keys(monthlyBreakdown).length;
            periodLabel = `بيان شهري تفصيلي (${count} شهور)`;
          } else {
            // فحص أعمدة البيان اليومي أو السنوي
            const allKeysText = keys.map(normalizeHeaderKey).join(' ');
            if (allKeysText.includes('يومي') || allKeysText.includes('يوم') || allKeysText.includes('daily')) {
              reportPeriodType = 'daily';
              periodLabel = 'بيان مبيعات يومي';
            } else if (
              allKeysText.includes('سنوي') ||
              allKeysText.includes('annual') ||
              allKeysText.includes('سنه') ||
              allKeysText.includes('202')
            ) {
              reportPeriodType = 'yearly';
              periodLabel = 'بيان مبيعات سنوي';
            }
          }

          // 7. حساب المبيعات الفعلية الحالية
          let currentSales = 0;
          if (hasMonthlyColumns && sumMonthsSales > 0) {
            currentSales = sumMonthsSales;
          }

          // فحص أعمدة صريحة للمبيعات الحالية / الإجمالية
          for (const k of keys) {
            const norm = normalizeHeaderKey(k);
            if (
              norm.includes('المبيعات الاجماليه') ||
              norm.includes('المبيعات الحاليه') ||
              norm.includes('اجمالي المبيعات') ||
              norm.includes('المبيعات الفعليه') ||
              (norm.includes('مبيعات') && !MONTH_NAMES_AR.some((m) => norm.includes(m)) && !norm.includes('مستهدف')) ||
              norm === 'current' ||
              norm === 'sales' ||
              norm === 'actual'
            ) {
              const val = parseFloat(row[k]);
              if (!isNaN(val) && val > 0) {
                currentSales = val;
                break;
              }
            }
          }
          if (currentSales === 0) currentSales = sumMonthsSales || 50000;

          // 8. حساب المبيعات المستهدفة
          let targetSales = 0;
          if (sumMonthsTarget > 0) {
            targetSales = sumMonthsTarget;
          }

          for (const k of keys) {
            const norm = normalizeHeaderKey(k);
            if (
              (norm.includes('مستهدف') || norm.includes('هدف') || norm === 'target') &&
              !MONTH_NAMES_AR.some((m) => norm.includes(m))
            ) {
              const val = parseFloat(row[k]);
              if (!isNaN(val) && val > 0) {
                targetSales = val;
                break;
              }
            }
          }
          if (targetSales === 0) {
            targetSales = Math.round(currentSales * 1.25) || 100000;
          }

          // 9. نسبة التحقيق
          const ratio = targetSales > 0 ? Number(((currentSales / targetSales) * 100).toFixed(1)) : 100;

          // 10. مستوى الأولوية والموازنة والمضاعف
          let priority: 'عالي جداً' | 'متوسط' | 'مستقر' = 'متوسط';
          let defaultBudget = 20000;
          let defaultMultiplier = 1.2;

          if (ratio < 70) {
            priority = 'عالي جداً';
            defaultBudget = 35000;
            defaultMultiplier = 2.0;
          } else if (ratio >= 90) {
            priority = 'مستقر';
            defaultBudget = 10000;
            defaultMultiplier = 1.0;
          }

          // فحص إذا كان الشيت يحتوي على قيم موازنة أو مضاعف مخصصة
          let allocatedBudget = defaultBudget;
          let pointsMultiplier = defaultMultiplier;

          for (const k of keys) {
            const norm = normalizeHeaderKey(k);
            if (norm.includes('موازنه') || norm.includes('budget')) {
              const val = parseFloat(row[k]);
              if (!isNaN(val) && val > 0) allocatedBudget = val;
            } else if (norm.includes('مضاعف') || norm.includes('multiplier')) {
              const val = parseFloat(row[k]);
              if (!isNaN(val) && val > 0) pointsMultiplier = val;
            } else if (norm.includes('اولويه') || norm.includes('priority')) {
              const val = String(row[k] || '');
              if (val.includes('عالي') || val.includes('high')) priority = 'عالي جداً';
              else if (val.includes('مستقر') || val.includes('low')) priority = 'مستقر';
            }
          }

          const rawRecord: Partial<StationSalesRecord> = {
            id: 'SALES-' + (index + 1).toString().padStart(2, '0'),
            stationName,
            stationCode: stationCode || `CARGAS-ST-${index + 1}`,
            city,
            latitude,
            longitude,
            reportPeriodType,
            periodLabel,
            currentSalesM3: currentSales,
            targetSalesM3: targetSales,
            currentMonthlySalesM3: currentSales,
            targetMonthlySalesM3: targetSales,
            achievementRatioPct: ratio,
            allocatedBudgetEgp: allocatedBudget,
            promotionalPointsMultiplier: pointsMultiplier,
            priorityLevel: priority,
            monthlyBreakdown: Object.keys(monthlyBreakdown).length > 0 ? monthlyBreakdown : undefined,
            monthlyTargets: Object.keys(monthlyTargets).length > 0 ? monthlyTargets : undefined,
            detectedHeaders: rawHeaders,
            rawRow: row,
          };

          return enrichSalesRecordMetrics(rawRecord);
        });

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// دالة مساعدة مرنة لاستخراج قيمة أي عمود أو شهر
function extractOperandValue(key: string, record: StationSalesRecord): number {
  if (!key) return 0;
  if (key === 'annualActualM3') return record.annualActualM3 ?? record.currentSalesM3 ?? 0;
  if (key === 'annualTargetM3') return record.annualTargetM3 ?? record.targetSalesM3 ?? 0;
  if (key === 'annualVarianceM3') {
    return (
      record.annualVarianceM3 ??
      ((record.annualActualM3 ?? record.currentSalesM3 ?? 0) -
        (record.annualTargetM3 ?? record.targetSalesM3 ?? 0))
    );
  }
  if (key === 'allocatedBudgetEgp') return record.allocatedBudgetEgp ?? 0;
  if (key === 'promotionalPointsMultiplier') return record.promotionalPointsMultiplier ?? 1;

  if (key.includes('_')) {
    const [monthName, metricType] = key.split('_');
    const metric = record.monthlyMetrics?.[monthName];
    if (metricType === 'target') return metric?.target ?? record.monthlyTargets?.[monthName] ?? 0;
    if (metricType === 'variance') return metric?.variance ?? 0;
    return metric?.actual ?? record.monthlyBreakdown?.[monthName] ?? 0;
  }

  if (record.monthlyMetrics && record.monthlyMetrics[key]) {
    return record.monthlyMetrics[key].actual;
  }
  if (record.monthlyBreakdown && record.monthlyBreakdown[key] !== undefined) {
    return record.monthlyBreakdown[key];
  }
  return 0;
}

// دالة حساب قيمة الخانة / العمود المخصص لمحطة معينة
export function computeCustomColumnValue(
  col: CustomComputedColumn,
  record: StationSalesRecord
): { rawValue: number; formattedText: string; isPositive?: boolean } {
  // استخراج قيمة المعامل الأول
  const val1 = extractOperandValue(col.operand1Key, record);

  // استخراج قيمة المعامل الثاني
  let val2 = 0;
  if (col.operand2Type === 'constant') {
    val2 = col.operand2Constant ?? 0;
  } else {
    val2 = extractOperandValue(col.operand2Key || '', record);
  }

  // إجراء العملية الحسابية المحددة (جمع، طرح، ضرب، قسمة، نسبة مئوية)
  let result = 0;
  switch (col.operation) {
    case 'add':
      result = val1 + val2;
      break;
    case 'subtract':
      result = val1 - val2;
      break;
    case 'multiply':
      result = val1 * val2;
      break;
    case 'divide':
      result = val2 !== 0 ? val1 / val2 : 0;
      break;
    case 'percentage':
      result = val2 !== 0 ? (val1 / val2) * 100 : 0;
      break;
    default:
      result = 0;
  }

  const rounded = Number(result.toFixed(1));
  const isPos = rounded >= 0;
  const unit = col.unit ? ` ${col.unit}` : '';

  let formattedText = '';
  if (col.displayFormat === 'signed') {
    formattedText = `${isPos ? '+' : ''}${rounded.toLocaleString()}${unit}`;
  } else if (col.displayFormat === 'percentage') {
    formattedText = `${rounded.toLocaleString()}%`;
  } else if (col.displayFormat === 'currency') {
    formattedText = `${rounded.toLocaleString()}${unit || ' ج'}`;
  } else {
    formattedText = `${rounded.toLocaleString()}${unit}`;
  }

  return { rawValue: rounded, formattedText, isPositive: isPos };
}

// دالة حساب الإجمالي العام للعمود المخصص لكافة المحطات
export function computeCorporateCustomColumnValue(
  col: CustomComputedColumn,
  records: StationSalesRecord[],
  corpActual: number,
  corpTarget: number,
  corpVariance: number
): { rawValue: number; formattedText: string; isPositive?: boolean } {
  let val1 = 0;
  if (col.operand1Key === 'annualActualM3') {
    val1 = corpActual;
  } else if (col.operand1Key === 'annualTargetM3') {
    val1 = corpTarget;
  } else if (col.operand1Key === 'annualVarianceM3') {
    val1 = corpVariance;
  } else if (col.operand1Key === 'allocatedBudgetEgp') {
    val1 = records.reduce((sum, r) => sum + (r.allocatedBudgetEgp || 0), 0);
  } else {
    // مجموع الشهر عبر كافة المحطات
    val1 = records.reduce((sum, r) => {
      const metric = r.monthlyMetrics?.[col.operand1Key];
      return sum + (metric?.actual ?? r.monthlyBreakdown?.[col.operand1Key] ?? 0);
    }, 0);
  }

  let val2 = 0;
  if (col.operand2Type === 'constant') {
    val2 = col.operand2Constant ?? 0;
  } else {
    if (col.operand2Key === 'annualActualM3') {
      val2 = corpActual;
    } else if (col.operand2Key === 'annualTargetM3') {
      val2 = corpTarget;
    } else if (col.operand2Key === 'annualVarianceM3') {
      val2 = corpVariance;
    } else if (col.operand2Key === 'allocatedBudgetEgp') {
      val2 = records.reduce((sum, r) => sum + (r.allocatedBudgetEgp || 0), 0);
    } else {
      val2 = records.reduce((sum, r) => {
        const metric = r.monthlyMetrics?.[col.operand2Key || ''];
        return sum + (metric?.actual ?? r.monthlyBreakdown?.[col.operand2Key || ''] ?? 0);
      }, 0);
    }
  }

  let result = 0;
  switch (col.operation) {
    case 'add':
      result = val1 + val2;
      break;
    case 'subtract':
      result = val1 - val2;
      break;
    case 'multiply':
      result = val1 * val2;
      break;
    case 'divide':
      result = val2 !== 0 ? val1 / val2 : 0;
      break;
    case 'percentage':
      result = val2 !== 0 ? (val1 / val2) * 100 : 0;
      break;
    default:
      result = 0;
  }

  const rounded = Number(result.toFixed(1));
  const isPos = rounded >= 0;
  const unit = col.unit ? ` ${col.unit}` : '';

  let formattedText = '';
  if (col.displayFormat === 'signed') {
    formattedText = `${isPos ? '+' : ''}${rounded.toLocaleString()}${unit}`;
  } else if (col.displayFormat === 'percentage') {
    formattedText = `${rounded.toLocaleString()}%`;
  } else if (col.displayFormat === 'currency') {
    formattedText = `${rounded.toLocaleString()}${unit || ' ج'}`;
  } else {
    formattedText = `${rounded.toLocaleString()}${unit}`;
  }

  return { rawValue: rounded, formattedText, isPositive: isPos };
}

// دالة تصدير مصفوفة الشهور والمستهدفات والانحرافات وإجماليات العام والأعمدة المخصصة إلى ملف Excel
export function exportSalesMatrixExcel(
  records: StationSalesRecord[],
  customColumns: CustomComputedColumn[] = []
): void {
  // جمع كافة الشهور المتوفرة في السجلات بترتيب زمني
  const allMonthsSet = new Set<string>();
  records.forEach((r) => {
    if (r.monthlyBreakdown) {
      Object.keys(r.monthlyBreakdown).forEach((m) => allMonthsSet.add(m));
    }
  });

  const monthOrder = MONTH_NAMES_AR.map((m) => {
    const aliasMap: Record<string, string> = {
      ابريل: 'إبريل',
      اغسطس: 'أغسطس',
      اكتوبر: 'أكتوبر',
    };
    return aliasMap[m] || m;
  }).filter((m) => allMonthsSet.has(m));

  const finalMonths = monthOrder.length > 0 ? monthOrder : Array.from(allMonthsSet);

  const rows = records.map((r) => {
    const rowObj: Record<string, any> = {
      'اسم المركز ( المحطة )': r.stationName,
      'كود المركز': r.stationCode || '',
      'المحافظة': r.city,
      'الإحداثيات (X, Y)':
        r.latitude !== undefined && r.longitude !== undefined
          ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`
          : '',
    };

    finalMonths.forEach((m) => {
      const metric = r.monthlyMetrics?.[m];
      const actual = metric?.actual ?? r.monthlyBreakdown?.[m] ?? 0;
      const target = metric?.target ?? r.monthlyTargets?.[m] ?? 0;
      const variance = metric?.variance ?? (actual - target);
      const variancePct = metric?.variancePct ?? (target > 0 ? Number(((variance / target) * 100).toFixed(1)) : 0);

      rowObj[`${m} - فعلي (م³)`] = actual;
      rowObj[`${m} - مستهدف (م³)`] = target;
      rowObj[`${m} - انحراف (م³)`] = variance;
      rowObj[`${m} - نسبة الانحراف %`] = `${variancePct > 0 ? '+' : ''}${variancePct}%`;
    });

    const annualActual = r.annualActualM3 ?? r.currentSalesM3;
    const annualTarget = r.annualTargetM3 ?? r.targetSalesM3;
    const annualVar = r.annualVarianceM3 ?? (annualActual - annualTarget);
    const annualVarPct =
      r.annualVariancePct ??
      (annualTarget > 0 ? Number(((annualVar / annualTarget) * 100).toFixed(1)) : 0);
    const achievement = annualTarget > 0 ? Number(((annualActual / annualTarget) * 100).toFixed(1)) : 100;

    rowObj['إجمالي مبيعات العام الفعلية (م³)'] = annualActual;
    rowObj['إجمالي المستهدف السنوي (م³)'] = annualTarget;
    rowObj['صافي الانحراف السنوي (م³)'] = annualVar;
    rowObj['نسبة الانحراف السنوية %'] = `${annualVarPct > 0 ? '+' : ''}${annualVarPct}%`;
    rowObj['نسبة تحقيق المستهدف السنوي %'] = `${achievement}%`;
    rowObj['حالة الأداء السنوي'] = annualVar >= 0 ? 'فائض مبيعات (+) ✔️' : 'عجز في المستهدف (-) ⚠️';
    rowObj['موازنة الترويج الموجهة (ج)'] = r.allocatedBudgetEgp;
    rowObj['مضاعف نقاط الولاء'] = `${r.promotionalPointsMultiplier}x`;

    // إضافة الخانات والأعمدة الحسابية المخصصة
    customColumns.forEach((col) => {
      const computed = computeCustomColumnValue(col, r);
      rowObj[col.name] = computed.formattedText;
    });

    return rowObj;
  });

  // إضافة صف إجمالي عام لكافة محطات الشركة
  if (rows.length > 0) {
    const totalRow: Record<string, any> = {
      'اسم المركز ( المحطة )': '★ الإجمالي العام للشركة (كافة المحطات) ★',
      'كود المركز': 'CORP-TOTAL',
      'المحافظة': 'جمهورية مصر العربية',
      'الإحداثيات (X, Y)': '—',
    };

    let totalAnnualActual = 0;
    let totalAnnualTarget = 0;

    finalMonths.forEach((m) => {
      let mActual = 0;
      let mTarget = 0;
      records.forEach((r) => {
        const metric = r.monthlyMetrics?.[m];
        mActual += metric?.actual ?? r.monthlyBreakdown?.[m] ?? 0;
        mTarget += metric?.target ?? r.monthlyTargets?.[m] ?? 0;
      });
      const mVar = mActual - mTarget;
      const mVarPct = mTarget > 0 ? Number(((mVar / mTarget) * 100).toFixed(1)) : 0;

      totalRow[`${m} - فعلي (م³)`] = mActual;
      totalRow[`${m} - مستهدف (م³)`] = mTarget;
      totalRow[`${m} - انحراف (م³)`] = mVar;
      totalRow[`${m} - نسبة الانحراف %`] = `${mVarPct > 0 ? '+' : ''}${mVarPct}%`;
    });

    records.forEach((r) => {
      totalAnnualActual += r.annualActualM3 ?? r.currentSalesM3;
      totalAnnualTarget += r.annualTargetM3 ?? r.targetSalesM3;
    });

    const totalAnnualVar = totalAnnualActual - totalAnnualTarget;
    const totalAnnualVarPct =
      totalAnnualTarget > 0 ? Number(((totalAnnualVar / totalAnnualTarget) * 100).toFixed(1)) : 0;
    const totalAchievement =
      totalAnnualTarget > 0 ? Number(((totalAnnualActual / totalAnnualTarget) * 100).toFixed(1)) : 100;

    totalRow['إجمالي مبيعات العام الفعلية (م³)'] = totalAnnualActual;
    totalRow['إجمالي المستهدف السنوي (م³)'] = totalAnnualTarget;
    totalRow['صافي الانحراف السنوي (م³)'] = totalAnnualVar;
    totalRow['نسبة الانحراف السنوية %'] = `${totalAnnualVarPct > 0 ? '+' : ''}${totalAnnualVarPct}%`;
    totalRow['نسبة تحقيق المستهدف السنوي %'] = `${totalAchievement}%`;
    totalRow['حالة الأداء السنوي'] = totalAnnualVar >= 0 ? 'فائض عام (+)' : 'عجز عام (-)';
    totalRow['موازنة الترويج الموجهة (ج)'] = records.reduce((s, r) => s + r.allocatedBudgetEgp, 0);
    totalRow['مضاعف نقاط الولاء'] = '—';

    // حساب إجماليات الخانات المخصصة لصف الإجمالي العام
    customColumns.forEach((col) => {
      const corpVal = computeCorporateCustomColumnValue(
        col,
        records,
        totalAnnualActual,
        totalAnnualTarget,
        totalAnnualVar
      );
      totalRow[col.name] = corpVal.formattedText;
    });

    rows.push(totalRow);
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'مصفوفة الشهور والانحرافات');
  XLSX.writeFile(wb, 'مصفوفة_مبيعات_وانحرافات_محطات_كارجاس_السنوية.xlsx');
}

// قراءة شيت أطقم العمل
export function downloadCrewSampleExcel(): void {
  const sampleData = [
    {
      'الاسم بالكامل': 'محمود الشناوي',
      'الدور الوظيفي': 'فني تموين',
      'رقم الواتساب (مع كود الدولة)': '201098765432',
      'المحطة': 'محطة كارجاس شبرا',
    },
    {
      'الاسم بالكامل': 'إبراهيم عبد الله مرعي',
      'الدور الوظيفي': 'رئيس وردية',
      'رقم الواتساب (مع كود الدولة)': '201123456789',
      'المحطة': 'محطة كارجاس شبرا',
    },
    {
      'الاسم بالكامل': 'م. عصام المنشاوي',
      'الدور الوظيفي': 'مشرف محطة',
      'رقم الواتساب (مع كود الدولة)': '201234567890',
      'المحطة': 'محطة كارجاس شبرا',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'طاقم المحطة');
  XLSX.writeFile(wb, 'نموذج_طاقم_محطات_كارجاس.xlsx');
}

export async function parseCrewExcelFile(file: File): Promise<TechnicianCrewMember[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const newCrew: TechnicianCrewMember[] = rows.map((row, index) => {
          const name = row['الاسم بالكامل'] || row['الاسم'] || row['Name'] || `فني ${index + 1}`;
          const role = (row['الدور الوظيفي'] || row['الوظيفة'] || row['Role'] || 'فني تموين') as any;
          const rawPhone = String(row['رقم الواتساب (مع كود الدولة)'] || row['رقم الواتساب'] || row['Phone'] || '');
          const cleanPhone = rawPhone.replace(/\D/g, '');
          const stationName = row['المحطة'] || row['Station'] || 'محطة كارجاس';

          return {
            id: 'TECH-' + (index + 10).toString().padStart(2, '0'),
            name,
            role,
            phone: cleanPhone.startsWith('01') ? '2' + cleanPhone : cleanPhone || '201000000000',
            stationName,
            dailyPin: generateRandomPin(),
            pinGeneratedDate: new Date().toISOString().slice(0, 10),
            isShiftActive: false,
            totalFuelingsToday: 0,
            totalMetersToday: 0,
            totalAmountToday: 0,
            technicianPoints: 300,
            totalCustomersServed: 0,
            averageBehaviorRating: 5.0,
            averageOverallRating: 5.0,
            rankTitle: 'فني كارجاس معتمد',
            incentiveBonusEgp: 300,
          };
        });

        resolve(newCrew);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// نظام حفظ النسخة الحالية واسترجاع النسخة الكلاسيكية السابقة (Snapshot & Rollback)
export function saveCurrentStateSnapshot(): void {
  const fullSnapshot = {
    timestamp: new Date().toISOString(),
    config: getAppConfig(),
    driver: getDriverProfile(),
    crew: getStationCrew(),
    stations: getStationLocations(),
    ratings: getStationRatings(),
    complaints: getCustomerComplaints(),
    sales: getSalesRecords(),
  };
  localStorage.setItem(BACKUP_V1_KEY, JSON.stringify(fullSnapshot));
}

export function restoreClassicV1Snapshot(): boolean {
  try {
    // Reset to pure default classic state
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem(STATIONS_LOCATIONS_KEY);
    localStorage.removeItem(RATINGS_KEY);
    localStorage.removeItem(COMPLAINTS_KEY);
    localStorage.removeItem(SALES_RECORDS_KEY);
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// إدارة الخانات والأعمدة المخصصة لشيت المبيعات
// ==========================================
export function getCustomSalesColumns(): CustomComputedColumn[] {
  const config = getAppConfig();
  return config.customSalesColumns || DEFAULT_CUSTOM_COLUMNS;
}

export function saveCustomSalesColumn(column: CustomComputedColumn): void {
  const config = getAppConfig();
  const current = config.customSalesColumns ? [...config.customSalesColumns] : [...DEFAULT_CUSTOM_COLUMNS];
  const existingIndex = current.findIndex((c) => c.id === column.id);
  if (existingIndex >= 0) {
    current[existingIndex] = column;
  } else {
    current.push(column);
  }
  saveAppConfig({ ...config, customSalesColumns: current });
}

export function deleteCustomSalesColumn(columnId: string): void {
  const config = getAppConfig();
  const current = config.customSalesColumns ? [...config.customSalesColumns] : [...DEFAULT_CUSTOM_COLUMNS];
  const filtered = current.filter((c) => c.id !== columnId);
  saveAppConfig({ ...config, customSalesColumns: filtered });
}

// ==========================================
// إدارة الحملات الترويجية والمسابقات وبانر العروض
// ==========================================
export function getPromotionalCampaigns(): PromotionalCampaign[] {
  const config = getAppConfig();
  return config.promotionalCampaigns || DEFAULT_PROMOTIONAL_CAMPAIGNS;
}

export function savePromotionalCampaign(campaign: PromotionalCampaign): void {
  const config = getAppConfig();
  const current = config.promotionalCampaigns ? [...config.promotionalCampaigns] : [...DEFAULT_PROMOTIONAL_CAMPAIGNS];
  const existingIndex = current.findIndex((c) => c.id === campaign.id);
  if (existingIndex >= 0) {
    current[existingIndex] = campaign;
  } else {
    current.unshift(campaign);
  }
  saveAppConfig({ ...config, promotionalCampaigns: current });
}

export function savePromotionalCampaigns(campaigns: PromotionalCampaign[]): void {
  const config = getAppConfig();
  saveAppConfig({ ...config, promotionalCampaigns: campaigns });
}

export function deletePromotionalCampaign(campaignId: string): void {
  const config = getAppConfig();
  const current = config.promotionalCampaigns ? [...config.promotionalCampaigns] : [...DEFAULT_PROMOTIONAL_CAMPAIGNS];
  const filtered = current.filter((c) => c.id !== campaignId);
  saveAppConfig({ ...config, promotionalCampaigns: filtered });
}

export function togglePromotionalCampaignActive(campaignId: string): void {
  const config = getAppConfig();
  const current = config.promotionalCampaigns ? [...config.promotionalCampaigns] : [...DEFAULT_PROMOTIONAL_CAMPAIGNS];
  const updated = current.map((c) => (c.id === campaignId ? { ...c, isActive: !c.isActive } : c));
  saveAppConfig({ ...config, promotionalCampaigns: updated });
}

// محرك صياغة الأفكار بالذكاء الاصطناعي وترجمتها لنقاط ومكافأة بالموازنة
export async function aiFormulateCampaignCopy(params: {
  rawIdea: string;
  category: PromotionalCampaign['category'];
  allocatedBudgetItemEgp: number;
  targetDriversCount: number;
  costPerPointEgp: number;
}): Promise<Partial<PromotionalCampaign>> {
  // حساب معايير النقاط والمكافأة بدقة مالية متوافقة مع موازنة الشركة
  const costPerPoint = params.costPerPointEgp > 0 ? params.costPerPointEgp : 0.35;
  const targetCount = params.targetDriversCount > 0 ? params.targetDriversCount : 500;
  const budgetPerDriver = params.allocatedBudgetItemEgp / targetCount;
  // عدد النقاط = نصيب العميل من الموازنة ÷ تكلفة النقطة بالجنية
  const pointsReward = Math.max(25, Math.round(budgetPerDriver / costPerPoint));
  const financialEquivalentEgp = Number((pointsReward * costPerPoint).toFixed(1));

  const idea = params.rawIdea.trim();
  let title = '';
  let subtitle = '';
  let badge = '';
  let aiGeneratedCopy = '';
  let explanationOfLoyalty = '';
  let buttonText = 'فول واكسب الآن ⛽';
  let bannerGradient = 'from-blue-900 via-indigo-900 to-slate-900';
  let icon = 'Trophy';

  if (params.category === 'مسابقة') {
    title = `تحدي كارجاس: ${idea || 'فول سيارتك بالغاز'} واكسب ${pointsReward} نقطة هدية!`;
    subtitle = `فرصة حصرية لكل أبطال الطريق: فول غاز طبيعي واستلم مكافأة نقدية فورية في محفظتك بقيمة ${financialEquivalentEgp} جنيه!`;
    badge = 'مسابقة نشطة 🏆';
    aiGeneratedCopy = `يا صاحب الطريق والجدعنة! بمناسبة مسابقة كارجاس الجديدة، كل تفويلة غاز طبيعي بتدخلك سحب فوري على ${pointsReward} نقطة ولاء (تعادل ${financialEquivalentEgp} ج) تنزل في رصيدك لحظياً تقدر تصرفها في أي محطة أو مركز زيوت!`;
    explanationOfLoyalty = 'برنامج ولاء كارجاس بيقدر تعبك وشغلك: كل متر غاز طبيعي بتمونه بيتحول لنقاط دهب، وفر 60% من مصاريف البنزين واستمتع بمكافآت شهرية وأمتار مجانية.';
    buttonText = 'اشترك في التحدي الآن 🏆';
    bannerGradient = 'from-amber-900 via-yellow-900 to-slate-950';
    icon = 'Trophy';
  } else if (params.category === 'مضاعفة نقاط') {
    title = `مضاعفة النقاط 2X: ${idea || 'عرض خاص لمحطات كارجاس'}`;
    subtitle = `ضاعف مكافآتك واحصل على ${pointsReward} نقطة ولاء تعادل ${financialEquivalentEgp} جنيه مباشرة!`;
    badge = 'نقاط مضاعفة 2X ⭐';
    aiGeneratedCopy = `عرض ما يتعوضش! فول غازك وغير زيتك في محطاتنا المحددة واستمتع بضعف النقاط على كل متر، يعني بتوفر من ناحية وتكسب نقاط أسرع بكتير من ناحية تانية!`;
    explanationOfLoyalty = 'برنامج كارجاس بيترجم وفاءك لأموال وخدمات حقيقية: النقاط تتجمع في كارتك الذهبي وتستبدلها بخصومات زيوت وفلاتر وكشف أسطوانات مجاني.';
    buttonText = 'أقرب محطة مضاعفة 📍';
    bannerGradient = 'from-emerald-950 via-teal-900 to-slate-900';
    icon = 'Sparkles';
  } else if (params.category === 'عرض ترويجي') {
    title = `عرض كارجاس المميز: ${idea || 'توفير استثنائي وبونص نقاط'}`;
    subtitle = `وفر أكتر من 60% من تكلفة البنزين واحصل على بونص ترحيبي ${pointsReward} نقطة ولاء (${financialEquivalentEgp} ج)!`;
    badge = 'عرض حصري 🔥';
    aiGeneratedCopy = `احسبها صح ووفّر للمستقبل! حول عربيتك للغاز الطبيعي أو التزم بتموينك مع كارجاس واستفاد من خصومات فورية ونقاط مكافأة ${pointsReward} نقطة تعادل ${financialEquivalentEgp} جنيه جاهزة للاستبدال!`;
    explanationOfLoyalty = 'مع كل لتر بنزين بتوفره بتدفع أقل بكتير في الغاز الطبيعي، ونقاط كارجاس للولاء بتضمنلك صيانة دورية ومزايا مستمرة على مدار السنة.';
    buttonText = 'استفد من العرض 🚗';
    bannerGradient = 'from-blue-950 via-cyan-900 to-slate-900';
    icon = 'Zap';
  } else if (params.category === 'خصم خدمات') {
    title = `خصم على الزيوت والصيانة + ${pointsReward} نقطة ولاء!`;
    subtitle = `خدمات زيوت كارجاس المعتمدة أسفل المظلة وفحص الأسطوانات بأعلى جودة وأفضل سعر.`;
    badge = 'خصم خدمات 🔧';
    aiGeneratedCopy = `عربيتك في أيد أمينة مع مهندسي وفنيي كارجاس! غير زيت محركك واعمل فحص شامل لأسطوانة الغاز مع كاش باك بنقاط الولاء بقيمة ${financialEquivalentEgp} ج.`;
    explanationOfLoyalty = 'كارت كارجاس الذهبي مش مجرد كارت، ده شريكك في الصيانة والتوفير وتأمين رحلاتك اليومية بأعلى معايير السلامة.';
    buttonText = 'مراكز الخدمة والصيانة 🔧';
    bannerGradient = 'from-violet-950 via-purple-900 to-slate-900';
    icon = 'Shield';
  } else {
    title = `تعرف على برنامج كارجاس للولاء واستلم ${pointsReward} نقطة!`;
    subtitle = `كيف تحول كل متر غاز طبيعي إلى رصيد وهدايا وخصومات نقدية فورية.`;
    badge = 'برنامج الولاء 💎';
    aiGeneratedCopy = `كارجاس معاك في كل مشوار! الغاز الطبيعي هو الحل الاقتصادي الذكي اللي بيوفرلك أكتر من 60%، وفوق ده كارجاس بتكافئك بنقاط ولاء على كل تفويلة تقدر تستبدلها بزيوت وأمتار وصيانة مجانية.`;
    explanationOfLoyalty = 'نظام ولاء كارجاس شفاف وعادل: 1 متر غاز = 1 نقطة ولاء، مع فرص مضاعفة النقاط في المحطات النموذجية والمسابقات الأسبوعية.';
    buttonText = 'اكتشف بنك الهدايا 🎁';
    bannerGradient = 'from-slate-900 via-blue-950 to-indigo-950';
    icon = 'Gift';
  }

  return {
    title,
    subtitle,
    category: params.category,
    badge,
    pointsReward,
    financialEquivalentEgp,
    allocatedBudgetItemEgp: params.allocatedBudgetItemEgp,
    targetDriversCount: targetCount,
    rawIdea: params.rawIdea,
    aiGeneratedCopy,
    explanationOfLoyalty,
    buttonText,
    buttonAction: params.category === 'مضاعفة نقاط' ? 'navigate_map' : 'view_rewards',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    isActive: true,
    bannerGradient,
    icon,
  };
}

// ==========================================
// إدارة بنك الأفكار والهدايا لمدير النظام
// ==========================================
export function getIdeasBank(): IdeaBankItem[] {
  const config = getAppConfig();
  return config.ideasBank || DEFAULT_IDEAS_BANK;
}

export function saveIdeaBankItem(item: IdeaBankItem): void {
  const config = getAppConfig();
  const current = config.ideasBank ? [...config.ideasBank] : [...DEFAULT_IDEAS_BANK];
  const idx = current.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    current[idx] = item;
  } else {
    current.unshift(item);
  }
  saveAppConfig({ ...config, ideasBank: current });
}

export function deleteIdeaBankItem(itemId: string): void {
  const config = getAppConfig();
  const current = config.ideasBank ? [...config.ideasBank] : [...DEFAULT_IDEAS_BANK];
  const filtered = current.filter((i) => i.id !== itemId);
  saveAppConfig({ ...config, ideasBank: filtered });
}

// ==========================================
// نظام الذكاء الاصطناعي لتحري دقة تسعير الهدايا وحساب الموازنة والنقاط
// ==========================================
export interface AiAuditRewardParams {
  giftName: string;
  estimatedEgpValue: number;
  category: RewardItem['category'];
  targetParticipantsCount: number;
  costPerPointEgp: number;
  gasPricePerMeter: number;
}

export interface AiAuditRewardResult {
  verifiedFairPriceEgp: number;
  pointsCost: number;
  freeMetersEquivalent: number;
  totalRequiredBudgetEgp: number;
  totalPointsBudget: number;
  pricingStatus: 'سعر عادل ومناسب' | 'مبالغ فيه قليلاً' | 'أقل من السوق (فرصة ممتازة)' | 'يتطلب مراجعة المورد';
  aiAuditNotes: string;
  marketingTitle: string;
  marketingDescription: string;
  valueText: string;
  icon: string;
}

export async function aiAuditAndGenerateReward(
  params: AiAuditRewardParams
): Promise<AiAuditRewardResult> {
  // محاكاة معالجة الذكاء الاصطناعي (مُعِين)
  await new Promise((r) => setTimeout(r, 450));

  const rawName = params.giftName.trim();
  const inputPrice = Math.max(10, Number(params.estimatedEgpValue) || 100);
  const costPerPoint = Math.max(0.1, params.costPerPointEgp || 0.35);
  const gasPrice = Math.max(5, params.gasPricePerMeter || 13);
  const targetCount = Math.max(1, params.targetParticipantsCount || 100);

  // معايير الفحص المقارن مع السوق المحلي في قطاع الغاز والسيارات
  let benchmarkPrice = inputPrice;
  let categoryIcon = 'Gift';
  let pricingStatus: AiAuditRewardResult['pricingStatus'] = 'سعر عادل ومناسب';

  const nameNorm = rawName.toLowerCase();
  const cat = String(params.category || '');
  if (nameNorm.includes('زيت') || cat === 'oil') {
    benchmarkPrice = 400; // متوسط تغيير زيت 5000-10000 كم
    categoryIcon = 'Droplet';
  } else if (nameNorm.includes('بوجيه') || cat === 'spark_plugs' || cat === 'maintenance') {
    benchmarkPrice = 450; // صيانة أو طقم بوجيهات
    categoryIcon = 'Zap';
  } else if (nameNorm.includes('فحص') || cat === 'inspection') {
    benchmarkPrice = 300; // فحص أسطوانة وصمامات أمان
    categoryIcon = 'ShieldCheck';
  } else if (nameNorm.includes('غسيل') || cat === 'car_wash' || cat === 'services_goods') {
    benchmarkPrice = 150; // غسيل كيماوي وصالون
    categoryIcon = 'Sparkles';
  } else if (cat === 'discount_coupon' || cat === 'discount' || cat === 'third_party_discount') {
    categoryIcon = 'Tag';
    benchmarkPrice = inputPrice;
  } else if (nameNorm.includes('شاحن') || nameNorm.includes('حامل') || cat === 'merchandise') {
    benchmarkPrice = 280;
    categoryIcon = 'Gift';
  }

  // فحص الفارق السعري
  const priceDiffPct = ((inputPrice - benchmarkPrice) / (benchmarkPrice || 1)) * 100;
  if (priceDiffPct > 35) {
    pricingStatus = 'مبالغ فيه قليلاً';
  } else if (priceDiffPct < -25) {
    pricingStatus = 'أقل من السوق (فرصة ممتازة)';
  } else {
    pricingStatus = 'سعر عادل ومناسب';
  }

  const verifiedFairPriceEgp = inputPrice;
  const pointsCost = Math.max(15, Math.round(verifiedFairPriceEgp / costPerPoint));
  const freeMetersEquivalent = 0;
  const totalRequiredBudgetEgp = Math.round(verifiedFairPriceEgp * targetCount);
  const totalPointsBudget = pointsCost * targetCount;

  // تقرير التحري والتدقيق المالي الذكي من مستشار الأعمال "معين" (يعمل على نظام الهدايا وكوبونات الشركاء)
  const aiAuditNotes = `تحليل استشاري ذكي من "مُعِين":
• تقييم التسعير السوقي: تم فحص قيمة [${rawName}] المقدرة بـ (${verifiedFairPriceEgp} جنيه) في السوق المصري لخدمات السيارات والشركاء التجاريين، والتقييم: [${pricingStatus}].
• معادلة احتساب النقاط: وفقاً لتكلفة النقطة بالموازنة (${costPerPoint} ج/نقطة)، تعادل هذه الهدية (${pointsCost} نقطة ولاء) لتعويض التكلفة بدقة بدون أي عجز مالي.
• نظام المكافآت المعتمد: منتج عيني / كوبون خصم وشراكة تجارية معتمدة لدى شبكة محطات كارجاس والشركاء التجاريين بقيمة (${verifiedFairPriceEgp} ج).
• الجدوى والموازنة: لتوزيع هذه الهدية على (${targetCount} عميل مشارك)، يلزم مخصص مالي بقيمة (${totalRequiredBudgetEgp.toLocaleString()} جنية) تعادل (${totalPointsBudget.toLocaleString()} نقطة من بنك الهدايا).
• توصية لوكا ووضاح: هدية متميزة وجذابة تخفف من الأعباء التشغيلية وتزيد من ولاء السائق وتردده الدائم على محطات كارجاس!`;

  const marketingTitle = `${rawName} (هدية معتمدة من كارجاس)`;
  const marketingDescription = `استبدل ${pointsCost} نقطة ولاء مجمعة في كارتك الذهبي واحصل فوراً على ${rawName} بقيمة ${verifiedFairPriceEgp} جنيه صالحة لدى كارجاس والشركاء المعتمدين.`;
  const valueText = `قيمة ${verifiedFairPriceEgp} جنيه هدية عينية`;

  return {
    verifiedFairPriceEgp,
    pointsCost,
    freeMetersEquivalent,
    totalRequiredBudgetEgp,
    totalPointsBudget,
    pricingStatus,
    aiAuditNotes,
    marketingTitle,
    marketingDescription,
    valueText,
    icon: categoryIcon,
  };
}

// ==================== بيان وسجل كشوفات الورادي المعتمدة ====================

const SHIFT_ROSTERS_KEY = 'cargas_approved_shift_rosters';
const REGISTERED_DRIVERS_PHONE_KEY = 'cargas_registered_drivers_directory';
const TECH_DEVICE_SESSIONS_KEY = 'cargas_technician_device_sessions';
const DEVICE_ID_KEY = 'cargas_unique_device_id';

export const DEFAULT_APPROVED_ROSTERS: ApprovedShiftRosterRecord[] = [
  {
    id: 'ROSTER-2026-001',
    technicianId: 'TECH-01',
    technicianName: 'محمود الشناوي',
    technicianPhone: '01011223344',
    technicianRole: 'فني تموين أول',
    shiftType: 'صباحية (08:00 ص - 04:00 م)',
    stationName: 'محطة كارجاس شبرا النموذجية',
    stationCode: 'CARGAS-SHUBRA-01',
    dailyPin: '7391',
    approvedBySupervisorName: 'م. عصام المنشاوي (مشرف المحطة)',
    approvedAt: '2026-10-28T08:00:15.000Z',
    formattedApprovedAt: '2026-10-28 08:00:15 ص',
    isChatDispatched: true,
    status: 'active',
    notes: 'تم فحص العدادات وتفعيل الوردية الصباحية بنجاح.',
  },
  {
    id: 'ROSTER-2026-002',
    technicianId: 'TECH-02',
    technicianName: 'إبراهيم عبد الله مرعي',
    technicianPhone: '01155667788',
    technicianRole: 'فني تموين',
    shiftType: 'مسائية (04:00 م - 12:00 ص)',
    stationName: 'محطة كارجاس شبرا النموذجية',
    stationCode: 'CARGAS-SHUBRA-01',
    dailyPin: '8402',
    approvedBySupervisorName: 'م. عصام المنشاوي (مشرف المحطة)',
    approvedAt: '2026-10-27T16:00:10.000Z',
    formattedApprovedAt: '2026-10-27 04:00:10 م',
    isChatDispatched: true,
    status: 'completed',
    notes: 'تمت مطابقة عدادات الإغلاق وتسليم النقدية للإدارة المالية.',
  },
];

export function getApprovedShiftRosters(): ApprovedShiftRosterRecord[] {
  try {
    const raw = localStorage.getItem(SHIFT_ROSTERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading shift rosters:', e);
  }
  return DEFAULT_APPROVED_ROSTERS;
}

export function saveApprovedShiftRosters(records: ApprovedShiftRosterRecord[]): void {
  try {
    localStorage.setItem(SHIFT_ROSTERS_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('cargas_roster_updated', { detail: records }));
  } catch (e) {
    console.error('Error saving shift rosters:', e);
  }
}

export function addApprovedShiftRoster(record: ApprovedShiftRosterRecord): void {
  const all = getApprovedShiftRosters();
  const updated = [record, ...all];
  saveApprovedShiftRosters(updated);
}

// ==================== عدم السماح بتكرار رقم التليفون للعميل ====================

export interface RegisteredDriverEntry {
  phone: string;
  driverId: string;
  name: string;
  carPlate: string;
  registeredAt: string;
}

export function getRegisteredDriversDirectory(): RegisteredDriverEntry[] {
  try {
    const raw = localStorage.getItem(REGISTERED_DRIVERS_PHONE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading driver directory:', e);
  }
  // Initialize with default driver profile
  const defaultDriver = getDriverProfile();
  return [
    {
      phone: defaultDriver.phone.replace(/\D/g, ''),
      driverId: defaultDriver.id,
      name: defaultDriver.name,
      carPlate: defaultDriver.carPlate,
      registeredAt: defaultDriver.registeredAt || new Date().toISOString(),
    },
  ];
}

export function isCustomerPhoneRegistered(rawPhone: string): {
  isRegistered: boolean;
  driver?: RegisteredDriverEntry;
} {
  const clean = rawPhone.replace(/\D/g, '');
  if (!clean || clean.length < 8) return { isRegistered: false };
  const all = getRegisteredDriversDirectory();
  const found = all.find((d) => d.phone === clean || d.phone.endsWith(clean) || clean.endsWith(d.phone));
  if (found) {
    return { isRegistered: true, driver: found };
  }
  return { isRegistered: false };
}

export function registerCustomerPhone(
  rawPhone: string,
  driverId: string,
  name: string,
  carPlate: string
): void {
  const clean = rawPhone.replace(/\D/g, '');
  const all = getRegisteredDriversDirectory();
  const filtered = all.filter((d) => d.phone !== clean && d.driverId !== driverId);
  const updated: RegisteredDriverEntry[] = [
    {
      phone: clean,
      driverId,
      name,
      carPlate,
      registeredAt: new Date().toISOString(),
    },
    ...filtered,
  ];
  try {
    localStorage.setItem(REGISTERED_DRIVERS_PHONE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving driver directory:', e);
  }
}

// ==================== قفل جلسة الفني على جهاز واحد لمنع التكرار ====================

export function getOrCreateDeviceId(): string {
  try {
    let devId = localStorage.getItem(DEVICE_ID_KEY);
    if (!devId) {
      devId = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem(DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch {
    return 'DEV-FALLBACK-101';
  }
}

export function getTechnicianDeviceSessions(): Record<string, TechnicianDeviceSession> {
  try {
    const raw = localStorage.getItem(TECH_DEVICE_SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading technician sessions:', e);
  }
  return {};
}

export function checkTechnicianSessionDevice(
  rawPhone: string,
  techId: string
): {
  allowed: boolean;
  activeSession?: TechnicianDeviceSession;
  isSameDevice: boolean;
  message?: string;
} {
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const currentDevId = getOrCreateDeviceId();
  const sessions = getTechnicianDeviceSessions();
  
  const existing = sessions[cleanPhone] || Object.values(sessions).find((s) => s.techId === techId && s.isActive);
  
  if (!existing || !existing.isActive) {
    return { allowed: true, isSameDevice: true };
  }

  // If session is older than 14 hours, auto expire
  const sessionAgeMs = Date.now() - new Date(existing.loginTime).getTime();
  if (sessionAgeMs > 14 * 3600 * 1000) {
    return { allowed: true, isSameDevice: true };
  }

  const isSame = existing.deviceId === currentDevId;
  if (isSame) {
    return { allowed: true, isSameDevice: true, activeSession: existing };
  }

  return {
    allowed: false,
    isSameDevice: false,
    activeSession: existing,
    message: `⛔ تنبيه أمان صارم: هذا الرقم (${rawPhone}) مسجل به وردية نشطة بالفعل من جهاز آخر (كود الجهاز: ${existing.deviceId}) بتاريخ ${new Date(existing.loginTime).toLocaleTimeString('ar-EG')}. لا يُسمح بتشغيل التطبيق لنفس الفني من أكثر من جهاز في وقت واحد لمنع التلاعب.`,
  };
}

export function recordTechnicianDeviceLogin(
  rawPhone: string,
  techId: string,
  techName: string
): TechnicianDeviceSession {
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const deviceId = getOrCreateDeviceId();
  const sessions = getTechnicianDeviceSessions();

  const newSession: TechnicianDeviceSession = {
    phone: cleanPhone,
    techId,
    techName,
    deviceId,
    loginTime: new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
    isActive: true,
  };

  sessions[cleanPhone] = newSession;
  try {
    localStorage.setItem(TECH_DEVICE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Error recording tech device session:', e);
  }
  return newSession;
}

export function terminateTechnicianDeviceSession(rawPhone: string): void {
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const sessions = getTechnicianDeviceSessions();
  if (sessions[cleanPhone]) {
    sessions[cleanPhone].isActive = false;
    try {
      localStorage.setItem(TECH_DEVICE_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error clearing tech device session:', e);
    }
  }
}

// ==================== نظام التحكم والتثبيت الدائم للوجوهات المحطات على الخريطة ====================

export const MASTER_STATION_MAP_LOGO_KEY = 'cargas_master_station_map_logo_permanent';
export const MASTER_MAP_LOGO_EVENT = 'cargas_map_logo_updated';

// لوجو كارجاس الرسمي المعتمد عالي الدقة (SVG Data URI) لضمان عدم تلف الصورة مطلقاً
export const OFFICIAL_CARGAS_VECTOR_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="cargasGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#cargasGreenGrad)" />
  <circle cx="50" cy="50" r="42" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="4 2" />
  <!-- Gas Flame Emblem -->
  <path d="M50 18 C56 28 68 38 68 53 C68 64 59 73 49 73 C39 73 31 64 31 53 C31 43 40 32 46 25 C45 32 48 37 52 38 C53 32 52 24 50 18 Z" fill="url(#flameGrad)" />
  <ellipse cx="49" cy="58" rx="8" ry="12" fill="#ffffff" opacity="0.9" />
  <!-- Text Label -->
  <text x="50" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#fef08a" text-anchor="middle" letter-spacing="1.5">CARGAS</text>
</svg>
`)}`;

export interface MasterLogoPreset {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  badgeText: string;
  accentColor: string;
}

export const MASTER_MAP_LOGO_PRESETS: MasterLogoPreset[] = [
  {
    id: 'cargas_official',
    title: 'شعار كارجاس الرسمي المعتمد (NGV)',
    subtitle: 'الشعار الأخضر والذهبي الأصلي لشركة الغاز الطبيعي للسيارات',
    url: OFFICIAL_CARGAS_VECTOR_LOGO,
    badgeText: 'CARGAS NGV',
    accentColor: '#059669',
  },
  {
    id: 'cargas_shell',
    title: 'كارجاس وشريك الزيوت شل (Shell CNG)',
    subtitle: 'زيوت شل المعتمدة وهليكس الترا لمحركات الغاز',
    url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=240&q=80',
    badgeText: 'SHELL • CARGAS',
    accentColor: '#d97706',
  },
  {
    id: 'cargas_bp',
    title: 'كارجاس وشريك الزيوت العالمي BP Castrol',
    subtitle: 'شراكة كارجاس وكاسترول لخدمات أسفل المظلة',
    url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=240&q=80',
    badgeText: 'BP • كارجاس',
    accentColor: '#16a34a',
  },
  {
    id: 'cargas_total',
    title: 'كارجاس وتوتال إنرجيز (TotalEnergies)',
    subtitle: 'محطات كارجاس المشتركة مع توتال إنرجيز',
    url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=240&q=80',
    badgeText: 'TOTAL • كارجاس',
    accentColor: '#dc2626',
  },
  {
    id: 'eco_flame',
    title: 'شعلة الغاز الطبيعي البيئية النظيفة (ECO Flame)',
    subtitle: 'رمز الوقود النظيف والصديق للبيئة والتوفير الاقتصادي',
    url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=240&q=80',
    badgeText: 'ECO CNG',
    accentColor: '#047857',
  },
  {
    id: 'royal_blue_cargas',
    title: 'كارجاس الأزرق الكحلي الملكي (طريقنا واحد)',
    subtitle: 'الهوية الملكية الفاخرة لمنظومة الملاحة وتطبيق وصلني',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=240&q=80',
    badgeText: 'طريقنا واحد',
    accentColor: '#1e3a8a',
  },
];

/**
 * استرجاع لوجو المحطة المعتمد والموحد لكافة الخرائط في التطبيق
 * (صفحة العميل، خريطة كارجاس الرئيسية، تطبيق وصلني الملاحي)
 * مع الأخذ في الاعتبار اللوجو الدائم المثبت بواسطة مدير النظام
 */
export function getMasterStationMapLogo(stationId?: string, stationCustomLogo?: string): string {
  if (typeof window === 'undefined') return OFFICIAL_CARGAS_VECTOR_LOGO;

  // 1. لوجو خاص بمحطة محددة إذا تم تمريره صراحة
  if (stationCustomLogo && stationCustomLogo.trim().length > 0) {
    return stationCustomLogo.trim();
  }

  try {
    // 2. فحص اللوجو المخصص للمحطة من إعدادات وصلني المخزنة
    if (stationId) {
      const wasalny = getWasalnyFullConfig();
      if (wasalny.stationCustomLogos && wasalny.stationCustomLogos[stationId]) {
        return wasalny.stationCustomLogos[stationId];
      }
    }

    // 3. اللوجو الماستر الدائم المثبت من لوحة تحكم مدير النظام
    const masterPermanent = localStorage.getItem(MASTER_STATION_MAP_LOGO_KEY);
    if (masterPermanent && masterPermanent.trim().length > 0) {
      return masterPermanent.trim();
    }

    // 4. اللوجو الموحد المخزن في إعدادات وصلني
    const wasalnyFull = getWasalnyFullConfig();
    if (wasalnyFull.stationUnifiedLogoUrl && wasalnyFull.stationUnifiedLogoUrl.trim().length > 0) {
      return wasalnyFull.stationUnifiedLogoUrl.trim();
    }

    // 5. اللوجو المخزن في إعدادات التطبيق العامة
    const appCfg = getAppConfig();
    if (appCfg.stationLogoUrl && appCfg.stationLogoUrl.trim().length > 0) {
      return appCfg.stationLogoUrl.trim();
    }
    if (appCfg.wasalnyConfig?.stationUnifiedLogoUrl && appCfg.wasalnyConfig.stationUnifiedLogoUrl.trim().length > 0) {
      return appCfg.wasalnyConfig.stationUnifiedLogoUrl.trim();
    }

    // 6. اللوجوهات التوافقية القديمة
    const legacyPerm = localStorage.getItem('cargas_custom_logo_permanent');
    if (legacyPerm && legacyPerm.trim().length > 0) return legacyPerm.trim();
    const legacyBak = localStorage.getItem('cargas_custom_logo');
    if (legacyBak && legacyBak.trim().length > 0) return legacyBak.trim();
  } catch (err) {
    console.warn('Error reading master station map logo:', err);
  }

  // 7. اللوجو الرسمي الفيكتور الافتراضي لكارجاس (لا ينكسر ولا يختفي)
  return OFFICIAL_CARGAS_VECTOR_LOGO;
}

/**
 * حفظ وتثبيت لوجو المحطات على كافة خرائط التطبيق بشكل دائم
 * Dynamic Persistent Settings System
 * يضمن بقاء اللوجو ثابتاً في قاعدة البيانات المحلية والتطبيق بالكامل
 * دون العودة للقيم الافتراضية عند تحديث الصفحة أو تسجيل الخروج
 */
export function setMasterStationMapLogo(logoUrl: string): void {
  if (typeof window === 'undefined') return;

  const targetLogo = (logoUrl || '').trim();

  try {
    // 1. تثبيت المفتاح الدائم الرئيسي
    if (targetLogo) {
      localStorage.setItem(MASTER_STATION_MAP_LOGO_KEY, targetLogo);
      localStorage.setItem('cargas_custom_logo_permanent', targetLogo);
      localStorage.setItem('cargas_custom_logo', targetLogo);
    } else {
      localStorage.removeItem(MASTER_STATION_MAP_LOGO_KEY);
      localStorage.removeItem('cargas_custom_logo_permanent');
      localStorage.removeItem('cargas_custom_logo');
    }

    // 2. تحديث إعدادات التطبيق الشاملة وحفظها
    const currentAppCfg = getAppConfig();
    const updatedAppCfg: AppConfig = {
      ...currentAppCfg,
      stationLogoUrl: targetLogo,
      wasalnyConfig: {
        ...(currentAppCfg.wasalnyConfig || DEFAULT_WASALNY_CONFIG),
        stationUnifiedLogoUrl: targetLogo,
        stationMarkerLogoMode: 'unified_cargas',
      },
    };
    saveAppConfig(updatedAppCfg);

    // 3. تحديث وحفظ إعدادات وصلني الكاملة
    const currentWasalny = getWasalnyFullConfig();
    const updatedWasalny: WasalnyConfig = {
      ...currentWasalny,
      stationUnifiedLogoUrl: targetLogo,
      stationMarkerLogoMode: 'unified_cargas',
    };
    saveWasalnyFullConfig(updatedWasalny);

    // 4. بث إشعار فوري لجميع مكونات الخرائط النشطة في الشاشة لتحديث الدبابيس فوراً بدون إعادة تحميل الصفحة
    window.dispatchEvent(
      new CustomEvent(MASTER_MAP_LOGO_EVENT, {
        detail: {
          logoUrl: targetLogo || OFFICIAL_CARGAS_VECTOR_LOGO,
          timestamp: Date.now(),
        },
      })
    );
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving master station map logo persistently:', err);
  }
}

// ==========================================
// 1. الأيقونات الخمس المعتمدة أسفل الخريطة والتحكم الكامل لمدير النظام
// ==========================================
export const MAP_FACILITY_FILTERS_KEY = 'cargas_map_facility_filters';

export const DEFAULT_MAP_FACILITY_FILTERS: MapFacilityFilterItem[] = [
  {
    id: 'fac-cng',
    key: 'cng_fueling',
    label: 'تموين غاز',
    iconText: '⛽',
    color: 'emerald',
    isActive: true,
    order: 1,
    description: 'محطات توفر تموين الغاز الطبيعي السريع CNG لكافة المركبات',
  },
  {
    id: 'fac-oil-center',
    key: 'oil_centers',
    label: 'مراكز الزيوت',
    iconText: '🛢️',
    color: 'amber',
    isActive: true,
    order: 2,
    description: 'مراكز متخصصة ومتكاملة لتغيير الزيوت المعتمدة وفلاتر المحرك وسوائل التبريد',
  },
  {
    id: 'fac-canopy',
    key: 'canopy_oil',
    label: 'زيوت أسفل المظلة',
    iconText: '🪣',
    color: 'orange',
    isActive: true,
    order: 3,
    description: 'خدمة سريعة لتغيير وفحص الزيوت والفلاتر أسفل مظلة التموين مباشرة دون انتظار',
  },
  {
    id: 'fac-conversion',
    key: 'conversion_and_maint',
    label: 'مراكز تحويل وصيانة',
    iconText: '🔧',
    color: 'blue',
    isActive: true,
    order: 4,
    description: 'مراكز كارجاس المعتمدة لتحويل المركبات للعمل بالغاز وضبط المحركات',
  },
  {
    id: 'fac-cylinder',
    key: 'cylinder_testing',
    label: 'مراكز فحص الاسطوانات',
    iconText: '🛡️',
    color: 'teal',
    isActive: true,
    order: 5,
    description: 'فحص دوري هيدروستاتيكي 300 بار واختبار صمامات الأمان وإصدار شهادة الفحص المعتمدة للمرور',
  },
  {
    id: 'fac-2027',
    key: 'coming_soon_2027',
    label: 'قريباً 2027',
    iconText: '🚀',
    color: 'purple',
    isActive: true,
    order: 6,
    description: 'خطة التوسع القومي لمحطات كارجاس الجاري تنفيذها وتدشينها حتى عام 2027',
  },
];

export function getMapFacilityFilters(): MapFacilityFilterItem[] {
  if (typeof window === 'undefined') return DEFAULT_MAP_FACILITY_FILTERS;
  try {
    const raw = localStorage.getItem(MAP_FACILITY_FILTERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // إذا كانت الفلاتر المحفوظة قديمة وتدمج تموين غاز مع مركز زيوت (cng_and_oil)، نقوم بترقيتها للفصل الجديد
      const hasOldCombined = Array.isArray(parsed) && parsed.some((p: any) => p.key === 'cng_and_oil');
      if (Array.isArray(parsed) && parsed.length > 0 && !hasOldCombined) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse facility filters:', err);
  }
  return DEFAULT_MAP_FACILITY_FILTERS;
}

export function saveMapFacilityFilters(filters: MapFacilityFilterItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MAP_FACILITY_FILTERS_KEY, JSON.stringify(filters));
    window.dispatchEvent(new CustomEvent('cargas_facility_filters_updated', { detail: filters }));
  } catch (err) {
    console.error('Failed to save facility filters:', err);
  }
}

/**
 * دالة فلترة دقيقة تربط بين مفتاح النشاط والخدمة وبين المحطات الفعلية
 * تدعم: تموين غاز | مراكز الزيوت | زيوت أسفل المظلة | تحويل وصيانة | فحص أسطوانات | قريباً 2027
 */
export function isStationMatchingFacilityFilter(
  station: CargasStationLocation,
  facilityKey: string | null | undefined
): boolean {
  if (!facilityKey || facilityKey === 'all') return true;
  if (!station) return false;

  const acts = station.activities || [];
  const servs = (station.servicesAvailable || []).join(' ').toLowerCase();
  const nameAndAddr = `${station.name} ${station.address} ${station.city}`.toLowerCase();
  const fType = station.facilityType;

  switch (facilityKey) {
    case 'cng_fueling':
      // محطات تموين غاز طبيعي CNG
      return (
        acts.includes('تموين') ||
        fType === 'cng_station' ||
        servs.includes('تموين غاز') ||
        servs.includes('غاز طبيعي') ||
        servs.includes('تموين') ||
        nameAndAddr.includes('محطة كارجاس') ||
        nameAndAddr.includes('تموين')
      );

    case 'oil_centers':
      // مراكز الزيوت المعتمدة والمتخصصة (فصل مستقل تماماً عن التموين والمظلة)
      return (
        acts.includes('زيوت') ||
        fType === 'oil_center' ||
        nameAndAddr.includes('مركز زيوت') ||
        nameAndAddr.includes('مركز خدمات وزيوت') ||
        servs.includes('مركز متكامل للزيوت') ||
        servs.includes('مركز زيوت') ||
        servs.includes('تغيير زيوت معتمدة') ||
        servs.includes('زيوت معتمدة') ||
        nameAndAddr.includes('زيوت')
      );

    case 'canopy_oil':
      // زيوت سريعة أسفل المظلة
      return (
        fType === 'canopy_oil' ||
        acts.includes('زيوت أسفل المظلة') ||
        servs.includes('أسفل المظلة') ||
        servs.includes('اسفل المظلة') ||
        servs.includes('زيوت أسفل المظلة') ||
        nameAndAddr.includes('مظلة') ||
        nameAndAddr.includes('خدمة زيوت أسفل المظلة')
      );

    case 'conversion_and_maint':
      // مراكز تحويل وصيانة
      return (
        fType === 'conversion_center' ||
        acts.includes('تحويل') ||
        acts.includes('صيانة') ||
        servs.includes('تحويل سيارات') ||
        servs.includes('صيانة') ||
        nameAndAddr.includes('تحويل') ||
        nameAndAddr.includes('صيانة')
      );

    case 'cylinder_testing':
      // مراكز فحص واختبار أسطوانات الغاز 300 بار
      return (
        fType === 'cylinder_inspection' ||
        acts.includes('فحص اسطوانات') ||
        servs.includes('فحص واختبار أسطوانة') ||
        servs.includes('هيدروستاتيكي') ||
        servs.includes('شهادة المرور') ||
        nameAndAddr.includes('فحص') ||
        nameAndAddr.includes('أسطوان') ||
        nameAndAddr.includes('اسطوان')
      );

    case 'coming_soon_2027':
      // محطات التوسع القومي قريباً 2027
      return (
        acts.includes('قريباً 2027') ||
        servs.includes('2027') ||
        nameAndAddr.includes('2027') ||
        nameAndAddr.includes('قريباً') ||
        nameAndAddr.includes('قريبا') ||
        servs.includes('قيد الإنشاء') ||
        station.isLoyaltyProgramActive === false
      );

    case 'cng_and_oil':
      // للتوافق مع البيانات القديمة
      return (
        fType === 'cng_station' ||
        fType === 'oil_center' ||
        acts.includes('تموين') ||
        acts.includes('زيوت')
      );

    default:
      return true;
  }
}

// ==========================================
// 2. تسجيل حركة المبيعات اليومية لكل محطة (المرحلة 1: يدوي | المرحلة 2: سكادا)
// ==========================================
export const STATION_DAILY_SALES_KEY = 'cargas_station_daily_sales_records';

export function getStationDailySales(): StationDailySalesRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STATION_DAILY_SALES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load station daily sales:', err);
  }
  return [];
}

export function saveStationDailySales(records: StationDailySalesRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATION_DAILY_SALES_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save station daily sales:', err);
  }
}

export function recordStationDailySale(record: StationDailySalesRecord): void {
  const current = getStationDailySales();
  const existingIdx = current.findIndex((r) => r.id === record.id);
  let updated: StationDailySalesRecord[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = record;
  } else {
    updated = [record, ...current];
  }
  saveStationDailySales(updated);
}

// ==========================================
// 3. نمط عرض واجهة العميل (منفرداً أو مدمجاً)
// ==========================================
export const CUSTOMER_VIEW_MODE_KEY = 'cargas_customer_view_mode';
export const CUSTOMER_VIEW_MODE_EVENT = 'cargas_customer_view_mode_updated';

export function getCustomerViewMode(): CustomerViewMode {
  if (typeof window === 'undefined') return 'all_integrated';
  try {
    const saved = localStorage.getItem(CUSTOMER_VIEW_MODE_KEY);
    if (saved === 'navigation_only' || saved === 'loyalty_only' || saved === 'all_integrated') {
      return saved as CustomerViewMode;
    }
  } catch {
    // fallback
  }
  return 'all_integrated';
}

export function saveCustomerViewMode(mode: CustomerViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOMER_VIEW_MODE_KEY, mode);
    window.dispatchEvent(new CustomEvent(CUSTOMER_VIEW_MODE_EVENT, { detail: mode }));
  } catch {
    // fallback
  }
}

// ==========================================
// 4. تحديد موقع GPS دقيق للمستخدمين والكوادر فور بدء التشغيل
// ==========================================
export const USER_ACCURATE_GPS_KEY = 'cargas_accurate_user_gps';

// إحداثيات افتراضية مركزية دقيقة لمصر (محطة كارجاس ألماظة - طريق النصر، القاهرة)
export const DEFAULT_EGYPT_COORDS = { lat: 30.0886, lng: 31.3444 };

export function getStoredUserLocation(): { lat: number; lng: number } {
  if (typeof window === 'undefined') return DEFAULT_EGYPT_COORDS;
  try {
    const raw = localStorage.getItem(USER_ACCURATE_GPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && parsed.lat !== 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_EGYPT_COORDS;
}

export function storeUserLocation(coords: { lat: number; lng: number }): void {
  if (typeof window === 'undefined') return;
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number' || coords.lat === 0) return;
  try {
    localStorage.setItem(USER_ACCURATE_GPS_KEY, JSON.stringify(coords));
  } catch {
    // fallback
  }
}

/**
 * بناء مسار دقيق للملاحة بالسيارة في خرائط جوجل أو Waze بربط دقيق ومحدد
 * بين إحداثيات موقع العميل الحقيقي origin وإحداثيات المحطة destination
 */
export function buildAccurateNavigationUrl(
  origin: { lat: number; lng: number } | null | undefined,
  destination: { lat: number; lng: number },
  provider: 'google_maps' | 'waze' = 'google_maps'
): string {
  const effectiveOrigin = origin && origin.lat !== 0 ? origin : DEFAULT_EGYPT_COORDS;

  if (provider === 'waze') {
    return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes&from=${effectiveOrigin.lat},${effectiveOrigin.lng}`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${effectiveOrigin.lat},${effectiveOrigin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

// ==========================================
// 5. إدارة حوافز ومكافآت الفنيين وتقييمات العملاء المعتمدة مالياً
// ==========================================
export const TECHNICIAN_INCENTIVE_CONFIG_KEY = 'cargas_technician_incentive_config';
export const TECHNICIAN_INCENTIVE_EVENT = 'cargas_technician_incentive_updated';

export function getTechnicianIncentiveConfig(): TechnicianIncentiveConfig {
  if (typeof window === 'undefined') return DEFAULT_TECHNICIAN_INCENTIVE_CONFIG;
  try {
    const raw = localStorage.getItem(TECHNICIAN_INCENTIVE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.pointValueEgp === 'number') {
        return { ...DEFAULT_TECHNICIAN_INCENTIVE_CONFIG, ...parsed };
      }
    }
    const appCfg = getAppConfig();
    if (appCfg.technicianIncentiveConfig) {
      return { ...DEFAULT_TECHNICIAN_INCENTIVE_CONFIG, ...appCfg.technicianIncentiveConfig };
    }
  } catch (err) {
    console.warn('Error reading technician incentive config:', err);
  }
  return DEFAULT_TECHNICIAN_INCENTIVE_CONFIG;
}

export function saveTechnicianIncentiveConfig(cfg: TechnicianIncentiveConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TECHNICIAN_INCENTIVE_CONFIG_KEY, JSON.stringify(cfg));
    const appCfg = getAppConfig();
    saveAppConfig({
      ...appCfg,
      technicianIncentiveConfig: cfg,
    });
    window.dispatchEvent(new CustomEvent(TECHNICIAN_INCENTIVE_EVENT, { detail: cfg }));
  } catch (err) {
    console.error('Error saving technician incentive config:', err);
  }
}

/**
 * احتساب الحافز المالي المستحق للفني وترجمة النقاط وتقييمات العملاء
 */
export function calculateTechnicianFinancialIncentive(
  tech: TechnicianCrewMember,
  cfgOverride?: TechnicianIncentiveConfig
): {
  pointIncentiveEgp: number;
  ratingBonusEgp: number;
  volumeBonusEgp: number;
  totalIncentiveEgp: number;
  isEligible: boolean;
  notes: string[];
} {
  const cfg = cfgOverride || getTechnicianIncentiveConfig();
  if (!cfg.isEnabled) {
    return {
      pointIncentiveEgp: 0,
      ratingBonusEgp: 0,
      volumeBonusEgp: 0,
      totalIncentiveEgp: tech.incentiveBonusEgp || 0,
      isEligible: false,
      notes: ['نظام الحوافز متوقف مؤقتاً بقرار الإدارة'],
    };
  }

  // 1. التحقق من كوتا الحد الأدنى للتفويلات
  const isEligible = (tech.totalFuelingsToday || 0) >= (cfg.minFuelingsShiftQuota || 0);

  // 2. الحافز المالي للنقاط = النقاط × قيمة النقطة بالجنيه
  const points = tech.technicianPoints || 0;
  const pointIncentiveEgp = Math.round(points * (cfg.pointValueEgp || 0.25) * 100) / 100;

  // 3. احتساب مكافأة تقييمات العملاء وحسن المعاملة
  let ratingBonusEgp = 0;
  const behaviorRating = tech.averageBehaviorRating || tech.averageOverallRating || 4.5;
  const customersCount = tech.totalCustomersServed || tech.totalFuelingsToday || 0;

  if (behaviorRating >= 4.7) {
    // تقييم ممتاز (5 نجوم معادل): حافز تقييم عالي
    ratingBonusEgp += Math.round(customersCount * (cfg.rating5StarRewardEgp || 10) * 0.4);
  } else if (behaviorRating >= 4.0) {
    // تقييم جيد جداً (4 نجوم معادل)
    ratingBonusEgp += Math.round(customersCount * (cfg.rating4StarRewardEgp || 5) * 0.4);
  }

  // بونص التميز الإضافي للتقييم المتفوق (سفير الابتسامة وحسن المعاملة)
  if (behaviorRating >= (cfg.highRatingBonusThreshold || 4.8)) {
    ratingBonusEgp += cfg.highRatingMonthlyBonusEgp || 250;
  }

  // 4. مكافأة كمية الأمتار الإضافية (Volume Milestone)
  let volumeBonusEgp = 0;
  if ((tech.totalMetersToday || 0) >= (cfg.volumeBonusThresholdM3 || 500)) {
    volumeBonusEgp += cfg.volumeBonusRewardEgp || 50;
  }

  const totalIncentiveEgp = isEligible
    ? Math.round((pointIncentiveEgp + ratingBonusEgp + volumeBonusEgp) * 100) / 100
    : 0;

  const notes: string[] = [];
  if (!isEligible) {
    notes.push(`لم يتجاوز الحد الأدنى للوردية (${cfg.minFuelingsShiftQuota} تفويلة)`);
  } else {
    notes.push(`حافز النقاط: ${pointIncentiveEgp} ج (${points} نقطة × ${cfg.pointValueEgp} ج)`);
    notes.push(`مكافأة تقييمات العملاء: ${ratingBonusEgp} ج (تقييم ${behaviorRating} ⭐)`);
    if (volumeBonusEgp > 0) {
      notes.push(`بونص كمية التموين: ${volumeBonusEgp} ج (تجاوز ${cfg.volumeBonusThresholdM3} م³)`);
    }
  }

  return {
    pointIncentiveEgp,
    ratingBonusEgp,
    volumeBonusEgp,
    totalIncentiveEgp,
    isEligible,
    notes,
  };
}



