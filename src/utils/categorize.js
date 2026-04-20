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

  // UPI transfer patterns — person-to-person only (e.g. "UPI/abc@okicici", bare VPA)
  // Carefully exclude well-known merchant names that carry "upi" as a prefix
  // by only matching when the description has NO recognisable merchant keyword.
  const rawDesc = txn.description || ''
  const isVpaPattern = /\S+@(okicici|oksbi|okaxis|okhdfcbank|ybl|upi|paytm|axl|ibl|rbl|apl|fbl|barodampay|hsbc|allbank|augbank|boi|cnrb|csbpay|dcb|dbs|ezeepay|fbl|hdfcbank|icici|idbi|idfcbank|indus|jsbp|kbl|kotak|kvb|lvb|mahb|pnb|psb|rbl|scb|sib|srcb|tjsb|uco|unionbank|vjb|waaxis)$/i.test(rawDesc)
  const isBareUpiRef = /^(upi|neft|imps|rtgs)[\s/-]/i.test(rawDesc) && !/swiggy|zomato|amazon|flipkart|netflix|spotify|hotstar|uber|ola|irctc|rapido|groww|zerodha|lic|apollo|pharmacy|petrol|diesel|electricity|gas|broadband|airtel|jio/i.test(rawDesc)
  if ((isVpaPattern || isBareUpiRef) && txn.type === 'debit') return 'transfers'

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
