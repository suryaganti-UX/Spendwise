import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, PiggyBank, X, AlertTriangle, Info,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts'
import { format } from 'date-fns'
import { formatINR, formatINRCompact } from '../../utils/currency.js'
import { generateNarrativeInsights } from '../../utils/analytics.js'
import { getMerchantMeta } from '../../constants/merchants.js'
import { NumberCounter } from '../charts/NumberCounter.jsx'

import { CategoryBreakdown } from './CategoryBreakdown.jsx'
import { TopMerchants } from './TopMerchants.jsx'
import { SpendingTrend } from './SpendingTrend.jsx'
import { InsightFeed } from './InsightFeed.jsx'
import { TransactionList } from './TransactionList.jsx'

// ─── Widget modal overlay ───────────────────────────────────────────────────
function WidgetModal({ title, onClose, wide, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className={`relative flex flex-col w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[88vh] rounded-2xl overflow-hidden z-10`}
        style={{ background: 'rgb(var(--sw-bg-secondary))', border: '1px solid rgb(var(--sw-border-soft))', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgb(var(--sw-border-soft))' }}
        >
          <h2 className="text-base font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Widget card wrapper ────────────────────────────────────────────────────
function WidgetCard({ title, onViewAll, className = '', children }) {
  return (
    <div className={`section-card h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.08em]">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-medium text-accent hover:underline transition-colors flex-shrink-0"
          >
            View all →
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// ─── Stat widget ────────────────────────────────────────────────────────────
function StatWidget({ label, value, sub, accentColor, bgColor, Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
      className="stat-card h-full flex flex-col gap-2.5"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-hint">{label}</p>
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ background: bgColor }}
          aria-hidden="true"
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
        </div>
      </div>
      <div
        className="font-bold text-[1.6rem] leading-none tabular-nums text-text-primary"
        aria-label={formatINR(value)}
      >
        <NumberCounter value={value} formatter={formatINRCompact} duration={900} />
      </div>
      {sub && (
        <p className="text-[11px] text-text-hint leading-snug">{sub}</p>
      )}
    </motion.div>
  )
}

// ─── Savings rate widget ─────────────────────────────────────────────────────
function SavingsWidget({ savings, savingsRate, delay = 0 }) {
  const isPositive = savings >= 0
  const rate = Math.min(100, Math.max(0, Math.round(savingsRate)))
  const color = rate >= 20 ? '#10B981' : rate >= 10 ? '#F59E0B' : '#EF4444'
  const healthLabel = rate >= 20 ? 'Healthy Saver' : rate >= 10 ? 'Watch Spending' : 'Needs Attention'
  const circumference = 2 * Math.PI * 14 // r=14

  const [animRate, setAnimRate] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimRate(rate), 350)
    return () => clearTimeout(t)
  }, [rate])

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
      className="stat-card h-full flex flex-col gap-2.5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-hint">Savings</p>
        {/* Animated ring */}
        <div className="relative w-9 h-9 flex-shrink-0" aria-hidden="true">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgb(var(--sw-border-soft))" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke={color} strokeWidth="3"
              strokeDasharray={`${(animRate / 100) * circumference} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1) 0.35s' }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums"
            style={{ color }}
          >
            {rate}%
          </span>
        </div>
      </div>
      <div
        className="font-bold text-[1.6rem] leading-none tabular-nums"
        style={{ color }}
        aria-label={`${isPositive ? 'Savings' : 'Deficit'} ${formatINR(Math.abs(savings))}`}
      >
        {isPositive ? '' : '−'}
        <NumberCounter value={Math.abs(savings)} formatter={formatINRCompact} duration={900} />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {healthLabel}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Trend mini widget ───────────────────────────────────────────────────────
function TrendMini({ dailyData }) {
  const data = useMemo(() =>
    dailyData.slice(-30).map(d => ({
      date: format(new Date(d.date), 'dd MMM'),
      spend: d.debit,
    })),
    [dailyData]
  )
  if (!data.length) return <p className="text-xs text-text-hint pt-4 text-center">No data</p>

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bento-spend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div
                  className="rounded-xl px-2.5 py-1.5 text-xs"
                  style={{ background: 'rgb(var(--sw-bg-secondary))', border: '1px solid rgb(var(--sw-border-soft))', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                >
                  <p className="text-text-hint mb-0.5">{label}</p>
                  <p className="font-semibold text-negative tabular-nums">{formatINR(payload[0].value)}</p>
                </div>
              )
            }}
          />
          <XAxis dataKey="date" hide />
          <Area
            type="monotone"
            dataKey="spend"
            name="Spend"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#bento-spend)"
            dot={false}
            activeDot={{ r: 3, fill: '#10B981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Categories mini widget ──────────────────────────────────────────────────
function CategoriesMini({ categories }) {
  const top = categories.slice(0, 5)
  const maxTotal = top[0]?.total || 1
  return (
    <div className="space-y-2.5 pt-0.5">
      {top.map(cat => (
        <div key={cat.category}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-text-secondary flex items-center gap-1">
              <span aria-hidden="true">{cat.emoji}</span>
              <span className="truncate max-w-[100px]">{cat.label}</span>
            </span>
            <span className="font-semibold tabular-nums text-text-primary">{formatINRCompact(cat.total)}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-bg-tertiary">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(cat.total / maxTotal) * 100}%`, background: cat.color || '#10B981' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Insights mini widget ────────────────────────────────────────────────────
function InsightsMini({ insights }) {
  const items = insights.slice(0, 3)
  if (!items.length) return <p className="text-xs text-text-hint">No insights yet</p>
  return (
    <div className="space-y-2">
      {items.map((ins, i) => (
        <div
          key={ins.type || i}
          className="flex items-start gap-2.5 p-2.5 rounded-xl"
          style={{ background: `${ins.color}08`, border: `1px solid ${ins.color}22` }}
        >
          <span className="text-base leading-none flex-shrink-0 mt-0.5" aria-hidden="true">{ins.icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-text-primary leading-snug">{ins.headline}</p>
            <p className="text-[12px] font-bold tabular-nums leading-tight mt-0.5" style={{ color: ins.color }}>{ins.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Merchants mini widget ───────────────────────────────────────────────────
function MerchantsMini({ merchants }) {
  const top = merchants.slice(0, 4)
  return (
    <div className="space-y-2">
      {top.map(m => {
        const meta = getMerchantMeta(m.name)
        return (
          <div key={m.name} className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: meta.color }}
              aria-hidden="true"
            >
              {meta.initial}
            </div>
            <span className="flex-1 text-[11px] text-text-primary truncate">{m.name}</span>
            <span className="text-[11px] text-text-hint flex-shrink-0">{m.count}×</span>
            <span className="text-[11px] font-semibold tabular-nums text-negative flex-shrink-0">{formatINRCompact(m.total)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Recent transactions mini widget ────────────────────────────────────────
function RecentTxnsMini({ transactions }) {
  const recent = useMemo(() =>
    transactions.filter(t => t.type === 'debit').slice(0, 5),
    [transactions]
  )
  if (!recent.length) return <p className="text-xs text-text-hint">No transactions</p>
  return (
    <div className="space-y-1.5">
      {recent.map(txn => (
        <div key={txn.id} className="flex items-center gap-2 justify-between">
          <span className="text-[11px] text-text-secondary truncate">{txn.description}</span>
          <span className="text-[11px] font-semibold tabular-nums text-negative flex-shrink-0">{formatINRCompact(txn.amount)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main BentoDashboard ─────────────────────────────────────────────────────
export function BentoDashboard({
  income,
  expenses,
  savings,
  savingsRate,
  transactionCount,
  creditCount,
  debitCount,
  daysCovered,
  shortPeriod,
  duplicates,
  categories,
  merchants,
  largestExpenses,
  dailyData,
  monthlyData,
  activeTransactions,
  statements,
  availableMonths,
  subscriptions,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onRecategorize,
  recurringIds,
}) {
  const [modal, setModal] = useState(null)

  const narrativeInsights = useMemo(
    () => generateNarrativeInsights(activeTransactions, monthlyData),
    [activeTransactions, monthlyData]
  )

  const openModal = (id) => setModal(id)
  const closeModal = () => setModal(null)

  // ─── Edge case: no transactions ──────────────────────────────────────────
  if (transactionCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">No transactions found</h3>
        <p className="text-sm text-text-hint">Try selecting a different month or uploading another statement.</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Edge-case banners ── */}
      <div className="space-y-2 mb-4">
        {shortPeriod && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-semibold">Short period ({daysCovered} days) —</span> insights may be limited.
            </p>
          </div>
        )}
        {duplicates?.count > 0 && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}
          >
            <Info className="w-4 h-4 text-negative flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              <span className="font-semibold">{duplicates.count} possible duplicate{duplicates.count > 1 ? 's' : ''}</span> detected — amounts may be slightly overstated.
            </p>
          </div>
        )}
      </div>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── Row 1: Stat cards ── */}
        <div className="col-span-12 sm:col-span-4">
          <StatWidget
            label="Total Income"
            value={income}
            sub={`${creditCount} credit${creditCount !== 1 ? 's' : ''}`}
            accentColor="#10B981"
            bgColor="rgba(16,185,129,0.1)"
            Icon={TrendingUp}
            delay={0}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatWidget
            label="Total Spends"
            value={expenses}
            sub={`${debitCount} debit${debitCount !== 1 ? 's' : ''}`}
            accentColor="#EF4444"
            bgColor="rgba(239,68,68,0.1)"
            Icon={TrendingDown}
            delay={0.06}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <SavingsWidget savings={savings} savingsRate={savingsRate} delay={0.12} />
        </div>

        {/* ── Row 2: Charts ── */}
        <div className="col-span-12 lg:col-span-7 h-[220px]">
          <WidgetCard title="Spending Trend" onViewAll={() => openModal('trend')}>
            <TrendMini dailyData={dailyData} />
          </WidgetCard>
        </div>
        <div className="col-span-12 lg:col-span-5 h-[220px]">
          <WidgetCard title="Top Categories" onViewAll={() => openModal('categories')}>
            <CategoriesMini categories={categories} />
          </WidgetCard>
        </div>

        {/* ── Row 3: Lists ── */}
        <div className="col-span-12 lg:col-span-4 h-[200px]">
          <WidgetCard title="Key Insights" onViewAll={() => openModal('insights')}>
            <InsightsMini insights={narrativeInsights} />
          </WidgetCard>
        </div>
        <div className="col-span-12 lg:col-span-4 h-[200px]">
          <WidgetCard title="Top Merchants" onViewAll={() => openModal('merchants')}>
            <MerchantsMini merchants={merchants} />
          </WidgetCard>
        </div>
        <div className="col-span-12 lg:col-span-4 h-[200px]">
          <WidgetCard title="Recent Transactions" onViewAll={() => openModal('transactions')}>
            <RecentTxnsMini transactions={activeTransactions} />
          </WidgetCard>
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal === 'trend' && (
          <WidgetModal title="Spending Trend" onClose={closeModal} wide>
            <SpendingTrend dailyData={dailyData} categories={categories} />
          </WidgetModal>
        )}
        {modal === 'categories' && (
          <WidgetModal title="Spending by Category" onClose={closeModal}>
            <CategoryBreakdown
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={onCategorySelect}
              totalIncome={income}
            />
          </WidgetModal>
        )}
        {modal === 'insights' && (
          <WidgetModal title="Key Insights" onClose={closeModal} wide>
            <InsightFeed insights={narrativeInsights} />
          </WidgetModal>
        )}
        {modal === 'merchants' && (
          <WidgetModal title="Top Merchants" onClose={closeModal}>
            <TopMerchants
              merchants={merchants}
              transactions={activeTransactions}
              largestExpenses={largestExpenses}
            />
          </WidgetModal>
        )}
        {modal === 'transactions' && (
          <WidgetModal title="All Transactions" onClose={closeModal} wide>
            <TransactionList
              transactions={activeTransactions}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              selectedCategory={selectedCategory}
              onCategorySelect={onCategorySelect}
              typeFilter={typeFilter}
              onTypeFilterChange={onTypeFilterChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              onRecategorize={onRecategorize}
            />
          </WidgetModal>
        )}
      </AnimatePresence>
    </>
  )
}
