import React from 'react'
import { CheckCircle2, AlertCircle, X, Loader2, FileText } from 'lucide-react'
import { BANKS } from '../../constants/banks.js'
import { BankBadge } from '../ui/BankBadge.jsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'

export function FileCard({ statement, onRemove, onSetBank }) {
  const { id, filename, bank, parseStatus, parseProgress, parseError, skippedLines, totalLines, transactionCount, months } = statement

  const bankMeta = BANKS[bank]

  return (
    <div className="bg-bg-secondary border border-border-soft rounded-xl p-4 flex items-start gap-3 transition-all duration-200">
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {parseStatus === 'done' ? (
          <CheckCircle2 className="w-5 h-5 text-positive" />
        ) : parseStatus === 'error' ? (
          <AlertCircle className="w-5 h-5 text-negative" />
        ) : parseStatus === 'parsing' ? (
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
        ) : (
          <FileText className="w-5 h-5 text-text-hint" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-text-primary truncate">{filename}</span>
          {onRemove && parseStatus !== 'parsing' && (
            <button
              onClick={() => onRemove(id)}
              className="flex-shrink-0 p-0.5 rounded text-text-hint hover:text-negative hover:bg-red-50 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status line */}
        {parseStatus === 'pending' && (
          <div className="flex items-center gap-2">
            {bank && bank !== 'unknown' ? (
              <BankBadge bankId={bank} size="sm" />
            ) : (
              <div className="flex gap-1">
                {Object.values(BANKS).map(b => (
                  <button
                    key={b.id}
                    onClick={() => onSetBank && onSetBank(id, b.id)}
                    className="px-2 py-0.5 text-xs rounded-full border border-border-soft hover:border-accent hover:text-accent transition-colors"
                  >
                    {b.shortLabel}
                  </button>
                ))}
              </div>
            )}
            {bank && bank !== 'unknown' && <span className="text-xs text-text-hint">Detected ✓</span>}
          </div>
        )}

        {parseStatus === 'parsing' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Parsing transactions...</span>
              <span className="tabular-nums">{Math.round(parseProgress)}%</span>
            </div>
            <ProgressBar value={parseProgress} max={100} color="#355CDE" height={3} animated={false} />
            {transactionCount > 0 && (
              <p className="text-xs text-text-hint">Found {transactionCount} transactions so far</p>
            )}
          </div>
        )}

        {parseStatus === 'done' && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <BankBadge bankId={bank} size="sm" />
            {transactionCount > 0 && <span>{transactionCount} transactions</span>}
            {months && months.length > 0 && <span>{months.join(', ')}</span>}
            {skippedLines > 0 && (
              <span className="text-warning">⚠ {skippedLines} lines skipped</span>
            )}
            {totalLines > 0 && skippedLines > 0 && (
              <span className="text-text-hint">
                ({Math.round(((totalLines - skippedLines) / totalLines) * 100)}% parsed)
              </span>
            )}
          </div>
        )}

        {parseStatus === 'error' && (
          <div className="text-xs text-negative mt-1">
            <p>{parseError || 'Failed to parse this file'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
