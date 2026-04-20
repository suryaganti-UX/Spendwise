import React, { useCallback, useRef, useState } from 'react'
import { FileText, Lock, Upload, ChevronRight, AlertCircle, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BANKS } from '../../constants/banks.js'
import { FileQueue } from './FileQueue.jsx'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['application/pdf']

function generateId() {
  return `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Formats a raw file validation error into a user-friendly message
function humanizeError(raw) {
  if (!raw) return null
  if (raw.includes('Only PDF')) return 'Unsupported format — please upload an HDFC, ICICI, SBI or Axis Bank PDF statement.'
  if (raw.includes('too large')) return 'File exceeds 10 MB. Try exporting a shorter date range from your bank portal.'
  return raw
}

export function UploadZone({ statements, onFilesSelected, onRemoveStatement, onSetBankManual, onAnalyze, onLoadDemo, demoLoading = false, onSubmitPassword, onAnalyzeAvailable, onLoadUploadDemo }) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragError, setDragError] = useState(null)
  const fileInputRef = useRef(null)

  const hasFiles = statements && statements.length > 0
  const readyCount = statements?.filter(s => s.parseStatus === 'pending' || s.parseStatus === 'done').length || 0
  const isProcessing = statements?.some(s => s.parseStatus === 'parsing')

  const processFiles = useCallback((files) => {
    setDragError(null)
    const validFiles = []
    const errors = []

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.pdf')) {
        errors.push(`${file.name}: Only PDF files are supported`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File is too large (max 10MB)`)
        continue
      }
      validFiles.push(file)
    }

    if (errors.length > 0) {
      setDragError(errors[0])
    }

    if (validFiles.length > 0) {
      const newStatements = validFiles.map(file => ({
        id: generateId(),
        filename: file.name,
        file,
        bank: 'unknown',
        bankLabel: '',
        bankColor: '#6B6864',
        accountNumber: null,
        dateRange: null,
        months: [],
        transactions: [],
        parseStatus: 'pending',
        parseProgress: 0,
        parseError: null,
        skippedLines: 0,
        totalLines: 0,
        transactionCount: 0,
      }))
      onFilesSelected(newStatements)
    }
  }, [onFilesSelected])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }, [processFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }, [])

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
    // Reset so same file can be re-selected
    e.target.value = ''
  }, [processFiles])

  const banksArray = Object.values(BANKS)

  return (
    <div className="w-full flex flex-col">
      {/* Drop Zone — animated dashed border */}
      <motion.div
        animate={isDragging ? { scale: 1.018 } : { scale: 1 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full cursor-pointer rounded-2xl overflow-hidden"
        style={{
          padding: '2px',
          background: isDragging
            ? 'linear-gradient(135deg, rgba(16,185,129,0.6), rgba(52,211,153,0.4), rgba(16,185,129,0.6))'
            : dragError
              ? 'linear-gradient(135deg, rgba(239,68,68,0.5), rgba(248,113,113,0.3))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !hasFiles && fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Upload bank statement PDF files"
      >
        {/* Animated dashed border SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
          style={{ borderRadius: '14px' }}
        >
          <rect
            x="1" y="1"
            width="calc(100% - 2px)" height="calc(100% - 2px)"
            rx="13" ry="13"
            fill="none"
            stroke={isDragging ? '#10B981' : dragError ? '#EF4444' : 'rgba(255,255,255,0.12)'}
            strokeWidth="1.5"
            strokeDasharray="6 4"
            style={{
              strokeDashoffset: isDragging ? 0 : undefined,
              animation: isDragging ? 'dash-march 0.6s linear infinite' : undefined,
            }}
          />
        </svg>

        <div
          className={`relative rounded-2xl transition-all duration-200 ${hasFiles ? 'py-5 px-6' : 'py-9 px-8'}`}
          style={{
            background: isDragging
              ? 'rgba(16,185,129,0.06)'
              : dragError
                ? 'rgba(239,68,68,0.04)'
                : 'rgba(255,255,255,0.015)',
          }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Animated doc icon stack */}
            <div className="relative mb-4 flex items-center justify-center w-14 h-14">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute transition-all duration-300"
                  style={{
                    transform: isDragging
                      ? `rotate(${(i - 1) * 15}deg) translateX(${(i - 1) * 10}px) translateY(${i === 1 ? -4 : 0}px)`
                      : `rotate(${(i - 1) * 7}deg) translateX(${(i - 1) * 5}px)`,
                  }}
                >
                  <FileText
                    className="w-9 h-9 transition-colors duration-200"
                    style={{
                      color: isDragging
                        ? (i === 1 ? '#10B981' : 'rgba(16,185,129,0.5)')
                        : dragError
                          ? (i === 1 ? '#EF4444' : 'rgba(239,68,68,0.4)')
                          : (i === 1 ? '#10B981' : 'rgba(255,255,255,0.15)'),
                    }}
                  />
                </div>
              ))}
            </div>

            {hasFiles ? (
              <p className="text-sm font-medium text-text-secondary">
                Drop more files or{' '}
                <button
                  className="text-accent underline hover:text-accent-hover transition-colors"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                >
                  browse
                </button>
              </p>
            ) : isDragging ? (
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[15px] font-semibold text-accent"
              >
                Release to upload
              </motion.p>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-text-primary mb-1.5">
                  Drop your bank statement PDFs here
                </p>
                <p className="text-xs text-text-hint mb-3">
                  Multiple files from different banks · PDF only · Max 10 MB
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm text-accent font-medium px-3.5 py-1.5 rounded-lg transition-colors" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Upload className="w-3.5 h-3.5" />
                  Click to browse
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error message — enriched */}
      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex items-start gap-2 px-3.5 py-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-3.5 h-3.5 text-negative flex-shrink-0 mt-0.5" />
              <p className="text-xs text-negative">{humanizeError(dragError)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="sr-only"
        onChange={handleFileInput}
        aria-label="Select PDF bank statement files"
      />

      {/* File queue */}
      {hasFiles && (
        <FileQueue
          statements={statements}
          onRemove={onRemoveStatement}
          onSetBank={onSetBankManual}
          onAddMore={() => fileInputRef.current?.click()}
          onSubmitPassword={onSubmitPassword}
          onAnalyzeAvailable={onAnalyzeAvailable}
        />
      )}

      {/* Action bar */}
      {hasFiles && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-4 w-full flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{readyCount}</span> {readyCount === 1 ? 'file' : 'files'} ready
            {statements.filter(s => s.bank && s.bank !== 'unknown').length > 0 && (
              <span className="ml-2 text-text-hint">
                · {[...new Set(statements.filter(s => s.bank && s.bank !== 'unknown').map(s => BANKS[s.bank]?.shortLabel || s.bank))].join(', ')}
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAnalyze}
            disabled={readyCount === 0}
            className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
          >
            Analyze All
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}

      {/* Demo / secondary paths */}
      {!hasFiles && (
        <>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-[11px] text-text-hint">or try a demo</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <button
            onClick={onLoadDemo}
            disabled={demoLoading}
            className="mt-3 w-full py-2.5 rounded-xl text-accent text-sm font-medium transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            {demoLoading ? 'Loading sample data…' : 'Try with sample data →'}
          </button>

          {onLoadUploadDemo && (
            <button
              onClick={onLoadUploadDemo}
              className="mt-2 w-full py-2 rounded-xl text-text-hint text-xs font-medium transition-all duration-150 hover:text-text-secondary"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Preview password-protected upload flow
            </button>
          )}
        </>
      )}
    </div>
  )
}
