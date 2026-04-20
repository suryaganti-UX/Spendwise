import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, ChevronDown, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'
import { formatINR, formatINRCompact } from '../../utils/currency.js'
import { BankBadge } from '../ui/BankBadge.jsx'
import { getCategoryById, CATEGORIES } from '../../constants/categories.js'
import { motion, AnimatePresence } from 'framer-motion'

const PAGE_SIZE = 50

export function TransactionList({
  transactions = [],
  searchQuery = '',
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  typeFilter = 'all',
  onTypeFilterChange,
  sortBy = 'date',
  sortOrder = 'desc',
  onSortChange,
  onRecategorize,
  highlightId = null,
}) {
  const [expandedId, setExpandedId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const [recatDropdown, setRecatDropdown] = useState(null)
  const searchRef = useRef(null)

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [searchQuery, selectedCategory, typeFilter, sortBy, sortOrder])

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    function handler(e) {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && searchRef.current) {
        e.preventDefault()
        searchRef.current.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const filtered = useMemo(() => {
    let list = [...transactions]

    // Type filter
    if (typeFilter === 'debit') list = list.filter(t => t.type === 'debit')
    else if (typeFilter === 'credit') list = list.filter(t => t.type === 'credit')

    // Category filter
    if (selectedCategory) list = list.filter(t => t.category === selectedCategory)

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(t =>
        t.description?.toLowerCase().includes(q) ||
        t.amount?.toString().includes(q) ||
        t.category?.toLowerCase().includes(q)
      )
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'date') cmp = a.date - b.date
      else if (sortBy === 'amount') cmp = a.amount - b.amount
      else if (sortBy === 'category') cmp = (a.category || '').localeCompare(b.category || '')
      return sortOrder === 'asc' ? cmp : -cmp
    })

    return list
  }, [transactions, typeFilter, selectedCategory, searchQuery, sortBy, sortOrder])

  // Group by date
  const grouped = useMemo(() => {
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    const groups = {}
    for (const txn of paginated) {
      const dateKey = format(txn.date, 'dd MMM yyyy')
      if (!groups[dateKey]) {
        groups[dateKey] = { transactions: [], total: 0 }
      }
      groups[dateKey].transactions.push(txn)
      if (txn.type === 'debit') groups[dateKey].total += txn.amount
    }
    return Object.entries(groups).map(([dateLabel, data]) => ({ dateLabel, ...data }))
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const activeFilterCount = [
    selectedCategory,
    typeFilter !== 'all' ? typeFilter : null,
    searchQuery ? searchQuery : null,
  ].filter(Boolean).length

  return (
    <div>
      {/* Search + filter bar */}
      <div className="sticky top-0 z-10 bg-bg-primary pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search merchants, amounts, categories... (⌘K)"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-border-soft rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              aria-label="Search transactions"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-hint hover:text-text-primary"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-xl transition-colors ${
              activeFilterCount > 0
                ? 'border-accent text-accent bg-accent-light'
                : 'border-border-soft text-text-secondary bg-bg-secondary hover:border-accent hover:text-accent'
            }`}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-bg-secondary border border-border-soft rounded-xl p-3 mb-2 space-y-3">
                {/* Type filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-hint w-20">Type</span>
                  <div className="flex gap-1">
                    {['all', 'debit', 'credit'].map(type => (
                      <button
                        key={type}
                        onClick={() => onTypeFilterChange(type)}
                        className={`px-3 py-1 text-xs rounded-lg capitalize transition-colors ${
                          typeFilter === type
                            ? 'bg-accent text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-accent-light hover:text-accent'
                        }`}
                      >
                        {type === 'all' ? 'All' : type === 'debit' ? 'Money Out' : 'Money In'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-hint w-20">Category</span>
                  <select
                    value={selectedCategory || ''}
                    onChange={e => onCategorySelect(e.target.value || null)}
                    className="text-xs border border-border-soft rounded-lg px-2 py-1 bg-bg-secondary text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="">All categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-hint w-20">Sort</span>
                  <div className="flex gap-1">
                    {[['date', 'Date'], ['amount', 'Amount'], ['category', 'Category']].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => onSortChange(key, sortBy === key && sortOrder === 'desc' ? 'asc' : 'desc')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          sortBy === key
                            ? 'bg-accent text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-accent-light hover:text-accent'
                        }`}
                      >
                        {label} {sortBy === key ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date shortcuts */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-hint w-20">Quick</span>
                  <div className="flex gap-1 flex-wrap">
                    {['This Month', 'Last Month'].map(label => (
                      <button
                        key={label}
                        className="px-2 py-1 text-xs rounded-lg bg-bg-tertiary text-text-secondary hover:bg-accent-light hover:text-accent transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCategory && (
              <span className="flex items-center gap-1 text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full border border-accent/20">
                {getCategoryById(selectedCategory).emoji} {getCategoryById(selectedCategory).label}
                <button onClick={() => onCategorySelect(null)} aria-label="Remove category filter"><X className="w-3 h-3" /></button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="flex items-center gap-1 text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full border border-accent/20">
                {typeFilter === 'debit' ? 'Money Out' : 'Money In'}
                <button onClick={() => onTypeFilterChange('all')} aria-label="Remove type filter"><X className="w-3 h-3" /></button>
              </span>
            )}
            {searchQuery && (
              <span className="flex items-center gap-1 text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full border border-accent/20">
                "{searchQuery}"
                <button onClick={() => onSearchChange('')} aria-label="Clear search"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          All Transactions
          <span className="ml-2 text-text-hint font-normal">({filtered.length})</span>
        </h3>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-text-secondary mb-2">No transactions match your filters</p>
          <button
            onClick={() => {
              onSearchChange('')
              onCategorySelect(null)
              onTypeFilterChange('all')
            }}
            className="text-xs text-accent hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Grouped transaction list */}
      <div className="space-y-3">
        {grouped.map(({ dateLabel, transactions: dayTxns, total }) => (
          <div key={dateLabel}>
            {/* Date header */}
            <div className="flex items-center gap-3 py-1.5 border-b border-border-soft mb-1">
              <span className="text-xs font-semibold text-text-secondary">{dateLabel}</span>
              {total > 0 && (
                <span className="text-xs text-text-hint tabular-nums">
                  {formatINR(total)} spent
                </span>
              )}
            </div>

            {/* Transactions */}
            <div className="space-y-0.5">
              {dayTxns.map(txn => (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  isExpanded={expandedId === txn.id}
                  isHighlighted={highlightId === txn.id}
                  onToggle={() => setExpandedId(expandedId === txn.id ? null : txn.id)}
                  onRecategorize={onRecategorize}
                  recatDropdown={recatDropdown}
                  setRecatDropdown={setRecatDropdown}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-soft">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-text-hint">
            Page {page + 1} of {totalPages} ({filtered.length} total)
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Detect UPI-style transaction descriptions
function isUpiDescription(desc) {
  if (!desc) return false
  return /upi[/-]/i.test(desc) || /\S+@\S+/.test(desc) || /\bvpa\b/i.test(desc)
}

function TransactionRow({ txn, isExpanded, isHighlighted, onToggle, onRecategorize, recatDropdown, setRecatDropdown }) {
  const cat = getCategoryById(txn.category)
  const isDebit = txn.type === 'debit'

  return (
    <div
      id={`txn-${txn.id}`}
      className={`rounded-xl transition-colors ${isHighlighted ? 'bg-accent-light' : ''}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-tertiary rounded-xl transition-colors text-left"
        aria-expanded={isExpanded}
      >
        {/* Category emoji in circle */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{ backgroundColor: cat.color + '18' }}
          aria-hidden="true"
        >
          {cat.emoji}
        </div>

        {/* Description + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary truncate" title={txn.description}>
            {txn.description}
            {txn.userModified && (
              <span className="ml-1.5 text-2xs bg-accent-light text-accent px-1 rounded">edited</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <BankBadge bankId={txn.bank} size="sm" />
            {isUpiDescription(txn.description) && (
              <span className="text-2xs px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">
                UPI Transfer
              </span>
            )}
            <span
              className="text-2xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: cat.color + '15', color: cat.color }}
            >
              {cat.label}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p
            className={`text-sm font-bold tabular-nums ${isDebit ? 'text-negative' : 'text-positive'}`}
            aria-label={`${isDebit ? 'Debit' : 'Credit'}: ${formatINR(txn.amount)}`}
            title={txn.amount >= 100000 ? formatINR(txn.amount) : undefined}
          >
            {isDebit ? '-' : '+'}{txn.amount >= 100000 ? formatINRCompact(txn.amount) : formatINR(txn.amount)}
          </p>
          {txn.balance != null && (
            <p className="text-2xs text-text-hint tabular-nums">Bal: {formatINR(txn.balance)}</p>
          )}
        </div>
      </button>

      {/* Expanded row */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-2 bg-bg-tertiary rounded-xl p-3 text-xs space-y-1.5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-text-hint">Date</span>
                  <p className="font-medium text-text-primary">{format(txn.date, 'dd MMM yyyy')}</p>
                </div>
                {txn.balance != null && (
                  <div>
                    <span className="text-text-hint">Balance after</span>
                    <p className="font-medium text-text-primary tabular-nums">{formatINR(txn.balance)}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-text-hint">Full description</span>
                  <p className="font-medium text-text-primary break-all">{txn.rawText || txn.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-border-soft">
                <span className="text-text-hint">Category:</span>
                {recatDropdown === txn.id ? (
                  <div className="flex items-center gap-1">
                    <select
                      className="text-xs border border-border-soft rounded-lg px-2 py-1 bg-bg-secondary"
                      defaultValue={txn.category}
                      onChange={e => {
                        onRecategorize(txn.id, e.target.value)
                        setRecatDropdown(null)
                      }}
                      autoFocus
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                      ))}
                    </select>
                    <button onClick={() => setRecatDropdown(null)} className="text-text-hint hover:text-text-primary">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRecatDropdown(txn.id)}
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    {cat.emoji} {cat.label} ✎
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
