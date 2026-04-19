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
    <div className="flex items-center gap-1 bg-bg-tertiary rounded-xl p-1">
      {VIEWS.map(view => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            activeView === view.id
              ? 'bg-bg-secondary text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
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
