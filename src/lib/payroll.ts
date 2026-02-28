// UAE Payroll & WPS (Wage Protection System) Utilities

import { db } from "./db"
import { formatCurrency, formatNumber, toDirhams, toFils, formatDate } from "./utils"

// ==================== UAE LABOR LAW CONSTANTS ====================

// UAE Labor Law Limits
export const MAX_WORKING_HOURS_PER_DAY = 8
export const MAX_WORKING_HOURS_PER_WEEK = 48
export const OVERTIME_MULTIPLIER_WEEKDAY = 1.25 // 125% of basic hourly rate
export const OVERTIME_MULTIPLIER_WEEKEND = 1.50 // 150% of basic hourly rate
export const GRACE_PERIOD_MINUTES = 15

// Leave Entitlements
export const ANNUAL_LEAVE_DAYS_MIN = 30 // Minimum annual leave days
export const SICK_LEAVE_DAYS = 90 // Total sick leave per year
export const SICK_LEAVE_FULL_PAY_DAYS = 15 // First 15 days full pay
export const SICK_LEAVE_HALF_PAY_DAYS = 30 // Next 30 days half pay

// End of Service Gratuity
export const GRATUITY_YEARS_1_5 = 21 // Days per year for 1-5 years
export const GRATUITY_YEARS_OVER_5 = 30 // Days per year for over 5 years

// ==================== SALARY CALCULATIONS ====================

export interface SalaryBreakdown {
  // Earnings
  basicSalary: number
  housingAllowance: number
  transportAllowance: number
  otherAllowances: number
  overtime: number
  bonus: number
  grossPay: number
  
  // Deductions
  absences: number
  lateArrivals: number
  sickLeaveUnpaid: number
  otherDeductions: number
  loanDeduction: number
  totalDeductions: number
  
  // Net
  netPay: number
  
  // Employer Costs
  employerPension: number
  employerInsurance: number
  totalEmployerCost: number
}

/**
 * Calculate monthly salary breakdown
 */
export function calculateSalaryBreakdown(
  basicSalary: number,
  housingAllowance: number = 0,
  transportAllowance: number = 0,
  otherAllowances: number = 0,
  overtimeHours: number = 0,
  bonus: number = 0,
  absences: number = 0,
  lateArrivals: number = 0,
  otherDeductions: number = 0,
  loanDeduction: number = 0
): SalaryBreakdown {
  // Calculate overtime (125% of basic hourly rate)
  const hourlyRate = basicSalary / (30 * 8) // Monthly basic / working days / hours
  const overtime = Math.round(overtimeHours * hourlyRate * OVERTIME_MULTIPLIER_WEEKDAY)
  
  // Calculate gross pay
  const grossPay = basicSalary + housingAllowance + transportAllowance + 
                   otherAllowances + overtime + bonus
  
  // Calculate deductions for absences
  const dailyRate = basicSalary / 30
  const absencesDeduction = Math.round(absences * dailyRate)
  
  // Calculate late arrival deductions (if more than grace period)
  const lateDeduction = Math.round(lateArrivals * (hourlyRate / 4)) // 15 min increments
  
  const totalDeductions = absencesDeduction + lateDeduction + otherDeductions + loanDeduction
  
  // Calculate net pay
  const netPay = grossPay - totalDeductions
  
  // Employer costs (if applicable - mainly for UAE/GCC nationals)
  const employerPension = 0 // Only for UAE nationals (5% of basic)
  const employerInsurance = 0 // Variable based on policy
  const totalEmployerCost = grossPay + employerPension + employerInsurance
  
  return {
    basicSalary,
    housingAllowance,
    transportAllowance,
    otherAllowances,
    overtime,
    bonus,
    grossPay,
    absences: absencesDeduction,
    lateArrivals: lateDeduction,
    sickLeaveUnpaid: 0,
    otherDeductions,
    loanDeduction,
    totalDeductions,
    netPay,
    employerPension,
    employerInsurance,
    totalEmployerCost,
  }
}

// ==================== GRATUITY CALCULATION ====================

export interface GratuityCalculation {
  yearsOfService: number
  lastBasicSalary: number
  daysPerYear: number
  totalGratuity: number
  isEligible: boolean
  reason: string
}

/**
 * Calculate end of service gratuity
 * UAE Labor Law: 
 * - Less than 1 year: No gratuity
 * - 1-5 years: 21 days basic salary per year
 * - Over 5 years: 30 days basic salary per year for years over 5
 */
export function calculateGratuity(
  joinDate: Date,
  endDate: Date,
  lastBasicSalary: number
): GratuityCalculation {
  const yearsOfService = (endDate.getTime() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  
  if (yearsOfService < 1) {
    return {
      yearsOfService,
      lastBasicSalary,
      daysPerYear: 0,
      totalGratuity: 0,
      isEligible: false,
      reason: "Less than 1 year of service",
    }
  }
  
  let daysPerYear = GRATUITY_YEARS_1_5
  let totalDays = 0
  
  if (yearsOfService <= 5) {
    totalDays = Math.round(yearsOfService * GRATUITY_YEARS_1_5)
    daysPerYear = GRATUITY_YEARS_1_5
  } else {
    // First 5 years at 21 days
    totalDays = 5 * GRATUITY_YEARS_1_5
    // Remaining years at 30 days
    totalDays += Math.round((yearsOfService - 5) * GRATUITY_YEARS_OVER_5)
    daysPerYear = GRATUITY_YEARS_OVER_5
  }
  
  // Maximum gratuity is 2 years salary
  const maxDays = 2 * 365
  totalDays = Math.min(totalDays, maxDays)
  
  const dailySalary = lastBasicSalary / 30
  const totalGratuity = Math.round(totalDays * dailySalary)
  
  return {
    yearsOfService,
    lastBasicSalary,
    daysPerYear,
    totalGratuity,
    isEligible: true,
    reason: `${totalDays} days gratuity`,
  }
}

// ==================== WPS SIF FILE GENERATION ====================

export interface WpsEmployeeRecord {
  employerCode: string
  employeeId: string
  employeeName: string
  accountNumber: string
  iban: string
  bankCode: string
  salaryAmount: number
  allowanceAmount: number
  deductionAmount: number
  netAmount: number
  paymentMonth: string
  paymentYear: string
}

/**
 * Generate WPS SIF file content
 * UAE Wage Protection System format
 */
export function generateWpsSifFile(
  companyCode: string,
  companyName: string,
  month: number,
  year: number,
  employees: WpsEmployeeRecord[]
): string {
  const lines: string[] = []
  
  // Header Record (H)
  // Format: H|EmployerCode|CompanyName|TotalRecords|TotalAmount|Month|Year|FileDate|FileVersion
  const totalAmount = employees.reduce((sum, e) => sum + e.netAmount, 0)
  const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  
  lines.push([
    "H",
    companyCode.padEnd(15, " "),
    companyName.substring(0, 50).padEnd(50, " "),
    employees.length.toString().padStart(6, "0"),
    toDirhams(totalAmount).toFixed(2).padStart(15, "0"),
    month.toString().padStart(2, "0"),
    year.toString(),
    fileDate,
    "01", // Version
  ].join("|"))
  
  // Detail Records (D)
  // Format: D|EmployeeId|EmployeeName|IBAN|BankCode|Amount|Allowance|Deduction|NetAmount
  for (const emp of employees) {
    lines.push([
      "D",
      emp.employeeId.padEnd(10, " "),
      emp.employeeName.substring(0, 30).padEnd(30, " "),
      emp.iban.replace(/\s/g, "").padEnd(24, " "),
      emp.bankCode.padEnd(6, " "),
      toDirhams(emp.salaryAmount).toFixed(2).padStart(12, "0"),
      toDirhams(emp.allowanceAmount).toFixed(2).padStart(12, "0"),
      toDirhams(emp.deductionAmount).toFixed(2).padStart(12, "0"),
      toDirhams(emp.netAmount).toFixed(2).padStart(12, "0"),
    ].join("|"))
  }
  
  // Trailer Record (T)
  // Format: T|TotalRecords|TotalAmount|HashTotal
  lines.push([
    "T",
    employees.length.toString().padStart(6, "0"),
    toDirhams(totalAmount).toFixed(2).padStart(15, "0"),
    generateWpsHash(employees).padStart(20, "0"),
  ].join("|"))
  
  return lines.join("\n")
}

/**
 * Generate hash for WPS file
 */
function generateWpsHash(employees: WpsEmployeeRecord[]): string {
  let hash = 0
  for (const emp of employees) {
    hash += emp.netAmount
  }
  return hash.toString()
}

// ==================== UAE BANK CODES ====================

export const UAE_BANKS = [
  { code: "001", name: "Central Bank of UAE", swift: "CBAUAEAA" },
  { code: "003", name: "Abu Dhabi Commercial Bank", swift: "ADCBAEAA" },
  { code: "004", name: "Al Ahli Bank of Kuwait", swift: "ABKKAEAA" },
  { code: "005", name: "Bank of Sharjah", swift: "SHARAEAA" },
  { code: "006", name: "Commercial Bank of Dubai", swift: "CBDLAEAA" },
  { code: "007", name: "Arab Bank for Investment", swift: "ARIBAEAA" },
  { code: "008", name: "Emirates Bank International", swift: "EBILAEAD" },
  { code: "009", name: "Emirates Islamic Bank", swift: "MEBLAEAD" },
  { code: "010", name: "Abu Dhabi Islamic Bank", swift: "ABDIAEAD" },
  { code: "011", name: "First Abu Dhabi Bank", swift: "NBADAEAA" },
  { code: "012", name: "Dubai Islamic Bank", swift: "DUIBAEAD" },
  { code: "013", name: "Mashreq Bank", swift: "BOMLAEAD" },
  { code: "014", name: "National Bank of Fujairah", swift: "NBFUAEAF" },
  { code: "015", name: "National Bank of Abu Dhabi", swift: "NBADAEAA" },
  { code: "016", name: "RAK Bank", swift: "NRAKAEAK" },
  { code: "017", name: "Union National Bank", swift: "UNBIABAD" },
  { code: "018", name: "HSBC Bank Middle East", swift: "BBMEAEAD" },
  { code: "019", name: "Citibank NA", swift: "CITIAEAD" },
  { code: "020", name: "Standard Chartered Bank", swift: "SCBLAEAD" },
  { code: "021", name: "Barclays Bank", swift: "BARCAEAD" },
  { code: "022", name: "Habib Bank AG Zurich", swift: "HBZUAEAD" },
  { code: "023", name: "Bank of Baroda", swift: "BARBINBB" },
  { code: "024", name: "Bank of India", swift: "BKIDAEAD" },
  { code: "025", name: "State Bank of India", swift: "SBINAEAD" },
  { code: "026", name: "United Arab Bank", swift: "UABAAESH" },
  { code: "027", name: "Commercial Bank International", swift: "CLBIAEAD" },
  { code: "028", name: "Invest Bank", swift: "INVEAEAS" },
  { code: "029", name: "National Bank of Umm Al Qaiwain", swift: "UMMQAEQA" },
  { code: "030", name: "Noor Bank", swift: "NISRAEAD" },
]

/**
 * Get bank by code
 */
export function getBankByCode(code: string) {
  return UAE_BANKS.find(b => b.code === code)
}

/**
 * Extract bank code from IBAN
 */
export function extractBankFromIBAN(iban: string): string | undefined {
  const cleaned = iban.replace(/\s/g, "").toUpperCase()
  if (!cleaned.startsWith("AE")) return undefined
  
  // UAE IBAN: AE + 2 check digits + 3 digit bank code + 16 digit account
  const bankCode = cleaned.substring(4, 7)
  return bankCode
}

// ==================== PAYROLL RUN HELPERS ====================

/**
 * Calculate payroll for all employees
 */
export async function calculatePayrollRun(
  companyId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const employees = await db.employee.findMany({
    where: {
      companyId,
      isActive: true,
      status: "active",
    },
  })
  
  const payrollItems = employees.map(emp => {
    const breakdown = calculateSalaryBreakdown(
      emp.basicSalary,
      emp.housingAllowance,
      emp.transportAllowance,
      emp.otherAllowances
    )
    
    return {
      employeeId: emp.id,
      basicSalary: breakdown.basicSalary,
      housingAllowance: breakdown.housingAllowance,
      transportAllowance: breakdown.transportAllowance,
      otherAllowances: breakdown.otherAllowances,
      overtime: breakdown.overtime,
      bonus: 0,
      grossPay: breakdown.grossPay,
      incomeTax: 0,
      pensionDeduction: 0,
      healthInsurance: 0,
      otherDeductions: breakdown.otherDeductions,
      loanDeduction: breakdown.loanDeduction,
      totalDeductions: breakdown.totalDeductions,
      netPay: breakdown.netPay,
      employerPension: breakdown.employerPension,
      employerInsurance: breakdown.employerInsurance,
      workingDays: 30,
      daysWorked: 30,
      leaveDays: 0,
      sickDays: 0,
    }
  })
  
  const totals = payrollItems.reduce(
    (acc, item) => ({
      totalGross: acc.totalGross + item.grossPay,
      totalDeductions: acc.totalDeductions + item.totalDeductions,
      totalNet: acc.totalNet + item.netPay,
      totalEmployerContribution: acc.totalEmployerContribution + item.employerPension + item.employerInsurance,
    }),
    { totalGross: 0, totalDeductions: 0, totalNet: 0, totalEmployerContribution: 0 }
  )
  
  return {
    items: payrollItems,
    totals,
    employeeCount: employees.length,
  }
}

// ==================== LEAVE CALCULATIONS ====================

/**
 * Calculate leave balance
 */
export function calculateLeaveBalance(
  annualLeaveDays: number,
  yearStart: Date,
  accruedDays: number,
  usedDays: number
): { entitled: number; used: number; remaining: number; accrualRate: number } {
  // UAE labor law: 30 days minimum per year
  const entitled = Math.max(annualLeaveDays, ANNUAL_LEAVE_DAYS_MIN)
  
  // Calculate accrued based on months worked
  const now = new Date()
  const monthsWorked = (now.getFullYear() - yearStart.getFullYear()) * 12 + 
                       (now.getMonth() - yearStart.getMonth())
  const accrualRate = entitled / 12 // Days per month
  const accrued = Math.min(Math.round(accrualRate * monthsWorked), entitled)
  
  return {
    entitled,
    used: usedDays,
    remaining: accrued - usedDays,
    accrualRate,
  }
}

// ==================== SALARY TRANSFER ====================

export interface SalaryTransferInstruction {
  employeeId: string
  employeeName: string
  iban: string
  bankName: string
  amount: number
  reference: string
}

/**
 * Generate salary transfer instructions for bank upload
 */
export function generateSalaryTransferFile(
  instructions: SalaryTransferInstruction[],
  companyName: string,
  paymentDate: Date
): string {
  // CSV format for bank upload
  const lines = [
    "Beneficiary Name,IBAN,Amount,Currency,Payment Reference,Payment Date",
  ]
  
  const dateStr = paymentDate.toISOString().slice(0, 10)
  
  for (const inst of instructions) {
    lines.push([
      `"${inst.employeeName}"`,
      inst.iban,
      toDirhams(inst.amount).toFixed(2),
      "AED",
      `"${inst.reference}"`,
      dateStr,
    ].join(","))
  }
  
  return lines.join("\n")
}
