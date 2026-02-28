// ============================================
// UAE Books - Database Types
// Auto-generated types for Supabase tables
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// CORE TYPES
// ============================================

export interface Company {
  id: string
  name: string
  name_ar: string | null
  logo_url: string | null
  trade_license_no: string | null
  trn: string | null
  industry: string
  fiscal_year_start: number
  emirate: string | null
  currency: string
  address: string | null
  address_ar: string | null
  city: string | null
  phone: string | null
  email: string | null
  website: string | null
  vat_registered: boolean
  default_vat_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface UserCompany {
  id: string
  user_id: string
  company_id: string
  role: 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer'
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// CHART OF ACCOUNTS
// ============================================

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'cogs'
export type AccountSubType = 
  | 'current_asset' 
  | 'fixed_asset' 
  | 'current_liability' 
  | 'long_term_liability'
  | 'equity'
  | 'income'
  | 'other_income'
  | 'cost_of_sales'
  | 'operating_expense'
  | 'other_expense'

export interface Account {
  id: string
  company_id: string
  code: string
  name: string
  name_ar: string | null
  type: AccountType
  sub_type: AccountSubType | null
  parent_id: string | null
  description: string | null
  vat_applicable: boolean
  vat_rate: number | null
  opening_balance: number
  current_balance: number
  is_active: boolean
  is_system: boolean
  created_at: string
  updated_at: string
}

// ============================================
// CONTACTS
// ============================================

export type ContactType = 'customer' | 'supplier' | 'both'

export interface Contact {
  id: string
  company_id: string
  type: ContactType
  name: string
  name_ar: string | null
  trn: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  address_ar: string | null
  city: string | null
  emirate: string | null
  country: string
  payment_terms_days: number
  credit_limit: number | null
  currency: string
  notes: string | null
  is_active: boolean
  current_balance: number
  created_at: string
  updated_at: string
}

// ============================================
// PRODUCTS
// ============================================

export type ProductType = 'product' | 'service'

export interface Product {
  id: string
  company_id: string
  sku: string
  name: string
  name_ar: string | null
  description: string | null
  type: ProductType
  category: string | null
  cost_price: number
  selling_price: number
  vat_rate: number
  unit: string
  barcode: string | null
  track_inventory: boolean
  stock_on_hand: number
  reorder_level: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// STOCK MOVEMENTS
// ============================================

export type StockMovementType = 'stock_in' | 'stock_out' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'sale' | 'purchase_return' | 'sale_return'

export interface StockMovement {
  id: string
  company_id: string
  product_id: string
  movement_type: StockMovementType
  quantity: number
  unit_cost: number
  total_cost: number
  reference_type: 'manual' | 'invoice' | 'bill' | 'adjustment' | null
  reference_id: string | null
  reference_number: string | null
  notes: string | null
  movement_date: string
  created_by: string | null
  created_at: string
  
  // Relations
  product?: Product
}

// ============================================
// INVOICING
// ============================================

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  company_id: string
  contact_id: string
  invoice_number: string
  reference: string | null
  status: InvoiceStatus
  invoice_date: string
  due_date: string
  currency: string
  subtotal: number
  discount_total: number
  vat_total: number
  total: number
  amount_paid: number
  notes: string | null
  terms: string | null
  qr_code: string | null
  sent_at: string | null
  viewed_at: string | null
  created_at: string
  updated_at: string
  
  // Relations
  contact?: Contact
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  company_id: string
  invoice_id: string
  product_id: string | null
  account_id: string
  description: string
  quantity: number
  unit_price: number
  discount: number
  vat_rate: number
  vat_amount: number
  line_total: number
  sort_order: number
  created_at: string
  
  // Relations
  product?: Product
  account?: Account
}

// ============================================
// BILLS
// ============================================

export type BillStatus = 'draft' | 'awaiting_approval' | 'approved' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export interface Bill {
  id: string
  company_id: string
  contact_id: string
  bill_number: string
  supplier_reference: string | null
  status: BillStatus
  bill_date: string
  due_date: string
  currency: string
  subtotal: number
  discount_total: number
  vat_total: number
  total: number
  amount_paid: number
  notes: string | null
  created_at: string
  updated_at: string
  
  // Relations
  contact?: Contact
  items?: BillItem[]
}

export interface BillItem {
  id: string
  company_id: string
  bill_id: string
  product_id: string | null
  account_id: string
  description: string
  quantity: number
  unit_price: number
  discount: number
  vat_rate: number
  vat_amount: number
  line_total: number
  sort_order: number
  created_at: string
}

// ============================================
// PAYMENTS
// ============================================

export type PaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'card'
export type PaymentStatus = 'pending' | 'completed' | 'cancelled' | 'bounced'

export interface Payment {
  id: string
  company_id: string
  contact_id: string | null
  invoice_id: string | null
  bill_id: string | null
  payment_number: string
  payment_date: string
  amount: number
  payment_method: PaymentMethod
  reference: string | null
  bank_account_id: string | null
  notes: string | null
  status: PaymentStatus
  created_at: string
  updated_at: string
}

// ============================================
// BANKING
// ============================================

export interface BankAccount {
  id: string
  company_id: string
  bank_name: string
  account_name: string
  account_number: string
  iban: string | null
  currency: string
  current_balance: number
  opening_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type BankTransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out'

export interface BankTransaction {
  id: string
  company_id: string
  bank_account_id: string
  transaction_date: string
  description: string
  amount: number
  balance: number | null
  transaction_type: BankTransactionType
  category_id: string | null
  reference: string | null
  is_reconciled: boolean
  reconciled_at: string | null
  created_at: string
  updated_at: string
}

// ============================================
// JOURNAL ENTRIES
// ============================================

export type JournalEntryStatus = 'draft' | 'posted' | 'reversed'
export type JournalEntrySource = 'invoice' | 'bill' | 'payment' | 'manual' | 'adjustment' | 'payroll'

export interface JournalEntry {
  id: string
  company_id: string
  entry_number: string
  entry_date: string
  description: string | null
  reference: string | null
  source: JournalEntrySource | null
  source_id: string | null
  status: JournalEntryStatus
  total_debit: number
  total_credit: number
  posted_at: string | null
  created_at: string
  updated_at: string
  
  // Relations
  lines?: JournalLine[]
}

export interface JournalLine {
  id: string
  company_id: string
  journal_entry_id: string
  account_id: string
  debit: number
  credit: number
  description: string | null
  contact_id: string | null
  created_at: string
  
  // Relations
  account?: Account
  contact?: Contact
}

// ============================================
// EMPLOYEES & PAYROLL
// ============================================

export type EmployeeStatus = 'active' | 'on_leave' | 'terminated'

export interface Employee {
  id: string
  company_id: string
  employee_code: string
  full_name: string
  full_name_ar: string | null
  nationality: string | null
  emirates_id: string | null
  passport_no: string | null
  passport_expiry: string | null
  labour_card_no: string | null
  mohre_id: string | null
  skill_level: number | null
  joining_date: string
  termination_date: string | null
  department: string | null
  designation: string | null
  basic_salary: number
  housing_allowance: number
  transport_allowance: number
  other_allowances: number
  bank_name: string | null
  iban: string | null
  bank_routing_code: string | null
  annual_leave_balance: number
  sick_leave_balance: number
  status: EmployeeStatus
  created_at: string
  updated_at: string
}

export type PayrollRunStatus = 'draft' | 'approved' | 'processed'

export interface PayrollRun {
  id: string
  company_id: string
  run_month: number
  run_year: number
  status: PayrollRunStatus
  total_amount: number
  total_employees: number
  processed_at: string | null
  created_at: string
  updated_at: string
  
  // Relations
  items?: PayrollItem[]
}

export interface PayrollItem {
  id: string
  company_id: string
  payroll_run_id: string
  employee_id: string
  basic_salary: number
  housing_allowance: number
  transport_allowance: number
  other_allowances: number
  overtime_hours: number
  overtime_amount: number
  leave_salary: number
  deductions: number
  net_salary: number
  days_paid: number
  created_at: string
  
  // Relations
  employee?: Employee
}

// ============================================
// EXPENSES
// ============================================

export type ExpenseStatus = 'pending' | 'approved' | 'rejected'

export interface Expense {
  id: string
  company_id: string
  expense_number: string
  contact_id: string | null
  account_id: string
  bank_account_id: string | null
  expense_date: string
  amount: number
  vat_amount: number
  vat_rate: number
  description: string
  category: string | null
  payment_method: PaymentMethod | null
  reference: string | null
  receipt_url: string | null
  is_recurring: boolean
  status: ExpenseStatus
  created_at: string
  updated_at: string
}

// ============================================
// VAT RETURNS
// ============================================

export type VatReturnStatus = 'draft' | 'filed' | 'paid'

export interface VatReturn {
  id: string
  company_id: string
  period_start: string
  period_end: string
  status: VatReturnStatus
  
  // Box 1: Standard rated supplies by Emirate (values include VAT)
  box1a_abu_dhabi: number
  box1b_dubai: number
  box1c_sharjah: number
  box1d_ajman: number
  box1e_umm_al_quwain: number
  box1f_ras_al_khaimah: number
  box1g_fujairah: number
  
  // Other boxes
  box2_tourist_refunds: number
  box3_reverse_charge_supplies: number
  box4_zero_rated_supplies: number
  box5_exempt_supplies: number
  box6_standard_rated_expenses: number
  box7_reverse_charge_expenses: number
  box8_adjustments: number
  box9_net_vat_due: number
  
  // VAT summary
  vat_collected: number
  vat_paid: number
  
  // Filing info
  filed_at: string | null
  filing_reference: string | null
  created_at: string
  updated_at: string
}

// ============================================
// DATABASE TYPE (for Supabase client)
// ============================================

export interface Database {
  public: {
    Tables: {
      companies: { Row: Company; Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Company> }
      profiles: { Row: Profile; Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Profile> }
      users_companies: { Row: UserCompany; Insert: Omit<UserCompany, 'id' | 'created_at' | 'updated_at'>; Update: Partial<UserCompany> }
      accounts: { Row: Account; Insert: Omit<Account, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Account> }
      contacts: { Row: Contact; Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Contact> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Product> }
      invoices: { Row: Invoice; Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Invoice> }
      invoice_items: { Row: InvoiceItem; Insert: Omit<InvoiceItem, 'id' | 'created_at'>; Update: Partial<InvoiceItem> }
      bills: { Row: Bill; Insert: Omit<Bill, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Bill> }
      bill_items: { Row: BillItem; Insert: Omit<BillItem, 'id' | 'created_at'>; Update: Partial<BillItem> }
      payments: { Row: Payment; Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Payment> }
      bank_accounts: { Row: BankAccount; Insert: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>; Update: Partial<BankAccount> }
      bank_transactions: { Row: BankTransaction; Insert: Omit<BankTransaction, 'id' | 'created_at' | 'updated_at'>; Update: Partial<BankTransaction> }
      journal_entries: { Row: JournalEntry; Insert: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>; Update: Partial<JournalEntry> }
      journal_lines: { Row: JournalLine; Insert: Omit<JournalLine, 'id' | 'created_at'>; Update: Partial<JournalLine> }
      employees: { Row: Employee; Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Employee> }
      payroll_runs: { Row: PayrollRun; Insert: Omit<PayrollRun, 'id' | 'created_at' | 'updated_at'>; Update: Partial<PayrollRun> }
      payroll_items: { Row: PayrollItem; Insert: Omit<PayrollItem, 'id' | 'created_at'>; Update: Partial<PayrollItem> }
      expenses: { Row: Expense; Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Expense> }
      vat_returns: { Row: VatReturn; Insert: Omit<VatReturn, 'id' | 'created_at' | 'updated_at'>; Update: Partial<VatReturn> }
      stock_movements: { Row: StockMovement; Insert: Omit<StockMovement, 'id' | 'created_at'>; Update: Partial<StockMovement> }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_company_access: (args: { company_uuid: string }) => boolean
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================
// HELPER TYPES
// ============================================

// For creating new records
export type InsertCompany = Database['public']['Tables']['companies']['Insert']
export type InsertAccount = Database['public']['Tables']['accounts']['Insert']
export type InsertContact = Database['public']['Tables']['contacts']['Insert']
export type InsertProduct = Database['public']['Tables']['products']['Insert']
export type InsertInvoice = Database['public']['Tables']['invoices']['Insert']
export type InsertInvoiceItem = Database['public']['Tables']['invoice_items']['Insert']
export type InsertBill = Database['public']['Tables']['bills']['Insert']
export type InsertPayment = Database['public']['Tables']['payments']['Insert']
export type InsertExpense = Database['public']['Tables']['expenses']['Insert']
export type InsertStockMovement = Database['public']['Tables']['stock_movements']['Insert']

// For updating records
export type UpdateCompany = Database['public']['Tables']['companies']['Update']
export type UpdateAccount = Database['public']['Tables']['accounts']['Update']
export type UpdateContact = Database['public']['Tables']['contacts']['Update']
export type UpdateInvoice = Database['public']['Tables']['invoices']['Update']
