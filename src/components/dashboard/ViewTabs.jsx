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
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ background: 'rgb(var(--sw-bg-tertiary))', border: '1px solid rgb(var(--sw-border-soft))' }}
      role="tablist"
      aria-label="Dashboard views"
    >
      {VIEWS.map(view => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          role="tab"
          aria-pressed={activeView === view.id}
          className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            activeView === view.id
              ? 'bg-bg-secondary text-text-primary shadow-sm border border-border-soft'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60'
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
