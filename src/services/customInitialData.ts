import {
  AppConfig,
  CargasStationLocation,
  RewardItem,
  TechnicianCrewMember,
  MapFacilityFilterItem,
} from '../types';

/**
 * ملف البيانات الأساسية الشاملة المعتمدة لكامل التطبيق (المطور محمد عبد الرحمن يوسف)
 * يتم تحديث هذا الملف تلقائياً ليشمل:
 * 1. إعدادات المنظومة الشاملة (الأسعار، الألوان، الباسوردات، النصوص، السكادا، وتطبيق وصلني)
 * 2. تخطيط وترتيب المساحات والأيقونات لكافة الشاشات الـ 6 (العميل، الفني، المشرف، الشكاوى، خدمة العملاء، المالية)
 * 3. مصفوفة الإظهار والإخفاء (Visibility) لكافة الأقسام
 * 4. بنك الهدايا والمكافآت المعتمد (Rewards)
 * 5. طاقم الفنيين بالمحطة والورديات (Crew)
 * 6. محطات ومواقع كارجاس والأنشطة (Locations)
 * 7. فلاتر وأنشطة الخريطة المعتمدة
 * 8. الشعار الموحد لكارجاس
 */
export const COMMITTED_CUSTOM_CONFIG: Partial<AppConfig> | null = null;

export const COMMITTED_CUSTOM_STATIONS_LOCATIONS: CargasStationLocation[] | null = null;

export const COMMITTED_MASTER_LOGO: string | null = null;

export const COMMITTED_REWARDS: RewardItem[] | null = null;

export const COMMITTED_CREW: TechnicianCrewMember[] | null = null;

export const COMMITTED_MAP_FILTERS: MapFacilityFilterItem[] | null = null;
