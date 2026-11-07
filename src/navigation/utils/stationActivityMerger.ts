// Station Activity Distribution & Intelligent Merge Engine for Cargas (طريقنا واحد)
// توزيع الأنشطة (فحص أسطوانات، مراكز زيوت، أسفل المظلة، مراكز تحويل وصيانة) على المحطات القائمة بدون تكرار

import { Station, CargasFacilityType } from '../types';
import { getDistanceMeters } from '../services/routingService';

/**
 * تطبيع وتنظيف اسم المحطة للمطابقة الذكية باللغة العربية
 */
export function normalizeStationNameForMatching(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // إزالة التشكيل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\-_–—,.:|/\\()\[\]{}#*]/g, ' ')
    // حذف الكلمات العامة التي تتكرر قبل اسم المحطة
    .replace(/\b(محطة|محطه|مركز|موقع|شركة|كار جاس|كارجاس|خدمة|خدمات|فرع|منفذ|طريق|بنزينة|بنزينه)\b/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * فحص ما إذا كانت المحطة الجديدة تطابق محطة قائمة بالفعل
 * (مطابقة بالإحداثيات الجغرافية أو مطابقة الاسم باللغة العربية)
 */
export function findMatchingExistingStation(
  incoming: Station,
  existingList: Station[]
): { match: Station; reason: 'coordinates' | 'name' | 'exact' } | null {
  // 1. المطابقة الدقيقة بالمعرف ID
  const exactIdMatch = existingList.find((s) => s.id === incoming.id);
  if (exactIdMatch) {
    return { match: exactIdMatch, reason: 'exact' };
  }

  // 2. المطابقة بالتقارب الجغرافي الدقيق GPS (إذا كانت المسافة أقل من 450 متراً)
  if (
    incoming.lat &&
    incoming.lng &&
    incoming.lat > 22 &&
    incoming.lat < 33 &&
    incoming.lng > 25 &&
    incoming.lng < 37
  ) {
    const geoMatch = existingList.find((existing) => {
      if (!existing.lat || !existing.lng) return false;
      const distance = getDistanceMeters(incoming.lat, incoming.lng, existing.lat, existing.lng);
      return distance <= 450; // نفس المجمع / المحطة الميدانية
    });

    if (geoMatch) {
      return { match: geoMatch, reason: 'coordinates' };
    }
  }

  // 3. المطابقة بالاسم العربي المطبع (Normalized Arabic Match)
  const normIncoming = normalizeStationNameForMatching(incoming.name);
  if (normIncoming.length >= 3) {
    const nameMatch = existingList.find((existing) => {
      const normExisting = normalizeStationNameForMatching(existing.name);
      if (normExisting.length < 3) return false;
      return (
        normIncoming === normExisting ||
        normIncoming.includes(normExisting) ||
        normExisting.includes(normIncoming)
      );
    });

    if (nameMatch) {
      return { match: nameMatch, reason: 'name' };
    }
  }

  return null;
}

export interface ActivityMergeResult {
  mergedStations: Station[];
  updatedCount: number;
  addedCount: number;
  details: {
    stationName: string;
    action: 'updated' | 'added';
    activitiesAdded: string[];
    matchReason?: string;
  }[];
}

/**
 * دمج وتوزيع الأنشطة (فحص أسطوانات، زيوت، أسفل المظلة، تحويل وصيانة)
 * على المحطات القائمة بدون إنشاء محطات مكررة على الخريطة
 */
export function mergeAndDistributeActivities(
  existingStations: Station[],
  incomingStations: Station[]
): ActivityMergeResult {
  const workingList: Station[] = existingStations.map((s) => ({
    ...s,
    services: Array.isArray(s.services) ? [...s.services] : [],
  }));

  let updatedCount = 0;
  let addedCount = 0;
  const details: ActivityMergeResult['details'] = [];

  incomingStations.forEach((incoming) => {
    const matchResult = findMatchingExistingStation(incoming, workingList);

    if (matchResult) {
      // محطة قائمة بالفعل: نقوم بتوزيع الأنشطة عليها بدون تكرار المحطة
      const target = matchResult.match;
      const activitiesAdded: string[] = [];

      // 1. نشاط مراكز التحويل والصيانة
      if (incoming.conversionCenter && !target.conversionCenter) {
        target.conversionCenter = true;
        activitiesAdded.push('مركز تحويل وصيانة غاز');
        if (!target.services.some((sv) => sv.includes('تحويل'))) {
          target.services.push('مركز تحويل وصيانة غاز');
        }
      }

      // 2. نشاط فحص واختبار الأسطوانات
      if (incoming.cylinderInspection && !target.cylinderInspection) {
        target.cylinderInspection = true;
        activitiesAdded.push('فحص واختبار أسطوانات');
        if (!target.services.some((sv) => sv.includes('فحص') || sv.includes('اسطوان'))) {
          target.services.push('فحص واختبار أسطوانات');
        }
      }

      // 3. نشاط مراكز الزيوت المعتمدة (BP / Castrol)
      if (incoming.oilCenter && !target.oilCenter) {
        target.oilCenter = true;
        activitiesAdded.push('مركز زيوت معتمد (BP)');
        if (!target.services.some((sv) => sv.includes('زيوت'))) {
          target.services.push('مركز زيوت معتمد (BP)');
        }
      }

      // 4. نشاط زيوت أسفل المظلة (Canopy Oil)
      if (incoming.canopyOil && !target.canopyOil) {
        target.canopyOil = true;
        activitiesAdded.push('زيوت أسفل المظلة');
        if (!target.services.some((sv) => sv.includes('مظلة'))) {
          target.services.push('خدمات زيوت أسفل المظلة');
        }
      }

      // 5. نشاط تموين الغاز الطبيعي
      if (incoming.cng && !target.cng) {
        target.cng = true;
        activitiesAdded.push('تموين غاز طبيعي');
      }

      // 6. دمج أي خدمات إضافية بدون تكرار
      if (Array.isArray(incoming.services)) {
        incoming.services.forEach((s) => {
          if (!target.services.includes(s)) {
            target.services.push(s);
          }
        });
      }

      // 7. تحسين العنوان إذا كان العنوان القائم عاماً والوارد تفصيلياً
      if (
        incoming.address &&
        incoming.address.length > 5 &&
        (!target.address || target.address.includes('جمهورية مصر العربية') || target.address.length < 10)
      ) {
        target.address = incoming.address;
      }

      // 8. تحديث الإحداثيات إذا كانت المحطة القائمة بإحداثيات تقريبية والملف الجديد بإحداثيات GPS دقيقة
      if (
        incoming.lat &&
        incoming.lng &&
        incoming.lat > 22 &&
        incoming.lat < 33 &&
        (!target.lat || Math.abs(target.lat - 30.0638) < 0.0001)
      ) {
        target.lat = incoming.lat;
        target.lng = incoming.lng;
      }

      // 9. تحسين نوع المنشأة لتشمل الأنشطة المتعددة
      if (target.conversionCenter && target.cng) {
        target.facilityType = 'conversion_center';
      } else if (target.cylinderInspection) {
        target.facilityType = 'cylinder_testing';
      } else if (target.oilCenter) {
        target.facilityType = 'oil_center';
      }

      target.updatedAt = new Date().toISOString();
      updatedCount++;

      details.push({
        stationName: target.name,
        action: 'updated',
        activitiesAdded: activitiesAdded.length > 0 ? activitiesAdded : ['تحديث وتأكيد الأنشطة الميدانية'],
        matchReason: matchResult.reason === 'coordinates' ? 'تطابق الإحداثيات الميدانية' : 'تطابق اسم المحطة',
      });
    } else {
      // محطة جديدة كلياً لم تكن موجودة بالقائمة: نقوم بإضافتها باسمها الأصلي وأنشطتها
      workingList.push({
        ...incoming,
        id: incoming.id || `cargas-new-${Date.now()}-${addedCount}`,
        updatedAt: new Date().toISOString(),
      });
      addedCount++;

      const newActivities: string[] = [];
      if (incoming.cng) newActivities.push('تموين غاز');
      if (incoming.conversionCenter) newActivities.push('مركز تحويل وصيانة');
      if (incoming.cylinderInspection) newActivities.push('فحص أسطوانات');
      if (incoming.oilCenter) newActivities.push('مراكز زيوت');
      if (incoming.canopyOil) newActivities.push('أسفل المظلة');

      details.push({
        stationName: incoming.name,
        action: 'added',
        activitiesAdded: newActivities,
      });
    }
  });

  return {
    mergedStations: workingList,
    updatedCount,
    addedCount,
    details,
  };
}
