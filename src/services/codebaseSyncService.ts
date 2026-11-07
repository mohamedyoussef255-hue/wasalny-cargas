import { Station as NavStation } from '../navigation/types';
import {
  AppConfig,
  CargasStationLocation,
  RewardItem,
  TechnicianCrewMember,
  MapFacilityFilterItem,
} from '../types';

export interface SyncCodebaseResponse {
  success: boolean;
  message: string;
  stationCount?: number;
  logoUrl?: string;
  timestamp?: string;
  error?: string;
}

export interface ComprehensiveCodebasePayload {
  navStations: NavStation[];
  stationLocations: CargasStationLocation[];
  config: AppConfig;
  rewards?: RewardItem[];
  crew?: TechnicianCrewMember[];
  mapFilters?: MapFacilityFilterItem[];
  logoUrl?: string;
}

/**
 * التعميم الشامل على أي تغيير أو تعديل يقوم به مدير النظام (المطور محمد عبد الرحمن يوسف)
 * في التطبيق ككل:
 * - محطات الخريطة (الـ 300 محطة) والأنشطة (تموين، زيوت أسفل المظلة، مراكز زيوت، تحويل وصيانة، فحص، 2027)
 * - لوجو كارجاس الموحد (حفظه كصورة فيزيائية بمجلد public/assets/cargas-master-logo)
 * - تخطيط وترتيب المساحات والأيقونات لكافة الشاشات الـ 6 (العميل، الفني، المشرف، الشكاوى، خدمة العملاء، المالية)
 * - إعدادات المنظومة والأسعار والباسوردات والنصوص وسكادا وتطبيق وصلني
 * - بنك الهدايا والمكافآت (Rewards)
 * - طاقم الفنيين بالمحطة (Crew)
 * - فلاتر وأنشطة الخريطة (Facility Filters)
 */
import {
  getAppConfig,
  getStationLocations,
  getRewards,
  getStationCrew,
  getMapFacilityFilters,
  getMasterStationMapLogo,
} from './storageService';

export async function syncCurrentStateToCodebase(payload: ComprehensiveCodebasePayload): Promise<SyncCodebaseResponse> {
  try {
    const res = await fetch('/api/admin/sync-codebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP ${res.status}`);
    }

    const data: SyncCodebaseResponse = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to sync to codebase:', err);
    return {
      success: false,
      message: err.message || 'تعذر الاتصال بخادم التطبيق لمزامنة الملفات',
      error: err.toString(),
    };
  }
}

/**
 * دالة التعميم الشاملة لحفظ وتثبيت كامل بيانات المنظومة في الكود المصدري على القرص
 * تشمل: الإعدادات، تكلفة النقطة، حوافز الفنيين، بنك الهدايا، المحطات، الشعار، والفلاتر
 * لتصبح جاهزة فوراً للرفع على GitHub والنشر المباشر على Vercel أو أي استضافة
 */
export async function syncEntireAppToCodebase(options?: {
  customConfig?: Partial<AppConfig>;
  stations?: CargasStationLocation[];
  rewards?: RewardItem[];
}): Promise<SyncCodebaseResponse> {
  try {
    const baseConfig = options?.customConfig
      ? { ...getAppConfig(), ...options.customConfig }
      : getAppConfig();
    const stationLocations = options?.stations && options.stations.length > 0 ? options.stations : getStationLocations();
    const navStations = stationLocations.map((st) => ({
      ...st,
      cng: true,
    })) as any;
    const rewardsList = options?.rewards && options.rewards.length > 0 ? options.rewards : getRewards();
    const crew = getStationCrew();
    const mapFilters = getMapFacilityFilters();
    const logoUrl = getMasterStationMapLogo() || baseConfig.stationLogoUrl;

    return await syncCurrentStateToCodebase({
      navStations,
      stationLocations,
      config: baseConfig,
      rewards: rewardsList,
      crew,
      mapFilters,
      logoUrl,
    });
  } catch (err: any) {
    console.error('Failed in syncEntireAppToCodebase:', err);
    return {
      success: false,
      message: err.message || 'حدث خطأ أثناء جمع البيانات وتثبيتها في الكود المصدري',
      error: err.toString(),
    };
  }
}

/**
 * نص أوامر الرفع على جيت هب للنسخ السريع
 */
export function getGitCommitAndPushCommand(message = 'feat(cargas): update system baseline and financial rates'): string {
  return `git add . && git commit -m "${message}" && git push`;
}

/**
 * تحميل نسخة احتياطية شاملة لكامل بيانات النظام كملف JSON مستقل
 */
export function downloadSystemDataBackup(payload: ComprehensiveCodebasePayload): void {
  const jsonStr = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      developer: 'محمد عبد الرحمن يوسف',
      company: 'شركة عزوتي للبرمجيات وتكنولوجيا المعلومات',
      version: 'v3.5 Enterprise Cargas (Full System Sync)',
      totalStations: payload.navStations.length,
      stations: payload.navStations,
      locations: payload.stationLocations,
      config: payload.config,
      rewards: payload.rewards,
      crew: payload.crew,
      mapFilters: payload.mapFilters,
      logoUrl: payload.logoUrl,
    },
    null,
    2
  );

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `بيانات_منظومة_كارجاس_الشاملة_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
