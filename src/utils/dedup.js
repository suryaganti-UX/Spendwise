/**
 * Cross-bank duplicate detection
 * Detects internal transfers between user's own accounts
 */

const TRANSFER_KEYWORDS = [
  'neft', 'imps', 'rtgs', 'transfer', 'sent to', 'received from',
  'own account', 'self transfer', 'upi', 'fund transfer',
]

function isTransferDescription(desc) {
  const lower = (desc || '').toLowerCase()
  return TRANSFER_KEYWORDS.some(kw => lower.includes(kw))
}

function datesAreClose(d1, d2, toleranceDays = 1) {
  const diff = Math.abs(d1.getTime() - d2.getTime())
  return diff <= toleranceDays * 24 * 60 * 60 * 1000
}

/**
 * Detect cross-bank transfers between multiple statements
 * Returns a Set of transaction IDs flagged as cross-bank transfers
 * 
 * @param {Statement[]} statements - array of parsed statements
 * @returns {{ flaggedIds: Set<string>, transfers: CrossBankTransfer[] }}
 */
export function detectCrossBankTransfers(statements) {
  if (!statements || statements.length < 2) {
    return { flaggedIds: new Set(), transfers: [] }
  }

  const flaggedIds = new Set()
  const transfers = []

  // Gather all transactions grouped by bank
  const byBank = {}
  for (const stmt of statements) {
    if (!byBank[stmt.bank]) byBank[stmt.bank] = []
    byBank[stmt.bank].push(...(stmt.transactions || []))
  }

  const banks = Object.keys(byBank)

  // For each pair of different banks
  for (let i = 0; i < banks.length; i++) {
    for (let j = i + 1; j < banks.length; j++) {
      const bankA = banks[i]
      const bankB = banks[j]
      const txnsA = byBank[bankA]
      const txnsB = byBank[bankB]

      // Find matching debit/credit pairs
      for (const txnA of txnsA) {
        for (const txnB of txnsB) {
          // Skip if already flagged
          if (flaggedIds.has(txnA.id) || flaggedIds.has(txnB.id)) continue

          // One must be debit, other must be credit
          const isOpposite = (txnA.type === 'debit' && txnB.type === 'credit') ||
                            (txnA.type === 'credit' && txnB.type === 'debit')

          if (!isOpposite) continue

          // Same amount
          if (Math.abs(txnA.amount - txnB.amount) > 1) continue

          // Dates within 1 day
          if (!datesAreClose(txnA.date, txnB.date, 1)) continue

          // At least one looks like a transfer
          if (!isTransferDescription(txnA.description) && !isTransferDescription(txnB.description)) continue

          const debitTxn = txnA.type === 'debit' ? txnA : txnB
          const creditTxn = txnA.type === 'credit' ? txnA : txnB

          flaggedIds.add(debitTxn.id)
          flaggedIds.add(creditTxn.id)

          transfers.push({
            id: `transfer_${debitTxn.id}_${creditTxn.id}`,
            date: debitTxn.date,
            amount: debitTxn.amount,
            fromBank: debitTxn.bank,
            toBank: creditTxn.bank,
            debitTransactionId: debitTxn.id,
            creditTransactionId: creditTxn.id,
            description: debitTxn.description,
          })
        }
      }
    }
  }

  return { flaggedIds, transfers }
}

/**
 * Detect duplicate transactions within a single statement
 * (same date + amount + description)
 * Returns a Set of IDs to remove (keeps first occurrence)
 */
export function detectIntraStatementDuplicates(transactions) {
  const seen = new Set()
  const duplicateIds = new Set()

  for (const txn of transactions) {
    const key = `${txn.date.toDateString()}_${txn.amount}_${txn.type}_${txn.description.substring(0, 30)}`
    if (seen.has(key)) {
      duplicateIds.add(txn.id)
    } else {
      seen.add(key)
    }
  }

  return duplicateIds
}
