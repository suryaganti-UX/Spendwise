import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, PiggyBank, CalendarDays } from 'lucide-react'
import { NumberCounter } from '../charts/NumberCounter.jsx'
import { formatINR, formatINRCompact } from '../../utils/currency.js'

// ─── Savings Health Arc ───────────────────────────────────────────────────────
function SavingsArc({ rate = 0 }) {
  const [progress, setProgress] = useState(0)
  const r = 72
  const circumference = Math.PI * r // ≈ 226.2
  const filled = (progress / 100) * circumference

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
        width="200"
        height="110"
        aria-label={`Savings rate: ${Math.round(rate)}%. ${healthLabel}`}
        role="img"
      >
        {/* Background track — top semicircle (M left A rx ry ... sweep=0 M right) */}
        <path
          d="M 28 100 A 72 72 0 0 0 172 100"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Colored fill — animates via CSS transition on stroke-dasharray */}
        <path
          d="M 28 100 A 72 72 0 0 0 172 100"
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{
            transition: 'stroke-dasharray 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.35s',
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
        {/* Axis labels */}
        <text x="22" y="114" fontSize="9" fill="rgba(255,255,255,0.25)" textAnchor="middle">0%</text>
        <text x="178" y="114" fontSize="9" fill="rgba(255,255,255,0.25)" textAnchor="middle">100%</text>
      </svg>

      {/* Centered label over the arc */}
      <div className="absolute flex flex-col items-center" style={{ top: 44 }}>
        <span
          className="font-display text-[2.2rem] leading-none tabular-nums"
          style={{ color }}
        >
          {Math.round(rate)}
        </span>
        <span className="text-[9px] font-semibold text-text-hint uppercase tracking-[0.12em] mt-1">
          / 100
        </span>
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function HeroStatCard({ title, value, sub, icon: Icon, color, formatter, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl p-5 overflow-hidden flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top glow line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }}
        aria-hidden="true"
      />
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
        style={{ background: `${color}18` }}
        aria-hidden="true"
      >
        <Icon className="w-[18px] h-[18px]" style={{ color }} />
      </div>
      <div
        className="font-display text-[1.9rem] leading-none mb-1.5 tabular-nums"
        style={{ color }}
        aria-label={`${title}: ${formatINR(typeof value === 'number' ? value : 0)}`}
      >
        {typeof value === 'number' ? (
          <NumberCounter value={value} formatter={formatter || formatINRCompact} />
        ) : value}
      </div>
      <p className="text-[10px] font-semibold text-text-hint uppercase tracking-[0.1em]">{title}</p>
      {sub && <p className="text-xs text-text-hint mt-0.5">{sub}</p>}
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

  // Build statement period chip text
  const bankLabels = [...new Set(statements.map(s => s.bankLabel).filter(Boolean))]
  const period = availableMonths.length > 1
    ? `${availableMonths[0]} – ${availableMonths[availableMonths.length - 1]}`
    : availableMonths[0] || 'All time'
  const chipText = [bankLabels.slice(0, 2).join(', '), period, `${transactionCount} transactions`]
    .filter(Boolean).join(' · ')

  const microInsight = income > 0
    ? savings >= 0
      ? `You saved ${formatINR(savings)} this period`
      : `You overspent by ${formatINR(Math.abs(savings))} this period`
    : null

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-7 lg:p-10"
      style={{
        background: 'linear-gradient(135deg, rgba(10,15,30,0.95) 0%, rgba(17,24,39,0.90) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 12px 80px rgba(0,0,0,0.4)',
      }}
    >
      {/* Ambient glow top-left */}
      <div
        className="absolute top-0 left-0 w-96 h-56 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(16,185,129,0.12) 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      {/* Ambient glow bottom-right */}
      <div
        className="absolute bottom-0 right-0 w-72 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(99,102,241,0.08) 0%, transparent 60%)' }}
        aria-hidden="true"
      />

      <div className="relative">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[10px] font-semibold text-accent uppercase tracking-[0.18em] mb-5"
        >
          Your month at a glance
        </motion.p>

        {/* 3 stat cards — 2-col on mobile (income+spends), savings full-width below; 3-col from sm */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 [&>*:last-child]:col-span-2 [&>*:last-child]:sm:col-span-1">
          <HeroStatCard
            title="Total Income"
            value={income}
            sub={`${creditCount} credits`}
            icon={TrendingUp}
            color="#10B981"
            delay={0}
          />
          <HeroStatCard
            title="Total Spends"
            value={expenses}
            sub={`${debitCount} debits`}
            icon={TrendingDown}
            color="#EF4444"
            delay={0.07}
          />
          <HeroStatCard
            title="Net Savings"
            value={Math.abs(savings)}
            sub={`${Math.round(savingsRate)}% of income`}
            icon={PiggyBank}
            color={savingsColor}
            delay={0.14}
            formatter={(v) => (savings < 0 ? '−' : '') + formatINRCompact(v)}
          />
        </div>

        {/* Statement period chip */}
        {chipText && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="flex items-center gap-2 mb-8"
          >
            <CalendarDays className="w-3.5 h-3.5 text-text-hint flex-shrink-0" />
            <span
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
            >
              {chipText}
            </span>
          </motion.div>
        )}

        {/* Savings arc + micro insight */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <SavingsArc rate={Math.min(100, Math.max(0, Math.round(savingsRate)))} />
          </motion.div>
          {microInsight && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="mt-2 text-sm text-text-secondary font-medium text-center"
            >
              {microInsight}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  )
}
