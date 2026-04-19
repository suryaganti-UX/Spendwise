import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, PiggyBank, Receipt } from 'lucide-react'
import { formatINR, formatINRCompact } from '../../utils/currency.js'
import { NumberCounter } from '../charts/NumberCounter.jsx'
import { Sparkline } from '../charts/Sparkline.jsx'

function SummaryCard({ title, value, sub, icon: Icon, iconColor, borderColor, formatter, sparkData, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-bg-secondary border border-border-soft rounded-2xl p-5 hover:shadow-card hover:-translate-y-px transition-all duration-200"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconColor + '15' }}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {sparkData && sparkData.length >= 2 && (
          <Sparkline data={sparkData} width={60} height={28} positive={true} />
        )}
      </div>

      <div
        className="text-2xl font-bold tabular-nums leading-none mb-1"
        style={{ color: borderColor }}
        aria-label={`${title}: ${formatINR(typeof value === 'number' ? value : 0)}`}
      >
        {typeof value === 'number' ? (
          <NumberCounter
            value={value}
            formatter={(v) => formatter ? formatter(v) : formatINRCompact(v)}
          />
        ) : (
          value
        )}
      </div>

      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">{title}</p>
      {sub && <p className="text-xs text-text-hint">{sub}</p>}
    </motion.div>
  )
}

export function SummaryCards({ income, expenses, savings, transactionCount, creditCount, debitCount, daysCovered, banks, savingsRate, dailyData }) {
  const incomeData = dailyData?.map(d => d.credit) || []
  const expenseData = dailyData?.map(d => d.debit) || []

  const savingsColor = savings >= 0 ? '#16A34A' : '#DC2626'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Money In"
        value={income}
        sub={`${creditCount || 0} credits`}
        icon={TrendingUp}
        iconColor="#16A34A"
        borderColor="#16A34A"
        delay={0}
        sparkData={incomeData.slice(-7)}
      />

      <SummaryCard
        title="Money Out"
        value={expenses}
        sub={`${debitCount || 0} debits`}
        icon={TrendingDown}
        iconColor="#DC2626"
        borderColor="#DC2626"
        delay={0.05}
        sparkData={expenseData.slice(-7)}
      />

      <SummaryCard
        title="Net Savings"
        value={Math.abs(savings)}
        sub={`${Math.round(savingsRate || 0)}% of income`}
        icon={PiggyBank}
        iconColor="#355CDE"
        borderColor={savingsColor}
        delay={0.1}
        formatter={(v) => (savings < 0 ? '-' : '') + formatINRCompact(v)}
      />

      <SummaryCard
        title="Transactions"
        value={transactionCount}
        sub={`${daysCovered || 0} days covered`}
        icon={Receipt}
        iconColor="#8B5CF6"
        borderColor="#8B5CF6"
        delay={0.15}
        formatter={(v) => Math.round(v).toLocaleString('en-IN')}
      />
    </div>
  )
}
