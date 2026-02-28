'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateCOAForCompany, type IndustryType } from '@/lib/db/coa-templates'
import type { 
  InsertAccount, 
  InsertContact,
  InsertCompany,
  InsertInvoice,
  InsertInvoiceItem,
  InsertBill,
  InsertBillItem,
  InsertJournalEntry,
  InsertJournalLine,
} from '@/types/database'

// ============================================
// ACCOUNTS (Chart of Accounts)
// ============================================

export async function createAccountAction(formData: InsertAccount) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('accounts')
    .insert(formData)
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/accounts')
  return { data }
}

export async function updateAccountAction(accountId: string, formData: Partial<InsertAccount>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('accounts')
    .update(formData)
    .eq('id', accountId)
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/accounts')
  return { data }
}

export async function deleteAccountAction(accountId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('accounts')
    .update({ is_active: false })
    .eq('id', accountId)
    .eq('is_system', false)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/accounts')
  return { success: true }
}

export async function loadIndustryCOAAction(companyId: string, industry: IndustryType) {
  const supabase = await createClient()
  
  const { data: existingAccounts, error: checkError } = await supabase
    .from('accounts')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)
  
  if (checkError) {
    return { error: checkError.message }
  }
  
  if (existingAccounts && existingAccounts.length > 0) {
    return { error: 'Accounts already exist for this company. Cannot load template.' }
  }
  
  const accounts = generateCOAForCompany(companyId, industry)
  
  const accountsWithCompanyId = accounts.map(account => ({
    ...account,
    company_id: companyId,
  }))
  
  const { error: insertError } = await supabase
    .from('accounts')
    .insert(accountsWithCompanyId)
  
  if (insertError) {
    return { error: insertError.message }
  }
  
  revalidatePath('/dashboard/accounts')
  return { success: true, count: accounts.length }
}

// ============================================
// CONTACTS
// ============================================

export async function createContactAction(formData: InsertContact) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contacts')
    .insert(formData)
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/contacts')
  return { data }
}

export async function updateContactAction(contactId: string, formData: Partial<InsertContact>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contacts')
    .update(formData)
    .eq('id', contactId)
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/contacts')
  return { data }
}

export async function deleteContactAction(contactId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('contacts')
    .update({ is_active: false })
    .eq('id', contactId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/contacts')
  return { success: true }
}

// ============================================
// COMPANIES
// ============================================

export async function createCompanyAction(formData: InsertCompany) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert(formData)
    .select()
    .single()
  
  if (companyError) {
    return { error: companyError.message }
  }
  
  const { error: linkError } = await supabase
    .from('users_companies')
    .insert({
      user_id: user.id,
      company_id: company.id,
      role: 'owner',
    })
  
  if (linkError) {
    return { error: linkError.message }
  }
  
  revalidatePath('/dashboard')
  return { data: company }
}

// ============================================
// INVOICES
// ============================================

interface InvoiceWithItems {
  invoice: InsertInvoice
  items: Omit<InsertInvoiceItem, 'invoice_id' | 'company_id'>[]
}

export async function createInvoiceAction(data: InvoiceWithItems) {
  const supabase = await createClient()
  
  // Get settings for invoice number
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('company_id', data.invoice.company_id)
    .single()
  
  const invoiceNumber = settings 
    ? `${settings.invoice_prefix}${String(settings.invoice_next_number).padStart(6, '0')}`
    : `INV-${Date.now()}`
  
  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      ...data.invoice,
      invoice_number: invoiceNumber,
    })
    .select()
    .single()
  
  if (invoiceError) {
    return { error: invoiceError.message }
  }
  
  // Create invoice items
  const itemsWithInvoiceId = data.items.map((item, index) => ({
    ...item,
    invoice_id: invoice.id,
    company_id: data.invoice.company_id,
    sort_order: index,
  }))
  
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsWithInvoiceId)
  
  if (itemsError) {
    // Rollback invoice
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return { error: itemsError.message }
  }
  
  // Update settings (increment invoice number)
  if (settings) {
    await supabase
      .from('settings')
      .update({ invoice_next_number: settings.invoice_next_number + 1 })
      .eq('id', settings.id)
  }
  
  // Create journal entry for double-entry accounting
  if (data.invoice.status !== 'draft') {
    await createInvoiceJournalEntry(supabase, invoice, itemsWithInvoiceId, data.invoice.company_id)
  }
  
  revalidatePath('/dashboard/invoices')
  return { data: invoice }
}

export async function updateInvoiceAction(invoiceId: string, data: Partial<InvoiceWithItems>) {
  const supabase = await createClient()
  
  // Get existing invoice
  const { data: existingInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()
  
  if (fetchError) {
    return { error: fetchError.message }
  }
  
  // Update invoice
  if (data.invoice) {
    const { error: updateError } = await supabase
      .from('invoices')
      .update(data.invoice)
      .eq('id', invoiceId)
    
    if (updateError) {
      return { error: updateError.message }
    }
  }
  
  // Update items if provided
  if (data.items) {
    // Delete existing items
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
    
    // Insert new items
    const itemsWithInvoiceId = data.items.map((item, index) => ({
      ...item,
      invoice_id: invoiceId,
      company_id: existingInvoice.company_id,
      sort_order: index,
    }))
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId)
    
    if (itemsError) {
      return { error: itemsError.message }
    }
  }
  
  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function updateInvoiceStatusAction(invoiceId: string, status: string) {
  const supabase = await createClient()
  
  const updateData: Record<string, unknown> = { status }
  
  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/invoices')
  return { success: true }
}

// Helper: Create journal entry for invoice
async function createInvoiceJournalEntry(
  supabase: any,
  invoice: any,
  items: any[],
  companyId: string
) {
  // Get required accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, code, type')
    .eq('company_id', companyId)
  
  // Find Accounts Receivable account (code starts with 12)
  const arAccount = accounts?.find((a: any) => a.code.startsWith('12') && a.type === 'asset')
  // Find Sales Revenue account (code starts with 41)
  const salesAccount = accounts?.find((a: any) => a.code.startsWith('41') && a.type === 'revenue')
  // Find VAT Output account (code starts with 221)
  const vatAccount = accounts?.find((a: any) => a.code.startsWith('221') && a.type === 'liability')
  
  if (!arAccount || !salesAccount) {
    console.warn('Required accounts not found for journal entry')
    return
  }
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0)
  const vatTotal = items.reduce((sum, item) => sum + (item.vat_amount || 0), 0)
  const total = subtotal + vatTotal
  
  // Create journal entry
  const entryNumber = `JE-${Date.now()}`
  
  const { data: journalEntry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      entry_number: entryNumber,
      entry_date: invoice.invoice_date,
      description: `Invoice ${invoice.invoice_number}`,
      reference: invoice.invoice_number,
      source: 'invoice',
      source_id: invoice.id,
      status: 'posted',
      total_debit: total,
      total_credit: total,
    })
    .select()
    .single()
  
  if (entryError || !journalEntry) {
    console.error('Failed to create journal entry:', entryError)
    return
  }
  
  // Create journal lines
  const lines: InsertJournalLine[] = [
    // Debit Accounts Receivable
    {
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: arAccount.id,
      debit: total,
      credit: 0,
      description: `Invoice ${invoice.invoice_number} - Receivable`,
    },
    // Credit Sales Revenue
    {
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: salesAccount.id,
      debit: 0,
      credit: subtotal,
      description: `Invoice ${invoice.invoice_number} - Revenue`,
    },
  ]
  
  // Credit VAT Output if applicable
  if (vatTotal > 0 && vatAccount) {
    lines.push({
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: vatAccount.id,
      debit: 0,
      credit: vatTotal,
      description: `Invoice ${invoice.invoice_number} - VAT Output`,
    })
  }
  
  await supabase.from('journal_lines').insert(lines)
}

// ============================================
// BILLS
// ============================================

interface BillWithItems {
  bill: InsertBill
  items: Omit<InsertBillItem, 'bill_id' | 'company_id'>[]
}

export async function createBillAction(data: BillWithItems) {
  const supabase = await createClient()
  
  // Get settings for bill number
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('company_id', data.bill.company_id)
    .single()
  
  const billNumber = settings 
    ? `${settings.bill_prefix}${String(settings.bill_next_number).padStart(6, '0')}`
    : `BILL-${Date.now()}`
  
  // Create bill
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      ...data.bill,
      bill_number: billNumber,
    })
    .select()
    .single()
  
  if (billError) {
    return { error: billError.message }
  }
  
  // Create bill items
  const itemsWithBillId = data.items.map((item, index) => ({
    ...item,
    bill_id: bill.id,
    company_id: data.bill.company_id,
    sort_order: index,
  }))
  
  const { error: itemsError } = await supabase
    .from('bill_items')
    .insert(itemsWithBillId)
  
  if (itemsError) {
    await supabase.from('bills').delete().eq('id', bill.id)
    return { error: itemsError.message }
  }
  
  // Update settings
  if (settings) {
    await supabase
      .from('settings')
      .update({ bill_next_number: settings.bill_next_number + 1 })
      .eq('id', settings.id)
  }
  
  // Create journal entry
  if (data.bill.status !== 'draft') {
    await createBillJournalEntry(supabase, bill, itemsWithBillId, data.bill.company_id)
  }
  
  revalidatePath('/dashboard/bills')
  return { data: bill }
}

export async function updateBillStatusAction(billId: string, status: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('bills')
    .update({ status })
    .eq('id', billId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/bills')
  return { success: true }
}

// Helper: Create journal entry for bill
async function createBillJournalEntry(
  supabase: any,
  bill: any,
  items: any[],
  companyId: string
) {
  // Get required accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, code, type')
    .eq('company_id', companyId)
  
  // Find Accounts Payable account (code starts with 21)
  const apAccount = accounts?.find((a: any) => a.code.startsWith('21') && a.type === 'liability')
  // Find expense accounts from items or default
  const vatAccount = accounts?.find((a: any) => a.code.startsWith('131') && a.type === 'asset')
  
  if (!apAccount) {
    console.warn('Required accounts not found for journal entry')
    return
  }
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0)
  const vatTotal = items.reduce((sum, item) => sum + (item.vat_amount || 0), 0)
  const total = subtotal + vatTotal
  
  // Create journal entry
  const entryNumber = `JE-${Date.now()}`
  
  const { data: journalEntry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      entry_number: entryNumber,
      entry_date: bill.bill_date,
      description: `Bill ${bill.bill_number}`,
      reference: bill.bill_number,
      source: 'bill',
      source_id: bill.id,
      status: 'posted',
      total_debit: total,
      total_credit: total,
    })
    .select()
    .single()
  
  if (entryError || !journalEntry) {
    console.error('Failed to create journal entry:', entryError)
    return
  }
  
  // Create journal lines
  const lines: InsertJournalLine[] = []
  
  // Debit expense accounts from items
  for (const item of items) {
    lines.push({
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: item.account_id,
      debit: item.line_total,
      credit: 0,
      description: `Bill ${bill.bill_number} - ${item.description}`,
    })
    
    // Debit VAT Input if applicable
    if (item.vat_amount > 0 && vatAccount) {
      lines.push({
        company_id: companyId,
        journal_entry_id: journalEntry.id,
        account_id: vatAccount.id,
        debit: item.vat_amount,
        credit: 0,
        description: `Bill ${bill.bill_number} - VAT Input`,
      })
    }
  }
  
  // Credit Accounts Payable
  lines.push({
    company_id: companyId,
    journal_entry_id: journalEntry.id,
    account_id: apAccount.id,
    debit: 0,
    credit: total,
    description: `Bill ${bill.bill_number} - Payable`,
  })
  
  await supabase.from('journal_lines').insert(lines)
}

// ============================================
// PAYMENTS
// ============================================

export async function createPaymentAction(payment: {
  company_id: string
  contact_id: string
  invoice_id?: string
  bill_id?: string
  amount: number
  payment_method: string
  reference?: string
  bank_account_id?: string
  notes?: string
}) {
  const supabase = await createClient()
  
  // Get settings for payment number
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('company_id', payment.company_id)
    .single()
  
  const paymentNumber = settings 
    ? `${settings.payment_prefix}${String(settings.payment_next_number).padStart(6, '0')}`
    : `PAY-${Date.now()}`
  
  // Create payment
  const { data: newPayment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      ...payment,
      payment_number: paymentNumber,
      payment_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()
  
  if (paymentError) {
    return { error: paymentError.message }
  }
  
  // Update invoice if linked
  if (payment.invoice_id) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('amount_paid, total')
      .eq('id', payment.invoice_id)
      .single()
    
    if (invoice) {
      const newAmountPaid = (invoice.amount_paid || 0) + payment.amount
      const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial'
      
      await supabase
        .from('invoices')
        .update({ 
          amount_paid: newAmountPaid,
          status: newStatus
        })
        .eq('id', payment.invoice_id)
    }
  }
  
  // Update bill if linked
  if (payment.bill_id) {
    const { data: bill } = await supabase
      .from('bills')
      .select('amount_paid, total')
      .eq('id', payment.bill_id)
      .single()
    
    if (bill) {
      const newAmountPaid = (bill.amount_paid || 0) + payment.amount
      const newStatus = newAmountPaid >= bill.total ? 'paid' : 'partial'
      
      await supabase
        .from('bills')
        .update({ 
          amount_paid: newAmountPaid,
          status: newStatus
        })
        .eq('id', payment.bill_id)
    }
  }
  
  // Update settings
  if (settings) {
    await supabase
      .from('settings')
      .update({ payment_next_number: settings.payment_next_number + 1 })
      .eq('id', settings.id)
  }
  
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/bills')
  return { data: newPayment }
}

// ============================================
// EMPLOYEES
// ============================================

interface EmployeeFormData {
  employee_code: string
  full_name: string
  full_name_ar?: string
  nationality?: string
  emirates_id?: string
  passport_no?: string
  passport_expiry?: string
  labour_card_no?: string
  mohre_id?: string
  skill_level?: number
  joining_date: string
  department?: string
  designation?: string
  basic_salary: number
  housing_allowance: number
  transport_allowance: number
  other_allowances: number
  bank_name?: string
  iban?: string
  bank_routing_code?: string
  annual_leave_balance?: number
  sick_leave_balance?: number
  status?: 'active' | 'on_leave' | 'terminated'
}

export async function createEmployeeAction(companyId: string, formData: EmployeeFormData) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .insert({
      company_id: companyId,
      ...formData,
      status: formData.status || 'active',
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/payroll/employees')
  return { data }
}

export async function updateEmployeeAction(employeeId: string, formData: Partial<EmployeeFormData>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .update(formData)
    .eq('id', employeeId)
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/payroll/employees')
  return { data }
}

export async function deleteEmployeeAction(employeeId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('employees')
    .update({ status: 'terminated' })
    .eq('id', employeeId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/payroll/employees')
  return { success: true }
}

// ============================================
// PAYROLL RUNS
// ============================================

interface PayrollItemData {
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

interface PayrollRunData {
  run_month: number
  run_year: number
  items: PayrollItemData[]
}

export async function createPayrollRunAction(companyId: string, data: PayrollRunData) {
  const supabase = await createClient()
  
  // Check if payroll run already exists for this month/year
  const { data: existingRun } = await supabase
    .from('payroll_runs')
    .select('id')
    .eq('company_id', companyId)
    .eq('run_month', data.run_month)
    .eq('run_year', data.run_year)
    .single()
  
  if (existingRun) {
    return { error: 'Payroll run already exists for this period' }
  }
  
  const totalAmount = data.items.reduce((sum, item) => sum + item.net_salary, 0)
  
  // Create payroll run
  const { data: run, error: runError } = await supabase
    .from('payroll_runs')
    .insert({
      company_id: companyId,
      run_month: data.run_month,
      run_year: data.run_year,
      status: 'draft',
      total_amount: totalAmount,
      total_employees: data.items.length,
    })
    .select()
    .single()
  
  if (runError) {
    return { error: runError.message }
  }
  
  // Create payroll items
  const items = data.items.map(item => ({
    ...item,
    company_id: companyId,
    payroll_run_id: run.id,
  }))
  
  const { error: itemsError } = await supabase
    .from('payroll_items')
    .insert(items)
  
  if (itemsError) {
    // Rollback run
    await supabase.from('payroll_runs').delete().eq('id', run.id)
    return { error: itemsError.message }
  }
  
  revalidatePath('/dashboard/payroll')
  return { data: run }
}

export async function approvePayrollRunAction(runId: string, companyId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'approved' })
    .eq('id', runId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/payroll')
  return { success: true }
}

export async function processPayrollRunAction(runId: string, companyId: string) {
  const supabase = await createClient()
  
  // Get payroll run with items
  const { data: run, error: runError } = await supabase
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
  
  if (runError || !run) {
    return { error: 'Payroll run not found' }
  }
  
  if (run.status !== 'approved') {
    return { error: 'Payroll run must be approved before processing' }
  }
  
  // Create journal entry for payroll
  await createPayrollJournalEntry(supabase, run, companyId)
  
  // Update status to processed
  const { error } = await supabase
    .from('payroll_runs')
    .update({ 
      status: 'processed',
      processed_at: new Date().toISOString()
    })
    .eq('id', runId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/payroll')
  return { success: true }
}

// Helper: Create journal entry for payroll
async function createPayrollJournalEntry(
  supabase: any,
  run: any,
  companyId: string
) {
  // Get required accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, code, type, name')
    .eq('company_id', companyId)
  
  // Find required accounts by code patterns
  const salaryExpenseAccount = accounts?.find((a: any) => 
    a.code.startsWith('61') && a.type === 'expense' && a.name.toLowerCase().includes('salary')
  ) || accounts?.find((a: any) => a.code.startsWith('61'))
  
  const housingExpenseAccount = accounts?.find((a: any) => 
    a.code.startsWith('61') && a.type === 'expense' && a.name.toLowerCase().includes('housing')
  ) || salaryExpenseAccount
  
  const payrollPayableAccount = accounts?.find((a: any) => 
    a.code.startsWith('22') && a.type === 'liability' && (a.name.toLowerCase().includes('payable') || a.name.toLowerCase().includes('salary'))
  ) || accounts?.find((a: any) => a.code.startsWith('22'))
  
  if (!salaryExpenseAccount || !payrollPayableAccount) {
    console.warn('Required accounts not found for payroll journal entry')
    return
  }
  
  // Calculate totals from items
  const totalBasic = run.items.reduce((sum: number, item: any) => sum + item.basic_salary, 0)
  const totalHousing = run.items.reduce((sum: number, item: any) => sum + item.housing_allowance, 0)
  const totalTransport = run.items.reduce((sum: number, item: any) => sum + item.transport_allowance, 0)
  const totalOther = run.items.reduce((sum: number, item: any) => sum + item.other_allowances, 0)
  const totalOvertime = run.items.reduce((sum: number, item: any) => sum + item.overtime_amount, 0)
  const totalLeave = run.items.reduce((sum: number, item: any) => sum + item.leave_salary, 0)
  const totalDeductions = run.items.reduce((sum: number, item: any) => sum + item.deductions, 0)
  const totalNet = run.items.reduce((sum: number, item: any) => sum + item.net_salary, 0)
  
  const grossSalary = totalBasic + totalHousing + totalTransport + totalOther + totalOvertime + totalLeave
  const netPayable = totalNet
  
  // Create journal entry
  const monthName = new Date(run.run_year, run.run_month - 1).toLocaleString('en-US', { month: 'long' })
  const entryNumber = `JE-PAY-${run.run_year}${String(run.run_month).padStart(2, '0')}-${Date.now()}`
  const entryDate = `${run.run_year}-${String(run.run_month).padStart(2, '0')}-28`
  
  const { data: journalEntry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      entry_number: entryNumber,
      entry_date: entryDate,
      description: `Payroll - ${monthName} ${run.run_year}`,
      reference: `PAYROLL-${run.run_year}${String(run.run_month).padStart(2, '0')}`,
      source: 'payroll',
      source_id: run.id,
      status: 'posted',
      total_debit: grossSalary,
      total_credit: netPayable + totalDeductions,
    })
    .select()
    .single()
  
  if (entryError || !journalEntry) {
    console.error('Failed to create journal entry:', entryError)
    return
  }
  
  // Create journal lines
  const lines: InsertJournalLine[] = [
    // Debit Salary Expense
    {
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: salaryExpenseAccount.id,
      debit: totalBasic,
      credit: 0,
      description: `Payroll ${monthName} ${run.run_year} - Basic Salary`,
    },
  ]
  
  // Add housing allowance if significant
  if (totalHousing > 0) {
    lines.push({
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: housingExpenseAccount.id,
      debit: totalHousing,
      credit: 0,
      description: `Payroll ${monthName} ${run.run_year} - Housing Allowance`,
    })
  }
  
  // Add transport allowance
  if (totalTransport > 0) {
    lines.push({
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: salaryExpenseAccount.id,
      debit: totalTransport,
      credit: 0,
      description: `Payroll ${monthName} ${run.run_year} - Transport Allowance`,
    })
  }
  
  // Add other allowances
  if (totalOther > 0) {
    lines.push({
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: salaryExpenseAccount.id,
      debit: totalOther,
      credit: 0,
      description: `Payroll ${monthName} ${run.run_year} - Other Allowances`,
    })
  }
  
  // Add overtime
  if (totalOvertime > 0) {
    lines.push({
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: salaryExpenseAccount.id,
      debit: totalOvertime,
      credit: 0,
      description: `Payroll ${monthName} ${run.run_year} - Overtime`,
    })
  }
  
  // Add leave salary
  if (totalLeave > 0) {
    lines.push({
      company_id: companyId,
      journal_entry_id: journalEntry.id,
      account_id: salaryExpenseAccount.id,
      debit: totalLeave,
      credit: 0,
      description: `Payroll ${monthName} ${run.run_year} - Leave Salary`,
    })
  }
  
  // Credit Payroll Payable (net salary)
  lines.push({
    company_id: companyId,
    journal_entry_id: journalEntry.id,
    account_id: payrollPayableAccount.id,
    debit: 0,
    credit: netPayable,
    description: `Payroll ${monthName} ${run.run_year} - Net Payable`,
  })
  
  // Credit deductions (if any - typically advances, loans, etc.)
  if (totalDeductions > 0) {
    const receivablesAccount = accounts?.find((a: any) => 
      a.code.startsWith('12') && a.type === 'asset'
    )
    if (receivablesAccount) {
      lines.push({
        company_id: companyId,
        journal_entry_id: journalEntry.id,
        account_id: receivablesAccount.id,
        debit: 0,
        credit: totalDeductions,
        description: `Payroll ${monthName} ${run.run_year} - Deductions`,
      })
    }
  }
  
  await supabase.from('journal_lines').insert(lines)
}
