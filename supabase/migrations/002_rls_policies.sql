-- ============================================
-- UAE Books - Row Level Security (RLS) Policies
-- Migration: 002_rls_policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_returns ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check if user has access to company
-- ============================================

CREATE OR REPLACE FUNCTION user_has_company_access(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users_companies
        WHERE user_id = auth.uid()
        AND company_id = company_uuid
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- COMPANIES POLICIES
-- ============================================

-- Users can view companies they are linked to
CREATE POLICY "Users can view their companies"
    ON companies FOR SELECT
    USING (user_has_company_access(id));

-- Users can insert companies (they become owner)
CREATE POLICY "Users can create companies"
    ON companies FOR INSERT
    WITH CHECK (true);

-- Users can update companies they have access to
CREATE POLICY "Users can update their companies"
    ON companies FOR UPDATE
    USING (user_has_company_access(id));

-- Users can delete companies they own
CREATE POLICY "Users can delete companies they own"
    ON companies FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users_companies
            WHERE user_id = auth.uid()
            AND company_id = id
            AND role = 'owner'
        )
    );

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- USERS_COMPANIES POLICIES
-- ============================================

-- Users can view all users in their companies
CREATE POLICY "Users can view company members"
    ON users_companies FOR SELECT
    USING (user_has_company_access(company_id));

-- Company owners/admins can add users to company
CREATE POLICY "Admins can add company members"
    ON users_companies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_companies
            WHERE user_id = auth.uid()
            AND company_id = users_companies.company_id
            AND role IN ('owner', 'admin')
            AND is_active = true
        )
    );

-- Company owners/admins can update member roles
CREATE POLICY "Admins can update company members"
    ON users_companies FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users_companies uc
            WHERE uc.user_id = auth.uid()
            AND uc.company_id = users_companies.company_id
            AND uc.role IN ('owner', 'admin')
            AND uc.is_active = true
        )
    );

-- Company owners can remove members
CREATE POLICY "Owners can remove company members"
    ON users_companies FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users_companies uc
            WHERE uc.user_id = auth.uid()
            AND uc.company_id = users_companies.company_id
            AND uc.role = 'owner'
            AND uc.is_active = true
        )
    );

-- ============================================
-- ACCOUNTS POLICIES
-- ============================================

CREATE POLICY "Users can view company accounts"
    ON accounts FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company accounts"
    ON accounts FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company accounts"
    ON accounts FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company accounts"
    ON accounts FOR DELETE
    USING (user_has_company_access(company_id) AND is_system = false);

-- ============================================
-- CONTACTS POLICIES
-- ============================================

CREATE POLICY "Users can view company contacts"
    ON contacts FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company contacts"
    ON contacts FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company contacts"
    ON contacts FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company contacts"
    ON contacts FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

CREATE POLICY "Users can view company products"
    ON products FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company products"
    ON products FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company products"
    ON products FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company products"
    ON products FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- INVOICES POLICIES
-- ============================================

CREATE POLICY "Users can view company invoices"
    ON invoices FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company invoices"
    ON invoices FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company invoices"
    ON invoices FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company invoices"
    ON invoices FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- INVOICE ITEMS POLICIES
-- ============================================

CREATE POLICY "Users can view company invoice items"
    ON invoice_items FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company invoice items"
    ON invoice_items FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company invoice items"
    ON invoice_items FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company invoice items"
    ON invoice_items FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- BILLS POLICIES
-- ============================================

CREATE POLICY "Users can view company bills"
    ON bills FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company bills"
    ON bills FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company bills"
    ON bills FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company bills"
    ON bills FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- BILL ITEMS POLICIES
-- ============================================

CREATE POLICY "Users can view company bill items"
    ON bill_items FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company bill items"
    ON bill_items FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company bill items"
    ON bill_items FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company bill items"
    ON bill_items FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- PAYMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view company payments"
    ON payments FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company payments"
    ON payments FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company payments"
    ON payments FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company payments"
    ON payments FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- BANK ACCOUNTS POLICIES
-- ============================================

CREATE POLICY "Users can view company bank accounts"
    ON bank_accounts FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company bank accounts"
    ON bank_accounts FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company bank accounts"
    ON bank_accounts FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company bank accounts"
    ON bank_accounts FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- BANK TRANSACTIONS POLICIES
-- ============================================

CREATE POLICY "Users can view company bank transactions"
    ON bank_transactions FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company bank transactions"
    ON bank_transactions FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company bank transactions"
    ON bank_transactions FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company bank transactions"
    ON bank_transactions FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- JOURNAL ENTRIES POLICIES
-- ============================================

CREATE POLICY "Users can view company journal entries"
    ON journal_entries FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company journal entries"
    ON journal_entries FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company journal entries"
    ON journal_entries FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company journal entries"
    ON journal_entries FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- JOURNAL LINES POLICIES
-- ============================================

CREATE POLICY "Users can view company journal lines"
    ON journal_lines FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company journal lines"
    ON journal_lines FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company journal lines"
    ON journal_lines FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company journal lines"
    ON journal_lines FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- EMPLOYEES POLICIES
-- ============================================

CREATE POLICY "Users can view company employees"
    ON employees FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company employees"
    ON employees FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company employees"
    ON employees FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company employees"
    ON employees FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- PAYROLL RUNS POLICIES
-- ============================================

CREATE POLICY "Users can view company payroll runs"
    ON payroll_runs FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company payroll runs"
    ON payroll_runs FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company payroll runs"
    ON payroll_runs FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company payroll runs"
    ON payroll_runs FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- PAYROLL ITEMS POLICIES
-- ============================================

CREATE POLICY "Users can view company payroll items"
    ON payroll_items FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company payroll items"
    ON payroll_items FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company payroll items"
    ON payroll_items FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company payroll items"
    ON payroll_items FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- EXPENSES POLICIES
-- ============================================

CREATE POLICY "Users can view company expenses"
    ON expenses FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company expenses"
    ON expenses FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company expenses"
    ON expenses FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company expenses"
    ON expenses FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- VAT RETURNS POLICIES
-- ============================================

CREATE POLICY "Users can view company vat returns"
    ON vat_returns FOR SELECT
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can create company vat returns"
    ON vat_returns FOR INSERT
    WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update company vat returns"
    ON vat_returns FOR UPDATE
    USING (user_has_company_access(company_id));

CREATE POLICY "Users can delete company vat returns"
    ON vat_returns FOR DELETE
    USING (user_has_company_access(company_id));

-- ============================================
-- SERVICE ROLE BYPASS (For server-side operations)
-- ============================================

-- Allow service role to bypass RLS (for background jobs, webhooks, etc.)
-- This is already enabled by default for service_role in Supabase
