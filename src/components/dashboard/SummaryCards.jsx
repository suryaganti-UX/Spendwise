import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, PiggyBank, Receipt } from 'lucide-react'
import { formatINR, formatINRCompact } from '../../utils/currency.js'
import { NumberCounter } from '../charts/NumberCounter.jsx'
import { Sparkline } from '../charts/Sparkline.jsx'

function SummaryCard({ title, value, sub, icon: Icon, color, formatter, sparkData, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative glass rounded-2xl p-5 overflow-hidden"
    >
      {/* Top glow line — signature dark-finance accent */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${color}90, transparent)` }}
        aria-hidden="true"
      />

      {/* Icon + sparkline row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
          aria-hidden="true"
        >
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        {sparkData && sparkData.length >= 2 && (
          <Sparkline data={sparkData} width={56} height={26} positive />
        )}
      </div>

      {/* Hero number — DM Serif Display */}
      <div
        className="font-display text-[2rem] leading-none mb-1.5 tabular-nums"
        style={{ color }}
        aria-label={`${title}: ${formatINR(typeof value === 'number' ? value : 0)}`}
      >
        {typeof value === 'number' ? (
          <NumberCounter
            value={value}
            formatter={formatter || formatINRCompact}
          />
        ) : value}
      </div>

      <p className="text-[10px] font-semibold text-text-hint uppercase tracking-[0.1em]">{title}</p>
      {sub && <p className="text-xs text-text-hint mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export function SummaryCards({ income, expenses, savings, transactionCount, creditCount, debitCount, daysCovered, savingsRate, dailyData }) {
  const incomeData = dailyData?.map(d => d.credit) || []
  const expenseData = dailyData?.map(d => d.debit) || []
  const savingsColor = savings >= 0 ? '#10B981' : '#EF4444'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Money In"
        value={income}
        sub={`${creditCount || 0} credits`}
        icon={TrendingUp}
        color="#10B981"
        delay={0}
        sparkData={incomeData.slice(-7)}
      />
      <SummaryCard
        title="Money Out"
        value={expenses}
        sub={`${debitCount || 0} debits`}
        icon={TrendingDown}
        color="#EF4444"
        delay={0.06}
        sparkData={expenseData.slice(-7)}
      />
      <SummaryCard
        title="Net Savings"
        value={Math.abs(savings)}
        sub={`${Math.round(savingsRate || 0)}% of income`}
        icon={PiggyBank}
        color={savingsColor}
        delay={0.12}
        formatter={(v) => (savings < 0 ? '−' : '') + formatINRCompact(v)}
      />
      <SummaryCard
        title="Transactions"
        value={transactionCount}
        sub={`${daysCovered || 0} days covered`}
        icon={Receipt}
        color="#8B5CF6"
        delay={0.18}
        formatter={(v) => Math.round(v).toLocaleString('en-IN')}
      />
    </div>
  )
}

