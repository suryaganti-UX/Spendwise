import React, { useState } from 'react'
import { FileCard } from './FileCard.jsx'
import { Plus, Lock, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function FileQueue({ statements, onRemove, onSetBank, onAddMore, onSubmitPassword, onAnalyzeAvailable }) {
  const [applyAllPassword, setApplyAllPassword] = useState('')
  const [showApplyAll, setShowApplyAll] = useState(false)

  if (!statements || statements.length === 0) return null

  const doneCount      = statements.filter(s => s.parseStatus === 'done').length
  const passwordCount  = statements.filter(s => s.parseStatus === 'password_required').length
  const parsingCount   = statements.filter(s => s.parseStatus === 'parsing' || s.parseStatus === 'inspecting').length
  const pendingCount   = statements.filter(s => s.parseStatus === 'pending').length
  const errorCount     = statements.filter(s => ['error', 'unsupported', 'duplicate'].includes(s.parseStatus)).length
  const activeCount    = doneCount + pendingCount + parsingCount

  const hasPartialSuccess = doneCount > 0 && passwordCount > 0
  const allParsed = statements.every(s => ['done', 'error', 'unsupported', 'duplicate', 'password_required'].includes(s.parseStatus))

  const handleApplyAll = (e) => {
    e.preventDefault()
    if (!applyAllPassword.trim()) return
    const locked = statements.filter(s => s.parseStatus === 'password_required')
    locked.forEach(s => onSubmitPassword?.(s.id, applyAllPassword))
    setApplyAllPassword('')
    setShowApplyAll(false)
  }

  return (
    <div className="w-full mt-4">
      {/* Summary header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {statements.length} {statements.length === 1 ? 'file' : 'files'} added
        </h3>
        <div className="flex gap-2 text-xs">
          {doneCount > 0 && <span className="text-positive font-medium">{doneCount} ready</span>}
          {parsingCount > 0 && <span className="text-accent font-medium">{parsingCount} processing</span>}
          {passwordCount > 0 && <span className="text-warning font-medium">{passwordCount} locked</span>}
          {errorCount > 0 && <span className="text-negative font-medium">{errorCount} excluded</span>}
        </div>
      </div>

      {/* "Apply to all locked" banner */}
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

      {/* Partial-success notice */}
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
              {passwordCount} locked {passwordCount === 1 ? 'file is' : 'files are'} excluded from the analysis until unlocked.
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

      {/* File cards */}
      <div className="space-y-2">
        <AnimatePresence>
          {statements.map(stmt => (
            <FileCard
              key={stmt.id}
              statement={stmt}
              onRemove={onRemove}
              onSetBank={onSetBank}
              onSubmitPassword={onSubmitPassword}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add more button */}
      {pendingCount === 0 && parsingCount === 0 && onAddMore && (
        <button
          onClick={onAddMore}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-border-medium rounded-xl text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add more files
        </button>
      )}
    </div>
  )
}

