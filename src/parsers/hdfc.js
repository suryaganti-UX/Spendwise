import { parseDate, cleanDescription, makeTransactionId, isValidTransaction, extractAccountNumber, extractStatementPeriod } from './parserUtils.js'
import { parseAmount } from '../utils/currency.js'

/**
 * HDFC Bank Statement Parser
 * 
 * Statement format:
 * Date | Narration | Value Date | Withdrawal Amt | Deposit Amt | Closing Balance
 * 
 * Date format: DD/MM/YY or DD/MM/YYYY
 * Amounts: comma-formatted (1,23,456.78)
 * Debit = Withdrawal Amt column has value
 * Credit = Deposit Amt column has value
 */

// HDFC transaction line regex patterns
// Format: DD/MM/YY(YY) ... withdrawal ... deposit ... balance
const HDFC_LINE_PATTERN = /^(\d{2}\/\d{2}\/\d{2,4})\s+(.+?)\s+(\d{2}\/\d{2}\/\d{2,4})?\s+([\d,]*\.?\d*)\s+([\d,]*\.?\d*)\s+([\d,]*\.?\d+)\s*$/

const HDFC_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{2,4}$/

export function parseHDFC(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const transactions = []
  let skippedLines = 0
  let totalLines = 0

  // Extract metadata from header
  const accountNumber = extractAccountNumber(text)
  const period = extractStatementPeriod(text)

  // Lines to skip
  const SKIP_PATTERNS = [
    /opening balance/i,
    /closing balance/i,
    /^date\s+narration/i,
    /^date\s+description/i,
    /^\*+$/,
    /page \d+ of \d+/i,
    /generated on/i,
    /statement of account/i,
    /^s\.no/i,
    /transaction date/i,
    /value date/i,
    /withdrawal amt/i,
  ]

  function shouldSkip(line) {
    return SKIP_PATTERNS.some(p => p.test(line))
  }

  let index = 0
  for (const line of lines) {
    totalLines++
    if (shouldSkip(line)) continue
    if (line.length < 10) continue

    try {
      const txn = parseHDFCLine(line, 'hdfc', index)
      if (txn && isValidTransaction(txn)) {
        transactions.push(txn)
        index++
      } else if (line.match(HDFC_DATE_PATTERN) || line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        skippedLines++
      }
    } catch (_) {
      skippedLines++
    }
  }

  return { transactions, skippedLines, totalLines, accountNumber, period }
}

function parseHDFCLine(line, bank, index) {
  // Try full regex match first
  const match = line.match(HDFC_LINE_PATTERN)
  if (match) {
    const [, dateStr, narration, , withdrawalStr, depositStr, balanceStr] = match
    const date = parseDate(dateStr)
    if (!date) return null

    const withdrawal = parseAmount(withdrawalStr)
    const deposit = parseAmount(depositStr)
    const balance = parseAmount(balanceStr)

    if (withdrawal === 0 && deposit === 0) return null

    const isDebit = withdrawal > 0
    const amount = isDebit ? withdrawal : deposit
    const description = cleanDescription(narration)

    return {
      id: makeTransactionId(bank, index, date),
      date,
      description,
      amount,
      type: isDebit ? 'debit' : 'credit',
      balance: balance || null,
      bank,
      rawText: line,
      category: 'others',
    }
  }

  // Fallback: try to parse more loosely
  // Check if line starts with a date
  const datePart = line.match(/^(\d{2}\/\d{2}\/\d{2,4})/)
  if (!datePart) return null

  const date = parseDate(datePart[1])
  if (!date) return null

  // Extract amounts (numbers with possible commas) from the end of the line
  const amounts = []
  const amountRegex = /([\d,]+\.?\d{0,2})/g
  let amtMatch
  while ((amtMatch = amountRegex.exec(line)) !== null) {
    const amt = parseAmount(amtMatch[1])
    if (amt > 0) amounts.push({ val: amt, pos: amtMatch.index })
  }

  if (amounts.length < 2) return null

  // Last amount is balance, second-to-last is the transaction amount
  // Check if there's a Dr/Cr indicator in the line
  const isDebit = /\bDr\b|\bDR\b|withdrawal/i.test(line)
  const isCredit = /\bCr\b|\bCR\b|deposit/i.test(line)

  const balance = amounts[amounts.length - 1]?.val || null
  const txnAmt = amounts[amounts.length - 2]?.val || null

  if (!txnAmt || txnAmt <= 0) return null

  // Extract description: everything between the date and the first amount
  const firstAmtPos = amounts[0]?.pos || line.length
  const desc = line.substring(datePart[0].length, firstAmtPos).trim()
  const description = cleanDescription(desc)

  let type = 'debit'
  if (isCredit && !isDebit) type = 'credit'
  else if (!isDebit && amounts.length >= 3) {
    // Heuristic: if withdrawal column is 0/empty and deposit has value
    type = 'debit' // default
  }

  return {
    id: makeTransactionId(bank, index, date),
    date,
    description: description || 'Transaction',
    amount: txnAmt,
    type,
    balance,
    bank,
    rawText: line,
    category: 'others',
  }
}
