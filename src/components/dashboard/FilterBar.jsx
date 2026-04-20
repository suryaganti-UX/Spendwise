import React from 'react'
import { BANKS } from '../../constants/banks.js'

// Format an array of "MMM yyyy" month strings into a compact label.
// Same-year groups are collapsed: ["Jan 2025","Feb 2025","Mar 2025"] → "Jan · Feb · Mar 2025"
// 4+ months same year → range: "Jan–Apr 2025"
// Cross-year → "Dec 2024 · Jan 2025"
function formatMonthRange(months) {
  if (!months || months.length === 0) return ''
  if (months.length === 1) return months[0]

  const sorted = [...months].sort((a, b) => new Date(a) - new Date(b))

  // Group by year
  const byYear = {}
  for (const m of sorted) {
    const [mon, yr] = m.split(' ')
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(mon)
  }

  const parts = Object.entries(byYear).map(([yr, mons]) => {
    if (mons.length === 1) return `${mons[0]} ${yr}`
    if (mons.length <= 3) return `${mons.join(' · ')} ${yr}`
    return `${mons[0]}–${mons[mons.length - 1]} ${yr}`
  })

  return parts.join(' / ')
}

export function FilterBar({
  statements = [],
  selectedStatements = [],
  onToggleStatement,
  includeTransfers,
  onToggleTransfers,
}) {
  // Only show pills for successfully parsed statements
  const parsedStatements = statements.filter(s => s.parseStatus === 'done' && s.bank)

  // Nothing to filter if there's only one (or zero) parsed statements
  const showPills = parsedStatements.length > 1

  if (!showPills && !onToggleTransfers) return null

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {showPills && parsedStatements.map(stmt => {
        const bank = BANKS[stmt.bank]
        const isOff = selectedStatements.includes(stmt.id)
        const monthLabel = formatMonthRange(stmt.months || [])
        const label = bank ? `${bank.shortLabel}${monthLabel ? ` · ${monthLabel}` : ''}` : monthLabel || stmt.filename

        return (
          <button
            key={stmt.id}
            onClick={() => onToggleStatement?.(stmt.id)}
            title={isOff ? `Click to include ${label}` : `Click to hide ${label}`}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-150 ${
              isOff
                ? 'border-border-soft text-text-hint bg-bg-secondary opacity-50'
                : 'border-transparent'
            }`}
            style={!isOff && bank ? {
              backgroundColor: bank.lightColor,
              color: bank.color,
              borderColor: bank.color + '40',
            } : !isOff ? {
              backgroundColor: 'rgb(var(--sw-accent-light))',
              color: 'rgb(var(--sw-accent))',
              borderColor: 'rgba(16,185,129,0.25)',
            } : {}}
            aria-pressed={!isOff}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: isOff ? '#6B7280' : (bank?.color ?? 'rgba(255,255,255,0.5)') }}
            />
            {label}
          </button>
        )
      })}

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
