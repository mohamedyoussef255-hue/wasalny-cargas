import {
  ScadaTransactionPayload,
  FuelingSession,
  FuelingTransaction,
  AppConfig,
  DriverProfile,
} from '../types';
import {
  getAppConfig,
  saveAppConfig,
  getActiveFuelingSession,
  updateFuelingSession,
  getDriverProfile,
  saveDriverProfile,
  getTransactions,
  saveTransactions,
  calculatePointsFromFormula,
  calculateStationLoyaltyPoints,
  getDriverStationAndPumpFuelingCounts,
  getFuelingSessions,
} from './storageService';

export interface ScadaProcessResult {
  success: boolean;
  message: string;
  session?: FuelingSession;
  transaction?: FuelingTransaction;
  pointsEarned?: number;
  error?: string;
}

/**
 * معالجة قراءة العداد المستلمة من نظام السكادا (SCADA Webhook Handler)
 * مسار: POST /api/scada/complete-transaction
 */
export function completeScadaTransaction(
  payload: ScadaTransactionPayload
): ScadaProcessResult {
  const config = getAppConfig();
  const scadaCfg = config.scadaConfig || {
    enabled: true,
    apiKey: 'cargas_scada_secret_2026',
    autoWindowMinutes: 10,
  };

  // 1. التحقق من مفتاح الأمان api_key
  const expectedKey = (scadaCfg.apiKey || 'cargas_scada_secret_2026').trim();
  const providedKey = (payload.api_key || '').trim();

  if (providedKey !== expectedKey) {
    // تسجيل الإشارة الخاطئة في التكوين للمراقبة
    if (config.scadaConfig) {
      config.scadaConfig.lastReceivedSignal = {
        timestamp: new Date().toISOString(),
        station_id: payload.station_id || '',
        hose_id: payload.hose_id || '',
        volume_m3: payload.volume_m3 || 0,
        transaction_id: payload.transaction_id || '',
        status: 'invalid_key',
      };
      saveAppConfig(config);
    }

    return {
      success: false,
      message: 'مفتاح الأمان الخاص بنظام السكادا غير مصرح به (Invalid API Key)',
      error: 'UNAUTHORIZED_API_KEY',
    };
  }

  // 2. التحقق من صحة كمية الغاز المستلمة من العداد
  const volume = Number(payload.volume_m3);
  if (isNaN(volume) || volume <= 0) {
    return {
      success: false,
      message: 'قراءة كمية الغاز (volume_m3) غير صحيحة أو تساوي صفراً',
      error: 'INVALID_VOLUME',
    };
  }

  // 3. البحث عن الجلسة النشطة (IN_PROGRESS) لنفس المحطة والمسدس في نافذة الـ 10 دقائق
  const windowMinutes = scadaCfg.autoWindowMinutes || 10;
  const activeSession = getActiveFuelingSession(
    payload.station_id,
    payload.hose_id,
    windowMinutes
  );

  if (!activeSession) {
    if (config.scadaConfig) {
      config.scadaConfig.lastReceivedSignal = {
        timestamp: new Date().toISOString(),
        station_id: payload.station_id,
        hose_id: payload.hose_id,
        volume_m3: volume,
        transaction_id: payload.transaction_id,
        status: 'unmatched',
      };
      saveAppConfig(config);
    }

    return {
      success: false,
      message: `لم يتم العثور على جلسة تموين نشطة (IN_PROGRESS) للمحطة [${payload.station_id}] ومسدس التموين [${payload.hose_id}] خلال آخر ${windowMinutes} دقائق`,
      error: 'SESSION_NOT_FOUND',
    };
  }

  // 4. احتساب النقاط بناءً على ما تقره وتعتمد الإدارة المالية لكل محطة
  const unitPrice = activeSession.unit_price || config.gasPricePerMeter || 13;
  const totalAmount = parseFloat((volume * unitPrice).toFixed(2));
  
  // استدعاء تسعيرة الإدارة المالية المعتمدة للمحطة
  const stationFinancial = calculateStationLoyaltyPoints(
    volume,
    payload.station_id || activeSession.station_id,
    config
  );
  const pointsEarned = stationFinancial.points;
  const completedAt = new Date().toISOString();

  // 5. تحديث الجلسة في قاعدة البيانات إلى COMPLETED
  const updatedSession = updateFuelingSession(activeSession.session_id, {
    status: 'COMPLETED',
    volume_m3: volume,
    total_amount: totalAmount,
    points_earned: pointsEarned,
    completed_at: completedAt,
    scada_transaction_id: payload.transaction_id,
  });

  // 6. إضافة النقاط لمحفظة العميل وتحديث إجمالي استهلاكه
  const currentDriver = getDriverProfile();
  if (currentDriver.carPlate === activeSession.car_plate || currentDriver.id === activeSession.user_id) {
    const updatedDriver: DriverProfile = {
      ...currentDriver,
      points: (currentDriver.points || 0) + pointsEarned,
      totalMetersFueled: parseFloat(((currentDriver.totalMetersFueled || 0) + volume).toFixed(1)),
      totalSpentEgp: parseFloat(((currentDriver.totalSpentEgp || 0) + totalAmount).toFixed(2)),
      odometerKm: activeSession.odometer_km || currentDriver.odometerKm,
    };
    saveDriverProfile(updatedDriver);
  }

  // 7. إنشاء وحفظ إيصال التموين في سجل العمليات (FuelingTransaction) مع الرصد المالي
  const allTxs = getTransactions();
  const { stationCount, pumpCount } = getDriverStationAndPumpFuelingCounts(
    allTxs,
    activeSession.user_id,
    activeSession.station_name || config.stationName,
    parseInt(activeSession.hose_id.replace(/\D/g, '')) || 1
  );

  const receiptNum = `SCADA-${new Date().getFullYear()}-${payload.transaction_id.slice(-5) || Math.floor(1000 + Math.random() * 9000)}`;
  const newTx: FuelingTransaction = {
    id: 'TX-SCADA-' + Date.now(),
    receiptNumber: receiptNum,
    timestamp: completedAt,
    driverId: activeSession.user_id,
    driverName: activeSession.driver_name || 'سائق كارجاس',
    carPlate: activeSession.car_plate,
    carModel: activeSession.car_model || 'سيارة ملاكي غاز',
    technicianId: activeSession.technician_id || 'tech-001',
    technicianName: activeSession.technician_name || 'فني الوردية',
    stationName: activeSession.station_name || config.stationName,
    pumpNumber: parseInt(activeSession.hose_id.replace(/\D/g, '')) || 1,
    metersQuantity: volume,
    pricePerMeter: unitPrice,
    totalAmountEgp: totalAmount,
    pointsEarned,
    odometerReading: activeSession.odometer_km || currentDriver.odometerKm || 85400,
    gpsDistanceMeters: 3.2,
    verifiedGps: true,
    driverStationFuelingCount: stationCount + 1,
    driverPumpFuelingCount: pumpCount + 1,
    stationCostPerPointEgp: stationFinancial.costPerPointEgp,
    stationPointsRate: stationFinancial.ratePerMeter,
    financialLiabilityEgp: stationFinancial.totalLiabilityEgp,
    regionName: stationFinancial.region,
  };

  allTxs.unshift(newTx);
  saveTransactions(allTxs);

  // 8. تحديث آخر إشارة في تكوين السكادا
  if (config.scadaConfig) {
    config.scadaConfig.lastReceivedSignal = {
      timestamp: completedAt,
      station_id: payload.station_id,
      hose_id: payload.hose_id,
      volume_m3: volume,
      transaction_id: payload.transaction_id,
      status: 'matched',
      sessionId: activeSession.session_id,
      carPlate: activeSession.car_plate,
      pointsEarned,
    };
    saveAppConfig(config);
  }

  // 9. إرسال حدث مخصص للمتصفح لتحديث الشاشات لحظياً (Broadcast Event)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cargas_scada_session_completed', {
        detail: {
          session: updatedSession,
          transaction: newTx,
          pointsEarned,
          volume,
          totalAmount,
          carPlate: activeSession.car_plate,
        },
      })
    );
  }

  return {
    success: true,
    message: `تم استلام قراءة السكادا بنجاح: ${volume} م³ — وتم إضافة ${pointsEarned} نقطة لحساب السائق ${activeSession.car_plate} وتوليد الإيصال رقم ${receiptNum}`,
    session: updatedSession || undefined,
    transaction: newTx,
    pointsEarned,
  };
}

/**
 * زر محاكاة إرسال إشارة السكادا من داخل التطبيق (للاختبار الفوري السهل)
 */
export function simulateScadaSignal(
  stationId: string,
  hoseId: string,
  customVolume?: number
): ScadaProcessResult {
  const config = getAppConfig();
  const apiKey = config.scadaConfig?.apiKey || 'cargas_scada_secret_2026';
  const volume = customVolume && customVolume > 0 ? customVolume : Number((12 + Math.random() * 12).toFixed(1));
  const txId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

  return completeScadaTransaction({
    api_key: apiKey,
    station_id: stationId,
    hose_id: hoseId,
    volume_m3: volume,
    transaction_id: txId,
  });
}
