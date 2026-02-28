// Seed script for UAE Books - Creates test user and demo company
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test user
  const passwordHash = await hashPassword('demo123')
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@uaebooks.ae' },
    update: {},
    create: {
      email: 'demo@uaebooks.ae',
      passwordHash,
      name: 'Demo User',
      role: 'owner',
    },
  })

  console.log('✅ Created user:', user.email)

  // Create demo company
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-1' },
    update: {},
    create: {
      id: 'demo-company-1',
      name: 'Demo Trading LLC',
      nameAr: 'ديمو تريدينج ذ.م.م',
      address: 'Business Bay, Dubai',
      city: 'Dubai',
      emirate: 'Dubai',
      trn: '100012345678901',
      tradeLicense: 'DMC-123456',
      industry: 'trading',
      vatRegistered: true,
      defaultVatRate: 500,
      phone: '+971 4 123 4567',
      email: 'info@demotrading.ae',
      website: 'www.demotrading.ae',
    },
  })

  console.log('✅ Created company:', company.name)

  // Link user to company
  await prisma.userCompany.upsert({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId: company.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      companyId: company.id,
      role: 'owner',
    },
  })

  console.log('✅ Linked user to company')

  // Create settings
  await prisma.settings.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      invoicePrefix: 'INV-',
      invoiceNextNumber: 1,
      billPrefix: 'BILL-',
      billNextNumber: 1,
      paymentPrefix: 'PAY-',
      paymentNextNumber: 1,
      expensePrefix: 'EXP-',
      expenseNextNumber: 1,
      defaultPaymentTerms: 30,
      defaultVatRate: 500,
    },
  })

  console.log('✅ Created settings')

  // Create Chart of Accounts
  const accounts = [
    // Assets
    { code: '1000', name: 'Assets', type: 'asset', subType: null },
    { code: '1100', name: 'Current Assets', type: 'asset', subType: 'current_asset' },
    { code: '1110', name: 'Cash on Hand', type: 'asset', subType: 'current_asset' },
    { code: '1120', name: 'Bank Accounts', type: 'asset', subType: 'current_asset' },
    { code: '1130', name: 'Accounts Receivable', type: 'asset', subType: 'current_asset' },
    { code: '1140', name: 'Inventory', type: 'asset', subType: 'current_asset' },
    { code: '1200', name: 'Fixed Assets', type: 'asset', subType: 'fixed_asset' },
    { code: '1210', name: 'Office Equipment', type: 'asset', subType: 'fixed_asset' },
    { code: '1220', name: 'Vehicles', type: 'asset', subType: 'fixed_asset' },
    
    // Liabilities
    { code: '2000', name: 'Liabilities', type: 'liability', subType: null },
    { code: '2100', name: 'Current Liabilities', type: 'liability', subType: 'current_liability' },
    { code: '2110', name: 'Accounts Payable', type: 'liability', subType: 'current_liability' },
    { code: '2120', name: 'Accrued Expenses', type: 'liability', subType: 'current_liability' },
    { code: '2200', name: 'VAT Payable', type: 'liability', subType: 'current_liability' },
    { code: '2210', name: 'VAT Output', type: 'liability', subType: 'current_liability' },
    { code: '2220', name: 'VAT Input', type: 'asset', subType: 'current_asset' },
    { code: '2300', name: 'Long-term Liabilities', type: 'liability', subType: 'long_term_liability' },
    { code: '2310', name: 'Bank Loans', type: 'liability', subType: 'long_term_liability' },
    
    // Equity
    { code: '3000', name: 'Equity', type: 'equity', subType: 'equity' },
    { code: '3100', name: 'Owner Capital', type: 'equity', subType: 'equity' },
    { code: '3200', name: 'Retained Earnings', type: 'equity', subType: 'equity' },
    
    // Revenue
    { code: '4000', name: 'Revenue', type: 'revenue', subType: 'income' },
    { code: '4100', name: 'Sales Revenue', type: 'revenue', subType: 'income' },
    { code: '4200', name: 'Service Revenue', type: 'revenue', subType: 'income' },
    { code: '4300', name: 'Other Income', type: 'revenue', subType: 'other_income' },
    
    // Cost of Goods Sold
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'cost_of_sales' },
    { code: '5100', name: 'Cost of Sales', type: 'expense', subType: 'cost_of_sales' },
    
    // Expenses
    { code: '6000', name: 'Operating Expenses', type: 'expense', subType: 'operating_expense' },
    { code: '6100', name: 'Salaries & Wages', type: 'expense', subType: 'operating_expense' },
    { code: '6110', name: 'Basic Salary', type: 'expense', subType: 'operating_expense' },
    { code: '6120', name: 'Housing Allowance', type: 'expense', subType: 'operating_expense' },
    { code: '6200', name: 'Rent Expense', type: 'expense', subType: 'operating_expense' },
    { code: '6300', name: 'Utilities', type: 'expense', subType: 'operating_expense' },
    { code: '6400', name: 'Office Supplies', type: 'expense', subType: 'operating_expense' },
    { code: '6500', name: 'Travel & Entertainment', type: 'expense', subType: 'operating_expense' },
    { code: '6600', name: 'Professional Fees', type: 'expense', subType: 'operating_expense' },
    { code: '6700', name: 'Bank Charges', type: 'expense', subType: 'operating_expense' },
    { code: '6800', name: 'Depreciation', type: 'expense', subType: 'operating_expense' },
  ]

  for (const account of accounts) {
    await prisma.account.upsert({
      where: {
        companyId_code: {
          companyId: company.id,
          code: account.code,
        },
      },
      update: {},
      create: {
        companyId: company.id,
        code: account.code,
        name: account.name,
        type: account.type as any,
        subType: account.subType as any,
        isActive: true,
        isSystem: ['1000', '2000', '3000', '4000', '5000', '6000'].includes(account.code),
      },
    })
  }

  console.log('✅ Created Chart of Accounts (' + accounts.length + ' accounts)')

  // Create sample customers
  const customers = [
    { name: 'Al Futtaim Group', email: 'accounts@alfuttaim.ae', type: 'customer' },
    { name: 'Emirates Airlines', email: 'finance@emirates.com', type: 'customer' },
    { name: 'Dubai Electricity & Water Authority', email: 'accounts@dewa.gov.ae', type: 'customer' },
  ]

  for (const customer of customers) {
    await prisma.contact.create({
      data: {
        companyId: company.id,
        name: customer.name,
        email: customer.email,
        type: customer.type as any,
        city: 'Dubai',
        country: 'UAE',
        paymentTerms: 30,
      },
    })
  }

  console.log('✅ Created sample customers')

  // Create sample suppliers
  const suppliers = [
    { name: 'Etisalat', email: 'billing@etisalat.ae', type: 'supplier' },
    { name: 'DEWA', email: 'billing@dewa.gov.ae', type: 'supplier' },
  ]

  for (const supplier of suppliers) {
    await prisma.contact.create({
      data: {
        companyId: company.id,
        name: supplier.name,
        email: supplier.email,
        type: supplier.type as any,
        city: 'Dubai',
        country: 'UAE',
        paymentTerms: 30,
      },
    })
  }

  console.log('✅ Created sample suppliers')

  // Create sample products
  const products = [
    { sku: 'PROD-001', name: 'Office Chair', costPrice: 200000, sellingPrice: 350000 },
    { sku: 'PROD-002', name: 'Office Desk', costPrice: 400000, sellingPrice: 650000 },
    { sku: 'PROD-003', name: 'Monitor Stand', costPrice: 50000, sellingPrice: 95000 },
    { sku: 'SERV-001', name: 'Installation Service', costPrice: 0, sellingPrice: 150000 },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: {
        companyId: company.id,
        sku: product.sku,
        name: product.name,
        type: product.sku.startsWith('SERV') ? 'service' : 'product',
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        vatRate: 500,
        unit: product.sku.startsWith('SERV') ? 'service' : 'pcs',
        stockOnHand: product.sku.startsWith('SERV') ? 0 : 100,
        reorderLevel: 10,
      },
    })
  }

  console.log('✅ Created sample products')

  // Create bank account
  await prisma.bankAccount.create({
    data: {
      companyId: company.id,
      bankName: 'Emirates NBD',
      accountName: 'Demo Trading LLC',
      accountNumber: '1234567890',
      iban: 'AE070260001234567890001',
      balance: 50000000, // AED 500,000
      openingBalance: 50000000,
    },
  })

  console.log('✅ Created bank account')

  // Create sample employees
  const employees = [
    {
      employeeId: 'EMP-001',
      fullName: 'Ahmed Mohammed',
      nationality: 'UAE',
      department: 'Sales',
      designation: 'Sales Manager',
      basicSalary: 1500000,
      housingAllowance: 500000,
      transportAllowance: 200000,
    },
    {
      employeeId: 'EMP-002',
      fullName: 'Sarah Johnson',
      nationality: 'UK',
      department: 'Finance',
      designation: 'Accountant',
      basicSalary: 1200000,
      housingAllowance: 400000,
      transportAllowance: 150000,
    },
    {
      employeeId: 'EMP-003',
      fullName: 'Mohammed Ali',
      nationality: 'Pakistan',
      department: 'Operations',
      designation: 'Warehouse Supervisor',
      basicSalary: 800000,
      housingAllowance: 300000,
      transportAllowance: 100000,
    },
  ]

  for (const emp of employees) {
    await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        nationality: emp.nationality,
        department: emp.department,
        designation: emp.designation,
        basicSalary: emp.basicSalary,
        housingAllowance: emp.housingAllowance,
        transportAllowance: emp.transportAllowance,
        joiningDate: new Date('2023-01-15'),
        annualLeaveBalance: 30,
        sickLeaveBalance: 90,
      },
    })
  }

  console.log('✅ Created sample employees')

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('   Email: demo@uaebooks.ae')
  console.log('   Password: demo123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
