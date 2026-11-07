import {
  AppConfig,
  CargasStationLocation,
  RewardItem,
  TechnicianCrewMember,
  MapFacilityFilterItem,
} from '../types';

/**
 * ملف البيانات الأساسية الشاملة المعتمدة لكامل التطبيق (المطور محمد عبد الرحمن يوسف)
 * تم تثبيتها واعتمادها بتاريخ: 2026-11-07T12:57:20.715Z
 * تظل ثابتة لجميع المستخدمين والزوار الجدد على GitHub و Vercel
 */
export const COMMITTED_CUSTOM_CONFIG: Partial<AppConfig> | null = {
  "appName": "كارجاس مصر",
  "themeColor": "emerald"
};

export const COMMITTED_CUSTOM_STATIONS_LOCATIONS: CargasStationLocation[] | null = [];

export const COMMITTED_MASTER_LOGO: string | null = null;

export const COMMITTED_REWARDS: RewardItem[] | null = null;

export const COMMITTED_CREW: TechnicianCrewMember[] | null = null;

export const COMMITTED_MAP_FILTERS: MapFacilityFilterItem[] | null = null;
