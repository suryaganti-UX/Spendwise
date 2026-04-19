import { parseDate, cleanDescription, makeTransactionId, isValidTransaction, extractAccountNumber, extractStatementPeriod } from './parserUtils.js'
import { parseAmount } from '../utils/currency.js'

/**
 * ICICI Bank Statement Parser
 * 
 * Statement format:
 * Date | Transaction Remarks | Amount (INR) | Type (Dr/Cr) | Available Balance
 * 
 * Date format: DD-MM-YYYY
 * Type: "Dr" for debit, "Cr" for credit
 * Remarks sometimes span multiple lines
 */

const ICICI_DATE_PATTERN = /^\d{2}-\d{2}-\d{4}/
const ICICI_LINE_PATTERN = /^(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s+(Dr|Cr)\s+([\d,]+\.?\d*)\s*$/i

const SKIP_PATTERNS = [
  /transaction remarks/i,
  /available balance/i,
  /opening balance/i,
  /closing balance/i,
  /^date\s/i,
  /statement of account/i,
  /page \d+ of \d+/i,
  /generated on/i,
  /account summary/i,
]

export function parseICICI(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const transactions = []
  let skippedLines = 0
  let totalLines = 0
  let pendingLine = null

  const accountNumber = extractAccountNumber(text)
  const period = extractStatementPeriod(text)

  function shouldSkip(line) {
    return SKIP_PATTERNS.some(p => p.test(line))
  }

  let index = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    totalLines++

    if (shouldSkip(line)) continue
    if (line.length < 5) continue

    const startsWithDate = ICICI_DATE_PATTERN.test(line)

    // Multi-line remarks handling: if current line doesn't start with date,
    // and we have a pending partial line, merge them
    if (!startsWithDate && pendingLine) {
      pendingLine = pendingLine + ' ' + line
      continue
    }

    // Process pending line if we have one
    if (pendingLine) {
      try {
        const txn = parseICICILine(pendingLine, 'icici', index)
        if (txn && isValidTransaction(txn)) {
          transactions.push(txn)
          index++
        } else {
          skippedLines++
        }
      } catch (_) {
        skippedLines++
      }
      pendingLine = null
    }

    if (startsWithDate) {
      // Check if this looks like a complete transaction or partial
      const hasAmountAndType = /\d+\.?\d*\s+(Dr|Cr)\s+[\d,]+/i.test(line)
      if (hasAmountAndType) {
        try {
          const txn = parseICICILine(line, 'icici', index)
          if (txn && isValidTransaction(txn)) {
            transactions.push(txn)
            index++
          } else {
            skippedLines++
          }
        } catch (_) {
          skippedLines++
        }
      } else {
        // Might be multi-line — accumulate
        pendingLine = line
      }
    }
  }

  // Process last pending line
  if (pendingLine) {
    try {
      const txn = parseICICILine(pendingLine, 'icici', index)
      if (txn && isValidTransaction(txn)) {
        transactions.push(txn)
      }
    } catch (_) { /* ignore */ }
  }

  return { transactions, skippedLines, totalLines, accountNumber, period }
}

function parseICICILine(line, bank, index) {
  const match = line.match(ICICI_LINE_PATTERN)
  if (match) {
    const [, dateStr, remarks, amountStr, drCr, balanceStr] = match
    const date = parseDate(dateStr)
    if (!date) return null

    const amount = parseAmount(amountStr)
    if (amount <= 0) return null

    const type = drCr.toLowerCase() === 'dr' ? 'debit' : 'credit'
    const balance = parseAmount(balanceStr)
    const description = cleanICICIRemarks(remarks)

    return {
      id: makeTransactionId(bank, index, date),
      date,
      description,
      amount,
      type,
      balance: balance || null,
      bank,
      rawText: line,
      category: 'others',
    }
  }

  // Fallback parsing
  const datePart = line.match(/^(\d{2}-\d{2}-\d{4})/)
  if (!datePart) return null

  const date = parseDate(datePart[1])
  if (!date) return null

  // Look for Dr/Cr indicator
  const typeMatch = line.match(/\b(Dr|Cr)\b/i)
  if (!typeMatch) return null

  const type = typeMatch[1].toLowerCase() === 'dr' ? 'debit' : 'credit'

  // Extract amounts before Dr/Cr
  const beforeType = line.substring(0, typeMatch.index)
  const amounts = [...beforeType.matchAll(/([\d,]+\.?\d*)/g)]
    .map(m => parseAmount(m[1]))
    .filter(a => a > 0)

  if (amounts.length === 0) return null

  const amount = amounts[amounts.length - 1]

  // Extract description: between date and first amount
  const firstAmtPos = line.search(/([\d,]+\.?\d*)/)
  const desc = line.substring(datePart[0].length, firstAmtPos).trim()

  return {
    id: makeTransactionId(bank, index, date),
    date,
    description: cleanICICIRemarks(desc) || 'Transaction',
    amount,
    type,
    balance: null,
    bank,
    rawText: line,
    category: 'others',
  }
}

function cleanICICIRemarks(remarks) {
  if (!remarks) return ''
  let s = remarks.trim()

  // Remove common ICICI prefixes
  const prefixes = ['VPS/', 'IPS/', 'ECS/', 'NACH/', 'ACH/', 'UPI/', 'NEFT/', 'IMPS/', 'RTGS/']
  for (const prefix of prefixes) {
    if (s.toUpperCase().startsWith(prefix)) {
      s = s.substring(prefix.length)
    }
  }

  // Remove long numeric codes
  s = s.replace(/\b\d{8,}\b/g, '').trim()

  return cleanDescription(s)
}
