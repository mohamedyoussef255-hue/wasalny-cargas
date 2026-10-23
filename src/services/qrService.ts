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

export function parseDriverQrData(rawText: string) {
  try {
    const data = JSON.parse(rawText);
    if (data.cargasApp === 'EZOUTI_LOYALTY_V1' || data.carPlate) {
      return {
        isValid: true,
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
    // If user scanned just raw plate or text
    if (rawText.trim().length > 0) {
      return {
        isValid: true,
        driverId: 'MANUAL-' + Date.now().toString().slice(-4),
        name: 'عميل برقم لوحة',
        phone: '',
        carPlate: rawText.trim(),
        carModel: 'سيارة مسجلة',
        capacity: 70,
        odometer: 0,
      };
    }
  }
  return { isValid: false, driverId: '', name: '', phone: '', carPlate: '', carModel: '', capacity: 70, odometer: 0 };
}
