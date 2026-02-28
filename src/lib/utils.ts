import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// CURRENCY UTILITIES (UAE - AED)
// ============================================

/**
 * Convert fils to AED string (for display)
 * All amounts stored as integers in fils (1 AED = 100 fils)
 */
export function filsToAED(fils: number): string {
  const aed = fils / 100
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(aed)
}

/**
 * Convert AED string/number to fils (for storage)
 */
export function aedToFils(aed: number | string): number {
  const num = typeof aed === 'string' ? parseFloat(aed.replace(/[^\d.-]/g, '')) : aed
  return Math.round(num * 100)
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

// ============================================
// DATE UTILITIES
// ============================================

const UAE_TIMEZONE = 'Asia/Dubai'

/**
 * Format date for display
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: UAE_TIMEZONE,
  }
  
  switch (format) {
    case 'full':
      options.weekday = 'long'
      options.year = 'numeric'
      options.month = 'long'
      options.day = 'numeric'
      break
    case 'long':
      options.year = 'numeric'
      options.month = 'long'
      options.day = 'numeric'
      break
    default:
      options.year = 'numeric'
      options.month = '2-digit'
      options.day = '2-digit'
  }
  
  return new Intl.DateTimeFormat('en-AE', options).format(d)
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

/**
 * Get current date in UAE timezone
 */
export function getUAEDate(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: UAE_TIMEZONE }).split(' ')[0]
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate UAE TRN (Tax Registration Number) - 15 digits
 */
export function validateTRN(trn: string): boolean {
  return /^\d{15}$/.test(trn)
}

/**
 * Format TRN for display
 */
export function formatTRN(trn: string): string {
  return trn.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})/, '$1-$2-$3-$4-$5')
}

/**
 * Validate Emirates ID (15 digits, starts with 784)
 */
export function validateEmiratesId(eid: string): boolean {
  return /^784\d{12}$/.test(eid.replace(/[-\s]/g, ''))
}

/**
 * Validate UAE IBAN
 */
export function validateIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, '').toUpperCase()
  return /^AE\d{2}[A-Z0-9]{19}$/.test(clean)
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Generate document number with prefix
 */
export function generateDocumentNumber(prefix: string, nextNumber: number): string {
  return `${prefix}${String(nextNumber).padStart(6, '0')}`
}

/**
 * Truncate string
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length - 3) + '...'
}

// ============================================
// CURRENCY FORMATTING (for PDF generation)
// ============================================

/**
 * Format currency for display (takes fils, returns AED string)
 */
export function formatCurrency(fils: number): string {
  const aed = fils / 100
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(aed)
}

/**
 * Format IBAN for display
 */
export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase()
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * Convert fils to AED (number)
 */
export function toDirhams(fils: number): number {
  return fils / 100
}

/**
 * Convert AED to fils (integer)
 */
export function toFils(aed: number): number {
  return Math.round(aed * 100)
}
