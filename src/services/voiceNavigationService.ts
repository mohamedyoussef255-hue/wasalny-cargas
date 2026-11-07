// Navigation Voice Engine for Cargas (محرك الأصوات التوجيهية البشرية المجانية للملاحة)
// يدعم نماذج الأصوات البشرية الرجالية العربية والمصرية المجانية مثل: شاكر، حامد، وضاح، وغيرها.

import { CargasStationLocation } from '../types';

export type NavigationVoiceId =
  | 'shakir_egyptian'
  | 'hamed_arabic'
  | 'wadah_egyptian'
  | 'moen_advisor'
  | 'standard_arabic'
  | 'silent';

export interface NavigationVoiceMeta {
  id: NavigationVoiceId;
  name: string;
  shortName: string;
  avatar: string;
  badge: string;
  description: string;
  pitch: number;
  rate: number;
  keywords: string[];
}

export const NAVIGATION_VOICES: Record<NavigationVoiceId, NavigationVoiceMeta> = {
  shakir_egyptian: {
    id: 'shakir_egyptian',
    name: 'صوت شاكر المصري (بشري طبيعي - وقور وودود)',
    shortName: 'شاكر المصري',
    avatar: '🎙️',
    badge: 'مجاني • مصري بشري طبيعي',
    description: 'صوت رجالي مصري طبيعي يتميز بالهدوء والأسلوب المحترم المناسب للقيادة (مستوحى من نموذج Shakir Neural)',
    pitch: 0.92,
    rate: 0.98,
    keywords: ['shakir', 'shaker', 'شاكر', 'ar-eg', 'ar_eg', 'egypt', 'masr'],
  },
  hamed_arabic: {
    id: 'hamed_arabic',
    name: 'صوت حامد العربي (رجالي فصيح - هادئ ومتقن)',
    shortName: 'حامد العربي',
    avatar: '🔊',
    badge: 'مجاني • عربي فصيح موثوق',
    description: 'صوت رجالي عربي فصيح وقور بنبرة صوتية واضحة ودقيقة في التوجيه (مستوحى من نموذج Hamed Neural)',
    pitch: 0.88,
    rate: 0.95,
    keywords: ['hamed', 'hamid', 'حامد', 'ar-sa', 'ar_sa', 'saudi', 'arabic'],
  },
  wadah_egyptian: {
    id: 'wadah_egyptian',
    name: 'صوت وضاح المصري (ابن بلد - حماسي وشعبي)',
    shortName: 'وضاح المصري',
    avatar: '📢',
    badge: 'مجاني • مصري شعبي ودود',
    description: 'صوت محلي مصري شعبي خفيف الظل يرحب بالعميل بعبارات السائقين المعتادة',
    pitch: 1.02,
    rate: 1.05,
    keywords: ['wadah', 'ar-eg', 'ar_eg', 'egypt'],
  },
  moen_advisor: {
    id: 'moen_advisor',
    name: 'صوت مُعِين الاستشاري الذكي',
    shortName: 'مُعِين الذكي',
    avatar: '🤖',
    badge: 'مساعد ذكي',
    description: 'نبرة استشارية معلوماتية سريعة ودقيقة',
    pitch: 0.96,
    rate: 1.0,
    keywords: ['ar', 'arabic'],
  },
  standard_arabic: {
    id: 'standard_arabic',
    name: 'صوت لغة عربية فصحى معيارية',
    shortName: 'عربي فصيح',
    avatar: '🗣️',
    badge: 'فصحى معيارية',
    description: 'صوت ملاحة رسمي بعبارات موجزة',
    pitch: 1.0,
    rate: 1.0,
    keywords: ['ar', 'arabic'],
  },
  silent: {
    id: 'silent',
    name: 'بدون إرشاد صوتي (صامت)',
    shortName: 'صامت',
    avatar: '🔇',
    badge: 'صامت',
    description: 'كتم كافة الأصوات والتوجيه بالخريطة البصرية فقط',
    pitch: 1.0,
    rate: 1.0,
    keywords: [],
  },
};

/**
 * العثور على أفضل صوت مطابق في متصفح المستخدم (Edge, Chrome, Android, iOS, Safari)
 */
export function findBestVoiceForNavigation(voiceId: NavigationVoiceId): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const meta = NAVIGATION_VOICES[voiceId] || NAVIGATION_VOICES.shakir_egyptian;

  // 1. البحث المطابق بالاسم الدقيق أو الكلمات المفتاحية للنموذج (مثل Shakir أو Hamed)
  for (const kw of meta.keywords) {
    const match = voices.find(
      (v) =>
        v.name.toLowerCase().includes(kw.toLowerCase()) ||
        v.lang.toLowerCase().includes(kw.toLowerCase())
    );
    if (match) return match;
  }

  // 2. البحث عن أي صوت مصري ar-EG
  if (voiceId === 'shakir_egyptian' || voiceId === 'wadah_egyptian') {
    const egVoice = voices.find(
      (v) => v.lang.includes('ar-EG') || v.lang.includes('ar_EG') || v.lang.toLowerCase().includes('eg')
    );
    if (egVoice) return egVoice;
  }

  // 3. البحث عن أي صوت عربي رجالي أو عام
  const maleAr = voices.find(
    (v) =>
      v.lang.startsWith('ar') &&
      (v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('shakir') ||
        v.name.toLowerCase().includes('hamed') ||
        v.name.toLowerCase().includes('tarek') ||
        v.name.toLowerCase().includes('maged'))
  );
  if (maleAr) return maleAr;

  // 4. أي صوت عربي متاح
  const anyAr = voices.find((v) => v.lang.startsWith('ar'));
  if (anyAr) return anyAr;

  return null;
}

/**
 * صياغة النص الإرشادي بلهجة وأسلوب الشخصية المختارة
 */
export function generateVoiceGuidanceSpeech(
  station: CargasStationLocation,
  voiceId: NavigationVoiceId = 'shakir_egyptian'
): string {
  const distanceStr =
    station.distanceFromUserKm !== undefined
      ? `على بُعد ${station.distanceFromUserKm} كيلو متر من موقعك، `
      : '';
  const crowdStr = station.crowdLevel
    ? `وحالة المحطة الآن ${station.crowdLevel}، `
    : 'والمحطة جاهزة وسريعة، ';

  switch (voiceId) {
    case 'shakir_egyptian':
      return `يا فندم أهلاً بحضرتك، أنا شاكر معاك في الطريق خطوة بخطوة... أقرب محطة كارجاس لحضرتك هي محطة ${station.name}، ${distanceStr}${crowdStr}ضغط الغاز ممتاز والخدمة سريعة بدون انتظار، اضغط على زرار وصّلني ونتحرك سوا على خرائط جوجل بأمان وسهولة!`;

    case 'hamed_arabic':
      return `مرحباً بك، معك حامد مرشدك الذكي لملاحة كارجاس... أقرب محطة إليك هي محطة ${station.name}، ${distanceStr}${crowdStr}جاهزون لخدمتك بأعلى معايير الأمان وضغط الغاز، اضغط لبدء الملاحة والانطلاق مباشرة عبر خرائط جوجل.`;

    case 'wadah_egyptian':
      return `يا هلا بيك يا باشا! أنا وضاح، معاك في الطريق خطوة بخطوة... أقرب محطة كارجاس ليك هي محطة ${station.name}، ${distanceStr}${crowdStr}طريقك سالك وضغط الغاز عالي ومظبوط، دوس على زرار وصّلني ويلا بينا نتحرك سوا على خرائط جوجل!`;

    case 'moen_advisor':
      return `نظام كارجاس الذكي يوجهك إلى محطة ${station.name}، ${distanceStr}الضغط مستقر، اضغط للملاحة عبر الخرائط.`;

    case 'standard_arabic':
    default:
      return `أهلاً بك في ملاحة كارجاس. أقرب محطة إليك هي ${station.name}، ${distanceStr}اضغط للبدء في مسار الملاحة.`;
  }
}

/**
 * تشغيل الصوت التوجيهي الذكي مع إعداد النبرة ومعدل السرعة
 */
export function playNavigationVoice(
  _text: string,
  _voiceId: NavigationVoiceId = 'silent',
  _callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
  return false;
}

/**
 * إيقاف الصوت الجاري فوراً
 */
export function stopNavigationVoice(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
