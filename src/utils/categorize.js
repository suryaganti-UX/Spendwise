import { CATEGORIES, CATEGORY_MAP } from '../constants/categories.js'

/**
 * Transaction categorization engine
 * Rule-based, keyword matching, case-insensitive
 */

// Session-stored user rules (passed in from state)
let SESSION_RULES = []

export function setUserRules(rules) {
  SESSION_RULES = rules || []
}

/**
 * Clean a description for keyword matching
 */
function cleanForMatching(desc) {
  return (desc || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Categorize a single transaction
 * @param {Object} txn - Transaction object
 * @param {Array} userRules - Session user-defined rules
 * @returns {string} - category id
 */
export function categorizeTransaction(txn, userRules = []) {
  const desc = cleanForMatching(txn.description)
  const allRules = [...(userRules || []), ...SESSION_RULES]

  // Apply user-defined rules first (session learning)
  for (const rule of allRules) {
    if (rule.keyword && desc.includes(rule.keyword.toLowerCase())) {
      return rule.category
    }
  }

  // Special rules
  // Credit transactions with high amount → bias toward income
  if (txn.type === 'credit' && txn.amount > 10000) {
    const incomeKeywords = CATEGORY_MAP['income']?.keywords || []
    for (const kw of incomeKeywords) {
      if (desc.includes(kw.toLowerCase())) return 'income'
    }
    // Large credits without specific keywords → still might be income
    if (!desc.includes('refund') && !desc.includes('cashback')) {
      // Check if it's clearly not something else
      const hasOtherMatch = CATEGORIES
        .filter(c => c.id !== 'income' && c.id !== 'others' && c.id !== 'transfers')
        .some(c => c.keywords.some(kw => desc.includes(kw.toLowerCase())))
      if (!hasOtherMatch) return 'income'
    }
  }

  // Refunds → mark as credit type income
  if (desc.includes('refund') || desc.includes('cashback') || desc.includes('reversal')) {
    return 'income'
  }

  // UPI transfer patterns (e.g. "UPI-JOHN@okicici", "Pay to user@upi", "VPA upi@bank")
  const isUpiTransfer =
    /upi[/-]/i.test(txn.description || '') ||
    /\S+@\S+/.test(txn.description || '') ||
    /\bvpa\b/i.test(txn.description || '')
  if (isUpiTransfer && txn.type === 'debit') return 'transfers'

  // Sort categories by priority, check keywords
  const sorted = [...CATEGORIES].sort((a, b) => a.priority - b.priority)
  for (const category of sorted) {
    if (category.id === 'others') continue
    for (const keyword of category.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return category.id
      }
    }
  }

  return 'others'
}

/**
 * Categorize all transactions in a list
 * @param {Transaction[]} transactions
 * @param {Array} userRules - Session user rules
 * @returns {Transaction[]} - transactions with category assigned
 */
export function categorizeAll(transactions, userRules = []) {
  return transactions.map(txn => ({
    ...txn,
    category: txn.userModified ? txn.category : categorizeTransaction(txn, userRules),
  }))
}
