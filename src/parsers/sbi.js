import { parseDate, cleanDescription, makeTransactionId, isValidTransaction, extractAccountNumber, extractStatementPeriod } from './parserUtils.js'
import { parseAmount } from '../utils/currency.js'
import { parse, isValid } from 'date-fns'

/**
 * SBI Bank Statement Parser
 * 
 * Statement format:
 * Txn Date | Value Date | Description | Ref No./Cheque No. | Debit | Credit | Balance
 * 
 * Date format: DD MMM YYYY (e.g., 15 Jan 2024)
 */

const SBI_DATE_PATTERN = /^\d{2}\s+[A-Za-z]{3}\s+\d{4}/

const SKIP_PATTERNS = [
  /txn date/i,
  /value date/i,
  /description/i,
  /opening balance/i,
  /account summary/i,
  /statement of account/i,
  /page \d+ of \d+/i,
  /generated on/i,
  /^ref no/i,
  /^cheque/i,
]

export function parseSBI(text) {
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
      const txn = parseSBILine(line, 'sbi', index)
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

function parseSBIDate(dateStr) {
  if (!dateStr) return null
  const s = dateStr.trim()
  const formats = ['dd MMM yyyy', 'dd MMM yy', 'dd-MMM-yyyy', 'dd/MMM/yyyy']
  for (const fmt of formats) {
    try {
      const parsed = parse(s, fmt, new Date())
      if (isValid(parsed)) return parsed
    } catch (_) { /* try next */ }
  }
  return null
}

function parseSBILine(line, bank, index) {
  // SBI format: DD MMM YYYY  DD MMM YYYY  Description  RefNo  Debit  Credit  Balance
  const dateMatch = line.match(/^(\d{2}\s+[A-Za-z]{3}\s+\d{4})/)
  if (!dateMatch) return null

  const date = parseSBIDate(dateMatch[1])
  if (!date) return null

  const rest = line.substring(dateMatch[0].length).trim()

  // Extract numbers from the end of the line
  // SBI typically has: ... debit credit balance (last 3 numbers, some may be empty)
  const numbers = []
  const numRegex = /([\d,]+\.\d{2})/g
  let nm
  while ((nm = numRegex.exec(rest)) !== null) {
    numbers.push({ val: parseAmount(nm[1]), pos: nm.index })
  }

  if (numbers.length === 0) return null

  let amount, type, balance

  if (numbers.length >= 3) {
    // Last = balance, others are debit/credit
    balance = numbers[numbers.length - 1].val
    const debitAmt = numbers[numbers.length - 3]?.val || 0
    const creditAmt = numbers[numbers.length - 2]?.val || 0
    if (debitAmt > 0 && creditAmt === 0) {
      amount = debitAmt
      type = 'debit'
    } else if (creditAmt > 0 && debitAmt === 0) {
      amount = creditAmt
      type = 'credit'
    } else if (debitAmt > 0) {
      amount = debitAmt
      type = 'debit'
    } else {
      amount = creditAmt
      type = 'credit'
    }
  } else if (numbers.length === 2) {
    balance = numbers[1].val
    amount = numbers[0].val
    // Default debit, check for credit keywords
    type = /credit|cr\b/i.test(rest) ? 'credit' : 'debit'
  } else {
    amount = numbers[0].val
    balance = null
    type = /credit|cr\b/i.test(rest) ? 'credit' : 'debit'
  }

  if (!amount || amount <= 0) return null

  // Extract description: between date and first number
  const firstNumPos = numbers[0]?.pos || rest.length
  let desc = rest.substring(0, firstNumPos).trim()

  // SBI descriptions often have a ref number as second part - take first meaningful segment
  desc = cleanSBIDescription(desc)

  return {
    id: makeTransactionId(bank, index, date),
    date,
    description: desc || 'Transaction',
    amount,
    type,
    balance: balance || null,
    bank,
    rawText: line,
    category: 'others',
  }
}

function cleanSBIDescription(desc) {
  if (!desc) return ''
  // Remove value date portion (second date in line)
  desc = desc.replace(/\d{2}\s+[A-Za-z]{3}\s+\d{4}/g, '').trim()

  // Remove ref/cheque numbers (standalone long alphanumeric codes)
  desc = desc.replace(/\b[A-Z]{3,}\d{6,}\b/g, '').trim()

  // Extract last meaningful segment after slashes or tabs
  const parts = desc.split(/[\/\\]/)
  const meaningful = parts.filter(p => p.trim().length > 3)
  if (meaningful.length > 0) {
    desc = meaningful[meaningful.length - 1].trim()
  }

  return cleanDescription(desc)
}
