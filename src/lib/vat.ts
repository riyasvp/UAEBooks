// UAE VAT Utilities
// VAT Rate: 5% standard rate (implemented July 2017)

import { db } from "./db"
import { calculateVat, toFils, formatCurrency } from "./utils"

// VAT Rates in basis points (10000 = 100%)
export const VAT_RATE_STANDARD = 500 // 5%
export const VAT_RATE_ZERO = 0 // 0%
export const VAT_RATE_EXEMPT = -1 // Exempt (no VAT)

// ==================== VAT CALCULATIONS ====================

export interface VatCalculation {
  netAmount: number // In fils
  vatRate: number // In basis points
  vatAmount: number // In fils
  grossAmount: number // In fils
  isExempt: boolean
  isZeroRated: boolean
}

/**
 * Calculate VAT for a line item
 */
export function calculateLineVat(
  netAmount: number,
  vatRate: number = VAT_RATE_STANDARD
): VatCalculation {
  const isExempt = vatRate === VAT_RATE_EXEMPT
  const isZeroRated = vatRate === VAT_RATE_ZERO && !isExempt
  
  const vatAmount = isExempt ? 0 : calculateVat(netAmount, vatRate)
  const grossAmount = isExempt ? netAmount : netAmount + vatAmount
  
  return {
    netAmount,
    vatRate: isExempt ? 0 : vatRate,
    vatAmount,
    grossAmount,
    isExempt,
    isZeroRated,
  }
}

/**
 * Calculate VAT summary for multiple items
 */
export interface VatSummary {
  standardRatedValue: number
  standardRatedVat: number
  zeroRatedValue: number
  exemptValue: number
  totalValue: number
  totalVat: number
  grandTotal: number
}

export function calculateVatSummary(items: VatCalculation[]): VatSummary {
  let standardRatedValue = 0
  let standardRatedVat = 0
  let zeroRatedValue = 0
  let exemptValue = 0
  
  for (const item of items) {
    if (item.isExempt) {
      exemptValue += item.netAmount
    } else if (item.isZeroRated) {
      zeroRatedValue += item.netAmount
    } else {
      standardRatedValue += item.netAmount
      standardRatedVat += item.vatAmount
    }
  }
  
  const totalValue = standardRatedValue + zeroRatedValue + exemptValue
  const totalVat = standardRatedVat
  const grandTotal = totalValue + totalVat
  
  return {
    standardRatedValue,
    standardRatedVat,
    zeroRatedValue,
    exemptValue,
    totalValue,
    totalVat,
    grandTotal,
  }
}

// ==================== VAT RETURN CALCULATIONS ====================

export interface VatReturnData {
  // Sales (Output VAT)
  box1StandardRatedSales: number
  box1VatOnSales: number
  box2ZeroRatedSales: number
  box3ExemptSales: number
  box4TotalSales: number
  
  // Purchases (Input VAT)
  box5StandardRatedPurchases: number
  box5VatOnPurchases: number
  box6ImportsValue: number
  box6VatOnImports: number
  box7TotalPurchases: number
  
  // Net VAT
  box8RecoverableVat: number
  box9PayableVat: number
  netVatPayable: number
  netVatRefund: number
}

/**
 * Calculate VAT return data for a period
 */
export async function calculateVatReturn(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<VatReturnData> {
  // Get all invoices for the period
  const invoices = await db.invoice.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: { not: "cancelled" },
    },
    include: { items: true },
  })
  
  // Get all bills for the period
  const bills = await db.bill.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: { not: "cancelled" },
    },
    include: { items: true },
  })
  
  // Get all credit notes for the period
  const creditNotes = await db.creditNote.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: { not: "cancelled" },
    },
  })
  
  // Calculate sales VAT
  let box1StandardRatedSales = 0
  let box1VatOnSales = 0
  let box2ZeroRatedSales = 0
  let box3ExemptSales = 0
  
  for (const invoice of invoices) {
    for (const item of invoice.items) {
      const netAmount = item.total - item.vatAmount
      if (item.vatRate === VAT_RATE_EXEMPT || item.vatRate < 0) {
        box3ExemptSales += netAmount
      } else if (item.vatRate === 0) {
        box2ZeroRatedSales += netAmount
      } else {
        box1StandardRatedSales += netAmount
        box1VatOnSales += item.vatAmount
      }
    }
  }
  
  // Subtract credit notes
  for (const cn of creditNotes) {
    box1VatOnSales -= cn.vatTotal
    box1StandardRatedSales -= cn.subtotal
  }
  
  // Calculate purchase VAT
  let box5StandardRatedPurchases = 0
  let box5VatOnPurchases = 0
  let box6ImportsValue = 0
  let box6VatOnImports = 0
  
  for (const bill of bills) {
    for (const item of bill.items) {
      const netAmount = item.total - item.vatAmount
      if (item.vatRate > 0) {
        box5StandardRatedPurchases += netAmount
        box5VatOnPurchases += item.vatAmount
      }
    }
  }
  
  // Calculate totals
  const box4TotalSales = box1StandardRatedSales + box2ZeroRatedSales + box3ExemptSales
  const box7TotalPurchases = box5StandardRatedPurchases + box6ImportsValue
  
  // Calculate net VAT
  const outputVat = box1VatOnSales
  const inputVat = box5VatOnPurchases + box6VatOnImports
  
  let box8RecoverableVat = 0
  let box9PayableVat = 0
  let netVatPayable = 0
  let netVatRefund = 0
  
  if (outputVat >= inputVat) {
    box9PayableVat = outputVat - inputVat
    netVatPayable = box9PayableVat
  } else {
    box8RecoverableVat = inputVat - outputVat
    netVatRefund = box8RecoverableVat
  }
  
  return {
    box1StandardRatedSales,
    box1VatOnSales,
    box2ZeroRatedSales,
    box3ExemptSales,
    box4TotalSales,
    box5StandardRatedPurchases,
    box5VatOnPurchases,
    box6ImportsValue,
    box6VatOnImports,
    box7TotalPurchases,
    box8RecoverableVat,
    box9PayableVat,
    netVatPayable,
    netVatRefund,
  }
}

// ==================== VAT CATEGORY HELPERS ====================

export const VAT_CATEGORIES = [
  {
    code: "standard",
    name: "Standard Rate (5%)",
    nameAr: "النسبة الأساسية (٥٪)",
    rate: VAT_RATE_STANDARD,
    description: "Most goods and services",
  },
  {
    code: "zero",
    name: "Zero Rate (0%)",
    nameAr: "نسبة صفر (٠٪)",
    rate: VAT_RATE_ZERO,
    description: "Exports, international transport, certain medicines",
  },
  {
    code: "exempt",
    name: "Exempt",
    nameAr: "معفى",
    rate: VAT_RATE_EXEMPT,
    description: "Financial services, residential rent, healthcare",
  },
]

/**
 * Get VAT category by code
 */
export function getVatCategory(code: string) {
  return VAT_CATEGORIES.find(c => c.code === code)
}

/**
 * Determine if VAT applies based on transaction type and parties
 */
export function determineVatApplicability(
  supplierInUae: boolean,
  customerInUae: boolean,
  isExport: boolean
): { applicable: boolean; rate: number; reason: string } {
  // Export outside GCC
  if (isExport && !customerInUae) {
    return {
      applicable: true,
      rate: VAT_RATE_ZERO,
      reason: "Export - Zero rated",
    }
  }
  
  // Domestic transaction
  if (supplierInUae && customerInUae) {
    return {
      applicable: true,
      rate: VAT_RATE_STANDARD,
      reason: "Domestic supply - Standard rate",
    }
  }
  
  // GCC transaction (simplified)
  if (supplierInUae && !customerInUae) {
    return {
      applicable: true,
      rate: VAT_RATE_ZERO,
      reason: "GCC export - Zero rated",
    }
  }
  
  return {
    applicable: false,
    rate: VAT_RATE_ZERO,
    reason: "Not applicable",
  }
}

// ==================== PLACE OF SUPPLY RULES ====================

export function determinePlaceOfSupply(
  supplierLocation: string,
  customerLocation: string,
  serviceType: "goods" | "services"
): string {
  // Goods: Place of supply is where goods are delivered
  if (serviceType === "goods") {
    return customerLocation
  }
  
  // Services: General rule is where recipient belongs
  // But there are exceptions for:
  // - Real estate services: Location of property
  // - Entertainment/Dining: Where performed
  // - Transport: Where journey takes place
  
  return customerLocation
}

// ==================== REVERSE CHARGE ====================

/**
 * Check if reverse charge applies
 * Reverse charge applies when:
 * - UAE business receives services from outside UAE
 * - Import of goods
 */
export function isReverseChargeApplicable(
  supplierCountry: string,
  customerCountry: string,
  transactionType: "services" | "goods"
): boolean {
  // Import of services from outside UAE
  if (
    transactionType === "services" &&
    supplierCountry !== "UAE" &&
    customerCountry === "UAE"
  ) {
    return true
  }
  
  return false
}

// ==================== VAT REGISTRATION THRESHOLD ====================

export const VAT_REGISTRATION_THRESHOLD = toFils(375000) // AED 375,000
export const VAT_VOLUNTARY_THRESHOLD = toFils(187500) // AED 187,500

/**
 * Check if VAT registration is required
 */
export function isVatRegistrationRequired(annualTurnover: number): {
  required: boolean
  voluntary: boolean
  message: string
} {
  if (annualTurnover >= VAT_REGISTRATION_THRESHOLD) {
    return {
      required: true,
      voluntary: false,
      message: "VAT registration is mandatory (turnover exceeds AED 375,000)",
    }
  }
  
  if (annualTurnover >= VAT_VOLUNTARY_THRESHOLD) {
    return {
      required: false,
      voluntary: true,
      message: "VAT registration is voluntary (turnover between AED 187,500 and 375,000)",
    }
  }
  
  return {
    required: false,
    voluntary: false,
    message: "VAT registration not required (turnover below AED 187,500)",
  }
}

// ==================== FORM 201 BOX LABELS ====================

export const FORM_201_BOXES = [
  { box: "1", field: "box1StandardRatedSales", label: "Standard Rated Sales", labelAr: "المبيعات بالنسبة الأساسية" },
  { box: "1A", field: "box1VatOnSales", label: "VAT on Sales", labelAr: "ضريبة المبيعات" },
  { box: "2", field: "box2ZeroRatedSales", label: "Zero Rated Sales", labelAr: "المبيعات بنسبة صفر" },
  { box: "3", field: "box3ExemptSales", label: "Exempt Sales", labelAr: "المبيعات المعفاة" },
  { box: "4", field: "box4TotalSales", label: "Total Sales", labelAr: "إجمالي المبيعات" },
  { box: "5", field: "box5StandardRatedPurchases", label: "Standard Rated Purchases", labelAr: "المشتريات بالنسبة الأساسية" },
  { box: "5A", field: "box5VatOnPurchases", label: "VAT on Purchases", labelAr: "ضريبة المشتريات" },
  { box: "6", field: "box6ImportsValue", label: "Imports", labelAr: "الواردات" },
  { box: "6A", field: "box6VatOnImports", label: "VAT on Imports", labelAr: "ضريبة الواردات" },
  { box: "7", field: "box7TotalPurchases", label: "Total Purchases", labelAr: "إجمالي المشتريات" },
  { box: "8", field: "box8RecoverableVat", label: "Recoverable VAT", labelAr: "الضريبة القابلة للاسترداد" },
  { box: "9", field: "box9PayableVat", label: "Payable VAT", labelAr: "الضريبة المستحقة" },
]
