import React from 'react'
import { RefreshCw } from 'lucide-react'
import { formatINR } from '../../utils/currency.js'
import { getMerchantMeta } from '../../constants/merchants.js'

export function SubscriptionDetector({ subscriptions = [] }) {
  if (!subscriptions.length) return null

  const monthlyTotal = subscriptions
    .filter(s => s.frequency === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0)

  const annualTotal = subscriptions.reduce((sum, s) => sum + s.annualCost, 0)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">Recurring Charges Detected</h3>
      </div>

      <div className="space-y-2">
        {subscriptions.map((sub, i) => {
          const meta = getMerchantMeta(sub.merchant)
          return (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: meta.color }}
                aria-hidden="true"
              >
                {meta.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary">{sub.merchant}</p>
                <p className="text-2xs text-text-hint capitalize">{sub.category}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-text-primary tabular-nums">
                  {formatINR(sub.amount)}/{sub.frequency === 'monthly' ? 'mo' : 'yr'}
                </p>
                {sub.frequency === 'monthly' && (
                  <p className="text-2xs text-text-hint tabular-nums">{formatINR(sub.annualCost)}/year</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-3 border-t border-border-soft flex items-center justify-between">
        <span className="text-xs text-text-secondary">Total monthly subscriptions</span>
        <div className="text-right">
          <p className="text-sm font-bold text-text-primary tabular-nums">{formatINR(monthlyTotal)}/month</p>
          <p className="text-2xs text-text-hint tabular-nums">{formatINR(annualTotal)}/year</p>
        </div>
      </div>
    </div>
  )
}
