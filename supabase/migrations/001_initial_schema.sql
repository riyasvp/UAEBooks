-- ============================================
-- UAE Books - Supabase Database Schema
-- Migration: 001_initial_schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    logo_url TEXT,
    trade_license_no TEXT,
    trn TEXT UNIQUE, -- 15-digit Tax Registration Number
    industry TEXT NOT NULL DEFAULT 'general',
    fiscal_year_start INTEGER DEFAULT 1, -- Month (1-12)
    emirate TEXT DEFAULT 'dubai',
    currency TEXT DEFAULT 'AED',
    address TEXT,
    address_ar TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    vat_registered BOOLEAN DEFAULT true,
    default_vat_rate INTEGER DEFAULT 500, -- Basis points (500 = 5%)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Users-Companies Junction Table (Multi-tenant access)
CREATE TABLE users_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff', -- owner, admin, accountant, staff, viewer
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- ============================================
-- CHART OF ACCOUNTS
-- ============================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- Account code (e.g., 1000, 2000)
    name TEXT NOT NULL,
    name_ar TEXT,
    type TEXT NOT NULL, -- asset, liability, equity, revenue, expense, cogs
    sub_type TEXT, -- current_asset, fixed_asset, current_liability, etc.
    parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    description TEXT,
    vat_applicable BOOLEAN DEFAULT false,
    vat_rate INTEGER, -- Basis points
    opening_balance BIGINT DEFAULT 0, -- In fils (cents)
    current_balance BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false, -- System accounts cannot be deleted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- ============================================
-- CONTACTS (Customers & Suppliers)
-- ============================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'customer', -- customer, supplier, both
    name TEXT NOT NULL,
    name_ar TEXT,
    trn TEXT, -- Tax Registration Number
    email TEXT,
    phone TEXT,
    mobile TEXT,
    address TEXT,
    address_ar TEXT,
    city TEXT,
    emirate TEXT,
    country TEXT DEFAULT 'UAE',
    payment_terms_days INTEGER DEFAULT 30,
    credit_limit BIGINT, -- In fils
    currency TEXT DEFAULT 'AED',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    current_balance BIGINT DEFAULT 0, -- Outstanding balance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS / SERVICES
-- ============================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'product', -- product, service
    category TEXT,
    cost_price BIGINT DEFAULT 0, -- In fils
    selling_price BIGINT DEFAULT 0,
    vat_rate INTEGER DEFAULT 500, -- Basis points
    unit TEXT DEFAULT 'pcs',
    barcode TEXT,
    track_inventory BOOLEAN DEFAULT false,
    stock_on_hand BIGINT DEFAULT 0,
    reorder_level BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, sku)
);

-- ============================================
-- INVOICING
-- ============================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    invoice_number TEXT NOT NULL,
    reference TEXT, -- Customer reference
    status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, viewed, partial, paid, overdue, cancelled
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency TEXT DEFAULT 'AED',
    subtotal BIGINT DEFAULT 0, -- In fils
    discount_total BIGINT DEFAULT 0,
    vat_total BIGINT DEFAULT 0,
    total BIGINT DEFAULT 0,
    amount_paid BIGINT DEFAULT 0,
    notes TEXT,
    terms TEXT,
    qr_code TEXT, -- FTA QR code data
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, invoice_number)
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    quantity DECIMAL(15,4) DEFAULT 1,
    unit_price BIGINT DEFAULT 0, -- In fils
    discount BIGINT DEFAULT 0,
    vat_rate INTEGER DEFAULT 500,
    vat_amount BIGINT DEFAULT 0,
    line_total BIGINT DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BILLS (Supplier Invoices)
-- ============================================

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    bill_number TEXT NOT NULL, -- Our reference
    supplier_reference TEXT, -- Supplier's invoice number
    status TEXT NOT NULL DEFAULT 'draft', -- draft, awaiting_approval, approved, partial, paid, overdue, cancelled
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency TEXT DEFAULT 'AED',
    subtotal BIGINT DEFAULT 0,
    discount_total BIGINT DEFAULT 0,
    vat_total BIGINT DEFAULT 0,
    total BIGINT DEFAULT 0,
    amount_paid BIGINT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, bill_number)
);

CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    quantity DECIMAL(15,4) DEFAULT 1,
    unit_price BIGINT DEFAULT 0,
    discount BIGINT DEFAULT 0,
    vat_rate INTEGER DEFAULT 500,
    vat_amount BIGINT DEFAULT 0,
    line_total BIGINT DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    payment_number TEXT NOT NULL,
    payment_date DATE NOT NULL,
    amount BIGINT NOT NULL, -- In fils
    payment_method TEXT NOT NULL, -- bank_transfer, cash, cheque, card
    reference TEXT, -- Cheque number, transaction reference
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT DEFAULT 'completed', -- pending, completed, cancelled, bounced
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, payment_number)
);

-- ============================================
-- BANKING
-- ============================================

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    iban TEXT,
    currency TEXT DEFAULT 'AED',
    current_balance BIGINT DEFAULT 0,
    opening_balance BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount BIGINT NOT NULL, -- Positive for credit, negative for debit
    balance BIGINT, -- Running balance after transaction
    transaction_type TEXT NOT NULL, -- deposit, withdrawal, transfer_in, transfer_out
    category_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    reference TEXT,
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOURNAL ENTRIES (Double-Entry Accounting)
-- ============================================

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_number TEXT NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    reference TEXT,
    source TEXT, -- invoice, bill, payment, manual, etc.
    source_id UUID,
    status TEXT DEFAULT 'draft', -- draft, posted, reversed
    total_debit BIGINT DEFAULT 0,
    total_credit BIGINT DEFAULT 0,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, entry_number)
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    debit BIGINT DEFAULT 0, -- In fils
    credit BIGINT DEFAULT 0,
    description TEXT,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEES & PAYROLL
-- ============================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    full_name_ar TEXT,
    nationality TEXT,
    emirates_id TEXT, -- 15-digit Emirates ID
    passport_no TEXT,
    passport_expiry DATE,
    labour_card_no TEXT,
    mohre_id TEXT,
    skill_level INTEGER, -- 1-5
    joining_date DATE NOT NULL,
    termination_date DATE,
    department TEXT,
    designation TEXT,
    basic_salary BIGINT DEFAULT 0, -- In fils
    housing_allowance BIGINT DEFAULT 0,
    transport_allowance BIGINT DEFAULT 0,
    other_allowances BIGINT DEFAULT 0,
    bank_name TEXT,
    iban TEXT,
    bank_routing_code TEXT, -- 9-digit
    annual_leave_balance INTEGER DEFAULT 30,
    sick_leave_balance INTEGER DEFAULT 90,
    status TEXT DEFAULT 'active', -- active, on_leave, terminated
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, employee_code)
);

CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    run_month INTEGER NOT NULL, -- 1-12
    run_year INTEGER NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, approved, processed
    total_amount BIGINT DEFAULT 0,
    total_employees INTEGER DEFAULT 0,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, run_month, run_year)
);

CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    basic_salary BIGINT DEFAULT 0,
    housing_allowance BIGINT DEFAULT 0,
    transport_allowance BIGINT DEFAULT 0,
    other_allowances BIGINT DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_amount BIGINT DEFAULT 0,
    leave_salary BIGINT DEFAULT 0,
    deductions BIGINT DEFAULT 0,
    net_salary BIGINT DEFAULT 0,
    days_paid INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(payroll_run_id, employee_id)
);

-- ============================================
-- EXPENSES
-- ============================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    expense_number TEXT NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    expense_date DATE NOT NULL,
    amount BIGINT NOT NULL,
    vat_amount BIGINT DEFAULT 0,
    vat_rate INTEGER DEFAULT 500,
    description TEXT NOT NULL,
    category TEXT,
    payment_method TEXT, -- bank_transfer, cash, card, cheque
    reference TEXT,
    receipt_url TEXT,
    is_recurring BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'approved', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, expense_number)
);

-- ============================================
-- VAT RETURNS
-- ============================================

CREATE TABLE vat_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, filed, paid
    -- Box 1: Standard rated supplies by Emirate
    box1a_abu_dhabi BIGINT DEFAULT 0,
    box1b_dubai BIGINT DEFAULT 0,
    box1c_sharjah BIGINT DEFAULT 0,
    box1d_ajman BIGINT DEFAULT 0,
    box1e_umm_al_quwain BIGINT DEFAULT 0,
    box1f_ras_al_khaimah BIGINT DEFAULT 0,
    box1g_fujairah BIGINT DEFAULT 0,
    -- Other boxes
    box2_tourist_refunds BIGINT DEFAULT 0,
    box3_reverse_charge_supplies BIGINT DEFAULT 0,
    box4_zero_rated_supplies BIGINT DEFAULT 0,
    box5_exempt_supplies BIGINT DEFAULT 0,
    box6_standard_rated_expenses BIGINT DEFAULT 0,
    box7_reverse_charge_expenses BIGINT DEFAULT 0,
    box8_adjustments BIGINT DEFAULT 0,
    box9_net_vat_due BIGINT DEFAULT 0,
    -- VAT collected and paid
    vat_collected BIGINT DEFAULT 0,
    vat_paid BIGINT DEFAULT 0,
    -- Filing info
    filed_at TIMESTAMPTZ,
    filing_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, period_start, period_end)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Companies
CREATE INDEX idx_companies_trn ON companies(trn);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- Users-Companies
CREATE INDEX idx_users_companies_user_id ON users_companies(user_id);
CREATE INDEX idx_users_companies_company_id ON users_companies(company_id);

-- Accounts
CREATE INDEX idx_accounts_company_id ON accounts(company_id);
CREATE INDEX idx_accounts_parent_id ON accounts(parent_id);
CREATE INDEX idx_accounts_type ON accounts(type);

-- Contacts
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_type ON contacts(type);

-- Products
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_sku ON products(sku);

-- Invoices
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Invoice Items
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- Bills
CREATE INDEX idx_bills_company_id ON bills(company_id);
CREATE INDEX idx_bills_contact_id ON bills(contact_id);
CREATE INDEX idx_bills_status ON bills(status);

-- Bill Items
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);

-- Payments
CREATE INDEX idx_payments_company_id ON payments(company_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_bill_id ON payments(bill_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Bank Accounts
CREATE INDEX idx_bank_accounts_company_id ON bank_accounts(company_id);

-- Bank Transactions
CREATE INDEX idx_bank_transactions_bank_account_id ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date);

-- Journal Entries
CREATE INDEX idx_journal_entries_company_id ON journal_entries(company_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);

-- Journal Lines
CREATE INDEX idx_journal_lines_journal_entry_id ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account_id ON journal_lines(account_id);

-- Employees
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_status ON employees(status);

-- Payroll Runs
CREATE INDEX idx_payroll_runs_company_id ON payroll_runs(company_id);

-- Payroll Items
CREATE INDEX idx_payroll_items_payroll_run_id ON payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_employee_id ON payroll_items(employee_id);

-- Expenses
CREATE INDEX idx_expenses_company_id ON expenses(company_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_account_id ON expenses(account_id);

-- VAT Returns
CREATE INDEX idx_vat_returns_company_id ON vat_returns(company_id);
CREATE INDEX idx_vat_returns_period ON vat_returns(period_start, period_end);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_companies_updated_at BEFORE UPDATE ON users_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vat_returns_updated_at BEFORE UPDATE ON vat_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
