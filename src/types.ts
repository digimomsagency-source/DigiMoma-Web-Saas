export interface BusinessCustomPricing {
  use_custom: boolean;
  monthly_price?: number;
  monthly_strike?: number;
  six_month_price?: number;
  six_month_strike?: number;
  one_year_price?: number;
  one_year_strike?: number;
}

export interface Business {
  id: string;
  name: string;
  mobile: string;
  subdomain: string; // Used as URL slug: web.digimoms.in/{subdomain} or digimoms.in/{subdomain}
  custom_domain?: string;
  plan_start_date: string; // ISO string
  plan_end_date: string; // ISO string
  service_date?: string; // ISO string
  status: 'Active' | 'Inactive';
  custom_pricing?: BusinessCustomPricing;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  business_name?: string;
  mobile?: string;
  plan_tier: 'monthly' | 'six_month' | 'one_year';
  amount: number;
  original_amount: number;
  discount_amount: number;
  coupon_code?: string;
  status: 'Pending' | 'Success' | 'Failed';
  payu_txnid: string;
  payu_payment_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount: number;
  is_active: boolean;
  expiry_date: string;
  created_at: string;
}

export interface AppSettings {
  payu_merchant_key: string;
  payu_salt: string;
  payu_env: 'test' | 'prod';
  whatsapp_number: string;
  whatsapp_message: string;
  monthly_price: number;
  monthly_strike: number;
  six_month_price: number;
  six_month_strike: number;
  one_year_price: number;
  one_year_strike: number;
  supabase_url: string;
  supabase_key: string;
  admin_password: string;
  simulated_db_size_mb?: number; // For testing storage alert trigger
}

export interface DatabaseSizeInfo {
  size_bytes: number;
  size_mb: number;
  limit_mb: number;
  usage_percent: number;
  is_warning: boolean;
  source: 'live_supabase_rpc' | 'calculated_metrics';
  status_message?: string;
}

export interface TenantFile {
  id: string;
  name: string;
  path: string; // e.g. "index.html", "css/style.css", "images/logo.png"
  size: number;
  updated_at: string;
  content_type: string;
  content?: string; // for text/html/css/js preview & editing
  is_directory?: boolean;
  parent_path?: string; // e.g. "" or "css" or "images"
}
