'use server'

// ============================================
// UAE Books - Database Query Helpers
// Reusable functions for common database operations
// ============================================

import { createClient } from '@/lib/supabase/server'
import type { 
  Company, InsertCompany, 
  Account, InsertAccount,
  Contact, InsertContact,
  Product, InsertProduct,
  Invoice, InsertInvoice, InvoiceItem, InsertInvoiceItem,
  Bill, InsertBill, BillItem, InsertBillItem,
  Payment, InsertPayment,
  Expense, InsertExpense,
  JournalEntry, InsertJournalEntry, JournalLine, InsertJournalLine,
  Employee, InsertEmployee,
  PayrollRun, PayrollItem,
  VatReturn, InsertVatReturn,
  BankAccount, BankTransaction,
  StockMovement, InsertStockMovement,
} from '@/types/database'

// Type for inserting payroll items (all fields optional except ids)
type InsertPayrollRun = {
  company_id: string
  run_month: number
  run_year: number
  status?: 'draft' | 'approved' | 'processed'
  total_amount: number
  total_employees: number
}

type InsertPayrollItem = {
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

// ============================================
// COMPANIES
// ============================================

export async function getCompanies() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Company[]
}

export async function getCompany(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Company
}

// Alias for getCompany - used by pages that import getCompanyById
export const getCompanyById = getCompany

export async function createCompany(company: InsertCompany) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .insert(company)
    .select()
    .single()
  
  if (error) throw error
  return data as Company
}

// ============================================
// CHART OF ACCOUNTS
// ============================================

export async function getAccounts(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('code', { ascending: true })
  
  if (error) throw error
  return data as Account[]
}

export async function getAccountsByType(companyId: string, type: Account['type']) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('company_id', companyId)
    .eq('type', type)
    .eq('is_active', true)
    .order('code', { ascending: true })
  
  if (error) throw error
  return data as Account[]
}

export async function createAccount(account: InsertAccount) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .insert(account)
    .select()
    .single()
  
  if (error) throw error
  return data as Account
}

// ============================================
// CONTACTS
// ============================================

export async function getContacts(companyId: string, type?: Contact['type']) {
  const supabase = await createClient()
  
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name', { ascending: true })
  
  if (type) {
    query = query.in('type', [type, 'both'])
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data as Contact[]
}

export async function createContact(contact: InsertContact) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .insert(contact)
    .select()
    .single()
  
  if (error) throw error
  return data as Contact
}

// ============================================
// PRODUCTS
// ============================================

export async function getProducts(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name', { ascending: true })
  
  if (error) throw error
  return data as Product[]
}

export async function createProduct(product: InsertProduct) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()
  
  if (error) throw error
  return data as Product
}

// ============================================
// INVOICES
// ============================================

export async function getInvoices(companyId: string, filters?: {
  status?: Invoice['status']
  contactId?: string
  fromDate?: string
  toDate?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('invoices')
    .select(`
      *,
      contact:contacts(*),
      items:invoice_items(*)
    `)
    .eq('company_id', companyId)
    .order('invoice_date', { ascending: false })
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId)
  }
  if (filters?.fromDate) {
    query = query.gte('invoice_date', filters.fromDate)
  }
  if (filters?.toDate) {
    query = query.lte('invoice_date', filters.toDate)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data as Invoice[]
}

export async function getInvoice(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      contact:contacts(*),
      items:invoice_items(
        *,
        product:products(*),
        account:accounts(*)
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Invoice
}

export async function createInvoice(invoice: InsertInvoice, items: Omit<InsertInvoiceItem, 'invoice_id' | 'company_id'>[]) {
  const supabase = await createClient()
  
  // Create invoice
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()
  
  if (invoiceError) throw invoiceError
  
  // Create invoice items
  const itemsWithInvoiceId = items.map(item => ({
    ...item,
    invoice_id: invoiceData.id,
    company_id: invoice.company_id
  }))
  
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsWithInvoiceId)
  
  if (itemsError) throw itemsError
  
  return invoiceData as Invoice
}

// ============================================
// BILLS
// ============================================

export async function getBills(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bills')
    .select(`
      *,
      contact:contacts(*),
      items:bill_items(*)
    `)
    .eq('company_id', companyId)
    .order('bill_date', { ascending: false })
  
  if (error) throw error
  return data as Bill[]
}

// ============================================
// PAYMENTS
// ============================================

export async function getPayments(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('company_id', companyId)
    .order('payment_date', { ascending: false })
  
  if (error) throw error
  return data as Payment[]
}

export async function createPayment(payment: InsertPayment) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single()
  
  if (error) throw error
  return data as Payment
}

// ============================================
// JOURNAL ENTRIES
// ============================================

export async function getJournalEntries(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('journal_entries')
    .select(`
      *,
      lines:journal_lines(
        *,
        account:accounts(*)
      )
    `)
    .eq('company_id', companyId)
    .order('entry_date', { ascending: false })
  
  if (error) throw error
  return data as JournalEntry[]
}

export async function createJournalEntry(entry: InsertJournalEntry, lines: Omit<InsertJournalLine, 'journal_entry_id' | 'company_id'>[]) {
  const supabase = await createClient()
  
  // Validate double-entry: total debits must equal total credits
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  
  if (totalDebit !== totalCredit) {
    throw new Error(`Journal entry must balance: Debits (${totalDebit}) ≠ Credits (${totalCredit})`)
  }
  
  // Create journal entry
  const { data: entryData, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      ...entry,
      total_debit: totalDebit,
      total_credit: totalCredit,
    })
    .select()
    .single()
  
  if (entryError) throw entryError
  
  // Create journal lines
  const linesWithEntryId = lines.map(line => ({
    ...line,
    journal_entry_id: entryData.id,
    company_id: entry.company_id
  }))
  
  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert(linesWithEntryId)
  
  if (linesError) throw linesError
  
  return entryData as JournalEntry
}

// ============================================
// EXPENSES
// ============================================

export async function getExpenses(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('company_id', companyId)
    .order('expense_date', { ascending: false })
  
  if (error) throw error
  return data as Expense[]
}

export async function createExpense(expense: InsertExpense) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()
  
  if (error) throw error
  return data as Expense
}

// ============================================
// EMPLOYEES
// ============================================

export async function getEmployees(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('full_name', { ascending: true })
  
  if (error) throw error
  return data as Employee[]
}

export async function getEmployee(employeeId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single()
  
  if (error) throw error
  return data as Employee
}

export async function getAllEmployees(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('full_name', { ascending: true })
  
  if (error) throw error
  return data as Employee[]
}

export async function createEmployee(employee: InsertEmployee) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single()
  
  if (error) throw error
  return data as Employee
}

export async function updateEmployee(employeeId: string, updates: Partial<InsertEmployee>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', employeeId)
    .select()
    .single()
  
  if (error) throw error
  return data as Employee
}

// ============================================
// PAYROLL RUNS
// ============================================

export async function getPayrollRuns(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payroll_runs')
    .select(`
      *,
      items:payroll_items(
        *,
        employee:employees(*)
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as (PayrollRun & { items: (PayrollItem & { employee: Employee })[] })[]
}

export async function getPayrollRun(runId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payroll_runs')
    .select(`
      *,
      items:payroll_items(
        *,
        employee:employees(*)
      )
    `)
    .eq('id', runId)
    .single()
  
  if (error) throw error
  return data as PayrollRun & { items: (PayrollItem & { employee: Employee })[] }
}

export async function createPayrollRun(run: InsertPayrollRun, items: Omit<InsertPayrollItem, 'payroll_run_id' | 'company_id'>[]) {
  const supabase = await createClient()
  
  // Create payroll run
  const { data: runData, error: runError } = await supabase
    .from('payroll_runs')
    .insert(run)
    .select()
    .single()
  
  if (runError) throw runError
  
  // Create payroll items
  const itemsWithRunId = items.map(item => ({
    ...item,
    payroll_run_id: runData.id,
    company_id: run.company_id
  }))
  
  const { error: itemsError } = await supabase
    .from('payroll_items')
    .insert(itemsWithRunId)
  
  if (itemsError) {
    // Rollback run
    await supabase.from('payroll_runs').delete().eq('id', runData.id)
    throw itemsError
  }
  
  return runData as PayrollRun
}

export async function updatePayrollRunStatus(runId: string, status: PayrollRun['status']) {
  const supabase = await createClient()
  
  const updateData: Record<string, unknown> = { status }
  if (status === 'processed') {
    updateData.processed_at = new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('payroll_runs')
    .update(updateData)
    .eq('id', runId)
  
  if (error) throw error
  return { success: true }
}

// ============================================
// DASHBOARD STATISTICS
// ============================================

export async function getDashboardStats(companyId: string) {
  const supabase = await createClient()
  
  // Get current month bounds
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]
  
  // Fetch all stats in parallel
  const [
    invoicesResult,
    billsResult,
    expensesResult,
    overdueInvoicesResult,
    overdueInvoicesCountResult,
  overdueBillsResult,
  bankAccountsResult,
  contactsCountResult,
  accountsCountResult,
  recentInvoicesResult,
  recentBillsResult,
  recentExpensesResult,
  recentPaymentsResult,
  monthlyRevenueResult,
  monthlyExpensesResult,
  topExpensesResult,
  overdueInvoicesListResult,
  ] = await Promise.all([
    // Revenue this month (all invoices excluding cancelled)
    supabase
      .from('invoices')
      .select('total')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .gte('invoice_date', monthStart)
      .lte('invoice_date', monthEnd),
    
    // Bills this month
    supabase
      .from('bills')
      .select('total')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .gte('bill_date', monthStart)
      .lte('bill_date', monthEnd),
    
    // Direct expenses this month
    supabase
      .from('expenses')
      .select('amount')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('expense_date', monthStart)
      .lte('expense_date', monthEnd),
    
    // Overdue invoices total
    supabase
      .from('invoices')
      .select('total')
      .eq('company_id', companyId)
      .eq('status', 'overdue'),
    
    // Overdue invoices count
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'overdue'),
    
    // Overdue bills total
    supabase
      .from('bills')
      .select('total')
      .eq('company_id', companyId)
      .eq('status', 'overdue'),
    
    // Cash balance from bank accounts
    supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true),
    
    // Contacts count
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true),
    
    // Accounts count
    supabase
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true),
    
    // Recent invoices
    supabase
      .from('invoices')
      .select('id, invoice_number, total, status, invoice_date, contact:contacts(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(3),
    
    // Recent bills
    supabase
      .from('bills')
      .select('id, bill_number, total, status, bill_date, contact:contacts(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(3),
    
    // Recent expenses
    supabase
      .from('expenses')
      .select('id, expense_number, amount, description, expense_date')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(3),
    
    // Recent payments
    supabase
      .from('payments')
      .select('id, payment_number, amount, payment_date')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(3),
    
    // Monthly revenue for last 6 months
    supabase
      .from('invoices')
      .select('total, invoice_date')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .gte('invoice_date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]),
    
    // Monthly expenses for last 6 months
    supabase
      .from('bills')
      .select('total, bill_date')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .gte('bill_date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]),
    
    // Top expense categories (by account)
    supabase
      .from('expenses')
      .select('amount, category, account:accounts(name)')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .order('amount', { ascending: false })
      .limit(5),
    
    // Overdue invoices list for AI insights
    supabase
      .from('invoices')
      .select('id, invoice_number, total, contact:contacts(name), due_date')
      .eq('company_id', companyId)
      .eq('status', 'overdue')
      .limit(5),
  ])
  
  // Calculate totals
  const revenue = invoicesResult.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
  const billsTotal = billsResult.data?.reduce((sum, bill) => sum + (bill.total || 0), 0) || 0
  const expensesTotal = expensesResult.data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0
  const totalExpenses = billsTotal + expensesTotal
  const netProfit = revenue - totalExpenses
  const overdueReceivables = overdueInvoicesResult.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
  const overduePayables = overdueBillsResult.data?.reduce((sum, bill) => sum + (bill.total || 0), 0) || 0
  const overdueInvoicesCount = overdueInvoicesCountResult.count || 0
  const cashBalance = bankAccountsResult.data?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0
  const contactsCount = contactsCountResult.count || 0
  const accountsCount = accountsCountResult.count || 0
  
  // Process monthly data for charts
  const monthlyData = processMonthlyData(
    monthlyRevenueResult.data || [],
    monthlyExpensesResult.data || []
  )
  
  // Process recent activity
  const recentActivity = [
    ...(recentInvoicesResult.data || []).map((inv: any) => ({
      type: 'invoice' as const,
      id: inv.id,
      number: inv.invoice_number,
      amount: inv.total,
      date: inv.invoice_date,
      contact: inv.contact?.name,
      status: inv.status,
    })),
    ...(recentBillsResult.data || []).map((bill: any) => ({
      type: 'bill' as const,
      id: bill.id,
      number: bill.bill_number,
      amount: bill.total,
      date: bill.bill_date,
      contact: bill.contact?.name,
      status: bill.status,
    })),
    ...(recentExpensesResult.data || []).map((exp: any) => ({
      type: 'expense' as const,
      id: exp.id,
      number: exp.expense_number,
      amount: exp.amount,
      date: exp.expense_date,
      description: exp.description,
    })),
    ...(recentPaymentsResult.data || []).map((pay: any) => ({
      type: 'payment' as const,
      id: pay.id,
      number: pay.payment_number,
      amount: pay.amount,
      date: pay.payment_date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  
  // Process top expense categories
  const topExpenses = (topExpensesResult.data || []).map((exp: any) => ({
    category: exp.category || exp.account?.name || 'Other',
    amount: exp.amount,
  }))
  
  // Process overdue invoices for AI insights
  const overdueInvoicesList = (overdueInvoicesListResult.data || []).map((inv: any) => ({
    id: inv.id,
    number: inv.invoice_number,
    amount: inv.total,
    contact: inv.contact?.name,
    dueDate: inv.due_date,
  }))
  
  return {
    // Summary stats
    revenue,
    expenses: totalExpenses,
    netProfit,
    overdueReceivables,
    overduePayables,
    overdueInvoicesCount,
    cashBalance,
    contactsCount,
    accountsCount,
    
    // Chart data
    monthlyData,
    topExpenses,
    
    // Lists
    recentActivity,
    overdueInvoicesList,
  }
}

// ============================================
// BANKING
// ============================================

export async function getBankAccounts(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data as BankAccount[]
}

export async function getBankAccount(accountId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('id', accountId)
    .single()
  
  if (error) throw error
  return data as BankAccount
}

export async function getBankTransactions(companyId: string, accountId?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('bank_transactions')
    .select('*')
    .eq('company_id', companyId)
    .order('transaction_date', { ascending: false })
  
  if (accountId) {
    query = query.eq('bank_account_id', accountId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data as BankTransaction[]
}

export async function createBankTransaction(transaction: {
  company_id: string
  bank_account_id: string
  transaction_date: string
  description: string
  amount: number
  transaction_type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out'
  category_id?: string
  reference?: string
}) {
  const supabase = await createClient()
  
  // Create transaction
  const { data, error } = await supabase
    .from('bank_transactions')
    .insert({
      ...transaction,
      is_reconciled: false,
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Update bank account balance
  const { data: account } = await supabase
    .from('bank_accounts')
    .select('current_balance')
    .eq('id', transaction.bank_account_id)
    .single()
  
  if (account) {
    const adjustment = transaction.transaction_type === 'deposit' || transaction.transaction_type === 'transfer_in'
      ? transaction.amount
      : -transaction.amount
    
    await supabase
      .from('bank_accounts')
      .update({ current_balance: account.current_balance + adjustment })
      .eq('id', transaction.bank_account_id)
  }
  
  return data as BankTransaction
}

export async function reconcileBankTransaction(transactionId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('bank_transactions')
    .update({
      is_reconciled: true,
      reconciled_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
  
  if (error) throw error
  return { success: true }
}

// ============================================
// VAT RETURNS
// ============================================

export async function getVatReturns(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vat_returns')
    .select('*')
    .eq('company_id', companyId)
    .order('period_start', { ascending: false })
  
  if (error) throw error
  return data as VatReturn[]
}

export async function calculateVatSummary(companyId: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  
  // Get output VAT from invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, vat_total, subtotal, invoice_date')
    .eq('company_id', companyId)
    .neq('status', 'cancelled')
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate)
  
  // Get input VAT from bills
  const { data: bills } = await supabase
    .from('bills')
    .select('total, vat_total, subtotal, bill_date')
    .eq('company_id', companyId)
    .neq('status', 'cancelled')
    .gte('bill_date', startDate)
    .lte('bill_date', endDate)
  
  // Get input VAT from expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, vat_amount, expense_date')
    .eq('company_id', companyId)
    .eq('status', 'approved')
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
  
  // Calculate totals
  const outputVat = (invoices || []).reduce((sum, inv) => sum + (inv.vat_total || 0), 0)
  const inputVatFromBills = (bills || []).reduce((sum, bill) => sum + (bill.vat_total || 0), 0)
  const inputVatFromExpenses = (expenses || []).reduce((sum, exp) => sum + (exp.vat_amount || 0), 0)
  const inputVat = inputVatFromBills + inputVatFromExpenses
  
  const standardRatedSupplies = (invoices || [])
    .filter(inv => inv.vat_total > 0)
    .reduce((sum, inv) => sum + (inv.subtotal || 0), 0)
  
  const zeroRatedSupplies = (invoices || [])
    .filter(inv => inv.vat_total === 0 && inv.total > 0)
    .reduce((sum, inv) => sum + (inv.total || 0), 0)
  
  const standardRatedExpenses = (bills || [])
    .reduce((sum, bill) => sum + (bill.subtotal || 0), 0)
  
  return {
    outputVat,
    inputVat,
    netVat: outputVat - inputVat,
    standardRatedSupplies,
    zeroRatedSupplies,
    standardRatedExpenses,
    invoiceCount: invoices?.length || 0,
    billCount: bills?.length || 0,
    expenseCount: expenses?.length || 0,
  }
}

export async function createVatReturn(vatReturn: {
  company_id: string
  period_start: string
  period_end: string
  box1a_abu_dhabi: number
  box1b_dubai: number
  box1c_sharjah: number
  box1d_ajman: number
  box1e_umm_al_quwain: number
  box1f_ras_al_khaimah: number
  box1g_fujairah: number
  box4_zero_rated_supplies: number
  box5_exempt_supplies: number
  box6_standard_rated_expenses: number
  vat_collected: number
  vat_paid: number
  box9_net_vat_due: number
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vat_returns')
    .insert({
      ...vatReturn,
      status: 'draft',
      box2_tourist_refunds: 0,
      box3_reverse_charge_supplies: 0,
      box7_reverse_charge_expenses: 0,
      box8_adjustments: 0,
    })
    .select()
    .single()
  
  if (error) throw error
  return data as VatReturn
}

export async function fileVatReturn(vatReturnId: string, filingReference: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('vat_returns')
    .update({
      status: 'filed',
      filed_at: new Date().toISOString(),
      filing_reference: filingReference,
    })
    .eq('id', vatReturnId)
  
  if (error) throw error
  return { success: true }
}

// ============================================
// STOCK MOVEMENTS / INVENTORY
// ============================================

export async function getStockMovements(companyId: string, filters?: {
  productId?: string
  movementType?: StockMovement['movement_type']
  fromDate?: string
  toDate?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      product:products(*)
    `)
    .eq('company_id', companyId)
    .order('movement_date', { ascending: false })
  
  if (filters?.productId) {
    query = query.eq('product_id', filters.productId)
  }
  if (filters?.movementType) {
    query = query.eq('movement_type', filters.movementType)
  }
  if (filters?.fromDate) {
    query = query.gte('movement_date', filters.fromDate)
  }
  if (filters?.toDate) {
    query = query.lte('movement_date', filters.toDate)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data as (StockMovement & { product: Product })[]
}

export async function createStockMovement(movement: InsertStockMovement) {
  const supabase = await createClient()
  
  // Create the movement
  const { data, error } = await supabase
    .from('stock_movements')
    .insert(movement)
    .select()
    .single()
  
  if (error) throw error
  
  // Update product stock on hand
  const { data: product } = await supabase
    .from('products')
    .select('stock_on_hand, track_inventory')
    .eq('id', movement.product_id)
    .single()
  
  if (product && product.track_inventory) {
    const quantityChange = ['stock_in', 'transfer_in', 'sale_return'].includes(movement.movement_type)
      ? movement.quantity
      : -movement.quantity
    
    await supabase
      .from('products')
      .update({ stock_on_hand: product.stock_on_hand + quantityChange })
      .eq('id', movement.product_id)
  }
  
  return data as StockMovement
}

export async function getProductsInventory(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .eq('track_inventory', true)
    .order('name', { ascending: true })
  
  if (error) throw error
  return data as Product[]
}

export async function getStockValuation(companyId: string) {
  const supabase = await createClient()
  
  // Get all products with inventory tracking
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .eq('track_inventory', true)
  
  if (error) throw error
  
  // Calculate valuation using average cost (simplified)
  const valuation = (products || []).map(product => ({
    product_id: product.id,
    sku: product.sku,
    name: product.name,
    stock_on_hand: product.stock_on_hand,
    unit_cost: product.cost_price,
    total_value: product.stock_on_hand * product.cost_price,
    reorder_level: product.reorder_level,
    needs_reorder: product.stock_on_hand <= product.reorder_level,
  }))
  
  const totalValue = valuation.reduce((sum, item) => sum + item.total_value, 0)
  
  return {
    items: valuation,
    totalValue,
    itemCount: valuation.length,
    lowStockCount: valuation.filter(i => i.needs_reorder).length,
  }
}

export async function updateProduct(productId: string, updates: Partial<InsertProduct>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()
  
  if (error) throw error
  return data as Product
}

// ============================================
// REPORTS
// ============================================

export async function getProfitAndLoss(companyId: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  
  // Get all posted journal entries in date range
  const { data: entries } = await supabase
    .from('journal_entries')
    .select(`
      id,
      lines:journal_lines(
        debit,
        credit,
        account:accounts(
          id,
          code,
          name,
          type
        )
      )
    `)
    .eq('company_id', companyId)
    .eq('status', 'posted')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
  
  const allLines: any[] = []
  entries?.forEach((entry: any) => {
    entry.lines?.forEach((line: any) => allLines.push(line))
  })
  
  return calculateProfitAndLoss(allLines)
}

function calculateProfitAndLoss(lines: any[]) {
  const revenue: { account: string; code: string; amount: number }[] = []
  const expenses: { account: string; code: string; amount: number }[] = []
  const cogs: { account: string; code: string; amount: number }[] = []
  const otherIncome: { account: string; code: string; amount: number }[] = []
  
  // Group by account
  const accountTotals: Record<string, { name: string; code: string; type: string; total: number }> = {}
  
  lines.forEach(line => {
    const acc = line.account
    if (!acc) return
    
    const key = acc.id
    if (!accountTotals[key]) {
      accountTotals[key] = {
        name: acc.name,
        code: acc.code,
        type: acc.type,
        total: 0,
      }
    }
    
    // Revenue: credit increases, debit decreases
    // Expenses: debit increases, credit decreases
    if (acc.type === 'revenue') {
      accountTotals[key].total += (line.credit || 0) - (line.debit || 0)
    } else if (acc.type === 'expense' || acc.type === 'cogs') {
      accountTotals[key].total += (line.debit || 0) - (line.credit || 0)
    }
  })
  
  // Categorize
  Object.entries(accountTotals).forEach(([id, data]) => {
    if (data.type === 'revenue') {
      if (data.total > 0) {
        const category = data.code.startsWith('49') ? otherIncome : revenue
        category.push({ account: data.name, code: data.code, amount: data.total })
      }
    } else if (data.type === 'cogs') {
      if (data.total > 0) {
        cogs.push({ account: data.name, code: data.code, amount: data.total })
      }
    } else if (data.type === 'expense') {
      if (data.total > 0) {
        expenses.push({ account: data.name, code: data.code, amount: data.total })
      }
    }
  })
  
  // Sort by code
  revenue.sort((a, b) => a.code.localeCompare(b.code))
  expenses.sort((a, b) => a.code.localeCompare(b.code))
  cogs.sort((a, b) => a.code.localeCompare(b.code))
  otherIncome.sort((a, b) => a.code.localeCompare(b.code))
  
  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0)
  const totalCogs = cogs.reduce((sum, c) => sum + c.amount, 0)
  const grossProfit = totalRevenue - totalCogs
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalOtherIncome = otherIncome.reduce((sum, o) => sum + o.amount, 0)
  const netProfit = grossProfit - totalExpenses + totalOtherIncome
  
  return {
    revenue,
    totalRevenue,
    cogs,
    totalCogs,
    grossProfit,
    expenses,
    totalExpenses,
    otherIncome,
    totalOtherIncome,
    netProfit,
  }
}

export async function getBalanceSheet(companyId: string, asOfDate: string) {
  const supabase = await createClient()
  
  // Get all posted journal entries up to date
  const { data: entries } = await supabase
    .from('journal_entries')
    .select(`
      id,
      lines:journal_lines(
        debit,
        credit,
        account:accounts(
          id,
          code,
          name,
          type,
          sub_type
        )
      )
    `)
    .eq('company_id', companyId)
    .eq('status', 'posted')
    .lte('entry_date', asOfDate)
  
  const allLines: any[] = []
  entries?.forEach((entry: any) => {
    entry.lines?.forEach((line: any) => allLines.push(line))
  })
  
  return calculateBalanceSheet(allLines)
}

function calculateBalanceSheet(lines: any[]) {
  const assets: { account: string; code: string; subType: string; amount: number }[] = []
  const liabilities: { account: string; code: string; subType: string; amount: number }[] = []
  const equity: { account: string; code: string; subType: string; amount: number }[] = []
  
  // Calculate account balances
  const accountTotals: Record<string, { name: string; code: string; type: string; subType: string; balance: number }> = {}
  
  lines.forEach(line => {
    const acc = line.account
    if (!acc) return
    
    const key = acc.id
    if (!accountTotals[key]) {
      accountTotals[key] = {
        name: acc.name,
        code: acc.code,
        type: acc.type,
        subType: acc.sub_type || '',
        balance: 0,
      }
    }
    
    // Assets: debit increases
    // Liabilities & Equity: credit increases
    if (acc.type === 'asset') {
      accountTotals[key].balance += (line.debit || 0) - (line.credit || 0)
    } else if (acc.type === 'liability' || acc.type === 'equity') {
      accountTotals[key].balance += (line.credit || 0) - (line.debit || 0)
    }
  })
  
  // Categorize
  Object.entries(accountTotals).forEach(([id, data]) => {
    if (data.type === 'asset' && data.balance !== 0) {
      assets.push({ 
        account: data.name, 
        code: data.code, 
        subType: data.subType || 'current_asset',
        amount: Math.abs(data.balance) 
      })
    } else if (data.type === 'liability' && data.balance !== 0) {
      liabilities.push({ 
        account: data.name, 
        code: data.code, 
        subType: data.subType || 'current_liability',
        amount: Math.abs(data.balance) 
      })
    } else if (data.type === 'equity' && data.balance !== 0) {
      equity.push({ 
        account: data.name, 
        code: data.code, 
        subType: data.subType || 'equity',
        amount: Math.abs(data.balance) 
      })
    }
  })
  
  // Sort by code
  assets.sort((a, b) => a.code.localeCompare(b.code))
  liabilities.sort((a, b) => a.code.localeCompare(b.code))
  equity.sort((a, b) => a.code.localeCompare(b.code))
  
  // Group by sub-type
  const currentAssets = assets.filter(a => a.subType === 'current_asset')
  const fixedAssets = assets.filter(a => a.subType === 'fixed_asset')
  const currentLiabilities = liabilities.filter(l => l.subType === 'current_liability')
  const longTermLiabilities = liabilities.filter(l => l.subType === 'long_term_liability')
  
  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0)
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0)
  const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0)
  
  return {
    assets: {
      current: currentAssets,
      fixed: fixedAssets,
      all: assets,
      total: totalAssets,
    },
    liabilities: {
      current: currentLiabilities,
      longTerm: longTermLiabilities,
      all: liabilities,
      total: totalLiabilities,
    },
    equity: {
      all: equity,
      total: totalEquity,
    },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1,
  }
}

export async function getTrialBalance(companyId: string, asOfDate: string) {
  const supabase = await createClient()
  
  // Get all posted journal entries up to date
  const { data: entries } = await supabase
    .from('journal_entries')
    .select(`
      id,
      lines:journal_lines(
        debit,
        credit,
        account:accounts(
          id,
          code,
          name,
          type
        )
      )
    `)
    .eq('company_id', companyId)
    .eq('status', 'posted')
    .lte('entry_date', asOfDate)
  
  const allLines: any[] = []
  entries?.forEach((entry: any) => {
    entry.lines?.forEach((line: any) => allLines.push(line))
  })
  
  // Calculate account balances
  const accountTotals: Record<string, { name: string; code: string; type: string; debit: number; credit: number }> = {}
  
  allLines.forEach(line => {
    const acc = line.account
    if (!acc) return
    
    const key = acc.id
    if (!accountTotals[key]) {
      accountTotals[key] = {
        name: acc.name,
        code: acc.code,
        type: acc.type,
        debit: 0,
        credit: 0,
      }
    }
    
    accountTotals[key].debit += line.debit || 0
    accountTotals[key].credit += line.credit || 0
  })
  
  // Convert to trial balance format
  const trialBalance = Object.entries(accountTotals)
    .map(([id, data]) => ({
      code: data.code,
      account: data.name,
      type: data.type,
      debit: data.debit > data.credit ? data.debit - data.credit : 0,
      credit: data.credit > data.debit ? data.credit - data.debit : 0,
    }))
    .filter(item => item.debit > 0 || item.credit > 0)
    .sort((a, b) => a.code.localeCompare(b.code))
  
  const totalDebit = trialBalance.reduce((sum, item) => sum + item.debit, 0)
  const totalCredit = trialBalance.reduce((sum, item) => sum + item.credit, 0)
  
  return {
    items: trialBalance,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 1,
  }
}

// Helper function to process monthly data for charts
function processMonthlyData(
  revenueData: Array<{ total: number; invoice_date: string }>,
  expenseData: Array<{ total: number; bill_date: string }>
) {
  const now = new Date()
  const months: { [key: string]: { month: string; revenue: number; expenses: number } } = {}
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toISOString().slice(0, 7)
    const monthName = date.toLocaleString('en-US', { month: 'short' })
    months[key] = { month: monthName, revenue: 0, expenses: 0 }
  }
  
  // Aggregate revenue by month
  for (const inv of revenueData) {
    const key = inv.invoice_date?.slice(0, 7)
    if (key && months[key]) {
      months[key].revenue += inv.total || 0
    }
  }
  
  // Aggregate expenses by month
  for (const bill of expenseData) {
    const key = bill.bill_date?.slice(0, 7)
    if (key && months[key]) {
      months[key].expenses += bill.total || 0
    }
  }
  
  return Object.values(months)
}
