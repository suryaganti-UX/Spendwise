import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { DonutChart } from '../charts/DonutChart.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'
import { formatINR, formatINRCompact } from '../../utils/currency.js'
import { getMerchantMeta } from '../../constants/merchants.js'

const SHOW_LIMIT = 6

// Top 5 merchants within a category
function CategoryMerchants({ transactions = [] }) {
  const debit = transactions.filter(t => t.type === 'debit')
  const byMerchant = {}
  for (const txn of debit) {
    const raw = txn.description || 'Unknown'
    const name = raw.trim().split(/\s+/).slice(0, 2).join(' ')
    if (!byMerchant[name]) byMerchant[name] = { name, total: 0, count: 0 }
    byMerchant[name].total += txn.amount
    byMerchant[name].count++
  }
  const ranked = Object.values(byMerchant).sort((a, b) => b.total - a.total).slice(0, 5)
  if (!ranked.length) return <p className="text-xs text-text-hint py-2">No merchant data</p>

  return (
    <div className="space-y-1 mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[10px] font-semibold text-text-hint uppercase tracking-[0.1em] mb-2">Top merchants</p>
      {ranked.map((m, i) => {
        const meta = getMerchantMeta(m.name)
        return (
          <div key={m.name} className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: meta.color }}
              aria-hidden="true"
            >
              {meta.initial}
            </div>
            <span className="flex-1 text-xs text-text-secondary truncate">{m.name}</span>
            <span className="text-[10px] text-text-hint">{m.count}×</span>
            <span className="text-xs font-semibold text-text-primary tabular-nums flex-shrink-0">{formatINR(m.total)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function CategoryBreakdown({ categories = [], selectedCategory, onCategorySelect, totalIncome = 0 }) {
  const [showAll, setShowAll] = useState(false)
  const [expandedCat, setExpandedCat] = useState(null)

  const total = categories.reduce((s, c) => s + c.total, 0)
  const displayed = showAll ? categories : categories.slice(0, SHOW_LIMIT)

  const donutSegments = categories.map(c => ({
    label: c.label,
    value: c.total,
    color: c.color,
    percentage: c.percentage,
    category: c.category,
  }))

  function handleRowClick(cat) {
    onCategorySelect(cat.category)
    setExpandedCat(expandedCat === cat.category ? null : cat.category)
  }

  return (
    <div>
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
        {/* Custom legend */}
        <div className="flex-1 w-full space-y-1.5">
          {categories.slice(0, 8).map(cat => (
            <button
              key={cat.category}
              onClick={() => onCategorySelect(cat.category === selectedCategory ? null : cat.category)}
              className="w-full flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
              aria-pressed={selectedCategory === cat.category}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 text-xs text-text-secondary truncate">{cat.emoji} {cat.label}</span>
              <span className="text-xs font-semibold text-text-primary tabular-nums">{formatINR(cat.total)}</span>
              <span className="text-[10px] font-medium w-9 text-right" style={{ color: cat.color }}>
                {Math.round(cat.percentage)}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ranked category list with expand */}
      <div className="space-y-1.5">
        {displayed.map((cat, i) => {
          const isHighSpend = totalIncome > 0 && (cat.total / totalIncome) * 100 > 30
          const isExpanded = expandedCat === cat.category

          return (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => handleRowClick(cat)}
                className="w-full text-left p-3 rounded-xl transition-all duration-150"
                style={
                  isExpanded
                    ? { background: `${cat.color}08`, border: `1px solid ${cat.color}25` }
                    : { background: 'rgba(255,255,255,0.02)', border: '1px solid transparent' }
                }
                aria-expanded={isExpanded}
                aria-label={`${cat.label}: ${formatINR(cat.total)}, ${Math.round(cat.percentage)}% of total`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none" aria-hidden="true">{cat.emoji}</span>
                    <span className="text-xs font-medium text-text-primary">{cat.label}</span>
                    {isHighSpend && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <AlertTriangle className="w-2.5 h-2.5" />
                        High
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary tabular-nums">{formatINR(cat.total)}</span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: `${cat.color}15`, color: cat.color }}
                    >
                      {Math.round(cat.percentage)}%
                    </span>
                    {isExpanded
                      ? <ChevronUp className="w-3 h-3 text-text-hint" />
                      : <ChevronDown className="w-3 h-3 text-text-hint opacity-50" />
                    }
                  </div>
                </div>
                <ProgressBar value={cat.percentage} max={100} color={cat.color} height={3} />
              </button>

              {/* Merchant expand */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden px-3"
                  >
                    <CategoryMerchants transactions={cat.transactions || []} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {categories.length > SHOW_LIMIT && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs text-accent hover:underline w-full text-center py-1"
        >
          {showAll ? 'Show top 6' : `Show all ${categories.length} categories`}
        </button>
      )}
    </div>
  )
}
