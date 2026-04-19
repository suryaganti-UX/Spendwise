import React from 'react'
import { BANKS } from '../../constants/banks.js'

export function BankBadge({ bankId, size = 'sm', showLabel = true, className = '' }) {
  const bank = BANKS[bankId]
  if (!bank) return null

  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeCls} ${className}`}
      style={{ backgroundColor: bank.lightColor, color: bank.color, border: `1px solid ${bank.color}30` }}
    >
      <span style={{ color: bank.color }}>●</span>
      {showLabel && bank.shortLabel}
    </span>
  )
}
