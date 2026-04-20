import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronRight } from 'lucide-react'
import { formatINR } from '../../utils/currency.js'
import { getCategoryById } from '../../constants/categories.js'
import { getMerchantMeta } from '../../constants/merchants.js'
import { getMerchantMonthlyTrend } from '../../utils/analytics.js'
import { Sparkline } from '../charts/Sparkline.jsx'

export function TopMerchants({ merchants = [], transactions = [], largestExpenses = [], onTransactionClick, onViewAll }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const list = merchants.slice(0, 10)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(m => m.name.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q))
  }, [merchants, search])

  const sparklines = useMemo(() => {
    const map = {}
    for (const m of merchants.slice(0, 10)) {
      map[m.name] = getMerchantMonthlyTrend(transactions, m.name)
    }
    return map
  }, [merchants, transactions])

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-hint" aria-hidden="true" />
        <input
          type="search"
          placeholder="Filter merchants…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-8 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'inherit' }}
          aria-label="Filter merchants"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-hint hover:text-text-primary"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Ranked list */}
      <div className="space-y-1">
        <AnimatePresence>
          {filtered.map((merchant, i) => {
            const meta = getMerchantMeta(merchant.name)
            const cat = getCategoryById(merchant.category)
            const spark = sparklines[merchant.name] || []
            const hasSparkline = spark.length >= 2

            return (
              <motion.div
                key={merchant.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-default"
                style={{ background: 'rgba(255,255,255,0.02)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              >
                {/* Rank */}
                <span
                  className="text-xs font-bold w-5 text-right flex-shrink-0 tabular-nums"
                  style={{ color: i < 3 ? '#F59E0B' : 'rgba(255,255,255,0.25)' }}
                >
                  {i + 1}
                </span>

                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                  style={{ background: meta.color }}
                  aria-hidden="true"
                >
                  {meta.initial}
                </div>

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{merchant.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${cat.color}18`, color: cat.color }}
                    >
                      {cat.emoji} {cat.label}
                    </span>
                    <span className="text-[10px] text-text-hint">{merchant.count}×</span>
                  </div>
                </div>

                {/* Sparkline */}
                {hasSparkline && (
                  <div className="flex-shrink-0">
                    <Sparkline data={spark.slice(-3)} width={40} height={20} positive={false} />
                  </div>
                )}

                {/* Amount */}
                <span className="text-xs font-bold text-text-primary tabular-nums flex-shrink-0">
                  {formatINR(merchant.total)}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* See all CTA */}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-accent transition-all"
          style={{ border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.05)' }}
        >
          See all transactions
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
