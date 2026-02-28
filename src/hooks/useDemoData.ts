'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Demo data types
export interface DemoAccount {
  id: string
  company_id: string
  code: string
  name: string
  name_ar: string | null
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'cogs'
  sub_type: string | null
  parent_id: string | null
  description: string | null
  vat_applicable: boolean
  vat_rate: number | null
  opening_balance: number
  current_balance: number
  is_active: boolean
  is_system: boolean
}

export interface DemoContact {
  id: string
  company_id: string
  type: 'customer' | 'supplier' | 'both'
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
}

export interface DemoProduct {
  id: string
  company_id: string
  sku: string
  name: string
  name_ar: string | null
  description: string | null
  type: 'product' | 'service'
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
}

export interface DemoBankAccount {
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
}

export interface DemoEmployee {
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
  status: 'active' | 'on_leave' | 'terminated'
}

export interface DemoInvoice {
  id: string
  company_id: string
  contact_id: string
  invoice_number: string
  reference: string | null
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled'
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
}

export interface DemoBill {
  id: string
  company_id: string
  contact_id: string
  bill_number: string
  supplier_reference: string | null
  status: 'draft' | 'awaiting_approval' | 'approved' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  bill_date: string
  due_date: string
  currency: string
  subtotal: number
  discount_total: number
  vat_total: number
  total: number
  amount_paid: number
  notes: string | null
}

export interface DemoJournalEntry {
  id: string
  company_id: string
  entry_number: string
  entry_date: string
  description: string | null
  reference: string | null
  source: string | null
  source_id: string | null
  status: 'draft' | 'posted' | 'reversed'
  total_debit: number
  total_credit: number
  posted_at: string | null
  lines: DemoJournalLine[]
}

export interface DemoJournalLine {
  id?: string
  company_id: string
  journal_entry_id: string
  account_id: string
  debit: number
  credit: number
  description: string | null
  contact_id: string | null
}

export interface DemoPayrollRun {
  id: string
  company_id: string
  run_month: number
  run_year: number
  status: 'draft' | 'approved' | 'processed'
  total_amount: number
  total_employees: number
  processed_at: string | null
  items: DemoPayrollItem[]
}

export interface DemoPayrollItem {
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
}

export interface DemoCompany {
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
}

// Demo data store
interface DemoDataState {
  isLoaded: boolean
  company: DemoCompany | null
  accounts: DemoAccount[]
  contacts: DemoContact[]
  products: DemoProduct[]
  bankAccounts: DemoBankAccount[]
  employees: DemoEmployee[]
  invoices: DemoInvoice[]
  bills: DemoBill[]
  journalEntries: DemoJournalEntry[]
  payrollRuns: DemoPayrollRun[]
  
  // Actions
  loadDemoData: () => Promise<void>
  setDemoData: (data: {
    company: DemoCompany
    accounts: DemoAccount[]
    contacts: DemoContact[]
    products: DemoProduct[]
    bankAccounts: DemoBankAccount[]
    employees: DemoEmployee[]
    invoices: DemoInvoice[]
    bills: DemoBill[]
    journalEntries: DemoJournalEntry[]
    payrollRun: DemoPayrollRun
  }) => void
  clearDemoData: () => void
}

export const useDemoData = create<DemoDataState>()(
  persist(
    (set, get) => ({
      isLoaded: false,
      company: null,
      accounts: [],
      contacts: [],
      products: [],
      bankAccounts: [],
      employees: [],
      invoices: [],
      bills: [],
      journalEntries: [],
      payrollRuns: [],
      
      loadDemoData: async () => {
        try {
          const response = await fetch('/api/seed-demo')
          const data = await response.json()
          
          if (data.success) {
            set({
              isLoaded: true,
              company: data.company,
              accounts: data.accounts,
              contacts: data.contacts,
              products: data.products,
              bankAccounts: data.bankAccounts,
              employees: data.employees,
              invoices: data.invoices,
              bills: data.bills,
              journalEntries: data.journalEntries,
              payrollRuns: [data.payrollRun],
            })
          }
        } catch (error) {
          console.error('Failed to load demo data:', error)
        }
      },
      
      setDemoData: (data) => set({
        isLoaded: true,
        company: data.company,
        accounts: data.accounts,
        contacts: data.contacts,
        products: data.products,
        bankAccounts: data.bankAccounts,
        employees: data.employees,
        invoices: data.invoices,
        bills: data.bills,
        journalEntries: data.journalEntries,
        payrollRuns: [data.payrollRun],
      }),
      
      clearDemoData: () => set({
        isLoaded: false,
        company: null,
        accounts: [],
        contacts: [],
        products: [],
        bankAccounts: [],
        employees: [],
        invoices: [],
        bills: [],
        journalEntries: [],
        payrollRuns: [],
      }),
    }),
    {
      name: 'uae-books-demo-data',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        company: state.company,
        accounts: state.accounts,
        contacts: state.contacts,
        products: state.products,
        bankAccounts: state.bankAccounts,
        employees: state.employees,
        invoices: state.invoices,
        bills: state.bills,
        journalEntries: state.journalEntries,
        payrollRuns: state.payrollRuns,
      }),
    }
  )
)

// Check if running in demo mode
export function useIsDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('uae-books-demo-mode') === 'true'
}
