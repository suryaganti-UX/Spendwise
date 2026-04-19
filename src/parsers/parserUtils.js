import { parseAmount } from '../utils/currency.js'
import { parse, isValid } from 'date-fns'

/**
 * Parse date strings with multiple format patterns
 * Returns a JS Date or null
 */
export function parseDate(dateStr) {
  if (!dateStr) return null
  const s = dateStr.trim()
  const formats = [
    'dd/MM/yyyy',
    'dd/MM/yy',
    'dd-MM-yyyy',
    'dd-MM-yy',
    'dd MMM yyyy',
    'dd MMM yy',
    'dd/MM/YYYY',
  ]
  for (const fmt of formats) {
    try {
      const parsed = parse(s, fmt, new Date())
      if (isValid(parsed)) return parsed
    } catch (_) {
      // try next format
    }
  }
  return null
}

/**
 * Clean a narration/description string
 * Remove common prefixes and codes to extract a readable merchant name
 */
export function cleanDescription(desc) {
  if (!desc) return ''
  let s = desc.trim()

  // Remove common prefixes
  const prefixes = [
    'UPI/', 'UPI-', 'NEFT-', 'NEFT/', 'IMPS-', 'IMPS/', 'RTGS-', 'RTGS/',
    'VPS/', 'IPS/', 'ECS/', 'NACH/', 'ACH/',
    'BY TRANSFER-', 'BY TRANSFER/',
  ]
  for (const prefix of prefixes) {
    if (s.toUpperCase().startsWith(prefix.toUpperCase())) {
      s = s.substring(prefix.length)
    }
  }

  // Remove UPI reference numbers (long numeric strings)
  s = s.replace(/\b\d{10,}\b/g, '').trim()

  // Remove leading zeros
  s = s.replace(/^0+/, '')

  // Normalize spaces
  s = s.replace(/\s+/g, ' ').trim()

  // Truncate if too long
  if (s.length > 80) s = s.substring(0, 80).trim()

  return s || desc.trim()
}

/**
 * Generate a unique transaction ID
 */
export function makeTransactionId(bank, index, date) {
  const dateStr = date ? `${date.getFullYear()}${date.getMonth()}${date.getDate()}` : 'nodate'
  return `${bank}_${dateStr}_${index}`
}

/**
 * Filter out invalid transactions
 */
export function isValidTransaction(txn) {
  if (!txn) return false
  if (!txn.date || !isValid(txn.date)) return false
  if (!txn.amount || txn.amount <= 0) return false
  if (!txn.type) return false
  return true
}

/**
 * Extract account number (last 4 digits) from statement header text
 */
export function extractAccountNumber(text) {
  // Look for patterns like: Account No: XXXXXXXX1234
  // or: A/c No. ****1234
  // or: Account Number: 123456789012
  const patterns = [
    /account\s*(?:no|number|num)[\s.:]+[X*\d]+(\d{4})/i,
    /a\/c\s*(?:no|number|num)[\s.:]+[X*\d]+(\d{4})/i,
    /acct[\s.:]+[X*\d]+(\d{4})/i,
    /\bX{4,}(\d{4})\b/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return `****${match[1]}`
  }
  return null
}

/**
 * Extract statement period from header text
 */
export function extractStatementPeriod(text) {
  // Try to find "From: DD/MM/YYYY To: DD/MM/YYYY" or similar
  const patterns = [
    /from[\s:]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+to[\s:]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    /period[\s:]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+to\s+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    /statement\s+date[\s:]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const from = parseDate(match[1])
      const to = match[2] ? parseDate(match[2]) : null
      if (from) return { from, to }
    }
  }
  return null
}
