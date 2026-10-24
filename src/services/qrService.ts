import QRCode from 'qrcode';

export async function generateQrDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 260,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR Code:', error);
    return '';
  }
}

export function encodeDriverQrData(driver: {
  id: string;
  name: string;
  phone: string;
  carPlate: string;
  carModel: string;
  cngCylinderCapacity?: number;
  odometerKm?: number;
}): string {
  // We encode a structured payload that technician scanner can parse in 1ms
  const payload = {
    cargasApp: 'EZOUTI_LOYALTY_V1',
    type: 'DRIVER_ID',
    driverId: driver.id,
    name: driver.name,
    phone: driver.phone,
    carPlate: driver.carPlate,
    carModel: driver.carModel,
    capacity: driver.cngCylinderCapacity || 70,
    odo: driver.odometerKm || 0,
    timestamp: Date.now(),
  };
  return JSON.stringify(payload);
}

// ترميز كود كيو آر (QR) الخاص بصرف واستبدال الأمتار المجانية لدى فني التموين
export function encodeRewardRedemptionQrData(redemption: {
  id: string;
  redemptionCode: string;
  rewardId: string;
  rewardTitle: string;
  driverId: string;
  driverName: string;
  pointsSpent: number;
  freeMeters: number;
  carPlate?: string;
  carModel?: string;
}): string {
  const payload = {
    cargasApp: 'EZOUTI_LOYALTY_V1',
    type: 'FREE_METERS_REWARD',
    redemptionId: redemption.id,
    redemptionCode: redemption.redemptionCode,
    rewardId: redemption.rewardId,
    rewardTitle: redemption.rewardTitle,
    freeMeters: redemption.freeMeters,
    driverId: redemption.driverId,
    driverName: redemption.driverName,
    carPlate: redemption.carPlate || '',
    carModel: redemption.carModel || '',
    pointsSpent: redemption.pointsSpent,
    timestamp: Date.now(),
  };
  return JSON.stringify(payload);
}

export function parseDriverQrData(rawText: string) {
  try {
    const data = JSON.parse(rawText);

    // التحقق أولاً إذا كان الكود هو كود استبدال أمتار مجانية لدى الفني
    if (data.type === 'FREE_METERS_REWARD' || data.redemptionCode) {
      return {
        isValid: true,
        isRewardRedemption: true,
        redemptionId: data.redemptionId || '',
        redemptionCode: data.redemptionCode || '',
        rewardTitle: data.rewardTitle || 'أمتار غاز مجانية',
        freeMeters: Number(data.freeMeters) || 10,
        driverId: data.driverId || 'DRV-01',
        name: data.driverName || 'عميل كارجاس',
        phone: data.phone || '',
        carPlate: data.carPlate || '',
        carModel: data.carModel || '',
        pointsSpent: Number(data.pointsSpent) || 0,
        capacity: 70,
        odometer: 0,
      };
    }

    if (data.cargasApp === 'EZOUTI_LOYALTY_V1' || data.carPlate) {
      return {
        isValid: true,
        isRewardRedemption: false,
        driverId: data.driverId || 'DRV-' + Math.floor(Math.random() * 10000),
        name: data.name || 'عميل كارجاس',
        phone: data.phone || '',
        carPlate: data.carPlate || '',
        carModel: data.carModel || 'سيارة ملاكي / تاكسي',
        capacity: data.capacity || 70,
        odometer: data.odo || 0,
      };
    }
  } catch {
    const trimmed = rawText.trim();
    // إذا كان المدخل يبدأ بـ VOUCH فهو كود استبدال هدية يدوي
    if (trimmed.toUpperCase().startsWith('VOUCH-') || trimmed.toUpperCase().startsWith('RED-')) {
      return {
        isValid: true,
        isRewardRedemption: true,
        redemptionCode: trimmed.toUpperCase(),
        redemptionId: '',
        rewardTitle: 'أمتار غاز مجانية مستبدلة',
        freeMeters: 10,
        driverId: '',
        name: 'عميل كود الاستبدال',
        phone: '',
        carPlate: '',
        carModel: '',
        pointsSpent: 0,
        capacity: 70,
        odometer: 0,
      };
    }

    // If user scanned just raw plate or text
    if (trimmed.length > 0) {
      return {
        isValid: true,
        isRewardRedemption: false,
        driverId: 'MANUAL-' + Date.now().toString().slice(-4),
        name: 'عميل برقم لوحة',
        phone: '',
        carPlate: trimmed,
        carModel: 'سيارة مسجلة',
        capacity: 70,
        odometer: 0,
      };
    }
  }
  return { isValid: false, isRewardRedemption: false, driverId: '', name: '', phone: '', carPlate: '', carModel: '', capacity: 70, odometer: 0 };
}
