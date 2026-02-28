import { NextResponse } from 'next/server'

// Demo data constants
const DEMO_COMPANY_ID = 'demo-company-001'

// Demo company
const DEMO_COMPANY = {
  id: DEMO_COMPANY_ID,
  name: 'UAE Books Demo Company',
  name_ar: 'شركة يو أي إي بوكس التجريبية',
  logo_url: null,
  trade_license_no: 'CN-123456',
  trn: '10001.23456.789.123',
  industry: 'Technology',
  fiscal_year_start: 1,
  emirate: 'Dubai',
  currency: 'AED',
  address: 'Business Bay, Dubai',
  address_ar: 'الخليج التجاري، دبي',
  city: 'Dubai',
  phone: '+971 4 123 4567',
  email: 'info@uaebooks.ae',
  website: 'https://uaebooks.ae',
  vat_registered: true,
  default_vat_rate: 5,
  is_active: true,
}

// Demo chart of accounts
const DEMO_ACCOUNTS = [
  // Assets
  { id: 'acc-001', code: '1000', name: 'Cash and Bank', type: 'asset', sub_type: 'current_asset', current_balance: 0 },
  { id: 'acc-002', code: '1010', name: 'Emirates NBD - Main', type: 'asset', sub_type: 'current_asset', current_balance: 25000000 },
  { id: 'acc-003', code: '1020', name: 'Emirates NBD - VAT', type: 'asset', sub_type: 'current_asset', current_balance: 0 },
  { id: 'acc-004', code: '1100', name: 'Accounts Receivable', type: 'asset', sub_type: 'current_asset', current_balance: 0 },
  { id: 'acc-005', code: '1200', name: 'Inventory', type: 'asset', sub_type: 'current_asset', current_balance: 0 },
  { id: 'acc-006', code: '1500', name: 'Property & Equipment', type: 'asset', sub_type: 'fixed_asset', current_balance: 50000000 },
  
  // Liabilities
  { id: 'acc-007', code: '2000', name: 'Accounts Payable', type: 'liability', sub_type: 'current_liability', current_balance: 0 },
  { id: 'acc-008', code: '2100', name: 'VAT Payable', type: 'liability', sub_type: 'current_liability', current_balance: 0 },
  { id: 'acc-009', code: '2200', name: 'Payroll Payable', type: 'liability', sub_type: 'current_liability', current_balance: 0 },
  { id: 'acc-010', code: '2300', name: 'Employee Deductions', type: 'liability', sub_type: 'current_liability', current_balance: 0 },
  
  // Equity
  { id: 'acc-011', code: '3000', name: 'Owner Capital', type: 'equity', sub_type: 'equity', current_balance: 50000000 },
  { id: 'acc-012', code: '3100', name: 'Retained Earnings', type: 'equity', sub_type: 'equity', current_balance: 0 },
  
  // Revenue
  { id: 'acc-013', code: '4000', name: 'Sales Revenue', type: 'revenue', sub_type: 'income', current_balance: 0 },
  { id: 'acc-014', code: '4100', name: 'Service Revenue', type: 'revenue', sub_type: 'income', current_balance: 0 },
  { id: 'acc-015', code: '4200', name: 'Other Income', type: 'revenue', sub_type: 'other_income', current_balance: 0 },
  
  // Cost of Sales
  { id: 'acc-016', code: '5000', name: 'Cost of Goods Sold', type: 'cogs', sub_type: 'cost_of_sales', current_balance: 0 },
  
  // Expenses
  { id: 'acc-017', code: '6000', name: 'Salaries & Wages', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-018', code: '6100', name: 'Office Rent', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-019', code: '6200', name: 'Utilities', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-020', code: '6300', name: 'Marketing & Advertising', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-021', code: '6400', name: 'Travel & Entertainment', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-022', code: '6500', name: 'Professional Fees', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-023', code: '6600', name: 'Insurance', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-024', code: '6700', name: 'Depreciation', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-025', code: '6800', name: 'Office Supplies', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
  { id: 'acc-026', code: '6900', name: 'Bank Charges', type: 'expense', sub_type: 'operating_expense', current_balance: 0 },
]

// Demo contacts
const DEMO_CONTACTS = [
  { id: 'cont-001', type: 'customer', name: 'Dubai Properties LLC', name_ar: 'دبي العقارية', trn: '10002.34567.890.123', email: 'ap@dubaiproperties.ae', phone: '+971 4 567 8900', city: 'Dubai', emirate: 'Dubai', country: 'UAE', payment_terms_days: 30 },
  { id: 'cont-002', type: 'customer', name: 'Abu Dhabi National Oil Co.', name_ar: 'أدنوك', trn: '10003.45678.901.234', email: 'procurement@adnoc.ae', phone: '+971 2 602 0000', city: 'Abu Dhabi', emirate: 'Abu Dhabi', country: 'UAE', payment_terms_days: 45 },
  { id: 'cont-003', type: 'customer', name: 'Emirates Airlines', name_ar: 'طيران الإمارات', trn: '10004.56789.012.345', email: 'suppliers@emirates.com', phone: '+971 4 708 1111', city: 'Dubai', emirate: 'Dubai', country: 'UAE', payment_terms_days: 60 },
  { id: 'cont-004', type: 'supplier', name: 'Microsoft Gulf', name_ar: 'مايكروسوفت الخليج', trn: '10005.67890.123.456', email: 'billing@microsoft.com', phone: '+971 4 391 7000', city: 'Dubai', emirate: 'Dubai', country: 'UAE', payment_terms_days: 30 },
  { id: 'cont-005', type: 'supplier', name: 'Amazon AWS ME', name_ar: 'أمازون', trn: '10006.78901.234.567', email: 'invoices@amazon.com', phone: '+971 4 563 4000', city: 'Dubai', emirate: 'Dubai', country: 'UAE', payment_terms_days: 15 },
  { id: 'cont-006', type: 'supplier', name: 'Etisalat', name_ar: 'اتصالات', trn: '10007.89012.345.678', email: 'business@etisalat.ae', phone: '+971 800 2300', city: 'Abu Dhabi', emirate: 'Abu Dhabi', country: 'UAE', payment_terms_days: 30 },
  { id: 'cont-007', type: 'both', name: 'Sharjah Islamic Bank', name_ar: 'بنك الشارقة الإسلامي', trn: '10008.90123.456.789', email: 'corporate@sib.ae', phone: '+971 6 511 1111', city: 'Sharjah', emirate: 'Sharjah', country: 'UAE', payment_terms_days: 30 },
]

// Demo products
const DEMO_PRODUCTS = [
  { id: 'prod-001', sku: 'SVC-001', name: 'Software License - Enterprise', type: 'service', category: 'Software', cost_price: 0, selling_price: 500000, vat_rate: 5, unit: 'License', track_inventory: false, stock_on_hand: 0, reorder_level: 0 },
  { id: 'prod-002', sku: 'SVC-002', name: 'Annual Support Package', type: 'service', category: 'Support', cost_price: 0, selling_price: 150000, vat_rate: 5, unit: 'Package', track_inventory: false, stock_on_hand: 0, reorder_level: 0 },
  { id: 'prod-003', sku: 'SVC-003', name: 'Implementation Services', type: 'service', category: 'Consulting', cost_price: 250000, selling_price: 400000, vat_rate: 5, unit: 'Project', track_inventory: false, stock_on_hand: 0, reorder_level: 0 },
  { id: 'prod-004', sku: 'HW-001', name: 'Server - Dell PowerEdge R750', type: 'product', category: 'Hardware', cost_price: 3500000, selling_price: 5000000, vat_rate: 5, unit: 'Unit', track_inventory: true, stock_on_hand: 5, reorder_level: 2 },
  { id: 'prod-005', sku: 'HW-002', name: 'Network Switch - Cisco Catalyst', type: 'product', category: 'Hardware', cost_price: 800000, selling_price: 1200000, vat_rate: 5, unit: 'Unit', track_inventory: true, stock_on_hand: 10, reorder_level: 3 },
  { id: 'prod-006', sku: 'ACC-001', name: 'Keyboard & Mouse Combo', type: 'product', category: 'Accessories', cost_price: 15000, selling_price: 25000, vat_rate: 5, unit: 'Set', track_inventory: true, stock_on_hand: 50, reorder_level: 10 },
  { id: 'prod-007', sku: 'ACC-002', name: 'Monitor 27" Dell UltraSharp', type: 'product', category: 'Hardware', cost_price: 350000, selling_price: 500000, vat_rate: 5, unit: 'Unit', track_inventory: true, stock_on_hand: 15, reorder_level: 5 },
  { id: 'prod-008', sku: 'SVC-004', name: 'Training Session (Per Day)', type: 'service', category: 'Training', cost_price: 0, selling_price: 75000, vat_rate: 5, unit: 'Day', track_inventory: false, stock_on_hand: 0, reorder_level: 0 },
]

// Demo bank accounts
const DEMO_BANK_ACCOUNTS = [
  { id: 'bank-001', bank_name: 'Emirates NBD', account_name: 'UAE Books Demo - Main', account_number: '1012345678', iban: 'AE07026000101234567890', currency: 'AED', current_balance: 25000000, opening_balance: 20000000, is_active: true },
  { id: 'bank-002', bank_name: 'Emirates NBD', account_name: 'UAE Books Demo - VAT', account_number: '1012345679', iban: 'AE07026000101234567891', currency: 'AED', current_balance: 0, opening_balance: 0, is_active: true },
]

// Demo employees
const DEMO_EMPLOYEES = [
  { id: 'emp-001', employee_code: 'EMP001', full_name: 'Ahmed Mohammed Al-Rashid', full_name_ar: 'أحمد محمد الراشد', nationality: 'UAE', emirates_id: '784-1990-1234567-8', passport_no: 'A12345678', labour_card_no: 'LC-12345', mohre_id: 'MOHRE-001', skill_level: 1, joining_date: '2020-01-15', department: 'Management', designation: 'Chief Executive Officer', basic_salary: 5000000, housing_allowance: 2000000, transport_allowance: 500000, other_allowances: 0, bank_name: 'Emirates NBD', iban: 'AE07026000101234567892', bank_routing_code: 'NBDAAEAD', status: 'active' },
  { id: 'emp-002', employee_code: 'EMP002', full_name: 'Sarah Johnson', full_name_ar: 'سارة جونسون', nationality: 'UK', emirates_id: '784-2018-2345678-9', passport_no: 'B23456789', labour_card_no: 'LC-23456', mohre_id: 'MOHRE-002', skill_level: 2, joining_date: '2021-03-01', department: 'Finance', designation: 'Finance Manager', basic_salary: 3000000, housing_allowance: 1500000, transport_allowance: 400000, other_allowances: 200000, bank_name: 'Emirates NBD', iban: 'AE07026000101234567893', bank_routing_code: 'NBDAAEAD', status: 'active' },
  { id: 'emp-003', employee_code: 'EMP003', full_name: 'Mohammed Ali Hassan', full_name_ar: 'محمد علي حسن', nationality: 'Egypt', emirates_id: '784-2019-3456789-0', passport_no: 'C34567890', labour_card_no: 'LC-34567', mohre_id: 'MOHRE-003', skill_level: 2, joining_date: '2021-06-15', department: 'Technology', designation: 'Senior Developer', basic_salary: 2000000, housing_allowance: 1000000, transport_allowance: 300000, other_allowances: 0, bank_name: 'Emirates NBD', iban: 'AE07026000101234567894', bank_routing_code: 'NBDAAEAD', status: 'active' },
  { id: 'emp-004', employee_code: 'EMP004', full_name: 'Fatima Abdullah', full_name_ar: 'فاطمة عبدالله', nationality: 'UAE', emirates_id: '784-2020-4567890-1', passport_no: 'D45678901', labour_card_no: 'LC-45678', mohre_id: 'MOHRE-004', skill_level: 2, joining_date: '2022-01-10', department: 'Sales', designation: 'Sales Manager', basic_salary: 1800000, housing_allowance: 800000, transport_allowance: 300000, other_allowances: 500000, bank_name: 'Emirates NBD', iban: 'AE07026000101234567895', bank_routing_code: 'NBDAAEAD', status: 'active' },
  { id: 'emp-005', employee_code: 'EMP005', full_name: 'Rajesh Kumar', full_name_ar: 'راجيش كومار', nationality: 'India', emirates_id: '784-2021-5678901-2', passport_no: 'E56789012', labour_card_no: 'LC-56789', mohre_id: 'MOHRE-005', skill_level: 3, joining_date: '2022-04-01', department: 'Technology', designation: 'Software Developer', basic_salary: 1200000, housing_allowance: 500000, transport_allowance: 200000, other_allowances: 0, bank_name: 'Emirates NBD', iban: 'AE07026000101234567896', bank_routing_code: 'NBDAAEAD', status: 'active' },
]

// Demo invoices
const DEMO_INVOICES = [
  { id: 'inv-001', invoice_number: 'INV-2024-001', contact_id: 'cont-001', status: 'paid', invoice_date: '2024-01-15', due_date: '2024-02-14', subtotal: 5000000, discount_total: 0, vat_total: 250000, total: 5250000, amount_paid: 5250000 },
  { id: 'inv-002', invoice_number: 'INV-2024-002', contact_id: 'cont-002', status: 'sent', invoice_date: '2024-01-20', due_date: '2024-03-06', subtotal: 8000000, discount_total: 0, vat_total: 400000, total: 8400000, amount_paid: 0 },
  { id: 'inv-003', invoice_number: 'INV-2024-003', contact_id: 'cont-003', status: 'overdue', invoice_date: '2024-01-25', due_date: '2024-02-24', subtotal: 3500000, discount_total: 0, vat_total: 175000, total: 3675000, amount_paid: 0 },
  { id: 'inv-004', invoice_number: 'INV-2024-004', contact_id: 'cont-001', status: 'partial', invoice_date: '2024-02-01', due_date: '2024-03-02', subtotal: 10000000, discount_total: 500000, vat_total: 475000, total: 9975000, amount_paid: 5000000 },
]

// Demo bills
const DEMO_BILLS = [
  { id: 'bill-001', bill_number: 'BILL-2024-001', contact_id: 'cont-004', status: 'paid', bill_date: '2024-01-10', due_date: '2024-02-09', subtotal: 2000000, discount_total: 0, vat_total: 100000, total: 2100000, amount_paid: 2100000 },
  { id: 'bill-002', bill_number: 'BILL-2024-002', contact_id: 'cont-005', status: 'approved', bill_date: '2024-01-15', due_date: '2024-01-30', subtotal: 1500000, discount_total: 0, vat_total: 75000, total: 1575000, amount_paid: 0 },
  { id: 'bill-003', bill_number: 'BILL-2024-003', contact_id: 'cont-006', status: 'overdue', bill_date: '2024-01-05', due_date: '2024-02-04', subtotal: 500000, discount_total: 0, vat_total: 25000, total: 525000, amount_paid: 0 },
]

// Demo journal entries
const DEMO_JOURNAL_ENTRIES = [
  {
    id: 'je-001',
    entry_number: 'JE-2024-001',
    entry_date: '2024-01-15',
    description: 'Software license sale to Dubai Properties',
    reference: 'INV-2024-001',
    source: 'invoice',
    source_id: 'inv-001',
    status: 'posted',
    total_debit: 5250000,
    total_credit: 5250000,
    lines: [
      { account_id: 'acc-004', debit: 5250000, credit: 0 },
      { account_id: 'acc-013', debit: 0, credit: 5000000 },
      { account_id: 'acc-008', debit: 0, credit: 250000 },
    ],
  },
  {
    id: 'je-002',
    entry_number: 'JE-2024-002',
    entry_date: '2024-01-20',
    description: 'Enterprise software and services sale to ADNOC',
    reference: 'INV-2024-002',
    source: 'invoice',
    source_id: 'inv-002',
    status: 'posted',
    total_debit: 8400000,
    total_credit: 8400000,
    lines: [
      { account_id: 'acc-004', debit: 8400000, credit: 0 },
      { account_id: 'acc-013', debit: 0, credit: 8000000 },
      { account_id: 'acc-008', debit: 0, credit: 400000 },
    ],
  },
  {
    id: 'je-003',
    entry_number: 'JE-2024-003',
    entry_date: '2024-01-10',
    description: 'Microsoft annual license fee',
    reference: 'BILL-2024-001',
    source: 'bill',
    source_id: 'bill-001',
    status: 'posted',
    total_debit: 2100000,
    total_credit: 2100000,
    lines: [
      { account_id: 'acc-022', debit: 2000000, credit: 0 },
      { account_id: 'acc-008', debit: 100000, credit: 0 },
      { account_id: 'acc-007', debit: 0, credit: 2100000 },
    ],
  },
  {
    id: 'je-004',
    entry_number: 'JE-2024-004',
    entry_date: '2024-01-31',
    description: 'January 2024 Payroll',
    reference: 'PAYROLL-2024-01',
    source: 'payroll',
    source_id: 'pr-001',
    status: 'posted',
    total_debit: 12800000,
    total_credit: 12800000,
    lines: [
      { account_id: 'acc-017', debit: 12800000, credit: 0 },
      { account_id: 'acc-009', debit: 0, credit: 12800000 },
    ],
  },
  {
    id: 'je-005',
    entry_number: 'JE-2024-005',
    entry_date: '2024-01-25',
    description: 'Training services sale to Emirates Airlines',
    reference: 'INV-2024-003',
    source: 'invoice',
    source_id: 'inv-003',
    status: 'posted',
    total_debit: 3675000,
    total_credit: 3675000,
    lines: [
      { account_id: 'acc-004', debit: 3675000, credit: 0 },
      { account_id: 'acc-014', debit: 0, credit: 3500000 },
      { account_id: 'acc-008', debit: 0, credit: 175000 },
    ],
  },
  {
    id: 'je-006',
    entry_number: 'JE-2024-006',
    entry_date: '2024-01-15',
    description: 'AWS cloud services',
    reference: 'BILL-2024-002',
    source: 'bill',
    source_id: 'bill-002',
    status: 'posted',
    total_debit: 1575000,
    total_credit: 1575000,
    lines: [
      { account_id: 'acc-019', debit: 1500000, credit: 0 },
      { account_id: 'acc-008', debit: 75000, credit: 0 },
      { account_id: 'acc-007', debit: 0, credit: 1575000 },
    ],
  },
]

// Demo payroll run
const DEMO_PAYROLL_RUN = {
  id: 'pr-001',
  run_month: 1,
  run_year: 2024,
  status: 'processed',
  total_amount: 12800000,
  total_employees: 5,
  processed_at: '2024-01-31T10:00:00Z',
  items: [
    { employee_id: 'emp-001', basic_salary: 5000000, housing_allowance: 2000000, transport_allowance: 500000, other_allowances: 0, overtime_hours: 0, overtime_amount: 0, leave_salary: 0, deductions: 0, net_salary: 7500000, days_paid: 31 },
    { employee_id: 'emp-002', basic_salary: 3000000, housing_allowance: 1500000, transport_allowance: 400000, other_allowances: 200000, overtime_hours: 0, overtime_amount: 0, leave_salary: 0, deductions: 0, net_salary: 5100000, days_paid: 31 },
    { employee_id: 'emp-003', basic_salary: 2000000, housing_allowance: 1000000, transport_allowance: 300000, other_allowances: 0, overtime_hours: 10, overtime_amount: 150000, leave_salary: 0, deductions: 0, net_salary: 3450000, days_paid: 31 },
    { employee_id: 'emp-004', basic_salary: 1800000, housing_allowance: 800000, transport_allowance: 300000, other_allowances: 500000, overtime_hours: 0, overtime_amount: 0, leave_salary: 0, deductions: 0, net_salary: 3400000, days_paid: 31 },
    { employee_id: 'emp-005', basic_salary: 1200000, housing_allowance: 500000, transport_allowance: 200000, other_allowances: 0, overtime_hours: 5, overtime_amount: 50000, leave_salary: 0, deductions: 0, net_salary: 1950000, days_paid: 31 },
  ],
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Demo data seeded successfully',
    data: {
      company: DEMO_COMPANY,
      accounts: DEMO_ACCOUNTS.length,
      contacts: DEMO_CONTACTS.length,
      products: DEMO_PRODUCTS.length,
      bankAccounts: DEMO_BANK_ACCOUNTS.length,
      employees: DEMO_EMPLOYEES.length,
      invoices: DEMO_INVOICES.length,
      bills: DEMO_BILLS.length,
      journalEntries: DEMO_JOURNAL_ENTRIES.length,
      payrollRuns: 1,
    },
    // Include full data for client-side demo mode
    company: DEMO_COMPANY,
    accounts: DEMO_ACCOUNTS.map(acc => ({
      ...acc,
      company_id: DEMO_COMPANY_ID,
      name_ar: null,
      parent_id: null,
      description: null,
      vat_applicable: acc.type === 'revenue',
      vat_rate: acc.type === 'revenue' ? 5 : null,
      opening_balance: 0,
      is_active: true,
      is_system: false,
    })),
    contacts: DEMO_CONTACTS.map(c => ({
      ...c,
      company_id: DEMO_COMPANY_ID,
      address: 'Business District',
      address_ar: null,
      mobile: c.phone,
      credit_limit: null,
      currency: 'AED',
      notes: null,
      is_active: true,
      current_balance: 0,
    })),
    products: DEMO_PRODUCTS.map(p => ({
      ...p,
      company_id: DEMO_COMPANY_ID,
      name_ar: null,
      description: null,
      barcode: null,
      is_active: true,
    })),
    bankAccounts: DEMO_BANK_ACCOUNTS.map(b => ({
      ...b,
      company_id: DEMO_COMPANY_ID,
    })),
    employees: DEMO_EMPLOYEES.map(e => ({
      ...e,
      company_id: DEMO_COMPANY_ID,
      passport_expiry: '2027-12-31',
      termination_date: null,
      annual_leave_balance: 30,
      sick_leave_balance: 10,
    })),
    invoices: DEMO_INVOICES.map(inv => ({
      ...inv,
      company_id: DEMO_COMPANY_ID,
      currency: 'AED',
      reference: null,
      notes: null,
      terms: 'Payment due within 30 days',
      qr_code: null,
      sent_at: inv.status !== 'draft' ? new Date().toISOString() : null,
      viewed_at: null,
    })),
    bills: DEMO_BILLS.map(bill => ({
      ...bill,
      company_id: DEMO_COMPANY_ID,
      currency: 'AED',
      supplier_reference: null,
      notes: null,
    })),
    journalEntries: DEMO_JOURNAL_ENTRIES.map(je => ({
      ...je,
      company_id: DEMO_COMPANY_ID,
      posted_at: je.status === 'posted' ? new Date().toISOString() : null,
      lines: je.lines.map(line => ({
        ...line,
        company_id: DEMO_COMPANY_ID,
        journal_entry_id: je.id,
        description: null,
        contact_id: null,
      })),
    })),
    payrollRun: {
      ...DEMO_PAYROLL_RUN,
      company_id: DEMO_COMPANY_ID,
      items: DEMO_PAYROLL_RUN.items.map(item => ({
        ...item,
        company_id: DEMO_COMPANY_ID,
        payroll_run_id: DEMO_PAYROLL_RUN.id,
      })),
    },
  })
}
