/**
 * تعريفات جداول قاعدة البيانات Supabase PostgreSQL
 * ونظام الصلاحيات Row Level Security (RLS)
 * شركة عزوتي للبرمجيات وتكنولوجيا المعلومات - المطور: محمد عبد الرحمن يوسف
 */

export interface SystemSettingRecord {
  key: string;
  value: any;
  updated_at?: string;
  updated_by?: string | null;
}

export type PaymentMethod = 'cash' | 'e_wallet' | 'visa' | 'fleet_card' | string;

export interface RefuelingTransaction {
  id: string;
  station_id: string;
  station_name?: string;
  technician_id: string;
  technician_name?: string;
  car_plate: string;
  car_type: string;
  meter_start: number;
  meter_end: number;
  cubic_meters: number; // GENERATED ALWAYS AS (meter_end - meter_start) STORED
  unit_price: number;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  notes?: string;
}

export interface SystemSettingsMap {
  gas_cubic_price: number;
  station_name: string;
  station_id: string;
  vat_percentage: number;
  currency: string;
  app_maintenance: boolean;
  allowed_car_types: string[];
  allowed_payment_methods: { id: string; label: string; icon?: string }[];
  emergency_phone: string;
  admin_pin: string;
  assistant_voice_enabled: boolean;
  daily_target_m3: number;
  [key: string]: any;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustomConfigured: boolean;
  lastConnectedAt?: string;
}
