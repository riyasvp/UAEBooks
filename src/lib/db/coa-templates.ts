// ============================================
// Industry Chart of Accounts Templates
// Pre-defined account structures for different industries
// ============================================

import type { InsertAccount } from '@/types/database'

export type IndustryType = 'general' | 'healthcare' | 'retail' | 'trading' | 'construction' | 'real_estate' | 'hospitality' | 'professional_services' | 'manufacturing'

interface AccountTemplate {
  code: string
  name: string
  nameAr?: string
  type: InsertAccount['type']
  sub_type?: InsertAccount['sub_type']
  vat_applicable?: boolean
  vat_rate?: number
  is_system?: boolean
}

// Base accounts common to all industries
const baseAccounts: AccountTemplate[] = [
  // ASSETS - 1000-1999
  { code: '1000', name: 'Assets', type: 'asset', sub_type: 'current_asset', is_system: true },
  { code: '1100', name: 'Cash and Cash Equivalents', type: 'asset', sub_type: 'current_asset' },
  { code: '1110', name: 'Cash on Hand', type: 'asset', sub_type: 'current_asset' },
  { code: '1120', name: 'Bank Accounts', type: 'asset', sub_type: 'current_asset' },
  { code: '1200', name: 'Accounts Receivable', type: 'asset', sub_type: 'current_asset' },
  { code: '1210', name: 'Trade Receivables', type: 'asset', sub_type: 'current_asset', vat_applicable: true },
  { code: '1300', name: 'VAT Input', type: 'asset', sub_type: 'current_asset' },
  { code: '1310', name: 'Input VAT (Recoverable)', type: 'asset', sub_type: 'current_asset' },
  { code: '1400', name: 'Inventory', type: 'asset', sub_type: 'current_asset' },
  { code: '1500', name: 'Prepaid Expenses', type: 'asset', sub_type: 'current_asset' },
  { code: '1600', name: 'Fixed Assets', type: 'asset', sub_type: 'fixed_asset' },
  { code: '1610', name: 'Property, Plant & Equipment', type: 'asset', sub_type: 'fixed_asset' },
  { code: '1620', name: 'Furniture & Fixtures', type: 'asset', sub_type: 'fixed_asset' },
  { code: '1630', name: 'Vehicles', type: 'asset', sub_type: 'fixed_asset' },
  { code: '1640', name: 'Office Equipment', type: 'asset', sub_type: 'fixed_asset' },
  { code: '1700', name: 'Accumulated Depreciation', type: 'asset', sub_type: 'fixed_asset' },
  
  // LIABILITIES - 2000-2999
  { code: '2000', name: 'Liabilities', type: 'liability', sub_type: 'current_liability', is_system: true },
  { code: '2100', name: 'Accounts Payable', type: 'liability', sub_type: 'current_liability' },
  { code: '2110', name: 'Trade Payables', type: 'liability', sub_type: 'current_liability', vat_applicable: true },
  { code: '2200', name: 'VAT Payable', type: 'liability', sub_type: 'current_liability' },
  { code: '2210', name: 'Output VAT', type: 'liability', sub_type: 'current_liability' },
  { code: '2300', name: 'Accrued Expenses', type: 'liability', sub_type: 'current_liability' },
  { code: '2400', name: 'Employee Benefits Payable', type: 'liability', sub_type: 'current_liability' },
  { code: '2410', name: 'Salary Payable', type: 'liability', sub_type: 'current_liability' },
  { code: '2420', name: 'Gratuity Provision', type: 'liability', sub_type: 'current_liability' },
  { code: '2500', name: 'Deferred Revenue', type: 'liability', sub_type: 'current_liability' },
  { code: '2600', name: 'Long-term Liabilities', type: 'liability', sub_type: 'long_term_liability' },
  { code: '2610', name: 'Bank Loans', type: 'liability', sub_type: 'long_term_liability' },
  
  // EQUITY - 3000-3999
  { code: '3000', name: 'Equity', type: 'equity', sub_type: 'equity', is_system: true },
  { code: '3100', name: 'Owner\'s Capital', type: 'equity', sub_type: 'equity' },
  { code: '3200', name: 'Retained Earnings', type: 'equity', sub_type: 'equity' },
  { code: '3300', name: 'Current Year Earnings', type: 'equity', sub_type: 'equity' },
  
  // REVENUE - 4000-4999
  { code: '4000', name: 'Revenue', type: 'revenue', sub_type: 'income', is_system: true },
  { code: '4100', name: 'Sales Revenue', type: 'revenue', sub_type: 'income', vat_applicable: true, vat_rate: 500 },
  { code: '4200', name: 'Service Revenue', type: 'revenue', sub_type: 'income', vat_applicable: true, vat_rate: 500 },
  { code: '4300', name: 'Other Income', type: 'revenue', sub_type: 'other_income' },
  { code: '4400', name: 'Discounts Given', type: 'revenue', sub_type: 'income' },
  
  // COST OF SALES - 5000-5999
  { code: '5000', name: 'Cost of Sales', type: 'cogs', sub_type: 'cost_of_sales', is_system: true },
  { code: '5100', name: 'Cost of Goods Sold', type: 'cogs', sub_type: 'cost_of_sales' },
  
  // EXPENSES - 6000-6999
  { code: '6000', name: 'Operating Expenses', type: 'expense', sub_type: 'operating_expense', is_system: true },
  { code: '6100', name: 'Salaries and Wages', type: 'expense', sub_type: 'operating_expense' },
  { code: '6110', name: 'Basic Salaries', type: 'expense', sub_type: 'operating_expense' },
  { code: '6120', name: 'Allowances', type: 'expense', sub_type: 'operating_expense' },
  { code: '6130', name: 'Overtime', type: 'expense', sub_type: 'operating_expense' },
  { code: '6200', name: 'Rent Expense', type: 'expense', sub_type: 'operating_expense', vat_applicable: true },
  { code: '6300', name: 'Utilities', type: 'expense', sub_type: 'operating_expense', vat_applicable: true },
  { code: '6310', name: 'Electricity & Water', type: 'expense', sub_type: 'operating_expense', vat_applicable: true },
  { code: '6320', name: 'Telephone & Internet', type: 'expense', sub_type: 'operating_expense', vat_applicable: true },
  { code: '6400', name: 'Marketing and Advertising', type: 'expense', sub_type: 'operating_expense', vat_applicable: true },
  { code: '6500', name: 'Travel and Entertainment', type: 'expense', sub_type: 'operating_expense' },
  { code: '6600', name: 'Office Supplies', type: 'expense', sub_type: 'operating_expense', vat_applicable: true },
  { code: '6700', name: 'Insurance', type: 'expense', sub_type: 'operating_expense' },
  { code: '6800', name: 'Professional Fees', type: 'expense', sub_type: 'operating_expense' },
  { code: '6810', name: 'Legal Fees', type: 'expense', sub_type: 'operating_expense' },
  { code: '6820', name: 'Accounting Fees', type: 'expense', sub_type: 'operating_expense' },
  { code: '6900', name: 'Bank Charges', type: 'expense', sub_type: 'operating_expense' },
  { code: '6910', name: 'Depreciation Expense', type: 'expense', sub_type: 'operating_expense' },
  { code: '6920', name: 'General Expenses', type: 'expense', sub_type: 'operating_expense' },
]

// Healthcare specific accounts
const healthcareAccounts: AccountTemplate[] = [
  { code: '1220', name: 'Insurance Receivables', type: 'asset', sub_type: 'current_asset' },
  { code: '1230', name: 'Patient Receivables', type: 'asset', sub_type: 'current_asset' },
  { code: '4150', name: 'Patient Revenue', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '4160', name: 'Insurance Revenue', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '5150', name: 'Medical Supplies', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '5160', name: 'Lab Costs', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '6930', name: 'DHA/MOH License Fees', type: 'expense', sub_type: 'operating_expense' },
  { code: '6940', name: 'Medical Equipment Maintenance', type: 'expense', sub_type: 'operating_expense' },
]

// Retail specific accounts
const retailAccounts: AccountTemplate[] = [
  { code: '1130', name: 'Petty Cash', type: 'asset', sub_type: 'current_asset' },
  { code: '1250', name: 'POS Clearing Account', type: 'asset', sub_type: 'current_asset' },
  { code: '1410', name: 'Inventory - Goods for Resale', type: 'asset', sub_type: 'current_asset' },
  { code: '4110', name: 'Sales - In-Store', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '4120', name: 'Sales - Online', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '5050', name: 'Purchase Returns', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '5060', name: 'Freight Inward', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '6950', name: 'Packaging Materials', type: 'expense', sub_type: 'operating_expense' },
]

// Construction specific accounts
const constructionAccounts: AccountTemplate[] = [
  { code: '1350', name: 'Retention Receivable', type: 'asset', sub_type: 'current_asset' },
  { code: '1500', name: 'Work in Progress', type: 'asset', sub_type: 'current_asset' },
  { code: '1550', name: 'Contract Assets', type: 'asset', sub_type: 'current_asset' },
  { code: '2350', name: 'Retention Payable', type: 'liability', sub_type: 'current_liability' },
  { code: '2360', name: 'Contract Liabilities', type: 'liability', sub_type: 'current_liability' },
  { code: '4350', name: 'Project Revenue', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '5300', name: 'Sub-contractor Costs', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '5400', name: 'Equipment Costs', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '6960', name: 'Site Expenses', type: 'expense', sub_type: 'operating_expense' },
]

// Real Estate specific accounts
const realEstateAccounts: AccountTemplate[] = [
  { code: '1650', name: 'Investment Properties', type: 'asset', sub_type: 'fixed_asset' },
  { code: '1660', name: 'Properties Under Development', type: 'asset', sub_type: 'fixed_asset' },
  { code: '2400', name: 'Security Deposits Held', type: 'liability', sub_type: 'current_liability' },
  { code: '2450', name: 'Maintenance Reserve', type: 'liability', sub_type: 'current_liability' },
  { code: '4450', name: 'Rental Income', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '4460', name: 'Property Management Fees', type: 'revenue', sub_type: 'income' },
  { code: '6150', name: 'Commission Expense', type: 'expense', sub_type: 'operating_expense' },
  { code: '6970', name: 'Property Maintenance', type: 'expense', sub_type: 'operating_expense' },
]

// Professional Services specific accounts
const professionalServicesAccounts: AccountTemplate[] = [
  { code: '1240', name: 'Unbilled Revenue', type: 'asset', sub_type: 'current_asset' },
  { code: '4250', name: 'Consulting Revenue', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '4260', name: 'Advisory Fees', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '6980', name: 'Professional Development', type: 'expense', sub_type: 'operating_expense' },
  { code: '6990', name: 'Subscriptions & Memberships', type: 'expense', sub_type: 'operating_expense' },
]

// Hospitality specific accounts
const hospitalityAccounts: AccountTemplate[] = [
  { code: '1260', name: 'Guest Ledger', type: 'asset', sub_type: 'current_asset' },
  { code: '1420', name: 'Food & Beverage Inventory', type: 'asset', sub_type: 'current_asset' },
  { code: '4170', name: 'Room Revenue', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '4180', name: 'F&B Revenue', type: 'revenue', sub_type: 'income', vat_applicable: true },
  { code: '4190', name: 'Other Hotel Revenue', type: 'revenue', sub_type: 'income' },
  { code: '5170', name: 'Food Cost', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '5180', name: 'Beverage Cost', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '6100', name: 'Tourism Dirham Fee', type: 'expense', sub_type: 'operating_expense' },
]

// Manufacturing specific accounts
const manufacturingAccounts: AccountTemplate[] = [
  { code: '1430', name: 'Raw Materials', type: 'asset', sub_type: 'current_asset' },
  { code: '1440', name: 'Work in Progress', type: 'asset', sub_type: 'current_asset' },
  { code: '1450', name: 'Finished Goods', type: 'asset', sub_type: 'current_asset' },
  { code: '5200', name: 'Direct Labor', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '5210', name: 'Direct Materials', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '5220', name: 'Manufacturing Overhead', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '6915', name: 'Factory Expenses', type: 'expense', sub_type: 'operating_expense' },
]

// Trading specific accounts
const tradingAccounts: AccountTemplate[] = [
  { code: '1270', name: 'Margin Account', type: 'asset', sub_type: 'current_asset' },
  { code: '1280', name: 'Securities Held', type: 'asset', sub_type: 'current_asset' },
  { code: '4470', name: 'Trading Gains', type: 'revenue', sub_type: 'income' },
  { code: '4480', name: 'Dividend Income', type: 'revenue', sub_type: 'other_income' },
  { code: '4490', name: 'Interest Income', type: 'revenue', sub_type: 'other_income' },
  { code: '5500', name: 'Trading Losses', type: 'cogs', sub_type: 'cost_of_sales' },
  { code: '6925', name: 'Brokerage Fees', type: 'expense', sub_type: 'operating_expense' },
]

export function getIndustryCOA(industry: IndustryType): AccountTemplate[] {
  const industrySpecific: Record<IndustryType, AccountTemplate[]> = {
    general: [],
    healthcare: healthcareAccounts,
    retail: retailAccounts,
    trading: tradingAccounts,
    construction: constructionAccounts,
    real_estate: realEstateAccounts,
    hospitality: hospitalityAccounts,
    professional_services: professionalServicesAccounts,
    manufacturing: manufacturingAccounts,
  }
  
  return [...baseAccounts, ...(industrySpecific[industry] || [])]
}

export function generateCOAForCompany(companyId: string, industry: IndustryType): Omit<InsertAccount, 'company_id'>[] {
  const templates = getIndustryCOA(industry)
  
  return templates.map(template => ({
    code: template.code,
    name: template.name,
    name_ar: template.nameAr || null,
    type: template.type,
    sub_type: template.sub_type || null,
    vat_applicable: template.vat_applicable || false,
    vat_rate: template.vat_rate || null,
    is_system: template.is_system || false,
    is_active: true,
    opening_balance: 0,
    current_balance: 0,
  }))
}
