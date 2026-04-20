import React, { useMemo, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, RefreshCw, Moon, Sun, Share2, Check, FileText, Target, Lock, X as XIcon } from 'lucide-react'
import { format } from 'date-fns'

import { ViewTabs } from './ViewTabs.jsx'
import { FilterBar } from './FilterBar.jsx'
import { NarrativeDashboard } from './NarrativeDashboard.jsx'
import { InsightBanner } from './InsightBanner.jsx'
import { CategoryBreakdown } from './CategoryBreakdown.jsx'
import { TopMerchants } from './TopMerchants.jsx'
import { SpendingTrend } from './SpendingTrend.jsx'
import { SankeyFlow } from './SankeyFlow.jsx'
import { CalendarHeatmap } from './CalendarHeatmap.jsx'
import { TransactionList } from './TransactionList.jsx'
import { BankSplitView } from './BankSplitView.jsx'
import { MonthlyComparison } from './MonthlyComparison.jsx'
import { SubscriptionDetector } from './SubscriptionDetector.jsx'
import { BudgetPanel, BudgetSummaryCard, useBudgets } from './BudgetTracker.jsx'
import { Card } from '../ui/Card.jsx'

import {
  getTotalIncome,
  getTotalExpenses,
  getNetSavings,
  getSavingsRate,
  getByCategory,
  getDailySpend,
  getTopMerchants,
  getLargestExpenses,
  getByBank,
  getCrossMonthTrend,
  getSubscriptions,
  getInsights,
  getDaysCovered,
  getByMonth,
  detectDuplicates,
  isShortPeriod,
} from '../../utils/analytics.js'
import { formatINR, formatINRCompact } from '../../utils/currency.js'
import { downloadCSV, generateTextSummary, exportPDF } from '../../utils/export.js'

export function Dashboard({
  statements,
  activeView,
  onViewChange,
  selectedBanks,
  selectedMonths,
  onToggleBank,
  onToggleMonth,
  selectedStatements,
  onToggleStatement,
  includeTransfers,
  onToggleTransfers,
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
  onReset,
  darkMode,
  onToggleTheme,
  isDemoMode,
}) {
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [showBudgets, setShowBudgets] = useState(false)
  const [privacyDismissed, setPrivacyDismissed] = useState(() => !!localStorage.getItem('sw_privacy_dismissed'))

  function dismissPrivacy() {
    localStorage.setItem('sw_privacy_dismissed', '1')
    setPrivacyDismissed(true)
  }
  const { budgets: savedBudgets, refresh: refreshBudgets } = useBudgets()
  const hasBudgets = Object.values(savedBudgets).some(v => v > 0)

  // Active transactions (filtered by statement selection)
  const activeTransactions = useMemo(() => {
    let txns = []
    for (const stmt of statements) {
      if (selectedStatements.length > 0 && selectedStatements.includes(stmt.id)) continue
      for (const txn of stmt.transactions || []) {
        txns.push(txn)
      }
    }
    return txns
  }, [statements, selectedStatements])

  // Analytics
  const income = useMemo(() => getTotalIncome(activeTransactions), [activeTransactions])
  const expenses = useMemo(() => getTotalExpenses(activeTransactions, !includeTransfers), [activeTransactions, includeTransfers])
  const savings = useMemo(() => income - expenses, [income, expenses])
  const savingsRate = useMemo(() => getSavingsRate(income, expenses), [income, expenses])
  const categories = useMemo(() => getByCategory(activeTransactions), [activeTransactions])
  const dailyData = useMemo(() => getDailySpend(activeTransactions), [activeTransactions])
  const merchants = useMemo(() => getTopMerchants(activeTransactions, 10), [activeTransactions])
  const largestExpenses = useMemo(() => getLargestExpenses(activeTransactions, 5), [activeTransactions])
  const subscriptions = useMemo(() => getSubscriptions(activeTransactions), [activeTransactions])
  const insights = useMemo(() => getInsights(activeTransactions), [activeTransactions])
  const daysCovered = useMemo(() => getDaysCovered(activeTransactions), [activeTransactions])
  const monthlyData = useMemo(() => getCrossMonthTrend(activeTransactions), [activeTransactions])
  const duplicates = useMemo(() => detectDuplicates(activeTransactions), [activeTransactions])
  const shortPeriod = useMemo(() => isShortPeriod(activeTransactions), [activeTransactions])
  // Set of transaction IDs that belong to a detected recurring charge
  const recurringIds = useMemo(() => {
    const ids = new Set()
    for (const sub of subscriptions) {
      for (const txn of sub.transactions || []) ids.add(txn.id)
    }
    return ids
  }, [subscriptions])

  const creditCount = activeTransactions.filter(t => t.type === 'credit').length
  const debitCount = activeTransactions.filter(t => t.type === 'debit').length

  // Available banks & months for filter bar
  const availableBanks = useMemo(() =>
    [...new Set(statements.map(s => s.bank).filter(Boolean))],
    [statements]
  )
  const availableMonths = useMemo(() => {
    const months = new Set()
    for (const stmt of statements) {
      for (const m of stmt.months || []) months.add(m)
    }
    return [...months].sort()
  }, [statements])

  // By bank data for bank split view
  const bankData = useMemo(() => {
    return statements
      .filter(s => selectedStatements.length === 0 || !selectedStatements.includes(s.id))
      .map(stmt => {
        const txns = stmt.transactions || []
        const cats = getByCategory(txns)
        return {
          bank: stmt.bank,
          bankLabel: stmt.bankLabel,
          bankColor: stmt.bankColor,
          accountNumber: stmt.accountNumber,
          months: stmt.months,
          income: getTotalIncome(txns),
          expenses: getTotalExpenses(txns),
          savings: getNetSavings(getTotalIncome(txns), getTotalExpenses(txns)),
          transactions: txns,
          topCategory: cats[0] || null,
          topCategories: cats,
        }
      })
  }, [statements, selectedBanks])

  // Category trends
  const categoryTrends = useMemo(() => {
    const months = monthlyData.map(m => m.month)
    const catMap = {}
    for (const m of monthlyData) {
      const cats = getByCategory(m.transactions || [])
      for (const cat of cats) {
        if (!catMap[cat.category]) {
          catMap[cat.category] = { ...cat, values: Array(months.length).fill(0) }
        }
        const idx = months.indexOf(m.month)
        if (idx >= 0) catMap[cat.category].values[idx] = cat.total
      }
    }
    return Object.values(catMap).sort((a, b) =>
      b.values.reduce((s, v) => s + v, 0) - a.values.reduce((s, v) => s + v, 0)
    )
  }, [monthlyData])

  const handleCopySummary = useCallback(async () => {
    const summary = generateTextSummary({
      income: formatINR(income),
      expenses: formatINR(expenses),
      savings: formatINR(savings),
      savingsRate: Math.round(savingsRate),
      categories: categories.map(c => ({
        label: c.label,
        formatted: formatINR(c.total),
        percentage: c.percentage,
      })),
    }, statements)
    await navigator.clipboard.writeText(summary)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }, [income, expenses, savings, savingsRate, categories, statements])

  return (
    <div id="main-content" className="min-h-screen bg-bg-primary">
      {/* Demo chip — subtle, tucked near the filter row */}
      {isDemoMode && (
        <div className="flex items-center justify-center py-1.5">
          <span
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Demo — sample data · Upload your own PDFs to analyse real spending
          </span>
        </div>
      )}

      {/* Privacy assurance banner — dismissible */}
      <AnimatePresence>
        {!privacyDismissed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center gap-2.5"
              data-print-hide
            >
              <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }} />
              <p className="text-xs text-text-hint flex-1">
                Your statements are processed <strong className="text-text-secondary">entirely in your browser</strong> — no account needed, no data sent to any server.
              </p>
              <button
                onClick={dismissPrivacy}
                className="flex-shrink-0 text-text-hint hover:text-text-secondary transition-colors"
                aria-label="Dismiss privacy notice"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="glass-header border-b border-border-soft sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-text-primary text-[15px] tracking-tight">
              Spend<span className="text-accent" style={{ textShadow: '0 0 20px rgba(16,185,129,0.4)' }}>Wise</span>
            </span>
            {statements.length > 0 && (
              <span className="hidden sm:inline text-xs text-text-hint">
                {statements.length} {statements.length === 1 ? 'statement' : 'statements'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary border border-border-soft rounded-xl hover:border-accent hover:text-accent transition-colors"
              title="Copy summary to clipboard"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-positive" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedSummary ? 'Copied!' : 'Copy Summary'}
            </button>

            <button
              onClick={() => setShowBudgets(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary border border-border-soft rounded-xl hover:border-accent hover:text-accent transition-colors"
              aria-label="Set budget targets"
              data-print-hide
            >
              <Target className="w-3.5 h-3.5" />
              Budgets
            </button>

            <button
              onClick={() => exportPDF({
                income: formatINR(income),
                expenses: formatINR(expenses),
                savings: formatINR(savings),
                savingsRate: Math.round(savingsRate),
                banks: [...new Set(statements.map(s => s.bankLabel))],
                period: availableMonths.length > 1
                  ? `${availableMonths[0]} – ${availableMonths[availableMonths.length - 1]}`
                  : availableMonths[0] || 'All time',
              })}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary border border-border-soft rounded-xl hover:border-accent hover:text-accent transition-colors"
              aria-label="Export as PDF"
              data-print-hide
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>

            <button
              onClick={() => downloadCSV(activeTransactions, statements)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-accent border border-accent/30 rounded-xl hover:bg-accent-light transition-colors"
              aria-label="Export CSV"
              data-print-hide
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-border-soft hover:bg-bg-tertiary transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary border border-border-soft rounded-xl hover:bg-bg-tertiary transition-colors"
              aria-label="Analyze another statement"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Analysis</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* View tabs + filter bar */}
        <div className="space-y-3">
          <ViewTabs activeView={activeView} onViewChange={onViewChange} banks={availableBanks} />
          <FilterBar
            statements={statements}
            selectedStatements={selectedStatements}
            onToggleStatement={onToggleStatement}
            includeTransfers={includeTransfers}
            onToggleTransfers={onToggleTransfers}
          />
        </div>

        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <NarrativeDashboard
                income={income}
                expenses={expenses}
                savings={savings}
                savingsRate={savingsRate}
                transactionCount={activeTransactions.length}
                creditCount={creditCount}
                debitCount={debitCount}
                daysCovered={daysCovered}
                shortPeriod={shortPeriod}
                duplicates={duplicates}
                categories={categories}
                merchants={merchants}
                largestExpenses={largestExpenses}
                dailyData={dailyData}
                monthlyData={monthlyData}
                activeTransactions={activeTransactions}
                statements={statements}
                availableMonths={availableMonths}
                subscriptions={subscriptions}
                selectedCategory={selectedCategory}
                onCategorySelect={onCategorySelect}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                typeFilter={typeFilter}
                onTypeFilterChange={onTypeFilterChange}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
                onRecategorize={onRecategorize}
                recurringIds={recurringIds}
              />
            </motion.div>
          )}

          {activeView === 'by-bank' && (
            <motion.div
              key="by-bank"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <BankSplitView bankData={bankData} />
              </Card>
            </motion.div>
          )}

          {activeView === 'by-month' && (
            <motion.div
              key="by-month"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <MonthlyComparison
                  monthlyData={monthlyData}
                  categoryTrends={categoryTrends}
                />
              </Card>
            </motion.div>
          )}

          {activeView === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
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
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-soft mt-8 py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-text-hint">
          <span>SpendWise · v1.0</span>
          <span>All data stays in your browser — nothing is uploaded or stored.</span>
        </div>
      </footer>

      {/* Budget panel */}
      <BudgetPanel
        isOpen={showBudgets}
        onClose={() => { setShowBudgets(false); refreshBudgets() }}
        categorySpend={Object.fromEntries(
          categories.map(c => [c.category, c.total])
        )}
      />
    </div>
  )
}
