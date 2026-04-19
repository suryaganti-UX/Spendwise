import React, { useState, useRef, useEffect } from 'react'
import {
  CheckCircle2, AlertCircle, X, Loader2, FileText,
  Lock, Eye, EyeOff, AlertTriangle, Copy, Ban,
} from 'lucide-react'
import { BANKS } from '../../constants/banks.js'
import { BankBadge } from '../ui/BankBadge.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Status definitions — drives icon, colour, and label
 */
const STATUS_META = {
  pending:           { icon: FileText,     color: 'text-text-hint',      label: 'Ready to analyse' },
  inspecting:        { icon: Loader2,      color: 'text-accent',          label: 'Inspecting…',        spin: true },
  parsing:           { icon: Loader2,      color: 'text-accent',          label: 'Parsing…',           spin: true },
  done:              { icon: CheckCircle2, color: 'text-positive',        label: 'Parsed' },
  password_required: { icon: Lock,         color: 'text-warning',         label: 'Password required' },
  duplicate:         { icon: Copy,         color: 'text-text-hint',       label: 'Duplicate — skipped' },
  unsupported:       { icon: Ban,          color: 'text-negative',        label: 'Unsupported format' },
  error:             { icon: AlertCircle,  color: 'text-negative',        label: 'Could not open' },
}

export function FileCard({ statement, onRemove, onSetBank, onSubmitPassword }) {
  const {
    id, filename, bank, parseStatus, parseProgress, parseError,
    skippedLines, totalLines, transactionCount, months, passwordAttempts = 0,
  } = statement

  const isPasswordState = parseStatus === 'password_required'
  const isWrongPassword = isPasswordState && parseError === 'wrong_password'
  const isLocked = parseStatus === 'parsing' || parseStatus === 'inspecting'

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const passwordRef = useRef(null)

  // Auto-focus password field when it appears
  useEffect(() => {
    if (isPasswordState && passwordRef.current) {
      setTimeout(() => passwordRef.current?.focus(), 80)
    }
  }, [isPasswordState])

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!password.trim()) return
    onSubmitPassword?.(id, password)
    setPassword('')
  }

  const meta = STATUS_META[parseStatus] || STATUS_META.pending
  const Icon = meta.icon

  const statusLabel = () => {
    if (parseStatus === 'error') {
      if (parseError?.includes('scanned')) return 'Scanned image — text not readable'
      if (parseError?.includes('No usable')) return 'No transactions found'
      return parseError || 'Could not open this file'
    }
    if (parseStatus === 'unsupported') return parseError || 'Unsupported format'
    if (isWrongPassword) return `Incorrect password${passwordAttempts > 1 ? ` (${passwordAttempts} attempts)` : ''} — try again`
    return meta.label
  }

  const isExcluded = ['duplicate', 'unsupported', 'error'].includes(parseStatus)
  const canRemove = !isLocked

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className={`bg-bg-secondary border rounded-xl px-4 py-3.5 transition-colors duration-150 ${
        isExcluded
          ? 'border-border-soft opacity-60'
          : isPasswordState
          ? 'border-warning/40 bg-amber-50/40 dark:bg-amber-900/10'
          : parseStatus === 'done'
          ? 'border-positive/25'
          : 'border-border-soft'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon
            className={`${meta.color} ${meta.spin ? 'animate-spin' : ''}`}
            style={{ width: '1.125rem', height: '1.125rem' }}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: filename + remove button */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-text-primary truncate leading-snug" title={filename}>
              {filename}
            </p>
            {canRemove && onRemove && (
              <button
                onClick={() => onRemove(id)}
                className="flex-shrink-0 p-0.5 rounded text-text-hint hover:text-negative hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors mt-0.5"
                aria-label={`Remove ${filename}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status / metadata row */}
          {parseStatus === 'pending' && (
            <div className="flex items-center gap-2 flex-wrap">
              {bank && bank !== 'unknown' ? (
                <>
                  <BankBadge bankId={bank} size="sm" />
                  <span className="text-xs text-text-hint">Bank detected</span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-text-hint">Select bank:</span>
                  {Object.values(BANKS).map(b => (
                    <button
                      key={b.id}
                      onClick={() => onSetBank?.(id, b.id)}
                      className="px-2 py-0.5 text-xs rounded-full border border-border-soft hover:border-accent hover:text-accent transition-colors"
                    >
                      {b.shortLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {parseStatus === 'inspecting' && (
            <p className="text-xs text-text-hint">Checking file…</p>
          )}

          {parseStatus === 'parsing' && (
            <div className="space-y-1.5 mt-1">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Reading transactions…</span>
                <span className="tabular-nums font-medium">{Math.round(parseProgress || 0)}%</span>
              </div>
              <ProgressBar value={parseProgress || 0} max={100} color="#10B981" height={3} animated={false} />
              {transactionCount > 0 && (
                <p className="text-xs text-text-hint">{transactionCount} found so far</p>
              )}
            </div>
          )}

          {parseStatus === 'done' && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <BankBadge bankId={bank} size="sm" />
              {transactionCount > 0 && (
                <span className="text-positive font-medium">{transactionCount} transactions</span>
              )}
              {months?.length > 0 && (
                <span className="text-text-hint">{months.join(', ')}</span>
              )}
              {skippedLines > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="w-3 h-3" />
                  {skippedLines} lines skipped
                </span>
              )}
            </div>
          )}

          {/* PASSWORD REQUIRED — inline entry */}
          <AnimatePresence>
            {isPasswordState && (
              <motion.div
                key="password-entry"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-warning font-medium mt-1 mb-2">
                  {isWrongPassword
                    ? `Incorrect password. ${passwordAttempts > 1 ? `${passwordAttempts} attempts. ` : ''}Try again.`
                    : 'This file is password-protected. Enter the PDF password to continue.'}
                </p>
                <form onSubmit={handlePasswordSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="PDF password"
                      autoComplete="off"
                      aria-label={`Password for ${filename}`}
                      className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-border-medium bg-bg-primary text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-hint hover:text-text-secondary"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!password.trim()}
                    className="flex-shrink-0 px-3 py-2 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Unlock
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / excluded states */}
          {(parseStatus === 'error' || parseStatus === 'unsupported' || parseStatus === 'duplicate') && (
            <p className="text-xs text-text-hint mt-1">{statusLabel()}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

