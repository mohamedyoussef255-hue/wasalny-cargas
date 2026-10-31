export type UserRole = 'driver' | 'technician' | 'supervisor' | 'admin' | 'finance' | 'customer_service' | 'cylinder_inspection' | 'complaints_officer';

export type StationFacilityType =
  | 'cng_station'          // محطة تموين غاز طبيعي
  | 'conversion_center'    // مركز تحويل سيارات
  | 'oil_center'           // مركز خدمات وزيوت كارجاس
  | 'canopy_oil'           // زيوت سريعة أسفل المظلة
  | 'cylinder_inspection'; // مركز فحص واختبار أسطوانات

// أنشطة المحطات القابلة للتعديل والتحكم من مدير النظام
export type StationActivity =
  | 'تموين'
  | 'زيوت'
  | 'زيوت أسفل المظلة'
  | 'تحويل'
  | 'صيانة'
  | 'فحص اسطوانات'
  | 'قريباً 2027';

export const ALL_STATION_ACTIVITIES: StationActivity[] = [
  'تموين',
  'زيوت',
  'زيوت أسفل المظلة',
  'تحويل',
  'صيانة',
  'فحص اسطوانات',
  'قريباً 2027',
];

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
  // إعدادات وتخصيصات الإدارة المالية للنقاط بالمحطة
  region?: string;                              // المنطقة الجغرافية (القاهرة الكبرى، الإسكندرية، الدلتا، القناة، الصعيد)
  costPerPointEgp?: number;                     // تكلفة النقطة بالجنيه المقررة من الإدارة المالية للمحطة
  pointsAwardRatePerMeter?: number;             // معدل منح النقاط لكل متر غاز في هذه المحطة (افتراضي 1)
  isLoyaltyProgramActive?: boolean;             // تفعيل أو تعطيل برنامج النقاط في هذه المحطة تحديداً
  financialApprovedByAdmin?: boolean;           // اعتماد مدير النظام لتسعيرة وتكلفة الإدارة المالية
  financialApprovedAt?: string;                 // توقيت اعتماد مدير النظام
  financialApprovedBy?: string;                 // اسم أو معرف من اعتمد التسعيرة
  financialNotes?: string;                      // توجيهات وملاحظات الإدارة المالية
  customLogoUrl?: string;                       // لوجو المحطة المخصص على الخريطة
  markerIconType?: 'cargas_badge' | 'custom_logo' | 'fuel_pin' | 'shield_eco'; // نمط ماركر المحطة
  governorate?: string;                         // المحافظة التابعة لها المحطة (القاهرة، الجيزة، الإسكندرية...)
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
  isWhatsApp?: boolean;
  whatsappPhone?: string;
  email?: string;
  carPlate: string; // e.g. "أ ب ج 1 2 3 4"
  carModel: string; // e.g. "شيري أريزو 5"
  cngCylinderCapacity: number; // e.g. 60L (approx 14m3) or 70L
  odometerKm: number;
  points: number;
  totalMetersFueled: number;
  totalSpentEgp: number;
  registeredAt: string;
  licenseDetails?: VehicleLicenseAndConversion;
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
  welcomePointsQuota?: number;     // رصيد النقاط الترحيبية المتاح في يد الفني لتوزيعه على العملاء لربطهم بالمحطة
  welcomePointsDistributed?: number;// كمية النقاط الترحيبية التي وزعها الفني
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
  // تموين استبدال نقاط الولاء والهدايا
  isRewardRedemption?: boolean;       // عملية مستبدلة من نقاط الولاء
  rewardRedemptionId?: string;        // معرف كود الاستبدال
  rewardTitle?: string;               // اسم المكافأة المستبدلة
  // رصد ومتابعة الإدارة المالية
  stationCostPerPointEgp?: number;     // تكلفة النقطة بالجنيه المقررة للمحطة وقت العملية
  stationPointsRate?: number;          // معدل منح النقاط وقت العملية (نقطة/م³)
  financialLiabilityEgp?: number;      // إجمالي التكلفة المالية للنقاط المستحقة (pointsEarned * costPerPoint)
  regionName?: string;                 // المنطقة الجغرافية للمحطة
}

export type RewardCategory =
  | 'oil'                    // منتجات وزيوت كارجاس المعتمدة
  | 'maintenance'            // صيانة وإصلاح وفلاتر وبوجيهات
  | 'inspection'             // فحص واختبار أسطوانات وصمامات أمان
  | 'discount_coupon'        // كوبونات خصم فورية
  | 'services_goods'         // خدمات وسلع عينية (غسيل وتلميع)
  | 'third_party_discount'   // خصومات وسلع لدى الغير والشركاء التجاريين
  | 'spark_plugs'
  | 'meters'
  | 'discount'
  | 'car_wash'
  | 'merchandise';

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  valueText: string;
  icon: string;
  isActive: boolean;
  estimatedEgpValue?: number;     // القيمة المالية المقدرة بالجنية
  partnerName?: string;           // اسم جهة الخصم لدى الغير (مثلاً: كارفور، سبينيس، بي تك)
  discountPercentage?: number;    // نسبة الخصم %
  couponCodeValue?: string;       // كود الكوبون
  aiAuditNotes?: string;          // تقرير وتوصية الذكاء الاصطناعي لتحري دقة التسعير
  freeMetersEquivalent?: number;  // للأمتار للتوافق الخلفي
}

// بنك الأفكار والهدايا والعروض الترويجية والروابط الخاصة بمدير النظام
export interface IdeaBankItem {
  id: string;
  title: string;              // مسمى الفكرة أو الهدية
  category: 'مسابقة' | 'عرض ترويجي' | 'هدية عينية' | 'كوبون خدمة' | 'شراكة تجارية' | 'أمتار غاز';
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
  carPlate?: string;
  carModel?: string;
  pointsSpent: number;
  redemptionCode: string;
  createdAt: string;
  isUsed: boolean;
  category?: RewardCategory;
  calculatedEgpValue?: number;        // القيمة التقديرية بالجنيه
  partnerName?: string;               // جهة الشريك أو الخصم لدى الغير
  discountPercentage?: number;        // نسبة الخصم
  couponCodeValue?: string;           // كود الكوبون
  giftType?: string;                  // مسمى نوع الهدية
  usedAt?: string;                    // تاريخ ووقت الصرف لدى الفني
  usedAtStation?: string;             // اسم المحطة التي تم الصرف بها
  dispensedByTechnicianId?: string;   // كود فني التموين الذي نفذ العملية
  dispensedByTechnicianName?: string; // اسم فني التموين
  pumpNumber?: number;                // رقم الطلمبة التي تم التموين منها
  fuelingTransactionId?: string;      // رقم إيصال التفويلة المرتبط
  freeMeters?: number;                // حقل الأمتار للتوافق الخلفي
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

// نموذج إدارة وتكلفة النقاط والعائد والمعيار الاقتصادي الرسمي
export interface LoyaltyCostModel {
  activeModelName: 'قياسي 1:1' | 'ترويجي للمحطات المنخفضة' | 'باقة التاكسي والشركات' | 'أوقات غير الذروة';
  costPerPointEgp: number;         // تكلفة النقطة الواحدة على الشركة بالجنية (افتراضي 0.35 ج)
  expectedMarginGainPct: number;   // العائد المتوقع من زيادة الولاء % (افتراضي 28%)
  totalPromotionalBudgetEgp: number; // إجمالي موازنة الترويج المعتمدة
  allocatedBudgetSumEgp: number;
  // المعيار الاقتصادي الرسمي القابل للتعديل بالكامل
  officialGasPrice?: number;                 // سعر المتر الرسمي الافتراضي 13 ج
  officialCostPerPoint?: number;             // تكلفة النقطة الرسمية الافتراضية 0.35 ج
  officialGasolineSavingsPerMeter?: number;  // وفر السائق لكل متر مقارنة بالبنزين 10.5 ج
  officialMarginGainPct?: number;            // نسبة نمو هامش أرباح الشركة 28%
  centennialMeters?: number;                 // أمتار باقة المئوية 108 م³
  centennialPoints?: number;                 // نقاط باقة المئوية 100 نقطة
  centennialRewardValueEgp?: number;         // القيمة السوقية لمكافأة المئوية 50 ج
  customerRewardPerPointEgp?: number;        // القيمة السوقية للنقطة للعميل 0.50 ج
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
  financePin?: string; // default "1234" (الرقم السري لدخول وتعديل الإدارة المالية)
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
  customAppLogoUrl?: string; // لوجو مخصص
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
    welcomeDriverLabel?: string;
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
  // المعادلة المعتمدة والشاملة لاحتساب نقاط الولاء
  pointsFormula?: PointsFormulaConfig;
  // ترتيب وتنسيق عناصر وصفحات العميل والفني
  layoutSettings?: PageLayoutSettings;
  // إعدادات الربط والتحكم بنظام السكادا (SCADA Webhook)
  scadaConfig?: ScadaConfig;
  // نظام إظهار التموين: يدوي فقط أم سكادا فقط أم كلاهما معاً
  fuelingModeDisplay?: 'both' | 'manual_only' | 'scada_only';
  // طريقة عرض النظام للعميل بتحكم حصري لمدير النظام (ملاحة فقط أو ولاء فقط أو مدمج شامل)
  customerViewMode?: CustomerViewMode;
  // باسوورد مدير مركز فحص واختبار أسطوانات الغاز (يرسله مدير النظام لمدير الفحص)
  cylinderInspectionPin?: string;
  // باسوورد موظفي ومسؤولي خدمة العملاء ومتابعة الحجوزات (يرسله مدير النظام)
  customerServicePin?: string;
  // باسوورد مسؤول تلقي الشكاوى والمقترحات (يرسله مدير النظام عبر الواتساب)
  complaintsOfficerPin?: string;
  // تحكم مدير النظام في إظهار أو إخفاء مسميات المطور والشركة والمنظومة
  showDeveloperName?: boolean;
  showCompanyName?: boolean;
  showAppName?: boolean;
  // إعدادات احتساب حوافز ومكافآت الفنيين وترجمتها المالية من الإدارة المالية ومدير النظام
  technicianIncentiveConfig?: TechnicianIncentiveConfig;
}

// أعمدة ومقاسات المساحات المرنة في نظام التخطيط الديناميكي
export type SectionColSpan = 12 | 7 | 6 | 5 | 4;
export type SectionHeightMode = 'compact' | 'normal' | 'expanded';

// تعريف كل مساحة في شاشة العميل والفني
export interface SectionLayoutItem {
  id: string;
  title: string;
  description?: string;
  colSpan: SectionColSpan; // 12 = عرض كامل 100%, 7 = عريض 60%, 6 = نصف الشاشة 50%, 5 = مائل 40%, 4 = ثلث 33%
  heightMode: SectionHeightMode;
  visible: boolean;
  order: number;
  icon?: string;
}

// إعدادات ترتيب ومواضع ومقاسات عناصر صفحات العميل والفني
export interface PageLayoutSettings {
  driverSectionsOrder: string[];
  technicianSectionsOrder: string[];
  driverSections: SectionLayoutItem[];
  technicianSections: SectionLayoutItem[];
}

// هيكل جلسة التموين التلقائية بنظام السكادا (fueling_sessions)
export interface FuelingSession {
  session_id: string;
  station_id: string;
  station_name?: string;
  hose_id: string;
  user_id: string;
  driver_name?: string;
  car_plate: string;
  car_model?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  volume_m3?: number;
  unit_price?: number;
  total_amount?: number;
  points_earned?: number;
  created_at: string;
  completed_at?: string;
  scada_transaction_id?: string;
  technician_id?: string;
  technician_name?: string;
  odometer_km?: number;
  notes?: string;
}

// حمولة قراءة العداد المستلمة من نظام السكادا (SCADA Webhook Payload)
export interface ScadaTransactionPayload {
  api_key: string;
  station_id: string;
  hose_id: string;
  volume_m3: number;
  transaction_id: string;
}

// إعدادات الربط والتحكم بنظام السكادا لمحطات كارجاس
export interface ScadaConfig {
  enabled: boolean;
  apiKey: string;
  webhookEndpoint: string;
  autoWindowMinutes: number; // مدة صلاحية الجلسة المفتوحة (افتراضي 10 دقائق)
  simulationDelaySeconds: number;
  lastReceivedSignal?: {
    timestamp: string;
    station_id: string;
    hose_id: string;
    volume_m3: number;
    transaction_id: string;
    status: 'matched' | 'unmatched' | 'invalid_key';
    sessionId?: string;
    carPlate?: string;
    pointsEarned?: number;
  };
}

// المعادلة المعتمدة والشاملة لاحتساب نقاط الولاء في كافة أرجاء التطبيق
export interface PointsFormulaConfig {
  ratioMode?: 'points_per_meter' | 'meters_per_point'; // نمط احتساب النسبة: هل نقاط لكل متر أم أمتار لكل نقطة
  metersPerPointUnit?: number;       // عند اختيار meters_per_point: كل كم متر يعادل 1 نقطة (مثلاً 5 أو 10 م³ = 1 نقطة)
  basePointsPerMeter: number;        // معدل النقاط الأساسي لكل متر (افتراضياً 1 أو 10)
  gasPricePerMeter: number;          // سعر متر الغاز المعتمد (13 ج)
  calculationBasis: 'meters' | 'egp';// الحساب بناء على كمية الأمتار أم القيمة بالجنيه
  tierBronzeMultiplier: number;      // مضاعف الشريحة البرونزية / العادية (1.0x)
  tierSilverMultiplier: number;      // مضاعف الشريحة الفضية (1.5x)
  tierGoldMultiplier: number;        // مضاعف الشريحة الذهبية (2.0x)
  volumeBonusThresholdM3: number;    // كمية التموين التي تمنح بونص حجم إضافي (مثلاً 30 م³)
  volumeBonusPoints: number;         // بونص النقاط عند تجاوز الحد (مثلاً 10 نقاط)
  technicianWelcomePointsPerShift: number; // رصيد النقاط الترحيبية المتاح للفني في الوردية لتوزيعه (مثلاً 350 نقطة)
  pointsToEgpRedemptionRatio: number;// القيمة التقديرية للنقطة بالجنيه (0.35 ج)
}

// خدمات حجز مواعيد الصيانة وفحص الأسطوانات
export type AppointmentServiceType =
  | 'فحص واختبار أسطوانة الغاز وصمام الأمان (شهادة المرور)'
  | 'صيانة دورية وتغيير طقم فلاتر الغاز'
  | 'تغيير زيت المحرك وفحص الفلتر أسفل المظلة'
  | 'تغيير طقم بوجيهات بوش وضبط فجوة الإشعال'
  | 'فحص تسريب الغاز ومعايرة منظم الضغط والرشاشات'
  | 'صيانة سريعة عامة وضبط محبس الأمان';

export type AppointmentStatus =
  | 'scheduled'               // محجوز ومجدول
  | 'awaiting_confirmation'   // تم إرسال تنبيه تأكيد الحضور (قبل الموعد بساعتين)
  | 'confirmed_by_driver'     // تم تأكيد الحضور من السائق
  | 'auto_cancelled_no_show'  // تم الإلغاء تلقائياً لعدم التأكيد خلال مهلة ساعة
  | 'reallocated_to_standby'  // تم شغل المكان ونقل الموعد لعميل آخر بالانتظار
  | 'completed'               // تم التنفيذ بالمحطة
  | 'cancelled_by_driver';    // ألغاه السائق بنفسه

export interface ServiceAppointment {
  id: string;
  driverId: string;
  driverName: string;
  carPlate: string;
  phone: string;
  stationId: string;
  stationName: string;
  serviceType: AppointmentServiceType;
  appointmentDate: string;           // YYYY-MM-DD
  timeSlot: string;                  // e.g. "10:00 ص - 10:30 ص"
  status: AppointmentStatus;
  createdAt: string;
  alertSentAt?: string;              // وقت إرسال التنبيه (قبل الموعد بساعتين)
  confirmationDeadline?: string;     // مهلة الرد (ساعة واحدة بعد التنبيه)
  confirmedAt?: string;
  reallocatedToDriverId?: string;    // كود السائق الجديد الذي شغل الموعد الشاغر
  reallocatedToDriverName?: string;
  reallocatedToCarPlate?: string;
  notes?: string;
  // تصنيف الحجز وخدمة العملاء وفحص الأسطوانات
  bookingCategory?: 'maintenance_conversion' | 'cylinder_inspection';
  confirmedByCustomerService?: boolean;
  confirmedByAgentName?: string;
  customerServiceNotes?: string;
  customerServiceCallStatus?: 'pending_call' | 'called_confirmed' | 'called_no_answer' | 'whatsapp_sent' | 'cancelled';
  // بيانات الفحص والاختبار الهيدروستاتيكي لأسطوانات الغاز
  cylinderSerialNumber?: string;
  cylinderWaterCapacityL?: number;
  cylinderTestResult?: 'passed' | 'failed' | 'pending';
  cylinderTestPressureBar?: number;
  cylinderCertificateNumber?: string;
  cylinderCertificateExpiryDate?: string;
  inspectedAtStationId?: string;
  inspectedAtStationName?: string;
  inspectionEngineerName?: string;
}

// بنود وخدمات تطبيق وصلني (تاكسي، غاز منزلي، إنقاذ، صيانة متنقلة)
export interface WasalnyServiceItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  baseFareEgp: number;        // فتح العداد
  perKmRateEgp: number;       // سعر الكيلومتر
  perMinuteRateEgp: number;   // سعر دقيقة الانتظار
  minFareEgp: number;         // الحد الأدنى للمشوار
  commissionPct: number;      // نسبة العمولة
}

// كباتن وأسطول سيارات تطبيق وصلني
export interface WasalnyCaptain {
  id: string;
  name: string;
  phone: string;
  carPlate: string;
  carModel: string;
  city: string;
  rating: number;             // تقييم من 5
  totalTrips: number;
  totalEarningsEgp: number;
  status: 'active' | 'suspended' | 'pending';
  joinedDate: string;
  cngConverted: boolean;      // سيارة تعمل بالغاز الطبيعي
}

// إعدادات وتحكم مدير النظام الشاملة في تطبيق "وصّلني" واللوجو والأسطول
export interface WasalnyConfig {
  enabled: boolean;                      // تفعيل تطبيق وصّلني للمستخدمين
  appName?: string;                      // مسمى تطبيق وصلني
  appSlogan?: string;                    // شعار التطبيق
  appStatus?: 'active' | 'maintenance' | 'beta'; // حالة التشغيل
  appVersion?: string;                   // إصدار التطبيق
  wasalnyLogoUrl?: string;               // لوجو تطبيق وصلني المخصص القابل للتعديل
  wasalnyLogoShape?: 'square' | 'rounded' | 'circle'; // شكل اللوجو
  wasalnyThemeColor?: string;            // اللون الرئيسي
  wasalnyAccentColor?: string;           // اللون الثانوي
  voiceGuidance: 'wadah_egyptian' | 'moen_advisor' | 'standard_arabic' | 'silent'; // الصوت المرشد
  autoVoiceOnOpen: boolean;              // تشغيل الصوت التوجيهي تلقائياً فور فتح وصّلني
  navigationProvider: 'google_maps' | 'in_app' | 'ask_user'; // مزود الملاحة الافتراضي
  targetStationMode: 'auto_gps' | 'featured_station'; // توجيه تلقائي لأقرب محطة بالـ GPS أم لمحطة مستهدفة محددة
  featuredStationId?: string;            // معرف المحطة المستهدفة المحددة لدعم مبيعاتها
  arrivalAlertDistanceMeters: number;     // مسافة التنبيه عند الاقتراب من المحطة (بالمتر)
  customWelcomeMessage?: string;         // رسالة أو توجيهات وصّلني المخصصة التي تظهر للسائق
  showCrowdStatus: boolean;              // إظهار حالة زحام المحطة المرصودة بالكاميرات
  buttonLabel: string;                   // مسمى الزر في واجهة العميل (مثال: وصلني لأقرب محطة)
  subtitle?: string;                     // نص توضيحي يظهر تحت العنوان
  mapCoverImageUrl?: string;             // رابط أو صورة خلفية الخريطة المخصصة
  cargasLogoBadgeUrl?: string;           // لوجو كارجاس المخصص على بطاقة الخريطة
  cardLayout?: string;                   // تصميم بطاقة العرض
  // خدمات وتسعيرات وصلني
  services?: WasalnyServiceItem[];
  // كباتن وأسطول وصلني
  captains?: WasalnyCaptain[];
  // تكامل برنامج ولاء كارجاس
  pointsDiscountEnabled?: boolean;
  pointsToEgpDiscountRate?: number;     // e.g. كل 10 نقاط = 5 جنية
  freeRidePointsThreshold?: number;     // e.g. 100 نقطة لمشوار مجاني
  maxDiscountPerTripEgp?: number;        // أقصى خصم بالنقاط للرحلة الواحدة
  // التحكم في لوجوهات وشارات المحطات على الخريطة
  stationMarkerLogoMode?: 'unified_cargas' | 'individual_station' | 'preset'; // نمط لوجو المحطات على الخريطة
  stationUnifiedLogoUrl?: string; // رابط اللوجو الموحد للمحطات على الخريطة
  stationMarkerStyle?: 'cargas_badge' | 'royal_pin' | 'shield_badge' | 'clean_logo'; // تصميم وشكل الماركر على الخريطة
  stationCustomLogos?: Record<string, string>; // لوجو مخصص لكل محطة على حدة (stationId -> logoUrl)
  stationMarkerGlowColor?: string; // لون الإطار والتوهج
  // قصر الخدمات والتعريفة والتوصيل الذكي على مدير النظام فقط
  showServicesAndTariffsOnlyToAdmin?: boolean; // قصر ظهور منظومة الخدمات والتعريفة والأسعار وفكرة تطبيق وصلني على مدير النظام فقط
  enableSmartDeliveryForCustomers?: boolean; // عدم تفعيل فكرة التوصيل الذكي في صفحات العملاء إلا من خلال مدير النظام
  smartDeliveryNoteForCustomers?: string; // رسالة توضيحية للعميل عند محاولة الوصول لخدمة التوصيل
}

// هيكل مصفوفة تسعير وتخصيص تكلفة النقاط لكل محطة ومنطقة جغرافية
export interface StationFinancialConfig {
  stationId: string;
  stationName: string;
  region: string;
  costPerPointEgp: number;           // تكلفة النقطة بالجنيه المقررة من الإدارة المالية
  pointsAwardRatePerMeter: number;   // معدل منح النقاط لكل متر غاز (مثلاً: 1 أو 1.5 أو 2)
  isProgramActive: boolean;          // تفعيل أو تعطيل برنامج النقاط في هذه المحطة
  allocatedBudgetEgp?: number;       // موازنة الترويج والنقاط المخصصة للمحطة
  isApprovedByAdmin: boolean;        // اعتماد مدير النظام
  approvedAt?: string;
  approvedBy?: string;
  financialNotes?: string;
}

export interface VersionSnapshot {
  versionId: 'v1.0-classic' | 'v2.0-enhanced';
  timestamp: string;
  title: string;
  description: string;
}

// ==================== التوسعات الشاملة للمنظومة الرقابية والشات ====================

export interface VehicleLicenseAndConversion {
  licenseNumber: string;               // رقم رخصة التسيير
  trafficDepartment: string;           // وحدة المرور التابع لها
  chassisNumber?: string;              // رقم الشاسيه
  motorNumber?: string;                // رقم الموتور
  conversionCompany: string;           // الشركة القائمة بالتحويل (كارجاس، غازتك، أخرى...)
  cylinderCapacityLiters: number;      // سعة الأسطوانة باللتر (60L, 70L, 80L, 90L, 100L)
  cylinderSerialNumber: string;        // رقم أسطوانة الغاز المحفور
  lastInspectionDate: string;          // تاريخ آخر فحص واختبار دوري للأسطوانة
  nextInspectionDueDate: string;       // تاريخ الفحص القادم
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'فني تموين' | 'مشرف محطة' | 'مسؤول مالي' | 'رئيس وردية';
  phone: string;
  stationName?: string;
  stationCode?: string;
  dailyPin: string;
  pinGeneratedDate: string;
  isShiftActive: boolean;
  canRedeemRewards?: boolean; // تفويض مسح كيو آر الاستبدال
}

export type ChatRoomType = 'tech_admin' | 'supervisor_admin' | 'finance_admin' | 'finance_supervisor';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'technician' | 'supervisor' | 'finance' | 'system';
  messageText: string;
  timestamp: string;
  isAutomatedDispatch?: boolean; // إرسال آلي لكود الوردية
  isGhostAdmin?: boolean;        // إخفاء هوية المدير في شات المشرف والمالية
}

export interface ChatRoom {
  id: string;
  roomType: ChatRoomType;
  title: string;
  participantOne: string; // e.g. 'finance' or staff ID
  participantTwo: string; // e.g. 'supervisor' or 'admin'
  stationId?: string;
  stationName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface SupervisorDelegation {
  stationCode: string;
  stationName: string;
  isRedemptionDelegatedToTech: boolean;
  delegatedTechId?: string;
  delegatedTechName?: string;
  durationHours?: number; // e.g. 4, 8, or 24 (or 0 for manual until revoked)
  delegatedAt?: string;
  expiresAt?: string;
  delegatedBySupervisorName?: string;
  notes?: string;
}

// بيان وسجل كشف الوردية المعتمد والموثق بالتاريخ والوقت
export interface ApprovedShiftRosterRecord {
  id: string;
  technicianId?: string;
  technicianName: string;
  technicianPhone: string;
  technicianRole: string;
  shiftType: string;
  stationName: string;
  stationCode: string;
  dailyPin: string;
  approvedBySupervisorName: string;
  approvedAt: string;              // ISO timestamp
  formattedApprovedAt: string;     // Local formatted date & time
  isChatDispatched: boolean;
  status: 'active' | 'completed' | 'revoked';
  notes?: string;
}

// قفل جلسة الفني على جهاز واحد لمنع تكرار رقم الهاتف من جهاز آخر
export interface TechnicianDeviceSession {
  phone: string;
  techId: string;
  techName: string;
  deviceId: string;
  deviceLabel?: string;
  loginTime: string;
  lastHeartbeat: string;
  isActive: boolean;
}

// ==========================================
// أيقونات وتصنيفات الخدمات أسفل الخريطة (قابلة للتحكم والتعديل من مدير النظام)
// ==========================================
export interface MapFacilityFilterItem {
  id: string;
  key: 'cng_and_oil' | 'canopy_oil' | 'conversion_and_maint' | 'cylinder_testing' | 'coming_soon_2027' | string;
  label: string;
  iconText: string;
  color: string;
  isActive: boolean;
  order: number;
  description?: string;
  targetCount?: number;
}

// ==========================================
// تسجيل حركة المبيعات اليومية للمحطات (المرحلة الأولى: يدوي | المرحلة الثانية: سكادا)
// ==========================================
export type SalesSystemStage = 'stage1_manual' | 'stage2_scada';

export interface StationDailySalesRecord {
  id: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  salesDate: string; // YYYY-MM-DD
  shiftType: 'morning' | 'evening' | 'night' | 'full_day';
  supervisorName: string;
  systemStage: SalesSystemStage; // المرحلة المطبقة (يدوي أو سكادا)

  // بيانات المرحلة الأولى: النظام اليدوي
  manualDetails?: {
    startMeterReading: number;
    endMeterReading: number;
    gasVolumeSoldM3: number;
    gasPricePerMeter: number;
    gasRevenueEgp: number;
    oilBottlesSold: number;
    oilRevenueEgp: number;
    cashPaymentEgp: number;
    visaCardPaymentEgp: number;
    fleetCardPaymentEgp: number; // بطاقات أسطول حكومي/شركات
    totalSalesEgp: number;
    cashBankDeposited: boolean;
    depositSlipNumber?: string;
    shiftDiscrepancyEgp?: number; // عجز أو زيادة في النقدية
    supervisorSignature: string;
    notes?: string;
  };

  // بيانات المرحلة الثانية: نظام سكادا الآلي (SCADA Telemetry)
  scadaDetails?: {
    dispenserId: string;
    totalFlowAccumulatedM3: number;
    averageInletPressureBar: number;
    compressorRunHours: number;
    liveTankPressureBar: number;
    scadaCalculatedRevenueEgp: number;
    autoReconciledStatus: 'matched' | 'variance_detected' | 'syncing';
    varianceVolumeM3?: number;
    telemetryTimestamp: string;
    gatewayStatus: 'online' | 'offline';
  };

  status: 'draft' | 'submitted' | 'audited_by_finance' | 'approved_by_admin';
  auditedByFinanceAt?: string;
  auditedByFinanceName?: string;
  approvedByAdminAt?: string;
  createdAt: string;
}

// عرض واجهة العميل المستقلة
export type CustomerViewMode = 'all_integrated' | 'navigation_only' | 'loyalty_only';

// ==========================================
// قنوات ورسائل المراسلة المباشرة بين العميل ومسؤولي النظام
// ==========================================
export type CustomerChatChannel = 'customer_service' | 'cylinder_center';

export interface CustomerDirectMessage {
  id: string;
  channel: CustomerChatChannel;
  driverId: string;
  driverName: string;
  carPlate: string;
  driverPhone: string;
  senderRole: 'driver' | 'customer_service' | 'cylinder_center';
  senderName: string;
  messageText: string;
  timestamp: string;
  readByCustomer?: boolean;
  readByStaff?: boolean;
  stationName?: string;
  serviceType?: string;
  statusBadge?: string;
}

// ==========================================
// إعدادات احتساب حوافز الفنيين وترجمة النقاط وتقييمات العملاء
// (تحكم مشترك بين الإدارة المالية ومدير النظام)
// ==========================================
export interface TechnicianIncentiveConfig {
  pointValueEgp: number;                // قيمة كل نقطة حافز للفني بالجنيه (مثلاً: 0.25 جنيه/نقطة)
  rating5StarRewardEgp: number;         // مكافأة مالية لكل تقييم 5 نجوم (مثلاً: 10 جنيه)
  rating4StarRewardEgp: number;         // مكافأة مالية لكل تقييم 4 نجوم (مثلاً: 5 جنيه)
  highRatingBonusThreshold: number;     // حد متوسط التقييم الشهري للبونص الخاص (مثلاً: 4.8 من 5)
  highRatingMonthlyBonusEgp: number;    // بونص التميز الشهري عند تجاوز الحد (مثلاً: 250 جنيه)
  minFuelingsShiftQuota: number;        // الحد الأدنى لتفويلات الوردية لاستحقاق الحافز (مثلاً: 10 تموينات)
  volumeBonusThresholdM3: number;       // حد كمية الأمتار الإضافية للبونص (مثلاً: 500 م³)
  volumeBonusRewardEgp: number;         // مكافأة تجاوز حد الكمية بالجنيه (مثلاً: 50 جنيه)
  isEnabled: boolean;                   // تفعيل احتساب الحوافز المالية
}




