import { parseDate, cleanDescription, makeTransactionId, isValidTransaction, extractAccountNumber, extractStatementPeriod } from './parserUtils.js'
import { parseAmount } from '../utils/currency.js'

/**
 * Axis Bank Statement Parser
 * 
 * Statement format:
 * Tran Date | PARTICULARS | DR/CR | TRAN AMT | BALANCE
 * 
 * Date format: DD-MM-YYYY
 * DR/CR column: "DR" = debit, "CR" = credit
 */

const AXIS_DATE_PATTERN = /^\d{2}-\d{2}-\d{4}/
const AXIS_LINE_PATTERN = /^(\d{2}-\d{2}-\d{4})\s+(.+?)\s+(DR|CR)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s*$/i

const SKIP_PATTERNS = [
  /tran date/i,
  /particulars/i,
  /dr\/cr/i,
  /tran amt/i,
  /opening balance/i,
  /closing balance/i,
  /statement of account/i,
  /page \d+ of \d+/i,
  /generated on/i,
  /account statement/i,
]

export function parseAxis(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const transactions = []
  let skippedLines = 0
  let totalLines = 0

  const accountNumber = extractAccountNumber(text)
  const period = extractStatementPeriod(text)

  function shouldSkip(line) {
    return SKIP_PATTERNS.some(p => p.test(line))
  }

  let index = 0
  for (const line of lines) {
    totalLines++
    if (shouldSkip(line)) continue
    if (line.length < 10) continue

    try {
      const txn = parseAxisLine(line, 'axis', index)
      if (txn && isValidTransaction(txn)) {
        transactions.push(txn)
        index++
      }
    } catch (_) {
      skippedLines++
    }
  }

  return { transactions, skippedLines, totalLines, accountNumber, period }
}

function parseAxisLine(line, bank, index) {
  const match = line.match(AXIS_LINE_PATTERN)
  if (match) {
    const [, dateStr, particulars, drCr, amountStr, balanceStr] = match
    const date = parseDate(dateStr)
    if (!date) return null

    const amount = parseAmount(amountStr)
    if (amount <= 0) return null

    const type = drCr.toUpperCase() === 'DR' ? 'debit' : 'credit'
    const balance = parseAmount(balanceStr)
    const description = cleanAxisParticulars(particulars)

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

  // Fallback
  const datePart = line.match(/^(\d{2}-\d{2}-\d{4})/)
  if (!datePart) return null

  const date = parseDate(datePart[1])
  if (!date) return null

  // Look for DR or CR
  const typeMatch = line.match(/\b(DR|CR)\b/i)
  if (!typeMatch) return null

  const type = typeMatch[1].toUpperCase() === 'DR' ? 'debit' : 'credit'

  // Extract amounts after DR/CR
  const afterType = line.substring(typeMatch.index + typeMatch[0].length)
  const amounts = [...afterType.matchAll(/([\d,]+\.?\d*)/g)]
    .map(m => parseAmount(m[1]))
    .filter(a => a > 0)

  if (amounts.length === 0) return null

  const amount = amounts[0]
  const balance = amounts[1] || null

  // Description: between date and DR/CR
  const desc = line.substring(datePart[0].length, typeMatch.index).trim()

  return {
    id: makeTransactionId(bank, index, date),
    date,
    description: cleanAxisParticulars(desc) || 'Transaction',
    amount,
    type,
    balance,
    bank,
    rawText: line,
    category: 'others',
  }
}

function cleanAxisParticulars(particulars) {
  if (!particulars) return ''
  let s = particulars.trim()

  // Remove "UPI/" prefix (common in Axis)
  if (s.toUpperCase().startsWith('UPI/')) {
    s = s.substring(4)
  }

  // Remove trailing reference numbers
  s = s.replace(/\s+\d{10,}$/, '').trim()

  return cleanDescription(s)
}
