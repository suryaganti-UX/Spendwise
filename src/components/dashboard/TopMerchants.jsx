import React from 'react'
import { formatINR } from '../../utils/currency.js'
import { BankBadge } from '../ui/BankBadge.jsx'
import { getCategoryById } from '../../constants/categories.js'
import { getMerchantMeta } from '../../constants/merchants.js'
import { format } from 'date-fns'

export function TopMerchants({ merchants = [], largestExpenses = [], onTransactionClick }) {
  return (
    <div className="space-y-6">
      {/* Top merchants */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Where you spent most</h3>
        <div className="space-y-2">
          {merchants.slice(0, 6).map((merchant, i) => {
            const meta = getMerchantMeta(merchant.name)
            const cat = getCategoryById(merchant.category)

            return (
              <div key={i} className="flex items-center gap-3 py-1">
                {/* Rank + Avatar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-text-hint w-4 tabular-nums">{i + 1}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                  >
                    {meta.initial}
                  </div>
                </div>

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{merchant.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-2xs px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.color + '20', color: cat.color }}
                    >
                      {cat.emoji} {cat.label}
                    </span>
                    <span className="text-2xs text-text-hint">{merchant.count}×</span>
                  </div>
                </div>

                {/* Amount */}
                <span className="text-xs font-bold text-text-primary tabular-nums flex-shrink-0">
                  {formatINR(merchant.total)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Largest transactions */}
      {largestExpenses.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Biggest transactions</h3>
          <div className="space-y-2">
            {largestExpenses.slice(0, 3).map((txn) => {
              const cat = getCategoryById(txn.category)
              return (
                <button
                  key={txn.id}
                  onClick={() => onTransactionClick && onTransactionClick(txn.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-bg-tertiary transition-colors text-left group"
                  aria-label={`${txn.description}: ${formatINR(txn.amount)}`}
                >
                  <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{txn.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-2xs text-text-hint">{format(txn.date, 'dd MMM')}</span>
                      <BankBadge bankId={txn.bank} size="sm" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-negative tabular-nums flex-shrink-0">
                    -{formatINR(txn.amount)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
