export type UserRole = 'driver' | 'technician' | 'admin';

export type StationFacilityType =
  | 'cng_station'          // محطة تموين غاز طبيعي
  | 'conversion_center'    // مركز تحويل سيارات
  | 'oil_center'           // مركز خدمات وزيوت كارجاس
  | 'canopy_oil'           // زيوت سريعة أسفل المظلة
  | 'cylinder_inspection'; // مركز فحص واختبار أسطوانات

// أنشطة المحطات القابلة للتعديل والتحكم من مدير النظام
export type StationActivity = 'تموين' | 'تحويل' | 'صيانة' | 'زيوت' | 'فحص اسطوانات';
export const ALL_STATION_ACTIVITIES: StationActivity[] = ['تموين', 'تحويل', 'صيانة', 'زيوت', 'فحص اسطوانات'];

export interface CargasStationLocation {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  facilityType: StationFacilityType;
  latitude: number;
  longitude: number;
  phone: string;
  workingHours: string;
  pumpCount?: number;
  servicesAvailable: string[];
  // أنشطة وخدمات المحطة المحددة والمرنة القابلة للتعديل من لوحة تحكم المدير
  activities?: StationActivity[];
  salesVolumeStatus: 'low' | 'medium' | 'high'; // لمتابعة المحطات منخفضة المبيعات
  promotionalPointsMultiplier: number;          // مضاعف النقاط الترويجي (مثلاً 1.5x أو 2x)
  promotionalBudgetEgp: number;                 // الموازنة الترويجية المخصصة للمحطة
  distanceFromUserKm?: number;                  // يتم حسابه حياً بناءً على GPS العميل
  // الربط بكاميرات المراقبة الموحدة لرصد حالة زحام المحطة
  cctvStreamCode?: string;                      // كود ربط كاميرات المراقبة الموحد
  cctvStatus?: 'live' | 'offline';              // حالة بث الكاميرات
  crowdLevel?: 'فاضية وسريعة' | 'متوسطة' | 'مزدحمة (طابور)'; // حالة الزحام المرصودة
  crowdEstimatedWaitMinutes?: number;           // زمن الانتظار التقديري بالدقائق
}

export interface MaintenanceItem {
  id: string;
  name: string;
  intervalKm: number;
  lastKm: number;
  nextDueKm: number;
  status: 'ok' | 'due_soon' | 'overdue';
  icon: string;
  description: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  carPlate: string; // e.g. "أ ب ج 1 2 3 4"
  carModel: string; // e.g. "شيري أريزو 5"
  cngCylinderCapacity: number; // e.g. 60L (approx 14m3) or 70L
  odometerKm: number;
  points: number;
  totalMetersFueled: number;
  totalSpentEgp: number;
  registeredAt: string;
  maintenanceSchedule: MaintenanceItem[];
}

export interface TechnicianCrewMember {
  id: string;
  name: string;
  role: 'فني تموين' | 'رئيس وردية' | 'مشرف محطة';
  phone: string; // WhatsApp phone
  stationName: string;
  dailyPin: string;
  pinGeneratedDate: string;
  isShiftActive: boolean;
  totalFuelingsToday: number;
  totalMetersToday: number;
  totalAmountToday: number;
  // نظام نقاط ومكافآت الفنيين وتقييم حسن المعاملة
  technicianPoints: number;        // نقاط حوافز الفني
  totalCustomersServed: number;    // عدد الرواد الذين خدمهم
  averageBehaviorRating: number;   // متوسط تقييم حسن المعاملة (من 5)
  averageOverallRating: number;    // التقييم العام (من 5)
  rankTitle: string;               // لقب التميز (مثال: بطل مبيعات الوردية، سفير الابتسامة)
  incentiveBonusEgp: number;       // الحافز المالي المستحق بالجنية
}

export interface PumpQrInfo {
  stationCode: string;
  stationName: string;
  pumpNumber: number;
  qrDataUrl: string;
  directUrl: string;
}

export interface FuelingTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  driverId: string;
  driverName: string;
  carPlate: string;
  carModel: string;
  technicianId: string;
  technicianName: string;
  stationName: string;
  pumpNumber: number;
  metersQuantity: number;
  pricePerMeter: number;
  totalAmountEgp: number;
  pointsEarned: number;
  odometerReading: number;
  gpsDistanceMeters: number;
  verifiedGps: boolean;
  // إحصائيات التكرار
  driverStationFuelingCount?: number; // رقم تفويلة السائق من هذه المحطة
  driverPumpFuelingCount?: number;    // رقم تفويلة السائق من هذه الطلمبة
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'meters' | 'oil' | 'spark_plugs' | 'car_wash' | 'discount' | 'merchandise' | 'service';
  valueText: string;
  icon: string;
  isActive: boolean;
  estimatedEgpValue?: number;     // القيمة المالية المقدرة بالجنية
  freeMetersEquivalent?: number;  // ما يعادلها من أمتار الغاز الطبيعي المجانية
  aiAuditNotes?: string;          // تقرير وتوصية الذكاء الاصطناعي لتحري دقة التسعير
}

// بنك الأفكار والهدايا والعروض الترويجية والروابط الخاصة بمدير النظام
export interface IdeaBankItem {
  id: string;
  title: string;              // مسمى الفكرة أو الهدية
  category: 'مسابقة' | 'عرض ترويجي' | 'هدية عينية' | 'أمتار غاز' | 'كوبون خدمة' | 'شراكة تجارية';
  description: string;        // تفاصيل وشرح الفكرة
  referenceUrl?: string;      // رابط مرجعي للفكرة أو الشراكة للاحتفاظ به
  estimatedEgpValue: number;  // القيمة التقديرية بالجنية
  targetParticipants: number; // عدد المشتركين المستهدفين
  tags: string[];             // وسوم التصنيف
  notes?: string;             // ملاحظات مدير النظام
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  driverId: string;
  driverName: string;
  pointsSpent: number;
  redemptionCode: string;
  createdAt: string;
  isUsed: boolean;
}

export interface AntiFraudLog {
  id: string;
  timestamp: string;
  type: 'distance_alert' | 'high_volume' | 'frequency_alert' | 'unauthorized_pin';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: string;
}

export interface StationRating {
  id: string;
  transactionId?: string;
  driverId: string;
  driverName: string;
  carPlate: string;
  technicianId: string;
  technicianName: string;
  stationName: string;
  pumpNumber: number;
  overallRating: number;          // 1 to 5 stars
  behaviorRating: number;         // تقييم سلوك ومعاملة الفني (1 to 5 stars)
  speedRating: number;            // سرعة التموين (1 to 5 stars)
  comment: string;
  timestamp: string;
}

export interface CustomerComplaint {
  id: string;
  driverName: string;
  phone: string;
  carPlate: string;
  stationName: string;
  category: 'معاملة فني' | 'جودة وضغط الغاز' | 'صيانة وزيوت' | 'تأخير في الوردية' | 'اقتراح تطوير';
  message: string;
  status: 'جديدة' | 'قيد المتابعة' | 'تم الحل';
  timestamp: string;
  adminResponse?: string;
}

export interface SupportContacts {
  hotline: string;          // رقم مختصر للاتصال (مثل 19058)
  whatsappNumber: string;   // رقم واتساب للتواصل السريع
  email: string;            // بريد الشكاوى والمقترحات
}

// مصفوفة التحكم في ظهور وإخفاء عناصر ومحتويات التطبيق للمدير
export interface VisibilitySettings {
  driver: {
    showEditProfile: boolean;          // إخفاء/إظهار أيقونة تعديل بيانات السيارة والملف (مطلوب افتراضياً إخفاؤها)
    showNearestStationMap: boolean;    // إظهار خريطة ومحدد أقرب محطة كارجاس
    showGoldenCard: boolean;           // كارت الولاء الذهبي
    showRewardsBank: boolean;          // بنك الهدايا والمكافآت
    showMaintenanceSchedule: boolean;  // جدول الصيانة الدورية
    showFuelingHistory: boolean;       // سجل التموينات السابقة
    showServiceRating: boolean;        // نموذج تقييم الخدمة ومعاملة الفني
    showComplaintsBox: boolean;        // قسم الشكاوى والاقتراحات
    showFuelingCountStats: boolean;    // إظهار رقم مرات التموين من المحطة ومن الطلمبة
    showPromotionalBanner: boolean;    // إظهار بانر العروض والمسابقات وشرح برنامج كارجاس للولاء
  };
  technician: {
    showCameraScanner: boolean;        // كاميرا مسح الـ QR
    showManualEntry: boolean;          // الإدخال اليدوي للوحة
    showShiftStats: boolean;           // إحصائيات الوردية
    showGpsRadar: boolean;             // رادار فحص الـ 10 أمتار
    showTechnicianIncentives: boolean; // نظام نقاط وحوافز الفني
    showFuelingCountStats: boolean;    // إظهار رقم مرات التموين من المحطة ومن الطلمبة
  };
}

// مقاييس مبيعات ومستهدفات وانحرافات الشهر الواحد
export interface MonthSalesMetric {
  actual: number;      // المبيعات الفعلية للشهر (م³)
  target: number;      // المستهدف للشهر (م³)
  variance: number;    // الانحراف = الفعلي - المستهدف (م³) (+فائض / -عجز)
  variancePct: number; // نسبة الانحراف % بالنسبة للمستهدف
}

// شيت مبيعات المحطات لتوجيه الموازنة والترويج للمحطات منخفضة المبيعات
export interface StationSalesRecord {
  id: string;
  stationName: string;                     // اسم المركز ( المحطة )
  stationCode?: string;                    // كود المركز (المحطة)
  city: string;                            // المحافظة / المدينة
  latitude?: number;                       // إحداثي خط العرض (Y)
  longitude?: number;                      // إحداثي خط الطول (X)
  reportPeriodType: 'daily' | 'monthly' | 'yearly' | 'custom'; // نوع البيان: يومي، شهري، سنوي
  periodLabel: string;                     // وصف البيان مثل: "بيان شهري تفصيلي" أو "بيان سنوي"
  currentSalesM3: number;                  // إجمالي المبيعات الفعلية (م³)
  targetSalesM3: number;                   // إجمالي المبيعات المستهدفة (م³)
  currentMonthlySalesM3: number;           // للتوافق مع الإصدارات السابقة
  targetMonthlySalesM3: number;            // للتوافق مع الإصدارات السابقة
  achievementRatioPct: number;             // نسبة التحقيق %
  allocatedBudgetEgp: number;              // موازنة الترويج المخصصة (جنية)
  promotionalPointsMultiplier: number;     // مضاعف النقاط الممنوح للترويج
  priorityLevel: 'عالي جداً' | 'متوسط' | 'مستقر';
  monthlyBreakdown?: Record<string, number>; // تفاصيل مبيعات الشهور الفعلية: { "يناير": 54000, "فبراير": 58000, ... }
  monthlyTargets?: Record<string, number>;   // تفاصيل مستهدف الشهور: { "يناير": 55000, "فبراير": 60000, ... }
  monthlyMetrics?: Record<string, MonthSalesMetric>; // مصفوفة الشهور: الفعلي والمستهدف والانحراف لكل شهر
  annualActualM3?: number;                   // إجمالي مبيعات العام الفعلية (م³)
  annualTargetM3?: number;                   // إجمالي المستهدف السنوي للعام (م³)
  annualVarianceM3?: number;                 // إجمالي الانحراف السنوي (فائض أو عجز) (م³)
  annualVariancePct?: number;                // نسبة الانحراف السنوي %
  dailyBreakdown?: Record<string, number>;   // تفاصيل المبيعات اليومية
  detectedHeaders?: string[];                // أسماء رؤوس الأعمدة المرصودة من الشيت
  rawRow?: Record<string, any>;              // الصف الأصلي كما تم رفعه من ملف الإكسيل بكافة مسمياته وقيمه دون تعديل
}

// شيت الإكسيل الأصلي كما تم رفعه
export interface RawSalesSheetData {
  headers: string[];
  rows: Record<string, any>[];
  fileName?: string;
  uploadedAt?: string;
}

// العمليات الحسابية المتاحة للأعمدة المخصصة بشيت المبيعات
export type MathOperation = 'add' | 'subtract' | 'multiply' | 'divide' | 'percentage';

// تعريف عمود / خانة حسابية مخصصة من قبل مدير النظام
export interface CustomComputedColumn {
  id: string;
  name: string; // اسم العمود المخصص (مثلاً: الانحراف +/- ، معدل النمو % ، القيمة بالجنيه)
  operand1Key: string; // مفتاح العمود الأول (e.g. "annualActualM3", "annualTargetM3", "annualVarianceM3", "يناير_actual")
  operand1Label: string; // مسمى العمود الأول
  operation: MathOperation; // جمع (+) | طرح (-) | ضرب (*) | قسمة (/) | نسبة مئوية (%)
  operand2Type: 'column' | 'constant'; // عمود آخر أم رقم ثابت
  operand2Key?: string; // مفتاح العمود الثاني
  operand2Label?: string;
  operand2Constant?: number; // الرقم الثابت (مثل 13 جنيه/متر أو 180 يوم أو 0.35 جنيه/نقطة)
  unit?: string; // الوحدة (م³، جنية، %، نقطة، يوم)
  displayFormat: 'standard' | 'signed' | 'percentage' | 'currency'; // طريقة العرض والتنسيق
  createdAt: string;
}

// نموذج إدارة وتكلفة النقاط والعائد
export interface LoyaltyCostModel {
  activeModelName: 'قياسي 1:1' | 'ترويجي للمحطات المنخفضة' | 'باقة التاكسي والشركات' | 'أوقات غير الذروة';
  costPerPointEgp: number;         // تكلفة النقطة الواحدة على الشركة بالجنية (افتراضي 0.35 ج)
  expectedMarginGainPct: number;   // العائد المتوقع من زيادة الولاء % (افتراضي 28%)
  totalPromotionalBudgetEgp: number; // إجمالي موازنة الترويج المعتمدة
  allocatedBudgetSumEgp: number;
}

// معايير الحملات الترويجية والمسابقات وبانر العروض للعملاء المصاغ بالذكاء الاصطناعي
export interface PromotionalCampaign {
  id: string;
  title: string; // عنوان العرض/المسابقة البارز في البانر
  subtitle: string; // الشرح الترويجي والمشوق للعميل
  category: 'مسابقة' | 'عرض ترويجي' | 'مضاعفة نقاط' | 'شرح برنامج الولاء' | 'خصم خدمات';
  badge: string; // شارة البانر (مثلاً: "عرض خاص", "مسابقة الأسبوع", "وفر واكسب")
  pointsReward: number; // عدد النقاط الممنوحة للعميل
  financialEquivalentEgp: number; // القيمة المالية الموازية بالجنية طبقا لتكلفة النقطة بالموازنة
  allocatedBudgetItemEgp: number; // المبلغ المالي المخصص من الموازنة لهذا البند
  targetDriversCount: number; // عدد العملاء المستهدفين
  rawIdea: string; // الفكرة الأصلية التي تم رفعها أو كتابتها
  aiGeneratedCopy: string; // الصياغة الإبداعية المصاغة بواسطة الذكاء الاصطناعي
  explanationOfLoyalty: string; // شرح برنامج كارجاس للولاء المرتبط بالعرض
  buttonText: string; // نص زر التفاعل (مثلاً: "اشترك في المسابقة", "فول الآن", "اعرف التفاصيل")
  buttonAction: 'navigate_map' | 'view_rewards' | 'open_fueling' | 'view_details';
  startDate: string;
  endDate: string;
  isActive: boolean; // مفعل بالبانر أم موقوف
  bannerGradient: string; // لون/تدرج خلفية البانر
  icon: string; // اسم الأيقونة
}

export interface AppConfig {
  appName: string;
  appSubtitle: string;
  companyName: string;
  developerName: string;
  gasPricePerMeter: number; // default 13 EGP
  pointsPerMeter: number; // default 1
  adminPin: string; // default "0000"
  stationCode: string;
  stationName: string;
  stationLat: number;
  stationLng: number;
  maxGpsRadiusMeters: number; // 10 meters strict
  googlePlayUrl: string;
  appStoreUrl: string;
  themeColor: string;
  isDarkMode: boolean;
  language: 'ar' | 'en';
  // رفع وتخصيص اللوجو العام ولوجو المحطات
  appLogoUrl?: string;     // لوجو التطبيق المخصص
  stationLogoUrl?: string; // لوجو المحطات المخصص الموحد لجميع محطات كارجاس والخريطة
  // Moen Assistant Configuration
  assistantEnabled: boolean;
  assistantOnlyAdmin: boolean;
  assistantAutoSpeak: boolean;
  assistantAllowedTopics: string[];
  // Customizable CMS Texts
  customTexts: {
    welcomeDriver: string;
    welcomeTech: string;
    cngSlogan: string;
    pointsBannerTitle: string;
    maintenanceNotice: string;
  };
  // التحكم في الإظهار والإخفاء الشامل
  visibility: VisibilitySettings;
  // أرقام وبيانات التواصل والشكاوى
  supportContacts: SupportContacts;
  // نظام تكلفة النقاط والموازنة
  loyaltyCostModel: LoyaltyCostModel;
  // الخانات والأعمدة الحسابية المخصصة لشيت المبيعات
  customSalesColumns?: CustomComputedColumn[];
  // الحملات الترويجية والمسابقات وبانر العروض للعملاء
  promotionalCampaigns?: PromotionalCampaign[];
  // بنك الأفكار والهدايا والروابط لمدير النظام
  ideasBank?: IdeaBankItem[];
  // إعدادات وتحكم مدير النظام في تطبيق وصّلني والملاحة
  wasalnyConfig?: WasalnyConfig;
}

// إعدادات وتحكم مدير النظام الشاملة في تطبيق "وصّلني" والملاحة
export interface WasalnyConfig {
  enabled: boolean;                      // تفعيل تطبيق وصّلني للمستخدمين
  voiceGuidance: 'wadah_egyptian' | 'moen_advisor' | 'standard_arabic' | 'silent'; // الصوت المرشد
  autoVoiceOnOpen: boolean;              // تشغيل الصوت التوجيهي تلقائياً فور فتح وصّلني
  navigationProvider: 'google_maps' | 'in_app' | 'ask_user'; // مزود الملاحة الافتراضي
  targetStationMode: 'auto_gps' | 'featured_station'; // توجيه تلقائي لأقرب محطة بالـ GPS أم لمحطة مستهدفة محددة
  featuredStationId?: string;            // معرف المحطة المستهدفة المحددة لدعم مبيعاتها
  arrivalAlertDistanceMeters: number;     // مسافة التنبيه عند الاقتراب من المحطة (بالمتر)
  customWelcomeMessage?: string;         // رسالة أو توجيهات وصّلني المخصصة التي تظهر للسائق
  showCrowdStatus: boolean;              // إظهار حالة زحام المحطة المرصودة بالكاميرات
  buttonLabel: string;                   // مسمى الزر في واجهة العميل
}

export interface VersionSnapshot {
  versionId: 'v1.0-classic' | 'v2.0-enhanced';
  timestamp: string;
  title: string;
  description: string;
}
