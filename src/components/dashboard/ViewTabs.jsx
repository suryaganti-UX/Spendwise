import React from 'react'
import { BANKS } from '../../constants/banks.js'

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'by-bank', label: 'By Bank' },
  { id: 'by-month', label: 'By Month' },
  { id: 'transactions', label: 'Transactions' },
]

export function ViewTabs({ activeView, onViewChange, banks = [] }) {
  return (
    <div className="flex items-center gap-0.5 glass rounded-xl p-1">
      {VIEWS.map(view => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            activeView === view.id
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-hint hover:text-text-secondary hover:bg-bg-tertiary/50'
          }`}
          aria-pressed={activeView === view.id}
          role="tab"
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
