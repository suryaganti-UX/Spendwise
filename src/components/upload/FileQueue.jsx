import React, { useState } from 'react'
import { FileCard } from './FileCard.jsx'
import { Plus, Lock, ChevronRight, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function FileQueue({ statements, onRemove, onSetBank, onAddMore, onSubmitPassword, onAnalyzeAvailable }) {
  const [applyAllPassword, setApplyAllPassword] = useState('')
  const [showApplyAll, setShowApplyAll] = useState(false)
  const [query, setQuery] = useState('')

  if (!statements || statements.length === 0) return null

  const total        = statements.length
  const doneCount    = statements.filter(s => s.parseStatus === 'done').length
  const passwordCount= statements.filter(s => s.parseStatus === 'password_required').length
  const parsingCount = statements.filter(s => s.parseStatus === 'parsing' || s.parseStatus === 'inspecting').length
  const pendingCount = statements.filter(s => s.parseStatus === 'pending').length
  const errorCount   = statements.filter(s => ['error', 'unsupported', 'duplicate'].includes(s.parseStatus)).length

  const hasPartialSuccess = doneCount > 0 && passwordCount > 0
  const allParsed = statements.every(s => ['done', 'error', 'unsupported', 'duplicate', 'password_required'].includes(s.parseStatus))

  const filtered = query.trim()
    ? statements.filter(s => s.filename?.toLowerCase().includes(query.toLowerCase()))
    : statements

  const handleApplyAll = (e) => {
    e.preventDefault()
    if (!applyAllPassword.trim()) return
    statements.filter(s => s.parseStatus === 'password_required')
      .forEach(s => onSubmitPassword?.(s.id, applyAllPassword))
    setApplyAllPassword('')
    setShowApplyAll(false)
  }

  return (
    <div className="w-full mt-4">

      {/* ── Banners (outside scroll area) ──────────────────────── */}
      <AnimatePresence>
        {passwordCount > 1 && (
          <motion.div
            key="apply-all"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mb-3 bg-amber-50 dark:bg-amber-900/15 border border-warning/30 rounded-xl px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-warning flex-shrink-0" />
                <p className="text-xs font-medium text-text-secondary">
                  {passwordCount} files need a password. Do they share the same password?
                </p>
              </div>
              <button
                onClick={() => setShowApplyAll(s => !s)}
                className="text-xs text-accent font-medium hover:underline flex-shrink-0"
              >
                {showApplyAll ? 'Cancel' : 'Apply to all'}
              </button>
            </div>
            <AnimatePresence>
              {showApplyAll && (
                <motion.form
                  key="apply-all-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleApplyAll}
                  className="overflow-hidden mt-2 flex items-center gap-2"
                >
                  <input
                    type="password"
                    value={applyAllPassword}
                    onChange={e => setApplyAllPassword(e.target.value)}
                    placeholder="Shared PDF password"
                    autoComplete="off"
                    aria-label="Shared password for all locked files"
                    className="flex-1 pl-3 pr-3 py-1.5 text-xs rounded-lg border border-border-medium bg-bg-primary text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!applyAllPassword.trim()}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Unlock all
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasPartialSuccess && allParsed && (
          <motion.div
            key="partial-notice"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 bg-accent-light border border-accent/20 rounded-xl px-4 py-3"
          >
            <p className="text-xs font-medium text-accent mb-2">
              {doneCount} {doneCount === 1 ? 'file is' : 'files are'} ready.{' '}
              {passwordCount} locked {passwordCount === 1 ? 'file is' : 'files are'} excluded until unlocked.
            </p>
            <button
              onClick={onAnalyzeAvailable}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover px-3 py-1.5 rounded-lg transition-colors"
            >
              Continue with {doneCount} {doneCount === 1 ? 'file' : 'files'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable file list card ───────────────────────────── */}
      <div className="border border-border-soft rounded-2xl overflow-hidden bg-bg-secondary">

        {/* Sticky header: count + status chips + search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-soft bg-bg-secondary">
          {/* Count */}
          <div className="flex items-baseline gap-1.5 flex-shrink-0">
            <span className="text-[15px] font-bold text-text-primary tabular-nums">{total}</span>
            <span className="text-xs text-text-hint">{total === 1 ? 'file' : 'files'}</span>
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-1.5 flex-1 flex-wrap">
            {doneCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-positive/10 text-positive text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-positive" />
                {doneCount} ready
              </span>
            )}
            {parsingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {parsingCount} processing
              </span>
            )}
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-tertiary text-text-hint text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-text-hint" />
                {pendingCount} pending
              </span>
            )}
            {passwordCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[11px] font-semibold">
                <Lock className="w-2.5 h-2.5" />
                {passwordCount} locked
              </span>
            )}
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-negative/10 text-negative text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-negative" />
                {errorCount} excluded
              </span>
            )}
          </div>

          {/* Search input */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-hint pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search files…"
              aria-label="Search uploaded files"
              className="pl-7 pr-6 py-1.5 w-36 text-[11px] rounded-lg border border-border-soft bg-bg-primary text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:w-48 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-hint hover:text-text-primary"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable file cards */}
        <div className="overflow-y-auto max-h-[272px] p-3 space-y-2">
          <AnimatePresence>
            {filtered.length > 0 ? (
              filtered.map(stmt => (
                <FileCard
                  key={stmt.id}
                  statement={stmt}
                  onRemove={onRemove}
                  onSetBank={onSetBank}
                  onSubmitPassword={onSubmitPassword}
                />
              ))
            ) : (
              <p className="py-6 text-center text-xs text-text-hint">
                No files match &ldquo;{query}&rdquo;
              </p>
            )}
          </AnimatePresence>
        </div>

        {/* Add more — pinned to bottom of card */}
        {pendingCount === 0 && parsingCount === 0 && onAddMore && (
          <div className="border-t border-border-soft px-3 py-2.5">
            <button
              onClick={onAddMore}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add more files
            </button>
          </div>
        )}
      </div>

    </div>
  )
}

