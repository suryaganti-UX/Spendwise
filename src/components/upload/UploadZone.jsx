import React, { useCallback, useRef, useState } from 'react'
import { FileText, Lock, Upload, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BANKS } from '../../constants/banks.js'
import { FileQueue } from './FileQueue.jsx'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['application/pdf']

function generateId() {
  return `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
      {/* Drop Zone */}
      <motion.div
        animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
        transition={{ duration: 0.15 }}
        className={`w-full cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-200 
          ${isDragging
            ? 'border-accent bg-accent-light'
            : dragError
              ? 'border-negative bg-red-50'
              : hasFiles
                ? 'border-border-medium bg-bg-tertiary'
                : 'border-border-medium bg-bg-secondary hover:border-accent hover:bg-accent-light'
          }
          ${hasFiles ? 'py-5 px-6' : 'py-9 px-8'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !hasFiles && fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Upload bank statement PDF files"
      >
        <div className="flex flex-col items-center text-center">
          {/* Animated doc icons */}
          <div className="relative mb-4 flex items-center justify-center w-14 h-14">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute transition-transform duration-300"
                style={{
                  transform: isDragging
                    ? `rotate(${(i - 1) * 14}deg) translateX(${(i - 1) * 9}px)`
                    : `rotate(${(i - 1) * 7}deg) translateX(${(i - 1) * 5}px)`,
                }}
              >
                <FileText
                  className="w-9 h-9"
                  style={{ color: isDragging ? '#10B981' : i === 1 ? '#10B981' : '#C4BFB9' }}
                />
              </div>
            ))}
          </div>

          {hasFiles ? (
            <p className="text-sm font-medium text-text-secondary">
              Drop more files or{' '}
              <button
                className="text-accent underline"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              >
                browse
              </button>
            </p>
          ) : (
            <>
              <p className="text-[15px] font-semibold text-text-primary mb-1.5">
                Drop your bank statement PDFs here
              </p>
              <p className="text-xs text-text-secondary mb-2">
                Multiple files from different banks · PDF only · Max 10 MB
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm text-accent font-medium px-3 py-1 rounded-lg bg-accent/10">
                or click to browse
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {dragError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs text-negative text-center"
          >
            {dragError}
          </motion.p>
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

      {/* Bank chips + privacy — single compact row */}
      {!hasFiles && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-text-hint">Supported:</span>
          {banksArray.map(bank => (
            <span
              key={bank.id}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
              style={{ backgroundColor: bank.lightColor, color: bank.color, borderColor: bank.color + '30' }}
            >
              {bank.shortLabel}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1 text-[11px] text-text-hint">
            <Lock className="w-3 h-3 text-positive" />
            Nothing uploaded
          </span>
        </div>
      )}

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
          className="mt-4 w-full max-w-xl flex items-center justify-between bg-bg-secondary border border-border-soft rounded-2xl px-4 py-3"
        >
          <div className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{readyCount}</span> {readyCount === 1 ? 'file' : 'files'} ready
            {statements.filter(s => s.bank && s.bank !== 'unknown').length > 0 && (
              <span className="ml-2">
                · {[...new Set(statements.filter(s => s.bank && s.bank !== 'unknown').map(s => BANKS[s.bank]?.shortLabel || s.bank))].join(', ')}
              </span>
            )}
          </div>
          <button
            onClick={onAnalyze}
            disabled={readyCount === 0}
            className="flex items-center gap-2 bg-accent text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze All
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Demo — compact secondary path */}
      {!hasFiles && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-border-soft" />
          <span className="text-[11px] text-text-hint">or</span>
          <div className="flex-1 h-px bg-border-soft" />
        </div>
      )}
      {!hasFiles && (
        <button
          onClick={onLoadDemo}
          disabled={demoLoading}
          className="mt-3 w-full py-2.5 rounded-xl bg-accent-light text-accent text-sm font-medium hover:bg-accent/10 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {demoLoading ? 'Loading sample data…' : 'Try with sample data'}
        </button>
      )}
      {!hasFiles && onLoadUploadDemo && (
        <button
          onClick={onLoadUploadDemo}
          className="mt-2 w-full py-2 rounded-xl border border-border-soft text-text-secondary text-xs font-medium hover:border-warning/60 hover:text-warning transition-all duration-150"
        >
          Preview password-protected upload flow
        </button>
      )}
    </div>
  )
}
