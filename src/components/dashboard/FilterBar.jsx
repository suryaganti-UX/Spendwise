import React from 'react'
import { X } from 'lucide-react'
import { BANKS } from '../../constants/banks.js'

export function FilterBar({
  availableBanks = [],
  availableMonths = [],
  selectedBanks = [],
  selectedMonths = [],
  onToggleBank,
  onToggleMonth,
  includeTransfers,
  onToggleTransfers,
}) {
  const hasBanks = availableBanks.length > 1
  const hasMonths = availableMonths.length > 1

  if (!hasBanks && !hasMonths) return null

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Bank pills */}
      {hasBanks && availableBanks.map(bankId => {
        const bank = BANKS[bankId]
        if (!bank) return null
        const isOff = selectedBanks.includes(bankId)
        return (
          <button
            key={bankId}
            onClick={() => onToggleBank(bankId)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-150 ${
              isOff
                ? 'border-border-soft text-text-hint bg-bg-secondary opacity-60'
                : 'border-transparent'
            }`}
            style={!isOff ? {
              backgroundColor: bank.lightColor,
              color: bank.color,
              borderColor: bank.color + '40',
            } : {}}
            aria-pressed={!isOff}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isOff ? '#A8A49F' : bank.color }} />
            {bank.shortLabel}
          </button>
        )
      })}

      {/* Month pills */}
      {hasMonths && (
        <div className="flex items-center gap-1 flex-wrap">
          {availableMonths.map(month => {
            const isOff = selectedMonths.includes(month)
            return (
              <button
                key={month}
                onClick={() => onToggleMonth(month)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-150 ${
                  isOff
                    ? 'border-border-soft text-text-hint bg-bg-secondary opacity-60'
                    : 'border-accent/30 text-accent bg-accent-light'
                }`}
                aria-pressed={!isOff}
              >
                {month}
              </button>
            )
          })}
        </div>
      )}

      {/* Include transfers toggle */}
      {onToggleTransfers && (
        <button
          onClick={onToggleTransfers}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-all duration-150 ${
            includeTransfers
              ? 'border-accent/30 text-accent bg-accent-light'
              : 'border-border-soft text-text-hint bg-bg-secondary'
          }`}
        >
          {includeTransfers ? '↔ Transfers included' : '↔ Exclude transfers'}
        </button>
      )}
    </div>
  )
}
