import { parseHDFC } from './hdfc.js'
import { parseICICI } from './icici.js'
import { parseSBI } from './sbi.js'
import { parseAxis } from './axis.js'
import { detectBankFromText } from '../constants/banks.js'

/**
 * Auto-detect bank and route to the correct parser
 * 
 * @param {string} text - Full extracted text from PDF
 * @param {string|null} forcedBank - If user manually selected a bank, use this
 * @returns {{ bank: string, result: ParseResult }}
 */
export function parseStatement(text, forcedBank = null) {
  const bank = forcedBank || detectBankFromText(text)

  let result
  switch (bank) {
    case 'hdfc':
      result = parseHDFC(text)
      break
    case 'icici':
      result = parseICICI(text)
      break
    case 'sbi':
      result = parseSBI(text)
      break
    case 'axis':
      result = parseAxis(text)
      break
    default:
      // Try all parsers, return the one with most transactions
      result = tryAllParsers(text)
  }

  return { bank: bank || 'unknown', result }
}

function tryAllParsers(text) {
  const parsers = [
    { fn: parseHDFC, name: 'hdfc' },
    { fn: parseICICI, name: 'icici' },
    { fn: parseSBI, name: 'sbi' },
    { fn: parseAxis, name: 'axis' },
  ]

  let best = { transactions: [], skippedLines: 0, totalLines: 0, accountNumber: null, period: null }
  for (const { fn } of parsers) {
    try {
      const result = fn(text)
      if (result.transactions.length > best.transactions.length) {
        best = result
      }
    } catch (_) { /* skip */ }
  }
  return best
}

/**
 * Detect bank from PDF text without parsing
 */
export function detectBank(text) {
  return detectBankFromText(text)
}
