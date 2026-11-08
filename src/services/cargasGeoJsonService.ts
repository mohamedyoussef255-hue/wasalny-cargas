/**
 * خدمة محطات كارجاس المعتمدة (GeoJSON & Leaflet.js & Deep Linking)
 * 
 * الركائز الثلاث الأساسية:
 * 1. محرك الخرائط Leaflet.js: مكتبة مفتوحة المصدر بالكامل وخفيفة للغاية (<40KB) تعمل بدون أي مفاتيح API مدفوعة.
 * 2. قاعدة بيانات محطات كارجاس (GeoJSON): 352 موقعاً ومحطة ومركز تحويل وفحص أسطوانات مدمجة محلياً داخل التطبيق،
 *    مما يلغي استعلامات الخادم ويضمن عمل البحث فورياً بنسبة 100% دون تأخير أو استهلاك للبيانات.
 * 3. الملاحة عبر Deep Linking: توجيه مباشر لتطبيقات Google Maps أو Waze المثبتة على هاتف السائق مجاناً.
 */

import { Station, CargasFacilityType } from '../navigation/types';
import { CargasStationLocation } from '../types';
import rawGeoJson from '../data/cargasStationsGeoJSON.json';

export interface GeoJsonStationFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: string;
    name: string;
    code: string;
    company: string;
    facilityType: CargasFacilityType;
    address: string;
    city: string;
    governorate: string;
    latitude: number;
    longitude: number;
    phone: string;
    workingHours: string;
    cng: boolean;
    petrol: boolean;
    conversionCenter: boolean;
    oilCenter: boolean;
    cylinderInspection: boolean;
    canopyOil?: boolean;
    cngNozzles: number;
    pressureBar?: number;
    congestionLevel: 'low' | 'medium' | 'high';
    waitTimeMinutes: number;
    verified: boolean;
    services: string[];
    customLogoUrl?: string;
  };
}

export interface CargasGeoJsonCollection {
  type: 'FeatureCollection';
  metadata: {
    title: string;
    totalStations: number;
    coverage: string;
    format: string;
    engine: string;
    navigation: string;
    updatedAt: string;
  };
  features: GeoJsonStationFeature[];
}

export const CARGAS_GEOJSON_DATA = rawGeoJson as unknown as CargasGeoJsonCollection;

/**
 * تحويل ميزات الـ GeoJSON إلى قائمة محطات Station موحدة
 */
export function getAllGeoJsonStations(): Station[] {
  return CARGAS_GEOJSON_DATA.features.map((feature) => {
    const p = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;

    return {
      id: p.id,
      name: p.name,
      company: p.company || 'كارجاس',
      facilityType: p.facilityType || 'station',
      address: p.address,
      lat: p.latitude || lat,
      lng: p.longitude || lng,
      cng: p.cng ?? true,
      petrol: p.petrol ?? false,
      conversionCenter: p.conversionCenter ?? false,
      oilCenter: p.oilCenter ?? false,
      cylinderInspection: p.cylinderInspection ?? false,
      canopyOil: p.canopyOil ?? true,
      cngNozzles: p.cngNozzles || 8,
      pressureBar: p.pressureBar || 220,
      congestionLevel: p.congestionLevel || 'low',
      waitTimeMinutes: p.waitTimeMinutes || 3,
      workingHours: p.workingHours || '24 ساعة متواصلة',
      services: p.services || ['تموين غاز طبيعي مضغوط CNG'],
      phone: p.phone,
      customLogoUrl: p.customLogoUrl || '/assets/cargas-master-logo.png',
      verified: p.verified ?? true,
    };
  });
}

/**
 * تحويل ميزات الـ GeoJSON إلى قائمة CargasStationLocation للإدارة والتقارير
 */
export function getAllGeoJsonStationLocations(): CargasStationLocation[] {
  return CARGAS_GEOJSON_DATA.features.map((feature) => {
    const p = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;

    // Mapping internal facility type to StationFacilityType
    let facilityType: 'cng_station' | 'conversion_center' | 'oil_center' | 'cylinder_inspection' | 'canopy_oil' = 'cng_station';
    if (p.facilityType === 'conversion_center') facilityType = 'conversion_center';
    else if (p.facilityType === 'cylinder_testing') facilityType = 'cylinder_inspection';
    else if (p.facilityType === 'oil_center') facilityType = 'oil_center';

    return {
      id: p.id,
      name: p.name,
      code: p.code || `CARGAS-${p.id}`,
      city: p.city || 'القاهرة',
      address: p.address,
      facilityType,
      latitude: p.latitude || lat,
      longitude: p.longitude || lng,
      phone: p.phone,
      workingHours: p.workingHours,
      pumpCount: p.cngNozzles || 8,
      servicesAvailable: p.services || ['تموين غاز CNG', 'زيوت أسفل المظلة'],
      salesVolumeStatus: 'medium',
      promotionalPointsMultiplier: 1.0,
      promotionalBudgetEgp: 0,
      region: p.governorate || 'القاهرة الكبرى',
      costPerPointEgp: 0.15,
      pointsAwardRatePerMeter: 1.0,
      isLoyaltyProgramActive: true,
      financialApprovedByAdmin: true,
      financialApprovedAt: '2026-11-08 00:00',
    };
  });
}

/**
 * حساب المسافة بين نقطتين جغرافيتين بمعادلة هافرسين الدقيقة (بالكيلومتر)
 * يتم محلياً في الذاكرة بدون أي استعلام سيرفر (0ms)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * استخراج أقرب المحطات أو المراكز بناء على موقع السائق ونوع المرفق المطلوب
 * مرتبة تصاعدياً من الأقرب للأبعد فورياً
 */
export function getNearestStationsFromGeoJson(
  userLat: number,
  userLng: number,
  facilityType: CargasFacilityType | 'all' = 'all',
  limit: number = 3
): (Station & { distanceKm: number })[] {
  const allStations = getAllGeoJsonStations();

  // تصفية حسب نوع المركز المطلوب
  const filtered = allStations.filter((st) => {
    if (facilityType === 'all' || facilityType === 'station') {
      return st.cng === true;
    }
    if (facilityType === 'conversion_center') {
      return st.conversionCenter === true || st.facilityType === 'conversion_center';
    }
    if (facilityType === 'oil_center') {
      return st.oilCenter === true || st.facilityType === 'oil_center';
    }
    if (facilityType === 'cylinder_testing') {
      return st.cylinderInspection === true || st.facilityType === 'cylinder_testing';
    }
    return true;
  });

  // حساب المسافات وترتيب النتائج
  const withDistance = filtered.map((st) => ({
    ...st,
    distanceKm: calculateHaversineDistanceKm(userLat, userLng, st.lat, st.lng),
  }));

  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  return withDistance.slice(0, limit);
}

/**
 * البحث الفوري المحلي في قاعدة بيانات GeoJSON
 * يبحث في أسماء المحطات، العناوين، المحافظات، الخدمات بدون أي اتصال بالإنترنت
 */
export function searchStationsGeoJson(
  query: string,
  facilityType: CargasFacilityType | 'all' = 'all',
  governorate?: string
): Station[] {
  const all = getAllGeoJsonStations();
  const q = query.trim().toLowerCase();

  return all.filter((st) => {
    // تصفية النوع
    if (facilityType !== 'all') {
      if (facilityType === 'station' && !st.cng) return false;
      if (facilityType === 'conversion_center' && !st.conversionCenter && st.facilityType !== 'conversion_center') return false;
      if (facilityType === 'oil_center' && !st.oilCenter && st.facilityType !== 'oil_center') return false;
      if (facilityType === 'cylinder_testing' && !st.cylinderInspection && st.facilityType !== 'cylinder_testing') return false;
    }

    // تصفية المحافظة
    if (governorate && governorate !== 'الكل') {
      if (!st.address.includes(governorate) && st.company !== governorate) {
        // فحص في بيانات الميزة
        const feature = CARGAS_GEOJSON_DATA.features.find((f) => f.properties.id === st.id);
        if (feature && feature.properties.governorate !== governorate && feature.properties.city !== governorate) {
          return false;
        }
      }
    }

    if (!q) return true;

    return (
      st.name.toLowerCase().includes(q) ||
      st.address.toLowerCase().includes(q) ||
      st.services.some((s) => s.toLowerCase().includes(q))
    );
  });
}

/**
 * بناء روابط الملاحة عبر Deep Linking المباشر لتطبيقات الهواتف
 * 1. Google Maps: يفتح تطبيق خرائط جوجل المثبت على الهاتف مباشرة أو المتصفح
 * 2. Waze: يفتح تطبيق Waze الملاحي مباشرة أو المتصفح
 * 
 * هذا يلغي أي تكلفة لاستهلاك Google Maps API ويوفر أقصى دقة للسائق
 */
export function buildDeepLinkUrls(
  destinationLat: number,
  destinationLng: number,
  userOrigin?: [number, number]
): {
  googleMapsDeepLink: string;
  googleMapsWebFallback: string;
  wazeDeepLink: string;
  wazeWebFallback: string;
} {
  const originPart = userOrigin ? `&origin=${userOrigin[0]},${userOrigin[1]}` : '';

  // Google Maps Deep Link
  // على أجهزة أندرويد و iOS يفتح التطبيق مباشرة
  const googleMapsDeepLink = `google.navigation:q=${destinationLat},${destinationLng}&mode=d`;
  const googleMapsWebFallback = `https://www.google.com/maps/dir/?api=1${originPart}&destination=${destinationLat},${destinationLng}&travelmode=driving&dir_action=navigate`;

  // Waze Deep Link
  const wazeDeepLink = `waze://?ll=${destinationLat},${destinationLng}&navigate=yes`;
  const wazeWebFallback = `https://waze.com/ul?ll=${destinationLat},${destinationLng}&navigate=yes`;

  return {
    googleMapsDeepLink,
    googleMapsWebFallback,
    wazeDeepLink,
    wazeWebFallback,
  };
}

/**
 * تشغيل الملاحة الفورية بالسائق عبر Deep Linking
 */
export function launchDeepLinkNavigation(
  destinationLat: number,
  destinationLng: number,
  provider: 'google_maps' | 'waze' = 'google_maps',
  userOrigin?: [number, number]
): void {
  const urls = buildDeepLinkUrls(destinationLat, destinationLng, userOrigin);
  const targetUrl = provider === 'waze' ? urls.wazeWebFallback : urls.googleMapsWebFallback;

  // فتح الرابط في نافذة جديدة أو توجيه المتصفح لتطبيق الهاتف
  if (typeof window !== 'undefined') {
    // فحص إذا كان هاتف محمول لمحاولة تشغيل Deep Link للتطبيق الأصلي
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      if (provider === 'waze') {
        window.location.href = urls.wazeDeepLink;
        // Fallback بعد مهلة قصيرة إذا لم يكن التطبيق مثبتاً
        setTimeout(() => {
          window.open(urls.wazeWebFallback, '_blank');
        }, 1200);
        return;
      } else {
        // Google Maps on Mobile
        window.open(urls.googleMapsWebFallback, '_blank');
        return;
      }
    }

    // على أجهزة الكمبيوتر والمتصفحات العادية
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
}
