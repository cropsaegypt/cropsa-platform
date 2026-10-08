-- ===================================================
-- CROPSA EGYPT - SUPABASE DATABASE SCHEMA
-- ===================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    code TEXT UNIQUE,
    logo TEXT,
    email TEXT,
    phone TEXT,
    commercial_register TEXT,
    tax_number TEXT,
    credit_ceiling NUMERIC DEFAULT 0,
    used_credit NUMERIC DEFAULT 0,
    commission_rate NUMERIC DEFAULT 0,
    allowed_governorates TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Company Branches Table
CREATE TABLE IF NOT EXISTS company_branches (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    governorate TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    manager_name TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    staff_role TEXT,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    branch_id TEXT REFERENCES company_branches(id) ON DELETE SET NULL,
    governorate TEXT,
    phone TEXT,
    wallet_balance NUMERIC DEFAULT 0,
    commission_rate NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    governorate TEXT,
    address TEXT,
    job_title TEXT,
    monthly_income NUMERIC DEFAULT 0,
    iscore_status TEXT DEFAULT 'CLEAN',
    credit_rating NUMERIC DEFAULT 80,
    total_financed NUMERIC DEFAULT 0,
    active_installments_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Financing Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_national_id TEXT,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    supplier_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    salesman_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assigned_officer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    branch_id TEXT REFERENCES company_branches(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL,
    down_payment NUMERIC DEFAULT 0,
    financed_amount NUMERIC NOT NULL,
    monthly_installment NUMERIC NOT NULL,
    duration_months INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW',
    product_type TEXT,
    product_description TEXT,
    ai_risk_score NUMERIC,
    ai_recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Transactions / Ledger Table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    application_id TEXT REFERENCES applications(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on primary tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read & write for authorized anon API key in development
CREATE POLICY "Allow full access to anon key for dev" ON companies FOR ALL USING (true);
CREATE POLICY "Allow full access to anon key for dev" ON company_branches FOR ALL USING (true);
CREATE POLICY "Allow full access to anon key for dev" ON users FOR ALL USING (true);
CREATE POLICY "Allow full access to anon key for dev" ON clients FOR ALL USING (true);
CREATE POLICY "Allow full access to anon key for dev" ON applications FOR ALL USING (true);
CREATE POLICY "Allow full access to anon key for dev" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow full access to anon key for dev" ON audit_logs FOR ALL USING (true);
