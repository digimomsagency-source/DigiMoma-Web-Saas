-- ==============================================================================
-- DIGIMOMS MULTI-TENANT SAAS DATABASE SCHEMA & RLS FIX FOR SUPABASE
-- TARGET HOST: web.digimoms.in
-- Run this complete SQL script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Businesses Table (Supports multi-tenant websites & custom pricing)
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255),
    plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    service_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    custom_pricing JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already existed with UUID type or missing custom_pricing, alter it:
ALTER TABLE IF EXISTS public.businesses ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS custom_pricing JSONB DEFAULT NULL;

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_businesses_mobile ON public.businesses(mobile);
CREATE INDEX IF NOT EXISTS idx_businesses_subdomain ON public.businesses(subdomain);

-- 3. Tenant Files & CMS Table (HTML, CSS, JS, Images, Directories)
CREATE TABLE IF NOT EXISTS public.tenant_files (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content_type TEXT DEFAULT 'text/plain',
    content TEXT,
    is_directory BOOLEAN DEFAULT FALSE,
    parent_path TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_tenant_files_business ON public.tenant_files(business_id);
CREATE INDEX IF NOT EXISTS idx_tenant_files_path ON public.tenant_files(business_id, path);

-- 4. Transactions Table (Logs payment attempts, status & gateway references)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    mobile VARCHAR(20),
    plan_tier VARCHAR(50) NOT NULL CHECK (plan_tier IN ('monthly', 'six_month', 'one_year')),
    amount NUMERIC(10, 2) NOT NULL,
    original_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    coupon_code VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Failed')),
    payu_txnid VARCHAR(100) NOT NULL UNIQUE,
    payu_payment_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_transactions_business ON public.transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_txnid ON public.transactions(payu_txnid);

-- 5. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_amount NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. System Settings Table (PayU Merchant Keys, Pricing Tiers, WhatsApp)
CREATE TABLE IF NOT EXISTS public.settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global_config',
    payu_merchant_key VARCHAR(255) DEFAULT 'gtKFFx',
    payu_salt VARCHAR(255) DEFAULT 'eCwWELxi',
    payu_env VARCHAR(10) DEFAULT 'test' CHECK (payu_env IN ('test', 'prod')),
    whatsapp_number VARCHAR(30) DEFAULT '+919475388085',
    whatsapp_message TEXT DEFAULT 'I want to renewal domain',
    monthly_price NUMERIC(10, 2) DEFAULT 99.00,
    monthly_strike NUMERIC(10, 2) DEFAULT 999.00,
    six_month_price NUMERIC(10, 2) DEFAULT 499.00,
    six_month_strike NUMERIC(10, 2) DEFAULT 594.00,
    one_year_price NUMERIC(10, 2) DEFAULT 949.00,
    one_year_strike NUMERIC(10, 2) DEFAULT 1188.00,
    admin_password VARCHAR(255) DEFAULT 'admin123456',
    simulated_db_size_mb NUMERIC(10, 2) DEFAULT 48.5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Live Supabase Database Size in Bytes
CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    db_size BIGINT;
BEGIN
    SELECT pg_database_size(current_database()) INTO db_size;
    RETURN db_size;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_database_size() TO anon, authenticated, service_role;

-- 8. Row Level Security (RLS) Configuration
-- IMPORTANT: Disable RLS so that the server can read and write with both anon key and service_role key without restriction
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- If you prefer keeping RLS enabled, run these permissive policies instead:
-- ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow All Businesses" ON public.businesses;
-- CREATE POLICY "Allow All Businesses" ON public.businesses FOR ALL USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "Allow All Files" ON public.tenant_files;
-- CREATE POLICY "Allow All Files" ON public.tenant_files FOR ALL USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "Allow All Settings" ON public.settings;
-- CREATE POLICY "Allow All Settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "Allow All Coupons" ON public.coupons;
-- CREATE POLICY "Allow All Coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "Allow All Tx" ON public.transactions;
-- CREATE POLICY "Allow All Tx" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- 9. Seed Default Settings
INSERT INTO public.settings (
    id, payu_merchant_key, payu_salt, payu_env,
    whatsapp_number, whatsapp_message,
    monthly_price, monthly_strike,
    six_month_price, six_month_strike,
    one_year_price, one_year_strike,
    admin_password
) VALUES (
    'global_config', 'gtKFFx', 'eCwWELxi', 'test',
    '+919475388085', 'I want to renewal domain',
    99.00, 999.00,
    499.00, 594.00,
    949.00, 1188.00,
    'admin123456'
) ON CONFLICT (id) DO NOTHING;

-- 10. Seed Sample Coupons
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_amount, is_active, expiry_date)
VALUES 
    ('cpn-1', 'RENEW50', 'fixed', 50.00, 99.00, true, NOW() + INTERVAL '1 year'),
    ('cpn-2', 'DIGI20', 'percentage', 20.00, 99.00, true, NOW() + INTERVAL '1 year'),
    ('cpn-3', 'SPECIAL100', 'fixed', 100.00, 499.00, true, NOW() + INTERVAL '6 months')
ON CONFLICT (code) DO NOTHING;

-- 11. Seed Sample Businesses
INSERT INTO public.businesses (id, name, mobile, subdomain, custom_domain, plan_start_date, plan_end_date, service_date, status)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Apex Digital Studio', '9876543210', 'apexstudio', 'apexstudio.in', NOW() - INTERVAL '40 days', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days', 'Active'),
    ('b2222222-2222-2222-2222-222222222222', 'Glamour Salon & Spa', '9123456789', 'glamoursalon', NULL, NOW() - INTERVAL '90 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'Inactive'),
    ('c3333333-3333-3333-3333-333333333333', 'Royal Sweets & Bakers', '9475388085', 'royalsweets', 'royalsweets.com', NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days', NOW() + INTERVAL '75 days', 'Active')
ON CONFLICT (mobile) DO NOTHING;
