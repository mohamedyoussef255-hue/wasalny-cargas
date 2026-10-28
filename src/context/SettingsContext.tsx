import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchSystemSettingsFromDb,
  upsertSystemSettingToDb,
  INITIAL_DEFAULT_SETTINGS,
  getSupabaseConfig,
  saveSupabaseCredentials,
  testSupabaseConnection,
} from '../services/supabaseClient';

export interface SettingsContextType {
  settings: Record<string, any>;
  loading: boolean;
  isSupabaseConfigured: boolean;
  supabaseUrl: string;
  gasPrice: number;
  stationName: string;
  stationId: string;
  vatPercentage: number;
  currency: string;
  getSetting: <T>(key: string, defaultValue: T) => T;
  updateSetting: (key: string, value: any, updatedBy?: string) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  configureSupabase: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    // Immediate synchronous fallback from local storage if available to prevent any layout shift
    try {
      const cached = localStorage.getItem('cargas_supabase_system_settings');
      if (cached) {
        return { ...INITIAL_DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      // ignore
    }
    return { ...INITIAL_DEFAULT_SETTINGS };
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [supabaseConfig, setSupabaseConfigState] = useState(() => getSupabaseConfig());

  // 1. Initial Load & Auto-Seeding
  const loadAndSeedSettings = useCallback(async () => {
    try {
      setLoading(true);
      const fetched = await fetchSystemSettingsFromDb();
      setSettings((prev) => ({ ...prev, ...fetched }));
    } catch (err) {
      console.error('Error in loadAndSeedSettings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAndSeedSettings();
  }, [loadAndSeedSettings]);

  // 2. Safe Typed Getter
  const getSetting = useCallback(
    <T,>(key: string, defaultValue: T): T => {
      if (settings && key in settings && settings[key] !== undefined && settings[key] !== null) {
        return settings[key] as T;
      }
      return defaultValue;
    },
    [settings]
  );

  // 3. Optimistic Update with Persistent Supabase Upsert
  const updateSetting = useCallback(
    async (key: string, value: any, updatedBy?: string): Promise<boolean> => {
      // Instant Optimistic UI update
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));

      // Persist permanently in DB & LocalStorage
      const success = await upsertSystemSettingToDb(key, value, updatedBy);
      return success;
    },
    []
  );

  // 4. Supabase Live Connection Configurator
  const configureSupabase = useCallback(
    async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
      const testResult = await testSupabaseConnection(url, key);
      if (testResult.success) {
        saveSupabaseCredentials(url, key);
        setSupabaseConfigState(getSupabaseConfig());
        await loadAndSeedSettings();
      }
      return testResult;
    },
    [loadAndSeedSettings]
  );

  // Convenience shortcuts
  const gasPrice = Number(getSetting('gas_cubic_price', 7.0));
  const stationName = String(getSetting('station_name', 'محطة كارجاس - النيل النموذجية'));
  const stationId = String(getSetting('station_id', 'CARGAS-CAI-01'));
  const vatPercentage = Number(getSetting('vat_percentage', 14));
  const currency = String(getSetting('currency', 'ج.م'));

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        isSupabaseConfigured: Boolean(supabaseConfig.url && supabaseConfig.anonKey),
        supabaseUrl: supabaseConfig.url,
        gasPrice,
        stationName,
        stationId,
        vatPercentage,
        currency,
        getSetting,
        updateSetting,
        refreshSettings: loadAndSeedSettings,
        configureSupabase,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
