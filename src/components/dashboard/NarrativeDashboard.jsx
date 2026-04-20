import React, { useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, X } from 'lucide-react'

import { HeroSection } from './HeroSection.jsx'
import { InsightFeed } from './InsightFeed.jsx'
import { CategoryBreakdown } from './CategoryBreakdown.jsx'
import { TopMerchants } from './TopMerchants.jsx'
import { SpendingTrend } from './SpendingTrend.jsx'
import { TransactionList } from './TransactionList.jsx'
import { Card } from '../ui/Card.jsx'

import { generateNarrativeInsights } from '../../utils/analytics.js'

// ─── Section wrapper with viewport-triggered entrance ────────────────────────
function Section({ id, label, title, subtitle, children }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px 0px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {label && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold text-accent/70 uppercase tracking-[0.18em]">{label}</span>
          <div className="flex-1 h-px bg-border-soft" />
        </div>
      )}
      {title && (
        <div className="mb-5">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-text-hint mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.section>
  )
}

// ─── NarrativeDashboard ───────────────────────────────────────────────────────
export function NarrativeDashboard({
  // Data
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
  // Handlers
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
  onScrollToTransactions,
  recurringIds = new Set(),
}) {
  const txnRef = useRef(null)

  function scrollToTransactions() {
    txnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Generate the 3 narrative insight chips
  const narrativeInsights = useMemo(
    () => generateNarrativeInsights(activeTransactions, monthlyData),
    [activeTransactions, monthlyData]
  )

  return (
    <div className="space-y-10">

      {/* ── Edge-case banners ── */}
      <AnimatePresence>
        {transactionCount === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">No transactions found in this period</h3>
            <p className="text-sm text-text-hint">Try selecting a different month or uploading another statement.</p>
          </motion.div>
        )}

        {transactionCount > 0 && shortPeriod && (
          <motion.div
            key="short-period"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-semibold">Short period ({daysCovered} days) —</span> insights may be limited. For best results, upload a full monthly statement.
            </p>
          </motion.div>
        )}

        {transactionCount > 0 && duplicates?.count > 0 && (
          <motion.div
            key="duplicates"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}
          >
            <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <span className="font-semibold">{duplicates.count} possible duplicate transaction{duplicates.count > 1 ? 's' : ''} found.</span>{' '}
              Review them in the transactions list below — they may affect your totals.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {transactionCount === 0 ? null : (<>

      {/* ── Section 1 — Your Month at a Glance ── */}
      <Section id="s-hero">
        <HeroSection
          income={income}
          expenses={expenses}
          savings={savings}
          savingsRate={savingsRate}
          transactionCount={transactionCount}
          creditCount={creditCount}
          debitCount={debitCount}
          statements={statements}
          availableMonths={availableMonths}
        />
      </Section>

      {/* ── Section 2 — 3 Things We Noticed ── */}
      {narrativeInsights.length > 0 && (
        <Section id="s-insights" label="02 / Insights">
          <InsightFeed insights={narrativeInsights} />
        </Section>
      )}

      {/* ── Section 3 — Where Did It Go? ── */}
      <Section
        id="s-categories"
        label="03 / Breakdown"
        title="Where Did It Go?"
        subtitle="Click any category to reveal its top merchants"
      >
        <div className="section-card">
          <CategoryBreakdown
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={onCategorySelect}
            totalIncome={income}
          />
        </div>
      </Section>

      {/* ── Section 4 — Your Top Merchants ── */}
      <Section
        id="s-merchants"
        label="04 / Merchants"
        title="Your Top Merchants"
        subtitle="Ranked by total spend this period"
      >
        <div className="section-card">
          <TopMerchants
            merchants={merchants}
            transactions={activeTransactions}
            largestExpenses={largestExpenses}
            onViewAll={scrollToTransactions}
          />
        </div>
      </Section>

      {/* ── Section 5 — Spending Over Time ── */}
      <Section
        id="s-trend"
        label="05 / Trend"
        subtitle="Toggle between daily, weekly, and category views"
      >
        <div className="section-card">
          <SpendingTrend dailyData={dailyData} categories={categories} />
        </div>
      </Section>

      {/* ── Section 6 — All Transactions ── */}
      <Section
        id="s-transactions"
        label="06 / Transactions"
        title="All Transactions"
        subtitle="Search, filter, and sort every transaction in your statement"
      >
        <div
          ref={txnRef}
          className="section-card"
        >
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
            recurringIds={recurringIds}
          />
        </div>
      </Section>

      </>)}
    </div>
  )
}
