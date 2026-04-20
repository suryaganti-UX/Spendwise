import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  X, Target, Edit3, BarChart2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES } from '../../constants/categories.js'
import { formatINR } from '../../utils/currency.js'

const STORAGE_KEY = 'spendwise_budgets_v1'

function loadBudgets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveBudgets(b) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)) } catch {}
}

const EXPENSE_CATS = CATEGORIES.filter(c => !['income', 'transfers'].includes(c.id))

const R = 38
const C = 2 * Math.PI * R

function catStatus(spent, budget) {
  if (!budget) return 'unset'
  const r = spent / budget
  return r >= 1 ? 'over' : r >= 0.8 ? 'warn' : 'ok'
}

// ── Ring chart ─────────────────────────────────────────────────────────
function Ring({ spent, budget }) {
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), 100); return () => clearTimeout(t) }, [])
  const pct = budget > 0 ? Math.min(spent / budget, 1) : 0
  const s = budget > 0 && spent / budget >= 1 ? 'over' : budget > 0 && spent / budget >= 0.8 ? 'warn' : 'ok'
  const strokeColor = s === 'over' ? '#F87171' : s === 'warn' ? '#FBBF24' : '#22C55E'
  const offset = on ? C * (1 - pct) : C
  const remaining = budget - spent
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-[88px] h-[88px] flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="10"
            className="text-bg-tertiary" stroke="currentColor" />
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="10"
            strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
            style={{ stroke: strokeColor, transition: 'stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-[15px] font-bold text-text-primary">{Math.round(pct * 100)}%</span>
          <span className="text-[10px] text-text-hint mt-0.5">used</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 flex-1">
        <StatBox label="Monthly Budget" value={formatINR(budget)} />
        <StatBox label="Spent So Far" value={formatINR(spent)}
          cls={s === 'over' ? 'text-negative' : s === 'warn' ? 'text-warning' : 'text-text-primary'} />
        <StatBox label={remaining >= 0 ? 'Remaining' : 'Over by'} value={formatINR(Math.abs(remaining))}
          cls={remaining >= 0 ? 'text-positive' : 'text-negative'} />
        <StatBox label="Budget Used" value={`${Math.round(pct * 100)}%`}
          cls={s === 'over' ? 'text-negative' : s === 'warn' ? 'text-warning' : 'text-positive'} />
      </div>
    </div>
  )
}

function StatBox({ label, value, cls = 'text-text-primary' }) {
  return (
    <div>
      <p className="text-[10px] text-text-hint mb-0.5">{label}</p>
      <p className={`text-sm font-bold tabular-nums leading-none ${cls}`}>{value}</p>
    </div>
  )
}

// ── Comparison bar row ─────────────────────────────────────────────────
function CompRow({ cat, spent, budget, index }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 80 + index * 40)
    return () => clearTimeout(t)
  }, [index])
  const hasBudget = budget > 0
  const pct = hasBudget ? spent / budget : 0
  const isOver = pct > 1
  const fillW = Math.min(pct, 1) * 100
  const s = catStatus(spent, budget)
  const barColor = isOver ? '#F87171' : s === 'warn' ? '#FBBF24' : cat.color
  const overAmt = isOver ? spent - budget : 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.25 }}
      className={`rounded-xl px-3 py-3 transition-colors ${
        isOver ? 'bg-red-50/70 dark:bg-red-950/20' :
        s === 'warn' ? 'bg-amber-50/70 dark:bg-amber-950/15' : 'hover:bg-bg-tertiary'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-base w-6 text-center flex-shrink-0 select-none">{cat.emoji}</span>
        <span className="text-xs font-semibold text-text-primary flex-1 truncate">{cat.label}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isOver && (
            <span className="text-[10px] font-bold text-negative bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              +{formatINR(overAmt)} over
            </span>
          )}
          <span className={`text-xs font-bold tabular-nums ${
            isOver ? 'text-negative' : s === 'warn' ? 'text-warning' : 'text-text-primary'
          }`}>{formatINR(spent)}</span>
          {hasBudget && (
            <span className="text-[10px] text-text-hint tabular-nums">/ {formatINR(budget)}</span>
          )}
        </div>
      </div>
      {hasBudget ? (
        <>
          <div className="relative h-2.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: on ? `${fillW}%` : '0%', backgroundColor: barColor,
              transition: on ? `width 0.75s cubic-bezier(0.34,1.2,0.64,1) ${index * 30}ms` : 'none',
            }} />
            {!isOver && (
              <div className="absolute right-0 top-0 bottom-0 w-px bg-bg-secondary/70" aria-hidden="true" />
            )}
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] tabular-nums ${
              isOver ? 'text-negative font-semibold' : s === 'warn' ? 'text-warning' : 'text-text-hint'
            }`}>{Math.round(pct * 100)}% of budget</span>
            {!isOver && (
              <span className="text-[10px] text-text-hint tabular-nums">{formatINR(budget - spent)} left</span>
            )}
          </div>
        </>
      ) : (
        <div className="h-2.5 bg-bg-tertiary rounded-full flex items-center px-2">
          <span className="text-[10px] text-text-hint italic">no limit set</span>
        </div>
      )}
    </motion.div>
  )
}

// ── BudgetPanel ────────────────────────────────────────────────────────
export function BudgetPanel({ isOpen, onClose, categorySpend = {} }) {
  const [mode, setMode] = useState('compare')
  const [budgets, setBudgets] = useState(loadBudgets)
  const [editValues, setEditValues] = useState({})
  const [saveFlash, setSaveFlash] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Suggested budget = 110% of current spend, rounded up to nearest 100
  const suggestedBudget = useCallback((catId) => {
    const spend = categorySpend[catId] || 0
    if (spend <= 0) return ''
    return String(Math.ceil((spend * 1.1) / 100) * 100)
  }, [categorySpend])

  useEffect(() => {
    if (!isOpen) return
    const b = loadBudgets()
    setBudgets(b)
    setEditValues(Object.fromEntries(EXPENSE_CATS.map(c => [c.id, b[c.id] != null ? String(b[c.id]) : ''])))
    setMode('compare')
    setShowAll(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  const handleSave = useCallback(() => {
    const b = {}
    for (const [id, val] of Object.entries(editValues)) {
      const n = parseFloat((val || '').replace(/,/g, ''))
      if (!isNaN(n) && n > 0) b[id] = n
    }
    saveBudgets(b)
    setBudgets(b)
    setSaveFlash(true)
    setTimeout(() => { setSaveFlash(false); setMode('compare') }, 1100)
  }, [editValues])

  const budgetedCats = useMemo(() => EXPENSE_CATS.filter(c => budgets[c.id] > 0), [budgets])
  const totalBudget = useMemo(
    () => budgetedCats.reduce((s, c) => s + budgets[c.id], 0), [budgetedCats, budgets])
  const totalSpent = useMemo(
    () => budgetedCats.reduce((s, c) => s + (categorySpend[c.id] || 0), 0), [budgetedCats, categorySpend])
  const overCats = useMemo(
    () => budgetedCats.filter(c => (categorySpend[c.id] || 0) > budgets[c.id]),
    [budgetedCats, categorySpend, budgets])
  const hasBudgets = budgetedCats.length > 0

  const sorted = useMemo(() => {
    const order = { over: 0, warn: 1, ok: 2, unset: 3 }
    return [...EXPENSE_CATS].sort((a, b) => {
      const sa = catStatus(categorySpend[a.id] || 0, budgets[a.id])
      const sb = catStatus(categorySpend[b.id] || 0, budgets[b.id])
      if (order[sa] !== order[sb]) return order[sa] - order[sb]
      const pa = budgets[a.id] > 0 ? (categorySpend[a.id] || 0) / budgets[a.id] : -1
      const pb = budgets[b.id] > 0 ? (categorySpend[b.id] || 0) / budgets[b.id] : -1
      return pb - pa
    })
  }, [budgets, categorySpend])

  const visible = showAll ? sorted : sorted.slice(0, 8)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-bg-secondary border-l border-border-soft z-50 flex flex-col"
            style={{ boxShadow: '-4px 0 40px rgba(0,0,0,.2)' }}
            role="dialog" aria-modal="true" aria-label="Budget tracker"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Budget Tracker</h2>
                  <p className="text-[10px] text-text-hint">
                    {hasBudgets
                      ? `${budgetedCats.length} of ${EXPENSE_CATS.length} categories tracked`
                      : 'Set monthly limits per category'}
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors" aria-label="Close">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            {/* Ring summary */}
            <AnimatePresence>
              {hasBudgets && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <div className="px-5 py-4 bg-bg-primary border-b border-border-soft">
                    <Ring spent={totalSpent} budget={totalBudget} />
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {overCats.length > 0 ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-negative bg-red-100 dark:bg-red-950/40 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          {overCats.length > 2
                            ? `${overCats.length} categories over budget`
                            : `${overCats.map(c => c.label).join(', ')} over budget`}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-positive bg-green-100 dark:bg-green-950/30 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          All categories on track
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode toggle */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border-soft flex-shrink-0">
              {[
                { id: 'compare', label: 'Compare', Icon: BarChart2 },
                { id: 'edit', label: 'Set Budgets', Icon: Edit3 },
              ].map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setMode(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                    mode === id ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {mode === 'compare' && (
                  <motion.div key="compare"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }} className="px-4 py-4 space-y-0.5"
                  >
                    {!hasBudgets ? (
                      <div className="py-16 text-center px-8">
                        <div className="w-14 h-14 rounded-2xl bg-accent-light mx-auto mb-4 flex items-center justify-center">
                          <Target className="w-7 h-7 text-accent" />
                        </div>
                        <p className="text-sm font-bold text-text-primary mb-2">No budgets set yet</p>
                        <p className="text-xs text-text-secondary mb-5 leading-relaxed">
                          Set monthly spending limits to compare with your actual spending.
                        </p>
                        <button onClick={() => setMode('edit')}
                          className="px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-hover transition-colors">
                          Set Your Budgets
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 px-3 pb-3 text-[10px] text-text-hint">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-1.5 rounded-full bg-positive inline-block" /> Under budget
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-1.5 rounded-full bg-warning inline-block" /> Near limit
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-1.5 rounded-full bg-negative inline-block" /> Over budget
                          </span>
                        </div>
                        {visible.map((cat, i) => (
                          <CompRow key={cat.id} cat={cat}
                            spent={categorySpend[cat.id] || 0}
                            budget={budgets[cat.id] || 0}
                            index={i}
                          />
                        ))}
                        {EXPENSE_CATS.length > 8 && (
                          <button onClick={() => setShowAll(v => !v)}
                            className="w-full py-2.5 text-xs text-accent flex items-center justify-center gap-1.5 hover:bg-accent-light rounded-xl transition-colors mt-1"
                          >
                            {showAll
                              ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                              : <><ChevronDown className="w-3.5 h-3.5" /> Show all {EXPENSE_CATS.length} categories</>}
                          </button>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {mode === 'edit' && (
                  <motion.div key="edit"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }} className="px-5 py-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Set a monthly limit per category.
                      </p>
                      {Object.values(categorySpend).some(v => v > 0) && (
                        <button
                          onClick={() => setEditValues(v => {
                            const next = { ...v }
                            for (const cat of EXPENSE_CATS) {
                              if (!next[cat.id]) next[cat.id] = suggestedBudget(cat.id)
                            }
                            return next
                          })}
                          className="text-[11px] font-medium text-accent hover:underline flex-shrink-0 ml-3"
                        >
                          Auto-fill from spending
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {EXPENSE_CATS.map((cat, i) => {
                        const suggested = suggestedBudget(cat.id)
                        return (
                          <motion.div key={cat.id}
                            initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025 }}
                            className="flex items-center gap-3 py-2.5 border-b border-border-soft/40"
                          >
                            <span className="text-base w-6 text-center flex-shrink-0">{cat.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-text-secondary block truncate">{cat.label}</span>
                              {suggested && !editValues[cat.id] && (
                                <span className="text-[10px] text-text-hint">Avg: ₹{Number(suggested).toLocaleString('en-IN')}</span>
                              )}
                            </div>
                            <div className="relative flex-shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-hint select-none">₹</span>
                              <input type="number" min="0"
                                placeholder={suggested || '0'}
                                value={editValues[cat.id] || ''}
                                onChange={e => setEditValues(v => ({ ...v, [cat.id]: e.target.value }))}
                                className="w-28 pl-6 pr-3 py-2 text-xs border border-border-soft rounded-lg bg-bg-primary text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                                aria-label={`Monthly budget for ${cat.label}`}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer (edit mode) */}
            <AnimatePresence>
              {mode === 'edit' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="px-5 py-4 border-t border-border-soft bg-bg-secondary flex-shrink-0"
                >
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditValues(Object.fromEntries(EXPENSE_CATS.map(c => [c.id, ''])))}
                      className="flex-1 py-2.5 text-sm text-text-secondary border border-border-soft rounded-xl hover:bg-bg-tertiary transition-colors"
                    >
                      Clear all
                    </button>
                    <button onClick={handleSave}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        saveFlash ? 'bg-positive text-white scale-95' : 'bg-accent text-white hover:bg-accent-hover'
                      }`}
                    >
                      {saveFlash ? 'Saved!' : 'Save Budgets'}
                    </button>
                  </div>
                  <p className="text-[10px] text-text-hint text-center mt-2">Saved locally in your browser</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── BudgetSummaryCard ──────────────────────────────────────────────────
export function BudgetSummaryCard({ categorySpend = {}, onOpen }) {
  const [budgets] = useState(loadBudgets)
  const budgetedCats = EXPENSE_CATS.filter(c => budgets[c.id] > 0)
  if (!budgetedCats.length) return null

  const totalBudget = budgetedCats.reduce((s, c) => s + budgets[c.id], 0)
  const totalSpent = budgetedCats.reduce((s, c) => s + (categorySpend[c.id] || 0), 0)
  const pct = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0
  const s = pct >= 1 ? 'over' : pct >= 0.8 ? 'warn' : 'ok'
  const barColor = s === 'over' ? '#F87171' : s === 'warn' ? '#FBBF24' : '#22C55E'
  const overCount = budgetedCats.filter(c => (categorySpend[c.id] || 0) > budgets[c.id]).length
  const remaining = totalBudget - totalSpent

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-light flex items-center justify-center">
            <Target className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary leading-none">Budget Tracker</h3>
            <p className="text-[10px] text-text-hint mt-0.5">{budgetedCats.length} categories tracked</p>
          </div>
        </div>
        <button onClick={onOpen} className="text-xs text-accent font-medium hover:underline">View details</button>
      </div>

      <div className="mb-5 p-4 rounded-2xl bg-bg-primary border border-border-soft">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] text-text-hint mb-1">Spent vs Monthly Budget</p>
            <p className="text-xl font-bold text-text-primary tabular-nums leading-none">{formatINR(totalSpent)}</p>
            <p className="text-xs text-text-hint tabular-nums mt-0.5">of {formatINR(totalBudget)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: barColor }}>
              {Math.round(pct * 100)}%
            </p>
            <p className="text-[10px] text-text-hint mt-0.5">
              {remaining >= 0 ? `${formatINR(remaining)} left` : `${formatINR(-remaining)} over`}
            </p>
          </div>
        </div>
        <div className="h-4 bg-bg-tertiary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct * 100}%`, backgroundColor: barColor }} />
        </div>
        {overCount > 0 && (
          <p className="mt-2.5 text-[11px] text-negative font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {overCount} {overCount === 1 ? 'category' : 'categories'} over budget
          </p>
        )}
        {overCount === 0 && pct < 0.8 && (
          <p className="mt-2.5 text-[11px] text-positive font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            All categories on track
          </p>
        )}
      </div>

      <div className="space-y-3">
        {budgetedCats
          .map(cat => ({
            cat, spent: categorySpend[cat.id] || 0,
            budget: budgets[cat.id],
            p: (categorySpend[cat.id] || 0) / budgets[cat.id],
          }))
          .sort((a, b) => b.p - a.p)
          .slice(0, 5)
          .map(({ cat, spent, budget: bgt, p }) => {
            const isOver = p > 1
            const color = isOver ? '#F87171' : p >= 0.8 ? '#FBBF24' : cat.color
            return (
              <div key={cat.id} className="flex items-center gap-2.5">
                <span className="text-sm w-5 text-center flex-shrink-0 select-none">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text-secondary truncate">{cat.label}</span>
                    <span className={`text-[11px] tabular-nums font-semibold flex-shrink-0 ml-2 ${
                      isOver ? 'text-negative' : p >= 0.8 ? 'text-warning' : 'text-text-hint'
                    }`}>{Math.round(p * 100)}%</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(p, 1) * 100}%`, backgroundColor: color }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 w-16">
                  <p className="text-[11px] tabular-nums text-text-secondary font-medium">{formatINR(spent)}</p>
                  <p className="text-[10px] text-text-hint tabular-nums">{formatINR(bgt)}</p>
                </div>
              </div>
            )
          })}
      </div>

      {budgetedCats.length > 5 && (
        <button onClick={onOpen} className="mt-3 w-full text-xs text-accent text-center hover:underline py-1">
          + {budgetedCats.length - 5} more categories
        </button>
      )}
    </div>
  )
}

// ── useBudgets hook ────────────────────────────────────────────────────
export function useBudgets() {
  const [budgets, setBudgets] = useState(loadBudgets)
  const refresh = useCallback(() => setBudgets(loadBudgets()), [])
  return { budgets, refresh }
}
