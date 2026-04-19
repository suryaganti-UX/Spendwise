/**
 * INR Currency formatting utilities
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const INR_FORMATTER_2DP = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const NUMBER_FORMATTER = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Format a number as INR currency
 * 1000 → "₹1,000"
 * 123456.78 → "₹1,23,456.78"
 * 0 → "₹0"
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0'
  return INR_FORMATTER.format(Math.abs(amount))
}

/**
 * Format with always 2 decimal places
 */
export function formatINR2DP(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00'
  return INR_FORMATTER_2DP.format(Math.abs(amount))
}

/**
 * Compact INR format for summary cards
 * 1000 → "₹1K"
 * 100000 → "₹1L"
 * 1000000 → "₹10L"
 * 10000000 → "₹1Cr"
 */
export function formatINRCompact(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0'
  const abs = Math.abs(amount)
  
  if (abs >= 10_000_000) {
    return `₹${(abs / 10_000_000).toFixed(1).replace(/\.0$/, '')}Cr`
  }
  if (abs >= 100_000) {
    return `₹${(abs / 100_000).toFixed(1).replace(/\.0$/, '')}L`
  }
  if (abs >= 1_000) {
    return `₹${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return `₹${abs.toFixed(0)}`
}

/**
 * Format a number without currency symbol (for axis labels)
 */
export function formatNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0'
  return NUMBER_FORMATTER.format(amount)
}

/**
 * Parse an amount string to float (handles Indian comma formatting)
 * "1,23,456.78" → 123456.78
 * "1,000" → 1000
 */
export function parseAmount(str) {
  if (!str) return 0
  const cleaned = String(str).replace(/,/g, '').trim()
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format for Y-axis in charts (compact)
 */
export function formatAxisAmount(amount) {
  const abs = Math.abs(amount)
  if (abs >= 100_000) return `₹${(abs / 100_000).toFixed(1)}L`
  if (abs >= 1_000) return `₹${(abs / 1_000).toFixed(0)}K`
  return `₹${abs.toFixed(0)}`
}
