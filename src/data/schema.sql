-- ==============================================================================
-- DIGIMOMS MULTI-TENANT SAAS DATABASE SCHEMA & RLS POLICIES FOR SUPABASE
-- TARGET HOST: web.digimoms.in
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255),
    plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    service_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast mobile lookup
CREATE INDEX IF NOT EXISTS idx_businesses_mobile ON public.businesses(mobile);
CREATE INDEX IF NOT EXISTS idx_businesses_subdomain ON public.businesses(subdomain);

-- 3. Transactions Table (Logs payment attempts, status & gateway references)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
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

-- 4. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_amount NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. System Settings Table (PayU Merchant Keys, Pricing Tiers, WhatsApp)
CREATE TABLE IF NOT EXISTS public.settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global_config',
    payu_merchant_key VARCHAR(255) DEFAULT 'YOUR_PAYU_KEY',
    payu_salt VARCHAR(255) DEFAULT 'YOUR_PAYU_SALT',
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RPC Function: Live Supabase Database Size in Bytes
-- This function is executed securely via Supabase RPC to compute exact live PostgreSQL database size
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_database_size() TO anon, authenticated, service_role;

-- 7. Automated Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_businesses_updated ON public.businesses;
CREATE TRIGGER trg_businesses_updated
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS) Setup
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active coupons
CREATE POLICY "Public can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true AND expiry_date > NOW());

-- Allow public mobile search on businesses (or service role)
CREATE POLICY "Public can query their business by mobile"
ON public.businesses FOR SELECT
USING (true);

-- Allow full access to service_role (used by the backend server for transactions and webhooks)
CREATE POLICY "Service Role Full Access Businesses"
ON public.businesses FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access Transactions"
ON public.transactions FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access Settings"
ON public.settings FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access Coupons"
ON public.coupons FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- 9. Seed Initial Default Data
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

-- Seed Sample Coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_amount, is_active, expiry_date)
VALUES 
    ('RENEW50', 'fixed', 50.00, 99.00, true, NOW() + INTERVAL '1 year'),
    ('DIGI20', 'percentage', 20.00, 99.00, true, NOW() + INTERVAL '1 year'),
    ('SPECIAL100', 'fixed', 100.00, 499.00, true, NOW() + INTERVAL '6 months')
ON CONFLICT (code) DO NOTHING;

-- Seed Sample Businesses (demonstrating active and expired states)
INSERT INTO public.businesses (id, name, mobile, subdomain, custom_domain, plan_start_date, plan_end_date, service_date, status)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Apex Digital Studio', '9876543210', 'apexstudio', 'apexstudio.in', NOW() - INTERVAL '40 days', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days', 'Active'),
    ('b2222222-2222-2222-2222-222222222222', 'Glamour Salon & Spa', '9123456789', 'glamoursalon', NULL, NOW() - INTERVAL '90 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'Inactive'),
    ('c3333333-3333-3333-3333-333333333333', 'Royal Sweets & Bakers', '9475388085', 'royalsweets', 'royalsweets.com', NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days', NOW() + INTERVAL '75 days', 'Active')
ON CONFLICT (mobile) DO NOTHING;

-- 10. Storage Bucket Setup (Run in Supabase Storage or Dashboard)
-- Create bucket 'client-assets'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-assets', 'client-assets', true)
ON CONFLICT (id) DO NOTHING;
