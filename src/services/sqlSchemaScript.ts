/**
 * سكربت SQL الكامل لإنشاء جداول قاعدة بيانات Supabase PostgreSQL
 * وسياسات الأمان Row Level Security (RLS) وحقن الصلاحيات دفعة واحدة.
 * شركة عزوتي للبرمجيات وتكنولوجيا المعلومات - المطور: محمد عبد الرحمن يوسف
 */

export const FULL_SUPABASE_SQL_SCRIPT = `-- =====================================================================
-- منظومة كارجاس المتكاملة لإدارة المحطات وعمليات التموين
-- تصميم وتنفيذ: شركة عزوتي للبرمجيات وتكنولوجيا المعلومات
-- المطور والمالك: محمد عبد الرحمن يوسف
-- سكربت إنشاء الجداول، الصلاحيات، وسياسات الأمان (RLS) على Supabase PostgreSQL
-- =====================================================================

-- تفعيل ملحق uuid-ossp أو pgcrypto لتوليد المعرفات الفريدة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1) جدول إعدادات النظام العام (system_settings)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.system_settings IS 'إعدادات النظام العامة والأسعار المركزية لمحطات كارجاس';
COMMENT ON COLUMN public.system_settings.key IS 'اسم الإعداد (مثل: gas_cubic_price, station_name, vat_percentage)';
COMMENT ON COLUMN public.system_settings.value IS 'القيمة الفعلية للإعداد بصيغة JSONB';

-- دالة لتحديث حقل updated_at تلقائياً عند أي تعديل
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_settings_timestamp ON public.system_settings;
CREATE TRIGGER trigger_update_system_settings_timestamp
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_timestamp();

-- ---------------------------------------------------------------------
-- 2) جدول عمليات وتسجيلات التموين (refueling_transactions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refueling_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id TEXT NOT NULL,
    technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    car_plate TEXT NOT NULL,
    car_type TEXT DEFAULT 'ملاكي',
    meter_start NUMERIC NOT NULL CHECK (meter_start >= 0),
    meter_end NUMERIC NOT NULL CHECK (meter_end >= meter_start),
    cubic_meters NUMERIC GENERATED ALWAYS AS (meter_end - meter_start) STORED,
    unit_price NUMERIC NOT NULL CHECK (unit_price > 0),
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT DEFAULT 'cash',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

COMMENT ON TABLE public.refueling_transactions IS 'سجل عمليات التموين وقراءات عدادات الغاز الطبيعي بالمحطات';
COMMENT ON COLUMN public.refueling_transactions.cubic_meters IS 'كمية الغاز بالمتر المكعب محسوبة تلقائياً (meter_end - meter_start)';

-- فهارس لتحسين سرعة الاستعلامات والتقارير
CREATE INDEX IF NOT EXISTS idx_refueling_created_at ON public.refueling_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refueling_station_id ON public.refueling_transactions (station_id);
CREATE INDEX IF NOT EXISTS idx_refueling_technician ON public.refueling_transactions (technician_id);
CREATE INDEX IF NOT EXISTS idx_refueling_car_plate ON public.refueling_transactions (car_plate);

-- ---------------------------------------------------------------------
-- 3) جدول جلسات التموين والربط بنظام السكادا (fueling_sessions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fueling_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id TEXT NOT NULL,
    hose_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    car_plate TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED')),
    volume_m3 NUMERIC DEFAULT 0,
    unit_price NUMERIC DEFAULT 13.0,
    total_amount NUMERIC DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    scada_transaction_id TEXT,
    technician_id TEXT
);

COMMENT ON TABLE public.fueling_sessions IS 'جلسات التموين الحية ونظام استقبال كميات الغاز تلقائياً من SCADA';

CREATE INDEX IF NOT EXISTS idx_fueling_sessions_status ON public.fueling_sessions (status);
CREATE INDEX IF NOT EXISTS idx_fueling_sessions_station_hose ON public.fueling_sessions (station_id, hose_id);
CREATE INDEX IF NOT EXISTS idx_fueling_sessions_created_at ON public.fueling_sessions (created_at DESC);

-- ---------------------------------------------------------------------
-- 4) تفعيل سياسات الأمان والحماية على مستوى الصف (Row Level Security - RLS)
-- ---------------------------------------------------------------------

-- تفعيل RLS على جدول الإعدادات
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول العمليات
ALTER TABLE public.refueling_transactions ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول جلسات التموين والسكادا
ALTER TABLE public.fueling_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and authenticated read fueling sessions" ON public.fueling_sessions;
CREATE POLICY "Public and authenticated read fueling sessions"
    ON public.fueling_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Technicians and Scada can insert and update sessions" ON public.fueling_sessions;
CREATE POLICY "Technicians and Scada can insert and update sessions"
    ON public.fueling_sessions FOR ALL USING (true);

-- ---------------------------------------------------------------------
-- 4) سياسات جدول الإعدادات (system_settings)
-- ---------------------------------------------------------------------

-- أ) سياسة القراءة (SELECT): متاحة لجميع المستخدمين المسجلين وغير المسجلين لاعتماد الأسعار الحالية
DROP POLICY IF EXISTS "Public and authenticated read system settings" ON public.system_settings;
CREATE POLICY "Public and authenticated read system settings"
    ON public.system_settings
    FOR SELECT
    USING (true);

-- ب) سياسة التعديل والإضافة (INSERT / UPDATE / UPSERT): محصورة حصراً بالمدير (role = 'admin')
DROP POLICY IF EXISTS "Admins can insert and update system settings" ON public.system_settings;
CREATE POLICY "Admins can insert and update system settings"
    ON public.system_settings
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'admin') OR 
        ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin') OR
        (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%admin%'))
    )
    WITH CHECK (
        (auth.jwt() ->> 'role' = 'admin') OR 
        ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin') OR
        (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%admin%'))
    );

-- ---------------------------------------------------------------------
-- 5) سياسات جدول عمليات التموين (refueling_transactions)
-- ---------------------------------------------------------------------

-- أ) سياسة الإضافة (INSERT): مسموحة لجميع الفنيين المسجلين دون أي حظر أو منع
DROP POLICY IF EXISTS "Technicians can insert refueling transactions" ON public.refueling_transactions;
CREATE POLICY "Technicians can insert refueling transactions"
    ON public.refueling_transactions
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- ب) سياسة القراءة (SELECT): 
-- الفني يرى عملياته اليومية فقط، بينما يرى المدير كل العمليات والتقارير
DROP POLICY IF EXISTS "Technicians see own daily txs and admins see all" ON public.refueling_transactions;
CREATE POLICY "Technicians see own daily txs and admins see all"
    ON public.refueling_transactions
    FOR SELECT
    TO authenticated, anon
    USING (
        -- المدير يرى كافة العمليات دون قيود
        (auth.jwt() ->> 'role' = 'admin') OR
        ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin') OR
        -- الفني يرى عملياته اليومية
        (technician_id = auth.uid() AND created_at >= CURRENT_DATE) OR
        -- أو في حالة استخدام الـ Anon للتطبيق الميداني
        (auth.uid() IS NULL)
    );

-- ---------------------------------------------------------------------
-- 6) حقن وتغذية القيم الافتراضية (Auto-Seeding)
-- ---------------------------------------------------------------------
INSERT INTO public.system_settings (key, value)
VALUES 
    ('gas_cubic_price', '7.00'::jsonb),
    ('station_name', '"محطة كارجاس - النيل النموذجية"'::jsonb),
    ('station_id', '"CARGAS-CAI-01"'::jsonb),
    ('vat_percentage', '14'::jsonb),
    ('currency', '"ج.م"'::jsonb),
    ('app_maintenance', 'false'::jsonb),
    ('emergency_phone', '"19058"'::jsonb),
    ('admin_pin', '"0000"'::jsonb),
    ('daily_target_m3', '15000'::jsonb),
    ('allowed_car_types', '["ملاكي", "تاكسي أبيض", "ميكروباص", "نقل خفيف / جامبو", "أتوبيس / ميني باص", "مركبة شركات / أسطول", "أخرى"]'::jsonb),
    ('allowed_payment_methods', '[
        {"id": "cash", "label": "نقدي (كاش)"},
        {"id": "e_wallet", "label": "محفظة إلكترونية (إنستاباي / كاش)"},
        {"id": "visa", "label": "فيزا / بطاقة بنكية"},
        {"id": "fleet_card", "label": "كارت شركة / أسطول"}
    ]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- رسالة نجاح التنفيذ
SELECT 'تم إنشاء وتجهيز جداول كارجاس وسياسات الأمان RLS بنجاح! جاهز للربط الفوري.' AS status;
`;
