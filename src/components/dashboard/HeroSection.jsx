import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, PiggyBank, CalendarDays, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { NumberCounter } from '../charts/NumberCounter.jsx'
import { formatINR, formatINRCompact } from '../../utils/currency.js'

// ─── Savings Health Arc ───────────────────────────────────────────────────────
function SavingsArc({ rate = 0 }) {
  const [progress, setProgress] = useState(0)
  const r = 72
  const circumference = Math.PI * r // ≈ 226.2
  const filled = Math.max(0.001, (progress / 100) * circumference)

  // Color thresholds
  const color = rate >= 20 ? '#10B981' : rate >= 10 ? '#F59E0B' : '#EF4444'
  const healthLabel = rate >= 20 ? 'Healthy Saver' : rate >= 10 ? 'Watch Spending' : 'Needs Attention'

  // Animate in after mount
  useEffect(() => {
    const t = setTimeout(() => setProgress(rate), 350)
    return () => clearTimeout(t)
  }, [rate])

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg
        viewBox="0 0 200 110"
        width="180"
        height="99"
        aria-label={`Savings rate: ${Math.round(rate)}%. ${healthLabel}`}
        role="img"
      >
        {/* Background track */}
        <path
          d="M 28 100 A 72 72 0 0 0 172 100"
          fill="none"
          stroke="currentColor"
          className="text-border-medium"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Colored fill */}
        <path
          d="M 28 100 A 72 72 0 0 0 172 100"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{
            transition: 'stroke-dasharray 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.35s',
            filter: `drop-shadow(0 0 5px ${color}50)`,
          }}
        />
        <text x="22" y="114" fontSize="8" fill="currentColor" className="fill-text-hint" textAnchor="middle">0%</text>
        <text x="178" y="114" fontSize="8" fill="currentColor" className="fill-text-hint" textAnchor="middle">100%</text>
      </svg>

      {/* Centered label over the arc */}
      <div className="absolute flex flex-col items-center" style={{ top: 36 }}>
        <span className="font-bold text-[1.75rem] leading-none tabular-nums" style={{ color }}>
          {Math.round(rate)}
        </span>
        <span className="text-[9px] font-semibold text-text-hint uppercase tracking-widest mt-0.5">/ 100</span>
        <span
          className="text-[10px] font-semibold mt-1.5 px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {healthLabel}
        </span>
      </div>
    </div>
  )
}

// ─── Fintech Stat Card — inspired by Sakuku colored metric cards ──────────────
function HeroStatCard({ title, value, sub, icon: Icon, accentColor, bgColor, borderColor, formatter, delay = 0, prefix = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="stat-card flex flex-col gap-3"
    >
      {/* Top row: icon chip + trend indicator */}
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: bgColor }}
          aria-hidden="true"
        >
          <Icon className="w-[17px] h-[17px]" style={{ color: accentColor }} />
        </div>
        {/* Colored accent dot — matches Sakuku top bar stripe */}
        <div className="w-2 h-2 rounded-full mt-1" style={{ background: accentColor }} aria-hidden="true" />
      </div>

      {/* Value */}
      <div>
        <p className="text-[10px] font-semibold text-text-hint uppercase tracking-[0.1em] mb-1">{title}</p>
        <div
          className="font-bold text-[1.6rem] leading-none tabular-nums text-text-primary"
          aria-label={`${title}: ${formatINR(typeof value === 'number' ? value : 0)}`}
        >
          {prefix}
          {typeof value === 'number' ? (
            <NumberCounter value={value} formatter={formatter || formatINRCompact} />
          ) : value}
        </div>
      </div>

      {/* Sub label with colored accent bar */}
      {sub && (
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-0.5 rounded-full" style={{ background: accentColor }} aria-hidden="true" />
          <p className="text-xs text-text-secondary">{sub}</p>
        </div>
      )}
    </motion.div>
  )
}

// ─── HeroSection ─────────────────────────────────────────────────────────────
export function HeroSection({
  income,
  expenses,
  savings,
  savingsRate,
  transactionCount,
  creditCount,
  debitCount,
  statements = [],
  availableMonths = [],
}) {
  const savingsColor = savings >= 0 ? '#10B981' : '#EF4444'
  const savingsPositive = savings >= 0

  // Build statement period chip text
  const bankLabels = [...new Set(statements.map(s => s.bankLabel).filter(Boolean))]
  const period = availableMonths.length > 1
    ? `${availableMonths[0]} – ${availableMonths[availableMonths.length - 1]}`
    : availableMonths[0] || 'All time'
  const chipText = [bankLabels.slice(0, 2).join(', '), period].filter(Boolean).join(' · ')

  return (
    <div className="space-y-4">
      {/* Period chip */}
      {chipText && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <CalendarDays className="w-3.5 h-3.5 text-text-hint flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-text-secondary">{chipText}</span>
          <span className="text-text-hint text-xs">·</span>
          <span className="text-xs text-text-hint">{transactionCount} transactions</span>
        </motion.div>
      )}

      {/* 3 Colored stat cards in a row — Sakuku style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HeroStatCard
          title="Total Income"
          value={income}
          sub={`${creditCount} credits`}
          icon={TrendingUp}
          accentColor="#10B981"
          bgColor="rgba(16,185,129,0.1)"
          delay={0}
        />
        <HeroStatCard
          title="Total Spends"
          value={expenses}
          sub={`${debitCount} debits`}
          icon={TrendingDown}
          accentColor="#EF4444"
          bgColor="rgba(239,68,68,0.1)"
          delay={0.07}
        />
        <HeroStatCard
          title="Net Savings"
          value={Math.abs(savings)}
          sub={`${Math.round(savingsRate)}% of income`}
          icon={PiggyBank}
          accentColor={savingsColor}
          bgColor={savings >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}
          delay={0.14}
          prefix={savings < 0 ? '−' : ''}
        />
      </div>

      {/* Savings arc */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-center pt-2"
      >
        <SavingsArc rate={Math.min(100, Math.max(0, Math.round(savingsRate)))} />
      </motion.div>
    </div>
  )
}
