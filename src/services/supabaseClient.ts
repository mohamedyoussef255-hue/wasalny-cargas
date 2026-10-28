import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RefuelingTransaction, SystemSettingRecord, SupabaseConfig } from '../types/database';

const STORAGE_SUPABASE_URL = 'cargas_supabase_url';
const STORAGE_SUPABASE_KEY = 'cargas_supabase_anon_key';
const LOCAL_SETTINGS_KEY = 'cargas_supabase_system_settings';
const LOCAL_TRANSACTIONS_KEY = 'cargas_supabase_refueling_transactions';

// Default initial settings for Auto-Seeding
export const INITIAL_DEFAULT_SETTINGS: Record<string, any> = {
  gas_cubic_price: 7.0, // سعر متر الغاز الطبيعي (ج.م)
  station_name: 'محطة كارجاس - النيل النموذجية',
  station_id: 'CARGAS-CAI-01',
  vat_percentage: 14,
  currency: 'ج.م',
  app_maintenance: false,
  emergency_phone: '19058',
  admin_pin: '0000',
  daily_target_m3: 15000,
  allowed_car_types: [
    'ملاكي',
    'تاكسي أبيض',
    'ميكروباص',
    'نقل خفيف / جامبو',
    'أتوبيس / ميني باص',
    'مركبة شركات / أسطول',
    'أخرى',
  ],
  allowed_payment_methods: [
    { id: 'cash', label: 'نقدي (كاش)' },
    { id: 'e_wallet', label: 'محفظة إلكترونية (إنستاباي / كاش)' },
    { id: 'visa', label: 'فيزا / بطاقة بنكية' },
    { id: 'fleet_card', label: 'كارت شركة / أسطول' },
  ],
};

let cachedClient: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = {
  url: '',
  anonKey: '',
  isCustomConfigured: false,
};

// Initialize configuration
export const getSupabaseConfig = (): SupabaseConfig => {
  if (typeof window === 'undefined') {
    return currentConfig;
  }
  const storedUrl = localStorage.getItem(STORAGE_SUPABASE_URL) || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const storedKey = localStorage.getItem(STORAGE_SUPABASE_KEY) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const isCustom = Boolean(storedUrl && storedKey);
  
  currentConfig = {
    url: storedUrl,
    anonKey: storedKey,
    isCustomConfigured: isCustom,
  };
  return currentConfig;
};

// Get or create client
export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }
  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return cachedClient;
};

// Save custom Supabase credentials
export const saveSupabaseCredentials = (url: string, key: string): boolean => {
  try {
    if (!url || !key) {
      localStorage.removeItem(STORAGE_SUPABASE_URL);
      localStorage.removeItem(STORAGE_SUPABASE_KEY);
      cachedClient = null;
      return true;
    }
    localStorage.setItem(STORAGE_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
    cachedClient = null; // Recreate with new credentials
    return true;
  } catch (e) {
    console.error('Error saving Supabase config:', e);
    return false;
  }
};

// Test connection
export const testSupabaseConnection = async (testUrl?: string, testKey?: string): Promise<{ success: boolean; message: string }> => {
  const url = testUrl || getSupabaseConfig().url;
  const key = testKey || getSupabaseConfig().anonKey;
  
  if (!url || !key) {
    return {
      success: false,
      message: 'بيانات الاتصال غير مكتملة (يرجى إدخال Project URL و Anon Key).',
    };
  }

  try {
    const tempClient = createClient(url, key);
    const { data, error } = await tempClient.from('system_settings').select('key').limit(1);
    if (error) {
      // If table doesn't exist yet, we still know the URL/key reached Supabase
      if (error.code === '42P01' || error.message.includes('relation "public.system_settings" does not exist')) {
        return {
          success: true,
          message: 'تم الاتصال بمشروع Supabase بنجاح! يلزم تشغيل سكربت SQL لإنشاء الجداول.',
        };
      }
      return {
        success: false,
        message: `فشل الاتصال: ${error.message}`,
      };
    }
    return {
      success: true,
      message: 'تم الاتصال بقاعدة بيانات Supabase بنجاح وتأكيد وجود جدول الإعدادات!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `خطأ في الاتصال: ${err.message || err}`,
    };
  }
};

// Local storage emulation helpers (guarantees offline resilience and instant response)
const getLocalSettings = (): Record<string, any> => {
  try {
    const data = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading local settings:', e);
  }
  return { ...INITIAL_DEFAULT_SETTINGS };
};

const saveLocalSettings = (settings: Record<string, any>) => {
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving local settings:', e);
  }
};

const getLocalTransactions = (): RefuelingTransaction[] => {
  try {
    const data = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading local transactions:', e);
  }
  // Initial demo seed transactions if completely empty
  const initialTxs: RefuelingTransaction[] = [
    {
      id: 'tx-seed-101',
      station_id: 'CARGAS-CAI-01',
      station_name: 'محطة كارجاس - النيل النموذجية',
      technician_id: 'tech-001',
      technician_name: 'محمود السيد (فني أول)',
      car_plate: 'أ ب ج 4 5 1 2',
      car_type: 'تاكسي أبيض',
      meter_start: 14200.0,
      meter_end: 14216.5,
      cubic_meters: 16.5,
      unit_price: 7.0,
      total_amount: 115.5,
      payment_method: 'cash',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      notes: 'تموين كامل - ضغط 200 بار',
    },
    {
      id: 'tx-seed-102',
      station_id: 'CARGAS-CAI-01',
      station_name: 'محطة كارجاس - النيل النموذجية',
      technician_id: 'tech-001',
      technician_name: 'محمود السيد (فني أول)',
      car_plate: 'س ر ق 8 9 2 0',
      car_type: 'ميكروباص',
      meter_start: 14216.5,
      meter_end: 14238.0,
      cubic_meters: 21.5,
      unit_price: 7.0,
      total_amount: 150.5,
      payment_method: 'e_wallet',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      notes: 'دفع إنستاباي - إشعار مؤكد',
    },
  ];
  saveLocalTransactions(initialTxs);
  return initialTxs;
};

const saveLocalTransactions = (txs: RefuelingTransaction[]) => {
  try {
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(txs));
  } catch (e) {
    console.error('Error saving local transactions:', e);
  }
};

// =====================================================================
// 1. System Settings Functions (Auto-Seeding & Permanent Persistence)
// =====================================================================

export const fetchSystemSettingsFromDb = async (): Promise<Record<string, any>> => {
  const local = getLocalSettings();
  const client = getSupabaseClient();
  
  if (!client) {
    return local;
  }

  try {
    const { data, error } = await client.from('system_settings').select('*');
    if (error) {
      console.warn('Supabase fetch error, fallback to local settings:', error.message);
      return local;
    }

    if (!data || data.length === 0) {
      // Auto-seeding into Supabase!
      await seedSystemSettingsToSupabase(client, local);
      return local;
    }

    const remoteSettings: Record<string, any> = {};
    data.forEach((row: SystemSettingRecord) => {
      remoteSettings[row.key] = row.value;
    });

    // Merge with defaults to ensure all keys exist
    const merged = { ...INITIAL_DEFAULT_SETTINGS, ...local, ...remoteSettings };
    saveLocalSettings(merged);
    return merged;
  } catch (err) {
    console.warn('Error fetching settings from Supabase, using local:', err);
    return local;
  }
};

export const seedSystemSettingsToSupabase = async (
  client: SupabaseClient,
  defaults: Record<string, any>
): Promise<void> => {
  try {
    const records = Object.entries(defaults).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    await client.from('system_settings').upsert(records, { onConflict: 'key' });
    console.log('Auto-seeded default settings into Supabase system_settings table.');
  } catch (e) {
    console.warn('Failed to auto-seed to Supabase:', e);
  }
};

export const upsertSystemSettingToDb = async (
  key: string,
  value: any,
  updated_by?: string
): Promise<boolean> => {
  // 1. Optimistic local update immediately
  const local = getLocalSettings();
  local[key] = value;
  saveLocalSettings(local);

  // 2. Persist to Supabase if client is ready
  const client = getSupabaseClient();
  if (client) {
    try {
      const payload: SystemSettingRecord = {
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: updated_by || null,
      };
      const { error } = await client.from('system_settings').upsert(payload, { onConflict: 'key' });
      if (error) {
        console.error(`Failed to upsert setting "${key}" to Supabase:`, error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(`Exception upserting setting "${key}":`, e);
      return false;
    }
  }

  return true;
};

// =====================================================================
// 2. Refueling Transactions (RLS Compliant & Filterable)
// =====================================================================

export interface RefuelingFilters {
  station_id?: string;
  technician_id?: string;
  car_plate?: string;
  car_type?: string;
  payment_method?: string;
  startDate?: string;
  endDate?: string;
}

export const fetchRefuelingTransactionsFromDb = async (
  filters?: RefuelingFilters,
  role: 'technician' | 'admin' | string = 'admin',
  currentTechnicianId?: string
): Promise<RefuelingTransaction[]> => {
  const client = getSupabaseClient();

  if (client) {
    try {
      let query = client.from('refueling_transactions').select('*').order('created_at', { ascending: false });

      // Apply RLS role condition
      if (role === 'technician' && currentTechnicianId) {
        query = query.eq('technician_id', currentTechnicianId);
        // Technicians see today's transactions
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        query = query.gte('created_at', todayStart.toISOString());
      }

      if (filters?.station_id && filters.station_id !== 'ALL') {
        query = query.eq('station_id', filters.station_id);
      }
      if (filters?.technician_id && filters.technician_id !== 'ALL') {
        query = query.eq('technician_id', filters.technician_id);
      }
      if (filters?.car_type && filters.car_type !== 'ALL') {
        query = query.eq('car_type', filters.car_type);
      }
      if (filters?.payment_method && filters.payment_method !== 'ALL') {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters?.car_plate) {
        query = query.ilike('car_plate', `%${filters.car_plate.trim()}%`);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as RefuelingTransaction[];
      }
      console.warn('Supabase tx query error, falling back to local:', error?.message);
    } catch (e) {
      console.warn('Supabase tx fetch exception, falling back to local:', e);
    }
  }

  // Fallback to local storage with identical RLS and filtering simulation
  let all = getLocalTransactions();

  if (role === 'technician' && currentTechnicianId) {
    const today = new Date().toISOString().slice(0, 10);
    all = all.filter((tx) => tx.technician_id === currentTechnicianId && tx.created_at.startsWith(today));
  }

  if (filters?.station_id && filters.station_id !== 'ALL') {
    all = all.filter((t) => t.station_id === filters.station_id);
  }
  if (filters?.technician_id && filters.technician_id !== 'ALL') {
    all = all.filter((t) => t.technician_id === filters.technician_id);
  }
  if (filters?.car_type && filters.car_type !== 'ALL') {
    all = all.filter((t) => t.car_type === filters.car_type);
  }
  if (filters?.payment_method && filters.payment_method !== 'ALL') {
    all = all.filter((t) => t.payment_method === filters.payment_method);
  }
  if (filters?.car_plate) {
    all = all.filter((t) => t.car_plate.toLowerCase().includes(filters.car_plate!.toLowerCase()));
  }
  if (filters?.startDate) {
    all = all.filter((t) => t.created_at >= filters.startDate!);
  }
  if (filters?.endDate) {
    all = all.filter((t) => t.created_at <= filters.endDate!);
  }

  return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const insertRefuelingTransactionToDb = async (
  txInput: Omit<RefuelingTransaction, 'id' | 'created_at' | 'cubic_meters'> & { cubic_meters?: number }
): Promise<RefuelingTransaction> => {
  const calculatedCubicMeters = Number((txInput.meter_end - txInput.meter_start).toFixed(2));
  const newId = 'tx-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  const nowIso = new Date().toISOString();

  const newTx: RefuelingTransaction = {
    id: newId,
    station_id: txInput.station_id,
    station_name: txInput.station_name || 'محطة كارجاس',
    technician_id: txInput.technician_id,
    technician_name: txInput.technician_name || 'فني كارجاس',
    car_plate: txInput.car_plate,
    car_type: txInput.car_type || 'ملاكي',
    meter_start: Number(txInput.meter_start),
    meter_end: Number(txInput.meter_end),
    cubic_meters: calculatedCubicMeters,
    unit_price: Number(txInput.unit_price),
    total_amount: Number(txInput.total_amount),
    payment_method: txInput.payment_method || 'cash',
    created_at: nowIso,
    notes: txInput.notes || '',
  };

  // 1. Save to local storage for instant offline capability and fallback
  const local = getLocalTransactions();
  local.unshift(newTx);
  saveLocalTransactions(local);

  // 2. Persist to Supabase if connected
  const client = getSupabaseClient();
  if (client) {
    try {
      // In PostgreSQL, cubic_meters is a STORED GENERATED column, so we exclude it from insert
      const { cubic_meters, station_name, technician_name, ...dbPayload } = newTx;
      const { data, error } = await client
        .from('refueling_transactions')
        .insert([dbPayload])
        .select()
        .single();

      if (error) {
        console.error('Supabase transaction insert error:', error);
      } else if (data) {
        return {
          ...newTx,
          id: data.id,
          cubic_meters: data.cubic_meters || calculatedCubicMeters,
        };
      }
    } catch (err) {
      console.warn('Failed to insert tx into Supabase, kept in local:', err);
    }
  }

  return newTx;
};
