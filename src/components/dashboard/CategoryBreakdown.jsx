import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { DonutChart } from '../charts/DonutChart.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'
import { formatINR, formatINRCompact } from '../../utils/currency.js'
import { AlertTriangle } from 'lucide-react'

const SHOW_LIMIT = 6

export function CategoryBreakdown({ categories = [], selectedCategory, onCategorySelect, totalIncome = 0 }) {
  const [showAll, setShowAll] = useState(false)

  const total = categories.reduce((s, c) => s + c.total, 0)
  const displayed = showAll ? categories : categories.slice(0, SHOW_LIMIT)

  const donutSegments = categories.map(c => ({
    label: c.label,
    value: c.total,
    color: c.color,
    percentage: c.percentage,
    category: c.category,
  }))

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Spending by Category</h3>

      {/* Donut chart */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-5">
        <DonutChart
          segments={donutSegments}
          size={180}
          centerLabel={formatINRCompact(total)}
          centerSubLabel="total spend"
          onSegmentClick={onCategorySelect}
          selectedSegment={selectedCategory}
        />

        {/* Legend - 2 col on mobile */}
        <div className="flex-1 w-full grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {categories.slice(0, 8).map(cat => (
            <button
              key={cat.category}
              onClick={() => onCategorySelect(cat.category)}
              className={`flex items-center gap-1.5 text-left hover:opacity-80 transition-opacity ${selectedCategory === cat.category ? 'opacity-100 font-semibold' : 'opacity-75'}`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="truncate text-text-secondary">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {displayed.map((cat, i) => {
          const isHighSpend = totalIncome > 0 && (cat.total / totalIncome) * 100 > 30
          const isSelected = selectedCategory === cat.category

          return (
            <motion.button
              key={cat.category}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onCategorySelect(cat.category)}
              className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 ${
                isSelected
                  ? 'bg-accent-light border border-accent/20'
                  : 'hover:bg-bg-tertiary'
              }`}
              aria-pressed={isSelected}
              aria-label={`${cat.label}: ${formatINR(cat.total)}, ${Math.round(cat.percentage)}% of total`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none" aria-hidden="true">{cat.emoji}</span>
                  <span className="text-xs font-medium text-text-primary">{cat.label}</span>
                  {isHighSpend && (
                    <span className="flex items-center gap-0.5 text-warning bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full text-2xs font-medium">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      High
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary tabular-nums">{formatINR(cat.total)}</span>
                  <span
                    className="text-2xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: cat.color + '15', color: cat.color }}
                  >
                    {Math.round(cat.percentage)}%
                  </span>
                </div>
              </div>
              <ProgressBar value={cat.percentage} max={100} color={cat.color} height={3} />
            </motion.button>
          )
        })}
      </div>

      {categories.length > SHOW_LIMIT && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-accent hover:underline w-full text-center py-1"
        >
          {showAll ? 'Show top 6' : `Show all ${categories.length} categories`}
        </button>
      )}

      {/* Savings rate warning */}
      {totalIncome > 0 && (total / totalIncome) > 0.9 && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
          <span className="font-semibold">Your savings rate is low this month.</span>{' '}
          Consider reviewing your top 3 expense categories.
        </div>
      )}
    </div>
  )
}
